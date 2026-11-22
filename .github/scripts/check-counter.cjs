const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require(path.join(process.env.PETIT_TEST_TOOLS, 'node_modules/playwright'));

const root = path.resolve('dist');
const output = path.join(process.env.RUNNER_TEMP, 'petit-layout');
fs.mkdirSync(output, {recursive: true});
const mime = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!target.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  fs.readFile(target, (error, bytes) => {
    if (error) response.writeHead(404).end();
    else {
      response.setHeader('Content-Type', mime[path.extname(target)] || 'application/octet-stream');
      response.end(bytes);
    }
  });
});

async function settled(page, index) {
  await page.waitForFunction(index => {
    const slide = document.querySelectorAll('.counter-slide')[index];
    const presentation = slide.querySelector('.counter-arrival');
    const transform = new DOMMatrix(getComputedStyle(presentation).transform);
    return !slide.hidden && document.querySelector('.counter-hero').dataset.motionState === 'idle' && Math.abs(transform.m41) < 1;
  }, index);
}

async function framing(page, index) {
  return page.evaluate(index => {
    const rect = document.querySelectorAll('.counter-slide')[index].querySelector('img').getBoundingClientRect();
    const source = index === 0 ? {left:220/1536,right:735/1536,top:100/1024,bottom:980/1024} :
      {left:337/1536,right:650/1536,top:310/1024,bottom:835/1024};
    const box = {
      left: rect.left + rect.width * source.left,
      right: rect.left + rect.width * source.right,
      top: rect.top + rect.height * source.top,
      bottom: rect.top + rect.height * source.bottom
    };
    const stage = document.querySelector('.counter-stage').getBoundingClientRect();
    return {box,stage:{top:stage.top,bottom:stage.bottom},width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth};
  }, index);
}

