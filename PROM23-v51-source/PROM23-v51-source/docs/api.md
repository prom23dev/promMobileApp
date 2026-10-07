# Публичный BFF v1 — реализованный slice A

11.09.2026. Контракт: `docs/openapi-v1.json` (OpenAPI 3.1). Реализация: `server/public-v1.mjs`, маршруты `server/app.mjs`. Это API публичного снимка и конфигурации интерфейса. Настоящий вход, права компании, checkout, оплата, consent и отправки сообщений не включены.

## Общие правила

- Префикс `/api/v1`; ответы JSON `{data: ...}`, ошибки `{error:{code,message}}`. Клиент принимает решение по code, а не тексту.
- Только GET и CORS OPTIONS; POST возвращает 405. Авторизация не нужна; эти три маршрута не используют sandbox session или identity из заголовка. Не отправлять Cookie/Authorization.
- Действует exact Origin allowlist общего сервера; пустой Origin допускается для native. `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`. Прокси preview также сохраняет noindex. Никаких DNS/публикаций этим slice не сделано.
- URL максимум 4096 символов; неизвестные/повторные query-параметры запрещены. Query допускается только на `/api/v1/catalog`.
- Цены — целые копейки RUB из снимка, без заявления об актуальности/персональной скидке. `oldPriceKopecks` выдаётся только если исходник содержит safe integer строго больше текущей цены; отсутствие или некорректность не порождают скидку.
- Нет automatic retries записей. Новые маршруты ничего не создают в SQLite, Bitrix, CRM, 1С или PSP.

## GET /api/v1/app-config

Возвращает schemaVersion=1, revision, environment=preview, capabilities и допустимые параметры каталога. `publicCatalog` и `homeConfiguration` включены; `liveWrites`, `liveCatalog`, authentication/organizations/checkout/payments/orderWrites/formWrites/consentWrites/notificationWrites/pushRegistration выключены.

Capabilities описывают готовность интеграции. Они не являются правами пользователя и никогда не заменяют server-side authorization. Неизвестная capability на клиенте трактуется как недоступная. Наличие кликабельной формы не означает доступность её записи.

`catalog.cities` — allowlist названий филиалов из публичного source-backed контента; не геокодер и не обещание локального склада. `catalog.contexts` = personal/organization: только вид публичной выдачи, не login и не роль компании. По умолчанию Краснодар/personal; page size 20, максимум 50.

## GET /api/v1/home

```json
{"data":{"schemaVersion":1,"revision":"home-v7-1","blocks":[
  {"id":"home-hero","type":"hero","enabled":true},
  {"id":"home-categories","type":"categories","enabled":true}
]}}
```

Пример сокращён; фактический default порядок: hero, categories, popular, business, projects, guide, services, articles, personalized. Optional type production поддержан, в default отдельно не включён. Каждый ID навсегда связан с типом: `home-<type>`. `enabled:true` означает только наличие слота; скрытие — отсутствие слота в конфигурации. Персональный слот не передаёт персональные данные: конкретный renderer использует доступный собственный контекст.

Сервер читает `server/content/home.json` один раз при старте, максимум 32 KiB, и валидирует exact schema, допустимые типы, уникальность и неизменность IDs. Hero обязателен первым. Пустой/ошибочный/отсутствующий файл → безопасная встроенная конфигурация. Нет remote JSX/HTML, URL, произвольных стилей или исполняемых действий. Конфигурация меняет порядок/состав заранее реализованных клиентских блоков; CMS editor и remote reload не реализованы.

Клиентский файл `mobile/src/api/home.ts` экспортирует `HomeConfig`, `HomeBlockType`, `defaultHomeConfig`, `parseHomeConfig`, `loadHomeConfig({signal?,timeoutMs?,baseUrl?,fetcher?})`. Неизвестный будущий type пропускается; неверный известный блок/версия → fallback. Корректный ответ неизменяемый. Loader выполняет один GET без credentials, по умолчанию ждёт не более 1500 ms и возвращает fallback при любой ошибке/отмене/таймауте. Таймаут возвращает результат даже если transport не реагирует на abort. UI начинает с default и обновляется асинхронно; ожидать loader до первого render не нужно.

Web использует same-origin `/api/v1/home`. Native требует явно заданный `EXPO_PUBLIC_APP_API_URL` (`https://<approved-origin>/api/v1`) либо существующий preview `EXPO_PUBLIC_LOCAL_API_URL` (`.../api`). HTTP разрешён loader только для loopback-разработки; arbitrary path/query/URL credentials отклоняются. Значения production URL и provider secrets не заданы этим slice.

## GET /api/v1/catalog

| Query | Правило |
|---|---|
| q | По умолчанию пустой; ≤120 символов, без control bytes; NFKC, trim и объединение пробелов. Все слова ищутся в name/sku, без морфологии/синонимов |
| city | Exact allowlist из app-config; по умолчанию Краснодар |
| context | personal или organization; по умолчанию personal |
| limit | Целое 1…50 без ведущих нулей; по умолчанию 20 |
| cursor | Непрозрачный continuation token; клиент передаёт без изменения с теми же параметрами |

