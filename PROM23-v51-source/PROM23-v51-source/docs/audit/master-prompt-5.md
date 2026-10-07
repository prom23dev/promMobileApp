# MASTER PROMPT №5

# PROM23 / «ПРОМЫШЛЕННИК»

## КАРДИНАЛЬНАЯ ПЕРЕРАБОТКА ТЕКУЩЕГО ПРИЛОЖЕНИЯ

## MOBILE COMMERCE UX + B2C/B2B + APP SHELL + CART + GEO/FIAS + CONTENT REDESIGN + FULL FUNCTIONAL PARITY

Продолжай работу над существующим приложением «Промышленник».

Это НЕ создание нового прототипа.

Это НЕ косметический facelift.

Это НЕ адаптация desktop-сайта под узкий экран.

Текущая версия слишком сырая и требует глубокого системного пересмотра.

Используй одновременно:

1. исходный код действующего сайта, доступный в проекте;
2. действующий временный сайт `prom.myfast.space`;
3. текущую тестовую сборку `159.253.19.172:18087`;
4. предыдущие master prompts;
5. последние предоставленные screenshots и пользовательскую обратную связь.

---

# 0. ГЛАВНЫЙ ДИАГНОЗ ТЕКУЩЕЙ ВЕРСИИ

Текущая версия сейчас воспринимается как:

**responsive website / landing page, помещённый внутрь приложения**

вместо:

**полноценного современного mobile commerce продукта.**

Проблемы системные:

* нет единого App Shell;
* исчезает нижняя навигация;
* пользователь теряется на content/service pages;
* после добавления товара непонятно, как попасть в корзину;
* карточка товара недостаточно похожа на полноценный e-commerce PDP;
* часть функций исходного сайта потеряна;
* content pages превращены в текстовые простыни;
* формы перенесены неполно или без проверки backend;
* визуальная иерархия слабая;
* слишком много одинаковых огромных кнопок;
* слишком много текста;
* мало реальных фото, визуальных доказательств и интерактива;
* B2C и B2B смешаны;
* отдельные партнёрские сервисы визуально затмевают основную ценность магазина;
* выбор города реализован неправильно;
* наличие и доставка недостаточно конкретны;
* navigation patterns различаются между экранами.

Нужно исправлять архитектуру продукта, а не менять несколько цветов.

---

# 1. ПЕРВОЕ ПРАВИЛО — НЕ ПЕРЕПИСЫВАТЬ БЕЗ АУДИТА

Сначала:

AUDIT

↓

MAP

↓

COMPARE

↓

REDESIGN

↓

IMPLEMENT

↓

TEST

↓

VISUAL REVIEW

↓

REGRESSION.

Не начинай сразу менять Home.

---

# 2. ПРОВЕДИ ПОЛНЫЙ АУДИТ ТЕКУЩЕЙ СБОРКИ

Открой:

`159.253.19.172:18087`

Если deployment недоступен:

1. найди текущий frontend приложения;
2. подними локально;
3. зафиксируй проблему deployment;
4. продолжи;
5. затем восстанови test deployment.

Пройди ВСЕ routes.

Не только главную.

---

# 3. СОЗДАЙ ROUTE INVENTORY

Создай/обнови:

`/docs/audit/mobile-screen-inventory.md`

Для каждого route:

| Route | Screen | Entry point | Bottom nav | Back | Data source | State | UX status |
| ----- | ------ | ----------- | ---------- | ---- | ----------- | ----- | --------- |

Статусы:

* KEEP;
* POLISH;
* FIX;
* REDESIGN;
* MISSING;
* BROKEN.

---

# 4. СОЗДАЙ SCREENSHOT BASELINE

Сделай screenshots текущей версии ДО изменений.

Минимум:

* Home;
* Catalog;
* Category;
* Search;
* Product;
* Cart;
* Contacts;
* About;
* FAQ;
* Return;
* Cooperation;
* Business;
* Procurement;
* Profile;
* City picker.

Сохранить как visual baseline.

После редизайна сделать тот же набор.

---

# 5. P0 — ЕДИНЫЙ APP SHELL

Это одна из главных проблем текущей версии.

Сейчас интерфейс ведёт себя как несколько разных приложений:

* где-то desktop-style header;
* где-то app bar со стрелкой;
* где-то hamburger;
* где-то пропадает нижняя навигация;
* где-то sticky purchase bar.

Так быть не должно.

Создать единый:

`AppShell`.

---

# 6. BOTTOM NAVIGATION

Основная нижняя навигация должна оставаться доступной на всех обычных пользовательских экранах.

Предлагаемая структура:

### Главная

### Каталог

### Корзина

### Заказы / Избранное

выбрать после IA-аудита

### Профиль

Количество вкладок:

4–5.

Не больше без веской причины.

---

# 7. КОРЗИНА В BOTTOM NAV

Корзина ОБЯЗАТЕЛЬНО должна быть постоянно доступна.

Иконка:

Корзина.

Badge:

количество товаров.

Например:

`3`.

Это должно обновляться сразу после add-to-cart.

---

# 8. НЕ УБИРАТЬ BOTTOM NAV НА CONTENT PAGES

Текущий критический баг:

на:

* О компании;
* Контакты;
* FAQ;
* Возврат;
* Сотрудничество;
* других служебных/content pages

нижнее меню исчезает.

Исправить.

Bottom navigation не должна исчезать произвольно.

---

# 9. ДОПУСТИМЫЕ ИСКЛЮЧЕНИЯ

Bottom navigation можно скрыть только в обоснованных immersive flows:

* checkout;
* payment;
* authentication;
* camera/scanner;
* fullscreen gallery;
* некоторые modal workflows.

Это должно быть явно определено в navigation architecture.

---

# 10. ROUTE TEST ДЛЯ APP SHELL

Написать automated navigation test.

Пройти каждый route.

Проверить:

`expectBottomNav(route)`.

Не допускать regressions.

---

# 11. HEADER НУЖНО ПЕРЕСТРОИТЬ

Текущий Home header перегружен.

Сейчас одновременно видны:

* логотип;
* куда доставить;
* позвонить;
* покупателям;
* контакты;
* hamburger;
* большой поиск.

Это desktop-navigation thinking.

---

# 12. MOBILE HEADER

Сделать compact application header.

Возможная структура:

верхняя строка:

`Промышленник`

*

location

*

notifications/profile при необходимости.

Следующая:

Search.

Не дублировать bottom navigation ссылками из desktop header.

---

# 13. КНОПКА «ПОЗВОНИТЬ»

Телефон важен.

Но он не должен занимать постоянное центральное место на каждом commerce screen.

Сделать доступным:

* Contacts;
* Help;
* Product support;
* Procurement;
* Business;
* floating/context action там, где оправдано.

---

# 14. HOME — УБРАТЬ ОЩУЩЕНИЕ ЛЕНДИНГА

Первый экран сейчас занимает огромный рекламный hero:

«Оборудование для дела. От выбора до поставки.»

*

огромная фотография.

В результате пользователь слишком долго добирается до магазина.

Это нужно изменить.

---

# 15. HOME — COMMERCE FIRST

На первом viewport пользователь должен максимально быстро увидеть:

