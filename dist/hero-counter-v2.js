import './vendor/gsap.min.js';
import './vendor/ScrollTrigger.min.js';
const {gsap, ScrollTrigger} = window;
gsap.registerPlugin(ScrollTrigger);

// Each reveal runs once. Native touch and wheel scrolling remain in control.
const motion = gsap.matchMedia();
motion.add('(prefers-reduced-motion: no-preference)', () => {
  document.querySelectorAll('.storefront-copy, .maison-top, .story, .section-heading, .universe-card, .atelier-intro, .service-list, .faq h2, .faq-grid, .contact-intro, #appointment-form').forEach(element => {
    gsap.from(element, {y:28, opacity:0, duration:.8, ease:'power2.out',
      scrollTrigger:{trigger:element, start:'top 93%', once:true}, clearProps:'transform,opacity'});
  });
});
document.fonts.ready.then(() => ScrollTrigger.refresh());
document.querySelectorAll('details').forEach(detail => detail.addEventListener('toggle', () => ScrollTrigger.refresh()));
document.querySelectorAll('img[loading="lazy"]').forEach(image => image.addEventListener('load', () => ScrollTrigger.refresh(), {once:true}));
window.addEventListener('pagehide', () => motion.revert(), {once:true});
window.addEventListener('pageshow', event => { if (event.persisted) ScrollTrigger.refresh(); });

const hero = document.querySelector('.counter-hero');
const stage = document.querySelector('.counter-stage');
const header = document.querySelector('.site-header');
const slides = [...document.querySelectorAll('.counter-slide')];
const foreground = document.querySelector('.counter-parallax');
const background = document.querySelector('.counter-background');
const progress = document.querySelector('.counter-progress-fill');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width:760px)');

let ready = false;
let requestedSlide = -1;
let transitionId = 0;
let animation;
let heroTop = 0;
let scrollRange = 1;
let viewportWidth = 1;
let viewportHeight = 1;
let frame = 0;

function showHeader() {
  header.classList.add('visible');
  header.inert = false;
}

async function present(index) {
  if (!ready) return;
  if (!slides[index].querySelector('img').naturalWidth) {
    index = slides.findIndex(slide => slide.querySelector('img').naturalWidth > 0);
  }
  if (index < 0 || requestedSlide === index) return;
  requestedSlide = index;
  const revision = ++transitionId;
  const target = slides[index];
  const outgoing = slides.find(slide => !slide.hidden);
  const outgoingImage = outgoing?.querySelector('.counter-arrival');
  const currentTransform = outgoingImage ? getComputedStyle(outgoingImage).transform : 'none';
  animation?.cancel();

  if (reducedMotion.matches) {
    slides.forEach(slide => { slide.hidden = slide !== target; });
    return;
  }

  // Move the complete photograph together: fingers, box and contact shadow.
  const spriteWidth = Math.min(1080, viewportHeight * .96, viewportWidth * 2.6);
  const outside = viewportWidth / 2 + spriteWidth / 2;
  const outsideTransform = 'translate3d(' + outside + 'px,0,0)';
  if (outgoing && outgoing !== target) {
    animation = outgoingImage.animate([
      {transform: currentTransform},
      {transform: outsideTransform}
    ], {duration: 340, easing: 'cubic-bezier(.4,0,.65,.4)', fill: 'forwards'});
    try { await animation.finished; } catch { return; }
    if (revision !== transitionId) return;
    outgoing.hidden = true;
    // A short real-time handoff avoids a blank interval tied to scroll distance.
    await new Promise(resolve => setTimeout(resolve, 60));
    if (revision !== transitionId) return;
  }

  target.hidden = false;
  const targetImage = target.querySelector('.counter-arrival');
  const from = outgoing === target ? currentTransform : outsideTransform;
  animation = targetImage.animate([
    {transform: from},
    {transform: 'translate3d(0,0,0)'}
  ], {duration: 580, easing: 'cubic-bezier(.18,.7,.28,1)', fill: 'forwards'});
  if (document.hidden) animation.pause();
  try { await animation.finished; } catch { return; }
  if (revision !== transitionId) return;
  targetImage.style.transform = 'translate3d(0,0,0)';
  animation.cancel();
  animation = undefined;
  showHeader();
}

function draw() {
  frame = 0;
  const distance = Math.max(0, scrollY - heroTop);
  const amount = Math.min(1, distance / scrollRange);
  progress.style.transform = 'scaleX(' + amount + ')';
  const depth = reducedMotion.matches ? 0 : amount * viewportHeight;
  foreground.style.transform = 'translate3d(0,' + -depth * .035 + 'px,0)';
  background.style.transform = 'translate3d(0,' + depth * .018 + 'px,0) scale(1.025)';
  present(amount >= .58 ? 1 : 0);
  if (distance > 3) showHeader();
}

function queue() {
  if (!frame) frame = requestAnimationFrame(draw);
}

function measure() {
  heroTop = hero.getBoundingClientRect().top + scrollY;
  viewportHeight = stage.clientHeight;
  viewportWidth = stage.clientWidth;
  scrollRange = Math.max(1, hero.offsetHeight - viewportHeight);
  queue();
}

window.addEventListener('scroll', queue, {passive: true});
window.addEventListener('resize', measure, {passive: true});
document.addEventListener('visibilitychange', () => {
  if (animation) {
    if (document.hidden) animation.pause();
    else animation.play();
  }
  if (!document.hidden) queue();
});
reducedMotion.addEventListener('change', () => {
  transitionId++;
  animation?.cancel();
  slides.forEach(slide => { slide.hidden = true; });
  requestedSlide = -1;
  queue();
});

const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.card-nav');
function closeMenu(returnFocus = false) {
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Ouvrir le menu');
  nav.inert = true;
  nav.classList.remove('open');
  header.classList.remove('menu-open');
  if (returnFocus) toggle.focus();
}
toggle.addEventListener('click', () => {
  if (toggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    return;
  }
  toggle.setAttribute('aria-expanded', 'true');
  toggle.setAttribute('aria-label', 'Fermer le menu');
  nav.inert = false;
  nav.classList.add('open');
  header.classList.add('menu-open');
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
document.addEventListener('pointerdown', event => {
  if (!header.contains(event.target)) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
});
mobile.addEventListener('change', () => closeMenu());
document.querySelector('#appointment-form').addEventListener('submit', event => {
  event.preventDefault();
  document.querySelector('#form-status').textContent =
    'Pour convenir de votre rendez-vous, appelez le 04 66 52 10 00.';
});
document.querySelector('#current-year').textContent = new Date().getFullYear();

measure();
const images = slides.map(slide => slide.querySelector('img'));
Promise.allSettled(images.map(image => image.decode())).then(() => {
  ready = true;
  hero.classList.add('counter-ready');
  measure();
  showHeader();
});
