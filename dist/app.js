import * as THREE from 'three';
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { RoomEnvironment } from './vendor/environments/RoomEnvironment.js';
import { createLiquid } from './liquid.js';
import { initReactBits } from './reactbits-adapted.js';
initReactBits();

const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas=document.querySelector('#watch');
const hero=document.querySelector('.hero-scroll');
const stage=document.querySelector('.hero-stage');
const copy=document.querySelector('.hero-copy');
const caption=document.querySelector('.hero-baseline');
let liquid=null;
try{liquid=createLiquid(document.querySelector('#liquid'));}catch(error){console.warn('Liquid fallback',error);}
let renderer,scene,camera,model;
const started=performance.now();
let modelReady=started,visible=true,lastFrame=0;
const pointer={x:0,y:0};
const weight={x:.67,y:.52};
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth=(a,b,x)=>{let t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
try{
 renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.78;
 scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(32,1,.1,100);camera.position.z=19;
 const pmrem=new THREE.PMREMGenerator(renderer);const room=new THREE.Scene();room.background=new THREE.Color('#9b9a98');const panel=(x,y,z,w,h,v)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:v,side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);room.add(m);};panel(-4,4,5,2,12,'#ffffff');panel(5,1,3,1,12,'#ffffff');panel(0,7,1,12,2,'#fffaf0');panel(0,-4,5,10,1,'#f4f4f4');panel(-5,0,0,5,14,'#222222');scene.environment=pmrem.fromScene(room,.025).texture;pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xfffcf4,0x8c887c,.65));
 for(const [color,intensity,x,y,z] of [[0xffffff,2.6,-5,7,7],[0xffffff,1.6,6,1,6],[0xffe5aa,.7,1,-6,3]]){const light=new THREE.DirectionalLight(color,intensity);light.position.set(x,y,z);scene.add(light);}
 const onWatchLoaded=gltf=>{
   gltf.scene.traverse(o=>{if(o.isMesh&&o.material.metalness>.8){o.material.color.multiplyScalar(.66);o.material.envMapIntensity=.85;}});
   model=new THREE.Group();model.add(gltf.scene);scene.add(model);
   const bounds=new THREE.Box3().setFromObject(gltf.scene),center=bounds.getCenter(new THREE.Vector3());gltf.scene.position.sub(center);
   modelReady=performance.now();canvas.classList.add('loaded');document.querySelector('.watch-loading').style.opacity=0;
   window.__petit3d={loaded:true,meshes:0,triangles:0};gltf.scene.traverse(o=>{if(o.isMesh){window.__petit3d.meshes++;window.__petit3d.triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
 };
 const onWatchError=error=>{console.error('Watch could not load',error);document.querySelector('.watch-loading').textContent='La montre se prépare…';};
 const loader=new GLTFLoader();
 if('DecompressionStream' in window){fetch('./assets/petit-prx.glb.gz').then(r=>{if(!r.ok)throw new Error('Model unavailable');return new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();}).then(b=>loader.parse(b,'./assets/',onWatchLoaded,onWatchError)).catch(onWatchError);}else loader.load('./assets/petit-prx.glb',onWatchLoaded,undefined,onWatchError);
}catch(error){console.error('3D unavailable',error);document.querySelector('.watch-loading').textContent='Expérience 3D indisponible';}
function resize(){if(!renderer)return;const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();
window.addEventListener('pointermove',e=>{pointer.x=e.clientX/innerWidth-.5;pointer.y=e.clientY/innerHeight-.5;},{passive:true});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:0}).observe(hero);
function frame(now){requestAnimationFrame(frame);if(!visible||document.hidden||now-lastFrame<32)return;lastFrame=now;
 const rect=hero.getBoundingClientRect(),h=stage.clientHeight,w=stage.clientWidth,mobile=w<=760;
 const progress=reduce?0:clamp(-rect.top/Math.max(1,hero.offsetHeight-h));
 const enter=reduce?1:smooth(0,1.7,(now-modelReady)/1000);
 const depart=smooth(.18,1,progress);
 const xTarget=0;
 const yBase=mobile?-1.0:-.05;
 const y=yBase-(1-enter)*13+depart*15;
 const scale=mobile?Math.min(.55,w/720):Math.min(.82,h/930);
 if(model){model.position.set(xTarget,y,0);model.scale.setScalar(scale);model.rotation.x=(1-enter)*.25-depart*.24+(reduce?0:pointer.y*.025);model.rotation.y=-.20+(1-enter)*.48+depart*.47+(reduce?0:pointer.x*.045);model.rotation.z=-.06+(1-enter)*-.16+depart*.20;
 const point=new THREE.Vector3(xTarget,y,0).project(camera);weight.x=point.x*.5+.5;weight.y=-point.y*.5+.5;renderer.render(scene,camera);}
 liquid?.render(reduce?0:(now-started)/1000,weight,reduce?.7:enter*(1-.25*depart));
 copy.style.transform=`translateY(${-depart*90}px)`;copy.style.opacity=1-smooth(.32,.86,progress);
 caption.style.opacity=1-smooth(.12,.65,progress);
 stage.dataset.progress=progress.toFixed(3);
}
requestAnimationFrame(frame);

const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('.card-nav');
function closeNav(){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Ouvrir le menu');nav.classList.remove('open');nav.inert=true;}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fermer le menu':'Ouvrir le menu');nav.inert=!open;nav.classList.toggle('open',open);});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeNav));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeNav();toggle.focus();}});
document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeNav();});
document.querySelector('#current-year').textContent=new Date().getFullYear();
document.querySelector('#appointment-form').addEventListener('submit',e=>{e.preventDefault();document.querySelector('#form-status').textContent='Le formulaire de cette ébauche n’envoie pas encore de demande. Appelez la boutique au 04 66 52 10 00 pour convenir d’un rendez-vous.';});
