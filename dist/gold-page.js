// Beam noise and advected streaks adapted from React Bits LaserFlow (David Haz).
// See THIRD-PARTY-NOTICES.md. The beam coordinates are bent along a static strip.
const vertex = `
attribute vec4 strip;
attribute float radius;
uniform vec3 view;
varying float thickness;
varying vec2 uv;
void main() {
  uv = strip.zw;
  thickness = radius;
  vec2 position = vec2(strip.x / view.x, (strip.y - view.z) / view.y);
  gl_Position = vec4(2.0 * position.x - 1.0, 1.0 - 2.0 * position.y, 0.0, 1.0);
}
`;

const fragment = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 uv;
uniform float time;
uniform float head;
varying float thickness;
uniform float density;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
void main() {
  float distanceToHead = (head - uv.x) / (thickness * 1.65);
  if (distanceToHead <= 0.0) discard;
  float tip = sqrt(clamp(distanceToHead * (2.0 - distanceToHead), 0.0, 1.0));
  float phase = uv.x * .025 - time * 2.15;
  float wave = sin(phase) * 0.105 + sin(phase * 1.7 + 0.6) * 0.047;
  float shoulderOffset = (distanceToHead - 0.85) * 1.7;
  float shoulder = exp(-shoulderOffset * shoulderOffset);
  float width = (0.59 + 0.20 * shoulder + wave * (1.0 - shoulder))
              * mix(tip, 1.0, step(1.0, distanceToHead));
  float center = wave * smoothstep(0.0, 1.6, distanceToHead);
  float cross = (uv.y - center) / max(width, 0.01);
  float edge = min(.18, 1.15 / (density * thickness * max(width, .18)));
  float alpha = 1.0 - smoothstep(1.0 - edge, 1.0 + edge, abs(cross));
  if (alpha < 0.005) discard;

  float streak = 0.88 + 0.24 * noise(vec2(cross * 6.0, phase * 0.7));
  float bend = sin(phase + cross * 2.1) * 0.28 + sin(phase * 1.83 - cross * 3.0) * 0.13;
  float normalX = clamp(cross + bend * smoothstep(0.0, 1.5, distanceToHead), -1.0, 1.0);
  float reflection = 2.0 * normalX * sqrt(max(0.0, 1.0 - normalX * normalX));
  float softbox = pow(max(0.0, 1.0 - abs(reflection + 0.52)), 7.0);
  float stripLight = pow(max(0.0, 1.0 - abs(reflection - 0.70)), 13.0);
  float glint = pow(max(0.0, 1.0 - abs(normalX + 0.90)), 12.0);
  vec3 amber = mix(vec3(0.25, 0.10, 0.014), vec3(0.78, 0.43, 0.065),
                   0.48 + 0.22 * sin(phase * 0.72 + cross * 4.0));
  vec3 gold = amber * streak + vec3(1.0, 0.78, 0.36) * softbox * 0.81
            + vec3(1.0, 0.92, 0.68) * stripLight * 0.89
            + vec3(0.68, 0.44, 0.15) * glint * 0.48;
  gl_FragColor = vec4(gold, alpha);
}
`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

const clamp = value => Math.min(1, Math.max(0, value));

// All coordinates are relative to main. Only the visible band is rasterized.
function buildRoute(main) {
  const origin = main.getBoundingClientRect();
  const bounds = element => {
    const rect = element.getBoundingClientRect();
    return {top:rect.top-origin.top, bottom:rect.bottom-origin.top,
      left:rect.left-origin.left, right:rect.right-origin.left, height:rect.height};
  };
  const width = origin.width;
  const mobile = matchMedia('(max-width: 760px)').matches;
  const hero = bounds(main.querySelector('.scene-stage'));
  const box = bounds(main.querySelector('.product-box'));
  const panel = bounds(main.querySelector('.statement-content'));
  const photos = [...main.querySelectorAll('.universe-media')].map(bounds);
  const shop = bounds(main.querySelector('.boutique-photo .photo-window'));
  const contact = bounds(main.querySelector('.contact-intro'));
  const rail = mobile ? 11 : 21;
  const thin = mobile ? 8 : 13;
  const broad = Math.min(width * .07, mobile ? 29 : 55);
  const points = [];
  const spillways = [];
  const add = (x,y,r=thin) => {
    if (!points.length || y > points.at(-1).y + 1) points.push({x,y,r});
  };
  const branch = (...waypoints) => spillways.push(waypoints.map(([x,y,r])=>({x,y,r})));
  const impactX = box.left + (box.right-box.left)*(mobile ? .12 : .29);
  const impactY = Math.max(hero.top+hero.height*.31,box.top-(box.right-box.left)*.33);

  // Fall onto the lid and spill from the left edge of the case.
  add(impactX-broad*.16,hero.top,broad*.64);
  add(impactX,impactY,broad*.82);
  add(box.left+8,impactY+Math.min(73,box.height*.16),broad);
  add(Math.max(rail,box.left-8),box.top+box.height*.45,broad*.65);

  // Spread over the lip, hug the left edge, and briefly wick along the underside.
  const panelLeft = panel.left-5;
  const capillary = Math.min(62,(panel.right-panel.left)*.12);
  add(Math.max(panel.left+21,Math.min(panel.right-25,impactX)),panel.top-13,thin*1.45);
  add(panelLeft,panel.top+18,thin*1.46);
  add(panelLeft,panel.bottom-19,thin);
  add(panel.left+capillary,panel.bottom+12,thin*1.28);
  add(panel.left+capillary,panel.bottom+29,thin);
  add(rail,panel.bottom+Math.min(70,(photos[0].top-panel.bottom)*.35));

  const [jewels,watch] = photos;
  const jewelEntry=jewels.top+jewels.height*.17;
  const jewelSpill=Math.min(jewels.bottom-16,jewelEntry+Math.min(90,jewels.height*.34));
  const jewelCenter=jewels.left+(jewels.right-jewels.left)*.35;
  add(rail,jewels.top-12);
  add(jewelCenter,jewelEntry,thin*2.12);
  add(jewels.left+3,jewelSpill,thin*1.32);
  add(rail,jewels.bottom+15);

  if (watch.top < jewels.bottom) {
    const gap=(jewels.right+watch.left)/2;
    const junction=jewels.top+jewels.height*.30;
    const splitX=gap+1;
    branch([jewelCenter,jewelEntry,thin*1.45],
      [splitX,junction,thin*.9],
      [watch.left+(watch.right-watch.left)*.65,Math.max(junction+22,watch.top+watch.height*.40),thin*1.48],
      [watch.left+(watch.right-watch.left)*.81,watch.top+watch.height*.70,thin*.72]);
    branch([splitX,junction,thin*.85],[gap,jewels.bottom+20,thin*.69],
      [gap,jewels.bottom+48,thin*.62]);
  } else {
    add(rail,watch.top+watch.height*.12);
    branch([rail,watch.top+watch.height*.12,thin*.87],
      [watch.left+(watch.right-watch.left)*.36,watch.top+watch.height*.28,thin*1.5],
      [watch.left+(watch.right-watch.left)*.76,watch.top+watch.height*.47,thin*1.22],
      [watch.left+(watch.right-watch.left)*.80,watch.top+watch.height*.71,thin*.62]);
    add(rail,watch.bottom+18);
  }

  // Collect on the storefront and continue along the outside of the form.
  add(rail,shop.top-12);
  add(shop.left+(shop.right-shop.left)*.29,shop.top+shop.height*.22,thin*1.65);
  add(shop.left+3,shop.top+shop.height*.53,thin*1.24);
  add(rail,shop.bottom+19);
  add(rail,contact.top-15);
  add(Math.max(rail,contact.left-4),contact.top+15,thin*1.19);
  add(Math.max(rail,contact.left-4),contact.bottom-12);
  add(rail,contact.bottom+32);
  add(rail,origin.height-14,thin*.8);

  const paths=[points,...spillways].map(sampleStrip);
  const vertices=new Float32Array(paths.reduce((sum,path)=>sum+path.vertices.length,0));
  let offset=0;
  for (const path of paths) {
    path.first=offset/5;
    vertices.set(path.vertices,offset);
    offset+=path.vertices.length;
  }
  return {vertices,paths,samples:paths[0].samples,width,height:origin.height,hero,
    documentHeight:document.documentElement.scrollHeight};
}

function sampleStrip(points) {
  const samples=[];
  let distance=0;
  const mix = (a,b,t) => ({
    x:a.x+(b.x-a.x)*t, y:a.y+(b.y-a.y)*t, r:a.r+(b.r-a.r)*t
  });
  function push(point) {
    const previous=samples.at(-1);
    if (previous) {
      const step=Math.hypot(point.x-previous.x,point.y-previous.y);
      if (step<.01) return;
      distance+=step;
    }
    samples.push({...point,distance});
  }
  function line(a,b) {
    const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/6));
    for (let i=1;i<=steps;i++) push(mix(a,b,i/steps));
  }

  // Round each contact with a tangent-continuous bend. Trimming both sides
  // of each knot preserves gravity: every point still lies below the last.
  let cursor=points[0];
  push(cursor);
  for (let i=1;i<points.length-1;i++) {
    const before=points[i-1], corner=points[i], after=points[i+1];
    const incoming=Math.hypot(corner.x-before.x,corner.y-before.y);
    const outgoing=Math.hypot(after.x-corner.x,after.y-corner.y);
    const trim=Math.min(incoming*.44,outgoing*.44,Math.max(27,corner.r*2.5));
    const start=mix(corner,before,trim/incoming);
    const end=mix(corner,after,trim/outgoing);
    line(cursor,start);
    const steps=Math.max(6,Math.ceil(trim/2.8));
    for (let j=1;j<=steps;j++) {
      const t=j/steps;
      push(mix(mix(start,corner,t),mix(corner,end,t),t));
    }
    cursor=end;
  }
  line(cursor,points.at(-1));
  const vertices=[];
  for (let i=0;i<samples.length;i++) {
    const p=samples[i], before=samples[Math.max(0,i-1)], after=samples[Math.min(samples.length-1,i+1)];
    const dx=after.x-before.x,dy=after.y-before.y,length=Math.hypot(dx,dy)||1;
    p.nx=-dy/length;
    p.ny=dx/length;
    for (const sign of [-1,1]) {
      vertices.push(p.x+sign*p.nx*p.r,p.y+sign*p.ny*p.r,p.distance,sign,p.r);
    }
  }
  return {vertices:new Float32Array(vertices),samples};
}

function distanceAtY(samples,y) {
  let first=0,last=samples.length-1;
  while (last-first>1) {
    const middle=(first+last)>>1;
    if (samples[middle].y<y) first=middle;
    else last=middle;
  }
  const a=samples[first], b=samples[last];
  return a.distance+(b.distance-a.distance)*clamp((y-a.y)/(b.y-a.y));
}

function headY(route,top,viewport,elapsed) {
  const intro=clamp(elapsed/1950);
  const begin=route.samples[0].y;
  const end=route.hero.top+route.hero.height*.71;
  const rest=begin+(end-begin)*(1-Math.pow(1-intro,2));
  const scrollHead=Math.max(0,top)+Math.min(viewport*.71,end);
  const remaining=Math.max(0,route.documentHeight-viewport-window.scrollY);
  const finishHead=route.height-14-remaining*1.5;
  return rest+(Math.max(rest,scrollHead,finishHead)-rest)*clamp(Math.max(0,top)/100);
}

function startVectorGold(main,layer,startedAt) {
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg');
  // Paint a continuous metallic cross-section as overlapping vector strips.
  // Reflection bands bend independently of the silhouette as the surface rolls.
  const stops=[
    [-1,'#5f2e0b'],[-.88,'#a86418'],[-.69,'#e9a52e'],
    [-.52,'#ffe6a3'],[-.39,'#f9c65e'],[-.23,'#b9761d'],
    [.00,'#78410d'],[.22,'#995213'],[.43,'#d99932'],
    [.60,'#ffe9b4'],[.72,'#e8aa42'],[.87,'#a15a15'],[1,'#68350c']
  ].map(([position,color])=>[position, color.slice(1).match(/../g).map(channel=>parseInt(channel,16))]);
  function shade(cross) {
    const index=stops.findIndex(([position])=>position>=cross);
    const [a,low]=stops[Math.max(0,index-1)], [b,high]=stops[Math.max(0,index)];
    const t=b===a ? 0 : (cross-a)/(b-a);
    const eased=t*t*(3-2*t);
    return 'rgb('+low.map((channel,i)=>Math.round(channel+(high[i]-channel)*eased)).join(',')+')';
  }
  const strips=24;
  const makeBands=()=>Array.from({length:strips+1},(_,i)=>{
    const path=document.createElementNS(ns,'path');
    const left=i===0 ? -1 : -1+(i-1)*2/strips;
    const right=i===0 ? 1 : Math.min(1,left+2.24/strips);
    path.setAttribute('fill',i===0 ? '#a56a22' : shade((left+right)/2));
    svg.append(path);
    return {left,right,path};
  });
  layer.replaceChildren(svg);
  main.prepend(layer);
  main.classList.add('has-gold-route');
  let route, dirty=true, raf=0,lastTop=NaN,lastDraw=-Infinity;
  const streams=[];
  function queue() { if (!raf) raf=requestAnimationFrame(draw); }
  function invalidate() { dirty=true; queue(); }
  function draw(now) {
    raf=0;
    if (document.hidden) return;
    const top=-main.getBoundingClientRect().top;
    const viewport=window.innerHeight;
    if (!dirty && (top>route.height || top+viewport<0)) return;
    if (!dirty && top===lastTop && now-lastDraw<39) { queue(); return; }
    if (dirty) { route=buildRoute(main); dirty=false; }
    lastTop=top;
    lastDraw=now;
    const y=headY(route,top,viewport,now-startedAt);
    const time=(now-startedAt)*.0015;
    svg.setAttribute('viewBox','0 '+top+' '+route.width+' '+viewport);
    svg.style.height=viewport+'px';
    svg.style.transform='translate3d(0,'+top+'px,0)';
    route.paths.forEach(({samples},index)=>{
      const bands=streams[index] ?? (streams[index]=makeBands());
      const end=distanceAtY(samples,y);
      const visible=[];
      for (let i=0;i<samples.length;i++) {
        const point=samples[i];
        if (point.y<top-120) continue;
        if (point.y>top+viewport+120) break;
        if (point.distance>end) {
          const before=samples[i-1];
          if (before && visible.length) {
            const t=(end-before.distance)/(point.distance-before.distance);
            visible.push({x:before.x+(point.x-before.x)*t,y:before.y+(point.y-before.y)*t,
              r:point.r,distance:end,nx:point.nx,ny:point.ny});
          }
          break;
        }
        visible.push(point);
      }
      const surface=visible.map(point=>{
        const nose=clamp((end-point.distance)/(point.r*1.55));
        const cap=Math.sqrt(nose*(2-nose));
        const phase=point.distance*.021-time;
        const swell=.60+.085*Math.sin(phase)+.055*Math.sin(phase*.53+1.8);
        const bulb=.12*Math.exp(-Math.pow((end-point.distance)/(point.r*1.3)-.7,2));
        const radius=point.r*(swell+bulb)*cap;
        const offset=radius*(.10*Math.sin(phase*.81)+.045*Math.sin(phase*1.8))*nose;
        const roll=.31*Math.sin(phase*.73+1.1)+.15*Math.sin(phase*1.57);
        return {...point,radius,offset,roll};
      });
      for (const {left,right,path} of bands) {
        const a=[],b=[];
        for (const point of surface) {
          for (const [cross,edge] of [[left,a],[right,b]]) {
            const shift=point.offset+point.radius*(cross+point.roll*(1-cross*cross));
            edge.push((point.x+point.nx*shift).toFixed(1)+','+(point.y+point.ny*shift).toFixed(1));
          }
        }
        path.setAttribute('d',a.length>1?'M'+a.concat(b.reverse()).join('L')+'Z':'');
      }
    });
    while (streams.length>route.paths.length) streams.pop().forEach(({path})=>path.remove());
    queue();
  }
  const size=new ResizeObserver(invalidate);
  size.observe(main);
  main.querySelectorAll('.scene-stage,.universe-media,.boutique-photo').forEach(element=>size.observe(element));
  window.addEventListener('resize',invalidate,{passive:true});
  window.addEventListener('scroll',queue,{passive:true});
  document.addEventListener('visibilitychange',queue);
  queue();
}

export function startPageGold(main,startedAt) {
  if (!main || !('ResizeObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const layer=document.createElement('div');
  const canvas=document.createElement('canvas');
  layer.className='gold-page-layer';
  layer.setAttribute('aria-hidden','true');
  layer.append(canvas);
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,
    stencil:false,premultipliedAlpha:false,powerPreference:'low-power'});
  if (!gl) return startVectorGold(main,layer,startedAt);
  const program=gl.createProgram();
  try {
    for (const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fragment]]) {
      const shader=compile(gl,type,source);
      gl.attachShader(program,shader);
      gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) {
    gl.deleteProgram(program);
    console.warn('Gold flow fallback:',error);
    return startVectorGold(main,layer,startedAt);
  }

  const buffer=gl.createBuffer();
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for (const [name,size,offset] of [['strip',4,0],['radius',1,16]]) {
    const location=gl.getAttribLocation(program,name);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location,size,gl.FLOAT,false,20,offset);
  }
  const uniforms=Object.fromEntries(['time','head','view','density'].map(name=>[name,gl.getUniformLocation(program,name)]));
  const overscan=144;
  let route,bandHeight,bandTop=NaN,raf=0,lastDraw=-Infinity,lastTop=NaN,dirty=true;
  function invalidate() { dirty=true; resume(); }
  function resume() {
    if (!raf && !document.hidden) raf=requestAnimationFrame(frame);
  }
  function frame(now) {
    raf=0;
    if (document.hidden) return;
    const top=-main.getBoundingClientRect().top;
    const viewport=window.innerHeight;
    if (!dirty && (top>route.height || top+viewport<0)) return;
    if (dirty) {
      route=buildRoute(main);
      bandHeight=viewport+overscan*2;
      const scale=Math.min(devicePixelRatio||1,3,Math.sqrt(3300000/(route.width*bandHeight)));
      canvas.width=Math.max(1,Math.round(route.width*scale));
      canvas.height=Math.max(1,Math.round(bandHeight*scale));
      canvas.style.height=bandHeight+'px';
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.bufferData(gl.ARRAY_BUFFER,route.vertices,gl.STATIC_DRAW);
      gl.uniform1f(uniforms.density,scale);
      bandTop=NaN;
      dirty=false;
      lastDraw=-Infinity;
    }
    if (top!==lastTop || now-lastDraw>=32) {
      if (!Number.isFinite(bandTop) || top<bandTop+16 || top+viewport>bandTop+bandHeight-16) {
        bandTop=Math.floor(top/overscan)*overscan-overscan;
        canvas.style.transform='translate3d(0,'+bandTop+'px,0)';
        gl.uniform3f(uniforms.view,route.width,bandHeight,bandTop);
      }
      const y=headY(route,top,viewport,now-startedAt);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.time,((now-startedAt)/1000)%900);
      for (const path of route.paths) {
        if (path.samples[0].y>y || path.samples.at(-1).y<bandTop-70 ||
            path.samples[0].y>bandTop+bandHeight+70) continue;
        gl.uniform1f(uniforms.head,distanceAtY(path.samples,y));
        gl.drawArrays(gl.TRIANGLE_STRIP,path.first,path.vertices.length/5);
      }
      lastTop=top;
      lastDraw=now;
    }
    resume();
  }
  main.prepend(layer);
  main.classList.add('has-gold-route');
  const size=new ResizeObserver(invalidate);
  size.observe(main);
  main.querySelectorAll('.scene-stage,.universe-media,.boutique-photo').forEach(element=>size.observe(element));
  window.addEventListener('resize',invalidate,{passive:true});
  window.addEventListener('scroll',resume,{passive:true});
  document.addEventListener('visibilitychange',resume);
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();
    cancelAnimationFrame(raf);
    size.disconnect();
    window.removeEventListener('resize',invalidate);
    window.removeEventListener('scroll',resume);
    document.removeEventListener('visibilitychange',resume);
    startVectorGold(main,layer,startedAt);
  },{once:true});
  frame(startedAt);
}
