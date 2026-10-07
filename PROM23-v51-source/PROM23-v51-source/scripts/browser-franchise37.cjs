const {chromium}=require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),path=require('path');
const base=process.argv[2]||'http://127.0.0.1:8087',tag=base.includes('159.253')?'public':'local';
const out=path.resolve(__dirname,'../docs/parity/evidence/franchise37');
const cities=['Минск','Тюмень','Иркутск','Тбилиси','Алматы','Ереван','Гудаута','Луганск'];
const checks=[],errors=[];
function ok(name,value){checks.push({name,pass:!!value});if(!value)throw Error(name);}
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 try {
  for(const width of [320,390,768,1280]){
   const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(base+'/pages/franchise?v=37');
   const assortment=page.getByTestId('franchise-assortment'),network=page.getByTestId('franchise-network');
   await assortment.getByRole('heading',{name:'Что вы сможете продавать',exact:true}).waitFor();
   ok(width+' revised copy',!(await assortment.innerText()).includes('Франчайзи получает возможность'));
   ok(width+' five catalogue routes retained',await assortment.getByRole('button').count()===5);
   await assortment.getByRole('heading').first().scrollIntoViewIfNeeded();
   await page.screenshot({path:`${out}/${tag}-${width}-assortment.png`});
   ok(width+' eight working statuses',await network.getByText('Работает',{exact:true}).count()===8);
   ok(width+' Astana removed',!(await network.innerText()).includes('Астана'));
   ok(width+' Gudauta location',await network.innerText().then(t=>t.includes('Абхазия')));
   ok(width+' eight pins',await network.getByRole('button',{name:/^Действующая точка:/}).count()===8);
   for(const city of cities){
    const pin=network.getByRole('button',{name:'Действующая точка: '+city,exact:true});
    await pin.click();
    ok(width+' clickable pin '+city,await pin.getAttribute('aria-pressed')==='true');
    ok(width+' active detail '+city,await page.getByTestId('franchise-partner-detail').innerText().then(t=>t.includes(city)&&t.includes('Действующая')));
    const card=network.getByRole('button',{name:new RegExp('^'+city+', .*работает$')});
    await card.click();
    ok(width+' card selection '+city,await card.getAttribute('aria-pressed')==='true');
   }
   await network.getByRole('heading').first().scrollIntoViewIfNeeded();
   const markerRects=await network.getByRole('button',{name:/^Действующая точка:/}).evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}}));
   ok(width+' no marker hit area overlap',markerRects.every((a,i)=>markerRects.every((b,j)=>i===j||a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y)));
   ok(width+' no page overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:`${out}/${tag}-${width}-network.png`});
   await network.getByRole('button',{name:'Предложить свой регион',exact:true}).click();
   await page.waitForFunction(()=>{const y=document.querySelector('[data-testid=franchise-request]').getBoundingClientRect().y;return y>=40&&y<160});
   ok(width+' request anchor',await page.getByTestId('franchise-request').boundingBox().then(r=>r.y>=40&&r.y<160));
   ok(width+' form retained',await page.getByTestId('franchise-form').count()===1);
   const token=await page.evaluate(()=>localStorage.getItem('prom23-local-session-v2'));
   if(token)await page.request.delete(base+'/api/session',{headers:{Authorization:'Bearer '+token}});
   await context.close();
  }
  ok('no JS errors',errors.length===0);
  console.log(checks.length+' checks passed');
 }finally{await browser.close();fs.writeFileSync(`${out}/${tag}-checks.json`,JSON.stringify({base,checks,errors},null,2));}
})().catch(e=>{console.error(e);process.exitCode=1});
