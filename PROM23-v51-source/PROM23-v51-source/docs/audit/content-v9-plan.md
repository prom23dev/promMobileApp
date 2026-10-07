# V9 / MASTER5: content parity и план редакционного UX

11.09.2026. MASTER5 прочитан полностью. Применены `frontend-design` и `design-system` (включая token-architecture). **Это аудит и план до UI-изменений.** Реализация начинается после подтверждённого root gate: AppShell/navigation/cart/location/product flow. Не менять Home, AppShell, primitives, store/geo этим исполнителем.

## 1. Фактическая база и границы

Проверены 9 текущих мобильных routes на localhost и опубликованной сборке `159.253.19.172:18087`; все HTTP200. Исходные публичные страницы также прочитаны и сняты на390×844. `/cooperation/` исходного сайта даёт404: мобильный cooperation — новый навигационный hub над реальными suppliers/franchise/business, а не отсутствующая копия самостоятельной web-страницы.

Baseline: `docs/baseline-v9/content/`. На каждый route есть `mobile-{id}-390-top.png`, `mobile-{id}-390-middle.png`, `deployed-{id}-390-top.png`, `deployed-{id}-390-middle.png`; source имеет top/full screenshots. `inventory.json` и `deployed-inventory.json` содержат status, entry, видимый текст, headings, ссылки, видимые поля форм, URL/размеры медиа. Никакие формы не отправлялись, скрытые поля/секретные значения не извлекались.

Baseline IDs: about, faq, return, cooperation, suppliers, franchise, contacts, business, production. Source faq — `/delivery/`, return — `/return/`, production — `/vendor/`.

Существование PHP-модуля или conditional UF binding не доказывает наличие опубликованных данных. Сохранение function intent не означает копирование source-багов. Source-backed статическая копия не объявляется живой CMS/CRM/1С интеграцией.

## 2. Матрица точных потерь и решений

