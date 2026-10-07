import { readFileSync } from 'node:fs';
import { RuntimeError } from './runtime-client.mjs';
import { validBuyerContext } from '../buyer-context.mjs';

const contracts = JSON.parse(readFileSync(new URL('./form-contracts.json', import.meta.url), 'utf8')).forms;
const isObject = x => !!x && typeof x === 'object' && !Array.isArray(x);
const safeString = (x, max = 500) => typeof x === 'string' && x.length <= max && !/[\u0000\u0008\u000b\u000c]/.test(x);
const fail = (code, status = 400, message = 'Проверьте данные формы.') => { throw new RuntimeError(code, status, message); };
const idempotency = key => { if (!/^[A-Za-z0-9_-]{10,120}$/.test(key ?? '')) fail('IDEMPOTENCY_REQUIRED'); };
const formFor = id => { if (typeof id !== 'string' || !Object.hasOwn(contracts, id)) fail('FORM_NOT_FOUND', 404); return contracts[id]; };
const targetKeys = new Set(['productId', 'orderId', 'organizationId', 'addressId', 'cardId', 'sessionId', 'reviewId', 'questionId', 'parentId', 'appealId', 'notificationId']);
function targetFor(value = {}) {
  if (!isObject(value) || Object.entries(value).some(([k, v]) => !targetKeys.has(k) || !/^[A-Za-z0-9_-]{1,100}$/.test(v))) fail('FORM_TARGET_INVALID');
  return value;
}
function scope(session, body) {
  if (!isObject(body) || !validBuyerContext(body.context) || body.context !== session.state.context) fail('STALE_CONTEXT', 409, 'Режим покупок изменился. Откройте форму заново.');
  if (body.context === 'organization-demo') fail('AUTH_REQUIRED', 401, 'Войдите в аккаунт.');
  return { sessionKey: session.tokenHash, context: body.context, target: targetFor(body.target) };
}
function validOptions(value) {
  return Array.isArray(value) && value.length <= 1000 && value.every(x => isObject(x) && safeString(x.value, 150) && safeString(x.label, 300));
}
function checkedContext(value, form) {
  if (!isObject(value) || value.formId !== form.id || !safeString(value.revision, 128) || !value.revision) fail('FORM_CONTEXT_INVALID', 502);
  const data = {};
  if (value.challengeId !== undefined) {
    if (!/^[A-Za-z0-9_-]{24,128}$/.test(value.challengeId)) fail('FORM_CONTEXT_INVALID', 502);
    data.challengeId = value.challengeId;
  }
  if (value.retryAfterSeconds !== undefined) {
    if (!Number.isSafeInteger(value.retryAfterSeconds) || value.retryAfterSeconds < 0 || value.retryAfterSeconds > 3600) fail('FORM_CONTEXT_INVALID', 502);
    data.retryAfterSeconds = value.retryAfterSeconds;
  }
  if (value.options !== undefined) {
    if (!isObject(value.options) || Object.keys(value.options).length > 100 || !Object.values(value.options).every(validOptions)) fail('FORM_CONTEXT_INVALID', 502);
    data.options = value.options;
  }
  if (value.fields !== undefined) {
    if (!Array.isArray(value.fields) || value.fields.length > 100 || value.fields.some(f => !isObject(f) ||
        !/^[A-Za-z0-9_.\[\]-]{1,100}$/.test(f.name) || !safeString(f.label, 300) ||
        !['text', 'email', 'tel', 'textarea', 'select', 'date', 'file', 'checkbox', 'number'].includes(f.type) || typeof f.required !== 'boolean' ||
        (f.options !== undefined && !validOptions(f.options)))) fail('FORM_CONTEXT_INVALID', 502);
    // New schema fields only belong to explicitly database-defined CForm fields.
    if (!form.awaitingFields && value.fields.some(f => !form.fields.some(staticField => staticField.name === f.name))) fail('FORM_CONTEXT_INVALID', 502);
    data.fields = value.fields.map(f => ({ name: f.name, label: f.label, type: f.type, required: f.required,
      ...(f.options ? { options: f.options } : {}), ...(f.multiple === true ? { multiple: true } : {}) }));
  }
  if (value.initialValues !== undefined) {
    if (!isObject(value.initialValues) || Object.keys(value.initialValues).length > 100 || Object.values(value.initialValues).some(v => !(safeString(v, 5000) || typeof v === 'boolean' || (Array.isArray(v) && v.length <= 100 && v.every(x => safeString(x, 150)))))) fail('FORM_CONTEXT_INVALID', 502);
    const allowed = new Set([...form.fields, ...(data.fields ?? [])].filter(f => !['password', 'otp', 'file'].includes(f.type)).map(f => f.name));
    data.initialValues = Object.fromEntries(Object.entries(value.initialValues).filter(([name]) => allowed.has(name)));
  }
  if (value.repeatedItems !== undefined) {
    if (!isObject(value.repeatedItems) || Object.entries(value.repeatedItems).some(([name, items]) => !form.repeatedFields?.some(g => g.name === name) || !Array.isArray(items) || items.length > 500 ||
      items.some(item => !isObject(item) || !/^[A-Za-z0-9_-]{1,80}$/.test(item.key) || !safeString(item.label, 300) || (item.quantityMax !== undefined && (!Number.isFinite(item.quantityMax) || item.quantityMax <= 0)) || (item.options !== undefined && (!isObject(item.options) || !Object.values(item.options).every(validOptions)))))) fail('FORM_CONTEXT_INVALID', 502);
    data.repeatedItems = value.repeatedItems;
  }
  data.revision = value.revision;
  return data;
}

