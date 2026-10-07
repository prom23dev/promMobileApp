# V9 — техническая проверка кандидата, 11.09.2026

**Выпуск в магазины BLOCKED.** Проверены исходники, локальный HTTP, web DOM и подготовительные сборочные шаги. Expo export и prebuild прошли; подписанные IPA/AAB/APK, установка, работа на устройствах и подключённый Bitrix не проверены и не объявляются готовыми. Пользователь отложил подключение реальных аккаунтов, заказов, оплаты и ERP программистам; это граница текущей реализации, а не успешная приёмка этих функций.

Зафиксирован web entry `entry-f511f4c425f0956cb8c2dd105ef3dba2.js`, SHA-256 `27a9c685453283780f6d80f010ea732a4f0fad6a8afb842358d3c0b9485bf859`. Все пять DOM-проверок и переход внутри приложения относятся к нему. [DOM-артефакт](technical-release-v9-metadata.json), [HTTP-проверки](technical-release-v9-http.json), [размеры](technical-release-v9-sizes.json).

Статусы ниже локальны к конкретной проверке: **PASS** — есть указанное доказательство; **PARTIAL** — часть требования подтверждена; **BLOCKED** — нужен отсутствующий runtime/инструмент/аккаунт; **EXPECTED FAIL** — предохранитель намеренно отказал. Это дополнение к [249 пунктам MASTER5](master5-acceptance.json), а не замена полного QA.

## Сборка и защита выпуска

| Проверка | Статус и доказательство | Практическая граница |
|---|---|---|
| TypeScript | PASS: [typecheck-v9-technical.log](typecheck-v9-technical.log), exit 0 | Статическая проверка, не запуск native приложения |
| Клиентские тесты | PASS: **73/73**, [mobile-v9-technical-final.log](mobile-v9-technical-final.log) | Domain/transport/формы/контракты/экспорт; не 73 живых операций магазина |
| Серверные тесты | PASS: **82/82**, [server-master5-final.log](server-master5-final.log) | Изолированные SQLite/HTTP/контракты и fail-closed поведение; CRM/1С/PSP не вызывались |
| Прокси preview | PASS: **1/1**, [preview-v9-technical.log](preview-v9-technical.log) | Проверены host allowlist, запрет traversal/несуществующих файлов, методы, robots, передача заголовков в изолированный API |
| Web export | PASS: [web-export-v9-final.log](web-export-v9-final.log); конечный entry совпал с DOM | SPA для preview, не индексируемый сайт и не mobile binary |
| Native Expo export | PASS подготовительного шага: [native-export-v9.log](native-export-v9.log) | Скомпилированы Hermes JS bundles iOS/Android и ресурсы. Это не Xcode archive/Gradle package |
| Expo prebuild | PASS подготовительного шага: [prebuild-v9.log](prebuild-v9.log) | Созданы проекты ios/android. Pods/Gradle compilation, signing и установка этим не подтверждаются |
| EAS `preview` | PASS gate: exit 0, [technical-release-v9-checks.json](technical-release-v9-checks.json) | Разрешён лишь внутренний профиль; EAS build не запускался |
| EAS `production` и отсутствующий профиль | EXPECTED FAIL: оба exit 1, тот же [артефакт](technical-release-v9-checks.json) | `eas-release-gate.cjs:2` вызывает `check-release.cjs`; соответствующий npm hook задан в `mobile/package.json` |
| Прямой `check-release.cjs` | EXPECTED FAIL: exit 1 с перечнем подключений и приёмок, [toolchain](technical-release-v9-toolchain.json) | Отказ — правильное поведение, а не неудачная попытка отправить приложение |
| Xcode | BLOCKED: `xcodebuild -version` exit 1; активны только CommandLineTools | Нет доступного полноценного Xcode в выбранной developer directory |
| JDK | BLOCKED: `java_home -V` и `java -version` exit 1, Java Runtime не найден | Gradle/native Android build не выполнялся |
| Подписанные/установочные артефакты | BLOCKED: в проверенных `mobile/ios`, `mobile/android`, `mobile/native-export` IPA/AAB/APK не найдены | Проверка не ищет артефакты во всём компьютере и не подтверждает отсутствие внешних сборок |

