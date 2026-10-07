const {chromium}=require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
const base=process.env.BASE_URL||'http://127.0.0.1:8087',out=process.env.EVIDENCE_DIR||'docs/parity/evidence/legal43/local',checks=[];
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
for(const width of [320,390,768,1280]){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();
 await page.goto(base+'/more');await page.getByRole('button',{name:'Отклонить необязательные',exact:true}).click();await page.getByRole('button',{name:'Понятно',exact:true}).click();
 const order={id:'audit-order',number:'UI-TEST',context:'personal',status:'completed',statusGroup:'completed',createdAt:'2026-09-18T10:00:00Z',deliveryLabel:'Тест интерфейса',totalKopecks:100,deliveryKopecks:0,items:[{productId:'prom-2414',name:'Тестовый товар — только UI fixture',quantity:1,unitPriceKopecks:100,lineTotalKopecks:100}]};
 await page.route('**/api/v1/workspace/orders',r=>r.fulfill({json:{data:{orders:[order,{...order,id:'active-order',number:'ACTIVE',status:'processing',statusGroup:'active'}]}}}));
 await page.route('**/api/v1/forms/*/submit',r=>r.abort());
 const targets=[];
 await page.route('**/api/v1/forms/*/context',r=>{const body=r.request().postDataJSON();targets.push(body.target);return r.fulfill({json:{data:{revision:'legal43-ui-only',initialValues:{},options:body.target?.orderId?{'selected-products':[{value:'item1',label:'Тестовый товар'}]}:{},repeatedItems:body.target?.orderId?{items:[{key:'item1',label:'Тестовый товар',quantityMax:1}]}:undefined}}});});
 await page.goto(base+'/forms/return');await page.getByRole('button',{name:'Выбрать заказ для возврата',exact:true}).click();
 await page.getByRole('button',{name:'Выбрать заказ UI-TEST',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Выбрать заказ ACTIVE',exact:true}).count(),0);checks.push(width+' only completed orders');
 await page.getByRole('button',{name:'Выбрать заказ UI-TEST',exact:true}).click();await page.getByText('Выбран заказ UI-TEST',{exact:true}).waitFor();assert.ok(page.url().includes('/forms/return'));assert.equal(targets.at(-1).orderId,'audit-order');checks.push(width+' inline order context');
 await page.getByRole('button',{name:'Товары для возврата',exact:true}).first().click();await page.getByRole('button',{name:'Тестовый товар',exact:true}).click();await page.getByRole('button',{name:'Закрыть окно',exact:true}).last().click();
 await page.getByRole('textbox',{name:'Комментарий',exact:true}).fill('Описание для проверки сохранения');await page.getByRole('textbox',{name:'Способ передачи товара',exact:true}).fill('Перевозчиком');await page.getByRole('textbox',{name:'Перевозчик и номер отправления',exact:true}).fill('ПЭК 123');
 await page.getByRole('link',{name:'Политика в отношении обработки персональных данных',exact:true}).click();await page.getByTestId('legal-document').waitFor();await page.getByRole('button',{name:'Назад',exact:true}).click();assert.equal(await page.getByRole('textbox',{name:'Комментарий',exact:true}).inputValue(),'Описание для проверки сохранения');assert.equal(await page.getByRole('textbox',{name:'Перевозчик и номер отправления',exact:true}).inputValue(),'ПЭК 123');checks.push(width+' form draft and tracking survive document');
 await page.getByRole('button',{name:'Выбрать другой заказ для возврата',exact:true}).click();await page.getByRole('button',{name:'Вернуться к форме',exact:true}).click();assert.equal(await page.getByRole('textbox',{name:'Комментарий',exact:true}).inputValue(),'Описание для проверки сохранения');checks.push(width+' cancelling picker retains draft');
 await page.screenshot({path:out+'/return-fixture-'+width+'.png'});await context.close();
}
fs.writeFileSync(out+'/return.json',JSON.stringify({base,checks,liveWrites:0,fixtureOnly:true},null,2));console.log({checks:checks.length});
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
