import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MobileApiClient } from '../src/api/client';

const origin = 'https://api.example.invalid/mobile/v1';
const parse = (v: unknown) => v;
describe('Граница будущего мобильного API', () => {
  it('запрещает HTTP и встроенные секреты', () => {
    assert.throws(() => new MobileApiClient('http://api.example.invalid'));
    assert.throws(() => new MobileApiClient('https://user:pass@api.example.invalid'));
  });
  it('не отправляет запросы на другой origin или за пределы API', async () => {
    let called = false;
    const client = new MobileApiClient(origin, (async () => { called = true; throw new Error(); }) as typeof fetch);
    for (const path of ['https://attacker.invalid', '//attacker.invalid', '../users', '%2e%2e/users', '/users', 'foo\\bar']) {
      await assert.rejects(client.request(path, { parse }));
    }
    assert.equal(called, false);
  });
  it('передаёт ключ и контекст, задаёт запрет cookie и редиректов транспорту', async () => {
    const transport = (async (url, init) => {
      assert.equal(String(url), `${origin}/orders`);
      assert.equal(init?.credentials, 'omit');
      assert.equal(init?.redirect, 'error');
      assert.equal((init?.headers as Record<string,string>)['Idempotency-Key'], 'test-order-key');
      assert.equal((init?.headers as Record<string,string>)['X-Organization-Id'], 'org-1');
      return new Response('{"id":"order-1"}', { headers: { 'Content-Type': 'application/json' } });
    }) as typeof fetch;
    const client = new MobileApiClient(origin, transport);
    assert.deepEqual(await client.request('orders', { method: 'POST', body: { quoteId: 'quote-1' }, accessToken: 'test-token', organizationId: 'org-1', idempotencyKey: 'test-order-key', parse }), { id: 'order-1' });
  });
  it('не допускает B2B запрос без авторизации и отменённый запрос', async () => {
    let called = false;
    const client = new MobileApiClient(origin, (async () => { called = true; throw new Error(); }) as typeof fetch);
    await assert.rejects(client.request('orders', { organizationId: 'org-1', parse }));
    const abort = new AbortController(); abort.abort();
    await assert.rejects(client.request('orders', { signal: abort.signal, parse }), { code: 'CANCELLED' });
    assert.equal(called, false);
  });
  it('возвращает понятную ошибку авторизации, не выдаёт HTML или внутренний текст сервера', async () => {
    const client = new MobileApiClient(origin, (async () => new Response('private diagnostic', { status: 401 })) as typeof fetch);
    await assert.rejects(client.request('profile', { parse }), { code: 'UNAUTHORIZED', message: 'Войдите снова' });
  });
  it('проверяет JSON и структуру ответа', async () => {
    const html = new MobileApiClient(origin, (async () => new Response('<html>login</html>')) as typeof fetch);
    await assert.rejects(html.request('catalog', { parse }), { code: 'INVALID_RESPONSE' });
    const json = new MobileApiClient(origin, (async () => new Response('{}', { headers: { 'content-type': 'application/json' } })) as typeof fetch);
    await assert.rejects(json.request('catalog', { parse: () => { throw new Error('schema'); } }), { code: 'INVALID_RESPONSE' });
  });
  it('отменяет запрос по таймауту и не повторяет POST автоматически', async () => {
    let calls = 0;
    const client = new MobileApiClient(origin, ((_url, init) => {
      calls++;
      return new Promise((_resolve, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true }));
    }) as typeof fetch, 10);
    await assert.rejects(client.request('orders', { method: 'POST', body: {}, parse }), { code: 'TIMEOUT' });
    assert.equal(calls, 1);
  });
});
