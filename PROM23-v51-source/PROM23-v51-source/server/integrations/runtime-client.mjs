import { createHash, createHmac, randomBytes } from 'node:crypto';
import { constants, closeSync, fstatSync, openSync, readFileSync } from 'node:fs';

export const RUNTIME_PROTOCOL = 'prom23-runtime-v1';
export const RUNTIME_OPERATIONS = Object.freeze([
  'buyer.organizations', 'buyer.select', 'checkout.addresses', 'commerce.offer', 'checkout.options', 'cart.quote', 'cart.coupon', 'order.submit', 'payment.session', 'payment.status',
  'forms.context', 'forms.submit', 'workspace.read', 'publications.read',
  'uploads.create', 'uploads.chunk', 'uploads.complete', 'uploads.delete', 'procurement.submit',
  'auth.session', 'auth.logout',
]);
const SAFE_ERRORS = new Map([
  ['ADDRESS_CONFIRMATION_REQUIRED', [422, 'Проверьте улицу и дом: выберите адрес из подсказок.']],
  ['ADDRESS_REQUIRED', [422, 'Введите улицу и номер дома.']],
  ['AUTH_REQUIRED', [401, 'Войдите в аккаунт.']],
  ['AUTH_EXPIRED', [401, 'Срок входа истёк. Войдите снова.']],
  ['FORBIDDEN', [403, 'Недостаточно прав для этого действия.']],
  ['NOT_FOUND', [404, 'Данные не найдены.']],
  ['VALIDATION_ERROR', [422, 'Проверьте введённые данные.']],
  ['INVALID_CODE', [422, 'Проверьте код подтверждения.']],
  ['CODE_EXPIRED', [409, 'Срок действия кода истёк. Запросите новый код.']],
  ['STALE_CONTEXT', [409, 'Данные изменились. Обновите страницу.']],
  ['STALE_QUOTE', [409, 'Стоимость заказа изменилась. Повторите расчёт.']],
  ['IDEMPOTENCY_CONFLICT', [409, 'Повторный запрос не соответствует исходному.']],
  ['RATE_LIMITED', [429, 'Слишком много запросов. Попробуйте позже.']],
  ['INTEGRATION_UNAVAILABLE', [503, 'Сервис временно недоступен.']],
  ['QUOTE_EXPIRED', [409, 'Срок расчёта истёк. Обновите стоимость заказа.']],
  ['QUOTE_CHANGED', [409, 'Стоимость или условия заказа изменились. Повторите расчёт.']],
  ['PAYMENT_NOT_AVAILABLE', [409, 'Для этого заказа оплата сейчас недоступна.']],
  ['PAYMENT_LINK_EXPIRED', [409, 'Время действия ссылки истекло. Обновите статус платежа в заказе.']],
  ['PAYMENT_CHANGED', [409, 'Данные платежа изменились. Обновите заказ перед оплатой.']],
  ['PAYMENT_PROVIDER_UNAVAILABLE', [503, 'Не удалось проверить платёж. Повторите проверку статуса позже.']],
  ['DELIVERY_NOT_AVAILABLE', [422, 'Выбранный способ получения недоступен. Выберите другой.']],
  ['TARGET_REQUIRED', [422, 'Выберите запись, с которой хотите продолжить.']],
  ['ORGANIZATION_REQUIRED', [409, 'Выберите организацию для продолжения.']],
  ['LOCATION_MAPPING_REQUIRED', [503, 'Не удалось определить условия для выбранного населённого пункта.']],
  ['SOURCE_LEGACY_UNAVAILABLE', [409, 'Этот способ пока недоступен. Выберите другой вариант или свяжитесь с магазином.']],
  ['RESULT_RECONCILIATION_REQUIRED', [409, 'Результат отправки уточняется. Проверьте историю перед повторным обращением.']],
  ['ORDER_NOT_COMPLETED', [409, 'Возврат доступен после завершения заказа.']],
  ['RETURN_ALREADY_EXISTS', [409, 'Заявка на возврат этого заказа уже создана.']],
  ['PUBLICATION_HAS_REPLIES', [409, 'Публикацию с ответами нельзя изменить.']],
  ['PUBLICATION_UNCHANGED', [422, 'Текст публикации не изменился.']],
  ['ORDER_CANNOT_CANCEL', [409, 'Заказ в текущем статусе нельзя отменить.']],
  ['CONTACT_ALREADY_USED', [422, 'Этот контакт уже используется.']],
  ['BUYER_SELECT_REQUIRED', [409, 'Выберите организацию в переключателе покупателя.']],
  ['PAYMENT_ROUTE_REQUIRED', [409, 'Откройте оплату из заказа.']],
]);
const FIELD_ERROR_MESSAGES = Object.freeze({ INVALID: 'Проверьте значение поля.', REQUIRED: 'Заполните поле.', EMAIL: 'Проверьте email.', PHONE: 'Проверьте номер телефона.',
  PASSWORD: 'Минимум 8 символов: прописная и строчная буквы, цифра.', PASSWORD_REPEAT: 'Пароли не совпадают.',
  CODE: 'Проверьте код подтверждения.', OPTION: 'Выберите значение из списка.', FILE: 'Проверьте формат и размер файла.',
  LENGTH: 'Сократите значение поля.', CONSENT: 'Подтвердите согласие.' });
