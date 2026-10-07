// AUTOMATED TEST FIXTURE ONLY. Never copied to data/brands, native assets or a release.
// HL IDs, zero-inventory brands, bindings and non-own logo frames below are synthetic.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {buildBrandModel} from '../../server/brands/model.mjs';
import {createBrandService} from '../../server/brands/service.mjs';
export function brandFixture(root){
 const presentation=JSON.parse(readFileSync(resolve(root,'data/brands/presentation.json'),'utf8')),products=JSON.parse(readFileSync(resolve(root,'data/catalog.json'),'utf8')),tree=JSON.parse(readFileSync(resolve(root,'data/catalog-tree.json'),'utf8'));
 const brands=Object.entries(presentation).map(([slug,b],i)=>({ID:1000+i,UF_NAME:slug==='stroymash'?'Лебедянь':b.canonicalName,UF_XML_ID:slug==='stroymash'?'lebedyan':slug,UF_FILE:1000+i,logoPath:'/upload/uf/test-'+slug+'.svg',UF_SORT:i+1}));
 const assets=Object.fromEntries(brands.map(b=>{const slug=b.UF_NAME==='Лебедянь'?'stroymash':b.UF_XML_ID;return [slug,{verified:true,originalPath:presentation[slug].preferredLogo||b.logoPath,publicPath:'/brand-assets/'+slug+'.svg',sha256:'a'.repeat(64)}];}));
 const source={hlblockId:4,brandProperty:'PROP_368',brands,catalogComplete:true,exportedAt:'2026-09-18T00:00:00Z',productBrands:products.flatMap(p=>{const value=p.specs.find(s=>s.label==='Производитель')?.value;return value?[{productId:p.id,PROP_368:value}]:[];})};
 const model=buildBrandModel({source,presentation,products,tree,assets});
 const fail=(status,code,message)=>{throw Object.assign(new Error(message),{status,code});};
 return {products,tree,model,service:createBrandService({model,products,tree,fail})};
}
