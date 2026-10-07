import test from 'node:test';
import assert from 'node:assert/strict';
import { canDraftBusinessPurchase, productSaleMode } from '../src/domain';
import { products } from '../src/fixtures';
test('business draft purchase does not invent stock or override explicit sale modes',()=>{
 const product={...products[0],stock:null,priceKopecks:10000,saleMode:undefined};
 assert.equal(canDraftBusinessPurchase(product),true);
 assert.equal(productSaleMode(product),'REQUEST_ONLY'); // personal behavior unchanged
 for(const saleMode of ['REQUEST_ONLY','CUSTOM_PRODUCTION'] as const) assert.equal(canDraftBusinessPurchase({...product,saleMode}),false);
 for(const priceKopecks of [0,-1,NaN,Infinity,1.5]) assert.equal(canDraftBusinessPurchase({...product,priceKopecks}),false);
 assert.equal(canDraftBusinessPurchase({...product,stock:0}),false);
});
