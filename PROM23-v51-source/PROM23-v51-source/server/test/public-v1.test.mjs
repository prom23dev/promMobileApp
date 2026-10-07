import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../app.mjs';
import { DEFAULT_HOME } from '../public-v1.mjs';

const catalog = { importedAt: '2026-09-11T15:00:00Z', products: Array.from({ length: 63 }, (_, i) => ({
  id: `p${i}`, sku: `SKU-${String(i).padStart(3, '0')}`, name: `Товар ${i}`, category: 'Инструменты', kind: 'tool',
  priceKopecks: 10000 + i, stock: 7, unit: 'шт.', specs: [], sectionIds: ['tools'],
  sourceUrl: 'https://example.invalid/catalog/item', imageFile: `p${i}.jpg`,
})) };
async function fixture(t, options = {}) {
  const app = createApp({ databasePath: ':memory:', catalog, catalogTree: {}, ...options });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  t.after(() => app.close());
  const base = `http://127.0.0.1:${app.server.address().port}`;
  return async (path, options) => {
    const response = await fetch(base + path, options);
    return { status: response.status, headers: response.headers, value: await response.json() };
  };
}

test('v1 is public, read-only and cannot turn snapshot flags into live write capabilities', async t => {
  const call = await fixture(t);
  const response = await call('/api/v1/app-config');
  assert.equal(response.status, 200);
  assert.equal(response.value.data.environment, 'preview');
  for (const [key, enabled] of Object.entries(response.value.data.capabilities)) {
    assert.equal(enabled, ['publicCatalog', 'homeConfiguration'].includes(key), key);
  }
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  for (const path of ['/api/v1/app-config', '/api/v1/home', '/api/v1/catalog']) {
    assert.equal((await call(path, { method: 'POST' })).status, 405);
  }
  assert.equal((await call('/api/v1/orders')).status, 404);
  assert.equal((await call('/api/v1/home', { headers: { Origin: 'https://foreign.invalid' } })).status, 403);
});

test('home preserves approved order and immutable IDs; invalid config safely falls back', async t => {
  const call = await fixture(t);
  assert.deepEqual((await call('/api/v1/home')).value.data, DEFAULT_HOME);
  const reordered = { schemaVersion: 1, revision: 'home-v7-2', blocks: [DEFAULT_HOME.blocks[0], DEFAULT_HOME.blocks[3], DEFAULT_HOME.blocks[1]] };
  assert.deepEqual((await (await fixture(t, { home: reordered }))('/api/v1/home')).value.data, reordered);
  for (const home of [
    { ...reordered, blocks: [{ ...reordered.blocks[0], id: 'reused-business-id' }] },
    { ...reordered, blocks: [reordered.blocks[0], reordered.blocks[0]] },
    { ...reordered, blocks: [{ ...reordered.blocks[0], url: 'https://foreign.invalid' }] },
    { ...reordered, blocks: [{ id: 'home-webview', type: 'webview', enabled: true }] },
    { ...reordered, schemaVersion: 99 },
  ]) assert.deepEqual((await (await fixture(t, { home }))('/api/v1/home')).value.data, DEFAULT_HOME);
  const missing = await fixture(t, { homePath: '/does-not-exist/home.json' });
  assert.deepEqual((await missing('/api/v1/home')).value.data, DEFAULT_HOME);
});

test('catalog walks bounded pages without missing/duplicate SKUs and never presents sandbox stock as live', async t => {
  const call = await fixture(t);
  const ids = [];
  let cursor = null;
  do {
    const response = await call('/api/v1/catalog?limit=17' + (cursor ? `&cursor=${cursor}` : ''));
    assert.equal(response.status, 200);
    const data = response.value.data;
    assert.ok(data.products.length <= 17);
    assert.equal(data.page.total, 63);
    assert.equal(data.provenance.mode, 'public-snapshot');
    assert.equal(data.provenance.importedAt, new Date(catalog.importedAt).toISOString());
    assert.equal(data.provenance.regionalPricing, false);
    assert.equal(data.provenance.checkoutEligible, false);
    assert.ok(data.products.every(p => p.stock === null && p.stockSource === 'unverified' && p.priceSource === 'imported-snapshot'));
    ids.push(...data.products.map(product => product.id));
    cursor = data.page.nextCursor;
  } while (cursor);
  assert.deepEqual(ids, catalog.products.map(product => product.id));
  assert.equal(new Set(ids).size, ids.length);
});

