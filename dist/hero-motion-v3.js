import {initReactBits} from './reactbits-adapted.js';
import {ScrollSequence} from './scroll-sequence.js';
initReactBits();
const $=s=>document.querySelector(s),header=$('.site-header'),hero=$('.cinematic'),stage=$('.scene-stage'),entry=$('#entry-video'),idle=$('#idle-video'),poster=$('#scene-poster'),message=$('.gold-message'),resume=$('.video-resume'),canvas=$('#scroll-canvas');
const mobile=matchMedia('(max-width:760px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
let completed=false,hasScrolled=scrollY>2,headerTimer,raf=0,mediaFormat='',idleStarting=false,idleFailed=false,heroTop=0,travel=1,shown=0,lastTime=0,lastDraw=-1,wasScrolling=false;
const sequence=new ScrollSequence(canvas,queue);
function measure(){heroTop=hero.getBoundingClientRect().top+scrollY;travel=Math.max(1,hero.offsetHeight-stage.offsetHeight);sequence.resize();queue();}
function progress(){return clamp((scrollY-heroTop)/travel);}
function showHeader(immediate=false){if(immediate){clearTimeout(headerTimer);header.classList.add('immediate');}header.classList.add('visible');header.inert=false;}
function fixedPoster(gold=false){const src='./assets/'+(gold?'gold':'unboxing')+'-'+mediaFormat+'-v2.jpg';if(!poster.src.endsWith(src.slice(1)))poster.src=src;poster.classList.add('active');}
function startIdle(){
 if(reduced||idleFailed||document.hidden||idleStarting||progress()>.001)return;
 if(!idle.paused){idle.classList.add('active');return;}idleStarting=true;
 idle.play().then(()=>{idleStarting=false;if(progress()>.001){idle.pause();return;}idle.classList.add('active');entry.classList.remove('active');poster.classList.remove('active');}).catch(()=>{idleStarting=false;fixedPoster();});
}
function endEntry(){if(completed)return;completed=true;entry.pause();resume.classList.remove('visible');if(progress()<=.001)startIdle();if(hasScrolled)showHeader(true);else headerTimer=setTimeout(()=>showHeader(),450);}
function update(now){
 raf=0;const p=progress(),dt=Math.min(50,lastTime?now-lastTime:16);lastTime=now;
 if(scrollY>2){hasScrolled=true;showHeader(true);if(!completed)endEntry();}
 const target=clamp(p/.72);shown=reduced?target:shown+(target-shown)*(1-Math.exp(-dt/65));if(Math.abs(target-shown)<.0005)shown=target;
 const scrolling=p>.001&&completed;
 if(reduced){fixedPoster(p>.1);}else if(scrolling){
  if(!wasScrolling){idle.pause();entry.pause();idle.classList.remove('active');entry.classList.remove('active');}
  sequence.request(Math.round(shown*299));if(sequence.draw()){canvas.classList.add('active');poster.classList.remove('active');}else fixedPoster(p>.5);
 }else if(completed){canvas.classList.remove('active');if(idleFailed)fixedPoster();else startIdle();}
 wasScrolling=scrolling;
 // Text follows the same softened playhead, and never waits for video seeking.
 const txt=reduced?(p>.3?1:0):smooth((shown-.86)/.14);
 if(lastDraw!==txt){message.style.opacity=String(txt);message.style.transform='translateY('+((1-txt)*18)+'px)';message.inert=txt<.5;message.setAttribute('aria-hidden',String(message.inert));lastDraw=txt;}
 if(!reduced&&Math.abs(target-shown)>.0005)queue();
}
function queue(){if(!raf)raf=requestAnimationFrame(update);}
function loadMedia(){
 const next=mobile.matches?'portrait':'paysage';if(next===mediaFormat)return;mediaFormat=next;idleFailed=false;idleStarting=false;idle.pause();idle.classList.remove('active');canvas.classList.remove('active');poster.src='./assets/unboxing-'+next+'-v2.jpg';
 if(reduced){completed=true;hero.classList.add('reduced');fixedPoster();showHeader(true);measure();return;}
 sequence.load(next);for(const [v,name]of [[entry,'entree'],[idle,'boucle']]){v.poster=poster.src;v.src='./assets/'+name+'-'+next+'-v2.mp4';v.load();}
 if(!completed&&!hasScrolled){entry.classList.add('active');entry.play().catch(()=>{completed=true;entry.classList.remove('active');fixedPoster();showHeader(true);resume.classList.add('visible');startIdle();});}else{completed=true;fixedPoster();queue();}measure();
}
entry.addEventListener('ended',endEntry);entry.addEventListener('error',()=>{completed=true;entry.classList.remove('active');fixedPoster();showHeader(true);startIdle();});
idle.addEventListener('loadeddata',()=>{if(completed)queue();});idle.addEventListener('error',()=>{idleFailed=true;idle.classList.remove('active');if(completed&&progress()<=.001)fixedPoster();});
resume.addEventListener('click',()=>{completed=false;idle.pause();idle.classList.remove('active');poster.classList.remove('active');entry.classList.add('active');resume.classList.remove('visible');entry.currentTime=0;entry.play().catch(()=>{completed=true;fixedPoster();showHeader(true);});});
window.addEventListener('scroll',queue,{passive:true});for(const event of ['wheel','touchmove'])window.addEventListener(event,()=>{hasScrolled=true;showHeader(true);},{passive:true});
window.addEventListener('resize',measure,{passive:true});mobile.addEventListener('change',loadMedia);document.addEventListener('visibilitychange',()=>{if(document.hidden)idle.pause();else if(completed){startIdle();queue();}});
document.addEventListener('keydown',e=>{if(['ArrowDown','PageDown','End',' '].includes(e.key)&&!['INPUT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)){hasScrolled=true;showHeader(true);}});
const toggle=$('.menu-toggle'),nav=$('.card-nav');
function closeMenu(returnFocus=false){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Ouvrir le menu');nav.inert=true;nav.classList.remove('open');header.classList.remove('menu-open');if(returnFocus)toggle.focus();}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';if(!open){closeMenu();return;}toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Fermer le menu');nav.inert=false;nav.classList.add('open');header.classList.add('menu-open');});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMenu()));document.addEventListener('pointerdown',e=>{if(!header.contains(e.target))closeMenu();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true')closeMenu(true);});mobile.addEventListener('change',()=>closeMenu());
$('#appointment-form').addEventListener('submit',e=>{e.preventDefault();$('#form-status').textContent='Cette version présente le formulaire. Pour convenir de votre rendez-vous, appelez le 04 66 52 10 00.';});$('#current-year').textContent=new Date().getFullYear();
header.inert=true;loadMedia();if(hasScrolled){completed=true;entry.pause();showHeader(true);}measure();queue();
