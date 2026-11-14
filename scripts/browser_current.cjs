'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
let pw;try{pw=require('playwright')}catch(e){pw=require('../artifacts/qa/node_modules/playwright')}
(async()=>{
 const crypto=require('node:crypto');for(const file of ['mission-console.html','mission-console.js','zenith-ui.js','lunar-three.js']){const response=await fetch('http://127.0.0.1:8765/'+file+'?fresh='+Date.now());assert.equal(response.status,200);assert.equal(crypto.createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'),crypto.createHash('sha256').update(fs.readFileSync('docs/'+file)).digest('hex'),'HTTP must serve this workspace: '+file);}
 let ran=0;
 const binaries=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
 for(const executablePath of (process.env.BROWSER_EXECUTABLES?process.env.BROWSER_EXECUTABLES.split('|'):process.env.BROWSER_EXECUTABLE?[process.env.BROWSER_EXECUTABLE]:binaries)){
  if(!fs.existsSync(executablePath)){console.log('NOT RUN '+executablePath);continue;}
  const browser=await pw.chromium.launch({headless:true,executablePath}),page=await browser.newPage({viewport:{width:1366,height:900}}),errors=[];
  ran++;console.log('RUN '+executablePath+' version '+browser.version());
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/mission-console.html');
  assert.equal(await page.locator('#evaluate').isDisabled(),true);assert.equal(await page.locator('#siteSelect').inputValue(),'');
  await page.locator('#loadExample').click();assert.equal(await page.locator('#visualization').isVisible(),false);
  await page.locator('#evaluate').click();await page.waitForFunction(()=>window.ZenithUI.state.report);
  const r=await page.evaluate(()=>window.ZenithUI.state.report);assert.equal(r.candidateCount,153);assert.equal(r.reviewCount,560);assert.equal(r.sensitivityPassCount,92);assert.equal(r.severeSensitivityPassCount,0);
  assert.equal(r.siteSummaries.length,2);assert.deepEqual(r.siteSummaries.map(v=>v.site),['Site01','Site04']);assert.match(await page.locator('#siteOverview').innerText(),/Shackleton/);
  assert.equal(r.sensitivityCandidate.sensitivity.minimumPowerW,100.250);
  const before=await page.locator('#startUtc').inputValue();await page.locator('#caseSelector').selectOption('sensitivity');
  assert.equal(await page.locator('#startUtc').inputValue(),before);assert.match(await page.locator('#currentDate').innerText(),/17:45/);
  await page.waitForFunction(()=>document.querySelector('#lunarScene canvas')||document.querySelector('#threeStatus').textContent.includes('unavailable'));
  assert.equal(await page.locator('#lunarScene canvas').count(),1,'WebGL scene created');
  await page.locator('#playSource').click();await page.waitForFunction(()=>window.ZenithUI.state.sourceIndex>0);await page.locator('#playSource').click();
  assert.equal(await page.locator('#lunarScene canvas').count(),1);
  await page.locator('#sourcesLink').click();const download=page.waitForEvent('download');await page.locator('#exportBtn').click();const json=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));
  assert.equal(json.inspectedCaseResult.startUtc,'2026-12-21T17:45:00.000Z');assert.equal(json.request.startUtc,'2026-12-21T00:00:00.000Z');
  await page.locator('#applyCase').click();await page.waitForFunction(()=>window.ZenithUI.state.report?.request.startUtc==='2026-12-21T17:45:00.000Z');
  assert.equal(Number(await page.locator('#delayH').inputValue()),54.25);
  await page.locator('#requiredPowerW').fill('');assert.equal(await page.locator('#exportBtn').isDisabled(),true);assert.equal(await page.locator('#visualization').isVisible(),false);
  await page.locator('#clearInputs').click();assert.equal(await page.locator('#siteSelect').inputValue(),'');assert.equal(await page.locator('#panelArea').inputValue(),'');
  await page.locator('#loadExample').click();await page.locator('#delayH').fill('0');await page.locator('#evaluate').click();await page.waitForFunction(()=>window.ZenithUI.state.report);assert.equal(await page.evaluate(()=>window.ZenithUI.state.report.scannedCaseCount),2);
  await page.locator('#clearInputs').click();await page.locator('#loadExample').click();await page.locator('#startUtc').fill('2026-12-10T00:00');await page.locator('#durationH').fill('6.25');assert.equal(await page.locator('#evaluate').isDisabled(),true);
  await page.locator('#clearInputs').click();await page.locator('#loadExample').click();await page.locator('#requiredPowerW').fill('10000');await page.locator('#evaluate').click();await page.waitForFunction(()=>window.ZenithUI.state.report);assert.equal(await page.evaluate(()=>window.ZenithUI.state.report.evaluationStatus),'no_candidate');
  await page.locator('#clearInputs').click();await page.locator('#loadExample').click();await page.locator('#delayH').fill('96');await page.locator('#evaluate').click();await page.waitForFunction(()=>window.ZenithUI.state.report);
  const main=await page.evaluate(()=>JSON.stringify(window.ZenithUI.state.mainReport)),inputs=await page.locator('#startUtc').inputValue();
  await page.locator('#sourcesLink').click();await page.locator('#fineSubset').click();assert.equal(await page.evaluate(()=>window.ZenithUI.state.scope),'fine');assert.match(await page.locator('#scopeStatus').innerText(),/Does not cover/);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.ZenithUI.state.mainReport)),main);assert.equal(await page.locator('#startUtc').inputValue(),inputs);assert.equal(await page.evaluate(()=>window.ZenithUI.state.report.comparableCadenceSeconds),300);
  const subsetDownload=page.waitForEvent('download');await page.locator('#exportBtn').click();const subsetJSON=JSON.parse(fs.readFileSync(await (await subsetDownload).path(),'utf8'));assert.equal(subsetJSON.inspectionScope,'fine');assert.equal(subsetJSON.request.delayH,96);assert.ok(subsetJSON.assessedRequest.delayH<96);
  await page.locator('#returnMain').click();assert.equal(await page.evaluate(()=>window.ZenithUI.state.scope),'main');assert.equal(await page.evaluate(()=>JSON.stringify(window.ZenithUI.state.report)),main);
  await page.locator('#fineSubset').click();await page.locator('#requiredPowerW').fill('101');assert.equal(await page.evaluate(()=>window.ZenithUI.state.mainReport),null);assert.equal(await page.evaluate(()=>window.ZenithUI.state.fineReport),null);assert.equal(await page.locator('#exportBtn').isDisabled(),true);
  for(const kind of ['near','below']){
   const sample=await page.evaluate(kind=>['Site01','Site04'].flatMap(site=>window.LUNAR_FINE_DATA.sites[site].rows.slice(0,-12).filter(row=>window.LunarEngine.labelClearance(row[6],site,row[1]).state===kind).slice(0,1).map(row=>({site,time:row[0]})))[0],kind);const time=sample?.time;
   assert.ok(time,'genuine source record for '+kind);await page.locator('#clearInputs').click();await page.locator('#loadExample').click();await page.locator('#siteSelect').selectOption(sample.site);await page.locator('#startUtc').fill(time.slice(0,16));await page.locator('#durationH').fill('1');await page.locator('#delayH').fill('0');await page.locator('#evaluate').click();await page.waitForFunction(kind=>document.querySelector('#lunarScene').dataset.sunState===kind,kind);
   assert.match(await page.locator('#threeStatus').innerText(),kind==='near'?/UNCERTAIN.*withheld/:/BLOCKED/);assert.equal(await page.locator('.object-label.sun').getAttribute('data-visibility'),kind);
  }
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);await browser.close();console.log('PASS '+executablePath+': current empty form, source-derived scenario, WebGL, case inspection, playback, JSON, deadline preservation, stale exports, clear, zero delay, unsupported cadence, no candidate, mobile overflow.');
 }
 assert.ok(ran>0,'NOT RUN: no configured browser is available; this is not an overall pass');
})().catch(e=>{console.error(e);process.exit(1)});
