const {chromium}=require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');const base=process.env.QA_BASE_URL||'http://127.0.0.1:8087',tag=process.env.QA_TAG||'local',out=__dirname+'/../docs/parity/evidence/about25';
const checks=[],errors=[];function ok(name,value){checks.push({name,pass:!!value});if(!value)throw Error(name)}
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 for(const width of [320,390,768,1280]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',hasTouch:width<500,isMobile:width<500}),page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
  const button=name=>page.getByRole('button',{name,exact:true});
  const images=async()=>page.waitForFunction(()=>[...document.querySelectorAll('[data-testid="about-editorial"] img')].every(i=>i.complete&&i.naturalWidth>0));
  const load=async()=>{await page.goto(base+'/pages/about');await button('Все разделы каталога · 20').waitFor();await images()};
  try{
   await load();
   ok(width+' one H1',await page.getByRole('heading',{level:1}).count()===1);
   ok(width+' correct title',(await page.title()).includes('производство и поставки'));
   ok(width+' source chronology',await page.locator('[data-testid^="about-history-2"]').count()===8);
   ok(width+' three labeled history images',await page.locator('[data-testid^="about-history-media-"]').count()===3 && (await page.getByTestId('about-timeline').innerText()).split('ИИ-иллюстрация').length===4);
   ok(width+' history images stay horizontal',await page.getByTestId('about-history-photo-frame').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return Math.abs(r.width/r.height-16/9)<0.02})));
   ok(width+' primary narrative order',await page.getByTestId('about-editorial').evaluate(e=>[...e.children].filter(e=>/^about-(group|history|production|range|network|trust|awards|contact)$/.test(e.dataset.testid)).map(e=>e.dataset.testid).join(',')==='about-group,about-history,about-production,about-range,about-network,about-trust,about-awards,about-contact'));
   const text=await page.getByTestId('about-editorial').innerText();
   for(const phrase of ['400+','млн ₽ вложено','Данные компании на I квартал 2026 года.','300+','двух площадках','Афипском','Берёзовом','≈11,5','180','государственных закупках','Сделано на Кубани','Узбекистан'])ok(width+' copy '+phrase,text.includes(phrase));
   ok(width+' first factory 2021',(await page.getByTestId('about-history-2021').innerText()).includes('первый производственный цех'));
   ok(width+' details initially folded',await button('Адреса и контакты филиалов').getAttribute('aria-expanded')==='false'&&await button('Все разделы каталога · 20').getAttribute('aria-expanded')==='false');
   ok(width+' four product groups',await page.getByTestId('about-range').getByRole('heading',{level:3}).count()===4);
   ok(width+' no horizontal overflow',await page.getByTestId('about-editorial').evaluate(e=>[...e.querySelectorAll('*')].every(n=>{const r=n.getBoundingClientRect();return r.width===0||(r.left>=-1&&r.right<=document.documentElement.clientWidth+1)})));
   ok(width+' minimum target size',await page.getByTestId('about-editorial').getByRole('button').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height>=44)));
   await page.screenshot({path:out+'/'+tag+'-'+width+'-hero.png'});
   for(const [name,id] of [['История','history'],['Производство','production'],['Ассортимент','range'],['География','network'],['Репутация','trust']]){
    await button('К разделу: '+name).click();await page.waitForTimeout(80);const box=await page.getByTestId('about-'+id).boundingBox();ok(width+' anchor '+id,box.y>=40&&box.y<130);
    if(width===390||width===1280)await page.screenshot({path:out+'/'+tag+'-'+width+'-'+id+'.png'});
   }
   if(width===390||width===1280)for(const id of ['group','history-2015','history-2020','history-2021','history-2025–2026','awards','contact']){await page.getByTestId('about-'+id).evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:out+'/'+tag+'-'+width+'-'+id+'.png'})}
   await button('Все разделы каталога · 20').click();ok(width+' all categories reachable',await page.getByTestId('about-all-categories').getByRole('button').count()===21);await button('Все разделы каталога · 20').click();
   await button('Адреса и контакты филиалов').click();ok(width+' all 18 contact cities',await page.getByTestId('about-branches').getByRole('button',{name:/^Филиал:/}).count()===18);
   for(const [city,address] of [['Москва','Красково'],['Бишкек','Калыка Акиева'],['Краснодар','12 000 м²']]){await button('Филиал: '+city).click();ok(width+' contact '+city,(await page.getByTestId('about-branch-detail').innerText()).includes(address))}
   await button('Адреса и контакты филиалов').click();
   await button('Наше оборудование на объектах').click();await images();ok(width+' three projects',await page.getByTestId('about-projects').getByRole('button',{name:/^Подробнее:/}).count()===3);await button('Наше оборудование на объектах').click();
   if(width===390){
    await button('Направления сотрудничества').click();ok('six business directions',await page.getByTestId('about-business-directions').getByRole('button').count()===7);
    await button('Адреса и контакты филиалов').click();await button('Филиал: Москва').focus();await page.waitForTimeout(100);ok('visible keyboard focus',await button('Филиал: Москва').evaluate(e=>getComputedStyle(e).borderColor==='rgb(32, 35, 56)'));
    await page.keyboard.press('Enter');ok('keyboard selects city',(await page.getByTestId('about-branch-detail').innerText()).includes('Красково'));
    await page.evaluate(()=>{window.__opened=[];window.open=url=>{window.__opened.push(url);return null}});await button('Построить маршрут').click();ok('correct map destination',await page.evaluate(()=>window.__opened.some(s=>decodeURIComponent(s).includes('Красково'))));
    const routes=[['Обсудить сотрудничество','/pages/cooperation'],['Подробнее о производстве','/information/production'],['Отправить запрос','/procurement?mode=list'],['Все контакты и графики работы','/information/contacts'],['Стать партнёром','/pages/franchise'],['Все награды и дипломы','/pages/awards'],['Гарантия и документы на оборудование','/pages/warranty'],['Получить предложение','/procurement?mode=list'],['Доставка','/information/delivery'],['Оплата','/information/payment'],['Для бизнеса','/information/business']];
    for(const [name,path] of routes){await load();await button(name).first().click();await page.waitForURL(u=>u.pathname===path.split('?')[0]&&(!path.includes('?')||u.search===path.slice(path.indexOf('?'))));ok('route '+name,!((await page.locator('body').innerText()).includes('Unmatched Route')))}
    for(const [name,path] of [['Изготовление по техническому заданию','/forms/business-advice'],['Поставщикам','/pages/suppliers'],['Франшиза и партнёрство','/pages/cooperation']]){await load();await button('Направления сотрудничества').click();await button(name).click();await page.waitForURL(u=>u.pathname===path);ok('business route '+name,!((await page.locator('body').innerText()).includes('Unmatched Route')))}
    await load();await button('Леса').click();await page.waitForURL('**/catalog?section=250');ok('catalog section correct',page.url().endsWith('section=250'));
    await load();await button('Наше оборудование на объектах').click();await button('Подробнее: Москва-Сити').click();await page.waitForURL('**/blog/projects-moscow-city');ok('project route',page.url().endsWith('projects-moscow-city'));
   }
  }finally{const token=await page.evaluate(()=>localStorage.getItem('prom23-local-session-v2'));if(token)await page.request.delete(base+'/api/session',{headers:{Authorization:'Bearer '+token}});await context.close()}
 }
 ok('no browser errors',errors.length===0);fs.writeFileSync(out+'/'+tag+'-checks.json',JSON.stringify({base,checks,errors},null,2));await browser.close();console.log(checks.length+' checks PASS');
})().catch(e=>{fs.writeFileSync(out+'/'+tag+'-checks.json',JSON.stringify({base,checks,errors,failure:String(e)},null,2));console.error(e);process.exit(1)});
