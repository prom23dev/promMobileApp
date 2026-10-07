# Заполненный чек-лист config-значений (по данным prom23marketplace, 2026-09-21)

Источник: D:\PHPSTORM\projects\prom23marketplace (боевой сайт prom23.ru / стейджинг prom-stage,
он же prom.myfast.space — см. [[prom-myfast-space-is-prom-stage]]).

Секреты НЕ вписаны значениями (правило самого чек-листа: "нельзя передавать текстом/чатом") —
указаны только путь к файлу и имя переменной. Их нужно скопировать напрямую в приватный
конфиг на сервере интеграции (0600), не через чат.

---

## 1. Доступ и окружение

| Ключ | Значение / статус |
|---|---|
| `siteRoot` | НЕ ЗАПОЛНЯЕТСЯ отсюда — должен указывать на ИЗОЛИРОВАННЫЙ инстанс Bitrix, не на прод prom23marketplace |
| `stateDirectory`, `keyFile` | НЕ НАЙДЕНО — создаётся заново на сервере интеграции (новый HMAC-ключ, не из архива) |
| `sourceOrigin`, `sourceAllowedOrigins` | Боевой домен: `https://prom23.ru`; стейджинг: `https://prom.myfast.space` (домен зависит от того, какой инстанс клонируется под `siteRoot`) |
| `enabledOperations`, `enabledForms` | Решение владельца — пусто по умолчанию, не выводится из кода |

## 2. Гео/коммерческий контекст

| Ключ | Значение | Источник |
|---|---|---|
| `commerce.catalogIblockIds` | Основной каталог: **4** (товары), **5** (лесные тачки); новый каталог: **32** (YTP), **33** (основной); вышки: **34** (товары) / **35** (торговые предложения, SKU) | `local/php_interface/include/defines.php:13-14,39-40,139-140` |
| `commerce.productIdMap` | Не требуется — ID prom и ID Bitrix совпадают (нет отдельного маппинга в коде) | — |
| `commerce.regionBySettlement[GAR UUID]` | **Готового GAR→Sale маппинга в коде НЕТ.** Регион/город хранятся в HLBLOCK `HLBL_ID_REGIONS=7` и `HLBL_ID_CITIES=8`, привязка к ценам/доставке/оплате — через инфоблок `IBLOCK_ID_REGIONS=22`, свойства элемента: `PRICE_CODE`, `DELIVERY_SERVICE_TK`, `DELIVERY_SERVICE_PICKUP`, `DELIVERY_SERVICE_PICKUP_TK`, `PAYMENT_SYSTEM`, `STORE`. Города определяются динамически через Yandex Geocoder, а не хардкодом. **Нужно вручную выгрузить список элементов инфоблока 22 (город → эти 6 полей) — это и есть таблица для `regionBySettlement`.** Дефолт: Краснодар, элемент id=2868, координаты 45.0497,38.9652 (`defines.php:88`) | `local/php_interface/lib/Regions.php` (`getRegionData()` ~427-656), `defines.php:31,56-57,88` |
| `delivery.settlementMap[GAR].locationCode` | Тот же источник, что и выше (инфоблок 22) — должен быть построен из того же экспорта, что и `regionBySettlement`, иначе `LOCATION_MAPPING_INVALID` | — |

## 3. Доставка

