const {chromium}=require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
const base=process.env.BASE_URL||'http://127.0.0.1:8093',out=process.env.EVIDENCE_DIR||'docs/parity/evidence/ux45/forms-local';fs.mkdirSync(out,{recursive:true});
const staticResponses=new Map();
const forms=JSON.parse(fs.readFileSync('server/integrations/form-contracts.json')).forms,results=[],errors=[];
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});try{for(const width of [390,1280]){
 const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/more');await page.getByRole('button',{name:'Отклонить необязательные',exact:true}).click();await page.getByRole('button',{name:'Понятно',exact:true}).click();
 await page.route('**/*',async r=>{const u=r.request().url(),p=new URL(u).pathname;if(!p.startsWith('/_expo/')&&!p.startsWith('/assets/'))return r.fallback();if(!staticResponses.has(u))staticResponses.set(u,(async()=>{const res=await r.fetch(),body=await res.body(),headers={...res.headers()};delete headers['content-encoding'];delete headers['content-length'];return {status:res.status(),headers,body};})());return r.fulfill(await staticResponses.get(u));});
 await page.route('**/api/v1/forms/*/context',r=>r.fulfill({json:{data:{revision:'ux45-ui-only',options:{}}}}));await page.route('**/api/v1/forms/*/submit',r=>r.abort());await page.route('**/api/v1/procurement/submit',r=>r.abort());
 for(const form of Object.values(forms)){
  if(['procurement','checkout'].includes(form.id))continue;
  const row={id:form.id,width,checks:0};try{
   await page.waitForTimeout(1300);await page.goto(base+'/forms/'+form.id);const panel=page.getByTestId('form-consents');await panel.waitFor();
   for(const c of form.consents){const checkbox=panel.getByRole('checkbox',{name:c.label,exact:true});await checkbox.waitFor();assert.equal(await checkbox.getAttribute('aria-checked'),'false');await checkbox.click();assert.equal(await checkbox.getAttribute('aria-checked'),'true');await checkbox.click();assert.equal(await checkbox.getAttribute('aria-checked'),'false');row.checks+=3;}
   assert.equal(await panel.getByRole('link').count(),form.consents.length);row.checks++;
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));row.checks++;
   const metrics=await panel.getByRole('checkbox').first().evaluate(el=>{const text=el.lastElementChild,box=el.firstElementChild,s=getComputedStyle(text);return {font:s.fontSize,line:s.lineHeight,width:box.getBoundingClientRect().width,height:box.getBoundingClientRect().height}});assert.deepEqual(metrics,{font:'14px',line:'20px',width:20,height:20});row.checks++;
   if(['callback','auth-register','appeal','checkout','review','subscription'].includes(form.id)){await panel.scrollIntoViewIfNeeded();await page.screenshot({path:out+'/'+form.id+'-'+width+'.png'});}
   if(form.id==='callback'){await panel.getByRole('checkbox').first().click();await panel.getByRole('link').last().click();await page.waitForURL('**/legal/privacy');await page.waitForTimeout(200);await page.goBack();await panel.waitFor();assert.equal(await panel.getByRole('checkbox').first().getAttribute('aria-checked'),'true');row.checks++;}
  }catch(e){row.failure=e.message;await page.screenshot({path:out+'/failed-'+form.id+'-'+width+'.png'});}results.push(row);
  if(results.length%20===0)console.log(JSON.stringify({completed:results.length,failures:results.filter(x=>x.failure).length}));
 }
 await page.goto(base+'/pages/franchise');const inline=page.getByTestId('form-consents');await inline.waitFor();assert.equal(await inline.getByRole('checkbox').count(),2);results.push({id:'inline-franchise',width,checks:1});await context.close();
 }}finally{await browser.close();fs.writeFileSync(out+'/forms.json',JSON.stringify({base,results,errors,liveSubmissions:0},null,2));}
 console.log(JSON.stringify({checks:results.reduce((s,x)=>s+x.checks,0),failures:results.filter(x=>x.failure),errors}));if(results.some(x=>x.failure)||errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
