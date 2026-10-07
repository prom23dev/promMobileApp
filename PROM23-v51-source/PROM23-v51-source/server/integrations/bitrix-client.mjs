import { createHmac, createHash, randomBytes } from 'node:crypto';
import { readFileSync, lstatSync } from 'node:fs';
import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';

export const BRIDGE_PROTOCOL = 'prom23-bitrix-readonly-v1';
export const READ_OPERATIONS = ['readiness', 'order.export', 'documents.manifest', 'notifications.export', 'preferences.export'];
const SAFE_REMOTE_CODES = new Set(['BITRIX_NOT_CONFIGURED', 'BRIDGE_UNAUTHORIZED', 'BRIDGE_REPLAY', 'BRIDGE_RATE_LIMIT',
  'BITRIX_CORE_MISSING', 'BITRIX_MODULE_MISSING', 'BITRIX_SCHEMA_MISSING', 'PILOT_USER_NOT_ALLOWED', 'ORDER_NOT_FOUND',
  'ORDER_CONTEXT_UNRESOLVED', 'ORGANIZATION_CONTEXT_REQUIRED', 'BITRIX_WRITE_NOT_READY', 'BITRIX_READ_UNAVAILABLE',
  'BRIDGE_PRIVATE_STORAGE_REQUIRED', 'TRUSTED_ACTOR_REQUIRED', 'SOURCE_CONTEXT_MISMATCH', 'INVALID_SOURCE_MONEY',
  'SOURCE_EXPORT_TOO_LARGE', 'UNSUPPORTED_SOURCE_CURRENCY', 'INVALID_SOURCE_QUANTITY', 'INVALID_BODY', 'INVALID_JSON']);
