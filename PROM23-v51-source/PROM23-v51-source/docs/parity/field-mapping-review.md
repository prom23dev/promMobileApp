# Field mapping review — recovery03

166 previously unattested static controls; source/control/registry/renderer/driver review. No connected Bitrix or real provider submission. Aliases retained; repeated/dynamic fields not inflated into166.

166/166 ранее не аттестованных controls разобраны отдельно. Это source review, не 166 успешных runtime submissions. Старые 15 точечных Profile mappings вне этого пакета; original runtimeMappingImplemented flags не переписаны.

| Статус source review | Полей |
|---|---:|
| SOURCE_MAPPING_REVIEWED | 89 |
| LEGACY_UNMAPPED | 14 |
| READ_ONLY_SOURCE_MATCH | 11 |
| DYNAMIC_SCHEMA_REQUIRED | 25 |
| CHECKOUT_SEPARATE_SCOPE | 16 |
| COMMENTED_SOURCE | 2 |
| FIXED_CONSTRAINTS | 8 |
| PARTIAL_MEDIA_CONTROLS | 1 |

## Пять исправленных дефектов

| ID | Поля | Исправление и источник |
|---|---|---|
| F01 | supplier.attachment | Только txt/doc/docx/pdf,1 файл,20MiB. suppliers-form-action.php:79. |
| F02 | buy-one-click.form_text_16, rent.form_text_23 | Целое1–99, inclusive. Исходные CForm counters data-min/data-max; реальная схема answer IDs по-прежнему требует сверки БД. |
| F03 | review.media[] | jpg/jpeg/png/mp4/mov/webm,10 файлов,20MiB каждый; обычный handler form-review-add-action.php:98–123. order-review/review-edit остаются image-only. |
| F04 | appeal.comment, appeal-order.comment | UTF-8≤2000/500 bytes, включая кириллицу и emoji. appeals-text-action.php:24–39 и appeals-order-form-action.php:29–44. |
| F05 | question.question-text, question-edit.question-text | Не менее5 символов Unicode после trim; клиент, BFF и signed runtime до source effect. Ответы на вопросы не изменены. |

UploadDriver уже проверяет глобальные MIME mp4/mov/webm и ffprobe duration≤60s. Без ffprobe загрузка видео возвращает unavailable; настройка и реальный upload/provider runtime не проверялись. Source handlers не изменялись. Ограничения повторяются в BFF и signed PHP boundary; composite appeals сохраняют и собственную ServiceDriver validation.

## Незакрытые факты

- question/question-edit: minimum5 исправлен в recovery03; реальные source submissions остаются непроверенными.
- review-edit: сохранение существующих image/video IDs исправлено typed HL update и проверено30 isolated model assertions. Выборочное удаление отдельных прежних вложений остаётся PARTIAL; реальный Bitrix/media storage не проверялся.
- CForm numeric IDs/required/type статических snapshot-форм не полностью сверяются с установленной схемой. У document-request есть SID resolver, но без подключённой БД current IDs не аттестованы.
- checkout: delivery-date/time оказались неактивной разметкой внутри PHP comment, открытого на template.php:310 и закрытого на:394. Строка325 содержит статический June2025. Статусы исправлены на COMMENTED_SOURCE/LEGACY_REVIEW; это не потерянные активные controls. Отдельный ORDER_CONTACT_PERSON не аттестован независимо от общего contact.name. Connected order acceptance не выполнялась.
- Passport/unnamed consignee —14 source controls без save contract; LEGACY_UNMAPPED. Bank4 controls — read-only source match, не обещание сохранения.

## Проверки

Targeted recovery03: mobile15/15, BFF14/14, TypeScript PASS; логи evidence/field-review03-*.log. PHP recovery08: FormFieldValidation47/47, ReviewEditMedia30/30, Payment83, общий430 assertions/38 lint PASS. Доказательство — [php-policy-recovery08.log](evidence/php-policy-recovery08.log); четыре SHA исходников/тестов FormsDriver/PublicationDriver сверены с текущими файлами. Предыдущий полный прогон recovery02:161 server/87 mobile/375 PHP assertions/37 lint PASS. Реальных source/provider отправок не выполнялось. [Предыдущая ревизия166-row отчёта](baseline/recovery02-fields/field-mapping-review.md) сохранена.


