# V7 — предварительный реестр SDK и разрешений

Дата: 11.09.2026. Источник: `mobile/package.json`, lockfile v3 (627 записей), native config и точки использования. **Это inventory исходников, не полный SBOM IPA/AAB и не заполненная декларация магазина.** Версии ниже из lock, если явно не указано иначе. В этой проверке внешний vulnerability scan не запускался, отсутствие CVE не утверждается.

| Компонент | Версия / роль | Данные / сеть сейчас | Разрешения и выпуск |
| --- | --- | --- | --- |
| expo | 57.0.21 / native runtime | Само наличие пакета не доказывает Expo cloud traffic | В текущем Android updates ENABLED=false; отдельно проверить release endpoints/OTA и build telemetry |
| react-native / React | 0.86.3 / 19.2.3 | Рендеринг и network primitives приложения | Gradle/Pods natives и транзитивные SDK включить в SBOM |
| Hermes | hermes-compiler 250829098.0.17 в lock, Hermes включён iOS/Android | JS runtime; не отдельная бизнес-аналитика | Входит в список Apple SDK; итоговый privacy manifest/подписи проверяются в архиве |
| expo-secure-store | 57.0.3 / токен | Native: Keychain/Keystore; токен не уходит Expo из этой точки кода. Web использует localStorage отдельно | `requireAuthentication` сейчас не применяется. V7: faceIDPermission:false; generated Info.plist больше не содержит NSFaceIDUsageDescription. Биометрический вход не заявляется |
| expo-notifications | 57.0.17 / обработка tap | PushObserver читает response; регистрации/загрузки токена, запроса permissions и Expo relay в исходниках нет | iOS aps-environment development. Android возможные transitive Firebase/permissions проверять по merged manifest; установленный SDK ≠ доказанный сбор ≠ доказанное отсутствие сбора |
| expo-document-picker | 57.0.1 / выбор вложения | Имя, размер, URI/тип выбранного файла в памяти формы; copyToCacheDirectory:false, base64:false; реальный upload отключён | Предпочтён системный picker без доступа ко всей медиатеке. Проверить временные URI и очистку на устройствах |
| expo-linking / expo-router | 57.0.9 / 57.0.20 | Навигация/deep links и внешние ссылки | Нельзя передавать токен/ПД через URL. Prod HTTPS links и allowed routes ещё не подтверждены |
| expo-constants, font, status-bar, system-ui | ranges ~57.0.17 / ~57.0.3 / ~57.0.1 / ~57.0.3 | UI/конфигурация, font assets | Не назначать «analytics» лишь по имени SDK; проверить ресурсы и сетевые загрузки в release |
| reanimated, worklets, screens, safe-area, svg, lucide | 4.5.1, 0.10.1, ~4.26.0, ~5.7.0, 15.15.4, ^1.44.0 (package ranges) | Анимация/UI | Нативные .so и manifests, 16 KB, reduced motion; не запрашивают бизнес-разрешения сами по роли |
| react-dom / react-native-web | 19.2.3 / ^0.21.2 | Браузерная версия, localStorage + API | CSP, XSS/session storage отдельно от native; включать в web privacy map |
| Bitrix24, 1С, OTP, доставки, ККТ, Яндекс Пэй/Сплит/Плюс | Внешние интеграции, прямых SDK в dependencies нет | Сейчас API-граница отключена; будущие server-to-server потоки | Договоры/страны/retention/auth/webhooks ещё нужны. Отсутствие mobile SDK не исключает обработки backend-партнёром |
| Analytics/ads/crash SDK | Прямые Firebase Analytics/AppMetrica/ads/Sentry не найдены | Не заявлять сбор отключённым на основании только package.json — нужны transitives и traffic trace | Любое добавление требует обновления реестра/карты данных/анкеты; необязательная аналитика default off |

## Permission audit исходников

Android main manifest: INTERNET; explicit remove для contacts/SMS/microphone/location/media/storage/overlay/vibrate, allowBackup=false. Notifications plugin может добавлять компоненты/permissions через manifest merger. Отдельно проверить POST_NOTIFICATIONS, WAKE_LOCK, boot receivers, export status, backup rules и debug variants в конечном артефакте. Не добавлять READ_SMS ради OTP; ввод/платформенный autofill не требует чтения всей переписки.

iOS: ATS arbitrary loads=false, custom preview scheme, push development. Английский Face ID reason из discovery удалён в V7 из config и generated Info.plist. App privacy manifest/Podfile.lock не обнаружены среди проектных iOS-файлов при первоначальном inventory. Это не означает, что зависимости никогда не генерируют manifests: нужен Xcode report из конечного build. Нет оснований объявлять приложение использующим биометрические шаблоны: текущий код их не собирает.

Push-поток до включения: authenticated backend РФ → APNs/FCM или иной утверждённый провайдер; минимальный payload без имени/телефона/адреса/суммы/текста обращения; TTL и удаление токена при logout/account deletion; локальное разрешение и маркетинговое согласие учитываются раздельно. Прямые APNs/FCM не равны хранению всего потока в РФ, требуются договорная и трансграничная оценки. Expo relay сейчас не используется и не добавляется по умолчанию. [Expo 57 Notifications](https://docs.expo.dev/versions/v57.0.0/sdk/notifications/), [Direct FCM/APNs](https://docs.expo.dev/push-notifications/sending-notifications-custom/).

## Запись допуска нового SDK

Перед merge заполнить: package+exact version+integrity, direct/transitive owner, назначение, auto-init, данные до/после consent, endpoint/получатель/страна, storage/retention/deletion, processor agreement, permissions, Apple manifest/reason/signature, Google/RuStore declaration, лицензия/CVE-review, kill switch, network evidence hash, ответственный и дата. Unknown country/retention — блокер **включения передачи**, не повод вписать «РФ» по предположению.

Правила источников: [Apple SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/), [Apple App Privacy](https://developer.apple.com/app-store/app-privacy-details/), [Google User Data](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en), [RuStore data categories](https://www.rustore.ru/help/developers/publishing-and-verifying-apps/app-publication/new-version-app/declare-app-permissions/data-categories). Для отправки анкет требуется сверить фактическую сборку; этот документ не является заявлением «данные не собираются».
