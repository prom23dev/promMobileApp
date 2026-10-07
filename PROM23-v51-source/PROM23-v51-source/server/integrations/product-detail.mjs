/** Source-aware read-only projection. The optional providers are server-owned functions,
 * never URLs or warehouse identifiers taken from a client request. No network or writes. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ID = /^prom-[1-9][0-9]{0,11}$/;
const CAPABILITIES = ['canRent', 'canLease', 'canBuyOneClick', 'canRequestBetterPrice', 'canRequestQuote', 'canRequestCallback'];
export class ProductDetailError extends Error {
  constructor(code, status = 400) { super(code); this.code = code; this.status = status; }
}
const error = (code, status) => { throw new ProductDetailError(code, status); };
const plain = (s, max = 20000) => typeof s === 'string' && s.length <= max && !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s);
const publicUrl = (s, prefix) => {
  try { const u = new URL(s); return u.protocol === 'https:' && u.hostname === 'prom.myfast.space' && !u.port && !u.username && !u.password && !u.search && !u.hash && u.pathname.startsWith(prefix); }
  catch { return false; }
};
const strings = value => Array.isArray(value) && value.length <= 200 && value.every(s => plain(s)) ? [...value] : [];

export function normalizePublicProductDetail(raw) {
  if (!raw || !ID.test(raw.productId) || !publicUrl(raw.sourceUrl, '/catalog/') || !/^[a-f0-9]{64}$/.test(raw.sourcePageSHA256) || !Number.isFinite(Date.parse(raw.capturedAt))) error('PRODUCT_SNAPSHOT_INVALID', 503);
  const gallery = []; const seen = new Set();
  for (const img of Array.isArray(raw.gallery) ? raw.gallery.slice(0, 50) : []) {
    if (!img || img.kind !== 'image' || !plain(img.id, 100) || !plain(img.alt, 500) || !publicUrl(img.url, '/upload/') || !/\.(jpe?g|png|webp)$/i.test(new URL(img.url).pathname) || seen.has(img.url)) continue;
    seen.add(img.url);
    gallery.push({ id: img.id, kind: 'image', url: img.url, alt: img.alt,
      ...(publicUrl(img.originalUrl, '/upload/') && /\.(jpe?g|png|webp)$/i.test(new URL(img.originalUrl).pathname) ? { originalUrl: img.originalUrl } : {}),
      ...(Number.isSafeInteger(img.width) && img.width > 0 && img.width <= 16000 ? { width: img.width } : {}),
      ...(Number.isSafeInteger(img.height) && img.height > 0 && img.height <= 16000 ? { height: img.height } : {}) });
  }
  const documents = [];
  for (const doc of Array.isArray(raw.documents) ? raw.documents.slice(0, 100) : []) {
    // Purchased documents require the existing authenticated document manifest. They
    // must never acquire a download URL merely by appearing in a public snapshot.
    if (doc?.access !== 'public' || !plain(doc.id, 100) || !plain(doc.name, 300) || !publicUrl(doc.url, '/upload/') || !/\.(pdf|docx?|xlsx?)$/i.test(new URL(doc.url).pathname)) continue;
    documents.push({ id: doc.id, name: doc.name, url: doc.url, access: 'public' });
  }
  const proven = raw.capabilityMode === 'source-form-visibility';
  return { productId: raw.productId, sourceUrl: raw.sourceUrl, sourcePageSHA256: raw.sourcePageSHA256, capturedAt: raw.capturedAt,
    gallery, descriptionParagraphs: strings(raw.descriptionParagraphs), advantages: strings(raw.advantages), packageContents: strings(raw.packageContents), documents,
    documentPolicy: { requiresOrder: raw.documentPolicy?.requiresOrder === true, manifestAvailable: false },
    capabilities: Object.fromEntries(CAPABILITIES.map(key => [key, proven && raw.capabilities?.[key] === true])),
    capabilityMode: 'source-form-visibility', runtimeWritesAvailable: false };
}
const unknown = reason => ({ status: 'unknown', reason, quantityBasis: 'physical-on-hand', totalQuantity: null,
  warehouses: [], nearestWarehouse: null, pickupAvailable: null, estimatedRestock: null, availableToPromise: null,
  measuredAt: null, expiresAt: null, checkoutEligible: false });
const timestamp = value => typeof value === 'string' ? Date.parse(value) : NaN;

/** Bitrix StoreProductTable.AMOUNT is a physical quantity. It is not a reservation,
 * nearest-store decision or delivery promise. Missing rows stay unknown even when
 * the provider declares a complete query; zero requires an explicit row. */
