import assert from 'node:assert/strict';
import { test } from 'node:test';
import { initialState, type Product } from '../src/domain';
import { products } from '../src/fixtures';
import { productShelves } from '../src/recommendations';
const catalog: Product[] = [
  { ...products[0], id: 'a', sectionIds: ['root', 'leaf'] },
  { ...products[1], id: 'b', sectionIds: ['root', 'leaf'], popularRank: 2 },
  { ...products[2], id: 'c', sectionIds: ['root'], popularRank: 1 },
  { ...products[3], id: 'd', sectionIds: ['unrelated'] },
];
test('empty history yields no invented interests or recommendations; popularity uses source rank', () => {
  const shelves = productShelves(catalog, initialState);
  assert.deepEqual(shelves.viewed, []); assert.deepEqual(shelves.recommended, []);
  assert.deepEqual(shelves.popular.map(item => item.id), ['c', 'b']);
});
test('deduplicates history, excludes stale IDs and prioritizes deepest shared category', () => {
  const state = { ...initialState, viewed: { personal: ['missing', 'a', 'a'], 'organization-demo': ['d'] } };
  const before = JSON.stringify({ state, catalog });
  const shelves = productShelves(catalog, state);
  assert.deepEqual(shelves.viewed.map(item => item.id), ['a']);
  assert.deepEqual(shelves.recommended.map(item => item.id), ['b', 'c']);
  assert.equal(JSON.stringify({ state, catalog }), before);
  assert.deepEqual(productShelves(catalog, { ...state, context: 'organization-demo' }).viewed.map(item => item.id), ['d']);
});
test('recommendations exclude products already in the current cart', () => {
  const state = { ...initialState, carts: { ...initialState.carts, personal: [{ productId: 'b', quantity: 1 }] }, viewed: { personal: ['a'], 'organization-demo': [] } };
  assert.deepEqual(productShelves(catalog, state).recommended.map(item => item.id), ['c']);
});