function resolvedFields(form, context, selected) {
  const fields = [...(form.awaitingFields || form.id === 'document-request' ? context.fields ?? [] : form.fields)].map(f => ({ ...f, options: context.options?.[f.name] ?? f.options }));
  for (const group of form.repeatedFields ?? []) for (const item of context.repeatedItems?.[group.name] ?? []) {
    if (selected && !selected.includes(item.key)) continue;
    for (const field of group.fields) fields.push({ ...field, ...(field.name === 'quantity' && item.quantityMax !== undefined ? { maxValue: item.quantityMax } : {}), name: `${group.name}:${item.key}:${field.name}`, options: item.options?.[field.name] ?? field.options });
  }
  return fields;
}
function uploadedFiles(value, field) {
  if (!Array.isArray(value) || value.length > (field.maxFiles ?? 10)) fail('UPLOAD_INVALID');
  for (const file of value) {
    if (!isObject(file) || Object.keys(file).some(k => !['uploadToken', 'name', 'size'].includes(k)) || !/^[A-Za-z0-9_-]{24,128}$/.test(file.uploadToken) ||
        !safeString(file.name, 240) || /[\\/]/.test(file.name) || !Number.isSafeInteger(file.size) || file.size < 1 || file.size > (field.maxBytes ?? 20 * 1024 * 1024) ||
        (field.acceptedExtensions?.length && !field.acceptedExtensions.some(ext => file.name.toLowerCase().endsWith('.' + ext.replace(/^\./, '').toLowerCase())))) fail('UPLOAD_INVALID');
  }
}
function checkValues(form, context, values) {
  if (!isObject(values) || Object.keys(values).length > 3000) fail('FORM_VALUES_INVALID');
  const flattened = { ...values };
  for (const group of form.repeatedFields ?? []) {
    const rows = flattened[group.name]; delete flattened[group.name];
    if (rows === undefined) continue;
    const selected = values['selected-products'];
    if (!Array.isArray(rows) || rows.length > 500 || new Set(rows.map(row => row?.key)).size !== rows.length) fail('FORM_ROWS_INVALID');
    for (const row of rows) {
      if (!isObject(row) || !isObject(row.values) || !context.repeatedItems?.[group.name]?.some(item => item.key === row.key) ||
          (selected && (!Array.isArray(selected) || !selected.includes(row.key)))) fail('FORM_ROWS_INVALID');
      for (const [key, value] of Object.entries(row.values)) flattened[`${group.name}:${row.key}:${key}`] = value;
    }
  }
  const fields = resolvedFields(form, context, values['selected-products']).filter(f => !f.readOnly && (!f.audience || f.audience === (context.buyerContext === 'personal' ? 'personal' : 'business')));
  const allowed = new Set(fields.map(f => f.name));
  if (['profile-city', 'address-create', 'address-edit'].includes(form.id)) allowed.add('location');
  if (Object.keys(flattened).some(k => !allowed.has(k))) fail('FORM_FIELD_UNKNOWN');
  if (form.awaitingFields && !fields.length) fail('FORM_SCHEMA_REQUIRED', 503);
  for (const field of fields) {
    const value = flattened[field.name];
    if (field.required && (value === undefined || value === '' || value === false || (Array.isArray(value) && !value.length))) fail('VALIDATION_ERROR', 422);
    if (value === undefined || value === '') continue;
    if (field.type === 'file') { uploadedFiles(value, field); continue; }
    if (field.type === 'checkbox') { if (typeof value !== 'boolean') fail('VALIDATION_ERROR', 422); continue; }
    const entries = field.multiple ? value : [value];
    if (!Array.isArray(entries) || entries.some(v => !safeString(v, field.maxLength ?? 5000))) fail('VALIDATION_ERROR', 422);
    if (field.minLength !== undefined && entries.some(v => Array.from(v.trim()).length < field.minLength)) fail('VALIDATION_ERROR', 422);
    if (field.type === 'select' && (!validOptions(field.options) || entries.some(v => !field.options.some(o => o.value === v)))) fail('FORM_OPTION_INVALID', 422);
    if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fail('VALIDATION_ERROR', 422);
    if (field.type === 'tel' && form.id !== 'partner' && value.replace(/\D/g, '').length < 10) fail('VALIDATION_ERROR', 422);
    if (field.type === 'otp' && !/^\d{6}$/.test(value)) fail('INVALID_CODE', 422);
    if (field.maxUtf8Bytes !== undefined && Buffer.byteLength(value, 'utf8') > field.maxUtf8Bytes) fail('VALIDATION_ERROR', 422);
    if (field.type === 'number' && ((form.id === 'return' && field.name.endsWith(':quantity') ? !/^\d+(?:\.\d{1,3})?$/.test(value) || !Number.isFinite(Number(value)) : !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) || field.minValue !== undefined && Number(value) < field.minValue || field.maxValue !== undefined && Number(value) > field.maxValue)) fail('VALIDATION_ERROR', 422);
  }
  if (form.id === 'partner') {
    for (const name of ['country', 'region']) if (typeof values[name] !== 'string' || !/^[\p{L}\p{M}][\p{L}\p{M}\d .,()’'/-]{1,149}$/u.test(values[name].trim())) fail('VALIDATION_ERROR', 422);
    for (const name of ['phone', 'warehouse-phone']) if (values[name] && (!/^\+[1-9][\d ()-]{6,24}$/.test(values[name]) || values[name].replace(/\D/g, '').length < 7 || values[name].replace(/\D/g, '').length > 15)) fail('VALIDATION_ERROR', 422);
    if (values['warehouse-status'] === 'Да' && !values['warehouse-address']?.trim()) fail('VALIDATION_ERROR', 422);
    if (values['has-warehouse'] !== (values['warehouse-status'] === 'Да')) fail('VALIDATION_ERROR', 422);
    if (values['warehouse-status'] !== 'Да' && ['warehouse-address', 'warehouse-phone', 'warehouse-schedule'].some(name => values[name])) fail('VALIDATION_ERROR', 422);
    if (values['business-status'] !== 'Да' && ['company-name', 'inn'].some(name => values[name])) fail('VALIDATION_ERROR', 422);
  }
  if (Object.hasOwn(values,'public-author') && /[@\r\n]|https?:|\+?\d[\d ()-]{8,}/i.test(values['public-author'] ?? '')) fail('PUBLIC_AUTHOR_INVALID',422,'Укажите имя или псевдоним без контактных данных.');
  if (form.id === 'auth-register' && (typeof values.password !== 'string' || values.password.length < 8 || !/[A-ZА-ЯЁ]/.test(values.password) || !/[a-zа-яё]/.test(values.password) || !/\d/.test(values.password) || values.password !== values.password_repeat)) fail('VALIDATION_ERROR', 422);
  return values;
}
function checkConsents(form, value, context = 'personal') {
  if(form.id==='checkout' && context!=='personal') form={...form,consents:form.consents.filter(c=>!c.documents.includes('offer'))};
  if (!Array.isArray(value) || value.length > 12 || value.some(c => !isObject(c) || typeof c.accepted !== 'boolean' || !Array.isArray(c.documentIds))) fail('CONSENT_INVALID');
  for (const required of form.consents ?? []) {
    const selected = value.filter(c => c.name === required.name);
    if (selected.length !== 1 || (required.required && selected[0].accepted !== true) || JSON.stringify([...selected[0].documentIds].sort()) !== JSON.stringify([...required.documents].sort())) fail('CONSENT_REQUIRED', 422, 'Подтвердите обязательные согласия.');
  }
  if (value.some(c => !form.consents.some(required => required.name === c.name))) fail('CONSENT_INVALID');
  if (form.id === 'subscription' && !value.some(c => c.name === 'marketing' && c.accepted === true)) fail('MARKETING_CHOICE_REQUIRED', 422, 'Чтобы подписаться, выберите получение новостей и предложений.');
  return value;
}
export function normalizeFormResult(value, formId) {
  if (!isObject(value)) fail('FORM_RESULT_INVALID', 502);
  if (value.status === 'accepted' && /^[A-Za-z0-9_-]{1,100}$/.test(value.reference ?? '')) {
    if (['account-delete', 'sessions-terminate'].includes(formId) && (typeof value.loggedOut !== 'boolean' || formId === 'account-delete' && value.loggedOut !== true)) fail('FORM_RESULT_INVALID', 502);
    let cart;
    if (formId === 'order-repeat') {
      cart = value.cart;
      if (!Array.isArray(cart) || !cart.length || cart.length > 500 || cart.some(row => !isObject(row) || !/^prom-[1-9][0-9]*$/.test(row.productId ?? '') || !Number.isSafeInteger(row.quantity) || row.quantity < 1 || row.quantity > 999) || new Set(cart.map(row => row.productId)).size !== cart.length) fail('FORM_RESULT_INVALID', 502);
      cart = cart.map(row => ({productId: row.productId, quantity: row.quantity}));
    }
    return { status: 'accepted', reference: value.reference, ...(cart ? {cart} : {}), ...(['account-delete', 'sessions-terminate'].includes(formId) && typeof value.loggedOut === 'boolean' ? { loggedOut: value.loggedOut } : {}) };
  }
  if (value.status === 'next-step' && Object.hasOwn(contracts, value.nextFormId) && /^[A-Za-z0-9_-]{24,128}$/.test(value.challengeId ?? '') &&
      Number.isSafeInteger(value.retryAfterSeconds) && value.retryAfterSeconds >= 0 && value.retryAfterSeconds <= 3600) {
    return { status: 'next-step', nextFormId: value.nextFormId, challengeId: value.challengeId, retryAfterSeconds: value.retryAfterSeconds };
  }
  if (value.status === 'authenticated' && value.authenticated === true) return { status: 'authenticated', authenticated: true };
  fail('FORM_RESULT_INVALID', 502, 'Не удалось подтвердить результат. Проверьте статус перед повторной отправкой.');
}

/** All effectful operations use the source runtime; no local success/CRM substitute. */
export function createFormsService({ runtime, getSession = session => session, getLocation = () => null }) {
  function assertCurrent(session, body) {
    const latest = getSession(session);
    if (!latest || latest.tokenHash !== session.tokenHash) fail('AUTH_EXPIRED', 401);
    scope(latest, body); return latest;
  }
  async function context(session, id, body) {
    const form = formFor(id), identity = scope(session, body);
    const request = { ...identity, formId: form.id };
    if (body.challengeId !== undefined) { if (!/^[A-Za-z0-9_-]{24,128}$/.test(body.challengeId)) fail('CHALLENGE_INVALID'); request.challengeId = body.challengeId; }
    const value = await runtime.call('forms.context', request);
    assertCurrent(session, body);
    return checkedContext(value, form);
  }
  async function submit(session, id, body, key) {
    idempotency(key); const form = formFor(id), identity = scope(session, body);
    const current = await context(session, id, body);
    if (!body.revision || body.revision !== current.revision) fail('FORM_CHANGED', 409, 'Условия формы изменились. Обновите её перед отправкой.');
    const values = checkValues(form, { ...current, buyerContext: identity.context }, body.values);
    const consents = checkConsents(form, body.consents, body.context);
    if (typeof values['public-author']==='string' && values['public-author'].trim() && !consents.some(c=>c.name==='publish_author'&&c.accepted)) fail('DISTRIBUTION_CONSENT_REQUIRED',422,'Подтвердите публикацию имени или отправьте материал анонимно.');
    const latest = assertCurrent(session, body);
    let location;
    if (['profile-city', 'address-create', 'address-edit'].includes(form.id)) {
      const supplied = values.location, selected = getLocation(latest);
      if (!isObject(supplied) || Object.keys(supplied).some(key => !['settlementId', 'version'].includes(key)) ||
          !selected?.settlement || supplied.settlementId !== selected.settlement.id || !Number.isSafeInteger(supplied.version) || supplied.version !== selected.version) {
        fail('LOCATION_CHANGED', 409, 'Выберите населённый пункт заново.');
      }
      location = { settlement: selected.settlement, version: selected.version };
    }
    return normalizeFormResult(await runtime.call('forms.submit', { ...identity, formId: form.id, values, consents, audit: { transportPeerIp: session.transportPeerIp ?? null, recordedAt: new Date().toISOString() }, revision: current.revision, ...(location ? { location } : {}),
      ...(current.challengeId ? { challengeId: current.challengeId } : {}) }, { idempotencyKey: key }), form.id);
  }
  async function upload(session, action, body, key) {
    if (!['create', 'chunk', 'complete', 'delete'].includes(action)) fail('NOT_FOUND', 404);
    const identity = scope(session, body); const form = formFor(body.formId);
    if (action === 'create') {
      const current = await context(session, form.id, body);
      const field = resolvedFields(form, current).find(f => f.name === body.fieldName && f.type === 'file');
      if (!field) fail('UPLOAD_FIELD_INVALID');
      uploadedFiles([{ uploadToken: 'validation-only-token-value', name: body.name, size: body.size }], field);
      if (!safeString(body.mimeType, 100)) fail('UPLOAD_INVALID');
      assertCurrent(session, body);
      return runtime.call('uploads.create', { ...identity, formId: form.id, fieldName: field.name, name: body.name, size: body.size, mimeType: body.mimeType, revision: current.revision });
    }
    if (!/^[A-Za-z0-9_-]{24,128}$/.test(body.uploadId ?? '')) fail('UPLOAD_INVALID');
    if (action === 'chunk' && (!Number.isSafeInteger(body.offset) || body.offset < 0 || body.offset > 20 * 1024 * 1024 || typeof body.base64 !== 'string' || body.base64.length > 22000 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.base64))) fail('UPLOAD_INVALID');
    if (action === 'complete') idempotency(key);
    return runtime.call('uploads.' + action, { ...identity, formId: form.id, uploadId: body.uploadId,
      ...(action === 'chunk' ? { offset: body.offset, base64: body.base64 } : {}) }, { idempotencyKey: key });
  }
  return { context, submit, upload,
    workspace: (session, kind, body) => { if (!/^[a-z-]{1,50}$/.test(kind)) fail('NOT_FOUND', 404); return runtime.call('workspace.read', { ...scope(session, body), kind }); },
    publications: (session, body) => runtime.call('publications.read', { ...scope(session, body), productId: targetFor({ productId: body.productId }).productId, filters: body.filters }),
  };
}