| Ключ | Значение | Источник |
|---|---|---|
| `delivery.services[ID].provider` | Курьер — CDEK, курьер — Yandex, самовывоз — Sale-провайдер (**pickup**, Service ID = **3**) | `defines.php:112`, `lib/delivery/Providers/{CdekCourierProvider,YandexDeliveryProvider,PickupProvider}.php` |
| `delivery.services[ID].method` | pickup(ПВЗ)=Pickup-провайдер; courier=CDEK/Yandex-провайдеры | там же |
| `delivery.services[ID].propertyCodes.*` | Явных CODE-имён свойств заказа Sale (pointId/latitude/longitude и т.д.) в коде не зафиксировано отдельным списком — координаты берутся из HB CITIES `UF_COORDS`, адрес/телефон ПВЗ — из `regionData['store']` (Bitrix Catalog Store). Нужно свериться в админке Sale, какие именно CODE у order property. | `lib/delivery/ProductDeliveryCalculator.php:18,59,74-84` |
| `delivery.services[ID].pointType` (Yandex) | В коде используется только `check-price` калькулятор (`YandexDeliveryProvider.php:12,49`), выдачи `pickup_point`/`terminal` явно не типизированы — старая интеграция ПВЗ идёт через отдельный модуль `twinpx.yadelivery` (`lib/Order.php::getYandePoints()` строки 34-200), похоже на дублирующую/устаревшую ветку — надо решить, какая актуальна | — |
| `delivery.services[ID].receiptPaymentMethod` (Yandex) | НЕ НАЙДЕНО в коде | — |
| `delivery.pointIblockId`, `.addressPropertyCode` (свой ПВЗ) | Адрес/телефон берутся из `regionData['store']` (объект Bitrix Catalog Store, не отдельный инфоблок точек) — если runtime ожидает именно iblock, нужна доп. работа по экспорту складов в инфоблок или адаптации драйвера | `Providers/PickupProvider.php` |
| `delivery.cdekCityCode`, `.yandexGeoId` | НЕ хардкодятся — CDEK код города получают динамически через `/v2/location/cities`, Yandex — через координаты, не geoId | `CdekCourierProvider.php:18` |
| `delivery.salePointIds[serviceId]` | Только один активный Sale-сервис самовывоза: **3** | `defines.php:112` |
| `delivery.cdek.clientId` / `.clientSecret` | **приватное** — уже сконфигурировано в проде/стейдже как `.env: CDEK_CLIENT_ID` / `CDEK_CLIENT_SECRET`, загружаются в `local/php_interface/include/secrets.php:127-128`. Для runtime-интеграции чек-лист прямо требует НОВЫЙ ключ, не архивный — эти прод-значения брать НЕЛЬЗЯ, только как образец, что и где вводить | — |
| `delivery.yandex.token` | **приватное** — прод/стейдж переменная `.env: YANDEX_DELIVERY_TOKEN` (`secrets.php:126`). Тоже не переиспользовать напрямую — тем же правилом "новый ключ" | — |
| `delivery.dadata.token` | **НЕ НАЙДЕНО** — DaData в prom23marketplace не используется (для адресов используется Yandex Geocoder, `.env: YANDEX_GEOCODE_API_KEY`, `secrets.php:121`). Нужен отдельный новый токен DaData | — |

Также найден **Dellin**-провайдер (`DellinCourierProvider.php`), но он отключён — ключи `DELLIN_APPKEY`/`DELLIN_SESSION_ID` пустые (`defines.php:170-171`). Не относится к чек-листу, но стоит знать, что такой провайдер есть в коде на будущее.

## 4. Оплата

| Ключ | Значение | Источник |
|---|---|---|
| `payment.apiKeyFile`, `.merchantId` | **НЕ НАЙДЕНО.** Яндекс.Pay в prom23marketplace НЕ интегрирован в чекаут — есть только SDK-сниппет в аудите `docs/perf-audit-2026-08-15/.../08-yapay-lazy-loader.js` (черновик/лоадер, без активной интеграции). Сейчас все платежи идут через стандартные Bitrix Sale Payment Systems: ID 2 (самовывоз/бесплатно), 16 (счёт для юрлиц), 17 (нал при самовывозе) | `defines.php:107-109` |
| `payment.environment` | Нужно решить заново (sandbox сначала) — прецедента в коде нет |
| `payment.splitMerchantEnabled`, `.merchantReceiptsConfirmed`, `.reconcileEnabled` | Требуют подтверждения оператора/бухгалтерии — не в коде |
| `payment.paymentAllowedHosts` / `.returnAllowedHosts` / `redirectUrls.*` / `handoff.*` | Не существует в текущем проекте — весь этот периметр (Яндекс.Pay redirect/handoff) нужно проектировать с нуля вместе с интеграцией |
| `commerce.paymentAllowedHosts` | То же самое |

## 5. Согласия и юридические версии — обновлено 2026-09-23 (Этап 5)

**Главная находка: `integrations/runtime/legal-versions.json` (используется production-кодом в
`endpoint.php:44`) сейчас содержит хэши НЕ реального контента `prom23marketplace`, а собственных
"legal42"-текстов мобильного приложения (`mobile/src/content/legalDocuments.ts`, редакция
**2026-10-01**). Это не тот же документ, что реально опубликован на сайте:**

