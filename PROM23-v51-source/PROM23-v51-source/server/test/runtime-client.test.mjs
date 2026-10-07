import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, chmodSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHmac, createHash } from 'node:crypto';
import { createRuntimeClient, RuntimeError, RUNTIME_PROTOCOL } from '../integrations/runtime-client.mjs';

const sessionKey = 'a'.repeat(64), secret = 'b'.repeat(64);
function fixture(t, extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'prom23-runtime-')); t.after(() => rmSync(dir, { recursive: true, force: true }));
  const keyFile = join(dir, 'key'); writeFileSync(keyFile, secret, { mode: 0o600 });
  return { env: {}, url: 'https://runtime.example.test/mobile/runtime.php', allowedOrigins: ['https://runtime.example.test'], keyFile, ...extra };
}
function reply(init, data = { organizations: [] }, status = 200, error) {
  const input = JSON.parse(init.body);
  return new Response(JSON.stringify({ protocol: RUNTIME_PROTOCOL, requestId: input.requestId, operation: input.operation, ...(error ? { error } : { data }) }),
    { status, headers: { 'content-type': 'application/json' } });
}
const code = (expected, status) => error => error instanceof RuntimeError && error.code === expected && (!status || error.status === status);

test('disabled runtime fails closed with no request; readiness never claims connectivity', async () => {
  let called = 0; const runtime = createRuntimeClient({ env: {}, fetcher: () => { called++; } });
  assert.deepEqual(runtime.readiness(), { configured: false, verified: false, code: 'RUNTIME_NOT_CONFIGURED' });
  await assert.rejects(runtime.call('buyer.organizations', { sessionKey }), code('RUNTIME_NOT_CONFIGURED', 503)); assert.equal(called, 0);
});

test('configuration rejects HTTP, foreign origins, URL credentials, query and production host', async t => {
  for (const url of ['http://runtime.example.test/x', 'https://evil.test/x', 'https://user:pass@runtime.example.test/x',
    'https://runtime.example.test/x?token=secret', 'https://runtime.example.test/x#fragment', 'https://zavod-antibpla.ru/x']) {
    const runtime = createRuntimeClient(fixture(t, { url, fetcher: () => assert.fail('network') }));
    await assert.rejects(runtime.call('buyer.organizations', { sessionKey }), code('RUNTIME_CONFIG_INVALID'));
  }
});

test('secret file permissions, symlink and content are checked without disclosing content', async t => {
  const options = fixture(t, { fetcher: () => assert.fail('network') });
  chmodSync(options.keyFile, 0o644);
  assert.equal(createRuntimeClient(options).readiness().code, 'RUNTIME_KEY_FILE_INVALID');
  chmodSync(options.keyFile, 0o600);
  const alias = options.keyFile + '.link'; symlinkSync(options.keyFile, alias);
  await assert.rejects(createRuntimeClient({ ...options, keyFile: alias }).call('buyer.organizations', { sessionKey }), code('RUNTIME_KEY_FILE_INVALID'));
  writeFileSync(options.keyFile, 'not-a-secret-key');
  await assert.rejects(createRuntimeClient(options).call('buyer.organizations', { sessionKey }), error => code('RUNTIME_KEY_FILE_INVALID')(error) && !error.message.includes('not-a-secret-key'));
});

test('real transport request binds HMAC to path, timestamp, nonce and exact body; no actor trusted', async t => {
  const nonces = new Set(); let calls = 0;
  const runtime = createRuntimeClient(fixture(t, { fetcher: async (url, init) => {
    calls++; assert.equal(url, 'https://runtime.example.test/mobile/runtime.php');
    assert.equal(init.redirect, 'manual'); assert.equal(init.credentials, 'omit');
    const body = JSON.parse(init.body); assert.equal(body.protocol, RUNTIME_PROTOCOL); assert.equal(body.payload.sessionKey, sessionKey);
    assert.equal(body.requestId, init.headers['X-Prom23-Nonce']); nonces.add(body.requestId);
    const expected = createHmac('sha256', secret).update(`POST\n/mobile/runtime.php\n${init.headers['X-Prom23-Timestamp']}\n${body.requestId}\n${createHash('sha256').update(init.body).digest('hex')}`).digest('hex');
    assert.equal(init.headers['X-Prom23-Signature'], expected);
    return reply(init, { organization: { id: 37, name: 'Fixture company' }, cart: [] });
  } }));
  assert.deepEqual(runtime.readiness(), { configured: true, verified: false, code: 'RUNTIME_NOT_VERIFIED' });
  assert.equal(calls, 0);
  assert.equal((await runtime.call('buyer.select', { sessionKey, organizationId: 37 })).organization.id, 37);
  await runtime.call('buyer.organizations', { sessionKey }); assert.equal(nonces.size, 2);
  await assert.rejects(runtime.call('buyer.organizations', { sessionKey, userId: 44 }), code('RUNTIME_IDENTITY_INVALID', 400));
  await assert.rejects(runtime.call('buyer.organizations', { sessionKey: 'mobile-session' }), code('RUNTIME_IDENTITY_INVALID', 400));
  await assert.rejects(runtime.call('crm.createLead', { sessionKey }), code('RUNTIME_OPERATION_UNSUPPORTED', 400));
  assert.equal(calls, 2);
});