* location;
* search;
* категории;
* promo/выгоду;
* товары либо shortcut к каталогу;
* состояние корзины.

Brand story — ниже.

---

# 16. HERO СДЕЛАТЬ КОМПАКТНЕЕ

Hero не должен занимать практически весь первый экран.

Использовать:

* меньшую высоту;
* сильную композицию;
* понятный CTA;
* минимум текста;
* адаптивность.

---

# 17. HOME HERO COPY

Не использовать слишком общий корпоративный текст как главное содержание.

Главная должна отвечать:

**что я могу купить прямо сейчас?**

а уже потом:

**кто компания?**

---

# 18. ПРОИЗВОДСТВО В HERO / HOME

Предыдущая правка остаётся.

Текущее фото обычного производственного помещения недостаточно выразительное.

Нужен более сильный technology-oriented visual.

---

# 19. INDUSTRIAL VISUAL

Концепция:

современное производство металлоконструкций.

Ключевой объект:

роботизированный / автоматизированный станок обработки или резки круглой стальной трубы Ø42 мм.

Стиль:

* realistic;
* industrial photography;
* современный цех;
* металл;
* автоматизация;
* технологичность;
* без sci-fi;
* без сторонних логотипов.

---

# 20. ДОСТОВЕРНОСТЬ ПРОИЗВОДСТВА

Не выдавать AI/generated image за реальную фотографию оборудования предприятия, если это невозможно подтвердить.

Если visual концептуальный:

обозначить как технологический визуал.

Для документальных блоков использовать реальные фотографии компании.

---

# 21. «ПРОИЗВОДСТВО / НА ОБЪЕКТАХ»

Сейчас переключатель визуально существует, но его purpose слабый.

Определи конкретную функцию.

Вариант:

### Производство

показывает:

* цех;
* оборудование;
* процесс.

### На объектах

показывает:

* реальные проекты;
* применение оборудования;
* case studies.

Переключение должно менять понятный content layer.

---

# 22. HOME PRODUCT SECTIONS

Разделить товарные потоки.

Не одна витрина.

Пример:

### Для вас

### Сейчас со скидкой

### Популярное

### Новинки

### Возможно, понадобится

### Товары недели

### Недавно смотрели

### Повторить покупку

### Собственное производство

Отображать только те секции, где есть реальные данные.

---

# 23. SERVER DRIVEN HOME

Home blocks желательно управлять сервером/CMS.

Backend response:

* type;
* title;
* subtitle;
* products;
* categories;
* media;
* deeplink;
* position;
* visibility;
* audience.

---

# 24. «ВЫ УЖЕ ВЫБРАЛИ»

Если этот блок показывает корзину:

сделать его полезным.

Показывать:

* X товаров;
* сумма;
* miniature;
* CTA:

`Открыть корзину`.

Не ограничиваться строкой с маленькой стрелкой.

---

# 25. КАТАЛОГ

Предыдущее требование остаётся обязательным:

НЕ показывать подкатегории одной строкой текста.

---

# 26. CATEGORY GRID

Подкатегории:

плиткой.

На телефоне:

обычно 2 колонки.

Карточка:

* изображение;
* название;
* количество товаров при наличии;
* tap state.

---

# 27. КАТЕГОРИИ ДОЛЖНЫ ИМЕТЬ ВИЗУАЛ

Для основных категорий использовать:

* реальные product images;
* custom category images;
* качественные изображения.

Не превращать весь каталог в сотни одинаковых generic icons.

---

# 28. TASK BASED NAVIGATION

Блок:

«Что планируете делать?»

имеет потенциал.

Но должен реально помогать подобрать категории.

Например:

Работа на высоте

→ леса / вышки / лестницы / подъёмники / страховочное оборудование.

Бетонные работы

→ бетоносмесители / вибраторы / бадьи и т. д.

Это должно быть data-driven.

---

# 29. PRODUCT CARDS — ПЕРЕРАБОТАТЬ

Сейчас карточки слишком высокие и перегружены второстепенными сообщениями.

Основная задача карточки:

за 1–2 секунды позволить понять:

* что;
* сколько;
* выгодно ли;
* есть ли;
* когда можно получить.

---

# 30. PRODUCT CARD PRIORITY

Порядок:

Image.

Badges.

Name.

Rating.

Price.

Old price / discount.

Availability.

Delivery short info.

Add to cart.

---

# 31. НЕ ПЕРЕГРУЖАТЬ PRODUCT CARD PARTNER SERVICES

Сейчас:

* Сплит;
* Баллы Плюса;
* доставка

занимают слишком много пространства.

Яндекс Pay/Split действительно присутствует в исходном проекте, но его UI должен быть вторичным относительно:

* товара;
* цены;
* наличия;
* покупки.

---

# 32. YANDEX PAY / SPLIT

Проверь реальную интеграцию в исходном коде и backend.

Не выводить:

«пример»

как будто это гарантированное условие оплаты.

Если доступность зависит от пользователя / сессии Яндекса:

текст должен быть корректным.

---

# 33. «БАЛЛЫ ПЛЮСА»

Отдельно доказать интеграцию.

Не отображать произвольные бонусы или обещание начисления только потому, что доступен Yandex Pay SDK.

Проверить реальные условия.

---

# 34. PRODUCT DETAIL PAGE — ПОЛНЫЙ REDESIGN

Текущая PDP является одним из главных слабых мест.

Она должна стать одним из лучших экранов приложения.

---

# 35. PDP — ФОТОГАЛЕРЕЯ ОБЯЗАТЕЛЬНА

На текущих screenshots фактически отсутствует нормальный визуальный hero товара.

В исходном сайте товар имеет фотогалерею.

Перенести.

Вверху PDP:

* основное изображение;
* swipe;
* pagination;
* tap → fullscreen;
* pinch zoom;
* video/360 при наличии.

Нельзя открывать карточку товара и сначала видеть только текст.

---

# 36. PDP — ВЕРХНИЙ БЛОК

После gallery:

Код товара.

Название.

Бренд / собственное производство.

Rating.

Reviews.

Questions.

Favorite.

Compare.

---

# 37. PDP PRICE BLOCK

Затем:

Текущая цена.

Цена за единицу.

Old price.

Discount.

Экономия ₽.

При наличии:

B2B / volume information.

---

# 38. PDP AVAILABILITY

Текущий текст:

«Наличие уточняйте при заказе»

недостаточен.

Использовать максимально точные данные backend.

---

# 39. AVAILABILITY SERVICE

Исследовать:

* `StoreProductTable`;
* региональные склады;
* `Regions`;
* basket price logic;
* реальные stock records.

Создать нормальный API DTO.

Например:

```text
status
totalQuantity
nearestWarehouse
warehouses[]
pickupAvailable
estimatedRestock
```

---

# 40. ПРИМЕР ПРАВИЛЬНОГО НАЛИЧИЯ

Если данные позволяют:

### В наличии

Краснодар — 12 шт.

Ростов-на-Дону — 4 шт.

Самовывоз из Краснодара сегодня после подтверждения.

Другие склады →

---

# 41. ЕСЛИ ТОЧНОГО ОСТАТКА НЕТ

Не выдумывать.

Допустимо:

* В наличии;
* Мало;
* Под заказ;
* Нет в наличии;

