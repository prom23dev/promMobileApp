import { loadBrandModel, createBrandService } from './brands/service.mjs';
import { createProcurementService } from './integrations/procurement-service.mjs';
import { createFormsService } from './integrations/forms-service.mjs';
import { createRuntimeClient, RuntimeError } from './integrations/runtime-client.mjs';
import { createCommerceRecovery } from './commerce-recovery.mjs';
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validBuyerContext, ensureBuyerState, organizationIdFor, verifiedOrganization, readOrganizations, mergeBusinessDraft } from './buyer-context.mjs';
import { createNotificationStore, defaultPreferences } from './notifications.mjs';
import { createPublicContentService } from './integrations/public-content.mjs';
import { createProductDetailService } from './integrations/product-detail.mjs';
import { createPublicV1 } from './public-v1.mjs';
import { createGarProvider } from './location/provider.mjs';
import { createLocationService, LOCATION_METHODS, locationDetailId, locationSuggestions } from './location/service.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONTEXTS = ['personal', 'business', 'organization-demo'];
const MODE = 'local-sandbox';
const MAX_BODY = 32 * 1024;
const MAX_COMPARISON = 6;
const DEFAULT_LIMITS = {
  maxDatabasePages: 8192,
  maxSessions: 500,
  maxOrdersPerSession: 100,
  maxQuotesPerSession: 200,
  maxAppealsPerSession: 100,
};
const ORIGINS = new Set([
  'http://127.0.0.1:8087', 'http://localhost:8087',
  'http://127.0.0.1:8081', 'http://localhost:8081',
]);
const hash = value => createHash('sha256').update(value).digest('hex');
const freshState = () => ({
  context: 'personal', carts: { personal: [], business: [], 'organization-demo': [] },
  favorites: [], comparison: [], city: '', viewed: { personal: [], business: [], 'organization-demo': [] }, searches: { personal: [], business: [], 'organization-demo': [] },
});
const iso = milliseconds => new Date(milliseconds).toISOString();

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const fail = (status, code, message) => { throw new ApiError(status, code, message); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function fields(value, required, optional = []) {
  if (!object(value) || required.some(key => !Object.hasOwn(value, key)) ||
      Object.keys(value).some(key => !required.includes(key) && !optional.includes(key))) {
    fail(400, 'INVALID_BODY', 'Проверьте поля запроса.');
  }
}
function textField(value, label, maximum = 120, minimum = 1) {
  if (typeof value !== 'string' || value.trim().length < minimum || value.length > maximum ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value)) {
    fail(400, 'INVALID_FIELD', `Некорректное поле: ${label}.`);
  }
  return value.trim();
}
function contextField(value) {
  if (!validBuyerContext(value)) fail(400, 'INVALID_CONTEXT', 'Неизвестный режим покупок.');
  return value;
}
function safeSum(value) {
  if (!Number.isSafeInteger(value) || value < 0) fail(409, 'INVALID_TOTAL', 'Сумма требует пересчёта.');
  return value;
}
const cartHash = (context, cart) => hash(JSON.stringify({ context, cart: [...cart].sort((a, b) => a.productId.localeCompare(b.productId)) }));

function discountProjection(price, oldPrice) {
  if (!Number.isSafeInteger(oldPrice) || oldPrice <= price) return {};
  const rounded = Number(((BigInt(oldPrice) - BigInt(price)) * 200n + BigInt(oldPrice)) / (2n * BigInt(oldPrice)));
  return rounded >= 1 && rounded <= 99 ? { discountPercent: rounded } : {};
}

export function loadCatalog(catalogPath, supplied) {
  let source = supplied;
  if (source === undefined) {
    try { source = JSON.parse(readFileSync(catalogPath, 'utf8')); }
    catch (error) {
      return { products: [], categories: [], importedAt: null, mode: MODE,
        seedStatus: error.code === 'ENOENT' ? 'missing' : 'invalid' };
    }
  }
  try {
    const input = Array.isArray(source) ? source : source.products;
    if (!Array.isArray(input)) throw new Error('invalid catalog');
    const ids = new Set();
    const importedAt = source.importedAt ?? input[0]?.importedAt ?? null;
    const products = input.map(item => {
      if (!object(item) || typeof item.id !== 'string' || !item.id.length || ids.has(item.id) ||
          typeof item.sku !== 'string' || typeof item.name !== 'string' || typeof item.category !== 'string' ||
          !['scaffold', 'tower', 'ladder', 'mixer', 'tool', 'equipment'].includes(item.kind) ||
          !Number.isSafeInteger(item.priceKopecks) || item.priceKopecks < 0 ||
          (item.stock !== null && (!Number.isSafeInteger(item.stock) || item.stock < 0 || item.stock > 999)) ||
          typeof item.unit !== 'string' || !Array.isArray(item.specs) ||
          (item.sectionIds !== undefined && (!Array.isArray(item.sectionIds) || item.sectionIds.some(id => typeof id !== 'string' || !id.length))) ||
          (item.popularRank !== undefined && (!Number.isSafeInteger(item.popularRank) || item.popularRank < 1)) ||
          item.specs.some(spec => !object(spec) || typeof spec.label !== 'string' || typeof spec.value !== 'string')) {
        throw new Error('invalid product');
      }
      ids.add(item.id);
      return {
        id: item.id, sku: item.sku, name: item.name, category: item.category, kind: item.kind,
        sectionIds: [...new Set(item.sectionIds ?? [])],
        ...(item.popularRank ? { popularRank: item.popularRank } : {}),
        ...(Number.isSafeInteger(item.oldPriceKopecks) && item.oldPriceKopecks > item.priceKopecks ? { oldPriceKopecks: item.oldPriceKopecks } : {}),
        priceKopecks: item.priceKopecks, stock: item.stockSource === 'local-test-limit' ? null : item.stock, draftQuantityLimit: Number.isSafeInteger(item.draftQuantityLimit) && item.draftQuantityLimit >= 1 && item.draftQuantityLimit <= 999 ? item.draftQuantityLimit : 999,
        ...discountProjection(item.priceKopecks, item.oldPriceKopecks), unit: item.unit, specs: item.specs,
        imageFile: item.imageFile ?? null, sourceUrl: item.sourceUrl ?? null,
        importedAt: item.importedAt ?? importedAt,
        availabilityText: item.availabilityText ?? 'Наличие уточняется при заказе',
        priceSource: item.priceSource ?? 'imported-snapshot', stockSource: item.stockSource ?? 'local-test-limit',
      };
    });
    return { products, categories: [...new Set(products.map(item => item.category))], importedAt, mode: MODE, seedStatus: 'loaded' };
  } catch {
    return { products: [], categories: [], importedAt: null, mode: MODE, seedStatus: 'invalid' };
  }
}

