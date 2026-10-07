const { chromium } = require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.BASE_URL||'http://127.0.0.1:8087',out=path.resolve(process.env.EVIDENCE_DIR||'docs/parity/evidence/legal41');fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[],hosts=new Set();const pass=(label,value)=>{assert.ok(value,label);checks.push(label)};const norm=s=>s.replace(/\s+/g,' ').trim();
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{
for(const width of [320,390,768,1280]){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>hosts.add(new URL(r.url()).hostname));
 await page.goto(base+'/more');await page.getByRole('button',{name:'Отклонить необязательные',exact:true}).waitFor();
 pass(width+' three banner controls',await page.getByRole('button',{name:'Принять все',exact:true}).isVisible()&&await page.getByRole('button',{name:'Настроить',exact:true}).isVisible());
 await page.getByRole('button',{name:'Настроить',exact:true}).click();const categories=page.getByRole('checkbox');pass(width+' five categories',await categories.count()===5);for(let i=0;i<5;i++)pass(width+' default '+i,await categories.nth(i).getAttribute('aria-checked')===(i===0?'true':'false'));
 await page.waitForTimeout(120);await page.screenshot({path:path.join(out,'cookie-settings-'+width+'.png')});await page.getByRole('button',{name:'Отклонить необязательные',exact:true}).click();await page.getByRole('button',{name:'Понятно',exact:true}).click();
 let choice=await page.evaluate(()=>JSON.parse(localStorage.getItem('prom23-privacy-v1')));pass(width+' rejection persisted',choice&&['functional','analytics','advertising','personalization'].every(k=>choice[k]===false));
 await page.reload();await page.getByTestId('global-menu-scroll').waitFor();pass(width+' no repeated banner after rejection',await page.getByRole('button',{name:'Принять все',exact:true}).count()===0);
 await page.getByRole('button',{name:'Настройки cookie',exact:true}).click();await page.getByRole('checkbox',{name:'Функциональные',exact:true}).click();await page.getByRole('button',{name:'Сохранить выбор',exact:true}).click();choice=await page.evaluate(()=>JSON.parse(localStorage.getItem('prom23-privacy-v1')));pass(width+' granular independent selection',choice.functional&&!choice.personalization&&!choice.analytics&&!choice.advertising);
 const ids=['privacy','consent','cookies','recommendations'];for(let i=0;i<ids.length;i++){
  await page.goto(base+'/legal/'+ids[i]);await page.getByTestId('legal-document').waitFor();const text=norm(await page.getByTestId('legal-document').innerText());const source=fs.readFileSync(path.resolve('docs/legal41/source/'+String(i+1).padStart(2,'0')+'.txt'),'utf8');
  for(const para of source.trim().split(/\n\s*\n/))pass(width+' '+ids[i]+' paragraph '+checks.length,text.includes(norm(para)));
  pass(width+' '+ids[i]+' single H1',await page.getByRole('heading',{level:1}).count()===1);
  pass(width+' '+ids[i]+' no overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.waitForTimeout(120);await page.screenshot({path:path.join(out,ids[i]+'-'+width+'.png')});
 }
 for(const [url,id] of [['privacy-policy','privacy'],['user-agreement','consent'],['cookie-policy','cookies'],['recom-tech-info','recommendations'],['pages/personal-data','consent'],['pages/recommendations','recommendations']]){await page.goto(base+'/'+url);await page.waitForURL('**/legal/'+id);pass(width+' alias '+url,true)}
 // Form schemas/submissions are intercepted only for UI validation. No CRM/email writes.
 let submissions=[];await page.route('**/api/v1/forms/*/context',route=>route.fulfill({json:{data:{revision:'legal41-ui-fixture',options:{}}}}));await page.route('**/api/v1/forms/*/submit',route=>{submissions.push(route.request().postDataJSON());return route.fulfill({status:503,json:{error:{message:'Проверка интерфейса: отправка перехвачена'}}})});
 for(const id of ['callback','auth-register','subscription','appeal','production-request','supplier','address-create']){
  await page.goto(base+'/forms/'+id);await page.getByRole('link',{name:'Политика в отношении обработки персональных данных',exact:true}).waitFor();const processing=page.getByRole('checkbox').filter({hasText:/Я даю согласие/});pass(width+' '+id+' one processing consent',await processing.count()===1);pass(width+' '+id+' unchecked',await processing.getAttribute('aria-checked')==='false');pass(width+' '+id+' no policy checkbox',await page.getByRole('checkbox',{name:/соглас.*Политик/}).count()===0);
  pass(width+' '+id+' no overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  if(id==='subscription'){pass(width+' marketing optional unchecked',await page.getByRole('checkbox',{name:/Хочу получать новости/}).getAttribute('aria-checked')==='false');pass(width+' newsletter no accidental submit',await page.getByRole('button',{name:'Подписаться',exact:true}).isDisabled());}
  if(id==='callback'){
    await page.getByRole('textbox',{name:'Ваше имя',exact:true}).fill('Проверка интерфейса');await page.getByRole('textbox',{name:'Ваш телефон',exact:true}).fill('+79000000000');await page.getByRole('button',{name:'Отправить',exact:true}).click();pass(width+' no submission without processing consent',submissions.length===0);
    await processing.click();await page.getByRole('link',{name:'Политика в отношении обработки персональных данных',exact:true}).click();await page.getByTestId('legal-document').waitFor();await page.getByRole('button',{name:'Назад',exact:true}).click();pass(width+' draft retained on legal back',await page.getByRole('textbox',{name:'Ваше имя',exact:true}).inputValue()==='Проверка интерфейса');pass(width+' consent retained on back',await page.getByRole('checkbox').getAttribute('aria-checked')==='true');
    await page.getByRole('checkbox').click();pass(width+' consent can be revoked',await page.getByRole('checkbox').getAttribute('aria-checked')==='false');await page.waitForTimeout(120);await page.screenshot({path:path.join(out,'callback-fixture-'+width+'.png')});
  }
 }
 await page.goto(base+'/checkout-preview');await page.getByText('Проверьте состав заказа, данные получателя, способ получения, итоговую сумму и выбранный способ оплаты.',{exact:false}).waitFor();pass(width+' checkout notice present',true);
 await page.goto(base+'/more');await page.getByRole('button',{name:'Настройки cookie',exact:true}).click();await page.getByRole('button',{name:'Отклонить необязательные',exact:true}).click();await page.getByRole('button',{name:'Понятно',exact:true}).click();await page.goto(base+'/');await page.getByTestId('home-feed').waitFor();pass(width+' personalization absent after refusal',await page.getByText('Могут понадобиться',{exact:true}).count()===0);
 await context.close();
}
pass('no JS errors',errors.length===0);fs.writeFileSync(path.join(out,'browser-'+(base.includes('127.0.0.1')?'local':'public')+'.json'),JSON.stringify({base,checks:checks.length,passed:checks,errors,requestHosts:[...hosts],formSubmissions:'UI fixture only, no live writes'},null,2));console.log(JSON.stringify({base,checks:checks.length,errors,hosts:[...hosts]}));
} finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
