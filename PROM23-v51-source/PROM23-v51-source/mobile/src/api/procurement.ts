import { procurementErrors, type ProcurementRequest } from '../procurement';
import { loadSiteFormContext, type SiteFormRequest } from './site';
import { prepareUploadedValues, type UploadObserver } from './upload';
import { shopRequest, type ShopTransport } from './shop-transport';
import { businessRequestConsents } from '../forms/siteForms';

export type ProcurementResult = { status: 'accepted'; reference: string; deliveryStatus: 'complete' | 'pending' };
export async function submitProcurement(value: ProcurementRequest, options: { idempotencyKey: string; ensureCurrent?: () => void; onUploadProgress?: UploadObserver }, transport: ShopTransport = shopRequest): Promise<ProcurementResult> {
  const required = businessRequestConsents;
  if (Object.keys(procurementErrors(value)).length || value.consent.length !== required.length || required.some(expected => {
    const supplied = value.consent.filter(item => item.name === expected.name);
    return supplied.length !== 1 || supplied[0].accepted !== true || JSON.stringify([...supplied[0].documentIds].sort()) !== JSON.stringify([...expected.documents].sort());
  })) throw new Error('Проверьте обязательные поля и согласия.');
  if (!/^[A-Za-z0-9_-]{10,120}$/.test(options.idempotencyKey)) throw new Error('Откройте форму заново.');
  const guarded: ShopTransport = (path, request) => { options.ensureCurrent?.(); return transport(path, request); };
  const schema = await loadSiteFormContext({ formId: 'procurement', context: value.context }, guarded);
  const request: SiteFormRequest = { formId: 'procurement', context: value.context, revision: schema.revision, idempotencyKey: options.idempotencyKey, consents: value.consent,
    values: { 'first-name': value.name, phone: value.phone, email: value.email, 'company-name': value.company, inn: value.inn, 'comment-text': value.comment,
      mode: value.mode, 'files[]': value.files, location: { settlementId: value.settlementId, version: value.locationVersion } } };
  const values = await prepareUploadedValues(request, guarded, options.onUploadProgress);
  const result = await guarded<ProcurementResult>('/v1/procurement/submit', { method: 'POST', key: options.idempotencyKey, body: { context: value.context, revision: schema.revision, values, consents: value.consent } });
  if (result?.status !== 'accepted' || !/^business-[1-9][0-9]{0,15}$/.test(result.reference ?? '') || !['complete', 'pending'].includes(result.deliveryStatus)) throw new Error('Не удалось подтвердить результат. Проверьте статус перед повторной отправкой.');
  return result;
}
