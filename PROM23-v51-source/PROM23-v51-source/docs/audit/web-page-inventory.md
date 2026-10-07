# Web page inventory

**Последнее уточнение пользователя: B2C и B2B равнозначно важны.** Consumer default не означает снижение B2B-приоритета. Личная покупка доступна без организации; закупка с файлом и корпоративные возможности заметны рядом, с самостоятельным сценарием.

Дата: 11.09.2026. MASTER4. Только чтение исходников и публичных страниц; PHP/Bitrix, формы, OTP, CRM и платежи не выполнялись. Реальные операции проверят программисты после подключения; staging и учётные записи не являются условием этой итерации. Статус BACKEND GAP означает неподключённый контракт, а не запрос доступа пользователю. Секретные значения не включены.

Перечень содержит **75 route families/aliases**: не количество всех товаров или статей. Число прямых index.php вне local/frontend/api/ajax: **57**, технические страницы помечены. Динамические сущности CMS и rewrite patterns считаются семействами, не размножаются на каждый ID.

| Web route | Source | Component / model | Status |
| --- | --- | --- | --- |
| / | site-source/index.php | bitrix:news.list, bitrix:news.list, bitrix:news.list, bitrix:news.list, bitrix:catalog.section.list, bitrix:catalog.section, bitrix:catalog.section, bitrix:catalog.section, bitrix:catalog.section, bitrix:news.list, bitrix:catalog.section | source-page |
| /about/ | site-source/about/index.php | bitrix:news.list, bitrix:news.list, bitrix:news.list, bitrix:news.list, bitrix:catalog.section.list, bitrix:news.list, bitrix:news.list, bitrix:news.list, bitrix:news.list | source-page |
| /awards/ | site-source/awards/index.php | bitrix:breadcrumb | source-page |
| /basket/ | site-source/basket/index.php | bitrix:sale.basket.basket, bitrix:catalog.section, bitrix:catalog.section | source-page |
| /blog/ | site-source/blog/index.php | bitrix:news | source-page |
| /blog/projects/ | runtime public + site-source/blog/index.php/urlrewrite.php | CMS dynamic | dynamic/public |
| /blog/projects/{code}/ | runtime public + site-source/blog/index.php/urlrewrite.php | CMS dynamic | dynamic/public |
| /blog/video/ | runtime public + site-source/blog/index.php/urlrewrite.php | CMS dynamic | dynamic/public |
| /blog/{code}/ | runtime public + site-source/blog/index.php/urlrewrite.php | CMS dynamic | dynamic/public |
| /brands/ | site-source/brands/index.php | bitrix:news.list, bitrix:news.list, prom:brands.list, bitrix:catalog.section | source-page |
| /business/ | site-source/business/index.php | bitrix:news.list, bitrix:news.list, bitrix:news.list, bitrix:news.list, bitrix:news.list, bitrix:news.list, bitrix:news.list | source-page |
| /cart/ | site-source/urlrewrite.php → basket/index.php | rewrite alias | alias |
| /catalog-vyshki/ | site-source/catalog-vyshki/index.php | bitrix:catalog | source-page |
| /catalog/ | site-source/catalog/index.php | bitrix:catalog | source-page |
| /catalog/{section}/{product}/ | site-source/catalog/index.php/urlrewrite.php | CMS dynamic | dynamic/public |
| /checkout/ | site-source/urlrewrite.php → delivery/index.php | rewrite alias | alias |
| /chek/ | site-source/chek/index.php | bitrix:sale.order.ajax, bitrix:sale.order.ajax | technical |
| /comparison/ | site-source/comparison/index.php | prom:comparison, bitrix:form.result.new, bitrix:catalog.section | source-page |
| /contacts/ | site-source/contacts/index.php | bitrix:news.list | source-page |
| /cookie-policy/ | site-source/cookie-policy/index.php | PHP / include / CMS | source-page |
| /delivery/ | site-source/delivery/index.php | bitrix:breadcrumb, bitrix:news.list | source-page |
| /details/ | site-source/urlrewrite.php → delivery/index.php | rewrite alias | alias |
| /favorite/ | site-source/favorite/index.php | bitrix:catalog.section | source-page |
| /franchise/ | site-source/franchise/index.php | bitrix:news.list, bitrix:news.list, bitrix:news.list, bitrix:news.list, bitrix:news.list, bitrix:news.list, bitrix:news.list | source-page |
| /oferta/ | site-source/urlrewrite.php → delivery/index.php | rewrite alias | alias |
| /order/ | site-source/order/index.php | bitrix:sale.order.ajax | source-page |
| /order/good/ | site-source/order/good/index.php | PHP / include / CMS | source-page |
| /organization/ | site-source/organization/index.php | PHP / include / CMS | source-page |
| /organization/address-delivery/ | site-source/organization/address-delivery/index.php | bitrix:menu, prom.organization:organization_address_deliveries | source-page |
| /organization/appeals/ | site-source/organization/appeals/index.php | bitrix:menu, prom.organization:organization_appeals_main | source-page |
| /organization/appeals/list/ | site-source/organization/appeals/list/index.php | bitrix:menu, prom.organization:organization_appeals_main | source-page |
| /organization/appeals/list/{id}/ | site-source/organization/appeals/list/detail.php | bitrix:menu, prom.organization:organization_appeals_detail | dynamic-detail |
| /organization/dashboard/ | site-source/organization/dashboard/index.php | bitrix:menu, prom.organization:organization_dashboard_orders, prom.personal:personal_dashboard_favorite, prom.personal:personal_dashboard_waitlist, prom.organization:organization_dashboard_documents, prom.organization:organization_dashboard_orders_finish, prom.organization:organization_dashboard_viewed_catalog | source-page |
| /organization/documents/ | site-source/organization/documents/index.php | bitrix:menu, prom.organization:organization_documents, bitrix:form.result.new | source-page |
| /organization/info/ | site-source/organization/info/index.php | bitrix:menu, prom.organization:organization_info_data, prom.organization:organization_info_organization_add, prom.organization:organization_info_faq | source-page |
| /organization/notifications/ | site-source/organization/notifications/index.php | bitrix:menu, prom.organization:organization_notifications | source-page |
| /organization/orders/active/ | site-source/organization/orders/active/index.php | bitrix:menu, prom.organization:organization_orders_active | source-page |
| /organization/orders/completed/ | site-source/organization/orders/completed/index.php | bitrix:menu, prom.organization:organization_orders_finish | source-page |
| /organization/orders/goods/ | site-source/organization/orders/goods/index.php | bitrix:menu, prom.organization:organization_orders_goods | source-page |
| /organization/orders/{id}/ | site-source/organization/orders/detail.php | bitrix:menu, prom.organization:organization_order_detail | dynamic-detail |
| /organization/payment-methods/ | site-source/organization/payment-methods/index.php | bitrix:menu, prom.organization:organization_payment_methods | source-page |
| /organization/questions-and-reviews/ | site-source/organization/questions-and-reviews/index.php | bitrix:menu, prom.personal:personal_questions, prom.personal:personal_reviews | source-page |
| /organization/returns/applications/ | site-source/organization/returns/applications/index.php | bitrix:menu, prom.organization:organization_returns_list | source-page |
| /organization/returns/applications/{id}/ | site-source/organization/returns/applications/detail.php | bitrix:menu, prom.organization:organization_returns_applications_detail | dynamic-detail |
| /organization/returns/orders/ | site-source/organization/returns/orders/index.php | bitrix:menu, prom.organization:organization_returns_orders_list, prom.organization:organization_returns_orders_faq | source-page |
| /payment/ | site-source/urlrewrite.php → delivery/index.php | rewrite alias | alias |
| /personal/ | site-source/personal/index.php | PHP / include / CMS | source-page |
| /personal/address-delivery/ | site-source/personal/address-delivery/index.php | bitrix:menu, prom.personal:personal_address_deliveries | source-page |
| /personal/appeals/ | site-source/personal/appeals/index.php | bitrix:menu, prom.personal:personal_appeals_main | source-page |
| /personal/appeals/list/ | site-source/personal/appeals/list/index.php | bitrix:menu, prom.personal:personal_appeals_main | source-page |
| /personal/appeals/list/{id}/ | site-source/personal/appeals/list/detail.php | bitrix:menu, prom.personal:personal_appeals_detail | dynamic-detail |
| /personal/dashboard/ | site-source/personal/dashboard/index.php | bitrix:menu, prom.personal:personal_dashboard_orders, prom.personal:personal_dashboard_favorite, prom.personal:personal_dashboard_waitlist, prom.personal:personal_dashboard_orders_finish, prom.personal:personal_dashboard_viewed_catalog | source-page |
| /personal/info/ | site-source/personal/info/index.php | bitrix:menu, bitrix:main.profile | source-page |
| /personal/info/edit/ | site-source/personal/info/edit/index.php | prom.personal:personal_info_edit_data, prom.personal:personal_info_edit_sessions | source-page |
| /personal/notifications/ | site-source/personal/notifications/index.php | bitrix:menu, prom.personal:personal_notifications | source-page |
| /personal/order/payment/ | site-source/personal/order/payment/index.php | bitrix:sale.order.payment | source-page |
| /personal/orders/active/ | site-source/personal/orders/active/index.php | bitrix:menu, prom.personal:personal_orders_active | source-page |
| /personal/orders/completed/ | site-source/personal/orders/completed/index.php | bitrix:menu, prom.personal:personal_orders_finish | source-page |
| /personal/orders/goods/ | site-source/personal/orders/goods/index.php | bitrix:menu, prom.personal:personal_orders_goods | source-page |
| /personal/orders/{id}/ | site-source/personal/orders/detail.php | bitrix:menu, prom.personal:personal_order_detail | dynamic-detail |
| /personal/organizations/ | site-source/personal/organizations/index.php | bitrix:menu, prom.personal:personal_my_organizations_list, prom.personal:personal_my_organizations_add, prom.personal:personal_my_organizations_faq | source-page |
| /personal/payment-methods/ | site-source/personal/payment-methods/index.php | bitrix:menu, prom.personal:personal_payment_methods | source-page |
| /personal/questions-and-reviews/ | site-source/personal/questions-and-reviews/index.php | bitrix:menu, prom.personal:personal_questions, prom.personal:personal_reviews | source-page |
| /personal/returns/applications/ | site-source/personal/returns/applications/index.php | bitrix:menu, prom.personal:personal_returns_list | source-page |
| /personal/returns/applications/{id}/ | site-source/personal/returns/applications/detail.php | bitrix:menu, prom.personal:personal_returns_applications_detail | dynamic-detail |
| /personal/returns/orders/ | site-source/personal/returns/orders/index.php | bitrix:menu, prom.personal:personal_returns_orders_list, prom.personal:personal_returns_orders_faq | source-page |
| /privacy-policy/ | site-source/privacy-policy/index.php | PHP / include / CMS | source-page |
| /recom-tech-info/ | site-source/recom-tech-info/index.php | PHP / include / CMS | source-page |
| /return/ | site-source/urlrewrite.php → delivery/index.php | rewrite alias | alias |
| /search/ | site-source/search/index.php | arturgolubev:search.page, prom:catalog.smart.filter, bitrix:catalog.section, bitrix:catalog.section | source-page |
| /search/map/ | site-source/search/map/index.php | bitrix:main.map | technical |
| /suppliers/ | site-source/suppliers/index.php | bitrix:news.list, bitrix:news.list, bitrix:news.list, bitrix:news.list | source-page |
| /user-agreement/ | site-source/user-agreement/index.php | bitrix:breadcrumb | source-page |
| /vendor/ | runtime public; source file absent | CMS dynamic | dynamic/public |
| /waiting-list/ | site-source/waiting-list/index.php | bitrix:catalog.section | source-page |

## Orphan / hidden / active distinctions

- `/vendor/` доступен публично, файла страницы в архиве нет. Нельзя заменять его frontend/h/production.php как будто это runtime.
- `/organization/documents/` имеет реальную страницу, class.php и Documents1C. Видимость в конкретном меню и загрузка PDF — разные проверки.
- urlrewrite.php также содержит Bitrix/desktop служебные `/rest/`, `/local/rest/`, `/online/`, `/video*`, `/mobileapp/jn/`, `/bitrix/services/ymarket/`, `/stssync/calendar/`, `/store/`, `/news/`; часть target-файлов отсутствует. Это не автоматически потерянные retail-экраны.
- `catalog-vyshki/` — существующая специализированная ветка каталога, нужна проверка mapping, не новая mobile taxonomy.
- Query actions deleteAccount/delete_org/cancel/order-repeat не открывались: наличие GET не означает read-only.
