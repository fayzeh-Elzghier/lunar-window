/* Regression cases: actual NASA source rows plus deliberate corruptions and
 * analytical panel fixtures. Fixtures are tests, never user-facing astronomy. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s={};s.window=s;vm.createContext(s);
for(const p of ['data/mission_dataset_far.js','data/mission_dataset_fine.js','data/lola_uncertainty.js','mission-console.js'])vm.runInContext(fs.readFileSync('docs/'+p,'utf8'),s);
const E=s.LunarEngine,D=s.LUNAR_DATA;
E.assertData(D);
function req(x={}){return E.requestFromObject({site:'Site01',start:'2026-12-21T00:00',durationH:6,requiredW:100,delayH:72,area:1.5,efficiency:25,tilt:60,azimuth:90,earthRequired:true,priority:'earliest',...x});}
let checks=0;
function check(name,f){f();checks++;console.log('PASS '+name);}
check('Reject normalized invalid calendar dates',()=>assert.throws(()=>req({start:'2026-02-30T00:00'})));
check('Reject missing and malformed fine-source provenance',()=>{const d=JSON.parse(JSON.stringify(s.LUNAR_FINE_DATA));delete d.sites.Site01.meta.earth_sha256;assert.throws(()=>E.validateBundle(d,1441,300000));});
check('Reject a gap in fine data before evaluation',()=>{const d=JSON.parse(JSON.stringify(s.LUNAR_FINE_DATA));d.sites.Site01.rows[10][0]=d.sites.Site01.rows[9][0];assert.throws(()=>E.validateBundle(d,1441,300000));});
check('Reject false advertised coverage',()=>{const d=JSON.parse(JSON.stringify(s.LUNAR_FINE_DATA));d.range_end_utc='2027-01-01T00:00:00Z';assert.throws(()=>E.validateBundle(d,1441,300000));});
check('Reject nonfinite angles and wrong clearance',()=>{for(const value of [NaN,Infinity,999]){const d=JSON.parse(JSON.stringify(s.LUNAR_FINE_DATA));d.sites.Site01.rows[0][1]=value;assert.throws(()=>E.validateBundle(d,1441,300000));}});
check('Analytical perpendicular illumination and back-facing panel',()=>{const r=['2026-12-21T00:00:00Z',0,90,0,0,0,90,0,0,1];const q=req({area:1,efficiency:25,tilt:0});assert.equal(E.referencePower(r,q),1361*.25);r[2]=-90;assert.equal(E.referencePower(r,q),0);});
check('Terrain blocks estimated direct power despite unshadowed reference',()=>{const r=s.LUNAR_FINE_DATA.sites.Site04.rows.find(r=>r[6]<0&&E.referencePower(r,req())>0);assert.ok(r);assert.equal(E.estimatedPower(r,req()),0);});
check('Fine report cites fine raw hashes rather than monthly files',()=>{const r=E.evaluateCase(D,req(),'Site01',req().startMs);assert.equal(r.evidence.sourceHashes.sun,s.LUNAR_FINE_DATA.sites.Site01.meta.sun_sha256);});
check('Same cadence across both sites and whole search',()=>{const r=E.searchCases(D,req({start:'2026-12-24T00:00',delayH:48}));assert.equal(r.comparableCadenceSeconds,3600);assert.ok([...r.candidates,...r.reviewCases].every(x=>x.cadenceSeconds===3600));});
check('Unaligned original start can search subsequent real grid starts',()=>{const r=E.searchCases(D,req({start:'2026-12-21T00:01'}));assert.equal(r.original.status,'insufficient_data');assert.ok(r.candidateCount>0);assert.ok(r.candidates.every(c=>Date.parse(c.startUtc)%300000===0));});
check('Uncertainty review cases never become recommended candidates',()=>{const r=E.searchCases(D,req());assert.ok(r.reviewCount>0&&r.candidateCount>0);assert.ok(r.candidates.every(c=>c.status==='research_candidate'));assert.ok(r.reviewCases.every(c=>c.status==='edge_review'));});
check('Search obeys delay and unchanged hardware; deterministic real case',()=>{const q=req(),r=E.searchCases(D,q);assert.equal(r.original.status,'potential_conflict');assert.equal(r.candidates[0].startUtc,'2026-12-21T12:40:00.000Z');assert.ok(r.candidates.every(c=>c.startDelayH<=72&&c.startDelayH>=0));assert.equal(r.certifiedAlternativeCount,0);});
check('Zero delay cannot relax original start',()=>{const q=req({delayH:0}),r=E.searchCases(D,q);assert.equal(r.scannedCaseCount,2);assert.ok([...r.candidates,...r.reviewCases].every(c=>c.startDelayH===0));});
check('Data cutoff is not a sunset',()=>{const r=D.sites.Site01.rows;const e=E.nextSet(r,r.length-1,6);assert.notEqual(e.status,'bracketed');});
check('Event bracket uses actual adjacent records',()=>{const rows=D.sites.Site01.rows;const i=rows.findIndex((r,j)=>j+1<rows.length&&r[6]>0&&rows[j+1][6]<=0);assert.ok(i>=0);const e=E.nextSet(rows,i,6);assert.equal(e.lastAboveUtc,rows[i][0]);assert.equal(e.firstBelowUtc,rows[i+1][0]);});
check('No horizon coverage gap between source rasters',()=>{for(const site of ['site01','site04']){const m=JSON.parse(fs.readFileSync('data/'+site+'_audit/far_lola_meta.json'));const rows=fs.readFileSync('data/'+site+'_audit/local_horizon.csv','utf8').trim().split(/\r?\n/).slice(1).map(r=>r.split(','));assert.equal(m.near_far_overlap_verified,true);assert.ok(rows.every(r=>Number(r[3])>=m.far_start_m));}});
check('Horizon profile source fingerprint matches its CSV',()=>{const crypto=require('crypto');vm.runInContext(fs.readFileSync('docs/data/horizon_profiles.js','utf8'),s);for(const site of ['Site01','Site04']){const b=fs.readFileSync('data/'+site.toLowerCase()+'_audit/far_lola_horizon.csv');assert.equal(s.LUNAR_HORIZONS.sites[site].bearing_table_sha256,crypto.createHash('sha256').update(b).digest('hex'));}});
check('Sensitivity keeps requirements and exposes a fragile earliest case',()=>{const q=req(),before=JSON.stringify(q),r=E.searchCases(D,q);assert.equal(JSON.stringify(q),before);assert.equal(r.candidates[0].sensitivity.passes,false);assert.equal(r.sensitivityCandidate.startUtc,'2026-12-21T17:45:00.000Z');assert.equal(r.sensitivityPassCount,92);assert.equal(r.severeSensitivityPassCount,0);assert.equal(r.sensitivityCandidate.status,'research_candidate');});
check('Sensitivity includes nominal orientation and does not inflate power',()=>{const q=req(),r=E.searchCases(D,q);for(const c of r.candidates){assert.ok(c.sensitivity.minimumPowerW<=c.minEstimatedPowerW*.9+.001);assert.ok(c.severeSensitivity.minimumPowerW<=c.sensitivity.minimumPowerW+.001);}});
check('No candidates produces no sensitivity recommendation',()=>{const r=E.searchCases(D,req({requiredW:10000}));assert.equal(r.sensitivityCandidate,null);assert.equal(r.sensitivityPassCount,0);});
console.log(checks+' extended regression checks passed');