export function normalizeInventory(snapshot, mapping, productId, now = Date.now()) {
  if (!snapshot || snapshot.productId !== productId || snapshot.contextKey !== mapping.contextKey) return unknown('INVENTORY_CONTEXT_MISMATCH');
  const measured = timestamp(snapshot.measuredAt), expires = timestamp(snapshot.expiresAt);
  if (!Number.isFinite(measured) || !Number.isFinite(expires) || measured > now || expires <= now || measured >= expires) return unknown('INVENTORY_STALE');
  if (!Array.isArray(snapshot.rows) || snapshot.rows.length > 500) return unknown('INVENTORY_INVALID');
  const byId = new Map(); const allowed = new Set(mapping.warehouses.map(w => w.id));
  for (const row of snapshot.rows) {
    if (!row || !allowed.has(row.warehouseId) || byId.has(row.warehouseId) || !Number.isFinite(row.quantity) || row.quantity < 0 || row.quantity > 1e12) return unknown('INVENTORY_INVALID');
    byId.set(row.warehouseId, row.quantity);
  }
  const warehouses = mapping.warehouses.map(w => ({ id: w.id, ...(w.name ? { name: w.name } : {}), quantity: byId.get(w.id) ?? null }));
  const complete = snapshot.complete === true && warehouses.length > 0 && warehouses.every(w => w.quantity !== null);
  const total = complete ? warehouses.reduce((sum, w) => sum + w.quantity, 0) : null;
  return { ...unknown(complete ? 'PURCHASE_VALIDATION_REQUIRED' : 'INVENTORY_INCOMPLETE'), status: total === null ? 'unknown' : total > 0 ? 'in-stock' : 'out-of-stock',
    totalQuantity: total, warehouses, measuredAt: snapshot.measuredAt, expiresAt: snapshot.expiresAt };
}

export function createProductDetailService({ products, details, resolveCommerceContext, readInventory, now = Date.now }) {
  const ids = new Set(products.map(p => p.id)); const map = new Map();
  try {
    if (!Array.isArray(details) || details.length > 100000) throw new Error();
    for (const raw of details) { const value = normalizePublicProductDetail(raw); if (ids.has(value.productId)) { if (map.has(value.productId)) throw new Error(); map.set(value.productId, value); } }
  } catch { map.clear(); } // Optional corrupt snapshot must not prevent catalog/session startup.
  const requireProduct = id => { if (!ID.test(id) || !ids.has(id)) error('PRODUCT_NOT_FOUND', 404); };
  return {
    getPublicDetail(id) { requireProduct(id); return map.has(id) ? structuredClone(map.get(id)) : null; },
    readiness() { return { publicDetailCount: map.size, inventoryAdapterConfigured: typeof resolveCommerceContext === 'function' && typeof readInventory === 'function', liveWriteEnabled: false }; },
    async getAvailability(id, request) {
      requireProduct(id);
      if (!request || Object.keys(request).some(k => !['settlementId', 'buyerContext'].includes(k)) || !UUID.test(request.settlementId ?? '') || !['personal', 'organization'].includes(request.buyerContext)) error('PRODUCT_CONTEXT_INVALID');
      if (typeof resolveCommerceContext !== 'function' || typeof readInventory !== 'function') return unknown('BITRIX_MAPPING_REQUIRED');
      let mapping;
      try { mapping = await resolveCommerceContext({ ...request }); }
      catch { return unknown('COMMERCE_CONTEXT_UNAVAILABLE'); }
      if (!mapping || mapping.settlementId !== request.settlementId || mapping.buyerContext !== request.buyerContext || !plain(mapping.contextKey, 200) || !mapping.contextKey || !plain(mapping.serviceRegionId, 100) || !mapping.serviceRegionId || timestamp(mapping.expiresAt) <= now() || !Number.isFinite(timestamp(mapping.expiresAt)) || !Array.isArray(mapping.warehouses) || !mapping.warehouses.length || mapping.warehouses.length > 500 || mapping.warehouses.some(w => !w || typeof w.id !== 'string' || !/^[1-9][0-9]{0,11}$/.test(w.id) || (w.name !== undefined && !plain(w.name, 300))) || new Set(mapping.warehouses.map(w => w.id)).size !== mapping.warehouses.length) return unknown('COMMERCE_CONTEXT_UNRESOLVED');
      try { return normalizeInventory(await readInventory({ productId: id, contextKey: mapping.contextKey, warehouseIds: mapping.warehouses.map(w => w.id) }), mapping, id, now()); }
      catch { return unknown('INVENTORY_UNAVAILABLE'); }
    },
  };
}