## Каждое поле

| Form / field | Review status | Source target |
|---|---|---|
| auth-login.login | SOURCE_MAPPING_REVIEWED | login |
| auth-email.email | SOURCE_MAPPING_REVIEWED | email |
| auth-email.password | SOURCE_MAPPING_REVIEWED | password |
| auth-register.email | SOURCE_MAPPING_REVIEWED | email |
| auth-register.password | SOURCE_MAPPING_REVIEWED | password |
| auth-register.password_repeat | SOURCE_MAPPING_REVIEWED | password_repeat |
| auth-phone.phone | SOURCE_MAPPING_REVIEWED | normalized source phone |
| auth-otp.phone | SOURCE_MAPPING_REVIEWED | pending phone |
| auth-otp.code | SOURCE_MAPPING_REVIEWED | pending source ConfirmationCodes / consolidated code[] |
| auth-register-phone.phone | SOURCE_MAPPING_REVIEWED | normalized source phone |
| auth-register-otp.phone | SOURCE_MAPPING_REVIEWED | pending phone |
| auth-register-otp.code | SOURCE_MAPPING_REVIEWED | pending source ConfirmationCodes / consolidated code[] |
| auth-recovery.email | SOURCE_MAPPING_REVIEWED | email |
| profile-passport.country | LEGACY_UNMAPPED | Нет mapped target |
| profile-passport.unmapped-0 | LEGACY_UNMAPPED | Нет mapped target |
| profile-passport.unmapped-1 | LEGACY_UNMAPPED | Нет mapped target |
| profile-passport.unmapped-2 | LEGACY_UNMAPPED | Нет mapped target |
| profile-passport.unmapped-3 | LEGACY_UNMAPPED | Нет mapped target |
| profile-passport.unmapped-4 | LEGACY_UNMAPPED | Нет mapped target |
| profile-passport.unmapped-5 | LEGACY_UNMAPPED | Нет mapped target |
| profile-passport.unmapped-6 | LEGACY_UNMAPPED | Нет mapped target |
| profile-passport.unmapped-7 | LEGACY_UNMAPPED | Нет mapped target |
| profile-passport.unmapped-no-patronymic | LEGACY_UNMAPPED | Нет mapped target |
| profile-passport.unmapped-passport-storage | LEGACY_UNMAPPED | Нет mapped target |
| organization-add.inn | SOURCE_MAPPING_REVIEWED | inn -> inn-company |
| organization-add.kpp | SOURCE_MAPPING_REVIEWED | kpp -> kpp-company |
| organization-add.store_region_id | SOURCE_MAPPING_REVIEWED | store_region_id |
| organization-add.name | READ_ONLY_SOURCE_MATCH | organizations-find response.data.name |
| organization-add.legal-addresss | READ_ONLY_SOURCE_MATCH | organizations-find response.data.legal_address |
| organization-add.fact-address | READ_ONLY_SOURCE_MATCH | organizations-find response.data.fact_address |
| organization-add.bik | READ_ONLY_SOURCE_MATCH | organizations-find response.data.bik |
| organization-add.payment-bill | READ_ONLY_SOURCE_MATCH | organizations-find response.data.payment_account |
| organization-add.bank-name | READ_ONLY_SOURCE_MATCH | organizations-find response.data.bank_name |
| organization-add.correspondent-bill | READ_ONLY_SOURCE_MATCH | organizations-find response.data.correspondent_account |
| organization-requisites.company_letter | SOURCE_MAPPING_REVIEWED | company_letter |
| organization-requisites.card_company | SOURCE_MAPPING_REVIEWED | card_company |
| organization-requisites.scan_card | SOURCE_MAPPING_REVIEWED | scan_card |
| organization-bank.bik | READ_ONLY_SOURCE_MATCH | BIK |
| organization-bank.payment-bill | READ_ONLY_SOURCE_MATCH | PAYMENT_SCORE_BANK |
| organization-bank.bank-name | READ_ONLY_SOURCE_MATCH | NAME_BANK |
| organization-bank.correspondent-bill | READ_ONLY_SOURCE_MATCH | CORRESPONDENT_SCORE_BANK |
| organization-verify.fio | SOURCE_MAPPING_REVIEWED | fio |
| organization-verify.phone | SOURCE_MAPPING_REVIEWED | phone |
| organization-edo.edo_id | SOURCE_MAPPING_REVIEWED | edo_id |
| organization-edo.edo_operator | SOURCE_MAPPING_REVIEWED | edo_operator |
| organization-consignee.unmapped-0 | LEGACY_UNMAPPED | Нет mapped target |
| organization-consignee.unmapped-1 | LEGACY_UNMAPPED | Нет mapped target |
| organization-consignee.unmapped-2 | LEGACY_UNMAPPED | Нет mapped target |
| organization-switch.organization | SOURCE_MAPPING_REVIEWED | buyer/select -> verified organization ID |
| document-request.DOC_TYPE | DYNAMIC_SCHEMA_REQUIRED | CForm SID DOC_TYPE -> actual form_<type>_<answerId> |
| document-request.PERIOD_FROM | DYNAMIC_SCHEMA_REQUIRED | CForm SID PERIOD_FROM -> actual form_<type>_<answerId> |
| document-request.PERIOD_TO | DYNAMIC_SCHEMA_REQUIRED | CForm SID PERIOD_TO -> actual form_<type>_<answerId> |
| document-request.COMMENT | DYNAMIC_SCHEMA_REQUIRED | CForm SID COMMENT -> actual form_<type>_<answerId> |
| checkout.ORDER_FIO | CHECKOUT_SEPARATE_SCOPE | contact.name |
| checkout.ORDER_EMAIL | CHECKOUT_SEPARATE_SCOPE | contact.email |
| checkout.ORDER_PHONE | CHECKOUT_SEPARATE_SCOPE | contact.phone |
| checkout.ORDER_COMPANY | CHECKOUT_SEPARATE_SCOPE | actor.organizationId / source organization |
| checkout.ORDER_INN | CHECKOUT_SEPARATE_SCOPE | actor.organizationId / source organization.INN |
| checkout.ORDER_KPP | CHECKOUT_SEPARATE_SCOPE | actor.organizationId / source organization.KPP |
| checkout.ORDER_CONTACT_PERSON | CHECKOUT_SEPARATE_SCOPE | contact.name |
| checkout.DELIVERY_ID | CHECKOUT_SEPARATE_SCOPE | delivery + pickupId -> quote.deliveryOptionId/deliveryId |
| checkout.ORDER_ADDRESS | CHECKOUT_SEPARATE_SCOPE | address / deliveryAddress |
| checkout.pod | CHECKOUT_SEPARATE_SCOPE | pod |
| checkout.etag | CHECKOUT_SEPARATE_SCOPE | etag |
| checkout.office | CHECKOUT_SEPARATE_SCOPE | office |
| checkout.comment | CHECKOUT_SEPARATE_SCOPE | comment |
| checkout.DELIVERY_PICKUP_ID | CHECKOUT_SEPARATE_SCOPE | pickupId |
| checkout.delivery-date | COMMENTED_SOURCE | Нет mapped target |
| checkout.time | COMMENTED_SOURCE | Нет mapped target |
| checkout.PAY_SYSTEM_ID | CHECKOUT_SEPARATE_SCOPE | payment -> sourcePaymentMethods.sourceId |
| checkout.promo_code | CHECKOUT_SEPARATE_SCOPE | couponCode / cart.coupon |
| callback.form_text_24 | DYNAMIC_SCHEMA_REQUIRED | form_text_24 |
| callback.form_text_25 | DYNAMIC_SCHEMA_REQUIRED | form_text_25 |
| buy-one-click.form_text_12 | DYNAMIC_SCHEMA_REQUIRED | form_text_12 |
| buy-one-click.form_text_13 | DYNAMIC_SCHEMA_REQUIRED | form_text_13 |
| buy-one-click.form_text_14 | DYNAMIC_SCHEMA_REQUIRED | form_text_14 |
| buy-one-click.form_text_16 | FIXED_CONSTRAINTS | form_text_16 |
| rent.form_text_20 | DYNAMIC_SCHEMA_REQUIRED | form_text_20 |
| rent.form_text_21 | DYNAMIC_SCHEMA_REQUIRED | form_text_21 |
| rent.form_text_23 | FIXED_CONSTRAINTS | form_text_23 |
| leasing.form_text_30 | DYNAMIC_SCHEMA_REQUIRED | form_text_30 |
| leasing.form_text_31 | DYNAMIC_SCHEMA_REQUIRED | form_text_31 |
| leasing.form_text_32 | DYNAMIC_SCHEMA_REQUIRED | form_text_32 |
| leasing.form_email_33 | DYNAMIC_SCHEMA_REQUIRED | form_email_33 |
| leasing.form_text_34 | DYNAMIC_SCHEMA_REQUIRED | form_text_34 |
| found-cheaper.form_text_6 | DYNAMIC_SCHEMA_REQUIRED | form_text_6 |
| found-cheaper.form_text_7 | DYNAMIC_SCHEMA_REQUIRED | form_text_7 |
| found-cheaper.form_text_8 | DYNAMIC_SCHEMA_REQUIRED | form_text_8 |
| found-cheaper.form_text_9 | DYNAMIC_SCHEMA_REQUIRED | form_text_9 |
| tour.form_text_17 | DYNAMIC_SCHEMA_REQUIRED | form_text_17 |
| tour.form_text_18 | DYNAMIC_SCHEMA_REQUIRED | form_text_18 |
| tour.form_text_19 | DYNAMIC_SCHEMA_REQUIRED | form_text_19 |
| business-advice.first-name | SOURCE_MAPPING_REVIEWED | first-name |
| business-advice.phone | SOURCE_MAPPING_REVIEWED | phone |
| business-advice.email | SOURCE_MAPPING_REVIEWED | email |
| business-advice.company-name | SOURCE_MAPPING_REVIEWED | company-name |
| business-advice.comment-text | SOURCE_MAPPING_REVIEWED | comment-text |
| supplier.first-name | SOURCE_MAPPING_REVIEWED | first-name |
| supplier.company-name | SOURCE_MAPPING_REVIEWED | company-name |
| supplier.email | SOURCE_MAPPING_REVIEWED | email |
| supplier.phone | SOURCE_MAPPING_REVIEWED | phone |
| supplier.product-category | SOURCE_MAPPING_REVIEWED | product-category |
| supplier.product-desc | SOURCE_MAPPING_REVIEWED | product-desc |
| supplier.comment | SOURCE_MAPPING_REVIEWED | comment |
| supplier.attachment | FIXED_CONSTRAINTS | attachment |
| partner.inn | SOURCE_MAPPING_REVIEWED | inn |
| partner.company-name | SOURCE_MAPPING_REVIEWED | company-name |
| partner.email | SOURCE_MAPPING_REVIEWED | email |
| partner.phone | SOURCE_MAPPING_REVIEWED | phone |
| partner.first-name | SOURCE_MAPPING_REVIEWED | first-name |
| partner.has-warehouse | SOURCE_MAPPING_REVIEWED | has-warehouse |
| partner.warehouse-address | SOURCE_MAPPING_REVIEWED | warehouse-address |
| partner.warehouse-phone | SOURCE_MAPPING_REVIEWED | warehouse-phone |
| partner.warehouse-schedule | SOURCE_MAPPING_REVIEWED | warehouse-schedule |
| review.rate | SOURCE_MAPPING_REVIEWED | rate |
| review.vote-quality | SOURCE_MAPPING_REVIEWED | votes[]=quality |
| review.vote-value | SOURCE_MAPPING_REVIEWED | votes[]=quality-value-balance |
| review.vote-delivery | SOURCE_MAPPING_REVIEWED | votes[]=fast-delivery |
| review.review-text | SOURCE_MAPPING_REVIEWED | review-text |
| review.media[] | FIXED_CONSTRAINTS | photos[] |
| order-review.rate | SOURCE_MAPPING_REVIEWED | rate |
| order-review.vote-quality | SOURCE_MAPPING_REVIEWED | votes[]=quality |
| order-review.vote-value | SOURCE_MAPPING_REVIEWED | votes[]=quality-value-balance |
| order-review.vote-delivery | SOURCE_MAPPING_REVIEWED | votes[]=fast-delivery |
| order-review.review-text | SOURCE_MAPPING_REVIEWED | review-text |
| order-review.media[] | SOURCE_MAPPING_REVIEWED | media[] |
| question.question-text | FIXED_CONSTRAINTS | question-text |
| review-reply.review-text | SOURCE_MAPPING_REVIEWED | review-text |
| question-reply.question-text | SOURCE_MAPPING_REVIEWED | question-text |
| review-edit.rate | SOURCE_MAPPING_REVIEWED | rate |
| review-edit.vote-quality | SOURCE_MAPPING_REVIEWED | votes[]=quality |
| review-edit.vote-value | SOURCE_MAPPING_REVIEWED | votes[]=quality-value-balance |
| review-edit.vote-delivery | SOURCE_MAPPING_REVIEWED | votes[]=fast-delivery |
| review-edit.review-text | SOURCE_MAPPING_REVIEWED | review-text |
| review-edit.media[] | PARTIAL_MEDIA_CONTROLS | Owned review HL UF_MEDIA: omitted from text-only patch; old IDs retained when new image files are appended |
| question-edit.question-text | FIXED_CONSTRAINTS | question-text |
| appeal.theme | SOURCE_MAPPING_REVIEWED | theme |
| appeal.comment | FIXED_CONSTRAINTS | comment |
| appeal-order.theme | SOURCE_MAPPING_REVIEWED | theme_id |
| appeal-order.tags[] | SOURCE_MAPPING_REVIEWED | tags (array of source TAGS_HELP XML_ID) |
| appeal-order.comment | FIXED_CONSTRAINTS | comment |
| appeal-order.photos[] | SOURCE_MAPPING_REVIEWED | photos[] |
| appeal-rating.rate | SOURCE_MAPPING_REVIEWED | rate |
| return.selected-products | SOURCE_MAPPING_REVIEWED | item-N-id + reason-N/comment/photos[] |
| subscription.email | SOURCE_MAPPING_REVIEWED | email |
| quote.first-name | SOURCE_MAPPING_REVIEWED | first-name |
| quote.phone | SOURCE_MAPPING_REVIEWED | phone |
| quote.email | SOURCE_MAPPING_REVIEWED | email |
| quote.company-name | SOURCE_MAPPING_REVIEWED | company-name |
| quote.comment-text | SOURCE_MAPPING_REVIEWED | comment-text |
| production-request.first-name | SOURCE_MAPPING_REVIEWED | first-name |
| production-request.phone | SOURCE_MAPPING_REVIEWED | phone |
| production-request.email | SOURCE_MAPPING_REVIEWED | email |
| production-request.company-name | SOURCE_MAPPING_REVIEWED | company-name |
| production-request.comment-text | SOURCE_MAPPING_REVIEWED | comment-text |
| contact.form_text_24 | DYNAMIC_SCHEMA_REQUIRED | form_text_24 |
| contact.form_text_25 | DYNAMIC_SCHEMA_REQUIRED | form_text_25 |
| franchise.inn | SOURCE_MAPPING_REVIEWED | inn |
| franchise.company-name | SOURCE_MAPPING_REVIEWED | company-name |
| franchise.email | SOURCE_MAPPING_REVIEWED | email |
| franchise.phone | SOURCE_MAPPING_REVIEWED | phone |
| franchise.first-name | SOURCE_MAPPING_REVIEWED | first-name |
| franchise.has-warehouse | SOURCE_MAPPING_REVIEWED | has-warehouse |
| franchise.warehouse-address | SOURCE_MAPPING_REVIEWED | warehouse-address |
| franchise.warehouse-phone | SOURCE_MAPPING_REVIEWED | warehouse-phone |
| franchise.warehouse-schedule | SOURCE_MAPPING_REVIEWED | warehouse-schedule |
