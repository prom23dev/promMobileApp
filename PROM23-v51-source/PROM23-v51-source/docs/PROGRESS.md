# PROGRESS.md

Последнее обновление:  
2026-09-12T07:53:30.509145+03:00

Автор последнего изменения:  
Codex / developer

---

# CURRENT STATUS

Project phase:

B2B заявки и партнёрские страницы — VERIFIED, release v0.10-20260912-05.

Current sprint:

см. `docs/CURRENT_TASK.md`.

---

# IMPORTANT

Этот файл является handoff между:

- сессиями;
- агентами;
- context compaction.

Перед продолжением работы сначала прочитать весь файл.

---

# COMPLETED

Пока не считать предыдущие UI-итерации принятыми автоматически.

Фактически проверенное завершённое:

- [x] Source inventory.
- [x] Web page inventory.
- [x] Form inventory.
- [x] Function inventory.
- [x] Integration inventory.
- [x] Menu inventory.

---

# CURRENTLY WORKING ON

Текущее поручение по заявке, сотрудничеству и франшизе выполнено и опубликовано в v0.10-20260912-05. Quick-order удалён по прямому решению владельца; не восстанавливать из старого backlog. Подробности: parity/PARTNER_PAGES_05.md. Следующий отдельный шаг: FAQ PAGE; полный recovery и реальные интеграции не объявлены завершёнными.

---

# РЕЕСТР ЗАМЕЧАНИЙ ПОЛЬЗОВАТЕЛЯ — ТРЕБУЕТ ПОВТОРНОЙ ПРОВЕРКИ

Это исходный список из пакета требований, а не утверждение, что каждая проблема
воспроизводится в текущей сборке. Статусы устанавливаются по новому аудиту.

## Navigation

- global menu потерян / требует проверки;
- bottom navigation исчезает на content/service pages;
- часть screens является navigation dead-end.

## Cart

- после add-to-cart путь в корзину недостаточно очевиден;
- cart должен быть глобальным App Shell section.

## B2C/B2B

- переключение контекста потеряно / требует восстановления.

## Checkout

Текущая версия требует полного аудита.

Из замечаний пользователя:

- отсутствует полный B2C/B2B choice;
- отсутствуют часть payment methods;
- отсутствует/неочевиден Split;
- delivery presentation непонятен;
- нет полноценного выбора delivery;
- promo code пропал;
- total recalculation работает неверно или отсутствует.

## Location

- free-text city selection недопустим;
- требуется structured FIAS/GAR flow.

## Content

- часть service pages исчезла;
- About урезан;
- content pages слишком текстовые.

## Home

Проблемные текущие sections:

- Hero/banner;
- «Покупать проще, когда всё рядом»;
- «Что планируете делать?»;
- «От выбора до получения»;
- B2B слишком поздно;
- Production недопредставлен;
- About слишком поздно.

## Product cards

- title/price/payment/delivery/CTA vertical alignment нестабильный.

---

# USER-APPROVED PRODUCT DIRECTION

## Home

Commerce first.

B2B раньше.

Production раньше.

About/trust раньше.

## B2C

Полноценный основной consumer experience.

## B2B

Полноценный parallel context.

## Navigation

Единый App Shell.

## Content

Не текстовые простыни.

## Parity

Не терять страницы / формы / функции сайта.

---

# NEXT EXACT STEPS

1. FAQ PAGE — следующий экран по focused-поручению пользователя.
2. Catalog/document/commerce backlog остаётся в реестре recovery; текущий спринт его не расширял.

---

# BLOCKERS

## Production Bitrix

Нет доступа.

Это ожидаемо.

Не считать blocker для анализа source code.

## External integrations

Проверять индивидуально.

Если нет credentials, статус `BLOCKED_BY_EXTERNAL_ACCESS` разрешён только после
реализации UI, adapter, contract, конфигурации и обработки ошибок. Отсутствующий код
остаётся MISSING/PARTIAL, даже если production runtime также недоступен.

---

# FILES CHANGED IN CURRENT SESSION

При каждой сессии заполнять:

- `path`
- что изменено;
- почему.

---

# TESTS RUN

При каждой сессии записывать:

- test;
- result;
- failure.

---

# DO NOT FORGET

Перед завершением сессии:

1. обновить этот файл;
2. отметить следующий конкретный шаг;
3. записать blockers;
4. записать изменённые файлы;
5. не оставлять состояние только в chat response.


## Сессия 2026-09-12T02:00:07+03:00 — импорт пакета контекста

Сделано:
- Проверено содержимое ZIP: восемь текстовых файлов, пути безопасны.
- Установлены все восемь файлов; одноимённых файлов в корне проекта и docs ранее не было.
- Сохранена неизменённая распаковка исходного пакета.
- Скопирован полный recovery-промпт (48 разделов) в `docs/parity/MASTER_PROMPT_RECOVERY.txt`.
- Зафиксированы запрет изменений боевого сайта/DNS, равнозначность B2C/B2B и отсутствие production Bitrix.
- Уточнено, что перечень регрессий из шаблона требует проверки, а не является результатом тестирования.

Изменены: `AGENTS.md`, `START_CODEX.txt`, `RECOVERY_AFTER_COMPACTION.txt`,
`docs/PARITY_REQUIREMENTS.md`, `docs/ACCEPTANCE_CHECKLIST.md`, `docs/CURRENT_TASK.md`,
`docs/DECISIONS.md`, `docs/PROGRESS.md`; добавлен полный бриф recovery.

Проверки: целостность ZIP, наличие всех восьми целевых файлов, сохранность исходных
файлов пакета и всех строк checklist. Тесты приложения в рамках импорта документации
не запускались; код и сервер импортом не изменяются.

Не завершено: пять полных реестров parity, восстановление обнаруженных потерь,
новая приёмка и развёртывание. Ни один критерий приложения автоматически не закрыт.
Следующий конкретный шаг: продолжить source/web audit и заполнить пять реестров.


## Recovery execution started — 12.09.2026

Git checkpoint root: `a4148b3935e9d866c0eed85ea61d469e1a05a494`, tag `recovery-baseline-2026-09-12`. Existing nested mobile repository checkpoint: `27a79c5ed00e7da021aa709a6f5215927a757715`, tag `recovery-start-2026-09-12`. Both histories are local; original source, dependencies, runtime DB and credentials excluded.

Source credential scan: 1862 files; 5 known source literals, none in app artifacts. No credential values logged. Git checkpoint is created before recovery code changes. New source findings are in `docs/parity/checkout-source.md`.

User continuation: perform P0.1 navigation → P0.2 context → P0.3 cart → P0.4 checkout → P0.5 location → P0.6 forms; test and record each, do not stop at audit.

## Независимый функциональный аудит recovery — 12.09.2026, QA

Сделано: `docs/parity/functions.md` и `functions.json` содержат 140 конкретных строк:76 функций +64 базовых form flows (4 alias не увеличивают счётчик). В baseline опубликованной f511:14 MISSING,117 PARTIAL,6 LEGACY_REVIEW и3 COMPLETE только для ограниченного проверенного поведения. Не приравнивается к приёмке проекта.

Полный технический scan custom classes/helpers дал4612 public method symbols;126 AJAX handlers сопоставлены функциям в `docs/parity/evidence/source-handler-capability-map.json`. Это технические символы, а не4612 пользовательских функции. Файлы route inventory:101TSX,8 infrastructure,93 wrappers,24 уникальных app patterns +framework fallback,68 повторных wrappers для отдельных retained stacks.

Свежая isolated guest проверка:10 app routes и5 read-only source web routes; PDP→badge1→корзина1tap; qty2→reload сохраняется;0pageerrors. В наполненной корзине нет купона; checkout delivery/payment disabled; site form/workspace/commerce loaders остаются заглушками. `/order/` временного сайта без авторизации перенаправляет на `/personal/cart/` (вход); чужие/authenticated данные не проверялись. Прямых вызовов реальных форм/заказов/платежей/телефона нет.

`docs/parity/gaps.md` содержит9 приоритетных tickets и отдельно невоспроизведённые жалобы. Дополнительно подтверждены source SKU offer и групповой delete_multiple; это ещё две отсутствующие возможности. Source купонный контроллер содержит вызовы отсутствующих методов/неполную выборку — нельзя слепо копировать ошибку.

Изменены только docs и audit scripts (`audit-functions-recovery.cjs`, `inventory-functions-recovery.py`, `browser-recovery-p01.cjs`). App/server код этой подзадачей не изменялся. Root параллельно восстанавливает P0.1.

Следующий шаг: окончательная P0.1 регрессия на frozen локальном export. Промежуточная15f6:46PASS,4 расхождения из-за изменения40→42 меню во время теста,1 реальный gap — из меню→Избранное нет UI Back. Root уведомлён. После исправления — приёмка P0.1 и переход к P0.2. Отсутствие production runtime не является оправданием ещё не написанного transport.

## Recovery implementation — продолжение 12.09.2026

Созданы реальные реестры и заполнены template-таблицы PARITY_REQUIREMENTS данными:75 route families,68 form definitions(64+4alias),140 function rows,24 integration groups. Crawl URL продолжается; числа потерь entity публикуются отдельно и не маскируются числом route patterns.

Код: navigation-menu/MoreScreen/primitives/CatalogScreen —41пункт меню, call/search отдельно, Back вИзбранном, footer social links. buyer-context/BuyerContextSwitch/store — personal/business carts иverified organization select. commerce-recovery/app — scoped coupon/quote/options/submit/payment routes, source payment IDs, currency/line arithmetic/expiry/CAS/consent validation, удаление drafts при DELETE session. CheckoutScreen/CartCoupon/CartScreen/FormRoute — отдельныйcheckout, купон, GAR, выборпункта/перевозчика, подтверждённыйитог, paymenthandoff, правильныймаршрутcheckout. Contentagent восстановил production departments/projects/brands/documents/checkoutguide; это не весь контент.

Проверки: независимые HTTP-тесты нашли3дефекта (неверныеquoteitems, orphanaddressdraft, arbitraryconsent); все3исправлены. Повторный targeted HTTP+commerce+legacyAPI:56/56PASS (`parity/evidence/recovery-http-fixed.log`). Старые assertions расширены новой business-веткой, остальные сохранены. Mobile suite ранее1FAIL поlegacy shape searches; ожидаемаяbusinessветка добавлена. Следующий fullsuite выполняется послеoptions/forms wiring. Положительные runtime fixtures — только in-process contract doubles, не реальные заказы.

Не завершено: полная очередьcrawl; SourceCommerceDriver/Forms/Auth/Uploads wrappers, новыйUIклик-through, полнаякаталожнаявыгрузка, полнаяcontentparity. Public18087ещёV9; измененийprotectedproduction/DNSнет. P0/Sprint и проект НЕ объявленыготовыми.
Следующийконкретныйшаг: typedauthcontinuation+formsrevisionUI, runtimewiring, frozenexportи320/390UIпроверка, затемизолированноеразвёртываниепослепроверок.

## Recovery QA / source commerce adapter — 12.09.2026

Независимые HTTP/BFF проверки после трёх исправлений root и pickup option fixture: 117/117 PASS (`docs/parity/evidence/recovery-server-suite-final.log`), положительные внешние ответы только in-process contract doubles. Дальнейший critical review добавил ещё3 сценария: expired quote и unsafe/expired PSP URLs проходят, обнаружен реальный P1 — quote.paymentId не сопоставляется с выбранным payment, personal online мог подтвердить invoice16. Отрицательный test сохранён; root уведомлён. Intermediate 19/20 в `recovery-http-critical.log`, не скрывать этот FAIL старым117PASS.

Добавлен `integrations/runtime/src/CommerceDriver.php`: источник Sale, live regional prices/warehouse/restrictions, transient basket без перезаписи website FUSER, scoped price/coupon engine, typed actor/context, quote TTL+durable pending, canonical consent receipt, один Sale save, ownership PSP handoff. `docs/parity/runtime-commerce.md` отдельно перечисляет MISSING_IMPLEMENTATION provider callbacks (points/address binding/Split/offer/HTML invoice handoff), required GAR-regions/Sale location/consent config и live unverified scope. Операции не объявлены полностью подключёнными.

Root выполнил только isolated PHP8.4 CLI: lint3files PASS,45policy assertions PASS. SQLite PDO отсутствует,3quote-store assertions SKIP; тест теперь печатает явный SKIP. Bitrix/DB/PSP не подключались. Общие серверные extensions не изменялись. Следующий шаг: root исправляет payment binding, QA повторяет targetedHTTP; затем frozen browser recovery flow и только после этого scoped acceptance.

## Recovery P0 regression and forms — 12.09.2026

Frozen menu verification:82/82 source menu transitions at320/390, bottom navigation/cart and UI Back present,0pageerrors. Separate content retry4/4 corrected label selectors. Critical HTTP21/21 after payment/sourceoption identity fixes. Browser checkout exposed accidental spread of coupon/quote draft fields into request; fixed with pickCheckoutChoices. Coupon reload preserves unsaved address. PSP handoff ignores outdated buyer responses. Mobile75tests/typecheck/export PASS before upcoming GAR forms changes.

Form transport now uploads only scoped binary chunks without leaking unrelated values/passwords; stable retry idempotency, context revision, actual accepted/next-step/authenticated responses. Missing accepted reference validation fixed. GAR forms require structured identity for profile-city/address-create/address-edit; LocationDriver resolves exact source ExternalTable FIAS/GAR UUID to SaleCODE, no name lookup or invented postcode. Runtime configuration and Bitrix execution remain unverified.

Still in progress: composite profile/organization/return/workspace drivers, full crawl, checkout browser recheck, isolated release. Production and DNS unchanged. Next: complete these drivers and run fresh regression before deployment.

## Recovery P0.6 profile adapter — 12.09.2026

Root исправил quote.paymentId и deliveryOptionId binding: новый focused HTTP21/21 PASS (`recovery-http-critical-fixed.log`). Предыдущий19/20 FAIL сохранён как evidence. Commerce consent recorder согласован с единым ConsentLedger backend-агента; дубль локальной таблицы согласий убран. В PHP test явный SKIP3 для pdo_sqlite.

Добавлены `integrations/runtime/src/ProfileDriver.php` и `test/ProfileDriver.test.php`, `docs/parity/runtime-profile.md`. Точный scope13 registryID:7 изменений профиля+passport legacy,4адреса,notification preferences. Точечный actor-owned CUser, source OTP stages через ChallengeVault/CheckedConfirmationCodes, fresh address ownership/revision, отдельные GAR/LOCATION_CODE/ZIP, strictbool subscription rubrics без отправки сообщений. Business без verified organization не редактирует личную адресную книгу. Паспорта не собираются: вsource нет handler.

Политики проверяются собственными CUser/address/Location doubles; real Bitrix/OTP/subscribe не вызываются. Root получил запрос isolated PHP lint/policy. Следующий шаг: результаты CLI, wiring FormsDriver/backend GAR validation и browser recovery; production интеграции/sidecar target-runtime acceptance остаются непроверенными. UI этой подзадачей не изменялся, server/DNS/боевой сайт не затрагивались.

## Recovery forms and browser verification — 12.09.2026

Mobile79/79 PASS включая4 новых upload boundary cases (binary chunks, scope privacy, revoke, retry token reuse). Server134/134 PASS. Checkout320/39036/36PASS; повтор после ожидания закрытия location modal36/36PASS. Скриншоты:parity/evidence/commerce-ui. Profile PHP53/53 иCommerce45/45isolated policyPASS;3SQLitecasesSKIP без изменения sharedextensions.

AccountActionDriver добавляет sourceaccountdelete marker спроверкойCUserUpdate, current/other session termination, ownedcontext savedcard default/remove. Source некорректные always-successpaths не копируются. ОтдельноdefaultcardисключаетPANизDTO. Procurementпереноситсявсобственныйsourcebusinesspipelineсфайлами,а не supplierформа. БраузерныйCSPразрешилimgтолькоexactprom.myfast.space,скрипты/connectбезрасширения.

Следующийшаг: завершитьreviews/account/procurementpolicyпроверки, обновитьfrozenexport, проверитьконтентныефото, собратьизолированныйрелизсrollback.

## Procurement source parity — 12.09.2026, QA implementation

Добавлен derived mobile procurement contract на основе source business advice; source64 форм +4aliases не увеличены новой «исходной» формой. Исправлены обязательность email/company, передача mode/ИНН/GAR/context и всех файлов; одинаковые имена/размеры не теряют разные вложения. UI хранит поля при ошибке, стабильный idempotency key при retry, проверяет context/location во время upload, показывает только реальный HL reference и отдельно pending downstream, не предлагает повтор принятого обращения.

Код: mobile/src/procurement.ts, api/procurement.ts, screens/ProcurementScreen.tsx; server/integrations/procurement-service.mjs; integrations/runtime/src/ProcurementDriver.php; derived JSON entry в server/runtime form-contracts. Root добавил app route; backend делегировал FormsDriver/endpoint. Source business HL + CFile manifest + один business lead + source mail FILE IDs; никакого supplier-handler substitution. Найден небезопасный source CRM transport (TLS off, GET с контактами, COMMENTS log); новый wrapper использует тот же lead method/mapping с TLS POST без redirect/payload logging. Credentials не считывались/не переносились.

Проверки: TSC PASS, mobile83/83, server141/141 (bundled Node). Сохранены logs recovery-mobile-procurement.log / recovery-server-procurement-node22.log. System Node20 запуск не поддержал node:sqlite; initial log не скрыт. Новый PHP policy файл готов root для isolated CLI; live Bitrix/CRM/mail/SQLite crash recovery не запускались. Предыдущий ProfileDriver получил root isolated53/53PASS в php-policy-recovery02.log, это не live acceptance.

Документ: docs/parity/runtime-procurement.md с точным DTO, source mapping, конфигурацией, безопасностью, квотой upload и непроверенным остатком. Следующий шаг: root isolated PHP lint/policy, frozen web export и UI проверка новой формы без реальной отправки; source runtime integration выполняется после подключения программистами. Паритет всего приложения не объявлен завершённым.

