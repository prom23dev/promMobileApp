const {chromium}=require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:8087',out=__dirname+'/../docs/parity/evidence/home19-'+(base.includes('159.253')?'public':'local');fs.mkdirSync(out,{recursive:true});
const report={checks:[],errors:[],base},catalog=JSON.parse(fs.readFileSync(__dirname+'/../data/catalog.json'));
function check(name,pass){report.checks.push({name,pass});assert.ok(pass,name)}
async function reveal(p,id){const el=p.getByTestId(id).filter({visible:true});for(let n=0;n<55&&!await el.count();n++){await p.getByTestId('home-feed').evaluate(e=>e.scrollTop+=420);await p.waitForTimeout(120)}await el.waitFor();await el.evaluate(e=>e.scrollIntoView({block:'start'}));await p.waitForTimeout(500);return el}
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{for(const width of (process.env.QA_WIDTHS||'320,390,768,1280').split(',').map(Number)){
const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(base+'/');await p.getByTestId('home-hero').waitFor();await p.waitForTimeout(350);
check(width+' initial grid bounded to first batch',await p.locator('[data-testid^="discovery-product-"]').count()<=12);
check(width+' new hero title',(await p.getByRole('heading',{level:1}).innerText()).replace(/\s+/g,' ')==='Леса, вышки, станки, опалубка, инструменты');
check(width+' five matching actual photos',await p.getByTestId('home-hero-equipment').getByRole('img').count()===5);
const bell=p.getByRole('button',{name:'Уведомления',exact:true}),phone=p.getByRole('button',{name:'Позвонить · 8 (800) 200-25-90',exact:true}).first(),bb=await bell.boundingBox(),pb=await phone.boundingBox();check(width+' bell beside phone',bb&&pb&&Math.abs(bb.y-pb.y)<2&&bb.x+bb.width<=pb.x&&pb.x+pb.width<=width);
await p.screenshot({path:out+'/updated-header-'+width+'.png'});
await bell.click();await p.waitForURL(u=>u.pathname==='/notifications');await p.getByText('Здесь будут ваши уведомления',{exact:true}).waitFor();check(width+' real notifications route',true);await p.goBack();await p.getByTestId('home-hero').waitFor();
await p.getByRole('tab',{name:'Баннер: Проекты',exact:true}).click();check(width+' projects wording',(await p.getByRole('heading',{level:1}).innerText()).replace(/\s+/g,' ')==='Оснащаем объекты под ключ');
const shelf=await reveal(p,'home-section-manufactured');check(width+' own products heading',await shelf.getByRole('heading',{name:'Рекомендуем к покупке',exact:true}).count()===1);check(width+' own products subtitle',await shelf.getByText('Товары нашего производства',{exact:true}).count()===1);
const company=await reveal(p,'home-company');check(width+' production copy',(await company.innerText()).includes('От чертежа до готовой продукции')&&(await company.innerText()).includes('Дополнительно изготавливаем индивидуальную продукцию по техническому заданию заказчиков.'));
const facts=company.getByRole('button').filter({hasText:/^(С 2008 года|Наши награды|Экспорт)/});const boxes=await facts.evaluateAll(es=>es.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height,bg:getComputedStyle(e).backgroundColor})));check(width+' three equal colored company links',boxes.length===3&&boxes.every(x=>x.w===boxes[0].w&&x.h===boxes[0].h&&x.bg==='rgb(61, 68, 113)'));
await p.screenshot({path:out+'/updated-production-'+width+'.png'});
const account=await reveal(p,'home-account-invitation'),cta=account.getByRole('button',{name:'Открыть личный кабинет',exact:true});check(width+' prominent account CTA',await cta.evaluate(e=>getComputedStyle(e).backgroundColor==='rgb(217, 57, 22)'));await p.screenshot({path:out+'/updated-account-'+width+'.png'});
await cta.click();await p.waitForURL(u=>u.pathname==='/account');check(width+' account link works',true);await p.goBack();
await p.goto(base+'/');await p.getByTestId('home-hero').waitFor();await p.waitForTimeout(350);const seen=new Set(),order=[];let maxMounted=0;for(let n=0;n<100;n++){
const ids=await p.locator('[data-testid^="discovery-product-"]').evaluateAll(es=>es.map(e=>e.dataset.testid.replace('discovery-product-','')));maxMounted=Math.max(maxMounted,ids.length);for(const id of ids)if(!seen.has(id)){seen.add(id);order.push(id)}
if(seen.size>=6&&seen.size<=12)await p.screenshot({path:out+'/discovery-'+width+'.png'});
if(seen.size===catalog.length && await p.getByTestId('home-discovery-footer').getByText('Вы посмотрели все товары этой подборки',{exact:true}).count() && await p.getByTestId('home-feed').evaluate(e=>e.scrollTop+e.clientHeight>=e.scrollHeight-3))break;
await p.getByTestId('home-feed').evaluate(e=>e.scrollTop+=400);await p.waitForTimeout(250)}
report['discovery-'+width]={order,maxMounted,footer:await p.getByTestId('home-discovery-footer').allTextContents(),scroll:await p.getByTestId('home-feed').evaluate(e=>({top:e.scrollTop,height:e.scrollHeight,client:e.clientHeight}))};await p.screenshot({path:out+'/discovery-end-'+width+'.png'});
check(width+' all source products reached with autoload',seen.size===catalog.length);
check(width+' real products only',order.every(id=>catalog.some(p=>p.id===id)));
check(width+' mixed opening categories',new Set(order.slice(0,6).map(id=>catalog.find(p=>p.id===id).category)).size>=4);
check(width+' no duplicate mounted cards',(await p.locator('[data-testid^="discovery-product-"]').evaluateAll(es=>new Set(es.map(e=>e.dataset.testid)).size===es.length)));
check(width+' no overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
const token=await p.evaluate(()=>localStorage.getItem('prom23-local-session-v2'));if(token)await p.request.delete(base+'/api/session',{headers:{Authorization:'Bearer '+token}});console.log('Width '+width+' passed');await ctx.close();
}check('no JS errors',report.errors.length===0)}finally{fs.writeFileSync(out+'/details-report.json',JSON.stringify(report,null,2));await browser.close()}console.log(JSON.stringify({checks:report.checks.length,errors:report.errors}))})().catch(e=>{console.error(e);process.exitCode=1});
