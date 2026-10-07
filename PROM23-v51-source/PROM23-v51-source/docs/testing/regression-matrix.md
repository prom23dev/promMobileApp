# V9 — регрессионная матрица

11.09.2026 · final `entry-f511f4c425f0956cb8c2dd105ef3dba2.js`.

| Объём | Результат | Доказательство | Граница |
|---|---|---|---|
| Полный маршрутный реестр |412/412 render;400/400 обычных tabs;12 immersive;0broken | [route JSON](qa-v9-final-routes.json) | Full ed830 + scoped f511 regression; не412 повторных reload на f511 |
| Точные f511 изменения |9/9 PASS | [affected](qa-v9-final-affected.json) |3 ordinary,3 immersive,PDF drop/remove,EXE/11limit,retained input; no upload receipt |
| Покупательские цепочки |6/6 PASS | [flows](qa-v9-final-flows-report.json) | Home, gallery/zoom, add/cart/qty/payment info, save/compare/context, search/history, fake geo |
| Расширенная функциональность |7/7 PASS с отдельным harness retry | [supplement](qa-v9-final-supplement.json) | real hints/correction,Динская/cart/notice,stack/scroll/back,reviews unavailable,procurement validation,contacts/return,25layouts |
| Публичная версия |7/7 PASS; JS SHA до/после одинаковый | [public](qa-v9-public-flows-report.json) | Изолированная собственная сессия; реальные формы/платежи/звонки не выполнялись |
| Дизайнер, content |52 layout views +10 content interactions; исправленные4 headers | [design](../design-critique-v9.md) | Точная привязка candidate1/candidate2 указана в отчёте; minorP2 сохранены |
| Responsive финального UI |25 комбинаций; ширины320/390/430/768 и844×390;0pageoverflow | [supplement](qa-v9-final-supplement.json) | Web viewport, не реальные устройства |
| Reduced motion | Browser media query включён; flows прошли | [supplement](qa-v9-final-supplement.json) | Native system setting/assistive technology UNVERIFIED |
| Формы / DTO |73 клиентских теста PASS | [technical](technical-release-v9.md) | Source contracts/invalid cases; не73 успешных операции магазина |
| BFF / интеграционные границы |82 server+1proxy PASS | [technical](technical-release-v9.md) | Local isolated fixtures/HTTP; live Bitrix/1C/PSP acceptance BLOCKED |
| Метаданные |5direct+SPA account PASS | [DOM](technical-release-v9-metadata.json) | noindex preview; production SEO не заявлено |
| Native build/device/store | BLOCKED | [technical](technical-release-v9.md) | Expo export/prebuild≠подписанные IPA/AAB/APK, установка/производительность/магазины |
| Полный ручной исходный click-through | PARTIAL | [249](master5-acceptance.md) | Source audit+all mobile routes; не каждый handler исходного сайта отправлен |

Исходные сбои не удалены:76 массовых измерений получили bootstrap rate limit; два paced retry попали в объявленное окно export HTTP503. Отдельные стабильные повторные измерения прошли. Первый geo supplemental тест ошибочно читал `.items` вместо `.data.items`; UI не менялся, правильный тест прошёл. См. `*initial.json`, `qa-v9-final-routes-retry*.json`, `qa-v9-final-supplement-geo-confirmation.json`.

Предыдущая V8 матрица сохранена в [архиве](regression-matrix-before-v9.md). Все доказательства ограничены собственными сессиями, без внешних POST и персональных аккаунтов.
