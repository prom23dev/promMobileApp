# Product detail projection — MASTER5

Implementation: `server/integrations/product-detail.mjs`. This is a callable server-side service and public snapshot exporter, **not a live Bitrix connection**. JSON Schema: `server/integrations/product-detail.schema.json`.

```js
const service = createProductDetailService({ products, details });
service.getPublicDetail('prom-2414'); // immutable copy, null if product has no detail snapshot
await service.getAvailability('prom-2414', {
  settlementId: '915703c4-731d-4ebe-b893-561d99982172',
  buyerContext: 'personal',
}); // unknown / BITRIX_MAPPING_REQUIRED while providers are absent
service.readiness(); // counts/configuration, never proof of live integration
```

The service has no HTTP/network/file-write path. `getPublicDetail` strips unsafe media, HTML/control text, private documents, local filesystem paths and unproved capabilities. Unknown products throw `PRODUCT_NOT_FOUND`404; invalid request shape throws `PRODUCT_CONTEXT_INVALID`400. Media may only reference verified same-site HTTPS upload URLs; no query tokens, arbitrary origins, remote code, video or invented360 assets.

`capabilityMode: source-form-visibility` explicitly distinguishes a verified entry to a form from live eligibility, leasing approval, inventory, a quote or accepted submission. `runtimeWritesAvailable` is alwaysfalse. Source-controlled `canRent` and `canLease` are preserved per product; an unknown field becomesfalse. `canRequestCallback` is a callback, not a quotation. Source-disabled cheaper CTA is not enabled from the existence of its PHP handler.

## Inventory providers and trust boundary

Programmers can inject two **server-owned** functions. They must be closed over a verified current actor/organization and must never accept a client's organization membership, selected warehouse, service region or price as authority.

1. `resolveCommerceContext({settlementId,buyerContext})` returns `{settlementId,buyerContext,contextKey,serviceRegionId,expiresAt,warehouses:[{id,name?}]}`. It verifies the current official settlement and actual Bitrix mapping. `contextKey` must bind actor/organization, settlement/version, service region, warehouse scope and pricing context. `organization` is not an authorization token. The current service refuses unknown, stale or mismatched mappings. Existing fullGAR is geographical reference only.
2. `readInventory({productId,contextKey,warehouseIds})` returns `{productId,contextKey,measuredAt,expiresAt,complete,rows:[{warehouseId,quantity}]}` from an authoritative read-only source. Only warehouse IDs from the first function reach this provider. No direct request field can choose arbitrary stores.

The inventory DTO has `status: unknown|in-stock|out-of-stock`, physical `totalQuantity`, per-warehouse quantities, timestamps and a stable reason. Missing rows remainunknown, even when `complete=true`; an explicit valid row with0 is required to claim zero. Incomplete coverage never produces a total. Duplicate/foreign IDs, negative or nonfinite quantities, expired data, product/context mismatch and raw provider failures failclosed. Positive physical `AMOUNT` is not available-to-promise: `availableToPromise`, `nearestWarehouse`, `pickupAvailable`, `estimatedRestock` remainnull and `checkoutEligible=false`. They require separate confirmed reservation/route/delivery contracts.

Source integration reference: `Helpers.php:256` queries `StoreProductTable` with `AMOUNT>0`; it cannot directly satisfy this complete inventory contract. Read StoreProductTable without dropping explicit zero rows, and verify current store scope. `Regions.php` maps commercial prices/stores; its B2 C default-city bug must not override selected settlement. `lib/Basket.php:188` contains CatalogProvider; quotes must use its actual price context and Sale calculation. A successful read-only quantity projection never creates an order or calls CRM.

## Documents and content

The28public PDPs exposed no downloadable product PDF/document links. The source template's after-purchase statement is represented as `documentPolicy.requiresOrder`; there are no invented instructions/certificates. Purchased order documents must use the owner/context-scoped bridge manifest. Public snapshot normalization deliberately drops documents with any access other than `public`.

