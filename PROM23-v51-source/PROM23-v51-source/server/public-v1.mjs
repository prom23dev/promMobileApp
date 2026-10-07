import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';

// Branch labels from mobile/src/content/siteContent.ts / the public source snapshot.
// A selected branch is display context, never an assertion of regional price or stock.
export const PUBLIC_CITIES = Object.freeze(['Краснодар', 'Москва', 'Ростов-на-Дону', 'Санкт-Петербург',
  'Симферополь', 'Пермь', 'Пятигорск', 'Грозный', 'Тюмень', 'Луганск', 'Иркутск', 'Тбилиси',
  'Гудаута', 'Ереван', 'Астана', 'Минск']);
export const HOME_TYPES = Object.freeze(['hero', 'categories', 'popular', 'buyers', 'business', 'company', 'production',
  'projects', 'guide', 'services', 'articles', 'personalized', 'discounts', 'manufactured']);
const DEFAULT_ORDER = ['hero', 'categories', 'popular', 'buyers', 'business', 'discounts', 'manufactured', 'personalized', 'company', 'guide', 'projects', 'articles', 'services'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exact = (value, keys) => object(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const timestamp = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
const sourceUrl = value => {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash ? url.href : null;
  } catch { return null; }
};
const freezeConfig = config => Object.freeze({ ...config, blocks: Object.freeze(config.blocks.map(block => Object.freeze(block))) });
export const DEFAULT_HOME = freezeConfig({ schemaVersion: 1, revision: 'home-v20-1',
  blocks: DEFAULT_ORDER.map(type => ({ id: `home-${type}`, type, enabled: true })) });

export function validateHome(value) {
  if (!exact(value, ['schemaVersion', 'revision', 'blocks']) || value.schemaVersion !== 1 ||
      typeof value.revision !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(value.revision) ||
      !Array.isArray(value.blocks) || value.blocks.length < 1 || value.blocks.length > HOME_TYPES.length) return null;
  const seen = new Set();
  for (const block of value.blocks) {
    if (!exact(block, ['id', 'type', 'enabled']) || !HOME_TYPES.includes(block.type) ||
        block.id !== `home-${block.type}` || block.enabled !== true || seen.has(block.id)) return null;
    seen.add(block.id);
  }
  if (value.blocks[0].type !== 'hero') return null;
  return freezeConfig({ schemaVersion: 1, revision: value.revision,
    blocks: value.blocks.map(({ id, type, enabled }) => ({ id, type, enabled })) });
}

function loadHome(path, supplied) {
  try {
    if (supplied !== undefined) return validateHome(supplied) ?? DEFAULT_HOME;
    const raw = readFileSync(path);
    if (raw.length > 32768) return DEFAULT_HOME;
    return validateHome(JSON.parse(raw.toString('utf8'))) ?? DEFAULT_HOME;
  } catch { return DEFAULT_HOME; }
}

export function createPublicV1({ catalog, homePath, home, fail }) {
  const homeConfig = loadHome(homePath, home);
  const cursorKey = randomBytes(32); // In-memory pagination integrity only; never a user credential.
  const revision = `catalog-${digest(catalog.products).slice(0, 24)}`;
  const sign = payload => createHmac('sha256', cursorKey).update(payload).digest('base64url');
  const provenance = Object.freeze({ mode: 'public-snapshot', importedAt: timestamp(catalog.importedAt),
    revision, pricing: 'snapshot', stock: 'unverified', regionalPricing: false, checkoutEligible: false });
  const appConfig = Object.freeze({ schemaVersion: 1, revision: 'app-v51-1', environment: 'preview',
    capabilities: Object.freeze({ publicCatalog: true, homeConfiguration: true, liveCatalog: false, liveWrites: false,
      authentication: false, organizations: false, checkout: false, payments: false, orderWrites: false,
      formWrites: false, consentWrites: false, notificationWrites: false, pushRegistration: false }),
    catalog: Object.freeze({ mode: 'public-snapshot', defaultCity: 'Краснодар', cities: PUBLIC_CITIES,
      contexts: Object.freeze(['personal', 'organization']), defaultPageSize: 20, maxPageSize: 50 }),
  });
  function invalid() { fail(400, 'INVALID_QUERY', 'Проверьте параметры каталога.'); }
  function page(params) {
    const allowed = new Set(['q', 'city', 'context', 'limit', 'cursor']);
    for (const key of params.keys()) if (!allowed.has(key) || params.getAll(key).length !== 1) invalid();
    const rawQuery = params.get('q') ?? '';
    if (rawQuery.length > 120 || /[\u0000-\u001f\u007f]/u.test(rawQuery)) invalid();
    const q = rawQuery.normalize('NFKC').trim().replace(/\s+/gu, ' ');
    if (q.length > 120) invalid();
    const city = params.get('city') ?? 'Краснодар';
    const context = params.get('context') ?? 'personal';
    const rawLimit = params.get('limit') ?? '20';
    if (!PUBLIC_CITIES.includes(city) || !['personal', 'organization'].includes(context) || !/^[1-9][0-9]?$/.test(rawLimit)) invalid();
    const limit = Number(rawLimit);
    if (limit > 50) invalid();
    const scope = digest({ revision, q, city, context, limit });
    let offset = 0;
    const cursor = params.get('cursor');
    if (cursor !== null) {
      if (cursor.length > 512 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(cursor)) invalid();
      const [payload, signature] = cursor.split('.');
      if (!timingSafeEqual(Buffer.from(signature), Buffer.from(sign(payload)))) {
        fail(409, 'CURSOR_EXPIRED', 'Обновите список товаров.');
      }
      let value;
      try { value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { invalid(); }
      if (!exact(value, ['scope', 'offset']) || value.scope !== scope) fail(409, 'CURSOR_CONTEXT_CHANGED', 'Начните загрузку списка заново.');
      if (!Number.isSafeInteger(value.offset) || value.offset <= 0) invalid();
      offset = value.offset;
    }
    const terms = q.toLocaleLowerCase('ru').split(' ').filter(Boolean);
    const matching = catalog.products.filter(product => {
      const text = `${product.name} ${product.sku}`.normalize('NFKC').toLocaleLowerCase('ru');
      return terms.every(term => text.includes(term));
    });
    if (offset > matching.length) invalid();
    const products = matching.slice(offset, offset + limit).map(product => {
      // The sandbox stock field is an artificial basket limit, not publicly verified availability.
      return { id: product.id, sku: product.sku, name: product.name, category: product.category, kind: product.kind,
        sectionIds: product.sectionIds, ...(product.popularRank ? { popularRank: product.popularRank } : {}),
        priceKopecks: product.priceKopecks, unit: product.unit,
        ...(product.oldPriceKopecks ? { oldPriceKopecks: product.oldPriceKopecks } : {}),
        ...(product.discountPercent ? { discountPercent: product.discountPercent } : {}),
        specs: product.specs.map(({ label, value }) => ({ label, value })),
        imageFile: typeof product.imageFile === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,150}\.(?:jpg|jpeg|png|webp)$/i.test(product.imageFile) ? product.imageFile : null,
        sourceUrl: sourceUrl(product.sourceUrl), importedAt: timestamp(product.importedAt),
        availabilityText: typeof product.availabilityText === 'string' ? product.availabilityText : null,
        stock: null, stockSource: 'unverified', priceSource: 'imported-snapshot' };
    });
    const end = offset + products.length;
    let nextCursor = null;
    if (end < matching.length) {
      const payload = Buffer.from(JSON.stringify({ scope, offset: end })).toString('base64url');
      nextCursor = `${payload}.${sign(payload)}`;
    }
    const result = { schemaVersion: 1, query: { q, city, context }, products,
      page: { limit, total: matching.length, nextCursor }, provenance };
    if (Buffer.byteLength(JSON.stringify(result), 'utf8') > 1024 * 1024) {
      fail(503, 'CATALOG_RESPONSE_TOO_LARGE', 'Не удалось загрузить страницу каталога.');
    }
    return result;
  }
  return { appConfig, home: homeConfig, page };
}