## Независимая HTTP-регрессия действий форм — 12.09.2026

Добавлен server/test/form-side-effects.test.mjs: repeat-order validated cart+CAS, no unknown/fractional/duplicate products, own-only account/session state+commerce-draft cleanup, сохранение чужой сессии и independent carts, active organization removal. Первый6/7 обнаружил реальный P1: accepted account-delete без loggedOut/сfalse и sessions-terminate безфлага. Backend исправил строгую нормализацию; повтор7/7 PASS, полный server148/148 PASS на bundled Node. Артефакты: docs/parity/evidence/form-side-effects.md, initial/fixed logs, recovery-server-side-effects-final.log. Все side effects в отдельной test DB с runtime doubles; реальных аккаунтов/организаций не изменяли. App код этой QA-подзадачей не менялся.

Следующий шаг: root завершает isolated PHP lint/policy и frozen UI browser smoke. Никакого расширенного повторного crawl без нового риска не запускали.

## Подсказки адреса checkout: независимая HTTP-проверка — 12.09.2026

server/test/checkout-address-suggestions.test.mjs проверяет query/response shape, exact GAR/context/version, удаление raw provider metadata, malformed/empty/result errors, late response CAS после смены режима/города/версии и удаления сессии. Первый7/8 выявил выбираемый пустой address:'   '; root добавил trim-length guard. Повтор8/8 PASS, full server156/156 PASS на bundled Node. Evidence: docs/parity/evidence/checkout-address-suggestions.md, initial/fixed logs, recovery-server-address-final.log. Провайдер не вызывался; все runtime ответы — явные doubles, apps/DB изолированы. Source adapter/root browser acceptance учитываются отдельно. QA code scope — только новый test, app/server не изменены.

## Recovery release and verified protection — 12.09.2026

Published `v0.10-20260912-01` on the existing isolated 18087 service. Artifact SHA256 `0eb57c715a08c528f4b7d8f08eb478d742f90392ed108376ec3a47c28a00e8d3`,252 content files verified against manifest. Own SQLite backup `before-v0.10-20260912-01.sqlite`; previous symlink target v0.9-20260911-01 retained. Only `systemctl --user restart prom23-preview.service` performed. No DNS/shared service/site changes. Protected baseline comparison:82 theme hashes unchanged, nginx/apache2/MariaDB process IDs/start timestamps unchanged, HTTPS200. Evidence:parity/evidence/deploy-recovery01.log and production-protection-recovery01.json.

Additional code: `BottomNavigation.tsx` no longer hides tabs on auth/payment source forms; keyboard-only hiding remains. `CheckoutScreen.tsx` exact address lookup/explicit canonical selection; BFF `checkout.addresses` uses selected GAR/version/context, rejects whitespace/unsafe shapes and late context changes. AccountActionDriver captures logout state before source logout. Account-action normalizer requires explicit logout result. Separate source order workspace DTO and actual repeated-cart projection are wired.

Latest checks: mobile83/83+TSC/export PASS; server156/156 including7form side effects and8address checks. Local commerce36/36 and forms30/30 at320/390. PHP04 strict lint28files; Account13, Commerce45, Integration26, Location9, Procurement44, Profile53 policy PASS; Protocol25 separate PASS. PHP05 strict lint30files+Delivery41+Commerce45+Protocol25 PASS. Three SQLite checks SKIP; no extension installation. Final Delivery UUID guard changed after PHP05 snapshot and still requires repeat. No live Bitrix/provider/CRM acceptance inferred. Public browser checks in progress.

Full crawl:4434/4434 URLs,3484HTTP200,950HTTP404,0network errors,0pending. Inventories75route families/68form definitions/140function rows/24integration groups. Catalog still28products;2097successful product URL candidates unmatched (aliases possible),107category/filterURL gaps.28articles retained with179recovered images. UI/content parity and native release are not complete.

Next exact step: complete final source payment/delivery adapter checks, public browser verification and source package; then continue the explicit remaining parity gaps, starting catalog entity recovery from the completed crawl.

## Текущие parity статусы с сохранённым baseline — 12.09.2026, независимый QA

Обновлены functions.json/.md, forms.json/.md и таблицы5/6 PARITY_REQUIREMENTS. Все140function/68form rows сохранили исходные status/assessment/gap и source evidence; byte-for-byte originals находятся в parity/baseline/recovery01 с SHA в evidence/parity-status-reconciliation.json. Current functions:6COMPLETE только NAV01/02/03/05,CTX01,GEO01 в явно ограниченном scope;125PARTIAL,3MISSING,6LEGACY_REVIEW. Before14MISSING/117PARTIAL/6LEGACY/3COMPLETE не стёрты.

Forms65PARTIAL/3LEGACY; live accepted0. У15 точечно ранее проверенных ProfileDriver fields записан exact target и policy evidence;166 не получили независимую повторную field-by-field аттестацию. Callable dispatch69 включает отдельный derived procurement, не увеличивая исходные64+4alias. Actual auth/source transport теперь отражён вместо устаревшего missing Rest/no transport; source bank read-only и отдельный save legacy различены.

Проверены140/68unique IDs, сохранность source/web/controls/consents/hidden/repeated baseline, все текущие локальные ссылки/wiring. Route recount101TSX/8infrastructure/93wrappers/24app patterns+fallback/68retained duplicates. Public UI evidence36commerce+30forms; menu82. PHP/source fixtures не повышены до live acceptance. Pending final Payment/Delivery policy отмечен отдельно; actual offers/Plus/schedule/PDF/fiscalization и подключённые provider acceptance не закрыты. Acceptance checklist и верх PROGRESS этой подзадачей не изменялись. Следующий шаг root: финальная PHPпроверка и sourcepackage, затем текущие явные parity gaps; декоративный redesign не выполнялся.

## Final recovery verification — 12.09.2026

Local export `4891a8ceda8e15fe88c0726b0e7a356f`: commerce38/38 and forms32/32 at320/390 PASS. Independent designer confirmed all4 targeted fixes: wrapping consent links, retained checkout cart/navigation, field-error clearing, single auth failure. No new P0/P1 in the inspected views. Payment status refresh queries the owned source order/provider; receipt orders no longer offer online payment.

`php-policy-recovery06.log`: existing `/opt/php84/bin/php` (SQLite/DOM) strict lint35 files and334 isolated assertions PASS: Account13, Commerce48, Delivery41, Integration26, Location9, Payment75, Procurement44, Profile53, Protocol25. Earlier3 SQLite quote checks now pass; shared extensions were not installed. Live Bitrix/model/provider execution remains NOT_RUN. Payment callbacks wired without overwriting installed callbacks; invoice tickets expire/revoke, CAPTURED reconciliation uses one guarded Sale save. Actual offers/Plus, full PDF/seals/receipt mapping and automatic webhook remain missing implementation.

Field-by-field QA found source mismatches in supplier attachments, quantity1..99, review video and appeal UTF-8 length. Corrections are being implemented before final activation. v0.10-02 artifact uploaded into own incoming folder only, not activated; regenerate after these changes. Published service stillv0.10-01. No protected site/shared/DNS writes.

Next: targeted field tests, final export/package, isolated activation with rollback, public38+32 checks and before/after protection snapshot, then source handoff. Final parity statuses must preserve missing implementations separately from external access.

## Recovery02: bounded field review complete — независимый QA

166/166 controls получили отдельную запись docs/parity/field-mapping-review.json/.md:89 SOURCE_MAPPING_REVIEWED,11 READ_ONLY_SOURCE_MATCH,6 FIXED_CONSTRAINTS,25 DYNAMIC_SCHEMA_REQUIRED,16 CHECKOUT_SEPARATE_SCOPE,2 CHECKOUT_IMPLEMENTATION_GAP,2 VALIDATION_GAP,1 EXISTING_MEDIA_GAP,14 LEGACY_UNMAPPED. Ни один source review не объявлен live acceptance; baseline/runtime flags сохранены. Исправлены4 конкретных дефекта в6 полях, без изменения source handlers/Payment/Commerce/Checkout.

Targeted mobile14/14, BFF13/13, FormFieldValidationPHP30/30 PASS. Root подтвердил полный mobile87/server161/TypeScript PASS, PHP375 assertions/37lint; evidence/php-policy-recovery07.log. Глобальный UploadDriver уже разрешает MIME mp4/mov/webm с ffprobe≤60s; order-review/edit остаются image-only. Question min5/existing-video edit/dynamic schemas/checkout date-time/legacy controls сохранены явными gaps. Код и эти документы frozen для финального source package; дополнительных audit-only расширений не выполнялось.

## Published final recovery candidate — 12.09.2026

Release `v0.10-20260912-02`, bundle `535f05a6d6de9905aa3fddbe37da1c7e`, artifact SHA256 `b97f16b14b474c0f65140524bd028aef9818a215f36fee9b009a2bcfae94e781`.252 content files verified; own state backup before-v0.10-20260912-02.sqlite and previous v0.10-01 retained. Public browser38/38 commerce+32/32 forms PASS,0 page errors; public bundle matches final export. Protected82 theme hashes/shared process IDs and start timestamps unchanged, HTTPS200. Only own preview user service restarted; no DNS/shared website writes.

Final tests:87/87 mobile,161/161 server,TSC/export PASS; PHP07 strict lint37 files/375 isolated assertions PASS. New FormFieldValidation30 and DeliveryPolicy11 included. Source personal delivery policy corrected: clear DELIVERY_SERVICE_TK, retain PICKUP_TK; legal excludes only configured Yandex courier. Source upload/quantity/UTF-8 constraints now match in app/BFF/PHP. Live Bitrix/PSP/CRM/OTP not run; raw originals untouched.

Changed groups: mobile navigation/content/Checkout/Form/Procurement + forms registry/model/API/upload; server buyer-context/commerce/forms/runtime transport; integrations/runtime typed source adapters/config/tests; deployment packager/isolated activation; concrete parity inventories and test evidence. Historical failures/skips remain preserved beside fixed reruns.

Remaining: full catalog/variant IDs (28snapshot products;2097 successful unmatched product URL candidates and107 category/filter gaps), source cart/category bulk actions, authenticated1C document open/download, full invoice PDF/seals, actual Plus/Split offer schedule, receipt integration/automatic PSP webhook, publication pagination/media edit gaps, full content/visual/native/store acceptance. Missing code is not labelled an external access blocker. Connected acceptance of written adapters requires installed Bitrix/config/provider access, as expected by the user's programmer handoff instruction.

## Recovery03: bounded correction — QA code freeze

Question/question-edit minimum5 добавлен в siteForms/formModel, BFF forms-service, signed FormsDriver и оба JSON contracts; Unicode code points после trim. Targeted mobile15/BFF14/TypeScript PASS. PHP FormFieldValidation30→47 проверок готов root. Question replies unchanged. Source date/time перепроверены по delimiters: PHP comment template.php310–394 и статическая June2025;2 ошибочных checkout gap статуса заменены COMMENTED_SOURCE/LEGACY_REVIEW. Existing-video review edit остаётся PARTIAL.166-row report обновлён; предыдущая ревизия сохранена. Код frozen, никаких иных расширений. Следующий шаг root: PHP/final export03 и изолированная публикация; real Bitrix/provider acceptance не выполнялась.

## Recovery03: final field proof and docs freeze — независимый QA

PHP08 proof получен:47/47 FormFieldValidation,30/30 ReviewEditMedia,Payment83;430 assertions/38 lint PASS. SHA FormsDriver/PublicationDriver и обоих целевых тестов сверены с tested manifest.166 уникальных field rows и counts сходятся; live accepted0. Новая media-row — PARTIAL_MEDIA_CONTROLS: existing image/video IDs сохраняются, выборочное удаление прежних вложений ещё не реализовано; live Bitrix storage/concurrency unverified. Minimum5 больше не validation gap; date/time остаются COMMENTED_SOURCE310–394/June2025.

Обновлены field-mapping-review.json/.md, forms.json/.md, runtime-forms.md, gaps.md и PARITY_REQUIREMENTS; предыдущие baseline/append history сохранены. Эта подзадача не меняла код после объявленного freeze. Документы frozen для sourceZIP; следующий шаг — финальная упаковка/root handoff. Новых аудитов и внешних отправок не было.

## Recovery03 — финальный проверенный код сессии

Published v0.10-20260912-03 / bundle b110ad95b168c804629d88775e8880b7. Release SHA256 7580cea669654d3c14aaf41f7e1742cf43bfaeffbb809181879672c7653e92c0. Public38/38 commerce +32/32 forms PASS at320/390,0pageerrors; root visually checked final checkout320 screenshot. Protected82 theme hashes/shared process IDs/starttimes unchanged, HTTPS200. Own previous02 and before-v0.10-20260912-03.sqlite preserved; only own preview service restarted.

Final code tests:88 mobile,162 server,TypeScript/export PASS; PHP08 strict lint38 /430 isolated assertions PASS, including47field constraints,83payment,30reviewmedia. No real Bitrix/provider calls. Historical failures/skips preserved.

Last fixes: question/question-edit trim+Unicode minimum5 on mobile/BFF/PHP; PublicationDriver transaction preserves owned existing media IDs and appends validated images, fresh ownership/revision/no-replies and postconditions, original author metadata retained; PaymentDriver/endpoint only refresh owned invoice tickets and server-saved Split sessions through their own guarded lifecycle instead of replaying a consumed/expired generic ledger result. Other PSP write guards preserved. Source date/time controls proved PHP-commented legacy, not a live missing control.

Files: mobile forms registry/model/tests; server forms service/contracts/tests; integrations/runtime FormsDriver, PublicationDriver, PaymentDriver, endpoint and corresponding tests; package/activation/browser scripts; field/parity/runtime documentation. Full code inventory and unimplemented items remain in parity/RECOVERY_SPRINT_01_REPORT.md. Sprint ACTIVE: catalog/variants, bulk actions, authenticated documents, actual offers/Plus, PDF/fiscalization/webhook, publication pagination and full content/native acceptance remain. These missing implementations are not external-access blockers.

Next exact step: recover the full catalogue from existing crawl into canonical product/offer entities; do not launch decorative redesign. Local preview PID39874 is own preview/index.mjs only.

## Handoff checkpoint

Root implementation commit `c5458d228fbc49d2ed522fd38204018722e8a8f8`; mobile implementation commit `7b29fb5c6daaa7f30effc159f5c13caf64b5c761`. Baseline tags retained. Source ZIP: `deliverables/prom23-mobile-source-recovery01.zip`; manifest hashes and ZIP integrity verified, checksum/size recorded in `docs/source-package-recovery01.json` and ZIP SHA256 sidecar. Credentials, runtime DB, original site source and dependencies excluded. Original failing logs remain verbatim; code/docs whitespace check excludes those captured logs. Large raw crawl evidence stays local outside Git; source-linked manifests and small verification records are committed.

## Focused sprint00 started

Новое поручение14997ac5: только меню/LocationChangeNotice/reusable UI. Найден41 existing menu route/5 групп, Lucide icon system. Notice хранится только в mounted root, но таймер отсутствовал. Backend после смены GAR отзывает quote/options; confirmed revalidation не обещается. Menu entries/routes/source остаются прежними; primary call quick action в меню, contextual header call на остальных экранах. Реализация и focused regression в работе.


## Focused sprint 00 — выполнено и опубликовано 12.09.2026

Релиз `v0.10-20260912-04`, bundle `a9a35a5bad5ba2f5b66a202462dc7a05`, только собственный сервис на `http://159.253.19.172:18087/`. Проверены 252 файла manifest; SHA архива `49bdc0e69e1d2ca6dce0260b70998079f82e4fa992b5f36985440ac647d78c22`. Предыдущий 03 и собственный SQLite backup сохранены.

Изменены:
- `mobile/src/navigation-menu.ts`: 41 типизированная пиктограмма Lucide; все прежние title/route/source и пять групп сохранены.
- `mobile/src/ui/MenuRow.tsx` (новый): компактная строка минимум 54 px, единый stroke 1.7, иконка/название/chevron, перенос длинного названия, pressed/focus feedback; декоративные иконки скрыты от accessibility tree.
- `mobile/src/screens/MoreScreen.tsx`: группы и компактный primary «Позвонить»; прежние маршруты и социальные ссылки сохранены.
- `mobile/src/ui/primitives.tsx`: опция Header.showCall, по умолчанию true; только меню скрывает дублирующую иконку звонка.
- `mobile/src/ui/TransientNotice.tsx` (новый) и `LocationChangeNotice.tsx`: таймер 4000 ms от события, enter 160 ms / exit 140 ms, немедленный X, полное удаление из layout, без persistence/replay, системный Reduce Motion, polite announcement без передачи фокуса. Backend отзывает quote после смены GAR; текст не обещает выполненный пересчёт.
- `scripts/browser-focused00.cjs`, focused00 evidence, release manifest, CURRENT_TASK/DECISIONS/ACCEPTANCE_CHECKLIST и отчёт `parity/FOCUSED_SPRINT_00.md`.

Проверки: локально 137/137 и публично 137/137 при 320/390 px, 0 page errors; 88/88 mobile, TypeScript и Expo web export PASS. Все 41 menu routes реально открыты на каждой ширине; Back, пять tabs и badge сохранены. Проверены timeout, X, navigation/reload, layout, сообщения, отсутствие horizontal overflow и наблюдаемая enter/exit opacity. Reduce Motion при 320 px не содержит промежуточных анимационных значений/смещения.

Визуально просмотрены все десять локальных скриншотов: menu top/middle/bottom и toast visible/dismissed при 320/390. На опубликованном релизе дополнительно просмотрены menu-top и toast-dismissed при 390. Пиктограммы/строки выровнены, плотность и переносы читаемы, нижняя навигация остаётся доступной. Web accessibility semantics проверены; физические VoiceOver/TalkBack устройства в этом спринте не тестировались.

