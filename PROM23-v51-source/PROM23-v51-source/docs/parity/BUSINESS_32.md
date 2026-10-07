# Для бизнеса — 32

## Scope
Owner requests a focused B2B page using locked DOCX copy and site visual language. Existing app route `/information/business`; canonical public site route `https://www.prom23.ru/business/`. Only new BusinessPage/content, business branch in InformationScreen, reused account preview, and extracted shared procurement form are changed. Other company/commerce screens stay unchanged. Integration remains explicitly skipped by owner.

## Implementation
- Hero with real own-product photograph, blue steel gradient and registration/invoice actions.
- Capability infographic; six supply advantages; actual cabinet navigation preview; four registration stages with qualified commercial terms.
- Four assortment groups with actual catalog section links; four source facts and real warehouse/production photos.
- Six-stage vertical procurement timeline; four supply scenarios, two real project images and two pictograms.
- Six verified review paraphrases (two initially visible), all 21 source FAQs with search and six topic filters. Answers remain in DOM.
- Inline existing procurement form: file drop/picker, ten files up to 20 MB each, progress/retry/remove, structured settlement, contact/company/INN, object address, editable checked consents. Business context changes only on business action, not page view. Server-confirmed receipts only.
- Anchors, visible focus, restrained scroll reveal/timeline fill, reduced-motion support. SEO title/description/OG/canonical + WebPage/BreadcrumbList; preview noindex retained.

## Content and gates
[Publish gates](../audit/business-publish-gates.md) documents each confirmed/conditional/unverified statement. No automatic discount, payment deferral, credit limit, stock, company account or submission success invented. Registration/cabinet links use real routes; connected authentication and CRM are not claimed.

## Verification
In progress: TypeScript passed, web/iOS/Android export passed, 94 mobile tests passed. Browser checks cover four widths, copy, links, form errors and isolated submission fixtures. Final screenshots and protected-host deployment comparison will be recorded below. User visual acceptance pending.

## Local verification complete
- TypeScript and Expo exports web/iOS/Android passed; 94 mobile unit tests passed.
- 517 page browser assertions across 320/390/768/1280, 52 inline/shared-form assertions across 320/390/1280, four context/motion checks passed. All form submissions/uploads were intercepted in browser; no external application sent.
- Ten actual category links, all 21 FAQ answers/expansion/search/topics, six review links, real auth/cabinet routes, invoice form fallback and organization-cart checkout path verified.
- Required consents, file type/size/removal, retry after upload failure, address encoding, draft preservation, verified upload token, pending receipt and form reset checked.
- Eight neighbor texts unchanged; all six screenshots byte-identical. No JS errors. Source style guide inspected; reviewed hero, cabinet, catalog, facts, workflow, FAQ and form screenshots for mobile and desktop.
- Mobile commit bf1d6f8. Deployment/public checks pending.

## SEO values
- Title: Строительное оборудование для юридических лиц | Промышленник
- Description: Поставка строительного оборудования для юридических лиц и ИП: цены для бизнеса, счёт с НДС, резерв, заказная продукция, доставка на объект и документооборот.
- Canonical: https://www.prom23.ru/business/
- Structured data: WebPage + BreadcrumbList. No conflicting Organization or review/rating schema. Preview stays noindex/nofollow; production indexing/sitemap is outside this isolated preview deployment.
- Native bundles compile, but physical iOS/Android devices were not exercised.

## Deployment
v0.10-20260917-32 activated only in isolated preview service. Artifact SHA256 `9cb0c1224b753fd7e641a22a64212f660dc5fbf8b4da69a6643831d62f2980f5`; 500 files verified. Changed release files are restricted to mobile/dist. Previous v31 and own SQLite backup retained. Public/local bundle `entry-36d745221b707c8b4070e7da8a13f17a.js` matches. All 82 protected production files, shared processes and HTTP status checks unchanged.

Public form checks: 52 passed; public context/motion: four passed. An initial photo assertion ran before network image loading finished; all five assets were then independently confirmed loaded, and the browser test now waits for image completion. No page-code defect was masked. Full public page check is being rerun.

## Final result
Public page checks completed: 517/517 passed, plus 52/52 form and 4/4 context/motion. Total 573 locally and 573 publicly; zero JS errors. Screenshots on 320/390/768/1280 reviewed, including mobile/desktop hero, advantages, cabinet, catalog, facts, workflow, FAQ, registration dialog and inline form error states.

[Open page](http://159.253.19.172:18087/information/business?v=32). No outstanding implementation work within the requested B2B page scope. Awaiting owner visual review, not marked accepted. Backend integration remains intentionally excluded, with no fake success. No standalone HTML archive requested.
