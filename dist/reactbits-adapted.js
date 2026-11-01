// Vanilla adaptations of React Bits ScrollReveal / BlurText / SpotlightCard.
// Source components retrieved through the React Bits plugin. MIT + Commons Clause, David Haz.
export function initReactBits(){
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const headings=document.querySelectorAll('[data-reveal]');
 if(!reduce){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');observer.unobserve(entry.target);}}),{threshold:.15});headings.forEach(el=>{el.classList.add('reveal-pending');observer.observe(el);});}
 document.querySelectorAll('.spotlight-card').forEach(card=>{card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect();card.style.setProperty('--mouse-x',(e.clientX-r.left)+'px');card.style.setProperty('--mouse-y',(e.clientY-r.top)+'px');},{passive:true});});
}