только если backend официально предоставляет такую семантику.

---

# 42. НАЛИЧИЕ И LOCATION

Availability должно рассчитываться с учётом текущего Settlement / ServiceRegion.

Не generic.

---

# 43. DELIVERY BLOCK PDP

Сейчас delivery section слишком похож на информационную статью.

После выбора location пользователь должен увидеть реальные варианты.

Например:

### Получение в Самаре

#### Самовывоз

нет собственного склада / ближайший доступный...

#### ПВЗ

CDEK — от X ₽, срок Y

если реально рассчитано.

#### До двери

от X ₽, срок Y

если реально рассчитано.

---

# 44. НЕ ПОКАЗЫВАТЬ НЕПОДТВЕРЖДЁННЫЕ ОБЕЩАНИЯ

Фразы вроде:

«до терминала бесплатно»

использовать только если backend/business rules подтверждают это для конкретного сценария.

---

# 45. «ПРОВЕРИТЬ СРОК И СТОИМОСТЬ»

Если расчёт можно сделать автоматически:

после выбора location делать его автоматически.

Не заставлять нажимать лишнюю кнопку.

---

# 46. PDP PURCHASE ACTION

Sticky bottom bar.

Если товар НЕ в корзине:

Price

*

`В корзину`.

---

# 47. ПОСЛЕ ADD TO CART

Не просто заменить кнопку на:

`− 1 +`.

Нужно дать feedback:

✓ Добавлено в корзину

[Открыть корзину]

и обновить badge bottom navigation.

---

# 48. ПОСЛЕ ADD TO CART — UX

Допустимый вариант:

sticky bar:

Price

`− 1 +`

и secondary icon/action:

Корзина →.

Но постоянный bottom nav всё равно остаётся.

---

# 49. НЕЛЬЗЯ СОЗДАВАТЬ CART DEAD END

Acceptance criterion:

после добавления товара пользователь может открыть корзину максимум за **1 tap**.

---

# 50. PDP SECONDARY ACTIONS

Текущий блок:

* Купить в один клик;
* Нашли дешевле?;
* Уточнить аренду;
* Заявка на лизинг;

не должен выглядеть как четыре одинаковые огромные кнопки.

---

# 51. ACTION HIERARCHY

Primary:

В корзину.

Secondary:

Купить в 1 клик.

Context actions:

* Нашли дешевле?
* Аренда;
* Лизинг;
* Нужна партия?
* Вопрос менеджеру.

Представить как:

icon rows / cards / contextual list.

---

# 52. НЕ ВСЕ ТОВАРЫ ИМЕЮТ АРЕНДУ / ЛИЗИНГ

Не показывать действия, если они не применимы к конкретному товару.

Backend-driven capabilities:

```text
canBuyOneClick
canLease
canRent
canRequestBetterPrice
canRequestQuote
```

---

# 53. PDP CONTENT

Исходная web-карточка содержит богатый контент.

Сохранить:

* характеристики;
* описание;
* преимущества;
* вопросы;
* отзывы;
* документы;
* related products.

---

# 54. SEO TEXT ≠ MOBILE DESCRIPTION

В исходном товаре встречаются длинные SEO-тексты.

Не копировать их в приложение в виде стены текста.

Создать:

### О товаре

короткое summary.

### Применение

### Характеристики

### Рекомендации

### Полное описание

accordion.

Не терять исходную информацию.

---

# 55. PRODUCT DOCUMENTS

Если документация действительно становится доступна после покупки:

объяснить это.

Если часть сертификатов публичная:

показывать сразу.

Не писать generic.

---

# 56. REVIEWS / QUESTIONS

Существующий backend уже имеет:

Reviews.

Questions.

Приложение должно уметь:

* смотреть;
* фильтровать;
* писать;
* редактировать свои при существующей логике;
* attachments, если поддерживаются.

---

# 57. RELATED PRODUCTS

Сделать визуальные товарные карусели:

* Похожие;
* С этим покупают;
* Аналоги;
* Комплектующие.

---

# 58. APP CART

Корзина — отдельный основной section приложения.

Не modal-afterthought.

---

# 59. CART SCREEN

Для каждой позиции:

Image.

Name.

Availability.

Current price.

Discount.

Quantity.

Delete.

Favorite.

Delivery impact.

---

# 60. CART SUMMARY

Sticky / clear:

Товары.

Скидка.

Delivery при известности.

Итого.

CTA:

`Перейти к оформлению`.

---

# 61. LOCATION PROBLEM — ОБЯЗАТЕЛЬНО ИСПРАВИТЬ СИСТЕМНО

Из исходного кода видно, что текущая web-архитектура смешивает:

* населённый пункт;
* внутренний регион;
* домен;
* цену;
* склад.

Кроме того, редактирование города в профиле сейчас допускает обычный text input.

Нельзя переносить эту архитектуру в mobile.

---

# 62. СОЗДАТЬ LOCATION DOMAIN

Отдельные сущности:

### Settlement

реальный населённый пункт клиента.

### ServiceRegion

коммерческий регион компании.

### Warehouse / Store

склад / магазин.

### DeliveryAddress

полный адрес.

---

# 63. SETTLEMENT

Для РФ authoritative identity:

ГАР / ФИАС.

Хранить:

* FIAS/GAR ID;
* official name;
* type;
* region;
* district;
* display string.

---

# 64. CITY PICKER

Название UI лучше:

### Куда доставить?

Внутри:

`Город или населённый пункт`.

Не использовать концепцию только «город».

---

# 65. ПОДДЕРЖИВАТЬ

* города;
* станицы;
* сёла;
* посёлки;
* деревни;
* хутора;
* ПГТ;
* другие официальные settlement types.

---

# 66. FREE TEXT ЗАПРЕЩЁН

Если пользователь вводит:

`самарааааа`

это search query.

Это НЕ location.

Пока suggestion не выбран:

location не изменяется.

---

# 67. DADATA

В исходном проекте уже используется DaData.

Можно использовать как provider.

Но domain должен хранить FIAS/GAR identity.

Private token только backend.

---

# 68. SERVICE REGION RESOLVER

После выбора settlement:

Settlement

→ ServiceRegion

→ available warehouses

→ prices

→ delivery.

Нельзя приравнивать выбранный населённый пункт к филиалу компании.

---

# 69. CURRENT CODE GEO ISSUE

Исследуй и исправь архитектуру вокруг:

* `Regions.php`;
* `cityList.php`;
* `setCity.php`;
* profile city edit;
* order location resolver;
* order region change.

Не патчить только frontend.

---

# 70. PROFILE CITY

Полностью удалить возможность сохранить arbitrary text как location.

---

# 71. BITRIX LOCATION RESOLUTION

Существующий checkout resolver ищет Bitrix entity типа `CITY`.

Это потенциально ломает:

* станицы;
* сёла;
* посёлки.

Исправить mapping.

FIAS/GAR entity

→ Bitrix delivery location.

---

# 72. LOCATION CHANGE

После смены settlement refresh:

* prices;
* availability;
* pickup;
* delivery;
* promotions;
* cart.

---

# 73. CART LOCATION REVALIDATION

Если корзина не пустая:

не менять условия молча.

Показать:

### Условия заказа обновились

Товар X:
доставка изменилась.

