const {chromium}=require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try {const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});const errors=[],blocked=[];page.on('pageerror',e=>errors.push(e.message));
await page.route('**/*',route=>{const r=route.request();if(!['GET','HEAD'].includes(r.method())){const u=new URL(r.url());if(u.origin!=='http://159.253.19.172:18087'||!['/api/sessions','/api/actions'].includes(u.pathname)){blocked.push(u.pathname);return route.abort();}}return route.continue();});
const response=await page.goto('http://159.253.19.172:18087/',{waitUntil:'networkidle'});assert.equal(response.status(),200);await page.getByRole('button',{name:'Открыть каталог',exact:true}).waitFor();assert.equal(await page.locator('script[src*="entry-9bd376941d209cef85b2f91b43359fc7.js"]').count(),1);
await page.screenshot({path:'/Users/prom23/Projects/prom23-mobile/docs/live-v7-home-390.png'});
assert.equal(await page.getByRole('button',{name:'Открыть меню магазина',exact:true}).count(),1);
const contacts=page.getByRole('button',{name:'Контакты и адреса',exact:true});await contacts.first().click();await page.getByRole('heading',{name:/Контакты|Магазины и контакты/}).first().waitFor();await page.screenshot({path:'/Users/prom23/Projects/prom23-mobile/docs/live-v7-contacts-390.png'});
assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
fs.writeFileSync('/Users/prom23/Projects/prom23-mobile/docs/live-browser-v7.json',JSON.stringify({status:'passed',base:'http://159.253.19.172:18087',entry:'9bd376941d209cef85b2f91b43359fc7',screens:['home','contacts'],pageErrors:errors,blockedExternalWrites:blocked,limitations:'Chromium web preview only; no telephone call or store writes executed.'},null,2));}
finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
