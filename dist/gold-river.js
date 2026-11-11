// A single transparent WebGL surface; the document keeps native scrolling.
export function initGoldRiver(){
 const canvas=document.querySelector('#gold-river'),reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const gl=canvas.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:'low-power'});
 if(!gl){canvas.remove();document.body.classList.add('gold-fallback');return;}
 const vert=`#version 300 es
 void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}`;
 const frag=`#version 300 es
 precision highp float;
 uniform vec2 resolution;uniform float scroll;uniform float time;uniform float front;uniform float width;uniform float stops[10];uniform int count;
 out vec4 color;
 float curve(float y){float x=-.2;for(int i=0;i<9;i++){if(i>=count-1)break;float k=clamp((y-stops[i])/max(.1,stops[i+1]-stops[i]),0.,1.);float a=mod(float(i),2.)<.5?-.2:1.2;float b=1.-a;x=mix(x,mix(a,b,.5-.5*cos(k*3.141593)),step(stops[i],y));}return x;}
 void main(){
  vec2 p=vec2(gl_FragCoord.x,resolution.y-gl_FragCoord.y)/resolution.y;float aspect=resolution.x/resolution.y;float y=p.y+scroll;
  float cy=y;for(int j=0;j<5;j++){float x=curve(cy)*aspect;float d=(curve(cy+.002)-curve(cy-.002))*aspect/.004;cy+=((p.x-x)*d+(y-cy))/(1.+d*d)*.75;}
  float x=curve(cy)*aspect;float phase=cy*13.-time*.8;
  float radius=width*(1.+.19*sin(phase)+.09*sin(cy*28.+time*.42));
  float dist=length(vec2(p.x-x,y-cy));
  // A rounded meniscus follows the reader; the trail stays behind on the page.
  float endDist=max(0.,y-front);dist=sqrt(dist*dist+endDist*endDist);
  float alpha=1.-smoothstep(radius-.0025,radius+.0025,dist);if(alpha<.002){color=vec4(0.);return;}
  float u=clamp(sign(p.x-x)*dist/max(radius,.001),-.999,.999);float nz=sqrt(max(.001,1.-u*u));
  float rip=.10*sin(phase*1.9+u*3.)+.055*sin(cy*37.-time*1.3);
  vec3 n=normalize(vec3(u*.9,rip,nz));
  vec3 r=reflect(vec3(0.,0.,-1.),n);
  float key=pow(max(0.,dot(r,normalize(vec3(-.45,.6,1.)))),24.);
  float strip=exp(-pow((r.x-.4-.09*sin(phase))/.12,2.));
  float soft=.5+.5*sin(r.x*6.+r.y*2.+.5*sin(phase));
  vec3 gold=mix(vec3(.31,.13,.025),vec3(.94,.65,.20),soft);
  float band=exp(-pow((u-.3-.07*sin(phase))/.13,2.)); gold=mix(gold,vec3(1.,.96,.78),min(1.,strip*.6+key*.6+band*.9));
  float edge=pow(1.-nz,3.);gold+=edge*vec3(.28,.18,.07);
  color=vec4(gold,alpha*.97);
 }`;
 function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 let program;try{program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vert));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,frag));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}catch(e){canvas.remove();document.body.classList.add('gold-fallback');console.warn('Decorative gold disabled:',e.message);return;}
 gl.useProgram(program);gl.bindVertexArray(gl.createVertexArray());
 const u=Object.fromEntries(['resolution','scroll','time','front','width','stops[0]','count'].map(n=>[n,gl.getUniformLocation(program,n)]));
 let scale=1,last=0,handle=0,elapsed=0,target=0,shown=0,stops=[],active=true;
 function measure(){scale=Math.min(devicePixelRatio||1,innerWidth<761?1:1.25);canvas.width=Math.round(innerWidth*scale);canvas.height=Math.round(innerHeight*scale);gl.viewport(0,0,canvas.width,canvas.height);stops=[0,...document.querySelectorAll('main>section')].slice(1).map((s,i)=>i===0?0:(s.getBoundingClientRect().top+scrollY+Math.min(s.offsetHeight*.35,innerHeight*.35))/innerHeight);stops.push(document.documentElement.scrollHeight/innerHeight+.5);stops=stops.slice(0,10);gl.uniform2f(u.resolution,canvas.width,canvas.height);gl.uniform1fv(u['stops[0]'],new Float32Array([...stops,...Array(10-stops.length).fill(stops.at(-1))]));gl.uniform1i(u.count,stops.length);gl.uniform1f(u.width,innerWidth<761?.055:.073);target=scrollY/innerHeight;shown=target;request();}
 function render(now){handle=0;if(!active)return;const dt=Math.min(.05,last?(now-last)/1000:.016);last=now;elapsed+=dt;target=scrollY/innerHeight;shown+= (target-shown)*(1-Math.exp(-dt*15));gl.uniform1f(u.scroll,shown);gl.uniform1f(u.time,reduce?0:elapsed);gl.uniform1f(u.front,reduce?100:Math.max(.3,Math.min(1.12,elapsed*.3))+shown);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,3);if(!reduce||Math.abs(target-shown)>.001)request();}
 function request(){if(!handle&&active)handle=requestAnimationFrame(render);}
 window.addEventListener('scroll',request,{passive:true});window.addEventListener('resize',measure,{passive:true});new ResizeObserver(measure).observe(document.querySelector('main'));
 document.addEventListener('visibilitychange',()=>{active=!document.hidden;last=0;if(!active){cancelAnimationFrame(handle);handle=0;}else request();});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();active=false;canvas.style.opacity='0';});canvas.addEventListener('webglcontextrestored',()=>location.reload());
 measure();
}
