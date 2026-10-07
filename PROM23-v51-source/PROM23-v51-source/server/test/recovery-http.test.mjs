import {legalFixture} from './legal-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../app.mjs';
import { createRuntimeClient, RuntimeError } from '../integrations/runtime-client.mjs';

// Contract tests only: each app has its own in-memory session database. Runtime results below
// are explicit in-process test doubles; no network call to Bitrix, CRM, a PSP or a real account.
const catalog = { importedAt: '2026-09-11T09:00:00.000Z', products: [1,2].map(n=>({
 id:`r${n}`,sku:`RECOVERY-UNIT-${n}`,name:`Товар контрактной проверки ${n}`,category:'Оборудование',kind:'equipment',
 priceKopecks:10000*n,stock:null,unit:'шт.',specs:[],imageFile:'',sourceUrl:'https://example.invalid/unit',
 availabilityText:'Не подтверждено',priceSource:'isolated-contract-test',stockSource:'unverified',draftQuantityLimit:999,
})) };
const checked = (response,status=200)=>{assert.equal(response.status,status,JSON.stringify(response.body));return response.body.data};
async function fixture(t,call,options={}){
 const calls=[];const runtimeClient=call?{call:async(op,payload,options)=>{calls.push({op,payload,options});return call(op,payload,options)},readiness:()=>({configured:true,verified:false,code:'CONTRACT_TEST_DOUBLE'})}:createRuntimeClient({env:{}});
 const app=createApp({databasePath:':memory:',catalog,runtimeClient,...options});
 await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${app.server.address().port}`;
 t.after(()=>app.close());
 const request=async(path,{token,body,method=body===undefined?'GET':'POST',headers={}}={})=>{const r=await fetch(base+path,{method,headers:{...(token?{Authorization:`Bearer ${token}`} : {}),...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});return{status:r.status,body:await r.json()}};
 const token=checked(await request('/api/sessions',{body:{}}),201).token;
 const action=async(body,expectedContext='personal')=>request('/api/actions',{token,body:{expectedContext,...body}});
 const summary=async()=>checked(await request('/api/v1/cart/summary',{token}));
 const location=async(name='Краснодар',expectedContext='personal')=>{const suggestions=checked(await request('/api/v1/locations/suggest?q='+encodeURIComponent(name))).items;assert.ok(suggestions.length,'Local GAR registry is required by this contract test');const current=checked(await request('/api/v1/location',{token}));return checked(await request('/api/v1/location',{token,body:{settlementId:suggestions[0].id,expectedVersion:current.version,expectedContext}}))};
 const quote=async(extra={},expectedContext='personal')=>{const loc=checked(await request('/api/v1/location',{token}));return request('/api/v1/checkout/quote',{token,body:{expectedContext,expectedLocationVersion:loc.version,delivery:'pickup',payment:'online',pickupId:'contract-location',...extra}})};
 const prepare=async()=>{checked(await action({type:'quantity',productId:'r1',quantity:2}));await location()};
 return{request,token,action,summary,location,quote,prepare,calls};
}
const quoteFor=p=>({quote:{id:'contract_quote_1',contextKey:p.contextKey,legal:legalFixture,expiresAt:new Date(Date.now()+60000).toISOString(),subtotalKopecks:20000,discountKopecks:1000,deliveryKopecks:500,totalKopecks:19500,currency:'RUB',deliveryId:'3',deliveryOptionId:p.pickupId||'single-courier',paymentId:'14',items:p.cart.map(x=>({...x,unitPriceKopecks:10000,lineTotalKopecks:x.quantity*10000}))}});
const approvedOrganization={id:123,name:'Организация контрактного теста',inn:'0000000000'};

test('recovery HTTP default guest is personal, no organization and no confirmed monetary total',async t=>{
 const f=await fixture(t);const state=checked(await f.request('/api/state',{token:f.token}));assert.equal(state.context,'personal');assert.ok(!state.activeOrganization);assert.deepEqual(state.carts.personal,[]);assert.deepEqual(state.carts.business,[]);
 const s=await f.summary();assert.equal(s.totalKopecks,null);assert.equal(s.priceStatus,'snapshot');assert.ok(s.paymentMethods.some(x=>x.id==='online'));assert.ok(!s.paymentMethods.some(x=>x.id==='invoice'));assert.equal((await f.request('/api/v1/cart/summary')).status,401);
});

test('recovery HTTP personal and business drafts retain separate quantities and sessions',async t=>{
 const f=await fixture(t);checked(await f.action({type:'quantity',productId:'r1',quantity:2}));checked(await f.action({type:'context',context:'business'}));checked(await f.action({type:'quantity',productId:'r2',quantity:3},'business'));
 const business=await f.summary();assert.equal(business.subtotalKopecks,60000);assert.deepEqual(business.paymentMethods.map(x=>x.id),['invoice']);
 checked(await f.action({type:'context',context:'personal'},'business'));const state=checked(await f.request('/api/state',{token:f.token}));assert.deepEqual(state.carts.personal,[{productId:'r1',quantity:2}]);assert.deepEqual(state.carts.business,[{productId:'r2',quantity:3}]);
 const other=checked(await f.request('/api/sessions',{body:{}}),201).token;assert.deepEqual(checked(await f.request('/api/state',{token:other})).carts.personal,[]);
});

test('recovery HTTP arbitrary organization and forged identity cannot activate corporate context',async t=>{
 const f=await fixture(t,async()=>{throw new RuntimeError('FORBIDDEN',403)});
 for(const context of ['organization-demo','organization:123']){const r=await f.action({type:'context',context});assert.equal(r.status,403);assert.equal(r.body.error.code,'ORGANIZATION_REQUIRED')}
 assert.equal((await f.request('/api/v1/buyer/select',{token:f.token,body:{organizationId:123,expectedContext:'personal',userId:1}})).status,400);
 const r=await f.request('/api/v1/buyer/select',{token:f.token,body:{organizationId:123,expectedContext:'personal'}});assert.equal(r.status,403);assert.equal(checked(await f.request('/api/state',{token:f.token})).context,'personal');
});

test('recovery HTTP only verified runtime selection activates an organization basket',async t=>{
 const f=await fixture(t,async op=>op==='buyer.organizations'?{organizations:[{...approvedOrganization,privateExtra:'must-not-leak'}]}:{organization:approvedOrganization,cart:[{productId:'r2',quantity:4}]});
 checked(await f.action({type:'quantity',productId:'r1',quantity:2}));const list=checked(await f.request('/api/v1/buyer/organizations',{token:f.token}));assert.deepEqual(Object.keys(list.organizations[0]).sort(),['id','inn','name']);
 const selected=checked(await f.request('/api/v1/buyer/select',{token:f.token,body:{organizationId:123,expectedContext:'personal'}}));assert.equal(selected.context,'organization:123');assert.deepEqual(selected.carts['organization:123'],[{productId:'r2',quantity:4}]);assert.deepEqual(selected.carts.personal,[{productId:'r1',quantity:2}]);assert.equal(selected.activeOrganization.id,123);
});

test('recovery HTTP wrong organization returned by upstream cannot replace current draft',async t=>{
 const f=await fixture(t,async()=>({organization:{...approvedOrganization,id:999},cart:[]}));const r=await f.request('/api/v1/buyer/select',{token:f.token,body:{organizationId:123,expectedContext:'personal'}});assert.equal(r.status,502);assert.equal(r.body.error.code,'ORGANIZATION_RESPONSE_INVALID');assert.equal(checked(await f.request('/api/state',{token:f.token})).context,'personal');
});

test('recovery HTTP late organization response cannot overwrite a newer context choice',async t=>{
 let resolve,entered;const started=new Promise(r=>entered=r);const f=await fixture(t,async()=>{entered();await new Promise(r=>resolve=r);return{organization:approvedOrganization,cart:[]}});
 const pending=f.request('/api/v1/buyer/select',{token:f.token,body:{organizationId:123,expectedContext:'personal'}});await started;checked(await f.action({type:'context',context:'business'}));resolve();const r=await pending;assert.equal(r.status,409);assert.equal(checked(await f.request('/api/state',{token:f.token})).context,'business');
});

test('recovery HTTP no runtime configuration never fabricates coupon, quote or order success',async t=>{
 const f=await fixture(t);await f.prepare();for(const r of [await f.request('/api/v1/cart/coupon',{token:f.token,body:{expectedContext:'personal',code:'UNIT-CODE'}}),await f.quote()]){assert.equal(r.status,503);assert.equal(r.body.error.code,'RUNTIME_NOT_CONFIGURED')}
 const s=await f.summary();assert.equal(s.draft.coupon,'');assert.equal(s.totalKopecks,null);assert.equal(s.priceStatus,'snapshot');const submit=await f.request('/api/v1/checkout/submit',{token:f.token,body:{expectedContext:'personal',quoteId:'unconfirmed',name:'Unit',email:'unit@example.invalid',phone:'0000000000',consents:[]}});assert.equal(submit.status,409);assert.equal(submit.body.error.code,'QUOTE_REQUIRED');
});

test('recovery HTTP expired and inapplicable coupons retain safe prior basket state',async t=>{
 for(const status of ['expired','not-applicable','invalid']){const f=await fixture(t,async()=>({status}));checked(await f.action({type:'quantity',productId:'r1',quantity:2}));const r=await f.request('/api/v1/cart/coupon',{token:f.token,body:{expectedContext:'personal',code:'UNIT-CODE'}});assert.equal(r.status,422);assert.equal(r.body.error.code,'COUPON_'+status.toUpperCase().replace('-','_'));assert.equal((await f.summary()).draft.coupon,'');assert.equal((await f.summary()).totalKopecks,null)}
});

test('recovery HTTP applying or clearing a coupon invalidates a previously confirmed quote',async t=>{
 const f=await fixture(t,async(op,p)=>op==='cart.coupon'?{status:'applied',code:p.code}:quoteFor(p));await f.prepare();assert.equal(checked(await f.quote()).totalKopecks,19500);
 const applied=checked(await f.request('/api/v1/cart/coupon',{token:f.token,body:{expectedContext:'personal',code:'UNIT-CODE'}}));assert.equal(applied.draft.coupon,'UNIT-CODE');assert.equal(applied.totalKopecks,null);assert.equal(checked(await f.quote()).totalKopecks,19500);
 const removed=checked(await f.request('/api/v1/cart/coupon',{token:f.token,body:{expectedContext:'personal',code:''}}));assert.equal(removed.draft.coupon,'');assert.equal(removed.totalKopecks,null);assert.equal(f.calls.filter(c=>c.op==='cart.coupon').length,1);
});

test('recovery HTTP quantity and location changes revoke monetary confirmation and retain carts',async t=>{
 const f=await fixture(t,async(op,p)=>quoteFor(p));await f.prepare();assert.equal(checked(await f.quote()).priceStatus,'confirmed');checked(await f.action({type:'quantity',productId:'r1',quantity:3}));assert.equal((await f.summary()).totalKopecks,null);checked(await f.action({type:'quantity',productId:'r1',quantity:2}));checked(await f.quote());await f.location('Динская');assert.equal((await f.summary()).totalKopecks,null);assert.deepEqual(checked(await f.request('/api/state',{token:f.token})).carts.personal,[{productId:'r1',quantity:2}]);
});

test('recovery HTTP free-text or stale location never becomes selected settlement',async t=>{
 const f=await fixture(t);await f.prepare();const before=checked(await f.request('/api/v1/location',{token:f.token}));const text=await f.request('/api/v1/location',{token:f.token,body:{city:'Любой город',expectedVersion:before.version,expectedContext:'personal'}});assert.equal(text.status,400);
 const stale=await f.request('/api/v1/location',{token:f.token,body:{settlementId:before.settlement.id,expectedVersion:before.version-1,expectedContext:'personal'}});assert.equal(stale.status,409);assert.deepEqual(checked(await f.request('/api/v1/location',{token:f.token})),before);
});

test('recovery HTTP buyer payment restrictions and unassigned business cannot create a quote',async t=>{
 const f=await fixture(t,async()=>{throw new Error('upstream must not be called')});await f.prepare();assert.equal((await f.quote({payment:'invoice'})).body.error.code,'INVALID_PAYMENT');checked(await f.action({type:'context',context:'business'}));checked(await f.action({type:'quantity',productId:'r1',quantity:1},'business'));assert.equal((await f.quote({payment:'online'},'business')).body.error.code,'INVALID_PAYMENT');const r=await f.quote({payment:'invoice'},'business');assert.equal(r.status,409);assert.equal(r.body.error.code,'ORGANIZATION_REQUIRED');assert.equal(f.calls.length,0);
});

test('recovery HTTP malformed monetary response and stale context are rejected',async t=>{
 const f=await fixture(t,async(op,p)=>{const value=quoteFor(p);value.quote.totalKopecks++;return value});await f.prepare();const r=await f.quote();assert.equal(r.status,502);assert.equal(r.body.error.code,'QUOTE_INVALID');assert.equal((await f.summary()).totalKopecks,null);const stale=await f.request('/api/v1/cart/coupon',{token:f.token,body:{expectedContext:'business',code:'UNIT'}});assert.equal(stale.status,409);assert.equal(stale.body.error.code,'CONTEXT_CHANGED');
});

test('recovery HTTP late quote cannot revive a quote after location changes',async t=>{
 let resolve,entered;const started=new Promise(r=>entered=r);const f=await fixture(t,async(op,p)=>{entered();await new Promise(r=>resolve=r);return quoteFor(p)});await f.prepare();const pending=f.quote();await started;await f.location('Динская');resolve();const r=await pending;assert.equal(r.status,409);assert.equal(r.body.error.code,'QUOTE_STALE');assert.equal((await f.summary()).totalKopecks,null);
});

test('recovery HTTP quote with wrong product or quantity cannot confirm a different basket',async t=>{
 for(const items of [[{productId:'r2',quantity:2,unitPriceKopecks:10000,lineTotalKopecks:20000}],[{productId:'r1',quantity:1,unitPriceKopecks:20000,lineTotalKopecks:20000}],[]]){
  const f=await fixture(t,async(op,p)=>{const value=quoteFor(p);value.quote.items=items;return value});await f.prepare();const r=await f.quote();assert.equal(r.status,502,'An upstream quote for another set of lines must not become a confirmed basket');assert.equal(r.body.error.code,'QUOTE_INVALID');assert.equal((await f.summary()).totalKopecks,null);
 }
});


test('recovery HTTP session deletion removes stored checkout address and coupon drafts',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'prom23-recovery-cleanup-'));const databasePath=join(dir,'sessions.sqlite');
 const f=await fixture(t,undefined,{databasePath});t.after(()=>rmSync(dir,{recursive:true,force:true}));await f.prepare();
 const result=await f.quote({delivery:'courier',address:'UNIT-PRIVATE-ADDRESS'});assert.equal(result.status,503);
 const db=new DatabaseSync(databasePath);t.after(()=>db.close());assert.equal(db.prepare('SELECT count(*) AS n FROM commerce_drafts').get().n,1);
 checked(await f.request('/api/session',{token:f.token,method:'DELETE'}));assert.equal(db.prepare('SELECT count(*) AS n FROM commerce_drafts').get().n,0,'Deleting local personal data must cascade to checkout drafts');
 assert.equal((await f.request('/api/state',{token:f.token})).status,401);
});

test('recovery HTTP order submission rejects missing and forged consent choices',async t=>{
 const required=[{name:'agree_policy_order',accepted:true,documentIds:['privacy']},{name:'agree_consent_order',accepted:true,documentIds:['consent']}];
 for(const consents of [null,[{name:'arbitrary',accepted:true,documentIds:['anything']}],[required[0]],[required[0],required[0]],required.map(c=>({...c,documentIds:['other-document']})),required.map(c=>({...c,accepted:false}))]){
  const f=await fixture(t,async(op,p)=>op==='cart.quote'?quoteFor(p):{status:'accepted',reference:'CONTRACT-ONLY-REFERENCE'});await f.prepare();const summary=checked(await f.quote());
  const response=await f.request('/api/v1/checkout/submit',{token:f.token,headers:{'Idempotency-Key':'contract_order_negative_001'},body:{expectedContext:'personal',quoteId:summary.draft.quote.id,name:'Contract',email:'unit@example.invalid',phone:'0000000000',consents}});
  assert.equal(response.status,422,'Missing, duplicated or forged consent names/documents must not reach order creation');assert.equal(response.body.error.code,'CONSENT_REQUIRED');assert.equal(f.calls.filter(c=>c.op==='order.submit').length,0);
 }
});

test('recovery HTTP quote cannot silently substitute the selected payment system',async t=>{
 const f=await fixture(t,async(op,p)=>{const value=quoteFor(p);value.quote.paymentId='16';return value});await f.prepare();
 const response=await f.quote();assert.equal(response.status,502,'personal online selection must never confirm a corporate invoice quote');assert.equal((await f.summary()).totalKopecks,null);
});

test('recovery HTTP expired quote never becomes confirmed and never reaches submit',async t=>{
 const f=await fixture(t,async(op,p)=>{const value=quoteFor(p);value.quote.expiresAt=new Date(Date.now()-1000).toISOString();return value});await f.prepare();
 assert.equal((await f.quote()).status,502);assert.equal((await f.summary()).totalKopecks,null);assert.equal(f.calls.filter(c=>c.op==='order.submit').length,0);
});

test('recovery HTTP payment session rejects unsafe URL and expired provider result',async t=>{
 for(const result of [{url:'http://pay.yandex.ru/x',expiresAt:new Date(Date.now()+60000).toISOString()},{url:'https://pay.yandex.ru.evil.invalid/x',expiresAt:new Date(Date.now()+60000).toISOString()},{url:'https://pay.yandex.ru/x',expiresAt:new Date(Date.now()-1000).toISOString()},{url:'https://user@pay.yandex.ru/x',expiresAt:new Date(Date.now()+60000).toISOString()}]){
  const f=await fixture(t,async()=>result);const r=await f.request('/api/v1/payment/session',{token:f.token,headers:{'Idempotency-Key':'contract_payment_negative_001'},body:{expectedContext:'personal',reference:'999'}});assert.equal(r.status,502);assert.equal(r.body.error.code,'PAYMENT_URL_INVALID');
 }
});


test('recovery HTTP quote cannot replace the selected carrier or pickup option',async t=>{
 const f=await fixture(t,async(op,p)=>{const value=quoteFor(p);value.quote.deliveryOptionId='different-contract-point';return value});await f.prepare();
 const r=await f.quote();assert.equal(r.status,502,'upstream must echo the exact selected opaque delivery option');assert.equal((await f.summary()).totalKopecks,null);
});

test('payment status keeps only bound order/payment status, rejects forged and mismatched replies',async t=>{
 const response={status:'CAPTURED',sourceOrderId:'99',sourcePaymentId:'10',privateProviderBody:'not for client'};
 const f=await fixture(t,async(op,p)=>{assert.equal(op,'payment.status');assert.equal(p.reference,'99');return response});
 const body={expectedContext:'personal',reference:'99'};const r=await f.request('/api/v1/payment/status',{token:f.token,body});assert.deepEqual(checked(r),{status:'CAPTURED',sourceOrderId:'99',sourcePaymentId:'10'});
 assert.equal((await f.request('/api/v1/payment/status',{token:f.token,body:{...body,userId:7}})).status,400);
 for(const invalid of [{...response,sourceOrderId:'100'},{...response,status:'paid-from-redirect'},{...response,sourcePaymentId:'../10'}]){
  const g=await fixture(t,async()=>invalid);assert.equal((await g.request('/api/v1/payment/status',{token:g.token,body})).status,502);
 }
});
test('late payment status does not cross buyer context',async t=>{
 let reached,finish;const started=new Promise(r=>reached=r),pending=new Promise(r=>finish=r);
 const f=await fixture(t,async()=>{reached();await pending;return{status:'PENDING',sourceOrderId:'99',sourcePaymentId:'10'}});
 const running=f.request('/api/v1/payment/status',{token:f.token,body:{expectedContext:'personal',reference:'99'}});await started;checked(await f.action({type:'context',context:'business'}));finish();assert.equal((await running).status,409);
});

test('business draft transfers once into verified organization; personal and saved organization carts survive',async t=>{
 const f=await fixture(t,async()=>({organization:approvedOrganization,cart:[{productId:'r1',quantity:4}]}));
 checked(await f.action({type:'quantity',productId:'r2',quantity:7}));
 checked(await f.action({type:'context',context:'business'}));
 checked(await f.action({type:'quantity',productId:'r1',quantity:2},'business'));
 checked(await f.action({type:'quantity',productId:'r2',quantity:3},'business'));
 const select=()=>f.request('/api/v1/buyer/select',{token:f.token,body:{organizationId:123,expectedContext:'business',transferDraft:true}});
 const state=checked(await select());
 assert.deepEqual(state.carts['organization:123'],[{productId:'r1',quantity:6},{productId:'r2',quantity:3}]);
 assert.deepEqual(state.carts.personal,[{productId:'r2',quantity:7}]);assert.deepEqual(state.carts.business,[]);
 checked(await f.action({type:'quantity',productId:'r1',quantity:5},'organization:123'));
 checked(await f.action({type:'context',context:'business'},'organization:123'));
 assert.deepEqual(checked(await select()).carts['organization:123'].sort((a,b)=>a.productId.localeCompare(b.productId)),[{productId:'r1',quantity:5},{productId:'r2',quantity:3}]);
});
test('failed organization verification and transfer limits leave business draft intact',async t=>{
 const f=await fixture(t,async()=>({organization:approvedOrganization,cart:[{productId:'r1',quantity:999}]}));
 checked(await f.action({type:'context',context:'business'}));checked(await f.action({type:'quantity',productId:'r1',quantity:1},'business'));
 const result=await f.request('/api/v1/buyer/select',{token:f.token,body:{organizationId:123,expectedContext:'business',transferDraft:true}});
 assert.equal(result.status,409);const state=checked(await f.request('/api/state',{token:f.token}));assert.equal(state.context,'business');assert.deepEqual(state.carts.business,[{productId:'r1',quantity:1}]);
});
test('business draft transfer rejects concurrent cart change during organization verification',async t=>{
 let release;let notify;const started=new Promise(r=>notify=r);
 const f=await fixture(t,async()=>{notify();await new Promise(r=>release=r);return {organization:approvedOrganization,cart:[]}});
 checked(await f.action({type:'context',context:'business'}));checked(await f.action({type:'quantity',productId:'r1',quantity:1},'business'));
 const pending=f.request('/api/v1/buyer/select',{token:f.token,body:{organizationId:123,expectedContext:'business',transferDraft:true}});
 await started;checked(await f.action({type:'quantity',productId:'r1',quantity:2},'business'));release();
 assert.equal((await pending).status,409);const state=checked(await f.request('/api/state',{token:f.token}));assert.equal(state.context,'business');assert.equal(state.carts.business[0].quantity,2);
});
