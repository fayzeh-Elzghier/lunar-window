/* Live calculation of the fixed reference scenario; no hard-coded successful outputs. */
(function(){
'use strict';
const $=id=>document.getElementById(id),slides=[...document.querySelectorAll('.slide')];let index=0;
function show(i,focus=true){
 index=Math.min(slides.length-1,Math.max(0,i));
 slides.forEach((slide,n)=>{slide.hidden=n!==index;slide.classList.toggle('active',n===index);});
 $('count').textContent=(index+1)+' / '+slides.length;$('prev').disabled=index===0;$('next').disabled=index===slides.length-1;
 history.replaceState(null,'','#slide-'+(index+1));if(focus)slides[index].focus({preventScroll:true});
}
$('next').addEventListener('click',()=>show(index+1));$('prev').addEventListener('click',()=>show(index-1));
document.addEventListener('keydown',e=>{if(['ArrowRight','PageDown','ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();show(index+(['ArrowRight','PageDown'].includes(e.key)?1:-1));}});
show(Number((location.hash.match(/slide-(\d+)/)||[])[1]||1)-1,false);
try{
 const E=window.LunarEngine,D=E.assertData(window.LUNAR_DATA),q=E.requestFromObject({site:'Site01',start:'2026-12-21T00:00',durationH:6,requiredW:100,delayH:72,area:1.5,efficiency:25,tilt:60,azimuth:90,earthRequired:true,priority:'earliest'}),r=E.searchCases(D,q);
 const first=r.candidates[0],later=r.sensitivityCandidate;
 const w=n=>n.toFixed(3)+' W',time=s=>s.replace('T',' ').replace('.000Z',' UTC');
 $('slideOriginalPower').textContent=w(r.original.minEstimatedPowerW);
 $('slideNominalInterval').textContent=first.site+' · '+time(first.startUtc)+' to '+time(first.finishUtc);
 $('slideNominalPower').textContent=w(first.minEstimatedPowerW);$('slideNominalStress').textContent=w(first.sensitivity.minimumPowerW);
 $('slideSensitivityInterval').textContent=later.site+' · '+time(later.startUtc)+' to '+time(later.finishUtc);
 $('slideLaterNominal').textContent=w(later.minEstimatedPowerW);$('slideLaterStress').textContent=w(later.sensitivity.minimumPowerW);$('slideReserve').textContent=w(later.sensitivity.minimumPowerW-q.requiredW);
 const minutes=Math.round((Date.parse(later.startUtc)-Date.parse(first.startUtc))/60000);
 $('slideDelay').textContent='Additional delay: '+Math.floor(minutes/60)+' h '+String(minutes%60).padStart(2,'0')+' min. Remaining delay budget: '+later.remainingUserDelayH+' h. Same demand, duration, panel and Earth-visibility requirement.';
 $('slideCounts').textContent=r.sensitivityPassCount+' of '+r.candidateCount+' nominal candidates meet the ±1° test. '+r.severeSensitivityPassCount+' meet the wider ±5° test. Requirements were not relaxed.';
 window.ZenithPresentation={request:q,report:r};
}catch(e){for(const id of ['slideOriginalPower','slideNominalInterval','slideSensitivityInterval','slideCounts'])$(id).textContent='Source evidence unavailable. No decision can be calculated.';}
})();
