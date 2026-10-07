# MASTER5 — функции: источник, интерфейс и работающий контракт

Проверено 11.09.2026. Фаза source audit перед подготовкой DTO. Исходный PHP не исполнялся, source credentials не использовались, внешние записи не выполнялись. Публичные GET используются только для подтверждения товарного содержимого. Это не приёмка боевого приложения.

## Приоритетный вывод по PDP до изменений

| Функция | Доказательство источника | Состояние до MASTER5 | Решение |
|---|---|---|---|
| Галерея | `site-source/local/templates/main/components/bitrix/catalog.element/old/template.php:203–261`: основное DETAIL_PICTURE и DOP_PHOTO_MASS, ResponsiveImage, fullscreen | одна фотография в mobile PDP | BUILD нормализованный публичный снимок каждого товара и native gallery, без повторения одного изображения как разных фото |
| Описание | тот же template.php:453–455 CURRENT_OFFER.DETAIL_TEXT; result_modifier.php:207 simple product fallback | отсутствует полный текст | BUILD plain-text paragraphs из конкретной карточки, HTML не исполнять |
| Преимущества/комплектация | template.php:493–513: PREIMUSHCHESTVA / KOMPLEKTATSIYA | краткие характеристики не заменяют эти поля | KEEP source content; отдельные массивы DTO |
| Аренда | template.php:704–714: ARENDA.VALUE === «Да» | универсальная кнопка | REFACTOR product-specific flag, unknown=false |
| Лизинг | template.php:46–60,678–689: цена в RUB ≥100000 | универсальная кнопка | REFACTOR доказанное отображение формы, без обещания одобрения |
| Один клик | component_epilog.php:187–229: положительные остаток и цена, отдельное поведение калькулятора | форма есть, submit gated | SOURCE CONTRACT + RUNTIME BLOCKED; снимок видимости не live eligibility |
| «Нашли дешевле» | template.php:569–575 закомментирован; frontend alternate vyshki/template.php:525 активен | универсальная кнопка | LEGACY/alternate-template, не включать неизвестному товару |
| Документы товара | template.php:503–505 содержит общее обещание после покупки; не перечень файлов | нет конкретного manifest | Metadata requiresOrder допустима только как правило, без выдуманных PDF/сертификатов; actual manifest после проверки покупки |
| Видео/360 | текущий gallery template содержит img, не video/360 | отсутствует | UNKNOWN; не добавлять фиктивный ролик/360 |

## Остатки и склады: обязательное разделение

`site-source/local/php_interface/lib/Helpers.php:256–289` getStoreQuantity запрашивает StoreProductTable по PRODUCT_ID, STORE_ID и AMOUNT>0, cache TTL3600. Он не возвращает полную матрицу складов, резерв или гарантированную доступность к продаже. `catalog.element/old/component_epilog.php:21–25` использует store_id из Regions; :335–347 выводит «много» при >20 вместо точного количества. Пустой результат этого getter нельзя переносить как подтверждённый нулевой остаток. В новом DTO unknown=null, не 0; отсутствие mapping/неполная выборка не дают totalQuantity.

`Regions.php:468–481` подменяет выбранный город DEFAULT_CITY для B2 C при обычном домене; это source bug, не правило приложения. RegionData :495 получает PRICE_CODE/STORE/DELIVERY/PAYMENT, :641 читает StoreTable ID/TITLE/ADDRESS/PHONE. Settlement ГАР, коммерческий регион, склад и DeliveryAddress остаются разными сущностями. Полный официальный ГАР сохранён; он не содержит коммерческих mappings или остатков.

## Доставка и оплата

`Delivery/ProductDeliveryCalculator.php:97–126` использует product ID/вес/габариты, склад из RegionData, city/coordinates назначения и quantity. :74–83 реально включает YandexDelivery, CdekCourier, Pickup. Наличие класса DellinCourierProvider не доказывает его регистрацию. :58–60 удаляет весь список, когда нет внешнего перевозчика; такой пустой список не доказывает отсутствие самовывоза. :129–142 подставляет нулевые габариты при отсутствии данных; новый контракт не должен интерпретировать их как действительные размеры. PickupProvider содержит presentation period из региона, не подтверждённый слот. Реальные расчёты не выполнялись.

