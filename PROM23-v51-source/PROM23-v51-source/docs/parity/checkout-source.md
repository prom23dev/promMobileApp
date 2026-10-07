# Checkout source audit — recovery

Source read-only; no production requests or form submissions.

| Function | Web route | Source | Required behavior | Before recovery |
|---|---|---|---|---|
| Buyer types | /order/ | site-source/local/templates/main/components/bitrix/sale.order.ajax/main/template.php:62 | PERSON_TYPE 1/2; active Organization membership required | MISSING |
| Organization cart | /organization/dashboard/ | site-source/local/class/Models/BasketUsers.php:84 | USER_ID + ORGANIZATION_ID; personal separate; no fabricated organization | MISSING |
| Coupon | /basket/ | site-source/local/class/Controllers/CouponController.php:27 | validate active/date/maxuse/user; DiscountCouponsManager; apply method calls absent checkCoupon | MISSING |
| Payment | /order/ | site-source/local/templates/main/components/bitrix/sale.order.ajax/main/template.php:673 | 14 online/YCP;17 receipt;INVOICE_PAYMENT_SYSTEM=16 invoice (defines.php:108; stale comment mentions13). Runtime configuration determines availability | MISSING |
| Delivery selection | /order/ | site-source/local/templates/main/components/bitrix/sale.order.ajax/main/result_modifier.php:106 | region pickup/pickup_tk/courier; physical TK hidden; legal excludes Yandex courier | MISSING |
| Authoritative total | /order/ | site-source/local/php_interface/lib/Basket.php:188 | CatalogProvider refresh; CATALOG_GROUP_XML_ID; Sale discount pipeline; no client authority | MISSING |
| Contact properties | /order/ | site-source/local/templates/main/components/bitrix/sale.order.ajax/main/template.php:75 | FIO/EMAIL/PHONE/ZIP/LOCATION/ADDRESS; type2 COMPANY/CONTACT_PERSON/INN/KPP | PARTIAL |
| Selected settlement | / | server/location/service.mjs:51 | Official identity validated; version CAS; commercial resolver still unresolved | PARTIAL |

No stock/price/ETA/payment eligibility is inferred from source constants alone. Provider and region restrictions are retained; unavailable methods must remain distinguishable from a selected confirmed delivery quote.

## Date/time source clarification — recovery
`local/templates/main/components/bitrix/sale.order.ajax/main/template.php:310–370` wraps `delivery-date` and `time` controls in a PHP comment. The dates are a static June2025 loop. These are LEGACY_REVIEW source controls, not verified active checkout slots. They must not be shown as available dates; actual provider period remains a runtime result.
