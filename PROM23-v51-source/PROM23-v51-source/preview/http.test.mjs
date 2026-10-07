import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createPreview } from './http.mjs';

test('private preview preserves API headers, blocks unknown hosts and hides non-public files', async () => {
  const root = mkdtempSync(join(tmpdir(), 'prom23-preview-'));
  writeFileSync(join(root, 'index.html'), '<html lang="ru">preview</html>');
  writeFileSync(join(root, 'app.js'), 'export const ok = true;');
  const api = createServer((req, res) => { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ data: { url: req.url, authorization: req.headers.authorization, key: req.headers['idempotency-key'] } })); });
  await new Promise(resolve => api.listen(0, '127.0.0.1', resolve));
  const hosts = [];
  const server = createPreview({ root, apiPort: api.address().port, hosts });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const fetchAs = (path, options = {}) => fetch(url + path, options);
  try {
    assert.equal((await fetch(url)).status, 403);
    hosts.push(`127.0.0.1:${server.address().port}`);
    const page = await fetchAs('/order/test-123'); assert.equal(page.status, 200); assert.equal(page.headers.get('x-frame-options'), 'DENY'); assert.match(await page.text(), /preview/);
    assert.equal((await fetchAs('/missing.js')).status, 404);
    assert.equal((await fetchAs('/%2e%2e%2fsecret.json')).status, 403);
    assert.equal((await fetchAs('/app.js', { method: 'POST' })).status, 405);
    assert.match(await (await fetchAs('/robots.txt')).text(), /Disallow: \//);
    const forwarded = await (await fetchAs('/api/orders', { method: 'POST', headers: { Authorization: 'Bearer test-token', 'Idempotency-Key': 'test-key' } })).json();
    assert.deepEqual(forwarded.data, { url: '/api/orders', authorization: 'Bearer test-token', key: 'test-key' });
  } finally {
    await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); });
    await new Promise(resolve => { api.close(resolve); api.closeAllConnections(); });
    rmSync(root, { recursive: true, force: true });
  }
});
