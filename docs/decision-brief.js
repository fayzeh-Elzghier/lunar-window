/* A compact, source-derived explanation; never hides an unresolved result. */
(function(){
'use strict';const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const utc=s=>s.replace('T',' ').replace('.000Z',' UTC').replace('Z',' UTC');
const power=x=>Number.isFinite(x)?x.toFixed(1)+' W':'not evaluable';
function card(title,c,req){if(!c)return '<article><h3>'+title+'</h3><p>No candidate found within the permitted search. Requirements were not relaxed.</p></article>';
const net=c.minEstimatedPowerW-req.requiredW;
return '<article><h3>'+title+'</h3><p><b>'+escape(c.site)+'</b> · '+escape(utc(c.startUtc))+'</p><strong>'+power(c.minEstimatedPowerW)+'</strong><p>Minimum modeled direct power · '+(Number.isFinite(net)?(net>=0?'+':'')+net.toFixed(1)+' W relative to demand':'insufficient data')+'</p><p>'+escape(c.status.replaceAll('_',' '))+'</p>'+(c.sensitivity?'<p>Stress minimum: <b>'+power(c.sensitivity.minimumPowerW)+'</b> · '+(c.sensitivity.passes?'meets':'does not meet')+' demand in the declared sensitivity test.</p>':'')+'</article>';}
document.addEventListener('lunar-report-change',event=>{
 const r=event.detail;if(!r){$('decisionBrief').innerHTML='<h2>Settings changed</h2><p>Run screening again to update the decision summary. Earlier results are no longer current.</p>';return;}
 const q=r.request,first=r.candidates[0],strong=r.sensitivityCandidate;
 $('decisionBrief').innerHTML='<div class="section-kicker">THE DECISION, IN ONE MINUTE</div><h2>Earliest does not always mean resilient.</h2><p>Keep <b>'+q.durationH+' hours</b>, <b>'+q.requiredW+' W</b>, '+(q.earthRequired?'geometric Earth visibility':'Earth visibility optional')+' and the same panel. Search only within <b>'+q.delayH+' hours</b> of permitted delay.</p><div class="decision-grid">'+card('1 · Original plan',r.original,q)+card('2 · First ranked candidate',first,q)+card('3 · First ranked stress-passing candidate',strong,q)+'</div><p><b>'+r.sensitivityPassCount+' of '+r.candidateCount+' nominal candidates</b> meet demand under 10% lower output and nine panel-orientation combinations (tilt/azimuth −1°, 0°, +1°, tilt clipped to 0–90°). With the wider ±5° profile, <b>'+r.severeSensitivityPassCount+'</b> candidates remain.</p><p class="small-note">This is an explicit what-if test, not a validated error bound. It does not cover eclipses, batteries, far-terrain uncertainty or RF contact. All three cases use the same requested operation; no requirement was silently relaxed.</p>'+(strong?'<button class="secondary" id="inspectStress" type="button">Inspect stress-passing candidate</button>':'');
 if(strong)$('inspectStress').addEventListener('click',()=>{
  const remaining=Math.max(0,(q.startMs+q.delayMs-Date.parse(strong.startUtc))/3600000);
  $(strong.site.toLowerCase()+'Btn').click();$('startUtc').value=strong.startUtc.slice(0,16);$('delayH').value=String(remaining);
  $('planForm').dispatchEvent(new Event('input',{bubbles:true}));$('planForm').requestSubmit();
 });
});
})();
