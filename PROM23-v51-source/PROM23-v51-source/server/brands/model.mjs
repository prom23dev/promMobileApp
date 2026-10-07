// Owner-approved editorial directory can be published independently of the optional HL4 integration.
export const normalizeName = value => String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[«»"']/g, '').replace(/\s+/g, ' ');
const safeSlug = value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
export function buildBrandModel({ source, presentation, products, tree, assets = {} }) {
  const audit = { sourceLoaded: !!source, brandsFound: 0, ufFileLogos: 0, ownLogos: 0, missingOfficialLogos: [], missingEntities: [], missingProducts: [], missingProductSections: [], unknownProductBrands: [] };
  if (!source) return { brands: [], bindings: new Map(), audit, ready: false };
  if (source.hlblockId !== 4 || source.brandProperty !== 'PROP_368' || !Array.isArray(source.brands) || !Array.isArray(source.productBrands)) throw Error('Invalid HL4 brand export');
  const aliases = new Map();
  for (const [slug, copy] of Object.entries(presentation)) {
    if (!safeSlug(slug)) throw Error('Invalid brand slug');
    for (const name of [slug, copy.canonicalName, ...copy.alternateNames]) aliases.set(normalizeName(name), slug);
  }
  const brands = [], seen = new Set(), sourceLookup = new Map();
  for (const raw of source.brands) {
    if (!raw || raw.UF_ACTIVE === false || raw.UF_ACTIVE === 'N') continue;
    const slug = aliases.get(normalizeName(raw.UF_XML_ID)) ?? aliases.get(normalizeName(raw.UF_NAME));
    if (!slug) continue; // Unapproved/demo brands are not published by this sprint.
    if (!String(raw.ID ?? '').match(/^[1-9][0-9]*$/) || !String(raw.UF_XML_ID ?? '').trim() || seen.has(slug)) throw Error('Missing or duplicate HL brand identity');
    seen.add(slug); const copy = presentation[slug];
    // A verified UF_FILE asset is preferred, except the owner's own-brand SVG rule.
    const asset = assets[slug];
    const expectedPath = copy.preferredLogo || raw.logoPath || (!Number(raw.UF_FILE) && asset?.officialSourceReviewed === true && /^https:\/\//.test(asset?.officialWebsite ?? '') ? asset.originalPath : null);
    const logoValid = asset && asset.verified === true && asset.originalPath === expectedPath && /^\/brand-assets\/[a-z0-9-]+\.(svg|png|jpg|jpeg|webp)$/.test(asset.publicPath) && /^[a-f0-9]{64}$/.test(asset.sha256);
    if (!logoValid) audit.missingOfficialLogos.push({ slug, status: 'MISSING_OFFICIAL_LOGO' });
    else if (copy.isOwnBrand) audit.ownLogos++;
    else if (Number(raw.UF_FILE) > 0) audit.ufFileLogos++;
    const officialWebsite = asset?.officialSourceReviewed === true && asset?.officialWebsite && /^https:\/\//.test(asset.officialWebsite) ? asset.officialWebsite : undefined;
    const brand = {
      id: String(raw.ID), name: copy.canonicalName, canonicalName: copy.canonicalName,
      alternateNames: [...new Set([...copy.alternateNames, raw.UF_NAME].filter(n => n !== copy.canonicalName))],
      xmlId: String(raw.UF_XML_ID), slug, logo: logoValid ? asset.publicPath : null,
      logoSource: logoValid ? (copy.isOwnBrand ? 'local-own-svg' : Number(raw.UF_FILE) > 0 ? 'UF_FILE' : 'official') : null,
      shortDescription: copy.shortDescription, country: copy.country, foundedYear: copy.foundedYear,
      trademarkYear: copy.trademarkYear, specialization: copy.specialization,
      isOwnBrand: !!copy.isOwnBrand, isActive: true, sort: raw.UF_SORT != null && Number.isFinite(Number(raw.UF_SORT)) ? Number(raw.UF_SORT) : 500,
      detailUrl: `/brands/${slug}/`, catalogUrl: `/catalog/brand/${encodeURIComponent(raw.UF_XML_ID)}/`,
      officialWebsite, sameAs: officialWebsite ? [officialWebsite] : [],
      seoTitle: `${copy.canonicalName} — ${copy.specialization[0].toLocaleLowerCase('ru')} | Промышленник`,
      seoDescription: copy.shortDescription, productCount: 0, productCategories: [],
    };
    brands.push(brand);
    for (const key of [raw.ID, raw.UF_XML_ID, raw.UF_NAME, slug, copy.canonicalName, ...copy.alternateNames]) sourceLookup.set(normalizeName(key), slug);
  }
  audit.brandsFound = brands.length;
  audit.missingEntities = Object.keys(presentation).filter(slug => !seen.has(slug));
  const productIds = new Set(products.map(p => p.id)), bindings = new Map();
  for (const raw of source.productBrands) {
    const productId = String(raw.productId || `prom-${raw.ID}`);
    const slug = sourceLookup.get(normalizeName(raw.PROP_368));
    if (!slug) { if (raw.PROP_368) audit.unknownProductBrands.push(productId); continue; }
    if (!productIds.has(productId)) { audit.missingProducts.push(productId); continue; }
    if (bindings.has(productId) && bindings.get(productId) !== slug) throw Error('Conflicting product brand');
    bindings.set(productId, slug);
  }
  audit.missingProductSections = products.filter(p => bindings.has(p.id) && !(tree?.sections ?? []).some(section => inSection(p, section))).map(p => p.id);
  for (const brand of brands) {
    const matched = products.filter(p => bindings.get(p.id) === brand.slug);
    brand.productCount = matched.length;
    brand.productCategories = aggregateCategories(matched, tree);
  }
  brands.sort((a,b) => a.sort-b.sort || a.name.localeCompare(b.name, 'ru'));
  const ready = source.catalogComplete === true && !audit.missingEntities.length && !audit.missingOfficialLogos.length && !audit.missingProducts.length && !audit.missingProductSections.length;
  return { brands, bindings, audit, ready, importedAt: source.exportedAt ?? null };
}
export function inSection(product, section) {
  return !!section && (product.sectionIds?.includes(section.id) || section.productIds?.includes(product.id));
}
export function aggregateCategories(products, tree) {
  const sections = tree?.sections ?? [], byId = new Map(sections.map(s => [s.id,s]));
  const withCount = ids => ids.map(id => byId.get(id)).filter(Boolean).map(s => ({ id:s.id, name:s.name, count:products.filter(p => inSection(p,s)).length })).filter(s => s.count > 0);
  let values = withCount(tree?.rootIds ?? []), visited = new Set();
  // Descend a single common root; split only into actual populated categories.
  while (values.length === 1 && !visited.has(values[0].id)) {
    visited.add(values[0].id);
    const children = withCount(byId.get(values[0].id)?.children ?? []);
    if (!children.length || products.filter(p => inSection(p, byId.get(values[0].id))).some(p => !children.some(c => inSection(p, byId.get(c.id))))) break;
    values = children;
  }
  return values;
}
export function findBrand(brands, value) {
  const name = normalizeName(value);
  return brands.find(b => [b.slug,b.xmlId,b.name,...b.alternateNames].some(alias => normalizeName(alias) === name));
}

// Editorial identities are slugs, never fabricated Highload Block IDs.
export function buildEditorialBrands({presentation,assets,config}) {
 const audit={sourceLoaded:true,sourceMode:'owner-approved-editorial',brandsFound:0,ufFileLogos:0,ownLogos:0,officialLogos:0,missingOfficialLogos:[],missingEntities:[],missingProducts:[]};
 const brands=[];
 for(const [slug,copy] of Object.entries(presentation)) {
  const asset=assets[slug];
  if(!safeSlug(slug))throw Error('Invalid editorial slug');
  if(!asset?.verified || !/^\/brand-assets\/[a-z0-9-]+\.(svg|png|jpg|jpeg|webp)$/.test(asset.publicPath)|| !/^[a-f0-9]{64}$/.test(asset.sha256)) {
   audit.missingOfficialLogos.push({slug,status:'MISSING_OFFICIAL_LOGO'});continue;
  }
  if(copy.isOwnBrand)audit.ownLogos++;else audit.officialLogos++;
  const officialWebsite=asset.officialWebsite;
  brands.push({id:'editorial:'+slug,xmlId:slug,slug,name:copy.canonicalName,canonicalName:copy.canonicalName,alternateNames:copy.alternateNames,logo:asset.publicPath,logoSource:copy.isOwnBrand?'local-own-svg':'official',shortDescription:copy.shortDescription,country:copy.country,foundedYear:copy.foundedYear,trademarkYear:copy.trademarkYear,specialization:copy.specialization,isOwnBrand:!!copy.isOwnBrand,isActive:true,sort:brands.length,detailUrl:`/brands/${slug}/`,catalogUrl:`/catalog/brand/${slug}/`,officialWebsite,sameAs:officialWebsite?[officialWebsite]:[],seoTitle:`${copy.canonicalName} — ${copy.specialization[0].toLocaleLowerCase('ru')} | Промышленник`,seoDescription:copy.shortDescription,productCount:null,productCategories:[],productsVerified:false});
 }
 audit.brandsFound=brands.length;
 return {brands,bindings:new Map(),audit,ready:brands.length>0&&audit.missingOfficialLogos.every(b=>config.pendingLogos?.includes(b.slug)),importedAt:config.updatedAt};
}
