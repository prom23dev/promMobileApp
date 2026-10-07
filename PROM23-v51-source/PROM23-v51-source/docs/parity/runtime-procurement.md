# Заявка на закупку: исходный процесс и подключение

Проверено 12.09.2026. Статус: **PARTIAL — код UI/контракт/адаптер реализован и локально проверен; запись в Bitrix, передача файлов в CRM и очередь почты ещё не проверены на подключённом runtime**. Локальные ответы contract doubles не означают живую приёмку.

## Источник и сохранённые поля

`site-source/local/ajax/form/get-business-advice-form-action.php` требует `first-name`, `phone`, `email`, `company-name`, `comment-text`, `agree_policy`, `agree_consent`. Он создаёт запись `HLBL_ID_BUSINESS_ADVICE_REQUESTS`, вызывает `Bitrix24Webhook::addBusinessHelp` и событие `NEW_BUSINESS_ADVICE_REQUEST`. Исходный business handler не читает `$_FILES`; направлять туда mobile файлы напрямую означало бы потерять их.

Новая форма сохраняет этот business-процесс. **Email и компания теперь обязательны и в UI**. ИНН в исходной форме отсутствует, поэтому он остаётся необязательным и сохраняется в комментарии, а не в выдуманном HL-поле. Выбор «Есть список / Нужен подбор», текст потребности, точный ГАР и версия выбора, buyer context сохраняются там же. Организация берётся из проверенного actor; введённая строка компании не даёт никаких корпоративных полномочий.

`procurement` — derived contract на основе `quote`, добавленный в обе server/runtime JSON registry. Это не 65-я обнаруженная исходная форма: source count остаётся 64 базовых +4 aliases, дополнительно один derived mobile flow.

## Контракт

Контекст: `POST /api/v1/forms/procurement/context` с `{context}`; ответ содержит `revision`. Upload использует существующие `/api/v1/uploads/{create,chunk,complete,delete}`, `formId=procurement`, `fieldName=files[]`, тот же context. URI устройства не отправляется как успешный upload.

Отправка: `POST /api/v1/procurement/submit`, стабильный `Idempotency-Key`, body:

```json
{
  "context": "business",
  "revision": "<runtime revision>",
  "values": {
    "first-name": "<имя>", "phone": "<телефон>", "email": "<email>",
    "company-name": "<компания>", "inn": "", "comment-text": "", "mode": "list",
    "files[]": [{"uploadToken":"<проверенный токен>","name":"need.pdf","size":123}],
    "location": {"settlementId":"<ГАР UUID>","version":2}
  },
  "consents": ["<обе отдельные exact source consent records>"]
}
```

BFF `createProcurementService({runtime,getSession,getLocation}).submit(session,body,key)` повторно проверяет schema, текущую сессию/context/GAR после async-load. Authoritative `location.settlement` и sessionKey добавляет BFF. PHP повторно связывает actor/context, resolves exact GAR через `LocationDriver`, проверяет revision, все поля и exact consents; ConsentLedger фиксирует версии документов перед эффектом.

Ответ только `{status:'accepted',reference:'business-<реальный HL ID>',deliveryStatus:'complete'|'pending'}`. `complete` означает подтверждённый CRM lead и постановку почтового события в очередь, не получение письма человеком. `pending` означает, что запись/файлы сохранены, но один из каналов не подтверждён. UI показывает номер и предотвращает повтор принятой заявки. Неправильный/missing reference не превращается в success.

## Вложения и гарантия сохранения

До 10 файлов по 20 МиБ: PDF, XLS/XLSX/CSV, DOC/DOCX, JPEG/PNG/WebP. UploadDriver проверяет содержимое, тип и scope. Два различных файла с одинаковыми именами/размером больше не отбрасываются UI молча; повтор того же URI объясняется ошибкой.