Первичные сбои тестового скрипта (ожидание navigation, пунктуация GAR label и начальное opacity=0 в Reduce Motion) исправлены в assertions/waits; исторические JSON сохранены. В итоговых проверенных сценариях регрессий нет. Защитная сверка: 82 хэша файлов боевого сайта и PID/starttime общих процессов неизменны, HTTPS 200; DNS не менялся. Backend/source и дизайн других страниц не изменялись.

Не завершено: оставшиеся страницы и интеграции из recovery backlog; это не часть focused 00. Blockers для текущего UI-спринта отсутствуют. NEXT: FAQ PAGE.


## Partner pages — работа начата

Новый scope: quick-order removal, procurement label/ИНН, cooperation graphic banners, franchise CTA/benefits/copy. Источники преимуществ: site-source/frontend/h/franchise.php и sitePages.franchise.sections (business model, обучение, прямые поставки, бренд, CRM/маркетинговые материалы). Source runtime/handlers/consents сохраняются. Было: три фото-обложки сотрудничества; generic проекты на франшизе; нет CTA непосредственно после steps. Будет: векторные тематические обложки; преимущества из source; рабочая кнопка partner form после steps.

Дизайн: существующие navy #3D4471, ink #202338, orange #D93916, pale #EDF0F7, white #FFFFFF. Системная типографика проекта, акцент weight800 для заголовков, body15/22. Signature — графика склада/брендовой точки/строительного оборудования. Баннеры отдельно от живого текста, фиксированная пропорция без обрезки фотографий. Карточка: графика → направление → описание → действие.


## Partner pages 05 — проверено и опубликовано

Выполнены все текущие изменения пользователя:
1. Быстрый заказ удалён из меню, кабинета и procurement; старый /quick-order перенаправляет на заявку. Формы с прежним draft при ошибке ведут на /procurement. Старый parser оставлен только для совместимости уже существующих draft, открываемого экрана быстрого заказа больше нет.
2. Меню/CTA: «Отправить заявку на просчет», заголовок формы «Заявка на просчет». У ИНН убрана пометка «необязательно», required-валидация и согласия сохранены.
3. В сотрудничестве три исходные фотографии заменены собственными тематическими SVG-композициями: склад и поставка, торговая точка, спецификация и строительные леса. Текст живой, маршруты трёх направлений сохранены.
4. На франшизе после «Как начать работу» есть CTA формы partner и контакты. ProjectShowcase/CompanyProjectDirectory удалены только с франшизы; вместо них четыре подтверждённых преимущества. Начальная дублирующая сетка преимуществ на франшизе убрана; suppliers остаётся прежним.
5. Заключение: «Станьте партнёром „Промышленника“» и деловое приглашение оставить заявку, узнать условия и задать вопросы.

Код: mobile/src/navigation-menu.ts, screens/AccountScreen.tsx, FormScreen.tsx, ProcurementScreen.tsx, QuickOrderScreen.tsx, ui/CompanyPages.tsx, новый ui/CooperationGraphic.tsx. Документы: CURRENT_TASK, PROGRESS, DECISIONS ADR-031, PARITY_REQUIREMENTS, scoped ACCEPTANCE_CHECKLIST, menu/functions inventories, PARTNER_PAGES_05.md; тест scripts/browser-partner05.cjs, release manifest и partner05 evidence.

Тесты: 134/134 локально и 134/134 публично на 320/390 px, 0 page errors, bundle af47a4ffd3e870a579d37d5bdfcd8830. 80 переходов меню проверены через click+Back с badge; остальные проверки включают redirect, имя формы/ИНН/согласия/отказ пустой заявки, три тематические ссылки, CTA partner с expectedContext=business, контакты, отсутствие проектов/старого текста/overflow. Mobile 88/88, TypeScript/export PASS. Живые формы не отправлялись; вызовы телефона/Bitrix/CRM не выполнялись. Визуально просмотрены баннеры, форма, этапы/CTA, преимущества и заключение на 320/390.

Релиз v0.10-20260912-05 опубликован только в собственном сервисе на 18087; 252 content files verified. Предыдущий 04 и before-v0.10-20260912-05.sqlite сохранены. Protected: 82 theme hashes, shared PID/starttimes без изменений; HTTPS 200; DNS не менялся. Регрессий в проверенных сценариях нет.

Parity решение: B2B05 = REMOVED_BY_USER; baseline сохранён. Текущие counts: 6 COMPLETE / 124 PARTIAL / 3 MISSING / 6 LEGACY_REVIEW / 1 REMOVED_BY_USER. Это не повышение готовности интеграций. Незавершённые остальные recovery-функции остаются в backlog. Для этого поручения blockers нет. NEXT: FAQ PAGE.


## Cooperation06 — начато по новому брифу

Было: три направления, векторные баннеры, BuyerInfoGrid. Сохраняются Business/Suppliers/Franchise, их source content и реальные формы; добавляются видимые входы в существующие procurement list/selection. Source business flow требует имя/телефон/email/компанию/комментарий и два согласия; approved derived procurement сохраняет файлы/ГАР/необязательный ИНН. Upload поддерживает PDF/Excel/CSV/Word/JPEG/PNG/WebP, до10×20МиБ с общей runtime quota100МиБ. Чертёж принимается как PDF/изображение, не DWG. Условную техническую оговорку после supporting copy не показываем: перечисленные форматы поддержаны адаптером; live handler BLOCKED_BY_EXTERNAL_ACCESS. Факты2008/производство/география подтверждены source/site inventory.

Дизайн frontend-design: существующие white/navy/orange/pale tokens; системный шрифт проекта, display26/32 weight800, body15/22, utility12/17. Сигнатура — фотография реального цеха и вертикальная соединяющая линия. Hero→направления с пятью различными ролями→trust narrative→steps→контакты. Цветовой акцент только у specification CTA; action links остальных направлений. Сначала source/form comparison, затем bounded реализация и visual QA.


## Cooperation06 — реализация и локальная проверка

Новый isolated CooperationPage с copy lock49строк, реальным source цехом,5направлениями,6trust items,3steps,Contacts/tel. ScrollY измерения управляют соединяющими линиями/активацией иконок/translate8px; Reduce Motion даёт полностью статичное содержимое. Header.heading выключен только для cooperation ради единственного hero H1.

Procurement API получил optional progress observer подтверждённых chunks; UI показывает имя/размер/процент/проверку/error/retry/remove, сохраняет ввод, не считает upload отправленной заявкой. Обнаружен и исправлен web drag/drop CSP defect: сохраняется File/Blob, чтение bytes больше не fetch(blob:). CSP не ослаблена. Supplier/Franchise переходы передают текущий buyer context: прежний hardcoded business блокировал посетителя в personal. Визуал соседних страниц не изменён.

90/90mobile+TypeScript/export PASS, local134/134browser at320/390,0pageerrors. Source Supplier types/required/consents проверены; браузерные error/success используют исключительно перехваченные fixture API responses. Реальный Bitrix/CRM/mail остаётся BLOCKED_BY_EXTERNAL_ACCESS. Неподключённый runtime не заменён fake success.

Сняты/просмотрены10 требуемых видов и дополнительно form states/motion. Исправлена слишком высокая обложка в web; repeated screenshots проверены. Восемь других экранов oldpublic05↔local06:8/8text-identical,4pixel-identical,остальные имеют малые различия только растровой фотографии; вёрстка/текст сохранены. Release06 упакован253files; публикация и публичная проверка далее. Полный40пунктовый отчёт: parity/COOPERATION_PAGE_06.md. Visual acceptance пользователем не получена.


## Cooperation06 — опубликовано и проверено

Published v0.10-20260912-06 / bundle a00bfc586c42484f5b63ce3c9dbfb82c. Local134/134 и public134/134 при320/390,0pageerrors;90mobile,TypeScript/export PASS.252content hashes проверены;253files archive SHA256 b983f18c2f90e50137c59014132bf798bd5cc5357d9639f6c40f27b3025c0b91. Предыдущий05 и before-v0.10-20260912-06.sqlite сохранены.

Проверены40пунктов брифа,49 основных copy strings,10required visual views плюс states/motion. Публичные hero/specification/final/upload-error390 дополнительно просмотрены. Все8контрольных экранов сохранили тексты/вёрстку. Первый public script wait дляphoto уточнён; исторический report сохранён.

Protected82theme hashes/shared PID/starttime unchanged,HTTPS200;DNS/общие службы не менялись. Развёрнут только own preview. Главная/каталог/карточка/корзина/checkout/about/production/FAQ не редизайнились. Из связанных страниц исправлен только expectedContext переходов supplier/partner.

Список кода: mobile/src/ui/CooperationPage.tsx; CompanyPages.tsx; primitives.tsx; screens/SitePageScreen.tsx,ProcurementScreen.tsx; api/procurement.ts,upload.ts; procurement.ts; ui/FileDropZone.tsx; tests/upload.test.ts. Документы CURRENT_TASK/DECISIONS ADR032/PROGRESS/ACCEPTANCE_CHECKLIST/PARITY_REQUIREMENTS/forms и COOPERATION_PAGE_06.md; browser-cooperation06* scripts, manifests/evidence.

Не завершено: live source Bitrix/CRM/mail и native/device acceptance, прежний общий recovery backlog. Они не объявлены закрытыми этим UI-спринтом. Следующий шаг — визуальная оценка страницы пользователем; иные страницы самостоятельно не редизайнить.


## Delivery07 — начато

Прочитан1510-строчный бриф;71 пункт0–70. Сверены source delivery/index.php (DB content tabs +FAQ), frontend/h/delivery.php (условия), текущие /delivery/ и /contacts/ (curl snapshot). Подтверждены бесплатный подвоз доТК и телефон+7(861)225-00-90. Текущий экран:4декоративных карточки,5disclosure,нет складов/motion. Сохраняются5source доставок в4группах (express/courier/Yandex,terminal/address), исходные условия/контакты/маршруты/App Shell/GAR/context. Источник содержит повторяющиеся FAQ-ответы: условия интегрируются по месту, отдельныйFAQ-дубль не создаётся.

frontend-design: существующие navy#3D4471,ink#202338,orange#D93916,pale#EDF0F7,white#FFFFFF; дополнительный cyan#D7F4F7 из токенов для логистики. Системный шрифт проекта:display28/33 weight800,body15/22,utility12/17. Hero→2×2направления→вертикальная связующая линия→инфографика параметров/маршрута/оплаты/срока→объект→склады. Сигнатура — активация пути груза сверху вниз; никаких придуманных цен/сроков/nearestbranch/карты. App не имеет встроенной карты, сохраняются реальные внешние route links.

Выявлен существующий gap: CartScreen не поддерживает выбор части позиций. Бриф одновременно запрещает менять Cart. Запрошено уточнение границы scope; код доставки продолжается. Это missingimplementation, неexternalblocker.


## Delivery07 — локальная проверка завершена

Внедрены DeliveryPage, DeliveryWarehouses, VerticalReveal и QuestionAnswer. Сохранены 73 из 73 утверждённых строк. Каждый из 71 пункта отдельно рассмотрен в parity/DELIVERY_PAGE_07.md. Просмотрены все 17 требуемых видов скриншотов на ширинах 320 и 390 пикселей. Сохраняются исходные варианты доставки, бесплатный подвоз до ТК, согласование до оплаты, условия погрузки и 18 реальных точек компании. Встроенная карта и отдельный калькулятор не добавлялись.

Финальный локальный прогон: 188/188 проверок, 0 ошибок JavaScript и 0 HTTP 429. Проверены отдельные состояния личной и бизнес-корзины, переходы, поиск складов, общий LocationPicker, анимация раскрытия Q&A и Reduce Motion. Mobile: 90/90 тестов; TypeScript и export проходят. Замер в настольном Chrome: 149 кадров, средний интервал 16,6656 мс, p95 — 16,7 мс, длительных задач нет. Это не проверка на физических iPhone/Android.

Первоначальные массовые прогоны достигали существующего ограничения запросов preview: HTTP 429 и экран «Слишком много действий. Подождите минуту». В тестовый скрипт добавлено ожидание разрешённого повтора и уменьшена частота полных перезагрузок. Серверные лимиты и CSP не менялись. Исторические отчёты сохранены; гипотеза о пересборке не используется как окончательное объяснение сбоя.

Открытый пункт 37: CartScreen не поддерживает выбор части позиций. Бриф одновременно описывает этот сценарий и исключает изменения корзины/checkout. Уточнение границы работ отправлено; ответа пока нет. Это недостающая реализация, а не внешний доступ. Утверждённое описание сценария сохранено, но не считается доказательством его работоспособности.

Далее: завершить сравнение соседних экранов, опубликовать только собственный сервис на 18087, проверить опубликованную сборку и защитную сверку боевого сайта.


### Delivery07 — найден и исправлен сбой Reduce Motion

Первый публичный прогон выполнил все 188 действий, но получил две ошибки React #185 при смене системного предпочтения. Прогон признан неуспешным и сохранён в report-initial-motion-error.json. Отдельный сценарий воспроизвёл ошибку при восьми повторных циклах. Исправлена общая подписка useReducedMotion: один источник состояния useSyncExternalStore и прямой matchMedia с корректной отпиской на web.

После исправления локальные восемь циклов проходят без ошибок. Повторный полный прогон ещё выполняется. Пробная версия с unavailable unstable_batchedUpdates не публиковалась; итоговая реализация не использует этот API.

Защитная сверка после первого размещения: все 82 контролируемых файла и общие процессы совпадают, HTTP-ответ сохранён. Сравнение первых экранов завершено; после ожидания загрузки фото на Home остаётся только различие декодирования до 6/255, без изменения layout.


### Delivery07 — опубликована исправленная сборка

Релиз v0.10-20260912-08, mobile e7fbddc. SHA256 архива: 1e1499d3adb50861d260d527a57cacf76ee03feb67797fca379e91328ad55333. Проверены 252 файла; резервная копия собственной базы before-v0.10-20260912-08.sqlite. Перезапущен только prom23-preview.service.

Финальные local/public: по 188/188 проверок, 0 ошибок JavaScript, 0 HTTP 429. Восемь дополнительных локальных циклов Reduce Motion без ошибок; public проверяет смену предпочтения на обеих ширинах. 90/90 mobile tests, TypeScript/export PASS. Профиль после исправления: p95 16,7 мс, 0 long tasks (настольный Chrome, не гарантия native). Просмотрены все 17 типов снимков на 320/390 и финальные публичные hero/ТК/склад/Q&A.

Боевой сайт: все 82 контролируемых файла неизменны, общие процессы и HTTP-ответ совпадают; DNS не затрагивались. 11 соседних маршрутов сверены. Все 71 пункта брифа отражены в parity/DELIVERY_PAGE_07.md, но пункт 37 (выбор части корзины) НЕ закрыт из-за границы scope. Визуальное одобрение владельцем и внешние интеграции/native-проверки не объявляются выполненными.


### Доставка — точечная правка двух блоков

По запросу владельца изменён только mobile/src/ui/DeliveryPage.tsx: карточки плательщиков получили одинаковую структуру и адаптивную сетку, убрана промежуточная стрелка; у стройплощадки удалена декоративная схема, семь checkbox заменены семью обычными пунктами списка. Условия и тексты сохранены. Изменение списка прямо разрешено владельцем и заменяет прежнее требование интерактивной памятки.

Локально: TypeScript/export PASS; 28 проверок на 320/390/768/1280 px, без JS-ошибок и горизонтального переполнения; остальные тексты доставки совпали с опубликованной версией. Просмотрены мобильные и широкие снимки. Исторический browser-delivery07.cjs обновлён под статический список; весь 188-шаговый сценарий заново не запускался, так как бизнес-логика и остальные блоки не менялись. Размещение и публичная проверка в процессе. Код mobile: 89ef9a5.


Точечная правка доставки опубликована: v0.10-20260912-09. Публично 24/24 проверки, 0 JS-ошибок, адаптив 320/390/768/1280 px. Bundle13971d08a0a1402939433244b7d5daeb совпадает с локальным. Все 82 контролируемых файла боевого сайта, общие процессы и HTTP-ответ неизменны; перезапущен только собственный сервис приложения. Evidence: docs/parity/evidence/delivery08/. Работа в этой области завершена; далее визуальный отзыв владельца. Прежние ограничения интеграций/пункта37 не изменяются.


### Доставка — типографическая иерархия

Изменён только DeliveryPage.tsx: локальные H2/H3/H4, цветовые маркеры и отступы. Проверено 28 условий на 320/390/768/1280 px: размеры и цвет заголовков, единственный H1, отсутствие горизонтального переполнения, прежний статический список, переход к способу доставки, полное совпадение текста с опубликованной страницей. TypeScript/export PASS; скриншоты просмотрены. Публикация в процессе; бизнес-логика и прочие страницы не менялись.


Иерархия заголовков опубликована в v0.10-20260912-10, mobile ae1f228. Публично 24/24 проверки на 320/390/768/1280 px без JS-ошибок; bundle af021ad45fa46ade64a67919901f60f0 совпал с локальным. Проверены 252 файла релиза. Защищённые 82 файла zavod-antibpla.ru, общие процессы и HTTP-ответ не изменились. Перезапускался только prom23-preview.service; DNS не менялись. Результаты и скриншоты: docs/parity/evidence/delivery09/. Работа по типографике завершена; следующий шаг — визуальный отзыв владельца. Общая приёмка и прежние интеграционные ограничения не переопределяются.


### HTML доставки для Битрикс — готовый архив

Экспортирована утверждённая вёрстка v0.10-20260912-10. Архив: /Users/prom23/Downloads/Служебные страницы/доставка.zip; рядом распакованная папка «доставка». 13 файлов: index.html, content.html, вариант одним фрагментом для-вставки.html, изолированный CSS, JS без библиотек, config, две лицензии, два примера PHP-подключения, инструкция и протокол/manifest. Все SVG встроены в HTML. Без React/CDN/зависимости от IP preview.

