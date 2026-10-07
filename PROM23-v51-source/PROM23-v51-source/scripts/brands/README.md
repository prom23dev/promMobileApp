# Brands — editorial page and optional catalogue integration

Latest owner instruction (18.09.2026): make the Brands page with the previously approved descriptions and find logos online. This supersedes the previous requirement to block publication until HL4 is available.

## Current published model

- `data/brands/presentation.json`: all 15 owner-approved names, exact descriptions, aliases and confirmed facts.
- `data/brands/editorial.json`: explicit editorial mode. IDs use `editorial:{slug}`, never pretend to be Bitrix identifiers.
- `data/brands/assets.json`: original source URL, source review, SHA256, shared asset path and optional contrast surface.
- 14 brands have verified logos. GEKA is pending identification: search finds unrelated welding, metalworking and hose-coupling trademarks. It is not published with a guessed logo. Approved GEKA copy remains in the source.
- Product counts are null, product associations are unverified, and product filters/empty-stock statements are omitted. Detail pages offer the existing equipment-selection request. No fake counts or products.
- `publish-editorial.py /path/to/reviewed-assets` packages reviewed originals from `reviewed.json`. Public/native copies use the same bytes. SVGs are not redrawn or recolored. Daire is a vector extraction of the logo on page 1 of its manufacturer manual; former daire.ru is now parked and is omitted from sameAs.

## URLs and SEO

`/brands/`, `/brands/{slug}/`; legacy `/pages/brands` redirects to the directory. Search preserves aliases, including Лебедянь → СТРОЙМАШ. Canonical aliases have one detail URL. Initial HTML includes identity, original logo, exact copy, confirmed facts and Brand/CollectionPage/BreadcrumbList. Preview remains noindex in HTML and HTTP. Owner visual acceptance remains separate.

## Optional HL4 integration

Existing CLI `export-hl4.php` reads HL4 and catalog `PROP_368` without mutations. `import.mjs` accepts that real export and verified logos. If `hl4.json` is supplied, model uses real source identities, product membership, dynamic categories and counts, shared ProductCard/filter sheet, pagination and region context. A complete product snapshot is required in that mode. Do not infer brand membership from manufacturer display labels. Source PHP catalog-brand route is retained. Editorial catalog shortcuts redirect to the identity page while product bindings are unknown.

## Validation

`node --test server/test/brands*.test.mjs`: source mode + editorial mode, aliases, API, initial HTML, no false stock.
`node scripts/brands/audit.mjs`: published original assets and hashes; explicitly reports missing GEKA logo.
`node scripts/brands/browser-editorial.mjs [base] [tag]`: actual API/logos, no interceptions or form submissions; responsive grid, aliases, details, metadata, CTA, shared filter regression.
`browser.mjs` and `fixture.mjs` remain isolated catalogue integration tests. Fixture data and images never enter a release.
