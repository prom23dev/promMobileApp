const { chromium } = require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs'), assert = require('assert/strict');
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:8087';
const out = __dirname + '/../docs/parity/evidence/home19-' + (base.includes('159.253') ? 'public' : 'local'); fs.mkdirSync(out, { recursive: true });
const report = { base, checks: [], errors: [] };
function check(name, pass) { report.checks.push({ name, pass }); assert.ok(pass, name); }
async function reveal(p, id) { const el = p.getByTestId(id).filter({visible:true}); for(let i=0;i<35 && !(await el.count());i++) { await p.getByTestId('home-feed').evaluate(e=>e.scrollTop += 500); await p.waitForTimeout(120); } await el.waitFor(); await el.evaluate(e=>e.scrollIntoView({block:'start'})); await p.waitForTimeout(350); return el; }
async function cleanup(p) { const token = await p.evaluate(()=>localStorage.getItem('prom23-local-session-v2')); if(token) await p.request.delete(base+'/api/session', {headers:{Authorization:'Bearer '+token}}); }
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{
for(const width of [320,390,768,1280]) {
 const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));
 await p.goto(base+'/');await p.getByTestId('home-hero').waitFor();await p.waitForTimeout(350);report.bundle=await p.locator('script[src*="entry-"]').getAttribute('src');
 check(width+' one H1',await p.getByRole('heading',{level:1}).count()===1);
 check(width+' no invented viewing history',await p.getByText('Вы интересовались',{exact:true}).count()===0);
 check(width+' logo',await p.getByRole('img',{name:'Промышленник — фирменный логотип'}).count()===1);
 check(width+' menu accessible',await p.getByRole('button',{name:'Открыть меню',exact:true}).count()===1);
 await p.screenshot({path:out+'/home-'+width+'.png'});
 const cats=await reveal(p,'home-categories');check(width+' scaffolding first',(await cats.getByRole('button').allTextContents())[1]==='Леса');
 check(width+' all categories retained',await cats.getByRole('button',{name:/Раздел каталога:/}).count()===20);
 const popular=await reveal(p,'home-popular');check(width+' card actions exist',await popular.getByRole('button',{name:'В корзину',exact:true}).count()>0);
 await p.screenshot({path:out+'/popular-'+width+'.png'});
 const rail=popular.locator('[aria-label="Популярные товары"]');await popular.getByRole('button',{name:'Следующие товары: Популярные товары',exact:true}).click();await p.waitForTimeout(250);check(width+' product rail advances',await rail.evaluate(e=>e.scrollLeft>100));await popular.getByRole('button',{name:'Предыдущие товары: Популярные товары',exact:true}).click();await p.waitForTimeout(250);check(width+' product rail returns',await rail.evaluate(e=>e.scrollLeft<2));
 for(const id of ['home-buyer-benefits','home-business','home-section-discounts','home-section-manufactured','home-company','home-guide','project-showcase','home-section-articles','home-account-invitation','home-services']) {const el=await reveal(p,id);check(width+' '+id+' no page overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(['home-buyer-benefits','home-business','home-company','home-account-invitation'].includes(id)) await p.screenshot({path:out+'/'+id+'-'+width+'.png'});}
 if(width===390){
 await p.getByRole('button',{name:/^Населённый пункт:/}).filter({visible:true}).click();await p.getByRole('textbox',{name:'Поиск населённого пункта',exact:true}).fill('Краснодар');await p.getByRole('button',{name:/Краснодарский.*Краснодар/}).first().click();await p.getByText('Куда доставить заказ?',{exact:true}).waitFor({state:'hidden'});check('location selection from compact header',await p.getByRole('button',{name:/^Населённый пункт:.*Краснодар/}).count()===1);
 check('phone action remains in header',await p.getByRole('button',{name:'Позвонить · 8 (800) 200-25-90',exact:true}).count()>=1);

 await p.getByTestId('home-feed').evaluate(e=>e.scrollTop=0);await p.getByTestId('home-hero').waitFor();await p.getByRole('tab',{name:'Баннер: Производство',exact:true}).click();check('manual banner changes',await p.getByRole('heading',{level:1}).innerText()==='Производим\nпод вашу задачу');await p.getByRole('button',{name:'Наше производство',exact:true}).click();await p.waitForURL(u=>u.pathname==='/information/production');check('production opens real page',true);await p.goBack();await p.getByTestId('home-hero').waitFor();
 await p.getByTestId('home-hero').getByRole('button',{name:'Контакты',exact:true}).click();await p.waitForURL(u=>u.pathname==='/information/contacts');check('contacts shortcut',true);await p.goBack();
 const personal=await reveal(p,'home-buyer-benefits');await personal.getByRole('button',{name:'Баллы Плюса. Условия Яндекс Пэй',exact:true}).click();await p.waitForURL(u=>u.pathname==='/information/payment');check('plus conditions',true);await p.goBack();
 const business=await reveal(p,'home-business');await business.getByRole('button',{name:'Отправить заявку на просчёт',exact:true}).click();await p.waitForURL(u=>u.pathname==='/procurement');check('existing procurement with list context',new URL(p.url()).searchParams.get('mode')==='list');await p.goBack();
 const pop=await reveal(p,'home-popular');await pop.getByRole('button',{name:'В корзину',exact:true}).first().click();await pop.getByRole('button',{name:/Увеличить количество:/}).first().waitFor();check('cart quantity replaces add',true);
 await p.getByRole('tab',{name:'Для бизнеса',exact:true}).filter({visible:true}).click();await p.waitForFunction(()=>document.body.innerText.includes('Выбрать организацию для оформления'));const token=await p.evaluate(()=>localStorage.getItem('prom23-local-session-v2'));let state=await (await p.request.get(base+'/api/state',{headers:{Authorization:'Bearer '+token}})).json();check('B2B context persisted',state.data.context==='business');check('B2B cart isolated',state.data.carts.business.length===0);
 await p.getByRole('tab',{name:'Для себя',exact:true}).filter({visible:true}).click();await p.waitForFunction(()=>!document.body.innerText.includes('Выбрать организацию для оформления'));state=await (await p.request.get(base+'/api/state',{headers:{Authorization:'Bearer '+token}})).json();check('personal cart retained',state.data.carts.personal.length===1);
 const popAgain=await reveal(p,'home-popular');await popAgain.getByRole('button',{name:/Открыть товар:/}).first().click();await p.waitForURL(u=>u.pathname.startsWith('/product/'));check('real product details',true);await p.goBack();const viewed=await reveal(p,'home-section-personalized');check('view history shown',await viewed.getByRole('heading',{name:'Вы интересовались',exact:true}).count()===1);check('recommendations based on interests',await viewed.getByRole('heading',{name:'Могут понадобиться',exact:true}).count()===1);
 const input=p.getByRole('textbox',{name:'Поиск по названию, бренду или артикулу'});await input.fill('ВПТ0728');await input.press('Enter');await p.getByRole('heading',{name:'Результаты поиска',exact:true}).waitFor();check('search does not open menu',new URL(p.url()).pathname==='/');check('SKU search matches real product',await p.getByRole('button',{name:/Открыть товар: Вышка-тура ВСПТ/}).count()===1);
 await input.clear();await input.focus();await p.getByText('История поиска',{exact:true}).waitFor();await p.getByRole('button',{name:'Искать снова: ВПТ0728',exact:true}).waitFor();check('search history available',true);
 }
 await cleanup(p);await ctx.close();
}
check('no JS errors',report.errors.length===0);
}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close()}console.log(JSON.stringify({checks:report.checks.length,errors:report.errors,bundle:report.bundle}));})().catch(e=>{console.error(e);process.exitCode=1});
