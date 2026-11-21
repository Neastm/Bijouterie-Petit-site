// GSAP's official UMD distributions must execute as classic scripts.
async function loadScript(name) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('./vendor/' + name + '.min.js', import.meta.url).href;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Unable to load ' + name));
    document.head.append(script);
  });
}

const hero = document.querySelector('.counter-hero');
const stage = document.querySelector('.counter-stage');
const header = document.querySelector('.site-header');
const slides = [...document.querySelectorAll('.counter-slide')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width:760px)');
let gsap, ScrollTrigger, presentation, heroTrigger, media;
let ready = false, requested = -1, wanted = 0;

function showHeader() { header.classList.add('visible'); header.inert = false; }

function present(index, force = false) {
  wanted = index;
  if (!ready) return;
  if (!slides[index].querySelector('img').naturalWidth) index = 0;
  if (requested === index && !force) return;
  requested = index;
  presentation?.kill();
  const target = slides[index];
  const outgoing = slides.find(slide => !slide.hidden);
  hero.dataset.motionState = 'moving';
  hero.dataset.activeSlide = String(index);
  const finish = () => {
    hero.dataset.motionState = 'idle';
    presentation = null;
    showHeader();
  };
  if (!gsap || reduced.matches) {
    slides.forEach(slide => {
      slide.hidden = slide !== target;
      const hand = slide.querySelector('.counter-arrival');
      if (gsap) gsap.set(hand, {clearProps:'transform'});
      else hand.style.transform = '';
    });
    finish();
    return;
  }
  const arrival = target.querySelector('.counter-arrival');
  const outside = stage.clientWidth / 2 + target.querySelector('.counter-object').clientWidth;
  presentation = gsap.timeline({onComplete:finish, defaults:{overwrite:'auto'}});
  let enterAt = 0;
  if (outgoing && outgoing !== target) {
    const hand = outgoing.querySelector('.counter-arrival');
    presentation.to(hand, {x:outside, y:-3, duration:.36, ease:'power2.in'});
    presentation.call(() => {outgoing.hidden = true;});
    enterAt = .40;
  }
  if (outgoing !== target) {
    presentation.set(arrival, {x:outside, y:-5}, enterAt);
    presentation.call(() => {target.hidden = false;}, null, enterAt);
  }
  // The entire photograph moves together: no rotation, stretching or floating box.
  presentation.to(arrival, {x:0, y:0, duration:.64, ease:'power3.out'}, enterAt);
  presentation.fromTo(target.querySelector('.counter-contact-shadow'),
    {opacity:.25, scaleX:.94}, {opacity:1, scaleX:1, duration:.45, ease:'sine.out'}, enterAt+.16);
  if (document.hidden) presentation.pause();
}

function refresh() { ScrollTrigger?.refresh(); }
function initMotion() {
  gsap.registerPlugin(ScrollTrigger);
  // Native scrolling controls progress; no wheel/touch interception or snap.
  heroTrigger = ScrollTrigger.create({
    trigger:hero, start:'top top', end:'bottom bottom',
    onUpdate:self => {
      gsap.set('.counter-progress-fill', {scaleX:self.progress});
      present(self.progress >= .48 ? 1 : 0);
      if (self.progress > .005) showHeader();
    }
  });
  media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    // Separate wrappers isolate the room, the photograph and the exit motion.
    gsap.to('.counter-parallax', {y:() => -stage.clientHeight*.018, ease:'none',
      scrollTrigger:{trigger:hero,start:'top top',end:'bottom bottom',scrub:.18,invalidateOnRefresh:true}});
    const exit = gsap.timeline({scrollTrigger:{trigger:hero,start:'bottom bottom',end:'bottom 12%',scrub:.25,invalidateOnRefresh:true}});
    exit.to('.counter-parallax', {x:() => innerWidth*.86, duration:.62, ease:'power1.in'}, 0)
      .to('.counter-room', {yPercent:-3, scale:1.035, duration:1, ease:'none'}, 0)
      .to('.counter-signature, .counter-progress', {autoAlpha:0, y:-14, duration:.4}, .05);
    const boutique = document.querySelector('#boutique');
    gsap.fromTo('.storefront-background', {yPercent:-4, scale:1.08}, {yPercent:0,scale:1,ease:'none',
      scrollTrigger:{trigger:boutique,start:'top bottom',end:'top top',scrub:.3}});
    document.querySelectorAll('.storefront-copy, .maison-top, .story, .section-heading, .universe-card, .atelier-intro, .service-list, .faq h2, .faq-grid, .contact-intro, #appointment-form').forEach(element => {
      gsap.from(element, {y:28, opacity:0, duration:.8, ease:'power2.out',
        scrollTrigger:{trigger:element,start:'top 92%',once:true},clearProps:'transform,opacity'});
    });
    const route = document.querySelector('.address-orbit');
    const length = route.getTotalLength();
    const address = gsap.timeline({scrollTrigger:{trigger:'#venir',start:'top 83%',once:true}});
    address.from('.arrival-copy', {y:24,opacity:0,duration:.65,ease:'power2.out'})
      .from('.address-card', {y:35,rotation:3,opacity:0,duration:.8,ease:'power3.out'},.1)
      .fromTo(route,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration:1.1,ease:'power2.inOut'},.25)
      .from('.address-pin',{scale:.65,opacity:0,transformOrigin:'50% 100%',duration:.5,ease:'back.out(1.3)'},.85);
    return () => { gsap.set('.address-orbit',{clearProps:'strokeDasharray,strokeDashoffset'}); };
  });
  document.fonts.ready.then(refresh);
  document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', refresh));
  document.querySelectorAll('img[loading="lazy"]').forEach(image => image.addEventListener('load', refresh, {once:true}));
}

