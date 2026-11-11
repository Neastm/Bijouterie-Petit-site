import {initReactBits} from './reactbits-adapted.js';
import {initGoldRiver} from './gold-trail.js';
initReactBits();
const $=s=>document.querySelector(s),header=$('.site-header'),mobile=matchMedia('(max-width:760px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
function projectQuad(w,h,p){
 const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=p;
 const dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3;
 const den=dx1*dy2-dx2*dy1;
 if(Math.abs(den)<.001)return 'scale(0)';
 const g=(dx3*dy2-dx2*dy3)/den,k=(dx1*dy3-dx3*dy1)/den;
 return `matrix3d(${(x1-x0+g*x1)/w},${(y1-y0+g*y1)/w},0,${g/w},${(x3-x0+k*x3)/h},${(y3-y0+k*y3)/h},0,${k/h},0,0,1,0,${x0},${y0},0,1)`;
}
function lidGeometry(bw,angle){
 const phi=angle*Math.PI/180,elevation=40*Math.PI/180,cx=bw*.496,hy=bw*.245,depth=bw*.6,half=bw*.32,thickness=bw*.023,focal=bw*3;
 function point(x,d,outer){const y=d*Math.cos(phi)-outer*thickness*Math.sin(phi),z=d*Math.sin(phi)+outer*thickness*Math.cos(phi),k=focal/(focal-y*Math.cos(elevation)-z*Math.sin(elevation));return [cx+x*k,hy+(y*Math.sin(elevation)-z*Math.cos(elevation))*k];}
 const inner=[point(-half,depth,0),point(half,depth,0),point(half,0,0),point(-half,0,0)];
 const outer=[point(-half,depth,1),point(half,depth,1),point(half,0,1),point(-half,0,1)];
 return {inner,outer,inside:angle>40,frontY:(inner[0][1]+inner[1][1])/2,hy};
}

const box=$('.product-box'),body=$('.product-body'),lid=$('.product-lid'),face=$('.lid-face'),edges=$('.lid-edges'),base=$('.box-base'),front=$('.box-front');
const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*v*(v*(v*6-15)+10)};
let start=0,raf=0,finished=reduced,headerTimer,previous=-1,width=0;
function showHeader(immediate=false){if(immediate){clearTimeout(headerTimer);header.classList.add('immediate');}header.classList.add('visible');header.inert=false;}
function drawLid(angle){const bw=box.clientWidth,g=lidGeometry(bw,angle),q=g.inside?g.inner:[g.outer[3],g.outer[2],g.outer[1],g.outer[0]];lid.style.zIndex=g.inside?0:2;face.style.visibility=Math.abs(q[0][1]-q[3][1])>.4?'visible':'hidden';face.style.transform=projectQuad(700,650,q);face.classList.toggle('inside',g.inside);edges.setAttribute('viewBox','0 '+(-bw*.6)+' '+bw+' '+bw*1.8);edges.innerHTML=[0,1,2,3].map(i=>'<polygon points="'+[g.inner[i],g.inner[(i+1)%4],g.outer[(i+1)%4],g.outer[i]].map(p=>p.join(',')).join(' ')+'" fill="'+(i===0?'#3e342d':'#211d19')+'" stroke="#75604c" stroke-width=".8"/>').join('');base.style.clipPath='inset('+Math.max(0,g.frontY-2)+'px 0 0 0)';front.style.clipPath='inset('+bw*.70+'px 0 0 0)';}
function frame(now){raf=0;if(!start)start=now;const t=(now-start)/1000;if(scrollY>3&&!finished){finished=true;showHeader(true);}const angle=finished?105:t<2.8?0:t<5.05?106.2*ease((t-2.8)/2.25):106.2-1.2*ease((t-5.05)/.6);if(angle!==previous||width!==box.clientWidth){drawLid(angle);previous=angle;width=box.clientWidth;}body.style.transform='translateY('+(finished?0:-innerHeight*1.1*(1-ease(t/2.65)))+'px)';if(!finished&&t>=5.65){finished=true;headerTimer=setTimeout(()=>showHeader(),450);}if(!finished)raf=requestAnimationFrame(frame);}
function queue(){if(!raf)raf=requestAnimationFrame(frame);}
window.addEventListener('scroll',()=>{if(scrollY>2)showHeader(true);if(!finished)queue();},{passive:true});window.addEventListener('resize',queue,{passive:true});for(const name of ['wheel','touchmove'])window.addEventListener(name,()=>showHeader(true),{passive:true});
const toggle=$('.menu-toggle'),nav=$('.card-nav');
function closeMenu(returnFocus=false){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Ouvrir le menu');nav.inert=true;nav.classList.remove('open');header.classList.remove('menu-open');if(returnFocus)toggle.focus();}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';if(!open){closeMenu();return;}toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Fermer le menu');nav.inert=false;nav.classList.add('open');header.classList.add('menu-open');});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMenu()));document.addEventListener('pointerdown',e=>{if(!header.contains(e.target))closeMenu();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true')closeMenu(true);});mobile.addEventListener('change',()=>closeMenu());
$('#appointment-form').addEventListener('submit',e=>{e.preventDefault();$('#form-status').textContent='Cette version présente le formulaire. Pour convenir de votre rendez-vous, appelez le 04 66 52 10 00.';});$('#current-year').textContent=new Date().getFullYear();

header.inert=true;if(reduced||scrollY>2){finished=true;showHeader(true);}queue();initGoldRiver();
