import {Lenis} from './vendor/lenis/lenis.js';

// Window remains the real scroller: sticky rooms, anchors and the scrollbar
// retain their native geometry. Only wheel input receives an easing curve.
export function initSmoothScroll(gsap, ScrollTrigger) {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const precisePointer = matchMedia('(pointer:fine)');
  const root = document.documentElement;
  let lenis, ticking = false, disposed = false;

  function sleep() {
    gsap.ticker.remove(tick);
    ticking = false;
    delete root.dataset.scrollRunning;
  }
  function tick(time) {
    lenis?.raf(time * 1000);
    if (lenis?.isScrolling !== 'smooth') sleep();
  }
  function wake() {
    if (disposed || document.hidden || !lenis || lenis.isScrolling !== 'smooth' || ticking) return;
    // Reset the clock after idle instead of applying elapsed background time.
    lenis.time = gsap.ticker.time * 1000;
    ticking = true;
    root.dataset.scrollRunning = 'true';
    gsap.ticker.add(tick);
  }
  function cancelInertia() {
    lenis?.scrollTo(window.scrollY, {immediate:true, force:true});
    sleep();
  }
  function configure() {
    cancelInertia();
    lenis?.destroy();
    lenis = undefined;
    root.dataset.scrollMode = 'native';
    if (preference.matches || !precisePointer.matches || disposed) return;
    lenis = new Lenis({
      autoRaf:false, smoothWheel:true, syncTouch:false,
      lerp:.12, wheelMultiplier:.9, anchors:false,
      respectReducedMotion:true,
      prevent:node => node.matches('textarea, select, [data-lenis-prevent], .card-nav, #local-map')
    });
    root.dataset.scrollMode = 'smooth';
    lenis.on('scroll', () => {ScrollTrigger.update();wake();});
    // Lenis emits virtual-scroll before starting its animation. Wake after that
    // input finishes, and release the ticker once the easing has settled.
    lenis.on('virtual-scroll', () => queueMicrotask(wake));
  }
  function navigate(event) {
    if (!lenis || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
    let target;
    try {target = document.getElementById(decodeURIComponent(url.hash.slice(1)));} catch {return;}
    if (!target) return;
    event.preventDefault();
    if (location.hash !== url.hash) history.pushState(null, '', url.hash);
    lenis.resize();
    lenis.scrollTo(target, {
      duration:.9, lerp:undefined, easing:t => 1 - Math.pow(1-t,3),
      onComplete:() => {
        // Keep keyboard navigation at the destination without another scroll.
        const temporary = !target.hasAttribute('tabindex');
        if (temporary) target.setAttribute('tabindex','-1');
        target.focus({preventScroll:true});
        if (temporary) target.addEventListener('blur',() => target.removeAttribute('tabindex'),{once:true});
      }
    });
    wake();
  }
  function keyboard(event) {
    if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) cancelInertia();
  }
  function visibility() {if (document.hidden) cancelInertia();}
  function restore() {cancelInertia();lenis?.resize();ScrollTrigger.refresh();}
  function refreshSize() {lenis?.resize();}

  preference.addEventListener('change',configure);
  precisePointer.addEventListener('change',configure);
  document.addEventListener('click',navigate);
  document.addEventListener('keydown',keyboard);
  window.addEventListener('pointerdown',cancelInertia,{passive:true});
  document.addEventListener('visibilitychange',visibility);
  window.addEventListener('popstate',cancelInertia);
  window.addEventListener('pageshow',restore);
  ScrollTrigger.addEventListener('refresh',refreshSize);
  configure();

  return () => {
    disposed = true;
    cancelInertia();lenis?.destroy();lenis = undefined;
    preference.removeEventListener('change',configure);
    precisePointer.removeEventListener('change',configure);
    document.removeEventListener('click',navigate);
    document.removeEventListener('keydown',keyboard);
    window.removeEventListener('pointerdown',cancelInertia);
    document.removeEventListener('visibilitychange',visibility);
    window.removeEventListener('popstate',cancelInertia);
    window.removeEventListener('pageshow',restore);
    ScrollTrigger.removeEventListener('refresh',refreshSize);
    delete root.dataset.scrollMode;
  };
}

