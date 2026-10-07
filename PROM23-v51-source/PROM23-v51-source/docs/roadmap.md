# V7 — последовательность передачи в разработку и релиз

11.09.2026. Дорожная карта по master пользователя, с зависимостями и проверяемыми выходами. Это не обещание сроков: штат, staging runtime и договоры провайдеров ещё не подтверждены. Не заменяет [release.md](release.md) — там критерии публикации, сборки и изоляция инфраструктуры.

## Что завершено к handoff V7

- UI и source-backed контент B2C/B2B, формы/кабинет с честными пустыми состояниями; исходные процессы отражены в registry, неизвестные enum не выдуманы.
- `/quick-order`: вставка/ручной ввод до 40 строк SKU+quantity, проверка по snapshot с сохранением неизвестных/дубликатов, передача в форму расчёта через контекстный memory draft ID. Это подготовка спецификации, не загрузка XLSX-файла, live расчёт или создание заказа.
- Snapshot **28 SKU, 10 popular, 23 oldPriceKopecks**, реальные source фото/разделы. Это выборка, не весь ассортимент и не live prices/stock.
- `/api/v1/app-config`, `/api/v1/home`, `/api/v1/catalog`: capabilities, ограниченные server-driven presentation slots, cursor pagination/provenance. HomeFeed уже использует optional home loader; основной catalog store всё ещё использует полный `/api/catalog`. Миграция клиента на pagination **не завершена**.
- В sandbox сравнение до 6, разделённые корзины/история, expectedContext, bounded state, idempotent тестовые orders; consumer UI не выдаёт их за реальные.
- Read-only S2S bridge/диагностика и guard ACTIVE/deletion flag, owner+organization scope; реальное соединение с Bitrix не подтверждено. Исходный архив/production не исправлялись в этом slice.
- Backend discovery/ADR/API/OpenAPI/architecture, privacy/security/store handoff. **49/49 server tests, 5/5 home loader tests, TypeScript** — результаты ограниченного API slice; актуальную полную UI/QA/PHP/сборку фиксирует root в итоговом отчёте.
- Изолированный PHP 8.4.23: **40 policy + 20 revocation PASS**. Общие root-логи на момент handoff: 50 server/preview и 48 mobile; отдельная поздняя проверка спецификации 7/7. Не складывать эти пересекающиеся прогоны в число уникальных тестов. Ссылки и границы в [architecture.md](architecture.md).

**Не выполнено:** настоящие мобильные бинарники iOS/Android; native/store приёмка; live auth/RBAC/checkout/payment, подтверждённые CRM/1С/push/consent/analytics. Write/auth gates закрыты. Веб-экспорт и isolated PHP policy test не означают рабочий staging заказ.

## Порядок работ и критерий выхода

| Этап | Конкретный объём | Зависимости / выход |
|---|---|---|
| P0.1 — передача воспроизводимого V7 | Зафиксировать исходники, lockfile, версии, source provenance, test logs, known limitations; сохранить noindex preview | Получатель собирает тот же web/UI contract; нет production keys/ПД в архиве. Root заканчивает финальную сборку отдельно |
| P0.2 — реальный staging и identity prerequisites | Изолированный Bitrix core/vendor/DB/modules; schema constants/status/price/delivery/payment mappings; pilot users+2orgs; отдельные read-only credentials | Readiness выполняется на staging; чужой/удалённый/отозванный actor запрещён. HTML200 не критерий |
| P0.3 — source blockers перед commerce | CRM TLS verification, event signature/IS_NEW/component events, OTP atomic consume/provider acknowledgement, B2B verified membership, безопасный PSP flow | Изолированные negative/concurrency tests; текущий source raw-card endpoint не используется mobile |
| P1.1 — paginated guest catalog consumer | Ввести отдельный typed public product DTO; подключить cursor API вместо полной загрузки; отмена устаревших запросов, reset при изменении query/city/context, loading/error/cache | `stock:null` остаётся unknown, не 0/999. Страницы без дублей/пропусков; недоступность snapshot не блокирует app shell. Сначала контракт на snapshot, затем тот же DTO на Bitrix |
| P1.2 — live guest catalog/search/product | Адаптер реальных SKU/provider/региональных цен/фасетов, pagination, cache provenance/TTL; сохранить существующий поиск до измерений | Сверка с Bitrix на контрольных SKU/регионах, no-stale-price promise; load/perf на репрезентативном каталоге, не 28 примерах |
| P1.3 — auth и сессии | OTP/optional email flow, refresh rotation/reuse detection, revoke/list devices, SecureStore/biometric unlock, trusted actor binding | Настоящие staging пользователи; OTP rate/concurrency, lost response, logout-all, deletion revocation. Sandbox tokens не мигрируют в identity |
| P1.4 — кабинет с чтением | Собственные профиль/организации/адреса/заказы/документы/уведомления, свежий membership и resource permissions | Два пользователя/две организации, IDOR/context switch/role revoke; чужие данные недоступны; файлы выдаются контролируемо |
| P2.1 — истинный staging checkout slice | Корзина → quote → existing order pipeline → идемпотентный тестовый заказ; реальная доставка/оплата с sandbox credentials | Master §73: home/search/product/cart/auth/checkout/test order через staging API. Проверены price/stock changes, MOQ/кратность/НДС, stale context, retries, unknown outcomes |
| P2.2 — PSP/CRM/1С и документы | Signed PSP callbacks/reconciliation, один CRM pipeline, durable outbox/retry, подтверждённый обмен заказа с 1С и PDF manifest/download | Один заказ → один платёж/сделка, правильные organisation/article/region; сбои downstream не теряют заказ; документы доступны только владельцу |
| P2.3 — формы/consent/deletion | Canonical form enums, safe uploads, versioned ledger, канал/purpose opt-in+revoke, фактический erasure и retention archive | Server receipt обязателен; stale document/duplicate/withdrawal, downstream deletion и backup restore проверены. См. privacy.md |
| P3.1 — подтверждённые B2B возможности | Verified org/RBAC, договорные цены, утверждённые лимиты/отсрочка, approval mapping, quick order CSV/XLSX, reorder preflight, contextual КП/manager | Business-approved grants и state machine; finance/Bitrix/1С reconciliation; CSV/MOQ/price/context ошибки не теряют корзину. См. b2b.md |
| P3.2 — native сервисы и offline | APNs/FCM/RuStore, verified HTTPS links, permissions, maps/camera/QR при необходимости, кеш/частичная загрузка | Реальные устройства и provider credentials; deny/no GMS/offline/reconnect/app-kill; без ложного payment success после deep link |
| P3.3 — наблюдаемость и измерения | Typed analytics taxonomy, authoritative commerce events, PII-safe logs/traces/metrics, native crash/ANR, release markers | SDK/data review, consent gates, staging reconciliation, заданные и измеренные performance budgets. См. analytics.md |
| P4 — магазины | Signed iOS/Android builds, privacy manifests/declarations, deletion URL, reviewer account/flow, accessibility/security/performance/16KB и прочие актуальные gates | Повторная официальная правовая/store проверка перед подачей; staging rollout/rollback и оперативная поддержка. Реальные публикации — отдельное действие |

