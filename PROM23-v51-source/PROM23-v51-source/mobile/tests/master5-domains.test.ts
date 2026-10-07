import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAvailability } from '../src/availability-domain';
import { defaultPublicationFilters, safePublicationMedia, selectPublications } from '../src/publication-domain';
import type { ProductPublication } from '../src/api/site';
const now = Date.parse('2026-09-11T18:00:00Z');
const context = { productId: 'prom-2414', settlementId: '915703c4-731d-4ebe-b893-561d99982172', locationVersion: 2, buyerContext: 'personal' as const };
const positive = () => ({ ...context, availability: { status: 'in-stock', quantityBasis: 'physical-on-hand', totalQuantity: 7, warehouses: [{ id: '1', name: 'Склад', quantity: 7 }], measuredAt: '2026-09-11T17:59:00Z', expiresAt: '2026-09-11T18:01:00Z' } });
test('inventory binds product, settlement, revision and actor context', () => {
 assert.equal(parseAvailability(positive(), context, now).totalQuantity, 7);
 for (const field of ['productId', 'settlementId', 'locationVersion', 'buyerContext']) assert.throws(() => parseAvailability({ ...positive(), [field]: 'wrong' }, context, now));
});
test('stale, future, duplicate and inconsistent quantities fail closed', () => {
 const a = positive(); a.availability.expiresAt = '2026-09-11T17:59:00Z'; assert.throws(() => parseAvailability(a, context, now));
 const b = positive(); b.availability.measuredAt = '2026-09-11T18:02:00Z'; assert.throws(() => parseAvailability(b, context, now));
 const c = positive(); c.availability.warehouses.push(c.availability.warehouses[0]); assert.throws(() => parseAvailability(c, context, now));
 const d = positive(); d.availability.totalQuantity = 0; assert.throws(() => parseAvailability(d, context, now));
});
test('missing inventory is unknown, never an inferred zero', () => {
 const data = { ...context, availability: { status: 'unknown', quantityBasis: 'physical-on-hand', totalQuantity: null, warehouses: [], measuredAt: null, expiresAt: null } };
 assert.equal(parseAvailability(data, context, now).totalQuantity, null);
 assert.throws(() => parseAvailability({ ...data, availability: { ...data.availability, status: 'out-of-stock' } }, context, now));
});
const review = (id: string, rating: number, extra = {}): ProductPublication => ({ id, productId: 'prom-2414', kind: 'review', author: 'Покупатель', publishedLabel: '11 сентября', text: 'Текст', rating, actions: [], ...extra });
test('review filters intersect media, rating and replies without leaking other products', () => {
 const items = [review('one', 5, { media: [{ id: '1', kind: 'image', url: 'https://prom.myfast.space/upload/review.jpg', alt: 'Фото' }], replies: [{ id: 'r', author: 'Магазин', text: 'Ответ', publishedLabel: 'Сегодня' }] }), review('two', 4), review('foreign', 5, { productId: 'prom-1111' })];
 assert.deepEqual(selectPublications(items, 'prom-2414', 'review', { ...defaultPublicationFilters, withMedia: true, withReplies: true, rating: 5 }).map(i => i.id), ['one']);
 assert.deepEqual(selectPublications(items, 'prom-2414', 'review', { ...defaultPublicationFilters, sort: 'low-rate' }).map(i => i.id), ['two', 'one']);
 assert.equal(items[0].id, 'one');
});
test('media accepts only public store uploads, without tokens or foreign origins', () => {
 assert.equal(safePublicationMedia('https://prom23.ru/upload/review.jpg'), true);
 for (const u of ['http://prom23.ru/upload/a.jpg', 'https://evil.ru/upload/a.jpg', 'https://prom23.ru/upload/a.jpg?token=secret', 'https://user:pass@prom23.ru/upload/a.jpg', 'javascript:alert(1)']) assert.equal(safePublicationMedia(u), false);
});