Самостоятельно работают якоря, фильтр/поиск 18 точек, раскрытие телефонов/часов, ссылки и Reduce Motion. Город/счётчик подключаются к селекторам шапки исходного main; есть setContext для другого шаблона. FAQ не имеет подтверждённого отдельного URL и открывает окно связи с менеджером до назначения адреса; гарантия ведёт на исходный /return/, документы на /details/. Эти границы описаны в инструкции. Корзина/тарифы/CRM не имитируются. Существующий delivery/index.php также обслуживает payment/return и другие вкладки: дана инструкция вставки только в ветку доставки, без замены всего файла.

Проверено: 60 browser checks на 320/390/768/1280, 0 JS-ошибок и 0 внешних HTTP-запросов при открытии file://; 8 проверок DOM шапки, изоляции CSS и no-JS контактов/якорей. PHP runtime отсутствует, установка в действующий Битрикс не выполнялась. ZIP CRC проверен. SHA256: e72f9112303a0eabc38beaeaa1ac387b1b2ffd5d41eeeccd3535373dfff049be. Боевой сервер и приложение при экспорте не изменялись.


### Сотрудничество 11 — выполненный focused sprint

Новый бриф содержит 61 пункт. Четыре верхние карточки прокручивают к бизнесу, изготовлению, поставщикам и франшизе. Спецификация и подбор вложены в B2B. Сохранены все 56 утверждённых текстовых фрагментов, source поля/согласия/handlers и существующий App Shell. Изменены только CooperationPage.tsx и передача scrollRef из SitePageScreen.tsx. Формы не переписаны. У production-request нет file-input в исходнике; новые поля не выдуманы.

Два визуальных прохода: заменён размытый исходник 200×200 на широкое фото обработки металла с сайта, уплотнена сетка направлений и исправлено сжатие стрелок. Просмотрены все 14 требуемых типов снимков, дополнительно финальные public Hero/направления/изготовление. Заголовки H1/H2/H3, шесть параметров изготовления, четыре преимущества, маршрут подбора и пять фактов с вертикальной анимацией. Общие VerticalReveal и Reduce Motion не менялись.

Проверки: 206/206 local, 206/206 public на 320/390; 40/40 дополнительных проверок окончательной сборки на 320/390/768/1280; 90/90 unit; TypeScript/export PASS. Профиль 180 кадров: p95 16,9 мс, 0 long tasks в настольном Chrome, не гарантия native. Формы проверялись с перехватом исходящих запросов и fixtures, без реальных CRM/mail обращений. 11 соседних страниц имеют одинаковый текст; первые экраны Delivery/FAQ/Catalog/Cart/Checkout совпали по пикселям. На остальных небольшие отличия декодирования фотографий, без изменения layout. Промежуточный regression-прогон прервался таймаутом во время пересборки; финально полностью повторён на неизменной сборке и прошёл.

Релиз v0.10-20260912-11, mobile 3d964ae, bundle entry-46d30311149f4d5c08e284caf6896f5e.js. SHA256 архива 6a02ae9da83888f54ec70e7278ca5d86a64b6dacf895f5ffd78c129092ad088e. Проверены 252 файла, резервная копия собственной базы before-v0.10-20260912-11.sqlite. Перезапускался только prom23-preview.service. Боевые 82 контролируемых файла, общие процессы и HTTP-ответ неизменны; DNS не менялись.

Первое размещение остановилось до переключения current: диск оказался заполнен при распаковке. Сначала освобождены 8 архивов-дублей, SHA256 которых совпал с локальными, и удалена только незавершённая распаковка v11. Повторное размещение прошло. По последующему прямому запросу владельца «удали неудачные варианты» удалены 21 устаревшая сборка и ещё 9 архивов-дублей из отдельного каталога приложения. Манифесты сверены с локальными копиями. Сохранены текущая v11 и резервная v10, state/бэкапы базы, локальные исходники/архивы и пакет «Доставка». Освобождено суммарно около 4 ГБ; доступно около 3,8 ГБ. Данные и службы боевого сайта не затрагивались.

Отчёт и сверка всех пунктов: parity/COOPERATION_PAGE_11.md. Evidence: cooperation11, cooperation11-local/public/layout/regression. Внешний Bitrix/CRM/mail остаётся BLOCKED_BY_EXTERNAL_ACCESS. Визуальная приёмка владельцем и native accessibility acceptance не объявляются выполненными. Следующий шаг — отзыв пользователя по опубликованной странице.


### Сотрудничество 12 — работа по отклонённому визуалу

Пользователь не принял v11: сетка и инфографика затруднили чтение. Выполняется только новая линейная подача Cooperation по образцу доставки. Тексты и CTA из последнего сообщения сохранены; формы/routes без изменений. После сборки — проверка порядка copy, mobile/tablet screenshots, всех CTA/якорей и защитное размещение.


Сотрудничество 12 опубликовано: v0.10-20260912-12, mobile 2354e11, bundle entry-90c253597951724d03e29ad520e492a1.js. Изменён только CooperationPage.tsx. Проверено по 168/168 локально и публично на 320/390/768/1280: все 52 актуальных copy-фрагмента, порядок, полноширинная навигация, H1/H2/H3/H4, четыре якоря, семь detail CTA, производство с текущим контекстом, Back/menu/cart badge, Reduce Motion. Ошибок JavaScript нет, TypeScript/export PASS. Формы и backend не менялись, интеграционные тесты и unit-набор прошлого спринта повторно не запускались для изменения оформления.

Скриншоты всех разделов на четырёх ширинах сохранены. Просмотрены hero/направления/бизнес/спецификация/подбор/производство/поставщики/франшиза/факты/связь; дополнительно публичные бизнес и производство на 390 px. Согласованный текст идёт линейно, верхних узких колонок и вспомогательной инфографики нет. Фото и схемы на других страницах не менялись.

252 файла релиза проверены. SHA256 архива a9c04f91270ea72acd5b887ed64b66e17fc3883d24b613e6c3ad91c2cbdfaf64. Проверка свободного места выполнена до размещения, собственная база сохранена в before-v0.10-20260912-12.sqlite, перезапущен только prom23-preview.service. Все 82 защищённых файла, общие процессы и HTTP-ответ zavod-antibpla.ru совпали. DNS не затрагивались. По сохранённому запросу удалить неудачные варианты отклонённая v11 и её incoming-архив удалены после успешной проверки v12; локальная копия сверена по манифесту/SHA256, резервная v10 сохранена. Внешние Bitrix/CRM ограничения прежние; визуальная приёмка владельцем не объявляется. Следующий шаг — визуальный отзыв владельца по v12.


HTML «Сотрудничество» сохранён в /Users/prom23/Downloads/Служебные страницы/сотрудничество.zip: 12 файлов, 24785 байт, SHA256 f38585a3f6cd9dbdefd996a1461367ce74e68f1b4fd528e2b73421ca3bc814d5. Подготовлены автономный index.html, content.html, для-вставки.html, assets, Bitrix include/page-example, инструкция, отчёт и манифест. 279/279 browser PASS на четырёх ширинах + noJS/host fixture/motion; просмотрены mobile/desktop screenshots. Архив CRC и хеши файлов совпали, Delivery SHA256 прежний. Реальный PHP/Битрикс/формы не запускались, границы описаны в инструкции.


Начат Payment13: прочитан полный бриф, текущий InformationScreen, Delivery/Cooperation patterns, source checkout и карточные handlers. Временная /payment/ HTTP200 выводит ошибочно доставку через общий шаблон. Утверждённый copy — основа новой страницы. Официальные документы Пэй/privacy/Сплита проверены. Старый путь хранения номера карты требует live проверки; не переносится в приложение.


## Payment13 — 12.09.2026

Payment13 опубликован: v0.10-20260912-13, mobile9b08a6a, bundleentry-d8aa8c80cb3f66a30b95b02f541db421.js. Четыреmobileфайла; TypeScript/exportweb+iOS+AndroidPASS,563local+563public,3externalclickhandlers. 11соседнихroutesсовпали,Delivery/Cooperationpixel-identical. Все15типовvisualreview просмотрены,16×4screenshotsнаlocal/public. Desktopp95≈16.7ms,неnativeгарантия.493файлаmanifestverified,backupсвоейDB,толькоownunitrestart.82защищённыхфайла/процессы/HTTPнеизменны. Полная72-пунктнаяматрица иреальныеblockers вPAYMENT_PAGE_13.md. Следующийшаг — визуальныйотзыввладельца; liveBitrix/PSPнепроверены.


## Payment14 — компактные ленты и корзина

Новый запрос владельца заменяет прежнее требование вертикальной подачи коротких схем оплаты: сделать горизонтальные ленты, убрать пустое пространство. Дополнительно уплотнить блок личной/корпоративной корзины. Согласованный текст, контексты и действия сохранить. Длинный процесс 01–05 остаётся вертикальным. Только PaymentPage; соседние страницы, архивы HTML и боевой сайт не изменять. Статус: VERIFIED UI, публикация v14.


Payment14 опубликован: v0.10-20260912-14, mobile 2d61807. На локальной и публичной версии прошли по 571 проверке страницы и 98 проверок вёрстки на четырёх ширинах; JS-ошибок нет. TypeScript и web/iOS/Android export прошли. 11 соседних маршрутов сохранились, Delivery/Cooperation визуально идентичны, ZIP-архивы неизменны. Защищённые 82 файла, общие процессы и HTTP совпали. Только собственный сервис обновлён. Отчёт: parity/PAYMENT_PAGE_14.md. Ожидается визуальный отзыв владельца.


## Payment15 — условия счёта и лизинг

По тексту владельца от 12.09.2026 в разделе юрлиц: счёт оплачивается в течение 3 рабочих дней, продление согласуется с менеджером; отгрузка в течение суток после оплаты, кроме товаров под заказ. Добавить отдельную оплату в лизинг: ежемесячные платежи, сумма от 100 000 до 30 000 000 ₽, заявка после регистрации юридического лица. Это новое дополнение к COPY LOCK. Переход — в существующий кабинет организации. Условия предоставлены владельцем; новая платёжная интеграция не создаётся. Сохранить вёрстку v14 и остальные страницы.


Payment15 опубликован: v0.10-20260912-15, mobile 8562591. По 437 проверок локально и публично на четырёх ширинах; TypeScript и web/iOS/Android export прошли. Согласованные сроки оплаты/отгрузки и условия лизинга добавлены, переход в кабинет организации проверен. Публичный тест уточнён: дожидается завершения переключения контекста вместо немедленного чтения старого состояния. Проверено 492 файла по манифесту; резервная v14 и копия собственной базы сохранены. Боевые 82 файла, процессы и HTTP неизменны. Отчёт: parity/PAYMENT_PAGE_15.md.


## HTML «Оплата» — завершено

По запросу владельца Payment v15 выгружен в адаптивный HTML для сайта, по образцу доставки. Архив /Users/prom23/Downloads/Служебные страницы/оплата.zip: 12 файлов, 35400 байт, SHA256 f5e5cb8808aefa3e36771665cb6f48f482f219010ffa8faf57a6e5e9a45c895b. Автономный просмотр, content.html, для-вставки.html, CSS/JS/config, подключение Битрикс, лицензия, инструкция и манифест. 521/521 браузерных проверок; CRC и хеши совпали. Все утверждённые тексты сохранены; корзина без выдуманного количества, счётчик подключается к шаблону, оба раздела B2C/B2B видны. Внешние ссылки и кабинет используют пути Битрикс, FAQ имеет контактный fallback. Страница требует UTF-8; это указано в инструкции. Установка на Битрикс, PHP и реальные платежи не выполнялись. Архивы доставки и сотрудничества неизменны. Приложение и сервер не менялись.


## Оформление заказа 16 — текущая задача

Создать страницу /pages/checkout по образцу утверждённой доставки и полному новому тексту владельца. Пять последовательных шагов, равная видимость B2C/B2B, H1/H2/H3/H4, обычные списки, ссылки на доставку/оплату. COPY LOCK: parity/CHECKOUT_GUIDE_COPY.json. Заявка на лизинг в source требует product-id: CTA открывает объяснение выбора товара и регистрации организации с действующими маршрутами, не пустую неподключённую форму. Только информационная страница и её подключение; настоящий checkout, формы, оплата, Delivery/Payment не меняются.


Оформление заказа 16 опубликовано: /pages/checkout?v=16, релиз v0.10-20260912-16, mobile 4e23710. 341/341 локально и 341/341 публично на четырёх ширинах, без JS-ошибок; TypeScript и экспорт web/iOS/Android прошли. Все пять шагов и COPY LOCK сохранены. Проверены ссылки, возврат, глобальное меню, пояснение заявки на лизинг и маршруты каталога/организации. 11 соседних маршрутов совпали; доставка и сотрудничество визуально идентичны. Проверено 492 файла по манифесту, резервная v15 и собственная база сохранены. Боевые 82 файла, процессы и HTTP совпали до/после. Только собственный preview service обновлён. Отчёт: parity/CHECKOUT_GUIDE_16.md. Ожидается отзыв владельца.


## HTML «Оформление заказа» — завершено 13.09.2026

Страница v16 выгружена для мобильного и десктопа. Архив: /Users/prom23/Downloads/Служебные страницы/оформление заказа.zip. 11 файлов, 20188 байт, SHA256 674cefa41fb2b75a52ff0a35a4b2134ad749b8f8e53180a3409b0eb9b8b9788e. Внутри автономный index.html, фрагмент, вариант для вставки, CSS/JS/config, подключение Битрикс, инструкция, отчёт и манифест. Все пять шагов и тексты сохранены; окно лизинга имеет маршруты каталога и организации, возврат/Escape и запасной вариант без JS. 354/354 браузерных проверок, CRC и SHA256 совпали. Три предыдущих архива неизменны. Приложение и сервер не менялись; PHP и установка на живой сайт не выполнялись.


## Возврат товаров 17 — 14.09.2026
Новый запрос: подробная страница по RETURNS_MASTER_PROMPT.txt в стиле доставки. Разделить B2C/дистанционную и обычную розницу/недостатки/технически сложные товары/B2B. Сохранить весь полезный текст и формы, проверить повторные заявки и медиа. Не менять боевой сайт, DNS и соседние страницы. Источник текста и COPY LOCK: parity/RETURNS_COPY.json. Реальные регистрации, возвраты денег и обмены без подключённого Bitrix не объявлять проверенными.


## Возврат товаров 17 — опубликовано 14.09.2026
Страница /pages/returns?v=17, релиз v0.10-20260914-17, mobile 1a62ec1. Вкладки B2C/B2B, четыре ситуации с переходами, пять шагов, подробные условия и сроки, контакты претензий и справочные ссылки. 1345 проверок локально и 1345 публично на ширинах 320/390/768/1280, без JS-ошибок. TypeScript и web/iOS/Android export PASS. 13 соседних страниц сохранили текст, доставка и сотрудничество совпали по скриншотам. В коде runtime подготовлены повторные обращения, количество по позиции, 10 медиафайлов на товар и подробности в карточке заявки. 21 Node + 11 mobile form + 40 PHP fixture checks PASS. Реальный PDO-тест фиксации вручения правил пропущен: в CLI нет PDO SQLite. Новый runtime требует исправления небезопасного вывода COMMENT в старых шаблонах; патч из пяти файлов приложен и проверен без изменения source. Реальный Bitrix, продавец конкретного заказа и события вручения правил ещё требуют подключения программистами; это не скрыто за fake success. Подробности: parity/RETURNS_17.md и integrations/runtime/RETURNS-2026.md. Проверены 492 файла релиза, сохранена v16 и резервная база. 82 боевых файла, процессы и HTTP неизменны. Только свой preview-service обновлён. Следующий шаг: отзыв владельца по странице; HTML-архив для Битрикс по отдельному запросу.


## Главная 18 — локальная проверка, 16.09.2026
Реализовано новое HomeMarketplace: баннеры на собственных фотографиях, компактная шапка, двухрядные категории, горизонтальные товарные подборки с кнопками прокрутки, отдельные B2C/B2B, производство/история/награды/экспорт, блок кабинета, доставка/оплата/контакты. История просмотров и рекомендации зависят от реального локального состояния. Сохранены 20 категорий, Леса первыми. Никаких чужих рекламных обещаний или купонов не добавлялось. TypeScript + web/iOS/Android export PASS; 94 браузерных проверки на 320/390/768/1280, без JS-ошибок; 8 mobile unit и 9 public-api unit PASS. 12 соседних страниц сохранили текст, доставка/сотрудничество визуально идентичны. Подготовлен v0.10-20260916-18, 493 файла, SHA256 22ea9d329d04e4c613b82b20c7ac5b85728c7eea0ed3cd04239bbcef71a68382. Следующий шаг: изолированное размещение, публичная проверка, контроль боевого сайта.


## Главная 18 — опубликовано 16.09.2026
URL: http://159.253.19.172:18087/?v=18. Релиз v0.10-20260916-18, mobile 50aab72. Главная переработана по референсам: компактная шапка/поиск/город/B2C-B2B, три баннера на исходных фото, 20 категорий (Леса первыми), горизонтальные товары, отдельные B2C/B2B, производство, история/награды/экспорт, кабинет, статьи и помощь. Полная работа корзин/поиска/истории/рекомендаций не заменялась декоративными элементами. Проверено 94/94 локально и 94/94 публично на 320/390/768/1280, JS-ошибок нет; TypeScript и web/iOS/Android export PASS, 8 mobile + 9 public-api тестов PASS. При первом публичном прогоне проверка истории не дождалась сохранения; добавлено ожидание реального элемента истории, повторный прогон прошёл. Сравнение 13 соседних страниц PASS; доставка, сотрудничество и возврат визуально идентичны. Четыре HTML-архива неизменны. 492 файла релиза проверены, v17 и резервная БД сохранены. 82 боевых файла, процессы и HTTP200 совпали до/после. Только собственный сервис обновлён. Отчёт: parity/HOME_18.md. Ограничения интеграции Bitrix/1С и нативной приёмки не изменились. Следующий шаг: обратная связь владельца по главной и дополнительные референсы при поступлении.

