import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createApp } from '../app.mjs';

const catalog = { products: [{ id: 'fixture-product', sku: 'FIXTURE', name: 'Fixture product', category: 'Tools',
  kind: 'tool', priceKopecks: 12345, stock: 5, unit: 'шт.', specs: [] }] };

async function fixture(t, options = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'prom23-fixture-gate-'));
  const databasePath = join(directory, 'isolated.sqlite');
  let app, base;
  async function open(opts) {
    app = createApp({ databasePath, catalog, ...opts });
    await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${app.server.address().port}`;
  }
  await open(options);
  t.after(async () => { await app.close(); rmSync(directory, { recursive: true, force: true }); });
  const call = async (path, token, body, headers = {}) => {
    const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers,
    }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, ...(await response.json()) };
  };
  const session = async () => (await call('/api/sessions', undefined, {})).data.token;
  const quantity = (token, quantity) => call('/api/actions', token, { type: 'quantity', expectedContext: 'personal', productId: 'fixture-product', quantity });
  return { call, session, quantity, databasePath, reopen: async opts => { await app.close(); await open(opts); } };
}

test('default preview never creates synthetic commerce data or exposes invented addresses', async t => {
  const api = await fixture(t); // Option deliberately omitted: this is the public default.
  const token = await api.session();
  assert.equal((await api.quantity(token, 2)).status, 200);
  for (const route of ['/api/addresses', '/api/orders', '/api/appeals', '/api/returns']) {
    const response = await api.call(route, token);
    assert.equal(response.status, 200);
    assert.deepEqual(response.data, []);
    assert.deepEqual(response.meta, { available: false, source: 'not-connected' });
  }
  const orderId = '11111111-1111-4111-8111-111111111111';
  for (const [route, body] of [
    ['/api/quotes', { context: 'personal', deliveryMethod: 'pickup' }],
    ['/api/orders', { quoteId: orderId }],
    [`/api/orders/${orderId}/cancel`, {}],
    ['/api/appeals', { topic: 'Fixture attempt', message: 'Must not create a record' }],
    ['/api/returns', { orderId, reason: 'Fixture attempt' }],
    ['/api/notification-preferences', { expectedContext: 'personal', preferences: {} }],
    ['/api/notifications/read', { expectedContext: 'personal', id: orderId }],
    ['/api/quotes', { context: 'personal', deliveryMethod: 'pickup', allowTestFixtureOperations: true }],
  ]) {
    const response = await api.call(route, token, body, { 'Idempotency-Key': 'fixture_gate_12345' });
    assert.equal(response.status, 503, route);
    assert.equal(response.error.code, 'SHOP_INTEGRATION_REQUIRED', route);
    assert.equal(response.data, undefined, route);
  }
  const inbox = (await api.call('/api/notifications', token)).data;
  assert.deepEqual(inbox.items, []);
  assert.equal(Object.values(inbox.preferences).every(value => value === false), true);
  assert.equal(inbox.available, false);
  assert.deepEqual((await api.call('/api/state', token)).data.carts.personal, [{ productId: 'fixture-product', quantity: 2 }]);
  const db = new DatabaseSync(api.databasePath, { readOnly: true });
  try {
    for (const table of ['quotes', 'orders', 'idempotency', 'appeals', 'returns', 'notification_preferences', 'notification_reads']) {
      assert.equal(db.prepare(`SELECT count(*) AS n FROM ${table}`).get().n, 0, table);
    }
  } finally { db.close(); }
});

test('default reopen hides historical fixture orders, support records and notifications without deleting them', async t => {
  const api = await fixture(t, { allowTestFixtureOperations: true });
  const token = await api.session();
  assert.equal((await api.call('/api/addresses', token)).data[0].synthetic, true);
  await api.quantity(token, 1);
  const quote = await api.call('/api/quotes', token, { context: 'personal', deliveryMethod: 'pickup' });
  assert.equal(quote.status, 201);
  const response = await api.call('/api/orders', token, { quoteId: quote.data.id }, { 'Idempotency-Key': 'fixture_gate_legacy' });
  assert.equal(response.status, 201);
  const order = response.data;
  assert.equal((await api.call('/api/notifications', token)).data.items.length, 1);
  const db = new DatabaseSync(api.databasePath);
  try {
    const row = db.prepare('SELECT session_hash, context FROM orders WHERE id = ?').get(order.id);
    const legacy = { id: 'historical', orderId: order.id, status: 'test-received', mode: 'local-sandbox' };
    db.prepare('INSERT INTO appeals VALUES (?, ?, ?, ?)').run('historical-appeal', row.session_hash, row.context, JSON.stringify(legacy));
    db.prepare('INSERT INTO returns VALUES (?, ?, ?, ?, ?)').run('historical-return', row.session_hash, row.context, order.id, JSON.stringify(legacy));
  } finally { db.close(); }
  await api.reopen({}); // Existing same DB + session; production-like default hides rather than deletes.
  for (const route of ['/api/addresses', '/api/orders', '/api/appeals', '/api/returns']) assert.deepEqual((await api.call(route, token)).data, []);
  assert.equal((await api.call(`/api/orders/${order.id}`, token)).status, 503);
  assert.equal((await api.call(`/api/orders/${order.id}/cancel`, token, {})).status, 503);
  assert.deepEqual((await api.call('/api/notifications', token)).data.items, []);
  const preserved = new DatabaseSync(api.databasePath, { readOnly: true });
  try {
    for (const table of ['orders', 'appeals', 'returns']) assert.equal(preserved.prepare(`SELECT count(*) AS n FROM ${table}`).get().n, 1, table);
  } finally { preserved.close(); }
});

test('fixture permission requires a literal boolean option, not truthy strings', () => {
  for (const value of ['true', 'false', 1, null, {}]) assert.throws(
    () => createApp({ databasePath: ':memory:', catalog, allowTestFixtureOperations: value }),
    /allowTestFixtureOperations must be a boolean/,
  );
});
