const {chromium}=require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('fs'),assert=require('assert/strict');const base=process.env.QA_BASE_URL||'http://127.0.0.1:8087',out=__dirname+'/../docs/parity/evidence/home21-'+(base.includes('159.253')?'public':'local');fs.mkdirSync(out,{recursive:true});const report={base,checks:[],errors:[]};
function check(name,pass){report.checks.push({name,pass});assert.ok(pass,name)}
async function reveal(p,id){let el=p.getByTestId(id).filter({visible:true});for(let i=0;i<65&&!await el.count();i++){await p.getByTestId('home-feed').evaluate(e=>e.scrollTop+=450);await p.waitForTimeout(160)}await el.waitFor();await el.evaluate(e=>e.scrollIntoView({block:'start'}));await p.waitForTimeout(450);return el}
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});try{for(const width of [320,390,768,1280]){const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));await p.goto(base+'/');await p.getByTestId('home-hero').waitFor();await p.waitForTimeout(350);report.bundle=await p.locator('script[src*="entry-"]').getAttribute('src');const gradients=[];
for(const [i,name] of ['Оборудование','Производство','Проекты'].entries()){
 await p.getByRole('tab',{name:'Баннер: '+name,exact:true}).click();await p.waitForTimeout(250);const hero=await p.getByTestId('home-banner').boundingBox(),photo=await p.getByTestId('home-banner-photo').boundingBox(),copy=await p.getByTestId('home-banner-copy').boundingBox();
 check(width+' '+name+' photo inside banner',photo&&hero&&Math.abs(photo.y-hero.y)<2&&Math.abs(photo.height-hero.height)<2);
 check(width+' '+name+' text inside banner',copy&&hero&&copy.y>=hero.y&&copy.y+copy.height<=hero.y+hero.height+1);
 check(width+' '+name+' one image',await p.getByTestId('home-banner-photo').getByRole('img').count()===1);
 check(width+' '+name+' no separate photo strip',await p.getByTestId('home-hero-equipment').count()===0);
 gradients.push(await p.getByTestId('home-banner-gradient').locator('stop').first().getAttribute('stop-color'));
 check(width+' '+name+' single H1',await p.getByRole('heading',{level:1}).count()===1);
 await p.screenshot({path:out+'/banner-'+i+'-'+width+'.png'});
}
check(width+' distinct gradient spectra',new Set(gradients).size===3);check(width+' no horizontal overflow',await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));

const expected=['#122F43','#292C2E','#18354B'];check(width+' palette',JSON.stringify(gradients)===JSON.stringify(expected));await ctx.close();}
check('no JS errors',report.errors.length===0);fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks.length,errors:report.errors,bundle:report.bundle}));}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