| Route / статус | Source evidence | Реальный V8 | V9 действие |
| --- | --- | --- | --- |
| `/pages/about` REDESIGN | `about/index.php:20–57` banner;58–92 achievements;95–131 history;134–171 banner block;174–198 categories;201 map;209–243 advantages;246–277 cases/certificates;316+ reviews | Белые текстовые карточки, история bullet list. Нет предметного hero, интерактивной хронологии, каталога, видимых наград/кейсов. | Редакционный обзор компании: короткий предметный кадр →3 подтверждённых факта →timeline с выбранным годом →производство →экспорт →категории/проекты →награды preview →два равноправных commerce пути. Не повторять одну и ту же историю в3 блоках. |
| About team LEGACY | `about/index.php:280–314` весь `UF_OUR_TEAM` block закомментирован | Не показан | Не считать активной потерей, не придумывать сотрудников/портреты. |
| `/pages/faq` REDESIGN | `delivery/index.php:144–183` UF_FAQ; template `news.list/faq/template.php`. Runtime повторяет ответ о доставке для разных вопросов | Один открытый ответ~470слов,2 пустых вопроса. Нет поиска/тем. | Help center: поиск по вопросу/ответу,6 тем, закрытые вопросы. Короткий ответ +«Подробнее» только для длинного материала +context CTA. Ответы из проверенных delivery/payment/return/business/production, не копировать дубли с source. |
| `/pages/returns` REDESIGN + LEGAL REVIEW | `/return/` rewrite `urlrewrite.php:230` →`delivery/index.php?tab=return`; UF_CONTENT_TABS_TEXT | Юридический текст первым экраном, без начала возврата; часть вложенных списков импорта потеряна (в т.ч. содержимое2.1/2.2/3.1/3.3/4.2). | Action start «Оформить возврат» →контекст заказа;5 коротких разделов подготовки, далее полный document reader. Физлицо/организация разделены. Не вводить14-дневный автоматический отказ. Полный source сохранён evidence, спорные правила не становятся новым нормативным текстом. |
| `/pages/cooperation` REDESIGN | Реальные `/suppliers/`, `/franchise/`, `/business/`; самостоятельный `/cooperation/`404 | «Информация обновляется» +5 одинаковых кнопок. sourceUrl ошибочно suppliers | Hub3 осмысленных visual cards: поставлять нам / работать под брендом / закупать для объекта. Разные цели и CTA. Убрать пустое обновление. Исправить internal mapping `/business/`. |
| `/pages/suppliers` REDESIGN | `suppliers/index.php:16–86` banner/achievements;92–159 include how-to/requirements;161–219 stages;223+ form; UF_FAQ. Includes `local/include/page_suppliers/*` | Информационный смысл в основном есть, но длинные прямоугольники и CTA далеко внизу; FAQ отсутствует | Компактное фото логистики, ясная цель «Предложить товары»,4 коротких преимущества, checklist требований, последовательный flow Заявка→Проверка→Условия→Договор. Контекстный FAQ из подтверждённых требований. |
| `/pages/franchise` REDESIGN | `franchise/index.php:18–138` banner/advantages;141–194 steps;includes working_provide/require;266–383 partners form;387+ projects;439+ reviews;501+ FAQ | Списки преимуществ/поддержки,3 bullets этапов; нет настоящей фотографии, разницы поддержки/требований, проекта/условий | Фото фирменной логистики,4 value tiles, switch «Что даём / Что нужно от вас»,3-step workflow, форма партнёра. Кейсы на source названы успешными партнёрами, но их тексты — об оборудовании на объектах: показать как проекты оборудования, не доказательство доходности франчайзи. |
| `/information/contacts` REDESIGN | `contacts/index.php` +`news.list/contacts/template.php:24–59` DTO(id,name,coords,addr,worktime,phone,picture);64+ selected-region SLIDER;body адрес/телефон/email/режим | Без выбранного settlement — пустой выбор филиала/справочная; реальные фото/список точек не видны. Много одинаковых CTA. | Quick actions4: звонок/написать/филиалы/обратный звонок. Поиск филиала, визуальные branch cards с фото/адресом/режимом, явные phone/map actions. Settlement отдельно; «ближайшие» только при подтверждённом resolver/distance, иначе честный список филиалов. Карта опциональна, список работает без неё. |
| `/information/business` POLISH/STRUCTURE | `business/index.php` UF advantages/categories/achievements/projects/reviews/FAQ; fresh DOM baseline | Настоящие фото/6USP/категории/12k склад/projects/20FAQ уже есть. USP дают длинный scroll; нет видимого supply workflow, product feed, detail hierarchy | 2колонки USP: icon/title/2строки+details. Procurement ранний. Visual workflow9 шагов с группировкой «Подготовка/Согласование/Получение»; реальные категории/товары. CTA«Нужен один товар? В каталог». Без каталога-only B2B роль должна оставаться очевидной. |
| `/information/production` POLISH/STRUCTURE | Runtime `/vendor/`; `business/index.php` company evidence. 6 фаз сведены из проектирования/materials/цех/QC/отгрузки | Реальные цех/лазер,6 tabs,manufacturing/custom/FAQ/tour. Большой hero, процесс и описание повторяются, gallery/doc previews нет | Hero160px,6-step process с одной активной панелью/фото по смыслу, факты2022/2023/2024 как история расширения, реальная gallery, продукты/кейсы, документы отдельно от наград, экскурсия/context CTA. Не подписывать существующий лазер как робот для трубыØ42. |

### Подтверждённые source defects / exclusions

- About hero «с2008 лидер в производстве» противоречит own history:2008основание,2021строительство,2022первая очередь. Используем точную timeline.
- Повторяющиеся placeholder reviews с `[название компании]` исключаются. Ryobi testimonial без проверяемого автора/полного текста не выдаётся за подтверждённый отзыв о франшизе.
- «16лет», «10+наград», «тысячи клиентов», «20+стран» не превращаются в текущие2026 counters. Экспорт СНГ/Азия/Африка подтверждён прямым корпоративным заявлением.
- 12 000м² — Краснодарский склад. Не площадь цеха.
- Supplier stage slider начинает с«Договор» из-за сортировки/loop. Native workflow использует смысловой порядок из how-to, не ошибочный visible slide order.
- Материалы FAQ пустые/чужие не должны становиться пустыми карточками или fabricated answers.
- Награды/сертификаты смешаны в site heading. Карточка диплома не доказывает соответствие товара техническим требованиям.

## 3. Редакционное направление и действия

Одна система, разные способы чтения. Цвета остаются token-based: brand navy `#3D4471`, ink `#202338`, accent `#D93916`, white `#FFFFFF`, canvas `#F5F6F8`, line `#E5E7ED`. Body15/22, secondary12/17; AppHeader уже даётH1, title внутри body не дублировать как ещё одинH1. Никаких новых font SDK/лишнего набора шрифтов: сначала согласовать с общей типографикой root. Content hero120–160px, фото как доказательство. Основной CTA48px, вторичные навигационные actions44px, лаконичные icon rows вместо всех full-width buttons.

**Signature: «доказательство + действие».** Реальное изображение/дата/производственная стадия сопровождается тем, что покупатель может сделать: подобрать оборудование, открыть проект, проверить условия, обратиться. Нет декоративных чисел/плашек без действия.

