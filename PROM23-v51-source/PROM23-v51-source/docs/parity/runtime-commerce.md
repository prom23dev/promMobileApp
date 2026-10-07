# Source commerce runtime adapter — recovery 12.09.2026

`integrations/runtime/src/CommerceDriver.php` is the PHP source adapter behind the signed BFF transport. It is not installed in production Bitrix. No real orders, coupons, CRM messages or payment sessions were invoked during implementation.

## Concrete operations and current limits

| Operation | Implemented path | Required deployment data / remaining implementation |
|---|---|---|
| `checkout.options` | Structured scope → live commercial region properties → transient Sale Order/Basket → Delivery restriction intersection → source warehouse / actual provider point list → payment restrictions | Server-owned GAR→commercial region and Sale location mapping. Concrete DeliveryDriver now implements CDEK/Yandex/Sale points and canonical DaData address binders. Actual installed service/property/GAR mappings and provider credentials are still required; live tariff/stock acceptance has not run. See runtime-delivery.md. |
| `cart.quote` | Live regional price types; provider stock refresh; delivery calculation; Sale discount final action; exact integer line/subtotal/net/delivery reconciliation; five-minute durable quote bound to actor/context/GAR/version/cart/address/selection/coupon | Requires real Bitrix modules/catalog/prices and the mappings above. Once those concrete dependencies exist, live acceptance is BLOCKED_BY_EXTERNAL_ACCESS here. No snapshot quote accepted as live. |
| `cart.coupon` | DiscountCouponsManager in isolated order mode; apply status after actual Sale calculation; no source broken CouponController calls | Currently requires authenticated source buyer and structured settlement for regional pricing. Guest coupon parity remains PARTIAL; no invented guest user/FUSER. Source actual expiry error classification not yet specialized: engine invalid/not-applicable results are safe, expiry-specific UX remains PARTIAL. |
| `order.submit` | Fresh authoritative recalculation, same quote comparison, actor/scope/expiry check, atomic claim before effect, canonical two-consent validation and durable version/hash receipts, exactly one `Sale Order::save()` | Installed legal document version/hash mapping and matching UI document revisions are required. Existing source order events perform CRM/1C work; no duplicate CRM lead. Their real outcomes remain unverified. |
| `payment.session` | Owned order/person type/organization/unpaid checks; one unpaid external payment; actual PaySystem `initiatePay(STRING)`; provider `getPaymentUrl()` HTTPS host allowlist, explicit PaymentDriver Split handoff and sanitized one-use invoice HTML fallback | PaymentDriver/PaymentHandoff and owned payment.status reconciliation are implemented and wired. Full invoice PDF/seals, actual PSP offers/Plus schedule, receipt mapping and automatic provider webhook reconciliation remain MISSING_IMPLEMENTATION. See runtime-payments.md. |
| `commerce.offer` | Guest or authenticated signed actor allowed; scoped request validation; provider offer response validation/whitelisting; no guessed four payments or Plus percent; corporate Split/Plus stripped | The default offerResolver truthfully returns no offer. Actual provider offers/Plus/schedule remain **MISSING_IMPLEMENTATION**; existing configured resolvers are preserved. This is not a completed PSP teaser integration. |

## Source decisions

