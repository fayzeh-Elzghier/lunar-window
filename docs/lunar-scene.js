/* 3D scene adapter and playback. All numeric states use the shared sourceIndex. */
(function(){
'use strict';
const U=window.ZenithUI,E=window.LunarEngine;if(!U)return;
const {$,state,esc,utc,watts,elapsed}=U;
const motion=matchMedia('(prefers-reduced-motion: reduce)');let timer=null;
function stop(){clearTimeout(timer);timer=null;$('playSource').textContent='Play';$('playSource').setAttribute('aria-pressed','false');}
function move(index){
 const rows=U.rows();if(!state.report||!rows.length){stop();return;}
 state.sourceIndex=Math.max(0,Math.min(rows.length-1,index));
 $('timeSlider').value=String(state.sourceIndex);$('timeSlider').dispatchEvent(new Event('input',{bubbles:true}));
}
function tick(){
 if(!state.report||state.sourceIndex>=U.rows().length-1){stop();return;}
 move(state.sourceIndex+1);
 if(state.sourceIndex>=U.rows().length-1){stop();return;}
 timer=setTimeout(tick,motion.matches?2000:1000);
}
const statusName={above:'Above sampled terrain',below:'Blocked by sampled terrain',near:'Uncertain near terrain edge'};
function stat(label,value){return '<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>';}
function render(){
 const c=U.caseFor(),rows=U.rows(),row=rows[state.sourceIndex],valid=!!state.report&&!!state.inspectionOpen&&!!row;
 for(const id of ['playSource','previousSource','nextSource','timeSlider'])$(id).disabled=!valid;
 $('sceneArea').hidden=!valid;
 if(!valid){stop();window.Zenith3D.update(null);$('instantStats').replaceChildren();$('operationStats').replaceChildren();$('operationTimingNote').textContent='';const q=state.report?.request;$('sceneAssumptions').textContent=q?'Captured panel: '+q.area+' m² · '+q.efficiency*100+'% efficiency · '+q.tilt+'° tilt · '+q.azimuth+'° azimuth. Original latest permitted start: '+utc(state.report.latestPermittedStartUtc)+'.':'';$('caseStatus').textContent='';$('sampleCoverage').textContent='';$('caseSelector').replaceChildren();$('caseSelector').disabled=true;return;}
 $('caseSelector').disabled=false;
 const choices=[['original','Original plan'],['nominal','Earliest nominal candidate'],['sensitivity','Sensitivity-tested candidate']];
 $('caseSelector').replaceChildren(...choices.map(([key,label])=>{const option=document.createElement('option');option.value=key;option.textContent=label+(U.caseFor(key)?'':' — unavailable');option.disabled=!U.caseFor(key);option.selected=key===state.selected;return option;}));
 const q=state.report.request,sun=E.labelClearance(row[6],c.site,row[1]),earth=E.labelClearance(row[8],c.site,row[3]),power=E.estimatedPower(row,q);
 $('caseStatus').textContent=({potential_conflict:'Conflict in the sampled operation',research_candidate:'Nominal candidate — not mission approval',edge_review:'Near-edge uncertainty — review required',insufficient_data:'Insufficient source coverage'}[c.status]||c.status);
 $('previousSource').disabled=state.sourceIndex===0;$('nextSource').disabled=state.sourceIndex===rows.length-1;$('playSource').disabled=rows.length<2||state.sourceIndex===rows.length-1;
 const sunText=statusName[sun.state],earthText=statusName[earth.state];
 const caseLabel={original:'Original plan',nominal:'Earliest nominal candidate',sensitivity:'Sensitivity-tested candidate'}[state.selected],scopeLabel=state.scope==='fine'?'Five-minute subset':'Full-range comparison';
 window.Zenith3D.update({row,site:c.site,request:q,caseLabel,scopeLabel,description:scopeLabel+'; '+caseLabel+'; '+c.site+' - '+utc(row[0])+'. Sun: '+sunText+'. Earth: '+earthText+'. Modeled panel power '+watts(power)+'.'});
 $('sceneStates').textContent='Sun: '+sunText+'. Earth: '+earthText+'. Power '+(power>=q.requiredW?'meets demand':'is below demand')+' at this sample. Visible Sun does not guarantee adequate power; Earth visibility is not an RF link.';
 $('instantStats').innerHTML='<div class="instant-chip panel-chip"><dt>Solar panel</dt><dd><strong>'+esc(watts(power))+'</strong><span>'+esc(watts(q.requiredW))+' required · '+esc(watts(Math.abs(power-q.requiredW)))+' '+(power>=q.requiredW?'surplus':'shortfall')+'</span></dd></div><div class="instant-chip sun-chip" data-state="'+sun.state+'"><dt>Sun</dt><dd><strong>'+row[2].toFixed(2)+'° <small>elevation</small></strong><span>'+esc(sunText)+'</span><span>Terrain clearance '+row[6].toFixed(3)+'°</span></dd></div><div class="instant-chip earth-chip" data-state="'+earth.state+'"><dt>Earth</dt><dd><strong>'+row[4].toFixed(2)+'° <small>elevation</small></strong><span>'+esc(earthText)+'</span><span>Terrain clearance '+row[8].toFixed(3)+'°</span></dd></div>';
 const slackKnown=Number.isFinite(c.sampledMarginMinutes);
 $('operationStats').innerHTML=stat('Minimum nominal power',watts(c.minEstimatedPowerW))+stat('Minimum under declared sensitivity test',watts(c.sensitivity?.minimumPowerW));
 $('operationTimingNote').textContent='Start delay is measured from '+utc(q.startUtc)+'. Remaining allowance is permission to start later, not extra operating time. Sample-based slack excludes terrain-edge and sensitivity qualification and does not establish between-sample continuity.'+(!slackKnown?' No measured slack is claimed: '+({RIGHT_CENSORED_BY_NASA_DATA_RANGE:'the source range ends without an observed later reference failure.',SOURCE_GAP:'a source gap prevents measuring the later reference run.',INITIAL_SCREEN_CONSTRAINTS_NOT_MET:'the operation does not meet the initial nominal screen.',REQUESTED_SAMPLES_NOT_ALL_PASSING:'the requested source samples do not all pass the nominal reference criteria.',NOT_OBSERVABLE_IN_SOURCE:'the needed source boundaries are unavailable.',NOT_COMPUTED:'the interval could not be evaluated.'}[c.sampledMarginStatus]||'the necessary passing samples and later failing boundary are not established.'):'');
 $('sampleCoverage').textContent='Included samples: '+utc(rows[0][0])+' to '+utc(rows.at(-1)[0])+'. Cadence: '+c.cadenceSeconds/60+' minutes. The requested finish above is excluded from the sampled operation.';
 $('sceneAssumptions').textContent='Evaluated panel: '+q.area+' m², '+q.efficiency*100+'% efficiency, '+q.tilt+'° tilt, '+q.azimuth+'° azimuth. Sample-based time slack: '+(c.sampledMarginMinutes===null?'unavailable ('+c.sampledMarginStatus+')':c.sampledMarginMinutes+' min under the nominal reference criteria, excluding terrain-edge and sensitivity qualification; no between-sample continuity')+'. Continuous operating margin not established.';
}
$('playSource').addEventListener('click',()=>{if(timer!==null){stop();return;}if(!state.report||state.sourceIndex>=U.rows().length-1)return;$('playSource').textContent='Pause';$('playSource').setAttribute('aria-pressed','true');timer=setTimeout(tick,motion.matches?2000:1000);});
$('previousSource').addEventListener('click',()=>{stop();move(state.sourceIndex-1);});
$('nextSource').addEventListener('click',()=>{stop();move(state.sourceIndex+1);});
$('caseSelector').addEventListener('change',()=>{stop();U.inspect($('caseSelector').value);});
$('timeSlider').addEventListener('pointerdown',stop);$('timeSlider').addEventListener('keydown',stop);$('timeSlider').addEventListener('input',render);
for(const event of ['zenith-report-change','zenith-selection-change'])document.addEventListener(event,()=>{stop();render();});
$('planForm').addEventListener('input',stop);$('planForm').addEventListener('change',stop);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
motion.addEventListener('change',stop);window.addEventListener('pagehide',stop);
render();
})();