export class RuntimeError extends Error {
  constructor(code, status = 503, message = 'Сервис временно недоступен. Попробуйте позже.') {
    super(message); this.name = 'RuntimeError'; this.code = code; this.status = status;
  }
}
const failure = (code, status = 503) => new RuntimeError(code, status);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const digest = value => createHash('sha256').update(value).digest('hex');
export function signRuntimeRequest({ key, path, timestamp, nonce, body }) {
  return createHmac('sha256', key).update(`POST\n${path}\n${timestamp}\n${nonce}\n${digest(body)}`).digest('hex');
}

function readKey(path) {
  let fd;
  try {
    // Avoid a check/read symlink race and reject shared-readable secret files.
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    const stat = fstatSync(fd);
    if (!stat.isFile() || (stat.mode & 0o077) !== 0 || stat.size > 256) throw new Error();
    const key = readFileSync(fd, 'utf8').trim();
    if (!/^[a-f0-9]{64}$/i.test(key)) throw new Error();
    return key;
  } catch { throw failure('RUNTIME_KEY_FILE_INVALID'); }
  finally { if (fd !== undefined) closeSync(fd); }
}

function configFor(options) {
  const env = options.env ?? process.env;
  const address = options.url ?? env.PROM23_RUNTIME_URL;
  const keyFile = options.keyFile ?? env.PROM23_RUNTIME_KEY_FILE;
  const allowed = options.allowedOrigins ?? env.PROM23_RUNTIME_ALLOWED_ORIGINS;
  if (!address && !keyFile && !allowed) return null;
  let url, origins;
  try {
    url = new URL(address);
    origins = typeof allowed === 'string' ? JSON.parse(allowed) : allowed;
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
        /(^|\.)zavod-antibpla\.ru$/i.test(url.hostname) || !Array.isArray(origins) || !origins.length ||
        origins.length > 10 || !origins.every(origin => new URL(origin).origin === origin && new URL(origin).protocol === 'https:') ||
        !origins.includes(url.origin) || typeof keyFile !== 'string' || !keyFile.startsWith('/')) throw new Error();
  } catch { throw failure('RUNTIME_CONFIG_INVALID'); }
  const timeoutMs = options.timeoutMs ?? 8000;
  const maxRequestBytes = options.maxRequestBytes ?? 128 * 1024;
  const maxResponseBytes = options.maxResponseBytes ?? 1024 * 1024;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000 ||
      !Number.isSafeInteger(maxRequestBytes) || maxRequestBytes < 256 || maxRequestBytes > 1024 * 1024 ||
      !Number.isSafeInteger(maxResponseBytes) || maxResponseBytes < 256 || maxResponseBytes > 4 * 1024 * 1024) throw failure('RUNTIME_CONFIG_INVALID');
  return { url, keyFile, timeoutMs, maxRequestBytes, maxResponseBytes };
}

async function boundedJson(response, limit) {
  if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') ?? '')) throw failure('RUNTIME_RESPONSE_INVALID', 502);
  const declared = Number(response.headers.get('content-length'));
  if (declared > limit) { await response.body?.cancel(); throw failure('RUNTIME_RESPONSE_TOO_LARGE', 502); }
  if (!response.body) throw failure('RUNTIME_RESPONSE_INVALID', 502);
  const reader = response.body.getReader(); const chunks = []; let length = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      length += value.byteLength;
      if (length > limit) { await reader.cancel(); throw failure('RUNTIME_RESPONSE_TOO_LARGE', 502); }
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (error) {
    if (error instanceof RuntimeError) throw error;
    throw failure('RUNTIME_RESPONSE_INVALID', 502);
  } finally { reader.releaseLock(); }
}

/** Configurable server-to-server transport; remote runtime resolves the actor from sessionKey.
 * Construction/readiness make no network requests. Configuration never enables a fake actor.
 * Operation-specific validators and side-effect authorization live in BFF services and remote wrappers.
 */
