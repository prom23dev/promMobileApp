import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../app.mjs';
import { RuntimeError } from '../integrations/runtime-client.mjs';

// Explicit contract doubles, private local HTTP process and database. No real form/account/order.
const catalog = { products: [1, 2].map(n => ({ id: `prom-${n}`, sku: `CONTRACT-${n}`, name: `Товар ${n}`, category: 'Оборудование', kind: 'equipment', priceKopecks: 10000, stock: null, unit: 'шт.', specs: [], stockSource: 'unverified' })) };
const hash = value => createHash('sha256').update(value).digest('hex');
const contracts = JSON.parse(readFileSync(new URL('../integrations/form-contracts.json', import.meta.url))).forms;
const data = (r, status = 200) => { assert.equal(r.status, status, JSON.stringify(r.body)); return r.body.data; };
async function fixture(t, onSubmit) {
  const dir = mkdtempSync(join(tmpdir(), 'prom23-form-effects-')), databasePath = join(dir, 'own.sqlite');
  const calls = [];
  const runtimeClient = { readiness: () => ({ configured: true, verified: false }), async call(op, payload, options) {
    calls.push({ op, payload, options });
    if (op === 'forms.context') return { formId: payload.formId, revision: 'contract-revision-1' };
    if (op === 'forms.submit') return onSubmit(payload, options);
    if (op === 'buyer.select') return { organization: { id: payload.organizationId, name: 'Компания контракта' }, cart: [{ productId: 'prom-2', quantity: 3 }] };
    throw new RuntimeError('INTEGRATION_UNAVAILABLE', 503, 'Contract unavailable');
  } };
  const app = createApp({ databasePath, catalog, runtimeClient }); await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  const db = new DatabaseSync(databasePath); t.after(async () => { db.close(); await app.close(); rmSync(dir, { recursive: true, force: true }); });
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const request = async (path, token, body, headers = {}) => { const r = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'X-Prom23-Functional': '1', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); return { status: r.status, body: await r.json() }; };
  const session = async () => data(await request('/api/sessions', null, {}), 201).token;
  const token = await session();
  const state = async (who = token) => data(await request('/api/state', who));
  const action = async (value, who = token) => { const current = await state(who); return data(await request('/api/actions', who, { expectedContext: current.context, ...value })); };
  const form = async (id, target = {}, who = token) => { const current = await state(who); return request(`/api/v1/forms/${id}/submit`, who, { context: current.context, target, values: {}, consents: contracts[id].consents.map(c => ({name: c.name, accepted: true, documentIds: c.documents})), revision: 'contract-revision-1' }, { 'Idempotency-Key': `contract-${id}-key` }); };
  const draft = async (who = token) => {
    await action({ type: 'quantity', productId: 'prom-1', quantity: 2 }, who);
    const suggestion = data(await request('/api/v1/locations/suggest?q=' + encodeURIComponent('Краснодар'))).items[0]; assert.ok(suggestion);
    const before = data(await request('/api/v1/location', who)), current = await state(who);
    const selected = data(await request('/api/v1/location', who, { expectedContext: current.context, expectedVersion: before.version, settlementId: suggestion.id }));
    await request('/api/v1/checkout/quote', who, { expectedContext: current.context, expectedLocationVersion: selected.version, delivery: 'courier', payment: 'online', address: 'CONTRACT-PRIVATE-ADDRESS' });
    assert.equal(db.prepare('SELECT count(*) AS n FROM commerce_drafts WHERE session_key=?').get(hash(who)).n, 1);
  };
  return { request, token, session, state, action, form, draft, calls, db };
}
test('order repeat uses exact validated source cart and preserves other buyer drafts', async t => {
  const cart = [{ productId: 'prom-2', quantity: 5 }, { productId: 'prom-1', quantity: 1 }];
  const f = await fixture(t, () => ({ status: 'accepted', reference: 'order-8', cart }));
  await f.action({ type: 'context', context: 'business' }); await f.action({ type: 'quantity', productId: 'prom-1', quantity: 4 }); await f.action({ type: 'context', context: 'personal' });
  data(await f.form('order-repeat', { orderId: '8' })); const state = await f.state();
  assert.deepEqual(state.carts.personal, cart); assert.deepEqual(state.carts.business, [{ productId: 'prom-1', quantity: 4 }]);
  assert.equal(f.calls.find(row => row.op === 'forms.submit').options.idempotencyKey, 'contract-order-repeat-key');
});
test('unknown/malformed/duplicate order products cannot replace cart', async t => {
  for (const cart of [[{ productId: 'prom-999', quantity: 1 }], [{ productId: 'prom-1', quantity: 0 }], [{ productId: 'prom-1', quantity: 1000 }], [{ productId: 'prom-1', quantity: 1.5 }], [{ productId: 'prom-1', quantity: 1 }, { productId: 'prom-1', quantity: 2 }], [], [null]]) {
    const f = await fixture(t, () => ({ status: 'accepted', reference: 'order-8', cart })); await f.action({ type: 'quantity', productId: 'prom-2', quantity: 4 });
    const r = await f.form('order-repeat', { orderId: '8' }); assert.ok([409, 502].includes(r.status), JSON.stringify(r.body)); assert.deepEqual((await f.state()).carts.personal, [{ productId: 'prom-2', quantity: 4 }]);
  }
});
test('order repeat cannot overwrite newer cart or changed context after source response', async t => {
  for (const change of ['cart', 'context']) {
    let release, reached; const pending = new Promise(resolve => { release = resolve; }), started = new Promise(resolve => { reached = resolve; });
    const f = await fixture(t, async () => { reached(); await pending; return { status: 'accepted', reference: 'order-8', cart: [{ productId: 'prom-1', quantity: 1 }] }; });
    await f.action({ type: 'quantity', productId: 'prom-2', quantity: 2 });
    const running = f.form('order-repeat', { orderId: '8' }); await started;
    if (change === 'cart') await f.action({ type: 'quantity', productId: 'prom-2', quantity: 7 }); else await f.action({ type: 'context', context: 'business' });
    release(); const r = await running; assert.equal(r.status, 409); assert.equal(r.body.error.code, 'CART_CHANGED');
    assert.deepEqual((await f.state()).carts.personal, [{ productId: 'prom-2', quantity: change === 'cart' ? 7 : 2 }]);
  }
});
test('accepted account deletion/current-session termination resets only own state and checkout drafts', async t => {
  for (const id of ['account-delete', 'sessions-terminate']) {
    const f = await fixture(t, () => ({ status: 'accepted', reference: id === 'account-delete' ? 'user-4' : 'session-7', loggedOut: true })); const other = await f.session();
    await f.draft(); await f.draft(other); await f.action({ type: 'favorite', productId: 'prom-1' });
    data(await f.form(id, id === 'sessions-terminate' ? { sessionId: '7' } : {}));
    const s = await f.state(); assert.equal(s.context, 'personal'); assert.deepEqual(s.carts.personal, []); assert.deepEqual(s.carts.business, []); assert.deepEqual(s.favorites, []);
    assert.equal(f.db.prepare('SELECT count(*) AS n FROM commerce_drafts WHERE session_key=?').get(hash(f.token)).n, 0);
    assert.equal(f.db.prepare('SELECT count(*) AS n FROM commerce_drafts WHERE session_key=?').get(hash(other)).n, 1); assert.deepEqual((await f.state(other)).carts.personal, [{ productId: 'prom-1', quantity: 2 }]);
  }
});
test('termination of another session and failed effects preserve own state/draft', async t => {
  for (const outcome of ['other-session', 'failure']) {
    const f = await fixture(t, () => { if (outcome === 'failure') throw new RuntimeError('FORBIDDEN', 403, 'Contract forbidden'); return { status: 'accepted', reference: 'session-7', loggedOut: false }; });
    await f.draft(); const before = await f.state(); const result = await f.form('sessions-terminate', { sessionId: '7' });
    assert.equal(result.status, outcome === 'failure' ? 403 : 200); assert.deepEqual(await f.state(), before); assert.equal(f.db.prepare('SELECT count(*) AS n FROM commerce_drafts').get().n, 1);
  }
});
test('missing logout flag or false account-deletion logout cannot be acknowledged as accepted', async t => {
  for (const result of [{ status: 'accepted', reference: 'user-4' }, { status: 'accepted', reference: 'user-4', loggedOut: false }, { status: 'accepted', reference: 'session-7' }]) {
    const f = await fixture(t, () => result); await f.action({ type: 'quantity', productId: 'prom-1', quantity: 2 });
    const r = await f.form(result.reference.startsWith('user') ? 'account-delete' : 'sessions-terminate', result.reference.startsWith('session') ? { sessionId: '7' } : {});
    assert.equal(r.status, 502, 'Do not show account-deleted/session-ended without an explicit applicable logout result'); assert.deepEqual((await f.state()).carts.personal, [{ productId: 'prom-1', quantity: 2 }]);
  }
});
test('removing active organization exits its context while preserving independent personal/business carts', async t => {
  const f = await fixture(t, () => ({ status: 'accepted', reference: 'organization-3' }));
  await f.action({ type: 'quantity', productId: 'prom-1', quantity: 4 }); await f.action({ type: 'context', context: 'business' }); await f.action({ type: 'quantity', productId: 'prom-1', quantity: 6 });
  data(await f.request('/api/v1/buyer/select', f.token, { expectedContext: 'business', organizationId: 3 }));
  data(await f.form('organization-delete', { organizationId: '3' })); const s = await f.state();
  assert.equal(s.context, 'business'); assert.equal(s.activeOrganization, null); assert.deepEqual(s.carts.personal, [{ productId: 'prom-1', quantity: 4 }]); assert.deepEqual(s.carts.business, [{ productId: 'prom-1', quantity: 6 }]);
});