test('cursor is bound to query, city, display context and page size; tampering/restart is rejected', async t => {
  const call = await fixture(t);
  const cursor = (await call('/api/v1/catalog?limit=2')).value.data.page.nextCursor;
  for (const query of ['limit=3', 'limit=2&q=Товар', 'limit=2&city=Москва', 'limit=2&context=organization']) {
    const response = await call(`/api/v1/catalog?${query}&cursor=${cursor}`);
    assert.equal(response.status, 409);
    assert.equal(response.value.error.code, 'CURSOR_CONTEXT_CHANGED');
  }
  const [body, signature] = cursor.split('.');
  assert.equal((await call(`/api/v1/catalog?limit=2&cursor=${body}.${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`)).status, 409);
  const restarted = await fixture(t, { catalog: { ...catalog, products: catalog.products.slice(1) } });
  assert.equal((await restarted(`/api/v1/catalog?limit=2&cursor=${cursor}`)).value.error.code, 'CURSOR_EXPIRED');
});

test('query parser rejects duplicates, unknown context, unsafe limits/control bytes and oversized cursor', async t => {
  const call = await fixture(t);
  for (const query of ['limit=0', 'limit=51', 'limit=-1', 'limit=2.5', 'limit=01', 'limit=1&limit=2',
    'q=x&q=y', 'city=unknown', 'context=owner', 'context=organization-demo', 'userId=12', 'q=%00',
    `q=${'a'.repeat(121)}`, `cursor=${'a'.repeat(513)}`]) {
    const response = await call(`/api/v1/catalog?${query}`);
    assert.equal(response.status, 400, query);
  }
  assert.equal((await call('/api/v1/home?q=anything')).status, 400);
  assert.equal((await call('/api/catalog?limit=2')).status, 400);
  assert.equal((await call('/api/v1/catalog?q=' + 'x'.repeat(4096))).status, 414);
});

test('snapshot search is bounded and deterministic; city/company selection grants no personalized data', async t => {
  const call = await fixture(t);
  const search = (await call('/api/v1/catalog?q=%20sku-001%20')).value.data;
  assert.deepEqual(search.products.map(p => p.id), ['p1']);
  assert.equal(search.query.q, 'sku-001');
  const empty = (await call('/api/v1/catalog?q=absent')).value.data;
  assert.deepEqual([empty.products, empty.page.total, empty.page.nextCursor], [[], 0, null]);
  const personal = (await call('/api/v1/catalog')).value.data;
  const organization = (await call('/api/v1/catalog?city=Москва&context=organization')).value.data;
  assert.deepEqual(personal.products, organization.products);
  assert.deepEqual(personal.provenance, organization.provenance);
});

test('missing snapshot stays empty and does not become a successful live catalog', async t => {
  const call = await fixture(t, { catalog: { products: [{}] } });
  const data = (await call('/api/v1/catalog')).value.data;
  assert.deepEqual(data.products, []);
  assert.equal(data.page.nextCursor, null);
  assert.equal(data.provenance.checkoutEligible, false);
  assert.equal((await call('/health')).value.data.catalogLoaded, false);
});

test('public projection strips unsafe asset/source metadata and bounds response size', async t => {
  const call = await fixture(t, { catalog: { products: [{ ...catalog.products[0], imageFile: '../private.key',
    sourceUrl: 'https://user:secret@example.invalid/', importedAt: { arbitrary: true },
    specs: [{ label: 'Материал', value: 'Сталь', privateField: 'do-not-export' }] }] } });
  const product = (await call('/api/v1/catalog')).value.data.products[0];
  assert.deepEqual([product.imageFile, product.sourceUrl, product.importedAt], [null, null, null]);
  assert.deepEqual(product.specs, [{ label: 'Материал', value: 'Сталь' }]);
  const large = await fixture(t, { catalog: { products: [{ ...catalog.products[0], name: 'x'.repeat(1024 * 1024) }] } });
  const response = await large('/api/v1/catalog');
  assert.equal(response.status, 503);
  assert.equal(response.value.error.code, 'CATALOG_RESPONSE_TOO_LARGE');
});

test('old price is optional source data and survives only as a safe integer above current price', async t => {
  const call = await fixture(t, { catalog: { products: [15000, 10000, -1, 15000.5, '15000', undefined].map((oldPriceKopecks, i) => ({
    ...catalog.products[i], priceKopecks: 10000, oldPriceKopecks,
  })) } });
  for (const route of ['/api/catalog', '/api/v1/catalog']) {
    const products = (await call(route)).value.data.products;
    assert.equal(products[0].oldPriceKopecks, 15000);
    assert.ok(products.slice(1).every(product => !Object.hasOwn(product, 'oldPriceKopecks')));
    assert.ok(products.every(product => product.priceKopecks === 10000));
  }
});
