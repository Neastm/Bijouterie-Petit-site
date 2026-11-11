// Scroll uses stills: no video decoder seeks, wheel interception or scroll lock.
export class ScrollSequence {
 constructor(canvas,onFrame){this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.onFrame=onFrame;this.generation=0;}
 load(format){
  this.clear();this.format=format;this.blobs=new Map();this.frames=new Map();this.pending=new Map();this.decoding=new Set();this.target=0;this.drawn=-1;
  const generation=this.generation;
  // Warm network cache during the entrance, keep decoded memory bounded.
  let cursor=0;const worker=async()=>{while(cursor<300&&generation===this.generation){const i=cursor++;await this.fetchFrame(i);if(i===0)this.request(0);}};
  for(let n=0;n<4;n++)worker();
 }
 clear(){this.generation++;if(this.frames)for(const image of this.frames.values())image.close?.();}
 async fetchFrame(i){
  if(this.blobs.has(i))return this.blobs.get(i);
  if(this.pending.has(i))return this.pending.get(i);
  const generation=this.generation;
  const p=fetch(`./assets/scroll-${this.format}/${String(i).padStart(3,'0')}.jpg`,{priority:i===this.target?'high':'low'})
   .then(r=>{if(!r.ok)throw Error(r.status);return r.blob();}).then(blob=>{if(generation===this.generation)this.blobs.set(i,blob);return blob;}).catch(()=>null).finally(()=>{if(generation===this.generation)this.pending.delete(i);});
  this.pending.set(i,p);return p;
 }
 async decode(i){
  if(i<0||i>299||this.frames.has(i)||this.decoding.has(i)||this.decoding.size>=4)return;
  const generation=this.generation;this.decoding.add(i);
  try{const blob=await this.fetchFrame(i);if(!blob||generation!==this.generation)return;
   let image;if(typeof createImageBitmap==='function')image=await createImageBitmap(blob);else{image=new Image();const url=URL.createObjectURL(blob);image.src=url;try{await image.decode();}finally{URL.revokeObjectURL(url);}}
   if(generation!==this.generation){image.close?.();return;}this.frames.set(i,image);this.prune();this.onFrame();
  }catch{/* Keep the previous frame on a slow or interrupted connection. */}finally{if(generation===this.generation)this.decoding.delete(i);}
 }
 prune(){for(const [i,image]of this.frames){if(this.frames.size<=20)break;if(Math.abs(i-this.target)>8){image.close?.();this.frames.delete(i);}}}
 request(i){this.target=Math.max(0,Math.min(299,i));this.decode(this.target);for(const offset of [1,-1,2,-2])this.decode(this.target+offset);}
 resize(){const scale=Math.min(devicePixelRatio||1,1.5);this.canvas.width=Math.round(this.canvas.clientWidth*scale);this.canvas.height=Math.round(this.canvas.clientHeight*scale);this.drawn=-1;}
 draw(){let i=this.target;if(!this.frames.has(i)){const keys=[...this.frames.keys()];if(!keys.length)return false;i=keys.reduce((a,b)=>Math.abs(b-this.target)<Math.abs(a-this.target)?b:a);}
  if(i===this.drawn)return true;const image=this.frames.get(i),w=this.canvas.width,h=this.canvas.height,s=Math.max(w/image.width,h/image.height);this.ctx.drawImage(image,(w-image.width*s)/2,(h-image.height*s)/2,image.width*s,image.height*s);this.drawn=i;return true;
 }
}
