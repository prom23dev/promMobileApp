# ADR 001 — мобильный стек Промышленник

Дата: 11 сентября 2026 года. Статус: **рекомендуемое решение DISCOVERY; перед production фиксируется после native integration/performance spikes**. Область: клиент iOS/Android для App Store, Google Play, RuStore; B2C/B2B поверх существующего Bitrix через отдельный BFF. Основание: master §4 и backend discovery. Это не отчёт о прохождении магазинов и не юридическое заключение.

## Контекст и ограничения

Проект уже содержит React Native/TypeScript/Expo: `mobile/package.json:7`, RN 0.86.3, Expo 57, Expo Router, SecureStore и Notifications. Настройки всё ещё preview: `mobile/app.json:6`, `:11`, `:19`, `:58` — тестовая схема/идентификаторы, local-sandbox, releaseReady=false. `mobile/eas.json` содержит внутреннюю preview-сборку; production pipeline/подпись не подтверждены.

Каталог, варианты SKU, фасеты, корзины, заказ, документы, юридические лица и права дают большую общую бизнес-поверхность. Граница реального риска сейчас — неподключённый backend: `mobile/src/api/site.ts:27`, `commerce.ts:6`; runtime Bitrix/DB отсутствует локально. Смена языка клиента не устраняет auth/RBAC/CRM/1C/payment блокеры из `docs/discovery/backend-audit.md`.

Пользователь предпочитает общую кодовую базу при отсутствии существенных компромиссов. Требуются высокая скорость, системное поведение, доступность, большие списки, offline и нативные SDK. Фактический размер/опыт будущей команды, бюджет, целевые минимальные ОС и парк устройств пока не заданы; ниже сравнение не выдаёт выдуманные сроки, FPS и рублёвую экономию за измерения.

## Решение

**Продолжить React Native + TypeScript с Expo development builds/CNG и возможностью собственных Swift/Kotlin модулей.** Expo Go не принимать за release runtime. Общими остаются модель данных, API contract, каталог, корзина, B2B сценарии и дизайн-система. Push, payment SDK, maps, secure authentication и background integration имеют отдельные платформенные адаптеры, проверяемые на реальных устройствах.

