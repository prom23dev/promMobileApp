import {shopRequest,type ShopTransport} from './shop-transport';
import type { ContextId } from '../domain';
import { prepareUploadedValues } from './upload';
// Connection boundary for the production Bitrix API. Never route real forms to the local sandbox.
import type { SiteFormField } from '../forms/siteForms';
import { safePublicationMedia } from '../publication-domain';
export type SiteFormTarget = Partial<Record<'productId' | 'orderId' | 'organizationId' | 'addressId' | 'cardId' | 'sessionId' | 'reviewId' | 'questionId' | 'parentId' | 'appealId' | 'notificationId', string>>;
export type ExistingMediaItem = { id: string; kind: 'image' | 'video'; url: string; alt: string };
export type SiteFormContext = {
  revision?: string;
  fields?: SiteFormField[];
  initialValues?: Record<string, string | string[] | boolean>;
  options?: Record<string, { value: string; label: string }[]>;
  repeatedItems?: Record<string, { key: string; label: string; quantityMax?: number; options?: Record<string, { value: string; label: string }[]> }[]>;
  existingMedia?: ExistingMediaItem[];
  challengeId?: string;
  retryAfterSeconds?: number;
};
export type SiteFormRequest = {
  formId: string;
  values: Record<string, unknown>;
  consents: { name: string; accepted: boolean; documentIds: string[] }[];
  context: ContextId;
  target?: SiteFormTarget;
  challengeId?: string;
  revision?: string;
  idempotencyKey?: string;
};
export type SiteFormResult =
  | { status: 'accepted'; reference: string; nextFormId?: never; challengeId?: never; retryAfterSeconds?: never }
  | { status: 'next-step'; reference?: never; nextFormId: string; challengeId: string; retryAfterSeconds: number }
  | { status: 'authenticated'; authenticated: true; reference?: never; nextFormId?: never; challengeId?: never; retryAfterSeconds?: never };
export class SiteUnavailableError extends Error {
  constructor() { super('Сервис временно недоступен. Данные не отправлены. Вы можете связаться с менеджером.'); }
}
export async function loadSiteFormContext(request: Pick<SiteFormRequest, 'formId' | 'context' | 'target' | 'challengeId'>,transport:ShopTransport=shopRequest): Promise<SiteFormContext> {
  const { formId, ...body } = request;
  const result = await transport<SiteFormContext>(`/v1/forms/${encodeURIComponent(formId)}/context`, { method: 'POST', body });
  if (!result || typeof result.revision !== 'string' || !result.revision || result.revision.length > 128 ||
    (result.challengeId !== undefined && !/^[A-Za-z0-9_-]{24,128}$/.test(result.challengeId))) throw new SiteUnavailableError();
  // existingMedia (review-edit only) is reference data, not a submittable field value; keep it out of
  // initialValues so it never gets merged into the form's editable values state.
  const rawExistingMedia = result.initialValues?.existingMedia;
  if (rawExistingMedia !== undefined) {
    const { existingMedia: _removed, ...initialValues } = result.initialValues as Record<string, unknown>;
    result.initialValues = initialValues as SiteFormContext['initialValues'];
    result.existingMedia = Array.isArray(rawExistingMedia) ? rawExistingMedia.filter((item): item is ExistingMediaItem =>
      !!item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string' && ['image', 'video'].includes((item as { kind?: unknown }).kind as string) &&
      typeof (item as { url?: unknown }).url === 'string' && safePublicationMedia((item as { url: string }).url) && typeof (item as { alt?: unknown }).alt === 'string') : [];
  }
  return result;
}
export async function submitSiteForm(request: SiteFormRequest,transport:ShopTransport=shopRequest): Promise<SiteFormResult> {
  if (!request.revision) throw new Error('Обновите форму перед отправкой.');
  const values = await prepareUploadedValues(request,transport);
  const { formId, idempotencyKey, ...body } = request;
  const result = await transport<SiteFormResult>(`/v1/forms/${encodeURIComponent(formId)}/submit`, { method: 'POST', body: { ...body, values }, key: idempotencyKey ?? submissionKey() });
  if (result?.status === 'accepted' && typeof result.reference==='string' && /^[A-Za-z0-9_-]{1,100}$/.test(result.reference)) return result;
  if (result?.status === 'next-step' && /^[a-z-]{1,60}$/.test(result.nextFormId) && /^[A-Za-z0-9_-]{24,128}$/.test(result.challengeId) && Number.isSafeInteger(result.retryAfterSeconds) && result.retryAfterSeconds >= 0 && result.retryAfterSeconds <= 3600) return result;
  if (result?.status === 'authenticated' && result.authenticated === true) return result;
  throw new Error('Не удалось подтвердить результат. Проверьте статус перед повторной отправкой.');
}
export function submissionKey(): string {
  // UUID is not an authentication credential. A new explicit submit gets one key; no automatic mutation retries.
  return globalThis.crypto?.randomUUID?.() ?? `form-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export type WorkspaceRecord = {
  id: string; title: string; category?: string; details: { label: string; value: string }[];
  actions?: { label: string; formId: string; target: SiteFormTarget }[];
};
export type WorkspaceData = { records: WorkspaceRecord[]; available: boolean };
export async function loadSiteWorkspace(kind: string, context: SiteFormRequest['context'],transport:ShopTransport=shopRequest): Promise<WorkspaceData> {
  const value = await transport<WorkspaceData>(`/v1/workspace/${encodeURIComponent(kind)}`, { method: 'POST', body: { context } });
  if (!value || value.available !== true || !Array.isArray(value.records) || value.records.length > 500 || value.records.some(row => typeof row.id !== 'string' || typeof row.title !== 'string' || !Array.isArray(row.details))) throw new SiteUnavailableError();
  return value;
}
export type ProductPublication = {
  id: string; productId: string; kind: 'review' | 'question'; author: string;
  publishedLabel: string; publishedAt?: string; text: string; rating?: number;
  media?: { id: string; kind: 'image' | 'video'; url: string; alt: string; posterUrl?: string }[];
  replies?: { id: string; author: string; text: string; publishedLabel: string }[];
  actions: ('reply' | 'edit' | 'delete')[];
};
export type PublicationFilters = { rating: number | null; withMedia: boolean; withReplies: boolean; sort: 'new' | 'high-rate' | 'low-rate' };
export async function loadProductPublications(productId: string, context: SiteFormRequest['context'], filters?: PublicationFilters, cursor?: string | null, transport: ShopTransport = shopRequest): Promise<{ items: ProductPublication[]; available: boolean; nextCursor: string | null }> {
  const value = await transport<{ items: ProductPublication[]; available: boolean; nextCursor: string | null }>('/v1/publications', { method: 'POST', body: { productId, context, filters, ...(cursor ? { cursor } : {}) } });
  if (!value || value.available !== true || !Array.isArray(value.items) || value.items.length > 20 ||
    (value.nextCursor !== null && (typeof value.nextCursor !== 'string' || !/^[0-9]{1,7}$/.test(value.nextCursor))) ||
    value.items.some(item => item.productId !== productId || !['review', 'question'].includes(item.kind) || typeof item.id !== 'string' || typeof item.text !== 'string')) throw new SiteUnavailableError();
  return value;
}
