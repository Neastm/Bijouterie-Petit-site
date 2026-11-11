// Stack-neutral adaptation of React Bits GlassSurface's backdrop displacement.
// Official reference: reactbits.dev/components/glass-surface (David Haz).
export function initGlassSurfaces(){
 const ns='http://www.w3.org/2000/svg',supported=CSS.supports('backdrop-filter','url(#glass)')&&/Chrome|Chromium|Edg\//.test(navigator.userAgent);
 const panels=[...document.querySelectorAll('.liquid-glass')];
 if(!supported)return; // Safari/Firefox retain the CSS frosted-glass layer.
 const svg=document.createElementNS(ns,'svg');svg.setAttribute('aria-hidden','true');svg.setAttribute('width','0');svg.setAttribute('height','0');svg.style.position='absolute';const defs=document.createElementNS(ns,'defs');svg.append(defs);document.body.append(svg);
 panels.forEach((panel,i)=>{
  const id='petit-glass-'+i,filter=document.createElementNS(ns,'filter');filter.id=id;filter.setAttribute('color-interpolation-filters','sRGB');filter.setAttribute('x','0');filter.setAttribute('y','0');filter.setAttribute('width','100%');filter.setAttribute('height','100%');
  const image=document.createElementNS(ns,'feImage');image.setAttribute('result','edge-map');image.setAttribute('preserveAspectRatio','none');image.setAttribute('width','100%');image.setAttribute('height','100%');
  const displace=document.createElementNS(ns,'feDisplacementMap');displace.setAttribute('in','SourceGraphic');displace.setAttribute('in2','edge-map');displace.setAttribute('scale','16');displace.setAttribute('xChannelSelector','R');displace.setAttribute('yChannelSelector','G');filter.append(image,displace);defs.append(filter);
  panel.style.setProperty('--glass-refraction',`url(#${id})`);
  let oldWidth=0,oldHeight=0;
  const update=()=>{const w=Math.round(panel.clientWidth),h=Math.round(panel.clientHeight);if(!w||!h||(w===oldWidth&&h===oldHeight))return;oldWidth=w;oldHeight=h;
   const radius=parseFloat(getComputedStyle(panel).borderRadius)||28;
   const map=`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="edge-x"><stop stop-color="#ff8080"/><stop offset=".07" stop-color="#808080"/><stop offset=".93" stop-color="#808080"/><stop offset="1" stop-color="#008080"/></linearGradient><linearGradient id="edge-y" x2="0" y2="1"><stop stop-color="#80ff80"/><stop offset=".08" stop-color="#808080"/><stop offset=".92" stop-color="#808080"/><stop offset="1" stop-color="#800080"/></linearGradient></defs><rect width="100%" height="100%" rx="${radius}" fill="url(#edge-x)"/><rect width="100%" height="100%" rx="${radius}" fill="url(#edge-y)" opacity=".5"/></svg>`;
   image.setAttribute('href','data:image/svg+xml,'+encodeURIComponent(map));
  };
  new ResizeObserver(update).observe(panel);update();
 });
}