- `site-source/local/php_interface/lib/Basket.php:188–380`: regional `CATALOG_GROUP_XML_ID`, `_SALE` → base group fallback, source CatalogProvider. The source reads persisted `BASKET_ID`; this adapter uses a scoped `catalog/OnGetOptimalPrice` hook while building an **unsaved** basket so an options/quote request never overwrites the customer's website FUSER basket. `CUSTOM_PRICE=N`; no manual-price coupon bypass. Hook/coupon state is removed in `finally`, after any order save.
- `site-source/local/php_interface/lib/Regions.php:430–620`: live region PRICE_CODE, warehouse, delivery/payment IDs; personal domestic routing must be reflected explicitly in `regionBySettlement`; legal default region KRD/KRD_SALE rule retained. Source static `+3 days` pickup promises and hardcoded point coordinate boxes are not reused as actual ETA/data.
- `site-source/local/php_interface/lib/Regions.php:537–541` maps `DELIVERY_SERVICE_PICKUP_TK` to `delivery_pickup_tk`, and `DELIVERY_SERVICE_TK` to `delivery_courier`. `site-source/local/templates/main/components/bitrix/sale.order.ajax/main/result_modifier.php:108–119` clears the latter TK group for physical buyers and removes only `DELIVERY_SERVICE_YANDEX_COURIER_ID` from it for legal buyers. Pickup-TK and the shop pickup remain available subject to actual restrictions. Legacy property group names are **not** UI methods: pvz/courier/terminal classification comes from the private installed-service config. IDs then intersect **client-mode Bitrix restrictions**; source constants alone do not advertise a method.
- `site-source/local/class/Models/Organization.php`: fresh uncached `PROPERTY_USER_IDS` membership query for organization requisites. No cached 24-hour membership authorization.
- `site-source/local/ajax/consent-validate.php`: two distinct source consents. Adapter records only those canonical identities. Their approved text versions/hashes must come from installed source config and match the app documents; legal approval is not inferred from this code.
- `site-source/local/php_interface/events.php`: Sale save runs existing order lifecycle; no second direct Bitrix24 operation.
- `site-source/local/php_interface/lib/Helpers.php:256–297` (`getStoreQuantity`) filters `AMOUNT>0` and cannot report a zero row — not usable as the stock source of truth. `CommerceDriver::readInventory()` instead queries `Bitrix\Catalog\StoreProductTable` directly for `region.storeId` (resolved from iblock 22's single `STORE` property, `site-source/local/php_interface/lib/Regions.php:514,558`), matching the explicit-row semantics in `site-source/local/ajax/order/change-region.php:127–139`: an existing row with `AMOUNT<=0` blocks the line (`PRODUCT_OUT_OF_STOCK`); a missing row is treated as unknown and gates on price presence only, exactly as the source does. Catalog iblocks 4/5/32/33 were confirmed to be flat products with **no** paired SKU/offers iblock (unlike 34→35 for towers) — `\CCatalogSKU::GetInfoByProductIBlock()` only resolves for 34, per `site-source/local/php_interface/lib/CatalogSort.php:44-53` and `defines.php:139-140`. Whether a region can be served by more than one physical store (README's "confirmed full store scope") is still open — `readInventory()` only reads the single `region.storeId` today; extend to `'@STORE_ID'=>$storeIds` once that mapping is confirmed, do not silently aggregate.

## Server-only configuration (not credentials in client)

The dispatcher constructs `new CommerceDriver(['pdo'=>$ledger->pdo(), 'commerce'=> $privateConfig['commerce']])`.

```php
'commerce' => [
  'siteId' => 's1', // Verify actual installed site. Do not copy blindly.
  'catalogIblockIds' => [/* actual allowed source catalog/offer iblocks */],
  'productIdMap' => [/* optional non-prom-ID mapping to verified source element IDs */],
  'regionBySettlement' => [
    // '<real GAR UUID>' => [
    //  'personal' => ['regionId'=>actual_ID, 'locationCode'=>'actual Sale CODE'],
    //  'organization' => ['regionId'=>actual_ID, 'locationCode'=>'actual Sale CODE'],
    // ],
  ],
  'deliveryMethods' => [/* source delivery service ID => pvz/courier/terminal */],
  'pointResolvers' => [/* source service ID => callable(GAR, Sale locationCode, shipment, scope): actual point rows */],
  'deliveryBinders' => [/* service ID => callable(order, shipment, actualOption, scope): bool */],
  'paymentAllowedHosts' => [/* exact configured HTTPS PSP hostnames */],
  // consentRecorder is supplied by the dispatcher, using root config['legalVersions'].
  // Do not override it with a no-op callback.
  'splitEligibility' => /* optional actual PSP eligibility callable(payment, scope): bool */,
  'splitPaymentHandoff' => /* optional actual PSP callable(order,payment,actor): HTTPS URL */,
  'offerResolver' => /* actual provider offers callable(scope,actor): validated DTO */,
],
```