Pay widget visibility (template.php:35–44) определяется положительной ценой/калькулятором. Это не доказательство доступного пользователю Сплита или баллов Плюса. Не переносить расчёт на четыре платежа или произвольные бонусы. Условия provider offer остаются gated до request-bound ответа реальной интеграции.

## Полный функциональный реестр

Полный инвентарь зарегистрированных функциональных семейств приведён ниже. Наличие экрана/кнопки не называется runtime parity.

## Итоговый инвентарь функций MASTER5

Обозначения: **UI** — экран/поля существуют; **LOCAL** — действующая локальная операция без синхронизации сайта; **SOURCE CONTRACT** — подтверждены handler/модель/правила; **RUNTIME BLOCKED** — реальная операция отключена до подключения программистами; **LEGACY** — источник содержит отключённую/незавершённую функцию. Ни один из этих статусов не является утверждением «100% функциональности сайта».

В таблице source paths начинаются с `site-source/`; `siteForms.ts` означает `mobile/src/forms/siteForms.ts`. Детальная карта полей, файлов, required и согласий всех 68 definitions остаётся в [forms-parity.md](forms-parity.md) и forms-source-evidence.json. 68 definitions включают 4aliases; 102form occurrences не равны 102 уникальным бизнес-сценариям.

| Функция / MASTER5-проверка | Подтверждённый источник / ограничения | Текущий результат и оставшаяся граница |
|---|---|---|
| Каталог/поиск/категории/фильтры | public catalog snapshot, data/catalog.json и catalog-tree.json; source catalog/main | LOCAL SNAPSHOT,28 SKU/226 разделов; не весь live ассортимент. Pagination BFF уже есть, фактическое потребление UI проверяет root |
| Галерея/описание/свойства | catalog.element/old/template.php:203–261,430–455,493–513 | DATA READY:28 DTO/144image references; native gallery/zoom — root integration/QA, не признаны пройденными этим аудитом |
| Видео/360 | Проверенный основной gallery template image-only; публичные 28 PDP не дали product video/360 | UNKNOWN/не подтверждено. Не строить искусственную 360 из повторённых фотографий |
| Наличие по складам | Helpers.php:256–289; old/component_epilog.php:21–25 | CALLABLE ADAPTER + RUNTIME BLOCKED. Нет реального mapping/StoreProductTable. total/nearest/pickup неизвестны, а не 0/ближайшийофис |
| Цена/скидка/тип покупателя | lib/Basket.php:188–365 CatalogProvider; BasketUsers.php:421–536 price refresh | SOURCE CONTRACT + RUNTIME BLOCKED. Snapshot price/oldprice — presentation, не текущий счёт. Обновление города инвалидирует коммерческий контекст |
| Корзина / количество | local/ajax/basket/basket-handler.php; lib/Basket.php:12–84 | LOCAL draft с проверкой IDs/версииконтекста. Реальное сохранение Fuser/организации и checkout price verification не подключены |
| Избранное | local/ajax/favorite/addToFavorite.php:4–21 вызывает Favorite::addFavorite с текущим USER | LOCAL; live actor/org sync BLOCKED. Legacy $_REQUEST без явного POST/sessid guard не переносить как mobile auth |
| Сравнение 2–6 | local/ajax/comparison/addToComparison.php:4–21; Models/Comparison.php | LOCAL max6 по master, source sync BLOCKED. Локальный список не доказательство владения компанией |
| Лист ожидания | Models/WaitingList.php:36–69,78–150 USER+activeOrganization; action-add-to-waitlist.php | UI command + RUNTIME BLOCKED. Нельзя заменить уведомление о конкретном SKU маркетинговым consent. Source public log не переносить |
| Один клик | old/component_epilog.php:187–229; action-buy-one-click.php:37–100 CForm, sessid, POST, quantity1..99 | SOURCE CONTRACT;28 видимых form entrypoints; actualsubmit BLOCKED. Не считать запрос созданным/оплаченным заказом |
| Найти дешевле | old/template.php:569–575 comment; alternate vyshki:525; action-found-it-cheaper.php | LEGACY/alternate context.0 активных entrypoints в 28 PDP; форма в реестре остаётся контрактом, не универсальной услугой |
| Аренда | old/template.php:704–714; action-request-a-rent.php:19 PROPERTY_ARENDA_VALUE=Да | SOURCE CONTRACT;3 подтверждённых SKU. Handler ещё раз проверяет товар; UIflag не заменяет сервернуюпроверку |
| Лизинг | old/template.php:46–60,678–689; action-request-a-call.php:49–61 whitelistWEB_FORM_ID | SOURCE CONTRACT;3 видимых SKU. Поля ИНН/организация/телефон/email/стоимость; не одобрение финансирования. Runtime BLOCKED |
| Звонок | request-a-call / action-request-a-call.php:49–75; siteForms:174 | UI/SOURCE CONTRACT,28product callbacks. Не называть callback коммерческим предложением. Runtime BLOCKED |
| КП / консультация | get-business-advice-form-action.php; siteForms:180 | UI/SOURCE CONTRACT + BLOCKED. Product-specific canRequestQuote в 28 PDP=false, business/закупка — самостоятельный путь |
| Отзыв / вопрос / фото | Models/Reviews.php:45–162, Questions.php:45–161; siteForms:184–191 sourceActions | UI forms и typedpublicationadapter есть; actual lists/CRUD/media permissions BLOCKED. Пустой неподключённый adapter не доказывает ноль отзывов на сайте |
| Ответ/редактирование/удаление отзыва | Models/Reviews.php:172–222 USER+ORG; siteForms:188–193 | SOURCE CONTRACT + BLOCKED; target/product/parent IDs и авторство от сервера. Различать product review и order-review |
| Комментарии статей | news/blog/detail.php:85 include comments отключён; docs/audit/article-comments.md | SOURCE-DISABLED/LEGACY. Не P0 пропуск действующей функции; новый ArticleComments UI не добавляется |
| Вход/регистрация/OTP/recovery | include/forms/auth-reg/action-*.php; siteForms:101–119 | UI/SOURCE CONTRACT + BLOCKED. Локальная sandbox session не website login; challenge/TTL/rate limits/actor разрешения после интеграции |
| Профиль/контакты/сессии | Models/User.php:73–175,223–300; siteForms:120–144 | UI/SOURCE CONTRACT + BLOCKED; delivery settlement отдельно от PERSONAL_CITY, logoutlocal не завершение всехреальныхсессий |
| Удаление аккаунта | Models/User.php:203–212 UF_DELETE_ACCOUNT_BY_USER | UI/SOURCE CONTRACT + BLOCKED. Source softflag не гарантирует физическое удаление всехзаконнохранимыхданных; exported bridge проверяет revocation |
| B2 C/B2 B/мои организации | Models/Organization.php; siteForms:134–142; docs/b2b.md | UI equal-priority paths; actual membership/authority BLOCKED. Legacy organization-demo не выдаётся за компанию пользователя |
| Реквизиты/банки/ЭДО | siteForms:134–140; organizations-find/add/action-organizations-details/action-organization-edo | SOURCE CONTRACT + BLOCKED. Bankreadonly; изменения через companyfiles. EDOoperator enum изБД, не выдуманныйсписок |
| Сотрудники/грузополучатель | siteForms:138,140 подтверждениеполномочий; unnamed controls consignee | LEGACY/PARTIAL. Source не доказывает invitation/role-management API; не обещать созданныероли |
| Документы 1 С | lib/Documents1 C.php:397–462 ownerorders;478–504 HLmanifest/fileexistence | SOURCE CONTRACT + read-onlybridge, RUNTIME BLOCKED без core/DB. Invoice/УПД не productpassport. Ни одного публичного productPDF не найдено |
| Запрос документа | request-document-action.php; siteForms:145 CForm SIDs | UI + BLOCKED: numericquestionIDs/required/enums отсутствуют вБДархиве. Не отправлять inventedfields |
| Адреса | Models/AddressDeliveryUsers.php; siteForms:128–133 | SOURCE CONTRACT + BLOCKED. Владелец+activeorg; fulladdress != FIASsettlement, подъезд/этаж/офис/комментарий checkout сохраняются отдельно |
| Оформление заказа | sale.order.ajax/main/template.php/script.js; events.php:221–371 | UI + BLOCKED. Actual Sale::save одинраз → существующий OnSaleOrderSaved→CRM; не второй прямой lead. Доступные delivery/payment/tax/orderprops от backend |
| Оплата/карты | siteForms:146–172; payment-methods/add-card-action.php legacy | PROVIDER GATE. Не переносить PAN/CVV поля и stub bank/type. Pay/Split/Plusunknown до merchantoffer; callback не PAID |
| Повтор заказа | lk/orders/order-repeat.php:14,38–84 ownercheck, clearsnon-delayedbasket, addswithpricecode | UI/SOURCE CONTRACT + BLOCKED. Это заменаактивнойкорзины, нужна freshprice/stock/contextrevalidation; старыйтипцены не currenteligibility |
| Отмена | personal_order_detail / organization_order_detail templates, siteForms:170 | SOURCE CONTRACT + BLOCKED. Cancellableownedorder; не выдавать localtest-cancel за refund |
| Возврат | returns-product.php:27–45 completedownedorder+chosenproducts+REASONSenum | UI/SOURCE CONTRACT + BLOCKED. test-created не eligible; повторяющиесяполя по eachitem, файлы/причины fromsource; moneyrefund отдельно |
| Обращения/оценка | siteForms:194–196; appeals-text-action/appeals-order-form-action | UI/SOURCE CONTRACT + BLOCKED. Тема/теги canonicalDB; source character limit и byteslimit расходятся, адаптер должен согласовать |
| Уведомления/подписки | lk/notifications/notifications.php:23–35; siteForms:198–200 | UI + BLOCKED runtimepreferences;4sourceemail/SMSflags независимы. Nativepush — отдельные 2 настройки, APNs/FCM не подключены; никакой realcampaign |
| Просмотренное/историяпоиска | domain/store/localactions, scopedversionedstate | LOCAL; синхронизациясаккаунтом/сайтом не заявлена |
| География/Динская/сёла/посёлки/хутора | fullGAR160478actualrecords/96regions; location-system.md/location-tests.md | LOCAL runtime search/detail/CASselection PASS. Geography != ServiceRegion/Warehouse; commercialmapping/revalidation503 честно BLOCKED |
| Поставщик/партнёр/франшиза | suppliers/index.php, franchise/index.php, suppliers-form-action/partners-form-action; siteForms:181–182 | UI/SOURCE CONTRACT + BLOCKED; filevalidation/CRMreceipt ещё не integrationtested |
| Экскурсия/производство | book-a-tour-action.php; public/vendor snapshot; siteForms:179–180 | UI/SOURCE CONTRACT + BLOCKED. Dates fromactualschedule, не fixedenum; corporatepubliccontent не ordercapability |
| Закупка/файлспецификации | mobile/src/procurement.ts и api/procurement.ts | NEW user-approved domain/UI, не переименованный supplier. Validation работает, upload/CRMreference BLOCKED; deviceURI не uploadedattachment |
| Сервернаяглавная / CMS | server/public-v1.mjs + server/content/home.json; mobile/api/home.ts | LOCAL configuredorderedslots. Тип/позиция/enabled проверяются; не remoteJSX. Richslotproduct/media payload возможен из DTO, реальные campaign/audience данные не придуманы |