## Главная 19 — в работе, 16.09.2026
Уведомления рядом с телефоном; тексты/фотографии баннеров по запросу; производство, рекомендации, одинаковые цветные ссылки истории/наград/экспорта; заметная кнопка кабинета; автоматическая смешанная товарная лента в конце главной. Сохраняем существующие маршруты, карточки, корзины B2C/B2B и принятые страницы. Каталог содержит 28 реальных товаров: лента подгружает их без повторов и вымышленных позиций. Уведомления ведут в существующий раздел без фиктивного badge. Стили сверены с /frontend/h/ui.php и CSS сайта: фирменный #3d4471, оранжевый акцент, белые поверхности, округления.


## Главная 19 — опубликовано 16.09.2026
URL: http://159.253.19.172:18087/?v=19. Релиз v0.10-20260916-19, mobile 98fccbc. Добавлен вход в уведомления рядом с телефоном; исправлены тексты баннеров, подборки и производства; пять фотографий соответствуют ассортименту. История/награды/экспорт оформлены одинаковыми фирменными кнопками, кабинет — контрастным CTA. В конце автоматически подгружается смешанная сетка всех 28 реальных товаров без повторов, с существующими действиями карточки. Для быстрой прокрутки увеличен запас отрисовки и более ранний порог подгрузки. После каталога показан честный конец подборки; товары не выдумываются. Сверено со стилями сайта. TypeScript, web/iOS/Android export PASS; 13 unit-тестов PASS. 94 регрессионные + 69 адресных браузерных проверок локально и столько же публично на 320/390/768/1280, JS-ошибок нет. 13 соседних страниц сохранили текст, доставка/сотрудничество совпали по скриншотам; четыре HTML ZIP неизменны. 492 файла релиза проверены, сохранены v18 и резервная БД. 82 боевых файла, процессы и HTTP неизменны. Реальные интеграции Bitrix/1С и нативная приёмка не изменялись. Подробный отчёт: parity/HOME_19.md. Следующий шаг: обратная связь владельца по опубликованным правкам.


## Главная 20 — в работе, 16.09.2026
Первое изображение должно быть внутри баннера; белая полоса товаров под баннером отменена. Из присланной вертикальной строительной сцены встроенным imagegen создан горизонтальный фон; он не объявляется фотографией реального объекта компании. Все три баннера получают разные цветовые спектры градиента: морской, сливовый, зелёный. Согласованный текст и CTA сохраняются. Новое уточнение: популярные товары — вертикальная сетка с раскрытием вниз, остальные подборки не меняются.


Дополнение 20: также вертикальная сетка «Рекомендуем к покупке»; «Вы интересовались» сразу после неё (только реальные просмотры, без фальшивого содержимого). Блок B2B — светлая поверхность, заголовок 21/26, текст 14/21, кнопки 48+, спокойные иконки и компактный основной CTA на десктопе.


## Главная 20 — опубликовано 16.09.2026
URL: http://159.253.19.172:18087/?v=20. Релиз v0.10-20260916-20, mobile 242893e. Все четыре уточнения выполнены: фото внутри баннеров и три разных градиента; «Популярные товары» раскрываются вниз; светлый B2B-блок с согласованными размерами текста/кнопок; «Рекомендуем к покупке» раскрывается вниз, сразу после него — «Вы интересовались» с реальными просмотрами. Первое горизонтальное изображение создано встроенным image_gen из присланного оригинала. TypeScript и web/iOS/Android export PASS; 11 mobile + 9 public API unit PASS. 225 браузерных проверок локально и 225 публично на 320/390/768/1280, без JS-ошибок. 13 соседних страниц сохранили текст, доставка/сотрудничество совпали по скриншотам; четыре HTML ZIP неизменны. Проверены 494 файла релиза, сохранены v19 и резервная БД. 82 защищённых файла, процессы и HTTP неизменны. Нативные устройства и реальные интеграции Bitrix/1С не проверялись в этом визуальном спринте. Отчёт: parity/HOME_20.md. Незавершённых правок в согласованном объёме нет. Следующий шаг: обратная связь владельца по v20.

## Главная 21 — оттенки градиентов, в работе
Первый синий градиент утверждён и сохраняется. Для цеха выбран тёплый графит #292C2E → #706354 по оттенкам стали и солнечного света; для стройки — стальной синий #18354B → #326B8C по небу и стеклянным фасадам. Меняются только четыре цвета в HomeMarketplace.tsx; фотографии, тексты, размеры, маршруты и функции сохранены.

## Главная 21 — опубликовано 16.09.2026
http://159.253.19.172:18087/?v=21. Релиз v0.10-20260916-21, mobile e8b96e2. Первый синий градиент сохранён (четыре скриншота побайтно совпали с v20). Производство: тёплый графит #292C2E → #706354; проекты: стальной синий #18354B → #326B8C. Изменены только четыре значения цветов; фотографии, тексты и функциональность сохранены. TypeScript, web/iOS/Android export PASS. 73 адресных браузерных проверки локально и 73 публично на 320/390/768/1280, без JS-ошибок. Проверены 494 файла релиза; v20 и резервная БД сохранены. 82 защищённых файла, процессы и HTTP неизменны. Отчёт: parity/HOME_21.md. Незавершённого в рамках запроса нет; следующий шаг — отзыв владельца. Нативная приёмка и реальные интеграции в эту правку цветов не входили.

## Сравнение 22 — в работе
После первого подтверждённого добавления показываем постоянную кнопку «Открыть сравнение» со счётчиком над нижней навигацией. Кнопка занимает собственное место в layout, не закрывает контент, скрыта на самой странице сравнения и при пустом списке. В окне лимита шести товаров — прямой переход к сравнению. Действия добавления/удаления, backend-состояние, таблица и пять основных вкладок сохранены.

## Сравнение 22 — опубликовано 16.09.2026
http://159.253.19.172:18087/?v=22. Релиз v0.10-20260916-22, mobile 46a48dc. После добавления товара над нижней навигацией появляется постоянная кнопка «Открыть сравнение» со счётчиком. Она доступна при прокрутке и на других экранах, не перекрывает контент; скрыта в самой таблице и при пустом списке. В окне лимита шести товаров добавлен прямой переход. TypeScript, web/iOS/Android export PASS. 51 сценарная браузерная проверка локально и 51 публично на 320/390/768/1280, без JS-ошибок. Проверены 494 файла релиза, сохранены v21 и резервная БД. 82 защищённых файла, процессы и HTTP неизменны. Изменены только BottomNavigation.tsx и ProductCard.tsx; backend и таблица сравнения сохранены. Отчёт: parity/COMPARE_22.md. Незавершённых правок в объёме запроса нет; следующий шаг — отзыв владельца. Реальные интеграции и нативные устройства в этой правке не проверялись.

## Баннеры 23 — в работе
Новый запрос заменяет старое решение «без таймера»: автоматическая смена баннера через 6 секунд и свайпы в обе стороны. Сохранить фотографии, градиенты, тексты, маршруты и точки навигации. Вертикальную прокрутку не блокировать; добавить паузу, учитывать reduced motion, активность экрана/приложения и взаимодействие пользователя.

## Баннеры 23 — опубликовано 16.09.2026
http://159.253.19.172:18087/?v=23. Релиз v0.10-20260916-23, mobile 03fad5a. Автоматическая смена каждые 6 секунд, свайпы в обе стороны по кругу, кнопка паузы/возобновления. Вертикальная прокрутка, CTA и точки сохранены. Таймер приостанавливается при касании, наведении/клавиатурном фокусе, неактивном экране/приложении и скрытой вкладке. Reduced motion отключает автосмену по умолчанию, ручное управление работает. TypeScript и web/iOS/Android export PASS. 63 сенсорные/браузерные + 9 lifecycle-проверок локально и столько же публично, без JS-ошибок, ширины 320/390/768/1280. Подтверждён bundle entry-b3e146b72d1f2b2b4e602549bca495a3.js. Проверены 494 файла; v22 и резервная БД сохранены. 82 защищённых файла, процессы и HTTP неизменны. Отчёт: parity/BANNER_23.md. Все правки запроса завершены. Следующий шаг — отзыв владельца. Физические iPhone/Android не использовались; проведена эмуляция touch в Chrome и экспорт native-сборок.

## О компании 24 — в работе
Новый запрос: неудобная страница не показывает масштаб опыта, направлений, ассортимента, филиалов и репутации. Переработка только /pages/about. Новая структура: представление, направления деятельности, каталог, производство, сеть филиалов, полная история, проекты, награды, контакт. Источники: sitePages.about/historyMilestones, companyContent, siteContacts, каталог, реальные фотографии производства/филиалов/проектов, company-evidence. Числа первого экрана: год основания 2008, реальные корневые разделы каталога, список контактных городов. Недатированные маркетинговые 10 000+/15+/10+ сохранены как отдельные опубликованные показатели; не объявляются независимой статистикой. Все маршруты и действия доступны, остальные страницы сохраняются.

## О компании 24 — опубликовано 16.09.2026
http://159.253.19.172:18087/pages/about?v=24. Релиз v0.10-20260916-24, mobile 565a835. Перестроена только страница о компании: шесть направлений, 20 разделов каталога, собственное производство, 18 контактных городов с адресами и маршрутами, полная история с 2008 года, три реальных проекта, награды и понятные CTA. Единая типографика и светлая компоновка с оранжевыми акцентами. TypeScript и web/iOS/Android export PASS; 137 браузерных проверок локально и 137 публично на 320/390/768/1280, без JS-ошибок. В первом публичном прогоне проверка изображений выполнялась до завершения загрузки; добавлено ожидание загрузки, повторный прогон PASS. Тексты шести соседних страниц и снимки главной/доставки/сотрудничества совпали. Публичный bundle entry-1c977b8c9c71fb8952381fdf222c6a65.js соответствует локальному. Проверены 494 файла, сохранены v23 и резервная БД. 82 защищённых файла, процессы и HTTP неизменны. Изменений вне mobile/dist в артефакте нет. Физические устройства и production Bitrix не проверялись. Отчёт: parity/ABOUT_24.md. Незавершённых правок в объёме запроса нет; следующий шаг — отзыв владельца. HTML-экспорт этой страницы не запрашивался.

## О компании 25 — в работе, 17.09.2026
Новая редакция по документу владельца «О компании.docx». История — основа повествования: поставщик 2008 → региональная сеть → промышленная модель 2020 → первый цех 2021 → масштабирование → две площадки 2025–2026. Этот новый материал заменяет старую противоречащую хронологию на странице about. Цифры 2/300+/400 млн и производственные показатели взяты из файла владельца, без независимой проверки. Краткая презентация → масштаб → история → производство → четыре направления продукции → сеть → основания доверия и существующие награды → предложение/партнёрство. Подробный каталог и справочник филиалов сохраняются в раскрытиях; формы и маршруты не удаляются. Устаревшие недатированные счётчики v24 заменяются показателями новой редакции. Награды: отдельный файл в приложении не приложен, поэтому используются существующие подтверждённые записи. Сайт, другие страницы, HTML-архивы и защищённый production не менять.

Уточнение владельца: добавить изображения в историю, ИИ допускается до замены на собственные фотографии. Подготовлены места для трёх отдельных изображений этапов 2008, 2015 и 2021; подписи прямо обозначают ИИ-иллюстрации, а не архив компании. Изначально собранный артефакт v25 ещё не активировался; он будет перепакован после добавления изображений и повторной проверки.

## О компании 25 — опубликовано 17.09.2026
http://159.253.19.172:18087/pages/about?v=25. Релиз v0.10-20260917-25, mobile 14a699a. Страница пересобрана по документу владельца: от поставщика 2008 года к торгово-производственной группе; история расположена перед производством, ассортиментом и географией. Восемь последовательных этапов, новые показатели из документа с атрибуцией, четыре направления продукции, региональная и партнёрская сеть, основания доверия, подтверждённые награды и CTA. Полный каталог, 18 контактных городов и проекты доступны в раскрытиях. По дополнительному запросу встроены три горизонтальные ИИ-иллюстрации этапов 2008/2015/2021; подписи обозначают их как иллюстрации. PNG, точные промпты и инструкция замены — mobile/assets/about-history/. TypeScript и web/iOS/Android export PASS. 157 проверок локально и 157 публично на 320/390/768/1280, JS-ошибок нет; проверены фактические рамки 16:9 и загрузка изображений. Тексты шести соседних страниц и снимки главной/доставки/сотрудничества совпали. Публичный bundle entry-8fe6b0eb366c7280abd9e4e4f9021eb8.js соответствует локальному. Проверены 500 файлов; v24 и резервная база сохранены. 82 защищённых файла, процессы и HTTP неизменны. Нативные устройства и production Bitrix не проверялись. Отчёт: parity/ABOUT_25.md. Незавершённых правок в объёме запроса нет; следующий шаг — отзыв владельца и замена временных иллюстраций собственными фото при их предоставлении. HTML-архив не запрашивался.

## О компании 26 — в работе, 17.09.2026
Владелец просит убрать смысловые повторы и использовать новое описание группы, клиентов, каналов, команды и репутации. Только /pages/about. Удалены повторный блок о группе, четыре повторяющихся основания доверия, повторные CTA и дублирующий FAQ не добавляется. История сохраняет восемь этапов и три подписанные ИИ-иллюстрации; новая информация не меняет дату первого цеха 2021. Производство, команда, ассортимент, пять аудиторий, семь каналов (три группы), география, реальные проекты и награды разграничены. 180 сотрудников — только ООО «ТЕАМ ИНДАСТРИ»; новая награда 2024 — из текста владельца без выдуманного диплома. Фотографии цеха, металлообработки, склада и проектов из имеющихся материалов показываются открыто. Этапы истории и фото плавно появляются при прокрутке, reduced motion отключает эффекты. Все ссылки каталога, контактов, форм, партнёрства, поставщиков и служебных страниц сохранены.

Локальная версия v26 проверена: 186 браузерных проверок, 9 проверок анимации/reduced motion, TypeScript и экспорт web/iOS/Android. Шесть соседних текстов и снимки главной/доставки/сотрудничества идентичны. Визуально просмотрены мобильные и широкие снимки: единая типографика, читаемые схемы, открытые фото. Тест плавной навигации исправлен: ожидает завершение длинной прокрутки, а не фиксированные 900 мс. Mobile commit 222fe3b; далее упаковка и публикация только preview.

## О компании 26 — опубликовано 17.09.2026
http://159.253.19.172:18087/pages/about?v=26. Релиз v0.10-20260917-26, mobile 222fe3b. По новому тексту владельца убраны повторные рассказы о группе, trust-блок с пересказом производства/комплектации, повторные заявки и абзац франшизы. Повторяющий FAQ не добавлен. История сохранена; отдельно представлены производство, команда, ассортимент, пять аудиторий, семь каналов в трёх группах, география, три проекта и награды. 180 сотрудников относятся к ООО «ТЕАМ ИНДАСТРИ»; награда «Лучший поставщик года — 2024» добавлена по тексту владельца без выдуманного диплома. Десять открытых изображений: оборудование, три подписанные ИИ-иллюстрации истории, цех, обработка металла, склад и три проекта. Схема производственного цикла, компактные показатели, мягкое появление истории/фото с поддержкой reduced motion.
TypeScript и экспорт web/iOS/Android PASS; 186 браузерных + 9 motion-проверок локально и столько же публично, ширины 320/390/768/1280, JS-ошибок нет. Все категории, 18 контактных городов, основные ссылки и клавиатура проверены. Шесть соседних текстов и три снимка главной/доставки/сотрудничества совпали. Публичный bundle entry-5035c2d137cdc78cc1dae7905b00dda5.js совпадает с локальным. Проверено 500 файлов, изменения артефакта только mobile/dist, предыдущая v25 и резервная БД сохранены. 82 защищённых файла, процессы и HTTP неизменны. Физические устройства и production Bitrix не проверялись. Отчёт: parity/ABOUT_26.md. Работа в объёме запроса завершена; следующий шаг — отзыв владельца. HTML-архив не запрашивался.

## О компании 27 — в работе
По уточнению владельца: 350 сотрудников группы компаний «Промышленник» вместо 180 сотрудников ООО «ТЕАМ ИНДАСТРИ» на странице About. Исторические сведения и производственное юридическое лицо сохранены. Заголовки разделов получают цвет brand и оранжевый левый маркер, как на сотрудничестве; выборочные смысловые фразы — brand/bold. Вторичные кнопки с явной светлой поверхностью и рамкой, основные CTA оранжевые, цели 52+. Порядок: проекты → награды → география/филиалы → контакт. Остальные страницы и функции не менять.

О компании 27: реализация и локальная проверка завершены (190 + 9 проверок, экспорт трёх платформ). Mobile 7864e4c. Далее проверенная упаковка, публикация только isolated preview и внешний прогон.

## О компании 27 — опубликовано 17.09.2026
http://159.253.19.172:18087/pages/about?v=27. Релиз v0.10-20260917-27, mobile 7864e4c. По прямому уточнению владельца показатель заменён на 350 сотрудников группы компаний «Промышленник». На странице About заголовки разделов и пять смысловых фраз выделены цветом по образцу сотрудничества, добавлены оранжевые маркеры разделов, чёткие вторичные кнопки с заливкой/рамкой и основные оранжевые CTA. Порядок: проекты → награды → география/филиалы → контакты; отдельный якорь «Награды». Изменён только AboutPage.tsx; маршруты, функции и соседние страницы сохранены.
TypeScript и export web/iOS/Android PASS. 190 браузерных + 9 motion-проверок локально и 190 + 9 публично, ширины 320/390/768/1280, JS-ошибок нет. Шесть соседних текстов и три снимка главной/доставки/сотрудничества совпали. Bundle entry-4aeec0399742bae680a1d0c42953994d.js совпадает локально/публично; проверено 500 файлов. Предыдущая v26 и собственная резервная БД сохранены. 82 защищённых файла, процессы и HTTP неизменны. Физические устройства и production Bitrix не проверялись. Отчёт: parity/ABOUT_27.md. Все правки запроса выполнены, далее — отзыв владельца.

