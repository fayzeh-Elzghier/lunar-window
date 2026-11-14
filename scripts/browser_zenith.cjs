#!/usr/bin/env node
/* Redesign acceptance: real source data, clear states, English-only, no synthetic astronomy. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url');
let pw;try{pw=require('playwright')}catch(e){pw=require('../artifacts/qa/node_modules/playwright')}
const out='artifacts/redesign';fs.mkdirSync(out,{recursive:true});
const executable=process.env.BROWSER_EXECUTABLE||(process.platform==='win32'&&fs.existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined);
const wait=page=>page.waitForFunction(()=>window.ZenithUI&&window.ZenithUI.state.phase!=='busy');
const snapshot=page=>page.locator('#planForm').evaluate(f=>[...f.elements].filter(e=>e.id).map(e=>[e.id,e.type==='checkbox'?e.checked:e.value]));
const arabic=/[\u0600-\u06FF]/;
async function verifyLayout(page){
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page overflow');
 const clipped=await page.evaluate(()=>[...document.querySelectorAll('button,label,h1,h2,h3,p,summary,th,td')].filter(e=>e.getClientRects().length&&e.scrollWidth>e.clientWidth+2).map(e=>e.id||e.textContent.slice(0,50)));
 assert.deepEqual(clipped,[],'no clipped labels or text');
 assert.doesNotMatch(await page.locator('body').innerText(),arabic,'active interface must be English only');
}
(async()=>{
 const browser=await pw.chromium.launch({headless:true,...(executable?{executablePath:executable}:{})}),errors=[],failedRequests=[];
 for(const width of [1440,1024,390,320]){
  const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failedRequests.push(r.url()+' '+r.status());});
  await page.goto('http://127.0.0.1:8765/mission-console.html');
  assert.equal(await page.locator('html').getAttribute('lang'),'en');assert.equal(await page.locator('#languageBtn,#delay30,#powerOnly,#earthMode,#overviewBtn,.hero').count(),0);
  assert.equal(await page.locator('#panelAssumptions').getAttribute('open'),null);
  assert.equal(await page.locator('#exportBtn').isDisabled(),true);assert.equal(await page.locator('#visualization').isVisible(),false);
  await page.keyboard.press('Tab');assert.equal(await page.locator('.skip').evaluate(e=>e===document.activeElement),true);
  assert.equal(await page.locator('.skip').evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
  await verifyLayout(page);
  await page.locator('#evaluate').click();await wait(page);
  assert.match(await page.locator('#decisionTitle').innerText(),/49.844 W/);
  assert.match(await page.locator('#decisionLead').innerText(),/0.250 W reserve/);
  assert.equal(await page.locator('.case-card').count(),3);
  const inputs=await snapshot(page),before=await page.evaluate(()=>JSON.stringify(window.ZenithUI.state.report));
  await page.locator('[data-inspect-case=sensitivity]').click();
  assert.deepEqual(await snapshot(page),inputs);assert.equal(await page.evaluate(()=>JSON.stringify(window.ZenithUI.state.report)),before);
  assert.match(await page.locator('#currentDate').innerText(),/17:45/);assert.match(await page.locator('#selectedInterval').innerText(),/23:45/);
  assert.equal(await page.locator('#timeSlider').getAttribute('max'),'71');
  assert.match(await page.locator('#viewCadence').innerText(),/5-minute/);
  const curve=await page.evaluate(()=>{const d=window.ZenithCharts.series(),c=window.ZenithUI.caseFor();return {first:d.rows[0][0],last:d.rows.at(-1)[0],count:d.rows.length,minNominal:Math.min(...d.nominal),minStress:Math.min(...d.sensitivity),expectedNominal:c.minEstimatedPowerW,expectedStress:c.sensitivity.minimumPowerW};});
  assert.equal(curve.first,'2026-12-21T17:45:00Z');assert.equal(curve.last,'2026-12-21T23:40:00Z');assert.equal(curve.count,72);
  assert.ok(Math.abs(curve.minNominal-curve.expectedNominal)<.000501);assert.ok(Math.abs(curve.minStress-curve.expectedStress)<.000501);
  assert.equal(await page.locator('[data-series=sensitivity-envelope]').count(),1);
  assert.equal(await page.locator('[data-operating-interval]').count(),1);
  assert.equal(await page.locator('#powerGraph [data-point=nominal]').getAttribute('data-source-utc'),curve.first);
  const font=await page.locator('#powerGraph text').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));assert.ok(font>=12,'responsive plot text stays readable');
  await page.locator('#powerTab').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('#horizonTab').getAttribute('aria-selected'),'true');assert.equal(await page.locator('#powerView').isVisible(),false);
  assert.equal(await page.locator('#horizonGraph').getAttribute('data-source-utc'),curve.first);
  const epochs=await page.locator('#instantComparison tr').evaluateAll(rows=>rows.map(r=>r.dataset.sourceUtc));
  assert.deepEqual(epochs,[curve.first,curve.first]);
  await page.locator('#timeSlider').focus();await page.keyboard.press('ArrowRight');
  assert.match(await page.locator('#currentDate').innerText(),/17:50/);
  assert.equal(await page.locator('#horizonGraph').getAttribute('data-source-utc'),'2026-12-21T17:50:00Z');
  await verifyLayout(page);await page.screenshot({path:out+'/horizon-'+width+'.png',fullPage:true});
  await page.locator('#powerTab').click();await verifyLayout(page);await page.screenshot({path:out+'/power-'+width+'.png',fullPage:true});
  await page.locator('#sourcesLink').click();assert.equal(await page.locator('#evidencePanel').getAttribute('open'),'');
  await page.locator('#evidencePanel > summary').focus();await page.keyboard.press('Space');assert.equal(await page.locator('#evidencePanel').getAttribute('open'),null);
  await page.keyboard.press('Space');assert.equal(await page.locator('#evidencePanel').getAttribute('open'),'');
  let download=page.waitForEvent('download');await page.locator('#exportBtn').click();const json=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));
  assert.equal(json.request.startUtc,'2026-12-21T00:00:00.000Z');assert.equal(json.inspectedSourceUtc,'2026-12-21T17:50:00Z');assert.equal(json.inspectedCaseResult.finishUtc,'2026-12-21T23:45:00.000Z');
  assert.match(json.inspectedCaseResult.evidence.sourceHashes.sun,/^[a-f0-9]{64}$/);assert.equal(json.certifiedAlternativeCount,0);
  download=page.waitForEvent('download');await page.locator('#exportCsv').click();const csv=fs.readFileSync(await (await download).path(),'utf8').trim().split(/\r?\n/).map(line=>line.split(','));
  assert.equal(csv.length,73);assert.equal(csv[1][0],curve.first);assert.equal(csv.at(-1)[0],curve.last);assert.equal(csv[1][12],'100');assert.equal(csv[1][13],'300');assert.equal(csv[1][16],json.inspectedCaseResult.evidence.sourceHashes.sun);
  const summary=await page.locator('#printSummary').innerText();assert.match(summary,/17:45/);assert.match(summary,/23:45/);assert.match(summary,/0.250 W/);assert.match(summary,/SHA256/);assert.doesNotMatch(summary,arabic);
  // Observe the print command without opening the OS dialog; exercise actual
  // print-media rendering and Chromium PDF output separately below.
  await page.evaluate(()=>{window.__printCalls=0;window.print=()=>{window.__printCalls++;};});
  await page.locator('#printBrief').click();assert.equal(await page.evaluate(()=>window.__printCalls),1);
  await page.emulateMedia({media:'print'});assert.equal(await page.locator('#printSummary').isVisible(),true);assert.equal(await page.locator('#mission').isVisible(),false);
  if(width===1440)await page.pdf({path:out+'/decision-brief.pdf',format:'A4'});
  await page.emulateMedia({media:'screen'});
  await page.locator('#requiredPowerW').fill('101');
  assert.match(await page.locator('#resultStatus').innerText(),/Recalculation/);
  for(const id of ['exportBtn','exportCsv','printBrief'])assert.equal(await page.locator('#'+id).isDisabled(),true);
  assert.equal(await page.locator('#printSummary').innerHTML(),'');assert.equal(await page.locator('#visualization').isVisible(),false);
  await page.locator('#startUtc').fill('2026-12-10T00:00');await page.locator('#durationH').fill('6.25');
  assert.match(await page.locator('#durationError').innerText(),/60-minute/);
  const unsupported=await snapshot(page);await page.locator('#evaluate').click();assert.deepEqual(await snapshot(page),unsupported);
  assert.match(await page.locator('#decisionTitle').innerText(),/cannot evaluate/);assert.equal(await page.evaluate(()=>window.ZenithUI.state.report),null);
  await page.locator('#durationH').fill('6');await page.locator('#requiredPowerW').fill('10000');await page.locator('#evaluate').click();await wait(page);
  assert.equal(await page.evaluate(()=>window.ZenithUI.state.phase),'no_candidate');assert.match(await page.locator('#decisionLead').innerText(),/No nominal candidate/);assert.match(await page.locator('#viewCadence').innerText(),/60-minute/);
  await page.locator('#startUtc').fill('');await page.locator('#evaluate').click();assert.equal(await page.evaluate(()=>window.ZenithUI.state.phase),'invalid');assert.equal(await page.locator('#startUtc').getAttribute('aria-invalid'),'true');
  await page.locator('#loadDemo').click();await wait(page);
  if(width===1440){await page.locator('#durationH').fill('6.25');await page.locator('#evaluate').click();await wait(page);assert.equal(await page.evaluate(()=>window.ZenithUI.state.report.original.sampleCount),75);assert.equal(await page.locator('#durationH').inputValue(),'6.25');}
  await page.locator('#panelAssumptions > summary').click();await page.locator('#panelArea').fill('0');await page.locator('#panelAssumptions > summary').click();await page.locator('#evaluate').click();
  assert.equal(await page.locator('#panelAssumptions').getAttribute('open'),'');assert.equal(await page.locator('#panelArea').getAttribute('aria-invalid'),'true');
  await verifyLayout(page);await page.close();
 }
 const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/mission-console.html');
 await page.locator('#startUtc').fill('2026-12-24T17:45');await page.locator('#delayH').fill('12');
 assert.match(await page.locator('#startError').innerText(),/60-minute/);await page.locator('#evaluate').click();assert.equal(await page.evaluate(()=>window.ZenithUI.state.report),null);
 await page.locator('#startUtc').fill('2026-12-31T18:00');await page.locator('#delayH').fill('24');await page.locator('#evaluate').click();await wait(page);
 assert.equal(await page.locator('#delayH').inputValue(),'24');assert.match(await page.locator('#coverageHint').innerText(),/permitted delay is unchanged/);
 assert.ok(await page.evaluate(()=>window.ZenithUI.state.report.insufficientDataCount>0));
 await page.goto('http://127.0.0.1:8765/judges-slides.html');await page.waitForFunction(()=>!!window.ZenithPresentation);
 for(let i=1;i<=7;i++){assert.equal(await page.locator('#count').innerText(),i+' / 7');await verifyLayout(page);if(i<7)await page.locator('#next').click();}
 assert.equal(await page.locator('#next').isDisabled(),true);await page.keyboard.press('PageUp');assert.equal(await page.locator('#count').innerText(),'6 / 7');
 await page.screenshot({path:out+'/presentation-mobile.png',fullPage:true});
 await page.goto(pathToFileURL(path.resolve('docs/index.html')).href);await page.waitForURL(/mission-console.html/);
 await page.locator('#evaluate').click();await wait(page);assert.equal(await page.evaluate(()=>window.ZenithUI.state.report.candidateCount),153);
 await page.goto('http://127.0.0.1:8765/');await page.waitForURL(/mission-console.html/);
 // Deliberately remove evidence in this test page. The application must fail closed.
 const missing=await browser.newPage();missing.on('pageerror',e=>errors.push(e.message));
 await missing.route('**/data/mission_dataset_far.js',route=>route.fulfill({contentType:'text/javascript',body:'/* deliberately absent evidence in acceptance test */'}));
 await missing.goto('http://127.0.0.1:8765/mission-console.html');assert.equal(await missing.locator('#evaluate').isDisabled(),true);assert.match(await missing.locator('#decisionTitle').innerText(),/Source evidence/);
 await missing.close();
 const invalid=await browser.newPage();invalid.on('pageerror',e=>errors.push(e.message));
 const corrupt=JSON.parse(fs.readFileSync('docs/data/mission_dataset_fine.json','utf8'));corrupt.sites.Site01.meta.sun_sha256='invalid';
 await invalid.route('**/data/mission_dataset_fine.js',route=>route.fulfill({contentType:'text/javascript',body:'window.LUNAR_FINE_DATA='+JSON.stringify(corrupt)+';'}));
 await invalid.goto('http://127.0.0.1:8765/mission-console.html');assert.equal(await invalid.locator('#evaluate').isDisabled(),true);assert.match(await invalid.locator('#decisionTitle').innerText(),/Source evidence/);await invalid.close();
 const coarse=await browser.newPage();coarse.on('pageerror',e=>errors.push(e.message));
 await coarse.route('**/data/mission_dataset_fine.js',route=>route.fulfill({contentType:'text/javascript',body:'/* fine source deliberately unavailable in this test */'}));
 await coarse.goto('http://127.0.0.1:8765/mission-console.html');assert.match(await coarse.locator('#sourceCoverage').innerText(),/only hourly/);
 await coarse.locator('#evaluate').click();await wait(coarse);assert.equal(await coarse.evaluate(()=>window.ZenithUI.state.report.comparableCadenceSeconds),3600);await coarse.close();
 await page.close();await browser.close();assert.deepEqual(errors,[]);assert.deepEqual(failedRequests,[]);
 console.log('PASS English-only redesign at 1440/1024/390/320px: source-time charts, 9-orientation envelope, preserved inspection context, field errors, no-candidate and insufficient states, stale exports, JSON/CSV/print, keyboard tabs/focus, seven slides, offline and missing-evidence guard; no overflow, clipped text, failed assets or browser exceptions.');
})().catch(e=>{console.error(e);process.exit(1)});
