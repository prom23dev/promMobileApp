import assert from 'node:assert/strict';
import { test } from 'node:test';
import { siteForms, siteFormList } from '../src/forms/siteForms';
import { expandFields, formFieldErrors, serializeFields } from '../src/forms/formModel';
import { submitSiteForm, loadSiteFormContext, loadSiteWorkspace, SiteUnavailableError } from '../src/api/site';

test('source forms keep approved separate opt-in consent, valid related routes and source provenance', () => {
  for (const form of siteFormList) {
    assert.equal(form.id, siteForms[form.id].id);
    assert.ok(form.sourceFiles.length, form.id);
    for (const id of form.relatedForms ?? []) assert.ok(siteForms[id], `${form.id} -> ${id}`);
    for (const consent of form.consents) assert.equal(consent.initial, false);
  }
  assert.equal(siteForms['auth-register'].consents.length, 2);
  assert.equal(siteForms['payment-card'].externalCapture, 'payment-provider');
  assert.deepEqual(siteForms['payment-card'].fields, []);
});
test('registration catches password mismatch and invalid email; OTP requires six digits', () => {
  const fields = expandFields(siteForms['auth-register'], {}, false, {});
  const errors = formFieldErrors(fields, { email: 'broken', password: 'alpha', password_repeat: 'beta' });
  assert.ok(errors.email); assert.ok(errors.password_repeat);
  const otp = expandFields(siteForms['auth-otp'], {}, false, {});
  assert.ok(formFieldErrors(otp, { code: '12ab34' }).code);
  assert.deepEqual(formFieldErrors(otp, { code: '123456' }), {});
});
test('return renders and serializes only selected authorized order items', () => {
  const context = { options: { 'selected-products': [{ value: 'p1', label: 'Product one' }, { value: 'p2', label: 'Product two' }] }, repeatedItems: { items: [{ key: 'p1', label: 'Product one' }, { key: 'p2', label: 'Product two' }] } };
  const values = { 'selected-products': ['p1'], 'items:p1:comment': 'Damaged', 'items:p2:comment': 'Stale', 'injected': 'ignored' };
  const fields = expandFields(siteForms.return, context, false, values);
  assert.ok(fields.some(field => field.groupTitle === 'Product one'));
  assert.ok(!fields.some(field => field.repeat?.key === 'p2'));
  const result = serializeFields(fields, values);
  assert.deepEqual(result.items, [{ key: 'p1', values: { comment: 'Damaged' } }]);
  assert.equal(result.injected, undefined);
  assert.ok(formFieldErrors(fields, { ...values, 'selected-products': ['injected'] })['selected-products']);
});
test('checkbox false is explicit; readonly identity cannot be supplied by form values', () => {
  const result = serializeFields([{ name: 'marketing', label: 'Marketing', type: 'checkbox', required: false }, { name: 'owner', label: 'Owner', type: 'text', required: true, readOnly: true }], { owner: 'forged' });
  assert.deepEqual(result, { marketing: false });
});
test('courier details retain source names and free text for both buyer contexts without becoming required', () => {
  const address = { ORDER_ADDRESS: 'Адрес из выбранного населённого пункта', pod: '2А', etag: 'цоколь', office: 'офис 7', comment: 'Въезд со двора' };
  for (const business of [false, true]) {
    const fields = expandFields(siteForms.checkout, {}, business, address);
    assert.deepEqual(serializeFields(fields, { ...address, forged: 'ignored', ORDER_COMPANY: 'forged owner' }), address);
    const errors = formFieldErrors(fields, {});
    for (const name of ['pod', 'etag', 'office', 'comment']) {
      assert.equal(errors[name], undefined, `${name} is optional`);
      assert.equal(formFieldErrors(fields, address)[name], undefined, `${name} accepts source free text`);
    }
    assert.equal(fields.find(field => field.name === 'ORDER_ADDRESS')?.sourceName, 'ORDER_PROP_{ADDRESS}');
  }
  assert.deepEqual(siteForms['address-create'].fields.map(field => field.name), ['full_address'], 'profile saved-address contract stays separate');
});
test('support video policy is scoped to order appeal and per-item returns, not all photo forms', () => {
  const appeal = siteForms['appeal-order'].fields.find(field => field.name === 'photos[]')!;
  const returned = siteForms.return.repeatedFields![0].fields.find(field => field.name === 'photos[]')!;
  for (const field of [appeal, returned]) {
    assert.ok(field.acceptedExtensions?.includes('mp4'));
    assert.equal(field.maxBytes, 20 * 1024 * 1024);
    assert.equal(field.maxFiles, 10);
    assert.equal(field.required, false);
    assert.equal(field.serverFileValidation?.maxVideoDurationSeconds, 60);
    assert.equal(field.serverFileValidation?.rejectUnreadableVideo, true);
  }
  assert.equal(appeal.sourceName, 'photos[]');
  assert.equal(returned.sourceName, 'item-{index}-photos[]');
  for (const form of siteFormList.filter(form => !['appeal-order', 'return', 'review'].includes(form.id))) {
    for (const field of [...form.fields, ...(form.repeatedFields ?? []).flatMap(group => group.fields)]) {
      assert.equal(field.serverFileValidation, undefined, `video must not leak into ${form.id}`);
      assert.ok(!field.acceptedExtensions?.includes('mp4'), form.id);
    }
  }
});
test('return media stays attached to the selected authorized product, never stale or forged rows', () => {
  const media = [{ name: 'damage.mp4', uri: 'file:///selected-damage.mp4', mimeType: 'video/mp4', size: 1024 }];
  const context = { repeatedItems: { items: [{ key: 'p1', label: 'Selected' }, { key: 'p2', label: 'Unselected' }] } };
  const values = { 'selected-products': ['p1'], 'items:p1:photos[]': media, 'items:p2:photos[]': media, 'items:forged:photos[]': media };
  const result = serializeFields(expandFields(siteForms.return, context, false, values), values);
  assert.deepEqual(result.items, [{ key: 'p1', values: { 'photos[]': media } }]);
  const appeal = serializeFields(expandFields(siteForms['appeal-order'], {}, false, {}), { 'photos[]': media });
  assert.deepEqual(appeal['photos[]'], media);
});
test('unavailable form runtime raises a transport error without fabricated records or acceptance', async () => {
 let calls=0;const offline=async<T>():Promise<T>=>{calls++;throw new Error('Runtime unavailable in isolated contract test')};
 await assert.rejects(loadSiteFormContext({formId:'auth-login',context:'personal'},offline),/Runtime unavailable/);
 await assert.rejects(loadSiteWorkspace('waiting-list','personal',offline),/Runtime unavailable/);
 await assert.rejects(submitSiteForm({formId:'auth-login',context:'personal',revision:'source-v1',values:{login:'unit@example.invalid'},consents:[]},offline),/Runtime unavailable/);
 assert.equal(calls,3);
});
test('form transport uses versioned scope and stable idempotency without redundant identity fields',async()=>{
 const calls:{path:string;body:any;key?:string}[]=[];const transport=async<T>(path:string,options:any):Promise<T>=>{calls.push({path,body:options.body,key:options.key});return(path.endsWith('/context')?{revision:'r1'}:{status:'next-step',nextFormId:'auth-otp',challengeId:'abcdefghijklmnopqrstuvwx',retryAfterSeconds:60})as T};
 assert.equal((await loadSiteFormContext({formId:'auth-login',context:'personal'},transport)).revision,'r1');
 const request={formId:'auth-login',context:'personal' as const,revision:'r1',values:{login:'unit@example.invalid'},consents:[],idempotencyKey:'logical_attempt_0001'};
 for(let i=0;i<2;i++)assert.equal((await submitSiteForm(request,transport)).status,'next-step');
 assert.equal(calls[0].path,'/v1/forms/auth-login/context');assert.deepEqual(calls[0].body,{context:'personal'});
 for(const call of calls.slice(1)){assert.equal(call.body.formId,undefined);assert.equal(call.body.idempotencyKey,undefined);assert.equal(call.body.revision,'r1');assert.equal(call.key,'logical_attempt_0001')}
});
test('invalid context or malformed success response cannot be accepted as a completed form',async()=>{
 const request={formId:'auth-login',context:'personal' as const,revision:'r1',values:{login:'unit@example.invalid'},consents:[]};
 for(const response of [{status:'accepted'},{status:'authenticated',authenticated:false},{status:'next-step',nextFormId:'auth-otp',challengeId:'invalid',retryAfterSeconds:0}])await assert.rejects(submitSiteForm(request,async<T>()=>response as T));
 await assert.rejects(loadSiteFormContext({formId:'auth-login',context:'personal'},async<T>()=>({}) as T));
});

test('return quantity respects the selected order item limit and supports fractional goods', () => {
 const context = { repeatedItems: { items: [{key:'12',label:'Fixture',quantityMax:2.5}] } };
 const values = {'selected-products':['12'],'items:12:quantity':'1.5','items:12:comment':'Описание'};
 const fields=expandFields(siteForms.return,context,false,values);
 assert.equal(fields.find(f=>f.name==='items:12:quantity')?.maxValue,2.5);
 assert.equal(formFieldErrors(fields,values)['items:12:quantity'],undefined);
 for (const quantity of ['0','3','NaN','1e2','1.0001']) assert.ok(formFieldErrors(fields,{...values,'items:12:quantity':quantity})['items:12:quantity']);
 const hidden=expandFields(siteForms.return,context,false,{...values,'selected-products':[]});
 assert.ok(!hidden.some(f=>f.name==='items:12:quantity'));
});
