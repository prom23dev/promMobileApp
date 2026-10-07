const {chromium}=require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.BASE_URL||'http://127.0.0.1:8087',out=process.env.EVIDENCE_DIR||'docs/parity/evidence/legal43/local';
const inventory=JSON.parse(fs.readFileSync('docs/legal43/inventory.json'));
if(process.env.ROUTE_FILTER)inventory.routes=inventory.routes.filter(r=>new RegExp(process.env.ROUTE_FILTER).test(r));
fs.mkdirSync(out,{recursive:true});
const results=[],errors=[];
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try {for(const width of (process.env.WIDTHS||'390,1280').split(',').map(Number)) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const first=await context.newPage();await first.goto(base+'/more');await first.getByRole('button',{name:'Отклонить необязательные',exact:true}).click();await first.getByRole('button',{name:'Понятно',exact:true}).click();await first.close();
  // No submissions escape this suite. Read-only schemas are fixtures to inspect every form, not evidence of Bitrix integration.

  let cursor=0;
  await Promise.all(Array.from({length:2},async()=>{
   const page=await context.newPage();let formRouting=false;page.on('pageerror',e=>errors.push({url:page.url(),message:e.message}));
   while(cursor<inventory.routes.length){const route=inventory.routes[cursor++];const row={route,width,checks:[],failures:[]};
    try {
     await page.waitForTimeout(1200);
     if(route.startsWith('/forms/')&&!formRouting){formRouting=true;await page.route('**/api/v1/forms/*/context',r=>r.fulfill({json:{data:{revision:'legal43-ui-fixture',options:{}}}}));await page.route('**/api/v1/forms/*/submit',r=>r.abort());}
     let response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:30000});
     await page.waitForFunction(()=>document.body.innerText.trim().length>40,{},{timeout:15000});
     await page.waitForTimeout(180);
     let text=await page.locator('body').innerText();
     if(text.includes('Слишком много действий')){row.rateLimitRetry=true;await page.waitForTimeout(61000);response=await page.reload({waitUntil:'domcontentloaded'});await page.waitForTimeout(1000);text=await page.locator('body').innerText();}
     row.status=response.status();row.finalUrl=page.url();
     const check=(name,ok)=>{(ok?row.checks:row.failures).push(name)};
     check('HTTP 200',response.ok());check('Rendered application',!text.includes('Слишком много действий')&&!text.includes('Повторить подключение')&&!text.includes('This screen does not exist')&&!text.includes('Unmatched Route'));
     check('No horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
     const form=inventory.forms.find(f=>route==='/forms/'+f.id);
     if(form&&form.id!=='checkout'){
      await page.getByRole('link',{name:'Политика в отношении обработки персональных данных',exact:true}).waitFor({timeout:12000});
      for(const c of form.consents){const control=page.getByRole('checkbox',{name:c.label+(c.required?'':' (необязательно)'),exact:true});
       // Native accessibilityLabel is the source label without the visual optional suffix.
       const raw=page.getByRole('checkbox',{name:c.label,exact:true});const locator=await raw.count()?raw:control;
       check('Consent shown: '+c.name,await locator.count()===1);
       if(await locator.count())check('Consent unchecked: '+c.name,await locator.getAttribute('aria-checked')==='false');
      }
      check('No mandatory policy checkbox',await page.getByRole('checkbox',{name:/[Сс]оглас.*Политик/}).count()===0);
     }
     if(!/legal|policy|consent|agreement|recom-tech|offer|oferta|pages\/(privacy|cookies|personal-data|recommendations)/.test(route)){
      check('No unconditional one-day shipment',!/(отгрузим|подготовим товар к отгрузке) в течение суток/.test(text));
      check('No fixed Split instalment promise',!/Сплит.{0,20}4 платеж/.test(text));
     }
     fs.writeFileSync(path.join(out,`${width}-${encodeURIComponent(route)}.txt`),text);
     if(['/information/payment','/pages/checkout','/forms/return','/forms/production-request','/pages/documents'].includes(route))await page.screenshot({path:path.join(out,`${width}-${encodeURIComponent(route)}.png`)});
    } catch(e){row.failures.push(e.message);fs.writeFileSync(path.join(out,`${width}-${encodeURIComponent(route)}-failed.txt`),await page.locator('body').innerText());await page.screenshot({path:path.join(out,`${width}-${encodeURIComponent(route)}-failed.png`)});}
    results.push(row);
    if(results.length%50===0)console.log(JSON.stringify({completed:results.length,failures:results.filter(x=>x.failures.length).length}));
   }
   await page.close();
  }));await context.close();
 }
 }finally{await browser.close();fs.writeFileSync(path.join(out,'route-audit.json'),JSON.stringify({base,sourcePackage:inventory.sourcePackage,formsFixtureOnly:true,results,errors},null,2));}
 console.log(JSON.stringify({routes:inventory.routes.length,visits:results.length,assertions:results.reduce((n,r)=>n+r.checks.length,0),failures:results.filter(r=>r.failures.length),errors}));
 if(results.some(r=>r.failures.length)||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
