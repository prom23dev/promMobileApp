# V7 — выпуск приложения и критерии допуска

Контрольная дата: 11.09.2026. **Store release: BLOCKED.** Готовый дизайн, экспорт веб-версии и архив исходников не равны подписанному iOS/Android-приложению с подключённой торговлей.

## Фактическая точка старта

| Область | Сейчас | Что нужно для допуска |
| --- | --- | --- |
| Код/экспорт | Expo 57 / RN 0.86.3, версия 0.7.0; web entry-9bd376941d209cef85b2f91b43359fc7.js; browser QA 14/14, unit mobile48/server50 | Зафиксированный commit+lockfile, native evidence и закрытие интеграционных блокеров |
| Идентификаторы | ru.prom23.preview, prom23-preview, local-sandbox, releaseReady:false | Утверждённые production IDs/схемы, HTTPS домены, env separation |
| Android | release signingConfigs.debug, target через rootProject.ext | Release signing, final manifest API36+, 16 KB evidence, AAB/APK |
| iOS | development push entitlement; Face ID отключён в config, ключ отсутствует в regenerated Info.plist | Production provisioning, purpose strings только по реальным функциям, Xcode26.4+ для Expo57, archive/privacy report |
| Машина | Xcode/JDK/adb не готовы | Выделенная build-машина или CI; см. `testing.md` |
| Backend | Локальный каталог/state; submitSiteForm отключён | Настоящий изолированный staging Bitrix/API и подтверждённые прод-интеграции |
| Владельческие данные | Оператор/обработчики/договоры/удаление не подтверждены | Закрытие B-01…B-08 из `store-compliance.md` |

## Обязательная последовательность

1. **Зафиксировать кандидата.** Commit, exact lockfile, API schema/capabilities, feature flags, контент/правовые версии; никаких секретов или пользовательских fixtures в архиве. Public EXPO_PUBLIC — не хранилище ключей.
2. **Подключить staging.** Auth issuer/OTP, B2B роли, серверные цены/остатки/quote, настоящий заказ и webhook-состояния, доставка, CRM/1С, ККТ, согласия/удаление. Отсутствующая capability даёт понятную недоступность. Моки не попадают в release независимо от отсутствия слова «тест» в UI.
3. **Провести проверки.** Typecheck/unit/contracts + V7 mobile browser + native devices/security/privacy; комплект результатов по `testing.md`. Доставка/оплата/возврат проверяются sandbox провайдеров, не деньгами покупателей.
4. **Собрать release.** Android AAB для Google Play, формат для RuStore по текущей консоли, iOS archive/IPA. Credentials только в защищённом CI/keychain с доступом владельца. Проверить bundle ID, signature, entitlements, target SDK, permissions, отсутствие debug endpoints/flags, SBOM/privacy manifests и hash.
5. **Подготовить магазины.** Проверенный publisher, права на бренд, support/privacy/deletion URL, возрастная/контентная анкета, data declarations, реальные screenshot и review notes. Учётки ревьюера должны открывать заявленные B2C/B2B сценарии без доступа к настоящим клиентам.
6. **Подать и выпустить.** До отправки отдельно сверить актуальные требования по [официальной матрице](store-compliance.md). План staged rollout, контроль crash/checkout/auth, ответственные, rollback server flags; откат мобильной версии не мгновенен, API совместим как минимум с уже выпущенным клиентом.

## Команды release-проверки в подготовленном окружении

Из корня проекта:

```sh
npm --prefix mobile run typecheck
npm --prefix mobile test
npm --prefix server test
npm --prefix mobile run check:release
```

Сейчас check:release намеренно возвращает exit 1. В `eas.json` только internal preview. **В V7 добавлен `eas-build-pre-install` → `scripts/eas-release-gate.cjs`: любой профиль, кроме preview, вызывает check-release.** Проверено исполнением: `EAS_BUILD_PROFILE=preview` → exit 0; `EAS_BUILD_PROFILE=production` → exit 1 с перечнем неподключённых сервисов; также сохранён `docs/release-gate-v7.log`. Прямые native build/ручной upload и отдельный web export этим hook не покрываются. Store upload остаётся запрещён до закрытия блокеров и подготовки подписи. Не добавлять фиктивный releaseReady=true для обхода условий. Команды подписи и публикации нельзя конкретизировать без утверждённых IDs, профиля и аккаунта издателя; в этом документе нет выдуманной рабочей команды release upload.

## Минимальный release evidence bundle

- Идентификатор кандидата, версии dependency lock/toolchain/SDK, checksums IPA/AAB/APK и source archive.
- V7 функциональные, негативные и device/accessibility/performance результаты; список открытых дефектов с ответственными. Critical/High по auth/payment/PII не принимаются молчаливо.
- Протокол серверного заказа → оплаты/отмены/возврата → CRM/1С/чека с очищенными доказательствами; проверка недоступных провайдеров и восстановления.
- Финальные `store-compliance.md`, `security.md`, `security/sdk-register.md`, `privacy/data-map.md`, `privacy/processing-register.md`; декларации магазинов соответствуют сборке.
- Утверждение оператором retention/согласий/обработчиков/уведомлений; публичное удаление и подтверждённый downstream deletion.
- Release/rollback runbook, дежурные контакты, мониторинг без ПД, процедура инцидента.

## Изоляция существующего боевого сайта

`zavod-antibpla.ru` — отдельный защищаемый production-контур. Ни сборка, ни тесты, ни приложение, ни rollback не должны менять его файлы, базы, процессы, конфигурацию nginx, TLS или DNS. Для мобильного backend — отдельные каталоги, сервисы, порты, учётные записи и хранилища с явными лимитами ресурсов. QA-подзадача сервером не управляла; отдельный изолированный V7 релиз основной задачи подтверждён в `deployment-v7-verification.json`.

Размещение нового frontend на выделенном IP/порту не является публикацией App Store/Google Play/RuStore. Публичную ссылку V7 можно давать для просмотра интерфейса. Реальные заказы остаются недоступны до подключения и проверки соответствующих сервисов.
