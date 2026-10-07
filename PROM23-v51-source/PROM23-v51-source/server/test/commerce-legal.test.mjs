import test from 'node:test';import assert from 'node:assert/strict';
import {validateCommerceLegal,validateCommerceConsents} from '../commerce-legal.mjs';import {legalFixture} from './legal-fixture.mjs';
test('order has a specific seller and version; a consumer offer cannot become a B2B contract',()=>{
 assert.equal(validateCommerceLegal(legalFixture).seller.id,'test-only-seller');
 for(const patch of [{seller:null},{sellerInn:'0000000000'},{hash:''},{version:''},{url:'javascript:alert(1)'}])assert.throws(()=>validateCommerceLegal({...legalFixture,...patch}));
 assert.throws(()=>validateCommerceLegal(legalFixture,true));
 const b2b={...legalFixture,documentType:'individual-contract',contractNumber:'TEST-1',contractStatus:'signed',supplierId:legalFixture.seller.id};
 assert.equal(validateCommerceLegal(b2b,true).contractNumber,'TEST-1');
 for(const patch of [{contractStatus:'draft'},{supplierId:'other'}])assert.throws(()=>validateCommerceLegal({...b2b,...patch},true));
});

const consentChoices=[{name:'agree_consent_order',accepted:true,documentIds:['consent']},{name:'agree_privacy',accepted:true,documentIds:['privacy']},{name:'agree_offer',accepted:true,documentIds:['offer']}];
test('checkout requires independent choices and keeps B2B free of consumer offer',()=>{
 assert.deepEqual(validateCommerceConsents(consentChoices),consentChoices);
 assert.deepEqual(validateCommerceConsents(consentChoices.slice(0,2),true),consentChoices.slice(0,2));
 for(const bad of [[],null,consentChoices.slice(1),[...consentChoices,consentChoices[0]],consentChoices.map(c=>({...c,accepted:false})),consentChoices.map(c=>({...c,documentIds:['wrong']}))])assert.throws(()=>validateCommerceConsents(bad));
 assert.throws(()=>validateCommerceConsents(consentChoices,true));
});
