/* Scene geometry uses ENU (east +X, north -Z, up +Y); no power calculation. */
export function createPanelGuides(T,scene){
 const up=new T.Vector3(0,1,0),north=new T.Vector3(0,0,-1),east=new T.Vector3(1,0,0);
 const rayLength=5; // explanatory scene length, not an astronomical distance
 const rays=new T.Group(),uncertain=new T.Group(),geometry=new T.Group();scene.add(rays,uncertain,geometry);
 // Flat, translucent explanatory bands, not atmospheric scattering or irradiance.
 const bandGeometry=new T.BufferGeometry();bandGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(18),3));
 const band=new T.Mesh(bandGeometry,new T.MeshBasicMaterial({color:0xf6bf57,transparent:true,opacity:.13,side:T.DoubleSide,depthWrite:false,toneMapped:false}));scene.add(band);
 const longLines=[false,true].map(dashed=>{const group=new T.Group();scene.add(group);for(let i=0;i<3;i++){const buffer=new T.BufferGeometry();buffer.setAttribute('position',new T.BufferAttribute(new Float32Array(6),3));const material=dashed?new T.LineDashedMaterial({color:0xffd67b,dashSize:.55,gapSize:.38,transparent:true,opacity:.8,toneMapped:false,depthWrite:false}):new T.LineBasicMaterial({color:0xffd67b,transparent:true,opacity:.8,toneMapped:false,depthWrite:false});group.add(new T.Line(buffer,material));}return group;});
 const arrowSets=[rays,uncertain].map((group,index)=>[-.7,0,.7].map(offset=>{
  const arrow=new T.ArrowHelper(up,new T.Vector3(),rayLength,0xf6bf57,.35,.13);
  if(index){arrow.line.material.dispose();arrow.line.material=new T.LineDashedMaterial({color:0xf6bf57,dashSize:.04,gapSize:.025});arrow.line.computeLineDistances();arrow.cone.material.wireframe=true;}
  group.add(arrow);return {arrow,offset};
 }));
 const vertical=new T.ArrowHelper(up,new T.Vector3(),2,0xd8e1e9,.2,.08),normal=new T.ArrowHelper(up,new T.Vector3(),2,0x4bd4df,.2,.08);geometry.add(vertical,normal);
 const horizontal=new T.Mesh(new T.RingGeometry(.6,1.9,48),new T.MeshBasicMaterial({color:0xd8e1e9,transparent:true,opacity:.12,side:T.DoubleSide,depthWrite:false}));horizontal.rotation.x=-Math.PI/2;geometry.add(horizontal);
 const compass=new T.Group();scene.add(compass);compass.add(new T.ArrowHelper(north,new T.Vector3(0,.12,0),4,0xd8e1e9,.25,.1),new T.ArrowHelper(east,new T.Vector3(0,.12,0),4,0xd8e1e9,.25,.1));
 const horizon=new T.Mesh(new T.RingGeometry(5.8,5.83,96),new T.MeshBasicMaterial({color:0xd8e1e9,transparent:true,opacity:.4,side:T.DoubleSide,depthWrite:false}));horizon.rotation.x=-Math.PI/2;horizon.position.y=.12;scene.add(horizon);
 function makeArc(color){const buffer=new T.BufferGeometry();buffer.setAttribute('position',new T.BufferAttribute(new Float32Array(97*3),3));const line=new T.Line(buffer,new T.LineBasicMaterial({color}));geometry.add(line);return line;}
 const tiltArc=makeArc(0xd8e1e9),incidenceArc=makeArc(0xf6bf57),azimuthArc=makeArc(0x4bd4df);
 function arc(line,center,a,tangent,angle,radius){const data=line.geometry.attributes.position;for(let i=0;i<97;i++){const t=angle*i/96,p=a.clone().multiplyScalar(Math.cos(t)).addScaledVector(tangent,Math.sin(t)).multiplyScalar(radius).add(center);data.setXYZ(i,p.x,p.y,p.z);}data.needsUpdate=true;line.geometry.computeBoundingSphere();}
 function between(line,center,a,b,radius){const dot=Math.max(-1,Math.min(1,a.dot(b))),angle=Math.acos(dot),tangent=b.clone().addScaledVector(a,-dot);line.visible=tangent.lengthSq()>1e-16;if(line.visible)arc(line,center,a,tangent.normalize(),angle,radius);return angle;}
 return {update(panel,sun,state,enabled,request,guideLength=rayLength,pathLength=45){
  // Convert panel-local endpoints and normal to the same world ENU frame as sun.
  const center=panel.getWorldPosition(new T.Vector3()),orientation=panel.getWorldQuaternion(new T.Quaternion()),n=up.clone().applyQuaternion(orientation).normalize(),incoming=sun.clone().negate();
  rays.visible=state==='above';uncertain.visible=state==='near';geometry.visible=enabled;
  band.visible=state==='above';longLines[0].visible=state==='above';longLines[1].visible=state==='near';
  const face=n.dot(sun)>0 ? .09 : -.07;
  const near=[-.95,.95].map(x=>panel.localToWorld(new T.Vector3(x,face,0))),far=near.map(p=>p.clone().addScaledVector(sun,pathLength));
  const corners=[near[0],near[1],far[1],near[0],far[1],far[0]],positions=bandGeometry.attributes.position;corners.forEach((p,i)=>positions.setXYZ(i,p.x,p.y,p.z));positions.needsUpdate=true;bandGeometry.computeBoundingSphere();
  for(const group of longLines)group.children.forEach((line,i)=>{const p=near[0].clone().lerp(near[1],i/2),start=p.clone().addScaledVector(sun,pathLength),attribute=line.geometry.attributes.position;attribute.setXYZ(0,start.x,start.y,start.z);attribute.setXYZ(1,p.x,p.y,p.z);attribute.needsUpdate=true;line.geometry.computeBoundingSphere();if(line.material.isLineDashedMaterial)line.computeLineDistances();});
  for(const set of arrowSets)for(const {arrow,offset}of set){const target=panel.localToWorld(new T.Vector3(offset,n.dot(sun)>0 ? .08 : -.06,offset===0 ? .45 : -.35));arrow.setLength(guideLength,.35,.13);arrow.position.copy(target).addScaledVector(sun,guideLength);arrow.setDirection(incoming);}
  vertical.position.copy(center);normal.position.copy(center);normal.setDirection(n);horizontal.position.copy(center);
  const incidence=between(incidenceArc,center,n,sun,1.55);between(tiltArc,center,up,n,1.15);
  const azimuthDefined=Math.sin(request.tilt*Math.PI/180)>1e-12;azimuthArc.visible=azimuthDefined;if(azimuthDefined)arc(azimuthArc,center,north,east,request.azimuth*Math.PI/180,1.85);
  return {incidenceDeg:incidence*180/Math.PI,frontIlluminated:n.dot(sun)>0,azimuthDefined,pathFar:far};
 }};
}
