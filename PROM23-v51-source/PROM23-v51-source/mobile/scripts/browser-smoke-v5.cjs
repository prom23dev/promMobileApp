const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '../..');
(async () => {
 const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
 const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
 const checks=[], errors=[], posts=[];page.setDefaultTimeout(12000);
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')posts.push(new URL(r.url()).pathname)});
 const go = route=>page.goto('http://127.0.0.1:8087'+route);
 const shot = async name=>{ await page.evaluate(async()=>{await Promise.all(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});await page.screenshot({path:path.join(root,'docs/screenshots',name+'-v5.png')}); };
 const search =()=>page.getByRole('textbox',{name:'Поиск по названию, бренду или артикулу',exact:true});
 const button =name=>page.getByRole('button',{name,exact:true});
 const closeSheet =()=>page.getByRole('button',{name:'Закрыть окно',exact:true}).last().click();
 try {
  await page.emulateMedia({reducedMotion:'reduce'});
  await go('/');await button('Подобрать оборудование в каталоге').waitFor();await shot('home-390');
  assert.equal(await button('Раздел каталога: Леса').count(),1);
  await button('Открыть меню магазина').click(); await page.getByRole('heading',{name:'Меню',exact:true}).waitFor();
  assert.equal(await button('Задать вопрос').count(),0);assert.equal(await button('Написать отзыв').count(),0);
  await shot('menu-390');await button('Назад').click();await button('Подобрать оборудование в каталоге').waitFor();checks.push('Menu separate from search; no duplicate raw forms; return to origin');
  await search().fill('Тент');await search().press('Enter');await page.getByRole('heading',{name:'Результаты поиска'}).waitFor();
  await search().focus();await button('Искать снова: Тент').waitFor();await shot('search-history-390');
  await button('Закрыть подсказки поиска').click();await button('Открыть меню магазина').click();await button('Назад').click();assert.equal(await search().inputValue(),'Тент');
  await page.reload();await search().focus();await button('Искать снова: Тент').waitFor();await button('Искать снова: Тент').click();await shot('search-results-390');
  checks.push('Search executes without menu, persists query history across reload and preserves query on menu back');
  await button('Открыть товар: Тент укрывной тарпаулин 180 г/м² 3×4 м с люверсами').click();
  await page.getByRole('button',{name:/^Сплит\./}).first().click();await page.getByRole('heading',{name:'Сплит и баллы Плюса',exact:true}).waitFor();await page.getByText('Пример оплаты в 4 части',{exact:true}).waitFor();await shot('split-390');await closeSheet();
  await page.getByText('Самовывоз',{exact:true}).waitFor();await page.getByText('Бесплатно',{exact:true}).waitFor();await button('Проверить срок и стоимость').click();await page.getByText(/Не удалось получить тарифы/).waitFor();await shot('delivery-390');
  await button('Поможем выбрать под вашу задачу').click();await page.getByRole('heading',{name:'Помощь с покупкой',exact:true}).waitFor();await button('Запросить подбор и стоимость').click();assert.ok(page.url().includes('productId=prom-2200'));await go('/');
  await button('Очистить историю просмотров').waitFor();await page.getByRole('heading',{name:'Могут понадобиться',exact:true}).waitFor();checks.push('Product history/recommendations on home; quote retains product; finance examples clearly marked; delivery has real branch and tariff-unavailable state');
  await go('/product/prom-2414');await button('В корзину').last().click();await button('Увеличить количество: Вышка-тура ВСПТ 0,7×1,6, высота 2,8 метра').waitFor();
  await go('/');await button('Продолжить оформление корзины').click();await button('Перейти к оформлению').waitFor();await button('Помочь с заказом или доставкой?').waitFor();await button('Перейти к оформлению').click();await page.getByRole('heading',{name:'Оформление заказа',exact:true}).waitFor();checks.push('Cart recovery and checkout retain cart; contextual support available');
  await go('/');await button('Выбрать покупателя: для себя или для компании').click();
  const org=page.getByRole('radio',{name:/Юридическое лицо|Для компании|Компания|Организация/}).first();
  if(await org.count())await org.click();else await page.getByText('Юридическое лицо или ИП',{exact:true}).click();
  await button('Продолжить').click();await button('Рассчитать поставку для компании').waitFor();await shot('business-home-390');
  await search().focus();assert.equal(await button('Искать снова: Тент').count(),0);await button('Закрыть подсказки поиска').click();
  await button('Рассчитать поставку для компании').click();assert.ok(page.url().includes('expectedContext=organization-demo'));checks.push('B2B hero leads to company quote; personal search history hidden');
  for(const width of [320,375,768]){await page.setViewportSize({width,height:844});await go('/');await button('Рассчитать поставку для компании').waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await shot('home-'+width);}
  await page.setViewportSize({width:844,height:390});await go('/more');await button('Назад').waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));checks.push('320/375/390/768 and landscape layouts fit; reduced-motion enabled');
  assert.deepEqual(errors,[]);assert.ok(posts.every(p=>['/api/sessions','/api/actions'].includes(p)),posts.join(','));
  fs.writeFileSync(path.join(root,'docs/browser-smoke-v5.json'),JSON.stringify({checkedAt:new Date().toISOString(),checks,errors,postPaths:[...new Set(posts)]},null,2));console.log(JSON.stringify({checks,errors},null,2));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
