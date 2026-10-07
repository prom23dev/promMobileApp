import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createProductDetailService, normalizePublicProductDetail } from '../integrations/product-detail.mjs';
const raw = JSON.parse(readFileSync(new URL('../../data/product-details.json', import.meta.url)))[0];
const id=raw.productId, time=Date.parse('2026-09-11T13:00:00Z');
const request={settlementId:'915703c4-731d-4ebe-b893-561d99982172',buyerContext:'personal'};
const mapping={...request,contextKey:'test-context-v1',serviceRegionId:'21',expiresAt:'2026-09-11T13:10:00Z',warehouses:[{id:'1',name:'Fixture warehouse A'},{id:'2'}]};
const stock={productId:id,contextKey:mapping.contextKey,measuredAt:'2026-09-11T12:59:00Z',expiresAt:'2026-09-11T13:05:00Z',complete:true,rows:[{warehouseId:'1',quantity:3},{warehouseId:'2',quantity:0}]};
const service=(options={})=>createProductDetailService({products:[{id}],details:[raw],now:()=>time,...options});
test('actual public snapshot has image/description; private files and flags without provenance are excluded',()=>{
 const dto=normalizePublicProductDetail({...raw,capabilityMode:'untrusted',documents:[{id:'private',name:'Invoice',url:'https://prom.myfast.space/upload/private.pdf',access:'requiresOrder'}],gallery:[...raw.gallery,{id:'bad',kind:'image',url:'https://attacker.test/a.jpg',alt:'bad'},{id:'script',kind:'image',url:'https://prom.myfast.space/upload/mutate.php',alt:'bad'}]});
 assert.ok(dto.gallery.length>1);assert.ok(dto.descriptionParagraphs.length);assert.equal(dto.gallery.length,raw.gallery.length);assert.deepEqual(dto.documents,[]);assert.ok(Object.values(dto.capabilities).every(x=>x===false));assert.equal(dto.runtimeWritesAvailable,false);
});
test('snapshot cannot provide inventory, lease approval or a fabricated stock number',async()=>{
 const s=service();assert.equal(s.getPublicDetail(id).runtimeWritesAvailable,false);const result=await s.getAvailability(id,request);
 assert.equal(result.reason,'BITRIX_MAPPING_REQUIRED');assert.equal(result.totalQuantity,null);assert.equal(result.pickupAvailable,null);assert.equal(result.checkoutEligible,false);
 const copy=s.getPublicDetail(id);copy.gallery.length=0;assert.ok(s.getPublicDetail(id).gallery.length>0);
});
test('warehouse IDs from client rejected before calling any provider',async()=>{
 let calls=0;const s=service({resolveCommerceContext:()=>{calls++;}});
 await assert.rejects(s.getAvailability(id,{...request,warehouseIds:['2']}),{code:'PRODUCT_CONTEXT_INVALID'});assert.equal(calls,0);
 await assert.rejects(s.getAvailability('prom-999999',request),{code:'PRODUCT_NOT_FOUND'});
});
test('complete explicit source rows preserve quantity without asserting reservation, pickup, nearest warehouse',async()=>{
 let received;const s=service({resolveCommerceContext:async()=>mapping,readInventory:async(q)=>{received=q;return stock;}});
 const result=await s.getAvailability(id,request);assert.equal(result.totalQuantity,3);assert.equal(result.status,'in-stock');assert.equal(result.availableToPromise,null);assert.equal(result.nearestWarehouse,null);assert.equal(result.checkoutEligible,false);assert.deepEqual(received.warehouseIds,['1','2']);
});
test('missing row is unknown, explicit zero is zero; partial query cannot sum a false total',async()=>{
 for(const variant of [{...stock,rows:[stock.rows[0]]},{...stock,complete:false}]){
  const result=await service({resolveCommerceContext:async()=>mapping,readInventory:async()=>variant}).getAvailability(id,request);assert.equal(result.totalQuantity,null);assert.equal(result.status,'unknown');
 }
 const zero={...stock,rows:stock.rows.map(r=>({...r,quantity:0}))};const result=await service({resolveCommerceContext:async()=>mapping,readInventory:async()=>zero}).getAvailability(id,request);assert.equal(result.totalQuantity,0);assert.equal(result.status,'out-of-stock');
});
test('stale stock, mismatched context/product, foreign/duplicate/negative warehouse data fail closed',async()=>{
 for(const variant of [{...stock,expiresAt:'2026-09-11T12:59:59Z'},{...stock,contextKey:'other'},{...stock,productId:'prom-999'}, {...stock,rows:[{warehouseId:'3',quantity:100}]},{...stock,rows:[stock.rows[0],stock.rows[0]]},{...stock,rows:[{warehouseId:'1',quantity:-1}]}]){
  const result=await service({resolveCommerceContext:async()=>mapping,readInventory:async()=>variant}).getAvailability(id,request);assert.equal(result.totalQuantity,null);assert.equal(result.status,'unknown');assert.deepEqual(result.warehouses,[]);
 }
});
test('stale or cross-buyer/settlement mapping never queries inventory; raw provider errors never escape',async()=>{
 let calls=0;
 for(const variant of [{...mapping,buyerContext:'organization'},{...mapping,settlementId:'other'},{...mapping,expiresAt:'2020-01-01T00:00:00Z'}]){
  const result=await service({resolveCommerceContext:async()=>variant,readInventory:async()=>{calls++;return stock;}}).getAvailability(id,request);assert.equal(result.reason,'COMMERCE_CONTEXT_UNRESOLVED');
 }assert.equal(calls,0);
 const result=await service({resolveCommerceContext:async()=>mapping,readInventory:async()=>{throw new Error('private-token-and-address');}}).getAvailability(id,request);assert.equal(result.reason,'INVENTORY_UNAVAILABLE');assert.ok(!JSON.stringify(result).includes('private-token'));
});
