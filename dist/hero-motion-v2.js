import {initReactBits} from './reactbits-adapted.js';
initReactBits();
const $=s=>document.querySelector(s),header=$('.site-header'),hero=$('.cinematic'),stage=$('.scene-stage'),entry=$('#entry-video'),idle=$('#idle-video'),exit=$('#exit-video'),poster=$('#scene-poster'),message=$('.gold-message'),resume=$('.video-resume');
const mobile=matchMedia('(max-width:760px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
let completed=false,hasScrolled=scrollY>2,headerTimer,raf=0,wanted=0,seeking=false,mediaFormat='',idleStarting=false,idleFailed=false,exitFailed=false;
function progress(){return clamp(-hero.getBoundingClientRect().top/Math.max(1,hero.offsetHeight-stage.offsetHeight));}
function showHeader(immediate=false){if(immediate){clearTimeout(headerTimer);header.classList.add('immediate');}header.classList.add('visible');header.inert=false;}
function fixedPoster(gold=false){poster.src=`./assets/${gold?'gold':'unboxing'}-${mediaFormat}-v2.jpg`;poster.classList.add('active');}
function startIdle(){
 if(reduced||idleFailed||document.hidden||idleStarting||progress()>.001)return;
 if(!idle.paused){idle.classList.add('active');return;}
 idleStarting=true;
 idle.play().then(()=>{idleStarting=false;if(progress()>.001){idle.pause();return;}idle.classList.add('active');entry.classList.remove('active');exit.classList.remove('active');poster.classList.remove('active');}).catch(()=>{idleStarting=false;fixedPoster();});
}
function endEntry(){if(completed)return;completed=true;entry.pause();resume.classList.remove('visible');if(progress()<=.001)startIdle();if(hasScrolled)showHeader(true);else headerTimer=setTimeout(()=>showHeader(),450);}
function seek(){if(exitFailed||!Number.isFinite(exit.duration)||exit.readyState<1||seeking)return;const goal=Math.min(wanted,exit.duration-1/60);if(Math.abs(exit.currentTime-goal)>.009){seeking=true;exit.currentTime=Math.max(0,goal);}}
exit.addEventListener('seeked',()=>{seeking=false;seek();});exit.addEventListener('loadeddata',()=>{seek();queue();});exit.addEventListener('loadedmetadata',()=>{seeking=false;seek();});
function update(){raf=0;const p=progress();if(scrollY>2){hasScrolled=true;showHeader(true);if(!completed)endEntry();}const flow=clamp(p/.68),txt=smooth((p-.67)/.15);wanted=flow*5;
 if(reduced){fixedPoster(p>.1);}else if(p>.001&&completed){
  idle.pause();idle.classList.remove('active');entry.classList.remove('active');
  if(exitFailed){exit.classList.remove('active');fixedPoster(p>.1);}else{exit.classList.add('active');seek();if(exit.readyState>=2)poster.classList.remove('active');else fixedPoster();}
 }else if(completed){exit.classList.remove('active');if(idleFailed)fixedPoster();else startIdle();}
 message.style.opacity=String(reduced?(p>.3?1:0):txt);message.style.transform=`translateY(${(1-txt)*30}px)`;message.inert=reduced?p<=.3:txt<.5;message.setAttribute('aria-hidden',String(message.inert));
}
function queue(){if(!raf)raf=requestAnimationFrame(update);}
function loadMedia(){
 const next=mobile.matches?'portrait':'paysage';if(next===mediaFormat)return;mediaFormat=next;seeking=false;idleFailed=false;exitFailed=false;idleStarting=false;idle.pause();idle.classList.remove('active');
 poster.src=`./assets/unboxing-${next}-v2.jpg`;
 if(reduced){completed=true;hero.classList.add('reduced');fixedPoster();showHeader(true);queue();return;}
 for(const [v,name] of [[entry,'entree'],[idle,'boucle'],[exit,'sortie']]){v.poster=poster.src;v.src=`./assets/${name}-${next}-v2.mp4`;v.load();}
 if(!completed&&!hasScrolled){entry.classList.add('active');entry.play().catch(()=>{completed=true;entry.classList.remove('active');fixedPoster();showHeader(true);resume.classList.add('visible');startIdle();});}else{completed=true;fixedPoster();queue();}
}
entry.addEventListener('ended',endEntry);entry.addEventListener('error',()=>{completed=true;entry.classList.remove('active');fixedPoster();showHeader(true);startIdle();});
idle.addEventListener('loadeddata',()=>{if(completed)queue();});idle.addEventListener('error',()=>{idleFailed=true;idle.classList.remove('active');if(completed&&progress()<=.001)fixedPoster();});
exit.addEventListener('error',()=>{exitFailed=true;seeking=false;queue();});
resume.addEventListener('click',()=>{completed=false;idle.pause();idle.classList.remove('active');poster.classList.remove('active');entry.classList.add('active');resume.classList.remove('visible');entry.currentTime=0;entry.play().catch(()=>{completed=true;fixedPoster();showHeader(true);});});
window.addEventListener('scroll',queue,{passive:true});for(const event of ['wheel','touchmove'])window.addEventListener(event,()=>{hasScrolled=true;showHeader(true);},{passive:true});window.addEventListener('resize',queue);mobile.addEventListener('change',loadMedia);document.addEventListener('visibilitychange',()=>{if(document.hidden)idle.pause();else if(completed)startIdle();});
document.addEventListener('keydown',e=>{if(['ArrowDown','PageDown','End',' '].includes(e.key)&&!['INPUT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)){hasScrolled=true;showHeader(true);}});
const toggle=$('.menu-toggle'),nav=$('.card-nav');function closeMenu(){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Ouvrir le menu');nav.inert=true;nav.classList.remove('open');}toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fermer le menu':'Ouvrir le menu');nav.inert=!open;nav.classList.toggle('open',open);});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
$('#appointment-form').addEventListener('submit',e=>{e.preventDefault();$('#form-status').textContent='Cette version présente le formulaire. Pour convenir de votre rendez-vous, appelez le 04 66 52 10 00.';});$('#current-year').textContent=new Date().getFullYear();
header.inert=true;loadMedia();if(hasScrolled){completed=true;entry.pause();showHeader(true);}update();
