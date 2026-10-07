import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createProcurementService, procurementValues, procurementConsents, procurementResult } from '../integrations/procurement-service.mjs';
const contract = JSON.parse(readFileSync(new URL('../integrations/form-contracts.json', import.meta.url))).forms.procurement;
const id = '7dfa745e-aa19-4688-b121-b655c11e482f';
const value = () => ({ context: 'business', revision: 'schema-contract-1', values: { 'first-name': 'Контракт', phone: '+79000000000', email: 'contract@example.invalid', 'company-name': 'Компания', inn: '1234567890', 'comment-text': 'Подбор', mode: 'selection', 'files[]': [{ uploadToken: 'b'.repeat(48), name: 'need.pdf', size: 20 }], location: { settlementId: id, version: 2 } }, consents: contract.consents.map(row => ({ name: row.name, accepted: true, documentIds: row.documents })) });
const actor = () => ({ tokenHash: 'a'.repeat(64), state: { context: 'business' } });
const location = { settlement: { id, name: 'authoritative-location' }, version: 2 };
const code = code => error => error.code === code;
test('derived procurement is separate from original form count and preserves source required contacts', () => {
  assert.equal(contract.derived, true); assert.equal(contract.sourceBaseForm, 'quote');
  for (const field of ['email', 'company-name']) { assert.equal(contract.fields.find(row => row.name === field).required, true); assert.throws(() => procurementValues({ ...value().values, [field]: '' })); }
  assert.doesNotThrow(() => procurementValues({ ...value().values, 'comment-text': '' }));
  assert.throws(() => procurementValues({ ...value().values, 'comment-text': '', 'files[]': [] }), code('NEED_REQUIRED'));
});
test('device paths, wrong or duplicate tokens, unknown fields, names and file limits cannot reach source', () => {
  const good = value().values, file = good['files[]'][0];
  for (const files of [[{ ...file, uri: 'file:///private' }], [{ ...file, name: '../a.pdf' }], [{ ...file, name: 'a.exe' }], [{ ...file, size: 20971521 }], [file, file], Array.from({ length: 11 }, (_, i) => ({ ...file, uploadToken: i.toString(16).padStart(48, 'b') }))]) assert.throws(() => procurementValues({ ...good, 'files[]': files }), code('UPLOAD_INVALID'));
  assert.throws(() => procurementValues({ ...good, organizationId: 99 }), code('FORM_FIELD_UNKNOWN'));
  assert.throws(() => procurementValues({ ...good, location: { ...good.location, name: 'Injected city' } }), code('SETTLEMENT_REQUIRED'));
});
test('procurement requires separate processing consent and actual reference + explicit delivery state', () => {
  const consents = value().consents;
  for (const bad of [[], consents.slice(0, 0), [...consents, consents[0]], consents.map(c => ({ ...c, accepted: false })), consents.map(c => ({ ...c, documentIds: ['fake'] }))]) assert.throws(() => procurementConsents(bad), code('CONSENT_REQUIRED'));
  for (const result of [{ STATUS: 'OK' }, { status: 'accepted', reference: 'fake-1', deliveryStatus: 'complete' }, { status: 'accepted', reference: 'business-4' }]) assert.throws(() => procurementResult(result), code('PROCUREMENT_RESULT_INVALID'));
  assert.deepEqual(procurementResult({ status: 'accepted', reference: 'business-4', deliveryStatus: 'pending', secret: 'excluded' }), { status: 'accepted', reference: 'business-4', deliveryStatus: 'pending' });
});
test('scoped submission rechecks schema and preserves every file/field, authoritative GAR and idempotency', async () => {
  const calls = [], s = actor(), body = value();
  const service = createProcurementService({ getSession: () => s, getLocation: () => location, runtime: { async call(op, payload, options) { calls.push({ op, payload, options }); return op === 'forms.context' ? { formId: 'procurement', revision: body.revision } : { status: 'accepted', reference: 'business-31', deliveryStatus: 'pending' }; } } });
  assert.equal((await service.submit(s, body, 'procurement-contract-1')).reference, 'business-31');
  assert.deepEqual(calls.map(row => row.op), ['forms.context', 'procurement.submit']);
  assert.deepEqual(calls[1].payload.values, body.values); assert.deepEqual(calls[1].payload.consents, body.consents);
  assert.deepEqual(calls[1].payload.location, location); assert.equal(calls[1].payload.sessionKey, s.tokenHash); assert.equal(calls[1].options.idempotencyKey, 'procurement-contract-1');
});
test('changed context/GAR/schema or terminated session prevents the effect after async context load', async () => {
  for (const change of ['context', 'location', 'session', 'schema']) {
    const s = actor(), body = value(); let latest = s, selected = location; const calls = [];
    const service = createProcurementService({ getSession: () => latest, getLocation: () => selected, runtime: { async call(op) { calls.push(op); if (change === 'context') latest = { ...s, state: { context: 'personal' } }; if (change === 'location') selected = { ...location, version: 3 }; if (change === 'session') latest = null; return { formId: 'procurement', revision: change === 'schema' ? 'changed' : body.revision }; } } });
    await assert.rejects(service.submit(s, body, 'procurement-contract-1')); assert.deepEqual(calls, ['forms.context']);
  }
});