Конфигурация остаётся preview: `mobile/app.json:6` — scheme `prom23-preview`, identifiers `ru.prom23.preview`, `releaseReady:false`; `mobile/eas.json` содержит только internal preview APK profile. Store identifiers, production signing, release provisioning и анкеты магазинов не назначались этой проверкой. Блокирующий npm hook не заменяет организационный контроль ручной отправки уже собранного артефакта.

## Исправленный дефект подготовки HTML

**FIXED:** `mobile/scripts/prepare-web.cjs` при повторном запуске на подготовленном HTML ранее добавлял ещё один robots meta и одинаковый CSS. Выделен чистый `normalizePreviewHtml` (`:5`), удаляющий только прежний robots meta и свой точный stylesheet перед повторной вставкой. Иные метаданные и стили сохраняются; HTML без head отвергается.

Добавлены два теста в `mobile/tests/prepare-web.test.ts`: повторный вызов даёт идентичную строку, сохранены чужие description/CSS; устаревшие `index, follow` и повторные robots не сохраняются. Существующий замороженный `dist/index.html` **не перезаписывался**: результат функции в памяти совпал с файлом побайтно, [доказательство](technical-release-v9-checks.json). Исправление относится к воспроизводимости следующих экспортов и не требует изменения текущего bundle.

## SEO и семантика preview

Применён локальный skill `~/.agents/skills/seo/SKILL.md`: сначала проверены indexability/метаданные/структура, затем конкретные ограничения контента. Производственная индексация, поисковая видимость и native accessibility не объявляются пройденными.

Проверка выполнена **отдельным headless Chrome/Playwright context** на `http://127.0.0.1:8087`, viewport 390×844, reduced motion. Скрипт [technical-metadata-v9.cjs](../../mobile/scripts/technical-metadata-v9.cjs) запрещает внешние запросы и реальные формы. Создана только собственная preview-сессия для штатного старта UI, затем удалена; токен не записан в отчёт. Внешних отправок и ошибок JavaScript не было. Прежний незавершённый scan на старом entry не используется как доказательство.

| URL | Фактический title | Фактический H1 | Description / результат |
|---|---|---|---|
| `/` | Строительное оборудование и инструмент \| Промышленник | Леса. Вышки. Оборудование. | Про опалубку, леса, вышки, инструмент, личные покупки и поставки; отдельный от каталога текст |
| `/catalog` | Каталог строительного оборудования \| Промышленник | Каталог | Про выбор, характеристики, комплектацию и подбор для объекта/производства |
| `/information/delivery` | Доставка и самовывоз \| Промышленник | Доставка | «На объект, до терминала или со склада» |
| `/information/production` | Собственное производство \| Промышленник | Производство | «От проектирования до готового оборудования» |
| `/account` | Кабинет покупателя \| Промышленник | Кабинет | Description отсутствует; после SPA-перехода с главной чужое описание не остаётся |

На каждом из пяти экранов один H1 и разделы H2; производство дополнительно использует H3 внутри разделов. Полные строки и уровни — в [DOM JSON](technical-release-v9-metadata.json). В React Native Web H1 может быть настоящим `h1` либо `role=heading aria-level=1`; оба варианта учтены. Виртуализированная главная содержит в DOM только смонтированные блоки: это проверка её текущего состояния, не полного поискового обхода скрытых/несмонтированных разделов.

PASS для намеренного запрета индексации:

- `lang=ru` и статический robots meta в HTML; `mobile/scripts/prepare-web.cjs:10`, `mobile/app/+html.tsx`.
- `PageMeta` (`mobile/src/ui/PageMeta.tsx:5`) сохраняет noindex при переходе между экранами. В DOM **два одинаковых** `noindex, nofollow`: shell + PageMeta; конфликтующих `index` нет. Исправление подготовки устраняет накопление тегов при повторном запуске, а не этот независимый клиентский тег.
- HTTP `X-Robots-Tag: noindex, nofollow` на страницах и API через `preview/http.mjs:6`; `robots.txt` содержит `Disallow: /` (`:35`). Подтверждено [GET-проверками](technical-release-v9-http.json).
- Каноникалы отсутствуют, sitemap не заявляется. Для закрытого preview это намеренно; DNS и public production SEO не менялись.

