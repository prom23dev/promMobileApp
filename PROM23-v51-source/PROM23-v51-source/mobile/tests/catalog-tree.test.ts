import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { productInSection, sectionTrail, type CatalogTree } from '../src/catalog-tree';
import type { Product } from '../src/domain';

const tree = JSON.parse(readFileSync(new URL('../../data/catalog-tree.json', import.meta.url), 'utf8')) as CatalogTree;
const products = JSON.parse(readFileSync(new URL('../../data/catalog.json', import.meta.url), 'utf8')) as Product[];
const byId = new Map(tree.sections.map(section => [section.id, section]));

describe('Публичный снимок каталога PROM23 от 11.09.2026', () => {
  it('не подменяет неизвестный остаток снимка искусственным количеством', () => {
    for (const product of products) {
      assert.equal(product.stock, null, product.id);
      assert.equal(product.stockSource, 'unverified', product.id);
      assert.equal(product.draftQuantityLimit, 999, product.id);
    }
  });
  it('сохраняет все 20 корней и их порядок из меню сайта, включая леса перед металлом', () => {
    assert.deepEqual(tree.rootIds, ['16', '37', '41', '56', '64', '71', '72', '79', '113', '125', '141', '157', '173', '179', '200', '203', '207', '221', '250', '231']);
    assert.equal(tree.sections.length, 226);
    assert.ok(products.length >= 25, 'Снимок содержит реальные SKU, но не заявляет полный ассортимент');
    assert.deepEqual(tree.rootIds, tree.sections.filter(section => section.parentId === null).map(section => section.id));
  });

  it('не содержит повторных ID, URL, отсутствующих родителей или повторных ссылок на потомков', () => {
    assert.equal(byId.size, tree.sections.length);
    assert.equal(new Set(tree.sections.map(section => section.url)).size, tree.sections.length);
    for (const section of tree.sections) {
      assert.ok(section.name.trim());
      const url = new URL(section.url);
      assert.equal(url.origin, 'https://prom.myfast.space');
      assert.equal(url.search, '');
      assert.equal(url.hash, '');
      assert.ok(url.pathname.startsWith('/catalog/') && url.pathname.endsWith('/'));
      assert.equal(new Set(section.children).size, section.children.length);
      assert.equal(new Set(section.productIds).size, section.productIds.length);
      if (section.parentId !== null) {
        const parent = byId.get(section.parentId);
        assert.ok(parent, `Отсутствует родитель ${section.parentId}`);
        assert.ok(parent.children.includes(section.id));
        assert.ok(section.url.startsWith(parent.url), section.url);
      }
      for (const childId of section.children) assert.equal(byId.get(childId)?.parentId, section.id);
    }
  });

  it('полностью достижим из корней без циклов и сохраняет исходный DFS-порядок четырёх уровней', () => {
    const visited = new Set<string>();
    const order: string[] = [];
    let maxDepth = 0;
    function visit(id: string, depth: number) {
      assert.ok(!visited.has(id), `Цикл или повторное включение раздела ${id}`);
      visited.add(id);
      const section = byId.get(id);
      assert.ok(section, `Отсутствует раздел ${id}`);
      order.push(id);
      maxDepth = Math.max(maxDepth, depth);
      section.children.forEach(childId => visit(childId, depth + 1));
    }
    tree.rootIds.forEach(id => visit(id, 1));
    assert.equal(visited.size, tree.sections.length);
    assert.equal(maxDepth, 4, 'Публичное header-menu само показывает лишь три уровня');
    assert.deepEqual(order, tree.sections.map(section => section.id));
  });

  it('связывает каждый товар с точной цепочкой разделов его исходного URL', () => {
    assert.equal(new Set(products.map(product => product.id)).size, products.length);
    for (const product of products) {
      assert.ok(product.sectionIds?.length && product.sourceUrl, product.id);
      const chain = product.sectionIds;
      assert.equal(new Set(chain).size, chain.length);
      assert.ok(tree.rootIds.includes(chain[0]));
      const source = new URL(product.sourceUrl);
      const parentPath = source.pathname.replace(/[^/]+\/$/, '');
      const leaf = byId.get(chain[chain.length - 1]);
      assert.ok(leaf);
      assert.equal(new URL(leaf.url).pathname, parentPath, product.id);
      assert.deepEqual(sectionTrail(tree, leaf.id).map(section => section.id), chain, product.id);
    }
  });

  it('productIds на каждом уровне включает ровно свои товары и товары потомков, без чужих SKU', () => {
    for (const section of tree.sections) {
      const expected = products.filter(product => product.sectionIds?.includes(section.id)).map(product => product.id).sort();
      assert.deepEqual([...section.productIds].sort(), expected, section.url);
      assert.deepEqual(products.filter(product => productInSection(product, section)).map(product => product.id).sort(), expected);
    }
  });

  it('находит товар на четвёртом уровне и не помещает вышку в посторонний корневой раздел', () => {
    const tower = products.find(product => product.id === 'prom-2414');
    assert.ok(tower);
    assert.equal(sectionTrail(tree, tower.sectionIds!.at(-1)!).at(-1)?.name, 'Вышка-тура ВСПТ 0.7х1.6');
    assert.equal(productInSection(tower, byId.get('16')), true);
    assert.equal(productInSection(tower, byId.get('179')), false);
    assert.equal(productInSection(tower, undefined), false);
    assert.deepEqual(sectionTrail(tree, 'missing-section'), []);
  });

  it('сохраняет связь по section.productIds для старого товара без sectionIds', () => {
    const original = products[0];
    const legacy = { ...original, sectionIds: undefined };
    assert.equal(productInSection(legacy, byId.get(original.sectionIds![0])), true);
    assert.equal(productInSection(legacy, byId.get('179')), false);
  });

  it('останавливает построение хлебных крошек при повреждённом циклическом дереве', () => {
    const corrupt: CatalogTree = {
      sourceUrl: tree.sourceUrl, importedAt: tree.importedAt, rootIds: [],
      sections: [
        { id: 'a', name: 'A', url: 'https://prom.myfast.space/catalog/a/', parentId: 'b', children: ['b'], productIds: [] },
        { id: 'b', name: 'B', url: 'https://prom.myfast.space/catalog/b/', parentId: 'a', children: ['a'], productIds: [] },
      ],
    };
    const trail = sectionTrail(corrupt, 'a');
    assert.equal(trail.length, 2);
    assert.equal(new Set(trail.map(section => section.id)).size, trail.length);
  });
});
