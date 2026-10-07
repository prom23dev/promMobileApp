# Mobile screen inventory — baseline MASTER4

11.09.2026. Baseline опубликованной V7: `entry-9bd376941d209cef85b2f91b43359fc7.js`. Инвентарь активного `mobile/app`, а не старых HTML-прототипов. Git commit недоступен: папка проекта не является git-репозиторием; идентичность сборки зафиксирована SHA256 в runtime отчёте.

**21 обычный route pattern + fallback `+not-found`**; 3 инфраструктурных файла `_layout.tsx`, `(tabs)/_layout.tsx`, `+html.tsx` не считаются экранами. Развёрнутые именованные варианты: 14 workspace, 68 форм, 17 контентных страниц, 5 legal, 5 information, 28 публикаций, 28 доступных товаров. Город, фильтры, переключатель покупателя и раскрывающиеся панели — состояния экранов, не дополнительные routes.

**184/184 проверенных URL открылись**, 0 JS page errors, 0 горизонтального overflow документа при 390×844. В этот счёт входят поисковые/сервисные query states и 404, но не все 226 отдельных значений section ID. Дерево каталога использует один экран; фактически дополнительно открыт раздел «Леса» с дочерними строками. Для каждого named form/article/page — runtime read, но не реальная отправка или проверка прав всех ролей.

[Машинное доказательство](current-build-runtime.json) сохраняет текст, заголовки, controls и поля; [основной аудит](current-build-audit.md) содержит решения и источники.

## Активные route patterns

| Файл | Путь | Renderer / назначение |
| --- | --- | --- |
| `mobile/app/(tabs)/account.tsx` | `/account` | AccountScreen |
| `mobile/app/(tabs)/cart.tsx` | `/cart` | CartScreen |
| `mobile/app/(tabs)/catalog.tsx` | `/catalog` | CatalogScreen |
| `mobile/app/(tabs)/favorites.tsx` | `/favorites` | CatalogScreen |
| `mobile/app/(tabs)/index.tsx` | `/` | CatalogScreen |
| `mobile/app/+not-found.tsx` | `/* (fallback)` | inline router fallback |
| `mobile/app/blog/[id].tsx` | `/blog/[id]` | ArticleScreen |
| `mobile/app/blog/index.tsx` | `/blog` | BlogScreen |
| `mobile/app/checkout-preview.tsx` | `/checkout-preview` | CheckoutScreen |
| `mobile/app/compare.tsx` | `/compare` | CompareScreen |
| `mobile/app/forms/[id].tsx` | `/forms/[id]` | FormScreen |
| `mobile/app/information/[topic].tsx` | `/information/[topic]` | InformationScreen |
| `mobile/app/legal/[id].tsx` | `/legal/[id]` | LegalScreen |
| `mobile/app/more.tsx` | `/more` | MoreScreen |
| `mobile/app/notifications.tsx` | `/notifications` | NotificationsScreen |
| `mobile/app/order/[id].tsx` | `/order/[id]` | OrderDetailScreen |
| `mobile/app/orders.tsx` | `/orders` | OrdersScreen |
| `mobile/app/pages/[id].tsx` | `/pages/[id]` | SitePageScreen |
| `mobile/app/product/[id].tsx` | `/product/[id]` | ProductScreen |
| `mobile/app/quick-order.tsx` | `/quick-order` | QuickOrderScreen |
| `mobile/app/service.tsx` | `/service` | ServiceScreen |
| `mobile/app/workspace/[kind].tsx` | `/workspace/[kind]` | WorkspaceScreen |

## Все проверенные варианты

RENDERED означает только открытие экрана в гостевой сессии. FIX/DATA GAP не значит удалить существующий UI. Title — фактический документ/heading, не доказательство контента ниже первого экрана.