## Что реализовано после этого аудита

- `scripts/import-product-details.py` — явный read-only GET export28 PDP. Проверяет точный data-product-id, allowlisted HTTPS/catalog/upload, без credentials/querytokens, не исполняет HTML/PHP. Извлекает существующие photo variants, plain paragraphs, advantages/kit и действительно renderedformbuttons. Закомментированный HTML не считается активным feature.
- `data/product-details.json` / `mobile/src/content/productDetails.ts` — проверяемые product DTO с sourceURL/pageSHA256/time и checksum/localfile каждойфотографии. Mobile720variants изреального srcset; originalUrl сохраняет 1280origin для traceability. Нет video/360/выдуманных docs/ratings.
- `server/integrations/product-detail.mjs` — вызываемый BFFprojection/service. `getPublicDetail`, `getAvailability`, `readiness`; нет network/write. Server-owned `resolveCommerceContext` и `readInventory` могут быть подключеныпрограммистами; отсутствующие зависимости явно unknown. Не зарегистрирован как liveBitrixendpoint, не утверждаем externalconnection.
- 7 Nodeadaptertests: media/privatefiles/capabilityprovenance, immutablecopies, missingmapping, clientwarehouseinjection, explicitpositive/zero/partialstock, stale/context/productmismatch, invalid/foreign/duplicatedrows, providererrorredaction.4 Pythonextractortests: identity, disabledHTML, paragraph/scriptseparation, validresponsivevariant/origin restrictions.

