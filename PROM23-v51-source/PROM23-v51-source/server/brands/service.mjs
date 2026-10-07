import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildBrandModel, buildEditorialBrands, findBrand, inSection } from './model.mjs';
const valuesOf = (products,label) => [...new Set(products.flatMap(p=>p.specs.filter(s=>s.label===label).map(s=>s.value)))].sort((a,b)=>a.localeCompare(b,'ru'));
export function loadBrandModel(directory, products, tree) {
  // A malformed brand import must not prevent unrelated catalog/account routes from starting.
  try {
    const presentation = JSON.parse(readFileSync(resolve(directory,'presentation.json'),'utf8'));
    let source=null, assets={};
    try { source=JSON.parse(readFileSync(resolve(directory,'hl4.json'),'utf8')); } catch(error) { if(error.code!=='ENOENT')throw error; }
    if(!source){
      let config;try{config=JSON.parse(readFileSync(resolve(directory,'editorial.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
      if(config?.mode==='owner-approved-editorial')return buildEditorialBrands({presentation,assets:JSON.parse(readFileSync(resolve(directory,'assets.json'),'utf8')),config});
    }
    if(source) assets=JSON.parse(readFileSync(resolve(directory,'assets.json'),'utf8'));
    return buildBrandModel({ source, presentation, products, tree, assets });
  } catch {
    return {brands:[],bindings:new Map(),ready:false,audit:{sourceLoaded:false,sourceError:'INVALID_BRAND_SOURCE',brandsFound:0,ufFileLogos:0,ownLogos:0,missingEntities:[],missingOfficialLogos:[],missingProducts:[]}};
  }
}
export function createBrandService({model,products,tree,fail}) {
  function published() { if(!model.ready) fail(503,'BRANDS_SOURCE_REQUIRED','Раздел брендов готовится к публикации.'); }
  return {
    list() { published(); return {brands:model.brands,importedAt:model.importedAt??null}; },
    page(slug, query=new URLSearchParams()) {
      published();
      const brand=findBrand(model.brands,slug);
      if(!brand) fail(404,'BRAND_NOT_FOUND','Бренд не найден.');
      if(brand.productsVerified===false)return {brand,products:[],total:null,allCount:null,offset:0,nextOffset:null,categories:[],technicalLabel:'',technicalValues:[],productsVerified:false};
      const allowed=['category','min','max','technical','technicalLabel','sort','offset','limit'];
      for(const key of query.keys()) if(!allowed.includes(key)||query.getAll(key).length!==1) fail(400,'INVALID_BRAND_FILTER','Неизвестный или повторяющийся фильтр.');
      const get=key=>query.get(key)??'';
      const numeric=key=>{const value=get(key);if(value&&!/^\d{1,9}$/.test(value))fail(400,'INVALID_BRAND_FILTER','Некорректное число.');return value?Number(value):null;};
      const min=numeric('min'),max=numeric('max'),offset=numeric('offset')??0,limit=numeric('limit')??24;
      if(limit<1||limit>48||offset>100000||min!==null&&max!==null&&min>max)fail(400,'INVALID_BRAND_FILTER','Некорректные границы фильтра.');
      const sort=get('sort')||'default';
      if(!['default','price-asc','price-desc'].includes(sort))fail(400,'INVALID_BRAND_FILTER','Неизвестная сортировка.');
      const all=products.filter(p=>model.bindings.get(p.id)===brand.slug);
      const selected=get('category'),section=tree.sections.find(s=>s.id===selected);
      if(selected&&!brand.productCategories.some(s=>s.id===selected))fail(400,'INVALID_BRAND_CATEGORY','Категория не относится к этому бренду.');
      const categoryProducts=selected?all.filter(p=>inSection(p,section)):all;
      const technicalLabel=selected?[...new Set(categoryProducts.flatMap(p=>p.specs.map(s=>s.label)))].find(label=>/^(Материал|Тип|Рабочая высота|Количество ступеней)(\b|,|\s|$)/u.test(label)&&valuesOf(categoryProducts,label).length>1&&valuesOf(categoryProducts,label).length<=12)??'':'';
      const technicalValues=technicalLabel?valuesOf(categoryProducts,technicalLabel):[];
      const technical=get('technical');
      if(technical&&(get('technicalLabel')!==technicalLabel||!technicalValues.includes(technical)))fail(400,'INVALID_BRAND_FILTER','Характеристика не относится к выбранной категории.');
      const matches=p=>(min===null||p.priceKopecks>=min*100)&&(max===null||p.priceKopecks<=max*100)&&(!technical||p.specs.some(s=>s.label===technicalLabel&&s.value===technical));
      const filtered=categoryProducts.filter(matches);
      if(sort!=='default')filtered.sort((a,b)=>(a.priceKopecks-b.priceKopecks)*(sort==='price-desc'?-1:1));
      const categories=brand.productCategories.map(c=>({...c,count:all.filter(p=>matches(p)&&inSection(p,tree.sections.find(s=>s.id===c.id))).length})).filter(c=>c.count>0||c.id===selected);
      return {brand,products:filtered.slice(offset,offset+limit),total:filtered.length,allCount:all.filter(matches).length,offset,nextOffset:offset+limit<filtered.length?offset+limit:null,categories,technicalLabel,technicalValues};
    }
  };
}
