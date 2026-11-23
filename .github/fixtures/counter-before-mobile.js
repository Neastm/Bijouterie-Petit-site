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
let gsap, ScrollTrigger, presentation, heroTrigger, media, destroySmoothScroll, destroyLogoLoop;
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
  const edge = stage.getBoundingClientRect().right + 32;
  const planeX = Number(gsap.getProperty(document.querySelector('.counter-parallax'),'x')) || 0;
  // Measure the entire real photograph. Hide it only once its LEFT edge has
  // cleared the viewport, including the glove, sleeve and contact shadow.
  let enterX = 0;
  if (outgoing !== target) {
    target.hidden = false;
    gsap.set(arrival, {x:0,y:-3,autoAlpha:0});
    enterX = Math.max(0,edge-(arrival.getBoundingClientRect().left-planeX));
    gsap.set(arrival, {x:enterX,autoAlpha:1});
    target.hidden = true;
  }
  presentation = gsap.timeline({paused:true,onComplete:finish,defaults:{overwrite:'auto'}});
  let enterAt = 0;
  if (outgoing && outgoing !== target) {
    const hand = outgoing.querySelector('.counter-arrival');
    const leaveX = Number(gsap.getProperty(hand,'x')) + Math.max(0,edge-(hand.getBoundingClientRect().left-planeX));
    presentation.to(hand, {x:leaveX,y:-3,duration:.65,ease:'power2.inOut'},0);
    presentation.call(() => {outgoing.hidden = true;},null,.65);
    // A real-time pause, independent of scroll speed, separates the two gestures.
    enterAt = .85;
  }
  if (outgoing !== target) {
    presentation.call(() => {target.hidden = false;}, null, enterAt);
  }
  // The entire photograph moves together: no rotation, stretching or floating box.
  presentation.to(arrival, {x:0,y:0,duration:.85,ease:'power2.inOut',force3D:true},enterAt);
  presentation.fromTo(target.querySelector('.counter-contact-shadow'),
    {opacity:.25, scaleX:.94}, {opacity:1, scaleX:1, duration:.45, ease:'sine.out'}, enterAt+.16);
  if (!document.hidden) presentation.play();
}

