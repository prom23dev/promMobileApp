# V7 — аналитика и наблюдаемость: контракт для подключения

11.09.2026. **Аналитика ещё не подключена.** В проверенных `mobile/src`, `server`, `mobile/package.json` нет event sink/инициализации продуктового analytics или crash SDK. История поиска/просмотров для UX не является готовой системой аналитики. Этот документ задаёт taxonomy и критерии приёмки master §31/43/44/46, а не публикует несуществующие показатели.

## Текущая граница данных

Snapshot **28 SKU / 10 popular / 23 oldPriceKopecks**, home slots и sandbox state пригодны для контрактных/UX тестов. Они не дают метрики спроса, продаж или B2B конверсии. `/api/v1/home` управляет представлением; paginated `/api/v1/catalog` ещё не потребляется главным каталогом (`store.tsx:29`). Нативные бинарники не собраны — cold start/FPS/memory/crash/ANR на устройствах не измерены этой итерацией.

В `/api/v1/app-config` live auth/write/payment capabilities false. Нажатие неработающего submit не является регистрацией, заказом или подпиской. Все события из preview/snapshot/sandbox должны быть исключены из production KPI; среда и происхождение определяются серверной конфигурацией, а не доверяются произвольному mobile JSON.

## Общая схема события — целевой контракт

Минимальные служебные поля: schemaVersion, eventId, eventName, occurredAt UTC, receivedAt UTC (сервер), appVersion/build, platform, environment, dataMode, screenId, короткий session correlation ID и allowlisted properties. Для authenticated событий backend добавляет scope сам; телефон/email/ФИО/ИНН/адрес/сырой organizationId не используются как analytics identity. Псевдонимный ID не объявляется обезличенным автоматически.

Разрешённые свойства — только по schema конкретного события. Исключить raw search text, тексты форм/отзывов/чатов, имена и URI файлов, реквизиты, auth headers, OTP, полные URL/query strings, payment tokens/PAN/CVV. Категории/причины — фиксированные enum, product/category IDs — из публичного каталога. Цена/сумма в копейках допускается только в отдельно ограниченном commerce dataset после решения владельца.

Набор SDK, место обработки и retention пока не выбраны: [SDK register](security/sdk-register.md), [privacy register](privacy/processing-register.md). Покупка и каталог не должны зависеть от analytics consent, очереди или провайдера. До выбора необязательная отправка отключена.

## Taxonomy master: точка истины, свойства, дедупликация

Все строки ниже **проектируются, не испускаются текущим кодом**.

| Событие | Когда фиксировать | Допустимые properties / дедупликация |
|---|---|---|
| app_open | Foreground сессия действительно началась, не каждый render | cold/warm, entryKind; один eventId на начало сессии |
| search | Подтверждённый поисковый запрос получил результат/ошибку | queryLengthBucket, resultCount, filterCount, latencyMs, result=ok/error; без текста запроса; один searchRequestId |
| search_result_click | Пользователь открыл конкретный результат этой выдачи | productId, position, searchRequestId; gesture eventId |
| category_open | Открылся выбранный раздел | categoryId, depth, entrySource; без дублирования при rerender |
| product_view | Загружена и показана карточка выбранного SKU | productId, entrySource; один на navigation visit, не каждый focus callback/render |
| add_to_favorite | Источник состояния подтвердил добавление, не удаление toggle | productId; operationId связывает optimistic/authoritative result |
| add_to_compare | Подтверждено добавление в набор ≤6 | productId, count; отклонение седьмого не считать добавлением |
| add_to_cart | Сервер подтвердил изменение корзины | productId, quantityDelta, contextKind; один mutationId, не сумма UI retries |
| begin_checkout | Реальный checkout открыт с непустой актуальной корзиной | cartLineCount, contextKind; checkoutAttemptId. Snapshot fallback не production checkout |
| shipping_selected | Сервер подтвердил выбранный допустимый вариант котировки | deliveryKind, quoteId correlation, contextKind; без адреса/ФИО |
| payment_started | Backend успешно создал PSP payment session | paymentAttemptId, provider enum, method enum; открытие кнопки без provider receipt не подходит |
| purchase | Backend подтвердил успешную оплату и переход состояния | eventId от payment/order pipeline; сумма/валюта в ограниченном commerce dataset; один canonical payment/order event |
| purchase_failed | Backend/PSP вернул конечный подтверждённый неуспех | reason enum, paymentAttemptId; timeout/unknown не считать конечным отказом; PII-free errorCode |
| repeat_order | После preflight пользователь подтвердил и backend применил новый состав | sourceOrder correlation, changedLinesCount; operationId, не нажатие кнопки |
| b2b_invoice_created | Учётная система/Bitrix подтвердили настоящий счёт | invoice correlation, contextKind=organization; один документ+версия, не placeholder PDF |
| registration_completed | Backend создал аккаунт и подтвердил окончание registration flow | method enum; identity eventId. Создание sandbox session не подходит |