## Производство 28 — в работе
Новая страница /information/production по документу владельца «Производство.docx». Восемь цехов на первой площадке и три на второй; названия/адреса площадок не публиковать. Связанные названия удаляются также из About. Использовать имеющиеся фото компании, инфографику 8 + 3 = 11, восемь этапов, реальные испытания, шесть семейств продукции и существующие формы production-request/tour, каталог, документы, видео, проекты. Число сотрудников 180 не возвращать в презентацию: утверждённый на About показатель 350 относится к группе. Производственные показатели использовать с атрибуцией на I квартал 2026. Общие стили и остальные страницы сохраняются.

Производство 28: реализация, визуальный просмотр и локальные проверки завершены (181 + 9, экспорт трёх платформ). Mobile f8f5359. Соседние страницы сохранены. Далее — активация проверенного артефакта и внешняя проверка.

## Производство 28 — опубликовано 17.09.2026
http://159.253.19.172:18087/information/production?v=28. Релиз v0.10-20260917-28, mobile f8f5359. Новая страница по «Производство.docx»: фотографии на баннерах, показатели, две обезличенные площадки в Краснодарском крае, схема 8 + 3 = 11 цехов, восемь этапов изготовления, шесть семейств продукции, испытания, заявка по ТЗ, экскурсия и контакты. Цветовые заголовки и подложки, ясные кнопки, компактные карточки продукции на телефоне. Использованы существующие фото компании и товаров. Названия площадок также убраны из About; 350 сотрудников группы и порядок наград сохранены. Каталог, формы, видео, PDF, документы, подразделения и проекты доступны.
TypeScript и экспорт web/iOS/Android PASS. 181 браузерная + 9 motion/reduced-motion проверок локально и столько же публично на 320/390/768/1280; ошибок браузера нет. Шесть соседних текстов и три снимка главной/доставки/сотрудничества совпали. Bundle entry-a328b18ec46480337473cb6f1c9338ca.js совпадает локально/публично; 500 файлов проверены, изменения артефакта только mobile/dist. Предыдущая v27 и резервная БД сохранены. 82 защищённых файла, процессы и HTTP неизменны. Заявки не отправлялись, физические устройства и production Bitrix не проверялись. Отчёт: parity/PRODUCTION_28.md. Запрос выполнен; следующий шаг — отзыв владельца. Блокеров нет. HTML-архив не запрашивался.

## Гарантия 29 — в работе
Страница /pages/warranty по тексту владельца: пять шагов, цветовые акценты/подложки, отдельные условия B2C/B2B, кнопка гарантийного обращения в существующую форму appeal. Сохраняются заказы, история обращений, документы, помощь с возвратом и контакты. Редакторские указания исключаются, правовые ссылки проверяются; общий срок гарантии не выдумывается. План: parity/WARRANTY_29.md.

## Гарантия 29 — опубликовано 17.09.2026
http://159.253.19.172:18087/pages/warranty?v=29. Релиз v0.10-20260917-29, mobile 341b3a5. Страница по тексту владельца: схема пяти шагов, цветовые заголовки и подложки, условия для личных покупок и бизнеса в отдельных вкладках, раскрытия юридических подробностей, подготовка материалов, сервис и производители, статус обращения, помощь без заказа и переход к возврату. Кнопка «Гарантийный случай / Запросить гарантийное обслуживание» открывает существующую форму appeal с назначением warranty; особые заголовок, пояснение, редактируемая заготовка и ссылки на заказы/контакты. Изменения общей формы действуют только при purpose=warranty. Обычная форма сохранена. Проверены ссылки на статьи 18–20 ЗоЗПП и 470, 471, 476 ГК РФ; редакторские указания не публикуются.
TypeScript и экспорт web/iOS/Android PASS. 171 браузерная и 7 проверок формы локально и публично, четыре ширины 320/390/768/1280, ошибок браузера нет. Заготовка формы и приоритет серверного черновика проверены на изолированном browser fixture; реальные заявки не отправлялись. Восемь соседних текстов и пять снимков совпали. Bundle entry-a8a2ce466bbd689eb6bf263428f1c1e8.js совпадает локально/публично, проверено 500 файлов, изменения артефакта только mobile/dist. Предыдущая v28 и резервная БД сохранены. 82 защищённых файла, процессы и HTTP неизменны.
Ограничение: сервис загрузки контекста обращений в preview недоступен. Форма показывает ошибку и повтор, не разрешает отправку без подтверждённого контекста; заказы и контакты доступны. Реальный приём обращений production Bitrix не проверен, его доступы не запрашивались. Физические устройства не проверялись. Вёрстка и подключение кнопки завершены; ограничение внешнего сервиса сохранено явно. Следующий шаг — отзыв владельца; работа с внешней интеграцией остаётся за пределами этой страницы. HTML-архив не запрашивался. Отчёт: parity/WARRANTY_29.md.


## Forms 30 — in progress, 17.09.2026
Owner explicitly skipped Bitrix integration after selecting the test site. Implement remaining UI: inline warranty order selection preserving draft, editable initially checked consent boxes on all forms, Write next to Call in global menu. Owner instruction overrides former unchecked defaults. Exact form consent contracts are synchronized; no runtime enabled, no fake submissions or orders. See parity/FORMS_30.md.

Forms 30 local verification: TypeScript and export web/iOS/Android passed; 94 mobile unit tests, 163 server tests, 76 isolated browser checks on 320/390/1280 passed. Screenshots inspected. Browser fixtures verify order selection, same-route/draft/consent preservation, retry, cross-context rejection, required-consent blocking and target/consent payload. No external submissions. Integration explicitly skipped by owner; publishing remaining scope next.


## Forms 30 - published, 17.09.2026
Published http://159.253.19.172:18087/more?v=30 (v0.10-20260917-30; mobile f87e6ef + 9d6f076). Inline warranty order picker with search and same-page draft/consent preservation; checked editable square agreements throughout forms, synchronized 69 consent contracts; Write beside Call in menu opens verified email contact. TypeScript/export web+iOS+Android passed; mobile 94, server 163, browser 76 local + 76 public passed. Additional live non-fixture checkbox check passed. 500 files verified; previous release and own DB backup kept. 82 protected files, processes and HTTP unchanged. Owner explicitly skipped Bitrix integration; no claim of connected real orders/submissions. No outstanding work within revised scope. Details: parity/FORMS_30.md.


## Awards 31 - in progress, 17.09.2026
Owner requests /pages/awards using Awards.docx and original site photos. Eight corporate awards, two personal awards, descending presentation by award year; preserve exact entity/stage/result periods and all nine original photos. Three entries have no source photograph. Source images are 86x123; gallery labels resolution honestly. Official Kuban registry linked. Only awards screen and dispatch change; forms/Bitrix out of scope. See parity/AWARDS_31.md.


## Awards 31 - published, 17.09.2026
Published http://159.253.19.172:18087/pages/awards?v=31 (v0.10-20260917-31, mobile d107b17). Ten source descriptions: eight corporate and two personal awards, years/recipients/nomination/stage/result periods clearly separated. Nine original site photographs preserved with zoomable gallery; three awards without source photos remain text-only. All source images are 86x123 pixels, explicitly noted in viewer. Official Kuban product registry linked. Corporate details retained in accessible disclosures; related pages and contact CTA retained.
TypeScript and web/iOS/Android export passed. Browser 221 local + 221 public assertions on 320/390/768/1280 passed, no browser errors. Eight neighbor texts unchanged; five screenshots byte-identical, production hero animation framing differs without text/layout/code changes. Public bundle entry-20ffc297d08d1b3da7ce3385ea87ea74.js matches local. All 500 release files verified; previous v30 and own DB backup preserved. 82 protected files, processes and HTTP unchanged. Bitrix integration remains skipped by owner; no external submissions or physical-device testing claimed. No outstanding work within awards scope. Next: owner's visual review; replace tiny source photos if better originals are supplied. HTML archive was not requested. Report: parity/AWARDS_31.md.


## Business 32 — in progress, 17.09.2026
Focused B2B page based on owner DOCX; existing route /information/business. Real imagery, capability infographic, registration/cabinet paths, four assortment groups, vertical procurement timeline, six verified review paraphrases, all 21 FAQs, inline reused procurement form. Conditional claims gated in audit/business-publish-gates.md. Bitrix integration remains skipped by owner; no fake receipt or account. TypeScript/export and 94 mobile tests passed; browser validation in progress. Details: parity/BUSINESS_32.md.

Business32 local checks complete: 517 page + 52 form + 4 context/motion checks, 94 mobile tests, TypeScript/export all passed. Eight neighbor texts and six screenshots unchanged. Mobile bf1d6f8. Publishing isolated v32 next; no external submissions, Bitrix remains skipped.


## Business 32 — published, 17.09.2026
Published http://159.253.19.172:18087/information/business?v=32 (v0.10-20260917-32; mobile bf1d6f8). Owner DOCX supplies all major copy: hero, intro, six advantages, registration, four assortment groups, four facts, six supply stages, four scenarios, six verified review paraphrases and all 21 FAQs. Publish-gate exceptions narrow unverified cabinet documents/staff claims, reserve term and outdated review aggregate. Real photos/pictograms, semantic orange accents, actual cabinet preview, search/topics/accordions, vertical reveal with reduced-motion, inline reused procurement form. SEO title/description/OG/canonical and WebPage/BreadcrumbList present; preview remains noindex.
TypeScript and web/iOS/Android export passed; 94 mobile tests; 517 page + 52 form + 4 context/motion browser checks passed both locally and publicly. No browser errors. All submissions/uploads tested with browser interception only, no external message. Eight neighbor texts unchanged, six screenshots byte-identical. Five public image assets confirmed. Public/local bundle entry-36d745221b707c8b4070e7da8a13f17a.js matches. 500 release files verified; previous v31 and own DB backup kept. Protected 82 files, shared processes and HTTP unchanged.
Bitrix integration explicitly skipped by owner; connected authentication/registration/documents/CRM acceptance not claimed. Physical native devices not tested. No unfinished work within revised page scope; next step is owner visual review. PAGE ACCEPTED is not set. HTML archive was not requested. Report: parity/BUSINESS_32.md; claim gates: audit/business-publish-gates.md.


## Business 33 — owner correction, in progress
Owner rejected duplicated narrative, alignment and warehouse-centric company block. This newer instruction authorizes editing/summarizing former DOCX copy. Consolidate repeated assortment/advantages/scenarios and registration descriptions; preserve all 21 legal/commercial FAQs, actual flows, links and form logic. Company block represents the group: since 2008, 350 employees, two production sites in Krasnodar Krai, regional network and export. Remove 12,000 m² warehouse emphasis from B2B overview. Only B2B presentation/content change; integration remains skipped.


## Business 33 — published, 17.09.2026
Published http://159.253.19.172:18087/information/business?v=33 (v0.10-20260917-33; mobile 2d50d98). Latest owner correction authorizes removing redundant DOCX narrative. Consolidated assortment, four purchasing steps, group-wide company story (2008, 350 group employees, two production sites), cabinet, actual projects, reviews, FAQ and request form. Removed warehouse-centric metric and repeated advantages/scenarios. Unified typography, paired equal-height cards/link slots, numeric facts and image proportions. Anchor measurement now updates after expanding FAQ/reviews.
TypeScript and web/iOS/Android export passed. 241 page + 4 context/motion checks passed both locally and publicly at 320/390/768/1280; no JS errors. All 21 FAQ answers and six reviews remain unchanged. Eight neighboring page texts unchanged; five screenshots byte-identical, production photo animation visually reviewed. Public bundle entry-9fec44f0e7d88f9308cc00f49f92ceb5.js matches local export. 500 release files verified; previous v32 and own DB backup retained. Protected files, processes and HTTP unchanged.
Only BusinessPage.tsx and businessPage.ts changed in mobile. Bitrix integration remains explicitly skipped; no real external submission or physical-device testing claimed. All requested implementation/deployment work complete; next step is owner visual review, PAGE ACCEPTED not set. Report: parity/BUSINESS_33.md. No new blockers within this design scope.


## Business 34 — owner priority correction, in progress
Owner rejected v33 hierarchy: supplier advantages first, followed by explicit online B2B ordering, value of site/app and document workflows. Preserve all FAQ/reviews and working destinations. Restore supplier benefits with actual reasons, four organization checkout steps plus specification alternative, account tasks and document/EDO actions. Company/projects/reviews move after purchasing content. No backend integration, fake data or blanket document-download promises. Source: organization/documents/index.php, organization/info/index.php, Documents1C.php, mobile WorkspaceScreen and Orders/OrderDetail screens.


## Business 34 — published, 17.09.2026
Owner rejected v33 information priority. Published http://159.253.19.172:18087/information/business?v=34. Supplier advantages now first: own production, complete supply, technical selection, volume-specific quote, stock/reserve and delivery. Then explicit organization checkout steps and specification alternative; site/app account benefits and document/EDO workflows with actual routes. Catalog, request and FAQ precede company/projects/reviews. All 21 FAQ answers and six reviews unchanged. Mobile commits 1e26b74, 1955bd9; only businessPage.ts/BusinessPage.tsx changed.
TypeScript and web/iOS/Android export passed. 277 page + 4 context/motion checks passed locally and publicly on 320/390/768/1280, no JS errors. Verified section order, six benefits, checkout instructions, document routes, category/company routes, dynamic anchors, registration/consents/validation, keyboard focus and no overflow. Screenshots visually checked. Isolated release v0.10-20260917-34: 500 files verified, previous v33 and own DB backup retained, public bundle matches; protected files/processes/HTTP unchanged. Release manifest changes only within mobile/dist.
Bitrix integration remains skipped by owner; no external submissions or physical native-device tests claimed. No unfinished implementation within this page scope. Next step: owner visual review; PAGE ACCEPTED not set. Detailed report: parity/BUSINESS_34.md. No new blockers.


## Business 35 — revised owner content, in progress
Apply owner attachment 29e80267-d537-4e0d-8957-a4be3e01d7bd/pasted-text.txt as new page content. Benefits first; specification CTA; six supply stages; own fleet/delivery; documents; corporate terms; six account capabilities; six assortment groups; production; revised 15 FAQs; quote form. New copy replaces prior FAQs and presentation, not underlying capabilities. Preserve self-service ordering guidance in cabinet accordion, real forms/routes and consents. Supplier verification sheet provides INN and official registry links; RNP/company status supplied by owner and corroborated via public company search, official live search not independently completed. Production plural retains owner-confirmed two sites without names. Integration remains explicitly skipped.


## Business 35 — published, 17.09.2026
Updated page from owner attachment 29e80267-d537-4e0d-8957-a4be3e01d7bd: http://159.253.19.172:18087/information/business?v=35. New hero, six benefits, specification CTA, six supply steps, fleet/delivery, documents, corporate terms, six account capabilities, six assortment groups, production, revised 15 FAQs and quote form. Source copy preserved except production plural retains previously owner-confirmed two unnamed sites. Self-service ordering retained in cabinet accordion; supplier sheet includes INN and official registry links. Prior FAQs replaced by explicitly revised owner content. Underlying forms/routes preserved.
Mobile commit 6c787bf; changed businessPage.ts, BusinessPage.tsx and business-only form labels/alignment in ProcurementScreen.tsx. TypeScript and web/iOS/Android export passed. 375 page + 52 form + 4 context/motion checks passed locally and publicly at 320/390/768/1280; no JS errors. Form upload/submit tests intercepted in browser; no real external submission. Photos, mobile layouts and wide alignment visually reviewed. Isolated v0.10-20260917-35 verified 500 files, public/local bundle matches, previous v34 and own DB backup retained; protected files/processes/HTTP unchanged.
Bitrix integration remains skipped by owner; physical-device acceptance and live official registry lookup not claimed. All requested implementation and deployment complete; next step owner visual review, PAGE ACCEPTED not set. Report: parity/BUSINESS_35.md. No new blockers in this page scope.


## Franchise 36 — in progress, 18.09.2026
Owner requests franchise page using Drive brief. Verified approved Google account gelati.gelateriaa@gmail.com via explicitly authorized profile check. Linked document 1fpfJ5_Lef_-qWPl-DlYlIhFyKxcyuKtL2L2huk1U2hc is titled Franchise but contains Brands brief; found actual franchise brief 1VXpbs_GWeZg8GcD_r-TcjbqZV35BC0gHI5oUPzBlsEg. Saved FRANCHISE_SOURCE_36.txt. Latest owner confirms active Tyumen, Irkutsk, Tbilisi, Astana, Yerevan in addition to Minsk; overrides single-city brief. Preserve app shell/context and source form capabilities. Integration remains skipped. New page, infographic, active network map, international application, eight FAQs. Production claims and handler compatibility gates tracked separately.


## Franchise 36 — published, 18.09.2026
Published http://159.253.19.172:18087/pages/franchise?v=36. Dedicated owner-brief page: terms, support tabs, sales-model infographic, assortment photos, original own-brand SVGs, six-stage timeline, requirements, international section, interactive six-city map, eight FAQs and inline international application. Owner confirmed active Minsk, Tyumen, Irkutsk, Tbilisi, Astana, Yerevan; no closed city, invented address or construction project as franchisee. Same form at /forms/partner and /forms/franchise. Conditional original fields, interests, international contact validation and removable checked consents. Failure preserves data; verified receipt scrolls into view.
Mobile commit 9a2ded3. TypeScript and web/iOS/Android export passed; 97 mobile + 164 server tests. Both local and public: 265 page/form + 20 navigation browser checks at 320/390/768/1280, no JS errors. All form writes intercepted in QA, no real external submissions. Eight neighboring page texts unchanged. Visual review caught and fixed white logo contrast and map label distortion. Isolated v0.10-20260918-36 verified 500 files; previous v35 and own DB backup preserved; public bundle matches local, protected files/processes/HTTP unchanged.
Integration explicitly remains skipped. Source Bitrix partner handler needs extended fields/conditional validation before production; live CRM/email receipt not claimed. Publication gates: audit/franchise-publish-gates.md. No physical-device or owner visual acceptance claimed. Requested review page implementation/deployment complete; next step owner visual review. Full report: parity/FRANCHISE_36.md.


