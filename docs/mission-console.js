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
 return data;
}
function number(x,label,min,max,strict=false){const n=Number(x);if(x===""||!Number.isFinite(n)||(strict?n<=min:n<min)||(max!==undefined&&n>max))throw Error(label+" must be "+(strict?"greater than ":"at least ")+min+(max!==undefined?" and no more than "+max:""));return n;}
function requestFromObject(a){
 if(!SITES.includes(a.site))throw Error("Choose an available NASA site");
 if(typeof a.start!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}$/.test(a.start))throw Error("Use a complete UTC date and time");
 const start=Date.parse(a.start+":00Z");if(!Number.isFinite(start))throw Error("Invalid start time");
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
function evaluateCase(data,req,site,startMs){
 const rows=data.sites[site]?.rows;
 const out={site,startUtc:new Date(startMs).toISOString(),finishUtc:new Date(startMs+req.durationMs).toISOString(),
   startDelayH:(startMs-req.startMs)/3600000,remainingUserDelayH:Math.max(0,(req.delayMs-(startMs-req.startMs))/3600000),status:"insufficient_data",evidence:[],
   reasons:[],sampleCount:0,marginSeconds:null,physicalWindowEndKnown:false,
   validation:"PROVISIONAL_LOCAL_SCREEN_ONLY"};
 if(!rows){out.reasons.push({code:"NO_NASA_SOURCE",times:[]});return out}
 const min=Date.parse(rows[0][0]),max=Date.parse(rows.at(-1)[0]);
 if(startMs<min||startMs+req.durationMs>max){out.reasons.push({code:"OUTSIDE_NASA_COVERAGE",times:[]});return out}
 const relevant=rows.filter(r=>{const t=Date.parse(r[0]);return t>=startMs&&t<startMs+req.durationMs});
 if(!relevant.length){out.reasons.push({code:"NO_SAMPLED_EPOCH",times:[]});return out}
 out.sampleCount=relevant.length;
 const causes={
   "SUN_LOCAL_SCREEN_BELOW_HORIZON":[],
   "EARTH_LOCAL_SCREEN_BELOW_HORIZON":[],
   "PANEL_UNSHADOWED_REFERENCE_BELOW_REQUEST":[],
   "SUN_NEAR_UNCERTAIN_LOCAL_EDGE":[],
   "EARTH_NEAR_UNCERTAIN_LOCAL_EDGE":[]
 };
 let minPower=Infinity,minSun=Infinity,minEarth=Infinity;
 for(const r of relevant){
  const watts=referencePower(r,req);
  minPower=Math.min(minPower,watts);minSun=Math.min(minSun,r[6]);minEarth=Math.min(minEarth,r[8]);
  const sunBand=reviewBand(site,r[1]),earthBand=reviewBand(site,r[3]);
  if(r[6]<-sunBand)causes.SUN_LOCAL_SCREEN_BELOW_HORIZON.push(r[0]);
  else if(Math.abs(r[6])<=sunBand)causes.SUN_NEAR_UNCERTAIN_LOCAL_EDGE.push(r[0]);
  if(req.earthRequired&&r[8]<-earthBand)causes.EARTH_LOCAL_SCREEN_BELOW_HORIZON.push(r[0]);
  else if(req.earthRequired&&Math.abs(r[8])<=earthBand)causes.EARTH_NEAR_UNCERTAIN_LOCAL_EDGE.push(r[0]);
  if(watts+1e-9<req.requiredW)causes.PANEL_UNSHADOWED_REFERENCE_BELOW_REQUEST.push(r[0]);
 }
 out.minReferencePowerW=Number(minPower.toFixed(3));
 out.minSunLocalClearanceDeg=Number(minSun.toFixed(4));
 out.minEarthLocalClearanceDeg=Number(minEarth.toFixed(4));
 out.reasons=Object.entries(causes).filter(([k,t])=>t.length).map(([code,times])=>({code,times,sampleCount:times.length,firstUtc:times[0],lastUtc:times.at(-1)}));
 const hasConflict=causes.SUN_LOCAL_SCREEN_BELOW_HORIZON.length>0 ||
  causes.EARTH_LOCAL_SCREEN_BELOW_HORIZON.length>0 ||causes.PANEL_UNSHADOWED_REFERENCE_BELOW_REQUEST.length>0;
 const isEdge=causes.SUN_NEAR_UNCERTAIN_LOCAL_EDGE.length>0 || causes.EARTH_NEAR_UNCERTAIN_LOCAL_EDGE.length>0;
 out.status=hasConflict?"potential_conflict":isEdge?"edge_review":"research_candidate";
 out.evidence={sampledUtc:relevant.map(x=>x[0]),limitations:["NASA local height-error RMS review threshold is approximate; far 80m terrain error not quantified; not a confidence bound","NASA source is hourly not continuous","only sampled 5m+80m LOLA skyline to about 300km, farther terrain still unknown","scientific frames and vertical references not independently reconciled","distance-adjusted unshadowed power reference is NOT actual available power","solar eclipse/disc and uncertainty not quantified"],sourceHashes:{
    sun:data.sites[site].meta.sun_sha256,earth:data.sites[site].meta.earth_sha256,lola:data.sites[site].meta.terrain_sha256
  }};
 return out;
}
function searchCases(data,req){
 const cases=[],last=req.delayMs;const step=3600000,delays=[];
 for(let delta=0;delta<=last;delta+=step)delays.push(delta);
 if(last>0&&delays.at(-1)!==last)delays.push(last);
 for(const site of [req.site,...SITES.filter(x=>x!==req.site)])
  for(const delta of delays)cases.push(evaluateCase(data,req,site,req.startMs+delta));
 const original=cases.find(c=>c.site===req.site&&c.startDelayH===0);
 const candidates=cases.filter(c=>c.status==="research_candidate"||c.status==="edge_review");
 const sort=(a,b)=>{
  if(req.priority==="keep")return (a.site!==req.site)-(b.site!==req.site)||a.startDelayH-b.startDelayH;
  if(req.priority==="clearance")return (b.minSunLocalClearanceDeg??-Infinity)-(a.minSunLocalClearanceDeg??-Infinity)||a.startDelayH-b.startDelayH;
  return a.startDelayH-b.startDelayH||(a.site!==req.site)-(b.site!==req.site);
 };
 candidates.sort(sort);
 return {
  kind:"RESEARCH_SCREEN_NOT_MISSION_CERTIFICATION",request:req,
  scannedCaseCount:cases.length,original,candidates:candidates.slice(0,15),
  candidateCount:candidates.length,
  potentialConflictCount:cases.filter(c=>c.status==="potential_conflict").length,
  insufficientDataCount:cases.filter(c=>c.status==="insufficient_data").length,
  windowMarginSeconds:null,
  certifiedAlternativeCount:0,
  scientificConclusion:"NO_VALIDATED_MISSION_PASS_AVAILABLE",
  coverageEndUtc:data.sites[req.site].rows.at(-1)[0],
  evaluationTimeUtc:null // deterministic; no fabricated timestamp or background work
 };
}
const Engine={assertData,requestFromObject,referencePower,labelClearance,siteStats,evaluateCase,searchCases};
global.LunarEngine=Engine;
if(typeof document==="undefined")return;
function $(id){return document.getElementById(id)}
function escape(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function fixed(n,d=2){return Number(n).toFixed(d)}
function utcLabel(str){return new Date(str).toLocaleString("en-GB",{timeZone:"UTC",day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false})+" UTC"}
function formatDelta(n){return (n>=0?"+":"")+fixed(n,3)+"°"}
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
}
function setSite(site){
 state.site=site;
 for(const id of SITES){$(id.toLowerCase()+"Btn").classList.toggle("selected",id===site);$(id.toLowerCase()+"Btn").setAttribute("aria-pressed",String(id===site));}
 state.index=0;state.report=null;$("exportBtn").disabled=true;
 $("report").innerHTML='<div class="empty-state">Site changed. Run the screen again with this site as the original plan.</div>';
 $("alternatives").textContent="No scenarios evaluated for the changed site.";
 $("caseCount").textContent="";
 updatePoint();
}
function compareCards(){
 let html="";
 for(const site of SITES){
  const s=state.data.sites[site],stats=Engine.siteStats(state.data,site);
  html+='<article class="compare-card"><h3>'+escape(s.name)+'</h3><small>'+escape(site)+" · "+s.lat+"°, "+s.lon_east+'°E</small><span class="count">'+stats.sunAbove+'/'+stats.count+'</span><small>Sun samples above LOCAL skyline by >0.25°</small><div class="counts"><span>'+stats.sunNear+' near-edge</span><span>'+stats.sunBelow+' possible local blocks</span></div><div class="counts"><span>Earth local blocks: '+stats.earthBelow+'</span><span>Unverified</span></div></article>';
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
 OUTSIDE_NASA_COVERAGE:"Time request extends outside the verified source timestamps",
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
 const pieces=original.reasons.map(r=>'<p class="reason"><strong>'+escape(reasonText[r.code]||r.code)+'</strong> · '+r.sampleCount+' sample(s); first '+escape(r.firstUtc||"n/a")+'</p>');
 const zero=original.reasons.length===0?'<p>No adverse point samples in this range under the provisional local and unshadowed reference screen; that does NOT establish uninterrupted illumination or a working link.</p>':pieces.join("");
 $("report").innerHTML='<div class="status-line"><strong class="'+headingClass+'">'+escape(stateLabel)+'</strong><p>Site '+escape(original.site)+' · '+escape(utcLabel(original.startUtc))+' · '+original.sampleCount+' real UTC samples inspected</p></div><div class="report-grid"><div><small>Minimum unshadowed 1-AU panel reference</small><strong>'+((original.minReferencePowerW===undefined)?"Unknown":fixed(original.minReferencePowerW,1)+" W")+'</strong></div><div><small>Min Sun local clearance</small><strong>'+((original.minSunLocalClearanceDeg===undefined)?"Unknown":formatDelta(original.minSunLocalClearanceDeg))+'</strong></div><div><small>Time Margin</small><strong class="unknown">UNKNOWN</strong></div></div>'+zero+'<p class="small-note">Potential conflicts are based on observed hourly NASA geometry and a <b>provisional</b> local terrain model. This is not a scientific verdict about actual continuous power, RF link, or safe landing.</p>';
 const count=report.candidateCount;
 $("caseCount").textContent=report.scannedCaseCount+" cases checked · "+count+" preliminary candidates · 0 certified alternatives";
 if(!count){
  $("alternatives").innerHTML='<div class="explain">No preliminary candidates met these user-entered requirements within the sampled NASA time range and allowed delay. This does not prove that no real lunar option exists. Try changing the date or explicitly making Earth visibility optional.</div>';
 }else{
  $("alternatives").innerHTML=report.candidates.map((a,i)=>{
   const caution=a.status==="edge_review";
   return '<div class="alternative"><div class="topline"><b>'+escape(state.data.sites[a.site].name)+'</b><span class="tag '+(caution?"caution":"good")+'">'+(caution?"Near edge":"Investigate")+'</span></div><p><strong>'+escape(utcLabel(a.startUtc))+'</strong></p><p>Start delay '+fixed(a.startDelayH,2)+' h · '+a.sampleCount+' original hourly samples · user delay budget left '+fixed(a.remainingUserDelayH,1)+' h · min distance-adjusted reference '+fixed(a.minReferencePowerW,1)+' W</p><p>Sun local clearance: '+formatDelta(a.minSunLocalClearanceDeg)+' · Time Margin: <b>UNKNOWN</b></p></div>';
  }).join("");
 }
 $("exportBtn").disabled=false;
}
function invalidate(){
 if(!state.report)return;
 state.report=null;$("exportBtn").disabled=true;
 $("report").innerHTML='<div class="empty-state">Mission inputs changed. Previous findings are no longer current; run the screening again.</div>';
 $("alternatives").textContent="Results invalidated by the changed settings.";$("caseCount").textContent="";
}
function exportReport(){
 if(!state.report)return;
 const payload={...state.report,source:"NASA/JPL Horizons; NASA LRO/LOLA, real dated source tables",science_warning:"PRELIMINARY SCREEN ONLY — NO VERIFIED LUNAR OPERATING WINDOW OR TIME MARGIN",challenge:"NASA Space Apps 2026 Lunar Landing Site Navigator"};
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
 $("powerOnly").addEventListener("click",()=>{
  $("earthRequired").checked=false;$("powerOnly").classList.add("selected");$("earthMode").classList.remove("selected");invalidate()});
 $("earthMode").addEventListener("click",()=>{
  $("earthRequired").checked=true;$("earthMode").classList.add("selected");$("powerOnly").classList.remove("selected");invalidate()});
 $("earthRequired").addEventListener("change",()=>{$("earthMode").classList.toggle("selected",$("earthRequired").checked);$("powerOnly").classList.toggle("selected",!$("earthRequired").checked)});
 $("planForm").addEventListener("submit",e=>{e.preventDefault();try{const req=formRequest();state.report=Engine.searchCases(state.data,req);$("inputStatus").textContent="Evaluated only authentic NASA point samples; every candidate still requires independent scientific verification.";render()}catch(err){$("report").innerHTML='<div class="unknown"><strong>Invalid input:</strong> '+escape(err.message)+'</div>';$("alternatives").textContent="No results.";state.report=null;$("exportBtn").disabled=true;}});
 $("exportBtn").addEventListener("click",exportReport);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})(typeof window!=="undefined"?window:globalThis);
