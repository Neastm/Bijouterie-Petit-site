import {initReactBits} from './reactbits-adapted.js';
import {initGlassSurfaces} from './liquid-glass.js';
initReactBits();
const $=s=>document.querySelector(s),header=$('.site-header'),mobile=matchMedia('(max-width:760px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const body=$('.product-body'),packshot=$('.box-packshot'),shadow=$('.product-shadow');
const clamp=v=>Math.max(0,Math.min(1,v)),ease=v=>{v=clamp(v);return v*v*v*(v*(v*6-15)+10)};
let start=0,raf=0,finished=reduced,headerTimer,goldStarted=false,goldModule;
function showHeader(immediate=false){if(immediate&&!header.classList.contains('immediate')){clearTimeout(headerTimer);header.classList.add('immediate');}if(!header.inert)return;header.classList.add('visible');header.inert=false;}

function startGold(){
 if(goldStarted)return;
 goldStarted=true;
 goldModule.then(module=>{
  if(!module)return;
  const run=()=>{document.body.classList.add('gold-ready');module.initGoldRiver();};
  requestAnimationFrame(()=>{
   if(window.requestIdleCallback)requestIdleCallback(run,{timeout:250});
   else setTimeout(run,0);
  });
 });
}
function frame(now){raf=0;if(!start)start=now;const t=(now-start)/1000;if(scrollY>3&&!finished){finished=true;showHeader(true);}const u=finished?1:clamp(t/1.95);body.style.transform='translate3d(0,'+(innerHeight*1.12*(1-ease(u)))+'px,0)';shadow.style.opacity=String(u);if(!finished&&u>=1){finished=true;headerTimer=setTimeout(()=>showHeader(),400);}if(finished){body.style.willChange='auto';startGold();}else raf=requestAnimationFrame(frame);}
function queue(){if(!raf)raf=requestAnimationFrame(frame);}
window.addEventListener('scroll',()=>{if(scrollY>2)showHeader(true);if(!finished)queue();},{passive:true});for(const name of ['wheel','touchmove'])window.addEventListener(name,()=>showHeader(true),{passive:true});
const toggle=$('.menu-toggle'),nav=$('.card-nav');
function closeMenu(returnFocus=false){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Ouvrir le menu');nav.inert=true;nav.classList.remove('open');header.classList.remove('menu-open');if(returnFocus)toggle.focus();}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';if(!open){closeMenu();return;}toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Fermer le menu');nav.inert=false;nav.classList.add('open');header.classList.add('menu-open');});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMenu()));document.addEventListener('pointerdown',e=>{if(!header.contains(e.target))closeMenu();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true')closeMenu(true);});mobile.addEventListener('change',()=>closeMenu());
$('#appointment-form').addEventListener('submit',e=>{e.preventDefault();$('#form-status').textContent='Cette version présente le formulaire. Pour convenir de votre rendez-vous, appelez le 04 66 52 10 00.';});$('#current-year').textContent=new Date().getFullYear();

header.inert=true;if(reduced||scrollY>2){finished=true;showHeader(true);}initGlassSurfaces();
packshot.decode().catch(()=>{}).then(()=>{
 body.classList.add('is-ready');
 queue();
 goldModule=import('./gold-sculpted-v7.js?v=25').catch(error=>{
  console.warn('La coulée dorée n’a pas pu être chargée.',error);
  return null;
 });
});
