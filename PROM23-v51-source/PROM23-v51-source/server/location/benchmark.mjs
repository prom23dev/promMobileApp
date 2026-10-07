import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { createGarProvider } from './provider.mjs';

const provider = createGarProvider({ databasePath: process.argv[2] ?? fileURLToPath(new URL('./data/gar.sqlite', import.meta.url)),
  fail: (status, code, message) => { throw Object.assign(new Error(message), { status, code }); } });
const queries = ['Динская', 'Москва', 'Краснодар', 'Сочи', 'село Молдовка', 'станица Динская',
  'Тульская Первомайский', 'krasnodar', 'rhfcyljlfh', 'динскя', 'Ленина', 'zzzzzzzz123'];
try {
  const coldStart = performance.now(); const provenance = provider.readiness();
  const openMs = performance.now() - coldStart;
  const observations = [];
  for (let iteration = 0; iteration < 5; iteration++) {
    for (const query of queries) {
      const start = performance.now(); const result = provider.suggest(query, 10);
      observations.push({ query, iteration, milliseconds: +(performance.now() - start).toFixed(3), resultCount: result.items.length });
    }
  }
  const times = observations.map(item => item.milliseconds).sort((a,b) => a-b);
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), node: process.version, platform: process.platform,
    architecture: process.arch, scope: 'Sequential in-process provider calls on actual official index; not HTTP load/native performance acceptance',
    provenance, openMilliseconds: +openMs.toFixed(3), calls: times.length,
    p50Milliseconds: times[Math.floor(times.length*.5)], p95Milliseconds: times[Math.floor(times.length*.95)],
    maximumMilliseconds: times.at(-1), rssBytes: process.memoryUsage().rss, observations }, null, 2));
} finally { provider.close(); }