**OPEN для отдельного публичного web-выпуска:** SPA shell не содержит серверно отрисованных товарных/контентных страниц. Доставка/производство используют короткий subtitle как meta description (`InformationScreen.tsx:34`), а не подготовленное поисковое описание. Перед публичным web-релизом нужен отдельный выбор индексируемых URL, SSR/static rendering, корректные 404/canonical и метаданные по реальному содержимому. Product/Organization/FAQ schema нельзя добавлять по неподтверждённым остаткам, рейтингам или компании-продавцу. Сейчас это не основание снимать noindex и не блокер закрытого UI preview.

## MASTER5 §175–189 и §228: точная проверка

| Пункт | Статус | Реализовано / доказательство | Что остаётся |
|---|---|---|---|
| 175 responsive/lazy/prefetch/cache/pagination | PARTIAL | Реальные 720px варианты srcset в product snapshot; только текущая/соседняя картинка в `ProductGallery.tsx:29`; `FlatList` ограничивает рендер в `CatalogScreen.tsx:96`, `HomeFeed.tsx:67`; HTTP static cache/gzip и content ETag; `/api/v1/catalog` cursor≤50 проверен сервером | Нет явной image-prefetch стратегии; offline/image-cache бюджет не испытан. Главный каталог всё ещё читает полный 28-SKU snapshot и фильтрует локально, pagination API им не потребляется. Полный ассортимент/100k не протестирован |
| 176 качество изображений | PARTIAL | Исходные фото с provenance/хэшами; product `resizeMode=contain`; [144 references / 136 assets](product-assets-master5.json), [extractor4/4](product-snapshot-tests-master5.log); визуальные mobile viewport артефакты QA | Это не проверка качества всех изображений на всех DPI/планшетах и не подтверждение оптимального трафика |
| 177 instant search / 60fps / no jank | BLOCKED для численных обещаний | Поиск работает на небольшом снимке; виртуализация уменьшает рендер; имеется локальная GAR microbenchmark, [location-tests.md](location-tests.md) | Нет release-device frame traces, cold/warm launch, throttled-network search timing, memory/thermal budget, p95/low-end Android. CWV LCP/INP/CLS не измерены; API microbenchmark не заменяет UI/native измерения |
| 178 automated test infrastructure | PASS ограниченного кода | 73 client +82 server +1 preview, команды в логах выше; TypeScript PASS | Это не покрытие всех живых form/commerce сценариев |
| 179 navigation/back/deep link | PARTIAL | Отдельный [финальный route QA](qa-v9-final-routes.json), [core QA](qa-v9-core-report.json), metadata SPA→account | Полный финальный verdict выдаёт основной QA после paced retries. Быстрые reload исчерпали rate budget и дали bootstrap errors; эти строки не означают автоматически отсутствующие tabs. Custom preview scheme не доказывает Universal/App Links |
| 180 product→add→badge1→cart1tap | PARTIAL | Core browser check подтверждает локальную корзину и badge, [qa-v9-core-report.json](qa-v9-core-report.json) | Это draft, не оплаченный/зарезервированный заказ; final native сценарий не выполнен |
| 181 Home→About и bottom nav | PARTIAL | Проверяется отдельным navigation QA, [итоговые маршруты](qa-v9-final-routes.json) | Этот metadata scan не нажимал цепочку Home→About и не принимает её за основной QA |
| 182 Profile→Order→Return→Upload→Submit | BLOCKED | Формы/DTO/source-контракт доступны, `api/site.ts:23–30` не делает сеть и не возвращает фиктивный успех | Нужны реальный владелец/завершённый заказ, товары/причины из БД, storage validation, consent proof и подтверждённый backend ответ |
| 183 Динская/FIAS/availability | PARTIAL | Официальный GAR, выбор ID, CAS и изоляция проверены; [location-tests](location-tests.md), [HTTP6/6](master5-http-tests.log). Availability привязана к product/locationVersion/buyerContext | После выбора обновляется запрос/состояние; реальные складские данные неизвестны до Bitrix mapping/readInventory. Нельзя назвать это успешным обновлением реального наличия |
| 184 «абракадабра 777» нельзя сохранить | PASS ограниченного контракта | Только найденный официальный ID; no free-text save, server validation; UI fake-input check в core QA | Общее качество fuzzy/однозначности по всем вводам не выводится из одного кейса |
| 185 смена места с корзиной/revalidate | PARTIAL | Сохраняется состав, CAS защищает состояние, устаревшие quotes инвалидируются; notice предусмотрен | Commerce revalidation отвечает недоступностью до Bitrix; заказ не разрешается по старой цене. Не считать 503 успешным пересчётом |
| 186 fresh B2C без организации покупает | PARTIAL / live BLOCKED | Новый draft personal и пустой город, доступ к каталогу/корзине; fake organization не требуется | Fresh native install и настоящий checkout/payment не прошли |
| 187 B2B switch/basket/price/documents | BLOCKED для live | Контракт actor/org, отрицательные проверки изоляции и старая fixture изоляция есть | Fixture `organization-demo` не является членством в организации; реальные полномочия, цены и документы требуют Bitrix/1С |
| 188 каждая real form: positive/required/server/duptap/timeout | PARTIAL / positive BLOCKED | Локальные validators, транспортные timeout/error tests; исходный registry и consent/attachment границы, [forms-parity](../audit/forms-parity.md) | Нет положительной приёмки каждой реальной формы. Динамические CForm/HL enums/файлы/идемпотентность/удаление должны проверяться с backend |
| 189 secrets/P0 | PARTIAL | [security-v9.log](security-v9.log): 1862 source files, 5 уникальных кандидатов, **0 совпадений их значений** в проверенных app artifacts; значения в отчёте не раскрыты. Allowlist packaging, закрытые writes, auth/origin/SQL tests | Это targeted leak scan, не доказательство отсутствия любых секретов/CVE. Ротация исходных credentials владельцем, история git, merged native manifests и итоговый SBOM не подтверждены |
| 228 Home→About→Production→Back→Contacts/nav | PARTIAL | Контент и навигация проверяются отдельным финальным browser flow QA; [content states](content-v9-r2/states-results.json), [header/click](content-v9-r2/header-cooperation-results.json) | Ни проверка пяти direct URLs, ни H1/title сами по себе не доказывают эту последовательность или native приёмку |

