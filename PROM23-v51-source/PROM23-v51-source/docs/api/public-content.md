# Public content API / MASTER5 #193–195

`server/integrations/public-content.mjs` exports `createPublicContentService()`. It loads `data/site-pages.json` once on creation. This is a curated source snapshot with a replaceable CMS boundary; no live CMS, forms, authenticated data or writes are configured. Malformed/missing input makes the optional service unavailable and does not expose filesystem errors.

Registered and tested local HTTP route: `GET /api/v1/content/pages/:slug`, where slug matches `[a-z][a-z0-9-]{0,79}`. `service.getResponse(slug, request.headers['if-none-match'])` returns `{status,headers,body?}`:

- 200: `{data:{schemaVersion:1,revision,sourceCheckedAt,mode:'source-snapshot',page:{slug,title,sourceUrl,sections,links}}}`.
- 304: no body, matching ETag. ETag is a quoted SHA256 over the normalized page and source-check date; `Cache-Control: public,max-age=300,must-revalidate`.
- 404: stable `CONTENT_NOT_FOUND`, no-store.

The surrounding server remains responsible for its existing origin/CORS/method/security headers. Public GET does not need account tokens. Root registered the route in server/app.mjs; this subtask reviewed it and added HTTP tests. No deployment was performed by this subtask. The content route permits If-None-Match CORS preflight and exposes ETag only under the existing exact origin policy. JSON Schema: `server/integrations/public-content.schema.json`.

## Client

`mobile/src/api/content.ts` exports `parseContentPage(value,slug)` and `loadContentPage(slug,{signal?,timeoutMs?,baseUrl?,fetcher?}) → Promise<SitePage|null>`.

Render local `sitePages[slug]` immediately, then load opportunistically in an effect. Default timeout1500ms; errors/abort/malformed content return that same local fallback. Unknown `/pages/documents` remains a separate navigation hub and returnsnull from this loader. No guessed production domain, cookies, Authorization, POST, credentials or redirect following.

Parser pins page slug/sourceURL and the entire set of known section IDs. It accepts plain text arrays, headings and safe same-site HTTPS links. Unknown/duplicated/missing sections or extra form/target properties failclosed. Existing local forms, consent labels/documents, source-review notes and authenticated data contracts are not overridden by remote content. This payload cannot update canonical legal-consent versions; that needs a separate authenticated consent contract.

## Updating the snapshot / future CMS

Run `python3 scripts/export-public-content.py` after curated `mobile/src/content/sitePages.ts` changes. It parses only that trusted JSON literal; it never executes the archived source PHP or downloaded scripts. This iteration exports17pages. `editorialContent.ts` (timeline/branches/FAQ presentation) remains a separate local layer and is not falsely described as CMS-controlled.

A real CMS adapter must retain stable page/section IDs, ownership-reviewed text, source provenance and revisions, then satisfy the same normalization/schema. Rich media needs its own allowlisted asset manifest; arbitrary remote HTML/JSX/source form actions are intentionally excluded. The currently supplied snapshot date denotes source review, not live synchronization.

### Live CMS overlay (per-slug, no downtime)

`createPublicContentService()` accepts an optional overlay: `{liveSnapshotPath, liveSlugs}` (or `livePages` directly, for tests). `liveSlugs` is an explicit per-slug allowlist — only slugs named there can be served live; every other slug keeps using the curated snapshot untouched. A live page that fails `normalizeContentPage()` (bad text/links/duplicate ID) is dropped **on its own**, unlike the curated loader above, which intentionally fails closed for its entire snapshot on any single bad entry — that's correct for a hand-reviewed file, but would let one bad live element take down all 17 pages during rollout. `readiness().mode` becomes `'mixed'` once at least one slug is live; `livePageCount` reports how many.

The live file is produced offline by `integrations/runtime/cms-sync.php` against an isolated Bitrix instance (see `docs/parity/runtime-cms.md`) — it is never called per public request. Rollout: run the sync, deploy `site-pages.live.json`, add one slug to `liveSlugs`, verify, repeat; never flip all slugs at once. `docs/parity/runtime-cms.md` has the full slug → real Bitrix source table, including which slugs are audited and safe to enable, which need a per-page content audit first, and which have no CMS element behind them at all today.

Validation:4server tests (ETag304/change/copies; malformed/duplicate/unknown paths; excluding forms/private targets/unsafe links; real17-page snapshot) and4client tests (presentation-only update; identity/section/XSS/override rejection; credentialless GET and fallback; timeout/invalid origin). These are adapter checks, not live CMS or full click-through acceptance.

HTTP verification:6tests in server/test/master5-http.test.mjs, covering DTO/noindex,404/method/query rejection, ETag304, CORS, protected location-bound availability, context/session isolation and missing/malformed optional snapshots.