### About — история, которую можно исследовать

```
[AppHeader + persistent bottom nav]
[фото производства 140px]  [2008 основание]
Коротко о компании • Производство • Экспорт
[2008] [2012] [2015] [2020] [2021] [2022] [2023] [2024]
  выбранный этап: заголовок + 2строки + реальный кадр
Собственная продукция → реальные категории
Проект: фото / задача / оборудование → статья
Награды: миниатюра / название / подробности
[В каталог]    Закупка для компании →
```

Timeline сохраняет все датированные этапы из source (не только5 из companyHistory V8). Не связывать современный цех с2008 как исторической съёмкой: у фото нейтральная подпись «Производство компании», дата относится к событию. Полный текст истории доступен.

### Return — сначала дело, затем документ

```
[Оформить возврат]
Для себя | Для компании   (контекст покупки, не создание организации)
Заказ → Товар → Причина/описание → Фото/видео → Передача
Что подготовить  • Если обнаружен недостаток
Как передать     • Как узнать результат
Полные правила возврата → document reader
```

Content entry ведёт к существующей order/appeal-return capability с контекстом заказа; не создаёт второй fake submit. Если заказ не найден/пользователь не вошёл, понятный путь поиска заказа/обращения. Read-only подготовка не требует auth. Дедлайны и eligibility решает закон/заказ/товар, не произвольный frontend countdown.

### FAQ — справочник с поиском

Поиск по всем6темам; category chips переносятся/скроллятся с явным affordance. В закрытом состоянии только вопрос. По запросу выдача с темой, кратким ответом и действием. No-results: сбросить поиск/обратиться, не пустая карточка. Вопросы без ответа не отображать. Search по содержанию локального DTO быстрый; API может заменить snapshot.

### Contacts — точки обслуживания

В начале4 компактных quick actions. Выбранный settlement в отдельной строке с изменением через root LocationPicker. Список филиалов searchable; карточка фото120px +название/тип/адрес/режим; 2compact actions телефон/маршрут. Details понажатию: email,доступные данные самовывоза. Без выдуманных «открыто сейчас»/«заберите сегодня»; время можно рассчитывать только с timezone и достоверным расписанием. Для Динской не назначать филиал с тем же именем и не назвать Краснодар ближайшим без resolver.

### Cooperation / suppliers / franchise

Hub3visualсценария, далее свой service flow. Suppliers checklist кликабелен как информационное раскрытие, не фиктивная проверка качества. Franchise tiles не обещают доход/окупаемость/эксклюзивную территорию. Номер этапа — порядок реальных действий. CTA соответствует реальной форме supplier/partner, не универсальному callback.

### Business / production

Разделы остаются commerce. B2B USP2колонки с кратким summary и details; реальные category tiles и products из текущего каталога, не новые invented brands. Supply workflow9steps отображается группами3phase, шаги доступны. Production6stages имеют смысловое содержание; gallery управляется вручную, фото открывается полностью, нет autoplay. Отзывы только верифицированные; отсутствие не заполнять шаблонами.

## 4. Общие content components (после root gate)

- `EditorialPage`/`ContentSection`: spacing/media/typography без повторного shell.
- `BuyerInfoGrid`:8 tiles Доставка/Оплата/Возврат/Гарантия/Кабинет/Документы/FAQ/Контакты; icon+title+shortdescription. Заменяет vertical list «Информация для покупателей».
- `CompanyTimeline`: all milestones, selected state, reduced-motion crossfade, полный текст.
- `EvidenceGallery`: реальные media+caption+source provenance, manualpagecontrols, fullscreen route только как intentional immersive flow.
- `FAQExplorer`: categories/search/closed accordion/context action.
- `SupplyWorkflow`:9source steps withgroups; `ProcessStep` для6production stages.
- `BranchCard`/`BranchExplorer`: фото, данные и действия; list не зависит от map availability.
- `ReturnGuide`: контекст и подготовка + document entry, не подмена реальной return form.
- `CooperationHub`/`PartnerDetail`: самостоятельные цели вместо genericSitePage dump.

Владение реализации: SitePageScreen, InformationScreen, CompanyTopic, CompanyTrust, новые content components/data. Core/header/bottomnav/API-мутации не менять без координации.

## 5. CMS / данные / зависимости root

Mobile не парсит HTML. Content DTO: `{id,revision,updatedAt,title,summary,audience,sections:[{id,type,title,body,media,items,action}],sources}`. Media `{id,uri,width,height,alt,caption,sourceUrl,credit?}`. FAQ `{id,category,question,summary,details,action,sourceUrl}`. Branch `{id,name,type,address,phones,email,hours,timezone?,photos,coordinates?,pickupConditions?,distanceKm?}`.

