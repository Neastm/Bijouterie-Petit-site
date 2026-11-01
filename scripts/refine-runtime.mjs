import fs from 'node:fs';
let h=fs.readFileSync('dist/index.html','utf8').replace('./style.css','./refined.css');fs.writeFileSync('dist/index.html',h);
let a=fs.readFileSync('dist/app.js','utf8');
a=a.replace("import { createLiquid } from './liquid.js';","import { createLiquid } from './liquid.js';\nimport { initReactBits } from './reactbits-adapted.js';\ninitReactBits();");
a=a.replace("const caption=document.querySelector('.watch-caption');","const caption=document.querySelector('.hero-baseline');");
a=a.replace('toneMappingExposure=.93','toneMappingExposure=1.05');
a=a.replace("scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;","const room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.025).texture;");
a=a.replace('const xTarget=mobile?-.10:2.65;','const xTarget=0;').replace('const yBase=mobile?-2.6:0;','const yBase=mobile?-1.0:-.05;').replace('const scale=mobile?Math.min(.50,w/780):Math.min(1.05,h/700);','const scale=mobile?Math.min(.55,w/720):Math.min(.82,h/930);');
a=a.replace('model.rotation.y=-.14','model.rotation.y=-.20').replace('model.rotation.z=-.13','model.rotation.z=-.06');
// A studio environment with distinct long softboxes brings out polished bevels.
a=a.replace("const room=new RoomEnvironment();",`const room=new THREE.Scene();room.background=new THREE.Color('#9b9a98');const panel=(x,y,z,w,h,v)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:v,side:THREE.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);room.add(m);};panel(-4,4,5,2,12,'#ffffff');panel(5,1,3,1,12,'#ffffff');panel(0,7,1,12,2,'#fffaf0');panel(0,-4,5,10,1,'#f4f4f4');panel(-5,0,0,5,14,'#222222');`);
fs.writeFileSync('dist/app.js',a);
fs.appendFileSync('THIRD-PARTY-NOTICES.md','\n## Refined version\nScrollReveal, BlurText and SpotlightCard were retrieved through the React Bits registry plugin. Their interaction patterns are adapted to vanilla DOM in dist/reactbits-adapted.js; this is not a React component import. The vitrine image is from the historic website solitaire_diamant__p353673.html. Decorative ring/clock are illustrations, not inventory photographs.\n');
