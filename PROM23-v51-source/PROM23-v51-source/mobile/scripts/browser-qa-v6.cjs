/* Independent user-journey QA. Runs only against the local exported preview.
 * No user browser profile, phone calls, actual payments, or external submissions.
 * QA_BASE_URL may select another localhost port; remote hosts are rejected. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const base = new URL(process.env.QA_BASE_URL || 'http://127.0.0.1:8087');
assert.ok(['127.0.0.1', 'localhost'].includes(base.hostname), 'Only an isolated local preview is allowed');
const report = { checkedAt: new Date().toISOString(), base: base.origin, persona: 'Прораб, 56 лет: выбрать товар, разобраться с получением и запросить счёт', checks: [], pageErrors: [], blockedExternalRequests: [], postPaths: [], layouts: [], limitations: ['Chromium / Expo Web, not an on-device VoiceOver or TalkBack certification.', 'No real forms, calls, orders, payments or external API writes.'] };
let browser, page;
const button = name => page.getByRole('button', { name, exact: true });
const search = () => page.getByRole('textbox', { name: 'Поиск по названию, бренду или артикулу', exact: true });
const activeTestId = id => page.locator(`[data-testid="${id}"]:not([aria-hidden="true"] *)`);
const go = async route => { await page.goto(new URL(route, base).href); await page.waitForFunction(() => document.querySelectorAll('[role=button]').length > 3); };
const shot = async name => { await page.screenshot({ path: path.join(root, 'docs', `qa-v6-${name}.png`) }); };
async function run(name, action) {
  try { const detail = await action(); report.checks.push({ name, status: 'passed', ...(detail ? { detail } : {}) }); }
  catch (error) { report.checks.push({ name, status: 'failed', error: String(error.message) }); await shot(`failure-${report.checks.length}`).catch(() => {}); }
  console.log(`${report.checks.at(-1).status}: ${name}`);
}
async function fit(name) {
  const result = await page.evaluate(() => {
    const visible = e => { const r=e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[aria-hidden=true]'); };
    const controls = [...document.querySelectorAll('[role=button],[role=radio],[role=tab],input')].filter(visible);
    const unnamed = controls.filter(e=> !(e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.innerText || e.getAttribute('placeholder'))?.trim()).map(e=>e.outerHTML.slice(0,200));
    const small = controls.map(e=>({label:e.getAttribute('aria-label') || e.innerText, width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})).filter(e=>e.width < 24 || e.height < 24);
    return { width:innerWidth, height:innerHeight, documentWidth:document.documentElement.scrollWidth, unnamed, smallTargets:small };
  });
  report.layouts.push({ name, ...result });
  assert.ok(result.documentWidth <= result.width + 1, `Horizontal overflow: ${result.documentWidth} > ${result.width}`);
  assert.deepEqual(result.unnamed, [], 'Visible controls require names');
  assert.deepEqual(result.smallTargets, [], 'Visible controls should have at least 24 × 24 px target area');
}
async function closeSheet() { await button('Закрыть окно').last().click(); await page.locator('[aria-modal=true]').waitFor({ state:'hidden' }); }
async function sheetKeyboard() {
  const modal = page.locator('[aria-modal=true]'); await modal.waitFor();
  for (let i=0;i<14;i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('[aria-modal=true]')),true,'Keyboard focus escaped the modal'); }
  await page.keyboard.press('Escape'); await modal.waitFor({ state:'hidden' });
}
async function loadHome() { await go('/'); await button('Открыть меню магазина').waitFor(); }

(async()=>{
  browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});page.setDefaultTimeout(10000);
  page.on('pageerror',e=>report.pageErrors.push(e.message));
  await page.route('**/*',async route=>{
    const request=route.request(), url=new URL(request.url());
    if (!['GET','HEAD'].includes(request.method())) {
      const permitted=url.origin===base.origin&&request.method()==='POST'&&['/api/sessions','/api/actions'].includes(url.pathname);
      if (!permitted) {report.blockedExternalRequests.push({method:request.method(),url:url.origin+url.pathname});return route.abort('blockedbyclient');}
      report.postPaths.push(url.pathname);
    }
    if (['tel:','sms:','mailto:'].includes(url.protocol)) return route.abort('blockedbyclient');
    return route.continue();
  });
  await run('Responsive home: 320 / 390 / 430 / 768 and 844 × 390 landscape',async()=>{
    for(const [width,height] of [[320,844],[390,844],[430,932],[768,1024],[844,390]]){
      await page.setViewportSize({width,height});await loadHome();await fit(`home-${width}x${height}`);await shot(`home-${width}x${height}`);
      // The app uses a nested native scroll region; scroll an actual product into view.
      const popularProducts=page.getByTestId('home-popular').getByRole('button',{name:/^Открыть товар:/});
      const first=await popularProducts.nth(0).boundingBox(),second=await popularProducts.nth(1).boundingBox();
      assert.ok(first&&second&&second.x>first.x&&Math.abs(first.y-second.y)<4,`Popular grid should use two balanced columns at ${width}px`);
      assert.ok(Math.abs(first.width-second.width)<4,'Unequal popular card widths');
      await popularProducts.nth(4).scrollIntoViewIfNeeded();
      await fit(`home-scrolled-${width}x${height}`);await shot(`home-scrolled-${width}x${height}`);
    }
  });
  await page.setViewportSize({width:390,height:844});
  await run('Phone and contacts are immediately discoverable at 320 / 390; contacts return works',async()=>{
    for(const width of [320,390]){
      await page.setViewportSize({width,height:844});await loadHome();
      const call=page.getByRole('button',{name:/Позвонить/}).first();const contacts=button('Контакты и адреса');
      for(const target of [call,contacts]){await target.waitFor();const rect=await target.boundingBox();assert.ok(rect&&rect.y>=0&&rect.y+rect.height<844,'Contact action is hidden below the initial screen');assert.ok(rect.width>=44&&rect.height>=44,'Contact target is too small');}
      await contacts.click();await page.getByRole('heading',{name:/Контакты|Магазины и контакты/}).first().waitFor();await page.getByText(/800.*200.*25.*90/).filter({visible:true}).first().waitFor();await shot(`contacts-${width}`);await button('Назад').click();await button('Открыть меню магазина').waitFor();
    }
    // Do not activate a phone protocol. Verify the native binding's literal destination instead.
    const source=fs.readFileSync(path.join(root,'mobile/src/content/siteContent.ts'),'utf8');assert.match(source,/supportPhone\s*=\s*['"]\+78002002590['"]/);
    const header=fs.readFileSync(path.join(root,'mobile/src/ui/primitives.tsx'),'utf8');assert.match(header,/tel:/);assert.match(header,/supportPhone/);
    return 'Phone control and contacts route verified; the tel action itself was never clicked.';
  });
  await run('Popular products: at least six unique products and explicit continuation',async()=>{
    await loadHome();const popular=page.getByTestId('home-popular');await popular.waitFor();
    const productButtons=popular.getByRole('button',{name:/^Открыть товар:/});
    const names=await productButtons.evaluateAll(items=>items.map(e=>e.getAttribute('aria-label')));
    assert.ok(new Set(names).size>=6,`Only ${new Set(names).size} popular products available`);
    const expand=popular.getByRole('button',{name:/Показать ещё|Еще товары|Ещё товары|Все популярные|Больше товаров/}).first();
    await expand.waitFor();await popular.scrollIntoViewIfNeeded();await shot('popular-before-more');
    const count=await productButtons.count();await expand.click();
    assert.ok(await productButtons.count()>count || !new URL(page.url()).pathname.endsWith('/'),'Continuation must reveal products or navigate');
    await fit('popular-expanded');await shot('popular-after-more');
  });
  await run('Search input, recent query, menu/back and refresh persistence',async()=>{
    await loadHome();await search().fill('Тент');await search().press('Enter');await page.getByRole('heading',{name:'Результаты поиска',exact:true}).waitFor();
    assert.equal(new URL(page.url()).pathname,'/');await search().focus();await button('Искать снова: Тент').waitFor();await shot('search-history');await button('Закрыть подсказки поиска').click();
    await button('Открыть меню магазина').click();await page.getByRole('heading',{name:'Меню',exact:true}).waitFor();await button('Назад').click();assert.equal(await search().inputValue(),'Тент');
    await page.reload();await search().focus();await button('Искать снова: Тент').waitFor();await button('Удалить запрос: Тент').click();await button('Искать снова: Тент').waitFor({state:'hidden'});
    await button('Закрыть подсказки поиска').click();
  });
  await run('City popover: named controls, focus trap, Escape and landscape reachability',async()=>{
    await loadHome();await button('Город: Краснодар. Выбрать город').focus();await page.keyboard.press('Enter');await page.getByRole('heading',{name:'Город получения',exact:true}).waitFor();await fit('city-sheet');await sheetKeyboard();
    await page.setViewportSize({width:844,height:390});await button('Город: Краснодар. Выбрать город').click();await page.getByRole('textbox',{name:'Другой город',exact:true}).fill('Казань');await button('Выбрать город').scrollIntoViewIfNeeded();await shot('city-landscape');await button('Выбрать город').click();await button('Город: Казань. Выбрать город').waitFor();
    await button('Город: Казань. Выбрать город').click();await page.getByRole('radio',{name:'Краснодар',exact:true}).click();await button('Город: Краснодар. Выбрать город').waitFor();await page.setViewportSize({width:390,height:844});
  });
  await run('Product finance, reward terms, all delivery methods and return to the product',async()=>{
    await go('/product/prom-2414');await page.getByRole('button',{name:/^Сплит\./}).first().click();await page.getByRole('heading',{name:'Сплит и баллы Плюса',exact:true}).waitFor();await page.getByText('Пример оплаты в 4 части',{exact:true}).waitFor();assert.ok((await page.locator('[aria-modal=true]').innerText()).includes('до подтверждения'));await fit('split-sheet');await shot('split-details');await closeSheet();
    await button('Баллы Плюса. Как получить и узнать количество').first().click();await page.getByText('Как получить баллы Плюса',{exact:true}).waitFor();await closeSheet();
    for(const label of ['Самовывоз','В пункт выдачи','До двери или на объект','До терминала ТК — бесплатно'])await page.getByText(label,{exact:true}).waitFor();
    await button('Все условия доставки').click();await page.getByRole('heading',{name:/Доставка/}).first().waitFor();await button('Назад').click();assert.ok(page.url().includes('/product/prom-2414'));await shot('product-return');
  });
  await run('Personal cart recovery and checkout without forced account registration',async()=>{
    await go('/product/prom-2414');await button('В корзину').last().click();await button('Увеличить количество: Вышка-тура ВСПТ 0,7×1,6, высота 2,8 метра').waitFor();await loadHome();await button('Продолжить оформление корзины').click();await button('Перейти к оформлению').click();await page.getByRole('heading',{name:'Оформление заказа',exact:true}).waitFor();assert.ok(!page.url().includes('auth-'));await shot('checkout');
  });
  await run('No false success for offline form, no preselected consents',async()=>{
    await go('/forms/buy-one-click?productId=prom-2414&expectedContext=personal');await page.getByRole('heading',{name:'Купить в один клик',exact:true}).waitFor();
    await page.getByRole('textbox',{name:'Ваше имя',exact:true}).fill('Проверка интерфейса');await page.getByRole('textbox',{name:'Ваш телефон',exact:true}).fill('+70000000000');await page.getByRole('textbox',{name:'Количество',exact:true}).fill('1');
    const consents=page.getByRole('checkbox');assert.ok(await consents.count()>=2);for(const checkbox of await consents.all()){assert.equal(await checkbox.getAttribute('aria-checked'),'false');await checkbox.click();}
    await button('Отправить').click();await page.getByText(/Данные не отправлены/).waitFor();assert.equal(await page.getByRole('heading',{name:'Данные приняты',exact:true}).count(),0);await shot('form-unavailable');
  });
  await run('Home guide has explicit task choices and a non-destructive next action',async()=>{
    await loadHome();const guide=page.getByTestId('home-guide');await guide.waitFor();await guide.scrollIntoViewIfNeeded();await shot('guide');
    const choices=guide.getByRole('button');assert.ok(await choices.count()>=4,'A guide needs actual choices, not just a renamed generic help CTA');
    const height=guide.getByRole('button',{name:'Работа на высоте',exact:true});await height.click();assert.equal(await height.getAttribute('aria-selected'),'true');assert.equal(await height.getAttribute('aria-expanded'),'true');
    await guide.getByRole('button',{name:'Леса',exact:true}).click();assert.ok(page.url().includes('/catalog?section='));await page.getByRole('heading',{name:'Леса',exact:true}).waitFor();
    await page.goBack();await page.getByTestId('home-guide').waitFor();await guide.getByRole('button',{name:'Работа на высоте',exact:true}).click();
    if(await guide.getByRole('button',{name:'Помочь с выбором комплектации',exact:true}).count()===0)await guide.getByRole('button',{name:'Работа на высоте',exact:true}).click();
    await guide.getByRole('button',{name:'Помочь с выбором комплектации',exact:true}).click();assert.match(page.url(),/forms\/quote/);assert.ok(page.url().includes('expectedContext=personal'));assert.ok(page.url().includes('purchaseTask=height'));assert.match(await page.getByRole('textbox',{name:'Комментарий',exact:true}).inputValue(),/Работа на высоте/);await shot('guide-quote');
    await loadHome();await page.getByTestId('home-guide').scrollIntoViewIfNeeded();await fit('guide');
  });
  await run('Account benefits explain the value before login and preserve return',async()=>{
    await loadHome();await page.getByTestId('home-service-account').click();const account=activeTestId('home-account-benefits');await account.waitFor();assert.match(await account.innerText(),/заказ|адрес|документ/i);await button('Открыть личный кабинет').click();assert.ok(page.url().includes('/account'));await activeTestId('home-account-benefits').waitFor();await shot('account-benefits');
    await button('Войти или зарегистрироваться').click();assert.ok(page.url().includes('/forms/auth-login'));await button('Назад').click();assert.ok(page.url().includes('/account'));await page.goBack();await button('Открыть меню магазина').waitFor();
  });
  await run('Home service accordions expose delivery, payment and account information progressively',async()=>{
    await loadHome();const delivery=page.getByTestId('home-service-delivery'),payment=page.getByTestId('home-service-payment'),account=page.getByTestId('home-service-account');
    await delivery.click();assert.equal(await delivery.getAttribute('aria-expanded'),'true');for(const label of ['Самовывоз со склада','В пункт выдачи','До двери или на объект','До терминала ТК — бесплатно'])await page.getByTestId('home-services').getByText(label,{exact:true}).waitFor();await shot('home-delivery-open');
    await payment.click();assert.equal(await payment.getAttribute('aria-expanded'),'true');assert.equal(await delivery.getAttribute('aria-expanded'),'false');await page.getByTestId('home-services').getByText('Баллы Плюса с Пэй',{exact:true}).waitFor();await button('Все условия оплаты').click();await button('Назад').click();await page.getByTestId('home-service-account').waitFor();
    await account.click();assert.equal(await account.getAttribute('aria-expanded'),'true');await page.getByTestId('home-account-benefits').waitFor();await fit('account-accordion');await shot('home-account-open');
  });
  await run('B2B context retains its own cart/history and leads to a company quote',async()=>{
    await loadHome();await button('Выбрать покупателя: для себя или для компании').click();const company=page.getByRole('radio',{name:'Для компании',exact:true});await company.click();await page.waitForFunction(()=>[...document.querySelectorAll('[role=radio]')].some(e=>e.getAttribute('aria-label')==='Для компании'&&e.getAttribute('aria-checked')==='true'));await button('Продолжить').click();await page.locator('[aria-modal=true]').waitFor({state:'hidden'});await search().click();await button('Закрыть подсказки поиска').waitFor();assert.equal(await button('Искать снова: Тент').count(),0);await button('Закрыть подсказки поиска').click();
    const quote=page.getByRole('button',{name:/Запросить предложение|Рассчитать поставку для компании|Получить коммерческое предложение|Запросить счёт|Рассчитать поставку/}).first();await quote.click();assert.match(page.url(),/forms\/quote/);assert.ok(page.url().includes('expectedContext=organization-demo'));await shot('b2b-quote');
  });
  await run('Reduced motion renders all content without long running decorative animation',async()=>{
    await page.emulateMedia({reducedMotion:'reduce'});await loadHome();assert.equal(await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
    const active=await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').map(a=>({duration:a.effect?.getTiming().duration,iterations:a.effect?.getTiming().iterations})));
    assert.ok(active.every(a=>a.iterations!==Infinity && Number(a.duration)<=100),'Reduced motion must not run long or infinite web animations');await shot('reduced-motion');
    await page.emulateMedia({reducedMotion:'no-preference'});await loadHome();await fit('motion-enabled');
  });
  await run('Home semantics: one primary heading, section levels, useful page titles and noindex preview',async()=>{
    await page.emulateMedia({reducedMotion:'reduce'});await loadHome();
    assert.equal(await page.getByRole('heading',{level:1}).count(),1,'Home requires one primary heading');
    for(const name of ['Каталог','Популярные товары','Что планируете делать?','Поставка на ваш объект','Покупать удобно'])await page.getByRole('heading',{name,level:2,exact:true}).waitFor();
    assert.match(await page.title(),/Строительное оборудование.*Промышленник/);
    const robots=await page.locator('meta[name=robots]').evaluateAll(items=>items.map(x=>x.content));assert.ok(robots.some(x=>x.includes('noindex')));
    await go('/information/delivery');await page.getByRole('heading',{level:1}).first().waitFor();assert.match(await page.title(),/Доставк.*Промышленник/);
    await go('/account');await page.getByRole('heading',{name:'Кабинет',level:1,exact:true}).waitFor();assert.match(await page.title(),/Кабинет.*Промышленник/);
  });
  await run('No browser crashes and no attempts to submit externally',async()=>{assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.blockedExternalRequests,[]);});
  const seo=[];
  for(const route of ['/','/catalog','/information/delivery','/information/production','/account']){
    await go(route);await page.getByRole('heading').first().waitFor();
    seo.push({route,...await page.evaluate(()=>{
      const visible=e=>!e.closest('[aria-hidden=true]')&&getComputedStyle(e).visibility!=='hidden'&&e.getBoundingClientRect().height>0;
      const metadata=name=>[...document.querySelectorAll(`meta[name="${name}"]`)].map(e=>e.content);
      return {title:document.title,description:metadata('description'),robots:metadata('robots'),headings:[...document.querySelectorAll('h1,h2,[role=heading]')].filter(visible).map(e=>({tag:e.tagName.toLowerCase(),role:e.getAttribute('role'),level:e.getAttribute('aria-level')||(/^H[12]$/.test(e.tagName)?e.tagName.slice(1):null),text:e.innerText})),body:document.body.innerText};
    })});
  }
  await loadHome();
  const captureMetadata=()=>page.evaluate(()=>({url:location.href,title:document.title,description:[...document.querySelectorAll('meta[name=description]')].map(e=>e.content),robots:[...document.querySelectorAll('meta[name=robots]')].map(e=>e.content),headings:[...document.querySelectorAll('h1,h2,[role=heading]')].filter(e=>!e.closest('[aria-hidden=true]')).map(e=>({tag:e.tagName.toLowerCase(),level:e.getAttribute('aria-level'),text:e.innerText}))}));
  const clientNavigation={homeBefore:await captureMetadata(),accordions:[]};
  for(const id of ['delivery','payment','account']){await page.getByTestId('home-service-'+id).click();clientNavigation.accordions.push({id,expanded:await page.getByTestId('home-service-'+id).getAttribute('aria-expanded'),text:await page.getByTestId('home-services').innerText()});}
  await button('Открыть личный кабинет').click();await button('Войти или зарегистрироваться').waitFor();clientNavigation.accountAfterClientNavigation=await captureMetadata();
  fs.writeFileSync(path.join(root,'docs','seo-v6-rendered.json'),JSON.stringify({checkedAt:new Date().toISOString(),base:base.origin,pages:seo,clientNavigation},null,2));
  report.postPaths=[...new Set(report.postPaths)];report.summary={passed:report.checks.filter(x=>x.status==='passed').length,failed:report.checks.filter(x=>x.status==='failed').length};
  fs.writeFileSync(path.join(root,'docs','qa-v6-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();if(report.summary.failed)process.exitCode=1;
})().catch(async error=>{report.fatal=String(error.stack||error);fs.writeFileSync(path.join(root,'docs','qa-v6-report.json'),JSON.stringify(report,null,2));console.error(error);await browser?.close();process.exitCode=1;});
