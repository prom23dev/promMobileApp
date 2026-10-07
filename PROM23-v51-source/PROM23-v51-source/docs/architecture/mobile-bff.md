# Mobile BFF — source-aware integration boundary

Updated 2026-09-11, V8. Extends the existing Expo client and isolated Node BFF; does not run the supplied Bitrix PHP tree. Source discovery is in `../audit/source-code-map.md`, integration ownership in `../audit/integrations.md`.

## Current implementation

- `/api/catalog`, `/api/catalog-tree`: the supplied public product snapshot and source taxonomy. 28 SKU, 226 sections, 20 roots. This is not the entire live inventory. Price, old price and rounded discount are server projections; unknown stock is `null`. `draftQuantityLimit` is explicitly independent of inventory.
- Public `/api/v1/home`, `/app-config`, `/catalog`: bounded JSON, fixed native block allowlist, opaque pagination, no executable remote UI. Capabilities do not advertise live payments, checkout or authentication.
- Anonymous session: favorites, viewed products, search history and draft cart. It is not a Bitrix login. Existing `organization-demo` draft remains stored for recovery into a procurement request, but it grants no organization membership; public selection rejects with `ORGANIZATION_REQUIRED`.
- `/api/v1/locations/suggest`, `/locations/:id`, `/location`, `/cart/revalidate-location`: verified GAR reference data and optimistic session location versioning. Full contract and limitations: `location-service.md`.
- Synthetic orders, addresses, tariffs, appeals and notification writes are unavailable by default. `allowTestFixtureOperations: true` exists only as an explicit test-constructor option, with tests proving default isolation. No HTTP/environment switch enables it.
- Frontend `api/site.ts`, `api/commerce.ts`, `api/procurement.ts` are connection boundaries. They do not call source AJAX handlers, send credentials, fabricate records or declare successful submissions.

## Regional commerce handover

Resolve Settlement UUID → existing Bitrix location → commercial ServiceRegion → eligible warehouse set and delivery/payment rules. Never derive the commercial region solely from a city label, IP, domain or geographic containment. Preserve the customer's chosen settlement for physical persons: the source default-city override is not copied.

On location/context/quantity changes: reject stale version, invalidate unconsumed quotes, reload server catalog/availability, reprice every retained cart line, return affected lines and explicit unavailable items, recompute delivery/payment eligibility. Keep all selections; request confirmation of material changes. A quote must include settlementId, locationVersion, verified buyer/organization, item quantities and price revision, expiry and quoteId. The client key already invalidates offers across geography/version changes. Current revalidation returns 503 until this Bitrix adapter is connected; it never claims a successful reprice.

## ProcurementRequest

A separate file-first entity, available to a guest or company buyer. Fields: name, phone, optional email/company/INN, structured settlement ID/version, need description, attachments and versioned consents. `/procurement` UI accepts a description or file without SKU. `/quick-order` remains a separate SKU convenience flow. Device URIs are not upload IDs.

The integration must create an upload intent, enforce authentication/guest rate limits and per-request total size, verify extension + MIME + signature, malware-scan documents, validate object ownership, bind uploaded files to one draft and return opaque IDs. Do not include URI or document contents in analytics/logs/URLs. Submit idempotently to the source application's lead/Bitrix24 boundary; return acceptance only after durable receipt. PDF/Excel/CSV/Word/images: current draft limit10 files,20MiB each. Archive formats/executables are excluded. File size must be known. Company INN verification and attachment scanning belong to the backend.

## Site forms and account

Source field names, repeated groups, consent names and target entities remain registered. Dynamic enumerations, RBAC and CSRF/session challenges must originate from a verified server context. Form screenshots and schema coverage do not equal operational parity. The source controls business documents, organizations, staff, payment/delivery options, returnable items, public comments and waiting-list access. See `../audit/forms-parity.md` for concrete gaps and source locations.

For courier order properties preserve base address and optional pod/etag/office/comment separately, then compose the mapped Bitrix property. For return/appeal video enforce duration≤60s and size≤20MiB server-side. Client file validation is not proof of duration or MIME.

## Operational boundaries

Only the PROM23 service on18087/18090 is deployed. No DNS, shared webserver, MariaDB or `zavod-antibpla.ru` change. GAR reference SQLite is read-only and separate from writable session SQLite. Native store release requires verified HTTPS endpoints, real auth/payment/1C/Bitrix24 scenarios and signed builds; neither the preview nor read-only source tests proves those integrations.