**Не принято:** realstock/reserve/leaseapproval/tariffs/orders/payment/refund/CRMmail/1 C exchange; all68realformsuccesscases; реальные iOS/Androidbinary, store/legalreview, FPS/100kload. Пользователь отложил реальные подключения программистам — это явные RUNTIME BLOCKED, а не «пропущено 0». NativeUI и каждый masternavigation/visualcriterion принимаются root QA отдельно, не по этому серверномуаудиту.


## Проверка пунктов master по номерам

[backend-master5-clauses.json](backend-master5-clauses.json) содержит отдельные результаты и evidence для каждого пункта в пределах backend/source-data: аудит/формы №1,147–151,154–155; PDP №35,38–45,50–56,159,176; geo №61–73,183–185,224,235,246; CMS/BFF №193–195; безопасность №189–190,214. Для зависимых end-to-end критериев записан RUNTIME BLOCKED либо ROOT_QA_REQUIRED, не PASS.

Расширение после первоначального инвентаря: публичный content service и optional mobile loader уже реализованы,17страниц экспортированы,8тестов прошли. Формы, согласия и permissions не управляются публичным CMSpayload. Подробный cache/GET/schema контракт: [public-content.md](../api/public-content.md). Реальное подключение CMS и native UI проверяются отдельно; HTTP уже зарегистрирован root и проверен6тестами; существование DTO не заменяет эту приёмку.


