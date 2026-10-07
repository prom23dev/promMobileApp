import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../app.mjs';
const product = { id: 'p', sku: 'P', name: 'Товар', category: 'Леса', kind: 'scaffold', priceKopecks: 328000, oldPriceKopecks: 372600, stock: null, unit: 'шт.', specs: [], stockSource: 'unverified', draftQuantityLimit: 999 };
test('unconnected catalog has unknown stock, server discount and draft quantities; organization requires membership', async t => {
  const app = createApp({ databasePath: ':memory:', catalog: { products: [product] } });
  await new Promise(resolve => app.server.listen(0, '127.0.0.1', resolve));
  t.after(() => app.close());
  const base = `http://127.0.0.1:${app.server.address().port}`;
  const p = (await (await fetch(base + '/api/catalog')).json()).data.products[0];
  assert.equal(p.stock, null); assert.equal(p.discountPercent, 12); assert.equal(p.draftQuantityLimit, 999);
  const session = (await (await fetch(base + '/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).json()).data;
  const action = body => fetch(base + '/api/actions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.token }, body: JSON.stringify({ ...body, expectedContext: 'personal' }) });
  assert.equal((await action({ type: 'quantity', productId: 'p', quantity: 21 })).status, 200);
  assert.equal((await action({ type: 'context', context: 'organization-demo' })).status, 403);
  assert.equal((await action({ type: 'city', city: 'Краснадарррр123' })).status, 400);
  assert.equal((await (await fetch(base + '/api/state', { headers: { Authorization: 'Bearer ' + session.token } })).json()).data.carts.personal[0].quantity, 21);
});
