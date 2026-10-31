import fs from 'node:fs';import path from 'node:path';import zlib from 'node:zlib';
const vendor='dist/vendor';fs.mkdirSync(vendor,{recursive:true});
for(const rel of ['loaders/GLTFLoader.js','utils/BufferGeometryUtils.js','environments/RoomEnvironment.js']){const dest=path.join(vendor,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join('node_modules/three/examples/jsm',rel),dest);}
for(const rel of ['three.module.js','three.core.js'])fs.copyFileSync(path.join('node_modules/three/build',rel),path.join(vendor,rel));
fs.copyFileSync('node_modules/three/LICENSE',path.join(vendor,'LICENSE'));
fs.writeFileSync('dist/assets/petit-prx.glb',zlib.gunzipSync(fs.readFileSync('dist/assets/petit-prx.glb.gz')));
console.log('Self-contained static output prepared in dist/.');
