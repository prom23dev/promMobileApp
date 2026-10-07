import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultHomeConfig, loadHomeConfig, parseHomeConfig } from '../src/api/home';

const response = (data: unknown) => new Response(JSON.stringify({ data }), { headers: { 'content-type': 'application/json' } });
const baseUrl = 'https://api.example.invalid/api/v1';
test('home parser preserves server order, ignores unknown future types and never accepts remote UI fields', () => {
  const block = (type: string) => { const value = defaultHomeConfig.blocks.find(item => item.type === type); assert.ok(value, type); return value; };
  const config = { schemaVersion: 1, revision: 'home-2', blocks: [block('hero'),
    { id: 'future-1', type: 'future', enabled: true, url: 'https://foreign.invalid' }, block('business'), block('categories')] };
  assert.deepEqual(parseHomeConfig(config).blocks.map(b => b.type), ['hero', 'business', 'categories']);
  for (const value of [null, { ...config, schemaVersion: 2 }, { ...config, blocks: [] },
    { ...config, blocks: [defaultHomeConfig.blocks[0], defaultHomeConfig.blocks[0]] },
    { ...config, blocks: [{ ...defaultHomeConfig.blocks[0], id: 'home-business' }] },
    { ...config, blocks: [{ ...defaultHomeConfig.blocks[0], url: 'https://foreign.invalid' }] }]) {
    assert.throws(() => parseHomeConfig(value), /INVALID_HOME_CONFIG/);
  }
  assert.ok(Object.isFrozen(defaultHomeConfig.blocks));
});

test('home loader performs one credential-free public GET and validates the envelope', async () => {
  let calls = 0;
  const result = await loadHomeConfig({ baseUrl, fetcher: (async (url, options) => {
    calls++;
    assert.equal(url, baseUrl + '/home');
    assert.equal(options?.method, 'GET');
    assert.equal(options?.credentials, 'omit');
    assert.equal(options?.redirect, 'error');
    assert.deepEqual(options?.headers, { Accept: 'application/json' });
    return response({ ...defaultHomeConfig, revision: 'home-remote' });
  }) as typeof fetch });
  assert.equal(result.revision, 'home-remote');
  assert.equal(calls, 1);
});

test('bad response, network failure or oversized content falls back without fabricated live readiness', async () => {
  const cases = [
    async () => new Response('upstream private diagnostic', { status: 500 }),
    async () => new Response('<html>login</html>', { headers: { 'content-type': 'text/html' } }),
    async () => response({ ...defaultHomeConfig, schemaVersion: 2 }),
    async () => new Response('{"data":{}}', { headers: { 'content-type': 'application/json' } }),
    async () => new Response('x'.repeat(32769), { headers: { 'content-type': 'application/json' } }),
    async () => { throw new Error('network'); },
  ];
  for (const fetcher of cases) assert.equal(await loadHomeConfig({ baseUrl, fetcher: fetcher as typeof fetch }), defaultHomeConfig);
});

test('home timeout and external cancellation return fallback even if the transport ignores abort', async () => {
  let calls = 0;
  const fetcher = (() => { calls++; return new Promise(() => {}); }) as typeof fetch;
  assert.equal(await loadHomeConfig({ baseUrl, timeoutMs: 10, fetcher }), defaultHomeConfig);
  const cancelled = new AbortController();
  const pending = loadHomeConfig({ baseUrl, signal: cancelled.signal, fetcher });
  cancelled.abort();
  assert.equal(await pending, defaultHomeConfig);
  assert.equal(await loadHomeConfig({ baseUrl, signal: cancelled.signal, fetcher }), defaultHomeConfig);
  assert.equal(calls, 2);
});

test('home loader refuses remote HTTP, secrets, non-API paths and URL parameters before requesting', async () => {
  let called = false;
  const fetcher = (async () => { called = true; return response(defaultHomeConfig); }) as typeof fetch;
  for (const unsafe of ['http://shop.example.invalid/api', 'https://user:secret@shop.example.invalid/api',
    'https://shop.example.invalid/api?key=secret', 'https://shop.example.invalid/api#fragment',
    'https://shop.example.invalid/private', '//other.invalid/api', '../api']) {
    assert.equal(await loadHomeConfig({ baseUrl: unsafe, fetcher }), defaultHomeConfig);
  }
  assert.equal(called, false);
});
