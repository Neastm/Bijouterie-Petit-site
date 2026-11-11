// Beam noise and advected streaks adapted from React Bits LaserFlow (David Haz).
// See THIRD-PARTY-NOTICES.md. The beam coordinates are bent along a static strip.
const vertex = `
attribute vec4 strip;
varying vec2 uv;
void main() {
  uv = strip.zw;
  gl_Position = vec4(strip.xy, 0.0, 1.0);
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
uniform float turns;
uniform float noseLength;
uniform float seed;
uniform float edge;

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
  float distanceToHead = (head - uv.x) / noseLength;
  if (distanceToHead <= 0.0) discard;
  float tip = sqrt(clamp(distanceToHead * (2.0 - distanceToHead), 0.0, 1.0));
  float phase = uv.x * turns - time * 2.15 + seed;
  float wave = sin(phase) * 0.085 + sin(phase * 2.1 + 0.6) * 0.035;
  float shoulderOffset = (distanceToHead - 0.85) * 1.7;
  float shoulder = exp(-shoulderOffset * shoulderOffset);
  float width = (0.59 + 0.20 * shoulder + wave * (1.0 - shoulder))
              * mix(tip, 1.0, step(1.0, distanceToHead));
  float center = wave * smoothstep(0.0, 1.6, distanceToHead);
  float cross = (uv.y - center) / max(width, 0.01);
  float alpha = 1.0 - smoothstep(1.0 - edge, 1.0 + edge, abs(cross));
  if (alpha < 0.005) discard;

  float streak = 0.88 + 0.24 * noise(vec2(cross * 6.0, phase * 0.7));
  float bend = sin(phase + cross * 2.1) * 0.22 + sin(phase * 1.83 - cross * 3.0) * 0.10;
  float normalX = clamp(cross + bend * smoothstep(0.0, 1.5, distanceToHead), -1.0, 1.0);
  float reflection = 2.0 * normalX * sqrt(max(0.0, 1.0 - normalX * normalX));
  float softbox = pow(max(0.0, 1.0 - abs(reflection + 0.52)), 7.0);
  float stripLight = pow(max(0.0, 1.0 - abs(reflection - 0.70)), 18.0);
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

// Layout defines the “toboggan”. Width opens at the bend as the flow goes
// around the image edge; opaque photos sit above the strip in the stack.
function stripRadius(width,height,hero) {
  return hero ? Math.min(width*.092, height*.15, 88) : height*.23;
}

function buildStrip(width, height, hero, reverse, portrait) {
  const points = hero
    ? (portrait ? [[-.13,.04],[.33,.17],[.31,.69],[.88,.88]]
                : [[-.09,.09],[.28,.13],[.65,.64],[.89,.84]])
    : [[-.08,.12],[.29,.15],[.56,.66],[.92,.82]];
  const [a,b,c,d] = points.map(([x,y]) => [(reverse ? 1-x : x)*width,y*height]);
  const vertices = [];
  const radius = stripRadius(width,height,hero);
  for (let i=0; i<=96; i++) {
    const t=i/96, m=1-t;
    const x=m*m*m*a[0]+3*m*m*t*b[0]+3*m*t*t*c[0]+t*t*t*d[0];
    const y=m*m*m*a[1]+3*m*m*t*b[1]+3*m*t*t*c[1]+t*t*t*d[1];
    const dx=3*(m*m*(b[0]-a[0])+2*m*t*(c[0]-b[0])+t*t*(d[0]-c[0]));
    const dy=3*(m*m*(b[1]-a[1])+2*m*t*(c[1]-b[1])+t*t*(d[1]-c[1]));
    const length=Math.hypot(dx,dy);
    const spread=radius*(1+.20*Math.exp(-((t-.55)*(t-.55))/.019));
    for (const side of [-1,1]) {
      vertices.push(2*(x-side*dy/length*spread)/width-1,
                    1-2*(y+side*dx/length*spread)/height, t, side);
    }
  }
  return new Float32Array(vertices);
}

function mount(picture, index, startedAt) {
  const canvas=document.createElement('canvas');
  const gl=canvas.getContext('webgl', {alpha:true, antialias:true,
    premultipliedAlpha:false, depth:false, stencil:false, powerPreference:'low-power'});
  if (!gl) return;
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
    return;
  }
  canvas.className='gold-laser-canvas';
  canvas.setAttribute('aria-hidden','true');
  picture.append(canvas);
  gl.useProgram(program);
  const attr=gl.getAttribLocation(program,'strip');
  const uniforms=Object.fromEntries(['time','head','turns','noseLength','seed','edge'].map(name=>[name,gl.getUniformLocation(program,name)]));
  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.enableVertexAttribArray(attr);
  gl.vertexAttribPointer(attr,4,gl.FLOAT,false,0,0);
  const hero=index===0;
  const portrait=matchMedia('(max-width: 760px)');
  gl.uniform1f(uniforms.turns,hero ? 16 : 10);
  gl.uniform1f(uniforms.noseLength,hero ? .105 : .14);
  gl.uniform1f(uniforms.seed,index*1.7);
  let visible=true, raf=0, last=-Infinity, count=0, lastScroll=NaN;
  const clamp=value=>Math.max(0,Math.min(1,value));
  function resize() {
    const {width,height}=picture.getBoundingClientRect();
    if (!width || !height) return;
    // Keep native pixel density on phones; bound the framebuffer on wide screens.
    const scale=Math.min(Math.max(1,devicePixelRatio || 1),3,
      3600/width,1800/height,Math.sqrt(3000000/(width*height)));
    canvas.width=Math.round(width*scale);
    canvas.height=Math.round(height*scale);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.uniform1f(uniforms.edge,Math.min(.14,.85/(scale*stripRadius(width,height,hero)*.59)));
    last=-Infinity;
    const strip=buildStrip(width,height,hero,index%2===1,portrait.matches);
    gl.bufferData(gl.ARRAY_BUFFER,strip,gl.STATIC_DRAW);
    count=strip.length/4;
  }
  function frame(now) {
    raf=0;
    if (!visible || document.hidden) return;
    const scroll=window.scrollY;
    if (now-last>=30 || (scroll!==lastScroll && now-last>=12)) {
      const seconds=Math.max(0,(now-startedAt)/1000);
      const viewportHeight=window.innerHeight;
      const progress=hero
        ? .58*(1-Math.pow(1-clamp(seconds/1.95),1.55))
          + .42*clamp(scroll/(viewportHeight*.38))
        : clamp((viewportHeight*.94-picture.getBoundingClientRect().top)/(viewportHeight*.62));
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.time,seconds%900);
      gl.uniform1f(uniforms.head,progress);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,count);
      last=now;
      lastScroll=scroll;
    }
    resume();
  }
  function resume() {
    if (!raf && visible && !document.hidden) raf=requestAnimationFrame(frame);
  }
  const size=new ResizeObserver(resize);
  const viewport=new IntersectionObserver(([entry])=>{
    visible=entry.isIntersecting;
    if (visible) resume();
    else {cancelAnimationFrame(raf);raf=0;}
  });
  canvas.addEventListener('webglcontextlost',event=>{
    event.preventDefault();
    cancelAnimationFrame(raf);
    size.disconnect();
    viewport.disconnect();
    document.removeEventListener('visibilitychange',resume);
    picture.classList.remove('gold-laser-active');
    canvas.remove();
  },{once:true});
  document.addEventListener('visibilitychange',resume);
  resize();
  frame(startedAt);
  picture.classList.add('gold-laser-active');
  size.observe(picture);
  viewport.observe(picture);
}
export function startGoldLaser(picture,index,now=performance.now()) {
  if (!picture || !('IntersectionObserver' in window) ||
      !('ResizeObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  mount(picture,index,now);
}
