/* Current English-only evidence, exports and print brief. */
(function(){
'use strict';
const U=window.ZenithUI;if(!U)return;
const {$,state,esc,utc,watts}=U;
const title={original:'Original plan',nominal:'Earliest nominal candidate',sensitivity:'Candidate meeting the declared sensitivity test'};
function download(content,name,type){
 const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');
 a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function payload(){
 if(!state.report)return null;
 const c=U.caseFor(),row=U.rows()[state.sourceIndex];
 return {...state.report,inspectionScope:state.scope,project:'ZENITH — Lunar Landing Site Navigator',inspectedCase:state.selected,inspectedCaseResult:c,inspectedSourceUtc:row?.[0]||null,source:'NASA/JPL Horizons and LRO/LOLA',science_warning:'Preliminary point-sample screen. Not continuous operation, RF contact or landing-safety certification.'};
}
function sampledSlack(c){return Number.isFinite(c.sampledMarginMinutes)?U.elapsed(c.sampledMarginMinutes/60):'Unknown / not established ('+c.sampledMarginStatus+')';}
function printContent(){
 const r=state.report;if(!r)return '';
 const q=r.request,c=U.caseFor(),row=U.rows()[state.sourceIndex];
 const cases=[['original',r.original],['nominal',r.candidates[0]],['sensitivity',r.sensitivityCandidate]];
 return '<p>Inspection scope: '+esc(state.scope)+'; '+esc($('scopeStatus').textContent)+'</p><h1>ZENITH · Decision brief</h1><p>Locally prepared model report. Source times are calculated ephemeris predictions, not landed observations or report-generation times.</p>'+
  '<p><strong>Requested operation:</strong> '+esc(q.site)+' · '+esc(utc(q.startUtc))+' to '+esc(utc(new Date(q.startMs+q.durationMs).toISOString()))+'</p>'+
  '<p>'+q.durationH+' h · '+q.requiredW+' W demand · '+q.delayH+' h maximum delay · geometric Earth visibility '+(q.earthRequired?'required':'optional')+'. Latest permitted start: '+esc(utc(r.latestPermittedStartUtc))+'. This deadline applies to the start, not the finish.</p>'+
  '<p><strong>Panel assumptions:</strong> '+q.area+' m² · '+q.efficiency*100+'% · tilt '+q.tilt+'° · azimuth '+q.azimuth+'° · local radial vertical · 2 m above terrain.</p>'+
  cases.map(([key,v])=>'<article><h2>'+title[key]+'</h2>'+(v?'<p>'+esc(v.site)+' · '+esc(utc(v.startUtc))+' to '+esc(utc(v.finishUtc))+'</p><p>Nominal minimum: '+watts(v.minEstimatedPowerW)+'; difference from demand: '+(Number.isFinite(v.minEstimatedPowerW)?U.delta(v.minEstimatedPowerW-q.requiredW):'not evaluable')+'. Sensitivity minimum: '+watts(v.sensitivity?.minimumPowerW)+' · '+(v.sensitivity?(v.sensitivity.passes?'meets':'does not meet')+' power demand':'not calculated')+'.</p><p>Status: '+esc(v.status.replaceAll('_',' '))+'. Start delay: '+U.elapsed(v.startDelayH)+'. Remaining allowed delay: '+U.elapsed(v.remainingUserDelayH)+'. Reasons: '+esc(v.reasons.map(x=>x.code).join(', ')||'no adverse sampled conditions')+'.</p>'+
  '<p>Sample-based operating slack: '+esc(sampledSlack(v))+'. Nominal reference criteria only: positive Sun clearance, positive Earth clearance when required, and nominal reference power at least equal to demand. Excludes terrain-edge and sensitivity qualification; no between-sample continuity. Remaining allowance is permission to start later, not extra operating time. Continuous operating margin not established.</p>'+
  '<p>Cadence: '+v.cadenceSeconds+' s · '+v.sampleCount+' source points in [start, finish).</p>'+
  Object.entries(v.evidence?.sourceHashes||{}).map(([k,value])=>'<p>'+esc(k)+' SHA256: <code>'+esc(value)+'</code></p>').join('')+
  Object.entries(v.evidence?.sourceUrls||{}).map(([k,value])=>'<p>'+esc(k)+' source: <code>'+esc(value)+'</code></p>').join(''):'<p>No matching candidate within the permitted delay. Requirements unchanged.</p>')+'</article>').join('')+
  '<p><strong>Inspection:</strong> '+esc(title[state.selected])+' · '+esc(c?.site||'')+(row?' · source time '+esc(utc(row[0])):'')+'. Inspection does not change the requested operation.</p>'+
  '<p><strong>Common coverage:</strong> '+esc(utc(r.coverage.coverageStartUtc))+' to '+esc(utc(r.coverage.coverageEndUtc))+'; '+r.comparableCadenceSeconds+' s cadence.</p>'+
  '<p><strong>Sensitivity:</strong> 10% lower output and nine tilt/azimuth combinations at −1°, 0°, +1°; tilt clipped to 0–90°. '+r.sensitivityPassCount+' of '+r.candidateCount+' nominal candidates meet this test. '+r.severeSensitivityPassCount+' meet the wider ±5° test. These are illustrative assumptions, not validated uncertainty bounds.</p>'+
  (r.sensitivityCandidate?'<p>Reserve under the declared test: '+watts(r.sensitivityCandidate.sensitivity.minimumPowerW-q.requiredW)+'. Additional delay from the earliest nominal candidate: '+U.elapsed((Date.parse(r.sensitivityCandidate.startUtc)-Date.parse(r.candidates[0].startUtc))/3600000)+'.</p>':'')+
  '<p class="print-note"><strong>Limits:</strong> ideal fixed-panel direct power, binary Sun-center terrain blocking. No complete battery, eclipse, partial solar-disk, thermal or electrical-loss model. Earth-center visibility is not station-specific RF contact. Sampled success does not establish continuous operation, a physical time margin or landing safety. Full terrain/frame/datum validation is pending. Verification reuses the same ephemerides and terrain in a second arithmetic implementation.</p>';
}
function update(){
 const r=state.report,current=!!r;
 const fine=window.LUNAR_FINE_DATA,eligible=!!(r&&fine&&!r.coverage.useFine&&r.request.startMs>=Date.parse(fine.range_start_utc)&&r.request.startMs+r.request.durationMs<=Date.parse(fine.range_end_utc));
 $('fineSubset').disabled=!eligible;$('fineExplanation').textContent=!fine?'Fine-data bundle unavailable; only the common hourly comparison can be inspected.':eligible?'The full comparison uses common hourly cadence. This explicit subset reruns only covered five-minute starts with unchanged operation requirements; it is separate evidence, not a mixed-cadence ranking.':'Fine cadence requires the entire search to fit 20–25 Dec UTC; otherwise a common hourly comparison is used.';
 $('exportBtn').disabled=!current;$('printBrief').disabled=!current;$('exportCsv').disabled=!current||!U.rows().length;
 if(!current){
  $('printSummary').replaceChildren();$('reviewSummary').textContent='';
  $('evidenceStatus').textContent=state.phase==='stale'?'Inputs changed. Exports are disabled until you compare again.':state.phase==='missing'?'Required source evidence is missing or invalid. No export is available.':'Compare plans to attach current source coverage and evidence to a decision.';
  return;
 }
 $('evidenceStatus').textContent='Current '+state.scope+' comparison; common cadence: '+r.comparableCadenceSeconds/60+' minutes. Coverage: '+utc(r.coverage.coverageStartUtc)+' to '+utc(r.coverage.coverageEndUtc)+'. '+r.insufficientDataCount+' cases could not be evaluated.';
 $('reviewSummary').textContent=r.reviewCount+' near-edge cases are held for review and are not nominal candidates. '+r.potentialConflictCount+' cases show potential conflicts. No certified alternatives are claimed.';
 $('printSummary').innerHTML=printContent();
}
$('exportBtn').addEventListener('click',()=>{const p=payload();if(p)download(JSON.stringify(p,null,2),'zenith-decision.json','application/json');});
$('exportCsv').addEventListener('click',()=>{
 if(!state.report)return;const c=U.caseFor(),q=state.report.request,data=window.ZenithCharts.series();if(!data?.rows.length)return;
 const hashes=c.evidence.sourceHashes;
 const lines=['utc,site_id,case_key,sun_azimuth_deg,sun_elevation_deg,earth_azimuth_deg,earth_elevation_deg,sun_clearance_deg,earth_clearance_deg,sun_distance_au,nominal_w,sensitivity_lower_envelope_w,required_w,cadence_seconds,operation_start_utc,operation_finish_utc,sun_source_sha256,earth_source_sha256,lola_sha256,model,evaluated_start_utc,latest_permitted_start_utc,start_delay_h,remaining_allowed_delay_h,panel_area_m2,panel_efficiency_fraction,panel_tilt_deg,panel_azimuth_deg,earth_visibility_required,inspection_scope,sampled_operating_slack_minutes,sampled_slack_status,sampled_slack_criteria,continuous_operating_margin'];
 data.rows.forEach((row,i)=>lines.push([row[0],c.site,state.selected,row[1],row[2],row[3],row[4],row[6],row[8],row[9],data.nominal[i],data.sensitivity[i],q.requiredW,c.cadenceSeconds,c.startUtc,c.finishUtc,hashes.sun,hashes.earth,hashes.lola,'ideal_fixed_panel_binary_sun_center_no_eclipse_no_losses',q.startUtc,state.report.latestPermittedStartUtc,c.startDelayH,c.remainingUserDelayH,q.area,q.efficiency,q.tilt,q.azimuth,q.earthRequired,state.scope,Number.isFinite(c.sampledMarginMinutes)?c.sampledMarginMinutes:'',c.sampledMarginStatus,'nominal_reference_only_excludes_edge_and_sensitivity_qualification','not_established'].join(',')));
 download(lines.join('\n')+'\n','zenith-'+c.site+'-'+state.selected+'.csv','text/csv');
});
$('printBrief').addEventListener('click',()=>{if(!state.report)return;$('printSummary').innerHTML=printContent();window.print();});
document.addEventListener('zenith-report-change',update);document.addEventListener('zenith-selection-change',update);
$('timeSlider').addEventListener('input',update);
function activate(scope){
 const report=scope==='fine'?state.fineReport:state.mainReport;if(!report)return;
 state.scope=scope;state.report=report;state.selected='original';state.sourceIndex=0;state.inspectionOpen=false;state.phase=report.evaluationStatus==='candidates_found'?'ready':report.evaluationStatus;U.notify();
}
$('returnMain').addEventListener('click',()=>activate('main'));
$('fineSubset').addEventListener('click',()=>{
 if($('fineSubset').disabled||!state.mainReport)return;
 const original=state.mainReport.request,fine=window.LUNAR_FINE_DATA;
 const end=Math.min(original.startMs+original.delayMs,Date.parse(fine.range_end_utc)-original.durationMs),delay=end-original.startMs;
 if(delay<0){$('fineExplanation').textContent='No complete fine-data interval fits this request.';return;}
 const subset={...original,delayMs:delay,delayH:delay/3600000},report=window.LunarEngine.searchCases(state.data,subset);
 report.assessedRequest=subset;report.request=original;report.latestPermittedStartUtc=state.mainReport.latestPermittedStartUtc;
 const all=new Set([report.original,...report.candidates,...report.reviewCases,report.sensitivityCandidate,...report.siteSummaries.flatMap(v=>[v.earliestNominal,v.earliestSensitivity])].filter(Boolean));
 for(const c of all){c.startDelayH=(Date.parse(c.startUtc)-original.startMs)/3600000;c.remainingUserDelayH=(original.startMs+original.delayMs-Date.parse(c.startUtc))/3600000;c.latestPermittedStartUtc=report.latestPermittedStartUtc;}
 state.fineReport=report;activate('fine');
});
window.ZenithEvidence={payload,printContent};
update();
})();