export function loadCatalogTree(path, supplied) {
  const empty = { sourceUrl: null, importedAt: null, sections: [], rootIds: [] };
  try {
    const value = supplied ?? JSON.parse(readFileSync(path, 'utf8'));
    if (!object(value) || typeof value.sourceUrl !== 'string' || typeof value.importedAt !== 'string' ||
        !Array.isArray(value.sections) || !Array.isArray(value.rootIds)) return empty;
    const ids = new Set();
    for (const section of value.sections) {
      if (!object(section) || typeof section.id !== 'string' || !section.id || ids.has(section.id) ||
          typeof section.name !== 'string' || typeof section.url !== 'string' ||
          (section.parentId !== null && typeof section.parentId !== 'string') ||
          !Array.isArray(section.children) || !Array.isArray(section.productIds) ||
          [...section.children, ...section.productIds].some(id => typeof id !== 'string' || !id) ||
          new Set(section.children).size !== section.children.length) return empty;
      ids.add(section.id);
    }
    const byId = new Map(value.sections.map(section => [section.id, section]));
    if (new Set(value.rootIds).size !== value.rootIds.length || value.rootIds.some(id => typeof id !== 'string' || !ids.has(id) || byId.get(id).parentId !== null)) return empty;
    for (const section of value.sections) {
      if (section.parentId === null ? !value.rootIds.includes(section.id) : !ids.has(section.parentId) || !byId.get(section.parentId).children.includes(section.id)) return empty;
      if (section.children.some(id => !ids.has(id) || byId.get(id).parentId !== section.id)) return empty;
      const ancestors = new Set([section.id]);
      let parent = section.parentId;
      while (parent !== null) {
        if (ancestors.has(parent) || !byId.has(parent)) return empty;
        ancestors.add(parent); parent = byId.get(parent).parentId;
      }
    }
    return { sourceUrl: value.sourceUrl, importedAt: value.importedAt, rootIds: value.rootIds,
      sections: value.sections.map(({ id, name, url, parentId, children, productIds }) => ({ id, name, url, parentId, children, productIds })) };
  } catch { return empty; }
}

function readBody(request) {
  const type = request.headers['content-type']?.split(';')[0].trim().toLowerCase();
  if (type !== 'application/json') fail(415, 'JSON_REQUIRED', 'Требуется application/json.');
  if (request.headers['content-encoding'] && request.headers['content-encoding'] !== 'identity') {
    fail(415, 'ENCODING_UNSUPPORTED', 'Сжатые запросы не поддерживаются.');
  }
  if (Number(request.headers['content-length']) > MAX_BODY) {
    request.resume();
    fail(413, 'BODY_TOO_LARGE', 'Запрос превышает 32 КБ.');
  }
  return new Promise((resolveBody, reject) => {
    let bytes = 0;
    let overflow = false;
    const chunks = [];
    request.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > MAX_BODY) {
        if (!overflow) reject(new ApiError(413, 'BODY_TOO_LARGE', 'Запрос превышает 32 КБ.'));
        overflow = true;
        chunks.length = 0;
      } else if (!overflow) chunks.push(chunk);
    });
    request.on('end', () => {
      if (overflow) return;
      try { resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new ApiError(400, 'INVALID_JSON', 'Некорректный JSON.')); }
    });
    request.on('error', () => reject(new ApiError(400, 'REQUEST_INTERRUPTED', 'Запрос прерван.')));
    request.on('aborted', () => reject(new ApiError(400, 'REQUEST_INTERRUPTED', 'Запрос прерван.')));
  });
}

