import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync, chmodSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BRIDGE_PROTOCOL, createBitrixReader, loadBridgeConfig, signRequest } from '../integrations/bitrix-client.mjs';
import { inspectIntegrationSource } from '../integrations/readiness.mjs';

const key = 'a'.repeat(64); // Synthetic test key, never a real credential.
async function bridge(t, handler, options = {}) {
  const requests = [];
  const server = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString();
    requests.push({ headers: req.headers, body });
    const value = JSON.parse(body);
    if (handler) return handler(req, res, value);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: { protocol: BRIDGE_PROTOCOL, operation: value.operation, actor: value.actor, writeEnabled: false } }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const config = { enabled: true, key, keyId: 'synthetic-test', url: new URL(`http://127.0.0.1:${server.address().port}/local/prom23-mobile/endpoint.php`) };
  return { reader: createBitrixReader(config, { allowLoopbackHttpForTests: true, ...options }), requests, config };
}

test('bridge is disabled by default and writes are rejected before any network operation', async () => {
  const reader = createBitrixReader(loadBridgeConfig({}));
  assert.deepEqual(loadBridgeConfig({}), { enabled: false });
  await assert.rejects(reader.readiness(), { code: 'BITRIX_NOT_CONFIGURED' });
  for (const operation of ['order.create', 'crm.deal.add', 'payment.start', 'one-c.run', 'push.send']) await assert.rejects(reader.call(operation), { code: 'BITRIX_WRITE_NOT_READY' });
});

