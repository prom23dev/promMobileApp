import test from 'node:test';
import assert from 'node:assert/strict';
import { procurementErrors, type ProcurementRequest } from '../src/procurement';
import { isSettlement, parseLocation, parseSuggestions } from '../src/location-domain';
import { commerceKey, currentCommerceOffer } from '../src/commerce';
const good: ProcurementRequest = { context: 'business', mode: 'selection', name: 'Иван', phone: '+7 (900) 000-00-00', email: 'unit@example.invalid', company: 'ООО Контракт', inn: '', comment: 'Нужен подбор оборудования', settlementId: '7dfa745e-aa19-4688-b121-b655c11e482f', locationVersion: 1, files: [], consent: [] };
test('procurement accepts a need without articles/organization; validates required contact and file boundaries', () => {
  assert.deepEqual(procurementErrors(good), {});
  assert.ok(procurementErrors({ ...good, name: '', phone: '', comment: '', settlementId: null }).name);
  assert.ok(procurementErrors({ ...good, inn: '123' }).inn);
  assert.ok(procurementErrors({ ...good, email: '' }).email);
  assert.ok(procurementErrors({ ...good, company: '' }).company);
  assert.ok(procurementErrors({ ...good, files: [{ name: 'spec.exe', size: 20, uri: 'file:///local' }] }).files);
  assert.ok(procurementErrors({ ...good, files: [{ name: 'spec.pdf', size: 20 * 1024 * 1024 + 1, uri: 'file:///local' }] }).files);
  assert.ok(procurementErrors({ ...good, files: [{ name: 'spec.pdf', uri: 'file:///local' }] }).files);
  assert.deepEqual(procurementErrors({ ...good, comment: '', files: [{ name: 'spec.XLSX', size: 2000, uri: 'file:///local' }] }), {});
});
test('settlement parser rejects arbitrary text, mismatched IDs and malformed state', () => {
  assert.equal(isSettlement('Краснодар'), false);
  assert.equal(isSettlement({ id: good.settlementId, name: 'Краснодар' }), false);
  assert.throws(() => parseLocation({ version: 1, settlement: { name: 'Краснодар' }, recent: [], commerce: { status: 'unresolved' }, cartValidation: { status: 'required' } }));
  assert.throws(() => parseSuggestions({ items: [{ name: 'test' }], query: 'test', providerVersion: '1', coverage: {} }));
});
test('new settlement or version invalidates delivery/payment offer even for the same display name', () => {
  const request = { context: 'personal' as const, city: 'Ленина', settlementId: 'first', locationVersion: 1, items: [{ productId: 'p', quantity: 1, priceKopecks: 10000 }] };
  const offer = { requestKey: commerceKey(request), expiresAt: '2099-01-01', delivery: [] };
  assert.ok(currentCommerceOffer(offer, request));
  assert.equal(currentCommerceOffer(offer, { ...request, settlementId: 'second' }), null);
  assert.equal(currentCommerceOffer(offer, { ...request, locationVersion: 2 }), null);
});
