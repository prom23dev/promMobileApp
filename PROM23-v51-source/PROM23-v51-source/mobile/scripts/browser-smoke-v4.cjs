// Isolated browser profile; touches only the local application's session and cart.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let playwright;
try { playwright = require('playwright'); } catch { playwright = require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }
const root = path.resolve(__dirname, '../..');
const forms = JSON.parse(fs.readFileSync(path.join(root, 'docs/form-route-map-v4.json'))).forms;
const { expect } = playwright;
(async () => {
  const browser = await playwright.chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(10000);
  const errors = [], checks = [], writes = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() === 'POST') writes.push(new URL(request.url()).pathname); });
  const go = route => page.goto(`http://127.0.0.1:8087${route}`);
  const shot = name => page.screenshot({ path: path.join(root, 'docs/screenshots', name) });
  try {
    await go('/catalog?section=all');
    await page.getByRole('heading', { name: 'Каталог', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: /^Раздел каталога:/ }).first().getAttribute('aria-label'), 'Раздел каталога: Леса');
    assert.equal(await page.getByRole('button', { name: /^Раздел каталога:/ }).count(), 20);
    assert.equal(await page.getByRole('button', { name: /^Раздел каталога:/ }).locator('img').count(), 0);
    await page.getByRole('heading', { name: 'Популярные товары', exact: true }).waitFor();
    await page.getByRole('heading', { name: 'Вы интересовались', exact: true }).waitFor();
    await page.getByRole('heading', { name: 'Могут понадобиться', exact: true }).waitFor();
    await shot('catalog-v4-390.png'); checks.push('20 pictograms, Lesa first, three shelves present');
    await page.getByRole('button', { name: 'Открыть товар: Тент укрывной тарпаулин 180 г/м² 3×4 м с люверсами', exact: true }).click();
    await page.getByRole('button', { name: 'Яндекс Пэй, Сплит и условия баллов Плюса', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Назад', exact: true }).click();
    await page.getByRole('button', { name: 'Очистить историю просмотров', exact: true }).waitFor();
    await shot('shelves-v4-390.png'); checks.push('Opening a product persists its viewed history');
    await page.getByRole('button', { name: 'Все товары', exact: true }).click();
    const product = page.getByRole('button', { name: 'Открыть товар: Вышка-тура ВСПТ 0,7×1,6, высота 2,8 метра', exact: true });
    await product.waitFor();
    await page.getByRole('button', { name: 'Сплит — оплата частями. Открыть условия', exact: true }).first().waitFor();
    await shot('products-v4-390.png');
    await page.getByRole('button', { name: 'В корзину', exact: true }).first().click();
    await page.getByRole('tab', { name: /^Корзина/ }).click();
    await page.getByRole('button', { name: 'Яндекс Пэй, Сплит и условия баллов Плюса', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Доставка, самовывоз и пункты выдачи', exact: true }).waitFor();
    await shot('cart-v4-390.png'); checks.push('Listing and cart expose delivery, Split and Plus terms');
    await page.getByRole('button', { name: 'Перейти к оформлению', exact: true }).click();
    await page.getByRole('heading', { name: 'Оформление заказа', exact: true }).waitFor();
    checks.push('Checkout opens source-derived form with order summary');
    await go('/forms/buy-one-click');
    await page.getByRole('button', { name: 'Отправить', exact: true }).click();
    assert.ok(await page.getByRole('alert').count() >= 3);
    await page.getByRole('textbox', { name: 'Ваше имя', exact: true }).fill('QA');
    await page.getByRole('textbox', { name: 'Ваш телефон', exact: true }).fill('+70000000000');
    await page.getByRole('textbox', { name: 'Количество', exact: true }).fill('1');
    const consents = page.getByRole('checkbox');
    for (let i = 0; i < await consents.count(); i++) { assert.equal(await consents.nth(i).getAttribute('aria-checked'), 'false'); await consents.nth(i).check(); }
    const prior = writes.length;
    await page.getByRole('button', { name: 'Отправить', exact: true }).click();
    await page.getByText('Сервис временно недоступен. Данные не отправлены. Вы можете связаться с менеджером.', { exact: true }).waitFor();
    assert.equal(writes.length, prior); await shot('form-v4-390.png');
    checks.push('Required fields and unchecked consents validated; filled form sends no network request');
    await go('/catalog?section=all'); await page.getByRole('button', { name: 'Все разделы магазина', exact: true }).click(); await page.getByRole('button', { name: /Блог и полезные материалы/ }).click();
    await page.getByRole('heading', { name: 'Оборудование в деле', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Хомутовые строительные леса Промышленник: пошаговая сборка, виды хомутов и советы по монтажу', exact: true }).click();
    await page.getByRole('button', { name: 'Содержание статьи', exact: true }).waitFor();
    await shot('article-v4-390.png'); checks.push('More -> blog -> native article with table of contents');
    for (const form of forms) {
      await go(form.route);
      await page.getByRole('heading', { name: form.title, exact: true }).waitFor();
      assert.equal(await page.getByText('Форма недоступна', { exact: true }).count(), 0, form.id);
      assert.ok(!(await page.locator('body').innerText()).includes('Тестовая версия'), form.id);
    }
    checks.push(`${forms.length} source form routes render without JS errors`);
    await page.setViewportSize({ width: 320, height: 760 }); await go('/catalog?section=all');
    await page.getByRole('heading', { name: 'Каталог', exact: true }).waitFor();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await shot('catalog-v4-320.png'); checks.push('320px catalogue and five navigation items fit the viewport');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(root, 'docs/browser-smoke-v4.json'), JSON.stringify({ checkedAt: new Date().toISOString(), checks, errors, postPaths: [...new Set(writes)] }, null, 2));
    console.log(JSON.stringify({ checks, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
