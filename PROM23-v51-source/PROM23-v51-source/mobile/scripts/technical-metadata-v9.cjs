// Bounded local metadata check. One isolated preview session; no external requests/forms.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base = 'http://127.0.0.1:8087';
const report = { at: new Date().toISOString(), base, routes: [], blockedRequests: [], pageErrors: [], sessionCleanup: false };
const out = path.resolve(__dirname, '../../docs/testing/technical-release-v9-metadata.json');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  let token;
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== base || (!['GET', 'HEAD'].includes(request.method()) && !(request.method() === 'POST' && url.pathname === '/api/sessions'))) {
      report.blockedRequests.push({ origin: url.origin, path: url.pathname, method: request.method() });
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', error => report.pageErrors.push(error.message));
  page.on('response', async response => {
    if (response.url() === base + '/api/sessions' && response.status() === 201) {
      try { token = (await response.json()).data.token; } catch {}
    }
  });
  const snapshot = () => page.evaluate(() => ({
    route: location.pathname, title: document.title, lang: document.documentElement.lang,
    descriptions: [...document.querySelectorAll('meta[name="description"]')].map(e => e.content),
    robots: [...document.querySelectorAll('meta[name="robots"]')].map(e => e.content),
    canonical: [...document.querySelectorAll('link[rel="canonical"]')].map(e => e.href),
    headings: [...document.querySelectorAll('h1,h2,[role="heading"]')].filter(e => !e.closest('[aria-hidden="true"]') && e.getBoundingClientRect().height > 0).map(e => ({ text: e.textContent, level: String(e.getAttribute('aria-level') || e.tagName.replace(/^H/i, '')) })),
    entry: [...document.querySelectorAll('script[src]')].map(e => e.getAttribute('src')).find(src => src.includes('entry-')),
  }));
  try {
    for (const route of ['/', '/catalog', '/information/delivery', '/information/production', '/account']) {
      const response = await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.title.endsWith(' | Промышленник'), undefined, { timeout: 15000 });
      await page.waitForFunction(() => document.querySelector('h1,[role="heading"][aria-level="1"]'), undefined, { timeout: 15000 });
      await page.waitForTimeout(1000);
      report.routes.push({ status: response.status(), ...(await snapshot()) });
    }
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.title.startsWith('Строительное оборудование'));
    await page.getByRole('tab', { name: 'Кабинет', exact: true }).click();
    await page.waitForFunction(() => location.pathname === '/account' && document.title.startsWith('Кабинет покупателя'));
    report.afterClientNavigation = await snapshot();
    const entry = report.routes[0].entry;
    report.buildConsistent = report.routes.every(row => row.entry === entry) && report.afterClientNavigation.entry === entry;
    if (!report.buildConsistent || !entry.includes('f511f4c425f0956cb8c2dd105ef3dba2')) throw new Error('Expected frozen V9 build changed.');
    const response = await context.request.get(base + entry);
    report.entrySHA256 = crypto.createHash('sha256').update(await response.body()).digest('hex');
  } finally {
    if (token) {
      const result = await context.request.delete(base + '/api/session', { headers: { Authorization: `Bearer ${token}` } });
      report.sessionCleanup = result.status() === 200;
    }
    await context.close();
    await browser.close();
    fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n');
  }
})().catch(error => { report.error = error.message; fs.writeFileSync(out, JSON.stringify(report, null, 2) + '\n'); process.exitCode = 1; });