Comments are a schema illustration, **not a runnable config** and not fabricated installed IDs. Do not write any token/credential in it before moving it outside web root with mode0600. The real protocol config supplies provider secrets privately. Root `legalVersions['privacy'|'consent']` contains each approved `version` and actual `sha256`. Dispatcher injects `consentRecorder(consents,actor,'checkout')` backed by `ConsentLedger`; it returns a durable receipt digest. No duplicate consent ledger is maintained by CommerceDriver.

`pickupId` currently carries the opaque **delivery option ID** for all methods, including courier. It is re-resolved from live eligible options. Empty courier selection can resolve only when exactly one eligible carrier exists; multiple carriers require explicit selection. Pickup point IDs and delivery costs are never accepted from client as authoritative.

Address `pod/etag/office/comment` is preserved in source `USER_DESCRIPTION`, and passed separately to provider binders. This avoids inventing source order-property IDs. Native invoice/PSP handoff and source order-property schema require target-runtime validation.

## Persistence, errors and recovery

Private bounded SQLite contains commercial quote rows and SHA-256 actor/scope bindings, no address or contact values. The shared ConsentLedger contains session hash, actual user/organization IDs, document revision/hash and timestamp; they remain personal-data processing and need a deployment retention schedule. Completed/pending quote metadata is bounded and retained for reconciliation; fresh expired quotes are pruned. Operator cleanup must preserve pending writes until reconciled.

`commerce_quotes`: `fresh → pending → complete`. Pending is claimed before Sale save. A crash/uncertain result returns `RESULT_RECONCILIATION_REQUIRED`; neither driver nor dispatcher blindly retries the write. Order XML_ID is `prom23-mobile-<opaque quote ID>` to locate the actual order without recording address data in diagnostic logs. Exact duplicate completed quote returns its owned order reference. User contact changes do not create another order for the consumed quote.

Known errors include AUTH_REQUIRED, ORGANIZATION_REQUIRED, REGION_MAPPING_REQUIRED, LOCATION_MAPPING_INVALID, PRICE_GROUP_MAPPING_REQUIRED, PRODUCT_OUT_OF_STOCK, DELIVERY_POINTS_RESOLVER_REQUIRED, DELIVERY_ADDRESS_BINDER_REQUIRED, DELIVERY_OPTION_REQUIRED, PAYMENT_NOT_AVAILABLE, QUOTE_CHANGED, QUOTE_EXPIRED, CONSENT_VERSION_REQUIRED, PAYMENT_HANDOFF_ADAPTER_REQUIRED and COMMERCE_OFFER_ADAPTER_REQUIRED. Public transport must keep these sanitized; raw provider exception bodies are not user copy.

## Verification and authoritative API references

Post-PHP06 regression: personal buyers previously cleared the wrong `terminal`/PICKUP_TK group. Corrected to clear only `courier`/DELIVERY_SERVICE_TK, matching both source files above. `test/DeliveryPolicy.test.php` exercises the real region/property reader and delivery option selection with isolated table/provider doubles: physical retains pickup-TK/PVZ and configured terminal services; legal removes only Yandex courier and retains other services. No frontend preference filtering was changed. PHP06 predates this correction; the final rerun is recorded below.

Final rerun [php-policy-recovery07.log](evidence/php-policy-recovery07.log): **DeliveryPolicy11/11 PASS**, total375 isolated assertions and37 PHP lint checks PASS. Checked CommerceDriver SHA256: `ab6df89ae1b799e4f21c224094249b71dd8ea8a2ea05ad1fde7a9825f5584937`. This confirms the corrected source group policy with test doubles; live Bitrix/carrier eligibility remains unverified.