async function main() {
  await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
  const geography=JSON.parse(fs.readFileSync(path.join(root,'assets/ales-neighbourhood.json'),'utf8'));
  assert.ok(geography.score>=.65 && geography.ways>20 && geography.nodes>30,'Unverified map source');
  assert.ok(Math.abs(geography.point.x-50)<.1 && Math.abs(geography.point.y-50)<.1,'The photo marker does not match the geocoded point');
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  const errors = [];
  try {
    for (const viewport of [{width:390,height:844},{width:320,height:568},{width:768,height:1024},{width:1440,height:900},{width:1920,height:1080},{width:844,height:390}]) {
      const page = await browser.newPage({viewport, reducedMotion:'no-preference',isMobile:viewport.width<761,hasTouch:viewport.width<761});
      page.on('pageerror', error => {errors.push(error.message);console.error('Browser exception:',error.stack);});
      await page.goto('http://127.0.0.1:4173/', {waitUntil:'domcontentloaded'});
      await page.locator('.counter-ready').waitFor();
      await settled(page, 0);
      assert.equal(await page.locator('body').innerText().then(text=>text.includes('\uFFFD')),false,'Text encoding was damaged');
      assert.equal(await page.locator('.counter-product-name').count(), 0);
      assert.equal(await page.locator('#gold-river').count(), 0);
      let paperPosition;
      for (const index of [0,1]) {
        if (index === 1) {
          await page.evaluate(() => {
            window.petitBlank = {max:0,since:0,run:true,retirements:[]};
            const hidden=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'hidden');
            document.querySelectorAll('.counter-slide').forEach(slide=>Object.defineProperty(slide,'hidden',{
              configurable:true,
              get(){return hidden.get.call(this);},
              set(value){
                if(value===true && !hidden.get.call(this)){
                  const rect=this.querySelector('.counter-arrival').getBoundingClientRect();
                  if(rect.width)window.petitBlank.retirements.push(rect.left);
                }
                hidden.set.call(this,value);
              }
            }));
            function sample(now) {
              const state = window.petitBlank;
              const visible = [...document.querySelectorAll('.counter-slide')].some((slide, index) => {
                if (slide.hidden) return false;
                const rect = slide.querySelector('img').getBoundingClientRect();
                const left = rect.left + rect.width * (index === 0 ? 220/1536 : 337/1536);
                const right = rect.left + rect.width * (index === 0 ? 735/1536 : 650/1536);
                return left < innerWidth && right > 0;
              });
              if (!visible) {
                if (!state.since) state.since = now;
                state.max = Math.max(state.max, now-state.since);
              } else state.since = 0;
              if (state.run) requestAnimationFrame(sample);
            }
            requestAnimationFrame(sample);
            const hero = document.querySelector('.counter-hero');
            const stage = document.querySelector('.counter-stage');
            scrollTo({top:(hero.offsetHeight-stage.clientHeight)*.8,behavior:'instant'});
          });
          await settled(page, 1);
          const blank = await page.evaluate(() => {
            window.petitBlank.run = false;
            return window.petitBlank.max;
          });
          assert.ok(blank < 1000, 'Empty counter exceeded one second');
          assert.ok(blank >= 140,'The handoff did not leave a visible pause');
          const retirements=await page.evaluate(()=>window.petitBlank.retirements);
          assert.ok(retirements.length>0 && retirements.every(left=>left>=viewport.width), 'A photograph was hidden before clearing the frame');
          console.log('Empty interval at '+viewport.width+'px: '+Math.round(blank)+' ms');
        }
        const result = await framing(page, index);
        const paperNow=await page.locator('.counter-brochure').boundingBox();
        if(index===0)paperPosition=paperNow;
        else assert.ok(Math.abs(paperNow.x-paperPosition.x)<1 && Math.abs(paperNow.y-paperPosition.y)<1,'The brochure drifted relative to the counter');
        assert.equal(await page.locator('.counter-room .counter-stationery').count(),1,'The paper is not attached to the room');
        assert.equal(await page.locator('.counter-paper-parallax').evaluate(el=>getComputedStyle(el).transform),'none');
        assert.ok(result.box.left >= -1 && result.box.right <= viewport.width+1, JSON.stringify(result));
        assert.ok(result.box.top >= result.stage.top && result.box.bottom <= result.stage.bottom+1, JSON.stringify(result));
        const expectedCenter=viewport.width*(viewport.width>760?.805:.5);
        assert.ok(Math.abs((result.box.left+result.box.right)/2-expectedCenter) < 6, 'Product is misplaced');
        if(index===0 && viewport.width<761){
          const links=await page.locator('.brochure-links a').all();
          for(const link of links){const rect=await link.boundingBox();assert.ok(rect.y+rect.height/2<result.box.top+3,'The mobile brochure link is behind the watch');}
        }
        assert.ok(result.overflow <= viewport.width+1, 'Horizontal page overflow');
        await page.screenshot({path:path.join(output,viewport.width+'-'+(index?'ring':'watch')+'.png')});
      }
      await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
      await settled(page,0);
      assert.equal(await page.evaluate(() => window.gsap.version), '3.15.1');
      if(viewport.width<761)assert.equal(await page.locator('.counter-signature').isVisible(),false,'No counter logo on mobile');
      else{
        const logo=await page.locator('.counter-signature').boundingBox();
        assert.ok(logo.x+logo.width/2<viewport.width*.3,'The logo brochure should stay on the left');
        const paper=await page.locator('.counter-brochure').boundingBox();
        assert.ok(paper.x>logo.x+logo.width,'The two brochures overlap');
      }
      for(const anchor of await page.locator('.brochure-links a').all()){
        const id=await anchor.getAttribute('href');
        assert.equal(await page.locator(id).count(),1,'Missing brochure destination '+id);
      }
      if([390,1440].includes(viewport.width)){
        for(const id of ['#bijoux','#montres','#atelier']){
          await page.locator('.brochure-links a[href="'+id+'"]').click();
          await page.waitForFunction(id=>location.hash===id,id);
          await page.waitForTimeout(700);
          assert.ok(await page.evaluate(()=>scrollY)>viewport.height,'Brochure navigation did not scroll');
          await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
          await settled(page,0);
        }
      }
      await page.evaluate(() => {
        const hero=document.querySelector('.counter-hero');
        scrollTo({top:hero.offsetHeight-innerHeight*.35,behavior:'instant'});
      });
      await page.waitForTimeout(500);
      assert.ok(await page.locator('.counter-parallax').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).m41)>viewport.width*.5,'The hand did not retreat during the section transition');
      for (const selector of ['#boutique','#venir','#maison','#univers','#atelier','.faq','#rendez-vous','footer']) {
        await page.locator(selector).scrollIntoViewIfNeeded();
        await page.waitForTimeout(['#maison','#venir'].includes(selector)?1700:950);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth+1),'Section overflows at '+viewport.width+' '+selector);
        const heading=page.locator(selector).locator('h2').first();
        if(await heading.count())assert.ok(await heading.evaluate(el=>parseFloat(getComputedStyle(el).opacity)>.95),'Invisible heading '+selector);
        if([390,1440].includes(viewport.width)) {
          await page.screenshot({path:path.join(output,viewport.width+'-'+selector.replace(/[^a-z]/gi,'')+'.png')});
          if(['#venir','#maison'].includes(selector))console.log('PETIT_CAPTURE '+viewport.width+'-'+selector.slice(1)+' '+(await page.locator(selector).screenshot({type:'jpeg',quality:38})).toString('base64'));
          if(selector==='#univers'){
            await page.locator('#bijoux').scrollIntoViewIfNeeded();await page.waitForTimeout(1100);
            await page.locator('#montres').scrollIntoViewIfNeeded();await page.waitForTimeout(1100);
            console.log('PETIT_CAPTURE '+viewport.width+'-univers '+(await page.locator('#univers').screenshot({type:'jpeg',quality:35})).toString('base64'));
          }
        }
      }
      assert.equal(await page.locator('.storefront-actions .button-brown').getAttribute('href'),'#rendez-vous');
      assert.equal(await page.locator('.counter-sleeve').count(),0,'Repeated sleeve extension is still present');
      assert.equal(await page.locator('.family-lineage li').count(),3);
      assert.equal(await page.locator('.collection-scene').count(),2);
      assert.ok(await page.locator('.map-art img').evaluate(el=>el.complete&&el.naturalWidth>0),'The geographic map failed to load');
      await page.locator('#venir').scrollIntoViewIfNeeded();
      assert.equal(await page.locator('#local-map iframe').count(),0,'Map must not load before it is requested');
      assert.equal(new URL(await page.locator('#route-link').getAttribute('href')).searchParams.get('travelmode'),'walking');
      await page.locator('input[name="travel-mode"][value="driving"]').check();
      const routeUrl=new URL(await page.locator('#route-link').getAttribute('href'));
      assert.equal(routeUrl.searchParams.get('travelmode'),'driving');
      assert.ok(routeUrl.searchParams.get('destination').includes('18 rue Saint-Vincent'));
      await page.context().grantPermissions(['clipboard-read','clipboard-write']);
      await page.locator('#copy-address').click();
      await page.waitForFunction(()=>document.querySelector('#address-status').textContent==='Adresse copiée.');
      assert.ok(await page.evaluate(()=>navigator.clipboard.readText()).then(text=>text.includes('30100')));
      await page.route('https://maps.google.com/**',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Map frame test</title>'}));
      await page.locator('#show-map').click();
      assert.equal(await page.locator('#local-map iframe').count(),1);
      assert.equal(await page.locator('#show-map').getAttribute('aria-expanded'),'true');
      await page.locator('#show-map').click();
      assert.equal(await page.locator('#show-map').getAttribute('aria-expanded'),'false');
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      await settled(page,0);
      if(viewport.width<761){
        const cdp=await page.context().newCDPSession(page);
        const x=viewport.width*.75,y=viewport.height*.7;
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
        for(let i=1;i<=6;i++){
          await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*20}]});
          await page.waitForTimeout(25);
        }
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      }else await page.mouse.wheel(0,140);
      await page.waitForTimeout(250);
      assert.ok(await page.evaluate(()=>scrollY)>20,'Native scrolling was blocked');
      if(viewport.width<761){
        await page.locator('.menu-toggle').click();
        await page.locator('.card-nav a').first().click();
        assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
      }
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.locator('#rendez-vous').scrollIntoViewIfNeeded();
      assert.equal(await page.locator('#appointment-form').evaluate(el=>getComputedStyle(el).opacity),'1');
      if(viewport.width===390){
        await page.emulateMedia({reducedMotion:'no-preference'});
        await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
        await settled(page,0);
        const toRing=()=>page.evaluate(()=>{const h=document.querySelector('.counter-hero'),s=document.querySelector('.counter-stage');scrollTo({top:(h.offsetHeight-s.clientHeight)*.8,behavior:'instant'});});
        await toRing();await page.waitForTimeout(90);
        await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
        await settled(page,0);
        await toRing();await page.waitForTimeout(90);
        await page.emulateMedia({reducedMotion:'reduce'});
        await settled(page,1);
        await page.emulateMedia({reducedMotion:'no-preference'});
        await settled(page,1);
        await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
        await settled(page,0);
        const finalFrame=await framing(page,0);
        assert.ok(Math.abs((finalFrame.box.left+finalFrame.box.right)/2-viewport.width/2)<6,'Interrupted motion did not recover');
      }
      await page.close();
    }
    assert.deepEqual(errors, [], 'Browser errors');
    console.log('Chrome verified anchored brochures without parallax, real geocoded OSM map, family and collections, product handoff, navigation, native scroll, itinerary and reduced motion in six viewports.');
  } finally {
    await browser.close();
    server.close();
  }
}
main().catch(error => {console.error(error);server.close();process.exitCode=1;});
