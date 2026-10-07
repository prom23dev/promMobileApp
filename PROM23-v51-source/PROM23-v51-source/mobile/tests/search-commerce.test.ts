import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanSearch, rememberSearch } from '../src/search-history';
import { initialState, shopReducer } from '../src/domain';
import { commerceKey, currentCommerceOffer, splitExample, plusLabel, type CommerceRequest, type CommerceOffer } from '../src/commerce';

test('search history normalizes whitespace/case, retains latest spelling and limits ten', () => {
  assert.equal(cleanSearch('  Леса\n  рамные  '), 'Леса рамные');
  assert.deepEqual(rememberSearch(['леса', 'Тент'], ' ЛЕСА '), ['ЛЕСА', 'Тент']);
  assert.equal(rememberSearch(Array.from({ length: 15 }, (_, i) => 'Товар ' + i), 'Новый').length, 10);
  assert.deepEqual(rememberSearch(['Леса'], '  '), ['Леса']);
});
test('search history removes one query, clears current context and resets both', () => {
  let state = shopReducer(initialState, { type: 'search', query: 'Леса' });
  state = shopReducer(state, { type: 'context', context: 'organization-demo' });
  state = shopReducer(state, { type: 'search', query: 'Тент' });
  assert.deepEqual(state.searches, { personal: ['Леса'], business: [], 'organization-demo': ['Тент'] });
  state = shopReducer(state, { type: 'remove-search', query: 'тент' });
  assert.deepEqual(state.searches?.personal, ['Леса']);
  assert.deepEqual(state.searches?.['organization-demo'], []);
  state = shopReducer(state, { type: 'reset' });
  assert.deepEqual(state.searches, { personal: [], business: [], 'organization-demo': [] });
});
test('four-part example preserves kopecks and rejects invalid amounts', () => {
  for (const amount of [1, 10003, 1345000, 6689900]) assert.equal(splitExample(amount).reduce((sum, x) => sum + x, 0), amount);
  assert.deepEqual(splitExample(1345000), [336250, 336250, 336250, 336250]);
  for (const value of [0, -1, NaN, 0.1, Infinity]) assert.deepEqual(splitExample(value), []);
});
const request: CommerceRequest = { context: 'personal', city: 'Краснодар', items: [{ productId: 'p1', priceKopecks: 328000, quantity: 1 }] };
const offer: CommerceOffer = { requestKey: commerceKey(request), expiresAt: '2026-09-11T12:30:00Z', plus: { points: 32, terms: 'Fixture only' }, split: { payments: [{ label: 'Первый', amountKopecks: 82000 }], terms: 'Fixture only' }, delivery: [{ id: 'point', method: 'point', name: 'Яндекс Маркет', period: '15 сентября', priceKopecks: 58100 }] };
const now = Date.parse('2026-09-11T12:00:00Z');
test('commerce quote is bound to buyer, city, items, price, quantity and expiry', () => {
  assert.deepEqual(currentCommerceOffer(offer, request, now), offer);
  for (const changed of [{ ...request, city: 'Москва' }, { ...request, context: 'organization-demo' as const }, { ...request, items: [{ ...request.items[0], quantity: 2 }] }, { ...request, items: [{ ...request.items[0], priceKopecks: 1 }] }]) assert.equal(currentCommerceOffer(offer, changed, now), null);
  assert.equal(currentCommerceOffer(offer, request, Date.parse(offer.expiresAt)), null);
  assert.equal(currentCommerceOffer({ ...offer, plus: { points: -1, terms: 'bad' } }, request, now), null);
  assert.equal(currentCommerceOffer({ ...offer, delivery: [{ ...offer.delivery[0], priceKopecks: NaN }] }, request, now), null);
});
test('B2B never renders personal Split/Plus; pluralization is correct', () => {
  const business = { ...request, context: 'organization-demo' as const };
  const current = currentCommerceOffer({ ...offer, requestKey: commerceKey(business) }, business, now);
  assert.equal(current?.plus, undefined); assert.equal(current?.split, undefined);
  assert.equal(plusLabel(1), '1 балл Плюса'); assert.equal(plusLabel(32), '32 балла Плюса'); assert.equal(plusLabel(137), '137 баллов Плюса');
});
