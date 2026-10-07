# Brands 40 — original logos on white

Scope: directory and brand details only. All 14 published logos use the same white frame. Replaced reverse white marks for Promyshlennik, TeaM and Alumet with positive original artwork. No artificial colors, tracing, shape changes or cropping of the marks.

Sources: owner files `Лого_ПРОМЫШЛЕННИК верный.pdf` (upper-left black positive mark), `logo team.ai` (orange/gray full lockup); official Alumet catalogue `https://en.alumet.ru/doc-files/cat_9_compressed.pdf`, cover. Exact vector extraction areas and hashes recorded in data/brands/assets.json. Dedicated filenames prevent old cached negative versions appearing on white.

Implementation: shared React LogoFrame and static initial HTML use identical white background. Bundled inline SVG IDs are namespaced by brand to avoid one artwork clipping another; file-based original SVG geometry/colors are untouched.

Validation: TypeScript and web/iOS/Android exports passed. Eight brand model/SEO tests passed. Local browser verification: 174 checks, 320/390/768/1280, all 14 logos and details, original descriptions, aliases, canonical/Brand data, links, white frames, no JS errors or overflow. Desktop/mobile screenshots reviewed; caught and fixed inline SVG clip ID collision. Mobile commit 406e6ec.

External product integration and GEKA identity clarification remain deferred from v39. No additional pages redesigned. Owner visual acceptance remains pending.

Public v40 browser verification: 174/174 passed, no JS errors; desktop/mobile screenshots reviewed.