## Franchise 37 — owner correction, in progress
Natural assortment copy; all network points explicitly active. Owner replaces Astana with Almaty and adds Gudauta (Abkhazia) and Luhansk. Active network now eight cities. Separate selected-city outline from uniform active markers; numbered map/list controls, readable status on every card. Existing catalogue destinations, forms and integration boundary preserved.


## Franchise 37 — published, 18.09.2026
Published http://159.253.19.172:18087/pages/franchise?v=37. Natural assortment heading/copy; Astana replaced by Almaty, Gudauta (Abkhazia) and Luhansk added. All eight network points have uniform active markers and visible working status. Selection has a separate outline and aria-pressed state; numbered map/list controls and leader lines avoid overlap. All catalogue routes, forms and surrounding pages preserved. Mobile commit 76a7261.
TypeScript and web/iOS/Android export passed. Targeted browser verification: 137 local + 137 public checks at 320/390/768/1280, all eight map/list selections, non-overlapping hit areas, request anchor, no page overflow or JS errors. Mobile and desktop screenshots visually reviewed. Isolated v0.10-20260918-37 verified 500 files; release changes only mobile/dist, public bundle matches, previous release and own DB backup retained. Protected production files/processes/HTTP unchanged. Integration remains skipped; owner visual acceptance not claimed. Requested changes complete; next step owner review. Report: parity/FRANCHISE_37.md.


## Franchise 38 — owner simplification, in progress
Owner explicitly removes lifting-equipment assortment card, repeated selected-city detail (Minsk / Belarus / active partner) and all Works labels. Preserve all eight locations and map/list selection. Remove combined warehouse/lifting card from this page only; other catalogue sections and backend remain available. Retain four correctly aligned category links/images. Latest request supersedes visible status labels required in v37.


## Franchise 38 — published, 18.09.2026
Published http://159.253.19.172:18087/pages/franchise?v=38. Removed owner-rejected lifting/warehouse assortment card, repeated selected-city detail and Works labels (including intro and accessible labels). Four remaining assortment links/images stay correctly aligned; all eight cities, map selection, catalogue and forms retained. Only FranchisePage.tsx and franchisePage.ts changed; mobile commit 64f513f.
TypeScript/export passed. Reused/adapted v37 browser scenario: 113 local + 113 public checks at 320/390/768/1280, no JS errors or overflow; map/list selection and request anchor retained. Mobile/wide screenshots reviewed. Isolated v0.10-20260918-38 verified 500 files, only mobile/dist changed in release; public bundle matches, previous v37 and DB backup retained. Protected host files/processes/HTTP unchanged. Requested edits complete; next step owner review. Owner acceptance and external integration not claimed. Report: parity/FRANCHISE_38.md.


## Brands 39 — focused sprint, in progress
Scope: /brands/, 15 brand entities/details, original logos, alias search/sort, actual brand/category products, SEO/initial HTML. Do not redesign other pages. User explicitly invokes brand skill; read logo/consistency references. Re-read source brands/index.php, frontend/h/brands.php, ui.php, prom:brands.list class/template, brands-menu.php, Brends.php, catalog/brands.php and urlrewrite. HL4 uses UF_NAME/XML_ID/FILE/DESCRIPTION/SORT/DEF and UF_LINK for own detail links; list currently filters >UF_FILE 0. Existing catalog brand route retained.
Public source on 18.09 contains only Fubag/Inforce/Ryobi, contrary to approved 15; source archive excludes assets and HL data. Local product snapshot has 28 products, four named brands and one unspecified. Asked owner asynchronously for authoritative HL4/product export URL. This is a data gate, not permission. No fabricated logos, HL IDs, counts or empty-inventory assertions. Approved copy becomes presentation enrichment of HL entities, not a second hardcoded entity list. Source catalog PROP_368 remains sole brand property; normalization must retain Lebedyan products under STROYMASH. Preview stays noindex; production brand canonical/index strategy documented separately. Build full scoped implementation and verify with test fixtures while source data is pending; do not publish incomplete brand entities.

## Brands 39 — code prepared, data gate remains, 18.09.2026
Prepared directory/detail/catalog-brand routes, approved-copy enrichment of HL4 (not a second registry), PROP_368 binding, alias normalization including STROYMASH, validated original-logo import/provenance, shared LogoFrame/ProductCard/CatalogFilterSheet, dynamic category counts and bounded brand pagination, 1/2/3 layout, project motion, initial HTML and canonical Brand/CollectionPage/BreadcrumbList/ItemList. Demo directory/content removed. Preview route serving/aliases and publication gates added. Source corruption affects brands only, not other API routes. Header/container width changes apply only to brand routes; unrelated pages not redesigned.
Validation: TypeScript and web/iOS/Android export PASS; 97 mobile and 176 server tests PASS (12 brand tests); 180 browser fixture checks PASS, 320/390/768/1280, no JS errors. Includes initial-HTML-to-app transition, single canonical/schema, search aliases, all 15 detail routes/logo links, category URL persistence, catalog shortcut, PDP/cart/compare and shared price validation. Fixed adopted document.title removal discovered by HTML transition test. Web bundle matches tested export: entry-584b16cbc3b8584e1751f106b5a616d4.js. PHP CLI export syntax checked, not run on Bitrix DB. Test screenshots explicitly label non-own assets TEST FIXTURE; not proof of real logos/inventory.
BLOCKED_BY_EXTERNAL_ACCESS: actual HL4 records, UF_FILE assets and complete PROP_368/product snapshot have not been supplied. Public source contains only excluded Fubag/Inforce/Ryobi; two original own SVGs are available, 13 remaining UF_FILE sources unknown. No invented HL IDs, production-facing placeholders, counts or empty-inventory claims. No deployment; public v38 unchanged; PAGE ACCEPTED not set.
Next: obtain owner/test-system export using scripts/brands/export-hl4.php, import verified assets and full catalog, handle shared ShopProvider bulk bootstrap before a large snapshot (currently 28 products, 2 MB API read cap), check new SKU images/PDP and source regional rules, rerun all 15 real-data audits, publish isolated preview and request visual review. General bootstrap pagination is remaining integration work; do not confuse brand API pagination tests with complete large-catalog initial-load acceptance. Reports: parity/BRANDS_39.md, scripts/brands/README.md. Pending async question asks source/export location, not permission or passwords.
Mobile implementation committed as `f01f7c2`; source audit/tests/import scripts and this report are committed in the root repository. No remote push or deployment. The root release gate remains closed because no authoritative HL4 import exists.


## Brands 39 — latest owner scope override
Owner now explicitly requests a simple Brands page using all approved descriptions and logos found online. Publish an editorial brand directory with details; HL4 import is optional and no longer blocks this scope. Preserve canonical names, original official logos, alias search and existing visual system. Unknown product bindings/counts are omitted, never represented as zero stock. Keep HL4 integration code for later. Only isolated preview may be deployed; visual acceptance remains with owner.


### Brands 39 — editorial build verified, deployment in progress
Latest owner simplified scope is implemented: 14 original-logo brand pages and directory, approved copy, alias search/sort, responsive cards and initial HTML/SEO. GEKA copy retained but card withheld pending exact trademark/logo (owner asked asynchronously); no guessed asset. 2 own SVGs, 11 official website logos, Daire original vector from manufacturer manual. No fake HL IDs or product counts; optional HL4 integration preserved. Mobile commit 221d73b. TypeScript/all exports passed; 178 server + 97 mobile tests and 156 actual local browser checks passed. Sources/hashes: data/brands/assets.json. Isolated v39 package 561 files, SHA7281d19bda83824731eca8b4b5f3a75e0f21d5ab99b6e1e2a5e01272dfe20db4. Protected baseline snapshot acquired; upload underway. Not visually accepted.


## Brands 39 — published, 18.09.2026
Published http://159.253.19.172:18087/brands/?v=39 under the latest owner-approved simplified scope. Directory and 14 canonical details use exact approved descriptions and reviewed original logos, own-brand emphasis, alias search/alphabet sort, responsive aligned cards and shared shell. Initial HTML, canonical and Brand structured data are present; preview remains noindex. No fake HL IDs, product counts or zero-inventory claims. Optional HL4 product integration remains implemented but deferred.
Mobile commit 221d73b. TypeScript/all-platform export passed; 178 server + 97 mobile tests. Real browser checks: 156 local + 156 public at 320/390/768/1280, no JS errors. All published logos/links, initial HTML, aliases, copy, canonical/schema, CTA, legacy menu route and shared catalog price validation passed. No form submissions or physical-device acceptance claimed. Public bundle entry-9e6356d606acfa1cf0bd74d7bdbc2311.js matches export. Isolated release v0.10-20260918-39: 560 manifest files verified; previous v38 and own DB backup retained; protected files/processes/HTTP unchanged.
One open content item: GEKA is not published because the precise trademark/logo could not be verified among unrelated namesakes. Its approved copy remains preserved; owner was asked for exact website. Other 14 brands are complete and published. Next step: owner visual review and GEKA identity clarification. PAGE ACCEPTED not set. Report: parity/BRANDS_39.md; logo provenance: data/brands/assets.json; public evidence: parity/evidence/brands39/browser-public.json.


## Brands 40 — uniform original logos, in progress
Owner rejects three blue-backed logos. Use positive original artwork on one white LogoFrame for all brands, in directory and detail/initial HTML. Promyshlennik black positive logo and TeaM orange/gray vector sourced from owner original PDF/Illustrator files in Downloads; Alumet blue vector sourced from official catalogue cover. No trademark recoloring or redrawing. Updated asset filenames prevent stale cached white variants. Native inline SVG IDs are namespaced by brand to prevent cross-logo clipping collisions; original public SVG bytes preserved. No changes to neighboring pages, copy, product integrations or pending GEKA identity. Visual acceptance remains pending.


## Brands 40 — published, 18.09.2026
Published http://159.253.19.172:18087/brands/?v=40. All 14 published brand logos now use uniform white frames, including own-brand cards and detail/initial HTML. Positive originals replace three reverse white variants: Promyshlennik from owner logo sheet, TeaM from owner orange/gray Illustrator master, Alumet blue from official catalogue. Shapes/colors preserved; source provenance and hashes recorded. Fixed inline SVG ID collisions in native/web bundled renderer. Mobile commit 406e6ec.
TypeScript/all-platform export and eight focused brand tests passed. Local browser: 174 checks passed at 320/390/768/1280; screenshots visually reviewed. Release v0.10-20260918-40 verified 563 files, previous v39 and own DB backup retained, public bundle matches; protected host files/processes/HTTP unchanged. Public visual verification recorded in parity/evidence/brands40. GEKA identity and optional product integration remain deferred from v39. No owner visual acceptance claimed; next step owner review. Report: parity/BRANDS_40.md.

Public v40 browser verification: 174/174 passed, no JS errors; desktop/mobile screenshots reviewed.


## Legal 41 — approved source import and UI changes, 18.09.2026
Owner requests implementation of verified Drive documents and matrix, edition 01.10.2026. Read five complete sources through verified gelati.gelateriaa@gmail.com session, originals unchanged. Imported four full documents and exact UI notices with SHA256/source provenance; internal matrix not exposed publicly. Current matrix supersedes former prechecked policy/processing checkboxes. Forms now use separate unchecked processing consent and informational policy link; standalone marketing opt-in separate/default false. Added cookie category selector/banner/footer controls, independent personalization toggle, history collection denied by default at client and API boundary, withdrawal purges optional history across buyer contexts while retaining baskets/favorites. Source runtime receipt contracts updated without enabling integration.
First checks: TypeScript, web/iOS/Android export, 100 mobile and 179 server tests pass. Browser review found duplicate legal H1, corrected; full responsive tests running. Integration remains skipped, no CRM/email/order/payment success claimed. Next: finish UI verification, matrix audit and isolated v41 deployment; no owner visual acceptance.


### Legal 41 — implementation verified, deployment in progress
Mobile commit 15216b8. Four complete approved documents, source/API copies and all UI notices imported; one H1 and readable consent text, stable return from document to form. 100 mobile + 180 server tests passed, TypeScript and all-platform export passed. 1013 responsive browser assertions passed at 320/390/768/1280, plus eight independent checks: all-category acceptance, Yandex/Split notices, B2B notice, favorites opt-in/restoration, cross-tab withdrawal and legal reader with API unavailable. No browser errors; only preview-origin requests observed. Intercepted form schemas are UI fixtures, not live integration evidence. PHP 44 pure policy tests passed; SQLite-specific tests explicitly skipped (extension absent), changed classes pass syntax check.
Release v0.10-20260918-41 packaged: 564 manifest entries/archive files, SHA256 d9b971b77e439ed423ec9406e477c3ed5db1b146b8377b880b38d595a70fc89c. Production baseline captured; upload underway. Matrix audit docs/legal41/IMPLEMENTATION_AUDIT.md separates completed UI from operator production gates. Next: activate isolated preview, run public browser checks/protected snapshot comparison, update final deployment status.


## Legal 41 — published and publicly verified, 18.09.2026
Published isolated release v0.10-20260918-41 at http://159.253.19.172:18087/more?v=41. Four complete approved legal documents and exact interface notices, independent processing/marketing/policy controls, functional cookie selector with opt-out/reopen/cross-tab persistence, server/client history gates, favorites opt-in without deleting existing saved items, and independently gated personalized recommendations. Legal reader is available when catalogue API fails. Source Google originals remain unchanged; five source snapshots/hashes retained internally.
Mobile commit 15216b8; TypeScript/all-platform export passed; 100 mobile + 180 server tests. Local and public browser verification each passed 1013 main + 8 additional checks at 320/390/768/1280; no JavaScript errors, request hosts restricted to preview origin. Screenshots reviewed. PHP modified classes syntax checked; 44 pure CommerceDriver tests passed; SQLite-specific receipt/storage tests skipped (pdo_sqlite unavailable), no extensions installed. Form context/submission fixtures are not live Bitrix evidence, and no external writes were made.
563 release files verified; previous v40 and own DB backup retained; public bundle entry-4926fb7e0a3288e42ed12fe7c88c047f.js equals export. Protected production snapshot unchanged. Report: legal41/IMPLEMENTATION_AUDIT.md; evidence: parity/evidence/legal41. Requested implementation/deployment complete; no visual ACCEPTED status. Next: owner visual review. Operator production gates and skipped integration remain explicitly outside verified scope.

## Legal42 — full package implemented locally, verification in progress
Read updated 14-document Drive package using verified gelati.gelateriaa@gmail.com. Archived originals/hashes. Imported seven public documents and new UI wording; internal matrix/contracts/risk notes remain private. Updated purpose-specific unchecked consents, separate advertising and author-publication controls, notification channel settings, public claims page, in-form order choice for claims, actual seller/version and distinct B2B contract checkout. Added cart selection and server-selected totals/quote invalidation/removal of ordered quantities, stable retry receipts. Runtime legal snapshot/consent evidence and strict seller/saleMode/publication adapter boundaries prepared; live integration remains skipped.
TypeScript and web/iOS/Android export pass; 100 mobile + 185 server tests pass. PHP lint and 44 commerce + 7 legal policy checks pass; PDO SQLite receipt tests skipped (unavailable, no extension installed). First local browser: 1689 source/UI + 8 privacy/payment + 60 critical-flow checks passed at 320/390/768/1280; final-build rerun underway after visual copy/alignment corrections. Report covers all 46 sections, actual technology registry and explicit production blockers. Next: finish final browser verification, deploy only isolated v42, compare protected snapshot, verify public bundle and browser. Not ACCEPTED.


## Legal42 — published and verified, 18.09.2026
Published http://159.253.19.172:18087/more?v=42.1, isolated release v0.10-20260918-42-1. Full current 00–13 archive, seven complete public documents, purpose-specific UI, separate advertising/publication consent, informational privacy, no artificial contractual-checkout assent, actual seller/legal-context gates, selected-cart checkout, public claims, notification channels and cookie version/hash/expiry update. Internal B2B FINAL DRAFT and legal recommendations are not publicly exposed. Final privacy patch retains expiry in active request permissions, rejecting expired consent before the UI timer.
Mobile commits 99e93d7 + 9feec10. TypeScript, web/iOS/Android export, 101 mobile + 185 server tests PASS. PHP syntax + 44 commerce/7 legal policy checks PASS; PDO SQLite receipt persistence remains skipped. Local main 1689 + extra8 + critical60 passed; public main1689/extra8/critical60 passed; final patch repeated extra8/critical60 successfully. Screenshots reviewed at 320/390/768/1280. No live external submissions or payments; browser form contexts are labelled test fixtures. Test script now awaits server-confirmed context switch before draft-cart writes.
564 manifest files verified (565 including manifest), bundle entry-ca76c1465a2b24cfbfe9e9d8f258455f.js matches local export, V41/V42 and own DB backups retained, protected host snapshot identical. PHP runtime changes remain prepared source, not enabled Bitrix integration. All 46 technical sections and external P0 are explicitly tracked in docs/legal42/IMPLEMENTATION_AUDIT.md; production legal readiness not claimed. Implementation and authorized preview deployment finished; next is owner visual review, plus separately authorized integration work. No ACCEPTED status.

