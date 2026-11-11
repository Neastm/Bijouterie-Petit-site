// ScrollVelocity from React Bits uses a damped spring to smooth scroll velocity.
// Apply the same spring principle to the document position without a React dependency.
export function installScrollPace() {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const controls = 'input, textarea, select, [contenteditable], [role="dialog"], [data-native-scroll]';
  const wheelScale = .68;
  const touchScale = .82;
  let frame = 0, lastTime = 0, lastWritten = 0;
  let position = 0, target = 0, velocity = 0, rate = 16, max = 0;
  let gesture = null;
  const limit = (value, low, high) => Math.min(high, Math.max(low, value));

  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    velocity = 0;
  }

  function tick(now) {
    const seconds = limit((now - lastTime) / 1000, 0, .1);
    lastTime = now;
    const distance = position - target;
    const slope = velocity + rate * distance;
    const decay = Math.exp(-rate * seconds);
    position = limit(target + (distance + slope * seconds) * decay, 0, max);
    velocity = (velocity - rate * slope * seconds) * decay;
    const settled = Math.abs(position - target) < .75 && Math.abs(velocity) < 8;
    lastWritten = settled ? target : position;
    window.scrollTo({top: lastWritten, behavior: 'instant'});
    if (settled) stop();
    else frame = requestAnimationFrame(tick);
  }

  function advance(delta, frequency) {
    max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    if (!frame) {
      position = target = lastWritten = limit(window.scrollY, 0, max);
      lastTime = performance.now();
    }
    rate = frequency;
    target = limit(target + delta, 0, max);
    if (!frame && target !== position) frame = requestAnimationFrame(tick);
  }

  window.addEventListener('wheel', event => {
    const mode = event.deltaMode;
    if (motion.matches || event.defaultPrevented || event.ctrlKey || event.shiftKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY ||
        event.target.closest?.(controls)) return;
    if (!event.cancelable) { stop(); return; }
    const unit = mode === 1 ? 16 : mode === 2 ? window.innerHeight : 1;
    event.preventDefault();
    advance(event.deltaY * unit * wheelScale, 16);
  }, {passive: false});

  window.addEventListener('touchstart', event => {
    stop();
    gesture = null;
    if (motion.matches || event.touches.length !== 1 || event.target.closest?.(controls)) return;
    const {clientX: x, clientY: y} = event.touches[0];
    gesture = {x, y, time: event.timeStamp, vertical: false, speed: 0};
  }, {passive: true});

  window.addEventListener('touchmove', event => {
    if (!gesture || event.touches.length !== 1 || event.defaultPrevented) return;
    if (!event.cancelable) { gesture = null; stop(); return; }
    const {clientX: x, clientY: y} = event.touches[0];
    const dy = gesture.y - y;
    if (!gesture.vertical) {
      const dx = Math.abs(gesture.x - x);
      if (dx > 6 && dx > Math.abs(dy)) { gesture = null; return; }
      if (Math.abs(dy) < 4) return;
      gesture.vertical = true;
    }
    const elapsed = Math.max(10, event.timeStamp - gesture.time);
    gesture.speed = .40 * gesture.speed + .60 * dy / elapsed;
    gesture.y = y;
    gesture.time = event.timeStamp;
    event.preventDefault();
    advance(dy * touchScale, 34);
  }, {passive: false});

  window.addEventListener('touchend', event => {
    if (gesture?.vertical && event.timeStamp - gesture.time < 75) {
      advance(limit(gesture.speed * 105, -160, 160), 18);
    }
    gesture = null;
  }, {passive: true});
  window.addEventListener('touchcancel', () => { gesture = null; stop(); }, {passive: true});
  window.addEventListener('scroll', () => {
    if (frame && Math.abs(window.scrollY - lastWritten) > 2) stop();
  }, {passive: true});
  for (const event of ['keydown', 'pointerdown', 'hashchange', 'resize']) {
    window.addEventListener(event, stop, {passive: true});
  }
  motion.addEventListener('change', () => { gesture = null; stop(); });
}