test('private key file and explicit HTTPS shop origin are mandatory; unrelated site/URLs fail closed', t => {
  const directory = mkdtempSync(join(tmpdir(), 'prom23-key-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const file = join(directory, 'synthetic.key'); writeFileSync(file, key, { mode: 0o600 });
  const env = { PROM23_BITRIX_READ_ENABLED: '1', PROM23_BITRIX_BRIDGE_URL: 'https://prom.myfast.space/local/prom23-mobile/endpoint.php',
    PROM23_BITRIX_ALLOWED_ORIGIN: 'https://prom.myfast.space', PROM23_BITRIX_BRIDGE_KEY_ID: 'pilot-test', PROM23_BITRIX_BRIDGE_KEY_FILE: file };
  assert.equal(loadBridgeConfig(env).enabled, true);
  for (const url of ['http://prom.myfast.space/local/prom23-mobile/endpoint.php', 'https://prom.myfast.space/rest/1/key/',
    'https://user:secret@prom.myfast.space/local/prom23-mobile/endpoint.php', 'https://prom.myfast.space/local/prom23-mobile/endpoint.php?x=1',
    'https://zavod-antibpla.ru/local/prom23-mobile/endpoint.php']) {
    assert.throws(() => loadBridgeConfig({ ...env, PROM23_BITRIX_BRIDGE_URL: url }), { code: 'BRIDGE_ORIGIN_NOT_APPROVED' });
  }
  chmodSync(file, 0o644);
  assert.throws(() => loadBridgeConfig(env), { code: 'BRIDGE_KEY_FILE_INVALID' });
});

test('read requests are signed with exact body/target and unique nonces; no cookies or CRM secrets are forwarded', async t => {
  const { reader, requests } = await bridge(t);
  await reader.exportOrder({ userId: 12, organizationId: 3 }, 456);
  await reader.exportOrder({ userId: 12, organizationId: 3 }, 456);
  assert.equal(requests.length, 2);
  const first = requests[0];
  assert.deepEqual(JSON.parse(first.body), { operation: 'order.export', actor: { userId: 12, organizationId: 3 }, orderId: 456 });
  assert.equal(first.headers['x-prom23-signature'], signRequest({ key, target: '/local/prom23-mobile/endpoint.php', timestamp: first.headers['x-prom23-timestamp'], nonce: first.headers['x-prom23-nonce'], body: first.body }));
  assert.notEqual(first.headers['x-prom23-nonce'], requests[1].headers['x-prom23-nonce']);
  assert.equal(first.headers.cookie, undefined);
  assert.equal(first.headers.authorization, undefined);
  assert.equal(JSON.stringify(first).includes(key), false);
});

test('invalid actor/order or injected operation is rejected locally', async t => {
  const { reader, requests } = await bridge(t);
  for (const actor of [{ userId: 0, organizationId: 0 }, { userId: '12', organizationId: 0 }, { userId: 12, organizationId: -1 }, { userId: 12, organizationId: 0, token: 'fake' }]) {
    await assert.rejects(reader.exportOrder(actor, 1), { code: 'TRUSTED_ACTOR_REQUIRED' });
  }
  await assert.rejects(reader.exportOrder({ userId: 12, organizationId: 0 }, '1'), { code: 'ORDER_ID_REQUIRED' });
  await assert.rejects(reader.call('readiness', { operation: 'payment.start' }), { code: 'BRIDGE_PARAMETERS_INVALID' });
  assert.equal(requests.length, 0);
});

test('redirects are rejected and an upstream message cannot expose credentials', async t => {
  const redirect = await bridge(t, (req, res) => { res.writeHead(302, { Location: 'https://example.invalid/secret' }); res.end(); });
  await assert.rejects(redirect.reader.readiness(), { code: 'BRIDGE_REDIRECT_FORBIDDEN' });
  assert.equal(redirect.requests.length, 1);
  const failed = await bridge(t, (req, res) => { res.writeHead(500); res.end(JSON.stringify({ error: { code: 'SECRET_KEY_VALUE', message: 'password=private-example' } })); });
  await assert.rejects(failed.reader.readiness(), error => error.code === 'BRIDGE_REJECTED' && !error.message.includes('private-example'));
});

test('response actor mismatch and claimed write capability fail the read-only contract', async t => {
  const wrongActor = await bridge(t, (req, res, value) => { res.end(JSON.stringify({ data: { protocol: BRIDGE_PROTOCOL, operation: value.operation, writeEnabled: false, actor: { userId: 99, organizationId: 0 } } })); });
  await assert.rejects(wrongActor.reader.exportOrder({ userId: 12, organizationId: 0 }, 1), { code: 'BRIDGE_CONTEXT_MISMATCH' });
  const writes = await bridge(t, (req, res, value) => { res.end(JSON.stringify({ data: { protocol: BRIDGE_PROTOCOL, operation: value.operation, writeEnabled: true } })); });
  await assert.rejects(writes.reader.readiness(), { code: 'BRIDGE_RESPONSE_CONTRACT' });
});

test('bounded responses and timeout fail without implicit request retries', async t => {
  const large = await bridge(t, (req, res) => res.end('x'.repeat(200)), { maxResponseBytes: 100 });
  await assert.rejects(large.reader.readiness(), { code: 'BRIDGE_RESPONSE_TOO_LARGE' });
  assert.equal(large.requests.length, 1);
  const slow = await bridge(t, () => {}, { timeoutMs: 15 });
  await assert.rejects(slow.reader.readiness(), { code: 'BRIDGE_TIMEOUT' });
  assert.equal(slow.requests.length, 1);
});

test('offline readiness reports missing runtime and existing CRM TLS/event blockers without pretending to connect', t => {
  // Synthetic source fixture keeps the test portable without the private legacy-site archive.
  const root = mkdtempSync(join(tmpdir(), 'prom23-readiness-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'local/php_interface'), { recursive: true });
  mkdirSync(join(root, 'local/class/Controllers'), { recursive: true });
  writeFileSync(join(root, 'local/php_interface/events.php'), '<?php function onSaleOrderSavedHandler($order) { return $order->isNew(); }');
  writeFileSync(join(root, 'local/class/Controllers/Bitrix24WebhookController.php'), '<?php $options = [CURLOPT_SSL_VERIFYPEER => false];');
  const report = inspectIntegrationSource(root);
  assert.equal(report.runtimeConnected, false);
  assert.equal(report.writeEnabled, false);
  assert.equal(report.claims.bitrix24DeliveryTested, false);
  assert.equal(report.checks.find(check => check.id === 'bitrix-core').status, 'missing');
  assert.equal(report.checks.find(check => check.id === 'crm-tls-verification').status, 'blocked');
  assert.equal(report.checks.find(check => check.id === 'crm-event-signature').status, 'review-required');
});