Товар Y:
другой склад.

и т. д.

---

# 74. CONTACTS — LOCATION И ФИЛИАЛ НЕ ОДНО И ТО ЖЕ

Текущая страница сообщает:

«Населённый пункт получения ещё не выбран»

и предлагает:

«Выбрать филиал».

UX нужно изменить.

---

# 75. CONTACTS FLOW

Current settlement:

`станица Динская`.

После этого:

### Ближайшие филиалы и склады

1. Краснодар ...
2. ...

Показывать:

* адрес;
* тип точки;
* режим;
* телефон;
* маршрут;
* самовывоз.

---

# 76. CONTACTS PAGE REDESIGN

Сейчас страница состоит в основном из больших текстовых карточек и CTA.

Переделать.

Вверху quick actions:

### Позвонить

### Написать

### Найти филиал

### Заказать звонок

---

# 77. CONTACT LIST

Сделать визуальные store cards.

Не общий текст.

---

# 78. MAP + LIST

Если map provider доступен:

переключатель:

Список | Карта.

Но основной функционал должен работать и без карты.

---

# 79. «ИНФОРМАЦИЯ ДЛЯ ПОКУПАТЕЛЕЙ»

Текущее отображение обычным vertical list НЕ ПРИНИМАЕТСЯ.

Предыдущее требование не выполнено.

---

# 80. BUYER INFO GRID

Использовать tiles с иконками:

Доставка

Оплата

Возврат

Гарантия

Личный кабинет

Документы

FAQ

Контакты.

Каждая tile:

icon

title

one-line explanation.

---

# 81. CONTENT PAGES — ПОЛНЫЙ ПЕРЕСМОТР

Текущие screenshots подтверждают:

* About;
* Return;
* FAQ;
* Cooperation

всё ещё очень сухие.

Это нужно переделать кардинально.

---

# 82. CONTENT PAGE RULE

Запрещён шаблон:

```text
Заголовок

Карточка с 5 абзацами

Карточка с 10 bullet points

Большая кнопка

Большая кнопка
```

как основной дизайн.

---

# 83. КАЖДУЮ CONTENT PAGE ПЕРЕВЕСТИ В EDITORIAL UX

Использовать:

* фотографии;
* иллюстрации;
* icon blocks;
* statistics;
* timeline;
* step flow;
* diagrams;
* accordions;
* galleries;
* projects;
* product recommendations;
* interactive cards;
* sticky TOC при необходимости.

---

# 84. ABOUT PAGE — ТЕКУЩАЯ MOBILE ВЕРСИЯ ПОТЕРЯЛА КОНТЕНТ

По исходному коду web About содержит намного больше компонентов:

* banner;
* achievements;
* history;
* banner block;
* categories;
* advantages;
* certificates/cases;
* team;
* reviews.

Текущая mobile версия показывает лишь небольшую часть.

Восстановить CONTENT PARITY.

---

# 85. ABOUT PAGE НОВАЯ СТРУКТУРА

Hero.

↓

Компания в цифрах.

↓

История — interactive timeline.

↓

Собственное производство.

↓

География / экспорт.

↓

Продукция.

↓

Проекты.

↓

Награды и сертификаты.

↓

Команда / экспертиза при наличии реальных материалов.

↓

Отзывы.

↓

CTA.

---

# 86. HISTORY

Не список:

• 2008
• 2012
• 2015
• 2020...

Сделать timeline.

Годы — визуальные milestones.

---

# 87. AWARDS

Не прятать всё за кнопкой:

«Награды и сертификаты».

Показывать preview:

* сертификаты;
* дипломы;
* награды.

Swipe gallery.

---

# 88. RETURN PAGE — КРИТИЧЕСКИЙ REDESIGN

Текущая версия — юридическая простыня.

Это плохой UX.

---

# 89. RETURN START

Пользователь сначала должен увидеть:

### Хотите оформить возврат?

[Начать возврат]

---

# 90. RETURN FLOW

Сценарий:

Для себя / Для организации.

↓

Выберите заказ.

↓

Выберите товар.

↓

Причина.

↓

Описание.

↓

Фото/video.

↓

Способ передачи.

↓

Отправить.

↓

Статус обращения.

---

# 91. RETURN INFORMATION

До формы показать кратко:

### Что можно вернуть

### Что подготовить

### Что делать при браке

### Как передать товар

### Срок рассмотрения

только подтверждённые данные.

---

# 92. ПОЛНЫЕ ЮРИДИЧЕСКИЕ ПРАВИЛА

Сохранить.

Но поместить:

`Полные правила возврата`

→ expandable/full document.

Не заставлять пользователя начинать с 20 юридических абзацев.

---

# 93. FAQ

Текущий FAQ:

один открытый огромный ответ + несколько вопросов.

Переделать.

---

# 94. FAQ STRUCTURE

Search.

Category chips:

* Заказ;
* Оплата;
* Доставка;
* Возврат;
* Производство;
* B2B.

Accordion.

---

# 95. FAQ ANSWERS

В closed state:

question.

Open:

короткий answer.

Если ответ длинный:

`Подробнее`.

Context CTA.

---

# 96. QUESTION FORM

Текущий экран «Задать вопрос» необходимо проверить по исходному backend.

Не угадывать поля.

---

# 97. FORM AUDIT ДЛЯ «ЗАДАТЬ ВОПРОС»

Определи:

* требуется ли auth;
* тема;
* текст;
* name;
* phone;
* email;
* product context;
* order context;
* files;
* consent.

Использовать реальные handlers.

---

# 98. CONSENTS

Текущие отдельные строки:

«Политика конфиденциальности»

«Обработка персональных данных»

не заменяют корректное действие согласия.

Сделать legal UX правильно.

---

# 99. COOPERATION PAGE — ПЕРЕДЕЛАТЬ

Сейчас:

Поставщикам

Франшиза

Юридическим лицам

и несколько больших кнопок.

Это не полноценная страница.

---

# 100. COOPERATION HUB

Hero:

### Сотрудничество с «Промышленником»

Visual cards:

### Поставщикам

Краткое УТП.

CTA.

### Франшиза

Краткое УТП.

CTA.

### Корпоративным клиентам

Краткое УТП.

CTA.

---

# 101. SUPPLIERS

Исходный код имеет отдельный богатый suppliers page.

Проверить:

* banner;
* achievements;
* FAQ;
* forms.

Перенести функционально.

---

# 102. FRANCHISE

Исходный код содержит:

* banner;
* advantages;
* slider;
* achievements;
* projects;
* reviews;
* FAQ.

Не заменять одной кнопкой.

---

# 103. BUSINESS PAGE — ПОЛНАЯ PARITY

Исходная web страница уже содержит богатую структуру.

Не терять её.

---

# 104. BUSINESS PAGE MOBILE

Hero.

↓

USP cards.

↓

Upload specification.

↓

Категории.

↓

Key facts.

↓

Supply workflow.

↓

Projects.

↓

Reviews.

↓

FAQ.

↓

CTA.

---

# 105. BUSINESS USP

В исходном контенте есть реальные преимущества:

* КП под задачу;
* комплектация у одного поставщика;
* подтверждённое наличие;
* резерв;
* заказные/производственные позиции;
* доставка;
* документы/ЭДО.