`ProcurementDriver` разрешает все upload tokens до записи, сверяет размер/имя. Файлы сохраняются существующим `CFile::SaveFile` в `business-advice-requests`. Comment содержит все реальные CFile IDs, имена, размеры и SHA-256. Sidecar `prom23_procurement` связывает запись, manifest и состояние обработки. В CRM идут все bytes в существующее общее lead-file поле `UF_CRM_1776267327660` (подтверждено source supplier/review mappings); это **не вызов supplier pipeline**. В почтовое событие передаются те же CFile IDs через `FILE`.

При неясном результате HL-записи файлы сохраняются для reconciliation; при подтверждённом сохранении номер возвращается даже при сбое последующих каналов. Перед внешними вызовами durable state уже pending; автоматических повторов lead/email нет. RequestLedger сохраняет общую idempotency, отдельная таблица держит состояние pipeline. Нет распределённой атомарной транзакции между SQLite, Bitrix и CRM: прерывание после эффекта требует сверки по reference/origin, а не повтора.

## Защита исходной интеграции

Обнаружено: source `Bitrix24Webhook::sendRequest` отключает TLS verification, передаёт без файлов контактные поля через GET query, частично пишет COMMENTS в error log. Новый driver сохраняет тот же `crm.lead.add`/business mapping, но использует HTTPS **POST**, peer/host verification, запрет redirect, limit ответа 1 МиБ и timeout, без логирования payload/URL с webhook. Дополнительный lead не создаётся; `ORIGINATOR_ID/ORIGIN_ID` связывают его с HL reference.

Server-only config вне webroot:

- существующие `key`, `pdo`, `uploadDirectory`, `formContracts`, `legalVersions`, `location.externalServiceCode`;
- `enabledOperations`: forms.context, uploads.*, procurement.submit — только необходимые разрешённые операции;
- `enabledForms` включает `procurement`;
- `sourceSecretsReplaced=true` только после замены исходных credentials;
- `procurement.crmWebhookUrl`: HTTPS base `/rest/<userId>/<new-token>/`;
- `procurement.allowedCrmHosts`: точный нижний регистр разрешённых hostname;
- Bitrix константы/схема business HL, CFile, региональные GAR locations, source mail template/event и фактическое существование lead-file поля.

Ключи/URL с секретом в repo не добавлены. CFile следует модели хранения исходного сайта; права доступа и lifecycle файлов/sidecar, размер почтовых вложений и provider limits требуют проверки на реальной конфигурации. Текущий UploadDriver имеет общую storage-quota 100 МиБ; «10×20 МиБ» — ограничения отдельных файлов/количества, не обещание одновременной приёмки 200 МиБ. При исчерпании quota возвращается rate limit, файлы не считаются отправленными.

## Доказательства и остаток

- `mobile/tests/procurement-api.test.ts`: фактические bytes Blob→chunks→verified token→submit, все поля, exact consents, context change, timeout и malformed accepted. Только injectable isolated transport.
- `server/test/procurement-service.test.mjs`: required, files/type/count/token, exact consents, reference/status, authoritative GAR, schema/context/session changes. Только isolated runtime double.
- Mobile **83/83**, server **141/141**, TSC PASS: `evidence/recovery-mobile-procurement.log`, `evidence/recovery-server-procurement-node22.log`. Ошибочный запуск system Node20 не имел node:sqlite; его init failures сохранены отдельно в `recovery-server-procurement.log` и не являются дефектами приложения.
- `integrations/runtime/test/ProcurementDriver.test.php`: pure field/scope/consent/manifest/endpoint checks; отдельный isolated PHP CLI прогон выполняет root. Live CFile/HL/SQLite crash recovery/CRM/mail явно не проверены, не объявлены PASS.
- Реальный просмотр результата после включения runtime, quota/большие файлы, потеря связи после подтверждённой записи, actual CRM field acceptance и очередь почты — нужны интеграционные проверки программистов. Изоляционный P0.6 UI/BFF flow этим не заменяется.

Официальная документация, проверено 12.09.2026: [Bitrix Event::send и FILE IDs](https://dev.1c-bitrix.ru/api_d7/bitrix/main/mail/event/send.php), [CEvent::Send — событие в очереди, не факт доставки](https://www.dev.1c-bitrix.ru/api_help/main/reference/cevent/send.php).