P0.2/privacy/provider decisions можно готовить параллельно с P1.1. Нельзя ускорять путь, включив checkout до identity/прав/quote/source events. Результат master достигается P2.1 + последующей полной приёмкой, не завершением одной таблицы или frontend-экспорта.

## Следующая узкая задача, которую можно назначить без боевых доступов

**Подключить paginated catalog consumer к уже существующему v1 snapshot API.** Scope: typed parser/loader, отдельный cache/query state, каталог/поиск с next page, retry/reset и тестами; не менять auth/payment/Bitrix. Разделить DTO публичной карточки (`stock:null`, source prices) и авторитетный commerce offer; не приводить типы через `as Product` ради старого stock:number.

Приёмка: limit≤50, 409 cursor reset, быстрый ввод/отмена запроса, город/контекст меняются без перемешивания страниц, пустые/error states, restore cache с provenance, поиск/история сохраняют UX. Измерения на synthetic большой выборке маркируются отдельно; реальный SKU/provider performance остаётся задачей P1.2. Это назначение пока не исполнено данным handoff.

## Пакет входных данных для зависимых этапов

| Решение / вход | Кто предоставляет | Где фиксировать |
|---|---|---|
| Владелец/оператор/обработчики, страны/retention/согласия | Бизнес + профильный юрист + ops | privacy/data-map, processing-register, утверждённые документы/версии |
| Bitrix core/modules/DB schema, статусы, enum, цены/доставка/pay systems | Разработчик действующего магазина | integrations mapping и staging readiness, без секретов в handoff |
| Verified B2B membership/roles/approval/договорные условия | Владелец B2B + finance | b2b.md → утверждённая permission/state matrix |
| PSP/касса/перевозчики/CRM/1С контуры и тестовые сценарии | Commerce/finance/integration owners | Server-only config references, acceptance log; не значения credentials |
| Bundle/package IDs, developer accounts, signing, push/app links | Владелец приложений + release engineer | Release configuration/secret store/association files после согласования |
| Минимальные ОС/устройства/perf budgets/штат | Product + mobile/QA | ADR acceptance spikes, device matrix, release checklist |
| Analytics definitions/provider/data policy | Product + privacy + backend/finance | analytics.md, SDK register, metric catalogue |

## Ограничения инфраструктуры и результата

`zavod-antibpla.ru` остаётся отдельным защищаемым production-контуром. Нельзя использовать его webhook/БД/каталог/credentials или менять DNS/конфигурацию ради приложения. Root отдельно готовит изолированный frontend release `v0.7-20260911-01` (на время handoff pending QA), с отдельным preview proxy 18087 и loopback Node API. Preview и будущий mobile backend имеют собственные сервисы/порты/DB/resource limits и rollback; публикация в магазине не следует автоматически из размещения preview. EAS non-preview hook fail closed, signing и native binaries пока заблокированы.

На каждом этапе отчёт содержит реализованный сценарий, конкретные test logs, ограничения и следующий gate. Не писать «весь функционал сохранён», «готово к магазинам» или «как WB по скорости», пока это не подтверждено полной матрицей parity и проверками на реальном backend/устройствах.
