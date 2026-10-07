import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';import {DatabaseSync} from 'node:sqlite';
import {createApp} from '../app.mjs';
const seed=JSON.parse(readFileSync(new URL('./fixtures/gar-settlements.json',import.meta.url)));
const city=seed.items.find(s=>s.name==='Динская');
async function fixture(t, options={}){
 const dir=mkdtempSync(join(tmpdir(),'prom23-master5-http-'));const gar=join(dir,'gar.sqlite');const db=new DatabaseSync(gar);
 db.exec('CREATE TABLE metadata(key TEXT PRIMARY KEY,json TEXT);CREATE TABLE settlements(id TEXT PRIMARY KEY,gar_id TEXT UNIQUE,name TEXT,normalized_name TEXT,region_code TEXT,payload TEXT);CREATE INDEX settlement_prefix ON settlements(normalized_name);CREATE VIRTUAL TABLE settlement_terms USING fts5(name,full_name);CREATE VIRTUAL TABLE settlement_trigrams USING fts5(name,tokenize="trigram");');
 db.prepare('INSERT INTO metadata VALUES(?,?)').run('provenance',JSON.stringify({schemaVersion:1,provider:'fns-gar',providerVersion:seed.providerVersion,sourceUrl:seed.sourceUrl,coverage:{status:'partial',regionCodes:['23'],totalRegions:96,loadedRegions:1,settlementCount:1,excludedWithoutVerifiedChain:0}}));
 db.prepare('INSERT INTO settlements VALUES(?,?,?,?,?,?)').run(city.id,city.garId,city.name,city.name.toLowerCase(),'23',JSON.stringify(city));db.close();
 if(options.malformed){const path=join(dir,'malformed.json');writeFileSync(path,'{"not":"an array"}');options={publicContentPath:path,productDetailsPath:path};}
 const app=createApp({databasePath:':memory:',garDatabasePath:gar,...options});await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));t.after(async()=>{await app.close();rmSync(dir,{recursive:true,force:true});});
 const base=`http://127.0.0.1:${app.server.address().port}`;
 async function call(path,{token,body,method='GET',headers={}}={}){
  const r=await fetch(base+path,{method,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});const text=await r.text();return {status:r.status,headers:r.headers,text,data:text?JSON.parse(text):null};
 }
 const session=async()=>{const r=await call('/api/sessions',{method:'POST',body:{}});assert.equal(r.status,201);return r.data.data.token;};
 const select=async token=>{const r=await call('/api/v1/location',{method:'POST',token,body:{settlementId:city.id,expectedVersion:0,expectedContext:'personal'}});assert.equal(r.status,200);return r;};
 return {call,session,select};
}
test('HTTP public content DTO is credentialless, cached with ETag304, noindex and exact route/method',async t=>{
 const f=await fixture(t);const r=await f.call('/api/v1/content/pages/about');assert.equal(r.status,200);assert.equal(r.data.data.mode,'source-snapshot');assert.equal(r.data.data.page.slug,'about');assert.equal(r.headers.get('x-robots-tag'),'noindex, nofollow');assert.match(r.headers.get('etag'),/^"[a-f0-9]{64}"$/);assert.match(r.headers.get('cache-control'),/max-age=300/);
 const hit=await f.call('/api/v1/content/pages/about',{headers:{'If-None-Match':r.headers.get('etag')}});assert.equal(hit.status,304);assert.equal(hit.text,'');assert.equal(hit.headers.get('etag'),r.headers.get('etag'));
 for(const path of ['/api/v1/content/pages/unknown','/api/v1/content/pages/about/extra'])assert.equal((await f.call(path)).status,404);
 assert.equal((await f.call('/api/v1/content/pages/about',{method:'POST',body:{title:'do not mutate'}})).status,405);assert.equal((await f.call('/api/v1/content/pages/about?sourceUrl=other')).status,400);
});
test('HTTP product detail returns owned public snapshot, no fake stock or private file path; unknown is404',async t=>{
 const f=await fixture(t);const r=await f.call('/api/v1/products/prom-2414/details');assert.equal(r.status,200);const dto=r.data.data;assert.equal(dto.productId,'prom-2414');assert.ok(dto.gallery.length>1);assert.ok(dto.descriptionParagraphs.length>1);assert.equal(dto.capabilities.canRent,true);assert.equal(dto.capabilities.canLease,false);assert.equal(dto.runtimeWritesAvailable,false);assert.equal(dto.stock,undefined);assert.deepEqual(dto.documents,[]);assert.equal(dto.gallery[0].localFile,undefined);assert.ok(dto.gallery.every(i=>i.url.startsWith('https://prom.myfast.space/upload/')));
 assert.equal((await f.call('/api/v1/products/prom-999999999/details')).status,404);assert.equal((await f.call('/api/v1/products/prom-2414/details',{method:'POST',body:{}})).status,405);
 assert.equal((await f.call('/api/v1/products/prom-2414/details?warehouseId=99')).status,400);
});
test('HTTP availability needs session and its selected official location, not URL-supplied warehouse',async t=>{
 const f=await fixture(t);const path='/api/v1/products/prom-2414/availability';assert.equal((await f.call(path)).status,401);const a=await f.session(),b=await f.session();
 const empty=await f.call(path,{token:a});assert.equal(empty.status,409);assert.equal(empty.data.error.code,'SETTLEMENT_REQUIRED');await f.select(a);
 const r=await f.call(path,{token:a});assert.equal(r.status,200);assert.equal(r.data.data.productId,'prom-2414');assert.equal(r.data.data.settlementId,city.id);assert.equal(r.data.data.locationVersion,1);assert.equal(r.data.data.buyerContext,'personal');assert.equal(r.data.data.availability.status,'unknown');assert.equal(r.data.data.availability.totalQuantity,null);assert.equal(r.data.data.availability.reason,'BITRIX_MAPPING_REQUIRED');assert.equal(r.data.data.availability.checkoutEligible,false);assert.equal(r.headers.get('cache-control'),'no-store');
 assert.equal((await f.call(path,{token:b})).status,409);assert.equal((await f.call(path+'?settlementId='+city.id,{token:b})).status,400);assert.equal((await f.call('/api/v1/products/prom-999999999/availability',{token:a})).status,404);
 await f.call('/api/session',{method:'DELETE',token:a});assert.equal((await f.call(path,{token:a})).status,401);
});
test('HTTP buyer context comes from authoritative session even in explicit isolated organization fixtures',async t=>{
 const f=await fixture(t,{allowTestFixtureOperations:true});const token=await f.session();await f.select(token);
 const switched=await f.call('/api/actions',{method:'POST',token,body:{type:'context',context:'organization-demo',expectedContext:'personal'}});assert.equal(switched.status,200);
 const r=await f.call('/api/v1/products/prom-2414/availability',{token});assert.equal(r.status,200);assert.equal(r.data.data.buyerContext,'organization');assert.equal(r.data.data.availability.checkoutEligible,false);
});
test('HTTP content conditional caching supports allowed origins and rejects foreign origins/headers',async t=>{
 const f=await fixture(t);const path='/api/v1/content/pages/about';const origin='http://127.0.0.1:8087';
 const pre=await f.call(path,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'If-None-Match'}});assert.equal(pre.status,204);assert.match(pre.headers.get('access-control-allow-headers'),/if-none-match/);
 const r=await f.call(path,{headers:{Origin:origin}});assert.equal(r.headers.get('access-control-expose-headers'),'ETag');assert.equal(r.headers.get('access-control-allow-origin'),origin);
 assert.equal((await f.call(path,{headers:{Origin:'https://foreign.invalid'}})).status,403);assert.equal((await f.call(path,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Headers':'X-Untrusted'}})).status,403);
});
test('missing/malformed optional detail/content files do not prevent catalog or local session startup',async t=>{
 for(const options of [{malformed:true},{publicContentPath:'/nonexistent/content-snapshot',productDetailsPath:'/nonexistent/product-snapshot'}]){
  const f=await fixture(t,options);assert.equal((await f.call('/api/catalog')).status,200);await f.session();assert.equal((await f.call('/api/v1/products/prom-2414/details')).status,404);assert.equal((await f.call('/api/v1/content/pages/about')).status,404);
 }
});
