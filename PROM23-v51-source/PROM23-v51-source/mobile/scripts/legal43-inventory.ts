import { siteForms } from '../src/forms/siteForms';
import { sitePages } from '../src/content/sitePages';
import type { BlogArticle } from '../src/content/blogContent';
for (const ext of ['.png','.jpg','.jpeg','.webp']) require.extensions[ext] = (module, filename) => { module.exports = filename; };
const { blogArticles }: {blogArticles: BlogArticle[]} = require('../src/content/blogContent');
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const read = (p: string) => JSON.parse(readFileSync(new URL(p, root), 'utf8'));
const routes = new Set<string>(['/','/more','/catalog','/cart','/checkout-preview','/account','/favorites','/compare','/orders','/service','/notifications','/procurement','/quick-order','/claims','/pages/documents']);
for (const p of Object.values(sitePages)) routes.add('/pages/'+p.slug);
for (const p of ['delivery','payment','business','production','contacts']) routes.add('/information/'+p);
for (const p of ['privacy','consent','offer','cookies','recommendations','advertising','distribution']) routes.add('/legal/'+p);
for (const p of ['privacy-policy','personal-data-consent','user-agreement','cookie-policy','recom-tech-info','advertising-consent','personal-data-distribution-consent','offer','oferta','return','warranty','business']) routes.add('/'+p);
for (const p of ['profile','contacts','addresses','organizations','requisites','bank','staff','documents','sessions','security','payment-methods','reviews','waiting-list','returns','about']) routes.add('/workspace/'+p);
routes.add('/brands/');
for (const p of read('mobile/dist/brands/routes.json').slugs) { routes.add('/brands/'+p+'/'); routes.add('/catalog/brand/'+p+'/'); }
routes.add('/pages/advertising'); routes.add('/pages/distribution');
// The route is tested as unavailable, never as a customer's real order.
routes.add('/order/audit-missing');
for (const p of read('data/catalog.json')) routes.add('/product/'+p.id);
for (const p of read('data/catalog-tree.json').sections) routes.add('/catalog/section/'+p.id);
for (const p of blogArticles) routes.add('/blog/'+p.id);
for (const p of ['articles','projects','video']) routes.add('/blog?kind='+p);
for (const p of Object.values(siteForms)) routes.add('/forms/'+p.id);
const routeFiles: string[] = [];
function walk(path: string) { for (const item of readdirSync(new URL(path,root),{withFileTypes:true})) { const f=path+'/'+item.name; if(item.isDirectory())walk(f);else routeFiles.push(f); } }
walk('mobile/app');
writeFileSync(new URL('docs/legal43/inventory.json',root),JSON.stringify({sourcePackage:'docs/legal42/source/00–13.txt',routeFiles,routes:[...routes],forms:Object.values(siteForms),pages:Object.values(sitePages).map(p=>({slug:p.slug,title:p.title})),articles:blogArticles.map(p=>({id:p.id,title:p.title})),scope:'All actual preview entities and shared route templates; authenticated records require external runtime, never fabricated.'},null,2)+'\n');
console.log({routes:routes.size,forms:Object.keys(siteForms).length,articles:blogArticles.length,routeFiles:routeFiles.length});
