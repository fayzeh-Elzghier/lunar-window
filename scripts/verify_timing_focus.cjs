/* Analytical fixtures are test-only, not astronomical evidence. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s={};s.window=s;vm.createContext(s);for(const p of ['data/mission_dataset_far.js','data/mission_dataset_fine.js','data/lola_uncertainty.js','mission-console.js'])vm.runInContext(fs.readFileSync('docs/'+p,'utf8'),s);
const E=s.LunarEngine,D=E.assertData(s.LUNAR_DATA),q=E.requestFromObject({site:'Site01',start:'2026-12-21T00:00',durationH:6,requiredW:100,delayH:72,area:1.5,efficiency:25,tilt:60,azimuth:90,earthRequired:true,priority:'earliest'});
const rows=s.LUNAR_FINE_DATA.sites.Site01.rows,end=q.startMs+q.durationMs;
const missing=rows.filter(r=>Date.parse(r[0])!==end);
assert.equal(E.evaluateCase(D,q,q.site,q.startMs,{rows:missing,stepMs:300000,cadence:'test gap',fineUsed:true}).status,'insufficient_data');
const late=E.evaluateCase(D,q,q.site,q.startMs+q.delayMs+300000);assert.equal(late.remainingUserDelayH,-1/12);assert.equal(late.reasons[0].code,'OUTSIDE_ALLOWED_START');
const limit=E.evaluateCase(D,q,q.site,q.startMs+q.delayMs);assert.equal(limit.remainingUserDelayH,0);assert.ok(!limit.reasons.some(r=>r.code==='OUTSIDE_ALLOWED_START'));assert.ok(Date.parse(limit.finishUtc)>q.startMs+q.delayMs);
const t=q.startMs,fixture=[0,1,2,3].map(i=>[new Date(t+i*300000).toISOString(),0,90,0,90,0,90,0,90,1]),p={...q,tilt:0,requiredW:1};
assert.equal(E.sampleRunMargin(fixture,p,t,t+300000,300000).minutes,null,'no observed failure is unknown');
fixture[1][6]=-1;const bracket=E.sampleRunMargin(fixture,p,t,t+300000,300000);assert.equal(bracket.minutes,0);assert.equal(bracket.lastPassingUtc,fixture[0][0]);assert.equal(bracket.firstFailingUtc,fixture[1][0]);assert.equal(bracket.physicalMarginMinutes,null);
assert.equal(E.sampleRunMargin([],p,t,t+300000,300000).minutes,null);
assert.equal(E.stressCase([],q,{startUtc:q.startUtc,finishUtc:new Date(end).toISOString(),sampleCount:72}).passes,false);
console.log('PASS timing-focused guards: missing finish, negative allowance, exact start deadline with later finish, finish-failure bracket, censored/empty slack, empty sensitivity.');
