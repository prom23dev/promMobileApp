import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createFormsService, normalizeFormResult } from '../integrations/forms-service.mjs';
const forms = JSON.parse(readFileSync(new URL('../integrations/form-contracts.json', import.meta.url))).forms;
const session = () => ({ tokenHash: 'a'.repeat(64), state: { context: 'personal' } });
const consents = id => forms[id].consents.map(c => ({ name: c.name, accepted: true, documentIds: c.documents }));
const body = (id, values = {}) => ({ context: 'personal', revision: 'schema-v1', target: {}, values, consents: consents(id) });
const callback = () => body('callback', { form_text_24: 'Fixture name', form_text_25: '+79990000000' });
function fixture(context = {}, submit = { status: 'accepted', reference: 'saved-123' }) {
  const calls = []; const runtime = { call: async (operation, payload, options) => {
    calls.push({ operation, payload, options });
    return operation === 'forms.context' ? { formId: payload.formId, revision: 'schema-v1', ...context } : submit;
  } };
  return { calls, service: createFormsService({ runtime }), runtime };
}
const code = expected => error => error?.code === expected;
test('unknown form/stale context/forged target never reaches runtime', async () => {
  const { service, calls } = fixture(), s = session();
  await assert.rejects(service.context(s, 'not-real', { context: 'personal' }), code('FORM_NOT_FOUND'));
  await assert.rejects(service.context(s, 'callback', { context: 'organization:3' }), code('STALE_CONTEXT'));
  await assert.rejects(service.context(s, 'callback', { context: 'personal', target: { userId: '5' } }), code('FORM_TARGET_INVALID'));
  assert.equal(calls.length, 0);
});
test('valid submission re-fetches schema and forwards server session, exact consent and stable idempotency', async () => {
  const { service, calls } = fixture(), value = callback();
  assert.deepEqual(await service.submit(session(), 'callback', value, 'same-form-key-123'), { status: 'accepted', reference: 'saved-123' });
  assert.deepEqual(calls.map(c => c.operation), ['forms.context', 'forms.submit']);
  assert.equal(calls[1].payload.sessionKey, 'a'.repeat(64)); assert.equal(calls[1].options.idempotencyKey, 'same-form-key-123');
  assert.deepEqual(calls[1].payload.consents, value.consents);
});
test('missing/extra consent, unknown hidden field, changed schema and weak password prevent writes', async () => {
  for (const edit of [v => { v.consents.pop(); }, v => { v.consents[0].documentIds = ['other']; }, v => { v.values.WEB_FORM_ID = '1'; }, v => { v.revision = 'old'; }]) {
    const { service, calls } = fixture(), value = callback(); edit(value);
    await assert.rejects(service.submit(session(), 'callback', value, 'same-form-key-123')); assert.equal(calls.filter(c => c.operation === 'forms.submit').length, 0);
  }
  const { service, calls } = fixture();
  await assert.rejects(service.submit(session(), 'auth-register', body('auth-register', { email: 'fixture@example.test', password: 'weak1234', password_repeat: 'weak1234' }), 'register-key-123'), code('VALIDATION_ERROR'));
  assert.equal(calls.filter(c => c.operation === 'forms.submit').length, 0);
});
test('appeal agreements cannot be bypassed after the owner added checkboxes', async () => {
  for (const accepted of [false, undefined]) {
    const { service, calls } = fixture({options:{theme:[{value:'1',label:'Contract theme'}]}});
    const value = body('appeal', {theme:'1',comment:'Contract comment'});
    if (accepted === undefined) value.consents = [];
    else value.consents[0].accepted = false;
    await assert.rejects(service.submit(session(), 'appeal', value, 'appeal-consent-test'));
    assert.equal(calls.filter(c => c.operation === 'forms.submit').length, 0);
  }
});
test('organization changes or revocation while schema is loading abort effect', async () => {
  const initial = session(); let latest = initial; let release;
  const pending = new Promise(resolve => { release = resolve; }); const calls = [];
  const service = createFormsService({ getSession: () => latest, runtime: { call: async (op, payload) => { calls.push(op); await pending; return { formId: payload.formId, revision: 'schema-v1' }; } } });
  const attempt = service.submit(initial, 'callback', callback(), 'same-form-key-123');
  latest = { ...initial, state: { context: 'business' } }; release();
  await assert.rejects(attempt, code('STALE_CONTEXT')); assert.deepEqual(calls, ['forms.context']);
  latest = null;
  await assert.rejects(service.context(initial, 'callback', { context: 'personal' }), code('AUTH_EXPIRED'));
});
test('database options, owned return rows and selected items are authoritative', async () => {
  const current = { options: { 'selected-products': [{ value: '12', label: 'Owned item' }, { value: '13', label: 'Other owned item' }] },
    repeatedItems: { items: [{ key: '12', label: 'Owned item', quantityMax: 3, options: { reason: [{ value: '1', label: 'Source reason' }] } }, { key: '13', label: 'Other owned item' }] } };
  const { service } = fixture(current);
  const value = body('return', { 'selected-products': ['12'], items: [{ key: '12', values: { quantity: '1', reason: ['1'], comment: 'Fixture comment' } }] });
  assert.equal((await service.submit(session(), 'return', value, 'return-key-123')).status, 'accepted');
  for (const quantity of ['0','4','NaN','1e2','1.0001']) { value.values.items[0].values.quantity=quantity; await assert.rejects(service.submit(session(), 'return', value, 'return-bad-'+quantity.replaceAll('.','_')), code('VALIDATION_ERROR')); }
  value.values.items[0].values.quantity='1.5'; await service.submit(session(), 'return', value, 'return-fraction-125');
  value.values.items[0].key = '999'; await assert.rejects(service.submit(session(), 'return', value, 'return-key-124'), code('FORM_ROWS_INVALID'));
  const appeals = fixture({ options: { theme: [{ value: '5', label: 'Source theme' }] } });
  await assert.rejects(appeals.service.submit(session(), 'appeal', body('appeal', { theme: '999', comment: 'Test' }), 'appeal-key-123'), code('FORM_OPTION_INVALID'));
});
test('device URI and unverified uploaded objects are rejected before form effect', async () => {
  const { service, calls } = fixture(); const value = body('review', { rate: '5', 'review-text': 'Fixture review', 'media[]': [{ uri: 'file:///private/photo.jpg', name: 'photo.jpg', size: 10 }] });
  await assert.rejects(service.submit(session(), 'review', value, 'review-key-123'), code('UPLOAD_INVALID'));
  assert.equal(calls.filter(c => c.operation === 'forms.submit').length, 0);
});
test('schema cannot introduce credentials fields or password defaults', async () => {
  const { service } = fixture({ fields: [{ name: 'secret', label: 'Secret', type: 'password', required: true }] });
  await assert.rejects(service.context(session(), 'callback', { context: 'personal' }), code('FORM_CONTEXT_INVALID'));
  const auth = fixture({ initialValues: { password: 'must-not-return', email: 'fixture@example.test' } });
  assert.deepEqual((await auth.service.context(session(), 'auth-email', { context: 'personal' })).initialValues, { email: 'fixture@example.test' });
});
test('only explicit accepted/authenticated/challenge results are allowed; legacy OK is not manufactured success', () => {
  assert.throws(() => normalizeFormResult({ STATUS: 'OK' }), code('FORM_RESULT_INVALID'));
  assert.throws(() => normalizeFormResult({ status: 'accepted', reference: '' }), code('FORM_RESULT_INVALID'));
  assert.deepEqual(normalizeFormResult({ status: 'authenticated', authenticated: true }), { status: 'authenticated', authenticated: true });
  assert.equal(normalizeFormResult({ status: 'next-step', nextFormId: 'auth-otp', challengeId: 'b'.repeat(48), retryAfterSeconds: 60 }).status, 'next-step');
});
test('profile and address forms bind structured location to current server selection after schema wait', async () => {
  const s = session(), actual = {version: 3, settlement: {id: 'actual-settlement', officialFullName: 'Verified source name'}};
  for (const id of ['profile-city', 'address-create', 'address-edit']) {
    const f = fixture(), service = createFormsService({runtime:f.runtime, getLocation:()=>actual});
    const v = body(id, {...(id==='profile-city'?{city:'untrusted label'}:{full_address:'Fixture street 1'}),location:{settlementId:'actual-settlement',version:3}});
    assert.equal((await service.submit(s,id,v,'location-test-key')).status,'accepted');
    assert.deepEqual(f.calls.at(-1).payload.location,actual);
    v.values.location.version = 2;
    await assert.rejects(service.submit(s,id,v,'location-stale-key'),code('LOCATION_CHANGED'));
    v.values.location = {settlementId:'foreign-settlement',version:3};
    await assert.rejects(service.submit(s,id,v,'location-foreign-key'),code('LOCATION_CHANGED'));
    assert.equal(f.calls.filter(c=>c.operation==='forms.submit').length,1);
  }
  let release;const pending=new Promise(resolve=>{release=resolve;});let current=actual;
  const service=createFormsService({getLocation:()=>current,runtime:{call:async(op,p)=>{assert.equal(op,'forms.context');await pending;return {formId:p.formId,revision:'schema-v1'};}}});
  const attempt=service.submit(s,'profile-city',body('profile-city',{city:'Fixture',location:{settlementId:'actual-settlement',version:3}}),'late-location-key');
  current={...actual,version:4};release();await assert.rejects(attempt,code('LOCATION_CHANGED'));
});
test('only account actions can log out and only repeat can return validated replacement cart', () => {
  const accepted={status:'accepted',reference:'user-10',loggedOut:true,cart:[{productId:'prom-1',quantity:1}]};
  assert.deepEqual(normalizeFormResult(accepted,'callback'),{status:'accepted',reference:'user-10'});
  assert.equal(normalizeFormResult(accepted,'account-delete').loggedOut,true);
  assert.deepEqual(normalizeFormResult(accepted,'order-repeat').cart,[{productId:'prom-1',quantity:1}]);
  assert.throws(()=>normalizeFormResult({...accepted,cart:[{productId:'prom-1',quantity:0}]},'order-repeat'),code('FORM_RESULT_INVALID'));
  assert.throws(()=>normalizeFormResult({...accepted,cart:[...accepted.cart,...accepted.cart]},'order-repeat'),code('FORM_RESULT_INVALID'));
});

