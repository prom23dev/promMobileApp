# Оплата 13 — отчёт по focused sprint

Страница: http://159.253.19.172:18087/information/payment?v=13
Релиз: v0.10-20260912-13. Mobile commit: 9b08a6a. Bundle: entry-d8aa8c80cb3f66a30b95b02f541db421.js.

## CHANGED

Изменены четыре mobile-файла: новый PaymentPage, утверждённый paymentPageCopy, централизованный paymentLinks, подключение в InformationScreen. Язык оформления — принятые Delivery/Cooperation: navy H2 с оранжевым маркером, H3, белые карточки, открытые абзацы и простые списки. На этой странице переиспользован существующий BuyerContextSwitch. Другие страницы не редизайнились.

До изменения было четыре неактивных карточки и collapsed disclosures. Временная /payment/ отвечает200, но фактически показывает доставку через общий шаблон: evidence/payment13/source-web.json. Поэтому утверждённый новый текст служит основой представления. Исходники магазина остаются read-only.

## INFOGRAPHICS / SCROLL ANIMATIONS

1. Grid шести способов — иконки, описания, якоря, stagger. Две колонки от380px, ниже одна.
2. Карта: Вы → платёжный сервис → банк. Выделенная фраза о данных карты рядом, без повторного третьеличного лозунга.
3. СБП: заказ → выбор СБП → банк/интерфейс → подтверждение.
4. Pay data-flow: оформление → необходимые сведения → сервис Яндекса → подтверждение. Полный текст о передаче данных открыт.
5. Split timeline: покупка → первый платёж → следующие платежи → график Яндекса. Без процентов, числа платежей и фиксированных дат.
6. Факторы доступности: состав заказа + регион + способ получения → способы оплаты.
7. Invoice flow: состав → согласование → счёт → оплата → заказ в работу.
8. Process01–05: вертикальные строки, заполняющиеся от scrollY сегменты scaleY и opacity активного номера.

Hero eyebrow/H1/intro следуют последовательно. Узлы схем и buyer tiles используют subtle reveal. Reduce Motion показывает всё без движения. Анимируются opacity/transform, не размеры layout. Схемы объясняют процесс, а не показывают статусы текущего заказа.

## INTERACTIONS

Шесть верхних карточек прокручивают к своим разделам. В B2B счёт идёт первым и выделен; B2C остаётся доступен целиком. Количество товаров берётся из реальной отдельной корзины выбранного контекста. Нет выдуманных заказов или отметок доступности способов.

Работают /cart, /orders, /information/contacts, семь buyer routes, три официальные внешние ссылки, телефон. App bar, Back, menu40, bottom navigation и badge сохранены. В Header с back location ранее не отображалась, новый локальный переключатель местоположения не добавлен. На странице нет второго checkout, ввода карты или вызова payment submit.

## PAYMENT METHODS VERIFIED / SOURCE

| Способ | Подтверждение исходниками | Предел проверки |
|---|---|---|
| Онлайн | sale.order.ajax/main/template.php:708 — id14; YCP slot и пересчёт суммы | Реальный платёж и его callback не проводились |
| Карта / Split | template.php:845–851 — YaPay.createSession с CARD/SPLIT, Ultimate widget | onPayButtonClick возвращает пустую строку в виджете: это не доказательство оплаты |
| При получении | template.php:720 — id17; Order.php:226/229/258/261 — карта/наличные по условиям склада | Не обещается всем заказам |
| Счёт | defines.php:108 — INVOICE_PAYMENT_SYSTEM=16; template.php:692; personal/order/payment/index.php — PDF | Старый комментарий13 не authoritative; живой счёт/1С не создавались |
| СБП | template.php:914–936 — метка в PHP-комментарии с образцом интерфейса | Самостоятельная действующая интеграция не подтверждена. Общая оговорка о доступности сохранена; бейджа «Доступно» нет |
| Старый id4 | order/ajax.php — stub | Не добавлен как отдельный provider без доказанной привязки |

Пэй/Сплит и остальные способы здесь описаны. Новый PaymentPage не монтирует SDK и не получает номер карты. Существующий checkout/runtime handoff остаётся единственным путём фактического платежа; его готовность не повышается до COMPLETE этой работой.

## CARD DATA — LEGACY_REVIEW перед запуском сайта

В новом приложении сохранено утверждённое «Данные банковской карты мы не храним.» Здесь нет ввода PAN/CVV, а существующая форма карты объявлена externalCapture payment-provider. Но это нельзя считать подтверждением свойства всей старой версии сайта.

