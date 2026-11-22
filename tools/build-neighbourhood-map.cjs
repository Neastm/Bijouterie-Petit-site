const fs=require('node:fs');
const path=require('node:path');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
async function get(url){const r=await fetch(url,{headers:{'User-Agent':'BijouteriePetitPreview/1.0 (neighbourhood illustration)'},signal:AbortSignal.timeout(22000)});if(!r.ok)throw Error(r.status+' '+url);return r.text();}
async function first(urls){const errors=[];for(const u of urls){try{return await get(u)}catch(e){errors.push(e.message)}}throw Error(errors.join('\n'));}
function attr(s,name){return (s.match(new RegExp('\\b'+name+'="([^"]*)"'))||[])[1];}
function tags(s){const t={};for(const m of s.matchAll(/<tag\b([^>]+)\/>/g))t[attr(m[1],'k')]=attr(m[1],'v');return t;}
async function main(){
 const out='dist/assets/ales-neighbourhood.svg',metaOut='dist/assets/ales-neighbourhood.json';
 if(fs.existsSync(out)&&fs.existsSync(metaOut)){console.log('Verified neighbourhood map is already bundled.');return;}
 const q=encodeURIComponent('18 rue saint vincent 30100 ales');
 const geo=JSON.parse(await first(['https://data.geopf.fr/geocodage/search?q='+q+'&limit=1','https://api-adresse.data.gouv.fr/search/?q='+q+'&limit=1']));
 const feature=geo.features?.find(f=>f.properties?.type==='housenumber')||geo.features?.[0];
 if(!feature)throw Error('No geocoded address');
 const [lon,lat]=feature.geometry.coordinates;
 if(Math.abs(lon-4.0787)>.015||Math.abs(lat-44.1237)>.015)throw Error('Unexpected geocoded town');
 if((feature.properties.score||0)<.65)throw Error('Address confidence too low');
 const bbox=[lon-.0064,lat-.0037,lon+.0064,lat+.0037];
 const xml=await first(['https://api.openstreetmap.org/api/0.6/map?bbox='+bbox.join(','),'https://www.openstreetmap.org/api/0.6/map?bbox='+bbox.join(',')]);
 const nodes=new Map();
 for(const m of xml.matchAll(/<node\b([^>]*)(?:\/>|>[^]*?<\/node>)/g)){const a=m[1];nodes.set(attr(a,'id'),[+attr(a,'lon'),+attr(a,'lat')]);}
 if(nodes.size<30)throw Error('Insufficient OSM geometry');
 const merc=([x,y])=>[x*Math.PI/180,Math.log(Math.tan(Math.PI/4+y*Math.PI/360))];
 const lo=merc([bbox[0],bbox[1]]),hi=merc([bbox[2],bbox[3]]),w=1200,h=950;
 const scale=Math.min(w/(hi[0]-lo[0]),h/(hi[1]-lo[1]));
 const dx=(w-(hi[0]-lo[0])*scale)/2,dy=(h-(hi[1]-lo[1])*scale)/2;
 const project=p=>{const [x,y]=merc(p);return[dx+(x-lo[0])*scale,dy+(hi[1]-y)*scale]};
 const point=p=>project(p).map(v=>v.toFixed(1)).join(',');
 const ways=[];
 for(const m of xml.matchAll(/<way\b([^>]*)>([^]*?)<\/way>/g)){
  const pts=[...m[2].matchAll(/<nd\s+ref="(\d+)"\s*\/>/g)].map(n=>nodes.get(n[1])).filter(Boolean);
  if(pts.length>1)ways.push({id:attr(m[1],'id'),tags:tags(m[2]),pts});
 }
 const base=[],roads=[],highlights=[],labels=[],seen=new Set();
 for(const way of ways){
  const t=way.tags,p=way.pts.map(point).join(' ');
  if(t.building)base.push('<polygon points="'+p+'" fill="#e4d6bf" stroke="#d8c7aa" stroke-width=".7"/>');
  else if(t.natural==='water'||t.waterway==='riverbank')base.push('<polygon points="'+p+'" fill="#c8d2cb"/>');
  else if(t.leisure==='park'||t.landuse==='grass'||t.landuse==='forest')base.push('<polygon points="'+p+'" fill="#dce0cd"/>');
  if(!t.highway)continue;
  const major=/primary|secondary|tertiary|residential/.test(t.highway),foot=/footway|pedestrian|path|steps/.test(t.highway);
  const sw=major?9:foot?4:6;
  roads.push('<polyline points="'+p+'" fill="none" stroke="#c8b491" stroke-width="'+(sw+2)+'" stroke-linecap="round" stroke-linejoin="round"/><polyline points="'+p+'" fill="none" stroke="#fcf6e9" stroke-width="'+sw+'" stroke-linecap="round" stroke-linejoin="round"/>');
  if(/saint.?vincent/i.test(t.name||''))highlights.push('<polyline points="'+p+'" fill="none" stroke="#b68d46" stroke-width="5" stroke-linecap="round"/>');
  if(t.name&&!seen.has(t.name)){
    const a=project(way.pts[0]),b=project(way.pts.at(-1));const len=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const key=/saint.?vincent|av.jan|taisson|barbusse|r.publique/i.test(t.name);
    if((len>190||key)&&labels.length<15){seen.add(t.name);const mid=project(way.pts[Math.floor(way.pts.length/2)]);let angle=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;if(angle>90)angle-=180;if(angle< -90)angle+=180;
      labels.push('<text x="'+mid[0].toFixed(1)+'" y="'+mid[1].toFixed(1)+'" transform="rotate('+angle.toFixed(1)+' '+mid[0].toFixed(1)+' '+mid[1].toFixed(1)+')" font-family="Arial,sans-serif" font-size="'+(key?23:18)+'" text-anchor="middle" fill="#806b50" stroke="#f5ebd9" stroke-width="3" paint-order="stroke">'+esc(t.name)+'</text>');}
  }
 }
 if(highlights.length<1)throw Error('Saint-Vincent street missing from the source map');
 const [px,py]=project([lon,lat]);
 const meta={label:feature.properties.label,lon,lat,score:feature.properties.score,point:{x:px/w*100,y:py/h*100},bbox,sources:{address:'https://data.geopf.fr/geocodage/search',map:'https://www.openstreetmap.org/copyright'},attribution:'© OpenStreetMap contributors — ODbL',ways:ways.length,nodes:nodes.size};
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Plan du centre d’Alès autour de la rue Saint-Vincent"><metadata>'+esc(JSON.stringify(meta))+'</metadata><rect width="'+w+'" height="'+h+'" fill="#f5ebd9"/>'+base.join('')+roads.join('')+highlights.join('')+labels.join('')+'<circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="14" fill="#b88b41" fill-opacity=".15"/><circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="5" fill="#8d622c"/></svg>';
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,svg);fs.writeFileSync(metaOut,JSON.stringify(meta,null,2));
 console.log('PETIT_GEO_JSON '+Buffer.from(JSON.stringify(meta)).toString('base64'));
 console.log('PETIT_MAP_GZIP '+require('node:zlib').gzipSync(svg,{level:9}).toString('base64'));
 console.log('Verified geocoding:',meta.label,meta.lon,meta.lat,'OSM ways:',ways.length);
}
main().catch(e=>{console.error(e);process.exitCode=1});
