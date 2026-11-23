const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require(path.join(process.env.PETIT_TEST_TOOLS,'node_modules/playwright'));
const root=path.resolve('dist'),out=path.join(process.env.RUNNER_TEMP,'petit-layout');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{const p=path.resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!p.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(p,(err,b)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.html':'text/html'})[path.extname(p)]||'application/octet-stream');res.end(b);});});
(async()=>{await new Promise(r=>server.listen(4180,'127.0.0.1',r));try{
 for(const [name,type] of [['Chrome',chromium],['WebKit',webkit]]){
 const browser=await type.launch(name==='Chrome'&&!process.env.PETIT_BUNDLED_BROWSER?{channel:'chrome'}:{});
 try{const metrics={};for(const baseline of [true,false]){
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://fonts.googleapis.com/**',r=>r.abort());
 if(baseline){await page.route('**/counter-experience.js?*',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('.github/fixtures/counter-before-mobile.js','utf8')}));await page.route('**/smooth-scroll.js?*',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync('.github/fixtures/smooth-before-mobile.js','utf8')}));}
 await page.goto('http://127.0.0.1:4180/',{waitUntil:'domcontentloaded'});await page.locator('.counter-ready').waitFor();await page.waitForTimeout(1800);
 await page.evaluate(()=>{window.probe={refreshes:0,writes:0};ScrollTrigger.addEventListener('refresh',()=>probe.refreshes++);const original=window.scrollTo;window.scrollTo=function(...args){probe.writes++;return original.apply(this,args);};});
 await page.touchscreen.tap(8,400);
 const touchWrites=await page.evaluate(()=>probe.writes);
 await page.evaluate(()=>document.querySelectorAll('img[loading="lazy"]').forEach(img=>img.dispatchEvent(new Event('load'))));await page.waitForTimeout(250);
 metrics[baseline?'before':'after']=await page.evaluate(touchWrites=>({refreshes:probe.refreshes,touchWrites,mode:document.documentElement.dataset.scrollMode}),touchWrites);
 if(!baseline){
   assert.equal(metrics.after.refreshes,0,'Image completion refreshed scrolling mid-gesture');assert.equal(touchWrites,0,'Touch start forced a scroll write');assert.equal(metrics.after.mode,'native');
   await page.evaluate(()=>scrollTo({top:document.querySelector('.counter-hero').offsetHeight-innerHeight*1.75,behavior:'instant'}));await page.waitForTimeout(150);
   const before=await page.locator('.counter-room').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m22);
   await page.evaluate(()=>scrollBy({top:innerHeight*.4,behavior:'instant'}));await page.waitForFunction(()=>document.querySelector('.counter-hero').dataset.motionState==='idle');
   const after=await page.locator('.counter-room').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m22);
   assert.ok(after>before+.008,'Mobile transition has no visible parallax');
   assert.equal(await page.locator('.counter-stage').evaluate(el=>Math.round(el.clientHeight)),844,'The counter framing changed');
   const next=await page.locator('#boutique').boundingBox();assert.ok(next.y<844 && next.y>0,'Next section is not visible alongside the counter');
   await page.screenshot({path:path.join(out,name+'-mobile-parallax.png')});console.log('PETIT_CAPTURE '+name+'-mobile-parallax '+(await page.screenshot({type:'jpeg',quality:45})).toString('base64'));
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);assert.equal(await page.locator('.counter-room').evaluate(el=>getComputedStyle(el).transform),'none');
 }
 assert.deepEqual(errors,[]);await page.close();
 }assert.ok(metrics.before.refreshes>metrics.after.refreshes);assert.ok(metrics.after.touchWrites<=metrics.before.touchWrites);console.log(name+' MOBILE_DIAGNOSTIC '+JSON.stringify(metrics));
 }finally{await browser.close();}
 }
 }finally{server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