В source local/ajax/lk/payment-methods/add-card-action.php:26–34 принимаются card_number/card_expire/card_code. Models/ConfirmedCards.php:140–155 сохраняет CARD_NUMBER в таблицу без подтверждённой токенизации. Перед боевым объединением программистам нужно отключить этот legacy путь, подтвердить ввод только у PSP и проверить отсутствие PAN в собственной БД/логах. CVV принимается handler; сохранение CVV моделью не установлено, и в отчёте оно не утверждается. Production DB не исследовалась; исходник не менялся в этом спринте.

## LEGAL LINKS

Проверены12.09.2026 на официальных сайтах и сохранены в paymentLinks.ts:

- Условия Яндекс Пэй: https://yandex.ru/legal/yapay_terms/ru/
- Политика конфиденциальности Пэй: https://yandex.ru/legal/confidential_pay/ru/
- Правила сервиса рассрочки Сплит: https://yandex.ru/legal/pravilarassrochki/ru/

Старая ссылка yandex_split не использована. Источник поиска документов: https://pay.yandex.ru/docs/ru/useful_links. Никаких сторонних статей или dummy links. Все утверждённые тексты/списки сохранены; фактических переписываний copy нет. Это не аудит всего законодательства и не приёмка магазинами приложений.

## TESTED

- TypeScript PASS, экспорт web/iOS/Android PASS.
- 563/563 локально и563/563 публично на320/390/768/1280; ошибок JavaScript нет.
- COPY LOCK, grid, heading hierarchy, 6 якорей, 7 buyer tiles, внешние href, все CTA routes, независимые корзины/context, back/menu/bottom nav/badge, motion/reduced motion.
- Три внешних click handlers отдельно проверены перехватом window.open; телефонный href проверен, реальный звонок не выполнялся.
- 11 соседних маршрутов до/после одинаковы по rendered text. Delivery и Cooperation screenshots совпали побайтно.
- Desktop Chrome rAF:179 интервалов, p50/p95≈16.7мс,0 кадров>50мс. Это не гарантия60FPS на реальном телефоне.
- 493 файла релиза сверены по манифесту; backup собственной базы выполнен; перезапущен только prom23-preview.service. Защищённые82 файла, общие процессы и HTTP боевого сайта не изменились. DNS не менялся.

QA использовал отдельные анонимные корзины; реальные заказы, списания или обращения не создавались. SHA256 архива: 7f43995616e0a11d40be9a94b9ffb70bc631ac081cb8c7ca2726ee3e8366aada.

## SCREENSHOTS REVIEWED

Просмотрены все15 обязательных типов: hero+методы; карта; безопасность карты; СБП; Pay; data-flow; Split; его timeline; Plus; при получении; invoice; индивидуальные условия;01–05; помощь; buyer tiles. Все на390px, дополнительно320 и1280. Сохранено16 типов×4 ширины локально и публично; изображения и отчёты — evidence/payment13-local и payment13-public.

## BLOCKED_EXTERNAL

Не проверены: установленный Bitrix и merchant-настройки, authoritative PSP methods/offer, реальное списание/refund/callback, счёт1С, физические iPhone/Android, VoiceOver/TalkBack. Старое хранение PAN требует устранения перед запуском сайта. Доступы у владельца не запрашивались, согласно указанию работать по исходникам.

## REGRESSIONS

В11 проверенных соседних маршрутах не обнаружены. HTML ZIP «Доставка» и «Сотрудничество» не менялись. Визуальная приёмка владельцем не объявляется.

## Проверка всех72 пунктов

