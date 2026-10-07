# Source code map

**Последнее уточнение пользователя: B2C и B2B равнозначно важны.** Consumer default не означает снижение B2B-приоритета. Личная покупка доступна без организации; закупка с файлом и корпоративные возможности заметны рядом, с самостоятельным сценарием.

Дата: 11.09.2026. MASTER4. Только чтение исходников и публичных страниц; PHP/Bitrix, формы, OTP, CRM и платежи не выполнялись. Реальные операции проверят программисты после подключения; staging и учётные записи не являются условием этой итерации. Статус BACKEND GAP означает неподключённый контракт, а не запрос доступа пользователю. Секретные значения не включены.

## Архитектура и уровень доказательств

1С-Битрикс PHP — доменная система. Vue3/Vuex frontend использует AJAX/HTML-компоненты. React Native/Expo — отдельный мобильный клиент; текущий Node/SQLite adapter не является существующим Bitrix backend. Versioned BFF должен вызывать проверенные application services, не PHP HTML-формы.

| Слой | Подтверждение | Ограничение |
| --- | --- | --- |
| PHP / Bitrix | site-source/local/class/Models; local/components; local/php_interface/events.php; order/index.php | Ядро и БД отсутствуют в архиве; не выполнялись |
| Frontend | frontend/package.json: vue ^3.3.4, vuex ^4.0.2, axios ^1.8.4, ky ^1.8.1, swiper ^11.2.7; SCSS/Gulp5/Webpack5 | package ranges не являются подтверждением установленной версии runtime; npm test — placeholder |
| Composer | local/composer.json: dompdf ^3.1, pecee/simple-router ^5.4, lcobucci/jwt ^5.3 | JWT dependency не доказывает безопасную native session |
| Mobile | mobile/package.json; mobile/app; mobile/src/api/site.ts | site form/workspace/публикации пока unavailable; отдельные local API не подмена |
| Bridge | integrations/bitrix/src/{Bridge,ReadOnlyBitrix,DocumentManifest}.php; server/integrations/bitrix-client.mjs | Ограниченное чтение; не готовая запись заказов/CRM |
| CMS pages | business/index.php и UF_BANNER_PAGE/UF_ADVANTAGES/UF_ACHIEVEMENTS/UF_PROJECTS/UF_REVIEWS/UF_FAQ | DB-owned selections нельзя восстановить только по компонентам |

## Доменные модели

Найдено **16** файлов моделей верхнего уровня; отдельно **5 EO** DataManager-файлов. Это число файлов моделей, не количество всех сущностей Bitrix.

