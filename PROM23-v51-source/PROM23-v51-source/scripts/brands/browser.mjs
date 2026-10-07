import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {brandFixture} from './fixture.mjs';
import {renderBrandHtml} from '../../server/brands/seo.mjs';
const require=createRequire(import.meta.url),{chromium}=require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),out=resolve(root,'docs/parity/evidence/brands39');mkdirSync(out,{recursive:true});
const {service,model}=brandFixture(root),checks=[],errors=[];
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
function check(value,label){checks.push({label,pass:!!value});if(!value)throw Error(label);}
try{
 const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
 await context.route('**/api/brands*',route=>{const url=new URL(route.request().url());try{const data=url.pathname==='/api/brands'?service.list():service.page(decodeURIComponent(url.pathname.split('/').pop()),url.searchParams);return route.fulfill({json:{data}});}catch(e){return route.fulfill({status:e.status??500,json:{error:{message:e.message,code:e.code}}});}});
 await context.route('**/api/brands/**',route=>{const url=new URL(route.request().url());try{return route.fulfill({json:{data:service.page(decodeURIComponent(url.pathname.split('/').pop()),url.searchParams)}});}catch(e){return route.fulfill({status:e.status??500,json:{error:{message:e.message,code:e.code}}});}});
 await context.route('**/brand-assets/*.svg',route=>{const slug=new URL(route.request().url()).pathname.split('/').pop().replace('.svg','');const body=['promyshlennik','team'].includes(slug)?readFileSync(resolve(root,`mobile/assets/franchise/${slug==='team'?'team':'prom'}.svg`)):Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="100" viewBox="0 0 240 100"><rect x="5" y="5" width="230" height="90" fill="none" stroke="#626679"/><text x="120" y="57" text-anchor="middle" fill="#626679" font-family="sans-serif" font-size="20">TEST FIXTURE</text></svg>');return route.fulfill({body,contentType:'image/svg+xml'});});
 await context.route('http://127.0.0.1:8087/brands/**',route=>{if(!route.request().isNavigationRequest())return route.fallback();const path=new URL(route.request().url()).pathname,slug=path.split('/').filter(Boolean)[1],brand=model.brands.find(b=>b.slug===slug);if(slug&&!brand)return route.fallback();const shell=readFileSync(resolve(root,'mobile/dist/index.html'),'utf8');return route.fulfill({contentType:'text/html; charset=utf-8',body:renderBrandHtml(shell,brand?{brand,products:service.page(slug).products}:{brands:model.brands})});});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,768,1280]){
  await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:8087/brands/');await page.getByText('Найдено брендов: 15',{exact:true}).waitFor();
  check(await page.getByRole('heading',{name:'Бренды строительного оборудования',exact:true}).count()===1,'one H1 '+width);
  check(await page.getByTestId('brand-card-alumet').count()===1,'approved brand card '+width);
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no page overflow '+width);
  const cards=await page.locator('[data-testid^="brand-card-"]').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));
  const all=cards.slice(2),first=all[0],row=all.filter(c=>Math.abs(c.y-first.y)<2);check(row.length===(width>=1024?3:width>=640?2:1),'responsive columns '+width);
  check(row.every(c=>Math.abs(c.h-first.h)<2),'equal card height '+width);
  await page.screenshot({path:resolve(out,`directory-${width}-fixture.png`)});
  await page.getByTestId('brand-card-alumet').scrollIntoViewIfNeeded();await page.screenshot({path:resolve(out,`all-brands-${width}-fixture.png`)});
  check(await page.getByTestId('brand-card-alumet').evaluate(n=>getComputedStyle(n.parentElement).backgroundColor)==='rgb(255, 255, 255)','brand white surface '+width);
 }
 for(const [query,slug] of [['Лебедянь','stroymash'],['Свеза','sveza'],['Алюмет','alumet'],['TEAM','team']]){
  await page.getByRole('textbox',{name:'Найти бренд',exact:true}).fill(query);await page.getByText('Найдено брендов: 1',{exact:true}).waitFor();check(await page.getByTestId('brand-card-'+slug).count()>0,'search alias '+query);
 }
 await page.getByRole('textbox',{name:'Найти бренд',exact:true}).fill('неизвестнаямарка');await page.getByRole('heading',{name:'Бренд не найден',exact:true}).waitFor();await page.screenshot({path:resolve(out,'no-results-fixture.png')});
 await page.getByRole('button',{name:'Показать все бренды',exact:true}).click();
 await page.getByTestId('brand-card-alumet').getByRole('heading',{name:'Alumet',exact:true}).click();await page.getByRole('heading',{name:'Товары Alumet',exact:true}).waitFor();check(new URL(page.url()).pathname.replace(/\/$/,'')==='/brands/alumet','name leads to detail');
 for(const slug of model.brands.map(b=>b.slug)){
  const b=model.brands.find(b=>b.slug===slug);await page.goto('http://127.0.0.1:8087/brands/');await page.getByTestId('brand-card-'+slug).first().waitFor();const card=page.getByTestId('brand-card-'+slug).first();check(await card.locator('a').count()===0,'no nested links '+slug);check((await card.getAttribute('href')).replace(/\/$/,'')===b.detailUrl.replace(/\/$/,''),'whole card href '+slug);await card.getByTestId('brand-logo-'+slug).click();await page.getByTestId('brand-logo-'+b.slug).last().waitFor();await page.getByRole('heading',{name:b.name,exact:true,level:1}).waitFor();check(new URL(page.url()).pathname.replace(/\/$/,'')===b.detailUrl.replace(/\/$/,''),'logo click '+slug);await page.goto('http://127.0.0.1:8087/brands/'+slug+'/');await page.getByTestId('brand-logo-'+b.slug).last().waitFor();await page.getByRole('heading',{name:b.name,exact:true,level:1}).waitFor();check(await page.getByText(b.shortDescription,{exact:true}).count()===1,'approved detail copy '+slug);check(await page.getByTestId('brand-logo-'+slug).count()===1,'same logo frame '+slug);await page.waitForFunction(title=>document.title===title&&document.querySelectorAll('link[rel="canonical"]').length===1,b.seoTitle);const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');check(canonical?.endsWith(b.detailUrl),'canonical '+slug);check(await page.title()===b.seoTitle,'hydrated title '+slug);check(await page.locator('#brand-initial').count()===0,'initial HTML replaced '+slug);check(await page.locator('script[type="application/ld+json"]').count()===1,'one JSONLD graph '+slug);
 }
 await page.setViewportSize({width:390,height:900});await page.goto('http://127.0.0.1:8087/brands/alumet/');await page.getByRole('heading',{name:'Товары Alumet',exact:true}).waitFor();
 const data=service.page('alumet'),cat=data.categories[0];
 await page.getByRole('button',{name:cat.name+' · '+cat.count,exact:true}).click();await page.waitForURL(url=>url.searchParams.get('category')===cat.id);await page.getByRole('button',{name:cat.name+' · '+cat.count,exact:true}).waitFor();check(new URL(page.url()).pathname.replace(/\/$/,'')==='/brands/alumet','category keeps brand page');
 await page.getByRole('button',{name:'Фильтры',exact:true}).click();await page.getByRole('textbox',{name:'Цена от, рублей'}).fill('100');await page.getByRole('radio',{name:'Сначала дороже'}).click();await page.getByRole('button',{name:'Показать товары',exact:true}).click();await page.waitForURL(url=>url.searchParams.get('sort')==='price-desc');check(new URL(page.url()).searchParams.get('min')==='100','price is shareable');
 await page.reload();await page.getByRole('heading',{name:'Товары Alumet',exact:true}).waitFor();check(new URL(page.url()).searchParams.get('category')===cat.id,'category survives reload');await page.screenshot({path:resolve(out,'detail-alumet-filter-390-fixture.png')});
 await page.goto('http://127.0.0.1:8087/brands/promyshlennik/');await page.getByTestId('brand-logo-promyshlennik').waitFor();await page.screenshot({path:resolve(out,'detail-own-390-fixture.png')});
 for(const width of [320,768,1280]){await page.setViewportSize({width,height:900});await page.goto('http://127.0.0.1:8087/brands/alumet/');await page.getByRole('heading',{name:'Alumet',exact:true}).waitFor();check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'detail no overflow '+width);await page.getByRole('button',{name:service.page('alumet').products[0].name,exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:resolve(out,`products-${width}-fixture.png`)});}
 await page.goto('http://127.0.0.1:8087/catalog/brand/lebedyan/');await page.getByRole('heading',{name:'Товары СТРОЙМАШ',exact:true}).waitFor();check(!new URL(page.url()).pathname.startsWith('/brands/'),'catalog shortcut stays separate');
 await page.goto('http://127.0.0.1:8087/pages/brands');await page.getByRole('heading',{name:'Бренды строительного оборудования',exact:true}).waitFor();check(new URL(page.url()).pathname.replace(/\/$/,'')==='/brands','legacy directory redirects');
 await page.goto('http://127.0.0.1:8087/brands/');await page.getByText('Найдено брендов: 15',{exact:true}).waitFor();await page.getByRole('button',{name:'Порядок брендов',exact:true}).click();await page.getByRole('radio',{name:'По алфавиту',exact:true}).click();check(await page.getByRole('button',{name:'По алфавиту',exact:true}).count()===1,'alphabet sort selected');
 await page.keyboard.press('Tab');check(await page.evaluate(()=>document.activeElement?.tagName!=='BODY'),'keyboard focus');
 await page.goto('http://127.0.0.1:8087/brands/alumet/');await page.getByRole('heading',{name:'Alumet',exact:true}).waitFor();
 const product=service.page('alumet').products[0];
 await page.getByRole('button',{name:'Открыть товар: '+product.name,exact:true}).click();await page.waitForURL(url=>url.pathname.endsWith('/product/'+product.id));check(true,'existing PDP route from brand product');
 await page.goto('http://127.0.0.1:8087/brands/alumet/');await page.getByRole('heading',{name:'Alumet',exact:true}).waitFor();
 await page.getByRole('button',{name:'Сравнить: '+product.name,exact:true}).click();await page.getByRole('button',{name:'Убрать из сравнения: '+product.name,exact:true}).waitFor();check(true,'existing comparison action');
 await page.getByRole('button',{name:'В корзину',exact:true}).first().click();await page.getByRole('button',{name:'Оформить: '+product.name,exact:true}).waitFor();check(true,'existing cart action');
 await page.goto('http://127.0.0.1:8087/catalog?brand=Alumet');await page.getByRole('button',{name:/^Фильтры и сортировка/}).click();await page.getByRole('textbox',{name:'Цена от, рублей'}).fill('200');await page.getByRole('textbox',{name:'Цена до, рублей'}).fill('100');check(await page.getByRole('button',{name:'Показать товары',exact:true}).isDisabled(),'shared catalog price validation');await page.getByRole('dialog').getByRole('button',{name:'Сбросить фильтры',exact:true}).click();check(await page.getByRole('textbox',{name:'Цена от, рублей'}).inputValue()==='','shared catalog reset');
 const token=await page.evaluate(()=>localStorage.getItem('prom23-local-session-v2'));if(token)await page.request.delete('http://127.0.0.1:8087/api/session',{headers:{Authorization:'Bearer '+token}});
 check(errors.length===0,'no browser JS errors');
 await context.close();
}catch(e){errors.push(e.stack);process.exitCode=1;}finally{await browser.close();writeFileSync(resolve(out,'browser-fixture.json'),JSON.stringify({fixture:true,officialLogosVerified:false,checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,errors},null,2));}
