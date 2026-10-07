/* V8 isolated client regression. Only own preview sessions/actions/location writes.
 * No real forms, payments, calls, external POSTs, personal accounts or saved browser profiles.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
const base = new URL(process.env.QA_BASE_URL || 'http://127.0.0.1:8087');
assert.ok(['http://127.0.0.1:8087', 'http://localhost:8087'].includes(base.origin));
const output = path.join(root, 'docs/testing');
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(path.join(output, 'screenshots'), { recursive: true });
const report = { checkedAt: new Date().toISOString(), base: base.origin,
  personas: ['Обычный покупатель впервые: найти товар, узнать получение и оплату, оформить личную покупку.', 'Закупщик: передать файл потребности, сохранить ранее выбранное, получить предложение без обязательного знания артикулов.'],
  checks: [], layouts: [], pageErrors: [], blockedWrites: [], localWrites: [],
  limitations: ['Expo Web in isolated Chromium, not native VoiceOver/TalkBack/Dynamic Type acceptance.', 'No real forms, calls, orders or payments. Product stock-zero and legacy-cart rendering cases use explicitly labelled response fixtures.'] };
let browser, context, page, catalog;
const active = selector => page.locator(`${selector}:not([aria-hidden="true"] *)`);
const btn = name => page.getByRole('button', { name, exact: true });
const field = name => page.getByRole('textbox', { name, exact: true });
const save = () => fs.writeFileSync(path.join(output, 'qa-v8-report.json'), JSON.stringify(report, null, 2));
const snap = async name => { const filename = `screenshots/qa-v8-${name}.png`; await page.screenshot({ path: path.join(output, filename) }); return filename; };
const pause = async () => page.waitForTimeout(120);
async function go(route) {
  const response = await page.goto(new URL(route, base).href); assert.equal(response.status(), 200);
  await page.waitForFunction(() => document.querySelectorAll('[role=button]').length > 3);
  await page.waitForFunction(() => !!localStorage.getItem('prom23-local-session-v2'));
  if (process.env.QA_EXPECTED_ENTRY) assert.ok(await page.locator(`script[src*="${process.env.QA_EXPECTED_ENTRY}"]`).count(), 'Export changed while QA was running');
}
async function home() { await go('/'); await btn('Открыть меню магазина').waitFor(); }
async function back() { await btn('Назад').click(); }
async function seek(id) {
  const target = active(`[data-testid="${id}"]`);
  for (let i = 0; i < 36; i++) {
    if (await target.count()) { try { await target.scrollIntoViewIfNeeded({ timeout: 800 }); await page.waitForTimeout(220); if (await target.count()) return target; } catch (e) { if (!/not attached|not stable|Timeout/.test(e.message)) throw e; } }
    const feed = await active('[data-testid="home-feed"]').boundingBox(); assert.ok(feed, 'Home feed missing');
    await page.mouse.move(feed.x + feed.width / 2, feed.y + feed.height / 2); await page.mouse.wheel(0, 450); await page.waitForTimeout(220);
  }
  throw Error('Section not reachable: ' + id);
}
async function api(route, body) {
  assert.ok(route.startsWith('/api/'));
  if (body !== undefined) assert.ok(['/api/actions', '/api/v1/location', '/api/v1/cart/revalidate-location'].includes(route));
  return page.evaluate(async ({ route, body }) => {
    const response = await fetch(route, { method: body === undefined ? 'GET' : 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('prom23-local-session-v2') }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, payload: await response.json() };
  }, { route, body });
}
async function fit(name) {
  const data = await page.evaluate(() => {
    const visible = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0 && !e.closest('[aria-hidden=true]') && getComputedStyle(e).visibility !== 'hidden'; };
    const name = e => e.getAttribute('aria-label') || e.innerText || e.getAttribute('placeholder') || '';
    const controls = [...document.querySelectorAll('[role=button],[role=tab],[role=radio],input,textarea')].filter(visible);
    return { width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth,
      unnamed: controls.filter(e => !name(e).trim()).map(e => e.outerHTML.slice(0, 90)),
      tiny: controls.filter(e => { const r = e.getBoundingClientRect(); return r.width < 24 || r.height < 24; }).map(name),
      outside: controls.filter(e => { const r = e.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).map(name) };
  });
  report.layouts.push({ name, ...data }); assert.ok(data.documentWidth <= data.width + 1, `Document overflow ${name}`);
  assert.deepEqual(data.unnamed, [], `Unnamed controls ${name}`); assert.deepEqual(data.tiny, [], `Targets below24px ${name}`); return data;
}
async function check(name, fn) {
  if (process.env.QA_CHECK_FILTER && !new RegExp(process.env.QA_CHECK_FILTER).test(name)) return;
  try { report.checks.push({ name, status: 'PASS', detail: await fn() }); }
  catch (e) { report.checks.push({ name, status: 'FAIL', error: e.message, screenshot: await snap(`failure-${report.checks.length + 1}`).catch(() => null) }); }
  save(); console.log(`${report.checks.at(-1).status}: ${name}`);
}
async function chooseLocation(query, name) {
  await page.getByRole('button', { name: /^Населённый пункт:/ }).first().click();
  await field('Поиск населённого пункта').fill(query);
  const choice = page.getByRole('button', { name: new RegExp(name) }).filter({ has: page.locator('svg') });
  await choice.first().waitFor(); const label = await choice.first().getAttribute('aria-label'); await choice.first().click();
  await field('Поиск населённого пункта').waitFor({ state: 'hidden' }); return label;
}
async function upload(name, mimeType, buffer) {
  const chooser = page.waitForEvent('filechooser'); await btn('Прикрепить файлы').click();
  await (await chooser).setFiles({ name, mimeType, buffer });
}

(async () => {
  browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url());
    if (['tel:', 'sms:', 'mailto:'].includes(url.protocol)) return route.abort();
    if (!['GET', 'HEAD'].includes(request.method())) {
      if (request.method() !== 'POST' || url.origin !== base.origin || !['/api/sessions', '/api/actions', '/api/v1/location', '/api/v1/cart/revalidate-location'].includes(url.pathname)) {
        report.blockedWrites.push({ method: request.method(), path: url.origin + url.pathname }); return route.abort('blockedbyclient');
      }
      report.localWrites.push(url.pathname);
    }
    return route.continue();
  });
  page = await context.newPage(); page.setDefaultTimeout(8000); page.on('pageerror', e => report.pageErrors.push(e.message));
  await home();
  const entry = await page.locator('script[src]').evaluateAll(es => es.map(e => e.getAttribute('src')).find(src => src.includes('entry-')));
  report.build = { entry, sha256: crypto.createHash('sha256').update(await (await context.request.get(new URL(entry, base).href)).body()).digest('hex') };
  catalog = (await api('/api/catalog')).payload.data.products;
  await check('Fresh guest personal state and equally prominent catalog / procurement entries', async () => {
    const state = (await api('/api/state')).payload.data; assert.equal(state.context, 'personal'); assert.deepEqual(state.carts.personal, []); assert.equal(state.city, '');
    const hero = page.getByTestId('home-hero');
    await page.getByText('Куда доставить', { exact: true }).first().waitFor(); await page.getByText('Покупателям', { exact: true }).first().waitFor();
    const a = await hero.getByRole('button', { name: 'Открыть каталог', exact: true }).boundingBox();
    const b = await hero.getByRole('button', { name: 'Отправить потребность', exact: true }).boundingBox();
    assert.ok(a && b && Math.abs(a.y - b.y) < 5 && Math.abs(a.width - b.width) < 8, 'Two equal entry actions');
    await hero.getByRole('button', { name: 'Отправить потребность', exact: true }).click(); await page.waitForURL(/\/procurement/); await btn('Прикрепить файлы').waitFor(); await back(); return { state: 'personal', screenshot: await snap('equal-buyers') };
  });
  await check('Responsive home, popular products, B2C and B2B at five viewports', async () => {
    for (const [width, height] of [[320,844],[390,844],[430,932],[768,1024],[844,390]]) {
      await page.setViewportSize({ width, height }); await home(); await fit(`home-${width}`); await snap(`home-${width}`);
      await page.getByText(width < 360 ? 'Покупки' : 'Покупателям', { exact: true }).first().waitFor();
      const shelf = await seek('home-popular'); const cards = shelf.getByRole('button', { name: /^Открыть товар:/ }); assert.ok(await cards.count() >= 6);
      await cards.first().scrollIntoViewIfNeeded(); await fit(`popular-${width}`); await snap(`popular-${width}`);
      const a = await cards.nth(0).boundingBox(), b = await cards.nth(1).boundingBox(); assert.ok(a && b && b.x > a.x && Math.abs(a.y - b.y) < 5, 'Two product columns');
      await seek('home-buyer-benefits'); await fit(`buyers-${width}`); await snap(`buyers-${width}`);
      await seek('home-business'); await fit(`business-${width}`); await snap(`business-${width}`);
    }
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await check('Search history is separate from menu and survives Back / reload', async () => {
    await home(); const search = field('Поиск по названию, бренду или артикулу'); await search.fill('Тент'); await search.press('Enter');
    await page.getByRole('heading', { name: 'Результаты поиска', exact: true }).waitFor(); await search.focus(); await btn('Искать снова: Тент').waitFor();
    await btn('Закрыть подсказки поиска').click(); await btn('Открыть меню магазина').click(); await back(); assert.equal(await search.inputValue(), 'Тент');
    await page.reload(); await search.focus(); await btn('Искать снова: Тент').waitFor(); await btn('Удалить запрос: Тент').click(); await btn('Искать снова: Тент').waitFor({ state: 'hidden' }); await btn('Закрыть подсказки поиска').click();
  });
  await check('Official settlement search accepts village / hamlet and typo, rejects free text, preserves cart and CAS', async () => {
    await home(); const product = catalog[0]; assert.equal((await api('/api/actions', { type: 'quantity', productId: product.id, quantity: 25, expectedContext: 'personal' })).status, 200);
    const carts = (await api('/api/state')).payload.data.carts;
    const village = await chooseLocation('Молдовка', 'Молдовка'); await snap('geo-village');
    const location = (await api('/api/v1/location')).payload.data; assert.equal(location.settlement.name, 'Молдовка'); assert.ok(location.settlement.fiasId && location.settlement.fullName);
    const hamlets = (await api('/api/v1/locations/suggest?q=' + encodeURIComponent('Ленина'))).payload.data.items;
    const hamlet = hamlets.find(item => /^х(?:\.|$)/.test(item.typeShort) || /хутор/i.test(item.type)); assert.ok(hamlet, 'Official hamlet available');
    const changed = await api('/api/v1/location', { settlementId: hamlet.id, expectedVersion: location.version, expectedContext: 'personal' }); assert.equal(changed.status, 200);
    const stale = await api('/api/v1/location', { settlementId: location.settlement.id, expectedVersion: location.version, expectedContext: 'personal' }); assert.equal(stale.status, 409); assert.equal(stale.payload.error.code, 'STALE_LOCATION');
    const bad = await api('/api/actions', { type: 'city', city: 'Несуществующийнаселенныйпункт123456', expectedContext: 'personal' }); assert.equal(bad.payload.error.code, 'SETTLEMENT_SELECTION_REQUIRED');
    assert.deepEqual((await api('/api/v1/locations/suggest?q=Несуществующийнаселенныйпункт123456')).payload.data.items, []);
    assert.ok((await api('/api/v1/locations/suggest?q=Краснодао')).payload.data.items.some(item => item.name === 'Краснодар'));
    assert.deepEqual((await api('/api/state')).payload.data.carts, carts);
    await home(); assert.match(await page.getByRole('button', { name: /^Населённый пункт:/ }).first().getAttribute('aria-label'), /Ленина/);
    return { village, hamlet: hamlet.fullName, staleStatus: stale.status, cartQuantity: 25 };
  });
  await check('Cards / PDP use server old price and integer discount; null stock permits draft25', async () => {
    assert.ok(catalog.every(product => product.stock === null && product.draftQuantityLimit === 999));
    const product = catalog.find(product => product.oldPriceKopecks && product.discountPercent); assert.ok(product);
    assert.equal((await api('/api/actions', { type: 'quantity', productId: catalog[0].id, quantity: 25, expectedContext: 'personal' })).status, 200);
    await go('/product/' + product.id); await page.getByText('Наличие уточняйте при заказе', { exact: true }).first().waitFor();
    await active(`[aria-label="Скидка ${product.discountPercent}%"]`).first().waitFor(); await snap('pdp-price'); await fit('pdp');
    await go('/cart'); await page.getByText('25', { exact: true }).first().waitFor(); await btn('Перейти к оформлению').click(); await page.waitForURL(/checkout/);
    assert.equal(await page.getByRole('textbox', { name: /Организация|ИНН/ }).count(), 0); await snap('personal-checkout');
    return { productId: product.id, oldPriceKopecks: product.oldPriceKopecks, discountPercent: product.discountPercent };
  });
  await check('Source child categories are visual tiles, with Back', async () => {
    await go('/catalog?section=all'); await page.getByRole('button', { name: /^Раздел каталога: Леса/ }).first().click();
    const children = page.getByRole('button', { name: /^Подраздел:/ }); await children.first().waitFor(); const first = await children.first().boundingBox(); assert.ok(first && first.height >= 140);
    assert.ok(await children.first().locator('svg').count()); await fit('child-categories'); await snap('child-categories');
    const parentUrl = page.url(); assert.ok(new URL(parentUrl).pathname.startsWith('/catalog/section/'), 'Selected category belongs to Stack route');
    await children.first().click(); await page.waitForURL(url => url.href !== parentUrl); const childUrl = page.url();
    await page.reload(); await btn('Леса').waitFor(); assert.equal(page.url(), childUrl, 'Reload lost the selected child');
    await page.goBack(); await page.waitForURL(parentUrl); await children.first().waitFor(); assert.equal(page.url(), parentUrl, 'Browser Back lost the parent');
    if (await children.count() > 1) { await children.nth(1).click(); await page.waitForURL(url => url.href !== parentUrl); assert.notEqual(page.url(), childUrl, 'Second category reused the first route'); await back(); await page.waitForURL(parentUrl); await children.first().waitFor(); }
    await children.first().click(); await btn('Леса').click(); await children.first().waitFor(); await btn('Все разделы').click(); await page.getByRole('button', { name: /^Раздел каталога: Леса/ }).first().waitFor();
  });
  await check('Procurement starts with files, validates types/fields, keeps consent and never invents acceptance', async () => {
    await go('/procurement'); const fileButton = await btn('Прикрепить файлы').boundingBox(), nameField = await field('Ваше имя').boundingBox(); assert.ok(fileButton && nameField && fileButton.y < nameField.y);
    await btn('Получить предложение').click(); await page.getByText('Проверьте отмеченные поля.', { exact: true }).waitFor();
    for (const checkbox of await page.getByRole('checkbox').all()) assert.equal(await checkbox.getAttribute('aria-checked'), 'false');
    await upload('not-allowed.exe', 'application/octet-stream', Buffer.from('not executable')); await btn('Получить предложение').click(); await page.getByText(/Размер файла должен быть известен/).waitFor();
    await btn('Убрать файл not-allowed.exe').click(); await upload('qa-specification.csv', 'text/csv', Buffer.from('Артикул;Количество\nВПТ0728;2'));
    await field('Ваше имя').fill('Проверка интерфейса'); await field('Телефон').fill('+7 999 000 00 00');
    for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.click();
    await btn('Получить предложение').click(); await page.getByText(/Данные не отправлены/).waitFor(); await page.getByText('qa-specification.csv', { exact: true }).waitFor();
    assert.equal(await field('Ваше имя').inputValue(), 'Проверка интерфейса'); await snap('procurement-unavailable');
    await btn('Политика конфиденциальности').click(); await page.waitForURL(/legal\/privacy/); await back(); assert.equal(await field('Ваше имя').inputValue(), 'Проверка интерфейса');
    return { upload: 'local picker only', accepted: false };
  });
  await check('Benefits explain Split / Plus / delivery / account and navigate back', async () => {
    for (const [tab, action, route] of [['Оплата частями','Как работает Сплит','payment'],['Баллы Плюса','Об оплате и баллах','payment'],['Удобное получение','Способы доставки','delivery'],['Личный кабинет','Возможности кабинета','account']]) {
      await home(); const benefits = await seek('home-buyer-benefits'); await benefits.getByRole('tab', { name: new RegExp(tab) }).click(); await benefits.getByRole('button', { name: action, exact: true }).click(); assert.ok(page.url().includes(route));
      await fit('benefit-' + route); if (route !== 'account') { await back(); await seek('home-buyer-benefits'); }
    }
  });
  await check('Calls remain visible, contacts and legal pages have a return path, waiting list is honest', async () => {
    await home(); const call = await page.getByRole('button', { name: /^Позвонить/ }).first().boundingBox(); assert.ok(call && call.y >= 0 && call.width >= 44 && call.height >= 44);
    assert.match(fs.readFileSync(path.join(root, 'mobile/src/content/siteContent.ts'), 'utf8'), /supportPhone\s*=\s*['"]\+78002002590['"]/);
    await btn('Контакты и адреса').click(); await page.waitForURL(/information\/contacts/); await snap('contacts'); await back(); await btn('Открыть меню магазина').waitFor();
    await go('/workspace/waiting-list'); await page.getByText('Лист ожидания не загружен', { exact: true }).waitFor(); await btn('Перейти в каталог').click(); await page.waitForURL(/catalog/); await page.goBack(); await page.getByText('Лист ожидания не загружен', { exact: true }).waitFor();
    for (const route of ['/information/production','/information/business','/legal/offer','/legal/consent']) { await go(route); await fit(route); await btn('Назад').waitFor(); }
    return { telephoneActivated: false, waitingListFakeRecords: false };
  });
  await check('Unverified company context cannot be activated through shopping actions', async () => {
    const carts = (await api('/api/state')).payload.data.carts;
    const result = await api('/api/actions', { type: 'context', context: 'organization-demo', expectedContext: 'personal' }); assert.ok(result.status >= 400);
    const state = (await api('/api/state')).payload.data; assert.equal(state.context, 'personal'); assert.deepEqual(state.carts, carts); return { status: result.status, code: result.payload.error.code };
  });
  await check('Zero-stock response fixture exposes product-specific waiting-list action without fake subscription', async () => {
    const product = catalog[1];
    const pattern = '**/api/catalog';
    const fixture = async route => {
      const response = await route.fetch(); const body = await response.json();
      body.data.products = body.data.products.map(item => item.id === product.id ? { ...item, stock: 0, stockSource: 'qa-response-fixture' } : item);
      await route.fulfill({ response, json: body });
    };
    await page.route(pattern, fixture);
    try {
      await go('/product/' + product.id); await page.getByText('Нет в наличии', { exact: true }).waitFor();
      await btn('Сообщить о поступлении').click(); await page.waitForURL(/forms\/product-notify/);
      assert.equal(new URL(page.url()).searchParams.get('productId'), product.id); await btn('Сообщить о поступлении').click();
      await page.getByText(/Данные не отправлены/).waitFor(); await snap('stock-zero-fixture');
      return { evidence: 'UI_RESPONSE_FIXTURE_ONLY', productId: product.id, realSubscription: false };
    } finally { await page.unroute(pattern, fixture); }
  });
  await check('Legacy company-cart response fixture remains accessible as procurement draft in personal context', async () => {
    const product = catalog[0]; const pattern = '**/api/state';
    const fixture = async route => {
      const response = await route.fetch(); const body = await response.json();
      body.data.context = 'personal'; body.data.carts['organization-demo'] = [{ productId: product.id, quantity: 3 }];
      await route.fulfill({ response, json: body });
    };
    await page.route(pattern, fixture);
    try {
      await go('/account'); await btn('Ранее выбранные товары для компании').click(); await page.waitForURL(/procurement/);
      const value = await field('Что нужно подобрать').inputValue(); assert.ok(value.includes(product.sku) && value.includes('3'));
      await snap('legacy-company-draft-fixture');
      return { evidence: 'UI_RESPONSE_FIXTURE_ONLY; database migration is covered by separate server tests', productId: product.id, quantity: 3 };
    } finally { await page.unroute(pattern, fixture); }
  });
  await check('Company trust facts / production stages / business FAQ disclose content and preserve Back', async () => {
    await home(); const trust = await seek('company-trust-compact'); assert.equal(await trust.locator('img').count(), 0, 'Compact trust must not repeat the hero factory photo'); await fit('company-trust'); await snap('company-trust');
    await trust.getByRole('button', { name: '«Экспортер года». Награды компании', exact: true }).click(); await page.waitForURL(/pages\/awards/); await back();
    await go('/information/production'); const process = page.getByTestId('production-process'); assert.equal(await process.getByRole('tab').count(), 6); await process.getByRole('tab', { name: /Контроль качества/ }).click();
    assert.equal(await process.getByRole('tab', { name: /Контроль качества/ }).getAttribute('aria-selected'), 'true'); await fit('production-process'); await snap('production-process');
    await btn('История: от первых складов к производству').click(); await btn('Вся история компании').click(); await page.waitForURL(/pages\/about/); await back();
    await go('/information/business'); const faq = page.getByTestId('business-faq'); await faq.getByRole('tab').last().click(); assert.equal(await faq.getByRole('tab').last().getAttribute('aria-selected'), 'true');
    await btn('Отправить заявку на закупку').first().click(); await page.waitForURL(/procurement/); await back(); await page.getByTestId('company-topic-business').waitFor();
  });
  await check('Reduced motion and keyboard focus remain usable', async () => {
    await home(); assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    await page.keyboard.press('Tab'); const focus = await page.evaluate(() => { const e = document.activeElement; const s = getComputedStyle(e); return { tag: e.tagName, label: e.getAttribute('aria-label') || e.textContent, outline: s.outlineStyle, border: s.borderColor }; }); assert.notEqual(focus.tag, 'BODY'); await snap('keyboard-focus');
    return focus;
  });
  report.summary = { passed: report.checks.filter(c => c.status === 'PASS').length, failed: report.checks.filter(c => c.status === 'FAIL').length, pageErrors: report.pageErrors.length, blockedWrites: report.blockedWrites.length };
  save(); console.log(JSON.stringify(report.summary)); if (report.summary.failed || report.pageErrors.length || report.blockedWrites.length) process.exitCode = 1;
})().catch(e => { report.fatal = e.message; save(); console.error(e.message); process.exitCode = 1; }).finally(async () => { await browser?.close(); });
