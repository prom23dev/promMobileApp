import test from 'node:test';
import assert from 'node:assert/strict';
import { validBuyerContext, organizationIdFor, ensureBuyerState, readOrganizations, mergeBusinessDraft } from '../buyer-context.mjs';
test('business intent has no fabricated organization and keeps separate carts', () => {
 const state = ensureBuyerState({context:'personal',carts:{personal:[{productId:'p1',quantity:2}]}});
 state.carts.business.push({productId:'p2',quantity:1});
 assert.equal(organizationIdFor('business'),null);assert.equal(state.carts.personal.length,1);assert.equal(state.carts.personal[0].productId,'p1');
});
test('organization context requires a positive bounded ID',()=>{
 for(const id of ['organization:0','organization:-1','organization:1e3','organization:1/x','organization:9999999999999'])assert.equal(validBuyerContext(id),false);
 assert.equal(organizationIdFor('organization:12'),12);
});
test('only server-runtime organization records become selectors',async()=>{
 let sent;
 const data=await readOrganizations({call:async(op,payload)=>{sent={op,payload};return {organizations:[{id:12,name:'Company',inn:'1234567890',private:'omit'}]}}},'server-session-key');
 assert.deepEqual(sent,{op:'buyer.organizations',payload:{sessionKey:'server-session-key'}});assert.equal(data.organizations[0].private,undefined);
 await assert.rejects(readOrganizations({call:async()=>({organizations:[{id:'12',name:'Fake'}]})},'session'));
});

test('draft merge preserves selection and validates quantity without mutating input',()=>{
 const products=new Map([['a',{stock:null,draftQuantityLimit:10}],['b',{stock:0}]]);
 const base=[{productId:'a',quantity:2,selected:false}];
 assert.deepEqual(mergeBusinessDraft(base,[{productId:'a',quantity:3,selected:false}],products),[{productId:'a',quantity:5,selected:false}]);
 assert.deepEqual(mergeBusinessDraft(base,[{productId:'a',quantity:1}],products),[{productId:'a',quantity:3}]);
 assert.equal(base[0].quantity,2);assert.equal(base[0].selected,false);
 for(const line of [{productId:'a',quantity:11},{productId:'a',quantity:1.5},{productId:'a',quantity:0},{productId:'missing',quantity:1},{productId:'b',quantity:1}])assert.throws(()=>mergeBusinessDraft(base,[line],products));
});
