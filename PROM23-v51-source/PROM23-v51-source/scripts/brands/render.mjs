import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadCatalog,loadCatalogTree} from '../../server/app.mjs';
import {loadBrandModel} from '../../server/brands/service.mjs';
import {renderBrandHtml} from '../../server/brands/seo.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..'),dist=resolve(root,'mobile/dist');
const products=loadCatalog(resolve(root,'data/catalog.json')).products;
const tree=loadCatalogTree(resolve(root,'data/catalog-tree.json'));
const model=loadBrandModel(resolve(root,'data/brands'),products,tree);
if(!model.ready){console.log('Brands HTML not published: authoritative HL4/catalog/logo import is incomplete.');process.exit(0);}
const shell=readFileSync(resolve(dist,'index.html'),'utf8');
const write=(path,options)=>{const dir=resolve(dist,path);mkdirSync(dir,{recursive:true});writeFileSync(resolve(dir,'index.html'),renderBrandHtml(shell,options));};
write('brands',{brands:model.brands});
for(const brand of model.brands)write('brands/'+brand.slug,{brand,products:products.filter(p=>model.bindings.get(p.id)===brand.slug).slice(0,24)});
const aliases=Object.fromEntries(model.brands.flatMap(b=>[b.xmlId,...b.alternateNames].filter(n=>!/[\/?#]/.test(n)&&n.length<=100&&n!==b.slug).map(n=>[n,b.slug])));
writeFileSync(resolve(dist,'brands/routes.json'),JSON.stringify({slugs:model.brands.map(b=>b.slug),aliases}));
console.log('Brands: generated '+model.brands.length+' canonical detail pages and directory.');
