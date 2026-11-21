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
    for (const viewport of [{width:390,height:844},{width:320,height:568},{width:1440,height:900},{width:844,height:390}]) {
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
      }
      await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
      await settled(page,0);
      await page.close();
    }
    assert.deepEqual(errors, [], 'Browser errors');
    console.log('Chrome verified centered products, scroll reversal, clipped sleeve continuation, no horizontal overflow and a sub-second handoff.');
  } finally {
    await browser.close();
    server.close();
  }
}
main().catch(error => {console.error(error);server.close();process.exitCode=1;});
