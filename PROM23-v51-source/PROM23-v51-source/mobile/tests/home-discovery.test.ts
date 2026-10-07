import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mixedHomeProducts } from '../src/home-discovery';
import { products } from '../src/fixtures';
const catalog = Array.from({ length: 35 }, (_, i) => ({ ...products[0], id: 'p' + i, category: ['a', 'b', 'c', 'd', 'e'][i % 5] }));
test('discovery mixes categories, preserves actual product objects and does not mutate the source', () => {
  const before = JSON.stringify(catalog), result = mixedHomeProducts(catalog);
  assert.equal(result.length, catalog.length);
  assert.equal(new Set(result.map(p => p.id)).size, catalog.length);
  assert.equal(new Set(result.slice(0, 5).map(p => p.category)).size, 5);
  assert.ok(result.every(p => catalog.includes(p)));
  assert.equal(JSON.stringify(catalog), before);
});
test('ordering is stable across API order changes and pagination boundaries', () => {
  const result = mixedHomeProducts(catalog);
  assert.deepEqual(mixedHomeProducts([...catalog].reverse()), result);
  assert.deepEqual([...result.slice(0, 12), ...result.slice(12, 24), ...result.slice(24)], result);
});
test('empty, duplicate and uneven categories terminate without fabricated products', () => {
  assert.deepEqual(mixedHomeProducts([]), []);
  assert.equal(mixedHomeProducts([...catalog, catalog[0]]).length, catalog.length);
  assert.equal(mixedHomeProducts(catalog.map((p, i) => ({ ...p, category: i ? 'a' : 'b' }))).length, catalog.length);
});