| Ключ | Значение | Источник |
|---|---|---|
| `legalVersions.privacy.version` | Реальная редакция сайта — **06.07.2026** | `privacy-policy/index.php:19` |
| `legalVersions.privacy.sha256` | Реального хэша сайта нет в `legal-versions.json` — там лежит хэш другого, 01.10.2026-текста (`legalDocuments.ts`, `id:"privacy"`). Текст `privacy-policy/index.php` статический (захардкожен в PHP-шаблоне, БД не используется), поэтому его можно хэшировать прямо из чекаута исходников без доступа к БД — сделано `integrations/runtime/legal-mapping/compute-legal-versions.php --privacy-policy-file=...` (не выполнялся: на этой машине нет `php` CLI, см. README в той же папке) |
| `legalVersions.consent.version` / `.sha256` | Текст пользовательского согласия хранится ДИНАМИЧЕСКИ в свойстве страницы `UF_USER_AGREEMENT_TEXT` элемента инфоблока `IBLOCK_ID_PAGES` с `CODE="user-agreement"` (`local/class/Prom/Page.php`, `user-agreement/index.php:35`) — в отличие от `privacy-policy`, этот текст не в коде вообще, нужен доступ к БД. Явной строки-редакции в коде нет. Хэш `legal-versions.json`'s `consent` — тоже хэш 01.10.2026-текста из `legalDocuments.ts`, не реального `UF_USER_AGREEMENT_TEXT` |
| Как ввести версию для `user-agreement`, если БД недоступна для правки контента | Два варианта, оба задокументированы в `compute-legal-versions.php`: **(a)** попросить редактора добавить в начало `UF_USER_AGREEMENT_TEXT` строку `Редакция от DD <месяц> YYYY года` — тогда версия читается тем же парсером, что и у `privacy-policy` (`parseRevisionDate()`); **(b)** если строку не добавляют, использовать `TIMESTAMP_X` элемента как версию (`uf-text-<ISO8601>`) — хрупко: `TIMESTAMP_X` меняется и при пересохранении без изменения текста, поэтому вариант (a) предпочтителен |
| Два чекбокса на чекауте: реальный маппинг | `local/templates/main/components/bitrix/sale.order.ajax/main/template.php:1005,1013` — `<input name="agree_policy_order">` → `/privacy-policy/`, `<input name="agree_consent_order">` → `/user-agreement/`. **Проверено: для этих двух полей НЕТ CODE свойства заказа Sale ни в одном ajax-хендлере.** В отличие от других форм сайта (`local/ajax/form/*`, `local/ajax/catalog/action-*`), которые вызывают `validateConsentFields()` из `local/ajax/consent-validate.php` для серверной проверки, чекаут (`sale.order.ajax`) эту функцию НЕ вызывает нигде — оба чекбокса проверяются только атрибутом `required` в браузере (`script.js:267-336,2420-2421`) и никогда не валидируются и не сохраняются на сервере Bitrix. Т.е. реальный сайт вообще не хранит доказательство согласия на чекауте — это подтверждает, зачем нужен `ConsentLedger` именно для мобильного рантайма: он становится единственной системой учёта согласия чекаута, а не дублирует существующий Bitrix-механизм |
| Модель consent id'шников в мобильном рантайме уже согласована с реальным сайтом по СМЫСЛУ, не по ХЭШУ | `integrations/runtime/form-contracts.json`, форма `"checkout"` (строка ~1712) уже требует 3 независимых, непредвыбранных (`initial:false`) согласия: `agree_consent_order`→`documents:["consent"]` (= реальный `agree_consent_order`/user-agreement), `agree_privacy`→`["privacy"]` (= реальный `agree_policy_order`/privacy-policy), `agree_offer`→`["offer"]` (доп. документ, есть в `legalCopy.ts`/`legalDocuments.ts`, у сайта — просто фраза под кнопкой, не отдельный чекбокс). `CommerceDriver::consents()` (`src/CommerceDriver.php:411-420`) уже требует все три `accepted===true`, ровно по списку, без лишних/отсутствующих полей — независимость целей и отсутствие предвыбора уже реализованы в коде, до Этапа 5 проблем не найдено. **Открыт только вопрос данных** (какой текст/хэш подписывается), не вопрос логики |
| Маркетинговые согласия (`advertising`/`distribution`) | Отдельные от чекаута документы/`documentId`, обрабатываются как самостоятельные `consents[]`-записи в `ConsentLedger::record()` (`src/ConsentLedger.php:24-26`) — требуют явного `recipient` (email/телефон) только если `accepted===true`; отсутствие согласия по чекауту не подразумевает согласие на рекламу и наоборот, это уже так в коде |

