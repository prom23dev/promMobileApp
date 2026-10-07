import { currentPrivacy } from '../privacy-model';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { ContextId, Product, ShopState } from '../domain';

export type LocalAddress = { id: string; label?: string; address?: string; city?: string; recipient?: string; context?: ContextId; [key: string]: unknown };
export type OrderItem = { productId: string; name: string; quantity: number; unitPriceKopecks: number; lineTotalKopecks: number };
export type Quote = { id: string; context: ContextId; items: OrderItem[]; subtotalKopecks: number; deliveryKopecks: number; totalKopecks: number; currency: string; expiresAt: string; deliveryLabel: string };
export type LocalOrder = { id: string; number: string; context: ContextId; items: OrderItem[]; totalKopecks: number; deliveryKopecks: number; status: string; createdAt: string; deliveryLabel: string };
export type ServiceRecord = { id: string; number: string; status: string; createdAt: string; topic?: string; message?: string; reason?: string; orderId?: string };
export type CatalogResponse = { products: Product[]; categories: string[]; importedAt: string; mode: string };

const key = 'prom23-local-session-v2';
const configured = process.env.EXPO_PUBLIC_LOCAL_API_URL;
const base = configured?.replace(/\/$/, '') || (Platform.OS === 'web' ? '/api' : 'http://127.0.0.1:8090/api');
let token: string | null = null;
export class LocalApiError extends Error {
  fieldErrors?:Record<string,string>;
  retryAfterSeconds?:number;
  constructor(message: string, public status = 0, public code = 'NETWORK') { super(message); this.name = 'LocalApiError'; }
}
export async function readSession(): Promise<string | null> {
  try { token = Platform.OS === 'web' ? localStorage.getItem(key) : await SecureStore.getItemAsync(key); }
  catch { throw new LocalApiError('Не удалось восстановить ваши покупки. Повторите подключение', 0, 'STORAGE_READ'); }
  return token;
}
export async function saveSession(value: string | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (value) localStorage.setItem(key, value); else localStorage.removeItem(key);
    } else if (value) await SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    else await SecureStore.deleteItemAsync(key);
    token = value;
  } catch { throw new LocalApiError('Не удалось сохранить сессию на устройстве. Проверьте доступное место', 0, 'STORAGE_WRITE'); }
}
export async function localRequest<T>(path: string, options: { method?: string; body?: unknown; key?: string; signal?: AbortSignal } = {}): Promise<T> {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  const timer = setTimeout(cancel, 10000);
  options.signal?.addEventListener('abort', cancel, { once: true });
  if (options.signal?.aborted) controller.abort();
  try {
    const headers: Record<string, string> = { Accept: 'application/json', 'X-Prom23-Functional': currentPrivacy().functional ? '1' : '0' };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.key) headers['Idempotency-Key'] = options.key;
    const response = await fetch(`${base}${path}`, { method: options.method ?? 'GET', headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body), signal: controller.signal, credentials: 'omit', redirect: 'error' });
    if (response.redirected || !response.headers.get('content-type')?.toLowerCase().startsWith('application/json') || Number(response.headers.get('content-length')) > 2_000_000) throw new LocalApiError('Не удалось прочитать ответ магазина', response.status, 'FORMAT');
    const raw = await response.text();
    if (raw.length > 2_000_000) throw new LocalApiError('Ответ магазина слишком большой', response.status, 'FORMAT');
    const value = JSON.parse(raw);
    if (!response.ok) {
      const error=new LocalApiError(value?.error?.message || 'Не удалось выполнить действие',response.status,value?.error?.code);
      if(value?.error?.fields&&typeof value.error.fields==='object'&&!Array.isArray(value.error.fields))error.fieldErrors=Object.fromEntries(Object.entries(value.error.fields).slice(0,100).filter(([k,v])=>/^[A-Za-z0-9_.:\[\]-]{1,100}$/.test(k)&&typeof v==='string'&&v.length<300)) as Record<string,string>;
      if(Number.isSafeInteger(value?.error?.retryAfterSeconds)&&value.error.retryAfterSeconds>=0&&value.error.retryAfterSeconds<=3600)error.retryAfterSeconds=value.error.retryAfterSeconds;
      throw error;
    }
    if (!value || !('data' in value)) throw new LocalApiError('Сервер вернул неожиданные данные', response.status, 'FORMAT');
    return value.data as T;
  } catch (error) {
    if (error instanceof LocalApiError) throw error;
    throw new LocalApiError(controller.signal.aborted ? 'Время ожидания истекло. Попробуйте ещё раз' : 'Не удалось связаться с магазином. Проверьте подключение и повторите попытку');
  } finally { clearTimeout(timer); options.signal?.removeEventListener('abort', cancel); }
}
export async function createLocalSession(): Promise<ShopState> {
  const session = await localRequest<{ token: string; state: ShopState }>('/sessions', { method: 'POST', body: {} });
  await saveSession(session.token);
  return session.state;
}