test('idempotency is forwarded, request bytes bounded and failed writes never retried', async t => {
  let calls = 0;
  const runtime = createRuntimeClient(fixture(t, { maxRequestBytes: 512, fetcher: async (_, init) => {
    calls++; assert.equal(init.headers['Idempotency-Key'], 'order-key-123'); throw new Error('provider-password-must-not-escape');
  } }));
  await assert.rejects(runtime.call('order.submit', { sessionKey }, { idempotencyKey: 'order-key-123' }), error => code('RUNTIME_UNREACHABLE', 502)(error) && !error.message.includes('password'));
  assert.equal(calls, 1);
  await assert.rejects(runtime.call('forms.submit', { sessionKey, values: 'x'.repeat(800) }), code('RUNTIME_REQUEST_TOO_LARGE', 413));
  await assert.rejects(runtime.call('order.submit', { sessionKey }, { idempotencyKey: 'bad\nheader' }), code('RUNTIME_IDEMPOTENCY_INVALID', 400));
  assert.equal(calls, 1);
});

test('operation/request correlation, redirects, bad JSON and bounded response fail closed', async t => {
  for (const [expected, fetcher] of [
    ['RUNTIME_RESPONSE_MISMATCH', async (_, init) => new Response(JSON.stringify({ protocol: RUNTIME_PROTOCOL, operation: 'buyer.select', requestId: JSON.parse(init.body).requestId, data: {} }), { headers: { 'content-type': 'application/json' } })],
    ['RUNTIME_RESPONSE_MISMATCH', async () => new Response(JSON.stringify({ protocol: RUNTIME_PROTOCOL, operation: 'buyer.organizations', requestId: 'replayed', data: {} }), { headers: { 'content-type': 'application/json' } })],
    ['RUNTIME_REDIRECT_FORBIDDEN', async () => new Response('', { status: 302, headers: { location: 'https://evil.test' } })],
    ['RUNTIME_RESPONSE_INVALID', async () => new Response('<html>PHP error</html>', { headers: { 'content-type': 'text/html' } })],
    ['RUNTIME_RESPONSE_INVALID', async () => new Response('{broken', { headers: { 'content-type': 'application/json' } })],
    ['RUNTIME_RESPONSE_TOO_LARGE', async () => new Response(' '.repeat(600), { headers: { 'content-type': 'application/json' } })],
  ]) {
    await assert.rejects(createRuntimeClient(fixture(t, { fetcher, maxResponseBytes: 512 })).call('buyer.organizations', { sessionKey }), code(expected, 502));
  }
});

test('remote errors preserve allowlisted codes but never provider text or fields', async t => {
  let safe = true;
  const runtime = createRuntimeClient(fixture(t, { fetcher: async (_, init) => reply(init, null, 403,
    { code: safe ? 'AUTH_REQUIRED' : 'RAW_DATABASE_ERROR', message: 'password=SECRET and person@example.test', stack: 'raw' }) }));
  await assert.rejects(runtime.call('workspace.read', { sessionKey }), error => code('AUTH_REQUIRED', 401)(error) && !error.message.includes('SECRET'));
  safe = false;
  await assert.rejects(runtime.call('workspace.read', { sessionKey }), error => code('RUNTIME_REJECTED', 502)(error) && !error.message.includes('person@'));
});

test('timeout and caller abort stop transport without mutation retries', async t => {
  let calls = 0;
  const runtime = createRuntimeClient(fixture(t, { timeoutMs: 15, fetcher: async (_, init) => {
    calls++;
    return await new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
  } }));
  await assert.rejects(runtime.call('order.submit', { sessionKey }), code('RUNTIME_TIMEOUT', 504)); assert.equal(calls, 1);
  const controller = new AbortController(); const pending = runtime.call('forms.context', { sessionKey }, { signal: controller.signal }); controller.abort();
  await assert.rejects(pending, code('RUNTIME_CANCELLED', 499)); assert.equal(calls, 2);
  await assert.rejects(runtime.call('forms.context', { sessionKey }, { signal: controller.signal }), code('RUNTIME_CANCELLED', 499)); assert.equal(calls, 2);
});