Также в футере (`local/templates/main/footer.php:159-193`) есть смежные страницы: `/cookie-policy/`, `/offer/` — не входят в п.5 чек-листа напрямую, но могут понадобиться для полноты юр. текстов в приложении.

**Обновлено 06.10.2026 — реальные хэши уже посчитаны из захвата Этапа9 (CMS), доступ к БД больше
не нужен для этого шага.** Этап9 независимо прогнал `cms-sync.php` на `prom-stage` 29.09.2026 и
закоммитил результат — `integrations/runtime/cms-sync-output/site-pages.live.json` содержит
реальный текст `privacy`, `personal-data` (user-agreement) и `offer`. Посчитано новым скриптом
`integrations/runtime/legal-mapping/hash-live-cms-snapshot.php` (логика продублирована и выполнена
на Python в этой сессии — на машине нет `php` CLI):

| Документ | Реальная редакция (из текста) | `TIMESTAMP_X` | sha256 (реальный, снимок29.09.2026) | sha256 в `legal-versions.json` (мобильный legal42) |
|---|---|---|---|---|
| `privacy` | Редакция от **06.07.2026** | 04.03.2026 | `3c6fdfc2d44b17fa83f22f68c8820ffe26511b3eddc4f47955a4ce2e1947a8be` | `c5e29d38...` (01.10.2026) — **не совпадает** |
| `consent` (user-agreement) | "редакция опубликована: **26.05.2025**" | 07.07.2026 | `a4f1993745a30f2e74a5dda91b369270326d4296e2dfcf72c559de3b013c0e72` | `79f0db38...` (01.10.2026) — **не совпадает** |
| `offer` | Редакция от **02.02.2026** | 18.09.2026 | `159f112bb3e178dfbda8d76c0f2ad549e56523d7b9dd1a30f58b58cf507be7d4` | `76b4a75f...` (01.10.2026) — **не совпадает** |

Выяснилось, что у `UF_USER_AGREEMENT_TEXT` редакция ВСЁ-ТАКИ есть в тексте — просто фраза другая
("редакция опубликована:", не "Редакция от"), старая рекомендация ниже про `TIMESTAMP_X`-фоллбэк
менее приоритетна теперь, чем раньше. `parseRevisionDate()` в `compute-legal-versions.php` обновлён,
чтобы матчить обе формулировки.

**Два новых найденных расхождения в самом контенте сайта** (не мобильное vs сайт, а внутри сайта):
1. Текст user-agreement (сохранён 07.07.2026) сам ссылается на "Политикой конфиденциальности ... от
   **26 мая 2025 г.**" — редакцию privacy-policy, которая уже не актуальна (текущая — 06.07.2026).
2. У `privacy` слага найден ВТОРОЙ, отдельный инфоблок-элемент (`CODE=/privacy/`,
   `UF_CONTENT`, element id3207) с текстом, совпадающим с захардкоженным шаблоном
   `privacy-policy/index.php` по дате редакции — но зачем существует этот дубликат рядом со
   статическим шаблоном, неясно. См. `docs/parity/runtime-cms.md`.

**Что осталось (решение владельца, не техническое):** (1) переопубликовать реальные страницы сайта
текстом `legal42` (тогда хэши совпадут с уже закоммиченным `legal-versions.json`), или (2)
пересчитать `legal-versions.json` под реальный текст сайта (хэши выше) — обе опции требуют
юридического согласования, не угадывания. (3) Спросить владельца про два расхождения выше. (4)
Повторно прогнать `cms-sync.php` ближе к моменту принятия решения — снимок от 29.09.2026 может быть
устаревшим. Полный разбор в `docs/parity/runtime-consent.md` (обновление 06.10.2026).

## 6. Формы

