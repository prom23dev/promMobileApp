import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {loadBrandModel,createBrandService} from '../brands/service.mjs';
import {renderBrandHtml,brandSchema} from '../brands/seo.mjs';
const root=resolve(import.meta.dirname,'../..');
const model=loadBrandModel(resolve(root,'data/brands'),[],{sections:[]});
test('owner editorial directory publishes verified originals without fake HL IDs/counts',()=>{
 assert.equal(model.ready,true);assert.equal(model.brands.length,14);
 for(const b of model.brands){assert.match(b.id,/^editorial:/);assert.equal(b.productCount,null);assert.equal(b.productsVerified,false);assert.ok(b.logo);assert.ok(b.shortDescription);}
 assert.deepEqual(model.audit.missingOfficialLogos,[{slug:'geka',status:'MISSING_OFFICIAL_LOGO'}]);
});
test('editorial API and HTML never misrepresent unavailable product data as zero inventory',()=>{
 const service=createBrandService({model,products:[],tree:{sections:[]},fail:(status,code)=>{throw Error(code)}});
 const page=service.page('Лебедянь');assert.equal(page.brand.name,'СТРОЙМАШ');assert.equal(page.total,null);assert.equal(page.productsVerified,false);
 for(const b of model.brands){const html=renderBrandHtml('<html><head></head><body><div id="root"></div></body></html>',{brand:b});assert.ok(html.includes(b.shortDescription));assert.ok(!html.includes('Товары бренда временно отсутствуют'));assert.ok(!html.includes('Все товары · null'));assert.equal(brandSchema(b)['@graph'].filter(x=>x['@type']==='Brand').length,1);}
});