| URL | Экран / title | Runtime | Data boundary / действие |
| --- | --- | --- | --- |
| `/` | От нашего цеха до вашего объекта | RENDERED | Локальный commerce UI — KEEP/POLISH; см. основной аудит |
| `/catalog` | Каталог | RENDERED | Локальный commerce UI — KEEP/POLISH; см. основной аудит |
| `/catalog?section=all` | Каталог | RENDERED | Локальный commerce UI — KEEP/POLISH; см. основной аудит |
| `/catalog?q=Тент` | Каталог | RENDERED | Локальный commerce UI — KEEP/POLISH; см. основной аудит |
| `/catalog?q=Несуществующий-товар-123` | Каталог | RENDERED | Локальный commerce UI — KEEP/POLISH; см. основной аудит |
| `/favorites` | Избранное | RENDERED | Локальный commerce UI — KEEP/POLISH; см. основной аудит |
| `/cart` | Корзина | RENDERED | Локальный commerce UI — KEEP/POLISH; см. основной аудит |
| `/account` | Кабинет | RENDERED | Локальный commerce UI — KEEP/POLISH; см. основной аудит |
| `/more` | Меню | RENDERED | Локальный commerce UI — KEEP/POLISH; см. основной аудит |
| `/compare` | Сравнение · 0 | RENDERED | Локальный commerce UI — KEEP/POLISH; см. основной аудит |
| `/quick-order` | Спецификация | RENDERED | Локальный парсер — KEEP как secondary |
| `/orders` | Мои заказы | RENDERED | Гостевой empty — KEEP; подключение данных отдельно |
| `/order/qa-absent` | Заказ | RENDERED | Валидный заказ отсутствует; безопасный fallback — KEEP |
| `/service` | Помощь и возвраты | RENDERED | Навигация/empty — KEEP; backend отдельно |
| `/service?kind=return` | Помощь и возвраты | RENDERED | Навигация/empty — KEEP; backend отдельно |
| `/notifications` | Уведомления | RENDERED | UI/preferences adapter gap — FIX |
| `/checkout-preview` | Оформление заказа | RENDERED | Локальный commerce UI — KEEP/POLISH; см. основной аудит |
| `/not-a-route` | Страница не найдена | RENDERED | Локальный commerce UI — KEEP/POLISH; см. основной аудит |
| `/information/delivery` | Доставка | RENDERED | Source snapshot — POLISH; business/production FIX |
| `/information/payment` | Оплата | RENDERED | Source snapshot — POLISH; business/production FIX |
| `/information/business` | Для бизнеса | RENDERED | Source snapshot — POLISH; business/production FIX |
| `/information/production` | Производство | RENDERED | Source snapshot — POLISH; business/production FIX |
| `/information/contacts` | Контакты | RENDERED | Source snapshot — POLISH; business/production FIX |
| `/workspace/profile` | Личные данные | RENDERED | Empty/source API unavailable — FIX/data |
| `/workspace/contacts` | Телефон и почта | RENDERED | Empty/source API unavailable — FIX/data |
| `/workspace/addresses` | Адреса доставки | RENDERED | Empty/source API unavailable — FIX/data |
| `/workspace/organizations` | Мои организации | RENDERED | Empty/source API unavailable — FIX/data |
| `/workspace/requisites` | Реквизиты организации | RENDERED | Empty/source API unavailable — FIX/data |
| `/workspace/bank` | Банковские реквизиты | RENDERED | Empty/source API unavailable — FIX/data |
| `/workspace/staff` | Сотрудники и полномочия | RENDERED | Empty/source API unavailable — FIX/data |
| `/workspace/documents` | Документы | RENDERED | Empty/source API unavailable — FIX/data |
| `/workspace/sessions` | Устройства и сеансы | RENDERED | Empty/source API unavailable — FIX/data |
| `/workspace/security` | Данные и безопасность | RENDERED | Empty/source API unavailable — FIX/data |
| `/workspace/payment-methods` | Способы оплаты | RENDERED | Empty/source API unavailable — FIX/data |
| `/workspace/reviews` | Мои отзывы и вопросы | RENDERED | Empty/source API unavailable — FIX/data |
| `/workspace/returns` | Возвраты | RENDERED | Empty/source API unavailable — FIX/data |
| `/workspace/about` | О магазине | RENDERED | Empty/source API unavailable — FIX/data |
| `/pages/about` | О компании | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/brands` | Бренды | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/suppliers` | Поставщикам | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/franchise` | Франшиза | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/awards` | Награды и сертификаты | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/returns` | Правила возврата | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/details` | Реквизиты | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/offer` | Публичная оферта | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/privacy` | Политика конфиденциальности | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/personal-data` | Согласие на обработку персональных данных | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/cookies` | Политика использования cookie-файлов | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/checkout` | Оформление заказа | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/recommendations` | Сведения о рекомендательных технологиях | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/faq` | Вопросы и ответы | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/warranty` | Гарантии | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/promotions` | Акции и предложения | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/pages/cooperation` | Сотрудничество | RENDERED | Source snapshot/contract gap — POLISH/FIX |
| `/legal/privacy` | Политика конфиденциальности | RENDERED | Документ snapshot — legal review FIX |
| `/legal/consent` | Согласие на обработку персональных данных | RENDERED | Документ snapshot — legal review FIX |
| `/legal/offer` | Оферта | RENDERED | Документ snapshot — legal review FIX |
| `/legal/cookies` | Политика использования cookie-файлов | RENDERED | Документ snapshot — legal review FIX |
| `/legal/recommendations` | Сведения о рекомендательных технологиях | RENDERED | Документ snapshot — legal review FIX |
| `/forms/auth-login` | Вход или регистрация | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/auth-email` | Вход по электронной почте | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/auth-register` | Регистрация | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/auth-phone` | Вход по телефону | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/auth-otp` | Подтверждение телефона | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/auth-register-phone` | Телефон для регистрации | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/auth-register-otp` | Подтверждение регистрации | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/auth-recovery` | Восстановление пароля | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/profile-name` | Имя | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/profile-surname` | Фамилия | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/profile-city` | Город | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/profile-email` | Изменить электронную почту | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/profile-email-otp` | Подтвердить электронную почту | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/profile-phone` | Изменить телефон | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/profile-phone-otp` | Подтвердить новый телефон | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/profile-passport` | Паспортные данные | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/address-create` | Добавить адрес | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/address-edit` | Изменить адрес | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/address-default` | Сделать адрес основным | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/address-delete` | Удалить адрес | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/organization-add` | Добавить организацию | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/organization-requisites` | Изменить реквизиты | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/organization-bank` | Банковские реквизиты | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/organization-verify` | Подтвердить полномочия | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/organization-edo` | Подключить ЭДО | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/organization-consignee` | Грузополучатель | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/organization-switch` | Выбрать организацию | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/organization-delete` | Удалить организацию | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/account-delete` | Удалить аккаунт | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/sessions-terminate` | Завершить сеанс | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/document-request` | Запросить документ | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/payment-card` | Привязать карту | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/payment-default` | Сделать карту основной | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/payment-remove` | Удалить сохранённую карту | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/checkout` | Оформление заказа | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/order-cancel` | Отменить заказ | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/order-repeat` | Повторить заказ | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/order-pay` | Оплатить заказ | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/callback` | Заказать звонок | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/buy-one-click` | Купить в один клик | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/rent` | Заявка на аренду | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/leasing` | Заявка на лизинг | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/found-cheaper` | Нашли дешевле? | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/tour` | Записаться на экскурсию | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/business-advice` | Консультация для бизнеса | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/supplier` | Стать поставщиком | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/partner` | Стать партнёром | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/advice` | Задать вопрос специалисту | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/review` | Написать отзыв | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/order-review` | Оценить товар из заказа | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/question` | Задать вопрос о товаре | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/review-reply` | Ответить на отзыв | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/question-reply` | Ответить на вопрос | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/review-edit` | Изменить отзыв | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/question-edit` | Изменить вопрос | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/review-delete` | Удалить отзыв | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/question-delete` | Удалить вопрос | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/appeal` | Задать вопрос | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/appeal-order` | Проблема с заказом | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/appeal-rating` | Оценить качество обслуживания | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/return` | Возврат товаров | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/subscription` | Подписка на рассылку | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/product-notify` | Сообщить о поступлении | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/notification-preferences` | Настройки уведомлений | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/quote` | Запросить предложение | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/production-request` | Заказать продукцию собственного производства | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/contact` | Связаться с нами | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/forms/franchise` | Стать партнёром | RENDERED | Form registry; submit отключён — FIX/adapter |
| `/blog/articles-khomutovye-stroitelnye-lesa-promyshlennik-poshagovaya-sborka-vidy-khomutov-i-sovety-po-montazhu` | Популярные статьи | RENDERED | Imported content — KEEP |
| `/blog/articles-setka-zatenyayushchaya-promyshlennik-kak-vybrat-dlya-stroyki-dachi-maskirovki-i-dekora` | Популярные статьи | RENDERED | Imported content — KEEP |
| `/blog/articles-vyshka-tura-ili-stroitelnye-lesa-5-shagov-k-pravilnomu-vyboru-dlya-fasada-i-remonta` | Популярные статьи | RENDERED | Imported content — KEEP |
| `/blog/articles-konus-abramsa-dlya-betona-kak-proverit-kachestvo-i-podvizhnost-betonnoy-smesi-na-stroyploshchadke` | Популярные статьи | RENDERED | Imported content — KEEP |
| `/blog/articles-kak-sobrat-stroitelnye-ramnye-lesa-lrsp-svoimi-rukami-poshagovaya-instruktsiya-dlya-novichkov` | Популярные статьи | RENDERED | Imported content — KEEP |
| `/blog/articles-kak-sobrat-vyshku-turu-svoimi-rukami-poshagovaya-instruktsiya-dlya-nachinayushchikh` | Популярные статьи | RENDERED | Imported content — KEEP |
| `/blog/projects-moscow-city` | Наши проекты | RENDERED | Imported content — KEEP |
| `/blog/projects-krc-oktyabr-astrakhan` | Наши проекты | RENDERED | Imported content — KEEP |
| `/blog/projects-development-plaza-krasnodar` | Наши проекты | RENDERED | Imported content — KEEP |
| `/blog/projects-serdtse-krasnodara` | Наши проекты | RENDERED | Imported content — KEEP |
| `/blog/projects-zhk-obraztsovo-insiti` | Наши проекты | RENDERED | Imported content — KEEP |
| `/blog/projects-zhk-fontany-krasnodar` | Наши проекты | RENDERED | Imported content — KEEP |
| `/blog/projects-zhk-pervoe-mesto` | Наши проекты | RENDERED | Imported content — KEEP |
| `/blog/projects-residential-complex-derbent` | Наши проекты | RENDERED | Imported content — KEEP |
| `/blog/projects-botanika-hills` | Наши проекты | RENDERED | Imported content — KEEP |
| `/blog/projects-nova-vita` | Наши проекты | RENDERED | Imported content — KEEP |
| `/blog/projects-zhk-ritm` | Наши проекты | RENDERED | Imported content — KEEP |
| `/blog/projects-zhk-slavyanka` | Наши проекты | RENDERED | Imported content — KEEP |
| `/blog/projects-zhk-zvezdy` | Наши проекты | RENDERED | Imported content — KEEP |
| `/blog/projects-zhk-tsentralnyy` | Наши проекты | RENDERED | Imported content — KEEP |
| `/blog/video-inforce-7` | Видео | RENDERED | Imported content — KEEP |
| `/blog/video-fubag-6` | Видео | RENDERED | Imported content — KEEP |
| `/blog/video-inforce-5` | Видео | RENDERED | Imported content — KEEP |
| `/blog/video-fubag-4` | Видео | RENDERED | Imported content — KEEP |
| `/blog/video-fubag-3` | Видео | RENDERED | Imported content — KEEP |
| `/blog/video-inforce-2` | Видео | RENDERED | Imported content — KEEP |
| `/blog/video-fubag-1` | Видео | RENDERED | Imported content — KEEP |
| `/blog/video-inforce-0` | Видео | RENDERED | Imported content — KEEP |
| `/blog` | Блог | RENDERED | Imported content — KEEP |
| `/product/prom-2414` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-1042` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-1046` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-908` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-592` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-1774` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-23916` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-2749` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-2743` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-2733` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-2402` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-2335` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-2377` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-2272` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-2388` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-2349` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-2266` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-1649` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-969` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-1343` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-2033` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-2017` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-372` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-2491` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-2200` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-594` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-596` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |
| `/product/prom-597` | Товар | RENDERED | Catalog snapshot — FIX gallery/discount/availability |

## Варианты форм: фактический registry

Полная field parity с PHP/динамическим Bitrix runtime не выводится из одного этого списка. Здесь точный состав клиентского registry; sourceFiles/sourceContext существуют в `siteForms.ts`. Read-only passport — исходный mock/неподтверждённый контракт, не работающая интеграция Госуслуг.

| Форма | Поля / обязательные | Вложения | Dynamic/context |
| --- | --- | --- | --- |
| `/forms/auth-login` — Вход или регистрация | Email или телефон * | — | — |
| `/forms/auth-email` — Вход по электронной почте | Email *, Пароль * | — | — |
| `/forms/auth-register` — Регистрация | Email *, Пароль *, Повторите пароль * | — | — |
| `/forms/auth-phone` — Вход по телефону | Телефон * | — | — |
| `/forms/auth-otp` — Подтверждение телефона | Телефон *, Код подтверждения * | — | phone, verification-challenge |
| `/forms/auth-register-phone` — Телефон для регистрации | Телефон * | — | registration-challenge |
| `/forms/auth-register-otp` — Подтверждение регистрации | Телефон *, Код подтверждения * | — | registration-challenge, phone |
| `/forms/auth-recovery` — Восстановление пароля | Email * | — | — |
| `/forms/profile-name` — Имя | Имя * | — | authenticated-user |
| `/forms/profile-surname` — Фамилия | Фамилия * | — | authenticated-user |
| `/forms/profile-city` — Город | Город * | — | authenticated-user |
| `/forms/profile-email` — Изменить электронную почту | Email * | — | authenticated-user |
| `/forms/profile-email-otp` — Подтвердить электронную почту | Email *, Код подтверждения * | — | authenticated-user, email-verification-challenge |
| `/forms/profile-phone` — Изменить телефон | Телефон * | — | authenticated-user |
| `/forms/profile-phone-otp` — Подтвердить новый телефон | Телефон *, Код подтверждения * | — | authenticated-user, phone-verification-challenge |
| `/forms/profile-passport` — Паспортные данные | Гражданство, Имя, Фамилия, Отчество, Дата рождения, Серия и номер паспорта, Кем выдан, Дата выдачи, Код подразделения, У меня нет отчества, Согласен на сохранение паспортных данных для последующего использования | — | — |
| `/forms/address-create` — Добавить адрес | Город, улица, дом * | — | authenticated-user |
| `/forms/address-edit` — Изменить адрес | Город, улица, дом * | — | authenticated-user, change_address_id |
| `/forms/address-default` — Сделать адрес основным | Нет текстовых полей | — | authenticated-user, address_id |
| `/forms/address-delete` — Удалить адрес | Нет текстовых полей | — | authenticated-user, address_id |
| `/forms/organization-add` — Добавить организацию | ИНН *, КПП, Регион обслуживания *, Наименование организации, Юридический адрес, Фактический адрес, БИК, Расчётный счёт, Наименование банка, Корреспондентский счёт | — | authenticated-user, organization-lookup-result; ждут options: Регион обслуживания |
| `/forms/organization-requisites` — Изменить реквизиты | Официальное письмо об изменении реквизитов *, Карточка компании в текстовом формате *, Скан карточки компании * | Официальное письмо об изменении реквизитов, Карточка компании в текстовом формате, Скан карточки компании | authenticated-user, companyID |
| `/forms/organization-bank` — Банковские реквизиты | БИК, Расчётный счёт, Наименование банка, Корреспондентский счёт | — | authenticated-user, companyID |
| `/forms/organization-verify` — Подтвердить полномочия | ФИО *, Телефон * | — | authenticated-user, companyID |
| `/forms/organization-edo` — Подключить ЭДО | Идентификатор участника ЭДО *, Оператор ЭДО * | — | authenticated-user, companyID; ждут options: Оператор ЭДО |
| `/forms/organization-consignee` — Грузополучатель | КПП, Название филиала, Адрес | — | authenticated-user, companyID |
| `/forms/organization-switch` — Выбрать организацию | Организация * | — | authenticated-user; ждут options: Организация |
| `/forms/organization-delete` — Удалить организацию | Нет текстовых полей | — | authenticated-user, org_id |
| `/forms/account-delete` — Удалить аккаунт | Нет текстовых полей | — | authenticated-user |
| `/forms/sessions-terminate` — Завершить сеанс | Нет текстовых полей | — | authenticated-user, id |
| `/forms/document-request` — Запросить документ | Вид документа, Период с, Период по, Комментарий | — | authenticated-user, organization_id |
| `/forms/payment-card` — Привязать карту | Нет текстовых полей | — | authenticated-user, provider-binding-session |
| `/forms/payment-default` — Сделать карту основной | Нет текстовых полей | — | authenticated-user, card_id |
| `/forms/payment-remove` — Удалить сохранённую карту | Нет текстовых полей | — | authenticated-user, card_id |
| `/forms/checkout` — Оформление заказа | ФИО получателя *, Email *, Телефон *, Организация, ИНН, КПП, Контактное лицо, Способ получения *, Адрес получения, Пункт самовывоза, Дата доставки, Интервал доставки, Способ оплаты *, Промокод | — | basket, region, person-type, organization-if-business, calculated-order-options; ждут options: Способ получения, Пункт самовывоза, Дата доставки, Интервал доставки, Способ оплаты |
| `/forms/order-cancel` — Отменить заказ | Нет текстовых полей | — | authenticated-user, order-id, cancellable-order |
| `/forms/order-repeat` — Повторить заказ | Нет текстовых полей | — | authenticated-user, id |
| `/forms/order-pay` — Оплатить заказ | Нет текстовых полей | — | authenticated-user, order-id, payable-order, provider-payment-session |
| `/forms/callback` — Заказать звонок | Ваше имя *, Ваш телефон * | — | — |
| `/forms/buy-one-click` — Купить в один клик | Ваше имя *, Ваш телефон *, Email, Количество * | — | product-id |
| `/forms/rent` — Заявка на аренду | Ваше имя *, Комментарий, Количество * | — | product-id |
| `/forms/leasing` — Заявка на лизинг | ИНН *, Организация *, Телефон *, Email *, Стоимость предмета лизинга * | — | product-id |
| `/forms/found-cheaper` — Нашли дешевле? | Цена в другом магазине *, Ссылка на товар *, Ваше имя *, Ваш телефон * | — | product-id |
| `/forms/tour` — Записаться на экскурсию | Ваше имя *, Ваш телефон *, Выберите дату * | — | —; ждут options: Выберите дату |
| `/forms/business-advice` — Консультация для бизнеса | Ваше имя *, Ваш телефон *, E-mail *, Название компании *, Комментарий * | — | — |
| `/forms/supplier` — Стать поставщиком | Ваше имя *, Название компании *, Email *, Телефон *, Категория продукции *, Описание продукции *, Комментарий, Прикрепить файл | Прикрепить файл | —; ждут options: Категория продукции |
| `/forms/partner` — Стать партнёром | ИНН компании *, Название компании *, Email *, Телефон *, Ваше имя *, Есть склад, Адрес склада, Телефон склада, График работы склада | — | — |
| `/forms/advice` — Задать вопрос специалисту | Нет текстовых полей | — | —; поля из source DB |
| `/forms/review` — Написать отзыв | Оценка *, Хорошее качество товара, Приятное соотношение цены и качества, Быстрая доставка, Комментарий *, Фотографии | Фотографии | authenticated-user, product-id |
| `/forms/order-review` — Оценить товар из заказа | Оценка *, Хорошее качество товара, Приятное соотношение цены и качества, Быстрая доставка, Комментарий *, Фотографии | Фотографии | authenticated-user, order-id, product-id |
| `/forms/question` — Задать вопрос о товаре | Ваш вопрос * | — | product-id |
| `/forms/review-reply` — Ответить на отзыв | Ваш ответ * | — | authenticated-user, product-id, parent-id |
| `/forms/question-reply` — Ответить на вопрос | Ваш ответ * | — | authenticated-user, product-id, parent-id |
| `/forms/review-edit` — Изменить отзыв | Оценка *, Хорошее качество товара, Приятное соотношение цены и качества, Быстрая доставка, Комментарий *, Фотографии | Фотографии | authenticated-user, product-id, review-id |
| `/forms/question-edit` — Изменить вопрос | Ваш вопрос * | — | authenticated-user, product-id, question-id |
| `/forms/review-delete` — Удалить отзыв | Нет текстовых полей | — | authenticated-user, id, action_name=review |
| `/forms/question-delete` — Удалить вопрос | Нет текстовых полей | — | authenticated-user, id, action_name=question |
| `/forms/appeal` — Задать вопрос | Тема обращения *, Комментарий * | — | authenticated-user; ждут options: Тема обращения |
| `/forms/appeal-order` — Проблема с заказом | Тема обращения *, С чем нужна помощь, Комментарий *, Фотографии | Фотографии | authenticated-user, order-help; ждут options: Тема обращения, С чем нужна помощь |
| `/forms/appeal-rating` — Оценить качество обслуживания | Оценка * | — | authenticated-user, appealID |
| `/forms/return` — Возврат товаров | Товары для возврата * | — | authenticated-user, orderID, completed-order; ждут options: Товары для возврата |
| `/forms/subscription` — Подписка на рассылку | Электронная почта * | — | — |
| `/forms/product-notify` — Сообщить о поступлении | Нет текстовых полей | — | authenticated-user, id |
| `/forms/notification-preferences` — Настройки уведомлений | Email: информация о заказе и товарах, Email: акции, распродажи и специальные предложения, СМС: информация о заказе и товарах, СМС: акции, распродажи и специальные предложения | — | authenticated-user |
| `/forms/quote` — Запросить предложение | Ваше имя *, Ваш телефон *, E-mail *, Название компании *, Комментарий * | — | —; alias business-advice |
| `/forms/production-request` — Заказать продукцию собственного производства | Ваше имя *, Ваш телефон *, E-mail *, Название компании *, Комментарий * | — | —; alias business-advice |
| `/forms/contact` — Связаться с нами | Ваше имя *, Ваш телефон * | — | —; alias callback |
| `/forms/franchise` — Стать партнёром | ИНН компании *, Название компании *, Email *, Телефон *, Ваше имя *, Есть склад, Адрес склада, Телефон склада, График работы склада | — | —; alias partner |

## Отсутствующие самостоятельные сценарии

- File-first ProcurementRequest. Текущий quick-order и supplier upload не заменяют закупку.
- Личный WaitingList, с удалением/синхронизацией существующей модели. `product-notify` form сам по себе не список.
- Structured settlement picker/FIAS, service-region mapping, выбор/наличие по складам и cart revalidation.
- Полноценный источник профиля/заказов/документов/ролей/адресов/уведомлений вместо unavailable adapters. Это задача подключения исходной системы, не создание параллельных сущностей.

Последняя поправка владельца: B2C и B2B равнозначны. Состояние нового гостя personal — не основание убирать видимость бизнес-закупки. Реальная интеграционная приёмка выполняется программистами после подключения; новые аккаунты/доступы этим аудитом не запрашиваются.