| № | Требование | Статус | Подтверждение / предел |
|---|---|---|---|
| 0 | COPY LOCK | UI VERIFIED | Rendered copy сверена полностью; фактических переписываний нет. |
| 1 | ЦЕЛЬ СТРАНИЦЫ | UI VERIFIED | Ответы на способы/контекст/данные/условия/шаги. |
| 2 | ОБЯЗАТЕЛЬНАЯ SCROLL-АНИМАЦИЯ | UI VERIFIED | Cascade, stagger, flows, scrollY01–05, Reduce Motion. |
| 3 | APP SHELL | UI VERIFIED | Shell и реальный context сохранены. |
| 4 | HERO | UI VERIFIED | Eyebrow/H1/intro и grid6. |
| 5 | PAYMENT CARD — БАНКОВСКАЯ КАРТА | UI VERIFIED | Утверждённая карточка и работающий якорь. |
| 6 | PAYMENT CARD — СБП | UI VERIFIED | Утверждённая карточка и работающий якорь. |
| 7 | PAYMENT CARD — ЯНДЕКС ПЭЙ | UI VERIFIED | Утверждённая карточка и работающий якорь. |
| 8 | PAYMENT CARD — СПЛИТ | UI VERIFIED | Утверждённая карточка и работающий якорь. |
| 9 | PAYMENT CARD — ПРИ ПОЛУЧЕНИИ | UI VERIFIED | Утверждённая карточка и работающий якорь. |
| 10 | PAYMENT CARD — ПО СЧЁТУ | UI VERIFIED | Утверждённая карточка и работающий якорь. |
| 11 | ИНТЕРАКТИВ ВЕРХНИХ КАРТОЧЕК | UI VERIFIED | 6 якорей; 2 колонки от380px, ниже одна. |
| 12 | B2C / B2B CONTEXT | UI VERIFIED | Existing switch, invoice first вB2B, B2C не скрыт. |
| 13 | SECTION | UI VERIFIED | B2C раздел, открытый точный текст и схема. |
| 14 | БАНКОВСКАЯ КАРТА | UI VERIFIED | B2C раздел, открытый точный текст и схема. |
| 15 | CARD SECURITY INFOGRAPHIC | UI VERIFIED | Security flow и точная фраза в первом лице рядом один раз. |
| 16 | СБП | UI VERIFIED | B2C раздел, открытый точный текст и схема. |
| 17 | SBP INFOGRAPHIC | UI VERIFIED | B2C раздел, открытый точный текст и схема. |
| 18 | ЯНДЕКС ПЭЙ | UI VERIFIED | B2C раздел, открытый точный текст и схема. |
| 19 | YANDEX PAY — DATA FLOW INFOGRAPHIC | UI VERIFIED | B2C раздел, открытый точный текст и схема. |
| 20 | YANDEX LINKS | UI VERIFIED | Три официальных ссылки в constants, проверены. |
| 21 | СПЛИТ | UI VERIFIED | Split: текст,5условий,disclosure,ссылка. |
| 22 | SPLIT INFOGRAPHIC | UI VERIFIED | Универсальный timeline без процентов/дат. |
| 23 | КРИТИЧЕСКОЕ ПРАВИЛО ДЛЯ СПЛИТА | UI VERIFIED | Фиксированных условий и гарантий нет. |
| 24 | БАЛЛЫ ПЛЮСА | UI VERIFIED | 4абзаца о баллах, без расчёта кешбэка. |
| 25 | PLUS VISUAL | UI VERIFIED | Компактная вторичная карточка. |
| 26 | ОПЛАТА ПРИ ПОЛУЧЕНИИ | UI VERIFIED | 3условных абзаца о получении. |
| 27 | PAYMENT AVAILABILITY VISUAL | UI VERIFIED | Состав/регион/получение → способы, без пустого интерактива. |
| 28 | SECTION | UI VERIFIED | H2+B2B поверхность и документы. |
| 29 | ОПЛАТА ПО СЧЁТУ | UI VERIFIED | Счёт,6пунктов,условия работы. |
| 30 | B2B INVOICE INFOGRAPHIC | UI VERIFIED | 5 стадий invoice, без фальшивых статусов. |
| 31 | ИНДИВИДУАЛЬНЫЕ УСЛОВИЯ | UI VERIFIED | 4повода и документы фиксации. |
| 32 | SECTION — КАК ПРОХОДИТ ОПЛАТА | UI VERIFIED | Процесс01–05 с утверждёнными title/text. |
| 33 | STEP 01 | UI VERIFIED | Процесс01–05 с утверждёнными title/text. |
| 34 | STEP 02 | UI VERIFIED | Процесс01–05 с утверждёнными title/text. |
| 35 | STEP 03 | UI VERIFIED | Процесс01–05 с утверждёнными title/text. |
| 36 | STEP 04 | UI VERIFIED | Процесс01–05 с утверждёнными title/text. |
| 37 | STEP 05 | UI VERIFIED | Процесс01–05 с утверждёнными title/text. |
| 38 | PAYMENT TIMELINE ANIMATION | UI VERIFIED | Непрерывный scaleY по scrollY и подсветка номера через opacity. |
| 39 | ДИНАМИЧЕСКИЙ PAYMENT CONTEXT | UI VERIFIED | Нет authoritative offer — нет badges; реальная корзина используется. |
| 40 | НЕ ПОДМЕНЯТЬ CHECKOUT | UI VERIFIED | Нет второго checkout или платёжной формы. |
| 41 | CTA К КОРЗИНЕ / ЗАКАЗАМ | UI VERIFIED | Открыть корзину по реальному context; заказы не выдуманы. |
| 42 | SECTION — HELP | UI VERIFIED | Help, менеджер,заказы,телефон. |
| 43 | CTA LOGIC | UI VERIFIED | Contacts/orders и телефон, маршруты проверены. |
| 44 | SECTION — ПОКУПАТЕЛЮ | UI VERIFIED | Утверждённая buyer tile, существующийroute. |
| 45 | TILE — ДОСТАВКА | UI VERIFIED | Утверждённая buyer tile, существующийroute. |
| 46 | TILE — ВОЗВРАТ | UI VERIFIED | Утверждённая buyer tile, существующийroute. |
| 47 | TILE — ГАРАНТИЯ | UI VERIFIED | Утверждённая buyer tile, существующийroute. |
| 48 | TILE — ЛИЧНЫЙ КАБИНЕТ | UI VERIFIED | Утверждённая buyer tile, существующийroute. |
| 49 | TILE — ДОКУМЕНТЫ | UI VERIFIED | Утверждённая buyer tile, существующийroute. |
| 50 | TILE — ВОПРОСЫ | UI VERIFIED | Утверждённая buyer tile, существующийroute. |
| 51 | TILE — КОНТАКТЫ | UI VERIFIED | Утверждённая buyer tile, существующийroute. |
| 52 | BUYER TILE UX | UI VERIFIED | 2 колонки, icons/title/caption/chevron/pressed/reveal. |
| 53 | INFOGRAPHICS — ОБЯЗАТЕЛЬНЫЙ НАБОР | UI VERIFIED | Все8 типов схем перечислены выше. |
| 54 | НЕ ДУБЛИРОВАТЬ ТЕКСТ | UI VERIFIED | Дополнительные дубли не добавлены; утверждённые повторы смысла оставлены. |
| 55 | PRIVACY / DATA TRANSFER | UI VERIFIED | Data disclosure открыт в Pay/Split. |
| 56 | CARD DATA | PARTIAL / внешний runtime | Точная фраза в новом app; legacy PAN старого сайта — обязательная проверка перед запуском. |
| 57 | EXTERNAL LEGAL LINKS | UI VERIFIED | Официальные buyer документы проверены. |
| 58 | CONTENT PARITY | PARTIAL / внешний runtime | Site/source сопоставлены; ошибочная доставка не копируется. Новых доказанных provider нет. |
| 59 | PAYMENT INTEGRATION AUDIT | PARTIAL / внешний runtime | Source14/17/16 иCARD/SPLIT; SBP только в commented mock, live не подтверждён. |
| 60 | НЕ ДЕЛАТЬ FAKE AVAILABILITY | UI VERIFIED | Нет guessed availability/успешного платежа. |
| 61 | ICON SYSTEM | UI VERIFIED | Lucide outline: основные1.8, небольшие chevrons стандартные2; без брендов/emoji. |
| 62 | VISUAL STYLE | UI VERIFIED | Industrial navy/orange, без fintech gradients/glass. |
| 63 | ACCESSIBILITY | PARTIAL / внешний runtime | Headings/labels/focus/targets/contrast/reduced; физическиеSR не проверены. |
| 64 | PERFORMANCE | PARTIAL / внешний runtime | Opacity/transform; desktop16.7ms, native FPS не измерен. |
| 65 | VISUAL REVIEW | UI VERIFIED | Все15 типов просмотрены,16×4 ширины сохранены. |
| 66 | VISUAL QUALITY CHECK | UI VERIFIED | Self-review выполнен, приёмка владельца не объявлена. |
| 67 | FUNCTIONAL TESTS | UI VERIFIED | 563local+563public и3externalhandlers. |
| 68 | COPY VALIDATION | UI VERIFIED | Весь copy проверен; финансовых обещаний нет. |
| 69 | НЕ ТРОГАТЬ ДРУГИЕ СТРАНИЦЫ | UI VERIFIED | 11 соседних routes неизменны,2pixel-identical. |
| 70 | DOCUMENTATION | UI VERIFIED | Документы обновлены; PAGE ACCEPTED не присвоено. |
| 71 | FINAL REPORT | UI VERIFIED | Полный отчёт и пределы выше. |