Сделать их визуальными карточками.

---

# 106. НЕ ТЕКСТОВАЯ СТЕНА

Каждая USP:

icon

title

2 строки

details.

---

# 107. PROCUREMENT

Текущее направление:

«Артикулы знать необязательно»

правильное.

Довести функционально.

---

# 108. PROCUREMENT PRIMARY FLOW

### Есть список потребности?

Прикрепите:

* смету;
* спецификацию;
* Excel;
* PDF;
* чертёж;
* фото.

---

# 109. PROCUREMENT FORM

Поля:

Name.

Phone.

Email.

Company.

INN optional.

Settlement.

Comment.

Files.

Consent.

---

# 110. PROCUREMENT FILE UI

Drag/drop web.

File picker native.

Показывать:

* file name;
* size;
* upload progress;
* error;
* retry;
* remove.

---

# 111. PROCUREMENT TWO MODES

Tabs:

### Есть список

и

### Нужен подбор

---

# 112. «НУЖЕН ПОДБОР»

Форма:

Что нужно сделать?

Категория при возможности.

Описание задачи.

Контакты.

Attachments.

---

# 113. QUICK ORDER

Отдельная secondary capability:

`Знаете артикулы?`

Quick Order.

Не основной сценарий.

---

# 114. SUPPLY WORKFLOW

Сейчас «Как проходит поставка» выглядит почти как ссылка.

Сделать visual timeline.

1. Получаем потребность.

2. Проверяем позиции.

3. Подбираем аналоги.

4. Проверяем наличие.

5. Формируем предложение.

6. Резервируем.

7. Оплата.

8. Доставка.

9. Документы.

---

# 115. BUSINESS PRODUCTS

Страница B2B должна оставаться commerce.

Добавить реальные category/product sections.

---

# 116. PROJECTS

«Оборудование в деле» развить в case studies.

Card:

Photo.

Project.

City.

Task.

Solution.

Product groups.

---

# 117. CONTACT PAGE И CONTENT PAGES — ФОТО

Добавлять фото там, где они являются доказательством:

* склад;
* филиал;
* производство;
* объект;
* команда;
* оборудование.

Не generic stock photos.

---

# 118. DESIGN SYSTEM — ПРОБЛЕМА ОГРОМНЫХ КНОПОК

На screenshots чрезмерно много одинаковых rectangular actions.

Это визуально убивает hierarchy.

---

# 119. СОЗДАЙ ACTION HIERARCHY

### Primary Button

одно главное действие.

### Secondary Button

второе действие.

### Tertiary Action

текст + icon.

### Navigation Row

list row + chevron.

### Action Card

сложное действие.

### Chip

filter/context.

Не делать всё `full-width 72px button`.

---

# 120. ОДИН PRIMARY CTA НА VIEWPORT

В большинстве сценариев должен быть один очевидный primary action.

---

# 121. TYPOGRAPHY

Сейчас некоторые экраны содержат слишком много крупных жирных заголовков.

Настроить hierarchy:

Display.

H1.

H2.

H3.

Body.

Secondary.

Caption.

Price.

---

# 122. VISUAL DENSITY

E-commerce должен быть достаточно плотным.

Не создавать огромные вертикальные пустоты между простыми элементами.

---

# 123. WHITESPACE

При этом не уплотнять до desktop table.

Баланс.

---

# 124. COLOR

Сохранить фирменные:

* тёмно-синий;
* красно-оранжевый.

Но красный/оранжевый использовать осмысленно:

primary actions;

discount;

brand accent.

Не делать половину экрана яркими CTA.

---

# 125. ICON SYSTEM

Использовать один icon set.

Не emoji.

Не смесь разных толщин.

Custom industrial icons — в том же стиле.

---

# 126. MOTION

Текущему приложению нужна жизнь.

Но motion добавлять системно.

---

# 127. MICROINTERACTIONS

Добавить:

* add to cart;
* favorite;
* compare;
* waitlist;
* city select;
* accordion;
* upload;
* filters;
* quantity;
* successful submission;
* navigation transitions.

---

# 128. CART ANIMATION

После добавления:

product thumbnail может subtle animate toward cart icon.

Либо:

cart badge bump animation.

Не мешать пользователю.

---

# 129. REDUCE MOTION

Поддержать системную настройку.

---

# 130. LOADING

Использовать skeletons вместо бесконечного spinner там, где возможно.

---

# 131. EMPTY STATES

Обязательно:

* Cart;
* Favorites;
* Comparison;
* Waiting List;
* Orders;
* Search;
* Reviews;
* Questions.

---

# 132. B2C — НЕ ДЕЛАТЬ ВТОРИЧНЫМ

По умолчанию приложение должно быть понятным физическому покупателю.

B2C пользователь имеет реальные функции backend:

* orders;
* favorites;
* comparison;
* waiting list;
* reviews;
* questions;
* appeals;
* returns;
* delivery addresses;
* payment methods;
* notification settings.

Вывести их качественно.

---

# 133. B2C PROFILE

Profile header.

Orders.

Saved.

Waiting list.

Addresses.

Payment methods.

Returns.

Support.

Notifications.

Recently viewed.

---

# 134. НЕ НАЧИНАТЬ PROFILE С ЮРЛИЦА

Organization:

secondary section.

### Покупаете для компании?

Добавить организацию.

---

# 135. B2C VALUE PROPOSITION

Текущий блок «Для ваших покупок» слишком сильно построен вокруг:

* Split;
* Plus points.

Не использовать партнёрские механики как главное УТП «Промышленника».

---

# 136. НАСТОЯЩИЕ B2C ПРЕИМУЩЕСТВА

Сначала показать реальные:

* понятная доставка;
* наличие;
* собственное производство;
* гарантия;
* поддержка;
* возврат;
* избранное;
* лист ожидания;
* история покупок;
* акции.

Партнёрские оплаты — дополнительный плюс.

---

# 137. WAITING LIST

Backend уже есть.

Для товара без наличия:

### Сообщить о поступлении.

---

# 138. NO STOCK

Не тупик.

Показывать:

* другие склады;
* аналоги;
* под заказ;
* waitlist;
* менеджера.

---

# 139. FAVORITES

Если товар добавлен:

instant feedback.

Badge/section state.

---

# 140. SEARCH

Строка поиска — один из главных элементов.

Не просто форма.

---

# 141. SEARCH FOCUS STATE

При focus:

* history;
* popular;
* recent categories.

---

# 142. SEARCH RESULTS

Подсказки:

Product image.

Name.

Price.

Availability.

Category.

---

# 143. SEARCH ZERO STATE

Предложить:

* corrected query;
* categories;
* similar terms;
* manager help.

---

# 144. CHECKOUT

Проверить существующий Bitrix order flow полностью.

Не создавать упрощённый fake checkout.

---

# 145. B2C CHECKOUT

Contact.

Settlement.

Address.

Delivery.

Payment.

Order confirmation.

---

# 146. B2B CHECKOUT

Organization.

Consignee при необходимости.

Settlement.

Warehouse/delivery.

Payment/invoice.

Documents.

---

# 147. FORMS — ПОЛНЫЙ АУДИТ

Это P0/P1.

Не ограничиваться screenshots.

