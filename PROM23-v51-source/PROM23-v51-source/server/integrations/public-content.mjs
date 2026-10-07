import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const ID = /^[a-z][a-z0-9-]{0,79}$/;
const text = (s, max) => typeof s === 'string' && s.length <= max && !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s);
const strings = a => Array.isArray(a) && a.length <= 120 && a.every(s => text(s, 20000));
export function safeContentUrl(value) {
  try { const u = new URL(value); return u.protocol === 'https:' && ['prom.myfast.space', 'prom23.ru'].includes(u.hostname) && !u.port && !u.username && !u.password && !u.search && !u.hash && !/^\/(local|bitrix|personal|organization|api)(?:\/|$)/i.test(u.pathname) && !/\.php$/i.test(u.pathname); }
  catch { return false; }
}
export function normalizeContentPage(page) {
  if (!page || !ID.test(page.slug ?? '') || !text(page.title, 300) || (page.sourceUrl !== null && !safeContentUrl(page.sourceUrl)) || !Array.isArray(page.sections) || page.sections.length > 80) throw new Error('CONTENT_SNAPSHOT_INVALID');
  const ids = new Set();
  const sections = page.sections.map(section => {
    if (!section || !ID.test(section.id ?? '') || ids.has(section.id) || (section.title !== undefined && !text(section.title, 300)) || !strings(section.paragraphs) || (section.bullets !== undefined && !strings(section.bullets))) throw new Error('CONTENT_SNAPSHOT_INVALID');
    ids.add(section.id);
    return { id: section.id, ...(section.title === undefined ? {} : { title: section.title }), paragraphs: [...section.paragraphs], ...(section.bullets === undefined ? {} : { bullets: [...section.bullets] }) };
  });
  const links = (Array.isArray(page.links) ? page.links : []).filter(link => text(link?.label, 200) && safeContentUrl(link?.url)).slice(0, 40).map(({label,url}) => ({label,url}));
  return { slug: page.slug, title: page.title, sourceUrl: page.sourceUrl, sections, links };
}
/** Read-only CMS seam; static snapshot is an explicit fallback, not a live CMS connection. */
export function createPublicContentService({ snapshotPath = new URL('../../data/site-pages.json', import.meta.url), pages, sourceCheckedAt = '2026-09-11', liveSnapshotPath, livePages, liveSlugs = [] } = {}) {
  let supplied = pages;
  if (supplied === undefined) {
    try { const parsed = JSON.parse(readFileSync(snapshotPath, 'utf8')); supplied = parsed.pages; sourceCheckedAt = parsed.sourceCheckedAt; }
    catch { supplied = []; }
  }
  const map = new Map();
  try {
    if (!Array.isArray(supplied) || supplied.length > 100 || !/^\d{4}-\d{2}-\d{2}$/.test(sourceCheckedAt)) throw new Error();
    for (const p of supplied) {
      const page = normalizeContentPage(p);
      if (map.has(page.slug)) throw new Error();
      const revision = createHash('sha256').update(JSON.stringify({sourceCheckedAt,page})).digest('hex');
      map.set(page.slug, { schemaVersion: 1, revision, sourceCheckedAt, mode: 'source-snapshot', page });
    }
  } catch { map.clear(); }
  // Live CMS overlay: an explicit per-slug allowlist (feature flag), never
  // bulk-enabled. A malformed/missing live page is dropped on its own — the
  // curated snapshot above keeps serving that one slug — instead of the
  // curated-loader's all-or-nothing failure above, which is right for a
  // hand-reviewed snapshot but would let one bad live element take down all
  // 17 pages during rollout. See docs/parity/runtime-cms.md.
  const liveSlugSet = new Set(Array.isArray(liveSlugs) ? liveSlugs.filter(s => typeof s === 'string') : []);
  let liveSupplied = livePages;
  let liveSourceCheckedAt = sourceCheckedAt;
  if (liveSupplied === undefined && liveSnapshotPath && liveSlugSet.size > 0) {
    try { const parsed = JSON.parse(readFileSync(liveSnapshotPath, 'utf8')); liveSupplied = parsed.pages; liveSourceCheckedAt = parsed.sourceCheckedAt ?? liveSourceCheckedAt; }
    catch { liveSupplied = []; }
  }
  let liveAppliedCount = 0;
  if (Array.isArray(liveSupplied) && liveSlugSet.size > 0) {
    for (const p of liveSupplied.slice(0, 100)) {
      try {
        if (!liveSlugSet.has(p?.slug)) continue;
        const page = normalizeContentPage(p);
        const checkedAt = /^\d{4}-\d{2}-\d{2}$/.test(p?.sourceCheckedAt ?? '') ? p.sourceCheckedAt : liveSourceCheckedAt;
        const revision = createHash('sha256').update(JSON.stringify({ sourceCheckedAt: checkedAt, page, mode: 'live-cms' })).digest('hex');
        map.set(page.slug, { schemaVersion: 1, revision, sourceCheckedAt: checkedAt, mode: 'live-cms', provenance: p.provenance ?? null, page });
        liveAppliedCount += 1;
      } catch { /* keep whatever this slug already has (live-cms or curated); do not blank other pages */ }
    }
  }
  return {
    getPage(slug) { return typeof slug === 'string' && ID.test(slug) && map.has(slug) ? structuredClone(map.get(slug)) : null; },
    readiness() { return { available: map.size > 0, pageCount: map.size, mode: liveAppliedCount > 0 ? 'mixed' : 'source-snapshot', liveCmsConnected: liveAppliedCount > 0, livePageCount: liveAppliedCount }; },
    getResponse(slug, ifNoneMatch) {
      const body = this.getPage(slug);
      if (!body) return { status: 404, headers: { 'Cache-Control': 'no-store' }, body: { error: { code: 'CONTENT_NOT_FOUND', message: 'Страница недоступна' } } };
      const etag = `"${body.revision}"`;
      const headers = { ETag: etag, 'Cache-Control': 'public, max-age=300, must-revalidate' };
      return ifNoneMatch === etag ? { status: 304, headers } : { status: 200, headers, body: { data: body } };
    },
  };
}
