// Regenerate displayed series from original NASA samples through the active model.
const fs=require('node:fs'),vm=require('node:vm');const s={};s.window=s;vm.createContext(s);
for(const p of ['data/mission_dataset_far.js','data/mission_dataset_fine.js','data/lola_uncertainty.js','mission-console.js'])vm.runInContext(fs.readFileSync('docs/'+p,'utf8'),s);
const E=s.LunarEngine,q=E.requestFromObject({site:'Site01',start:'2026-12-21T00:00',durationH:6,requiredW:100,delayH:72,area:1.5,efficiency:25,tilt:60,azimuth:90,earthRequired:true,priority:'earliest'}),result=E.searchCases(s.LUNAR_DATA,q);
const c=result.candidates[0];if(c.startUtc!=='2026-12-21T12:40:00.000Z')throw Error('Demo changed: review presentation narrative');
function series(start){return s.LUNAR_FINE_DATA.sites.Site01.rows.filter(r=>Date.parse(r[0])>=start&&Date.parse(r[0])<start+q.durationMs).filter((r,i)=>i%6===0).map(r=>Number(E.estimatedPower(r,q).toFixed(3)));}
let p='docs/judges-slides.html',h=fs.readFileSync(p,'utf8');h=h.replace(/const source=\{[\s\S]*?\};/, 'const source='+JSON.stringify({original:series(q.startMs),candidate:series(Date.parse(c.startUtc))})+';');fs.writeFileSync(p,h);console.log('Updated presentation from real NASA rows');