Пройти source code.

---

# 148. В ИСХОДНИКАХ УЖЕ ОБНАРУЖЕНЫ МНОГОЧИСЛЕННЫЕ FLOW

В том числе:

* one click;
* found cheaper;
* rent;
* leasing;
* callback;
* review;
* questions;
* tour;
* partners;
* suppliers;
* documents;
* addresses;
* organization;
* EDO;
* appeals;
* returns;
* cards;
* subscriptions.

Найди все.

---

# 149. FORMS INVENTORY

Создай:

`/docs/audit/forms-parity.md`

Для КАЖДОЙ формы:

| Web route | Source handler | Fields | Required | Validation | Files | Consent | Mobile | Backend | Status |
| --------- | -------------- | ------ | -------- | ---------- | ----- | ------- | ------ | ------- | ------ |

---

# 150. НЕ ПРОПУСКАТЬ MODAL FORMS

Проверить формы, которые появляются только после:

* click;
* modal;
* product action;
* checkout event.

---

# 151. НЕ СЧИТАТЬ КНОПКУ ФОРМОЙ

Если в mobile есть:

«Связаться с менеджером»

но она ничего не отправляет в реальный handler:

parity отсутствует.

---

# 152. SUCCESS STATES

Для каждой формы:

Loading.

Validation.

Server error.

Success.

Next step.

---

# 153. PRIVACY

Не делать две текстовые ссылки вместо понятного consent UX.

Использовать актуальные legal requirements.

---

# 154. FULL FUNCTION INVENTORY

Создай:

`/docs/audit/function-parity.md`

---

# 155. FUNCTION MATRIX

Например:

| Function | Website | Backend | Current app | Final app | Status |
| -------- | ------- | ------- | ----------- | --------- | ------ |

Включить:

* cart;
* favorite;
* comparison;
* waiting list;
* buy one click;
* cheaper price;
* rent;
* leasing;
* question;
* review;
* order;
* repeat order;
* returns;
* appeal;
* organization;
* EDO;
* documents;
* addresses;
* cards;
* notifications;
* supplier;
* franchise;
* procurement.

---

# 156. FULL PAGE PARITY

Создай/обнови:

`/docs/audit/web-mobile-parity.md`

Исходный сайт является content/function reference.

Не UI reference.

---

# 157. ABOUT PARITY

Проверять не:

«Экран О компании существует».

А:

* history есть?
* achievements?
* certificates?
* categories?
* production?
* team?
* reviews?

---

# 158. BUSINESS PARITY

Проверять:

* advantages;
* categories;
* stats;
* projects;
* reviews;
* FAQ;
* forms.

---

# 159. PRODUCT PARITY

Проверять:

* gallery;
* description;
* characteristics;
* stock;
* reviews;
* questions;
* similar products;
* favorite;
* compare;
* buy actions.

---

# 160. CONTACT PARITY

Проверять:

* branches;
* phones;
* email;
* addresses;
* working time;
* maps;
* pickup.

---

# 161. CONTENT PARITY НЕ ОЗНАЧАЕТ ТЕКСТ 1:1

Mobile copy можно сокращать.

Но смысл нельзя терять.

---

# 162. LEGAL PAGE PARITY

Политики можно показывать в document reader.

Не нужно дизайнерски превращать юридические документы в маркетинговый лендинг.

Но navigation должна оставаться понятной.

---

# 163. CONTENT VS LEGAL

Разделить:

CONTENT PAGE

и

LEGAL DOCUMENT.

Return rules — hybrid:

user-friendly flow

*

full legal info.

Privacy policy — document.

---

# 164. GLOBAL BACK BEHAVIOR

Стрелка Back должна возвращать пользователя в логически предыдущий screen.

Не всегда в Home.

---

# 165. DEEP LINK

Если PDP открыт из push/deep link:

Back behaviour не должен ломаться.

---

# 166. NAVIGATION HISTORY

Bottom tab navigation должна иметь отдельные stacks.

Например:

Catalog

→ Category

→ Product.

Перешли Home.

Вернулись Catalog.

Оказались в предыдущем состоянии.

---

# 167. SCROLL STATE

Сохранять scroll position каталога после просмотра товара.

---

# 168. FILTER STATE

Сохранять filter/sort после возврата с PDP.

---

# 169. PRODUCT ADDED STATE

Возвращаясь в каталог:

показывать quantity stepper либо basket state.

---

# 170. DESIGN REVIEW ДЛЯ КАЖДОГО ЭКРАНА

После реализации:

screenshot.

Не просто DOM inspection.

---

# 171. SCREEN DESIGN CHECKLIST

Проверить:

* hierarchy;
* density;
* typography;
* button overload;
* contrast;
* line length;
* spacing;
* media;
* CTA;
* bottom navigation;
* clipping;
* safe areas.

---

# 172. DEVICE MATRIX

Проверить:

Small iPhone.

Regular iPhone.

Pro Max.

Small Android.

Regular Android.

Large Android.

---

# 173. ТЕКУЩАЯ TEST ВЕРСИЯ ПОХОЖА НА TABLET/DESKTOP LAYOUT НА НЕКОТОРЫХ ЭКРАНАХ

Обязательно проверить реальные CSS breakpoints и viewport.

Не считать responsive layout автоматически хорошим mobile UX.

---

# 174. TABLET

Если поддерживается:

не растягивать phone UI на всю ширину.

Использовать адаптивный layout.

---

# 175. PERFORMANCE

Карточки и фотографии не должны замедлить приложение.

Использовать:

* responsive images;
* lazy load;
* prefetch;
* cache;
* pagination.

---

# 176. IMAGE QUALITY

Не использовать низкокачественные stretched images.

---

# 177. APP PERFORMANCE TARGET

При normal network:

Search perceived response — максимально близко к instant.

Scrolling — 60fps.

No jank.

---

# 178. AUTOMATED TEST INFRASTRUCTURE

В существующем frontend package тесты фактически не настроены.

Это необходимо исправить.

---

# 179. TESTS — NAVIGATION

Особенно:

bottom nav presence.

cart access.

back.

deep link.

---

# 180. TEST — ADD TO CART

Product.

↓

Add.

↓

Badge = 1.

↓

Cart доступна за 1 tap.

↓

Cart содержит товар.

---

# 181. TEST — CONTENT PAGE NAV

Home

→ About.

EXPECTED:

bottom nav remains available.

---

# 182. TEST — RETURN

Profile

→ Order

→ Return

→ Upload

→ Submit.

---

# 183. TEST — LOCATION

Query:

Динская.

Select:

станица Динская.

FIAS ID preserved.

Availability refreshed.

---

# 184. TEST — FAKE LOCATION

Input:

`абракадабра 777`.

Cannot save.

---

# 185. TEST — CART + LOCATION

Cart contains product.

Change settlement.

Cart revalidated.

User informed.

---

# 186. TEST — B2C

Fresh install.

No organization.

Can purchase.

---

# 187. TEST — B2B

User with organization.

Switch context.

Correct basket.

Correct prices.

Correct documents.

---

# 188. FORM TESTING

Каждая real form:

submit positive.

required validation.

bad server response.

duplicate tap.

network timeout.

---

# 189. SECURITY

