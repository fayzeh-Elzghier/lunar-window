/* Decision presentation only. Engine ranking and qualification are unchanged. */
(function(){
'use strict';
const U=window.ZenithUI;if(!U)return;
const {$,esc,utc,watts,elapsed,state}=U;
const titles={original:'Original plan',nominal:'Earliest nominal option',sensitivity:'Sensitivity-tested option'};
const verdicts={research_candidate:'Requirements met in sampled model',potential_conflict:'Requirements not met',edge_review:'Terrain-edge review required',insufficient_data:'Insufficient source data'};
const outcome=c=>c?.status==='research_candidate'?'met':c?.status==='potential_conflict'?'conflict':c?.status==='edge_review'?'review':'unknown';
const title=key=>key==='nominal'&&state.report?.request.priority!=='earliest'?'First-ranked nominal option':titles[key];
const same=(a,b)=>!!a&&!!b&&a.site===b.site&&a.startUtc===b.startUtc;
const power=n=>Number.isFinite(n)?watts(n):'Not established';
const testText=c=>!c.sensitivity?'Not evaluated':c.sensitivity.passes?'Power test met':'Power test not met';
function reason(c,q){
 if(!c?.sampleCount)return 'The source records cannot evaluate the full requested interval.';
 if(c.status==='edge_review')return 'Near the sampled terrain horizon; this plan remains unresolved.';
 const has=code=>c.reasons.some(r=>r.code===code),parts=[];
 if(has('SUN_LOCAL_SCREEN_BELOW_HORIZON'))parts.push('Sun is blocked by sampled terrain');
 if(has('EARTH_LOCAL_SCREEN_BELOW_HORIZON'))parts.push('required Earth visibility is blocked');
 if(Number.isFinite(c.minEstimatedPowerW)&&c.minEstimatedPowerW<q.requiredW)parts.push('minimum power is '+watts(q.requiredW-c.minEstimatedPowerW)+' below demand');
 return parts.length?parts.join('; ')+'.':'Power and required visibility meet the nominal criteria at the sampled times.';
}
function metric(label,value){return '<div><dt>'+esc(label)+'</dt><dd>'+esc(value)+'</dd></div>';}
function smallReserve(c,q){const v=c.sensitivity?.minimumPowerW;return c.sensitivity?.passes&&Number.isFinite(v)&&v-q.requiredW<=Math.max(1,q.requiredW*.01);}
function card(c,keys,q,first){
 const key=keys[0],test=c.sensitivity,reserve=Number.isFinite(test?.minimumPowerW)?test.minimumPowerW-q.requiredW:null;
 const extra=keys.includes('sensitivity')&&first?(Date.parse(c.startUtc)-Date.parse(first.startUtc))/3600000:null;
 const trade=key==='original'?reason(c,q):keys.includes('sensitivity')?'Passes nominal screening and the declared power sensitivity test.':test?.passes?'The first ranked nominal option also meets the declared power test.':'First ranked for this priority; the declared power sensitivity test is not met.';
 return '<article class="case-card" data-case="'+key+'" data-case-roles="'+keys.join(',')+'"><div class="card-heading"><h4>'+esc(title(key))+'</h4><span class="status-pill" data-outcome="'+outcome(c)+'">'+esc(verdicts[c.status]||'Not established')+'</span></div>'+
  (keys.length>1?'<p class="role-note">Also '+keys.slice(1).map(k=>esc(title(k).toLowerCase())).join(' · ')+' — same plan</p>':'')+
  '<p class="case-kind">'+esc(state.data.sites[c.site].name)+' · '+esc(c.site)+'</p><time class="case-start" datetime="'+esc(c.startUtc)+'">'+esc(utc(c.startUtc))+'</time>'+
  '<p class="case-power">'+esc(power(c.minEstimatedPowerW))+'</p><p class="metric-caption">Minimum nominal power · '+q.durationH+' h operation</p>'+
  '<dl class="card-metrics">'+metric('Start delay',elapsed(c.startDelayH))+metric('Sensitivity minimum',power(test?.minimumPowerW))+metric('Declared power test',testText(c))+
  (reserve!==null?metric(reserve>=0?'Reserve under test':'Shortfall under test',watts(Math.abs(reserve))):'')+(extra!==null?metric(extra<0?'Earlier than first nominal':'Wait beyond first nominal',elapsed(Math.abs(extra))):'')+'</dl>'+
  (smallReserve(c,q)?'<p class="reserve-warning" title="Display warning at or below the larger of 1 W and 1% of demand; this does not change scientific pass criteria.">Small test reserve: '+esc(watts(reserve))+'. Limited headroom under these assumptions.</p>':'')+
  '<p class="case-explanation">'+esc(trade)+'</p>'+
  (c.sampleCount?'<button class="secondary" type="button" data-inspect-case="'+key+'" aria-pressed="false" aria-label="Inspect '+esc(keys.map(title).join(' / '))+' at '+esc(c.site)+'">Inspect case</button>':'<p class="field-help">No complete source interval to inspect.</p>')+'</article>';
}
function emptyCard(key,r){return '<article class="case-card empty"><h4>'+esc(title(key))+'</h4><span class="status-pill" data-outcome="unknown">No assessed match</span><p>'+(key==='sensitivity'?'No nominal option meets the declared sensitivity test.':'No option passes nominal screening in the assessed start range.')+'</p><p class="field-help">'+(r.insufficientDataCount?'Coverage is partial; unevaluated starts remain unknown.':'This sampled finding does not prove that no feasible operation exists.')+'</p></article>';}
function updateSelection(){
 for(const node of document.querySelectorAll('[data-case]'))node.classList.toggle('selected',!!state.inspectionOpen&&(node.dataset.caseRoles||node.dataset.case).split(',').includes(state.selected));
 for(const b of document.querySelectorAll('[data-inspect-case]')){const group=b.closest('[data-case-roles]');b.setAttribute('aria-pressed',String(!!state.inspectionOpen&&(group?group.dataset.caseRoles.split(',').includes(state.selected):b.dataset.inspectCase===state.selected)));}
}
function timing(){
 const r=state.report,c=U.caseFor();$('timingPanel').hidden=!r||!c;
 if(!r||!c){$('timingMetrics').replaceChildren();$('timingDefinitions').replaceChildren();return;}
 $('timingCaseLabel').textContent=(state.inspectionOpen?'Inspecting: ':'Request: ')+title(state.selected);
 $('timingMetrics').innerHTML=metric('Start delay',elapsed(c.startDelayH))+metric('Remaining delay allowance',elapsed(c.remainingUserDelayH))+metric('Sample-based operating slack',Number.isFinite(c.sampledMarginMinutes)?elapsed(c.sampledMarginMinutes/60):'Not established')+metric('Physical continuous time margin','Not established');
 $('timingDefinitions').innerHTML='<dl class="definition-list">'+metric('Start delay','Selected start minus original evaluated start ('+utc(r.request.startUtc)+').')+metric('Remaining delay allowance','Permission to start later, not extra operating time. Original latest permitted start: '+utc(r.latestPermittedStartUtc)+'.')+metric('Sample-based slack','Passing source points after the operation, using nominal power and positive Sun/Earth clearance when required. Excludes terrain-edge and sensitivity qualification; no between-sample continuity. Status: '+c.sampledMarginStatus+'.')+metric('Continuous margin','Not established. Data cutoffs, missing samples and no observed later failure do not establish a physical boundary or a zero margin.')+'</dl>';
}
function renderTradeoffs(groups,q,first,stress,r){
 const scale=Math.max(q.requiredW,...groups.flatMap(g=>[g.value.minEstimatedPowerW,g.value.sensitivity?.minimumPowerW]).filter(Number.isFinite))*1.08;
 $('tradeoffContent').innerHTML=groups.map(({value:c,keys})=>{
  const nominal=c.minEstimatedPowerW,sensitive=c.sensitivity?.minimumPowerW,bar=(value,kind)=>Number.isFinite(value)?'<div class="power-bar '+kind+'"><span style="width:'+Math.max(0,value/scale*100)+'%"></span><i style="left:'+q.requiredW/scale*100+'%"></i></div>':'<span class="metric-caption">Not established</span>';
  return '<article class="tradeoff-option"><h4>'+esc(keys.map(title).join(' / '))+'</h4><div class="bar-caption"><span>Nominal</span><strong>'+esc(power(nominal))+'</strong></div>'+bar(nominal,'nominal')+'<div class="bar-caption"><span>Sensitivity</span><strong>'+esc(power(sensitive))+'</strong></div>'+bar(sensitive,'sensitivity')+'<p>'+esc(elapsed(c.startDelayH))+' wait · '+esc(elapsed(c.remainingUserDelayH))+' allowance left</p><p class="field-help">'+esc(c.site===q.site?'Original site retained':'Site change: '+c.site)+' · Sun clearance '+(Number.isFinite(c.minSunLocalClearanceDeg)?c.minSunLocalClearanceDeg.toFixed(3)+'°':'not established')+'</p></article>';
 }).join('');
 const extra=stress&&first?(Date.parse(stress.startUtc)-Date.parse(first.startUtc))/3600000:null;
 const waiting=same(first,stress)?'One plan fills both option roles; no additional wait between them. ':extra===0?'The options have the same start time at different sites. ':extra<0?'The sensitivity-tested option starts '+elapsed(-extra)+' before the first-ranked nominal option. ':'The sensitivity-tested option waits '+elapsed(extra)+' beyond the first nominal option. ';
 $('tradeoffNote').textContent=stress&&first?waiting+(smallReserve(stress,q)?'Its test reserve is small: ':'Reserve under the declared test: ')+watts(stress.sensitivity.minimumPowerW-q.requiredW)+'.':first?'Nominal screening passes, but no assessed nominal option meets the declared sensitivity test.':'No passing option in the assessed search. '+(r.insufficientDataCount?'Uncovered starts remain unknown.':'Requirements have not been relaxed.');
}
function renderEvidence(r){
 $('sensitivitySummary').hidden=!r;if(!r){$('siteOverview').replaceChildren();$('sensitivitySummary').textContent='';return;}
 $('sensitivitySummary').textContent='Declared exercise: 10% lower output, nine tilt/azimuth combinations at −1°, 0°, +1°. '+r.sensitivityPassCount+' of '+r.candidateCount+' nominal candidates meet this test; '+r.severeSensitivityPassCount+' meet the wider ±5° test. These are illustrative assumptions, not uncertainty bounds. '+r.insufficientDataCount+' cases lack sufficient coverage; '+r.reviewCount+' remain near-edge cases.';
 $('siteOverview').innerHTML=r.siteSummaries.map(v=>'<article class="site-evidence"><h4>'+esc(state.data.sites[v.site].name)+' · '+esc(v.site)+'</h4><p>'+r.comparableCadenceSeconds/60+'-minute records · '+esc(utc(r.coverage.coverageStartUtc))+' to '+esc(utc(r.coverage.coverageEndUtc))+'</p><p>Earliest nominal: '+(v.earliestNominal?esc(utc(v.earliestNominal.startUtc))+' · '+esc(watts(v.earliestNominal.minEstimatedPowerW))+' · delay '+esc(elapsed(v.earliestNominal.startDelayH)):'No match in assessed samples')+'</p><p>Earliest sensitivity-passing: '+(v.earliestSensitivity?esc(utc(v.earliestSensitivity.startUtc))+' · '+esc(watts(v.earliestSensitivity.sensitivity.minimumPowerW))+' · delay '+esc(elapsed(v.earliestSensitivity.startDelayH)):'No match in assessed samples')+'</p><p>'+v.assessedCount+' assessed cases · '+v.insufficientCount+' insufficient-coverage cases.</p></article>').join('');
}
function render(){
 const r=state.report;
 $('returnMain').hidden=!r||state.scope!=='fine';
 for(const id of ['optionsSection','tradeoffPanel','decisionLimits'])$(id).hidden=!r;
 $('decisionAction').hidden=!r;$('decisionAction').removeAttribute('data-inspect-case');
 $('resultStatus').dataset.state=state.phase;renderEvidence(r);
 if(!r){
  const messages={initial:['Configure your operation.','Compare plans to understand the original plan and available options.','No comparison yet'],busy:['Comparing your operation…','Both sites use the same operation requirements.','Calculation in progress'],stale:['Settings changed.','Compare plans again to update results. Previous exports and inspection are disabled.','Results outdated'],invalid:['Check your inputs.','Correct the marked fields before comparing.','Invalid configuration'],insufficient_data:['Source coverage is insufficient.','Choose supported dates and aligned boundaries; no requirements have been changed.','Cannot evaluate'],missing:['Source evidence is unavailable.','Check the local source files and reload. Comparison and exports are disabled.','No scientific result']};
  const m=messages[state.phase]||messages.initial;$('decisionTitle').textContent=m[0];$('decisionLead').textContent=m[1];$('resultStatus').textContent=m[2];$('resultStatus').dataset.outcome='unknown';
  for(const id of ['requestChips','decisionBrief','recommendation','tradeoffContent'])$(id).replaceChildren();$('scopeStatus').textContent='';timing();return;
 }
 const q=r.request,c=r.original,first=r.candidates[0],stress=r.sensitivityCandidate;
 const deficit=Number.isFinite(c.minEstimatedPowerW)&&c.minEstimatedPowerW<q.requiredW;
 $('decisionTitle').textContent=c.status==='potential_conflict'&&deficit?'Power falls '+watts(q.requiredW-c.minEstimatedPowerW)+' below demand.':'Original plan: '+(verdicts[c.status]||'Not established');
 $('decisionLead').textContent=reason(c,q);$('resultStatus').textContent='Original plan · '+(verdicts[c.status]||'Not established');$('resultStatus').dataset.outcome=outcome(c);
 $('requestChips').innerHTML=[q.durationH+' h operation',q.requiredW+' W required',q.earthRequired?'Earth visibility required':'Earth visibility not required','Minimum '+power(c.minEstimatedPowerW)].map(t=>'<span>'+esc(t)+'</span>').join('');
 $('scopeStatus').textContent=state.scope==='fine'?'Five-minute subset · assessed starts '+utc(r.assessedRequest.startUtc)+' to '+utc(new Date(r.assessedRequest.startMs+r.assessedRequest.delayMs).toISOString())+' · bounded evidence, not the entire permitted search.':'Full-range comparison · '+r.comparableCadenceSeconds/60+'-minute source records'+(r.insufficientDataCount?' · partial coverage':'');
 const roles=[['original',c],['nominal',first],['sensitivity',stress]],map=new Map();for(const [key,value]of roles){if(!value)continue;const id=value.site+'|'+value.startUtc;if(!map.has(id))map.set(id,{value,keys:[]});map.get(id).keys.push(key);}const groups=[...map.values()];
 $('decisionBrief').innerHTML=groups.map(g=>card(g.value,g.keys,q,first)).join('')+roles.filter(([,value])=>!value).map(([key])=>emptyCard(key,r)).join('');
 const priority={earliest:'Earliest start',keep:'Preserve requested site',clearance:'Solar terrain clearance'}[q.priority]||q.priority;
 $('recommendation').innerHTML='<span class="priority-label">Priority: '+esc(priority)+'</span><p>'+(first?'Prefer the '+(q.priority==='earliest'?'earliest':'first-ranked')+' nominal option for this priority. '+(first.sensitivity?.passes?'It also meets the declared power sensitivity test.':stress?'It does not meet the power sensitivity test; compare the tested option’s start delay and higher tested power.':'It does not meet the power sensitivity test; no assessed nominal option does.'):'No passing option in assessed data. Review the requirements or supported search period.')+'</p>';
 if(first){$('decisionAction').textContent=same(first,c)?'Explore evaluated options':'Alternative available — Explore options';}
 else if(c.sampleCount){$('decisionAction').textContent='Inspect original plan';$('decisionAction').dataset.inspectCase='original';}
 else $('decisionAction').textContent='Review configuration';
 renderTradeoffs(groups,q,first,stress,r);timing();updateSelection();
}
$('results').addEventListener('click',event=>{
 const button=event.target.closest('[data-inspect-case]');if(button&&state.report){U.inspect(button.dataset.inspectCase);return;}
 if(event.target.closest('#decisionAction')&&state.report){if(state.report.candidates.length){$('optionsTitle').focus({preventScroll:true});$('optionsTitle').scrollIntoView({block:'nearest'});}else $('siteSelect').focus();}
});
document.addEventListener('zenith-report-change',render);
document.addEventListener('zenith-selection-change',()=>{timing();updateSelection();});
render();
})();