Ответ содержит schemaVersion, нормализованный query, products, page `{limit,total,nextCursor}` и provenance. Порядок фиксируется порядком snapshot; новые элементы появятся после перезапуска с обновлённым snapshot. `nextCursor:null` завершает выдачу. Это pagination API над загруженным снимком, а не новая поисковая система Bitrix.

Cursor имеет HMAC с process-local случайным ключом и связан с revision snapshot, q, city, context, limit и offset. Изменение параметров → 409 CURSOR_CONTEXT_CHANGED; изменённая подпись или перезапуск сервера → 409 CURSOR_EXPIRED. Клиент начинает заново без cursor. Курсор не является пользовательским credential. Ни один его параметр не расширяет доступ к данным.

`provenance` содержит mode=public-snapshot, importedAt (UTC или null), revision, pricing=snapshot, stock=unverified, regionalPricing=false, checkoutEligible=false. `product.stock=null`: локальный искусственный лимит корзины из старого `/api/catalog` не выдаётся как реальный остаток. `priceSource=imported-snapshot`; показываемый source текст наличия не подтверждает актуальность. Выбор города/organization не меняет цену и не выдаёт персональных прайсов.

`imageFile` — только безопасное имя локального jpg/jpeg/png/webp, иначе null. `sourceUrl` — HTTPS reference без встроенных credentials/query/hash, иначе null; сервер её не загружает. `importedAt` нормализуется в UTC. Вложенные specs экспортируются только как label/value. Максимальный сформированный JSON data страницы — 1 MiB; превышение возвращает 503 без частично потерянных SKU.

| Ошибка | HTTP | Действие |
|---|---|---|
| INVALID_QUERY | 400 | Исправить query, не повторять тот же запрос автоматически |
| QUERY_UNSUPPORTED | 400 | Удалить query с home/app-config/старого API |
| CURSOR_CONTEXT_CHANGED | 409 | Очистить cursor, загрузить первую страницу нового контекста |
| CURSOR_EXPIRED | 409 | Очистить cursor после restart/snapshot change |
| ORIGIN_FORBIDDEN | 403 | Исправить согласованную среду/Origin allowlist |
| METHOD_NOT_ALLOWED | 405 | Использовать GET; write capability не существует |
| URL_TOO_LONG | 414 | Ограничить длину URL |
| CATALOG_RESPONSE_TOO_LARGE | 503 | Оставить предыдущую выдачу; исправить данные или уменьшить страницу |

## Совместимость и проверки

Старый `/api` local-sandbox сохранён отдельно с его локальными тестовыми orders/state. V1 не принимает эти заказы за реальные и не превращает token в аккаунт. Копировать sandbox DB в production identity store нельзя.

Тесты: `server/test/public-v1.test.mjs` — default-off capabilities, методы/Origin, home validation/fallback, страницы без дублей, привязка/подмена/restart cursor, allowlist/query limits, provenance, отсутствие персонализации, пустой snapshot, unsafe metadata/response size, old-price validation. `mobile/tests/home-api.test.ts` — parser/order/unknown blocks, credential-free GET, ошибка/размер/fallback, независимый deadline/abort, безопасный URL. Результаты текущего прогона фиксируются в `docs/architecture.md`.

OpenAPI относится к этим трём реализованным маршрутам. Login/order/payment/Bitrix export mobile routes не описываются как работающие. Их будущие контракты добавляются после проверки реального staging pipeline.
# Location P0 / MASTER4

The existing OpenAPI document now also describes the official geographic endpoints:
`GET /api/v1/locations/suggest?q=&limit=10`, `GET /api/v1/locations/{id}`,
authenticated `GET/POST /api/v1/location`, and
`POST /api/v1/cart/revalidate-location`.

Suggestion values are official GAR objects, with OBJECTGUID as `id`/`fiasId`,
OBJECTID as string `garId`, exact name/type and verified administrative labels.
They are independent of the old catalog `city` branch allowlist, which remains a
legacy display context and does not set regional prices. No free-form string can
be saved through the normal `/api/actions` city action anymore.

Selection accepts only `{settlementId, expectedVersion, expectedContext}`. A stale
version/context returns409; selection preserves both carts and revokes unconsumed
session quotes. It does not validate prices or availability. `commerce.status`
remains `unresolved`; regional cart revalidation returns503
`LOCATION_INTEGRATION_REQUIRED` until the existing Bitrix rules are connected.
The local session is not production login. See [location service](architecture/location-service.md)
and [source audit](audit/location-system.md) for migration and tested boundaries.


## MASTER5: публичный контент и детали товара

В `server/app.mjs` зарегистрированы GET `/api/v1/content/pages/{slug}`, `/api/v1/products/{productId}/details`, `/api/v1/products/{productId}/availability`. OpenAPI содержит все3маршрута и normalDTO. Последний требует локальнуюсессию ивыбранныйофициальныйsettlement; ответсвязан с productId/settlementId/locationVersion/buyerContext, actualBitrixstock покаunknown. Это неproductionauth.

Content snapshot поддерживает ETag/304, CORS и fallback. Подробные контракты: [public-content.md](api/public-content.md), [product-details.md](api/product-details.md), включая source reviewfilters/media. Практическая последовательность подключения: [integrations/README.md](../integrations/README.md).6HTTPтестов иполныйserver suite82/82 прошли; реальный CMS/ERP/PSP/submit не подключены.
