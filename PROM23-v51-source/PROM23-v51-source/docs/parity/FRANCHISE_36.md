# Franchise 36 — review build

Source: owner Drive brief `1VXpbs_GWeZg8GcD_r-TcjbqZV35BC0gHI5oUPzBlsEg`, retrieved under verified approved Google account. The initially linked same-title document contained a Brands brief and was not applied. Latest owner message adds five active franchise cities.

## Changed
Dedicated page `/pages/franchise`: real company fleet hero, fee/royalty terms with launch expense clarification, start/after-launch support tabs, B2C/B2B/project/custom-production model, five assortment groups, original own-brand SVGs, six-step vertical timeline, partner requirements, Russia/international block, compact interactive map and accessible city list, eight FAQ accordions, inline application and real related routes. Reuses app shell, styles, reduced-motion and context.

Active network: Minsk, Tyumen, Irkutsk, Tbilisi, Astana, Yerevan. Six city-centre markers; no invented addresses, opening dates, performance figures or partner photographs. Former closed cities and construction projects are not rendered as franchisees.

Partner form is shared by inline page, `/forms/partner`, `/forms/franchise`. International country/region, international phone, business yes/no, warehouse yes/no/planned, conditional legacy fields, interests and about. Mandatory consents default checked and remain removable as previously requested. Existing API transport, idempotency, verified reference-only success, no automatic mutation retries. API schema and conditional validation updated; runtime/CRM integration explicitly remains skipped. See [publication gates](../audit/franchise-publish-gates.md).

## Verification
TypeScript passed; web/iOS/Android exported. 97 mobile tests and 164 server tests passed. 265 local browser checks + 20 navigation checks passed across 320/390/768/1280. Validation includes original and foreign applicant, hidden-field omission, consent removal, controlled failure/retry/receipt, all network pins/list buttons, FAQ, anchors, reduced motion, original form aliases, catalogue links, back/menu and organization cart badge. No real external form submissions: browser intercepts all tested form writes. Eight neighboring page texts unchanged versus published v35.

Hero, conditions, support, business model, assortment, logos, timeline, requirements, geography, FAQ and forms captured on mobile and wide layouts. Source white logos received appropriate dark presentation surface; map labels use readable app typography.

## Release
Mobile commit: 9a2ded3. Isolated release `v0.10-20260918-36`, published and verified at http://159.253.19.172:18087/pages/franchise?v=36. Public 265 page/form + 20 navigation checks passed; public/local bundle matches, 500 release files verified, prior v35 and own DB backup preserved. Protected files, processes and HTTP unchanged. Changes outside mobile/dist are limited to partner form contract and server validation. No source Bitrix handler or credentials modified.

## Remaining boundaries
Live Bitrix handler needs new international fields and conditional legacy requirements before production; no connected delivery claim. Production contractual/online-store architecture gates remain listed. Preview remains noindex. Physical-device and owner visual acceptance are not claimed.
