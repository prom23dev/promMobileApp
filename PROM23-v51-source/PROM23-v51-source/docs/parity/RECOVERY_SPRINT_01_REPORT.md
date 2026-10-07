# RECOVERY SPRINT 01 — текущая проверка

Опубликована [проверенная recovery-сборка](http://159.253.19.172:18087/) `v0.10-20260912-03`. Это отчёт о восстановлении кода, не приёмка полного приложения или реальных интеграций.

## AUDIT

- Public crawl:4434 URL,3484 HTTP200,950 HTTP404,0 сетевых ошибок. Авторизованные данные Битрикс не получались.
- 75 source route families;68 форм =64 canonical+4 aliases;140 функций =76 capabilities+64 form flows;24 группы интеграций.
- 101 TSX routes:8 инфраструктурных,93 wrappers;24 уникальных шаблона маршрутов плюс fallback.
- До recovery:14 MISSING,117 PARTIAL,6 LEGACY_REVIEW,3 scoped COMPLETE. Сейчас:3 MISSING,125 PARTIAL,6 LEGACY_REVIEW,6 scoped COMPLETE.
- Baseline сохранён отдельно, исходники сайта не изменены. Git checkpoints созданы до recovery.

## IMPLEMENTED THIS SESSION

- Глобальное меню41 пункт, отдельные поиск и звонок, Back, корзина/badge, нижние вкладки на формах и оформлении.
- Реальные отдельные personal/business drafts и проверка членства для organization context; B2C по умолчанию.
- Купон, quote, выбор способов/пункта доставки и оплаты, пересчёт и submit с привязкой к организации/GAR/составу корзины. Неконфигурированный магазин не создаёт фиктивный заказ.
- Структурированный GAR, выбор канонического адреса, отзыв устаревших расчётов и ответов при смене контекста.
- Source-aware формы, OTP/account/profile/organizations, обращения/возвраты/публикации, закупка с вложениями, canonical consents и обработка результата.
- Исправлены source-ограничения вложений, количества, длины обращений и вопросов. Существующие видео/фото сохраняются при редактировании отзыва; одноразовые ссылки счёта можно открыть повторно через новую проверку владельца.
- Конкретные delivery adapters; Split hosted payment, проверка статуса собственного заказа, guarded Sale reconciliation, одноразовое безопасное открытие HTML счёта.
- Возвращены179 изображений в28 статьях/проектах и дополнительные source content sections.
- Исправлены4 подтверждённых замечания дизайнера на320/390. Декоративный редизайн не подменял P0.

## TESTED

- Приложение:88/88; сервер:162/162; TypeScript и web export PASS.
- PHP:38 файлов без синтаксических ошибок,430 изолированных проверок PASS:47 ограничений форм,30 сохранения медиа,83 платежей и остальные политики.
- Локально и после публикации:38/38 commerce и32/32 forms на320/390;0 ошибок страницы.
- Изолированный deploy:252 content hashes, backup/rollback сохранены. Боевой сайт:82 хэша неизменны, общие процессы не перезапускались, HTTPS200.
- Исторические failures/skips сохранены рядом с исправленными повторами. Реальные Bitrix/PSP/CRM вызовы не выполнялись.

## STILL MISSING

- Полный каталог:2097 успешных product URL candidates не сопоставлены28 snapshot SKU; часть URL может быть alias.107 category/filter URL gaps. Это потери реализации/данных, не внешние блокеры.
- Торговые предложения/варианты, групповое удаление корзины, очистка сравнения по категории.
- Authenticated download документов1С, полный PDF счёта/печати, actual Plus/платёжный график, receipt mapping/автоматический webhook.
- Полная пагинация публикаций, q-popular, выборочное удаление старых фото; полный контентный паритет и финальная визуальная переработка.
- Нативные сборки, подпись, проверка устройств/магазинов и полная проверка требований к публикации.

## BLOCKED_EXTERNAL

- Connected acceptance написанных адаптеров: изолированный Bitrix/его DB, действующие module/property/GAR mappings и приватная конфигурация.
- Проверка actual PSP, CDEK/Yandex/DaData, OTP/email/SMS,1С/Битрикс24 потребует подключения соответствующих сервисов программистами. Успех этих сервисов не заявлен.
- Исходные незавершённые паспорт/card/consignee элементы остаются LEGACY_REVIEW, а не придуманными формами сбора данных.

## NEXT EXACT STEP

Восстанавливать полный каталог из уже полученного crawl с каноническими source IDs/вариантами, без нового обхода и без замены missing данных фиктивными товарами.

## Артефакты

- Public bundle: `b110ad95b168c804629d88775e8880b7`.
- Release SHA256: `7580cea669654d3c14aaf41f7e1742cf43bfaeffbb809181879672c7653e92c0`.
- PHP proof: `evidence/php-policy-recovery08.log`; public UI: `evidence/public-commerce-ui/report.json`, `evidence/public-forms-ui/report.json`.
- Source archive: `deliverables/prom23-mobile-source-recovery01.zip` with file manifest and SHA256 sidecar. Source adapters included for programmer integration; preview runs the mobile UI and BFF, not the Bitrix runtime.
