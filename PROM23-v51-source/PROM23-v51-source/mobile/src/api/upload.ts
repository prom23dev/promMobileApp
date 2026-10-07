import {shopRequest,type ShopTransport} from './shop-transport';
import type { SiteFormRequest } from './site';

export type UploadAsset = { name: string; uri: string; size?: number; mimeType?: string; file?: Blob };
export type UploadProgress = { uri: string; status: 'reading' | 'uploading' | 'verifying' | 'complete' | 'error'; sent: number; total: number; error?: string };
export type UploadObserver = (progress: UploadProgress) => void;
export type UploadedAsset = { uploadToken: string; name: string; size: number };
type UploadScope = Pick<SiteFormRequest, 'formId' | 'context' | 'target' | 'challengeId' | 'revision'>;
const token = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{24,128}$/.test(value);
const key = () => `upload-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
const uploaded = new Map<string, { expires: number; result: UploadedAsset }>();
export async function uploadSiteAsset(asset: UploadAsset, fieldName: string, scope: UploadScope, signal?: AbortSignal,transport:ShopTransport=shopRequest, onProgress?: UploadObserver): Promise<UploadedAsset> {
  const safeScope: UploadScope = { formId: scope.formId, context: scope.context, target: scope.target, challengeId: scope.challengeId, revision: scope.revision };
  if (!asset || typeof asset.name !== 'string' || asset.name.length > 240 || /[\\/]/.test(asset.name) || !/^(file:|content:|blob:)/.test(asset.uri)) throw new Error('Не удалось прочитать выбранный файл.');
  const report = (status: UploadProgress['status'], sent: number, total: number) => onProgress?.({ uri: asset.uri, status, sent, total });
  report('reading', 0, asset.size ?? 0);
  const bytes = asset.file ? await asset.file.arrayBuffer() : await (await fetch(asset.uri, { signal })).arrayBuffer();
  if (!bytes.byteLength || bytes.byteLength > 20 * 1024 * 1024 || (asset.size !== undefined && asset.size !== bytes.byteLength)) throw new Error('Проверьте размер выбранного файла: до 20 МБ.');
  report('uploading', 0, bytes.byteLength);
  const started = await transport<{ uploadId: string }>('/v1/uploads/create', { method: 'POST', signal, body: { ...safeScope, fieldName, name: asset.name, size: bytes.byteLength, mimeType: asset.mimeType ?? 'application/octet-stream' } });
  if (!token(started?.uploadId)) throw new Error('Не удалось начать загрузку файла.');
  try {
    for (let offset = 0; offset < bytes.byteLength; offset += 16384) {
      const chunk = new Uint8Array(bytes, offset, Math.min(16384, bytes.byteLength - offset));
      let binary = ''; for (const byte of chunk) binary += String.fromCharCode(byte);
      const result = await transport<{ nextOffset: number }>('/v1/uploads/chunk', { method: 'POST', signal, body: { ...safeScope, uploadId: started.uploadId, offset, base64: btoa(binary) } });
      if (result.nextOffset !== offset + chunk.length) throw new Error('Не удалось подтвердить загрузку файла.');
      report('uploading', result.nextOffset, bytes.byteLength);
    }
    report('verifying', bytes.byteLength, bytes.byteLength);
    const complete = await transport<UploadedAsset>('/v1/uploads/complete', { method: 'POST', signal, key: key(), body: { ...safeScope, uploadId: started.uploadId } });
    if (!token(complete?.uploadToken) || complete.name !== asset.name || complete.size !== bytes.byteLength) throw new Error('Файл не прошёл проверку.');
    report('complete', bytes.byteLength, bytes.byteLength);
    return complete;
  } catch (error) {
    // Revoke only this unfinished upload. No automatic retry of form submission or file chunks.
    await transport('/v1/uploads/delete', { method: 'POST', body: { ...safeScope, uploadId: started.uploadId } }).catch(() => {});
    throw error;
  }
}
export async function prepareUploadedValues(request: SiteFormRequest,transport:ShopTransport=shopRequest, onProgress?: UploadObserver): Promise<Record<string, unknown>> {
  const upload = async (asset: UploadAsset, fieldName: string) => {
    for (const [id, value] of uploaded) if (value.expires < Date.now()) uploaded.delete(id);
    const cacheKey = request.idempotencyKey ? JSON.stringify([request.idempotencyKey, request.formId, request.context, request.target, fieldName, asset.uri, asset.name, asset.size]) : '';
    const previous = cacheKey ? uploaded.get(cacheKey) : undefined;
    if (previous) { onProgress?.({ uri: asset.uri, status: 'complete', sent: previous.result.size, total: previous.result.size }); return previous.result; }
    let result: UploadedAsset;
    try { result = await uploadSiteAsset(asset, fieldName, request, undefined, transport, onProgress); }
    catch (error) { onProgress?.({ uri: asset.uri, status: 'error', sent: 0, total: asset.size ?? 0, error: error instanceof Error ? error.message : 'Не удалось загрузить файл.' }); throw error; }
    if (cacheKey) { while (uploaded.size >= 100) uploaded.delete(uploaded.keys().next().value!); uploaded.set(cacheKey, { expires: Date.now() + 25 * 60 * 1000, result }); }
    return result;
  };
  const result: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(request.values)) {
    if (Array.isArray(value) && value.some(item => item && typeof item === 'object' && 'uri' in item)) {
      result[name] = []; for (const asset of value) (result[name] as UploadedAsset[]).push(await upload(asset as UploadAsset, name));
    } else if (Array.isArray(value) && value.some(item => item && typeof item === 'object' && 'values' in item)) {
      const rows = [];
      for (const row of value as {key: string; values: Record<string, unknown>}[]) {
        const fields: Record<string, unknown> = {};
        for (const [field, current] of Object.entries(row.values)) {
          if (Array.isArray(current) && current.some(item => item && typeof item === 'object' && 'uri' in item)) {
            fields[field] = []; for (const asset of current) (fields[field] as UploadedAsset[]).push(await upload(asset as UploadAsset, `${name}:${row.key}:${field}`));
          } else fields[field] = current;
        }
        rows.push({ key: row.key, values: fields });
      }
      result[name] = rows;
    } else result[name] = value;
  }
  return result;
}
