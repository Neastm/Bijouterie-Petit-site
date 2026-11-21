import {initReactBits} from './reactbits-adapted.js';
import {initGlassSurfaces} from './liquid-glass.js';

initReactBits();
initGlassSurfaces();

const hero = document.querySelector('.counter-hero');
const header = document.querySelector('.site-header');
let slides = [...document.querySelectorAll('.counter-slide')];
const progress = document.querySelector('.counter-progress-fill');
const foreground = document.querySelector('.counter-parallax');
const background = document.querySelector('.counter-background');
const caption = document.querySelector('.counter-product-name');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width:760px)');
const slideDuration = 10500;

let slideIndex = 0;
let animations = [];
let ready = false;
let heroVisible = true;
let heroTop = 0;
let heroHeight = innerHeight;
let scrollFrame = 0;
let headerTimer;
let stopped = false;

function showHeader() {
  clearTimeout(headerTimer);
  header.classList.add('visible');
  header.inert = false;
}

function shouldPlay() {
  return heroVisible && !document.hidden && !reducedMotion.matches;
}

function playSlide() {
  slides.forEach((slide, index) => {
    slide.hidden = index !== slideIndex;
    slide.setAttribute('aria-hidden', String(index !== slideIndex));
  });
  const slide = slides[slideIndex];
  caption.textContent = slide.dataset.caption;
  progress.style.transform = 'scaleX(0)';
  if (reducedMotion.matches) {
    progress.style.transform = 'scaleX(1)';
    return;
  }
  const presentation = slide.querySelector('.counter-arrival');
  const movement = presentation.animate([
    {transform: 'translate3d(0,-115%,0) scale(.94)', opacity: 0, offset: 0},
    {transform: 'translate3d(0,-115%,0) scale(.94)', opacity: 0, offset: .055},
    {transform: 'translate3d(0,0,0) scale(1)', opacity: 1, offset: .24},
    {transform: 'translate3d(0,0,0) scale(1)', opacity: 1, offset: .87},
    {transform: 'translate3d(0,-115%,0) scale(.94)', opacity: 0, offset: 1}
  ], {
    duration: slideDuration,
    easing: 'cubic-bezier(.22,.75,.2,1)',
    fill: 'both'
  });
  const timer = progress.animate([
    {transform: 'scaleX(0)'},
    {transform: 'scaleX(1)'}
  ], {duration: slideDuration, easing: 'linear', fill: 'both'});
  animations = [movement, timer];
  if (!shouldPlay()) animations.forEach(animation => animation.pause());
  movement.finished.then(() => {
    if (stopped) return;
    animations.forEach(animation => animation.cancel());
    slideIndex = (slideIndex + 1) % slides.length;
    playSlide();
  }).catch(() => {});
}

function syncPlayback() {
  if (!ready) return;
  animations.forEach(animation => {
    if (shouldPlay()) animation.play();
    else animation.pause();
  });
}

function drawParallax() {
  scrollFrame = 0;
  const distance = Math.max(0, Math.min(heroHeight, scrollY - heroTop));
  const amount = reducedMotion.matches ? 0 : distance;
  foreground.style.transform = 'translate3d(0,' + amount * .13 + 'px,0)';
  background.style.transform = 'translate3d(0,' + amount * .045 + 'px,0) scale(1.045)';
}

function queueParallax() {
  if (scrollY > 3) showHeader();
  if (!scrollFrame) scrollFrame = requestAnimationFrame(drawParallax);
}

function measure() {
  heroTop = hero.getBoundingClientRect().top + scrollY;
  heroHeight = hero.offsetHeight;
  queueParallax();
}

new IntersectionObserver(entries => {
  heroVisible = entries[0].isIntersecting;
  syncPlayback();
}, {threshold: 0}).observe(hero);
document.addEventListener('visibilitychange', syncPlayback);
window.addEventListener('scroll', queueParallax, {passive: true});
window.addEventListener('resize', measure, {passive: true});
reducedMotion.addEventListener('change', () => {
  animations.forEach(animation => animation.cancel());
  if (ready) playSlide();
  drawParallax();
});
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  stopped = true;
  animations.forEach(animation => animation.cancel());
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
if (scrollY > 3 || reducedMotion.matches) showHeader();
const foregroundImages = slides.map(slide => slide.querySelector('img'));
Promise.allSettled(foregroundImages.map(image => image.decode())).then(() => {
  slides = slides.filter(slide => {
    const image = slide.querySelector('img');
    if (image.naturalWidth > 0) return true;
    slide.hidden = true;
    return false;
  });
  if (!slides.length) {
    caption.textContent = '';
    showHeader();
    return;
  }
  hero.classList.add('counter-ready');
  ready = true;
  playSlide();
  headerTimer = setTimeout(showHeader, reducedMotion.matches ? 0 : 2900);
});