Сохраняются P0-требования предыдущего аудита.

Проверить source tree на secrets.

Не публиковать secret values.

---

# 190. NO MOCK

Запрещено production-facing:

* fake stock;
* fake bonuses;
* fake discounts;
* fake delivery;
* fake project facts;
* fake review stats.

---

# 191. BUSINESS COPY

Не писать обещания, которых нет в backend/business process.

---

# 192. SOURCE OF TRUTH

Порядок:

1. реальная backend/domain logic;
2. runtime data;
3. текущий сайт;
4. approved requirements;
5. design solution.

Не наоборот.

---

# 193. CONTENT CMS

Не хардкодить content pages в приложение, если они могут управляться CMS/API.

---

# 194. MOBILE BFF

При необходимости создать clean API layer.

Mobile не должен парсить HTML Битрикс.

---

# 195. NORMAL DTO

Не отдавать всю структуру Bitrix properties.

---

# 196. APP SHELL COMPONENTS

Создать/нормализовать:

AppShell.

AppHeader.

BottomNavigation.

CartBadge.

LocationChip.

GlobalSearchTrigger.

PageHeader.

StickyPurchaseBar.

---

# 197. E-COMMERCE UI KIT

Обновить:

ProductCard.

ProductCarousel.

PriceBlock.

DiscountBadge.

AvailabilityBlock.

WarehouseRow.

DeliveryOption.

CartRow.

QuantityStepper.

CategoryTile.

ReviewCard.

QuestionCard.

---

# 198. CONTENT UI KIT

Создать:

HeroMedia.

StatCard.

Timeline.

IconFeature.

ProcessStep.

ProjectCard.

CertificateCard.

BranchCard.

FAQAccordion.

InfoTile.

CTASection.

Gallery.

---

# 199. FORM UI KIT

TextInput.

PhoneInput.

EmailInput.

LocationPicker.

FileUploader.

ConsentControl.

Select.

TextArea.

ErrorMessage.

SuccessState.

---

# 200. ИНТЕРАКТИВ ДОЛЖЕН БЫТЬ ФУНКЦИОНАЛЬНЫМ

Не создавать декоративную карусель, которая не помогает пользователю.

---

# 201. УДАЛИТЬ БЕССМЫСЛЕННЫЕ UI

Если текущий компонент красивый, но:

* не ведёт никуда;
* не меняет содержание;
* дублирует другое действие;

удалить/объединить.

---

# 202. ГЛАВНОЕ МЕНЮ

Hamburger может остаться для secondary pages.

Но не использовать его как замену основной app navigation.

---

# 203. MENU GROUPS

Например:

### Покупателям

Delivery.

Payment.

Returns.

Warranty.

FAQ.

### Компания

About.

Production.

Projects.

Awards.

Contacts.

### Сотрудничество

Business.

Suppliers.

Franchise.

---

# 204. SEARCH НЕ ДУБЛИРОВАТЬ НА КАЖДОМ CONTENT SCREEN

Global search доступен из app shell.

Но не занимать 100px высоты на каждой content page без необходимости.

---

# 205. PHONE ICON

На content app bar может быть support action.

Но единообразно.

Не в одном месте phone, в другом nothing, в третьем hamburger.

---

# 206. VISUAL CONSISTENCY

Одинаковые:

* app bars;
* back buttons;
* safe area;
* body padding;
* cards;
* radii;
* typography.

---

# 207. HOME «ДЛЯ СЕБЯ И ДЛЯ БИЗНЕСА»

Можно сохранить messaging.

Но не заставлять пользователя заранее выбирать роль.

---

# 208. CROSS-SELL B2B

На PDP:

`Нужна партия? Получить предложение`.

Это правильнее, чем делать весь продукт B2B.

---

# 209. CROSS-SELL B2C

На B2B page:

`Нужен один товар? Перейти в каталог`.

---

# 210. FULL CLICK-THROUGH AUDIT

После разработки пройти вручную весь сайт `prom.myfast.space`.

Каждый:

link;

button;

modal;

form;

tab;

accordion;

product action.

---

# 211. ПОСЛЕ WEB CLICK-THROUGH

Найти mobile equivalent.

Если отсутствует:

добавить в parity table.

---

# 212. НИ ОДНОГО НЕОБЪЯСНЁННОГО MISSING

В финальной таблице:

`MISSING`

должно быть 0.

Либо каждый web-only item должен иметь письменное обоснование.

---

# 213. НЕ ПЕРЕНОСИТЬ МУСОР

При аудите может быть найден устаревший web functionality.

Не переносить автоматически.

Маркировать:

`LEGACY — product decision required`.

---

# 214. CURRENT WEBSITE BUGS

Не воспроизводить существующие web bugs только ради parity.

Functional intent важнее бага.

---

# 215. MOBILE SHOULD BE BETTER THAN WEB

Цель:

не уменьшенный сайт.

Мобильное приложение должно быть быстрее и удобнее.

---

# 216. VISUAL TARGET

Характер:

modern industrial commerce.

Ощущение:

профессионально;

технологично;

надёжно;

не перегружено;

дорого по качеству;

понятно обычному человеку.

---

# 217. BENCHMARK

По commerce ergonomics ориентироваться на лучшие паттерны:

* Яндекс Маркет;
* Ozon;
* ВсеИнструменты;
* Лемана ПРО;
* Петрович.

Не копировать фирменный UI.

---

# 218. DESIGN SKILLS

Использовать имеющиеся Codex skills по:

* product design;
* e-commerce;
* mobile UX;
* navigation;
* motion;
* conversion;
* typography;
* information architecture;
* accessibility.

Предыдущий результат показывает, что поверхностного применения design skills недостаточно.

---

# 219. DESIGN REVIEW ДОЛЖЕН БЫТЬ ОТДЕЛЬНОЙ ФАЗОЙ

Developer finished ≠ screen finished.

После coding:

Product designer review.

---

# 220. НОВЫЙ DEFINITION OF DONE — SCREEN

Экран готов, только если:

[ ] находится в правильном App Shell;

[ ] navigation работает;

[ ] bottom nav присутствует там, где должна;

[ ] cart доступна;

[ ] реальные данные;

[ ] functional parity;

[ ] content parity;

[ ] формы проверены;

[ ] loading;

[ ] empty;

[ ] error;

[ ] offline;

[ ] accessibility;

[ ] animation where useful;

[ ] screenshot review;

[ ] small phone;

[ ] large phone;

[ ] tests.

---

# 221. DEFINITION OF DONE — PRODUCT PAGE

[ ] Есть gallery.

[ ] Favorite.

[ ] Compare.

[ ] Цена.

[ ] Discount.

[ ] Availability.

[ ] Location.

[ ] Delivery.

[ ] Add to cart.

[ ] Cart access 1 tap.

[ ] Characteristics.

[ ] Description.

[ ] Documents.

[ ] Reviews.

[ ] Questions.

[ ] Related products.

[ ] Relevant secondary actions.

---

# 222. DEFINITION OF DONE — CONTENT PAGE

[ ] Не является text wall.

[ ] Сохранён meaningful content.

[ ] Есть visual hierarchy.

[ ] Media where useful.

[ ] CTA logical.

[ ] Bottom navigation работает.

[ ] Back navigation работает.

