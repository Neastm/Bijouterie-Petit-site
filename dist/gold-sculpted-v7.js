import * as THREE from './vendor/three.module.js';
import {studioEnvironment} from './gold-studio-environment.js?v=25';
import {initGoldRiver as vectorFallback} from './gold-trail.js';

// Same closed ribbon, bulb profile, folds, four-second cycle and physical
// material as Remotion's GoldStudio. Only its centreline follows the document.
export function initGoldRiver(){
 const host=document.querySelector('#gold-river'),reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
 function showVectorFallback(){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id=host.id;svg.setAttribute('aria-hidden','true');host.replaceWith(svg);document.body.classList.add('vector-gold');vectorFallback();return;
 }
 let renderer,env;
 try{
  renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance',failIfMajorPerformanceCaveat:true});
  env=studioEnvironment(renderer);
  if(renderer.getContext().isContextLost())throw new Error('WebGL context lost during setup');
 }catch{
  env?.dispose();renderer?.dispose();showVectorFallback();return;
 }
 host.classList.add('gold-document');
 renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(0,1,0,-1,.1,20000);camera.position.z=10000;
 scene.environment=env;
 const mat=new THREE.MeshPhysicalMaterial({color:'#e3ad37',metalness:1,roughness:.115,clearcoat:.35,clearcoatRoughness:.12,side:THREE.DoubleSide});
 const n=280,m=40,positions=new Float32Array((n+1)*(m+1)*3),indices=[];
 for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=i*(m+1)+j,b=a+m+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geo.setIndex(indices);
 const mesh=new THREE.Mesh(geo,mat);mesh.frustumCulled=false;scene.add(mesh);
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 let lut=[],length=1,w=1,h=1,pageHeight=1,unit=1,start=0,last=0,elapsed=0,raf=0,active=true,measuring=false,front=0,bandTop=NaN,bandHeight=0,layoutKey='';
 let resolutionScale=1,slowTime=0,bufferWidth=0,bufferHeight=0,bufferRatio=0;
 const overscan=112;
 const clamp=v=>Math.max(0,Math.min(1,v));
 function distanceAtY(y){let a=0,b=lut.length-1;while(b-a>1){const mid=(a+b)>>1;if(lut[mid].y<y)a=mid;else b=mid;}const p=lut[a],q=lut[b],k=clamp((y-p.y)/Math.max(.001,q.y-p.y));return p.d+(q.d-p.d)*k;}
 function point(d){const f=clamp(d/length)*(lut.length-1),i=Math.min(lut.length-2,Math.floor(f)),t=f-i,p=lut[i],q=lut[i+1];return {x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t,dx:q.x-p.x,dy:q.y-p.y};}
 function measure(){if(measuring)return;measuring=true;
  w=document.documentElement.clientWidth;h=innerHeight;pageHeight=document.querySelector('main').offsetHeight+document.querySelector('footer').offsetHeight;
  unit=h/(w>h?3.7:4.978);
  const sections=[...document.querySelectorAll('main>section')];
  // An authored asymmetric route: broad turn, tighter turn, then offscreen loops.
  const variants=[.08,1.16,.18,-.18,.86,1.14,.12];
  const points=[[-.15*w,.12*h],[.84*w,.96*h]];
  sections.slice(1).forEach((s,i)=>{const y=s.getBoundingClientRect().top+scrollY+Math.min(s.offsetHeight*.6,h*.73);if(y>points.at(-1)[1]+60){
   if(i===2||i===4){const prev=points.at(-1),gap=y-prev[1];points.push([w*(i===2?1.18:-.19),prev[1]+gap*.43]);}
   points.push([w*variants[i%variants.length],y]);
  }});
  points.push([w*.55,pageHeight-90]);
  let d=`M${points[0][0]},${points[0][1]}`;
  for(let i=1;i<points.length;i++){const [a,b]=points[i-1],[c,e]=points[i],v=(e-b)*(i%3===0?.32:.48);d+=` C${a},${b+v} ${c},${e-v} ${c},${e}`;}
  const key=[w,h,pageHeight,d].join('|');
  if(key===layoutKey){measuring=false;request();return;}
  layoutKey=key;host.style.height=pageHeight+'px';bandTop=NaN;bandHeight=0;camera.left=0;camera.right=w;
  path.setAttribute('d',d);length=path.getTotalLength();const steps=Math.ceil(length/4);lut=Array.from({length:steps+1},(_,i)=>{const d=i/steps*length,p=path.getPointAtLength(d);return{x:p.x,y:p.y,d};});
  host.dataset.route=d;host.dataset.offscreenTurns='4';measuring=false;request();
 }
 const ring=Array.from({length:m+1},(_,j)=>{const a=j/m*Math.PI*2,q=Math.cos(a);return{q,sin:Math.sin(a),fold:.14*(1-q*q),sin5:Math.sin(q*5),cos5:Math.cos(q*5)};});
 function build(time){
  const cycle=time*Math.PI/2,landscape=w>h,reference=landscape?8.8:5.3,capRadius=landscape?.048:.085;
  const begin=distanceAtY(Math.max(0,bandTop-unit*.35)),end=distanceAtY(front);let cursor=0;
  for(let i=0;i<=n;i++){
   const t=i/n,headLength=Math.min((end-begin)*.5,unit*.95); const distance=t<.65?begin+(end-headLength-begin)*t/.65:end-headLength+headLength*(t-.65)/.35; const s=distance/(reference*unit),d=(end-distance)/(reference*unit),p=point(distance);
   const norm=Math.hypot(p.dx,p.dy)||1,nx=-p.dy/norm,ny=p.dx/norm;
   const tailWidth=.17+.10*Math.sin(s*4)**2;
   const cap=Math.sqrt(Math.max(0,1-((d-capRadius)/capRadius)**2));
   const blend=clamp((d-capRadius)/capRadius),bulb=d<capRadius?1.32*cap:1+.32*(1-blend)*(1-blend);
   const width=tailWidth*bulb,thick=d<capRadius?.22*cap:.023+.197*(1-blend)*(1-blend),fold=Math.min(1,d/(capRadius*2))**2,twist=.65*Math.sin(s*11-cycle);
   const ct=Math.cos(twist),st=Math.sin(twist),waveA=Math.sin(s*17-cycle*2),waveB=Math.sin(s*24-cycle),waveC=Math.cos(s*24-cycle),lift=.15+.1*Math.sin(s*8-cycle);
   for(let j=0;j<=m;j++){
    const r=ring[j],u=r.q*width;
    const z=r.sin*thick+fold*(r.fold*waveA+.035*(r.sin5*waveC+r.cos5*waveB));
    const v=u*ct-z*st,dep=u*st+z*ct;
    positions[cursor++]=p.x+nx*v*unit;positions[cursor++]=-p.y-ny*v*unit;positions[cursor++]=(lift+dep)*unit;
   }
  }
  geo.attributes.position.needsUpdate=true;geo.computeVertexNormals();
  const tip=point(end);host.dataset.headX=tip.x.toFixed(2);host.dataset.headY=tip.y.toFixed(2);
 }
 function syncBuffer(height){
  const ratio=resolutionScale*Math.min(devicePixelRatio||1,2,Math.sqrt(4400000/(w*height)));
  if(w===bufferWidth&&height===bufferHeight&&ratio===bufferRatio)return;
  bufferWidth=w;bufferHeight=height;bufferRatio=ratio;
  renderer.setDrawingBufferSize(w,height,ratio);
  renderer.domElement.style.width=w+'px';renderer.domElement.style.height=height+'px';
 }
 function render(now){raf=0;if(!active||!lut.length)return;if(!start)start=now;
  const delta=last?now-last:0;last=now;elapsed+=delta/1000;
  // A long task or one dropped frame must not lower the resolution.
  if(!reduce&&delta>0&&delta<100){
   slowTime=delta>24?slowTime+delta:Math.max(0,slowTime-2*delta);
   if(slowTime>1100&&resolutionScale>.78){
    resolutionScale=Math.max(.78,resolutionScale*.88);slowTime=0;
   }
  }
  const intro=reduce?1:1-Math.pow(1-clamp((now-start)/1800),3);
  const guide=.78+.08*(1-clamp(scrollY/h)); front=Math.min(pageHeight-90,scrollY+h*(.12+(guide-.12)*intro));
  const top=Math.max(0,scrollY),viewHeight=innerHeight;
  const requiredHeight=Math.max(h,viewHeight)+overscan*2;
  if(bandHeight<requiredHeight){
   bandHeight=requiredHeight;
   bandTop=NaN;
  }
  syncBuffer(bandHeight);
  if(!Number.isFinite(bandTop)||top<bandTop||top+viewHeight>bandTop+bandHeight-16){
   bandTop=Math.max(0,Math.floor((top-overscan*.5)/overscan)*overscan);
   renderer.domElement.style.transform='translate3d(0,'+bandTop+'px,0)';
   camera.top=-bandTop;camera.bottom=-bandTop-bandHeight;camera.updateProjectionMatrix();
  }
  build(reduce?0:elapsed%4);renderer.render(scene,camera);
  if(!reduce)request();
 }
 function request(){if(!raf&&active)raf=requestAnimationFrame(render);}
 const listeners=new AbortController(),options={passive:true,signal:listeners.signal};
 window.addEventListener('scroll',request,options);window.addEventListener('resize',measure,options);
 const observer=new ResizeObserver(measure);observer.observe(document.querySelector('main'));
 document.fonts?.ready.then(()=>{if(!listeners.signal.aborted)measure();});
 document.addEventListener('visibilitychange',()=>{active=!document.hidden;last=0;slowTime=0;if(!active){cancelAnimationFrame(raf);raf=0;}else request();},options);
 renderer.domElement.addEventListener('webglcontextlost',()=>{
  active=false;cancelAnimationFrame(raf);listeners.abort();observer.disconnect();
  geo.dispose();mat.dispose();env.dispose();renderer.dispose();showVectorFallback();
 },{once:true});
 measure();
}