## Производительность: измеренные размеры и известный остаток

[Снимок размеров конечного entry](technical-release-v9-sizes.json): JS **5,834,442 B**, gzip **853,335 B** (локальное gzip-сжатие, не Lighthouse/реальный transferred-size trace). 136 товарных фото занимают 38,723,737 B, 28 каталожных — 4,579,018 B. Bundled local assets не загружаются в браузере все одновременно; размер набора нельзя приравнивать к первой загрузке страницы. Для native он, напротив, влияет на ресурсный набор сборки.

Три blog-иллюстрации весят 3.25–3.51 MB каждая: `articles-vyshka-tura-ili-stroitelnye-lesa-5-shagov-k-pravilnomu-vyboru-dlya-fasada-i-remonta.png`, `articles-setka-zatenyayushchaya-promyshlennik-kak-vybrat-dlya-stroyki-dachi-maskirovki-i-dekora.png`, `articles-khomutovye-stroitelnye-lesa-promyshlennik-poshagovaya-sborka-vidy-khomutov-i-sovety-po-montazhu.jpg`. Это конкретный **OPEN performance gap**: выделить mobile варианты из подтверждённых исходников/готового CDN srcset, сохранить исходные URL/provenance; затем измерить качество и decode-memory на устройствах. На этапе freeze ресурсы не менялись. `automated-tube-concept.png` также около2 MB в assets inventory, но сам факт наличия файла не доказывает его загрузку в каждом экранном сценарии.

