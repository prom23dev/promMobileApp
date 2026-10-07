# V7 — безопасность: состояние и план проверки

Проверено 11.09.2026: исходный discovery версии 0.6.0, актуализация release-конфигурации V7/0.7.0. **Статический review, не пентест и не сертификат безопасности.** Reviewer не изменял app/server; реальные формы, платежи, серверные настройки, секреты и пользовательские БД не затрагивались. Использованы security-audit, privacy-by-design и mobile-security-coder; требования навыков сопоставлены с реальной архитектурой. Pinning, root detection и сбор device fingerprint не назначаются обязательными без модели угроз.

## Границы доверия

Устройство/браузер → публичный mobile API → авторизация и контекст организации → Bitrix/1С/CRM → провайдеры оплаты, доставки, сообщений. Отдельно: файлы, webhook, push/deep link, журнал согласий, backup, CI/signing. Любой ID из приложения, цена, роль, организация, MIME, статус оплаты и push payload считаются недоверенными. Ключи сервисов принадлежат backend, а не EXPO_PUBLIC переменным.

В качестве структуры проверок применён [OWASP MASVS](https://mas.owasp.org/MASVS/): storage, crypto, auth, network, platform, code, resilience, privacy. Таблица ниже — проектные критерии приёмки, не утверждение о прохождении MASVS.

## Что уже подтверждено исходниками

- `src/api/local.ts`: native-токен в SecureStore `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, timeout/abort; web-токен в localStorage. Это анонимная сессия, не доказанная пользовательская авторизация.
- `server/app.mjs`: 32 случайных байта токена, на сервере SHA-хеш, prepared SQL, выбор заказа с session/context, idempotency и транзакция создания локального заказа, лимиты количества записей/размера БД, no-store/nosniff/no-referrer, точный CORS allowlist. CORS не заменяет аутентификацию.
- `src/api/site.ts`: реальная отправка форм отключена, нет фиктивного accepted/reference. Контекстные справочники и права предусмотрены как серверные данные.
- `FormScreen.tsx`: чекбоксы согласий изначально выключены, readOnly поля не сериализуются; выбор файлов без base64 и копирования в cache, есть клиентские лимиты. Эти проверки не заменяют серверные.
- `PushObserver.native.tsx`: нет автоматического разрешения, регистрации push-токена или Expo relay. `notifications-domain.ts`: payload не выбирает произвольный URL/организацию; order UUID проверяется.
- Android allowBackup=false и удаления опасных permissions в main manifest; iOS ATS не разрешает arbitrary loads. Итоговый merged manifest и подписанная сборка ещё не исследованы.

## Риски / требуемые изменения

| ID / приоритет | Доказательство и риск | Критерий закрытия |
| --- | --- | --- |
| SEC-01 BLOCKER | `api/site.ts` заглушка; local API не является production API | Отдельный HTTPS staging/prod adapter; false-success невозможен; release CI отвергает mock/localhost/HTTP |
| SEC-02 BLOCKER | `api/local.ts` допускает произвольный configured URL и HTTP fallback; web long-lived bearer в localStorage | Production HTTPS allowlist и запрет downgrade; native refresh в Keystore/Keychain, access в памяти. Для web оценить HttpOnly/Secure/SameSite cookie + CSRF, а не переносить bearer в localStorage |
| SEC-03 BLOCKER | В sessions есть created_at, но нет доказанного срока/rotation; локальный context organization-demo не подтверждает членство | OTP challenge: TTL, одноразовость, лимит попыток/отправок по телефону+IP+устройству; refresh rotation/replay detection, revoke single/all sessions, step-up смены телефона/удаления |
| SEC-04 BLOCKER | Организации/роли и чужие ID пока только контракт | Серверная авторизация каждого order/address/org/document/review; тест user A → объект B; role downgrade немедленно отзывает возможности; INN lookup не открывает данные других клиентов |
| SEC-05 BLOCKER | `android/app/build.gradle` release → debug signing; iOS push development; `eas.json` только internal preview | Production signing из защищённого CI; debug keystore не используется; правильные entitlements/namespace; сборка и проверка артефактов |
| SEC-06 PARTIAL | В V7 EAS pre-install hook вызывает `check-release.cjs` для любого non-preview профиля; preview exit0 / production exit1 проверены. Прямая native сборка и ручной upload ещё не покрыты | Распространить gate на все release-каналы; не снимать SEC-05 и store blockers только по наличию EAS hook |
| SEC-07 HIGH | Общая квота sessions не ограничивает темп атак; внешняя OTP ещё отсутствует | Rate limit/token bucket по endpoint и actor; request body/time limits; антиабьюз без обязательного сбора лишних идентификаторов; публичный каталог отдельно от costly actions |
| SEC-08 HIGH | Файлы сейчас проверяются по имени/заявленному размеру; upload backend отсутствует | Серверная проверка magic bytes/MIME/size/count, антивирус/карантин, удаления EXIF, приватное хранилище РФ, случайные имена, короткие подписанные download URL с проверкой прав; запрет серверного fetch произвольных URL (SSRF) |
| SEC-09 HIGH | Payment/CRM/1C webhooks не подключены | Сумма/налоги/доставка только server quote с TTL; webhook signature, timestamp, replay protection и idempotency; callback deep link не доказывает оплату; merchant API keys только backend |
| SEC-10 HIGH | Нужны формы удаления и журнал согласий; source consent имеет конфликт оператора | Задача удаления до downstream processors, отзыв сессий/push; ограниченный legal hold; версионированные согласия и отзыв с доказательствами |
| SEC-11 HIGH | Native dependencies/transitives не проверены из конечной сборки | SBOM из lock + Gradle + Pods, проверка уязвимостей без выгрузки закрытого кода, лицензии, manifests; установленная версия не равна отсутствию CVE |
| SEC-12 MED | Custom scheme preview перехватывается сторонним приложением | Для prod verified HTTPS App/Universal Links, allowlist маршрутов, opaque одноразовый state/PKCE для OAuth; никакого bearer/телефона в URL |
| SEC-13 MED | Нет подтверждённой инфраструктуры логов/backup | Редакция Authorization/OTP/PII, без тел форм и query с ПД; шифрование backup и доступ по ролям, восстановление/истечение TTL, удаление не восстанавливается из старого backup |

## Данные, которые запрещено переносить из архива автоматически

Актуализация V7: `expo-secure-store.faceIDPermission:false` и удалённый NSFaceIDUsageDescription в generated Info.plist устраняют неиспользуемый английский reason. Это не готовность Face ID login и не подписанная IPA. Спецификация теперь передаётся внутри процесса по opaque ID с TTL/контекстом; в URL нет её содержимого. Повторная загрузка с отсутствующим draft объясняется пользователю. Production-signing и реальная авторизация остаются блокерами.

Аудит источника `docs/20-consent-source-audit.md` отмечает незавершённый обработчик PAN/CVV и журнал ожидания с user ID в публичном upload. В приложение они не перенесены. Не восстанавливать их ради формального паритета: карты вводятся у платёжного провайдера; сервер хранит только разрешённые токены/маску. Пароли/OTP/паспорт/текст обращений не попадают в analytics, crash breadcrumbs, URL, push payload, скриншоты отчётов или исходники.

## Негативные сценарии для следующей QA-фазы

| Группа | Что проверять на синтетических staging-данных |
| --- | --- |
| Auth | Повтор использованного OTP, истёкший challenge, повтор refresh, logout-all, смена номера, восстановление после переустановки |
| B2B | Подмена organizationId/orderId, открытие старого deep link после смены организации/роли, документы без членства |
| Checkout | Двойной tap, retry после timeout, истёкшая цена, изменение остатка, payment cancel/pending, поддельный callback, повтор webhook |
| Privacy | Нет необязательной передачи до выбора; revoke прекращает новые рекламные задания; отказ от push не мешает покупке; deletion распространяется на обработчиков |
| Files/content | Поддельный MIME, слишком большой файл, SVG/script, EXIF, чужой URL, приватность скачивания, жалоба/блокирование UGC |
| Native/release | TLS error не обходится, release не debug, background/app switch без ПД, permissions deny/retry, restore backup, 16 KB, offline |

Не запускать эти сценарии на production без отдельного разрешённого плана. Текущий этап не включал активного fuzzing, SCA с внешними POST, чтения секретов или сетевого трафика настоящих пользователей. Уровни BLOCKER/HIGH обозначают риск **использования текущей заготовки как боевой**, а не доказанную эксплуатацию уязвимости боевого сайта.

Связанные материалы: [магазины/право](store-compliance.md), [SDK](security/sdk-register.md), [данные](privacy/data-map.md), [обработка](privacy/processing-register.md).
