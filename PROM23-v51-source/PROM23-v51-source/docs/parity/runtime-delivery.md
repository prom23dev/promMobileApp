# Concrete delivery discovery and binding adapter

Implementation date: 12.09.2026. Owner: recovery content/runtime subtask. `DeliveryDriver.php` makes the previously absent point resolver and delivery binder callbacks concrete. It does not itself create a carrier booking or install anything in Bitrix. No provider request, real address, shipment, token, order or production account was used in verification.

## Source evidence and preserved behaviour

| Source | Actual capability | Recovery implementation |
|---|---|---|
| `site-source/local/php_interface/lib/delivery/Cdek.php:52` | OAuth followed by CDEK `/v2/deliverypoints`, PVZ filter; source resolves city by name | Private credentials and bounded HTTPS request. Server GAR→CDEK city code replaces name/first-result lookup. Point code, full address and coordinates preserved. No source credential literal is copied. |
| `site-source/local/php_interface/lib/Order.php:34` | Yandex point list through installed Twinpx module, point type/payment filter | Concrete current official HTTP request to pickup-points/list, `{points:[]}` response, server GAR→geo_id. No hardcoded Krasnodar bounding box. Only source-enabled `market_l4g`; disabled5post is not silently activated. |
| `site-source/local/php_interface/lib/Order.php:193` | CDEK/Yandex point name/address/code and source service grouping | The exact service ID, fresh point ID, current name and address must agree before binding. CDEK's carrier code is also retained in ADDRESS, as source did. |
| `site-source/local/templates/main/components/bitrix/sale.order.ajax/main/script.js:1556` | Selected point changes delivery service and copies point address/code | Binder writes the installed carrier's configured order-property code. ADDRESS alone is not claimed to configure the provider. |
| `site-source/local/ajax/order/popup-pickup.php:26` | Actual active region iblock points, ADRES and MAP | Sale point resolver reads real active explicitly mapped elements. It does not invent terminals from a static list. Existing own-warehouse pickup logic remains in CommerceDriver. |
| `site-source/local/ajax/order/courier-geocode.php:40`, `courier-dropdown-results.php:3` | DaData address suggestions and coordinates | Exact GAR parent and actual house identity/coordinates required. `addressSuggestions(payload,actor)` returns at most10 canonical addresses, never internal provider metadata or credentials. Binder repeats lookup and accepts an exact user-confirmed canonical value. |

