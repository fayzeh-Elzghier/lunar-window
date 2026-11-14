// Emits active browser calculations for comparison by the separate Python verifier.
const fs=require('node:fs'),vm=require('node:vm');const s={};s.window=s;vm.createContext(s);
for(const p of ['data/mission_dataset_far.js','data/mission_dataset_fine.js','data/lola_uncertainty.js','mission-console.js'])vm.runInContext(fs.readFileSync('docs/'+p,'utf8'),s);
const E=s.LunarEngine,q=E.requestFromObject({site:'Site01',start:'2026-12-21T00:00',durationH:6,requiredW:100,delayH:72,area:1.5,efficiency:25,tilt:60,azimuth:90,earthRequired:true,priority:'earliest'});
const configs=[q,{...q,tilt:0,azimuth:0},{...q,tilt:90,azimuth:359}];
const sites={};for(const id of ['Site01','Site04'])sites[id]=s.LUNAR_FINE_DATA.sites[id].rows.map(row=>({row,power:configs.map(c=>E.estimatedPower(row,c))}));
const result=E.searchCases(s.LUNAR_DATA,q);console.log(JSON.stringify({sites,configs,summary:{count:result.candidateCount,review:result.reviewCount,stress:result.sensitivityPassCount,severe:result.severeSensitivityPassCount,first:result.candidates[0],resilient:result.sensitivityCandidate}}));
