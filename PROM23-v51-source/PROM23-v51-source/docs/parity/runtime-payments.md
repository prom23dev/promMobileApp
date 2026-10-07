# Платежи: source recovery и границы адаптера

Статус: **PARTIAL**, 12.09.2026. Здесь описан новый исполняемый код, а не подтверждённая оплата. Запросов к PSP, заказов и изменений Bitrix/CRM не выполнялось. Политики проверены на doubles и временной SQLite.

## Что подтверждено исходником

| Доказательство | Поведение | Перенос |
|---|---|---|
| `site-source/local/php_interface/include/defines.php:108` | `INVOICE_PAYMENT_SYSTEM=16`; старое упоминание 13 в комментарии неактуально | Счёт для организации использует реальный Sale payment16 |
| `site-source/local/templates/main/components/bitrix/sale.order.ajax/main/template.php:845` | SDK v4, CARD/SPLIT; `onPayButtonClick` возвращает пустую строку | Это не готовый серверный Split handler. Новый transport создаёт ссылку только после сохранения Sale order |
| Тот же template:1174 | Второй callback также не выдаёт URL | Не копируется как работающая оплата |
| `site-source/personal/order/payment/index.php:7` и `:28` | Авторизация, ORDER_ID/PAYMENT_ID, `bitrix:sale.order.payment`; счёт `pdf=1&DOWNLOAD=Y` | Ownership проверяется до выдачи одноразового invoice ticket |
| `integrations/runtime/src/CommerceDriver.php:260` | Source region + Sale restrictions, online14/receipt17/invoice16 | Сплит допускается только внутри разрешённого online14 для физлица |

Исходные конструкторы с ключами не копировались и не исполнялись. Установленного ядра, платёжных модулей и их конфигурации в архиве нет.

## Новый код

`src/PaymentDriver.php`:

- `splitEligibility(payment, scope)` проверяет merchant capability из приватной конфигурации и ограничения Sale14. Это **не** персональное одобрение рассрочки. Условия и доступность определяет платёжная страница.
- `splitPaymentHandoff(order,payment,actor)` повторно проверяет владельца, организацию, тип плательщика, saved order/payment, отсутствие оплаты/отмены, exact RUB amount и Sale restrictions. Ни цены, ни состав не берутся от клиента.
- `saleSnapshot` переносит настоящие позиции заказа, количества и итоговые стоимости после скидок; доставка — отдельная строка. Сумма строк должна точно совпасть с Sale payment и order. Дробное количество и дубли productId отвергаются как пока неподдержанные случаи, не исправляются молча.
- `createHosted` вызывает фиксированный HTTPS API `/api/merchant/v1/orders`; `status` — GET существующего provider reference. cURL проверяет TLS, не следует redirect, ограничен временем и 1 MiB ответа. API key читается из отдельного файла0600. Внешний response text не попадает в ошибки.
- `run('payment.status',payload,actor)` загружает собственный Sale order по `reference` и единственный внешний payment. Возвращает `{status,sourceOrderId,sourcePaymentId}`. При `reconcileEnabled=true` только подтверждённый `CAPTURED` обновляет fresh Sale payment через `setPaid('Y')` и один `order.save()`; выполняются существующие Sale events. `AUTHORIZED` и redirect пользователя не означают оплату. Возвраты/частичные возвраты не переводятся автоматически в другую сумму/статус Sale.
- `offerResolver` возвращает связанную с запросом пустую выдачу с `offerReady:false`. **Actual PDP offers остаются MISSING_IMPLEMENTATION**: empty callback не является интеграцией доставки, графика Сплита или Плюса. `CommerceDriver` не выводит этот служебный флаг покупателю.

