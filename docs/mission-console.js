/* Lunar Window — Explainable NASA-derived research screening.
 * No synthetic ephemerides. The only astronomical input is window.LUNAR_DATA
 * (original 745 JPL UTC samples per site and provisional LOLA local clearance).
 * No full visibility, certified power, continuous windows or physical margin.
 */
(function(global){
"use strict";
const SITES=["Site01","Site04"];
const R= Math.PI/180;
const EDGE=0.25; // review floor, NOT a quantified scientific uncertainty bound
const REFERENCE_IRRADIANCE=1361; // W/m² at 1 AU; NOT actual lunar epoch irradiance
const DOCS="https://github.com/fayzeh-Elzghier/lunar-window/blob/main/data/";
function assertData(data){
 if(!global.LOLA_RMS||global.LOLA_RMS.schema!=="nasa-lola-local-angular-rms-v1")throw Error("NASA LOLA error model not loaded");
 if(!data||data.schema!=="lunar-window-evidence-v4"||!data.sites)throw Error("NASA evidence bundle missing or wrong schema");
 for(const site of SITES){
  const s=data.sites[site];if(!s||!Array.isArray(s.rows)||s.rows.length!==745||!s.meta?.sun_sha256||!s.meta?.terrain_sha256)throw Error("Incomplete NASA provenance: "+site);
  let prev=null;
  for(const row of s.rows){
   if(row.length!==10||typeof row[0]!=="string"||!row[0].endsWith("Z"))throw Error("Invalid NASA epoch");
   const t=Date.parse(row[0]);if(!Number.isFinite(t)||(prev!==null&&t-prev!==3600000))throw Error("Non-hourly NASA UTC sequence: "+site);
   prev=t;if(row.slice(1).some(v=>typeof v!=="number"||!Number.isFinite(v)))throw Error("Non-numeric source angle");
   if(Math.abs((row[2]-row[5])-row[6])>0.00001||Math.abs((row[4]-row[7])-row[8])>0.00001)throw Error("LOLA/Horizons calculation mismatch");
   if(!(row[9]>.9&&row[9]<1.1))throw Error("NASA solar AU distance missing");
  }
 }
 validateBundle(data,745,3600000);
 if(global.LUNAR_FINE_DATA) validateBundle(global.LUNAR_FINE_DATA,1441,300000);
 for(const site of SITES){
  const rms=global.LOLA_RMS.sites?.[site]?.rms;
  if(!Array.isArray(rms)||rms.length!==360||rms.some(v=>!Number.isFinite(v)||v<0))throw Error("Invalid LOLA RMS evidence: "+site);
 }
 return data;
}
function validateBundle(data,count,step){
 if(!data||data.cadence_seconds*1000!==step)throw Error("Invalid source cadence");
 if(step===300000&&data.schema!=="lunar-window-real-five-minute-v1")throw Error("Invalid fine source schema");
 for(const site of SITES){
  const s=data.sites?.[site];
  if(!s||!Array.isArray(s.rows)||s.rows.length!==count)throw Error("Incomplete source: "+site);
  for(const key of ["sun_sha256","earth_sha256"])
   if(!/^[a-f0-9]{64}$/.test(s.meta?.[key]||""))throw Error("Missing source hash: "+site+" "+key);
  s.rows.forEach((r,i)=>{
   if(r.length!==10||typeof r[0]!=="string"||!r[0].endsWith("Z")||!Number.isFinite(Date.parse(r[0])))throw Error("Invalid source epoch");
   if(i&&Date.parse(r[0])-Date.parse(s.rows[i-1][0])!==step)throw Error("Source time gap: "+site);
   if(r.slice(1).some(v=>typeof v!=="number"||!Number.isFinite(v)))throw Error("Invalid source number");
   if(r[1]<0||r[1]>=360||r[3]<0||r[3]>=360||Math.abs(r[2])>90||Math.abs(r[4])>90)throw Error("Invalid source angle");
   if(!(r[9]>.9&&r[9]<1.1)||Math.abs(r[2]-r[5]-r[6])>1e-5||Math.abs(r[4]-r[7]-r[8])>1e-5)throw Error("Invalid source geometry");
  });
  if(s.rows[0][0]!==data.range_start_utc||s.rows.at(-1)[0]!==data.range_end_utc)throw Error("Declared source range mismatch");
 }
 return data;
}
function number(x,label,min,max,strict=false){const n=Number(x);if(x===""||!Number.isFinite(n)||(strict?n<=min:n<min)||(max!==undefined&&n>max))throw Error(label+" must be "+(strict?"greater than ":"at least ")+min+(max!==undefined?" and no more than "+max:""));return n;}
function requestFromObject(a){
 if(!SITES.includes(a.site))throw Error("Choose an available NASA site");
 if(typeof a.start!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$/.test(a.start))throw Error("Use a complete UTC date and time");
 const start=Date.parse(a.start+":00Z");if(!Number.isFinite(start)||new Date(start).toISOString().slice(0,16)!==a.start)throw Error("Invalid start time");
 const durationH=number(a.durationH,"Operation duration (hours)",0,744,true);
 const requiredW=number(a.requiredW,"Power demand",0,undefined,true);
 const delayH=number(a.delayH,"Allowed delay",0,744);
 const area=number(a.area,"Panel area",0,undefined,true);
 const efficiency=number(a.efficiency,"Panel efficiency",0,100,true)/100;
 const tilt=number(a.tilt,"Panel tilt",0,90);
 const azimuth=number(a.azimuth,"Panel azimuth",0,359.999999);
 if(typeof a.earthRequired!=="boolean")throw Error("Earth visibility requirement must be checked/unchecked");
 if(!["earliest","keep","clearance"].includes(a.priority))throw Error("Select a valid priority");
 return {site:a.site,startMs:start,startUtc:new Date(start).toISOString(),durationMs:durationH*3600000,durationH,requiredW,delayMs:delayH*3600000,delayH,area,efficiency,tilt,azimuth,earthRequired:a.earthRequired,priority:a.priority};
}
function referencePower(row,req){
 const sunAz=row[1]*R,sunEl=row[2]*R,panelTilt=req.tilt*R,panelAz=req.azimuth*R;
 const dot=Math.cos(panelTilt)*Math.sin(sunEl)+Math.sin(panelTilt)*Math.cos(sunEl)*Math.cos(sunAz-panelAz);
 return REFERENCE_IRRADIANCE/(row[9]*row[9])*req.area*req.efficiency*Math.max(0,Math.min(1,dot));
}
function estimatedPower(row,req){return row[6]>0?referencePower(row,req):0;}
function nextSet(rows,index,clearanceIndex){
 if(rows[index][clearanceIndex]<=0)return {status:"already_below",minutes:null};
 for(let i=index+1;i<rows.length;i++)if(rows[i][clearanceIndex]<=0)
  return {status:"bracketed",lastAboveUtc:rows[i-1][0],firstBelowUtc:rows[i][0],
   minMinutes:(Date.parse(rows[i-1][0])-Date.parse(rows[index][0]))/60000,
   maxMinutes:(Date.parse(rows[i][0])-Date.parse(rows[index][0]))/60000};
 return {status:"beyond_coverage",minutes:null,coverageEndUtc:rows.at(-1)[0]};
}
function localRms(site,az){
 const source=global.LOLA_RMS;
 if(!source||source.schema!=="nasa-lola-local-angular-rms-v1"||!source.sites?.[site]||source.sites[site].rms.length!==360)
   throw Error("NASA/LOLA height-error evidence missing");
 const values=source.sites[site].rms;
 const x=Math.floor(az),factor=az-x;
 const sigma=values[x]*(1-factor)+values[(x+1)%360]*factor;
 if(!Number.isFinite(sigma)||sigma<0)throw Error("NASA LOLA RMS value invalid");
 return sigma;
}
function reviewBand(site,az){
 // 3× propagated local RMS is a cautious review trigger, NOT a formal 3-sigma bound.
 return Math.max(EDGE,3*localRms(site,az));
}
function labelClearance(clearance,site,az){
 if(Math.abs(clearance)<=reviewBand(site,az))return {state:"near",text:"Near sampled terrain edge / NASA local RMS review — unverified"};
 if(clearance<0)return {state:"below",text:"Potential NASA-sampled terrain obstruction (near or far)"};
 return {state:"above",text:"Above sampled near+far skyline; beyond 300km UNKNOWN"};
}
function siteStats(data,site){
 const rows=data.sites[site].rows;
 const count=(ix,azIdx,mode)=>rows.filter(r=>{
    const delta=r[ix],band=reviewBand(site,r[azIdx]);
    return mode==="below"?delta<-band:mode==="near"?Math.abs(delta)<=band:delta>band;
 }).length;
 return {count:rows.length,
  sunBelow:count(6,1,"below"),sunNear:count(6,1,"near"),sunAbove:count(6,1,"above"),
  earthBelow:count(8,3,"below"),earthNear:count(8,3,"near"),earthAbove:count(8,3,"above")};
}
function chooseEvidence(data,site,startMs,endMs){
 const fine=global.LUNAR_FINE_DATA;
 const fineAvailable=fine&&fine.schema==="lunar-window-real-five-minute-v1"&&fine.cadence_seconds===300&&
  SITES.every(x=>fine.sites?.[x]?.rows?.length===1441);
 const useFine=fineAvailable&&startMs>=Date.parse(fine.range_start_utc)&&endMs<=Date.parse(fine.range_end_utc);
 return {rows:useFine?fine.sites[site].rows:data.sites[site]?.rows,
   stepMs:useFine?300000:3600000,cadence:useFine?"original NASA 5-minute":"original NASA hourly",
   fineUsed:!!useFine};
}
function referenceSamplePass(row,req){
 // A potential pass in a *screening model*, never physical confirmation.
 // The Sun and Earth must be above the NASA-LOLA *sampled* skyline.
 return row[6]>0&&(!req.earthRequired||row[8]>0)&&referencePower(row,req)+1e-9>=req.requiredW;
}
function sampleRunMargin(rows,req,startMs,endMs,stepMs){
 if(!rows?.length)return {minutes:null,status:"NO_SOURCE_RECORDS"};
 // Strictly count time between ACTUAL JPL sample timestamps; never interpolate.
 // A natural end is considered observed for this *model* only if another
 // authentic sample explicitly fails the sampled reference constraints.
 // Data truncation, source gaps, or no witnessed failure -> UNKNOWN.
 const origin=Date.parse(rows[0][0]);
 const startIdx=(startMs-origin)/stepMs;
 const endIdx=(endMs-origin)/stepMs;
 if(!Number.isInteger(startIdx)||!Number.isInteger(endIdx)||startIdx<0||endIdx>=rows.length)
   return {minutes:null,status:"NOT_OBSERVABLE_IN_SOURCE"};
 for(let j=startIdx;j<endIdx;j++)
   if(Date.parse(rows[j][0])!==origin+j*stepMs||!referenceSamplePass(rows[j],req))
     return {minutes:null,status:"REQUESTED_SAMPLES_NOT_ALL_PASSING"};
 for(let j=endIdx;j<rows.length;j++){
   if(Date.parse(rows[j][0])!==origin+j*stepMs)
     return {minutes:null,status:"SOURCE_GAP"};
   if(!referenceSamplePass(rows[j],req)){
     const lastPass=Date.parse(rows[j-1][0]);
     return {
       minutes:Math.max(0,Math.round((lastPass-endMs)/60000)),
       status:"OBSERVED_SAMPLED_REFERENCE_END__NOT_PHYSICAL_WINDOW",
       lastPassingUtc:rows[j-1][0],
       firstFailingUtc:rows[j][0],
       cadenceMinutes:stepMs/60000,
       physicalMarginMinutes:null
     };
   }
 }
 return {minutes:null,status:"RIGHT_CENSORED_BY_NASA_DATA_RANGE",coverageEndUtc:rows.at(-1)[0]};
}
function evaluateCase(data,req,site,startMs,forcedEvidence=null){
 const endMs=startMs+req.durationMs;
 const evidence=forcedEvidence||chooseEvidence(data,site,startMs,endMs),rows=evidence.rows;
 const out={site,cadence:evidence.cadence,cadenceSeconds:evidence.stepMs/1000,fineUsed:evidence.fineUsed,startUtc:new Date(startMs).toISOString(),finishUtc:new Date(startMs+req.durationMs).toISOString(),
   startDelayH:(startMs-req.startMs)/3600000,remainingUserDelayH:(req.delayMs-(startMs-req.startMs))/3600000,latestPermittedStartUtc:new Date(req.startMs+req.delayMs).toISOString(),status:"insufficient_data",evidence:[],
   reasons:[],sampleCount:0,marginSeconds:null,physicalWindowEndKnown:false,
   sampledMarginMinutes:null,sampledMarginStatus:"NOT_COMPUTED",sampledModelWindow:null,
   validation:"PROVISIONAL_LOCAL_SCREEN_ONLY"};
 if(startMs<req.startMs||startMs>req.startMs+req.delayMs){out.reasons.push({code:"OUTSIDE_ALLOWED_START",times:[],explanation:"Case start exceeds the allowed start interval; this is not a finish deadline."});return out;}
 if(!rows?.length){out.reasons.push({code:"NO_NASA_SOURCE",times:[]});return out}
 const min=Date.parse(rows[0][0]),max=Date.parse(rows.at(-1)[0]);
 if(startMs<min||endMs>max){out.reasons.push({code:"OUTSIDE_NASA_COVERAGE",times:[]});return out}
 const alignStart=(startMs-min)%evidence.stepMs===0,alignEnd=(endMs-min)%evidence.stepMs===0;
 if(!alignStart||!alignEnd){
  out.reasons.push({code:"UNSAMPLED_BOUNDARY",times:[],
   explanation:"Requested start or end lies between original NASA sample epochs; no interpolated timestamps added."});
  return out;
 }
 const relevant=rows.filter(r=>{const t=Date.parse(r[0]);return t>=startMs&&t<endMs});
 if(!relevant.length){out.reasons.push({code:"NO_SAMPLED_EPOCH",times:[]});return out}
 const expectedCount=Math.round((endMs-startMs)/evidence.stepMs);
 if(relevant.length!==expectedCount||relevant.some((r,i)=>Date.parse(r[0])!==startMs+i*evidence.stepMs)||!rows.some(r=>Date.parse(r[0])===endMs)){
  out.reasons.push({code:"SAMPLE_TIME_GAP",times:[],explanation:"Missing NASA timestamp inside interval"});
  return out;
 }
 out.sampleCount=relevant.length;
 const causes={
   "SUN_LOCAL_SCREEN_BELOW_HORIZON":[],
   "EARTH_LOCAL_SCREEN_BELOW_HORIZON":[],
   "PANEL_UNSHADOWED_REFERENCE_BELOW_REQUEST":[],
   "SUN_NEAR_UNCERTAIN_LOCAL_EDGE":[],
   "EARTH_NEAR_UNCERTAIN_LOCAL_EDGE":[]
 };
 let minPower=Infinity,minEstimated=Infinity,minSun=Infinity,minEarth=Infinity;
 for(const r of relevant){
  const watts=referencePower(r,req);
  minEstimated=Math.min(minEstimated,estimatedPower(r,req));
  minPower=Math.min(minPower,watts);minSun=Math.min(minSun,r[6]);minEarth=Math.min(minEarth,r[8]);
  const sunBand=reviewBand(site,r[1]),earthBand=reviewBand(site,r[3]);
  if(r[6]<-sunBand)causes.SUN_LOCAL_SCREEN_BELOW_HORIZON.push(r[0]);
  else if(Math.abs(r[6])<=sunBand)causes.SUN_NEAR_UNCERTAIN_LOCAL_EDGE.push(r[0]);
  if(req.earthRequired&&r[8]<-earthBand)causes.EARTH_LOCAL_SCREEN_BELOW_HORIZON.push(r[0]);
  else if(req.earthRequired&&Math.abs(r[8])<=earthBand)causes.EARTH_NEAR_UNCERTAIN_LOCAL_EDGE.push(r[0]);
  if(watts+1e-9<req.requiredW)causes.PANEL_UNSHADOWED_REFERENCE_BELOW_REQUEST.push(r[0]);
 }
 out.minReferencePowerW=Number(minPower.toFixed(3));
 out.minEstimatedPowerW=Number(minEstimated.toFixed(3));
 out.minSunLocalClearanceDeg=Number(minSun.toFixed(4));
 out.minEarthLocalClearanceDeg=Number(minEarth.toFixed(4));
 out.reasons=Object.entries(causes).filter(([k,t])=>t.length).map(([code,times])=>({code,times,sampleCount:times.length,firstUtc:times[0],lastUtc:times.at(-1)}));
 const hasConflict=causes.SUN_LOCAL_SCREEN_BELOW_HORIZON.length>0 ||
  causes.EARTH_LOCAL_SCREEN_BELOW_HORIZON.length>0 ||causes.PANEL_UNSHADOWED_REFERENCE_BELOW_REQUEST.length>0;
 const isEdge=causes.SUN_NEAR_UNCERTAIN_LOCAL_EDGE.length>0 || causes.EARTH_NEAR_UNCERTAIN_LOCAL_EDGE.length>0;
 out.status=hasConflict?"potential_conflict":isEdge?"edge_review":"research_candidate";
 // One transparent, useful number from REAL JPL samples, clearly NOT a
 // physical Sun/Earth communication or electrical power safety guarantee.
 if(!hasConflict){
   const screening=sampleRunMargin(rows,req,startMs,endMs,evidence.stepMs);
   out.sampledMarginMinutes=screening.minutes;
   out.sampledMarginStatus=screening.status;
   out.sampledModelWindow=screening;
 }else{
   out.sampledMarginStatus="INITIAL_SCREEN_CONSTRAINTS_NOT_MET";
 }
 const source=evidence.fineUsed?global.LUNAR_FINE_DATA.sites[site]:data.sites[site];
 out.evidence={cadence:evidence.cadence,fineUsed:evidence.fineUsed,
  sampledUtc:relevant.map(x=>x[0]),limitations:["Local RMS review threshold is not a far-field confidence bound",evidence.cadence+" samples, not continuous measurements","5m+80m terrain to about 300km; farther terrain unknown","documented ME coordinate convention; independent site datum check pending","ideal fixed-panel estimate excludes electrical losses, eclipses and partial solar disc","Earth-center visibility is not a station-specific RF contact"],sourceUrls:{sun:source.meta.sun_source_url,earth:source.meta.earth_source_url},sourceHashes:{
    sun:source.meta.sun_sha256,earth:source.meta.earth_sha256,lola:source.meta.terrain_sha256||source.meta.lola_raster_sha256
  }};
 return out;
}
// Explicit sensitivity exercise, not a probability distribution or flight margin.
// Test nominal and declared mounting offsets with 10% lower output.
function stressCase(rows,req,c,offset=1){
 const relevant=rows.filter(r=>Date.parse(r[0])>=Date.parse(c.startUtc)&&Date.parse(r[0])<Date.parse(c.finishUtc));
 if(!relevant.length||relevant.length!==c.sampleCount)return {minimumPowerW:null,passes:false,scope:"Insufficient source samples for sensitivity evaluation"};
 let minimum=Infinity;
 for(const dt of [-offset,0,offset])for(const da of [-offset,0,offset]){
  const q={...req,tilt:Math.max(0,Math.min(90,req.tilt+dt)),azimuth:(req.azimuth+da+360)%360};
  for(const r of relevant)minimum=Math.min(minimum,estimatedPower(r,q)*0.9);
 }
 return {minimumPowerW:Number(minimum.toFixed(3)),passes:minimum+1e-9>=req.requiredW,
   outputFactor:0.9,tiltOffsetsDeg:[-offset,0,offset],azimuthOffsetsDeg:[-offset,0,offset],
   scope:"Nine sampled orientation combinations and 10% lower output; not all uncertainties or a confidence bound"};
}
function searchCoverage(data,req){
 const fine=global.LUNAR_FINE_DATA;
 const useFine=!!(fine&&SITES.every(s=>fine.sites?.[s]?.rows?.length===1441)&&
  req.startMs>=Date.parse(fine.range_start_utc)&&req.startMs+req.delayMs+req.durationMs<=Date.parse(fine.range_end_utc));
 const bundle=useFine?fine:data,stepMs=useFine?300000:3600000;
 const origin=Date.parse(bundle.range_start_utc),end=Date.parse(bundle.range_end_utc);
 const durationAligned=req.durationMs%stepMs===0;
 const first=origin+Math.ceil((Math.max(origin,req.startMs)-origin)/stepMs)*stepMs;
 const last=Math.min(req.startMs+req.delayMs,end-req.durationMs);
 return {bundle,stepMs,useFine,canEvaluate:durationAligned&&first<=last,
  originalAligned:(req.startMs-origin)%stepMs===0&&(req.startMs+req.durationMs-origin)%stepMs===0,
  coverageStartUtc:bundle.range_start_utc,coverageEndUtc:bundle.range_end_utc,
  reason:!durationAligned?'DURATION_NOT_ON_COMMON_CADENCE':first>last?'NO_COMPLETE_SOURCE_INTERVAL':null};
}
function searchCases(data,req){
 const cases=[],last=req.delayMs;
 // Prefer original NASA 5-minute cadence only where BOTH sites and the whole
 // candidate search horizon have identical fine-source coverage.
 const coverage=searchCoverage(data,req),fineSearch=coverage.useFine;
 const step=coverage.stepMs,delays=[0];
 const selected=coverage.bundle,origin=Date.parse(selected.range_start_utc);
 for(let start=origin+Math.ceil((req.startMs-origin)/step)*step;coverage.canEvaluate&&start<=req.startMs+last;start+=step)
  if(start>req.startMs)delays.push(start-req.startMs);
 if(coverage.canEvaluate&&last>0&&delays.at(-1)!==last)delays.push(last);
 for(const site of [req.site,...SITES.filter(x=>x!==req.site)])
  for(const delta of delays)cases.push(evaluateCase(data,req,site,req.startMs+delta,{rows:selected.sites[site].rows,stepMs:step,cadence:fineSearch?"original NASA 5-minute":"original NASA hourly",fineUsed:fineSearch}));
 const original=cases.find(c=>c.site===req.site&&c.startDelayH===0);
 if(original.sampleCount){original.sensitivity=stressCase(selected.sites[original.site].rows,req,original);original.severeSensitivity=stressCase(selected.sites[original.site].rows,req,original,5);}
 const candidates=cases.filter(c=>c.status==="research_candidate");
 const reviewCases=cases.filter(c=>c.status==="edge_review");
 const sort=(a,b)=>{
  if(req.priority==="keep")return (a.site!==req.site)-(b.site!==req.site)||a.startDelayH-b.startDelayH;
  if(req.priority==="clearance")return (b.minSunLocalClearanceDeg??-Infinity)-(a.minSunLocalClearanceDeg??-Infinity)||a.startDelayH-b.startDelayH;
  return a.startDelayH-b.startDelayH||(a.site!==req.site)-(b.site!==req.site);
 };
 for(const c of candidates){c.sensitivity=stressCase(selected.sites[c.site].rows,req,c);c.severeSensitivity=stressCase(selected.sites[c.site].rows,req,c,5);}
 candidates.sort(sort);
 reviewCases.sort(sort);
 return {
  kind:"RESEARCH_SCREEN_NOT_MISSION_CERTIFICATION",request:req,
  siteSummaries:SITES.map(site=>{const eligible=candidates.filter(c=>c.site===site).sort((a,b)=>a.startDelayH-b.startDelayH);return {site,earliestNominal:eligible[0]||null,earliestSensitivity:eligible.find(c=>c.sensitivity.passes)||null,assessedCount:cases.filter(c=>c.site===site&&c.status!=='insufficient_data').length,insufficientCount:cases.filter(c=>c.site===site&&c.status==='insufficient_data').length};}),
  latestPermittedStartUtc:new Date(req.startMs+req.delayMs).toISOString(),
  timingDefinitions:{startDelay:"case start minus evaluated request start",remainingAllowedDelay:"latest permitted start minus case start; negative values are invalid",latestPermittedStart:"evaluated request start plus allowed start delay, not a finish deadline",operationInterval:"[start, finish); finish must exist as a source timestamp but is excluded from operation minima",sampleBasedTimeSlack:"nominal positive Sun/Earth clearance and power at source points, weaker than candidate terrain-edge review qualification; not continuity",physicalOperatingMargin:"Continuous operating margin not established."},
  evaluationStatus:!coverage.canEvaluate?'insufficient_data':candidates.length?'candidates_found':'no_candidate',
  coverage:{...coverage,bundle:undefined},
  scannedCaseCount:cases.length,searchResolutionMinutes:step/60000,original,candidates:candidates.slice(0,5),
  candidateCount:candidates.length,
  sensitivityCandidate:candidates.find(c=>c.sensitivity.passes)||null,
  sensitivityPassCount:candidates.filter(c=>c.sensitivity.passes).length,
  severeSensitivityPassCount:candidates.filter(c=>c.severeSensitivity.passes).length,
  sensitivityAssumptions:"Illustrative 10% output reduction and nine orientation combinations (tilt/azimuth -1,0,+1 degrees); severe profile uses -5,0,+5 degrees; unchanged mission constraints; not certification",
  reviewCases:reviewCases.slice(0,5),reviewCount:reviewCases.length,
  comparableCadenceSeconds:step/1000,
  potentialConflictCount:cases.filter(c=>c.status==="potential_conflict").length,
  insufficientDataCount:cases.filter(c=>c.status==="insufficient_data").length,
  windowMarginSeconds:null,
  certifiedAlternativeCount:0,
  scientificConclusion:"NO_VALIDATED_MISSION_PASS_AVAILABLE",
  sampledMarginInterpretation:"Observed pointwise NASA sample-run slack until a later sampled model failure; NOT verified physical time margin",
  coverageEndUtc:data.sites[req.site].rows.at(-1)[0],
  evaluationTimeUtc:null // deterministic; no fabricated timestamp or background work
 };
}
const Engine={assertData,validateBundle,requestFromObject,referencePower,estimatedPower,nextSet,referenceSamplePass,sampleRunMargin,labelClearance,siteStats,evaluateCase,stressCase,searchCoverage,searchCases};
global.LunarEngine=Engine;
if(typeof document==="undefined"||!document.getElementById('planForm'))return;
// Initialize the editable example once; captured validated requests drive results.
const $=id=>document.getElementById(id);
const EXAMPLE_CONFIGURATION=Object.freeze({siteSelect:'Site01',startUtc:'2026-12-21T00:00',durationH:6,requiredPowerW:100,delayH:72,earthRequired:'required',panelArea:1.5,panelEfficiency:25,panelTilt:60,panelAzimuth:90});
function fillExample(){for(const [id,value] of Object.entries(EXAMPLE_CONFIGURATION))$(id).value=String(value);}
let initialized=false;
const state={phase:'initial',report:null,selected:'original',sourceIndex:0,view:'power',data:null,revision:0,inspectionOpen:false};
state.mainReport=null;state.fineReport=null;state.scope='main';
const fieldIds=['siteSelect','startUtc','durationH','requiredPowerW','delayH','panelArea','panelEfficiency','panelTilt','panelAzimuth','earthRequired'];
const labels={siteSelect:'a lunar site',earthRequired:'an Earth-visibility requirement',startUtc:'start time',durationH:'duration',requiredPowerW:'power demand',delayH:'maximum delay',panelArea:'panel area',panelEfficiency:'panel efficiency',panelTilt:'panel tilt',panelAzimuth:'panel azimuth'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const utc=s=>new Date(s).toLocaleString('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false})+' UTC';
const watts=n=>Number.isFinite(n)?n.toFixed(3)+' W':'Not evaluable';
const delta=n=>(n>=0?'+':'−')+Math.abs(n).toFixed(3)+' W';
const elapsed=h=>{if(!Number.isFinite(h))return 'Unavailable';const seconds=Math.round(Math.abs(h)*3600000)/1000,hours=Math.floor(seconds/3600),minutes=Math.floor((seconds-hours*3600)/60),rest=Number((seconds-hours*3600-minutes*60).toFixed(3));return (h<0?'−':'')+hours+' h '+String(minutes).padStart(2,'0')+' m'+(rest?' '+rest+' s':'');};
function notify(type='zenith-report-change'){document.dispatchEvent(new CustomEvent(type,{detail:state}));}
function rawRequest(){
 for(const id of fieldIds)if($(id).value.trim()==='')throw Error('Complete '+(labels[id]||id)+' before comparing.');
 return Engine.requestFromObject({site:$('siteSelect').value,start:$('startUtc').value,durationH:$('durationH').value,requiredW:$('requiredPowerW').value,delayH:$('delayH').value,area:$('panelArea').value,efficiency:$('panelEfficiency').value,tilt:$('panelTilt').value,azimuth:$('panelAzimuth').value,earthRequired:$('earthRequired').value==='required',priority:'earliest'});
}
function errorFor(id,message){
 const input=$(id);let error=$(id==='startUtc'?'startError':id==='durationH'?'durationError':id+'Error');
 if(!error){error=document.createElement('p');error.id=id+'Error';error.className='field-error';input.after(error);}
 error.textContent=message;input.setAttribute('aria-invalid',String(!!message));
 const described=(input.getAttribute('aria-describedby')||'').split(' ').filter(Boolean);if(!described.includes(error.id))described.push(error.id);input.setAttribute('aria-describedby',described.join(' '));
}
function preflight(showErrors=false){
 const errors=[];for(const id of fieldIds){const el=$(id);if(!el.willValidate)continue;errorFor(id,'');
  if(!el.validity.valid){let message='Enter a valid '+(labels[id]||'value')+'.';
   if(el.validity.valueMissing)message='Enter '+(labels[id]||'a value')+'.';
   else if(el.validity.rangeUnderflow||el.validity.rangeOverflow)message=id==='startUtc'?'Use a UTC date from 1 Dec 2026 to 1 Jan 2027.':'Use a value '+(el.min?'at least '+el.min:'greater than zero')+(el.max?' and no more than '+el.max:'')+'.';
   errors.push({id,message});
  }
 }
 const s=state.data?.sites[$('siteSelect').value];
 $('siteCoordinates').textContent=s?s.lat.toFixed(4)+'° latitude · '+s.lon_east.toFixed(2)+'° east longitude':'';
 $('siteCoordinates').hidden=!s;
 const panels=['panelArea','panelEfficiency','panelTilt','panelAzimuth'],completePanels=panels.filter(id=>$(id).value!==''&&$(id).validity.valid).length;
 $('panelSummary').textContent=completePanels===4?$('panelArea').value+' m² · '+$('panelEfficiency').value+'% · tilt '+$('panelTilt').value+'° · azimuth '+$('panelAzimuth').value+'°':'Incomplete — '+completePanels+' of 4 panel settings entered';
 $('latestStart').textContent='';$('latestStart').hidden=true;
 if($('startUtc').value!==''&&$('startUtc').validity.valid&&$('delayH').value!==''&&$('delayH').validity.valid){const deadline=Date.parse($('startUtc').value+':00Z')+Number($('delayH').value)*3600000;if(Number.isFinite(deadline)){$('latestStart').textContent='Latest permitted start: '+utc(new Date(deadline).toISOString());$('latestStart').hidden=false;}}
 let request=null,coverage=null;
 if(!errors.length)try{
  request=rawRequest();coverage=Engine.searchCoverage(state.data,request);
  $('latestStart').textContent='Latest permitted start: '+utc(new Date(request.startMs+request.delayMs).toISOString());
  if(!coverage.canEvaluate){errors.push({id:coverage.reason==='DURATION_NOT_ON_COMMON_CADENCE'?'durationH':'startUtc',message:coverage.reason==='DURATION_NOT_ON_COMMON_CADENCE'?'This search uses '+coverage.stepMs/60000+'-minute records. Use a duration aligned with that cadence, or explicitly keep the full search in 20–25 Dec for five-minute records.':'No complete operating interval fits the source coverage and permitted delay.'});}
  else if(!coverage.originalAligned)errors.push({id:'startUtc',message:'Start and finish must be actual '+coverage.stepMs/60000+'-minute source times. Choose an aligned start; no time has been rounded.'});
  else if(request.startMs<Date.parse(coverage.coverageStartUtc)||request.startMs+request.durationMs>Date.parse(coverage.coverageEndUtc))errors.push({id:'startUtc',message:'The original operating interval extends outside the available UTC source times.'});
 }catch(e){errors.push({id:'startUtc',message:e.message});}
 for(const error of errors)if(showErrors||$(error.id).value!=='')errorFor(error.id,error.message);
 if(errors.some(e=>e.id==='startUtc')){$('latestStart').textContent='';$('latestStart').hidden=true;}
 $('evaluate').disabled=errors.length>0||!state.data||state.phase==='missing'||state.phase==='busy';
 $('coverageHint').dataset.state=coverage&&errors.length?'error':'ready';
 if(coverage){
  const wholeFine=coverage.useFine?'This search uses 5-minute records.':'This search uses hourly records; duration and boundaries must align to whole hours.';
  const partial=request.startMs+request.delayMs+request.durationMs>Date.parse(coverage.coverageEndUtc)?' Only starts whose full operation is covered can be evaluated; the permitted delay is unchanged.':'';
  $('coverageHint').textContent=wholeFine+partial+(errors.length?' Cannot evaluate the current request.':'');
 }else {const missing=fieldIds.filter(id=>$(id).value==='');$('coverageHint').textContent=missing.length?(missing.length>2?missing.length+' required fields remain, including operation, panel and visibility choices.':'Still needed: '+missing.map(id=>labels[id]||id).join(', ')+'.'):errors.length?'Check the entered values before comparing.':'';}
 return {request,coverage,errors};
}
function invalidate(){
 if(state.phase==='missing')return;
 state.revision++;const hadResult=state.report||state.phase==='busy'||state.phase==='stale';
 state.report=null;state.mainReport=null;state.fineReport=null;state.scope='main';state.sourceIndex=0;state.inspectionOpen=false;
 if(hadResult){state.phase='stale';$('inputStatus').textContent='Settings changed. Compare plans again to update results.';notify();}
 preflight();
}
function focusError(id){const field=$(id),disclosure=field.closest('details');if(disclosure)disclosure.open=true;field.focus();}
async function compare(successMessage=''){
 if(state.phase==='missing')return;
 state.inspectionOpen=false;
 const checked=preflight(true);
 if(checked.errors.length){state.revision++;state.report=null;state.mainReport=null;state.fineReport=null;state.scope='main';state.selected='original';state.sourceIndex=0;state.phase=checked.coverage?'insufficient_data':'invalid';$('inputStatus').textContent=checked.errors[0].message;notify();focusError(checked.errors[0].id);return;}
 const revision=++state.revision;state.report=null;state.mainReport=null;state.fineReport=null;state.scope='main';state.phase='busy';$('evaluate').disabled=true;$('evaluate').textContent='Comparing…';$('results').setAttribute('aria-busy','true');notify();
 // Paint the state before synchronous screening, and discard a request edited meanwhile.
 await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
 try{
  if(revision!==state.revision)return;
  const report=Engine.searchCases(state.data,checked.request);
  if(revision!==state.revision)return;
  state.report=report;state.mainReport=report;state.fineReport=null;state.scope='main';state.selected='original';state.sourceIndex=0;state.phase=report.evaluationStatus==='candidates_found'?'ready':report.evaluationStatus;
  $('inputStatus').textContent=successMessage||'Comparison updated. Inspecting a case keeps this operation unchanged.';
  notify();
  $('decisionTitle').focus({preventScroll:true});
  if(innerWidth<=760)$('results').scrollIntoView({block:'start'});
 }catch(e){state.report=null;state.phase='missing';$('inputStatus').textContent='The source evidence could not be evaluated. '+e.message;notify();}
 finally{$('evaluate').textContent='Compare plans';$('results').setAttribute('aria-busy','false');preflight();}
}
function caseFor(key=state.selected){
 return !state.report?null:key==='original'?state.report.original:key==='nominal'?state.report.candidates[0]:key==='sensitivity'?state.report.sensitivityCandidate:null;
}
function inspect(key){
 const selected=caseFor(key);if(!selected||!selected.sampleCount)return;
 state.selected=key;state.sourceIndex=0;state.inspectionOpen=true;notify('zenith-selection-change');
 $('inspectTitle').focus({preventScroll:true});
 if($('visualization').getBoundingClientRect().top>innerHeight*.7||innerWidth<=760)$('visualization').scrollIntoView({block:'start'});
}
function bundle(){return state.report?.coverage.useFine?global.LUNAR_FINE_DATA:state.data;}
function rows(){const c=caseFor();return c?bundle().sites[c.site].rows.filter(r=>Date.parse(r[0])>=Date.parse(c.startUtc)&&Date.parse(r[0])<Date.parse(c.finishUtc)):[];}
function apply(){
 const report=state.report,c=caseFor();if(!report||!c||state.selected==='original')return;
 const latest=Date.parse(report.latestPermittedStartUtc);
 if(!Number.isFinite(latest)||!Number.isFinite(Date.parse(c.startUtc))||Date.parse(c.startUtc)<report.request.startMs||Date.parse(c.startUtc)>latest){$('inputStatus').textContent='Invalid candidate: start is outside the permitted deadline. The form has not changed.';return;}
 $('siteSelect').value=c.site;$('startUtc').value=c.startUtc.slice(0,16);$('delayH').value=String((latest-Date.parse(c.startUtc))/3600000);
 invalidate();compare('New plan applied. Latest permitted start is still '+utc(new Date(latest).toISOString())+'.');
}
function clearInputs(){
 for(const id of fieldIds)$(id).value='';
 state.revision++;state.report=null;state.selected='original';state.sourceIndex=0;state.phase='initial';
 state.mainReport=null;state.fineReport=null;state.scope='main';state.inspectionOpen=false;
 $('inputStatus').textContent='Choose a site and enter your operation requirements to begin.';
 preflight();notify();
}
global.ZenithUI={state,$,esc,utc,watts,delta,elapsed,preflight,compare,caseFor,inspect,apply,bundle,rows,notify};
function init(){
 if(initialized)return;initialized=true;
 fillExample();
 try{
  state.data=Engine.assertData(global.LUNAR_DATA);
  if(!global.LUNAR_FINE_DATA)$('sourceCoverage').textContent='Hourly: 1 Dec 2026–1 Jan 2027 UTC. The five-minute bundle is unavailable; only hourly requests can be compared.';

  preflight();
 }catch(e){state.phase='missing';$('evaluate').disabled=true;$('clearInputs').disabled=true;$('inputStatus').textContent=e.message;notify();return;}
 $('planForm').addEventListener('input',invalidate);$('planForm').addEventListener('change',invalidate);
 $('planForm').addEventListener('submit',e=>{e.preventDefault();compare();});
 $('clearInputs').addEventListener('click',clearInputs);
 $('loadExample').addEventListener('click',()=>{
  clearInputs();
  fillExample();
  preflight();$('inputStatus').textContent='Illustrative example loaded. Review the editable inputs, then Compare plans.';
 });
 $('applyCase').addEventListener('click',apply);
 $('sourcesLink').addEventListener('click',()=>{$('evidencePanel').open=true;});
 notify();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})(typeof window!=="undefined"?window:globalThis);
