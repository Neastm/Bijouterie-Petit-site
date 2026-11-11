import * as THREE from './vendor/three.module.js';
export function studioEnvironment(renderer){
 const w=1024,h=512,data=new Float32Array(w*h*4);
 const lights=[
  [.29,.23,.13,.1,6],[.72,.37,.035,.25,3.3],[.49,.14,.09,.07,8],
  [.05,.5,.04,.35,1.7],[.59,.53,.015,.18,4],[.9,.35,.025,.24,2.8]
 ].map(([cx,cy,sx,sy,power])=>({
  x:Float64Array.from({length:w},(_,x)=>power*Math.exp(-(((x/w-cx)/sx)**8))),
  y:Float64Array.from({length:h},(_,y)=>Math.exp(-(((y/h-cy)/sy)**8)))
 }));
 const ambient=Float64Array.from({length:h},(_,y)=>.25+.75*Math.sin(y/h*Math.PI));
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let light=0;
  for(const source of lights)light+=source.x[x]*source.y[y];
  const shade=ambient[y],i=(y*w+x)*4;
  data[i]=.42*shade+light;data[i+1]=.31*shade+light*.94;data[i+2]=.2*shade+light*.8;data[i+3]=1;
 }
 const tex=new THREE.DataTexture(data,w,h,THREE.RGBAFormat,THREE.FloatType);tex.mapping=THREE.EquirectangularReflectionMapping;tex.needsUpdate=true;
 const pmrem=new THREE.PMREMGenerator(renderer);const env=pmrem.fromEquirectangular(tex).texture;tex.dispose();pmrem.dispose();return env;
}