export function createRuntimeClient(options = {}) {
  let config, configError;
  try { config = configFor(options); } catch (error) { configError = error; }
  const fetcher = options.fetcher ?? globalThis.fetch;
  function readiness() {
    if (configError) return { configured: false, verified: false, code: configError.code };
    if (!config) return { configured: false, verified: false, code: 'RUNTIME_NOT_CONFIGURED' };
    try { readKey(config.keyFile); }
    catch (error) { return { configured: false, verified: false, code: error.code }; }
    return { configured: true, verified: false, code: 'RUNTIME_NOT_VERIFIED' };
  }
  async function call(operation, payload, callOptions = {}) {
    if (!RUNTIME_OPERATIONS.includes(operation)) throw failure('RUNTIME_OPERATION_UNSUPPORTED', 400);
    if (configError) throw configError;
    if (!config) throw failure('RUNTIME_NOT_CONFIGURED');
    if (!object(payload) || !/^[a-f0-9]{64}$/.test(payload.sessionKey ?? '') ||
        ['actor', 'userId', 'permissions', 'authenticated'].some(key => Object.hasOwn(payload, key))) throw failure('RUNTIME_IDENTITY_INVALID', 400);
    const idempotencyKey = callOptions.idempotencyKey;
    if (idempotencyKey !== undefined && !/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey)) throw failure('RUNTIME_IDEMPOTENCY_INVALID', 400);
    const nonce = randomBytes(24).toString('hex');
    const timestamp = String(Math.floor(Date.now() / 1000));
    let body;
    try { body = JSON.stringify({ protocol: RUNTIME_PROTOCOL, requestId: nonce, operation, ...(idempotencyKey ? { idempotencyKey } : {}), payload }); }
    catch { throw failure('RUNTIME_PAYLOAD_INVALID', 400); }
    if (Buffer.byteLength(body) > config.maxRequestBytes) throw failure('RUNTIME_REQUEST_TOO_LARGE', 413);
    const key = readKey(config.keyFile);
    const headers = { 'Content-Type': 'application/json', Accept: 'application/json',
      'X-Prom23-Timestamp': timestamp, 'X-Prom23-Nonce': nonce,
      'X-Prom23-Signature': signRuntimeRequest({ key, path: config.url.pathname, timestamp, nonce, body }) };
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    const controller = new AbortController();
    let timedOut = false;
    const cancel = () => controller.abort();
    if (callOptions.signal?.aborted) throw failure('RUNTIME_CANCELLED', 499);
    callOptions.signal?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, config.timeoutMs);
    try {
      const response = await fetcher(config.url.href, { method: 'POST', headers, body, redirect: 'manual',
        credentials: 'omit', cache: 'no-store', signal: controller.signal });
      if (response.status >= 300 && response.status < 400) { await response.body?.cancel(); throw failure('RUNTIME_REDIRECT_FORBIDDEN', 502); }
      const value = await boundedJson(response, config.maxResponseBytes);
      if (value?.protocol !== RUNTIME_PROTOCOL || value?.operation !== operation || value?.requestId !== nonce) throw failure('RUNTIME_RESPONSE_MISMATCH', 502);
      if (!response.ok || value.error) {
        const safe = SAFE_ERRORS.get(value.error?.code);
        if (safe) {
          const error = new RuntimeError(value.error.code, safe[0], safe[1]);
          if (value.error.code === 'VALIDATION_ERROR' && object(value.error.fields)) {
            error.fieldErrors = Object.fromEntries(Object.entries(value.error.fields).slice(0, 100)
              .filter(([name, code]) => /^[A-Za-z0-9_.:\[\]-]{1,100}$/.test(name) && Object.hasOwn(FIELD_ERROR_MESSAGES, code))
              .map(([name, code]) => [name, FIELD_ERROR_MESSAGES[code]]));
          }
          if (Number.isSafeInteger(value.error.retryAfterSeconds) && value.error.retryAfterSeconds >= 0 && value.error.retryAfterSeconds <= 3600) error.retryAfterSeconds = value.error.retryAfterSeconds;
          throw error;
        }
        throw failure('RUNTIME_REJECTED', response.status === 429 ? 429 : 502);
      }
      if (!object(value.data)) throw failure('RUNTIME_RESPONSE_INVALID', 502);
      return value.data;
    } catch (error) {
      if (timedOut) throw failure('RUNTIME_TIMEOUT', 504);
      if (controller.signal.aborted) throw failure('RUNTIME_CANCELLED', 499);
      if (error instanceof RuntimeError) throw error;
      throw failure('RUNTIME_UNREACHABLE', 502);
    } finally { clearTimeout(timer); callOptions.signal?.removeEventListener('abort', cancel); }
  }
  return Object.freeze({ call, readiness });
}
