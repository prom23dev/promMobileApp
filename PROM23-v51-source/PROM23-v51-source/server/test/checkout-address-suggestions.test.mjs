import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createApp } from '../app.mjs';
import { RuntimeError } from '../integrations/runtime-client.mjs';

// Private local HTTP app per case; runtime is an explicit double, never DaData/Bitrix.
const endpoint = '/api/v1/checkout/address-suggestions';
const catalog = { products: [{ id: 'prom-1', sku: 'UNIT', name: 'Контракт', category: 'Оборудование', kind: 'equipment', priceKopecks: 10000, stock: null, unit: 'шт.', specs: [] }] };
const ok = response => { assert.equal(response.status, 200, JSON.stringify(response.body)); return response.body.data; };
async function fixture(t, result = { suggestions: [] }) {
  const calls = [];
  const runtimeClient = { readiness: () => ({ configured: true, verified: false }), async call(op, payload) {
    calls.push({ op, payload });
    if (op === 'buyer.select') return { organization: { id: payload.organizationId, name: 'Contract organization' }, cart: [] };
    return typeof result === 'function' ? result(op, payload) : result;
  } };
  const app = createApp({ databasePath: ':memory:', catalog, runtimeClient });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve)); t.after(() => app.close());
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const request = async (path, { token, body, method = body === undefined ? 'GET' : 'POST' } = {}) => {
    const r = await fetch(base + path, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: r.status, body: await r.json() };
  };
  const created = await request('/api/sessions', { body: {} }); assert.equal(created.status, 201); const token = created.body.data.token;
  const state = async () => ok(await request('/api/state', { token }));
  const place = async () => ok(await request('/api/v1/location', { token }));
  const action = async body => ok(await request('/api/actions', { token, body: { expectedContext: (await state()).context, ...body } }));
  const select = async (query = 'Краснодар') => {
    const suggestions = ok(await request('/api/v1/locations/suggest?q=' + encodeURIComponent(query))).items; assert.ok(suggestions.length);
    const current = await place(); return ok(await request('/api/v1/location', { token, body: { expectedContext: (await state()).context, expectedVersion: current.version, settlementId: suggestions[0].id } }));
  };
  const body = async query => ({ query, expectedContext: (await state()).context, expectedLocationVersion: (await place()).version });
  const suggest = async query => request(endpoint, { token, body: await body(query) });
  return { calls, token, state, action, place, select, body, suggest, request };
}