export class BridgeError extends Error {
  constructor(code, status = 503) { super(code); this.name = 'BridgeError'; this.code = code; this.status = status; }
}
const sha256 = body => createHash('sha256').update(body).digest('hex');
export function signRequest({ key, target, timestamp, nonce, body }) {
  return createHmac('sha256', key).update(`POST\n${target}\n${timestamp}\n${nonce}\n${sha256(body)}`).digest('hex');
}
export function loadBridgeConfig(env = process.env) {
  if (env.PROM23_BITRIX_READ_ENABLED !== '1') return { enabled: false };
  let url;
  try { url = new URL(env.PROM23_BITRIX_BRIDGE_URL); }
  catch { throw new BridgeError('BRIDGE_CONFIG_INVALID'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      url.origin !== env.PROM23_BITRIX_ALLOWED_ORIGIN || url.pathname !== '/local/prom23-mobile/endpoint.php' ||
      /(^|\.)zavod-antibpla\.ru$/i.test(url.hostname)) throw new BridgeError('BRIDGE_ORIGIN_NOT_APPROVED');
  const keyId = env.PROM23_BITRIX_BRIDGE_KEY_ID;
  if (!/^[a-zA-Z0-9_-]{1,32}$/.test(keyId ?? '')) throw new BridgeError('BRIDGE_KEY_ID_INVALID');
  let key;
  try {
    const stats = lstatSync(env.PROM23_BITRIX_BRIDGE_KEY_FILE);
    if (!stats.isFile() || (stats.mode & 0o077) !== 0 || stats.size > 256) throw new Error();
    key = readFileSync(env.PROM23_BITRIX_BRIDGE_KEY_FILE, 'utf8').trim();
    if (!/^[a-f0-9]{64}$/i.test(key)) throw new Error();
  } catch { throw new BridgeError('BRIDGE_KEY_FILE_INVALID'); }
  return { enabled: true, url, keyId, key };
}

/** Server-only adapter. It intentionally has no path that creates orders, deals, payments or messages. */
export function createBitrixReader(config, { allowLoopbackHttpForTests = false, timeoutMs = 5000, maxResponseBytes = 1024 * 1024 } = {}) {
  function validateActor(actor) {
    if (!actor || !Number.isSafeInteger(actor.userId) || actor.userId <= 0 || !Number.isSafeInteger(actor.organizationId) || actor.organizationId < 0 ||
        Object.keys(actor).some(key => !['userId', 'organizationId'].includes(key))) throw new BridgeError('TRUSTED_ACTOR_REQUIRED', 400);
  }
  async function call(operation, params = {}) {
    if (!READ_OPERATIONS.includes(operation)) throw new BridgeError('BITRIX_WRITE_NOT_READY');
    const allowedKeys = operation === 'readiness' ? [] : ['order.export', 'documents.manifest'].includes(operation) ? ['actor', 'orderId'] : ['actor'];
    if (!params || Array.isArray(params) || typeof params !== 'object' || Object.keys(params).some(key => !allowedKeys.includes(key))) throw new BridgeError('BRIDGE_PARAMETERS_INVALID', 400);
    if (!config.enabled) throw new BridgeError('BITRIX_NOT_CONFIGURED');
    const url = new URL(config.url);
    const testHttp = allowLoopbackHttpForTests && url.protocol === 'http:' && url.hostname === '127.0.0.1';
    if (!testHttp && url.protocol !== 'https:') throw new BridgeError('BRIDGE_TLS_REQUIRED');
    if (url.pathname !== '/local/prom23-mobile/endpoint.php' || url.username || url.password || url.search || url.hash || /(^|\.)zavod-antibpla\.ru$/i.test(url.hostname)) throw new BridgeError('BRIDGE_URL_INVALID');
    if (operation !== 'readiness') validateActor(params.actor);
    if (['order.export', 'documents.manifest'].includes(operation) && (!Number.isSafeInteger(params.orderId) || params.orderId <= 0)) throw new BridgeError('ORDER_ID_REQUIRED', 400);
    const body = JSON.stringify({ operation, ...params });
    if (Buffer.byteLength(body) > 32768) throw new BridgeError('BRIDGE_BODY_TOO_LARGE', 400);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = randomBytes(16).toString('hex');
    const signature = signRequest({ key: config.key, target: url.pathname, timestamp, nonce, body });
    const data = await new Promise((resolve, reject) => {
      const req = (testHttp ? httpRequest : httpsRequest)(url, { method: 'POST', timeout: timeoutMs,
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Content-Length': Buffer.byteLength(body),
          'X-Prom23-Key-Id': config.keyId, 'X-Prom23-Timestamp': timestamp, 'X-Prom23-Nonce': nonce, 'X-Prom23-Signature': signature } }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400) { res.resume(); reject(new BridgeError('BRIDGE_REDIRECT_FORBIDDEN')); return; }
        let length = 0; const chunks = [];
        res.on('data', chunk => {
          length += chunk.length;
          if (length > maxResponseBytes) { reject(new BridgeError('BRIDGE_RESPONSE_TOO_LARGE')); res.destroy(); return; }
          chunks.push(chunk);
        });
        res.on('error', () => reject(new BridgeError('BRIDGE_RESPONSE_INTERRUPTED')));
        res.on('end', () => {
          let value;
          try { value = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
          catch { reject(new BridgeError('BRIDGE_RESPONSE_INVALID')); return; }
          if (res.statusCode !== 200) {
            // Never copy upstream messages: PHP/CRM errors can contain credentials or personal data.
            const code = SAFE_REMOTE_CODES.has(value?.error?.code) ? value.error.code : 'BRIDGE_REJECTED';
            reject(new BridgeError(code, res.statusCode)); return;
          }
          if (value?.data?.protocol !== BRIDGE_PROTOCOL || value.data.writeEnabled !== false || value.data.operation !== operation) {
            reject(new BridgeError('BRIDGE_RESPONSE_CONTRACT')); return;
          }
          if (operation !== 'readiness' && (value.data.actor?.userId !== params.actor.userId || value.data.actor?.organizationId !== params.actor.organizationId)) {
            reject(new BridgeError('BRIDGE_CONTEXT_MISMATCH')); return;
          }
          resolve(value.data);
        });
      });
      req.on('timeout', () => { req.destroy(); reject(new BridgeError('BRIDGE_TIMEOUT')); });
      req.on('error', () => reject(new BridgeError('BRIDGE_UNREACHABLE')));
      req.end(body);
    });
    return data;
  }
  return { call, readiness: () => call('readiness'), exportOrder: (actor, orderId) => call('order.export', { actor, orderId }),
    documentManifest: (actor, orderId) => call('documents.manifest', { actor, orderId }),
    notifications: actor => call('notifications.export', { actor }), preferences: actor => call('preferences.export', { actor }) };
}
