/* Explanatory WebGL scene; scientific values remain engine outputs.
 * ENU mapping: east +X, north -Z, up +Y. No geometry-derived visibility. */
(function(){
'use strict';
const host=document.getElementById('lunarScene'),message=document.getElementById('threeStatus');
let latest=null,loading=null,view=null,failed=false;
const sceneControls=['overviewView','surfaceView','resetThreeView','focusLander','focusPanel','lookSun','lookEarth','showSceneGeometry','detailLighting'];
function fallback(text){message.textContent=text;document.getElementById('sceneLimitations').open=true;for(const id of sceneControls)document.getElementById(id).disabled=true;}
async function load(){
 if(view||failed)return;
 if(location.protocol==='file:'){failed=true;fallback('3D requires HTTP. From the project folder run: python -m http.server 8765 --bind 127.0.0.1 --directory docs, then open http://127.0.0.1:8765/mission-console.html. Numerical results remain available.');return;}
 if(!loading)loading=Promise.all([import('./vendor/three/three.module.js'),import('./vendor/three/OrbitControls.js'),import('./lunar-models.js'),import('./lunar-geometry.js')]);
 try{const [T,{OrbitControls},{buildLunarModels},{createPanelGuides}]=await loading;if(!view&&latest)view=create(T,OrbitControls,buildLunarModels,createPanelGuides);if(view&&latest)view.update(latest);}
 catch(error){view?.dispose();view=null;failed=true;fallback('3D could not load or WebGL is unavailable. Reload using the local HTTP server. Numerical results, source-time controls and charts remain accessible.');}
}
function create(T,OrbitControls,build,createGuides){
 const renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.setClearColor(0x000000);
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),sky=new T.Scene(),camera=new T.PerspectiveCamera(52,1,.1,130),skyCamera=new T.PerspectiveCamera(52,1,.1,200),abort=new AbortController();
 // The sky camera has orientation only: foreground orbit/zoom cannot add parallax.
 const skyRadius=100,celestialDirections={sun:new T.Vector3(),earth:new T.Vector3()},indicators={};
 renderer.autoClear=false;
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.enablePan=false;controls.minDistance=7.5;controls.maxDistance=35;controls.maxPolarAngle=Math.PI*.49;
 const overlay=document.createElement('div');overlay.className='object-overlays';host.append(renderer.domElement,overlay);
 const extension=document.createElementNS('http://www.w3.org/2000/svg','svg');extension.classList.add('sunlight-extension');extension.setAttribute('aria-hidden','true');overlay.append(extension);
 const extensionBand=document.createElementNS('http://www.w3.org/2000/svg','polygon');extensionBand.setAttribute('fill','#f6bf57');extensionBand.setAttribute('fill-opacity','.06');extension.append(extensionBand);
 const extensionLines=Array.from({length:3},()=>{const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('stroke','#ffd67b');line.setAttribute('stroke-opacity','.65');line.setAttribute('stroke-width','1.3');extension.append(line);return line;});
 const earthExtension=document.createElementNS('http://www.w3.org/2000/svg','svg'),earthExtensionLine=document.createElementNS('http://www.w3.org/2000/svg','line');earthExtension.classList.add('sunlight-extension');earthExtension.setAttribute('aria-hidden','true');earthExtensionLine.setAttribute('stroke','#4bd4df');earthExtensionLine.setAttribute('stroke-width','1.8');earthExtension.append(earthExtensionLine);overlay.append(earthExtension);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),leaders={};svg.classList.add('object-leaders');svg.setAttribute('aria-hidden','true');overlay.append(svg);
 renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Interactive lunar lander. Drag to orbit, scroll or pinch to zoom; arrows orbit, + and - zoom, Home resets.');
 const labels={};let selected=null,observer=null,models=null,guides=null,geometryValues=null,contextLost=false,sampleReady=false,sceneMode='overview',earthPathStart=null;
 const geometryToggle=document.getElementById('showSceneGeometry'),geometryReadout=document.getElementById('sceneGeometryReadout'),values=document.getElementById('sceneValues');
 const detailLighting=document.getElementById('detailLighting');
 const detail=document.getElementById('objectDetail');
 const origin=new T.Vector3(0,1.5,0),up=new T.Vector3(0,1,0);
 const light=new T.DirectionalLight(0xfffaf5,3.5);light.castShadow=true;light.shadow.mapSize.set(2048,2048);
 Object.assign(light.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.5,far:60});light.shadow.bias=-.0003;light.shadow.normalBias=.025;
 light.target.position.copy(origin);scene.add(light,light.target);
 const fill=new T.HemisphereLight(0xe4efff,0x727989,1.15),cameraFill=new T.DirectionalLight(0xe8efff,1.6);
 // Display-only fill makes geometry readable even when actual sunlight is withheld.
 cameraFill.target.position.copy(origin);scene.add(fill,cameraFill,cameraFill.target);
 function direction(az,el){const a=az*Math.PI/180,e=el*Math.PI/180;return new T.Vector3(Math.cos(e)*Math.sin(a),Math.sin(e),-Math.cos(e)*Math.cos(a)).normalize();}
 function stateFor(body){return window.LunarEngine.labelClearance(latest.row[body==='sun'?6:8],latest.site,latest.row[body==='sun'?1:3]).state;}
 const status={above:'Above sampled terrain',below:'Blocked by sampled terrain',near:'Uncertain near horizon'};
 const degrees=value=>Number.isFinite(value)?value.toFixed(2)+'\u00b0':'Not defined';
 const siteData=()=>window.ZenithUI.state.data.sites[latest.site];
 function captions(){
  const r=latest.row,q=latest.request,power=window.LunarEngine.estimatedPower(r,q),balance=power-q.requiredW;
  return {lander:'Solar panel\n'+power.toFixed(2)+' W modeled / '+q.requiredW+' W required\n'+Math.abs(balance).toFixed(2)+' W '+(balance>=0?'surplus':'shortfall'),site:'Selected lunar site\n'+siteData().name+' · '+latest.site,sun:'Sunlight → panel\nSun elevation '+degrees(r[2])+'\n'+status[stateFor('sun')],earth:'Earth → selected site\nElevation '+degrees(r[4])+' · azimuth '+degrees(r[3])+'\n'+status[stateFor('earth')]+' · geometric guide only'};
 }
 function details(){
  if(!latest||!selected){detail.textContent='';detail.hidden=true;return;}
  detail.hidden=false;
  const r=latest.row,q=latest.request;
  if(selected==='lander'){const power=window.LunarEngine.estimatedPower(r,q);detail.textContent='Lander / panel: '+power.toFixed(3)+' W modeled; '+q.requiredW+' W required; '+Math.abs(power-q.requiredW).toFixed(3)+' W '+(power>=q.requiredW?'surplus':'shortfall')+'. Illustrative spacecraft, not a NASA flight configuration.';}
  else if(selected==='site'){const site=siteData();detail.textContent=site.name+' · '+latest.site+': '+degrees(site.lat)+' latitude, '+degrees(site.lon_east)+' east longitude from the selected dataset. The marker locates this site in its local frame; the exaggerated Moon curvature is not a georeferenced whole-Moon map.';}
  else{const sun=selected==='sun',e=sun?2:4,c=sun?6:8;detail.textContent=(sun?'Sun':'Earth')+': elevation '+degrees(r[e])+' above local horizontal; azimuth '+degrees(r[sun?1:3])+'. '+status[stateFor(selected)]+'. '+(geometryToggle.checked?'Terrain clearance '+degrees(r[c])+'. ':'')+(sun?'Visibility alone does not establish sufficient power.':'Geometric visibility is not a verified radio connection. Elevation is not axial tilt. Earth orientation illustrative.');}
 }
 function projectDirection(key){
  // A direction has no observer translation. Project it in camera axes only.
  const d=celestialDirections[key].clone().applyQuaternion(camera.quaternion.clone().invert()),behind=d.z>=0;
  const focal=1/Math.tan(camera.fov*Math.PI/360),depth=Math.max(Math.abs(d.z),1e-6);
  let x=d.x*focal/(camera.aspect*depth),y=d.y*focal/depth;
  if(behind&&Math.hypot(x,y)<1e-6){x=0;y=1;}
  return {x,y,z:behind?2:0,behind,off:behind||Math.abs(x)>1||Math.abs(y)>1};
 }
 function placeSunlightExtension(){
  extension.style.display='none';if(!geometryValues||stateFor('sun')==='below')return;
  const source=projectDirection('sun');if(source.behind)return;
  const far=geometryValues.pathFar;
  if(far.some(p=>p.clone().applyMatrix4(camera.matrixWorldInverse).z>=-.1))return;
  const w=host.clientWidth,h=host.clientHeight,toPixels=p=>({x:(p.x*.5+.5)*w,y:(-p.y*.5+.5)*h});
  if(source.off){const edge=.92/Math.max(Math.abs(source.x),Math.abs(source.y));source.x*=edge;source.y*=edge;}
  const start=toPixels(source),ends=far.map(p=>toPixels(p.clone().project(camera))),uncertain=stateFor('sun')==='near';
  if(source.off){start.x=Math.max(18,Math.min(w-18,start.x));start.y=Math.max(18,Math.min(h-18,start.y));}
  extension.setAttribute('viewBox','0 0 '+w+' '+h);extension.style.display='block';extensionBand.style.display=uncertain?'none':'';
  extensionBand.setAttribute('points',[start,...ends].map(p=>p.x+','+p.y).join(' '));
  extensionLines.forEach((line,i)=>{const t=i/2,end={x:ends[0].x+(ends[1].x-ends[0].x)*t,y:ends[0].y+(ends[1].y-ends[0].y)*t};line.setAttribute('x1',start.x);line.setAttribute('y1',start.y);line.setAttribute('x2',end.x);line.setAttribute('y2',end.y);line.setAttribute('stroke-dasharray',uncertain?'6 5':'none');});
 }
 function placeEarthExtension(){
  earthExtension.style.display='none';if(sceneMode!=='overview'||!earthPathStart)return;
  const source=projectDirection('earth');if(source.behind||earthPathStart.clone().applyMatrix4(camera.matrixWorldInverse).z>=-.1)return;
  const w=host.clientWidth,h=host.clientHeight;
  if(source.off){const edge=.92/Math.max(Math.abs(source.x),Math.abs(source.y));source.x*=edge;source.y*=edge;}
  const end=earthPathStart.clone().project(camera);
  earthExtension.setAttribute('viewBox','0 0 '+w+' '+h);earthExtension.style.display='block';
  earthExtensionLine.setAttribute('x1',Math.max(18,Math.min(w-18,(source.x*.5+.5)*w)));earthExtensionLine.setAttribute('y1',Math.max(18,Math.min(h-18,(-source.y*.5+.5)*h)));earthExtensionLine.setAttribute('x2',(end.x*.5+.5)*w);earthExtensionLine.setAttribute('y2',(-end.y*.5+.5)*h);earthExtensionLine.setAttribute('stroke-dasharray',stateFor('earth')==='above'?'none':'6 5');
 }
 function placeLabels(){
  if(!models)return;
  const w=host.clientWidth,h=host.clientHeight,compact=w<760,placed=[],text=captions();
  values.classList.toggle('compact',compact);svg.setAttribute('viewBox','0 0 '+w+' '+h);
  camera.updateMatrixWorld();
  const corners=[[-1.6,-1.1],[-1.6,1.1],[1.6,-1.1],[1.6,1.1]].map(([x,z])=>models.panel.localToWorld(new T.Vector3(x,0,z)).project(camera));
  const panelBox={left:Math.min(...corners.map(p=>(p.x*.5+.5)*w))-8,right:Math.max(...corners.map(p=>(p.x*.5+.5)*w))+8,top:Math.min(...corners.map(p=>(-p.y*.5+.5)*h))-8,bottom:Math.max(...corners.map(p=>(-p.y*.5+.5)*h))+8};
  for(const key of ['lander','site','sun','earth']){
   labels[key].hidden=key==='site'&&sceneMode!=='overview';leaders[key].style.display=labels[key].hidden?'none':'';if(labels[key].hidden)continue;
   const celestial=key==='sun'||key==='earth',p=celestial?projectDirection(key):(key==='site'?models.siteAnchor:models.panel).getWorldPosition(new T.Vector3()).project(camera),off=celestial?p.off:p.z>1||p.z< -1||Math.abs(p.x)>1||Math.abs(p.y)>1;
   if(!celestial&&p.z>1){p.x=-p.x;p.y=-p.y;}
   // Only the direction indicator is clipped to the edge; sky geometry stays put.
   if(off){const edge=.92/Math.max(Math.abs(p.x),Math.abs(p.y),1e-6);p.x*=edge;p.y*=edge;}
   let x=(p.x*.5+.5)*w,y=(-p.y*.5+.5)*h;
   const anchor={x:Math.max(18,Math.min(w-18,x)),y:Math.max(18,Math.min(h-18,y))},arrow=p.behind?'\u21b6':['\u2192','\u2198','\u2193','\u2199','\u2190','\u2196','\u2191','\u2197'][(Math.round(Math.atan2(y-h/2,x-w/2)/(Math.PI/4))+8)%8],suffix=off?' '+arrow+(p.behind?' behind view':' off-screen'):'';
   const bodyState=celestial?stateFor(key):'',short=key==='lander'?'Solar panel':key==='site'?'Selected site · '+latest.site:(key==='sun'?'Sunlight → panel':'Earth direction')+' · '+({above:'above terrain',below:'BLOCKED',near:'UNCERTAIN'}[bodyState]);
   labels[key].textContent=short+suffix;
   if(celestial){const marker=indicators[key];marker.style.left=anchor.x+'px';marker.style.top=anchor.y+'px';marker.dataset.visibility=bodyState;marker.textContent=off?arrow:bodyState==='below'?'\u00d7':bodyState==='near'?'?':'';}
   const box=labels[key].getBoundingClientRect(),hw=box.width/2+5,hh=box.height/2+5;
   x=Math.max(hw,Math.min(w-hw,x));y=Math.max(hh,Math.min(h-hh,y-38));
   const candidates=[];for(const cy of [y,hh,h/2,h-hh])for(const cx of [x,hw,w-hw])candidates.push({x:cx,y:cy});
   for(let cy=hh;cy<=h-hh;cy+=24)for(const cx of [hw,w-hw])candidates.push({x:cx,y:cy});
   const clear=c=>!placed.some(other=>Math.abs(c.x-other.x)<hw+other.hw&&Math.abs(c.y-other.y)<hh+other.hh)&&!(c.x+hw>panelBox.left&&c.x-hw<panelBox.right&&c.y+hh>panelBox.top&&c.y-hh<panelBox.bottom);
   const free=candidates.find(clear);if(free){x=free.x;y=free.y;}
   labels[key].dataset.visibility=bodyState;placed.push({x,y,hw,hh});labels[key].style.left=x+'px';labels[key].style.top=y+'px';
   labels[key].setAttribute('aria-label',text[key]+suffix+'; select for details');
   const line=leaders[key];line.setAttribute('x1',anchor.x);line.setAttribute('y1',anchor.y);line.setAttribute('x2',x);line.setAttribute('y2',y);line.setAttribute('stroke-dasharray',off?'4 4':'none');
  }
  for(const [key,point]of [['north',new T.Vector3(0,.12,-4)],['east',new T.Vector3(4,.12,0)]]){const p=point.project(camera),tag=overlay.querySelector('.'+key);tag.hidden=p.z>1||Math.abs(p.x)>.95||Math.abs(p.y)>.95;tag.style.left=(p.x*.5+.5)*w+'px';tag.style.top=(-p.y*.5+.5)*h+'px';}
 }
 function draw(){if(latest&&sampleReady&&!contextLost&&!document.hidden&&!host.closest('[hidden]')){
  // Sky-focused orbit targets can be above/below the observer. Keep the camera
  // above the illustrative ground without changing source directions.
  camera.position.y=Math.max(camera.position.y,(sceneMode==='overview'?0:models.height(camera.position.x,camera.position.z))+.65);camera.lookAt(controls.target);camera.updateMatrixWorld();
  cameraFill.position.copy(camera.position).addScaledVector(up,5);
  skyCamera.quaternion.copy(camera.quaternion);skyCamera.updateMatrixWorld();
  renderer.clear();renderer.render(sky,skyCamera);renderer.clearDepth();renderer.render(scene,camera);placeSunlightExtension();placeEarthExtension();placeLabels();
 }}
 function setSceneMode(mode,frame=true){
  sceneMode=mode;const overview=mode==='overview';host.dataset.presentation=mode;
  models.overview.visible=overview;models.terrain.visible=!overview;models.rocks.visible=!overview;
  controls.minDistance=overview?18:7.5;controls.maxDistance=overview?65:35;camera.fov=overview?60:52;camera.updateProjectionMatrix();skyCamera.fov=camera.fov;skyCamera.updateProjectionMatrix();
  document.getElementById('overviewView').setAttribute('aria-pressed',String(overview));document.getElementById('surfaceView').setAttribute('aria-pressed',String(!overview));
  presentationNote();
  if(!overview&&selected==='site'){selected=null;for(const label of Object.values(labels))label.setAttribute('aria-expanded','false');}
  if(frame)reset();if(sampleReady&&latest)view?.update(latest);
 }
 function presentationNote(){document.getElementById('scenePresentationNote').textContent=sceneMode==='overview'?'Mission overview — curved Moon surface, selected site, panel sunlight and Earth direction. Curvature and relative object sizes are exaggerated; no orbit or radio connection is established.':'Surface detail — inspect the lander and panel at the selected lunar site. Terrain and spacecraft shape remain illustrative.';}
 function reset(){
  controls.maxPolarAngle=Math.PI*.49;
  if(sceneMode==='overview'){
   // Frame the supplied directions by moving only the camera, once per action.
   const bearing=celestialDirections.sun.clone().add(celestialDirections.earth).setY(0);
   if(bearing.lengthSq()<1e-6)bearing.copy(celestialDirections.sun).setY(0);if(bearing.lengthSq()<1e-6)bearing.set(0,0,-1);bearing.normalize();
   controls.target.set(-.6,1.4,0);camera.position.copy(controls.target).addScaledVector(bearing,-23).addScaledVector(up,7);
  }else{controls.target.set(-.4,1.9,0);camera.position.set(9,4,12);}
  controls.update();draw();
 }
 function focus(){setSceneMode('surface',false);controls.maxPolarAngle=Math.PI*.49;controls.target.set(-.6,1.8,0);camera.position.set(6.8,3.8,8.3);controls.update();draw();}
 function focusPanel(){
  setSceneMode('surface',false);
  const center=models.panel.getWorldPosition(new T.Vector3()),normal=up.clone().applyQuaternion(models.panel.getWorldQuaternion(new T.Quaternion())),side=new T.Vector3().crossVectors(up,normal);
  if(side.lengthSq()<1e-12)side.set(1,0,0);side.normalize();
  controls.maxPolarAngle=Math.PI*.49;controls.target.copy(center);camera.position.copy(center).addScaledVector(normal,8).addScaledVector(side,4).addScaledVector(up,2);controls.update();draw();
 }
 function lookToward(key){
  if(!latest)return;
  // Change only the camera's target. The ENU direction, timestamp and request stay fixed.
  controls.maxPolarAngle=Math.PI-.01;controls.target.copy(camera.position).addScaledVector(celestialDirections[key],12);controls.update();draw();
 }
 function dispose(){
  abort.abort();observer?.disconnect();controls.removeEventListener('change',draw);controls.dispose();
  const geometries=new Set(),materials=new Set(),textures=new Set();for(const layer of [scene,sky])layer.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
  for(const m of materials){for(const value of Object.values(m))if(value?.isTexture)textures.add(value);m.dispose();}
  for(const texture of textures)texture.dispose();for(const geometry of geometries)geometry.dispose();light.shadow.map?.dispose();renderer.dispose();renderer.domElement.remove();overlay.remove();
 }
 try{
  models=build(T,scene,sky);
  setSceneMode('overview',false);
  const horizonPoints=Array.from({length:128},(_,i)=>new T.Vector3(Math.sin(i*Math.PI/64)*95,0,-Math.cos(i*Math.PI/64)*95));
  sky.add(new T.LineLoop(new T.BufferGeometry().setFromPoints(horizonPoints),new T.LineBasicMaterial({color:0x78889a,transparent:true,opacity:.4})));
  guides=createGuides(T,scene);
  for(const [key,title]of [['north','N'],['east','E']]){const tag=document.createElement('span');tag.className='compass-label '+key;tag.textContent=title;overlay.append(tag);}
  for(const key of ['lander','site','sun','earth']){
   if(key==='sun'||key==='earth'){const marker=document.createElement('span');marker.className='celestial-indicator '+key;marker.setAttribute('aria-hidden','true');overlay.append(marker);indicators[key]=marker;}
   const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('stroke',key==='sun'?'#f6bf57':key==='earth'?'#4bd4df':key==='site'?'#f28d7d':'#d8e1e9');svg.append(line);leaders[key]=line;
   const button=document.createElement('button');button.type='button';button.className='object-label '+key;
   button.textContent=key;button.addEventListener('click',()=>{selected=selected===key?null:key;for(const [id,label]of Object.entries(labels))label.setAttribute('aria-expanded',String(id===selected));details();},{signal:abort.signal});
   button.setAttribute('aria-controls','objectDetail');button.setAttribute('aria-expanded','false');overlay.append(button);labels[key]=button;
  }
  controls.addEventListener('change',draw);
  for(const id of sceneControls)document.getElementById(id).disabled=false;
  document.getElementById('overviewView').addEventListener('click',()=>setSceneMode('overview'),{signal:abort.signal});
  document.getElementById('surfaceView').addEventListener('click',()=>setSceneMode('surface'),{signal:abort.signal});
  document.getElementById('resetThreeView').addEventListener('click',reset,{signal:abort.signal});
  document.getElementById('focusLander').addEventListener('click',focus,{signal:abort.signal});
  document.getElementById('focusPanel').addEventListener('click',focusPanel,{signal:abort.signal});
  document.getElementById('lookSun').addEventListener('click',()=>lookToward('sun'),{signal:abort.signal});
  document.getElementById('lookEarth').addEventListener('click',()=>lookToward('earth'),{signal:abort.signal});
  geometryToggle.addEventListener('change',()=>{if(latest)view?.update(latest);},{signal:abort.signal});
  detailLighting.addEventListener('change',()=>{if(latest)view?.update(latest);},{signal:abort.signal});
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();skyCamera.aspect=camera.aspect;skyCamera.fov=camera.fov;skyCamera.updateProjectionMatrix();draw();};
  observer=new ResizeObserver(resize);observer.observe(host);
  renderer.domElement.addEventListener('keydown',event=>{
   if(event.key==='Home'){event.preventDefault();reset();return;}
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(event.key))return;
   event.preventDefault();const offset=camera.position.clone().sub(controls.target);
   if(event.key==='+'||event.key==='-')offset.setLength(Math.max(controls.minDistance,Math.min(controls.maxDistance,offset.length()*(event.key==='+' ? .9 : 1.1))));
   else{const s=new T.Spherical().setFromVector3(offset);s.theta+=event.key==='ArrowLeft' ? .12 : event.key==='ArrowRight' ? -.12 : 0;s.phi=Math.max(.01,Math.min(controls.maxPolarAngle,s.phi+(event.key==='ArrowUp' ? -.1 : event.key==='ArrowDown' ? .1 : 0)));offset.setFromSpherical(s);}
   camera.position.copy(controls.target).add(offset);controls.update();draw();
  },{signal:abort.signal});
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;fallback('3D graphics context lost. Reload to restore the scene; numerical results remain available.');},{signal:abort.signal});
  document.addEventListener('visibilitychange',draw,{signal:abort.signal});reset();resize();
 }catch(error){dispose();throw error;}
 message.textContent='Drag to orbit; scroll/pinch to zoom. Keyboard arrows orbit, +/− zoom, Home resets. Sizes and distances not to scale.';
 return {update(data){
  // One normalized observer-to-body vector per source sample, in world ENU.
  // +s locates the sky Sun and light; guides travel along -s; incidence uses +s.
  const sun=celestialDirections.sun.copy(direction(data.row[1],data.row[2])),earth=celestialDirections.earth.copy(direction(data.row[3],data.row[4]));
  models.sun.position.copy(sun).multiplyScalar(skyRadius);models.earth.position.copy(earth).multiplyScalar(skyRadius);
  models.sun.visible=stateFor('sun')==='above';models.earth.visible=stateFor('earth')==='above';
  // Incoming Earth-to-destination guide: start at p + L*e, finish at the site pin.
  const earthDestination=models.siteAnchor.getWorldPosition(new T.Vector3()),earthPathLength=60;
  earthPathStart=earthDestination.clone().addScaledVector(earth,earthPathLength);
  for(const [i,arrow]of models.earthGuides.entries()){arrow.position.copy(earthPathStart);arrow.setDirection(earth.clone().negate());arrow.setLength(earthPathLength,.6,.22);arrow.visible=i===(stateFor('earth')==='above'?0:1);}
  models.panel.quaternion.setFromUnitVectors(up,direction(data.request.azimuth,90-data.request.tilt));
  light.position.copy(sun).multiplyScalar(24).add(origin);
  // Only the lander/panel cast shadows; illustrative terrain and rocks never
  // determine sky visibility. Direct light is withheld for blocked/uncertain samples.
  const sunState=stateFor('sun');light.intensity=sunState==='above'?3.5:0;
  fill.intensity=detailLighting.checked?1.15:.22;cameraFill.intensity=detailLighting.checked?1.6:0;
  geometryValues=guides.update(models.panel,sun,sunState,geometryToggle.checked,data.request,sceneMode==='overview'?9:5,sceneMode==='overview'?60:40);
  const facing=geometryValues.frontIlluminated?'Front face points toward the Sun; visible sunlight does not establish adequate power.':'Front face is not receiving direct modeled illumination (panel faces away from the Sun).';
  document.getElementById('sunlightGuideNote').textContent='Sun → panel at the selected lunar site. Gold bands trace the incoming direction; the thin sky continuation connects to the Sun marker or its off-screen indicator. These are schematic overlays, not atmospheric beams. '+(sunState==='near'?'UNCERTAIN: dashed paths show direction only, not confirmed illumination.':sunState==='below'?'BLOCKED by sampled terrain: sunlight path suppressed.':'The path ends at the panel; visible sunlight alone does not establish adequate power.')+' '+facing;
  geometryReadout.hidden=!geometryToggle.checked;
  geometryReadout.textContent='White ring: local horizontal; white arrow: local vertical; cyan arrow: outward panel normal. N = north, E = east. Tilt (white arc): '+degrees(data.request.tilt)+'; panel plane relative to local horizontal. Panel azimuth (cyan horizontal arc, clockwise from north): '+(geometryValues.azimuthDefined?degrees(data.request.azimuth):'Not defined (horizontal panel; entered azimuth '+degrees(data.request.azimuth)+')')+'. Incidence (amber arc, normal toward Sun): '+degrees(geometryValues.incidenceDeg)+'. Zero/180° arcs have no unique plane and are omitted. Sun azimuth '+degrees(data.row[1])+'; Earth azimuth '+degrees(data.row[3])+'. Terrain clearance (separate from elevation): Sun '+degrees(data.row[6])+', Earth '+degrees(data.row[8])+'.';
  values.textContent=Object.values(captions()).join('\n');
  host.dataset.sunState=sunState;
  message.textContent=(detailLighting.checked?'Detail lighting ON: neutral display light reveals spacecraft and terrain; it does not represent sunlight or change calculated power. ':'Detail lighting OFF. ')+(sunState==='near'?'UNCERTAIN: actual Sun lighting withheld because visibility is uncertain.':sunState==='below'?'BLOCKED: actual Sun lighting withheld.':'Sun is above sampled terrain; rendered lighting remains illustrative.')+' Drag to orbit; sizes and distances not to scale.';
  document.getElementById('sceneEpoch').textContent=data.scopeLabel+' · '+data.caseLabel+' · '+data.site+' · '+data.row[0]+' (UTC)';
  renderer.domElement.setAttribute('aria-label',data.description+' Illustrative 3D scene. Drag to orbit or use keyboard arrows.');
  if(!sampleReady)reset();sampleReady=true;presentationNote();details();draw();
 },dispose};
}
window.Zenith3D={update(data){latest=data;host.hidden=!data;if(data){if(view){try{view.update(data);}catch(error){view.dispose();view=null;failed=true;fallback('3D rendering failed. Reload to retry; numerical results and charts remain available.');}}else load();}else{for(const id of ['sceneEpoch','objectDetail','sceneValues','sunlightGuideNote','sceneGeometryReadout','scenePresentationNote'])document.getElementById(id).textContent='';}}};
window.addEventListener('pagehide',()=>{view?.dispose();view=null;});
window.addEventListener('pageshow',event=>{if(event.persisted&&latest)load();});
})();