- Server suite158/158 PASS; final payment transport/HTTP subset31/31 PASS after wiring.
- Final PHP06: strict syntax35 files;334 isolated assertions, including Commerce48, Payment75, Delivery41. Existing `/opt/php84/bin/php` includes PDO SQLite/DOM; the earlier three skipped quote-store cases now pass without installing extensions. Actual Bitrix/PSP execution remains NOT_RUN.
- Browser commerce38/38 and forms32/32 at320/390 on final local export. These tests do not imply live provider acceptance or full parity.

Official API references checked 12.09.2026:

- [Order and final action](https://docs.1c-bitrix.ru/api/classes/Bitrix-Sale-Order.html)
- [DiscountCouponsManager initialization](https://dev.1c-bitrix.ru/api_d7/bitrix/sale/classes/discountcouponsmanager/init.php), [get status](https://dev.1c-bitrix.ru/api_d7/bitrix/sale/classes/discountcouponsmanager/get.php)
- [Delivery restriction client mode](https://dev.1c-bitrix.ru/api_d7/bitrix/sale/technique/shipment.php?print=Y)
- [Payment restriction client mode](https://mobile.dev.1c-bitrix.ru/api_d7/bitrix/sale/technique/payments.php)
- [PaySystem Service](https://docs.1c-bitrix.ru/api/classes/Bitrix-Sale-PaySystem-Service.html), [ServiceResult payment URL](https://docs.1c-bitrix.ru/api/classes/Bitrix-Sale-PaySystem-ServiceResult.html)

Final recovery03 verification: PHP08 strict lint38 files /430 isolated assertions PASS; Commerce48, Delivery41, DeliveryPolicy11. See evidence/php-policy-recovery08.log for hashes. No installed Bitrix/provider acceptance claimed.

## Preview snapshot vs. real Bitrix catalog (checked 22.09.2026)

`data/catalog.json`/`data/product-details.json` are a hand-curated 28-SKU export of `prom.myfast.space` per `data/provenance.md`, not the live catalog:

- **Coverage**: 28 SKUs across 6 `kind`s (3 tower, 6 ladder, 4 scaffold, 4 tool, 8 equipment, 1 mixer). Real Bitrix spans 6 catalog iblocks (4/5/32/33/34/35) and is documented (`docs/discovery`) to have far more elements than 28 — this snapshot is explicitly "not the full assortment" (`provenance.md:5`).
- **Stock is fabricated, not just stale**: every one of the 28 `catalog.json` entries currently has `"stock": null`, while `provenance.md:18` (written for an earlier snapshot revision) describes a `stock=20`/`stockSource=local-test-limit` placeholder that no longer matches the checked-in file — the doc itself is stale relative to the data. Either way, no snapshot record reflects `StoreProductTable.AMOUNT`; real per-store amounts must come from `readInventory()`.
- **SKU/offer collapsing**: the snapshot has only 3 "tower" entries (one row per visual model), but iblock 34→35 has a real base-product→offer(SKU) split — the snapshot cannot represent per-offer stock/price variance since it never captured offer-level rows.
- **Bug found while wiring this**: `CommerceDriver::prices()`'s default `catalogIblockIds` fallback referenced `IBLOCK_ID_FOREST_NEW`/`IBLOCK_ID_YTP_NEW`, which don't exist in `defines.php` (real names are `IBLOCK_ID_CATALOG_FOREST_NEW`/`IBLOCK_ID_CATALOG_YTP_NEW`, iblocks 5/32) — `defined()` silently returned false so those two iblocks were dropped from the default allow-list. Fixed to match `defines.php:14,39`. This only mattered when `commerce.catalogIblockIds` config was left unset; deployment should still set it explicitly rather than rely on the constant fallback.
