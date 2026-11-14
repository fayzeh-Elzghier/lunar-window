#!/usr/bin/env node
/* All scientific rows come from actually acquired NASA Horizons/LOLA files.
 * Only user requirement examples are chosen for algorithm verification.
 * Never assert mission feasibility from an hourly/local horizon screening.
 */
"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=x=>fs.readFileSync(path.join(root,x),"utf8");
const sandbox={};sandbox.window=sandbox;vm.createContext(sandbox);
vm.runInContext(read("docs/data/mission_dataset_month.js"),sandbox,{filename:"mission_dataset_month.js"});
vm.runInContext(read("docs/data/lola_uncertainty.js"),sandbox,{filename:"lola_uncertainty.js"});
vm.runInContext(read("docs/mission-console.js"),sandbox,{filename:"mission-console.js"});
const e=sandbox.LunarEngine;
assert.ok(e);const evidence=e.assertData(sandbox.LUNAR_DATA);
assert.equal(evidence.sites.Site01.rows.length,745);
assert.equal(evidence.sites.Site04.rows.length,745);
const getCsvRows=site=>read("data/"+site.toLowerCase()+"_audit/extended_dec2026.csv").trim().split(/\r?\n/).slice(1).map(s=>s.split(","));
for(const site of ["Site01","Site04"]){
 const csv=getCsvRows(site),rows=evidence.sites[site].rows;
 assert.equal(csv.length,rows.length);
 csv.forEach((record,i)=>{
  assert.equal(record[0],rows[i][0]);
  for(let j=1;j<=4;j++)assert.equal(Number(record[j]),rows[i][j]);
 });
}
function request(extra={}){
 return e.requestFromObject({site:"Site01",start:"2026-12-04T12:00",durationH:"6",requiredW:"100",
    delayH:"72",area:"1.5",efficiency:"25",tilt:"30",azimuth:"90",earthRequired:false,priority:"earliest",...extra});
}
const r=request();
const report=e.searchCases(evidence,r);
assert.ok(report.scannedCaseCount>2);
assert.equal(report.certifiedAlternativeCount,0);
assert.equal(report.windowMarginSeconds,null);
assert.equal(report.original.marginSeconds,null);
assert.ok(report.candidates.every(x=>x.status==="research_candidate"||x.status==="edge_review"));
assert.ok(report.candidates.every(x=>x.marginSeconds===null&&x.physicalWindowEndKnown===false));
const earthReport=e.searchCases(evidence,request({earthRequired:true,site:"Site04",start:"2026-12-01T00:00"}));
assert.ok(earthReport.original.reasons.some(x=>x.code==="EARTH_LOCAL_SCREEN_BELOW_HORIZON"));
assert.ok(earthReport.original.reasons.some(x=>x.code==="SUN_LOCAL_SCREEN_BELOW_HORIZON"));
assert.equal(earthReport.certifiedAlternativeCount,0);
assert.equal(earthReport.windowMarginSeconds,null);
assert.ok(earthReport.candidates.every(x=>x.status!=="mission_pass"));
const near=e.siteStats(evidence,"Site01");
assert.equal(near.sunNear,173);assert.equal(near.sunAbove,427);assert.equal(near.sunBelow,145);
assert.equal(near.earthBelow,474);
const blocked=e.siteStats(evidence,"Site04");
assert.equal(blocked.sunBelow,485);assert.equal(blocked.earthBelow,745);
assert.equal(e.evaluateCase(evidence,r,"Site01",Date.parse("2026-11-30T22:00:00Z")).status,"insufficient_data");
for(const req of [{efficiency:"150"},{durationH:"-6"},{area:"0"},{azimuth:"360"},{requiredW:"0"},{start:"not-a-date"}]){
 assert.throws(()=>request(req));
}
const html=read("docs/mission-console.html"),css=read("docs/mission-console.css"),js=read("docs/mission-console.js");
assert.match(html,/NASA Space Apps/);assert.match(html,/Time Margin/);assert.match(css,/@media/);
assert.ok(html.includes("data/mission_dataset_month.js")&&html.includes("mission-console.js"));
assert.ok(js.includes('scientificConclusion:"NO_VALIDATED_MISSION_PASS_AVAILABLE"'));
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
const deref=new Set([...js.matchAll(/\$\("([A-Za-z0-9_-]+)"\)/g)].map(m=>m[1]));
assert.deepEqual([...deref].filter(x=>!ids.has(x)),[],"all static UI DOM IDs must exist");
console.log("PASS real NASA source parity + 2 sites + operator input validation + multi-case no-certification gates + frontend DOM IDs");
