import test from 'node:test';
import assert from 'node:assert/strict';
import { correctedProductQuery, productSuggestions, recoverySections, viewedProductSections } from '../src/search-discovery';
import type { Product } from '../src/domain';
import type { CatalogTree } from '../src/catalog-tree';
const product = (id: string, name: string, sku: string, section: string): Product => ({ id, name, sku, category: section, sectionIds: [section], kind: 'tool', stock: null, priceKopecks: 10000, unit: 'шт.', specs: [] });
const products = [product('ladder', 'Стремянка алюминиевая', 'ЛС123', 'ladders'), product('tower', 'Вышка-тура стальная', 'ВПТ0728', 'towers')];
const tree: CatalogTree = { sourceUrl: '', importedAt: '', rootIds: ['towers', 'ladders'], sections: [{ id: 'towers', name: 'Вышки-туры', parentId: null, children: [], productIds: ['tower'], url: '' }, { id: 'ladders', name: 'Лестницы и стремянки', parentId: null, children: [], productIds: ['ladder'], url: '' }] };
test('suggestions match real name/SKU and never manufacture fallback stock or products', () => {
  assert.deepEqual(productSuggestions(products, 'ВПТ0728').map(item => item.id), ['tower']);
  assert.deepEqual(productSuggestions(products, 'стремянка алюминиевая').map(item => item.id), ['ladder']);
  assert.deepEqual(productSuggestions(products, 'unknown'), []);
  assert.equal(productSuggestions(products, 'ВПТ0728')[0].stock, null);
});
test('recent sections use only existing viewed products, deduplicate and preserve recency', () => {
  assert.deepEqual(viewedProductSections(['missing', 'ladder', 'ladder', 'tower'], products, tree).map(item => item.id), ['ladders', 'towers']);
  assert.deepEqual(viewedProductSections([], products, tree), []);
  assert.deepEqual(recoverySections('абракадабра777', products, tree, []).map(item => item.id), tree.rootIds);
});
test('spelling help is explicit, conservative and backed by matching real products', () => {
  assert.equal(correctedProductQuery('стремнка', products), 'стремянка');
  assert.equal(correctedProductQuery('вишка', products), 'вышка');
  assert.equal(correctedProductQuery('стремянка', products), null);
  assert.equal(correctedProductQuery('абракадабра 777', products), null);
  assert.equal(correctedProductQuery('а'.repeat(65), products), null);
  assert.equal(correctedProductQuery('стремнка неизвестное', products), null);
});
