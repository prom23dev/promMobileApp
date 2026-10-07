// Isolated UI fixtures only: no real order or appeal is created.
const fs=require('fs'), path=require('path');
const {chromium}=require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:8087', tag=process.env.QA_TAG||'local';
const dir=path.join(__dirname,'../docs/parity/evidence/forms30'); fs.mkdirSync(dir,{recursive:true});
const checks=[], errors=[], submits=[];
function ok(name,value){checks.push({name,pass:!!value});if(!value)throw Error(name)}
const order=n=>({id:String(n),number:'UI-TEST-'+n,context:'personal',status:'completed',statusGroup:'completed',createdAt:'2026-09-10T12:00:00Z',deliveryLabel:'Самовывоз',deliveryKopecks:0,totalKopecks:10000,items:[{productId:'prom-1',name:'Товар браузерного теста',quantity:1,unitPriceKopecks:10000,lineTotalKopecks:10000}]});
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try{for(const width of [320,390,1280]){
  const c=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'}),p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));
  let failNext=false, foreign=false;
  const json=(r,data,status=200)=>r.fulfill({status,contentType:'application/json',body:JSON.stringify(status===200?{data}:{error:{code:'NETWORK',message:'Fixture connection error'}})});
  await p.route('**/api/v1/forms/*/context',r=>{if(failNext){failNext=false;return json(r,null,503)}const id=new URL(r.request().url()).pathname.split('/').at(-2);return json(r,{revision:'forms30-ui-fixture',initialValues:{},options:{theme:[{value:'fixture-theme',label:'Проверка гарантийного случая'}],'tags[]':[{value:'fixture-tag',label:'Повреждение'}]}})});
  await p.route('**/api/v1/workspace/orders',r=>json(r,{orders:foreign?[{...order(99),context:'organization:99'}]:[order(11),order(12)]}));
  await p.route('**/api/v1/forms/*/submit',r=>{submits.push({url:r.request().url(),body:r.request().postDataJSON()});return json(r,{status:'accepted',reference:'BROWSER-FIXTURE-ONLY'})});
  try{
   await p.goto(base+'/forms/appeal?purpose=warranty&expectedContext=personal');
   await p.waitForFunction(()=>document.querySelector('textarea')?.value.includes('Товар:'));
   const box=p.getByRole('checkbox');ok(width+' two agreement boxes',await box.count()===2);ok(width+' checked by default',await box.nth(0).isChecked()&&await box.nth(1).isChecked());
   await p.locator('textarea').fill('Описание неисправности сохранено');await box.nth(0).click();ok(width+' can uncheck',!(await box.nth(0).isChecked()));
   const url=p.url();await p.getByRole('button',{name:'Выбрать заказ',exact:true}).click();await p.getByRole('button',{name:'Выбрать заказ UI-TEST-11',exact:true}).click();
   await p.getByRole('button',{name:'Прикрепить файл',exact:true}).waitFor();await p.waitForTimeout(150);
   ok(width+' same route after order choice',p.url()===url);ok(width+' comment retained',await p.locator('textarea').inputValue()==='Описание неисправности сохранено');ok(width+' consent stays unchecked',!(await box.nth(0).isChecked()));
   await p.getByRole('button',{name:'Тема обращения',exact:true}).click();await p.getByRole('button',{name:'Проверка гарантийного случая',exact:true}).click();
   const before=submits.length;await p.getByRole('button',{name:'Отправить',exact:true}).click();ok(width+' unchecked prevents submit',submits.length===before);ok(width+' clear consent error',await p.getByText('Для продолжения подтвердите согласие.',{exact:false}).count()>0);
   await p.getByRole('button',{name:'Выбрать другой заказ',exact:true}).click();await p.getByRole('textbox',{name:'Найти заказ по номеру или товару'}).fill('12');ok(width+' order search',await p.getByRole('button',{name:'Выбрать заказ UI-TEST-11',exact:true}).count()===0);
   failNext=true;await p.getByRole('button',{name:'Выбрать заказ UI-TEST-12',exact:true}).click();await p.getByRole('button',{name:'Повторить загрузку формы',exact:true}).click();await p.waitForTimeout(250);
   ok(width+' retry keeps comment',await p.locator('textarea').inputValue()==='Описание неисправности сохранено');ok(width+' retry keeps removed consent',!(await box.nth(0).isChecked()));
   await p.getByRole('button',{name:'Выбрать другой заказ',exact:true}).click();await p.getByRole('button',{name:'Вернуться к форме',exact:true}).click();ok(width+' close keeps selected order',await p.getByText('Выбран заказ UI-TEST-12',{exact:true}).count()===1);
   await p.getByRole('button',{name:'Тема обращения',exact:true}).click();await p.getByRole('button',{name:'Проверка гарантийного случая',exact:true}).click();await box.nth(0).click();await p.waitForFunction(()=>document.querySelector('[role=checkbox]')?.getAttribute('aria-checked')==='true');
   ok(width+' no horizontal page overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await p.screenshot({path:path.join(dir,tag+'-warranty-'+width+'.png'),fullPage:true});
   await p.getByRole('button',{name:'Отправить',exact:true}).click();await p.getByText('Данные приняты',{exact:true}).waitFor();
   const last=submits.at(-1);ok(width+' selected ID bound to existing order form',last.url.includes('/appeal-order/submit')&&last.body.target.orderId==='12');ok(width+' actual consent values sent',last.body.consents.length===2&&last.body.consents.every(x=>x.accepted===true));
   await p.goto(base+'/forms/appeal?purpose=warranty');await p.getByRole('button',{name:'Выбрать заказ',exact:true}).waitFor();foreign=true;await p.getByRole('button',{name:'Выбрать заказ',exact:true}).click();await p.getByRole('button',{name:'Повторить загрузку заказов',exact:true}).waitFor();ok(width+' foreign context list rejected',await p.getByRole('button',{name:'Выбрать заказ UI-TEST-99',exact:true}).count()===0);await p.getByRole('button',{name:'Вернуться к форме',exact:true}).click();foreign=false;
   for(const id of ['callback','auth-register','supplier','return']){await p.goto(base+'/forms/'+id);await p.getByRole('checkbox').first().waitFor();ok(width+' '+id+' agreements checked',await p.getByRole('checkbox').first().isChecked());}
   await p.goto(base+'/procurement');await p.getByRole('checkbox').first().waitFor();ok(width+' procurement checked',await p.getByRole('checkbox').first().isChecked());await p.getByRole('checkbox').first().click();ok(width+' procurement removable',!(await p.getByRole('checkbox').first().isChecked()));
   await p.goto(base+'/more');const call=p.getByRole('button',{name:'Позвонить',exact:true}),write=p.getByRole('button',{name:'Написать',exact:true});await write.waitFor();const a=await call.boundingBox(),b=await write.boundingBox();ok(width+' call/write aligned equal height',Math.abs(a.y-b.y)<1&&Math.abs(a.height-b.height)<1&&b.x>a.x);await p.screenshot({path:path.join(dir,tag+'-menu-'+width+'.png')});await write.click();await p.getByText('sales@prom23.ru',{exact:true}).waitFor();ok(width+' write uses verified email',await p.getByRole('button',{name:'Написать по электронной почте',exact:true}).count()===1);ok(width+' menu no horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  }finally{const token=await p.evaluate(()=>localStorage.getItem('prom23-local-session-v2'));if(token)await p.request.delete(base+'/api/session',{headers:{Authorization:'Bearer '+token}});await c.close();}
 }
 ok('no JS errors',errors.length===0);
 }finally{await browser.close();fs.writeFileSync(path.join(dir,tag+'-checks.json'),JSON.stringify({fixtureOnly:true,realFormsSent:0,checks,errors,fixtureSubmissions:submits.length},null,2));}
 console.log(checks.length+' checks PASS');
})().catch(e=>{console.error(e);process.exitCode=1});
