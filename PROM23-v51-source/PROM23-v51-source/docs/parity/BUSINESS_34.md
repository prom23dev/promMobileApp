# Для бизнеса — приоритеты закупщика, версия 34

Владелец отклонил порядок версии 33: сокращение убрало важные объяснения заказа и документооборота. Последнее уточнение: сначала преимущества покупки именно у «Промышленника».

## Порядок и назначение блоков

1. Короткий баннер и два пути: выбрать товары или отправить спецификацию.
2. Почему закупают у «Промышленника»: производство, единая комплектация, технический подбор, расчёт под объём, наличие/резерв, поставка на объект.
3. Как оформить заказ от организации: вход и реквизиты → корзина компании → получение и оплата → подтверждение и отслеживание. Отдельно показан путь со спецификацией.
4. Польза сайта и приложения: сравнение/избранное, сохранённые организации, заказ после оформления, работа с документами. Каждой задаче соответствует переход.
5. Документооборот: счета и закрывающие документы, запрос акта сверки, подключение ЭДО. Указаны условия появления документов и доступа.
6. Ассортимент, форма расчёта, полные условия FAQ.
7. Компания, проекты и отзывы как подтверждение опыта после объяснения закупки.

Преимущества поставщика и преимущества цифрового канала разделены. Коммерческие условия не выдаются за автоматические привилегии регистрации. Блоки дают краткую инструкцию, FAQ сохраняет подробные условия.

## Источники и пределы обещаний

- Преимущества: предоставленный владельцем B2B-текст, версия 32 и материалы группы.
- Документы сайта: `site-source/organization/documents/index.php` — сопроводительные документы, акты сверки, форма запроса; `local/php_interface/lib/Documents1C.php` — документы по заказам с проверкой доступа.
- ЭДО: `site-source/organization/info/index.php`, существующая форма `organization-edo`.
- Экран кабинета: `WorkspaceScreen.tsx` — категории документов и реальные действия запроса/ЭДО. `OrdersScreen.tsx` / `OrderDetailScreen.tsx` — состав, статус, доступные действия и запрос документа.
- Нет обещаний автоматической скидки, кредитного лимита, доступа всех сотрудников ко всем документам или скачивания всех документов в приложении.
- Подключение Bitrix по поручению владельца по-прежнему пропущено. Реальная загрузка документов и обмен с внешними системами не объявляются проверенными. Ни одного внешнего обращения не отправлено.

Все 21 FAQ и шесть отзывов сохранены буквально. Изменяются только B2B-контент и его представление; маршруты и обработчики других страниц не меняются.

## Проверка

TypeScript и экспорт web/iOS/Android. Browser QA проверяет порядок разделов, наличие преимуществ и инструкции, реальные переходы, 21 FAQ, отзывы, форму, регистрацию, динамические якоря, отсутствие переполнения при 320/390/768/1280. Отдельно проверяются сохранение контекста при просмотре, переход из корпоративной корзины и reduced-motion. Скриншоты ключевых блоков просмотрены; заголовки парных карточек выровнены по общей высоте.

Итог публичной проверки и релиза будет записан ниже.


## Локальная проверка завершена
277 проверок страницы и 4 проверки контекста/анимации пройдены. Порядок разделов проверяется автоматически на всех четырёх ширинах; также проверены шесть преимуществ, четыре шага заказа, три задачи документооборота и переходы в реальные разделы. Просмотрены мобильные баннер/инструкция/документы и широкие преимущества/кабинет. Выровнены слоты заголовков парных карточек. Изменены только businessPage.ts и BusinessPage.tsx; mobile commits 1e26b74, 1955bd9.


## Публикация
Изолированный релиз v0.10-20260917-34 размещён на http://159.253.19.172:18087/information/business?v=34. Проверено 500 файлов; сохранены предыдущий релиз 33 и резервная копия собственной БД. Изменения манифеста только внутри mobile/dist. SHA256 архива: 385f7f59bbc867424b9cd8b0d7a54516fb746371f49e190d0e882f08c5ef179a. Публичный bundle entry-4ba3f2629c4b48c657bbf64a764556f8.js совпадает с локальным. Защищённые файлы, процессы и HTTP до/после идентичны.


## Business 34 — published, 17.09.2026
Owner rejected v33 information priority. Published http://159.253.19.172:18087/information/business?v=34. Supplier advantages now first: own production, complete supply, technical selection, volume-specific quote, stock/reserve and delivery. Then explicit organization checkout steps and specification alternative; site/app account benefits and document/EDO workflows with actual routes. Catalog, request and FAQ precede company/projects/reviews. All 21 FAQ answers and six reviews unchanged. Mobile commits 1e26b74, 1955bd9; only businessPage.ts/BusinessPage.tsx changed.
TypeScript and web/iOS/Android export passed. 277 page + 4 context/motion checks passed locally and publicly on 320/390/768/1280, no JS errors. Verified section order, six benefits, checkout instructions, document routes, category/company routes, dynamic anchors, registration/consents/validation, keyboard focus and no overflow. Screenshots visually checked. Isolated release v0.10-20260917-34: 500 files verified, previous v33 and own DB backup retained, public bundle matches; protected files/processes/HTTP unchanged. Release manifest changes only within mobile/dist.
Bitrix integration remains skipped by owner; no external submissions or physical native-device tests claimed. No unfinished implementation within this page scope. Next step: owner visual review; PAGE ACCEPTED not set. Detailed report: parity/BUSINESS_34.md. No new blockers.