/** Creates a loopback-only development API. The caller explicitly starts server.listen(). */
export function createApp({
  databasePath = resolve(HERE, 'data/runtime.sqlite'),
  catalogPath = resolve(HERE, '../data/catalog.json'),
  catalog: suppliedCatalog,
  catalogTreePath = resolve(HERE, '../data/catalog-tree.json'),
  catalogTree: suppliedCatalogTree,
  brandDirectory = resolve(HERE, '../data/brands'),
  brandModel: suppliedBrandModel,
  homePath = resolve(HERE, 'content/home.json'),
  garDatabasePath = resolve(HERE, 'location/data/gar.sqlite'),
  publicContentPath = resolve(HERE, '../data/site-pages.json'),
  liveSnapshotPath = resolve(HERE, '../integrations/runtime/cms-sync-output/site-pages.live.json'),
  liveSlugs = ['personal-data', 'checkout', 'details'],
  productDetailsPath = resolve(HERE, '../data/product-details.json'),
  home,
  runtimeClient = createRuntimeClient(),
  now = Date.now,
  quoteTtlMs = 10 * 60 * 1000,
  allowedOrigins = [...ORIGINS],
  limits: configuredLimits = {},
  // Only isolated automated tests may opt into the legacy synthetic commerce fixtures.
  // This is deliberately not an environment variable or a request-controlled capability.
  allowTestFixtureOperations = false,
} = {}) {
  if (typeof allowTestFixtureOperations !== 'boolean') throw new Error('allowTestFixtureOperations must be a boolean.');
  if (!Array.isArray(allowedOrigins) || allowedOrigins.some(origin => {
    try {
      const url = new URL(origin);
      return !['http:', 'https:'].includes(url.protocol) || url.origin !== origin;
    } catch { return true; }
  })) throw new Error('allowedOrigins must contain exact http(s) origins without paths.');
  const originAllowlist = new Set(allowedOrigins);
  if (!object(configuredLimits) || Object.keys(configuredLimits).some(key => !Object.hasOwn(DEFAULT_LIMITS, key))) {
    throw new Error('limits must contain known quota names.');
  }
  const limits = { ...DEFAULT_LIMITS, ...configuredLimits };
  if (Object.values(limits).some(value => !Number.isSafeInteger(value) || value < 1)) {
    throw new Error('limits must be positive safe integers.');
  }
  if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  // Validated integer interpolation is required for PRAGMA; request data never reaches it.
  db.exec(`PRAGMA page_size = 4096; PRAGMA max_page_count = ${limits.maxDatabasePages};`);
  if (db.prepare('PRAGMA max_page_count').get().max_page_count > limits.maxDatabasePages) {
    db.close();
    throw new Error('Existing database exceeds the configured page limit; no data was removed.');
  }
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA wal_autocheckpoint = 100;
    PRAGMA journal_size_limit = 1048576;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, state_json TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY, session_hash TEXT NOT NULL REFERENCES sessions(token_hash) ON DELETE CASCADE,
      context TEXT NOT NULL, cart_hash TEXT NOT NULL, json TEXT NOT NULL,
      expires_at INTEGER NOT NULL, consumed_order TEXT
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY, session_hash TEXT NOT NULL REFERENCES sessions(token_hash) ON DELETE CASCADE,
      context TEXT NOT NULL, quote_id TEXT UNIQUE NOT NULL, json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS idempotency (
      session_hash TEXT NOT NULL REFERENCES sessions(token_hash) ON DELETE CASCADE,
      key TEXT NOT NULL, request_hash TEXT NOT NULL, order_id TEXT NOT NULL,
      PRIMARY KEY (session_hash, key)
    );
    CREATE TABLE IF NOT EXISTS appeals (
      id TEXT PRIMARY KEY, session_hash TEXT NOT NULL REFERENCES sessions(token_hash) ON DELETE CASCADE,
      context TEXT NOT NULL, json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY, session_hash TEXT NOT NULL REFERENCES sessions(token_hash) ON DELETE CASCADE,
      context TEXT NOT NULL, order_id TEXT UNIQUE NOT NULL, json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS counters (kind TEXT PRIMARY KEY, value INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS orders_owner_context ON orders(session_hash, context);
    CREATE INDEX IF NOT EXISTS appeals_owner_context ON appeals(session_hash, context);
    CREATE INDEX IF NOT EXISTS returns_owner_context ON returns(session_hash, context);
  `);
  const catalog = loadCatalog(catalogPath, suppliedCatalog);
  const notifications = createNotificationStore(db, fail, now);
  const catalogTree = loadCatalogTree(catalogTreePath, suppliedCatalogTree);
  const brandModel = suppliedBrandModel ?? loadBrandModel(brandDirectory, catalog.products, catalogTree);
  const brandService = createBrandService({ model: brandModel, products: catalog.products, tree: catalogTree, fail });
  const publicV1 = createPublicV1({ catalog, homePath, home, fail });
  const publicContent = createPublicContentService({ snapshotPath: publicContentPath, liveSnapshotPath, liveSlugs });
  let detailSnapshots = [];
  try { detailSnapshots = JSON.parse(readFileSync(productDetailsPath, 'utf8')); } catch {}
  const productDetails = createProductDetailService({ products: catalog.products, details: detailSnapshots });
  const locationProvider = createGarProvider({ databasePath: garDatabasePath, fail, now });
  const locations = createLocationService({ db, provider: locationProvider, fail, now });
  const formsService = createFormsService({runtime:runtimeClient,getLocation:session=>locations.get(session),getSession: session => {const row=sql('SELECT state_json FROM sessions WHERE token_hash=?').get(session.tokenHash); return row?{...session,state:JSON.parse(row.state_json)}:null;}});
  const procurementService = createProcurementService({runtime:runtimeClient,getLocation:session=>locations.get(session),getSession: session => {const row=sql('SELECT state_json FROM sessions WHERE token_hash=?').get(session.tokenHash); return row?{...session,state:JSON.parse(row.state_json)}:null;}});
  const recoveryCommerce = createCommerceRecovery({ db, runtime: runtimeClient, catalog, fail, now, getLocation: session => locations.get(session) });
  const productsById = new Map(catalog.products.map(product => [product.id, product]));
  const statements = new Map();
  function sql(query) {
    if (!statements.has(query)) statements.set(query, db.prepare(query));
    return statements.get(query);
  }
  function transaction(fn) {
    db.exec('BEGIN IMMEDIATE');
    try { const value = fn(); db.exec('COMMIT'); return value; }
    catch (error) {
      // SQLITE_FULL may already have rolled the transaction back.
      if (db.isTransaction) db.exec('ROLLBACK');
      throw error;
    }
  }
  function nextNumber(kind, prefix) {
    const value = sql('INSERT INTO counters(kind, value) VALUES (?, 1) ON CONFLICT(kind) DO UPDATE SET value = value + 1 RETURNING value').get(kind).value;
    return `${prefix}-${String(value).padStart(6, '0')}`;
  }
  function sessionFor(request) {
    const authorization = request.headers.authorization;
    if (typeof authorization !== 'string' || !/^Bearer [A-Za-z0-9_-]{43}$/.test(authorization)) {
      fail(401, 'UNAUTHORIZED', 'Создайте локальную тестовую сессию.');
    }
    const tokenHash = hash(authorization.slice(7));
    const row = sql('SELECT state_json FROM sessions WHERE token_hash = ?').get(tokenHash);
    if (!row) fail(401, 'UNAUTHORIZED', 'Локальная сессия недействительна.');
    const state = ensureBuyerState(JSON.parse(row.state_json));
    if (!allowTestFixtureOperations && state.context === 'organization-demo') {
      state.context = 'personal'; // Legacy draft is kept; an organization requires verified membership.
      sql('UPDATE sessions SET state_json=? WHERE token_hash=?').run(JSON.stringify(state), tokenHash);
    }
    state.viewed ??= { personal: [], business: [], 'organization-demo': [] };
    state.searches ??= { personal: [], business: [], 'organization-demo': [] };
    const functional = request.headers['x-prom23-functional'] === '1';
    if (!functional) { state.viewed = Object.fromEntries(Object.keys(state.viewed).map(key => [key, []])); state.searches = Object.fromEntries(Object.keys(state.searches).map(key => [key, []])); sql('UPDATE sessions SET state_json=? WHERE token_hash=?').run(JSON.stringify(state), tokenHash); }
    state.comparison = Array.isArray(state.comparison)
      ? [...new Set(state.comparison.filter(id => typeof id === 'string' && id.length > 0))].slice(0, MAX_COMPARISON) : [];
    return { tokenHash, state, functional, transportPeerIp: request.socket?.remoteAddress ?? null };
  }
  const saveState = session => sql('UPDATE sessions SET state_json = ? WHERE token_hash = ?').run(JSON.stringify(session.state), session.tokenHash);
  function productFor(id) {
    textField(id, 'productId');
    const product = productsById.get(id);
    if (!product) fail(404, 'PRODUCT_NOT_FOUND', 'Товар отсутствует в локальном снимке.');
    return product;
  }
  function orderFor(id, session) {
    const row = sql('SELECT json FROM orders WHERE id = ? AND session_hash = ? AND context = ?').get(id, session.tokenHash, session.state.context);
    if (!row) fail(404, 'ORDER_NOT_FOUND', 'Тестовый заказ не найден в текущем режиме.');
    return JSON.parse(row.json);
  }
  function addressesFor(context) {
    return [context === 'personal' ? {
      id: 'example-personal', context, label: 'Пример адреса', city: 'Краснодар',
      address: 'Учебная улица, дом 1 — вымышленный адрес', synthetic: true,
    } : {
      id: 'example-organization', context, label: 'Пример склада', city: 'Краснодар',
      address: 'Тестовый проезд, дом 2 — вымышленный адрес', synthetic: true,
    }];
  }
  function applyAction(session, body) {
    if (!object(body) || !Object.hasOwn(body, 'expectedContext')) fail(400, 'INVALID_BODY', 'Укажите ожидаемый режим покупок.');
    if (contextField(body.expectedContext) !== session.state.context) {
      fail(409, 'STALE_CONTEXT', 'Режим покупок изменился. Обновите состояние перед повтором действия.');
    }
    const state = session.state;
    switch (body.type) {
      case 'search':
      case 'remove-search': {
        fields(body, ['type', 'query', 'expectedContext']);
        if (body.type === 'search' && !session.functional) break;
        const query = textField(body.query, 'query', 100).normalize('NFKC').replace(/\s+/gu, ' ').trim().slice(0, 100);
        const remaining = state.searches[state.context].filter(q => q.toLocaleLowerCase('ru') !== query.toLocaleLowerCase('ru'));
        state.searches[state.context] = body.type === 'search' ? [query, ...remaining].slice(0, 10) : remaining;
        break;
      }
      case 'clear-searches':
        fields(body, ['type', 'expectedContext']);
        state.searches[state.context] = [];
        break;
      case 'context':
        fields(body, ['type', 'context', 'expectedContext']);
        contextField(body.context);
        if (!allowTestFixtureOperations && !['personal', 'business'].includes(body.context)) fail(403, 'ORGANIZATION_REQUIRED', 'Войдите и выберите доступную организацию в кабинете.');
        state.context = body.context;
        state.activeOrganization = null;
        break;
      case 'city':
        fields(body, ['type', 'city', 'expectedContext']);
        if (!allowTestFixtureOperations) fail(400, 'SETTLEMENT_SELECTION_REQUIRED', 'Выберите населённый пункт из списка.');
        state.city = textField(body.city, 'city', 80);
        break;
      case 'reset':
        fields(body, ['type', 'expectedContext']);
        session.state = freshState();
        break;
      case 'view': {
        fields(body, ['type', 'productId', 'expectedContext']);
        productFor(body.productId);
        if (!session.functional) break;
        state.viewed[state.context] = [body.productId, ...state.viewed[state.context].filter(id => id !== body.productId)].slice(0, 30);
        break;
      }
      case 'clear-viewed':
        fields(body, ['type', 'expectedContext']);
        state.viewed[state.context] = [];
        break;
      case 'cart-select': {
        fields(body, ['type', 'selected', 'expectedContext'], ['productId']);
        if (typeof body.selected !== 'boolean' || (body.productId !== undefined && !state.carts[state.context].some(l => l.productId === body.productId))) fail(400, 'INVALID_SELECTION', 'Выберите товары из корзины.');
        state.carts[state.context] = state.carts[state.context].map(line => body.productId === undefined || line.productId === body.productId ? { ...line, selected: body.selected } : line);
        break;
      }
      case 'quantity': {
        fields(body, ['type', 'productId', 'quantity', 'expectedContext']);
        const product = productFor(body.productId);
        if (!Number.isSafeInteger(body.quantity) || body.quantity < 0 || body.quantity > 999) {
          fail(400, 'INVALID_QUANTITY', 'Количество должно быть целым числом от 0 до 999.');
        }
        if (body.quantity > Math.min(product.stock ?? 999, product.draftQuantityLimit ?? 999)) fail(409, allowTestFixtureOperations ? 'TEST_STOCK_LIMIT' : 'QUANTITY_LIMIT', 'Уточните доступное количество у менеджера.');
        const lines = state.carts[state.context].filter(line => line.productId !== product.id);
        if (body.quantity > 0) lines.push({ productId: product.id, quantity: body.quantity, ...(state.carts[state.context].find(l => l.productId === product.id)?.selected === false ? { selected: false } : {}) });
        state.carts[state.context] = lines;
        break;
      }
      case 'favorite':
      case 'compare': {
        if (body.type === 'favorite' && !session.functional) fail(422, 'FUNCTIONAL_CHOICE_REQUIRED', 'Для сохранения избранного включите функциональные cookie в настройках.');
        fields(body, ['type', 'productId', 'expectedContext']);
        productFor(body.productId);
        const list = body.type === 'favorite' ? 'favorites' : 'comparison';
        const exists = state[list].includes(body.productId);
        if (!exists && list === 'comparison' && state[list].length >= MAX_COMPARISON) {
          fail(409, 'COMPARISON_LIMIT', 'Можно сравнить до шести товаров.');
        }
        state[list] = exists ? state[list].filter(id => id !== body.productId) : [...state[list], body.productId];
        break;
      }
      default: fail(400, 'UNKNOWN_ACTION', 'Неизвестное действие.');
    }
    saveState(session);
    return session.state;
  }
  function makeQuote(session, body) {
    fields(body, ['context', 'deliveryMethod'], ['addressId']);
    const context = contextField(body.context);
    if (context !== session.state.context) fail(409, 'CONTEXT_CHANGED', 'Режим покупок изменился. Обновите оформление.');
    if (!['pickup', 'courier'].includes(body.deliveryMethod)) fail(400, 'INVALID_DELIVERY', 'Неизвестный способ получения.');
    if (body.deliveryMethod === 'courier' && !addressesFor(context).some(address => address.id === body.addressId)) {
      fail(400, 'ADDRESS_REQUIRED', 'Выберите тестовый адрес текущего режима.');
    }
    if (body.deliveryMethod === 'pickup' && body.addressId !== undefined) {
      fail(400, 'INVALID_ADDRESS', 'Для самовывоза адрес не требуется.');
    }
    const cart = session.state.carts[context];
    if (!cart.length) fail(409, 'EMPTY_CART', 'Корзина пуста.');
    const items = cart.map(line => {
      const product = productFor(line.productId);
      if (line.quantity > Math.min(product.stock ?? 999, product.draftQuantityLimit ?? 999)) fail(409, 'QUANTITY_LIMIT', 'Обновите количество в корзине.');
      return { productId: product.id, name: product.name, quantity: line.quantity,
        unitPriceKopecks: product.priceKopecks, lineTotalKopecks: safeSum(line.quantity * product.priceKopecks) };
    });
    const subtotalKopecks = items.reduce((sum, line) => safeSum(sum + line.lineTotalKopecks), 0);
    const deliveryKopecks = body.deliveryMethod === 'courier' ? 49000 : 0;
    const timestamp = now();
    const quote = {
      id: randomUUID(), context, items, subtotalKopecks, deliveryKopecks,
      totalKopecks: safeSum(subtotalKopecks + deliveryKopecks), currency: 'RUB',
      expiresAt: iso(timestamp + quoteTtlMs),
      deliveryLabel: body.deliveryMethod === 'courier'
        ? 'Тестовая доставка — 490 ₽, без фактической отправки'
        : 'Тестовый самовывоз — бесплатно, без бронирования',
      mode: MODE,
    };
    return transaction(() => {
      // Only disposable, expired, unused calculations belonging to this session are pruned.
      sql('DELETE FROM quotes WHERE session_hash = ? AND consumed_order IS NULL AND expires_at <= ?')
        .run(session.tokenHash, timestamp);
      const count = sql('SELECT count(*) AS count FROM quotes WHERE session_hash = ?').get(session.tokenHash).count;
      if (count >= limits.maxQuotesPerSession) fail(429, 'QUOTE_LIMIT', 'Достигнут лимит тестовых расчётов этой сессии.');
      sql('INSERT INTO quotes(id, session_hash, context, cart_hash, json, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(quote.id, session.tokenHash, context, cartHash(context, cart), JSON.stringify(quote), timestamp + quoteTtlMs);
      return quote;
    });
  }
  function makeOrder(session, body, request) {
    fields(body, ['quoteId']);
    const quoteId = textField(body.quoteId, 'quoteId', 100);
    const key = request.headers['idempotency-key'];
    if (typeof key !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(key)) {
      fail(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Нужен Idempotency-Key: 8–128 латинских букв, цифр, _ или -.');
    }
    const requestHash = hash(JSON.stringify({ quoteId }));
    return transaction(() => {
      // Re-read within the transaction so concurrent requests use authoritative context/cart.
      session.state = JSON.parse(sql('SELECT state_json FROM sessions WHERE token_hash = ?').get(session.tokenHash).state_json);
      const previous = sql('SELECT request_hash, order_id FROM idempotency WHERE session_hash = ? AND key = ?').get(session.tokenHash, key);
      if (previous) {
        if (previous.request_hash !== requestHash) fail(409, 'IDEMPOTENCY_CONFLICT', 'Ключ уже использован для другого запроса.');
        return orderFor(previous.order_id, session);
      }
      const row = sql('SELECT * FROM quotes WHERE id = ? AND session_hash = ?').get(quoteId, session.tokenHash);
      if (!row) fail(404, 'QUOTE_NOT_FOUND', 'Расчёт не найден.');
      if (row.context !== session.state.context) fail(409, 'CONTEXT_CHANGED', 'Режим покупок изменился. Повторите расчёт.');
      if (row.consumed_order) fail(409, 'QUOTE_USED', 'По этому расчёту уже создан тестовый заказ.');
      if (row.expires_at <= now()) fail(409, 'QUOTE_EXPIRED', 'Время расчёта истекло. Рассчитайте заказ заново.');
      if (row.cart_hash !== cartHash(row.context, session.state.carts[row.context])) {
        fail(409, 'CART_CHANGED', 'Корзина изменилась. Рассчитайте заказ заново.');
      }
      const count = sql('SELECT count(*) AS count FROM orders WHERE session_hash = ?').get(session.tokenHash).count;
      if (count >= limits.maxOrdersPerSession) fail(429, 'ORDER_LIMIT', 'Достигнут лимит тестовых заказов этой сессии.');
      const quote = JSON.parse(row.json);
      const order = {
        id: randomUUID(), number: nextNumber('order', 'Т'), context: row.context,
        items: quote.items, totalKopecks: quote.totalKopecks, deliveryKopecks: quote.deliveryKopecks,
        status: 'test-created', createdAt: iso(now()), deliveryLabel: quote.deliveryLabel,
        currency: 'RUB', mode: MODE,
      };
      sql('INSERT INTO orders(id, session_hash, context, quote_id, json) VALUES (?, ?, ?, ?, ?)')
        .run(order.id, session.tokenHash, row.context, quoteId, JSON.stringify(order));
      sql('UPDATE quotes SET consumed_order = ? WHERE id = ?').run(order.id, quoteId);
      sql('INSERT INTO idempotency(session_hash, key, request_hash, order_id) VALUES (?, ?, ?, ?)')
        .run(session.tokenHash, key, requestHash, order.id);
      session.state.carts[row.context] = [];
      saveState(session);
      return order;
    });
  }
  function makeAppeal(session, body) {
    if (!object(body)) fail(400, 'INVALID_BODY', 'Некорректный запрос.');
    const orderId = body.orderId === undefined ? null : textField(body.orderId, 'orderId', 100);
    if (orderId) orderFor(orderId, session);
    // The site's THEME and TAGS_HELP enums live in the missing Bitrix database.
    // A free-text sandbox topic would invent a different support workflow.
    fail(503, 'APPEAL_INTEGRATION_REQUIRED', 'Для обращения нужны темы и параметры поддержки из базы магазина. Отправка пока не подключена.');
  }
  function makeReturn(session, body) {
    fields(body, ['orderId'], ['reason', 'message']);
    const orderId = textField(body.orderId, 'orderId', 100);
    const order = orderFor(orderId, session);
    if (['test-created', 'test-cancelled'].includes(order.status)) {
      fail(409, 'ORDER_NOT_COMPLETED', 'Возврат на сайте доступен только для завершённого заказа и выбранных товаров.');
    }
    // Even a migrated/completed order needs canonical REASONS, eligible items and media handling.
    fail(503, 'RETURN_INTEGRATION_REQUIRED', 'Для возврата нужны завершённый заказ, доступные товары и причины из базы магазина. Оформление пока не подключено.');
  }
  const staticMethods = new Map([
    ...LOCATION_METHODS,
    ['/api/v1/procurement/submit', ['POST']], ['/api/v1/buyer/organizations', ['GET']], ['/api/v1/buyer/select', ['POST']],
    ['/api/v1/auth/session', ['GET']], ['/api/v1/auth/logout', ['POST']],
    ['/api/v1/publications', ['POST']], ['/api/v1/commerce/offer', ['POST']], ['/api/v1/payment/session', ['POST']], ['/api/v1/payment/status', ['POST']],
    ['/api/v1/cart/summary', ['GET']], ['/api/v1/cart/coupon', ['POST']],
    ['/api/v1/checkout/quote', ['POST']],
    ['/api/v1/checkout/address-suggestions', ['POST']], ['/api/v1/checkout/options', ['POST']], ['/api/v1/checkout/submit', ['POST']],
    ['/api/v1/app-config', ['GET']], ['/api/v1/home', ['GET']], ['/api/v1/catalog', ['GET']],
    ['/health', ['GET']], ['/api/catalog', ['GET']], ['/api/catalog-tree', ['GET']], ['/api/sessions', ['POST']],
    ['/api/brands', ['GET']],
    ['/api/state', ['GET']], ['/api/actions', ['POST']], ['/api/quotes', ['POST']],
    ['/api/orders', ['GET', 'POST']], ['/api/addresses', ['GET']],
    ['/api/appeals', ['GET', 'POST']], ['/api/returns', ['GET', 'POST']],
    ['/api/session', ['DELETE']],
    ['/api/notifications', ['GET']], ['/api/notification-preferences', ['POST']], ['/api/notifications/read', ['POST']],
  ]);
  const server = createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Vary', 'Origin');
    const send = (status, value) => { response.writeHead(status); response.end(JSON.stringify(value)); };
    try {
      const origin = request.headers.origin;
      if (origin !== undefined && !originAllowlist.has(origin)) fail(403, 'ORIGIN_FORBIDDEN', 'Источник запроса не разрешён.');
      if (origin) response.setHeader('Access-Control-Allow-Origin', origin);
      const url = new URL(request.url, 'http://127.0.0.1');
      const path = url.pathname;
      if (request.url.length > 4096) fail(414, 'URL_TOO_LONG', 'Слишком длинный запрос.');
      const brandMatch = path.match(/^\/api\/brands\/([^/]{1,300})$/);
      if (url.search && !brandMatch && !['/api/v1/catalog', '/api/v1/locations/suggest'].includes(path)) fail(400, 'QUERY_UNSUPPORTED', 'Параметры URL не поддерживаются.');
      const formMatch=path.match(/^\/api\/v1\/forms\/([a-z][a-z0-9-]{0,79})\/(context|submit)$/);
      const uploadMatch=path.match(/^\/api\/v1\/uploads\/(create|chunk|complete|delete)$/);
      const workspaceMatch=path.match(/^\/api\/v1\/workspace\/([a-z-]{1,50})$/);
      const orderMatch = path.match(/^\/api\/orders\/([0-9a-f-]{36})$/);
      const cancelMatch = path.match(/^\/api\/orders\/([0-9a-f-]{36})\/cancel$/);
      const settlementId = locationDetailId(path);
      const contentMatch = path.match(/^\/api\/v1\/content\/pages\/([a-z][a-z0-9-]{0,79})$/);
      const productDetailMatch = path.match(/^\/api\/v1\/products\/(prom-[1-9][0-9]{0,11})\/(details|availability)$/);
      const methods = staticMethods.get(path) ?? (brandMatch || orderMatch || settlementId || contentMatch || productDetailMatch ? ['GET'] : cancelMatch || formMatch || uploadMatch || workspaceMatch ? ['POST'] : null);
      if (!methods) fail(404, 'ROUTE_NOT_FOUND', 'Маршрут не найден.');
      if (request.method === 'OPTIONS') {
        const requestedMethod = request.headers['access-control-request-method'];
        if (requestedMethod && !methods.includes(requestedMethod)) fail(405, 'METHOD_NOT_ALLOWED', 'Метод не разрешён.');
        const requestedHeaders = request.headers['access-control-request-headers'];
        const permittedHeaders = ['authorization', 'x-prom23-functional', 'content-type', 'idempotency-key', ...(contentMatch ? ['if-none-match'] : [])];
        if (requestedHeaders && requestedHeaders.toLowerCase().split(',').some(name => !permittedHeaders.includes(name.trim()))) {
          fail(403, 'HEADER_FORBIDDEN', 'Заголовок запроса не разрешён.');
        }
        response.setHeader('Access-Control-Allow-Methods', methods.join(', '));
        response.setHeader('Access-Control-Allow-Headers', permittedHeaders.join(', '));
        response.writeHead(204); response.end(); return;
      }
      if (!methods.includes(request.method)) {
        response.setHeader('Allow', methods.join(', '));
        fail(405, 'METHOD_NOT_ALLOWED', 'Метод не разрешён.');
      }
      if (path.startsWith('/api/v1/')) response.setHeader('X-Robots-Tag', 'noindex, nofollow');
      if (contentMatch) {
        response.setHeader('Access-Control-Expose-Headers', 'ETag');
        const result = publicContent.getResponse(contentMatch[1], request.headers['if-none-match']);
        for (const [key, value] of Object.entries(result.headers)) response.setHeader(key, value);
        if (result.status === 304) { response.writeHead(304); response.end(); } else send(result.status, result.body);
        return;
      }
      if (productDetailMatch?.[2] === 'details') {
        let detail; try { detail = productDetails.getPublicDetail(productDetailMatch[1]); } catch { fail(404, 'PRODUCT_NOT_FOUND', 'Товар не найден.'); }
        if (!detail) fail(404, 'PRODUCT_NOT_FOUND', 'Товар не найден.');
        send(200, { data: detail }); return;
      }
      if (path === '/api/v1/locations/suggest') {
        send(200, { data: locationSuggestions(locationProvider, url.searchParams, fail) }); return;
      }
      if (settlementId) {
        const item = locationProvider.getById(settlementId);
        if (!item) fail(404, 'SETTLEMENT_NOT_FOUND', 'Населённый пункт не найден в актуальном справочнике.');
        send(200, { data: item }); return;
      }
      if (['/api/v1/app-config', '/api/v1/home', '/api/v1/catalog'].includes(path)) {
        response.setHeader('X-Robots-Tag', 'noindex, nofollow');
        if (path === '/api/v1/app-config') send(200, { data: publicV1.appConfig });
        else if (path === '/api/v1/home') send(200, { data: publicV1.home });
        else send(200, { data: publicV1.page(url.searchParams) });
        return;
      }
      if (path === '/health') {
        send(200, { data: { status: 'ok', mode: MODE, catalogLoaded: catalog.seedStatus === 'loaded',
          catalogSeedStatus: catalog.seedStatus, productCount: catalog.products.length,
          message: catalog.seedStatus === 'loaded' ? 'Локальный снимок каталога. Остатки и операции тестовые.'
            : 'Нет корректного data/catalog.json. Каталог пуст; импортируйте снимок и перезапустите API.' } });
        return;
      }
      if (path === '/api/brands') { send(200, { data: brandService.list() }); return; }
      if (brandMatch) { let value; try { value = decodeURIComponent(brandMatch[1]); } catch { fail(400, 'INVALID_BRAND_URL', 'Некорректный адрес бренда.'); } send(200, { data: brandService.page(value, url.searchParams) }); return; }
      if (path === '/api/catalog') {
        const { seedStatus, ...data } = catalog;
        send(200, { data }); return;
      }
      if (path === '/api/catalog-tree') { send(200, { data: catalogTree }); return; }
      if (path === '/api/sessions') {
        fields(await readBody(request), []);
        if (sql('SELECT count(*) AS count FROM sessions').get().count >= limits.maxSessions) {
          fail(429, 'SESSION_LIMIT', 'Достигнут общий лимит локальных тестовых сессий.');
        }
        const token = randomBytes(32).toString('base64url');
        const state = freshState();
        sql('INSERT INTO sessions(token_hash, state_json, created_at) VALUES (?, ?, ?)').run(hash(token), JSON.stringify(state), iso(now()));
        send(201, { data: { token, state } }); return;
      }
      // Read bodies before auth/state reads: another request may mutate a session while a body arrives.
      let body;
      if (request.method === 'POST') body = await readBody(request);
      const session = sessionFor(request);
      if(path==='/api/v1/auth/session'){
        const result=await runtimeClient.call('auth.session',{sessionKey:session.tokenHash});
        if(typeof result.authenticated!=='boolean')fail(502,'AUTH_RESPONSE_INVALID','Не удалось проверить вход.');
        send(200,{data:{authenticated:result.authenticated}});return;
      }
      if(path==='/api/v1/auth/logout'){
        fields(body,[]);const result=await runtimeClient.call('auth.logout',{sessionKey:session.tokenHash});
        if(result.loggedOut!==true)fail(502,'LOGOUT_UNCONFIRMED','Не удалось подтвердить выход. Повторите попытку.');
        const latest=sessionFor(request);latest.state=freshState();saveState(latest);recoveryCommerce.deleteSession(latest.tokenHash);
        send(200,{data:{loggedOut:true,state:latest.state}});return;
      }
      if(path==='/api/v1/procurement/submit'){fields(body,['context','revision','values','consents']);send(200,{data:await procurementService.submit(session,body,request.headers['idempotency-key'])});return;}
      if(formMatch){
        fields(body,['context'],['target','challengeId',...(formMatch[2]==='submit'?['revision','values','consents']:[])]);
        if(formMatch[2]==='submit'&&formMatch[1]==='order-pay')fail(409,'PAYMENT_SESSION_REQUIRED','Откройте защищённую оплату из заказа.');
        if(formMatch[2]==='submit'&&formMatch[1]==='organization-switch')fail(409,'BUYER_SELECT_REQUIRED','Выберите организацию через переключатель покупателя.');
        const cartBefore=JSON.stringify(session.state.carts[session.state.context]);
        const result=formMatch[2]==='context'?await formsService.context(session,formMatch[1],body):await formsService.submit(session,formMatch[1],body,request.headers['idempotency-key']);
        if(formMatch[2]==='submit'&&result.status==='accepted'&&formMatch[1]==='order-repeat'){
          const latest=sessionFor(request);if(latest.state.context!==body.context||JSON.stringify(latest.state.carts[latest.state.context])!==cartBefore)fail(409,'CART_CHANGED','Корзина изменилась. Повторите выбор заказа.');
          const cart=result.cart;
          if(!Array.isArray(cart)||!cart.length||cart.length>500||new Set(cart.map(line=>line.productId)).size!==cart.length||cart.some(line=>!productsById.has(line.productId)||!Number.isSafeInteger(line.quantity)||line.quantity<1||line.quantity>999))fail(409,'ORDER_PRODUCTS_UNAVAILABLE','Не все товары заказа доступны в текущем каталоге. Свяжитесь с магазином.');
          latest.state.carts[latest.state.context]=cart.map(({productId,quantity})=>({productId,quantity}));saveState(latest);
        }
        if(formMatch[2]==='submit'&&result.status==='accepted'&&result.loggedOut===true&&['account-delete','sessions-terminate'].includes(formMatch[1])){const latest=sessionFor(request);latest.state=freshState();saveState(latest);recoveryCommerce.deleteSession(latest.tokenHash);}
        if(formMatch[2]==='submit'&&result.status==='accepted'&&formMatch[1]==='organization-delete'){
          const latest=sessionFor(request);const removed=String(body.target?.organizationId??session.state.activeOrganization?.id??'');
          if(latest.state.context===`organization:${removed}`){latest.state.context='business';latest.state.activeOrganization=null;ensureBuyerState(latest.state);saveState(latest);}
        }
        send(200,{data:result});return;
      }
      if(uploadMatch){fields(body,['context','formId'],['target','challengeId','revision','fieldName','name','size','mimeType','uploadId','offset','base64']);send(200,{data:await formsService.upload(session,uploadMatch[1],body,request.headers['idempotency-key'])});return;}
      if(workspaceMatch){fields(body,['context'],['target']);send(200,{data:await formsService.workspace(session,workspaceMatch[1],body)});return;}
      if(path==='/api/v1/publications'){fields(body,['context','productId'],['filters']);send(200,{data:await formsService.publications(session,body)});return;}
      if (path === '/api/v1/buyer/organizations') { send(200, { data: await readOrganizations(runtimeClient, session.tokenHash) }); return; }
      if (path === '/api/v1/buyer/select') {
        fields(body, ['organizationId', 'expectedContext'], ['transferDraft']);
        if (body.transferDraft !== undefined && (typeof body.transferDraft !== 'boolean' || (body.transferDraft && body.expectedContext !== 'business'))) fail(400, 'INVALID_TRANSFER', 'Можно перенести только товары, выбранные для бизнеса.');
        const draftBefore = JSON.stringify(session.state.carts.business);
        if (body.expectedContext !== session.state.context) fail(409, 'CONTEXT_CHANGED', 'Режим покупок изменился. Обновите страницу.');
        if (!Number.isSafeInteger(body.organizationId) || body.organizationId <= 0) fail(400, 'ORGANIZATION_REQUIRED', 'Выберите организацию из списка.');
        const remote = await runtimeClient.call('buyer.select', { sessionKey: session.tokenHash, organizationId: body.organizationId });
        if (!verifiedOrganization(remote.organization) || remote.organization.id !== body.organizationId || !Array.isArray(remote.cart) || remote.cart.length > 500 || remote.cart.some(line => !productsById.has(line.productId) || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 999)) fail(502, 'ORGANIZATION_RESPONSE_INVALID', 'Не удалось подтвердить корзину организации.');
        const latest = sessionFor(request);
        if (latest.state.context !== body.expectedContext) fail(409, 'CONTEXT_CHANGED', 'Режим покупок изменился. Повторите выбор.');
        const key = `organization:${remote.organization.id}`;
        if (body.transferDraft && JSON.stringify(latest.state.carts.business) !== draftBefore) fail(409, 'CART_CHANGED', 'Корзина изменилась. Повторите выбор организации.');
        let cart = latest.state.carts[key] ?? remote.cart.map(({ productId, quantity }) => ({ productId, quantity }));
        if (body.transferDraft && latest.state.carts.business.length) {
          try { cart = mergeBusinessDraft(cart, latest.state.carts.business, productsById); }
          catch { fail(409, 'DRAFT_TRANSFER_LIMIT', 'Проверьте количество товаров перед переносом в корзину организации.'); }
        }
        latest.state.context = key;
        latest.state.activeOrganization = { id: remote.organization.id, name: remote.organization.name, inn: remote.organization.inn };
        latest.state.carts[key] = cart;
        if (body.transferDraft) latest.state.carts.business = [];
        ensureBuyerState(latest.state); saveState(latest);
        send(200, { data: latest.state }); return;
      }
      if (path === '/api/v1/commerce/offer') {
        fields(body, ['expectedContext', 'expectedLocationVersion', 'items']);
        const selected = locations.get(session);
        if (body.expectedContext !== session.state.context || body.expectedLocationVersion !== selected.version) fail(409, 'COMMERCE_STALE', 'Место или режим покупки изменились.');
        if (!selected.settlement) fail(409, 'SETTLEMENT_REQUIRED', 'Выберите населённый пункт.');
        if (!Array.isArray(body.items) || !body.items.length || body.items.length > 500) fail(400, 'ITEMS_REQUIRED', 'Выберите товары.');
        const items = body.items.map(line => { const product = productFor(line.productId); if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > 999) fail(400,'INVALID_QUANTITY','Проверьте количество.'); return {productId: product.id, quantity:line.quantity, priceKopecks:product.priceKopecks}; });
        const requestKey = JSON.stringify([session.state.context, session.state.city, selected.settlement.id, selected.version, [...items].sort((a,b)=>a.productId.localeCompare(b.productId)).map(i=>[i.productId,i.quantity,i.priceKopecks])]);
        const result = await runtimeClient.call('commerce.offer', { sessionKey: session.tokenHash, context:session.state.context, settlementId:selected.settlement.id, locationVersion:selected.version, requestKey, items: items.map(({productId,quantity})=>({productId,quantity})) });
        if (result.requestKey !== requestKey) fail(502,'OFFER_INVALID','Не удалось подтвердить условия покупки.');
        send(200,{data:result}); return;
      }
      if(path==='/api/v1/payment/status'){
        fields(body,['expectedContext','reference']);
        if(body.expectedContext!==session.state.context)fail(409,'CONTEXT_CHANGED','Режим покупок изменился.');
        if(typeof body.reference!=='string'||!/^[1-9][0-9]{0,15}$/.test(body.reference))fail(400,'ORDER_REQUIRED','Выберите заказ.');
        const result=await runtimeClient.call('payment.status',{sessionKey:session.tokenHash,context:session.state.context,reference:body.reference});
        if(sessionFor(request).state.context!==body.expectedContext)fail(409,'CONTEXT_CHANGED','Режим покупок изменился.');
        if(result?.sourceOrderId!==body.reference||typeof result.sourcePaymentId!=='string'||!/^[1-9][0-9]{0,15}$/.test(result.sourcePaymentId)||!['PENDING','AUTHORIZED','CAPTURED','VOIDED','REFUNDED','CONFIRMED','PARTIALLY_REFUNDED','FAILED'].includes(result.status))fail(502,'PAYMENT_STATUS_INVALID','Не удалось подтвердить статус оплаты.');
        send(200,{data:{status:result.status,sourceOrderId:result.sourceOrderId,sourcePaymentId:result.sourcePaymentId}});return;
      }
      if (path === '/api/v1/payment/session') {
        fields(body,['expectedContext','reference']);
        if(body.expectedContext!==session.state.context)fail(409,'CONTEXT_CHANGED','Режим покупок изменился.');
        textField(body.reference,'reference',100);
        const result=await runtimeClient.call('payment.session',{sessionKey:session.tokenHash,context:session.state.context,reference:body.reference},{idempotencyKey:request.headers['idempotency-key']});
        let target;try{target=new URL(result.url)}catch{fail(502,'PAYMENT_URL_INVALID','Не удалось открыть защищённую оплату.');}
        const origins=JSON.parse(process.env.PROM23_PAYMENT_ALLOWED_ORIGINS??'["https://pay.yandex.ru","https://split.yandex.ru"]');
        if(target.protocol!=='https:'||target.username||target.password||!origins.includes(target.origin)||Date.parse(result.expiresAt)<=now()||!Number.isFinite(Date.parse(result.expiresAt)))fail(502,'PAYMENT_URL_INVALID','Не удалось подтвердить защищённую оплату.');
        if(sessionFor(request).state.context!==body.expectedContext)fail(409,'CONTEXT_CHANGED','Режим покупок изменился.');
        send(200,{data:{url:target.href,expiresAt:result.expiresAt}});return;
      }
      if (path === '/api/v1/checkout/address-suggestions') {
        fields(body,['expectedContext','expectedLocationVersion','query']);
        const selected=locations.get(session);
        if(body.expectedContext!==session.state.context||body.expectedLocationVersion!==selected.version)fail(409,'CONTEXT_CHANGED','Место или режим покупок изменились.');
        if(!selected.settlement)fail(409,'SETTLEMENT_REQUIRED','Выберите населённый пункт.');
        const query=textField(body.query,'query',500);if(query.length<3)fail(422,'ADDRESS_REQUIRED','Введите улицу и номер дома.');
        const result=await runtimeClient.call('checkout.addresses',{sessionKey:session.tokenHash,context:session.state.context,settlementId:selected.settlement.id,locationVersion:selected.version,query});
        const latest=sessionFor(request),place=locations.get(latest);
        if(latest.state.context!==body.expectedContext||place.version!==selected.version)fail(409,'CONTEXT_CHANGED','Место или режим покупок изменились.');
        if(!Array.isArray(result?.suggestions)||result.suggestions.length>10||result.suggestions.some(row=>typeof row?.address!=='string'||row.address.trim().length<3||row.address.length>500||/[\x00-\x1f<>]/.test(row.address)))fail(502,'ADDRESS_RESPONSE_INVALID','Не удалось проверить адрес.');
        send(200,{data:{suggestions:[...new Set(result.suggestions.map(row=>row.address))].map(address=>({address}))}});return;
      }
      if (path === '/api/v1/cart/summary') { send(200, { data: recoveryCommerce.summary(session, locations.get(session)) }); return; }
      if (path === '/api/v1/cart/coupon') { fields(body, ['code', 'expectedContext']); send(200, { data: await recoveryCommerce.coupon(session, locations.get(session), body) }); return; }
      if (path === '/api/v1/checkout/options') { fields(body, ['expectedContext', 'expectedLocationVersion'], ['delivery', 'payment', 'address', 'pod', 'etag', 'office', 'comment']); send(200, { data: await recoveryCommerce.options(session, locations.get(session), body) }); return; }
      if (path === '/api/v1/checkout/quote') { fields(body, ['expectedContext', 'expectedLocationVersion'], ['delivery', 'payment', 'address', 'pickupId', 'pod', 'etag', 'office', 'comment']); send(200, { data: await recoveryCommerce.quote(session, locations.get(session), body) }); return; }
      if (path === '/api/v1/checkout/submit') { fields(body, ['expectedContext','quoteId','name','email','phone','consents']); send(200, { data: await recoveryCommerce.submit(session, locations.get(session), body, request.headers['idempotency-key']) }); return; }
      if (productDetailMatch?.[2] === 'availability') {
        const selected = locations.get(session);
        if (!selected.settlement) fail(409, 'SETTLEMENT_REQUIRED', 'Выберите населённый пункт.');
        const buyerContext = session.state.context === 'personal' ? 'personal' : 'organization';
        let availability; try { availability = await productDetails.getAvailability(productDetailMatch[1], { settlementId: selected.settlement.id, buyerContext }); } catch { fail(404, 'PRODUCT_NOT_FOUND', 'Товар не найден.'); }
        send(200, { data: { productId: productDetailMatch[1], settlementId: selected.settlement.id, locationVersion: selected.version, buyerContext, availability } }); return;
      }
      if (path === '/api/v1/location') {
        send(200, { data: request.method === 'GET' ? locations.get(session) : locations.select(session, body) }); return;
      }
      if (path === '/api/v1/cart/revalidate-location') { locations.revalidate(session, body); return; }
      if (!allowTestFixtureOperations) {
        const unavailable = { available: false, source: 'not-connected' };
        // Existing SQLite fixture records remain on disk, but never become customer data.
        if (request.method === 'GET' && ['/api/addresses', '/api/orders', '/api/appeals', '/api/returns'].includes(path)) {
          send(200, { data: [], meta: unavailable }); return;
        }
        if (path === '/api/notifications' && request.method === 'GET') {
          send(200, { data: { items: [], preferences: { ...defaultPreferences }, mode: MODE,
            channels: { push: 'not-configured', email: 'not-connected', sms: 'not-connected' }, ...unavailable } }); return;
        }
        if (orderMatch || cancelMatch || ['/api/quotes', '/api/orders', '/api/appeals', '/api/returns',
          '/api/notification-preferences', '/api/notifications/read'].includes(path)) {
          fail(503, 'SHOP_INTEGRATION_REQUIRED', 'Операция магазина пока не подключена. Данные не отправлены.');
        }
      }
      if (path === '/api/notifications') { send(200, { data: notifications.inbox(session) }); return; }
      if (path === '/api/notification-preferences') { send(200, { data: notifications.savePreferences(session, body) }); return; }
      if (path === '/api/notifications/read') { send(200, { data: notifications.markRead(session, body) }); return; }
      if (path === '/api/state') { send(200, { data: session.state }); return; }
      if (path === '/api/actions') { send(200, { data: applyAction(session, body) }); return; }
      if (path === '/api/quotes') { send(201, { data: makeQuote(session, body) }); return; }
      if (path === '/api/addresses') { send(200, { data: addressesFor(session.state.context) }); return; }
      if (path === '/api/orders' && request.method === 'POST') {
        send(201, { data: makeOrder(session, body, request) }); return;
      }
      if (orderMatch) { send(200, { data: orderFor(orderMatch[1], session) }); return; }
      if (cancelMatch) {
        fields(body, []);
        const order = orderFor(cancelMatch[1], session);
        if (order.status === 'test-cancelled') fail(409, 'ORDER_ALREADY_CANCELLED', 'Тестовый заказ уже отменён.');
        order.status = 'test-cancelled';
        order.cancelledAt = iso(now());
        sql('UPDATE orders SET json = ? WHERE id = ? AND session_hash = ? AND context = ?')
          .run(JSON.stringify(order), order.id, session.tokenHash, session.state.context);
        send(200, { data: order }); return;
      }
      if (path === '/api/appeals' && request.method === 'POST') { send(201, { data: makeAppeal(session, body) }); return; }
      if (path === '/api/returns' && request.method === 'POST') { send(201, { data: makeReturn(session, body) }); return; }
      if (request.method === 'GET' && ['/api/orders', '/api/appeals', '/api/returns'].includes(path)) {
        // Table names come only from this fixed map, never from request text.
        const query = {
          '/api/orders': 'SELECT json FROM orders WHERE session_hash = ? AND context = ? ORDER BY rowid DESC',
          '/api/appeals': 'SELECT json FROM appeals WHERE session_hash = ? AND context = ? ORDER BY rowid DESC',
          '/api/returns': 'SELECT json FROM returns WHERE session_hash = ? AND context = ? ORDER BY rowid DESC',
        }[path];
        send(200, { data: sql(query).all(session.tokenHash, session.state.context).map(row => JSON.parse(row.json)) });
        return;
      }
      if (path === '/api/session') {
        recoveryCommerce.deleteSession(session.tokenHash);
        sql('DELETE FROM sessions WHERE token_hash = ?').run(session.tokenHash);
        send(200, { data: { deleted: true, mode: MODE } }); return;
      }
      fail(404, 'ROUTE_NOT_FOUND', 'Маршрут не найден.');
    } catch (error) {
      if (response.destroyed || response.writableEnded) return;
      if (error instanceof ApiError || error instanceof RuntimeError) send(error.status, { error: { code: error.code, message: error.message, ...(error.fieldErrors?{fields:error.fieldErrors}:{}), ...(error.retryAfterSeconds!==undefined?{retryAfterSeconds:error.retryAfterSeconds}:{}) } });
      else if (error?.code === 'ERR_SQLITE_ERROR' && error.errcode === 13) {
        send(429, { error: { code: 'STORAGE_LIMIT', message: 'Достигнут лимит хранилища тестового сервера.' } });
      }
      else {
        console.error('Local sandbox API: internal request error.');
        send(500, { error: { code: 'INTERNAL_ERROR', message: 'Ошибка локального сервера.' } });
      }
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.keepAliveTimeout = 5000;
  let closed = false;
  return {
    server,
    async close() {
      if (closed) return;
      closed = true;
      if (server.listening) await new Promise((resolveClose, reject) => {
        server.close(error => error ? reject(error) : resolveClose());
        server.closeIdleConnections();
      });
      locationProvider.close();
      db.close();
    },
  };
}
