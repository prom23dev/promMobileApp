import test from 'node:test';
import assert from 'node:assert/strict';
import { submitProcurement } from '../src/api/procurement';
import type { ProcurementRequest } from '../src/procurement';
import type { ShopTransport } from '../src/api/shop-transport';
import { businessRequestConsents } from '../src/forms/siteForms';
const need = (): ProcurementRequest => ({ context: 'business', mode: 'list', name: 'Контракт', phone: '+79000000000', email: 'contract@example.invalid', company: 'Компания', inn: '1234567890', comment: '', settlementId: '7dfa745e-aa19-4688-b121-b655c11e482f', locationVersion: 2,
  files: [{ name: 'need.pdf', size: 5, uri: 'blob:contract-test', mimeType: 'application/pdf', file: new Blob(['%PDF-']) }], consent: businessRequestConsents.map(row => ({ name: row.name, accepted: true, documentIds: row.documents })) });
function fixture(result: unknown = { status: 'accepted', reference: 'business-31', deliveryStatus: 'pending' }) {
  const calls: { path: string; options: any }[] = [];
  const transport: ShopTransport = async (path, options) => {
    calls.push({ path, options }); let response: unknown;
    if (path.endsWith('/context')) response = { revision: 'contract-revision' };
    else if (path.endsWith('/create')) response = { uploadId: 'a'.repeat(48) };
    else if (path.endsWith('/chunk')) response = { nextOffset: 5 };
    else if (path.endsWith('/complete')) response = { uploadToken: 'b'.repeat(48), name: 'need.pdf', size: 5 };
    else response = result;
    return response as any;
  };
  return { calls, transport };
}
test('procurement uploads actual bytes first, then preserves all source fields without device URI', async () => {
  const { calls, transport } = fixture(), request = need();
  assert.equal((await submitProcurement(request, { idempotencyKey: 'procurement-client-contract-1' }, transport)).reference, 'business-31');
  assert.deepEqual(calls.map(row => row.path), ['/v1/forms/procurement/context', '/v1/uploads/create', '/v1/uploads/chunk', '/v1/uploads/complete', '/v1/procurement/submit']);
  assert.equal(calls[2].options.body.base64, btoa('%PDF-'));
  const sent = calls.at(-1)!.options;
  assert.equal(sent.body.values['company-name'], request.company); assert.equal(sent.body.values.inn, request.inn); assert.equal(sent.body.values.mode, 'list');
  assert.deepEqual(sent.body.values.location, { settlementId: request.settlementId, version: 2 });
  assert.deepEqual(sent.body.values['files[]'], [{ uploadToken: 'b'.repeat(48), name: 'need.pdf', size: 5 }]);
  assert.equal(JSON.stringify(sent.body).includes('blob:'), false); assert.deepEqual(sent.body.consents, request.consent); assert.equal(sent.key, 'procurement-client-contract-1');
});
test('mandatory source email/company and exact consents fail before network', async () => {
  for (const patch of [{ email: '' }, { company: '' }, { consent: [] }, { consent: need().consent.map(c => ({ ...c, documentIds: ['wrong'] })) }]) {
    const { calls, transport } = fixture(); await assert.rejects(submitProcurement({ ...need(), ...patch }, { idempotencyKey: 'procurement-client-contract-2' }, transport)); assert.equal(calls.length, 0);
  }
});
test('changed local context during upload stops before submission; timeout never becomes accepted', async () => {
  const { calls, transport } = fixture(); let guardCount = 0;
  await assert.rejects(submitProcurement(need(), { idempotencyKey: 'procurement-client-contract-3', ensureCurrent: () => { if (++guardCount === 5) throw new Error('scope changed'); } }, transport), /scope changed/);
  assert.equal(calls.some(row => row.path.endsWith('/procurement/submit')), false);
  const failed: ShopTransport = async () => { throw new Error('timeout'); };
  await assert.rejects(submitProcurement(need(), { idempotencyKey: 'procurement-client-contract-4' }, failed), /timeout/);
});
test('malformed accepted, missing delivery state and arbitrary reference never become success', async () => {
  for (const [i, result] of [{ STATUS: 'OK' }, { status: 'accepted', reference: 'receipt-fake', deliveryStatus: 'complete' }, { status: 'accepted', reference: 'business-31' }].entries()) {
    const { transport } = fixture(result); await assert.rejects(submitProcurement({ ...need(), files: [], comment: 'Подбор' }, { idempotencyKey: `procurement-client-invalid-${i}` }, transport), /подтвердить результат/);
  }
});

test('universal business enquiry accepts text without files or INN', async()=>{
 const {calls,transport}=fixture();
 const request={...need(),inn:'',files:[],comment:'Тема: Условия сотрудничества\n\nПрошу уточнить условия для дилеров.'};
 await submitProcurement(request,{idempotencyKey:'universal-business-request-44'},transport);
 assert.deepEqual(calls.map(c=>c.path),['/v1/forms/procurement/context','/v1/procurement/submit']);
 assert.equal(calls.at(-1)!.options.body.values['comment-text'],request.comment);
});