`preview/http.mjs:44–47` поддерживает заранее созданный `.gz`, кеширует assets на час, HTML no-store. Прокси не генерирует gzip во время запроса. Public content имеет ETag и 304 без тела; домашняя конфигурация и catalog по текущему API no-store. Native `Image` использует механизм платформы; отдельная проверенная политика prefetch/cache eviction не реализована. Бюджеты производительности назначаются и принимаются отдельной работой до store release.

## API/transport и native границы

- `server/public-v1.mjs:58–64`: preview capabilities явно оставляют authentication/organizations/checkout/payments/order/form/consent/notification/push writes выключенными. Snapshot provenance отмечает `regionalPricing:false`, `stock:unverified`, `checkoutEligible:false` (`:56–57`). `city` публичного snapshot API — контекст филиала отображения, не официальный GAR и не склад.
- `server/app.mjs:612–617`: availability требует свою сессию и выбранный GAR; ответ содержит productId/settlementId/locationVersion/buyerContext. HTTP401 без сессии проверен на frozen preview; два injected callbacks для Bitrix mapping/inventory сейчас не подключены. Без mapping возвращается unknown, не нулевой или выдуманный остаток. [Контракт](../api/product-details.md).
- `server/app.mjs:623–635`: при обычном запуске `allowTestFixtureOperations=false` реальные history/operations недоступны. Старые fixture данные не превращаются в customer records. Параметр не включается через request; production auth не заменяется opaque preview token. [Read-only HTTP6/6](master5-http-tests.log), [handoff](../../integrations/README.md).
- Public content GET whitelist/неизменяемые IDs/без HTML, safe fallback и ETag304 проверены. Это подключённый snapshot endpoint с optional client loader, **не работающая CMS**. [Контракт](../api/public-content.md).
- `mobile/src/api/local.ts:13–14`: текущий native transport по умолчанию смотрит на `127.0.0.1:8090`. На телефоне это сам телефон. Требуется отдельный разрешённый HTTPS BFF адрес; API host и true login не возникают из web export. Локальный HTTP preview по SSH-туннелю не является production TLS конфигурацией.
- `mobile/src/api/client.ts:22–55` — будущий HTTPS транспорт с origin/path boundary, parse, timeout, без автоматического повтора и без cookies; реальные endpoints/auth-refresh ещё не подключены. Нельзя перенести local-session token как production identity.
- `mobile/app.json` запрещает arbitrary ATS loads, Android backup и лишние permissions. Сгенерированный `AndroidManifest.xml:2–13` содержит remove для mic/contacts/SMS/location/media/storage; updates ENABLED=false (`:24`). Итоговый merged release manifest/SDK permissions/privacy manifests/16KB native libs не проверены без сборки.
- `prom23-preview` custom scheme есть в generated Android manifest (`:37`) и iOS URL schemes. Production associated domains / Android HTTPS intent filters / AASA / assetlinks и their verified-device behavior не настроены этой задачей. Push APNs/FCM/device token/permissions/cold-start tap также остаются отдельной интеграцией; не отправлялись кампании.

## Перед передачей на store release

Следующий ограниченный этап программистов: подключить подтверждённые actor/org и GAR→serviceRegion→warehouse/priceGroup callbacks, сохраняя existing Sale events→Bitrix24/1С без повторных прямых leads; затем проверить order/payment/return/consent идемпотентность, изоляцию и журнал результата на тестовых аккаунтах. Практический порядок и доступные модули — [integrations/README.md](../../integrations/README.md).

Отдельно подготовить доступный HTTPS BFF, release identifiers/signing/Xcode/JDK, собрать IPA/AAB, проверить merged permissions/SBOM/privacy/store forms, native back/deep links/push/picker и performance на устройствах. До этого выключенные интеграции и ожидаемый release отказ сохраняются. Ни этот отчёт, ни текущие 73/82 теста не означают полного соответствия магазинам или юридической приёмки на сентябрь2026.
