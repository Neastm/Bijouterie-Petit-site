import {createLiquid} from './liquid.js';
import {initReactBits} from './reactbits-adapted.js';
initReactBits();
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const hero=document.querySelector('.hero-scroll'),stage=document.querySelector('.hero-stage'),watch=document.querySelector('.hero-watch-photo'),title=document.querySelector('.hero-copy'),baseline=document.querySelector('.hero-baseline');
let liquid;try{liquid=createLiquid(document.querySelector('#liquid'));}catch(e){console.warn(e);}
let visible=true,last=0;const start=performance.now();const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
new IntersectionObserver(entries=>visible=entries[0].isIntersecting).observe(hero);
function animate(now){requestAnimationFrame(animate);if(!visible||document.hidden||now-last<40)return;last=now;const progress=reduce?0:Math.max(0,Math.min(1,-hero.getBoundingClientRect().top/(hero.offsetHeight-stage.offsetHeight)));const enter=reduce?1:smooth((now-start)/1500),exit=smooth((progress-.1)/.9),y=(1-enter)*stage.offsetHeight-exit*stage.offsetHeight;
watch.style.transform=`translateY(${y}px) rotate(${(1-enter)*-8+exit*7}deg)`;watch.style.opacity=enter;title.style.opacity=1-exit;baseline.style.opacity=1-exit;
liquid?.render(reduce?0:(now-start)/1000,{x:.5,y:.5+y/stage.offsetHeight},.7);
}requestAnimationFrame(animate);
const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('.card-nav');function close(){toggle.setAttribute('aria-expanded','false');nav.inert=true;nav.classList.remove('open');}
toggle.addEventListener('click',()=>{const state=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(state));toggle.setAttribute('aria-label',state?'Fermer le menu':'Ouvrir le menu');nav.inert=!state;nav.classList.toggle('open',state);});nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));document.addEventListener('keydown',e=>{if(e.key==='Escape'){close();toggle.focus();}});
document.querySelector('#appointment-form').addEventListener('submit',e=>{e.preventDefault();document.querySelector('#form-status').textContent='Le formulaire est en démonstration. Pour votre rendez-vous, appelez le 04 66 52 10 00.';});document.querySelector('#current-year').textContent=new Date().getFullYear();