HTTP-дополнение: root подключил content/details/availability маршруты.6изолированных HTTP-тестов прошли: DTO иpublic noindex; ETag304 иCORS;404/405/unsupportedquery; обязательнаясессия/официальноеlocation; изоляциядвухсессий иserver-derivedbuyerContext; повреждённыенеобязательныеснимки не ломаютcatalog/session. Ответналичиясвязан с productId/settlementId/locationVersion/buyerContext, ноactualstock остаётсяunknown. См. master5-http-tests.log. Это усиливает статусы №193–195 доHTTP_ADAPTER_TESTED_UI_QA_REQUIRED, а неliveCMS/BitrixPASS.


Финальные проверки backend на этой итерации: **82/82 server tests PASS**, в том числе6новых HTTP;4Python source extractor tests PASS;4mobilecontent tests PASS; полныйTypeScript PASS. Подтверждения: `docs/testing/server-master5-final.log`, `master5-http-tests.log`, `product-snapshot-tests-master5.log`, `public-content-client-master5.log`, `product-detail-typecheck-master5.log`. OpenAPI10paths с разрешёнными внутреннимиrefs. Практическая передача: [integrations/README.md](../../integrations/README.md).

Публикации: фильтры/медиа root UI и purehelper подготовлены; source `r-with-photo` читает UF_MEDIA, сортировки high/low-rating вторичноупорядочены UF_DATE; publicread требует UF_TARGET_ID/UF_ACTIVE/UF_SKIP_RATE. Retrieval/upload/moderation иpermissionactions остаютсяBLOCKED. `loadProductPublications` не возвращает фиктивные отзывы. Содержательная граница описана в API.
