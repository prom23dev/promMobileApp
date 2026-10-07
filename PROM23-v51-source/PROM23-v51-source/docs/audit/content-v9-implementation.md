# V9 content implementation / MASTER5

11.09.2026. Foundation gate принят от root: четыре сценария независимого QA. Реализация content и визуальная проверка обозначенного объёма завершены. Итоговые screenshots, hashes и ограничения: `docs/design-critique-v9.md`. Не считать этот документ общим PASS по всем требованиям продукта.

## Что изменилось и зачем

| Раздел | Было | Стало | Source parity / ограничения |
| --- | --- | --- | --- |
| О компании | Пять белых текстовых блоков | Реальный цех, факты, переключаемая хронология восьми лет с сохранением 11 событий, производство, экспорт, каталог, проекты, свайп наград, два покупательских пути | `about/index.php` и активный runtime; team блок закомментирован, placeholder reviews исключены. 2008 — основание, не начало производства. Историческое «20+ стран» осталось только внутри события 2023. |
| FAQ | Один огромный открытый ответ и два пустых вопроса | Поиск по вопросам и ответам, шесть тем, закрытые раскрытия, контекстное действие, пустая выдача | Curated ответы из delivery/payment/business/vendor и исходных операций. Пустые и повторные source FAQ не выданы за реальные ответы. |
| Возврат | Юридическая простыня, вложенные пункты потеряны | Сначала начало возврата, личный/B2B контекст, поиск реального заказа; обращение без найденного заказа; пять шагов подготовки, условия по причинам, документы | CTA к существующим заказам/обращению. Нет фиктивной заявки. Полный source сохранён отдельно; спорная юридическая редакция не объявляется утверждённой. |
| Сотрудничество | Пустой hub и одинаковые кнопки | Три визуальных сценария с разными задачами и внутренними routes | Source `/cooperation/`404: это новая навигация над supplier/franchise/business. |
| Поставщики | Списки и форма внизу | Реальное оборудование, ранняя профильная заявка, преимущества, требования, четыре шага, FAQ | Профильная форма supplier сохраняет backend-поля. Generic supplier hero исключён после визуального осмотра. |
| Франшиза | Несколько списков | Реальный фирменный транспорт, преимущества, переключатель поддержки/требований, три шага, реальные проекты оборудования и профильная форма | Проекты не представлены как доказательство прибыльности франчайзи. Неподтверждённые финансовые обещания/шаблонные отзывы исключены. |
| Контакты | Нет видимого филиала без выбранного города; часы только Краснодара | Четыре быстрых действия, населённый пункт отдельно, поиск по всем18 филиалам, раскрываемые фото/телефон/маршрут/часы, показать все | Fresh `App.contactsMap.items` восстановил часы17/18; Иркутск без выдуманных часов. Дублирующаяся фотография Астаны/Минска не используется. Только Краснодар имеет подтверждённый email в текущем snapshot. |
| Для бизнеса | Длинные вертикальные USP | 2колонки icon/title/2lines/details, procurement, склад12тыс.м²,9шагов поставки, реальные категории/товары, кейсы,20FAQ | Фактические условия резерва/наличия/ЭДО не превращены в живые статусы. B2B доступен без обязательных артикулов. |
| Производство | Длинные фото и повторный текст | Фото150px,6этапов, ручная галерея реального цеха/обработки/изделий с полноразмерным просмотром, категории/кейсы/документы/экскурсия | Реальный лазер не подписан как робот трубыØ42. Награды не заменяют документы товара. |
| Помощь покупателю | Вертикальный список | BuyerInfoGrid8 плиток и native hub документов | Карточки ведут в существующие routes; legal документы остаются document reader. |

## API и файлы

- `mobile/src/ui/EditorialContent.tsx`: ContentSection, ContentLink, BuyerInfoGrid, EditorialPhoto, EvidenceGallery, CompanyTimeline, FAQExplorer, CompanyCatalog, AwardHighlights, SupplyWorkflow.
- `CompanyPages.tsx`: AboutPage, CooperationPage, PartnerPage, ReturnGuide, WarrantyGuide, AwardRegister, DocumentsPage.
- `BranchExplorer.tsx`: поиск/раскрытие филиалов и независимый LocationPicker.
- `InformationScreen.tsx`, `SitePageScreen.tsx`: существующие динамические routes, без нижнего safe-area повторно (persistent tabs принадлежат AppShell).
- `content/editorialContent.ts`: versioned curated FAQ/history/workflow/media registry.
- `content/branchDetails.json`: public source whitelist, часы/координаты/фото/provenance.
- `SitePageScreen` использует `loadContentPage` с local snapshot сразу и abort guard. Remote title/sections/links сохраняют исходные forms/consents/metadata через валидатор backend agent. Partner sections используют полученный snapshot; curated company/FAQ DTO остаётся отдельным слоем и не объявляется живой CMS.

## MASTER5: проверяемая трассировка content scope

| Пункты | Реализация | Статус реализации; итоговая проверка — в design-critique-v9.md |
| --- | --- | --- |
| 74–77,160 | Раздельные settlement/branch,18branch records,4quickactions,photos/phone/address/hours | IMPLEMENTED; проверены responsive, поиск Москвы/Динской и восстановленные часы |
| 78 | Карта открывается внешним маршрутом; список работает без карты | CONDITIONAL: встроенный map provider не подключён, без ложного переключателя |
| 79–80 | BuyerInfoGrid8 tiles | IMPLEMENTED |
| 81–86,157,161 | Editorial About + все активные существенные разделы, timeline | IMPLEMENTED; legacy team/placeholder reviews исключены с evidence |
| 87 | Swipe preview наград +9record register/details | IMPLEMENTED; маленькие исходные изображения не выданы за читаемые highres документы |
| 88–91 | Action-first ReturnGuide/context/orders/appeal/preparation | IMPLEMENTED guide; transactional wizard/data отдельно root/backend |
| 92,162–163 | Полный исходный документ сохранён как evidence; текущая утверждённая редакция возврата не получена | LEGAL_REVIEW_REQUIRED, не PASS |
| 93–95 | FAQ search/6themes/closed/short/details/action | IMPLEMENTED |
| 96–98 | Existing form source contracts, contextual routes | FORM owner / отдельная проверка root |
| 99–102 | Hub +supplier+franchise media/value/process/profileform | IMPLEMENTED, no placeholder reviews |
| 103–106,114–117,158 | B2B USP/workflow9/productgroups/projects/FAQ +production6stages/realphotos | IMPLEMENTED |
| 107–113 | Procurement/quick-order routes сохраняются | ROOT owner |
| 193 | Public content loader +fallback, curatedDTO | PARTIAL: presentation snapshot подключён; полноценная CMS редактирования не заявляется |
| 198 | Shared content UI kit | IMPLEMENTED |
| 222,228 | Responsive/content/scenarios acceptance | 52 комбинации первой сборки, 10 взаимодействий и исправленные шапки второй. См. итоговый отчёт. |

## Проверки и реальные границы

TypeScript `tsc --noEmit` прошёл после основных компонентов и после окончательной правки branch metadata. Все новые routes используют существующий AppShell. Изменений сервера, DNS, БПЛА, отправок форм или live оплат не было.

Полная правовая проверка нового №657, утверждение документов и реальные операции CRM/1С/заказы/платежи не имитируются. См. `content-v9-legal-findings.md`. Дизайн не получает произвольную оценку95%; финальные findings и10/10 content interactions зафиксированы в `docs/design-critique-v9.md`.