test('address search sends exact selected GAR/version/context and server session; response whitelists only addresses', async t => {
  const f = await fixture(t, { suggestions: [{ address: 'ул. Контрактная, д. 1', token: 'must-not-return', data: { postalCode: 'private' } }, { address: 'ул. Контрактная, д. 1' }, { address: 'ул. Контрактная, д. 2' }], apiKey: 'must-not-return' });
  const selected = await f.select(); const r = ok(await f.suggest('  Контрактная 1  '));
  assert.deepEqual(r, { suggestions: [{ address: 'ул. Контрактная, д. 1' }, { address: 'ул. Контрактная, д. 2' }] });
  assert.deepEqual(f.calls[0], { op: 'checkout.addresses', payload: { sessionKey: createHash('sha256').update(f.token).digest('hex'), context: 'personal', settlementId: selected.settlement.id, locationVersion: selected.version, query: 'Контрактная 1' } });
  assert.equal(JSON.stringify(r).includes('must-not-return'), false);
});
test('anonymous request, absent selection and stale or injected scope do not reach provider', async t => {
  const f = await fixture(t);
  assert.equal((await f.request(endpoint, { body: { query: 'Улица 1', expectedContext: 'personal', expectedLocationVersion: 0 } })).status, 401);
  let r = await f.suggest('Улица 1'); assert.equal(r.status, 409); assert.equal(r.body.error.code, 'SETTLEMENT_REQUIRED');
  await f.select(); const good = await f.body('Улица 1');
  for (const body of [{ ...good, expectedContext: 'organization:999' }, { ...good, expectedContext: 'business' }, { ...good, expectedLocationVersion: 0 }, { ...good, expectedLocationVersion: String(good.expectedLocationVersion) }, { ...good, settlementId: 'forged' }, { ...good, city: 'Фиктивный город' }]) {
    r = await f.request(endpoint, { token: f.token, body }); assert.ok([400, 409].includes(r.status), JSON.stringify(r.body));
  }
  assert.equal(f.calls.length, 0);
});
test('query shape, short/blank/oversized/control input and unsupported HTTP methods are rejected', async t => {
  const f = await fixture(t); await f.select();
  for (const query of ['', '   ', 'ab', ' a ', 'a'.repeat(501), 42, null, {}, 'улица\u0000дом', 'улица\u000bдом']) {
    const r = await f.suggest(query); assert.ok([400, 422].includes(r.status), JSON.stringify(r.body));
  }
  assert.equal((await f.request(endpoint, { token: f.token })).status, 405);
  assert.equal((await f.request(endpoint + '?query=address', { token: f.token, body: await f.body('Улица 1') })).status, 400);
  assert.equal(f.calls.length, 0);
});
test('malformed, HTML/control, blank, oversized and unbounded upstream addresses are not selectable', async t => {
  for (const result of [null, {}, { suggestions: {} }, { suggestions: [null] }, { suggestions: [{ address: 123 }] }, { suggestions: [{ address: 'ab' }] }, { suggestions: [{ address: '   ' }] }, { suggestions: [{ address: '<b>street</b>' }] }, { suggestions: [{ address: 'street\n1' }] }, { suggestions: [{ address: 'x'.repeat(501) }] }, { suggestions: Array.from({ length: 11 }, (_, n) => ({ address: `Контрактный дом ${n}` })) }]) {
    const f = await fixture(t, result); await f.select(); const r = await f.suggest('Улица 1');
    assert.equal(r.status, 502, `Malformed address DTO must fail closed: ${JSON.stringify(result)}`); assert.equal(r.body.error.code, 'ADDRESS_RESPONSE_INVALID');
  }
});
test('empty provider result stays empty and source errors do not fabricate addresses', async t => {
  const f = await fixture(t, { suggestions: [] }); await f.select(); assert.deepEqual(ok(await f.suggest('Улица 1')), { suggestions: [] });
  const failed = await fixture(t, () => { throw new RuntimeError('INTEGRATION_UNAVAILABLE', 503, 'Contract unavailable'); }); await failed.select(); const r = await failed.suggest('Улица 1');
  assert.equal(r.status, 503); assert.equal(r.body.data, undefined);
});
test('late response after context/GAR/reselection changes is rejected and cart retained', async t => {
  for (const change of ['context', 'location', 'same-location-new-version']) {
    let release, reached; const pending = new Promise(resolve => { release = resolve; }), started = new Promise(resolve => { reached = resolve; });
    const f = await fixture(t, async () => { reached(); await pending; return { suggestions: [{ address: 'Устаревший дом 1' }] }; });
    await f.select(); await f.action({ type: 'quantity', productId: 'prom-1', quantity: 2 });
    const running = f.suggest('Улица 1'); await started;
    if (change === 'context') await f.action({ type: 'context', context: 'business' }); else await f.select(change === 'location' ? 'Москва' : 'Краснодар');
    release(); const r = await running; assert.equal(r.status, 409); assert.equal(r.body.error.code, 'CONTEXT_CHANGED');
    assert.deepEqual((await f.state()).carts.personal, [{ productId: 'prom-1', quantity: 2 }]);
  }
});
test('deleted session cannot receive a late provider result', async t => {
  let release, reached; const pending = new Promise(resolve => { release = resolve; }), started = new Promise(resolve => { reached = resolve; });
  const f = await fixture(t, async () => { reached(); await pending; return { suggestions: [{ address: 'Устаревший дом 1' }] }; }); await f.select();
  const running = f.suggest('Улица 1'); await started;
  ok(await f.request('/api/session', { token: f.token, method: 'DELETE' })); release(); assert.equal((await running).status, 401);
});
test('verified organization address request uses the active organization identity', async t => {
  const f = await fixture(t); await f.select(); await f.action({ type: 'context', context: 'business' });
  ok(await f.request('/api/v1/buyer/select', { token: f.token, body: { expectedContext: 'business', organizationId: 13 } }));
  ok(await f.suggest('Улица 1')); assert.equal(f.calls.at(-1).payload.context, 'organization:13');
});
