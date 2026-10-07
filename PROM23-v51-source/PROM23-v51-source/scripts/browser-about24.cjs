const {chromium}=require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:8087',tag=process.env.QA_TAG||'local',out=__dirname+'/../docs/parity/evidence/about24';
const checks=[],errors=[];function ok(name,value){checks.push({name,pass:!!value});if(!value)throw Error(name)}
(async()=>{
 const b=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 for(const width of [320,390,768,1280]){
  const c=await b.newContext({viewport:{width,height:900},reducedMotion:'reduce',hasTouch:width<500,isMobile:width<500}),p=await c.newPage();p.on('pageerror',e=>errors.push(String(e)));
  const load=async()=>{await p.goto(base+'/pages/about');await p.getByTestId('about-category-250').waitFor();await p.waitForTimeout(150)};
  const btn=name=>p.getByRole('button',{name,exact:true});
  await load();
  ok(width+' single H1',await p.getByRole('heading',{level:1}).count()===1);
  ok(width+' initial categories',await p.locator('[data-testid^="about-category-"]').count()===8);
  ok(width+' cities',await p.getByTestId('about-branch-cities').getByRole('button').count()===18);
  ok(width+' history',await p.locator('[data-testid^="about-history-"]').count()===8);
  ok(width+' six activities',await p.getByTestId('about-directions').getByRole('button').count()===6);
  ok(width+' no horizontal overflow',await p.getByTestId('about-editorial').evaluate(e=>{const w=document.documentElement.clientWidth;return [...e.querySelectorAll('*')].every(n=>{const r=n.getBoundingClientRect();return r.width===0||(r.left>=-1&&r.right<=w+1)})}));
  ok(width+' touch targets',await p.getByTestId('about-editorial').getByRole('button').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().height>=44)));
  await p.screenshot({path:out+'/'+tag+'-'+width+'-hero.png'});
  for(const [name,id] of [['Направления','directions'],['Ассортимент','catalog'],['Производство','production'],['Филиалы','branches'],['История','history'],['Проекты','projects'],['Награды','reputation']]){
   await btn('К разделу: '+name).click();await p.waitForTimeout(100);const box=await p.getByTestId('about-'+id).boundingBox();ok(width+' anchor '+id,box.y>=40&&box.y<120);
   if(width===390||width===1280)await p.screenshot({path:out+'/'+tag+'-'+width+'-'+id+'.png'});
  }
  await btn('Показать все направления · 20').click();ok(width+' expand 20 categories',await p.locator('[data-testid^="about-category-"]').count()===20);
  await btn('Свернуть направления').click();ok(width+' collapse categories',await p.locator('[data-testid^="about-category-"]').count()===8);
  for(const [city,address] of [['Москва','Красково'],['Бишкек','Калыка Акиева'],['Краснодар','12 000 м²']]){
   await btn('Филиал: '+city).click();ok(width+' contact '+city,(await p.getByTestId('about-branch-detail').innerText()).includes(address));ok(width+' selected '+city,await btn('Филиал: '+city).getAttribute('aria-selected')==='true');
  }
  await btn('Показатели из презентации компании').click();ok(width+' source figures preserved',(await p.getByTestId('about-reputation').innerText()).includes('10 000'));
  await p.getByTestId('about-contact').evaluate(e=>e.scrollIntoView({block:'start'}));if(width===390||width===1280)await p.screenshot({path:out+'/'+tag+'-'+width+'-contact.png'});
  await p.waitForFunction(()=>[...document.querySelectorAll('[data-testid="about-editorial"] img')].every(e=>e.complete&&e.naturalWidth>0),{},{timeout:30000});
  ok(width+' images loaded',await p.getByTestId('about-editorial').locator('img').evaluateAll(es=>es.every(e=>e.complete&&e.naturalWidth>0)));
  if(width===390){
   await load();const initialStorage=await p.evaluate(()=>localStorage.getItem('prom23-local-session-v2'));
   await btn('Филиал: Москва').focus();ok('keyboard focus visible',await btn('Филиал: Москва').evaluate(e=>getComputedStyle(e).borderWidth==='2px'));
   await p.keyboard.press('Enter');ok('keyboard city selection',(await p.getByTestId('about-branch-detail').innerText()).includes('Красково'));
   ok('branch selection keeps session',await p.evaluate(()=>localStorage.getItem('prom23-local-session-v2'))===initialStorage);
   await p.evaluate(()=>{window.__aboutOpened=[];window.open=url=>{window.__aboutOpened.push(url);return null}});
   await btn('Построить маршрут').click();ok('map route actual Moscow address',await p.evaluate(()=>window.__aboutOpened.some(url=>decodeURIComponent(url).includes('Красково'))));
   await btn('Филиал: Бишкек').click();await btn('Построить маршрут').click();ok('map route changes with city',await p.evaluate(()=>window.__aboutOpened.some(url=>decodeURIComponent(url).includes('Бишкек'))));
   const routes=[['Продажа оборудования и материалов','/catalog'],['Комплексное снабжение объектов','/information/business'],['Собственное производство','/information/production'],['Изготовление по техническому заданию','/information/production'],['Экспорт оборудования','/information/contacts'],['Франшиза и партнёрство','/pages/cooperation'],['Подробнее о производстве','/information/production'],['Обсудить изготовление','/forms/business-advice'],['Все контакты и графики работы','/information/contacts'],['Подробнее: Москва-Сити','/blog/projects-moscow-city'],['Подробнее: Development Plaza','/blog/projects-development-plaza-krasnodar'],['Подробнее: КРК «Октябрь»','/blog/projects-krc-oktyabr-astrakhan'],['Все проекты и объекты','/blog?kind=projects'],['Все награды и дипломы','/pages/awards'],['Гарантия и документы','/pages/warranty'],['Отправить заявку на просчёт','/procurement?mode=list'],['Сотрудничество и франшиза','/pages/cooperation']];
   for(const [name,path] of routes){await load();await btn(name).click();await p.waitForURL(u=>u.pathname===path.split('?')[0]&&(!path.includes('?')||u.search===path.slice(path.indexOf('?'))));await p.getByTestId('bottom-navigation').waitFor();ok('route '+name,p.url().includes(path));ok('destination '+name,!(await p.locator('body').innerText()).includes('Unmatched Route'));}
   await load();await p.getByTestId('about-category-250').click();await p.waitForURL('**/catalog?section=250');ok('category section preserved',p.url().endsWith('/catalog?section=250'));
  }
  const token=await p.evaluate(()=>localStorage.getItem('prom23-local-session-v2'));if(token)await p.request.delete(base+'/api/session',{headers:{Authorization:'Bearer '+token}});await c.close();
 }
 ok('no page errors',errors.length===0);fs.writeFileSync(out+'/'+tag+'-checks.json',JSON.stringify({base,checks,errors},null,2));await b.close();console.log(checks.length+' checks PASS');
})().catch(e=>{fs.writeFileSync(out+'/'+tag+'-checks.json',JSON.stringify({base,checks,errors,failure:String(e)},null,2));console.error(e);process.exit(1)});