---

# 223. DEFINITION OF DONE — FORM

[ ] Backend handler identified.

[ ] Fields verified.

[ ] Required verified.

[ ] Validation verified.

[ ] Consent verified.

[ ] Upload verified.

[ ] Success verified.

[ ] CRM/backend result verified.

---

# 224. DEFINITION OF DONE — LOCATION

[ ] Real settlement selected.

[ ] FIAS/GAR ID.

[ ] No arbitrary text.

[ ] Non-city settlements supported.

[ ] Region disambiguation.

[ ] Service region mapped separately.

[ ] Warehouse separate.

[ ] Delivery separate.

[ ] Cart revalidation.

---

# 225. ПОРЯДОК РАБОТЫ

## PHASE 0 — AUDIT

Current build.

Source.

Web.

Forms.

Routes.

Functions.

Screenshots.

---

## PHASE 1 — FOUNDATION

App Shell.

Navigation.

Bottom nav.

Cart accessibility.

Location domain.

Design system fixes.

---

## PHASE 2 — CORE COMMERCE

Home.

Catalog.

Search.

Product Card.

PDP.

Cart.

Checkout.

---

## PHASE 3 — B2C

Profile.

Orders.

Favorites.

Comparison.

Waiting list.

Reviews.

Questions.

Returns.

Appeals.

---

## PHASE 4 — B2B

Organizations.

Procurement.

Business.

Documents.

EDO.

---

## PHASE 5 — CONTENT

About.

Production.

Contacts.

Delivery.

Return info.

FAQ.

Cooperation.

Suppliers.

Franchise.

Awards.

---

## PHASE 6 — POLISH

Motion.

Accessibility.

Performance.

Responsive.

Visual review.

---

## PHASE 7 — REGRESSION

Full click-through.

E2E.

Parity.

Deployment.

---

# 226. КРИТИЧЕСКИЙ QUALITY GATE

НЕ переходить к content polish, пока:

* корзина непонятна;
* nav ломается;
* location неправильный;
* product flow не завершён.

---

# 227. FINAL E2E — B2C

Launch.

↓

Select settlement.

↓

Home.

↓

Search.

↓

PDP.

↓

Gallery.

↓

Availability.

↓

Add to cart.

↓

Cart 1 tap.

↓

Checkout.

↓

Order.

---

# 228. FINAL E2E — CONTENT

Home.

↓

About.

↓

Production.

↓

Back.

↓

Contacts.

↓

Bottom navigation всё время работает.

---

# 229. FINAL E2E — PROCUREMENT

Business / Procurement.

↓

Upload requirement.

↓

Contacts.

↓

Submit.

↓

Real backend request.

↓

Success.

---

# 230. FINAL E2E — RETURN

Order.

↓

Return.

↓

Reason.

↓

Attachments.

↓

Submit.

↓

Status.

---

# 231. FINAL VISUAL COMPARISON

Для каждого key screen сохранить:

BEFORE screenshot.

AFTER screenshot.

---

# 232. В ФИНАЛЕ ПРЕДОСТАВИТЬ DESIGN CHANGE TABLE

| Screen | Main problem before | Solution | Functional parity | UX status |
| ------ | ------------------- | -------- | ----------------- | --------- |

---

# 233. ОТДЕЛЬНО ОТЧЁТ ПО НАВИГАЦИИ

Routes checked.

Routes with bottom navigation.

Routes with intentional fullscreen mode.

Broken routes:

0.

---

# 234. ОТДЕЛЬНО ОТЧЁТ ПО КОРЗИНЕ

Add-to-cart tested.

Badge tested.

PDP → Cart taps:

1.

Catalog → Cart taps:

1.

Persistence.

Login merge.

---

# 235. ОТДЕЛЬНО ОТЧЁТ ПО GEO

Data source.

FIAS implementation.

Settlement types.

Service region mapping.

Warehouse mapping.

Delivery mapping.

Tests.

---

# 236. ОТДЕЛЬНО ОТЧЁТ ПО ФОРМАМ

Всего обнаружено web/backend forms:

X.

Реализовано mobile:

X.

Missing:

0 либо explicit justification.

---

# 237. ОТДЕЛЬНО ОТЧЁТ ПО PARITY

Web pages:

X.

Mobile equivalents:

X.

Partial:

X.

Missing:

0.

Legacy intentionally omitted:

X with explanation.

---

# 238. ОТДЕЛЬНО DESIGN REPORT

Home.

Catalog.

PDP.

Cart.

B2C.

B2B.

Contacts.

Content.

---

# 239. FINAL DEPLOYMENT

Обновить test environment.

Проверить опубликованную версию, не только localhost.

---

# 240. НЕ ПИШИ «ГОТОВО», ПОКА НЕ ПРОШЁЛ РЕАЛЬНЫЙ UI

После deployment:

открыть.

кликнуть.

оформить сценарии.

проверить network.

проверить console.

---

# 241. ГЛАВНЫЙ ПРИНЦИП

Сейчас продукт слишком часто говорит пользователю:

**«прочитайте информацию»**

вместо:

**«выполните действие».**

Новая версия должна быть action-oriented.

---

# 242. ГЛАВНЫЙ ПРИНЦИП E-COMMERCE

На любом commerce screen пользователь должен понимать:

**что купить → сколько стоит → есть ли → как получить → как купить.**

---

# 243. ГЛАВНЫЙ ПРИНЦИП CONTENT

На content screen пользователь должен понимать:

**зачем мне эта информация → почему ей верить → что делать дальше.**

---

# 244. ГЛАВНЫЙ ПРИНЦИП НАВИГАЦИИ

Пользователь никогда не должен думать:

**«Как теперь вернуться в магазин?»**

---

# 245. ГЛАВНЫЙ ПРИНЦИП КОРЗИНЫ

Пользователь никогда не должен думать:

**«Я добавил товар. Где теперь корзина?»**

---

# 246. ГЛАВНЫЙ ПРИНЦИП LOCATION

Пользователь не создаёт «город» строкой.

Он выбирает реальный населённый пункт.

---

# 247. ГЛАВНЫЙ ПРИНЦИП ДИЗАЙНА

Не каждое действие — большая кнопка.

Не каждый текст — белая карточка.

Не каждая страница — набор прямоугольников.

---

# 248. ГЛАВНЫЙ ПРИНЦИП ЭТОЙ ИТЕРАЦИИ

Нужна не ещё одна косметическая версия.

Нужна:

**целостная архитектура мобильного продукта.**

App shell.

Navigation.

Commerce.

B2C.

B2B.

Location.

Content.

Forms.

Backend.

Visual system.

Motion.

Testing.

Все части должны работать как один продукт.

---

# 249. НАЧНИ СЕЙЧАС

Выполняй без остановки после аудита:

1. Current build audit.
2. Source/web parity audit.
3. Route/navigation audit.
4. App Shell redesign.
5. Cart accessibility fix.
6. Location/FIAS fix.
7. PDP redesign.
8. Core commerce redesign.
9. B2C.
10. B2B.
11. Content pages.
12. Forms/functions parity.
13. Visual review.
14. Regression.
15. Deploy.
16. Final evidence report.

Не ограничивайся рекомендациями.

Вноси изменения в код.
