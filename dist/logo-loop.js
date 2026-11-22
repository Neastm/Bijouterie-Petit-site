// Logo Loop, adapted from React Bits (David Haz), MIT + Commons Clause.
// Source and license: ./vendor/react-bits/README.md and LICENSE.md.
// The original period wrapping and exponential velocity smoothing run on GSAP's
// existing clock. This static site does not need a second React rendering tree.
export function initLogoLoop(root,gsap) {
  if (!root) return () => {};
  const track=root.querySelector('.logoloop__track');
  const sequence=track.firstElementChild;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let period=0,offset=0,velocity=0,last=null,visible=false,hovered=false,running=false;
  const speed=32, smoothTau=.25;

  function pause() {
    gsap.ticker.remove(animate);running=false;last=null;
    delete root.dataset.running;
  }
  function animate(time) {
    if (!visible || document.hidden || motion.matches) return pause();
    if(last===null)last=time;
    const delta=Math.min(.05,Math.max(0,time-last));last=time;
    const target=hovered?0:speed;
    velocity+=(target-velocity)*(1-Math.exp(-delta/smoothTau));
    if(period>0){offset=((offset+velocity*delta)%period+period)%period;track.style.transform=`translate3d(${-offset}px,0,0)`;}
    if(hovered && Math.abs(velocity)<.05)pause();
  }
  function wake() {
    if(running || !visible || document.hidden || motion.matches || !period)return;
    running=true;root.dataset.running='true';gsap.ticker.add(animate);
  }
  function measure() {
    period=sequence.getBoundingClientRect().width;
    if(!period)return;
    const copies=Math.max(2,Math.ceil(root.clientWidth/period)+2);
    while(track.children.length>copies)track.lastElementChild.remove();
    while(track.children.length<copies){
      const copy=sequence.cloneNode(true);copy.setAttribute('aria-hidden','true');copy.inert=true;
      copy.querySelectorAll('img').forEach(image=>{image.alt='';image.loading='eager';});
      track.append(copy);
    }
    offset=((offset%period)+period)%period;
    if(motion.matches){pause();track.style.transform='';offset=0;velocity=0;}
    else{track.style.transform=`translate3d(${-offset}px,0,0)`;wake();}
  }
  function visibility(){if(document.hidden)pause();else wake();}
  function enter(event){if(event.pointerType==='mouse'){hovered=true;wake();}}
  function leave(){hovered=false;wake();}
  const observer=new IntersectionObserver(entries=>{
    visible=entries.at(-1).isIntersecting;
    if(visible)wake();else pause();
  },{threshold:0});
  const resize=new ResizeObserver(measure);
  observer.observe(root);resize.observe(root);resize.observe(sequence);
  root.addEventListener('pointerenter',enter);root.addEventListener('pointerleave',leave);
  document.addEventListener('visibilitychange',visibility);
  motion.addEventListener('change',measure);
  // Fetch the complete short sequence, including logos initially outside the
  // viewport. Otherwise native lazy loading leaves gaps when the track loops.
  sequence.querySelectorAll('img').forEach(image=>{image.addEventListener('load',measure);image.loading='eager';});
  measure();
  return()=>{
    pause();observer.disconnect();resize.disconnect();
    root.removeEventListener('pointerenter',enter);root.removeEventListener('pointerleave',leave);
    document.removeEventListener('visibilitychange',visibility);motion.removeEventListener('change',measure);
    sequence.querySelectorAll('img').forEach(image=>image.removeEventListener('load',measure));
  };
}