| Model | Реальные обязанности | Source / методы |
| --- | --- | --- |
| Subscription | Bitrix subscription; настройки маркетинга не равно транзакционным уведомлениям. | site-source/local/class/Models/Subscription.php; __construct |
| BasketUsers | b_prom_basket_users: USER_ID+ORGANIZATION_ID+JSON_ITEMS; physical и отдельные baskets компаний; восстановление в Bitrix Sale Basket. | site-source/local/class/Models/BasketUsers.php; __construct, getAllBasketsForUser, getBasketForUser, getPhysicalBasketForUser, updateBasketForUser, loadBasketForUser, initPriceTypesBasket, clearAllBasketsCache |
| ConfirmationCodes | EO challenge/коды; expirePreviousCodes, retryAfter, window attempts, IP/session hash. | site-source/local/class/Models/ConfirmationCodes.php; __construct, createNewCode, sendNewCode, validateCode, validateHashChangeDataUser, expirePreviousCodes, getIssueRetryAfter, isVerificationLimited, getAttemptsInWindow, normalizeLogin, getIpHash, getSessionHash, logRateLimitEvent |
| Product | Bitrix catalog и старый catalog HL; карточка/цена/характеристики. | site-source/local/class/Models/Product.php; __construct, getProductInfo, getProductInfoOldCatalogFromHB |
| Order | Bitrix Sale + старые заказы HL; тип плательщика/организация, активные/завершённые, товары, отмена. | site-source/local/class/Models/Order.php; __construct, getPersonTypeOrderFilter, getUserOrganizationOrderIds, getOrganizationPropIds, getOrderOrganizationId, getAllOrdersByUserID, getAllActiveOrdersByUserID, getAllActivePaymentsOrdersByUserID, getAllFinishOrdersByUserID, getAllSuccessOrdersByUserID, getOrderByID, cancelOrderByUser, getCountOrdersByUserID, getCountActiveOrdersByUserID, getCountFinishOrdersByUserID, getCountProductsInOrdersByUserID, getOrderedProductsByUserID |
| ConfirmedCards | EO карты; legacy PAN path небезопасен для прямого переноса, нужен provider token. | site-source/local/class/Models/ConfirmedCards.php; __construct, getCards, getMainCardByUser, createNewCardToUserID, removeCardUserByCardID, changeCardMainUserByCardID |
| User | Bitrix CUser: физлицо, контакты, recovery, сеансы; удаление сейчас флаг, не полный lifecycle. | site-source/local/class/Models/User.php; __construct, createNewUser, getTypeUser, recoveryPassword, updateDataUser, deleteAccountByUser, getActiveSessions, terminateSession |
| Questions | HL HLBL_ID_QUESTIONS; вопросы/ответы, автор/организация. | site-source/local/class/Models/Questions.php; __construct, getCacheKeyWithOrg, getAllQuestions, getUserQuestionsById, clearCache |
| Comparison | HL HIGHLOAD_BLOCK_ID_COMPARISON; категории и товары сравнения. | site-source/local/class/Models/Comparison.php; __construct, getComparisons, getCategoryComparisons, addComparison, clearAllComparisons, removeCategoryComparison, getElementsByRootCategory, getAllSubsections, getRootSectionId, getElementsSections |
| WaitingList | HL HLBL_ID_CATALOG_WAITLIST; добавление/удаление/поступление. | site-source/local/class/Models/WaitingList.php; filterActiveOnly, getItems, toggleItem, countInStock |
| Reviews | HL HLBL_ID_REVIEWS, автор/организация/товар и кэш по контексту. | site-source/local/class/Models/Reviews.php; __construct, getCacheKeyWithOrg, getAllReviews, getUserReviewsById, clearCache |
| UserNotifications | EO история и очистка; категории/настройки пользователя; наличие класса не подтверждает APNs/FCM. | site-source/local/class/Models/UserNotifications.php; __construct, getUserNotifications, addUserNotification, deleteUserNotification, trimExcessNotifications, cleanupExpired, agent, clearUserNotificationsCache |
| AddressDeliveryUsers | EO таблица адресов; LOCATION resolver; организации/личный контекст; строки адреса требуют структурной миграции. | site-source/local/class/Models/AddressDeliveryUsers.php; __construct, extractCityCandidates, resolveLocationFromAddress, getDeliveries, getUserAddressByID, getMainAddressByUser, createNewAddressToUserID, changeAddressToUserIDByAddressID, removeAddressDeliveryUserByAddressID, changeAddressMainUserByLocationID |
| Coupon | Bitrix Sale discount coupon manager; правила скидки принадлежат backend. | site-source/local/class/Models/Coupon.php; createCouponBasket, deleteCouponBasket, getByCodeCouponBasket |
| Organization | Infoblock IBLOCK_ID_ORGANIZATIONS; membership USER_IDS, проверка полномочий; active ID в session. | site-source/local/class/Models/Organization.php; __construct, getActiveOrganizationID, getOrganizationsByUserID, checkUserInOrganization, getActiveOrganization, removeUserFromOrganization, isUserVerified, clearCache |
| Favorite | HL HIGHLOAD_BLOCK_ID_FAVORITE; active catalog filter; не локальная отдельная система. | site-source/local/class/Models/Favorite.php; filterActiveOnly, getFavorites, addFavorite |

## Подтверждённые модули и точки расширения

| Модуль | Исходник | Правило переиспользования |
| --- | --- | --- |
| B2C profile | personal/**/index.php; local/components/prom.personal/* | Раскрыть заказы/товары/избранное/ожидание/сравнение/возвраты/обращения/адреса/карты/уведомления |
| B2B context | Organization.php:19,99,164,290; BasketUsers.php:88,152,278,421 | actor+organization+serviceRegion в BFF; не доверять только session/переданному ID |
| Checkout | order/index.php; sale.order.ajax/main/{template.php,script.js}; events.php | PersonType, props, coupon, payment, delivery и events; не заменить одиночным Order::save |
| 1C documents | local/php_interface/lib/Documents1C.php; include/documents1c.php; organization/documents/index.php | IMPLEMENTED_BACKEND; некоторые меню исторически HIDDEN_UI; NEEDS_PRODUCT_DECISION по видимости/правам и файлам |
| Search | local/ajax/search/{headSearch,setHistory,removeHistory}.php; prom/search.often | Историю/популярность переносить через DTO, не HTML |
| Returns | local/ajax/lk/returns-products/{returns-product,action-returns-product}.php | Finished owned order + per-item reasons/comment/photos |
| Publications | prom/product.reviews*,product.questions*; prom/comments.view | Отзывы/вопросы и отдельные entity comments не одна сущность |
| Calculators | local/components/prom/scaffolding.calculator/lib | Реальные Tower/FrameScaffolding providers; UI-калькулятор не должен рассчитывать свою несовместимую комплектацию |
| Geo | Regions.php; local/ajax/order/resolve-location.php; Models/AddressDeliveryUsers.php | См. отдельный location audit root; settlement/serviceRegion/store/address разделить |

## Исходники, которые не считать активной функцией

`frontend/h/` — историческая вёрстка, не активный backend. `local/class/PHPExcel*/Examples/` — библиотечные примеры; `chek/` и import/sync scripts — не клиентские страницы. `/vendor/` публично существует, но `site-source/vendor/index.php` отсутствует: production content проверен отдельно по живой странице и сохранён в public-rich-content.json.

## P0 вывод

Сохранить существующую систему, построить DTO mapping и явный application context. Текущие `personal` / `organization-demo` в mobile/src/api/site.ts не выражают несколько реальных организаций. ProcurementRequest — отдельная новая заявка пользователя, а не alias поставщика. Экспорт runtime WebForm вопросов остаётся задачей подключения программистов; UI сейчас не должен придумывать обязательные поля.