The current [official Yandex pickup endpoint](https://yandex.ru/support/delivery-profile/ru/api/other-day/ref/2.-Tochki-samoprivoza-i-PVZ/apib2bplatformpickup-pointslist-post) uses a `points` response envelope. Its `terminal` type means a locker; this must not be confused with a transport-company terminal in the store UI. Installed service→method/type mapping remains explicit. Source's bare DATA loop is not copied as the current API schema.

[DaData's official guidance](https://dadata.ru/api/suggest/address/) says suggestions require a person's choice. Therefore the adapter never silently accepts the first candidate or replaces an ambiguous address. Missing house/GAR/coordinates is excluded; a canonical mismatch returns `ADDRESS_CONFIRMATION_REQUIRED`. The caller must show suggestions, allow a deliberate selection, then submit that exact address.

CDEK endpoint and response field semantics follow the supplied Cdek/Order source. The [official CDEK portal](https://apidoc.cdek.ru/) was checked but its detailed documentation was not exposed as static page text. Actual provider-version compatibility is still a target-runtime test.

## Integration API

`new DeliveryDriver($privateConfig)` reads `$privateConfig['delivery']`.

- `callbacks(): array` → `deliveryMethods`, `pointResolvers`, `deliveryBinders`, keyed by actual service IDs, directly compatible with CommerceDriver.
- `resolvePoints(serviceId, GAR, SaleLocationCode, scope)` → actual point rows. Coordinates remain server-side; CommerceDriver exposes its existing public option DTO.
- `bind(serviceId, order, shipment, actualOption, scope): bool` → sets checked properties on the transient Sale order. No `save()`, carrier booking or duplicate CRM action.
- `addressSuggestions(payload, actor): array` → `{suggestions:[{address:string}]}`. Payload: sessionKey, context, settlementId, locationVersion, query; organizationId if applicable. Actor comes only from signed dispatcher. Personal guest read is permitted; organization context must match authenticated actor membership.

Wiring was applied by root in `integrations/runtime/endpoint.php`: callbacks for checkout.options/cart.quote/cart.coupon/order.submit; direct addressSuggestions for checkout.addresses. This subtask inspected that wiring read-only and did not edit dispatcher or CommerceDriver. Equivalent configuration construction:

```php
$delivery = new DeliveryDriver($config);
$callbacks = $delivery->callbacks();
foreach (['deliveryMethods','pointResolvers','deliveryBinders'] as $key) {
    $config['commerce'][$key] = array_replace($config['commerce'][$key] ?? [], $callbacks[$key]);
}
// Runtime operation checkout.addresses:
$result = $delivery->addressSuggestions($payload, $actor);
```

Instantiate once per signed request, sharing that instance's callbacks only within that request. Point cache includes service, GAR, context fingerprint, location version and payment. A new quote/submit request performs fresh provider discovery. Do not register a process-global cached driver.

## Required server-only configuration

| Configuration key | Meaning / rule |
|---|---|
| `delivery.services[actualSaleServiceId].provider` | `cdek`, `yandex` or `sale`. Exact source service IDs verified on installed system. |
| `.method` | `pvz`, `terminal` or `courier`. Own warehouse pickup stays with existing CommerceDriver implementation. |
| `.propertyCodes` | Semantic key→actual installed Sale order property CODE. No numeric guess. All referenced properties must exist before any property is written. |
| `.propertyCodes.pointId` | Required for point/terminal binding. The provider module must actually read this configured code. |
| `.propertyCodes.latitude`, `.longitude` | Required for courier binding. Actual provider property codes; no fabricated coordinates. |
| Optional property semantics | cityCode, geoId, houseId, postalCode, pod, etag, office, comment. Buyer identity fields and LOCATION/ADDRESS cannot be overwritten via the map. Source auxiliary address details already survive in CommerceDriver USER_DESCRIPTION. |
| `.pointType` | Yandex `pickup_point` or `terminal`; verify installed source service meaning. |
| `.receiptPaymentMethod` | Yandex receipt mapping `card_on_receipt` or `postpay`. Required when receipt selected. No guess that cash/card is accepted. |
| `.pointIblockId`, `.addressPropertyCode` | For Sale provider only: real point iblock and its address property; ADRES is the source default. Points read NAME, MAP and configured address property. |
| `delivery.settlementMap[GAR].locationCode` | Exact installed Sale CODE. Must match CommerceDriver's target-settlement mapping, not display name or pricing warehouse. |
| `.cdekCityCode`, `.yandexGeoId` | Actual provider identifiers mapped server-side from GAR. Unknown mapping is explicit error. |
| `.salePointIds[serviceId]` | Real active allowed source point element IDs for this GAR/service; no synthetic point rows. |
| `delivery.cdek.clientId`, `.clientSecret` | Private provider credentials, never archived literals or mobile fields. |
| `delivery.yandex.token`, `delivery.dadata.token` | Private service credentials. Not browser keys and not copied from source. |

HTTP origins are fixed to official `api.cdek.ru`, `b2b-authproxy.taxi.yandex.net`, `suggestions.dadata.ru`; no arbitrary URL from a user or a point row. The adapter rejects redirect/status failures, malformed JSON, excessive response size, control characters and invalid coordinates. TLS verification stays enabled; connect/read timeouts3/8seconds; response cap4MiB. Raw provider bodies never become public error copy. The optional constructor HTTP callback is only for isolated tests, not another unfinished deployment adapter.

## Boundaries, errors and remaining work

Implemented code closes the absence of CDEK/Yandex/Sale point callbacks and checked address/property binding. Concrete credentials, GAR/provider mapping, installed service IDs and property codes remain deployment configuration. Current APIs and module compatibility require target-runtime validation; no live success is asserted.

Root owns dispatcher/config wiring and the BFF/UI address suggestion action. Dispatcher wiring is present; BFF/UI acceptance is reported separately by root. This adapter alone does not close checkout functionality. It also does not supply provider tariffs, parcel dimensions, inventory, order confirmation or carrier labels: existing Sale calculation and source order events remain authoritative.

The current CommerceDriver option contract caps500 points. A larger eligible city list returns `DELIVERY_POINTS_LIMIT` rather than hiding points; paging/search must be added for such installed routes. Source5post remains disabled. Missing module-specific property mapping returns `DELIVERY_PROPERTY_MAPPING_REQUIRED`, not a successful address-only binding. Business intent without a verified organization cannot submit a commercial order; B2C does not require one.

Other exact errors include DELIVERY_SCOPE_INVALID, DELIVERY_LOCATION_MAPPING_REQUIRED, CDEK_CITY_MAPPING_REQUIRED, YANDEX_GEO_MAPPING_REQUIRED, DELIVERY_PROVIDER_CONFIG_REQUIRED, DELIVERY_PROVIDER_UNAVAILABLE, DELIVERY_POINTS_RESPONSE_INVALID, DELIVERY_POINT_NOT_AVAILABLE, DELIVERY_POINT_CHANGED, ADDRESS_CONFIRMATION_REQUIRED, DELIVERY_PROPERTY_WRITE_FAILED.

## Verification

`integrations/runtime/test/DeliveryDriver.test.php` uses isolated HTTP, CIBlockElement and Sale property doubles. It tests real callback contracts, provider parsers, exact geographic scope, payment filter/cache, missing/forged point rejection, no writes before complete mapping validation, courier canonical/house matching, safe suggestion DTO, missing private config, malformed upstream response and URL guards. It performs no external request or real mutation.

Earlier PHP isolated CLI (`evidence/php-policy-recovery05.log`): strict lint30files PASS, Delivery41/41policy assertions PASS. That archive preceded the final house-GAR UUID guard and was therefore insufficient to verify the frozen hash. These positive fixture checks do not establish live Bitrix/provider acceptance.

Final repeat completed by root with isolated `/opt/php84` CLI: `evidence/php-policy-recovery06.log`, Delivery41/41 assertions PASS and syntax lint PASS. The final archive manifest embedded in that log matches both frozen SHA256 values below exactly; this includes the final house-GAR UUID guard. The log was inspected and hashes compared to current local files by this subtask. All41 assertions use isolated HTTP/Sale doubles; installed Bitrix/provider execution and actual delivery remain unverified. PHP05 remains earlier historical evidence, not the final-hash result.

Frozen code SHA256: `DeliveryDriver.php` — `f31a0d980a76a27a72a5b65cb391241fe9bb7b470b80fd9e8d6d59514d1f2bf6`; `DeliveryDriver.test.php` — `b67ef16e2527080ada4403ac5f7864a56aee56dcf6b483d0e2b776ffbd7e446c`. Final guard validates house GAR UUID structure; no provider calls were executed.

Final recovery03 verification: PHP08 strict lint38 files /430 isolated assertions PASS; Commerce48, Delivery41, DeliveryPolicy11. See evidence/php-policy-recovery08.log for hashes. No installed Bitrix/provider acceptance claimed.
