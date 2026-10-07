const { chromium } = require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),base='http://127.0.0.1:8087';
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
await context.route('**/*',async route=>{const r=route.request(),u=new URL(r.url());if(!['GET','HEAD'].includes(r.method())&&!(u.origin===base&&r.method()==='POST'&&u.pathname==='/api/sessions'))return route.abort();return route.continue();});
const page=await context.newPage();page.setDefaultTimeout(8000);const result={history:[],scroll:[]};
const capture=async label=>result.history.push({label,url:page.url(),...await page.evaluate(()=>({length:history.length,historyStateKeys:Object.keys(history.state||{}),heading:[...document.querySelectorAll('[role=heading]')].filter(e=>!e.closest('[aria-hidden=true]')).map(e=>e.textContent)}))});
try{
await page.goto(base+'/');await page.getByRole('button',{name:'Открыть меню магазина',exact:true}).waitFor();await page.goto(base+'/catalog?section=all');await page.getByRole('button',{name:'Раздел каталога: Леса',exact:true}).waitFor();await capture('catalog-root');
await page.getByRole('button',{name:'Раздел каталога: Леса',exact:true}).click();await page.waitForURL(/section=250/);await capture('parent');
await page.getByRole('button',{name:/^Подраздел:/}).first().click();await page.waitForURL(u=>u.searchParams.get('section')!=='250');await capture('child');
await page.reload();await page.getByRole('button',{name:'Леса',exact:true}).waitFor();await capture('child-reload');await page.goBack();await page.waitForTimeout(200);await capture('browser-back');await page.screenshot({path:path.join(root,'docs/testing/qa-v8-history-after-back.png')});
for(const viewport of [{width:390,height:844},{width:844,height:390}]){
await page.setViewportSize(viewport);await page.goto(base+'/');await page.getByTestId('home-feed').waitFor();
const feed=page.getByTestId('home-feed').filter({visible:true});
for(let i=0;i<16;i++){
 const metrics=await feed.evaluate(e=>({scrollTop:e.scrollTop,scrollHeight:e.scrollHeight,clientHeight:e.clientHeight,rect:{x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height},buyer:!!e.querySelector('[data-testid=home-buyer-benefits]'),business:!!e.querySelector('[data-testid=home-business]'),headings:[...e.querySelectorAll('[role=heading]')].map(h=>h.textContent)}));
 result.scroll.push({viewport,step:i,...metrics}); if(metrics.buyer){await page.getByTestId('home-buyer-benefits').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,`docs/testing/qa-v8-buyers-scroll-${viewport.width}.png`)});break;}
 await page.mouse.move(metrics.rect.x+metrics.rect.width/2,metrics.rect.y+metrics.rect.height/2);await page.mouse.wheel(0,450);await page.waitForTimeout(220);
}
await page.screenshot({path:path.join(root,`docs/testing/qa-v8-scroll-probe-${viewport.width}.png`)});
}
}catch(e){result.error=e.message;}finally{fs.writeFileSync(path.join(root,'docs/testing/qa-v8-history-scroll-probe.json'),JSON.stringify(result,null,2));await browser.close();}
})();