function refresh() { ScrollTrigger?.refresh(); }
function initMotion() {
  gsap.registerPlugin(ScrollTrigger);
  // Window scroll positions control progress; no transformed scrolling wrapper.
  heroTrigger = ScrollTrigger.create({
    trigger:hero, start:'top top', end:'bottom bottom',
    onUpdate:self => {
      gsap.set('.counter-progress-fill', {scaleX:self.progress});
      present(self.progress >= .42 ? 1 : 0);
      if (self.progress > .005) showHeader();
    }
  });
  media = gsap.matchMedia();
  // Touch scrolling stays compositor-driven: no text reveals, scrubbed photos
  // or transformed backdrop-filter panels on phones (particularly iOS Safari).
  media.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
    // The final ring stays on the counter while the hero scrolls out naturally.
    gsap.to('.counter-parallax', {y:() => -stage.clientHeight*.045, ease:'none',
      scrollTrigger:{trigger:hero,start:'top top',end:'bottom bottom',scrub:.18,invalidateOnRefresh:true}});
    const exit = gsap.timeline({scrollTrigger:{trigger:hero,start:'bottom bottom',end:'bottom 12%',scrub:.25,invalidateOnRefresh:true}});
    exit.to('.counter-room', {yPercent:-5,scale:1.12,duration:1,ease:'none'},0)
      .to('.counter-progress', {autoAlpha:0,duration:.5},.05);
    const boutique = document.querySelector('#boutique');
    gsap.fromTo('.storefront-background', {yPercent:-9,scale:1.21}, {yPercent:3,scale:1.09,ease:'none',
      scrollTrigger:{trigger:boutique,start:'top bottom',end:'top top',scrub:.3}});
    document.querySelectorAll('.storefront-copy, .section-heading, .atelier-intro, .service-list, .faq h2, .faq-grid, .contact-intro, #appointment-form').forEach(element => {
      gsap.from(element, {y:28, opacity:0, duration:.8, ease:'power2.out',
        scrollTrigger:{trigger:element,start:'top 92%',once:true},clearProps:'transform,opacity'});
    });
    const address = gsap.timeline({scrollTrigger:{trigger:'#venir',start:'top 82%',once:true}});
    address.from('.arrival-copy',{y:24,opacity:0,duration:.65,ease:'power2.out'})
      .from('.map-art',{scale:1.12,opacity:0,duration:1,ease:'power2.out'},.05)
      .from('.map-photo-marker',{scale:2.5,y:-65,opacity:0,duration:1.1,ease:'power3.out'},.16)
      .from('.map-place-label',{y:8,opacity:0,duration:.5},.75);
    const family=gsap.timeline({scrollTrigger:{trigger:'#maison',start:'top 83%',once:true}});
    family.from('.family-visual',{y:30,opacity:0,duration:.85,ease:'power2.out'})
      .from('.family-copy h2, .family-copy>p, .family-copy>.underlined',{y:20,opacity:0,duration:.65,stagger:.12,ease:'power2.out'},.16)
      .from('.lineage-progress',{scaleX:0,duration:1.1,ease:'power2.inOut'},.5)
      .from('.family-lineage li',{y:12,opacity:0,duration:.5,stagger:.18},.65);
    gsap.fromTo('.family-image-inner',{yPercent:-2,scale:1.08},{yPercent:2,scale:1.08,ease:'none',scrollTrigger:{trigger:'#maison',start:'top bottom',end:'bottom top',scrub:.35}});
    document.querySelectorAll('.collection-scene').forEach((scene,index)=>{
      const reveal=gsap.timeline({scrollTrigger:{trigger:scene,start:'top 86%',once:true}});
      reveal.from(scene.querySelector('.collection-visual'),{y:30,opacity:0,duration:.8,ease:'power2.out'})
        .from(scene.querySelector('.collection-copy'),{opacity:0,duration:.65,ease:'power2.out'},.18);
      const from=index?{yPercent:0,scale:.99}:{yPercent:-2,scale:1.055};
      const to=index?{yPercent:0,scale:1}:{yPercent:2,scale:1.055};
      gsap.fromTo(scene.querySelector('.collection-photo'),from,{...to,ease:'none',scrollTrigger:{trigger:scene,start:'top bottom',end:'bottom top',scrub:.3}});
    });
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
  mapToggle.textContent = show ? 'Fermer la carte' : 'Explorer la carte';
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
let lastWidth = innerWidth, resizeTimer;
window.addEventListener('resize', () => {
  if (innerWidth === lastWidth) return;
  lastWidth = innerWidth;clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {if(ready)present(wanted,true);refresh();},140);
},{passive:true});
document.querySelector('#appointment-form').addEventListener('submit', event => {
  event.preventDefault();document.querySelector('#form-status').textContent = 'Pour convenir de votre rendez-vous, appelez le 04 66 52 10 00.';
});
document.querySelector('#current-year').textContent = new Date().getFullYear();

try {
  await loadScript('gsap');await loadScript('ScrollTrigger');
  ({gsap,ScrollTrigger} = window);initMotion();
  try {
    const {initLogoLoop} = await import('./logo-loop.js?v=1');
    destroyLogoLoop = initLogoLoop(document.querySelector('.exclusivities .logoloop'),gsap);
  } catch (error) {console.warn('Logo animation unavailable; static brand list retained.',error);}
  // Scrolling is an optional enhancement; a failed load retains native input.
  try {
    const {initSmoothScroll} = await import('./smooth-scroll.js?v=1');
    destroySmoothScroll = initSmoothScroll(gsap,ScrollTrigger);
  } catch (error) {console.warn('Smooth scrolling unavailable; native scrolling retained.',error);}
} catch (error) {
  console.warn('Animation unavailable; static presentation retained.',error);
}
const images = slides.map(slide => slide.querySelector('img'));
// Show the first photograph as soon as it is decoded; the ring loads in parallel.
images[1].decode().then(() => {if(ready && wanted === 1)present(1);}).catch(()=>{});
Promise.allSettled([images[0].decode(), document.querySelector('.counter-background').decode()]).then(() => {
  ready = true;hero.classList.add('counter-ready');refresh();
  present(heroTrigger?.progress >= .42 ? 1 : 0);showHeader();
});
window.addEventListener('scroll', showHeader, {passive:true,once:true});
document.addEventListener('visibilitychange', () => {if(document.hidden)presentation?.pause();else presentation?.resume();});
reduced.addEventListener('change', () => {present(wanted,true);refresh();});
window.addEventListener('pagehide', event => {if(event.persisted)presentation?.pause();else{destroyLogoLoop?.();destroySmoothScroll?.();presentation?.kill();heroTrigger?.kill();media?.revert();}});
window.addEventListener('pageshow', event => {if(event.persisted){refresh();presentation?.resume();}});

