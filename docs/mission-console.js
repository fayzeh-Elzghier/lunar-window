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
   startDelayH:(startMs-req.startMs)/3600000,remainingUserDelayH:Math.max(0,(req.delayMs-(startMs-req.startMs))/3600000),status:"insufficient_data",evidence:[],
   reasons:[],sampleCount:0,marginSeconds:null,physicalWindowEndKnown:false,
   sampledMarginMinutes:null,sampledMarginStatus:"NOT_COMPUTED",sampledModelWindow:null,
   validation:"PROVISIONAL_LOCAL_SCREEN_ONLY"};
 if(!rows){out.reasons.push({code:"NO_NASA_SOURCE",times:[]});return out}
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
 if(relevant.length!==expectedCount||relevant[0][0]!==new Date(startMs).toISOString().replace(".000Z","Z")){
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
function searchCases(data,req){
 const cases=[],last=req.delayMs;
 // Prefer original NASA 5-minute cadence only where BOTH sites and the whole
 // candidate search horizon have identical fine-source coverage.
 const fine=global.LUNAR_FINE_DATA;
 const bothFine=!!(fine&&fine.schema==="lunar-window-real-five-minute-v1"&&
   SITES.every(x=>fine.sites?.[x]?.rows?.length===1441));
 const fineSearch=bothFine&&req.startMs>=Date.parse(fine.range_start_utc)&&
   req.startMs+last+req.durationMs<=Date.parse(fine.range_end_utc);
 const step=fineSearch?300000:3600000,delays=[0];
 const selected=fineSearch?fine:data,origin=Date.parse(selected.range_start_utc);
 for(let start=origin+Math.ceil((req.startMs-origin)/step)*step;start<=req.startMs+last;start+=step)
  if(start>req.startMs)delays.push(start-req.startMs);
 if(last>0&&delays.at(-1)!==last)delays.push(last);
 for(const site of [req.site,...SITES.filter(x=>x!==req.site)])
  for(const delta of delays)cases.push(evaluateCase(data,req,site,req.startMs+delta,{rows:selected.sites[site].rows,stepMs:step,cadence:fineSearch?"original NASA 5-minute":"original NASA hourly",fineUsed:fineSearch}));
 const original=cases.find(c=>c.site===req.site&&c.startDelayH===0);
 const candidates=cases.filter(c=>c.status==="research_candidate");
 const reviewCases=cases.filter(c=>c.status==="edge_review");
 const sort=(a,b)=>{
  if(req.priority==="keep")return (a.site!==req.site)-(b.site!==req.site)||a.startDelayH-b.startDelayH;
  if(req.priority==="clearance")return (b.minSunLocalClearanceDeg??-Infinity)-(a.minSunLocalClearanceDeg??-Infinity)||a.startDelayH-b.startDelayH;
  return a.startDelayH-b.startDelayH||(a.site!==req.site)-(b.site!==req.site);
 };
 candidates.sort(sort);
 reviewCases.sort(sort);
 return {
  kind:"RESEARCH_SCREEN_NOT_MISSION_CERTIFICATION",request:req,
  scannedCaseCount:cases.length,searchResolutionMinutes:step/60000,original,candidates:candidates.slice(0,5),
  candidateCount:candidates.length,
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
const Engine={assertData,validateBundle,requestFromObject,referencePower,estimatedPower,nextSet,referenceSamplePass,sampleRunMargin,labelClearance,siteStats,evaluateCase,searchCases};
global.LunarEngine=Engine;
if(typeof document==="undefined")return;
function $(id){return document.getElementById(id)}
function escape(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function fixed(n,d=2){return Number(n).toFixed(d)}
function utcLabel(str){return new Date(str).toLocaleString("en-GB",{timeZone:"UTC",day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false})+" UTC"}
function formatDelta(n){return (n>=0?"+":"")+fixed(n,3)+"°"}
function durationLabel(minutes){
 if(minutes===null||minutes===undefined)return "UNKNOWN";
 return Math.floor(minutes/60)+"h "+String(Math.round(minutes%60)).padStart(2,"0")+"m";
}
const state={site:"Site01",index:0,report:null,data:null};
function svgElem(tag,attrs={}){const node=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [k,v] of Object.entries(attrs))node.setAttribute(k,String(v));return node}
function graph(site){
 const svg=$("terrainGraph");svg.replaceChildren();
 const rows=state.data.sites[site].rows;
 const vals=rows.flatMap(r=>[r[6],r[8]]);
 let min=Math.min(0,...vals),max=Math.max(0,...vals);const padding=Math.max(1,(max-min)*.07);min-=padding;max+=padding;
 const L=65,T=12,W=758,H=232,X=i=>L+i/(rows.length-1)*W,Y=v=>T+(max-v)/(max-min)*H;
 const reviewTop=svgElem("rect",{x:L,y:Y(EDGE),width:W,height:Y(-EDGE)-Y(EDGE),fill:"#f4c267",opacity:".07"});svg.append(reviewTop);
 for(let i=0;i<=4;i++){const yValue=min+(max-min)*i/4;
  svg.append(svgElem("line",{x1:L,x2:L+W,y1:Y(yValue),y2:Y(yValue),stroke:yValue===0?"#cadbef":"#375371","stroke-width":1}));
  const tx=svgElem("text",{x:5,y:Y(yValue)+4,fill:"#b7cde2","font-size":12});tx.textContent=fixed(yValue,1)+"°";svg.append(tx);
 }
 const y0=Y(0);svg.append(svgElem("line",{x1:L,x2:L+W,y1:y0,y2:y0,stroke:"#ecf5ff","stroke-dasharray":"6 5","stroke-width":1.5}));
 for(const [ix,color] of [[6,"#f6c667"],[8,"#75d7f3"]]){
  svg.append(svgElem("polyline",{fill:"none",stroke:color,"stroke-width":2.4,points:rows.map((r,i)=>X(i)+","+Y(r[ix])).join(" ")}));
 }
 svg.append(svgElem("line",{x1:X(state.index),x2:X(state.index),y1:T,y2:T+H,stroke:"#fff","stroke-dasharray":"4 5","stroke-width":1.2}));
 for(const [ix,color]of [[6,"#f6c667"],[8,"#75d7f3"]])svg.append(svgElem("circle",{cx:X(state.index),cy:Y(rows[state.index][ix]),r:4.5,fill:color,stroke:"#091628","stroke-width":1.5}));
}
function updatePoint(){
 const site=state.site,siteData=state.data.sites[site],row=siteData.rows[state.index];
 if(!row)return;
 $("currentDate").textContent=utcLabel(row[0]);
 $("sunAngles").textContent=fixed(row[1],3)+"° / "+fixed(row[2],3)+"°";
 $("earthAngles").textContent=fixed(row[3],3)+"° / "+fixed(row[4],3)+"°";
 $("sunClearance").textContent=formatDelta(row[6]);
 $("earthClearance").textContent=formatDelta(row[8]);
 $("sunStatus").textContent=Engine.labelClearance(row[6],site,row[1]).text;
 $("earthStatus").textContent=Engine.labelClearance(row[8],site,row[3]).text;
 $("sourceCsv").href=DOCS+site.toLowerCase()+"_audit/far_screen_dec2026.csv";
 $("sourceCsv").textContent="Original "+site+" source screening CSV";
 $("sourceHash").textContent="LOLA SHA256: "+siteData.meta.terrain_sha256.slice(0,12)+"…";
 $("datasetStatus").textContent=siteData.rows.length+" actual JPL UTC epochs · Sun distance from NASA";
 $("timeSlider").value=String(state.index);
 graph(site);
 document.dispatchEvent(new CustomEvent("lunar-point-change"));
}
function setSite(site){
 state.site=site;
 for(const id of SITES){$(id.toLowerCase()+"Btn").classList.toggle("selected",id===site);$(id.toLowerCase()+"Btn").setAttribute("aria-pressed",String(id===site));}
 state.report=null;$("exportBtn").disabled=true;
 $("report").innerHTML='<div class="empty-state">Site changed. Run the screen again with this site as the original plan.</div>';
 $("alternatives").textContent="No scenarios evaluated for the changed site.";
 $("caseCount").textContent="";$("reviewCases").textContent="";
 updatePoint();
}
function compareCards(){
 let html="";
 for(const site of SITES){
  const s=state.data.sites[site],stats=Engine.siteStats(state.data,site);
  html+='<article class="compare-card"><h3>'+escape(s.name)+'</h3><small>'+escape(site)+" · "+s.lat+"°, "+s.lon_east+'°E</small><span class="count">'+stats.sunAbove+'/'+stats.count+'</span><small>Sun samples above sampled near/far skyline beyond local RMS review threshold</small><div class="counts"><span>'+stats.sunNear+' near-edge</span><span>'+stats.sunBelow+' possible local blocks</span></div><div class="counts"><span>Earth potential sampled blocks: '+stats.earthBelow+'</span><span>Unverified</span></div></article>';
 }
 $("siteCards").innerHTML=html;
}
function formRequest(){
 return Engine.requestFromObject({site:state.site,start:$("startUtc").value,durationH:$("durationH").value,requiredW:$("requiredPowerW").value,
  delayH:$("delayH").value,area:$("panelArea").value,efficiency:$("panelEfficiency").value,tilt:$("panelTilt").value,
  azimuth:$("panelAzimuth").value,earthRequired:$("earthRequired").checked,priority:$("priority").value});
}
const reasonText={
 SUN_LOCAL_SCREEN_BELOW_HORIZON:"Sun below the sampled near+far LOLA skyline",
 EARTH_LOCAL_SCREEN_BELOW_HORIZON:"Earth below the sampled near+far LOLA skyline",
 PANEL_UNSHADOWED_REFERENCE_BELOW_REQUEST:"Panel geometry produces less than the requested power in the UNshadowed distance-adjusted reference model",
 SUN_NEAR_UNCERTAIN_LOCAL_EDGE:"Sun close to local skyline; finer data needed",
 EARTH_NEAR_UNCERTAIN_LOCAL_EDGE:"Earth close to local skyline; finer data needed",
 OUTSIDE_NASA_COVERAGE:"Time request extends outside the available NASA source timestamps",
 UNSAMPLED_BOUNDARY:"Start/end falls between original NASA sample times; no fabricated interpolation",
 SAMPLE_TIME_GAP:"Missing original NASA timestamp in the requested interval",
 NO_SAMPLED_EPOCH:"No NASA sample inside this requested interval",
 NO_NASA_SOURCE:"No NASA data available"
};
function render(){
 const report=state.report,original=report.original;
 const stateLabel={
  potential_conflict:"Potential conflict at actual NASA sample(s)",
  edge_review:"Near-edge — scientifically unresolved",
  research_candidate:"Research candidate only · NOT a mission pass",
  insufficient_data:"Insufficient source coverage"
 }[original.status];
 const headingClass=original.status==="research_candidate"?"candidate":original.status==="insufficient_data"?"unknown":"risk";
 const pieces=original.reasons.map(r=>'<p class="reason"><strong>'+escape(reasonText[r.code]||r.code)+'</strong> · '+(r.sampleCount===undefined?escape(r.explanation||'No evaluable source interval'):r.sampleCount+' sample(s); first '+escape(r.firstUtc||'n/a'))+'</p>');
 const zero=original.reasons.length===0?'<p>No adverse point samples in this range under the declared panel and terrain model; that does NOT establish uninterrupted illumination or a working link.</p>':pieces.join("");
 $("report").innerHTML='<div class="status-line"><strong class="'+headingClass+'">'+escape(stateLabel)+'</strong><p>'+escape(original.site)+' · '+escape(utcLabel(original.startUtc))+' · '+original.sampleCount+' actual NASA samples ('+escape(original.cadence)+') inspected</p></div><div class="report-grid"><div><small>Minimum estimated direct panel power</small><strong>'+((original.minEstimatedPowerW===undefined)?"Unknown":fixed(original.minEstimatedPowerW,1)+" W")+'</strong></div><div><small>Min Sun local clearance</small><strong>'+((original.minSunLocalClearanceDeg===undefined)?"Unknown":formatDelta(original.minSunLocalClearanceDeg))+'</strong></div><div><small>Physical Time Margin</small><strong class="unknown">UNKNOWN</strong></div></div>'+zero+'<p class="small-note"><strong>Sampled reference slack:</strong> '+escape(durationLabel(original.sampledMarginMinutes))+' (only if a later failing NASA sample marks the end; NOT a physical Time Margin). <strong>Physical Time Margin:</strong> UNKNOWN.</p><p class="small-note">Potential conflicts are based on original NASA hourly or five-minute geometry and a <b>provisional</b> sampled near/far LOLA terrain model. This is not a scientific verdict about actual continuous power, RF link, or safe landing.</p>';
 const count=report.candidateCount;
 $("reviewCases").innerHTML='<strong>'+report.reviewCount+' near-edge cases require review.</strong><p>These are not included in the candidate count because the local uncertainty review band overlaps the condition.</p>'+report.reviewCases.map(a=>'<p>'+escape(a.site)+' · '+escape(utcLabel(a.startUtc))+' · '+a.reasons.map(r=>escape(reasonText[r.code]||r.code)).join('; ')+'</p>').join('');
 $("caseCount").textContent=report.scannedCaseCount+" cases screened at "+report.searchResolutionMinutes+"-minute start steps · "+count+" preliminary candidates · 0 certified alternatives";
 if(!count){
  $("alternatives").innerHTML='<div class="explain">No preliminary candidates met these user-entered requirements within the sampled NASA time range and allowed delay. This does not prove that no real lunar option exists. Try changing the date or explicitly making Earth visibility optional.</div>';
 }else{
  $("alternatives").innerHTML=report.candidates.map((a,i)=>{
   const caution=a.status==="edge_review";
   return '<div class="alternative"><div class="topline"><b>'+escape(state.data.sites[a.site].name)+'</b><span class="tag '+(caution?"caution":"good")+'">'+(caution?"Near edge":"Investigate")+'</span></div><p><strong>'+escape(utcLabel(a.startUtc))+'</strong></p><p>Start delay '+fixed(a.startDelayH,2)+' h · '+a.sampleCount+' actual NASA samples ('+escape(a.cadence)+') · user delay budget left '+fixed(a.remainingUserDelayH,1)+' h · min unshadowed reference '+fixed(a.minReferencePowerW,1)+' W</p><p>Sun terrain clearance: '+formatDelta(a.minSunLocalClearanceDeg)+' · Sampled reference slack: <b>'+escape(durationLabel(a.sampledMarginMinutes))+'</b> · Physical Time Margin: <b>UNKNOWN</b></p><button type="button" class="secondary" data-apply-site="'+escape(a.site)+'" data-apply-start="'+escape(a.startUtc)+'">Inspect this alternative</button></div>';
  }).join("");
 }
 $("exportBtn").disabled=false;
}
function invalidate(){
 if(!state.report)return;
 state.report=null;$("exportBtn").disabled=true;
 $("report").innerHTML='<div class="empty-state">Mission inputs changed. Previous findings are no longer current; run the screening again.</div>';
 $("reviewCases").textContent="";$("alternatives").textContent="Results invalidated by the changed settings.";$("caseCount").textContent="";
}
function exportReport(){
 if(!state.report)return;
 const payload={...state.report,source:"NASA/JPL Horizons; NASA LRO/LOLA, real dated source tables",science_warning:"SCREENED SAMPLE-ONLY SLACK IS NOT A PHYSICAL TIME MARGIN. NO VERIFIED LUNAR OPERATING WINDOW OR PHYSICAL MARGIN.",challenge:"NASA Space Apps 2026 Lunar Landing Site Navigator"};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);
 const anchor=document.createElement("a");anchor.href=url;anchor.download="lunar-window-mission-screen-"+new Date(state.report.request.startMs).toISOString().slice(0,10)+".json";document.body.append(anchor);anchor.click();anchor.remove();URL.revokeObjectURL(url);
}
function init(){
 try{state.data=Engine.assertData(global.LUNAR_DATA)}catch(e){$("statusBar").innerHTML='<strong>NASA source verification failed: '+escape(e.message)+'. No calculations will run.</strong>';$("evaluate").disabled=true;return;}
 compareCards();updatePoint();
 $("timeSlider").addEventListener("input",()=>{state.index=Number($("timeSlider").value);updatePoint()});
 for(const site of SITES)$(site.toLowerCase()+"Btn").addEventListener("click",()=>setSite(site));
 $("planForm").addEventListener("input",invalidate);
 $("planForm").addEventListener("change",invalidate);
 $("powerOnly").addEventListener("click",()=>{
  $("earthRequired").checked=false;$("powerOnly").classList.add("selected");$("earthMode").classList.remove("selected");invalidate()});
 $("earthMode").addEventListener("click",()=>{
  $("earthRequired").checked=true;$("earthMode").classList.add("selected");$("powerOnly").classList.remove("selected");invalidate()});
 $("earthRequired").addEventListener("change",()=>{$("earthMode").classList.toggle("selected",$("earthRequired").checked);$("powerOnly").classList.toggle("selected",!$("earthRequired").checked)});
 $("planForm").addEventListener("submit",e=>{e.preventDefault();try{const req=formRequest();state.index=Math.max(0,Math.min(state.data.sites[state.site].rows.length-1,Math.round((req.startMs-Date.parse(state.data.range_start_utc))/3600000)));updatePoint();state.report=Engine.searchCases(state.data,req);$("inputStatus").textContent="Evaluated only authentic NASA point samples; every candidate still requires independent scientific verification.";render()}catch(err){$("report").innerHTML='<div class="unknown"><strong>Invalid input:</strong> '+escape(err.message)+'</div>';$("alternatives").textContent="No results.";state.report=null;$("exportBtn").disabled=true;}});
 $("exportBtn").addEventListener("click",exportReport);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})(typeof window!=="undefined"?window:globalThis);