The exporter converts source description/advantages/package contents to plain-text arrays. The mobile gallery stores actual720srcset variants locally and retains `originalUrl` for the original1280variant provenance. This is not an eagerly loaded photo feed. The page SHA256 and per-file SHA256 make the import inspectable. These snapshots do not contain personal data, hidden form/session tokens, source credentials or runtime SQLite.

## Validation and limits

`server/test/product-detail.test.mjs`:7tests covering data provenance and isolation/failure boundaries. `scripts/test-product-details.py`:4tests for exact product identity, ignored HTML comments/scripts, real responsive variants and URL restrictions. Logs: `docs/testing/product-detail-tests-master5.log`, `product-snapshot-tests-master5.log`, `product-snapshot-master5.log`.

These checks do not claim all forms or the actual Bitrix database work. No merchant/carrier/CRM requests, website auth, order creation, upload acceptance, financial operation or store review has been tested by this module. Native screen/gesture/loading acceptance belongs to the separate root QA run.


## HTTP registration and request binding

Root registered `GET /api/v1/products/:productId/details` (public snapshot) and `GET /api/v1/products/:productId/availability` (Bearer local session required) in `server/app.mjs`. The latter rejects an absent official settlement with409SETTLEMENT_REQUIRED and returns:

```json
{"data":{"productId":"prom-2414","settlementId":"915703c4-731d-4ebe-b893-561d99982172","locationVersion":1,"buyerContext":"personal","availability":{"status":"unknown","reason":"BITRIX_MAPPING_REQUIRED","totalQuantity":null,"checkoutEligible":false}}}
```

The example shows relevant fields only; full availability fields follow the schema. `buyerContext` is personal|organization from the server session, never query input. The client must bind product/settlement/version/buyer context and ignore stale responses. Query-supplied warehouses, settlements and prices are rejected. Responses remain no-store; public detail contains no local file paths/private documents/stock claims. Product/malformed-route404, wrong-method405, no-auth401, missing-location409 are tested. Missing/corrupt optional snapshots do not prevent catalog/session startup. There is no real auth or successful live stock/PSP/Bitrix operation implied by these routes.

## Reviews, questions and media — source contract and current client boundary

`site-source/local/components/prom/product.reviews.list/class.php:26–30` reads `r-sort`, `r-rating`, `r-with-photo`, `r-with-replies`. At56–74 it maps rating1..5 to `UF_RATING`, media to nonempty `UF_MEDIA`, high-rate/low-rate to rating descending/ascending followed by `UF_DATE DESC`; source `popular` falls back to newest-date ordering and must not become an invented popularity score. At120–155 it selects roots with replies and then fetches replies chronologically. At180–184 public rows require the exact `UF_TARGET_ID`, `UF_ACTIVE=1`, `UF_SKIP_RATE=false`. Statistics, filtering and pagination are backend-owned, not computed as global counts from a partial client page.

Root added `mobile/src/publication-domain.ts`: `selectPublications` isolates product/kind and applies local rating/media/replies/date sorting; `safePublicationMedia` restricts displayed media. `ProductDiscussion` renders filter chips, photos/video links and replies. `mobile/src/api/site.ts:loadProductPublications(productId,context,filters)` remains an explicit unavailable adapter returning `{items:[],available:false}`. These are prepared UI and typed filtering contracts, not a claim that actual reviews were retrieved or uploaded. No fake authors, ratings, counts or media were inserted.

Future BFF mapping: `rating → r-rating / UF_RATING`, `withMedia → r-with-photo / UF_MEDIA`, `withReplies → r-with-replies`, `sort → new|high-rate|low-rate`. Use a strict typed parameter map, not arbitrary legacy query forwarding. Backend must return stable publication IDs, product ID, moderation-approved text, timestamp, optional media and nested replies plus allowed actions for the authenticated owner/context. Never accept client-supplied authorship/organization/parent permission. Public read and authenticated mutation are separate operations.

User media upload still needs MIME+file-size/count validation, safe storage/object IDs, malware handling and moderation. Device URIs are not server URLs, and picking a file is not an accepted upload. Do not publish legacy PHP paths, secret query URLs or unverified external media. Existing review/reply/edit/delete form definitions remain runtime-blocked until the source-compatible service is connected.
