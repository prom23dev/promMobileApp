import { readFileSync } from 'node:fs';
import { validBuyerContext } from '../buyer-context.mjs';
import { RuntimeError } from './runtime-client.mjs';

const contract = JSON.parse(readFileSync(new URL('./form-contracts.json', import.meta.url))).forms.procurement;
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
const fail = (code, status = 422, message = 'Проверьте данные заявки.') => { throw new RuntimeError(code, status, message); };
const text = (value, max, required = false) => typeof value === 'string' && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value) && (!required || !!value.trim());
export function procurementValues(values) {
  const allowed = [...contract.fields.map(field => field.name), 'location'];
  if (!object(values) || Object.keys(values).some(key => !allowed.includes(key))) fail('FORM_FIELD_UNKNOWN');
  for (const field of contract.fields.filter(field => field.type !== 'file')) if (!text(values[field.name], field.maxLength, field.required)) fail('VALIDATION_ERROR');
  if (!/^\+?[\d\s()\-]{10,25}$/.test(values.phone) || values.phone.replace(/\D/g, '').length < 10 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || (values.inn && !/^(?:\d{10}|\d{12})$/.test(values.inn)) || !['list', 'selection'].includes(values.mode)) fail('VALIDATION_ERROR');
  const files = values['files[]'], field = contract.fields.find(field => field.type === 'file');
  if (!Array.isArray(files) || files.length > field.maxFiles || new Set(files.map(file => file?.uploadToken)).size !== files.length || files.some(file =>
    !object(file) || Object.keys(file).some(key => !['uploadToken', 'name', 'size'].includes(key)) || !/^[a-f0-9]{48}$/.test(file.uploadToken ?? '') ||
    !text(file.name, 240, true) || /[\\/\r\n]/.test(file.name) || !Number.isSafeInteger(file.size) || file.size < 1 || file.size > field.maxBytes ||
    !field.acceptedExtensions.some(extension => file.name.toLowerCase().endsWith('.' + extension)))) fail('UPLOAD_INVALID');
  if (!values['comment-text'].trim() && !files.length) fail('NEED_REQUIRED');
  const location = values.location;
  if (!object(location) || Object.keys(location).some(key => !['settlementId', 'version'].includes(key)) ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(location.settlementId ?? '') || !Number.isSafeInteger(location.version) || location.version < 1) fail('SETTLEMENT_REQUIRED');
  return values;
}
export function procurementConsents(values) {
  if (!Array.isArray(values) || values.length !== contract.consents.length) fail('CONSENT_REQUIRED');
  for (const required of contract.consents) {
    const matches = values.filter(value => object(value) && value.name === required.name);
    if (matches.length !== 1 || matches[0].accepted !== true || !Array.isArray(matches[0].documentIds) ||
        JSON.stringify([...matches[0].documentIds].sort()) !== JSON.stringify([...required.documents].sort())) fail('CONSENT_REQUIRED');
  }
  return values;
}
export function procurementResult(value) {
  if (!object(value) || value.status !== 'accepted' || !/^business-[1-9][0-9]{0,15}$/.test(value.reference ?? '') || !['complete', 'pending'].includes(value.deliveryStatus)) {
    fail('PROCUREMENT_RESULT_INVALID', 502, 'Не удалось подтвердить результат. Проверьте статус перед повторной отправкой.');
  }
  return { status: 'accepted', reference: value.reference, deliveryStatus: value.deliveryStatus };
}
/** Dedicated source business pipeline: no local success, invented organization or discarded file. */
export function createProcurementService({ runtime, getSession = session => session, getLocation = () => null }) {
  function current(session, body) {
    const latest = getSession(session);
    if (!latest || latest.tokenHash !== session.tokenHash) fail('AUTH_EXPIRED', 401);
    if (!object(body) || !validBuyerContext(body.context) || body.context === 'organization-demo' || latest.state.context !== body.context) fail('STALE_CONTEXT', 409);
    const selected = getLocation(latest), identity = body.values.location;
    if (!selected?.settlement || identity.settlementId !== selected.settlement.id || identity.version !== selected.version) fail('LOCATION_CHANGED', 409, 'Населённый пункт изменился. Проверьте заявку.');
    return { sessionKey: latest.tokenHash, context: body.context, target: {}, formId: 'procurement', location: { settlement: selected.settlement, version: selected.version } };
  }
  return { async submit(session, body, key) {
    if (!/^[A-Za-z0-9_-]{10,120}$/.test(key ?? '')) fail('IDEMPOTENCY_REQUIRED', 400);
    if (!object(body) || Object.keys(body).some(key => !['context', 'revision', 'values', 'consents'].includes(key))) fail('FORM_VALUES_INVALID');
    const values = procurementValues(body.values), consents = procurementConsents(body.consents);
    const identity = current(session, body);
    const schema = await runtime.call('forms.context', identity);
    if (!schema || schema.formId !== 'procurement' || typeof schema.revision !== 'string' || !schema.revision || schema.revision !== body.revision) fail('FORM_CHANGED', 409);
    const fresh = current(session, body);
    return procurementResult(await runtime.call('procurement.submit', { ...fresh, revision: schema.revision, values, consents }, { idempotencyKey: key }));
  } };
}
