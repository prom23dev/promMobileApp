# Чек-лист конфиг-значений для подключения runtime-интеграции (Bitrix)

Собрано по коду `integrations/runtime/src/*.php`, `config.example.php`, `payment-config.example.php`
и документам `docs/parity/runtime-commerce.md`, `runtime-payments.md`, `runtime-delivery.md`.

Ничего из перечисленного ниже не задано на данный момент — все runtime-операции в
`docs/parity/runtime-dispatch-coverage.json` имеют статус PARTIAL/LEGACY_REVIEW именно
из-за отсутствия этих значений, а не из-за отсутствия кода.

Секреты (отмечены **приватное**) нельзя передавать текстом/чатом — их нужно класть
напрямую в приватный конфиг-файл (режим 0600) на сервере интеграции.

## 1. Доступ и окружение (блокирует всё)

| Ключ | Что нужно | Где используется |
|---|---|---|
| `siteRoot` | Абсолютный путь к изолированному инстансу Bitrix (не прод!) | `config.example.php` |
| `stateDirectory`, `keyFile` | Приватная директория вне web-root + новый 64-hex HMAC-ключ (не из архива!) | транспорт `runtime-client.mjs` ↔ `endpoint.php` |
| `sourceOrigin`, `sourceAllowedOrigins` | Домен(ы), с которых разрешено обращаться к endpoint.php | `config.example.php` |
| `enabledOperations`, `enabledForms` | Явный список операций/форм, которые владелец разрешает включить (пусто по умолчанию) | выключатель по фичам, не общий флаг |

## 2. Гео/коммерческий контекст (Этап 2-3)

| Ключ | Что нужно | Комментарий |
|---|---|---|
| `commerce.catalogIblockIds` | ID инфоблоков каталога/торговых предложений в реальном Bitrix | без них `readInventory` не знает, где искать товары |
| `commerce.productIdMap` | Маппинг prom-ID ↔ реальных ID элементов, если они не совпадают | опционально, если ID уже совпадают — не нужен |
| `commerce.regionBySettlement[GAR UUID]` | Для каждого обслуживаемого населённого пункта: `personal.regionId`+`locationCode` и `organization.regionId`+`locationCode` (реальные Sale CODE) | самый объёмный пункт — по одной записи на каждый город |
| `delivery.settlementMap[GAR].locationCode` | Тот же маппинг GAR→Sale CODE, но со стороны DeliveryDriver — должен совпадать с предыдущим пунктом | несовпадение = `LOCATION_MAPPING_INVALID` |

## 3. Доставка (Этап 3, 7)

| Ключ | Что нужно |
|---|---|
| `delivery.services[ID].provider` | `cdek` / `yandex` / `sale` — какой провайдер на каком реальном Sale service ID |
| `delivery.services[ID].method` | `pvz` / `terminal` / `courier` |
| `delivery.services[ID].propertyCodes.*` | Реальные CODE свойств заказа Sale: `pointId`, `latitude`, `longitude`, опционально `cityCode/geoId/houseId/postalCode/pod/etag/office/comment` |
| `delivery.services[ID].pointType` | Для Yandex: `pickup_point` или `terminal` |
| `delivery.services[ID].receiptPaymentMethod` | Для Yandex: `card_on_receipt` / `postpay` |
| `delivery.pointIblockId`, `.addressPropertyCode` | Для собственного самовывоза (Sale-провайдер): ID инфоблока точек и код свойства адреса |
| `delivery.cdekCityCode`, `.yandexGeoId` | Реальные коды городов у CDEK/Yandex для каждого GAR-населённого пункта |
| `delivery.salePointIds[serviceId]` | ID реально активных точек выдачи (не выдумывать) |
| `delivery.cdek.clientId`, `.clientSecret` | **приватное** — учётные данные CDEK (OAuth) |
| `delivery.yandex.token` | **приватное** — токен Yandex Delivery API |
| `delivery.dadata.token` | **приватное** — токен DaData (подсказки адресов) |

## 4. Оплата (Этап 7)

| Ключ | Что нужно |
|---|---|
| `payment.apiKeyFile` | Путь к файлу с новым ключом Яндекс.Pay (**приватное**, не архивным!), режим 0600 |
| `payment.merchantId` | Реальный merchantId в Яндекс.Pay |
| `payment.environment` | `sandbox` или `production` — на каком этапе тестировать |
| `payment.splitMerchantEnabled` | Подтверждение оператора, что договор с мерчантом покрывает Сплит |
| `payment.merchantReceiptsConfirmed` | Подтверждение, что фискализация/чеки настроены реально (ручной чек оператора, не код) |
| `payment.reconcileEnabled` | Включать ли автосинхронизацию `CAPTURED → Sale` |
| `payment.paymentAllowedHosts`, `.returnAllowedHosts` | Точные HTTPS-хосты PSP и редиректов (allowlist, без wildcard) |
| `payment.redirectUrls.onSuccess/onAbort/onError` | Реальные страницы приложения для колбэков |
| `payment.handoff.url`, `.allowedHosts` | Публичный HTTPS-адрес one-time invoice-хэндофа для юрлиц |
| `commerce.paymentAllowedHosts` | Тот же allowlist со стороны CommerceDriver — должен включать handoff-хост отдельно |

## 5. Согласия и юридические версии

| Ключ | Что нужно |
|---|---|
| `legalVersions.privacy.version` / `.sha256` | Актуальная версия и хэш политики конфиденциальности, утверждённые юристами |
| `legalVersions.consent.version` / `.sha256` | То же для пользовательского согласия на обработку ПД |
| Two distinct source consents (checkout) | Точные ID/тексты двух согласий из `site-source/local/ajax/consent-validate.php` — сверить с формулировками в приложении |

## 6. Формы (Этап 4)

| Что нужно |
|---|
| Whitelist: внутренний `formId` (из `mobile/src/forms`) → реальный `CForm`/handler ID в Bitrix, по каждой из 15 форм (`callback`, `quote`, `production-request`, `franchise`, `rent`, `leasing` и т.д.) |
| Реальные списки `required`/`enum` полей форм из БД — сейчас используется эталон из `form-contracts.json`, нужно сверить с боевыми |
| Для возврата: правила `REASONS` (реальный enum причин возврата) |
| Для ЭДО: список `operators` |
| Для экскурсии (`tour`): реальный календарь доступных дат |

## 7. Прочее

| Ключ | Что нужно |
|---|---|
| `ffprobePath` | Путь к бинарнику ffprobe на сервере (валидация видео при загрузке медиа/отзывов) |
| `sourceSecretsReplaced` | Явное подтверждение оператора, что все встроенные в архивный Bitrix-код секреты заменены (чек-лист, не значение) |
| `returns.legacyTemplatesEscaped` | Подтверждение, что патч `source-patches/returns-intake-2026.patch` применён и проверен на изолированном шопе |

---

Разделы 3–4 (CDEK/Yandex/DaData/Яндекс.Pay) — секреты, их нельзя передавать текстом.
Владелец стенда кладёт их прямо в приватную копию `config.example.php` /
`payment-config.example.php` (режим 0600) на сервере интеграции. Для сверки нужны
только non-секретные значения: ID регионов/складов, маппинги GAR, allowlist-хосты.
