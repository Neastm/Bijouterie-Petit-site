import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
for(const f of ['index.html','style.css','app.js','liquid.js','assets/petit-prx.glb','assets/petit-prx.glb.gz','vendor/three.module.js']){assert(fs.existsSync(path.join('dist',f)),`${f} missing`);assert(fs.statSync(path.join('dist',f)).size>0,`${f} empty`);}
const html=fs.readFileSync('dist/index.html','utf8');assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert(html.includes('noindex'));assert(html.includes('application/ld+json'));
for(const match of html.matchAll(/(?:src|href)="\.\/([^"#]+)"/g)){assert(fs.existsSync(path.join('dist',match[1])),`Local link missing: ${match[1]}`);}
const glb=fs.readFileSync('dist/assets/petit-prx.glb');assert.equal(glb.readUInt32LE(0),0x46546c67);assert.equal(glb.readUInt32LE(8),glb.length);console.log('Static assets, preview robots, metadata and GLB verified.');
