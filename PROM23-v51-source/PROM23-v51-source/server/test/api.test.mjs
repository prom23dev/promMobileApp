import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../app.mjs';

const catalog = {
  importedAt: '2026-09-11T09:00:00.000Z',
  products: Array.from({ length: 4 }, (_, index) => ({
    id: `p${index + 1}`, sku: `TEST-${index + 1}`, name: `Тестовый товар ${index + 1}`,
    category: index < 2 ? 'Инструменты' : 'Оборудование', kind: index < 2 ? 'tool' : 'equipment',
    priceKopecks: 10005 + index, stock: 5, unit: 'шт.', specs: [],
    imageFile: `p${index + 1}.jpg`, sourceUrl: 'https://example.invalid/product',
    availabilityText: 'Тестовый лимит', priceSource: 'test-fixture', stockSource: 'test-fixture',
  })),
};

async function fixture(t, options = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'prom23-api-'));
  const databasePath = join(directory, 'test.sqlite');
  let clock = Date.parse('2026-09-11T10:00:00.000Z');
  let app;
  let base;
  async function open() {
    // This suite explicitly exercises synthetic tariffs/orders, never a public preview.
    app = createApp({ databasePath, catalog, now: () => clock, allowTestFixtureOperations: true, ...options });
    await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${app.server.address().port}`;
  }
  await open();
  t.after(async () => { await app.close(); rmSync(directory, { recursive: true, force: true }); });
  async function call(path, { method = 'GET', token, body, headers = {}, raw } = {}) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        'X-Prom23-Functional': '1',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined || raw !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      ...(body !== undefined || raw !== undefined ? { body: raw ?? JSON.stringify(body) } : {}),
    });
    const payload = response.status === 204 ? null : await response.json();
    return { status: response.status, payload, headers: response.headers };
  }
  async function session() {
    const response = await call('/api/sessions', { method: 'POST', body: {} });
    assert.equal(response.status, 201);
    return response.payload.data.token;
  }
  async function action(token, body) {
    const current = await call('/api/state', { token });
    return call('/api/actions', { method: 'POST', token, body: { expectedContext: current.payload.data?.context ?? 'personal', ...body } });
  }
  async function quote(token, context = 'personal', extra = {}) {
    return call('/api/quotes', { method: 'POST', token, body: { context, deliveryMethod: 'pickup', ...extra } });
  }
  async function order(token, quoteId, key = 'request_12345') {
    return call('/api/orders', { method: 'POST', token, body: { quoteId }, headers: { 'Idempotency-Key': key } });
  }
  function seedHistoricalServiceRecords(orderId) {
    // Test-only fixture for data written by the earlier sandbox iteration, not a new public workflow.
    const db = new DatabaseSync(databasePath);
    try {
      const row = db.prepare('SELECT session_hash, context FROM orders WHERE id = ?').get(orderId);
      const shared = { context: row.context, orderId, status: 'test-received', createdAt: new Date(clock).toISOString(), mode: 'local-sandbox' };
      const appeal = { ...shared, id: `legacy-appeal-${orderId}`, number: 'О-000001', topic: 'Ранняя тестовая запись', message: '<script>plain text</script>' };
      const returned = { ...shared, id: `legacy-return-${orderId}`, number: 'В-000001', reason: 'Ранняя тестовая запись', message: '' };
      db.prepare('INSERT INTO appeals(id, session_hash, context, json) VALUES (?, ?, ?, ?)').run(appeal.id, row.session_hash, row.context, JSON.stringify(appeal));
      db.prepare('INSERT INTO returns(id, session_hash, context, order_id, json) VALUES (?, ?, ?, ?, ?)').run(returned.id, row.session_hash, row.context, orderId, JSON.stringify(returned));
    } finally { db.close(); }
  }
  return { call, session, action, quote, order, databasePath, seedHistoricalServiceRecords,
    advance: milliseconds => { clock += milliseconds; },
    reopen: async () => { await app.close(); await open(); },
    stop: () => app.close(),
  };
}

test('health/catalog disclose sandbox, snapshot metadata, and new product kinds', async t => {
  const api = await fixture(t);
  const health = await api.call('/health');
  assert.equal(health.status, 200);
  assert.deepEqual([health.payload.data.mode, health.payload.data.catalogLoaded, health.payload.data.productCount], ['local-sandbox', true, 4]);
  const response = await api.call('/api/catalog');
  assert.equal(response.payload.data.importedAt, catalog.importedAt);
  assert.deepEqual(response.payload.data.categories, ['Инструменты', 'Оборудование']);
  assert.equal(response.payload.data.products[0].priceKopecks, 10005);
  assert.equal(response.payload.data.products[2].kind, 'equipment');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('missing or invalid seed keeps health explicit and catalog empty', async t => {
  const api = await fixture(t, { catalog: undefined, catalogPath: join(tmpdir(), `absent-${Date.now()}.json`) });
  const health = await api.call('/health');
  assert.equal(health.payload.data.catalogSeedStatus, 'missing');
  assert.equal(health.payload.data.catalogLoaded, false);
  assert.deepEqual((await api.call('/api/catalog')).payload.data.products, []);
  const invalid = await fixture(t, { catalog: { products: [{ id: 'invalid' }] } });
  assert.equal((await invalid.call('/health')).payload.data.catalogSeedStatus, 'invalid');
});

test('opaque tokens isolate state and are stored only as hashes', async t => {
  const api = await fixture(t);
  const first = await api.session();
  const second = await api.session();
  assert.notEqual(first, second);
  assert.match(first, /^[A-Za-z0-9_-]{43}$/);
  assert.equal((await api.call('/api/state')).status, 401);
  assert.equal((await api.call('/api/state', { token: 'x'.repeat(43) })).status, 401);
  await api.action(first, { type: 'quantity', productId: 'p1', quantity: 2 });
  await api.action(first, { type: 'favorite', productId: 'p2' });
  assert.deepEqual((await api.call('/api/state', { token: second })).payload.data.carts.personal, []);
  assert.deepEqual((await api.call('/api/state', { token: second })).payload.data.favorites, []);
  await api.stop();
  const db = new DatabaseSync(api.databasePath, { readOnly: true });
  const rows = db.prepare('SELECT token_hash FROM sessions').all();
  assert.equal(rows.length, 2);
  assert.ok(rows.every(row => row.token_hash.length === 64 && row.token_hash !== first && row.token_hash !== second));
  db.close();
});

test('personal and organization baskets stay separate and unknown organizations are rejected', async t => {
  const api = await fixture(t);
  const token = await api.session();
  await api.action(token, { type: 'quantity', productId: 'p1', quantity: 2 });
  await api.action(token, { type: 'context', context: 'organization-demo' });
  await api.action(token, { type: 'quantity', productId: 'p2', quantity: 3 });
  const state = (await api.call('/api/state', { token })).payload.data;
  assert.deepEqual(state.carts.personal, [{ productId: 'p1', quantity: 2 }]);
  assert.deepEqual(state.carts['organization-demo'], [{ productId: 'p2', quantity: 3 }]);
  assert.equal((await api.action(token, { type: 'context', context: 'real-company' })).status, 400);
  assert.equal((await api.quote(token, 'personal')).payload.error.code, 'CONTEXT_CHANGED');
});

test('view history puts the last opened product first, deduplicates and retains only thirty products', async t => {
  const extendedCatalog = { ...catalog, products: Array.from({ length: 35 }, (_, index) => ({
    ...catalog.products[0], id: `p${index + 1}`, sku: `HISTORY-${index + 1}`,
  })) };
  const api = await fixture(t, { catalog: extendedCatalog });
  const token = await api.session();
  for (const productId of ['p1', 'p2', 'p3', 'p2', 'p2']) {
    assert.equal((await api.action(token, { type: 'view', productId })).status, 200);
  }
  assert.deepEqual((await api.call('/api/state', { token })).payload.data.viewed.personal, ['p2', 'p3', 'p1']);
  for (const product of extendedCatalog.products) {
    assert.equal((await api.action(token, { type: 'view', productId: product.id })).status, 200);
  }
  assert.deepEqual((await api.call('/api/state', { token })).payload.data.viewed.personal,
    Array.from({ length: 30 }, (_, index) => `p${35 - index}`));
  const revisited = (await api.action(token, { type: 'view', productId: 'p1' })).payload.data;
  assert.deepEqual(revisited.viewed.personal, ['p1', ...Array.from({ length: 29 }, (_, index) => `p${35 - index}`)]);
  assert.deepEqual(revisited.viewed['organization-demo'], []);
});

test('view history remains isolated by session and purchase context across SQLite reopen', async t => {
  const api = await fixture(t);
  const first = await api.session();
  const second = await api.session();
  await api.action(first, { type: 'view', productId: 'p1' });
  await api.action(first, { type: 'view', productId: 'p2' });
  await api.action(first, { type: 'context', context: 'organization-demo' });
  await api.action(first, { type: 'view', productId: 'p3' });
  await api.action(second, { type: 'view', productId: 'p4' });
  await api.reopen();
  const firstState = (await api.call('/api/state', { token: first })).payload.data;
  assert.equal(firstState.context, 'organization-demo');
  assert.deepEqual(firstState.viewed, { personal: ['p2', 'p1'], business: [], 'organization-demo': ['p3'] });
  assert.deepEqual((await api.call('/api/state', { token: second })).payload.data.viewed,
    { personal: ['p4'], business: [], 'organization-demo': [] });
  const switched = await api.action(first, { type: 'context', context: 'personal' });
  assert.deepEqual(switched.payload.data.viewed, firstState.viewed);
  assert.equal(switched.payload.data.context, 'personal');
});

test('clear-viewed clears only current context and reset clears both without modifying another session', async t => {
  const api = await fixture(t);
  const first = await api.session();
  const second = await api.session();
  await api.action(first, { type: 'view', productId: 'p1' });
  await api.action(first, { type: 'favorite', productId: 'p1' });
  await api.action(first, { type: 'quantity', productId: 'p1', quantity: 2 });
  await api.action(first, { type: 'context', context: 'organization-demo' });
  await api.action(first, { type: 'view', productId: 'p2' });
  await api.action(first, { type: 'quantity', productId: 'p2', quantity: 1 });
  await api.action(second, { type: 'view', productId: 'p4' });
  const before = (await api.call('/api/state', { token: first })).payload.data;
  const cleared = await api.action(first, { type: 'clear-viewed' });
  assert.equal(cleared.status, 200);
  assert.deepEqual(cleared.payload.data, { ...before, viewed: { personal: ['p1'], business: [], 'organization-demo': [] } });
  assert.deepEqual((await api.action(first, { type: 'clear-viewed' })).payload.data, cleared.payload.data);
  await api.reopen();
  assert.deepEqual((await api.call('/api/state', { token: first })).payload.data, cleared.payload.data);
  await api.action(first, { type: 'view', productId: 'p3' });
  const reset = await api.action(first, { type: 'reset' });
  assert.equal(reset.status, 200);
  assert.equal(reset.payload.data.context, 'personal');
  assert.deepEqual(reset.payload.data.viewed, { personal: [], business: [], 'organization-demo': [] });
  await api.reopen();
  assert.deepEqual((await api.call('/api/state', { token: first })).payload.data.viewed, reset.payload.data.viewed);
  assert.deepEqual((await api.call('/api/state', { token: second })).payload.data.viewed,
    { personal: ['p4'], business: [], 'organization-demo': [] });
});

test('invalid view actions and stale context cannot change or clear either history', async t => {
  const api = await fixture(t);
  const token = await api.session();
  await api.action(token, { type: 'view', productId: 'p1' });
  await api.action(token, { type: 'context', context: 'organization-demo' });
  await api.action(token, { type: 'view', productId: 'p2' });
  const before = (await api.call('/api/state', { token })).payload.data;
  for (const action of [{ type: 'view', productId: 'p3' }, { type: 'clear-viewed' }]) {
    assert.equal((await api.call('/api/actions', { method: 'POST', token, body: action })).status, 400);
    const stale = await api.call('/api/actions', { method: 'POST', token, body: { ...action, expectedContext: 'personal' } });
    assert.equal(stale.status, 409);
    assert.equal(stale.payload.error.code, 'STALE_CONTEXT');
  }
  const missing = await api.action(token, { type: 'view', productId: 'unknown-product' });
  assert.equal(missing.status, 404);
  assert.equal(missing.payload.error.code, 'PRODUCT_NOT_FOUND');
  for (const action of [
    { type: 'view' }, { type: 'view', productId: null }, { type: 'view', productId: 1 },
    { type: 'view', productId: 'p3', viewed: ['p4'] }, { type: 'clear-viewed', context: 'personal' },
  ]) assert.equal((await api.action(token, action)).status, 400);
  assert.deepEqual((await api.call('/api/state', { token })).payload.data, before);
});

test('legacy sessions without viewed are normalized without losing stored baskets or favorites', async t => {
  const api = await fixture(t);
  const token = await api.session();
  await api.action(token, { type: 'favorite', productId: 'p1' });
  await api.action(token, { type: 'quantity', productId: 'p2', quantity: 2 });
  await api.action(token, { type: 'context', context: 'organization-demo' });
  const before = (await api.call('/api/state', { token })).payload.data;
  const { viewed, ...legacy } = before;
  const db = new DatabaseSync(api.databasePath);
  try {
    // Model the pre-history persisted schema; this fixture has exactly one local session.
    db.prepare('UPDATE sessions SET state_json = ?').run(JSON.stringify(legacy));
  } finally { db.close(); }
  await api.reopen();
  assert.deepEqual((await api.call('/api/state', { token })).payload.data, before);
  const opened = await api.action(token, { type: 'view', productId: 'p3' });
  assert.equal(opened.status, 200);
  assert.deepEqual(opened.payload.data, { ...before, viewed: { personal: [], business: [], 'organization-demo': ['p3'] } });
  await api.reopen();
  assert.deepEqual((await api.call('/api/state', { token })).payload.data, opened.payload.data);
});

test('quantity validation rejects bad values, unknown products and client-supplied prices', async t => {
  const api = await fixture(t);
  const token = await api.session();
  for (const quantity of [-1, 1.5, '2', null, 1000, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal((await api.action(token, { type: 'quantity', productId: 'p1', quantity })).status, 400);
  }
  assert.equal((await api.action(token, { type: 'quantity', productId: 'p1', quantity: 6 })).payload.error.code, 'TEST_STOCK_LIMIT');
  assert.equal((await api.action(token, { type: 'quantity', productId: 'absent', quantity: 1 })).status, 404);
  assert.equal((await api.action(token, { type: 'quantity', productId: 'p1', quantity: 1, priceKopecks: 1 })).status, 400);
  assert.equal((await api.action(token, { type: 'quantity', product: catalog.products[0], quantity: 1 })).status, 400);
  await api.action(token, { type: 'quantity', productId: 'p1', quantity: 5 });
  await api.action(token, { type: 'quantity', productId: 'p1', quantity: 0 });
  assert.deepEqual((await api.call('/api/state', { token })).payload.data.carts.personal, []);
});

test('comparison retains six products after reopen, rejects the seventh and permits removing one', async t => {
  const api = await fixture(t, { catalog: { ...catalog, products: Array.from({ length: 7 }, (_, i) => ({
    ...catalog.products[0], id: `p${i + 1}`, sku: `TEST-${i + 1}`,
  })) } });
  const token = await api.session();
  for (const productId of ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']) assert.equal((await api.action(token, { type: 'compare', productId })).status, 200);
  await api.reopen();
  assert.deepEqual((await api.call('/api/state', { token })).payload.data.comparison, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
  assert.equal((await api.action(token, { type: 'compare', productId: 'p7' })).payload.error.code, 'COMPARISON_LIMIT');
  await api.action(token, { type: 'compare', productId: 'p2' });
  assert.equal((await api.action(token, { type: 'compare', productId: 'p7' })).status, 200);
  await api.action(token, { type: 'favorite', productId: 'p1' });
  await api.action(token, { type: 'favorite', productId: 'p1' });
  await api.action(token, { type: 'city', city: 'Тестовый город' });
  const state = (await api.call('/api/state', { token })).payload.data;
  assert.equal(state.city, 'Тестовый город');
  assert.deepEqual(state.favorites, []);
  assert.equal((await api.action(token, { type: 'city', city: '' })).status, 400);
  assert.equal((await api.action(token, { type: 'unknown' })).status, 400);
  await api.action(token, { type: 'reset' });
  assert.equal((await api.call('/api/state', { token })).payload.data.city, '');
  assert.deepEqual((await api.call('/api/state', { token })).payload.data.comparison, []);
});

test('legacy comparison state is normalized to six unique strings without changing either cart', async t => {
  const api = await fixture(t);
  const token = await api.session();
  await api.action(token, { type: 'quantity', productId: 'p1', quantity: 2 });
  const db = new DatabaseSync(api.databasePath);
  try {
    const row = db.prepare('SELECT token_hash, state_json FROM sessions').get();
    const state = JSON.parse(row.state_json);
    state.comparison = ['p1', 'p1', false, '', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7'];
    db.prepare('UPDATE sessions SET state_json = ? WHERE token_hash = ?').run(JSON.stringify(state), row.token_hash);
  } finally { db.close(); }
  const state = (await api.call('/api/state', { token })).payload.data;
  assert.deepEqual(state.comparison, ['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
  assert.deepEqual(state.carts, { personal: [{ productId: 'p1', quantity: 2 }], business: [], 'organization-demo': [] });
});

test('quotes use server prices, exact kopecks, test delivery tariffs and context addresses', async t => {
  const api = await fixture(t);
  const token = await api.session();
  assert.equal((await api.quote(token)).payload.error.code, 'EMPTY_CART');
  await api.action(token, { type: 'quantity', productId: 'p1', quantity: 3 });
  const addresses = (await api.call('/api/addresses', { token })).payload.data;
  assert.equal(addresses[0].synthetic, true);
  assert.equal((await api.quote(token, 'personal', { deliveryMethod: 'courier' })).payload.error.code, 'ADDRESS_REQUIRED');
  assert.equal((await api.quote(token, 'personal', { deliveryMethod: 'courier', addressId: 'example-organization' })).status, 400);
  const quote = (await api.quote(token, 'personal', { deliveryMethod: 'courier', addressId: addresses[0].id })).payload.data;
  assert.equal(quote.items[0].unitPriceKopecks, 10005);
  assert.equal(quote.subtotalKopecks, 30015);
  assert.equal(quote.deliveryKopecks, 49000);
  assert.equal(quote.totalKopecks, 79015);
  assert.equal(quote.currency, 'RUB');
  assert.match(quote.deliveryLabel, /Тестовая/);
  assert.equal((await api.quote(token, 'personal', { totalKopecks: 1 })).status, 400);
});

test('order creation is atomic and idempotent; new-key quote replay and key conflict fail', async t => {
  const api = await fixture(t);
  const token = await api.session();
  await api.action(token, { type: 'quantity', productId: 'p1', quantity: 2 });
  const quote = (await api.quote(token)).payload.data;
  const results = await Promise.all([api.order(token, quote.id), api.order(token, quote.id)]);
  assert.deepEqual(results.map(result => result.status), [201, 201]);
  assert.equal(results[0].payload.data.id, results[1].payload.data.id);
  assert.equal(results[0].payload.data.totalKopecks, 20010);
  assert.equal(results[0].payload.data.status, 'test-created');
  assert.equal((await api.call('/api/orders', { token })).payload.data.length, 1);
  assert.deepEqual((await api.call('/api/state', { token })).payload.data.carts.personal, []);
  assert.equal((await api.order(token, quote.id, 'different_key')).payload.error.code, 'QUOTE_USED');
  await api.action(token, { type: 'quantity', productId: 'p2', quantity: 1 });
  const otherQuote = (await api.quote(token)).payload.data;
  assert.equal((await api.order(token, otherQuote.id)).payload.error.code, 'IDEMPOTENCY_CONFLICT');
  assert.equal((await api.call('/api/orders', { method: 'POST', token, body: { quoteId: otherQuote.id } })).status, 400);
  assert.equal((await api.call('/api/orders', { token })).payload.data.length, 1);
});

test('orders reject expired quotes and changed carts without clearing the cart', async t => {
  const api = await fixture(t, { quoteTtlMs: 1000 });
  const token = await api.session();
  await api.action(token, { type: 'quantity', productId: 'p1', quantity: 1 });
  const expired = (await api.quote(token)).payload.data;
  api.advance(1000);
  assert.equal((await api.order(token, expired.id)).payload.error.code, 'QUOTE_EXPIRED');
  const changed = (await api.quote(token)).payload.data;
  await api.action(token, { type: 'quantity', productId: 'p1', quantity: 2 });
  assert.equal((await api.order(token, changed.id)).payload.error.code, 'CART_CHANGED');
  assert.equal((await api.call('/api/state', { token })).payload.data.carts.personal[0].quantity, 2);
  assert.deepEqual((await api.call('/api/orders', { token })).payload.data, []);
});

test('quotes/orders are session scoped and checkout clears only the matching context cart', async t => {
  const api = await fixture(t);
  const first = await api.session();
  const second = await api.session();
  await api.action(first, { type: 'quantity', productId: 'p1', quantity: 1 });
  const personal = (await api.quote(first)).payload.data;
  assert.equal((await api.order(second, personal.id)).status, 404);
  await api.action(first, { type: 'context', context: 'organization-demo' });
  await api.action(first, { type: 'quantity', productId: 'p2', quantity: 2 });
  assert.equal((await api.order(first, personal.id)).payload.error.code, 'CONTEXT_CHANGED');
  const corporate = (await api.quote(first, 'organization-demo')).payload.data;
  const order = (await api.order(first, corporate.id)).payload.data;
  const state = (await api.call('/api/state', { token: first })).payload.data;
  assert.equal(state.carts.personal.length, 1);
  assert.deepEqual(state.carts['organization-demo'], []);
  assert.equal((await api.call(`/api/orders/${order.id}`, { token: second })).status, 404);
  await api.action(first, { type: 'context', context: 'personal' });
  assert.deepEqual((await api.call('/api/orders', { token: first })).payload.data, []);
  assert.equal((await api.call(`/api/orders/${order.id}`, { token: first })).status, 404);
  assert.equal((await api.call(`/api/orders/${order.id}/cancel`, { method: 'POST', token: first, body: {} })).status, 404);
});

test('cancellation is local, owner scoped, recorded once, and survives an idempotent retry', async t => {
  const api = await fixture(t);
  const token = await api.session();
  await api.action(token, { type: 'quantity', productId: 'p1', quantity: 1 });
  const quote = (await api.quote(token)).payload.data;
  const order = (await api.order(token, quote.id)).payload.data;
  const cancel = await api.call(`/api/orders/${order.id}/cancel`, { method: 'POST', token, body: {} });
  assert.equal(cancel.payload.data.status, 'test-cancelled');
  assert.ok(cancel.payload.data.cancelledAt);
  assert.equal((await api.call(`/api/orders/${order.id}/cancel`, { method: 'POST', token, body: {} })).payload.error.code, 'ORDER_ALREADY_CANCELLED');
  assert.equal((await api.order(token, quote.id)).payload.data.status, 'test-cancelled');
  assert.equal((await api.call('/api/returns', { method: 'POST', token, body: { orderId: order.id, reason: 'Тест' } })).payload.error.code, 'ORDER_NOT_COMPLETED');
});

test('appeal/return creation is blocked until site integration and historical data stays owner/context scoped', async t => {
  const api = await fixture(t);
  const first = await api.session();
  const second = await api.session();
  await api.action(first, { type: 'quantity', productId: 'p1', quantity: 1 });
  const quote = (await api.quote(first)).payload.data;
  const order = (await api.order(first, quote.id)).payload.data;
  const appealBody = { topic: 'Проверка', message: '<script>plain text</script>', orderId: order.id };
  assert.equal((await api.call('/api/appeals', { method: 'POST', token: second, body: appealBody })).status, 404);
  const appeal = await api.call('/api/appeals', { method: 'POST', token: first, body: appealBody });
  assert.equal(appeal.status, 503);
  assert.equal(appeal.payload.error.code, 'APPEAL_INTEGRATION_REQUIRED');
  assert.equal((await api.call('/api/appeals', { method: 'POST', token: first, body: {} })).payload.error.code, 'APPEAL_INTEGRATION_REQUIRED');
  const returnBody = { orderId: order.id, reason: 'Проверка возврата', message: 'Вымышленная заявка' };
  assert.equal((await api.call('/api/returns', { method: 'POST', token: second, body: returnBody })).status, 404);
  assert.equal((await api.call('/api/returns', { method: 'POST', token: first, body: returnBody })).payload.error.code, 'ORDER_NOT_COMPLETED');
  assert.deepEqual((await api.call('/api/appeals', { token: first })).payload.data, []);
  assert.deepEqual((await api.call('/api/returns', { token: first })).payload.data, []);
  api.seedHistoricalServiceRecords(order.id);
  assert.equal((await api.call('/api/appeals', { token: first })).payload.data.length, 1);
  assert.equal((await api.call('/api/returns', { token: first })).payload.data.length, 1);
  assert.equal((await api.call('/api/appeals', { token: first })).payload.data[0].message, '<script>plain text</script>');
  assert.deepEqual((await api.call('/api/appeals', { token: second })).payload.data, []);
  await api.action(first, { type: 'context', context: 'organization-demo' });
  assert.deepEqual((await api.call('/api/appeals', { token: first })).payload.data, []);
  assert.deepEqual((await api.call('/api/returns', { token: first })).payload.data, []);
  assert.equal((await api.call('/api/appeals', { method: 'POST', token: first, body: appealBody })).status, 404);
});

test('SQLite reopen preserves baskets, preferences, orders, appeals, returns and idempotency', async t => {
  const api = await fixture(t);
  const token = await api.session();
  await api.action(token, { type: 'favorite', productId: 'p2' });
  await api.action(token, { type: 'quantity', productId: 'p1', quantity: 1 });
  const quote = (await api.quote(token)).payload.data;
  const order = (await api.order(token, quote.id)).payload.data;
  await api.action(token, { type: 'quantity', productId: 'p3', quantity: 2 });
  api.seedHistoricalServiceRecords(order.id);
  await api.reopen();
  const state = (await api.call('/api/state', { token })).payload.data;
  assert.deepEqual(state.favorites, ['p2']);
  assert.deepEqual(state.carts.personal, [{ productId: 'p3', quantity: 2 }]);
  assert.equal((await api.call('/api/orders', { token })).payload.data[0].id, order.id);
  assert.equal((await api.call('/api/appeals', { token })).payload.data.length, 1);
  assert.equal((await api.call('/api/returns', { token })).payload.data.length, 1);
  assert.equal((await api.order(token, quote.id)).payload.data.id, order.id);
  assert.deepEqual((await api.call('/api/state', { token })).payload.data.carts.personal, [{ productId: 'p3', quantity: 2 }]);
});

test('strict origins, bounded bodies, JSON format and exact routes/methods are enforced', async t => {
  const api = await fixture(t);
  const token = await api.session();
  for (const origin of ['https://attacker.example', 'null', 'http://localhost:9999', 'http://localhost:8087.evil.example']) {
    const response = await api.call('/api/actions', { method: 'POST', token, body: { type: 'reset' }, headers: { Origin: origin } });
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  }
  const allowed = await api.call('/api/state', { token, headers: { Origin: 'http://localhost:8087' } });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:8087');
  assert.equal((await api.call('/api/actions', { method: 'POST', token, raw: 'x'.repeat(32769) })).status, 413);
  assert.equal((await api.call('/api/actions', { method: 'POST', token, raw: '{bad' })).status, 400);
  assert.equal((await api.call('/api/actions', { method: 'POST', token, raw: '{}', headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await api.call('/api/state/', { token })).status, 404);
  assert.equal((await api.call('/api/state-extra', { token })).status, 404);
  assert.equal((await api.call('/api/state?token=ignored', { token })).status, 400);
  assert.equal((await api.call('/api/state', { method: 'POST', token, body: {} })).status, 405);
  assert.equal((await api.call('/api/actions', { method: 'OPTIONS', headers: { Origin: 'http://localhost:8081', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type' } })).status, 204);
  assert.equal((await api.call('/api/actions', { method: 'OPTIONS', headers: { Origin: 'http://localhost:8081', 'Access-Control-Request-Method': 'PUT' } })).status, 405);
});

test('deleting a local session cascades its data, revokes token, and preserves another session', async t => {
  const api = await fixture(t);
  const first = await api.session();
  const second = await api.session();
  await api.action(first, { type: 'view', productId: 'p1' });
  await api.action(first, { type: 'context', context: 'organization-demo' });
  await api.action(first, { type: 'view', productId: 'p3' });
  await api.action(first, { type: 'context', context: 'personal' });
  await api.action(second, { type: 'view', productId: 'p4' });
  await api.action(first, { type: 'quantity', productId: 'p1', quantity: 1 });
  const quote = (await api.quote(first)).payload.data;
  const order = (await api.order(first, quote.id)).payload.data;
  api.seedHistoricalServiceRecords(order.id);
  await api.action(second, { type: 'favorite', productId: 'p2' });
  const deleted = await api.call('/api/session', { method: 'DELETE', token: first });
  assert.deepEqual(deleted.payload.data, { deleted: true, mode: 'local-sandbox' });
  assert.equal((await api.call('/api/state', { token: first })).status, 401);
  assert.equal((await api.order(first, quote.id)).status, 401);
  assert.equal((await api.call('/api/session', { method: 'DELETE', token: first })).status, 401);
  assert.deepEqual((await api.call('/api/state', { token: second })).payload.data.favorites, ['p2']);
  assert.equal((await api.action(first, { type: 'view', productId: 'p2' })).status, 401);
  await api.reopen();
  assert.equal((await api.call('/api/state', { token: first })).status, 401);
  assert.deepEqual((await api.call('/api/state', { token: second })).payload.data.viewed,
    { personal: ['p4'], business: [], 'organization-demo': [] });
  await api.stop();
  const db = new DatabaseSync(api.databasePath, { readOnly: true });
  for (const table of ['quotes', 'orders', 'idempotency', 'appeals', 'returns']) {
    assert.equal(db.prepare(`SELECT count(*) AS count FROM ${table}`).get().count, 0);
  }
  assert.equal(db.prepare('SELECT count(*) AS count FROM sessions').get().count, 1);
  assert.deepEqual(JSON.parse(db.prepare('SELECT state_json FROM sessions').get().state_json).viewed,
    { personal: ['p4'], business: [], 'organization-demo': [] });
  db.close();
});

test('configured origins replace defaults and reject wildcards or URL paths', async t => {
  const api = await fixture(t, { allowedOrigins: ['http://127.0.0.1:18087'] });
  const allowed = await api.call('/health', { headers: { Origin: 'http://127.0.0.1:18087' } });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://127.0.0.1:18087');
  assert.equal((await api.call('/health', { headers: { Origin: 'http://localhost:8087' } })).status, 403);
  for (const allowedOrigins of [['*'], ['https://example.invalid/'], ['null']]) {
    assert.throws(() => createApp({ databasePath: ':memory:', allowedOrigins }), /exact http/);
  }
});

test('session quota returns 429 without deleting sessions and deletion releases capacity', async t => {
  const api = await fixture(t, { limits: { maxSessions: 2 } });
  const first = await api.session();
  const second = await api.session();
  const rejected = await api.call('/api/sessions', { method: 'POST', body: {} });
  assert.equal(rejected.status, 429);
  assert.equal(rejected.payload.error.code, 'SESSION_LIMIT');
  assert.equal((await api.call('/api/state', { token: first })).status, 200);
  await api.call('/api/session', { method: 'DELETE', token: first });
  assert.ok(await api.session());
  assert.equal((await api.call('/api/state', { token: second })).status, 200);
});

test('quote quota is per session; expired unused quotes are pruned while consumed history survives', async t => {
  const api = await fixture(t, { quoteTtlMs: 1000, limits: { maxQuotesPerSession: 2 } });
  const first = await api.session();
  const second = await api.session();
  await api.action(first, { type: 'quantity', productId: 'p1', quantity: 1 });
  const used = (await api.quote(first)).payload.data;
  const order = (await api.order(first, used.id)).payload.data;
  await api.action(first, { type: 'quantity', productId: 'p2', quantity: 1 });
  const unused = (await api.quote(first)).payload.data;
  assert.equal((await api.quote(first)).payload.error.code, 'QUOTE_LIMIT');
  await api.action(second, { type: 'quantity', productId: 'p1', quantity: 1 });
  assert.equal((await api.quote(second)).status, 201);
  api.advance(1000);
  assert.equal((await api.quote(first)).status, 201);
  assert.equal((await api.order(first, unused.id, 'pruned_request')).payload.error.code, 'QUOTE_NOT_FOUND');
  assert.equal((await api.order(first, used.id)).payload.data.id, order.id);
  assert.equal((await api.quote(first)).status, 429);
  assert.equal((await api.call('/api/orders', { token: first })).payload.data[0].id, order.id);
  await api.stop();
  const db = new DatabaseSync(api.databasePath, { readOnly: true });
  assert.equal(db.prepare('SELECT count(*) AS count FROM quotes').get().count, 3);
  assert.ok(db.prepare('SELECT id FROM quotes WHERE id = ?').get(used.id));
  assert.equal(db.prepare('SELECT id FROM quotes WHERE id = ?').get(unused.id), undefined);
  db.close();
});

test('order quota spans both contexts, preserves state and allows safe order retries', async t => {
  const api = await fixture(t, { limits: { maxOrdersPerSession: 1 } });
  const token = await api.session();
  await api.action(token, { type: 'quantity', productId: 'p1', quantity: 1 });
  const firstQuote = (await api.quote(token)).payload.data;
  const firstOrder = (await api.order(token, firstQuote.id)).payload.data;
  assert.equal((await api.order(token, firstQuote.id)).payload.data.id, firstOrder.id);
  await api.action(token, { type: 'context', context: 'organization-demo' });
  await api.action(token, { type: 'quantity', productId: 'p2', quantity: 2 });
  const corporateQuote = (await api.quote(token, 'organization-demo')).payload.data;
  const rejected = await api.order(token, corporateQuote.id, 'corporate_request');
  assert.equal(rejected.status, 429);
  assert.equal(rejected.payload.error.code, 'ORDER_LIMIT');
  assert.deepEqual((await api.call('/api/state', { token })).payload.data.carts['organization-demo'], [{ productId: 'p2', quantity: 2 }]);
  await api.action(token, { type: 'context', context: 'personal' });
  assert.equal((await api.call('/api/orders', { token })).payload.data[0].id, firstOrder.id);
});

test('SQLite page cap returns 429 STORAGE_LIMIT and rolls back without a generic 500', async t => {
  const largeCatalog = { ...catalog, products: catalog.products.map(product => ({ ...product, name: `${product.name} ${'x'.repeat(2000)}` })) };
  const api = await fixture(t, { catalog: largeCatalog, limits: { maxDatabasePages: 64, maxQuotesPerSession: 500 } });
  const token = await api.session();
  for (const product of largeCatalog.products) await api.action(token, { type: 'quantity', productId: product.id, quantity: 1 });
  let accepted = 0;
  let full;
  for (let index = 0; index < 500; index += 1) {
    const response = await api.quote(token);
    if (response.status !== 201) { full = response; break; }
    accepted += 1;
  }
  assert.ok(accepted > 0 && accepted < 500);
  assert.equal(full.status, 429);
  assert.equal(full.payload.error.code, 'STORAGE_LIMIT');
  assert.equal((await api.call('/health')).status, 200);
  assert.equal((await api.call('/api/state', { token })).payload.data.carts.personal.length, 4);
  await api.stop();
  const db = new DatabaseSync(api.databasePath, { readOnly: true });
  assert.equal(db.prepare('PRAGMA page_size').get().page_size, 4096);
  assert.ok(db.prepare('PRAGMA page_count').get().page_count <= 64);
  assert.equal(db.prepare('SELECT count(*) AS count FROM quotes').get().count, accepted);
  db.close();
});

test('every action requires expectedContext and stale tabs cannot modify either basket or preferences', async t => {
  const api = await fixture(t);
  const token = await api.session();
  await api.action(token, { type: 'quantity', productId: 'p1', quantity: 1 });
  await api.action(token, { type: 'context', context: 'organization-demo', expectedContext: 'personal' });
  await api.action(token, { type: 'quantity', productId: 'p2', quantity: 2 });
  const stateBefore = (await api.call('/api/state', { token })).payload.data;
  for (const action of [
    { type: 'quantity', productId: 'p1', quantity: 5 },
    { type: 'context', context: 'personal' },
    { type: 'city', city: 'Другой город' },
    { type: 'favorite', productId: 'p1' },
    { type: 'compare', productId: 'p1' },
    { type: 'reset' },
  ]) {
    const missing = await api.call('/api/actions', { method: 'POST', token, body: action });
    assert.equal(missing.status, 400);
    const stale = await api.call('/api/actions', { method: 'POST', token, body: { ...action, expectedContext: 'personal' } });
    assert.equal(stale.status, 409);
    assert.equal(stale.payload.error.code, 'STALE_CONTEXT');
  }
  assert.deepEqual((await api.call('/api/state', { token })).payload.data, stateBefore);
  const resumed = await api.action(token, { type: 'quantity', productId: 'p2', quantity: 3, expectedContext: 'organization-demo' });
  assert.equal(resumed.status, 200);
  assert.deepEqual(resumed.payload.data.carts.personal, [{ productId: 'p1', quantity: 1 }]);
  assert.deepEqual(resumed.payload.data.carts['organization-demo'], [{ productId: 'p2', quantity: 3 }]);
});

test('a completed historical order cannot bypass missing canonical return reasons and item flow', async t => {
  const api = await fixture(t);
  const token = await api.session();
  await api.action(token, { type: 'quantity', productId: 'p1', quantity: 1 });
  const quote = (await api.quote(token)).payload.data;
  const order = (await api.order(token, quote.id)).payload.data;
  // There is intentionally no API for fabricating completion; simulate a historical migration only.
  const db = new DatabaseSync(api.databasePath);
  db.prepare('UPDATE orders SET json = ? WHERE id = ?').run(JSON.stringify({ ...order, status: 'completed' }), order.id);
  db.close();
  const response = await api.call('/api/returns', { method: 'POST', token, body: { orderId: order.id } });
  assert.equal(response.status, 503);
  assert.equal(response.payload.error.code, 'RETURN_INTEGRATION_REQUIRED');
  assert.deepEqual((await api.call('/api/returns', { token })).payload.data, []);
});

test('catalog sections preserve a valid tree, reject broken parents/cycles, and remain optional for fixtures', async t => {
  const tree = { sourceUrl: 'https://example.invalid/catalog/', importedAt: catalog.importedAt, rootIds: ['root'], sections: [
    { id: 'root', name: 'Каталог', url: '/catalog/', parentId: null, children: ['child'], productIds: [] },
    { id: 'child', name: 'Раздел', url: '/catalog/section/', parentId: 'root', children: [], productIds: ['p1'] },
  ] };
  const api = await fixture(t, { catalogTree: tree, catalog: { ...catalog, products: catalog.products.map(product => ({ ...product, sectionIds: ['child'] })) } });
  assert.deepEqual((await api.call('/api/catalog-tree')).payload.data, tree);
  assert.deepEqual((await api.call('/api/catalog')).payload.data.products[0].sectionIds, ['child']);
  const missing = await fixture(t, { catalogTreePath: join(tmpdir(), 'absent-tree-prom23.json') });
  assert.deepEqual((await missing.call('/api/catalog-tree')).payload.data.sections, []);
  assert.deepEqual((await missing.call('/api/catalog')).payload.data.products[0].sectionIds, []);
  for (const broken of [
    { ...tree, sections: [tree.sections[0], { ...tree.sections[1], parentId: 'absent' }] },
    { ...tree, rootIds: [], sections: [{ ...tree.sections[0], parentId: 'child' }, { ...tree.sections[1], children: ['root'] }] },
  ]) {
    const invalid = await fixture(t, { catalogTree: broken });
    assert.deepEqual((await invalid.call('/api/catalog-tree')).payload.data.sections, []);
  }
});

test('inbox derives committed order events, isolates customers and persists read status', async t => {
  const api = await fixture(t); const token = await api.session(); const stranger = await api.session();
  await api.action(token, { type: 'quantity', productId: 'p1', quantity: 1 });
  const quote = await api.quote(token); const order = (await api.order(token, quote.payload.data.id)).payload.data;
  await api.order(token, quote.payload.data.id); // same idempotency key: no duplicate inbox event
  let response = await api.call('/api/notifications', { token });
  assert.equal(response.payload.data.items.length, 1);
  assert.equal(response.payload.data.items[0].orderId, order.id);
  assert.equal(response.payload.data.channels.push, 'not-configured');
  const id = response.payload.data.items[0].id;
  assert.equal((await api.call('/api/notifications/read', { method: 'POST', token: stranger, body: { expectedContext: 'personal', id } })).status, 404);
  assert.equal((await api.call('/api/notifications/read', { method: 'POST', token, body: { expectedContext: 'organization-demo', id } })).status, 409);
  assert.equal((await api.call('/api/notifications/read', { method: 'POST', token, body: { expectedContext: 'personal', id } })).status, 200);
  await api.reopen();
  assert.equal((await api.call('/api/notifications', { token })).payload.data.items[0].read, true);
  api.advance(5000);
  await api.call(`/api/orders/${order.id}/cancel`, { method: 'POST', token, body: {} });
  response = await api.call('/api/notifications', { token });
  assert.equal(response.payload.data.items.length, 2); assert.match(response.payload.data.items[0].id, /:cancelled$/);
  await api.action(token, { type: 'context', context: 'organization-demo' });
  assert.equal((await api.call('/api/notifications', { token })).payload.data.items.length, 0);
  assert.equal((await api.call('/api/notifications/read', { method: 'POST', token, body: { expectedContext: 'organization-demo', id } })).status, 404);
});

test('notification preferences are opt-in drafts, scoped, bounded and deleted with the session', async t => {
  const api = await fixture(t); const token = await api.session();
  let inbox = (await api.call('/api/notifications', { token })).payload.data;
  assert.equal(Object.values(inbox.preferences).every(value => value === false), true);
  const preferences = { ...inbox.preferences, pushOrders: true, emailMarketing: true };
  const call = body => api.call('/api/notification-preferences', { method: 'POST', token, body });
  assert.equal((await call({ expectedContext: 'personal', preferences: { ...preferences, arbitrary: true } })).status, 400);
  assert.equal((await call({ expectedContext: 'personal', preferences: { ...preferences, pushMarketing: 'true' } })).status, 400);
  assert.equal((await call({ expectedContext: 'organization-demo', preferences })).status, 409);
  const saved = await call({ expectedContext: 'personal', preferences });
  assert.equal(saved.status, 200); assert.equal(saved.payload.data.consentRecorded, false);
  await api.reopen();
  assert.deepEqual((await api.call('/api/notifications', { token })).payload.data.preferences, preferences);
  await api.action(token, { type: 'context', context: 'organization-demo' });
  assert.equal(Object.values((await api.call('/api/notifications', { token })).payload.data.preferences).every(value => value === false), true);
  await api.call('/api/session', { method: 'DELETE', token });
  const db = new DatabaseSync(api.databasePath);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM notification_preferences').get().n, 0);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM notification_reads').get().n, 0); db.close();
});

test('search history is normalized, bounded, persistent, context-isolated and clearable', async t => {
  const f = await fixture(t); const token = await f.session();
  await f.action(token, { type: 'search', query: '  Леса  рамные  ' });
  await f.action(token, { type: 'search', query: 'леса рамные' });
  let value = (await f.call('/api/state', { token })).payload.data;
  assert.deepEqual(value.searches.personal, ['леса рамные']);
  await f.action(token, { type: 'context', context: 'organization-demo' });
  await f.action(token, { type: 'search', query: 'Тент' });
  await f.reopen();
  value = (await f.call('/api/state', { token })).payload.data;
  assert.deepEqual(value.searches, { personal: ['леса рамные'], business: [], 'organization-demo': ['Тент'] });
  const other = await f.session(); assert.deepEqual((await f.call('/api/state', { token: other })).payload.data.searches.personal, []);
  for (const query of ['', '   ', 'x'.repeat(101), '<\u0001>', null, 123]) assert.equal((await f.action(token, { type: 'search', query })).status, 400);
  assert.equal((await f.action(token, { type: 'search', query: 'Wrong', expectedContext: 'personal' })).status, 409);
  for (let i = 0; i < 12; i++) await f.action(token, { type: 'search', query: 'Товар ' + i });
  value = (await f.call('/api/state', { token })).payload.data;
  assert.equal(value.searches['organization-demo'].length, 10);
  await f.action(token, { type: 'remove-search', query: 'ТОВАР 11' });
  value = (await f.call('/api/state', { token })).payload.data;
  assert.equal(value.searches['organization-demo'][0], 'Товар 10');
  await f.action(token, { type: 'clear-searches' });
  value = (await f.call('/api/state', { token })).payload.data;
  assert.deepEqual(value.searches, { personal: ['леса рамные'], business: [], 'organization-demo': [] });
});

test('optional history is off without consent and withdrawal purges all contexts without touching cart or favorites', async t => {
  const api = await fixture(t); const token = await api.session();
  await api.action(token, {type:'quantity',productId:'p1',quantity:1});
  await api.action(token, {type:'favorite',productId:'p1'});
  await api.action(token, {type:'view',productId:'p2'});
  await api.action(token, {type:'search',query:'леса'});
  const before = (await api.call('/api/state',{token})).payload.data;
  assert.deepEqual(before.viewed.personal,['p2']);
  const refused = (await api.call('/api/state',{token,headers:{'X-Prom23-Functional':'0'}})).payload.data;
  assert.ok(Object.values(refused.viewed).every(v=>v.length===0));
  assert.ok(Object.values(refused.searches).every(v=>v.length===0));
  assert.deepEqual(refused.carts,before.carts);assert.deepEqual(refused.favorites,before.favorites);
  for(const action of [{type:'view',productId:'p3'},{type:'search',query:'станки'}]) {
    const result=await api.call('/api/actions',{token,method:'POST',headers:{'X-Prom23-Functional':''},body:{...action,expectedContext:'personal'}});
    assert.equal(result.status,200);assert.deepEqual(result.payload.data.viewed.personal,[]);assert.deepEqual(result.payload.data.searches.personal,[]);
  }
  const favorite = await api.call('/api/actions',{token,method:'POST',headers:{'X-Prom23-Functional':'0'},body:{type:'favorite',productId:'p4',expectedContext:'personal'}}); assert.equal(favorite.status,422);
  const later=(await api.call('/api/state',{token})).payload.data;assert.deepEqual(later.viewed.personal,[]);
});