test('franchise supports foreign applicants and validates warehouse state before effects', async () => {
  const f=fixture(), values={'first-name':'UI Test',phone:'+995 555 123456',email:'qa@example.invalid',country:'Грузия',region:'Тбилиси','business-status':'Нет','warehouse-status':'Планирую','has-warehouse':false,interests:['Опалубка']};
  assert.equal((await f.service.submit(session(),'partner',body('partner',values),'franchise-36-valid')).status,'accepted');
  for(const patch of [{country:'123'},{phone:'+1234567890123456'},{'has-warehouse':true},{'warehouse-status':'Да','has-warehouse':true},{'warehouse-address':'hidden'},{inn:'hidden'}]) await assert.rejects(f.service.submit(session(),'partner',body('partner',{...values,...patch}),'franchise-36-invalid'),code('VALIDATION_ERROR'));
  assert.equal(f.calls.filter(x=>x.operation==='forms.submit').length,1);
});

test('newsletter opt-in is explicit and separate; no subscription write when unchecked', async () => {
  const request=body('subscription',{email:'legal41@example.invalid'});
  assert.equal(request.consents.length,3);
  request.consents.find(c=>c.name==='marketing').accepted=false;
  const a=fixture(); await assert.rejects(a.service.submit(session(),'subscription',request,'privacy-test-key-41'),code('MARKETING_CHOICE_REQUIRED'));
  assert.equal(a.calls.filter(c=>c.operation==='forms.submit').length,0);
  request.consents.find(c=>c.name==='marketing').accepted=true;
  const b=fixture(); await b.service.submit(session(),'subscription',request,'privacy-test-key-42');
  assert.equal(b.calls.filter(c=>c.operation==='forms.submit').length,1);
  assert.ok(request.consents.some(c=>c.documentIds.includes('privacy') && c.accepted));
});
test('publication identity requires its own consent and cannot contain contact details',async()=>{
 for(const name of ['Покупатель','mail@example.test','+79990000000']){
  const f=fixture(),value=body('question',{'question-text':'Тестовый вопрос','public-author':name});value.target={productId:'prom-2414'};value.consents.find(c=>c.name==='publish_author').accepted=false;
  await assert.rejects(f.service.submit(session(),'question',value,'publication-consent-test'));assert.equal(f.calls.filter(c=>c.operation==='forms.submit').length,0);
 }
 const f=fixture(),value=body('question',{'question-text':'Тестовый вопрос','public-author':''});value.target={productId:'prom-2414'};value.consents.find(c=>c.name==='publish_author').accepted=false;
 await f.service.submit(session(),'question',value,'publication-anonymous-test');assert.equal(f.calls.at(-1).payload.consents.find(c=>c.name==='publish_author').accepted,false);
});
test('consent evidence gets transport address from the server session, not the submitted form',async()=>{const f=fixture();await f.service.submit({...session(),transportPeerIp:'192.0.2.10'},'callback',callback(),'audit-address-test');assert.equal(f.calls.at(-1).payload.audit.transportPeerIp,'192.0.2.10');assert.ok(Number.isFinite(Date.parse(f.calls.at(-1).payload.audit.recordedAt)));});
