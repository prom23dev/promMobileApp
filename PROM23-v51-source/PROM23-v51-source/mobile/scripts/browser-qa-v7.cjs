/* Isolated V7 client QA. Local sessions/actions only; never external form submissions or calls. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const base = new URL(process.env.QA_BASE_URL || 'http://127.0.0.1:8087');
assert.ok(['localhost', '127.0.0.1'].includes(base.hostname));
const report = { checkedAt: new Date().toISOString(), base: base.origin, persona: 'Снабженец, 56 лет. Нужно передать список оборудования и понять условия поставки; плохо переносит потерю введённых данных и мелкие элементы.', checks: [], layouts: [], pageErrors: [], blockedWrites: [], localPosts: [], limitations: ['Chromium / Expo Web only; no native certification.', 'No external submissions, payments or telephone actions.'] };
let browser, page;
const btn = name => page.getByRole('button', { name, exact: true });
const field = name => page.getByRole('textbox', { name, exact: true });
const snap = async name => page.screenshot({ path: path.join(root, 'docs', `qa-v7-${name}.png`) });
const go = async route => { const response=await page.goto(new URL(route, base).href);assert.equal(response.status(),200,'Preview must be stable HTTP200');await page.waitForFunction(() => document.querySelectorAll('[role=button]').length > 3);if(process.env.QA_EXPECTED_ENTRY)assert.ok(await page.locator(`script[src*="${process.env.QA_EXPECTED_ENTRY}"]`).count(),'Export changed while QA was running'); };
const home = async () => { await go('/'); await btn('Открыть меню магазина').waitFor(); };
async function seek(id) {
  const locator = page.locator(`[data-testid="${id}"]:not([aria-hidden="true"] *)`);
  await page.locator('[data-testid="home-feed"]:not([aria-hidden="true"] *)').waitFor();
  for (let i=0; i<30; i++) {
    if (await locator.count()) { try { await locator.scrollIntoViewIfNeeded({timeout:1000}); return locator; } catch (e) { if (!/not attached|not stable|Timeout/.test(e.message)) throw e; (report.seekRetries??=[]).push({id,attempt:i,reason:e.message.split('\n')[0]}); } }
    await page.mouse.move(180, Math.min(500, (await page.viewportSize()).height-100));
    await page.mouse.wheel(0, 600); await page.waitForTimeout(100);
  }
  throw new Error(`Section ${id} not reachable by scrolling`);
}
async function fit(name) {
  const detail = await page.evaluate(() => {
    const visible = e => { const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.top<innerHeight&&r.bottom>0&&r.left<innerWidth&&r.right>0&&!e.closest('[aria-hidden=true]')&&getComputedStyle(e).visibility!=='hidden'; };
    const els=[...document.querySelectorAll('[role=button],[role=tab],[role=radio],input,textarea')].filter(visible);
    const name=e=>e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||e.innerText||e.getAttribute('placeholder')||'';
    return {width:innerWidth,height:innerHeight,documentWidth:document.documentElement.scrollWidth,
      unnamed:els.filter(e=>!name(e).trim()).map(e=>e.outerHTML.slice(0,100)),
      outside:els.filter(e=>{const r=e.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1;}).map(e=>({name:name(e),x:e.getBoundingClientRect().x,width:e.getBoundingClientRect().width})),
      tiny:els.filter(e=>{const r=e.getBoundingClientRect();return r.width<24||r.height<24;}).map(name)};
  });
  report.layouts.push({name,...detail});
  assert.ok(detail.documentWidth<=detail.width+1,`overflow ${detail.documentWidth}/${detail.width}`);
  assert.deepEqual(detail.unnamed,[],'unnamed visible controls'); assert.deepEqual(detail.tiny,[],'targets below 24 CSS px');
  return detail;
}
async function check(name, fn) {
  try { const detail=await fn();report.checks.push({name,status:'passed',detail}); }
  catch(e) {report.checks.push({name,status:'failed',error:e.message});await snap(`failure-${report.checks.length}`).catch(()=>{});}
  console.log(`${report.checks.at(-1).status}: ${name}`);
}
async function back() { await btn('Назад').click(); }
async function metadata() { return page.evaluate(()=>({title:document.title,h1:[...document.querySelectorAll('h1,[role=heading][aria-level="1"]')].filter(e=>!e.closest('[aria-hidden=true]')).map(e=>e.textContent),headings:[...document.querySelectorAll('h1,h2,h3,[role=heading]')].filter(e=>!e.closest('[aria-hidden=true]')).map(e=>({text:e.textContent,level:e.getAttribute('aria-level')||e.tagName}))})); }

(async()=>{
  browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});page.setDefaultTimeout(7000);
  page.on('pageerror',e=>report.pageErrors.push(e.message));
  await page.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url());
    if(!['GET','HEAD'].includes(req.method())){
      if(req.method()!=='POST'||u.origin!==base.origin||!['/api/sessions','/api/actions'].includes(u.pathname)){report.blockedWrites.push({method:req.method(),url:u.origin+u.pathname});return route.abort('blockedbyclient');}
      report.localPosts.push(u.pathname);
    }
    if(['tel:','sms:','mailto:'].includes(u.protocol))return route.abort();
    return route.continue();
  });
  await home();
  report.entryScripts=await page.locator('script[src]').evaluateAll(es=>es.map(e=>e.getAttribute('src')).filter(s=>s.includes('entry-')));
  await check('Responsive home / product shelf / B2B at 320,390,430,768,844 landscape',async()=>{
    for(const [width,height] of [[320,844],[390,844],[430,932],[768,1024],[844,390]]){
      await page.setViewportSize({width,height});await home();await fit(`home-${width}x${height}`);await snap(`home-${width}x${height}`);
      const shelf=await seek('home-popular');const cards=shelf.getByRole('button',{name:/^Открыть товар:/});assert.ok(await cards.count()>=6);await cards.nth(0).scrollIntoViewIfNeeded();await fit(`popular-${width}`);await snap(`popular-${width}`);
      const a=await cards.nth(0).boundingBox(),b=await cards.nth(1).boundingBox();assert.ok(a&&b&&b.x>a.x&&Math.abs(a.y-b.y)<4,`two-column shelf at ${width}`);
      const business=await seek('home-business');await fit(`business-${width}`);await snap(`business-${width}`);await business.getByRole('radio',{name:'Есть список',exact:true}).waitFor();
    }
  });
  await page.setViewportSize({width:390,height:844});
  await check('Phone/contact visibility and Back',async()=>{
    for(const width of [320,390]) { await page.setViewportSize({width,height:844});await home();for(const target of [page.getByRole('button',{name:/Позвонить/}).first(),btn('Контакты и адреса')]){const r=await target.boundingBox();assert.ok(r&&r.y>=0&&r.y+r.height<844);assert.ok(r.height>=44&&r.width>=44);}
      await btn('Контакты и адреса').click();await page.getByRole('heading',{name:/Контакты|Магазины и контакты/}).first().waitFor();await fit(`contacts-${width}`);await snap(`contacts-${width}`);await back();await btn('Открыть меню магазина').waitFor();}
    assert.match(fs.readFileSync(path.join(root,'mobile/src/content/siteContent.ts'),'utf8'),/supportPhone\s*=\s*['"]\+78002002590['"]/);return 'No telephone control activated.';
  });
  await page.setViewportSize({width:390,height:844});
  await check('Hero photo toggles, project link and return',async()=>{
    await home();const hero=page.getByTestId('home-hero');const projects=hero.getByRole('tab',{name:'Показать: На объектах',exact:true});await projects.click();assert.equal(await projects.getAttribute('aria-selected'),'true');await hero.getByRole('button',{name:'На объектах: подробнее',exact:true}).click();await page.waitForURL(/\/blog\//);await back();await hero.waitFor();await snap('hero-project-return');
    await hero.getByRole('tab',{name:'Показать: Производство',exact:true}).click();await hero.getByRole('button',{name:'Производство: подробнее',exact:true}).click();await page.waitForURL(/information\/production/);await back();
  });
  await check('Search history, persistence and menu Back',async()=>{
    await home();const search=field('Поиск по названию, бренду или артикулу');await search.fill('Тент');await search.press('Enter');await page.getByRole('heading',{name:'Результаты поиска',exact:true}).waitFor();await search.focus();await btn('Искать снова: Тент').waitFor();await snap('search-history');await btn('Закрыть подсказки поиска').click();await btn('Открыть меню магазина').click();await back();assert.equal(await search.inputValue(),'Тент');await page.reload();await search.focus();await btn('Искать снова: Тент').waitFor();await btn('Удалить запрос: Тент').click();await btn('Искать снова: Тент').waitFor({state:'hidden'});await btn('Закрыть подсказки поиска').click();
  });
  await check('Popular continuation preserves uniqueness',async()=>{
    await home();const shelf=await seek('home-popular');const cards=shelf.getByRole('button',{name:/^Открыть товар:/});const before=await cards.count();await shelf.getByRole('button',{name:/Показать ещё/}).click();const labels=await cards.evaluateAll(es=>es.map(e=>e.getAttribute('aria-label')));assert.ok(labels.length>before);assert.equal(new Set(labels).size,labels.length);await snap('popular-expanded');return{before,after:labels.length};
  });
  await check('B2B radio routes to selection and quick specification',async()=>{
    await home();const business=await seek('home-business');const selection=business.getByRole('radio',{name:'Нужен подбор',exact:true});await selection.click();assert.equal(await selection.getAttribute('aria-checked'),'true');await business.getByRole('button',{name:'Запросить подбор',exact:true}).click();await page.waitForURL(/forms\/quote/);await back();await seek('home-business');await business.getByRole('radio',{name:'Есть список',exact:true}).click();await business.getByRole('button',{name:'Составить спецификацию',exact:true}).click();await field('Артикулы и количество').waitFor();await snap('quick-order-empty');
  });
  await check('B2B radio labels remain within their controls at 320 CSS px',async()=>{
    await page.setViewportSize({width:320,height:844});await home();const business=await seek('home-business');const radio=business.getByRole('radio',{name:'Нужен подбор',exact:true});await radio.click();await radio.scrollIntoViewIfNeeded();await snap('business-radio-320');
    const boxes=await radio.evaluate(e=>{const r=e.getBoundingClientRect();return{control:{x:r.x,right:r.right},children:[...e.querySelectorAll('div')].filter(d=>d.textContent==='Нужен подбор').map(d=>({text:d.textContent,x:d.getBoundingClientRect().x,right:d.getBoundingClientRect().right}))};});assert.ok(boxes.children.every(c=>c.x>=boxes.control.x&&c.right<=boxes.control.right),'Radio label leaves its target boundary');await fit('business-radio-320');await page.setViewportSize({width:390,height:844});return boxes;
  });
  await check('Quick-order validates quantity and preserves known/unknown lines in quote and Back',async()=>{
    await go('/quick-order');const input=field('Артикулы и количество');await input.fill('ВПТ0728 0\nНЕИЗВЕСТНЫЙ 2');await btn('Проверить список').click();await page.getByText('Количество — от 1 до 9999.',{exact:true}).waitFor();assert.equal(await btn('Продолжить расчёт поставки').getAttribute('aria-disabled'),'true');await snap('quick-invalid');
    const spec='ВПТ0728\t2\nНЕИЗВЕСТНЫЙ; 3';await input.fill(spec);await btn('Проверить список').click();await btn('Продолжить расчёт поставки').click();await page.waitForURL(/forms\/quote/);const comment=page.getByRole('textbox',{name:/Комментарий/});await comment.waitFor();const value=await comment.inputValue();assert.ok(value.includes('ВПТ0728 — 2 ед.'));assert.ok(value.includes('НЕИЗВЕСТНЫЙ — 3 ед. (требует уточнения)'));await snap('quote-specification');for(const c of await page.getByRole('checkbox').all())assert.equal(await c.getAttribute('aria-checked'),'false');const url=new URL(page.url());assert.equal(url.searchParams.has('specification'),false);assert.ok(url.searchParams.get('specificationId')?.startsWith('spec-'));assert.ok(!decodeURIComponent(url.search).includes('ВПТ0728'));await back();assert.equal(await input.inputValue(),spec,'Back discarded the original specification');return{specificationPreserved:true,queryCarriesSpecification:false,opaqueDraftId:true};
  });
  await check('Draft expiration during editing preserves form; reload explains missing draft and allows recovery',async()=>{
    await go('/quick-order');await field('Артикулы и количество').fill('ВПТ0728 2');await btn('Проверить список').click();await btn('Продолжить расчёт поставки').click();await page.waitForURL(/forms\/quote/);const comment=page.getByRole('textbox',{name:/Комментарий/});await comment.waitFor();const original=await comment.inputValue();
    await page.evaluate(()=>{window.__qaDateNow=Date.now;const later=Date.now()+31*60*1000;Date.now=()=>later;});
    const edited=original+'\nПроверка сохранения введённой задачи';await comment.fill(edited);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert.equal(await comment.inputValue(),edited,'TTL expiry reset the entered form');await page.evaluate(()=>{Date.now=window.__qaDateNow;delete window.__qaDateNow;});await snap('quote-after-draft-expiry');
    await page.reload();await page.getByText(/Список товаров не сохранился после перезагрузки/).filter({visible:true}).waitFor();await snap('quote-missing-draft');await btn('Вернуться к списку').click();await field('Артикулы и количество').waitFor();await btn('Нет артикулов? Помочь с подбором').click();await page.waitForURL(/forms\/quote/);assert.equal(await page.getByText(/Список товаров не сохранился/).filter({visible:true}).count(),0);return{editingPreserved:true,missingExplained:true,alternativeQuoteReachable:true};
  });
  await check('Projects gallery all tabs, information, Back and heading hierarchy',async()=>{
    await home();const gallery=await seek('project-showcase');for(const tab of await gallery.getByRole('tab').all()){await tab.click();assert.equal(await tab.getAttribute('aria-selected'),'true');assert.equal(await gallery.getByRole('tab',{selected:true}).count(),1);}await fit('projects');await snap('projects-gallery');const headings=await metadata();report.projectMetadata=headings;assert.equal(headings.h1.length,1,'Home contains more than one H1 after project gallery loads');
  });
  await check('Delivery/payment/account explain terms and return routes',async()=>{
    await home();await seek('home-services');for(const [id,label,route] of [['delivery','Все условия доставки','/information/delivery'],['payment','Все условия оплаты','/information/payment'],['account','Открыть личный кабинет','/account']]){
      const service=page.getByTestId('home-service-'+id);await service.click();assert.equal(await service.getAttribute('aria-expanded'),'true');await fit('service-'+id);await snap('service-'+id);await btn(label).click();await page.waitForURL(new RegExp(route));if(id==='account'){await btn('Войти или зарегистрироваться').waitFor();await snap('account');await page.goBack();}else await back();await seek('home-services');}
  });
  await check('City modal focus trap, Escape, landscape action',async()=>{
    await home();await btn('Город: Краснодар. Выбрать город').click();const modal=page.locator('[aria-modal=true]');await modal.waitFor();for(let i=0;i<12;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('[aria-modal=true]')),true);}await page.keyboard.press('Escape');await modal.waitFor({state:'hidden'});await page.setViewportSize({width:844,height:390});await btn('Город: Краснодар. Выбрать город').click();await field('Другой город').fill('Казань');await btn('Выбрать город').scrollIntoViewIfNeeded();await snap('city-landscape');await btn('Выбрать город').click();await btn('Город: Казань. Выбрать город').waitFor();await page.setViewportSize({width:390,height:844});
  });
  await check('Comparison empty state matches the supported six-product limit',async()=>{
    await go('/compare');await page.getByText('Сравните перед покупкой',{exact:true}).waitFor();await snap('comparison-empty');const text=await page.locator('body').innerText();assert.ok(!/до тр[её]х товаров/i.test(text),'Empty comparison still says three products');assert.ok(/до шести|до 6/.test(text),'Six-product capacity should be explicit');
  });
  await check('Reduced motion, no page errors or external mutations',async()=>{
    assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.blockedWrites,[]);return 'Reduced-motion browser preference; no external form submit attempted.';
  });
  report.localPosts=[...new Set(report.localPosts)];report.summary={passed:report.checks.filter(c=>c.status==='passed').length,failed:report.checks.filter(c=>c.status==='failed').length};fs.writeFileSync(path.join(root,'docs/qa-v7-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report.summary));await browser.close();if(report.summary.failed)process.exitCode=1;
})().catch(async e=>{report.fatal=e.stack;fs.writeFileSync(path.join(root,'docs/qa-v7-report.json'),JSON.stringify(report,null,2));console.error(e);await browser?.close();process.exitCode=1;});
