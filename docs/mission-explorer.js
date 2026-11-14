/* Selected-operation plots, using source timestamps and the existing engine. */
(function(){
'use strict';
const U=window.ZenithUI,E=window.LunarEngine;if(!U)return;
const {$,esc,utc,watts,state}=U;
const colors={sun:'#F6BF57',earth:'#4BD4DF',terrain:'#D8E1E9',grid:'#35485F',ink:'#F8FBFF'};
const names={original:'Original plan',nominal:'Earliest nominal candidate',sensitivity:'Sensitivity-test candidate'};
function node(tag,attributes={},text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attributes))n.setAttribute(key,String(value));if(text!==undefined)n.textContent=text;return n;}
function pointSensitivity(row,q){
 let min=Infinity;
 for(const dt of [-1,0,1])for(const da of [-1,0,1])min=Math.min(min,E.estimatedPower(row,{...q,tilt:Math.max(0,Math.min(90,q.tilt+dt)),azimuth:(q.azimuth+da+360)%360})*.9);
 return min;
}
function series(){
 if(!state.report)return null;
 const rows=U.rows(),q=state.report.request;
 return {rows,nominal:rows.map(row=>E.estimatedPower(row,q)),sensitivity:rows.map(row=>pointSensitivity(row,q))};
}
function base(svg,lo,hi,xmin,xmax,yLabel){
 const width=Math.max(240,Math.floor(svg.parentElement.clientWidth)),height=width<500?250:280,L=48,R=16,T=24,B=42;
 const W=width-L-R,H=height-T-B;
 svg.replaceChildren();svg.setAttribute('viewBox','0 0 '+width+' '+height);svg.style.height=height+'px';
 const X=x=>L+(x-xmin)/(xmax-xmin||1)*W,Y=y=>T+(hi-y)/(hi-lo||1)*H;
 for(let i=0;i<=4;i++){
  const y=lo+(hi-lo)*i/4;
  svg.append(node('line',{x1:L,x2:L+W,y1:Y(y),y2:Y(y),stroke:colors.grid}));
  svg.append(node('text',{x:L-8,y:Y(y)+4,'text-anchor':'end'},y.toFixed(hi-lo>20?0:1)));
 }
 svg.append(node('text',{x:L,y:12},yLabel));
 return {width,height,L,W,T,H,X,Y,line(pairs,color,attributes={}){svg.append(node('polyline',{points:pairs.map(([x,y])=>X(x)+','+Y(y)).join(' '),fill:'none',stroke:color,'stroke-width':2.3,'stroke-linejoin':'round',...attributes}));}};
}
function tick(svg,p,value,label){
 svg.append(node('line',{x1:p.X(value),x2:p.X(value),y1:p.T+p.H,y2:p.T+p.H+5,stroke:colors.terrain}));
 const x=p.X(value);svg.append(node('text',{x,y:p.height-19,'text-anchor':x<=p.L+1?'start':x>=p.L+p.W-1?'end':'middle'},label));
}
function plotPower(){
 const c=U.caseFor(),q=state.report.request,data=series(),svg=$('powerGraph');if(!data?.rows.length)return;
 const {rows,nominal,sensitivity}=data;
 const start=Date.parse(c.startUtc),finish=Date.parse(c.finishUtc);
 const p=base(svg,0,Math.max(q.requiredW,...nominal,...sensitivity)*1.15,start,finish,'Power (W)');
 svg.setAttribute('data-selected-start',c.startUtc);svg.setAttribute('data-selected-finish',c.finishUtc);
 svg.prepend(node('title',{},names[state.selected]+' · '+utc(c.startUtc)+' to '+utc(c.finishUtc)));
 svg.append(node('rect',{x:p.X(start),y:p.T,width:p.X(finish)-p.X(start),height:p.H,fill:colors.terrain,opacity:'.035','data-operating-interval':'true'}));
 const pairs=values=>values.map((v,i)=>[Date.parse(rows[i][0]),v]);
 p.line(pairs(nominal),colors.sun,{'data-series':'nominal'});
 p.line(pairs(sensitivity),colors.sun,{'stroke-dasharray':'6 4','data-series':'sensitivity-envelope'});
 p.line([[start,q.requiredW],[finish,q.requiredW]],colors.ink,{'stroke-dasharray':'3 4','stroke-width':1.5,'data-series':'demand'});
 const ticks=p.width<500?[start,Date.parse(rows[Math.floor(rows.length/2)][0]),finish]:[start,...[.25,.5,.75].map(f=>Date.parse(rows[Math.floor((rows.length-1)*f)][0])),finish];
 [...new Set(ticks)].forEach(t=>tick(svg,p,t,new Date(t).toISOString().slice(11,16)));
 const row=rows[state.sourceIndex],t=Date.parse(row[0]);
 svg.append(node('line',{x1:p.X(t),x2:p.X(t),y1:p.T,y2:p.T+p.H,stroke:colors.terrain,'stroke-dasharray':'3 3'}));
 for(const [value,name] of [[nominal[state.sourceIndex],'nominal'],[sensitivity[state.sourceIndex],'sensitivity']]){
  const circle=node('circle',{cx:p.X(t),cy:p.Y(value),r:4,fill:name==='nominal'?colors.sun:'#08172D',stroke:colors.sun,'stroke-width':2,'data-source-utc':row[0],'data-point':name});
  circle.append(node('title',{},utc(row[0])+' · '+name+' '+watts(value)));svg.append(circle);
 }
 $('powerCaption').textContent='UTC source timestamps within the requested operation. Samples include the start and exclude the finish; connecting lines are visual guides.';
 $('demandLegend').innerHTML='<i class="line-key demand"></i>Demand '+esc(q.requiredW)+' W';
}
function plotHorizon(){
 const c=U.caseFor(),q=state.report.request,row=U.rows()[state.sourceIndex],svg=$('horizonGraph');if(!row)return;
 const bins=window.LUNAR_HORIZONS?.sites?.[c.site]?.elevation_deg;
 if(!Array.isArray(bins)||bins.length!==360||!bins.every(Number.isFinite)){svg.replaceChildren();$('geometryReadout').textContent='Horizon-profile data unavailable. No substitute terrain profile has been generated.';$('instantComparison').replaceChildren();return;}
 const lo=Math.min(0,...bins,row[2],row[4])-.6,hi=Math.max(0,...bins,row[2],row[4])+.8;
 const p=base(svg,lo,hi,0,360,'Elevation (°)');
 svg.setAttribute('data-source-utc',row[0]);svg.prepend(node('title',{},'Sun and Earth centers at '+utc(row[0])+' · '+c.site));
 p.line(bins.map((v,i)=>[i,v]).concat([[360,bins[0]]]),colors.terrain,{'data-series':'terrain'});
 p.line([[0,0],[360,0]],colors.grid,{'stroke-dasharray':'3 4','stroke-width':1});
 const bearingTicks=p.width<500?[[0,'0° N'],[90,'90° E'],[180,'180° S'],[270,'270° W'],[360,'N']]:[[0,'0° North'],[90,'90° East'],[180,'180° South'],[270,'270° West'],[360,'360° N']];
 for(const [az,label]of bearingTicks)tick(svg,p,az,label);
 for(const [az,el,color,name]of [[row[1],row[2],colors.sun,'Sun'],[row[3],row[4],colors.earth,'Earth']]){
  const circle=node('circle',{cx:p.X(az),cy:p.Y(el),r:5,fill:color,'data-source-utc':row[0],'data-body':name.toLowerCase()});
  circle.append(node('title',{},name+' · '+az.toFixed(3)+'° azimuth / '+el.toFixed(3)+'° elevation'));svg.append(circle);
  const label=node('text',{x:Math.min(p.width-40,p.X(az)+8),y:Math.max(19,p.Y(el)-9)} ,name);label.style.fill=color;svg.append(label);
 }
 $('geometryReadout').innerHTML='<span><strong class="solar">Sun</strong> '+row[1].toFixed(3)+'° azimuth / '+row[2].toFixed(3)+'° elevation</span><span><strong class="earth">Earth</strong> '+row[3].toFixed(3)+'° azimuth / '+row[4].toFixed(3)+'° elevation</span>';
 const clearance=(r,id,col,az)=>{const status=E.labelClearance(r[col],id,r[az]).state;return (r[col]>=0?'+':'')+r[col].toFixed(3)+'°<small>'+({above:'above',below:'below',near:'near edge'}[status])+'</small>';};
 $('instantComparison').innerHTML=['Site01','Site04'].map(id=>{
  const source=U.bundle().sites[id].rows.find(r=>r[0]===row[0]);
  if(!source)return '<tr><th scope="row">'+id+'</th><td colspan="3">No common source timestamp</td></tr>';
  return '<tr data-source-utc="'+esc(source[0])+'"><th scope="row">'+esc(state.data.sites[id].name)+'<small>'+id+'</small></th><td>'+E.estimatedPower(source,q).toFixed(3)+' W</td><td>'+clearance(source,id,6,1)+'</td><td>'+clearance(source,id,8,3)+'</td></tr>';
 }).join('');
}
function render(){
 const c=U.caseFor(),rows=U.rows();
 $('visualization').hidden=!state.report||!state.inspectionOpen||!c||!rows.length;
 if($('visualization').hidden){$('powerGraph').replaceChildren();$('horizonGraph').replaceChildren();$('instantComparison').replaceChildren();return;}
 state.sourceIndex=Math.min(state.sourceIndex,rows.length-1);
 $('inspectTitle').textContent=(state.scope==='fine'?'Five-minute subset: ':'Full-range comparison: ')+names[state.selected]+' · '+state.data.sites[c.site].name;
 $('selectedInterval').textContent=utc(c.startUtc)+' → '+utc(c.finishUtc);
 $('applyCase').hidden=state.selected==='original';
 $('timeSlider').max=String(rows.length-1);$('timeSlider').value=String(state.sourceIndex);
 $('timeSlider').setAttribute('aria-valuetext',utc(rows[state.sourceIndex][0]));
 $('currentDate').textContent=utc(rows[state.sourceIndex][0]);
 $('currentDate').setAttribute('data-source-utc',rows[state.sourceIndex][0]);
 $('rangeStart').textContent=rows[0][0].slice(11,16)+' UTC';$('rangeEnd').textContent=rows.at(-1)[0].slice(11,16)+' UTC';
 $('viewCadence').textContent=(state.report.comparableCadenceSeconds/60)+'-minute source records · operating interval only. No interpolated ephemerides.';
 if(state.view==='power')plotPower();else plotHorizon();
}
function setTab(view,focus=false){
 state.view=view;
 for(const key of ['power','horizon']){
  const active=view===key,tab=$(key+'Tab');
  tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;$(key+'View').hidden=!active;
  if(active&&focus)tab.focus();
 }
 render();
}
for(const key of ['power','horizon']){
 $(key+'Tab').addEventListener('click',()=>setTab(key));
 $(key+'Tab').addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();setTab(event.key==='Home'?'power':event.key==='End'?'horizon':state.view==='power'?'horizon':'power',true);}});
}
$('timeSlider').addEventListener('input',()=>{state.sourceIndex=Number($('timeSlider').value);render();});
document.addEventListener('zenith-report-change',render);document.addEventListener('zenith-selection-change',render);
let lastWidth=0;
new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(Math.abs(width-lastWidth)>1){lastWidth=width;render();}}).observe($('visualization'));
window.ZenithCharts={series,pointSensitivity};
render();
})();