## Legal43 — full-page/form audit in progress, 18.09.2026
Owner requests every application page/form checked against FINAL documents. Source 00–13 snapshots retained from Legal42; all 14 hashes verified. Inventory: 456 concrete routes, 129 Expo route files, 68 form definitions, 28 articles, 226 catalogue sections, 28 product pages and 14 brand/detail+catalog aliases. Corrections: qualified shipment/invoice/reserve terms; B2C personal-purpose IP vs B2B contract; actual-seller/order confirmation guide; alias-specific consent purposes synchronized to both validation layers; in-place return order picker and transfer/tracking fields serialized per selected item; public claim fallback; legal aliases/reader and informational footer links; warranty/FAQ wording; EDO vs transport documents; applicable conformity docs for suppliers; readOnly/disabled control accessibility.
104 mobile + 185 server tests pass; TypeScript/all exports pass (latest accessibility export being finalized). Four-width return fixture test 16 checks passes. Full 456-route two-width crawl running with throttling; >400 visits passed so far. Earlier fast crawl hit unchanged 600 API/min limit; those screens are excluded, not claimed valid. Seven-document regression on separate local preview8088 passed1689, no JS errors. Critical60 rerun after exposing disabled state on cart checkboxes; no external submissions. Source/form audit docs/legal43; browser scripts scripts/legal/browser43.cjs and return43.cjs. No integration enabled.
SSH legal43.sock active. Protected baseline docs/parity/evidence/legal43/production-before.json captured. Initial v43 archive uploaded but NOT activated; MUST repackage/re-upload after final accessibility export, because initial archive is stale. Need finish full route and critical checks, review screenshots, final package/activate isolated preview only, public verification/protected comparison, audit + commits. Do not mark ACCEPTED.


### Legal43 — final local checks and isolated publication
Final mobile commit 4e0308e. 456 routes × 2 widths = 912 visits / 4818 passing checks after full stable-build 68-form rerun (136 visits, 1022 checks). Original four build-time503 observations retained; corrected aggregate links to rerun evidence. Full document1689, critical60, return16, mobile104/server185, TypeScript/all exports pass. Published isolated v0.10-20260918-43: archive SHA7b35cdae71f2e079d3ae015799eddc0aceb409ba42ce7c933133b5b37ecd78cb, 564 files verified, priorrelease/ownDB backup retained. Public bundle entry-bd73ec84d22cc23d212a261ec35758e0.js equals export. Protected production snapshot identical. Public128-route/two-width crawl and return/critical repeat running; finish reports and parent commit. No integration enabled or visual acceptance claimed.


## Legal43 — completed and publicly verified, 18.09.2026
Published http://159.253.19.172:18087/more?v=43 (v0.10-20260918-43), mobile4e0308e. Full456-route /68-form audit against archived FINAL00–13; corrected qualified shipment/payment/reserve, purchasing legal distinctions, alias consent purposes/client+BFF+runtime parity, in-place returns with transfer/tracking, alternative claims, legal reader aliases/footer, contracts access and disabled control semantics. All14 source hashes verified; no Google refetch this sprint. Full changes/report and route/form matrices: docs/legal43.
Local912 observations /4818 checks, all68 stable-build form rerun136 /1022, document1689, critical60, return16 pass. Mobile104/server185, TypeScript/all exports pass. Public128 key routes /256 visits /1562 checks including all68 forms, critical60/return16 pass at320/390/768/1280; no JS errors. Screenshots reviewed; form schemas/orders are fixtures and no live writes made. Preliminary rate-limited and four export-time503 observations are retained/excluded in documented rerun coverage.
Isolated release verified564 files; bundle entry-bd73ec84d22cc23d212a261ec35758e0.js matches local; previous42.1 and own DB backup retained. Protected production snapshot identical. All authorized implementation/deployment work complete. Existing external integration/production legal P0 explicitly unverified per owner's skip instruction; no fake success or production legal clearance. Next: owner visual review; ACCEPTED not set.

## UX44 — implementation and local verification, 18.09.2026
Mobile commit4e2e601: automatic checkout options/final quote, stale/coupon/expiry protection; inline native/web file/provider video; Rutube social link; actionable requisites and exact-source DOCX; universal business enquiry/purpose contracts. Mobile107/server185, TypeScript/all-platform export pass. Local four-width UI fixture97 checks pass; Word downloads byte-match; direct production film advances in browser. Provider playback detailed check running. Retention initial cleanup removed32 release dirs+32 archives (16.29GB), preserving current43/rollback42.1 and DB. Cadence temp test passes. Packagev44 being prepared; isolated publication/public checks/protected snapshot and final docs remain. No integration enabled. Audit docs/ux44/AUDIT.md.

### UX44 — published and verified
Released v0.10-20260918-44 at http://159.253.19.172:18087/checkout-preview?v=44; mobile4e2e601. Archive SHA562832ddf0f4171b5ee38108a3d8eb3a5d3d2e287659920a86cb7d7331d1d549, 566 payload files verified. Public bundle entry-c968f749faf512e9f6dc20306d35b325.js matches export. Public101 checks at four widths pass, zero JS errors/live submissions. Six real videos (production+four Rutube+YouTube) demonstrably play inline; Word download MIME/bytes and phone/mail URL actions verified. Protected production snapshot unchanged. Initial cleanup freed16.29GB; current44/rollback43 retained, cleanup counter1/2. Native export passes; no physical-device or external commerce certification. Audit/evidence docs/ux44 and docs/parity/evidence/ux44. All authorized work complete; next step owner visual review (ACCEPTED not set), integration still intentionally skipped.


## UX45 — implementation and verification in progress, 18.09.2026
Added independent processing/policy choices to all68 registered forms and shared procurement/franchise surfaces, plus personal-checkout offer; B2B excludes consumer offer. Uniform square controls, understated surface, aligned copy/links, keyboard focus. Checkout confirmation requires choices and invalidates them on seller/legal/buyer changes. Synchronized BFF/runtime contracts and prepared consent ledger. Full legal document files unchanged.
TypeScript/all-platform export PASS;107 mobile and186 server tests PASS. Remote isolated PHP lint and44 pure assertions PASS,3 SQLite assertions skipped because pdo_sqlite unavailable (no extensions installed). Initial browser checkout/business four-width125 checks pass; extended B2B and all-form sweeps running. First sweep had only harness issues (empty-cart checkout redirects, hidden duplicate document label); corrected test route/wait, no UI workaround. Next: final browser review, isolatedv45 publish, public verification and protected-host comparison. No live form/order effects; integration remains skipped; owner visual acceptance pending.

UX45 isolated releasev0.10-20260918-45 is active. Mobilecommitac5bde2. Local full-form sweep1258 assertions/136 visits and specialized133 assertions pass, zero JS errors/live effects. Server manifest566 files verified; public bundleentry-850c9a8e65ebf461432a43ed4c531da8.js matches export. Protected host snapshot unchanged. Cadence cleanup removed42.1+43 release/archive pairs (1,074,948,855 bytes); retained44+45 and DBbackups. Public browser suite in progress before final handoff.

UX45 prepared-runtime review also fixed notification receipt aggregation: new processing/policy choices and separate email/SMS marketing decisions are now written together, avoiding the prior same-purpose idempotency-key collision. Added pure spy regression; passes without requiring SQLite or Bitrix.

UX45 completed/public verified: http://159.253.19.172:18087/checkout-preview?v=45. Public133 specialized +1258 all-form assertions,136 visits pass with zero JS errors/live submissions; mobile/desktop screenshots reviewed. TypeScript/three-platform export and107 mobile+186 server tests pass; PHP44 pure assertions and independent receipt regression pass (SQLite/live integration limitation remains documented). Full approved legal texts unchanged. All requested UI/validation work completed; next step owner visual review, not ACCEPTED. External integration remains intentionally skipped. Reports/evidence in docs/ux45 and docs/parity/evidence/ux45.


## UX46 — implementation in progress
B2B cards now support draft purchase for priced products with unknown stock, invoice checkout entry and business account/shortcuts. Shared ShopHeader replaces inconsistent internal-page headers; business explanation and organization picker appear across pages. Preserve explicit request-only/custom products and authoritative checkout. Organization selection can atomically merge unassigned business drafts, preserving personal/other organization carts. Next: focused tests/visual audit, isolated v46 publish. No live integration or owner acceptance claimed.


Локальная проверка завершена:933 проверки навигации/шапки/покупки +41 проверка оформления по счёту, ширины320/390/768/1280, без ошибок JS и реальных заказов. Скриншоты просмотрены. Начальные сбои тестового стенда: поиск скрытых сохранённых экранов, старое имя empty state и неполный GAR fixture; исправлены проверки/fixture, UI не обходился. Финальная mobile-версия a1810ec;108 mobile/190 server tests и экспорт трёх платформ PASS. Далее изолированная публикация46 и публичная проверка.

UX46 primary release46 activated; protected snapshot unchanged and public bundle matched. Final supplementary test found pre-existing missing aria-selected exposure in buyer tabs; patched in mobile3c58590 for immutable release46-1. No commerce logic changes in patch. Short-screen320×568 and business-account deep link pass. Final public sweep will run on46-1; first sweep hit a test-cache response disposal during context close, fixed by waiting for active route handlers before closing. Integration stays disabled.


## Final release — 18.09.2026
Published v0.10-20260918-46-1: http://159.253.19.172:18087/?v=46.1. Mobile commits a1810ec +3c58590. Final public browser: 1009 navigation/header/purchase checks plus 41 invoice checks at320/390/768/1280; no JavaScript errors or live order submissions. Direct business-account link and320×568 form also pass. Final patch adds explicit selected-state accessibility; local focused253 checks pass after the patch, in addition to933 baseline navigation +41 invoice checks. Screenshots reviewed. TypeScript/all-platform export and108 mobile/190 server tests pass.
Bundle entry-e40d770781659acc65f2af83b1d3ff6f.js matches export byte-for-byte; SHA256 da5dc118e3694c14bf9a892d5ff470b041900337d5682d389128a14e628f6d3e. Archive SHA256 c895411f1885f77655ae5aa3e2cc0dd05b3af40c0a8e632deeb374b44661aac4;566 payload files plus manifest verified. Protected production snapshot unchanged. Primary46 skipped cleanup; following patch46-1 triggered configured every-other-release cleanup, removing44/45 release/archive pairs (1075459648bytes), retaining46/46-1 and database backups.
All authorized UI/navigation work complete. External Bitrix integration remains deliberately disabled; actual identity verification, live order/invoice issuance and physical native device acceptance are not claimed. Next step owner visual review; ACCEPTED not set.


## UX47 — in progress
Owner asks city/search in one row, wider city, compact buyer/organization below that scroll away. Implementing native page-content prefix via shared PageScroll, preserving actual scroll handlers and list headers. Header remains shared; no commerce/backend change. Next: fallback screen audit, responsive browser scroll/search/selector tests, isolated47 deployment.

UX47 initial local audit:108 mobile tests, TypeScript and all-platform export pass;885 responsive checks pass across320/390/768/1280 including320×568. Screenshots confirm buyer controls scroll out while city/search stay fixed. Follow-up review shortened320px search placeholder and removed pre-existing duplicate Notifications context switch. Final rebuild and city/checkout/form verification pending. No backend changes or live submissions.

UX47 release47 active, mobile143fd57.566 payload hashes verified, public bundle equals local SHA25646758867cef694e28b15da73d880c1277a2db0aaef3d45f38c0a37927ae8a043; protected snapshot identical. Retention due=false, no cleanup this release;46-1 rollback retained. Final local/public four-width sweep running; focused long-city/checkout/form draft tests passed320/390/1280.

UX47 final local sweep completed:966 checks,0 JS errors at320/390/768/1280, including320×568. Long-city fixture/checkout scroll/form text retention passed separately. Public sweep in progress; reviewed published mobile screenshot matches local.


## UX47 — завершено,18.09.2026
Опубликована версияv0.10-20260918-47: http://159.253.19.172:18087/?v=47. Mobile143fd57. Поиск рядом с расширенным двухстрочным городом; компактные режим покупателя, выбор организации и пояснение находятся в прокручиваемом содержимом. Сохраняются функциональность и выбранный контекст.
TypeScript/экспорт web+iOS+Android/108 mobile tests PASS. Финальные проверки:966 локальных и960 публичных, ширины320/390/768/1280 (320×568),0 JS errors. Дополнительно длинное название города/UI fixture, checkout scroll и сохранение текста формы прошли320/390/1280. Скриншоты просмотрены; живых заказов/обращений не было.
566 payload hashes плюс manifest проверены. Public bundle entry-c91656d33c5d0b20ab9a17f5d0032f6e.js совпадает побайтно; защищённый сайт не изменился.46-1 и backup собственнойБД сохранены, очистка по cadence на этом выпуске не выполнялась. Интеграция Битрикс по-прежнему пропущена. Следующий шаг — визуальная оценка владельца; ACCEPTED не выставлен. Report:ux47/REPORT.md.


UX48: owner requests longer search without blank space around city. Changing fixed42% width into intrinsic width capped42%; no feature changes. Testing extreme names from local GAR and Кременчуг-Константиновское.

UX48 final local checks PASS for12 city/viewport combinations and3 catalog search flows, zero JS errors. Fixed SVG shrink found during screenshot review. Final mobile commits5f93102+cb82c30; TypeScript/all-platform export PASS. Packaging isolated48, public verification next. No new business/backend tests needed for this presentation-only change.


## UX48 - published and verified, 18.09.2026
Release v0.10-20260918-48: http://159.253.19.172:18087/?v=48. Mobile commits5f93102+cb82c30. Intrinsic city width capped42%, search fills remainder, icons keep size. Saint Petersburg city slot156px instead of240px on desktop, freeing84px for search. No logic or data changes.
TypeScript/all-platform export PASS. Local and public each12 city/viewport cases plus3 search flows at320/390/1280, zero JS errors. Tested short, long hyphenated and66-character GAR labels using UI-only fixtures, reviewed screenshots. Complete name remains in picker and accessibility; extreme labels truncate to two lines on small screens. No live submissions/native-device acceptance claimed.
566 payload files plus manifest verified; public bundle matches local and protected host snapshot unchanged. Retention cadence removed46/46-1 release/archive pairs (1075559024bytes), keeping47/48 and DB backups. Integration remains skipped. All authorized work completed; next step owner visual review, ACCEPTED not set.


UX49 in progress: owner removes buyer controls from favorites/editorial menu pages. Opt-out at screen boundaries, no change to shared BuyerContextSwitch or state. Preserve commerce/form context and local warranty-rule tabs.

UX49 mobile1f3b075, TypeScript/all-platform export PASS. Screenshots of populated favorites/About confirm prefix removed with shared search retained. Initial test harness incorrectly expected a cookie notice after accepting all and a buyer selector after the existing catalog-brand to editorial redirect; corrected harness to follow actual behavior. Final sweep running, isolated49 package uploaded. No implementation workaround or live submission.


## UX49 - published and verified, 18.09.2026
Release v0.10-20260918-49: http://159.253.19.172:18087/pages/about?v=49. Mobile1f3b075. Favorites and editorial/menu pages no longer render buyer/organization/explanation prefix. Shared header/search/city, saved favorites and buyer context remain. Shopping/form/account controls and local warranty-rule tabs are preserved.
TypeScript/all-platform export PASS.119 local and119 public navigation checks at390/1280,0 JavaScript errors; populated favorites, content routes, editorial-brand redirect, business context restoration and personal content views verified. Screenshots reviewed. No live orders/forms submitted, native physical-device testing not claimed.
566 payload hashes plus manifest verified; public bundle matches export and protected-host snapshot unchanged. Previous48 and own DB backup retained; cadence cleanup not due on49. External integration remains skipped. All authorized work complete; next step owner visual review, ACCEPTED not set.


UX50 in progress: About hero replaced with owner exhibition photograph and Home-style rounded banner/orange history CTA. Original image unchanged, responsive composition protects faces/equipment. Existing copy/content preserved; TypeScript/export and visual checks next.


## UX50 - published and verified, 18.09.2026
Release v0.10-20260918-50: http://159.253.19.172:18087/pages/about?v=50. Mobile ea7e2de. Owner exhibition photo stays original/full4:3; Home-style rounded banner, white heading, orange history CTA. Upper-only gradient on wide screens, untinted full photo with copy below on mobile. Approved company content and UX49 header behavior preserved.
TypeScript and web/iOS/Android export pass. Local and public checks at320/390/640/768/1280 pass: original image loads,4:3 frame, single H1, no buyer prefix, copy above faces, working history scroll,0 JS errors. Published screenshots reviewed. No live submissions/native physical-device acceptance claimed.
568 payload hashes plus manifest verified; public bundle and original photo byte-identical to local assets, protected-host snapshot unchanged. Retention cadence removed47/48 release/archive pairs (1075579081bytes), retained49/50 and own DB backups. Integration remains skipped. All authorized work complete; next step owner visual review, ACCEPTED not set.


UX51 in progress: remove closed branch/country references from active app content and public city configuration per owner. Contacts, branch detail records, About and Awards updated; review/export next.


## UX51 - published and verified, 18.09.2026
Release v0.10-20260918-51: http://159.253.19.172:18087/pages/about?v=51. Mobile3f24f55. Closed branch/country mentions removed from active app content, contact records and public city configuration. Remaining16 contacts preserved; award result retained without associated closed-location sentence. Historical source/evidence unchanged.
TypeScript and web/iOS/Android export PASS;9 existing public API tests PASS. Active runtime scan and67 exported/asset/document text files contain no matching terms. 27 local and27 public browser checks at390/1280 PASS,0 JS errors:8 content routes, About expanded branch list, contacts search exclusions and16-city public config. Published screenshot reviewed. No live submissions or native-device acceptance claimed.
568 payload hashes plus manifest verified; public bundle byte-identical to export; protected-host snapshot unchanged.50 rollback and own DB backup retained. Retention cleanup not due on51. Integration still intentionally skipped. No remaining implementation work; next step owner review. ACCEPTED not set.