Expo допускает собственный native code и development builds; это подходящая граница для SDK, которых нет в стандартном runtime. [Expo: custom native code](https://docs.expo.dev/workflow/customizing/). Локальные native builds доступны; EAS cloud не является обязательным местом хранения production signing keys. [Expo: local app development](https://docs.expo.dev/guides/local-app-overview/).

Выбор основан на уже созданном проверяемом клиенте и большой общей бизнес-логике, а не на заявлении, что RN всегда быстрее Flutter/native. Выигрыш от полной переписи пока не доказан. Native integration и performance gates ниже могут изменить решение до выпуска.

## Рассмотренные варианты

**Flutter/Dart:** общая кодовая база, собственный rendering stack и release compilation; platform channels/native integration оставляют выход к системным SDK. Для этого проекта означают перенос существующего TypeScript UI/domain и новое подтверждение всех сценариев; воспроизводимая визуальная система может быть полезна, но измеренного выигрыша здесь нет. [Flutter architecture](https://docs.flutter.dev/resources/architectural-overview).

**React Native/TypeScript:** использует native platform components и допускает платформенные модули; существующий клиент можно развивать по вертикальным сценариям. Условия: измерять release build, удерживать тяжёлую работу вне интерактивного JS пути, ограничивать память и количество одновременно отрисованных строк. [RN components](https://reactnative.dev/docs/intro-react-native-components), [RN performance](https://reactnative.dev/docs/performance.html), [RN native platform](https://reactnative.dev/docs/native-platform).

**Swift/SwiftUI + Kotlin/Compose:** два отдельных клиента с прямой платформенной интеграцией. Общий BFF/OpenAPI и продуктовые спецификации сохраняются, но UI/state/accessibility/native QA реализуются отдельно. Это сильный вариант, если системные функции становятся основным продуктом или реальные измерения показывают неустранимые ограничения общего клиента. Сегодня такая необходимость не доказана.

## Сравнение по каждому критерию master §4

Таблица — инженерная оценка применительно к этому репозиторию, не универсальный benchmark. «Подходит» означает реализуемость при соответствующей интеграции, а не уже пройденную проверку.

| Критерий | Flutter | React Native + Expo dev builds | Swift + Kotlin | Вывод для Промышленник |
|---|---|---|---|---|
| Performance | Контролируемая отрисовка; профилировать layout/images/isolate work | Профилировать release JS/UI, lists, images и native transitions | Прямой контроль платформенных инструментов; плохой код также тормозит | Нет измерений, оправдывающих перепись; perf gates обязательны |
| Стоимость поддержки | Один Dart клиент + native plugins; миграция текущего UI | Одна TS база + native adapters; учитывать обновления Expo/RN | Две клиентские реализации и синхронизация релизов | RN снижает объём переноса существующей работы; стоимость не оценена в деньгах |
| Скорость разработки | Общие фичи, но сначала перенос domain/UI/tests | Итерационное подключение существующих экранов | Параллельная работа двух платформенных специализаций | RN быстрее до следующего проверяемого slice по состоянию репозитория |
| Стабильность | Зависимость от engine/plugins и собственной дисциплины | Зависимость от RN/Expo/SDK compatibility; release lockfile и upgrade cadence | Прямая SDK совместимость, две матрицы регрессии | Ни один стек сам по себе не доказывает crash-free/ANR-free |
| App Store | Native binary; privacy, policy, signing и UX проверяются отдельно | Native binary; preview нельзя подать как завершённый продукт | Прямая платформа не освобождает от review | Для всех нужны реальный backend, privacy/SDK disclosure и review test account |
| Google Play | Android build + актуальные platform/policy требования | Android build + та же приёмка, native modules проверяются | Kotlin build + та же приёмка | Выбор языка не закрывает Data Safety/target API/permissions |
| RuStore | Проверить выбранные plugins/bridge и push на целевых устройствах | Официальный RN push SDK существует; проверить совместимость текущей RN и дистрибуцию | Прямая Android SDK интеграция | Отдельный flavor/provider routing; нельзя сделать продукт зависимым только от Google services |
| Push | Платформенные провайдеры через plugins | APNs/FCM/RuStore adapters; package присутствует, доставки ещё нет | Прямые SDK по платформам | Общий server event/consent contract, реальные credential/device tests |
| Deep links | OS association + router handling | Expo Router/linking + OS association; preview scheme недостаточна | Прямые platform handlers | Verified HTTPS links и cold/warm/auth/context tests одинаково обязательны |
| Biometrics | Platform auth plugin | Native auth/secure storage adapter | LocalAuthentication / BiometricPrompt | Только локальное разблокирование после реального login; не замена server auth |
| Камеры | Native camera plugin lifecycle | Camera module/native adapter lifecycle | Прямые platform APIs | Запрос разрешения по действию; fallback без камеры; пока не внедрено |
| QR/barcode | Decoder/native plugin; нагрузочные тесты | Decoder/native module; не декодировать поток тяжёлым JS | Прямое platform/decoder integration | Проверить EAN/SKU mapping, слабый свет, offline; не только demo QR |
| Карты | Уточнить SDK поставщика и качество plugin | Уточнить SDK/лицензию и RN compatibility | Прямой SDK | Сначала выбрать реального поставщика; каталог адресов должен работать без карты |
| Платежи | Hosted flow/native SDK plugins | Hosted flow/native module; текущую raw-card PHP форму не переносить | Прямые PSP SDK | Backend создаёт/подтверждает payment; callback не равен оплате; PAN/CVV вне обычных форм |
| Offline | Local DB/cache + sync policy | Local DB/cache + versioned state; текущего snapshot недостаточно | Отдельная реализация хранилищ на двух платформах | Browsing/cart draft доступен; order/payment требуют актуального server подтверждения |
| Accessibility | Semantics + platform testing | accessibility props/native semantics + platform testing | Прямые platform APIs; качество не автоматическое | VoiceOver/TalkBack, Dynamic Type, focus, errors, contrast проверяются на devices |
| Сложный каталог | Общий domain/facets/variants UI | Уже есть TS domain/UI; нужен реальный product/offer schema | Domain/UI дублируются при общем BFF | RN reuse полезен; hardcoded filters/price не приемлемы в любом стеке |
| Большой список SKU | Lazy lists/slivers, paging, memory budget | Virtualized lists, paging, stable keys, measured rerenders | Platform lazy collections | 10–100k SKU хранит/ищет backend; клиент загружает страницы, а не весь ассортимент |
| Background operations | Нативные ограничения ОС через plugins | Нативные ограничения ОС через modules/tasks | Прямые OS schedulers | Ни один стек не обещает произвольный вечный background; order retry не запускать вслепую |
| CI/CD | Dart tests + iOS/Android signed builds | TS/contract tests + dev/staging/prod native builds; EAS или local CI | Два build/test pipelines + общий API compatibility | Секреты/signing вне репозитория; device smoke и staged rollout для каждой платформы |
| Размер команды | Dart/mobile специалист + native помощь + backend/QA | TS/RN mobile специалист с native компетенцией + backend/QA | Отдельное владение iOS и Android + backend/QA | Это модель компетенций, не оценка текущего штата; не обещать одного универсального разработчика |
| Долгосрочный TCO | Содержание plugin stack + миграция/обучение + QA | Содержание RN/Expo/native adapters + upgrades + QA | Дублирование feature work, при меньшей прослойке SDK | RN выбран при нынешнем продукте; пересмотр по реальным integration/upgrade затратам |

Apple оценивает законченность приложения и реальное поведение, а не только выбранный фреймворк; обязательства privacy/payment/account management проверяются отдельно. [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/). Эта ADR не фиксирует forever требования магазинов: релизная compliance-матрица актуализируется непосредственно перед подачей.

Официальный [RuStore React Native push SDK](https://www.rustore.ru/help/sdk/push-notifications/react/6-0-0) подтверждает наличие пути интеграции. Это не доказательство совместимости установленной RN 0.86.3, доступа к Console, регистрации package/signature и доставки на каждом Android без GMS — всё это входит в spike.

HTTPS deep links требуют подтверждённой связи сайта и приложения, не только custom scheme. [Apple: app/site association](https://developer.apple.com/documentation/xcode/allowing-apps-and-websites-to-link-to-your-content). Background sync должен использовать разрешённые ОС механизмы; Android WorkManager предназначен для отложенной устойчивой работы, а не гарантированного немедленного исполнения любого запроса. [Android persistent background work](https://developer.android.com/develop/background-work/background-tasks/persistent).

## Архитектурные последствия

1. Общий версионированный REST/OpenAPI BFF изолирует Bitrix от клиента; DTO money в копейках/Decimal, даты UTC, отдельные product/offer/organization IDs. Клиент не управляет ценой, полномочиями или разрешением payment.
2. Доменные правила и transport/cache отделяются от экранов. Runtime validation дополняет TypeScript: `as T` в локальном transport не является проверкой upstream. Общая схема не означает автоматического переноса всей серверной логики в приложение.
3. Native adapters имеют небольшие интерфейсы: push registration/open, secure unlock, payment handoff/result, location/map, camera scan, background cache refresh. В конфигурации flavour явно выбираются разрешённые SDK; необязательный SDK не блокирует каталог.
4. Offline хранит public catalog cache и пользовательские черновики с provenance/updatedAt; личные/корпоративные данные разделены. При logout/deletion применяется политика очистки. Устаревшая цена/stock не становится коммерческим обещанием.
5. Не включать remote code/config, который произвольно меняет финансовые/permission правила. Server-driven home — ограниченный набор content blocks и валидированные destinations; неизвестный блок можно пропустить. Feature flags не заменяют authorization.
6. Preview web остаётся полезным UI/contract инструментом, но не заменяет native performance, hardware push, biometrics, PSP callback, accessibility и store acceptance.

## Проверки, от которых зависит принятие решения для production

| Gate | Конкретный эксперимент | Критерий результата |
|---|---|---|
| Release baseline | Физические iPhone и Android, включая согласованное слабое устройство; cold/warm start, TT interactive, scrolling 10k/100k серверной коллекции, image cache, memory, network | Зафиксированы реальные p50/p95, FPS/jank/memory/bundle; выбранные бюджеты не выдаются за достигнутые заранее |
| SDK compatibility | Минимальный development build с выбранными PSP, картами, APNs/FCM/RuStore; permission denied/no GMS/expired token | Работают реальные provider callbacks и fallback, нет зависимости от Expo Go; secrets только server-side |
| Auth/security | Secure storage + refresh rotation/revoke на настоящем staging API, context race/IDOR/deleted user | Нельзя получить доступ к чужому user/org; logout/deletion блокирует токены; biometric только локально разблокирует |
| Links/background | HTTPS links cold/warm/terminated, login redirect и organisation mismatch; OS background constraints | Ссылка не обходит авторизацию; никакого повторного order create/payment при восстановлении процесса |
| Accessibility | VoiceOver/TalkBack, крупный шрифт, внешняя клавиатура, ошибки checkout/forms, reduced motion | Сценарий доступен без визуального угадывания и мелкого текста |
| Delivery pipeline | dev/staging/prod builds, API compatibility, signed artifacts, rollback policy, staged rollout | Воспроизводимая сборка каждой платформы; ключи/PII не попадают в logs и bundle |

Master требует измерения производительности. Web Lighthouse/локальный быстрый snapshot не доказывает скорость на уровне WB/Ozon/Яндекс Маркета. В рамках discovery нативный сравнительный benchmark не проводился. Бюджеты формируются отдельно по целевым устройствам; любые текущие числа без этих измерений были бы предположением.

## Когда пересмотреть ADR

- Нужный PSP/maps/RuStore SDK нельзя безопасно интегрировать в текущую RN версию даже через небольшой native module; сначала оценить локальный адаптер, затем миграцию.
- Release profiling выявляет существенный неудаляемый предел UI/памяти, подтверждённый одинаковым сценарием и данными в spike Flutter/native.
- Продукт становится преимущественно платформенным: сложные фоновые процессы, глубокие OS extensions, hardware workflows; объём двух платформенных веток превосходит общую часть.
- Подтверждённая команда имеет существенно иной стек, и план переноса с ценой/регрессией показывает меньший TCO.

Ни одного такого основания сейчас не подтверждено. Следующее действие — безопасный BFF slice A из backend-аудита и исправление guard нового read-only bridge после назначения реализации; перепись клиента в discovery не выполняется.
