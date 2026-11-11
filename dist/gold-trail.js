// Authored vector animation: the route is attached to the document, never eased
// against the viewport. Only the revealed length and the rounded head advance.
export function initGoldRiver(){
 const host=document.querySelector('#gold-river'),ns='http://www.w3.org/2000/svg',reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
 host.innerHTML=`<defs>
 <linearGradient id="gold-metal" x1="0" y1="0" x2="1" y2=".25"><stop stop-color="#79501d"/><stop offset=".2" stop-color="#c49337"/><stop offset=".43" stop-color="#ffedb0"/><stop offset=".53" stop-color="#b9832a"/><stop offset=".75" stop-color="#f1cf72"/><stop offset="1" stop-color="#97621e"/></linearGradient>
 <radialGradient id="gold-drop" cx=".32" cy=".29" r=".78"><stop stop-color="#fff7d4"/><stop offset=".19" stop-color="#f5db86"/><stop offset=".48" stop-color="#cc9b40"/><stop offset=".77" stop-color="#93601d"/><stop offset=".92" stop-color="#e6bd60"/><stop offset="1" stop-color="#9d6d26"/></radialGradient>
 </defs><g fill="none" stroke-linecap="round" stroke-linejoin="round">
 <path class="gold-edge" stroke="#8b602b"/>
 <path class="gold-body" stroke="url(#gold-metal)"/>
 <path class="gold-sheen" stroke="#fff2bc" opacity=".65"/>
 </g><g class="gold-head"><path class="gold-droplet" d="M0 -48 C-3 -32 -29 -9 -29 10 C-29 42 29 42 29 10 C29 -9 3 -32 0 -48Z" fill="url(#gold-drop)" stroke="#a47a37" stroke-width=".8"/><ellipse class="tip-sheen" cx="-10" cy="8" rx="5" ry="15" fill="#fff8d8" opacity=".7" transform="rotate(20)"/></g>`;
 const paths=[...host.querySelectorAll('g>path')].slice(0,3),route=paths[0],head=host.querySelector('.gold-head');
 // The leading drop stays visible above cards; only the trail can go behind an object.
 const tip=document.createElementNS(ns,'svg');tip.id='gold-tip';tip.setAttribute('aria-hidden','true');tip.setAttribute('viewBox','-50 -60 100 120');
 const defs=document.createElementNS(ns,'defs'),paint=host.querySelector('#gold-drop').cloneNode(true);paint.id='gold-drop-tip';defs.append(paint);tip.append(defs,head);head.querySelector('.gold-droplet').setAttribute('fill','url(#gold-drop-tip)');document.body.append(tip);
 let length=0,start=0,frame=0,height=0,initialY=0,ready=false,last=-1,measuring=false;
 function measure(){
  if(measuring)return;measuring=true;
  const w=document.documentElement.clientWidth,h=innerHeight;
  height=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight);
  host.setAttribute('viewBox',`0 0 ${w} ${height}`);host.style.height=height+'px';
  const sections=[...document.querySelectorAll('main>section')];
  const points=[[-w*.12,h*.16],[w*.82,h*.96]];
  sections.slice(1).forEach((el,i)=>{const y=el.getBoundingClientRect().top+scrollY+Math.min(el.offsetHeight*.52,h*.62);if(y>points.at(-1)[1]+40)points.push([w*(i%2===0?.12:.88),y]);});
  points.push([w*.55,height-65]);
  let d=`M${points[0][0]},${points[0][1]}`;
  for(let i=1;i<points.length;i++){const [x0,y0]=points[i-1],[x1,y1]=points[i],dy=(y1-y0)*.48;d+=` C${x0},${y0+dy} ${x1},${y1-dy} ${x1},${y1}`;}
  const width=w<761?22:42;
  paths.forEach((p,i)=>{p.setAttribute('d',d);p.setAttribute('stroke-width',String(width+[3,0,-width*.78][i]));});
  length=route.getTotalLength();paths.forEach(p=>p.setAttribute('stroke-dasharray',`${length} ${length}`));
  initialY=h*.78;head.dataset.scale=w<761?'.66':'1';last=-1;ready=true;measuring=false;request();
 }
 function atY(y){let a=0,b=length;for(let i=0;i<17;i++){const m=(a+b)/2;if(route.getPointAtLength(m).y<y)a=m;else b=m;}return(a+b)/2;}
 function render(now){frame=0;if(!ready||document.hidden)return;if(!start)start=now;
  const t=Math.min(1,(now-start)/1800),intro=reduce?1:1-Math.pow(1-t,3);
  const target=Math.min(height-75,Math.max(innerHeight*.16,scrollY+initialY*intro));
  const distance=atY(target);
  if(Math.abs(last-distance)>.05){paths.forEach(p=>p.setAttribute('stroke-dashoffset',String(length-distance)));
   const p=route.getPointAtLength(distance),q=route.getPointAtLength(Math.max(0,distance-3));
   const angle=Math.atan2(p.y-q.y,p.x-q.x)*180/Math.PI-90;
   tip.style.left=p.x+'px';tip.style.top=p.y+'px';head.setAttribute('transform',`rotate(${angle}) scale(${head.dataset.scale})`);
   host.dataset.headY=p.y.toFixed(2);host.dataset.headX=p.x.toFixed(2);last=distance;
  }
  if(t<1&&!reduce)request();
 }
 function request(){if(!frame)frame=requestAnimationFrame(render);}
 window.addEventListener('scroll',request,{passive:true});window.addEventListener('resize',measure,{passive:true});
 new ResizeObserver(measure).observe(document.querySelector('main'));
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)request();});
 document.fonts?.ready.then(measure);measure();
}
