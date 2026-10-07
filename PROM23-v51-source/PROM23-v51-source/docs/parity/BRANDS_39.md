# Brands 39 — owner-approved editorial directory

Latest owner request supersedes the former HL4 publication gate: build a straightforward page using the approved descriptions and find logos online.

Implemented: /brands/ and 14 canonical detail pages; own brands highlighted; search including aliases, source/alphabet sort, 1/2/3-column grid, equal card slots, whole-card/logo/title links, vertical reveal with reduced-motion support. Exact approved descriptions and confirmed identity fields. Original logos with contain sizing and consistent source across directory/detail. Initial HTML, canonical, Brand/CollectionPage/BreadcrumbList; preview stays noindex.

No stock/product counts or associations are fabricated. Editorial identities use explicit slug IDs. Existing catalogue integration code remains available for a future real HL4/PROP_368 import, but no longer blocks this content page. Unknown inventory is not described as zero or temporarily absent. Detail CTA goes to the existing equipment-selection request.

## Logo audit

Approved copy: 15 brands. Published originals/details: 14.
Own local SVG: 2. Official websites: 11. Manufacturer manual vector extraction: 1 (Daire).
UF_FILE: 0; current source export was not available and is no longer required by the revised task.
Missing official logo: 1, GEKA. Multiple unrelated trademarks found; asked owner for exact source. GEKA is withheld instead of using a guessed/placeholder logo; copy retained in presentation.json.
Broken published logos: 0. Original URLs/provenance/hashes: data/brands/assets.json.

## Verification

TypeScript and web/iOS/Android export passed. Server tests 178/178; mobile 97/97. Actual local browser checks 156/156 at 320/390/768/1280: all 14 logos and initial detail HTML, responsive grid/equal heights, aliases/no-results/sort, links, exact descriptions, canonical/Brand schema, request CTA, menu legacy route, unknown404/alias308, shared catalog price validation. No JS errors, no form submissions. Mobile/wide screenshots reviewed; white Alumet original uses a dark surface for contrast. No physical-device acceptance claimed.

Deployment evidence and final status are recorded in PROGRESS.md. Owner visual acceptance remains pending; not ACCEPTED.

## Published verification
http://159.253.19.172:18087/brands/?v=39. Real public browser 156/156, no JS errors. 560 release files verified; v38 and DB backup retained. Public bundle matches; protected host files/processes/HTTP unchanged. Publication complete for 14 reviewed brands, GEKA logo remains pending.