Пока live CMS не подключена: явно versioned curated data snapshot отделён от screen code, с provenance и будущим BFF adapter. Это реализация UI/контракта, не утверждение о работающей CMS. Root/программисты подключают actual content endpoint; кеш/empty/error/offline должны быть совместимы с DTO. Need from root: shared AppShell safearea/content padding; route mappings; available Return entry/заказы; Branch resolver contract; content API ownership. В отсутствие ближайших данных показывать все подтверждённые филиалы.

## 6. Реальные медиа и потребность в импорте

Уже локально: `mobile/assets/brand/factory-wide.webp`1400×600, `equipment-wide.webp`1401×600, `laser-wide.webp`1400×600; actualgallery3projects в `mobile/assets/blog/gallery-*.jpg`1024×683. Provenance `docs/discovery/visual-assets-v7.json` и `project-gallery-assets-v7.json`.

Новые публично наблюдённые кандидаты (не downloaded/не изменены в этом audit):

| Роль | Exact source URL | Примечание |
| --- | --- | --- |
| Franchise hero, фирменные автомобили | https://prom.myfast.space/upload/dev2fun.imagecompress/webp/iblock/e69/h20lmd6e01dmlnyamqkdikss769bq7qz.webp | Видим на source-franchise screenshot; требуются проверка natural size и local import |
| Suppliers hero | https://prom.myfast.space/upload/dev2fun.imagecompress/webp/iblock/63e/jf9m0suwhtgm856mrx7nsrtw6dohg59t.webp | Source banner, не stockphoto |
| Краснодар — branch photo | https://prom.myfast.space/upload/dev2fun.imagecompress/webp/iblock/4bf/uo9o9xr5r0f7tj8dikeirjfgw9c7izfx.webp |4032×3024; получить подходящий observed thumbnail/оптимизированныйasset передbundle |
| Москва — branch photo | https://prom.myfast.space/upload/dev2fun.imagecompress/webp/iblock/aee/2x9e4pypdgfl13g3mhqje8wj6zio2hgx.webp |1280×720 |
| Ростов — branch photo | https://prom.myfast.space/upload/dev2fun.imagecompress/webp/iblock/267/x328gi53ov2hc7glyl6e3zdtaq59xew0.webp |1152×864 |
| About timeline source image | https://prom.myfast.space/upload/dev2fun.imagecompress/webp/iblock/724/f4mr2aru3j972ff3piiu4u88ff2b3btp.webp |833×500; не считать исторической съёмкой2020поaltбезподтверждения |

Полный список18branchphotos и source backgrounds в baseline inventory. Астана/Минск используют одинаковый image URL — не выдавать одно фото за независимое доказательство двух точек. Awards source из предыдущегоaudit86×123px: показывать небольшие thumbnails +название; без растяжения и ложной «читаемой копии». Если highres не найден, gallery сохраняет preview, detailstext; нужен отдельный laterasset запрос, не генерациядокумента.

## 7. Проверки приёмки

Root подтвердил foundation gate: 4 из 4 независимых сценариев QA прошли. Разрешена реализация в обозначенных границах. После кода:

- Те же 9 routes: before/after на 390, затем 320/430. Нет горизонтального переполнения; нижняя навигация на обычных страницах; корзина в одно нажатие; логичный возврат.
- About: все содержательные source-блоки сопоставлены, timeline показывает разные события, категории/кейсы/награды доступны.
- FAQ: вопросы закрыты по умолчанию; поиск работает по двум темам; есть пустая выдача и корректные CTA.
- Return: действие выше юридического текста; отдельный B2B-контекст; полный исходный документ сохранён как evidence без потери вложенных пунктов; нет автоматического отказа после 14 дней.
- Cooperation: три разных пути; business внутри приложения; нет сообщения об обновлении вместо навигационного раздела.
- Contacts: список, поиск филиалов, телефон, почта, маршрут, callback. Для Динской нет выдуманного филиала. Список доступен без карты.
- Business: раскрытия USP, процесс поставки, товары и procurement. Production: шесть этапов, фотографии, просмотр, изготовление и экскурсия.
- Видимый фокус, подписи для screen reader, expanded state, reduced motion, браузерное увеличение 200% (не выдавать за нативный Dynamic Type).
- Ни одного live POST. Успех CRM/1С/платежей не проверяется и не имитируется. Root QA отдельно проверяет неразрушающие контракты и ошибки.

Юридические findings и источники — `content-v9-legal-findings.md`. Визуальная приёмка не равна полной юридической или магазинной сертификации.
