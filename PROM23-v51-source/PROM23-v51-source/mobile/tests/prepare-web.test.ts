import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { normalizePreviewHtml } = createRequire(import.meta.url)('../scripts/prepare-web.cjs') as { normalizePreviewHtml(input: string): string };

test('preview preparation is repeatable and preserves unrelated metadata/styles', () => {
  const source = '<html lang="en"><head><title>App</title><meta name="description" content="Source" /><style>.app{display:flex}</style></head><body>You need to enable JavaScript to run this app.</body></html>';
  const once = normalizePreviewHtml(source);
  assert.equal(normalizePreviewHtml(once), once);
  assert.match(once, /<html lang="ru">/);
  assert.match(once, /<title>Промышленник — prom23.ru<\/title>/);
  assert.match(once, /Для работы приложения включите JavaScript\./);
  assert.match(once, /<meta name="description" content="Source" \/>/);
  assert.match(once, /<style>\.app\{display:flex\}<\/style>/);
  assert.equal((once.match(/name="robots"/g) ?? []).length, 1);
  assert.equal((once.match(/prefers-reduced-motion/g) ?? []).length, 1);
});

test('stale or repeated robots directives cannot make the preview indexable', () => {
  const source = '<html lang="ru"><head><title>App</title><meta content="index, follow" name="robots"><meta NAME=\'robots\' content=\'noindex\'></head><body /></html>';
  const result = normalizePreviewHtml(source);
  assert.equal((result.match(/name="robots"/g) ?? []).length, 1);
  assert.match(result, /<meta name="robots" content="noindex, nofollow" \/>/);
  assert.doesNotMatch(result, /content="index, follow"/);
  assert.throws(() => normalizePreviewHtml('<html><body>Broken export</body></html>'), /head element/);
});