Для B2B с отсрочкой `b2b_invoice_created` не означает оплату. Принятый заказ/дебиторская задолженность/оплаченная сумма — разные operational datasets. Как отражать бухгалтерскую выручку, возвраты и частичные оплаты, утверждает finance; не выводить её автоматически из client purchase click.

Дополнительные диагностические события home config fallback, API cursor reset, stale context, auth revoke и upload rejection относятся к observability. В них достаточно route template, reason enum, release/requestId; не копировать response body или пользовательский ввод.

## Метрики и определения до построения dashboard

| Метрика master | Определение/зависимость |
|---|---|
| DAU/MAU | Утверждённая активность и правила псевдонимной identity/guest merge; исключение preview, сотрудников QA и bots. Пока неизвестно число реальных пользователей |
| Conversion | Утверждённый знаменатель сессий/пользователей и серверно подтверждённая покупка; B2C/B2B отдельно |
| Search conversion / zero-result rate | searchRequestId → result click/cart/purchase в фиксированном attribution window; доля resultCount=0 среди успешных поисков. Network error — другая категория |
| Add-to-cart / checkout conversion | Подтверждённые cart mutations и реальные checkout attempts, отдельно от отказов ввода/stock/price |
| Revenue / AOV | Finance-approved measure на серверных данных; деньги minor units, частичные возвраты/отмена отдельными событиями. Не путать оплаченные суммы с признанной выручкой |
| Repeat purchase / B2B repeat order | Устойчивая разрешённая identity и canonical order IDs; повтор корзины без заказа не покупка |
| Retention | Согласованный anchor/cohort/window, отделённые guest/auth/B2B; политика удаления распространяется на идентификаторы |
| Crash-free / ANR-free | Фактическая release/device population, символы/source maps и стабильная версия SDK; web console errors не заменяют native crash/ANR |
| API p95/p99 | По route template, environment, response class и release; requests и failures с одинаковыми границами времени; без URL/PII labels |

Предварительно необходимы: владелец каждой метрики, формула/окно, источники, единица, сегменты, исключения, retention, доступ и freshness. Отсутствующее измерение показывается как N/A, не как 0.

## Реализация/приёмка без риска для checkout

1. Product+privacy утверждают schemas и цели; backend определяет authoritative commerce events. Выбор инструмента следует после data/SDK review, не наоборот.
2. Общий typed emitter с runtime allowlist отбрасывает лишние поля до записи. Разделить product analytics, security audit и operational metrics; у них разные доступ и retention.
3. Bounded queue без form payload, с TTL/backpressure/consent gate; retry не влияет на checkout. Server dedup по eventId. Финансовые события генерируются из durable order/payment pipeline, а не ненадёжной мобильной очереди.
4. Не включать sampling для canonical financial state. Operational traces допускают утверждённый sampling; пропавший trace не означает отсутствие заказа.
5. QA проверяет duplicate callback, offline/reconnect, app kill/resume, отказ consent, logout/deletion, sandbox exclusion, schema rejection/PII canaries. Dashboard сверяется с известным набором staging orders и платежей.
6. Native performance budget измеряется release build на согласованных физических устройствах: cold/warm start, interactive, scrolling, memory, image/network budget, crash/ANR и размер. Результаты на 28 snapshot SKU не экстраполировать на 100 000.

Текущий CI/тестовый результат относится к API/UI контрактам; включение analytics, запуск кампаний и отправка тестовых событий внешнему провайдеру этой задачей не выполнялись. Порядок внедрения — [roadmap.md](roadmap.md).
