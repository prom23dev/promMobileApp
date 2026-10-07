import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cartTotal, formatMoney, initialState, productAvailability, productQuantityLimit, searchProducts, shopReducer } from '../src/domain';
import { products } from '../src/fixtures';

describe('Корзины личных и корпоративных покупок', () => {
  it('изолирует корзины при смене контекста', () => {
    let s = shopReducer(initialState, { type: 'quantity', product: products[0], quantity: 2 });
    s = shopReducer(s, { type: 'context', context: 'organization-demo' });
    assert.equal(s.carts[s.context].length, 0);
    s = shopReducer(s, { type: 'quantity', product: products[1], quantity: 1 });
    assert.deepEqual(s.carts.personal, [{ productId: products[0].id, quantity: 2 }]);
    assert.deepEqual(s.carts['organization-demo'], [{ productId: products[1].id, quantity: 1 }]);
  });
  it('ограничивает количество остатком и отклоняет дробные/отрицательные значения', () => {
    const filled = shopReducer(initialState, { type: 'quantity', product: products[0], quantity: 100 });
    assert.equal(filled.carts.personal[0].quantity, products[0].stock);
    for (const quantity of [-1, NaN, Infinity, 1.5]) {
      assert.equal(shopReducer(filled, { type: 'quantity', product: products[0], quantity }), filled);
    }
  });
  it('удаляет нулевое количество и не добавляет отсутствующий товар', () => {
    const filled = shopReducer(initialState, { type: 'quantity', product: products[0], quantity: 2 });
    assert.deepEqual(shopReducer(filled, { type: 'quantity', product: products[0], quantity: 0 }).carts.personal, []);
    assert.deepEqual(shopReducer(initialState, { type: 'quantity', product: products[5], quantity: 1 }).carts.personal, []);
  });
  it('считает целые копейки и отклоняет устаревшие SKU/остатки', () => {
    assert.equal(cartTotal([{ productId: products[0].id, quantity: 3 }], products), 3735000);
    assert.throws(() => cartTotal([{ productId: 'missing', quantity: 1 }], products));
    assert.throws(() => cartTotal([{ productId: products[0].id, quantity: 500 }], products));
    assert.throws(() => formatMoney(1.5));
    assert.throws(() => cartTotal([{ productId: products[0].id, quantity: 1 }], [{ ...products[0], priceKopecks: -1 }]));
  });
  it('не выдаёт неизвестный остаток за ноль или прежний искусственный лимит20', () => {
    const product = { ...products[0], stock: null };
    const filled = shopReducer(initialState, { type: 'quantity', product, quantity: 25 });
    assert.equal(filled.carts.personal[0].quantity, 25);
    assert.equal(cartTotal(filled.carts.personal, [product]), 25 * product.priceKopecks);
    assert.equal(productAvailability(product), 'Наличие уточняйте при заказе');
    assert.equal(productQuantityLimit(product), 999);
    const capped = shopReducer(filled, { type: 'quantity', product, quantity: 1000 });
    assert.equal(capped.carts.personal[0].quantity, 999);
    assert.throws(() => cartTotal([{ productId: product.id, quantity: 1000 }], [product]));
  });
  it('соблюдает отдельный лимит черновика и новые реальные остатки', () => {
    const product = { ...products[0], stock: null, draftQuantityLimit: 40 };
    assert.equal(productQuantityLimit(product), 40);
    const filled = shopReducer(initialState, { type: 'quantity', product, quantity: 50 });
    assert.equal(filled.carts.personal[0].quantity, 40);
    const confirmed = { ...product, stock: 3 };
    assert.throws(() => cartTotal(filled.carts.personal, [confirmed]));
    assert.equal(shopReducer(filled, { type: 'quantity', product: confirmed, quantity: 40 }).carts.personal[0].quantity, 3);
    const unavailable = { ...product, stock: 0 };
    assert.equal(productAvailability(unavailable), 'Нет в наличии');
    assert.equal(productQuantityLimit(unavailable), 0);
    assert.deepEqual(shopReducer(filled, { type: 'quantity', product: unavailable, quantity: 1 }).carts.personal, []);
    for (const draftQuantityLimit of [0, -1, 1.5, Infinity, 1000]) {
      assert.equal(shopReducer(filled, { type: 'quantity', product: { ...product, draftQuantityLimit }, quantity: 2 }), filled);
    }
    for (const stock of [-1, 1.5, NaN, Infinity]) {
      assert.equal(shopReducer(filled, { type: 'quantity', product: { ...product, stock }, quantity: 2 }), filled);
    }
  });
});
describe('Каталог', () => {
  it('ищет слова независимо от регистра, учитывает артикул, категорию и сортировку', () => {
    assert.equal(searchProducts(products, 'ЛЕСА  секция')[0].id, products[0].id);
    assert.equal(searchProducts(products, 'demo-003')[0].id, products[2].id);
    assert.equal(searchProducts(products, 'леса', 'Лестницы').length, 0);
    const sorted = searchProducts(products, '', 'Все', 'price-asc');
    assert.equal(sorted[0].id, products[2].id);
    assert.equal(products[0].id, 'demo-scaffold');
  });
  it('ограничивает сравнение шестью товарами и позволяет убрать выбранный', () => {
    let s = initialState;
    products.forEach(p => { s = shopReducer(s, { type: 'compare', productId: p.id }); });
    assert.equal(s.comparison.length, 6);
    s = shopReducer(s, { type: 'compare', productId: 'seventh-product' });
    assert.equal(s.comparison.length, 6);
    s = shopReducer(s, { type: 'compare', productId: products[0].id });
    assert.equal(s.comparison.length, 5);
  });
});