// The location feature works independently of the animation library.
const destination = 'Bijouterie Petit, 18 rue Saint-Vincent, 30100 Alès, France';
const direction = document.querySelector('#route-link');
document.querySelectorAll('input[name="travel-mode"]').forEach(input => input.addEventListener('change', () => {
  direction.href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(destination) + '&travelmode=' + input.value;
  direction.textContent = input.value === 'walking' ? 'Itinéraire à pied' : 'Itinéraire en voiture';
  if (gsap && !reduced.matches) gsap.fromTo(direction,{opacity:.6,y:2},{opacity:1,y:0,duration:.22});
}));
document.querySelector('#copy-address').addEventListener('click', async () => {
  const status = document.querySelector('#address-status');
  try {
    await navigator.clipboard.writeText('Bijouterie Petit — 18 rue Saint-Vincent, 30100 Alès');
    status.textContent = 'Adresse copiée.';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector('.arrival-copy address'));
    getSelection().removeAllRanges(); getSelection().addRange(range);
    status.textContent = 'Adresse sélectionnée : vous pouvez la copier.';
  }
});
const mapToggle = document.querySelector('#show-map');
const mapPanel = document.querySelector('#local-map');
mapToggle.addEventListener('click', () => {
  const show = mapPanel.hidden;
  if (show && !mapPanel.querySelector('iframe')) {
    const iframe = document.createElement('iframe');
    iframe.title = 'Localisation de la Bijouterie Petit au 18 rue Saint-Vincent à Alès';
    iframe.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(destination) + '&z=17&output=embed';
    iframe.loading = 'lazy'; iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;
    mapPanel.append(iframe);
  }
  mapPanel.hidden = !show;
  mapToggle.setAttribute('aria-expanded',String(show));
  mapToggle.textContent = show ? 'Fermer la carte' : 'Voir le quartier';
  if (show && gsap && !reduced.matches) gsap.fromTo(mapPanel,{opacity:0},{opacity:1,duration:.3});
});
const findUs = document.querySelector('.storefront-copy .button');
findUs.href = '#venir';findUs.removeAttribute('target');

const toggle = document.querySelector('.menu-toggle'), nav = document.querySelector('.card-nav');
function closeMenu(focus = false) {
  toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Ouvrir le menu');
  nav.inert = true;nav.classList.remove('open');header.classList.remove('menu-open');
  if(focus)toggle.focus();
}
toggle.addEventListener('click', () => {
  if(toggle.getAttribute('aria-expanded') === 'true') return closeMenu();
  toggle.setAttribute('aria-expanded','true');toggle.setAttribute('aria-label','Fermer le menu');
  nav.inert = false;nav.classList.add('open');header.classList.add('menu-open');
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('pointerdown', event => {if(!header.contains(event.target))closeMenu();});
document.addEventListener('keydown', event => {if(event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true')closeMenu(true);});
mobile.addEventListener('change', () => closeMenu());
document.querySelector('#appointment-form').addEventListener('submit', event => {
  event.preventDefault();document.querySelector('#form-status').textContent = 'Pour convenir de votre rendez-vous, appelez le 04 66 52 10 00.';
});
document.querySelector('#current-year').textContent = new Date().getFullYear();

try {
  await loadScript('gsap');await loadScript('ScrollTrigger');
  ({gsap,ScrollTrigger} = window);initMotion();
} catch (error) {
  console.warn('Animation unavailable; static presentation retained.',error);
}
const images = slides.map(slide => slide.querySelector('img'));
// Show the first photograph as soon as it is decoded; the ring loads in parallel.
images[1].decode().then(() => {if(ready && wanted === 1)present(1);}).catch(()=>{});
Promise.allSettled([images[0].decode(), document.querySelector('.counter-background').decode()]).then(() => {
  ready = true;hero.classList.add('counter-ready');refresh();
  present(heroTrigger?.progress >= .48 ? 1 : 0);showHeader();
});
window.addEventListener('scroll', showHeader, {passive:true,once:true});
document.addEventListener('visibilitychange', () => {if(document.hidden)presentation?.pause();else presentation?.resume();});
reduced.addEventListener('change', () => {present(wanted,true);refresh();});
window.addEventListener('pagehide', event => {if(event.persisted)presentation?.pause();else{presentation?.kill();heroTrigger?.kill();media?.revert();}});
window.addEventListener('pageshow', event => {if(event.persisted){refresh();presentation?.resume();}});