Официальный контракт подтверждён публичным чтением документации Яндекса: [аутентификация и request headers](https://pay.yandex.ru/docs/ru/custom/backend/yandex-pay-api/), [создание платёжной ссылки](https://pay.yandex.ru/docs/ru/custom/backend/yandex-pay-api/order/merchant_v1_orders-post), [получение состояния заказа](https://pay.yandex.ru/docs/ru/custom/backend/yandex-pay-api/order/merchant_v1_order-get). Передаются позиции корзины, `orderSource:APP`, только SPLIT, фиксированный TTL300, согласованные server-only redirect URLs. Не передаются предположительные тарифы, баллы, план из четырёх частей или незадействованные risk-поля.

## Повтор, срок ссылки и сверка

Приватный PDO хранит stable merchant order reference, owner/context hash, fingerprint запроса, state и request ID. Запись `pending` появляется **до** возможного PSP POST. Перезапуск процесса/повтор проверяет существующий reference через GET. Неопределённый сетевой результат не порождает второй POST автоматически.

Истечение локального TTL при provider `PENDING` не разрешает новый платёж: провайдер допускает дополнительное время после открытия страницы. Только проверенный `FAILED` или `VOIDED` позволяет новую попытку на том же Sale payment. Следующий reference получает суффикс `-rN`; durable CAS не даёт двум запросам создать две попытки. История terminal attempts сохраняется; предел5 повторов. `AUTHORIZED`, `CAPTURED`, `CONFIRMED` не пересоздаются. Изменение суммы/товаров/конфигурации связывания требует сверки, а не изменения старого платежа.

Синхронизация после CAPTURED перезагружает Sale order после GET, проверяет актуальные ownership/amount/items и использует durable `sync-pending`. Crash между Sale save и записью итога требует сверки; второе сохранение не выполняется вслепую. Это не транзакция между PSP, SQLite и Bitrix. Нужен интеграционный тест с реальными установленными Sale handlers, callbacks и фискализацией.

## Счёт: одноразовый endpoint

`src/PaymentHandoff.php` и `payment-handoff.php` используют HTML именно существующего успешного Sale invoice result (`getTemplate()`), только для payment16/юрлица. HTML парсится DOM с `LIBXML_NONET`; сохраняются текст и безопасные табличные теги. Удаляются source scripts, формы, события, ссылки, внешние ресурсы и произвольные атрибуты. **Печати, подписи-картинки и исходный PDF пока не перенесены**; это просмотр реквизитов/сумм, не полная визуальная parity счёта.

После ownership создаётся ticket256bit, в SQLite сохраняется только его SHA256, сессия, order/user ID, очищенный HTML и TTL120. URL несёт ticket в fragment; он не отправляется в GET/access log. Фиксированный bootstrap удаляет fragment из history и отправляет ticket same-origin POST без source cookies. Ticket потребляется атомарно один раз. CSP запрещает source scripts/forms/frames/networkresources; no-store/no-referrer/noindex обязательны.

`PaymentHandoff::revokeIfExists(PDO,sessionKey)` вызывается при выходе/завершении текущей сессии. `revokeUserIfExists(PDO,userId)` отзывает tickets всех сессий удаляемого пользователя. Проверка существования таблицы позволяет использовать hooks до включения invoice. Бизнес-заказы и документы hooks не удаляют. Короткоживущие capability tickets старой схемы отзываются при миграции.

## Wiring для программиста / root

Конфигурация: `integrations/runtime/payment-config.example.php`, объединить с **приватным** runtime config. По умолчанию все effectful возможности выключены. Новый ключ и merchantId, exact PSP/return/handoff allowed hosts, публичный HTTPS URL handoff и просмотр merchant receipt workflow — обязательны. Пустые allowlists не расширяются автоматически.

```php
require_once __DIR__.'/src/PaymentDriver.php';
$payments = new \Prom23\Runtime\PaymentDriver($config);
$config['commerce'] = array_replace($config['commerce'] ?? [], $payments->callbacks());
// signed dispatcher, после Actor::resolve:
// payment.status => $payments->run('payment.status', $payload, $actor)
```

В `CommerceDriver.payment`, когда существующий service result успешен, но `getPaymentUrl()` пуст, вызвать `invoiceHandoff($order,$pay,$actor,$result)`; он сам проверяет invoice16. Конкретный template другого PSP без hosted URL не превращается в произвольный исполняемый HTML и остаётся `PAYMENT_HANDOFF_ADAPTER_REQUIRED`. `paymentAllowedHosts` CommerceDriver должен включать отдельно подтверждённый handoff host.

Эти точки вызова теперь подключены в `endpoint.php` и `CommerceDriver.php`: существующие явно настроенные callbacks не перезаписываются. `payment.status` направлен в PaymentDriver. AccountAction вызывает отзыв всех user tickets после account-delete; AuthDriver/logout и завершение текущей сессии — отзыв только session tickets. Коды истёкшей ссылки/изменённого платежа/недоступного статуса имеют фиксированные русские сообщения в BFF. Node runtime-client regression:8/8 PASS; этот тест не исполняет PHP.

`WorkspaceDriver` добавляет `check-payment` только для собственного unpaid payment14 с реальной durable записью exact provider scope/owner. Обычный заказ не получает кнопку синхронизации этого PSP только из-за суммы или названия метода. BFF и UI wiring выполняет root отдельно; реализация этого класса не доказывает приёмку всего flow.

## Остаток и acceptance

- MISSING: actual PDP payment/delivery offers; full original invoice PDF/image fidelity; точная схема receipt integration для установленных модулей; обработка частичных платежей/дробных товаров; автоматическая webhook/background сверка и отдельное администрирование неоднозначных/возвращённых платежей.
- PARTIAL: direct Split flow имеет конкретный transport, status synchronization, конфиг и contract tests; полного connected теста нет. `merchantReceiptsConfirmed` — операторское ограничение включения, **не** созданная программно фискализация.
- BLOCKED_BY_EXTERNAL_ACCESS применимо к последующей проверке подключённого PSP/Sale при готовой конфигурации. Оно не заменяет перечисленные MISSING реализации.
- Ничего из этого не означает соответствие всем требованиям магазинов/законодательства или собранные native binaries.

Тест `integrations/runtime/test/PaymentDriver.test.php`: ownership/organization/foreign payment, копейки и сумма строк, duplicate/fractional items, exact HTTPS hosts, merchant/currency/amount/status binding, no fabricated offers, DOM sanitizer, PDO restart/retry/pending/expiry/terminal renewal, CAPTURED single-save, invoice one-use/TTL/session revocation. Транспорт теста — явный double, реальный PSP не вызывается.

## Зафиксированный результат

Root выполнил isolated CLI `/opt/php84/bin/php` с уже имеющимися PDO SQLite и DOM: **75 payment adapter checks PASS, 0 groups SKIP**. Все PHP файлы пакета прошли строгий lint; полный лог [php-policy-recovery06.log](evidence/php-policy-recovery06.log) сохраняет SHA256 проверенных исходников. SHA256 десяти относящихся к платёжному потоку файлов сверены с текущим диском — все совпали. Node runtime-client: **8/8 PASS**.

Пройдены в том числе отдельные PDO connections к временному файлу, pending после неизвестного POST, новый reference только после terminal FAILED, отсутствие повторного Sale save, late create response не переписывает state=paid, одноразовая выдача и TTL, отзыв всех tickets удаляемого user при сохранении другого user. Это не тест реального Bitrix, банковского шлюза, hosted page в native browser, receipt delivery или публичного HTTP invoice endpoint. Эти приёмки остаются открыты.

## Recovery03 — повторное открытие оплаты

PaymentDriver::handoffLedgerRequest вызывается после проверки подписи и Actor, перед RequestLedger. Он заново проверяет владельца, организацию, неоплаченный заказ и session/context. Только счёт16 организации и сохранённый server-side Split preference используют собственный жизненный цикл ссылок: общий ledger не возвращает уже потреблённый invoice ticket или устаревший URL. Для остальных PSP общий idempotency/pending guard сохранён. У Split остаются durable pending/reference/CAS и сверка провайдера; изменение клиентского preference не обходит защиту.

PHP08: **83/83 payment assertions PASS**, включая8 проверок выбора ledger, чужого пользователя/контекста, оплаченного заказа и сохранения guard у остальных операций. Всего38 PHP lint /430 isolated assertions PASS. Лог evidence/php-policy-recovery08.log содержит точные SHA256 проверенных файлов. Live PSP/Bitrix не вызывались.
