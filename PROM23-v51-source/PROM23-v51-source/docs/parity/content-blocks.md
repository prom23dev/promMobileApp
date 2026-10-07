# Смысловые блоки: source → mobile

Полный текст, изображения, ссылки и селектор каждого блока сохранены в `content-blocks.json`. Проверено 15 source-страниц, 81 блок. Восстановленная навигация проверена отдельно в [content-recovery-review.md](content-recovery-review.md); она не означает полную приёмку контента.

| Web URL / блок | Смысловой блок | Mobile files | Status | Конкретное состояние |
|---|---|---|---|---|
| /#block-0 | Категории | HomeFeed.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /#block-1 | Истории/промо | HomeFeed.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /#block-2 | Популярные товары | HomeFeed.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /#block-3 | Баннер | HomeFeed.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /#block-4 | Преимущества кабинета | HomeFeed.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /#block-5 | Компания и производство | HomeFeed.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /#block-6 | Товарная подборка | HomeFeed.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /#block-7 | Статьи | HomeFeed.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /#block-8 | География/франшиза | HomeFeed.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /#block-9 | Подборка товаров | HomeFeed.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /#block-10 | Desktop-подборка | HomeFeed.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /about/#block-0 | Первый экран/основание | CompanyPages.tsx;SourceCompanyContent.tsx;EditorialContent.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /about/#block-1 | Достижения/масштаб | CompanyPages.tsx;SourceCompanyContent.tsx;EditorialContent.tsx | PARTIAL | PublishedCompanyScale восстанавливает опубликованные 10 000+ проектов, склады в 15+ регионах и 10+ наград с явной атрибуцией к презентации компании; вместо устаревших «16 лет» указан год основания 2008. |
| /about/#block-2 | История: 11 событий | CompanyPages.tsx;SourceCompanyContent.tsx;EditorialContent.tsx | PARTIAL | CompanyTimeline содержит 11 исходных событий; все даты и полный текст доступны в раскрытии. Полная семантическая проверка не завершена. |
| /about/#block-3 | Производство | CompanyPages.tsx;SourceCompanyContent.tsx;EditorialContent.tsx | PARTIAL | Настоящее фото производства и переход в отдельный производственный раздел сохранены. |
| /about/#block-4 | Категории оборудования | CompanyPages.tsx;SourceCompanyContent.tsx;EditorialContent.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /about/#block-5 | Франшиза и география 18 городов | CompanyPages.tsx;SourceCompanyContent.tsx;EditorialContent.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /about/#block-6 | Сертификация/цены/логистика | CompanyPages.tsx;SourceCompanyContent.tsx;EditorialContent.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /about/#block-7 | 3 награды и все документы | CompanyPages.tsx;SourceCompanyContent.tsx;EditorialContent.tsx | PARTIAL | Подборка трёх наград ведёт в реестр девяти записей. Миниатюры не выдаются за читаемые полные сертификаты. |
| /about/#block-8 | Отзывы/кейсы | CompanyPages.tsx;SourceCompanyContent.tsx;EditorialContent.tsx | LEGACY_REVIEW | В source не заполнено название компании в отзыве. Evidence сохраняется; неподтверждённый отзыв не публикуется как рекомендация. |
| /brands/#block-0 | Первый экран | SitePageScreen.tsx;SourceCompanyContent.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /brands/#block-1 | Причины выбора/4 показателя | SitePageScreen.tsx;SourceCompanyContent.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /brands/#block-2 | Алфавит и порядок | SitePageScreen.tsx;SourceCompanyContent.tsx | PARTIAL | Поиск, пустая выдача и F/I/R восстановлены; проверены на 320/390. Динамическая сортировка популярности не закрыта. |
| /brands/#block-3 | Fubag/Inforce/Ryobi | SitePageScreen.tsx;SourceCompanyContent.tsx | PARTIAL | Три опубликованных бренда ведут к точному brand query. Полнота товаров зависит от импорта каталога. |
| /brands/#block-4 | 2 популярных товара | SitePageScreen.tsx;SourceCompanyContent.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /vendor/#block-0 | Производство/индивидуальное предложение | CompanyTopic.tsx;SourceCompanyContent.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /vendor/#block-1 | 3 этапа и адрес | CompanyTopic.tsx;SourceCompanyContent.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /vendor/#block-2 | 4 преимущества/база/испытания | CompanyTopic.tsx;SourceCompanyContent.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /vendor/#block-3 | 10 проектов | CompanyTopic.tsx;SourceCompanyContent.tsx | PARTIAL | Все 14 импортированных проектов доступны через CompanyProjectDirectory, включая 10 проектов на source-странице производства. |
| /vendor/#block-4 | Корпоративная форма | CompanyTopic.tsx;SourceCompanyContent.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /vendor/#block-5 | 4 подразделения и галереи | CompanyTopic.tsx;SourceCompanyContent.tsx | PARTIAL | Все четыре подробных описания и первое фото восстановлены. Раскрытия проверены на 320/390 в 06d88. Остальные фото галерей требуют переноса. |
| /vendor/#block-6 | Видео MOV и экскурсия | CompanyTopic.tsx;SourceCompanyContent.tsx | PARTIAL | Корпоративный MOV около 270 MB доступен по явному нажатию; сохранён переход к форме экскурсии. Native streaming/codec не проверены. |
| /vendor/#block-7 | Отзывы | CompanyTopic.tsx;SourceCompanyContent.tsx | LEGACY_REVIEW | В source не заполнено название компании в отзыве. Evidence сохраняется; неподтверждённый отзыв не публикуется как рекомендация. |
| /vendor/#block-8 | 3 награды | CompanyTopic.tsx;SourceCompanyContent.tsx | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /vendor/#block-9 | 3 FAQ | CompanyTopic.tsx;SourceCompanyContent.tsx | LEGACY_REVIEW | FAQ содержит повторяющиеся ответы о доставке, не соответствующие другим вопросам. Текст сохранён в evidence; нельзя выдавать ошибочный ответ за проверенную информацию. |
| /business/#block-0 | Первый экран B2B | CompanyTopic.tsx;companyContent.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /business/#block-1 | 6 условий закупки | CompanyTopic.tsx;companyContent.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /business/#block-2 | Кабинет/регистрация | CompanyTopic.tsx;companyContent.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /business/#block-3 | Категории по этапам работ | CompanyTopic.tsx;companyContent.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /business/#block-4 | Процесс поставки | CompanyTopic.tsx;companyContent.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /business/#block-5 | 2 проекта | CompanyTopic.tsx;companyContent.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /business/#block-6 | 3 причины выбора | CompanyTopic.tsx;companyContent.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /business/#block-7 | 20 FAQ | CompanyTopic.tsx;companyContent.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /suppliers/#block-0 | Первый экран | CompanyPages.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /suppliers/#block-1 | Ассортимент/4 выгоды | CompanyPages.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /suppliers/#block-2 | Как стать поставщиком, требования | CompanyPages.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /suppliers/#block-3 | 4 этапа | CompanyPages.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /suppliers/#block-4 | Форма поставщика | CompanyPages.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /suppliers/#block-5 | 3 FAQ | CompanyPages.tsx;sitePages.ts | LEGACY_REVIEW | FAQ содержит повторяющиеся ответы о доставке, не соответствующие другим вопросам. Текст сохранён в evidence; нельзя выдавать ошибочный ответ за проверенную информацию. |
| /franchise/#block-0 | Первый экран | CompanyPages.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /franchise/#block-1 | Бренд/вход/спрос | CompanyPages.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /franchise/#block-2 | Карта/география | CompanyPages.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /franchise/#block-3 | 4 преимущества | CompanyPages.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /franchise/#block-4 | 3 этапа | CompanyPages.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /franchise/#block-5 | Предоставляем/требования | CompanyPages.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /franchise/#block-6 | Форма партнёра | CompanyPages.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /franchise/#block-7 | 10 проектов как примеры | CompanyPages.tsx;sitePages.ts | PARTIAL | Список проектов восстановлен. Применение оборудования не выдается за финансовый результат франчайзи. |
| /franchise/#block-8 | Отзывы | CompanyPages.tsx;sitePages.ts | LEGACY_REVIEW | В source не заполнено название компании в отзыве. Evidence сохраняется; неподтверждённый отзыв не публикуется как рекомендация. |
| /franchise/#block-9 | 3 FAQ | CompanyPages.tsx;sitePages.ts | LEGACY_REVIEW | FAQ содержит повторяющиеся ответы о доставке, не соответствующие другим вопросам. Текст сохранён в evidence; нельзя выдавать ошибочный ответ за проверенную информацию. |
| /delivery/#block-0 | Заголовок и соседние сервисные вкладки | InformationScreen.tsx;siteContent.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /delivery/#block-1 | Пять способов доставки, самовывоз и тарифы | InformationScreen.tsx;siteContent.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /delivery/#block-2 | 3 FAQ | InformationScreen.tsx;siteContent.ts | LEGACY_REVIEW | FAQ содержит повторяющиеся ответы о доставке, не соответствующие другим вопросам. Текст сохранён в evidence; нельзя выдавать ошибочный ответ за проверенную информацию. |
| /payment/#block-0 | Заголовок и соседние сервисные вкладки | InformationScreen.tsx;siteContent.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /payment/#block-1 | Вместо оплаты опубликован текст доставки | InformationScreen.tsx;siteContent.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /payment/#block-2 | 3 FAQ | InformationScreen.tsx;siteContent.ts | LEGACY_REVIEW | FAQ содержит повторяющиеся ответы о доставке, не соответствующие другим вопросам. Текст сохранён в evidence; нельзя выдавать ошибочный ответ за проверенную информацию. |
| /return/#block-0 | Заголовок и соседние сервисные вкладки | CompanyPages.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /return/#block-1 | Полный регламент 1–6 с вложенными пунктами | CompanyPages.tsx;sitePages.ts | MISSING | Полный вложенный регламент не выведен в document reader. Email-only, сроки обращения по недостатку и blanket-ограничение индивидуальных заказов требуют юридического исправления. Это не внешний технический блокер. |
| /return/#block-2 | 3 FAQ | CompanyPages.tsx;sitePages.ts | LEGACY_REVIEW | FAQ содержит повторяющиеся ответы о доставке, не соответствующие другим вопросам. Текст сохранён в evidence; нельзя выдавать ошибочный ответ за проверенную информацию. |
| /checkout/#block-0 | Заголовок и соседние сервисные вкладки | SitePageScreen.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /checkout/#block-1 | Вместо инструкции оформления — текст доставки | SitePageScreen.tsx;sitePages.ts | PARTIAL | Публичная /checkout/ ошибочно содержит текст доставки. Evidence сохранён. В мобильной инструкции пять шагов из активного source checkout; присутствие проверено на 320/390. |
| /checkout/#block-2 | 3 FAQ | SitePageScreen.tsx;sitePages.ts | LEGACY_REVIEW | FAQ содержит повторяющиеся ответы о доставке, не соответствующие другим вопросам. Текст сохранён в evidence; нельзя выдавать ошибочный ответ за проверенную информацию. |
| /details/#block-0 | Заголовок и соседние сервисные вкладки | SitePageScreen.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /details/#block-1 | ООО/ИНН/КПП/ОГРН/адреса/счёт по запросу | SitePageScreen.tsx;sitePages.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /details/#block-2 | 3 FAQ | SitePageScreen.tsx;sitePages.ts | LEGACY_REVIEW | FAQ содержит повторяющиеся ответы о доставке, не соответствующие другим вопросам. Текст сохранён в evidence; нельзя выдавать ошибочный ответ за проверенную информацию. |
| /oferta/#block-0 | Заголовок и соседние сервисные вкладки | LegalScreen.tsx;legalDocuments.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /oferta/#block-1 | Полная оферта | LegalScreen.tsx;legalDocuments.ts | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /oferta/#block-2 | 3 FAQ | LegalScreen.tsx;legalDocuments.ts | LEGACY_REVIEW | FAQ содержит повторяющиеся ответы о доставке, не соответствующие другим вопросам. Текст сохранён в evidence; нельзя выдавать ошибочный ответ за проверенную информацию. |
| /contacts/#block-0 | Контакты в г. Краснодар | BranchExplorer.tsx/AwardRegister | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /contacts/#block-1 | Адрес и контакты для связи Офис и склад: г. Краснодар ул. Карла Гусника, д. 17/20 (р-н Витаминкомбин | BranchExplorer.tsx/AwardRegister | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /contacts/#block-2 | Адреса магазинов | BranchExplorer.tsx/AwardRegister | PARTIAL | Экран существует; полнота исходных текста, медиа и действий ещё проверяется. |
| /awards/#block-0 | Награды и профессиональное признание | AwardsPage.tsx, content/awards.ts, awardsCopy.ts | VERIFIED 31 | 10 точных описаний из документа владельца, 9 исходных фото, годы/уровни/получатели, отдельные персональные награды, галерея и ссылка на реестр. Источники и ограничение 86×123: AWARDS_31.md. |
