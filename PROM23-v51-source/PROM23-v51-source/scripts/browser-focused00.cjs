const {chromium}=require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),base=process.env.QA_BASE_URL||'http://127.0.0.1:8087',out=path.join(root,'docs/parity/evidence/focused00'+(base.includes('159.253')?'-public':'-local'));
fs.mkdirSync(out,{recursive:true});
const source=fs.readFileSync(path.join(root,'mobile/src/navigation-menu.ts'),'utf8');
const entries=[...source.matchAll(/\{ title: '([^']+)', route: '([^']+)', source: '([^']+)', icon: '([^']+)' \}/g)].map(m=>({title:m[1],route:m[2],source:m[3],icon:m[4]}));
const before=cp.execFileSync('git',['-C',path.join(root,'mobile'),'show','7b29fb5:src/navigation-menu.ts'],{encoding:'utf8'});
const old=[...before.matchAll(/\{ title: '([^']+)', route: '([^']+)', source: '([^']+)' \}/g)].map(m=>({title:m[1],route:m[2],source:m[3]}));
assert.deepEqual(entries.map(({icon,...e})=>e),old);assert.equal(entries.length,41);
const groups=[...source.matchAll(/\{ title: '([^']+)', entries:/g)].map(m=>m[1]);assert.equal(groups.length,5);
const report={at:new Date().toISOString(),base,checks:[],errors:[],entries,groups};
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try{for(const width of [320,390]){const ctx=await browser.newContext({viewport:{width,height:844},reducedMotion:width===320?'reduce':'no-preference'});const p=await ctx.newPage();p.setDefaultTimeout(12000);p.on('pageerror',e=>report.errors.push(e.message));
const v=l=>l.filter({visible:true});const nav=()=>v(p.getByTestId('bottom-navigation'));const toast=()=>p.getByTestId('location-change-notice');
const check=(name,pass=true)=>{report.checks.push({width,name,pass});save();assert.ok(pass,name)};
const shot=name=>p.screenshot({path:path.join(out,name+'-'+width+'.png')});
const go=async route=>{await p.goto(base+route);await nav().waitFor()};
await go('/product/prom-2414');report.bundle=await p.locator('script[src*="entry-"]').getAttribute('src');await v(p.getByRole('button',{name:'В корзину',exact:true})).last().click();await v(p.getByRole('tab',{name:'Корзина. Товаров: 1',exact:true})).waitFor();
await v(p.getByRole('button',{name:'Открыть меню',exact:true})).click();await p.waitForURL(/\/more$/);
check('all five groups',await v(p.getByRole('heading',{level:2})).count()===5);
for(const name of groups)check('group '+name,await v(p.getByRole('heading',{name,exact:true})).count()===1);
check('all 41 rows/icons',await p.locator('[data-testid^="menu-row:"]').count()===41&&await p.locator('[data-testid^="menu-icon:"]').count()===41);
check('one call action',await v(p.getByRole('button',{name:/^Позвонить/})).count()===1);
check('minimum48px rows',await p.locator('[data-testid^="menu-row:"]').evaluateAll(rows=>rows.every(r=>r.getBoundingClientRect().height>=48)));
check('decorative icons hidden',await p.locator('[data-testid^="menu-icon:"]').evaluateAll(rows=>rows.every(r=>r.getAttribute('aria-hidden')==='true'&&r.querySelector('svg'))));
check('no menu overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await shot('menu-top');await p.getByTestId('global-menu-scroll').evaluate(e=>e.scrollTop=750);await shot('menu-middle');await p.getByTestId('global-menu-scroll').evaluate(e=>e.scrollTop=e.scrollHeight);await shot('menu-bottom');
for(const e of entries){await v(p.getByRole('link',{name:e.title,exact:true})).click();const u=new URL(e.route,base);await p.waitForURL(x=>x.pathname===u.pathname&&x.search===u.search);await nav().waitFor();check('route '+e.route,await v(p.getByRole('tab',{name:'Корзина. Товаров: 1',exact:true})).count()===1&&!/Страница не найдена|Раздел не найден|Unmatched Route/.test(await p.locator('body').innerText()));await v(p.getByRole('button',{name:'Назад',exact:true})).first().click();await p.waitForURL(/\/more$/);}
for(const label of ['Главная','Каталог','Корзина. Товаров: 1','Избранное','Кабинет']){await v(p.getByRole('tab',{name:label,exact:true})).click();await p.waitForTimeout(250);await nav().waitFor();check('tab '+label,await v(p.getByRole('tab',{name:label,exact:true})).getAttribute('aria-selected')==='true');await go('/more');}
await go('/cart');await p.getByRole('button',{name:'Выбрать населённый пункт доставки'}).waitFor();const heading=()=>v(p.getByRole('heading',{name:'Корзина',exact:true}));const baseline=(await heading().boundingBox()).y;
const change=async(name,re)=>{await v(p.getByRole('button',{name:'Выбрать населённый пункт доставки'})).click();await p.getByRole('textbox',{name:'Поиск населённого пункта'}).fill(name);await p.getByRole('button',{name:re}).first().click();await p.getByText('Куда доставить заказ?',{exact:true}).waitFor({state:'hidden'});await toast().waitFor()};
await p.evaluate(()=>{window.noticeMotion=[];let found=false;const timer=setInterval(()=>{const e=document.querySelector('[data-testid="location-change-notice"]');if(e){found=true;window.noticeMotion.push(Number(getComputedStyle(e).opacity))}else if(found)clearInterval(timer)},16)});
await change('Динская',/Краснодарский.*Динская/);const visibleAt=Date.now();check('toast visible',await toast().isVisible());check('honest cart message',(await toast().innerText()).includes('нужно подтвердить'));check('polite status',await toast().getByRole('status').getAttribute('aria-live')==='polite');check('toast does not steal focus',await toast().evaluate(e=>!e.contains(document.activeElement)));
if(width===320)check('reduced motion no translation',await toast().evaluate(e=>['none','matrix(1, 0, 0, 1, 0, 0)'].includes(getComputedStyle(e).transform)));
await shot('toast-visible');await toast().waitFor({state:'detached',timeout:5500});const elapsed=Date.now()-visibleAt;report.motion=report.motion||{};report.motion[width]=await p.evaluate(()=>[...new Set(window.noticeMotion)]);check('auto-dismiss around4s',elapsed>=3000&&elapsed<5200);check('motion preference respected',await p.evaluate(reduce=>reduce?window.noticeMotion.every(n=>n===0||n===1):window.noticeMotion.some(n=>n>0&&n<1),width===320));check('layout fully released',Math.abs((await heading().boundingBox()).y-baseline)<1);await shot('toast-dismissed');
await v(p.getByRole('button',{name:'Открыть меню',exact:true})).click();check('no replay after navigation',await toast().count()===0);await p.reload();await nav().waitFor();check('no replay after reload',await toast().count()===0);
await go('/cart');await change('Краснодар',/Краснодарский.*Краснодар/);await toast().getByRole('button',{name:'Закрыть уведомление о месте доставки'}).click();check('manual X immediately removes',await toast().count()===0);await v(p.getByRole('button',{name:'Открыть меню',exact:true})).click();check('manual dismiss no route replay',await toast().count()===0);
const token=await p.evaluate(()=>localStorage.getItem('prom23-local-session-v2'));if(token)await p.request.delete(base+'/api/session',{headers:{Authorization:'Bearer '+token}});await ctx.close();}}
finally{await browser.close();save()}
assert.equal(report.errors.length,0);console.log(JSON.stringify({passed:report.checks.filter(c=>c.pass).length,total:report.checks.length,bundle:report.bundle,errors:report.errors}));
})().catch(e=>{report.error=e.stack;save();console.error(e);process.exitCode=1});
