'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s={};s.window=s;vm.createContext(s);
for(const f of ['data/mission_dataset_far.js','data/mission_dataset_fine.js','data/lola_uncertainty.js','mission-console.js'])vm.runInContext(fs.readFileSync('docs/'+f,'utf8'),s);
const E=s.LunarEngine,D=E.assertData(s.LUNAR_DATA);
const q=x=>E.requestFromObject({site:'Site01',start:'2026-12-21T00:00',durationH:6,requiredW:100,delayH:72,area:1.5,efficiency:25,tilt:60,azimuth:90,earthRequired:true,priority:'earliest',...x});
const tests=[
 ['6.25h outside fine range cannot be screened',()=>{const r=E.searchCases(D,q({start:'2026-12-10T00:00',durationH:6.25}));assert.equal(r.evaluationStatus,'insufficient_data');assert.equal(r.scannedCaseCount,2);assert.equal(r.coverage.reason,'DURATION_NOT_ON_COMMON_CADENCE');}],
 ['fine start/end both checked',()=>{assert.equal(E.searchCoverage(D,q({durationH:6.25})).canEvaluate,true);assert.equal(E.evaluateCase(D,q({durationH:6.01}),'Site01',q().startMs).status,'insufficient_data');assert.equal(E.searchCoverage(D,q({start:'2026-12-21T00:01'})).originalAligned,false);}],
 ['crossing fine boundary explicitly selects common hourly cadence',()=>{const c=E.searchCoverage(D,q({start:'2026-12-24T17:45',delayH:12,durationH:6.25}));assert.equal(c.stepMs,3600000);assert.equal(c.canEvaluate,false);assert.equal(c.originalAligned,false);}],
 ['request wholly beyond source range is insufficient',()=>assert.equal(E.searchCases(D,q({start:'2027-01-01T00:00',delayH:0})).evaluationStatus,'insufficient_data')],
 ['no-candidate differs from unevaluable',()=>assert.equal(E.searchCases(D,q({requiredW:10000})).evaluationStatus,'no_candidate')],
 ['candidate start and finish are actual common source timestamps',()=>{const r=E.searchCases(D,q()),c=r.sensitivityCandidate;for(const id of ['Site01','Site04'])for(const t of [c.startUtc,c.finishUtc])assert.ok(s.LUNAR_FINE_DATA.sites[id].rows.some(row=>Date.parse(row[0])===Date.parse(t)));assert.equal(c.startUtc,'2026-12-21T17:45:00.000Z');assert.equal(c.finishUtc,'2026-12-21T23:45:00.000Z');}],
 ['inspection preserves latest start and all hardware requirements',()=>{const a=q(),r=E.searchCases(D,a),c=r.sensitivityCandidate,b=q({start:c.startUtc.slice(0,16),delayH:c.remainingUserDelayH});assert.equal(a.startMs+a.delayMs,b.startMs+b.delayMs);for(const k of ['durationMs','requiredW','area','efficiency','tilt','azimuth','earthRequired'])assert.equal(a[k],b[k]);}],
];
for(const [name,test] of tests){test();console.log('PASS '+name)}
// Predeclared temporal resolution check: same physical model and request,
// actual hourly source versus actual 5-minute source. No interpolation.
// Acceptance: onset difference <= 60min; report differences, not validation.
const fine=E.searchCases(D,q());const backup=s.LUNAR_FINE_DATA;s.LUNAR_FINE_DATA=null;
const hourly=E.searchCases(D,q());s.LUNAR_FINE_DATA=backup;
const delta=(Date.parse(hourly.candidates[0].startUtc)-Date.parse(fine.candidates[0].startUtc))/60000;
assert.ok(delta>=0&&delta<=60);
const temporal={method:'Same request/model; real hourly versus real five-minute records; expected discretization difference 0–60 minutes, declared before comparison',fineStart:fine.candidates[0].startUtc,hourlyStart:hourly.candidates[0].startUtc,differenceMinutes:delta,scope:'Temporal sampling investigation only. No sub-five-minute source records are present; continuous convergence remains unproven.'};
fs.mkdirSync('artifacts/audit',{recursive:true});fs.writeFileSync('artifacts/audit/temporal.json',JSON.stringify(temporal,null,2));
console.log('PASS '+tests.length+' ZENITH engine tests; temporal sampling: '+JSON.stringify(temporal));
function luminance(hex){const rgb=hex.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2]}
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
const contrasts={};for(const [label,a,b] of [['primary text','#F8FBFF','#08172D'],['secondary text','#D8E1E9','#102138'],['amber action text','#08172D','#F6BF57'],['cyan link','#4BD4DF','#102138'],['muted text','#B2C2D2','#102138']]){const ratio=contrast(a,b);assert.ok(ratio>=4.5,label);contrasts[label]=Number(ratio.toFixed(2));}
fs.writeFileSync('artifacts/audit/contrast.json',JSON.stringify(contrasts,null,2));console.log('PASS declared text/background contrast pairs (>=4.5:1): '+JSON.stringify(contrasts));
