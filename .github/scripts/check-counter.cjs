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
    return !slide.hidden && presentation.getAnimations().length === 0 && Math.abs(transform.m41) < 1;
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
  const browser = await chromium.launch({channel: 'chrome', headless: true});
  const errors = [];
  try {
    for (const viewport of [{width:390,height:844},{width:320,height:568},{width:768,height:1024},{width:1440,height:900},{width:1920,height:1080},{width:844,height:390}]) {
      const page = await browser.newPage({viewport, reducedMotion:'no-preference'});
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:4173/', {waitUntil:'domcontentloaded'});
      await page.locator('.counter-ready').waitFor();
      await settled(page, 0);
      assert.equal(await page.locator('.counter-product-name').count(), 0);
      assert.equal(await page.locator('#gold-river').count(), 0);
      for (const index of [0,1]) {
        if (index === 1) {
          await page.evaluate(() => {
            window.petitBlank = {max:0,since:0,run:true};
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
          console.log('Empty interval at '+viewport.width+'px: '+Math.round(blank)+' ms');
        }
        const result = await framing(page, index);
        assert.ok(result.box.left >= -1 && result.box.right <= viewport.width+1, JSON.stringify(result));
        assert.ok(result.box.top >= result.stage.top && result.box.bottom <= result.stage.bottom+1, JSON.stringify(result));
        assert.ok(Math.abs((result.box.left+result.box.right)/2-viewport.width/2) < 6, 'Product is off center');
        assert.ok(result.overflow <= viewport.width+1, 'Horizontal page overflow');
        await page.screenshot({path:path.join(output,viewport.width+'-'+(index?'ring':'watch')+'.png')});
        if(index===0 && [390,1440].includes(viewport.width))console.log('PETIT_CAPTURE '+viewport.width+'-hero '+(await page.screenshot({type:'jpeg',quality:35})).toString('base64'));
      }
      await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
      await settled(page,0);
      assert.equal(await page.evaluate(() => window.gsap.version), '3.15.1');
      const logo=await page.locator('.counter-signature').boundingBox();
      assert.ok(logo.x+logo.width/2<viewport.width*.4, 'Logo should be on the left of the counter');
      for (const selector of ['#boutique','#maison','#univers','#atelier','.faq','#rendez-vous','footer']) {
        await page.locator(selector).scrollIntoViewIfNeeded();
        await page.waitForTimeout(950);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth+1),'Section overflows at '+viewport.width+' '+selector);
        const heading=page.locator(selector).locator('h2').first();
        if(await heading.count())assert.ok(await heading.evaluate(el=>parseFloat(getComputedStyle(el).opacity)>.95),'Invisible heading '+selector);
        if([390,1440].includes(viewport.width)) {
          await page.screenshot({path:path.join(output,viewport.width+'-'+selector.replace(/[^a-z]/gi,'')+'.png')});
          if((viewport.width===390 && selector==='#boutique') || (viewport.width===1440 && selector==='#univers')) console.log('PETIT_CAPTURE '+viewport.width+'-'+selector.slice(1)+' '+(await page.screenshot({type:'jpeg',quality:35})).toString('base64'));
        }
      }
      if(viewport.width<761){
        await page.locator('.menu-toggle').click();
        await page.locator('.card-nav a').first().click();
        assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
      }
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.locator('#rendez-vous').scrollIntoViewIfNeeded();
      assert.equal(await page.locator('#appointment-form').evaluate(el=>getComputedStyle(el).opacity),'1');
      await page.close();
    }
    assert.deepEqual(errors, [], 'Browser errors');
    console.log('Chrome verified six viewports, centered products, scroll reversal, all sections, left logo, GSAP, mobile navigation, reduced motion, no overflow and a sub-second handoff.');
  } finally {
    await browser.close();
    server.close();
  }
}
main().catch(error => {console.error(error);server.close();process.exitCode=1;});