| Внутренний formId (ожидаемый) | Реальный Bitrix ID/SID | Источник |
|---|---|---|
| orange-ask / консультация | WEB_FORM_ORANGE_ASK = 2 | `defines.php:43` |
| found-it-cheaper | WEB_FORM_FOUND_IT_CHEAPER = 4 | `defines.php:44` |
| buy-one-click | WEB_FORM_BUY_ONE_CLICK = 5 | `defines.php:45` |
| tour (запись на экскурсию) | WEB_FORM_BOOK_A_TOUR = 6 | `defines.php:46` |
| rent (запрос аренды) | WEB_FORM_REQUEST_A_RENT = 7 | `defines.php:47` |
| callback (запрос звонка) | WEB_FORM_REQUEST_A_CALL = 8 | `defines.php:48` |
| leasing (запрос лизинга) | WEB_FORM_REQUEST_LEASING = 9 | `defines.php:49` |
| request-document (ЛК юрлиц, справки/счета) | SID = `REQUEST_DOCUMENT` (числовой ID не фиксирован — создаётся миграцией, резолвится через `CForm::GetBySID('REQUEST_DOCUMENT')`) | `local/php_interface/migrations/Version20260826130000.php:40` |
| quote / production-request / franchise | **НЕ НАЙДЕНЫ** как отдельные Bitrix-формы — в prom23marketplace таких форм нет (возможно это формы, специфичные только для мобильного приложения, без прод-аналога) |
| ЭДО (заявка на подключение) | Отдельная не веб-форма, а элемент инфоблока **27** (`IBLOCK_ID_ORGANIZATIONS_CHANGE_REQUISITES`) — см. [[lk-edo-form-uses-iblock27]] |

Реальные списки required/enum полей форм, REASONS для возврата, список ЭДО-операторов, календарь тура — **не собраны в этом проходе**, нужен отдельный точечный запрос к каждой форме (можно поднять по компонентам `bitrix:form.result.new` и обработчикам `local/ajax/form/*`, `local/ajax/lk/*`).

## 7. Прочее

| Ключ | Значение |
|---|---|
| `ffprobePath` | Вызывается как системная команда `ffprobe` без явного пути (`local/php_interface/functions.php:318-327`, функция `isVideoValid()`, лимит длительности 60 сек). На сервере интеграции нужно проверить `which ffprobe` (обычно `/usr/bin/ffprobe`) — в коде прод-сайта абсолютный путь не зафиксирован |
| `sourceSecretsReplaced` | Подтверждение оператора — не выводится из кода |
| `returns.legacyTemplatesEscaped` | Подтверждение оператора после проверки патча — не выводится из кода |

---

## Итог: что осталось получить НЕ из кода

1. **Секреты** (положить напрямую в приватный конфиг, не в чат): новые (не архивные) CDEK client id/secret, Yandex Delivery token, DaData token, Яндекс.Pay apiKey — ни один из них не готов "как есть" для runtime (прод-переменные `.env` в `local/php_interface/include/secrets.php:121,126-128` существуют, но чек-лист прямо требует НОВЫЕ ключи, не архивные/боевые).
2. **Яндекс.Pay merchantId** — интеграции в проекте нет вообще, нужно заводить с нуля (регистрация мерчанта, sandbox/production).
3. **Подтверждения оператора**: `sourceSecretsReplaced`, `returns.legacyTemplatesEscaped`, `payment.splitMerchantEnabled`, `payment.merchantReceiptsConfirmed`, `payment.reconcileEnabled`.
4. **Таблица `regionBySettlement`/`settlementMap`** — структура известна (инфоблок 22, поля PRICE_CODE/DELIVERY_SERVICE_TK/DELIVERY_SERVICE_PICKUP/DELIVERY_SERVICE_PICKUP_TK/PAYMENT_SYSTEM/STORE), но нужно выгрузить реальные значения по каждому обслуживаемому городу — это работа с БД/админкой Bitrix, не с кодом.
5. **propertyCodes доставки** (pointId/latitude/longitude/...) — нужно свериться в админке Sale > Свойства заказа.
6. **Формы quote/production-request/franchise** — в prom23marketplace не найдены, уточнить у владельца мобильного приложения, откуда они должны браться.
7. **Хэши (sha256) юр.документов** и точная дата редакции пользовательского согласия — считаются от актуального текста на изолированном инстансе, не из кода.
