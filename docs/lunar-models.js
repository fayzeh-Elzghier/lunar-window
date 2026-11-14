/* Original procedural artwork, not measured terrain or a spacecraft design. */
export function buildLunarModels(T,scene,sky){
 let seed=4127;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 function texture(size,paint,color=true){const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const ctx=canvas.getContext('2d');paint(ctx,size);const map=new T.CanvasTexture(canvas);if(color)map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;return map;}
 const grain=texture(512,(ctx,n)=>{const image=ctx.createImageData(n,n);for(let i=0;i<image.data.length;i+=4){const v=95+random()*75;image.data[i]=v;image.data[i+1]=v;image.data[i+2]=v;image.data[i+3]=255;}ctx.putImageData(image,0,0);},false);
 const regolith=texture(512,(ctx,n)=>{ctx.fillStyle='#92918d';ctx.fillRect(0,0,n,n);for(let i=0;i<22000;i++){const v=Math.floor(95+random()*75);ctx.fillStyle='rgba('+v+','+v+','+(v+2)+',0.25)';const r=.3+random()*3;ctx.fillRect(random()*n,random()*n,r,r);}for(let i=0;i<45;i++){ctx.fillStyle='rgba(50,50,52,0.035)';ctx.beginPath();ctx.ellipse(random()*n,random()*n,12+random()*50,12+random()*50,random()*Math.PI,0,Math.PI*2);ctx.fill();}});
 const roughness=texture(256,(ctx,n)=>{const image=ctx.createImageData(n,n);for(let i=0;i<image.data.length;i+=4){const v=215+random()*40;image.data[i]=image.data[i+1]=image.data[i+2]=v;image.data[i+3]=255;}ctx.putImageData(image,0,0);},false);
 const foil=texture(256,(ctx,n)=>{ctx.fillStyle='#888888';ctx.fillRect(0,0,n,n);for(let i=0;i<850;i++){const v=Math.floor(65+random()*120);ctx.strokeStyle='rgb('+v+','+v+','+v+')';ctx.lineWidth=.4+random();const x=random()*n,y=random()*n;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+random()*35-17,y+random()*35-17);ctx.stroke();}},false);
 const craters=[[-12,-8,2.3],[11,-10,3],[-14,13,3.1],[14,9,1.8],[5,16,1.2]];
 function height(x,z){const r=Math.hypot(x,z),pad=1-Math.exp(-(Math.max(0,r-4)**2)/15);let y=.07*Math.sin(x*.57)*Math.cos(z*.43)+.025*Math.sin(x*2.4+z*.8);for(const [cx,cz,size]of craters){const d=Math.hypot(x-cx,z-cz)/size;y+=.18*Math.exp(-(((d-1)/.16)**2))-.34*Math.exp(-((d/.75)**4));}return y*pad;}
 const terrainGeometry=new T.PlaneGeometry(88,88,160,160);terrainGeometry.rotateX(-Math.PI/2);const positions=terrainGeometry.attributes.position;
 for(let i=0;i<positions.count;i++)positions.setY(i,height(positions.getX(i),positions.getZ(i)));terrainGeometry.computeVertexNormals();
 const soil=new T.MeshStandardMaterial({map:regolith,bumpMap:grain,bumpScale:.025,roughnessMap:roughness,roughness:1,metalness:0,color:0xd8d6d0});
 const terrain=new T.Mesh(terrainGeometry,soil);terrain.receiveShadow=true;terrain.castShadow=false;scene.add(terrain);
 const rocks=new T.InstancedMesh(new T.DodecahedronGeometry(1,0),new T.MeshStandardMaterial({color:0x777779,roughness:1,bumpMap:grain,bumpScale:.015}),260),dummy=new T.Object3D();
 for(let i=0;i<260;i++){let x,z;do{x=(random()-.5)*68;z=(random()-.5)*68;}while(Math.hypot(x,z)<4.8);const size=.035+random()**3*.22;dummy.position.set(x,height(x,z)+size*.35,z);dummy.rotation.set(random()*2,random()*6,random()*2);dummy.scale.set(size,size*(.55+random()*.4),size*(.7+random()*.5));dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);}
 rocks.receiveShadow=true;rocks.castShadow=false;scene.add(rocks);
 // Exaggerated local Moon curvature for the explanatory overview, not a global
 // georeferenced globe. The flat cap shares the detail view's site origin/ENU.
 const overview=new T.Group();scene.add(overview);
 const radius=22,moonGeometry=new T.SphereGeometry(radius,80,48),moonPositions=moonGeometry.attributes.position;
 for(let i=0;i<moonPositions.count;i++)if(moonPositions.getY(i)>0){const r=Math.hypot(moonPositions.getX(i),moonPositions.getZ(i)),t=Math.max(0,Math.min(1,(r-4)/3)),blend=t*t*(3-2*t);moonPositions.setY(i,radius+(moonPositions.getY(i)-radius)*blend);}
 moonGeometry.computeVertexNormals();
 const moonMaterial=soil.clone();moonMaterial.color.set(0xc3c7cd);
 const moon=new T.Mesh(moonGeometry,moonMaterial);moon.position.y=-radius;moon.receiveShadow=true;overview.add(moon);
 const siteColor=0xf28d7d,siteRing=new T.Mesh(new T.RingGeometry(3.9,4.04,80),new T.MeshBasicMaterial({color:siteColor,side:T.DoubleSide}));siteRing.rotation.x=-Math.PI/2;siteRing.position.y=.13;overview.add(siteRing);
 const siteAnchor=new T.Object3D();siteAnchor.position.set(4.8,1.8,.4);overview.add(siteAnchor);
 overview.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(3.8,.13,.3),siteAnchor.position.clone()]),new T.LineBasicMaterial({color:siteColor})));
 const pin=new T.Mesh(new T.SphereGeometry(.13,12,8),new T.MeshBasicMaterial({color:siteColor}));pin.position.copy(siteAnchor.position);overview.add(pin);
 const earthGuides=[false,true].map(dashed=>{const arrow=new T.ArrowHelper(new T.Vector3(0,1,0),new T.Vector3(.8,3.9,-.4),9,0x4bd4df,.5,.19);if(dashed){arrow.line.material.dispose();arrow.line.material=new T.LineDashedMaterial({color:0x4bd4df,dashSize:.035,gapSize:.025});arrow.line.computeLineDistances();arrow.cone.material.wireframe=true;}overview.add(arrow);return arrow;});
 const metal=new T.MeshStandardMaterial({color:0xd8dfe6,metalness:.42,roughness:.48}),dark=new T.MeshStandardMaterial({color:0x394653,metalness:.18,roughness:.7}),gold=new T.MeshStandardMaterial({color:0xe1bc73,metalness:.4,roughness:.52,bumpMap:foil,bumpScale:.025}),white=new T.MeshStandardMaterial({color:0xe8eff5,metalness:.12,roughness:.75});
 function mesh(geometry,material,pos,parent=scene){const object=new T.Mesh(geometry,material);object.position.set(...pos);object.castShadow=true;object.receiveShadow=true;parent.add(object);return object;}
 const box=(w,h,d,x,y,z,material=metal,parent=scene)=>mesh(new T.BoxGeometry(w,h,d),material,[x,y,z],parent);
 function strut(a,b,r=.055,material=metal){const av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av),m=mesh(new T.CylinderGeometry(r,r,d.length(),10),material,av.clone().add(bv).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return m;}
 mesh(new T.CylinderGeometry(1.2,1.3,1.15,8),gold,[0,1.65,0]);box(1.9,.13,1.9,0,2.29,0,metal);box(1.6,.5,1.4,0,2.6,0,gold);box(.8,.3,.5,-.35,2.98,.15,dark);
 mesh(new T.CylinderGeometry(.38,.57,.6,18,1,true),dark,[0,.8,0]);
 for(const sign of [-1,1]){
  box(.65,.65,.12,sign*.65,1.7,1.12,white);
  for(let i=0;i<8;i++)box(.57,.025,.025,sign*.65,1.43+i*.075,1.195,dark);
  mesh(new T.SphereGeometry(.27,16,10),metal,[sign*.65,2.2,-.95]);
 }
 for(const x of [-1,1])for(const z of [-1,1]){
  const foot=[x*2.05,height(x*2.05,z*1.7)+.06,z*1.7];strut([x*.9,1.85,z*.8],foot,.065);strut([x*.7,1.1,z*.65],[foot[0],foot[1]+.25,foot[2]],.04);strut([x*1.15,1.48,z*.97],[x*1.65,.72,z*1.4],.1,dark);
  mesh(new T.CylinderGeometry(.34,.4,.12,20),metal,foot);
 }
 strut([.7,2.8,-.4],[.8,3.7,-.4],.035);const antenna=new T.Group();antenna.position.set(.8,3.7,-.4);antenna.rotation.z=-.45;scene.add(antenna);
 const dish=mesh(new T.SphereGeometry(.48,24,12,0,Math.PI*2,0,Math.PI*.42),new T.MeshStandardMaterial({color:0xd8e1e9,metalness:.7,roughness:.5,side:T.DoubleSide}),[0,0,0],antenna);dish.castShadow=true;
 mesh(new T.CylinderGeometry(.025,.025,.55,8),metal,[0,.6,0],antenna);
 const panel=new T.Group();panel.position.set(-3.25,2.45,0);scene.add(panel);box(3.15,.09,2.1,0,0,0,metal,panel);
 const cells=new T.MeshStandardMaterial({color:0x28578c,metalness:.12,roughness:.45,bumpMap:grain,bumpScale:.0015});
 for(let x=0;x<6;x++)for(let z=0;z<4;z++){box(.47,.025,.47,-1.25+x*.5,.06,-.75+z*.5,cells,panel);box(.006,.004,.44,-1.25+x*.5,.075,-.75+z*.5,metal,panel);}
 for(const z of [-1.045,1.045])box(3.2,.09,.035,0,.06,z,metal,panel);
 for(const x of [-1.58,1.58])box(.035,.09,2.12,x,.06,0,metal,panel);
 strut([-3.25,height(-3.25,0),0],[-3.25,2.45,0],.075);strut([-1,1.9,0],[-3.25,2.1,0],.05);
 // Fixed, original procedural continent silhouettes, not a NASA Earth image or
 // time-varying terrestrial orientation/phase product.
 const earthMap=texture(512,(ctx,n)=>{ctx.fillStyle='#153d65';ctx.fillRect(0,0,n,n);const polygons=[[[.12,.2],[.2,.14],[.29,.23],[.23,.35],[.22,.43],[.17,.36]],[[.23,.43],[.3,.48],[.32,.58],[.27,.76],[.24,.62]],[[.47,.31],[.54,.28],[.59,.4],[.56,.59],[.51,.65],[.47,.47]],[[.48,.24],[.57,.15],[.75,.19],[.86,.29],[.75,.38],[.67,.34],[.63,.46],[.57,.33]],[[.78,.61],[.86,.58],[.9,.68],[.82,.73]]];ctx.fillStyle='#7f9d91';for(const polygon of polygons){ctx.beginPath();polygon.forEach(([x,y],i)=>i?ctx.lineTo(x*n,y*n):ctx.moveTo(x*n,y*n));ctx.closePath();ctx.fill();}ctx.fillStyle='#d8e1e9';ctx.fillRect(0,n*.94,n,n*.06);ctx.beginPath();ctx.ellipse(n*.35,n*.12,n*.025,n*.055,0,0,Math.PI*2);ctx.fill();});
 // Direction-only sky layer, viewed from its origin. These exaggerated angular
 // radii stay constant when the foreground camera translates or changes distance.
 const sun=mesh(new T.SphereGeometry(1.6,24,16),new T.MeshBasicMaterial({color:0xfffaf1}),[0,0,0],sky);
 const earth=mesh(new T.SphereGeometry(2.2,32,20),new T.MeshBasicMaterial({map:earthMap}),[0,0,0],sky);
 for(const body of [sun,earth]){body.castShadow=false;body.receiveShadow=false;body.renderOrder=10;}
 return {panel,sun,earth,height,overview,terrain,rocks,siteAnchor,earthGuides};
}
