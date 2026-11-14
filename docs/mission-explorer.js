/* UI for the declared sampled model. No generated ephemeris samples. */
(function(){
"use strict";
const $=id=>document.getElementById(id),E=window.LunarEngine;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(x,n=2)=>Number(x).toFixed(n),utc=s=>s.replace('T',' ').replace('Z',' UTC');
function input(){return E.requestFromObject({site:site(),start:$("startUtc").value,durationH:$("durationH").value,requiredW:$("requiredPowerW").value,delayH:$("delayH").value,area:$("panelArea").value,efficiency:$("panelEfficiency").value,tilt:$("panelTilt").value,azimuth:$("panelAzimuth").value,earthRequired:$("earthRequired").checked,priority:$("priority").value});}
function site(){return document.querySelector('.site-btn[aria-pressed="true"]').dataset.site;}
function node(tag,attrs={},text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,String(v));if(text!==undefined)n.textContent=text;return n;}
function chart(svg,min,max,xmax,label){
 svg.replaceChildren();const L=60,T=15,W=780,H=215;if(max-min<1)max=min+1;
 const X=x=>L+x/xmax*W,Y=y=>T+(max-y)/(max-min)*H;
 for(let i=0;i<=4;i++){const y=min+(max-min)*i/4;svg.append(node('line',{x1:L,x2:L+W,y1:Y(y),y2:Y(y),stroke:'#34506a'}));svg.append(node('text',{x:3,y:Y(y)+4,fill:'#c5d9eb','font-size':12},fmt(y,1)));}
 svg.append(node('text',{x:60,y:264,fill:'#c5d9eb','font-size':12},label));
 return {X,Y,line:(pairs,color,dash)=>svg.append(node('polyline',{points:pairs.map(([x,y])=>X(x)+','+Y(y)).join(' '),fill:'none',stroke:color,'stroke-width':2,...(dash?{'stroke-dasharray':dash}:{})}))};
}
function eventText(rows,index,col){
 const e=E.nextSet(rows,index,col);
 if(e.status==='already_below')return 'Center is already at or below the modeled terrain horizon.';
 if(e.status==='beyond_coverage')return 'No sampled set before '+utc(e.coverageEndUtc)+'. Next set time is unknown.';
 return 'Next sampled above→below transition: '+utc(e.lastAboveUtc)+' to '+utc(e.firstBelowUtc)+'. From the selected epoch: '+fmt(e.minMinutes/60)+'–'+fmt(e.maxMinutes/60)+' h. Intermediate crossings may be missed.';
}
function refresh(){
 if(!window.LUNAR_DATA||!window.LUNAR_HORIZONS)return;
 const sid=site(),index=Number($("timeSlider").value),rows=window.LUNAR_DATA.sites[sid].rows,r=rows[index],profile=window.LUNAR_HORIZONS.sites[sid];
 const bins=profile.elevation_deg;
 const lo=Math.min(-2,r[2]-2,r[4]-2,...bins),hi=Math.max(3,r[2]+2,r[4]+2,...bins);
 const sky=chart($("horizonGraph"),lo,hi,360,'Azimuth: 0° North · 90° East · 180° South · 270° West · 360° North');
 sky.line(bins.map((v,i)=>[i,v]).concat([[360,bins[0]]]),'#93a9be');
 sky.line([[0,0],[360,0]],'#53687e','4 4');
 for(const [a,e,color,name]of [[r[1],r[2],'#f6c667','Sun'],[r[3],r[4],'#75d7f3','Earth']]){
  $("horizonGraph").append(node('circle',{cx:sky.X(a),cy:sky.Y(e),r:6,fill:color}));
  $("horizonGraph").append(node('text',{x:Math.min(sky.X(a)+9,785),y:sky.Y(e)-8,fill:color,'font-size':13},name));
 }
 $("skyText").textContent=sid+' · '+utc(r[0])+'. Sun clearance '+fmt(r[6])+'°; Earth clearance '+fmt(r[8])+'°. Profile: 1° bearing bins, near/far sampled terrain; markers are actual JPL samples.';
 $("setEvents").innerHTML='<article><h3>Sunset / terrain blocking</h3><p>'+esc(eventText(rows,index,6))+'</p></article><article><h3>Earthset / terrain blocking</h3><p>'+esc(eventText(rows,index,8))+'</p></article>';
 let req;try{req=input();}catch(e){$("powerDetails").textContent='Enter valid panel and mission settings to calculate estimated watts.';$("powerGraph").replaceChildren();$("exportCsv").disabled=true;return;}
 $("exportCsv").disabled=false;
 const powers=rows.map(x=>E.estimatedPower(x,req)),refs=rows.map(x=>E.referencePower(x,req));
 const plot=chart($("powerGraph"),0,Math.max(req.requiredW,...refs)*1.08,rows.length-1,'Hours since '+utc(rows[0][0])+' · original hourly samples');
 plot.line(refs.map((v,i)=>[i,v]),'#8397ad','5 5');plot.line(powers.map((v,i)=>[i,v]),'#f6c667');plot.line([[0,req.requiredW],[rows.length-1,req.requiredW]],'#fb8897','6 3');
 $("powerGraph").append(node('line',{x1:plot.X(index),x2:plot.X(index),y1:15,y2:230,stroke:'#fff','stroke-dasharray':'3 3'}));
 $("powerDetails").innerHTML='<div class="metric"><small>Estimated direct power now</small><strong>'+fmt(powers[index],1)+' W</strong></div><div class="metric"><small>Unshadowed reference now</small><strong>'+fmt(refs[index],1)+' W</strong></div><div class="metric"><small>Required power</small><strong>'+fmt(req.requiredW,1)+' W</strong></div>';
 $("instantComparison").innerHTML=['Site01','Site04'].map(id=>{
  const s=window.LUNAR_DATA.sites[id],v=s.rows[index],p=E.estimatedPower(v,req),sun=E.labelClearance(v[6],id,v[1]),earth=E.labelClearance(v[8],id,v[3]);
  return '<article class="compare-card"><h3>'+esc(s.name)+'</h3><p>'+esc(utc(v[0]))+'</p><strong>'+fmt(p,1)+' W estimated</strong><p>Sun: '+fmt(v[6])+'° clearance · '+esc(sun.state)+'</p><p>Earth: '+fmt(v[8])+'° clearance · '+esc(earth.state)+'</p><small>Same panel, same UTC epoch. Point estimate, not an operating-window verdict.</small></article>';
 }).join('');
}
function download(text,name,type){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function init(){
 if(!E||$("evaluate").disabled)return;
 document.addEventListener('lunar-point-change',refresh);
 $("planForm").addEventListener('input',refresh);$("planForm").addEventListener('change',refresh);
 $("loadDemo").addEventListener('click',()=>{
  $("site01Btn").click();for(const [id,value] of Object.entries({startUtc:'2026-12-21T00:00',durationH:6,requiredPowerW:100,delayH:72,panelArea:1.5,panelEfficiency:25,panelTilt:60,panelAzimuth:90,priority:'earliest'}))$(id).value=value;
  $("earthMode").click();$("planForm").dispatchEvent(new Event('input',{bubbles:true}));$("planForm").requestSubmit();refresh();$("demoFeedback").textContent='Sara’s example loaded. Hardware values are demonstration assumptions.';
 });
 $("delay30").addEventListener('click',()=>{try{const req=input();if(req.delayH<0.5)throw Error("A 30-minute shift exceeds the remaining delay budget.");$("delayH").value=String(req.delayH-0.5);$("startUtc").value=new Date(req.startMs+1800000).toISOString().slice(0,16);$("planForm").dispatchEvent(new Event('input',{bubbles:true}));$("planForm").requestSubmit();$("demoFeedback").textContent='Start moved 30 minutes later; remaining delay reduced by 30 minutes. Hardware requirements kept.';}catch(e){$("demoFeedback").textContent=e.message;}});
 $("alternatives").addEventListener('click',event=>{const b=event.target.closest('[data-apply-site]');if(!b)return;const req=input(),remaining=Math.max(0,(req.startMs+req.delayMs-Date.parse(b.dataset.applyStart))/3600000);$(b.dataset.applySite.toLowerCase()+'Btn').click();$("startUtc").value=b.dataset.applyStart.slice(0,16);$("delayH").value=String(remaining);$("planForm").dispatchEvent(new Event('input',{bubbles:true}));$("planForm").requestSubmit();$("demoFeedback").textContent='Alternative loaded. Remaining delay reduced to preserve the original latest start; hardware unchanged.';});
 $("exportCsv").addEventListener('click',()=>{try{const req=input(),id=site(),rows=window.LUNAR_DATA.sites[id].rows;
  const lines=['utc,site_id,sun_azimuth_deg,sun_elevation_deg,earth_azimuth_deg,earth_elevation_deg,sun_clearance_deg,earth_clearance_deg,sun_distance_au,unshadowed_reference_w,estimated_direct_power_w,required_w,model'];
  rows.forEach(r=>lines.push([r[0],id,r[1],r[2],r[3],r[4],r[6],r[8],r[9],E.referencePower(r,req),E.estimatedPower(r,req),req.requiredW,'binary_sun_center_no_eclipse_no_losses'].join(',')));
  download(lines.join('\n')+'\n','lunar-window-'+id+'-model.csv','text/csv');
 }catch(e){$("demoFeedback").textContent=e.message;}});
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
