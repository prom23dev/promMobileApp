# Menu parity — recovery

Дата: 2026-09-11T23:44:10.088Z. Это сопоставление source, трёх реальных открытий web-меню и текущего кода навигации. Наличие записи в navigation-menu.ts ещё не означает пройденный UI-тест. Прежняя V9 не считается приёмкой.

## Глобальные разделы

| Группа | Web пункт | Web URL / source | Mobile route | Baseline | Текущий код | Status |
|---|---|---|---|---|---|---|
| Покупателям | Доставка | /delivery/ | /information/delivery | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Покупателям | Оплата | /payment/ | /information/payment | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Покупателям | Оформление заказа | /checkout/ | /pages/checkout | MISSING | RESTORED_IN_CODE | PARTIAL |
| Покупателям | Возврат | /return/ | /pages/returns | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Покупателям | Гарантия | source/service | /pages/warranty | MISSING | RESTORED_IN_CODE | PARTIAL |
| Покупателям | FAQ | UF_FAQ delivery | /pages/faq | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Компания | О компании | /about/ | /pages/about | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Компания | Производство | /vendor/ | /information/production | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Компания | Бренды | /brands/ | /pages/brands | MISSING | RESTORED_IN_CODE | PARTIAL |
| Компания | Награды | /awards/ | /pages/awards | MISSING | RESTORED_IN_CODE | PARTIAL |
| Компания | Проекты | /blog/projects/ | /blog?kind=projects | MISSING | RESTORED_IN_CODE | PARTIAL |
| Компания | Контакты | /contacts/ | /information/contacts | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Бизнес | Для бизнеса | /business/ | /information/business | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Бизнес | Закупка потребности | source procurement | /procurement | MISSING | RESTORED_IN_CODE | PARTIAL |
| Бизнес | Поставщикам | /suppliers/ | /pages/suppliers | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Бизнес | Франшиза | /franchise/ | /pages/franchise | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Материалы | Статьи | /blog/ | /blog | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Материалы | Видео | /blog/video/ | /blog?kind=video | MISSING | RESTORED_IN_CODE | PARTIAL |
| Материалы | Скачать каталог | /upload/uf/c2e/z9a89bazeaxnc6s09bwmuabw6t6p9bdg/katalog.pdf | /pages/documents | MISSING | RESTORED_IN_CODE | PARTIAL |
| Документы | Реквизиты | /details/ | /pages/details | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Документы | Оферта | /oferta/ | /legal/offer | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Документы | Политика конфиденциальности | /privacy-policy/ | /legal/privacy | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Документы | Согласие ПД | /user-agreement/ | /legal/consent | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Документы | Cookies | /cookie-policy/ | /legal/cookies | PARTIAL | RESTORED_IN_CODE | PARTIAL |
| Документы | Рекомендательные технологии | /recom-tech-info/ | /legal/recommendations | PARTIAL | RESTORED_IN_CODE | PARTIAL |

## Личный и корпоративный кабинет

| Контекст | Web пункт | Web URL | Mobile route | Source | Status |
|---|---|---|---|---|---|
| personal | Личные данные | /personal/info/ | /workspace/profile | site-source/personal/.personal.menu.php | PARTIAL |
| personal | Заказы | /personal/orders/active/ | /orders | site-source/personal/.personal.menu.php | PARTIAL |
| personal | Мои организации | /personal/organizations/ | /workspace/organizations | site-source/personal/.personal.menu.php | PARTIAL |
| personal | Избранное | /favorite/ | /favorites | site-source/personal/.personal.menu.php | PARTIAL |
| personal | Лист ожидания | /waiting-list/ | /workspace/waiting-list | site-source/personal/.personal.menu.php | PARTIAL |
| personal | Сравнение | /comparison/ | /compare | site-source/personal/.personal.menu.php | PARTIAL |
| personal | Мои отзывы и вопросы | /personal/questions-and-reviews/ | /workspace/reviews | site-source/personal/.personal.menu.php | PARTIAL |
| personal | Мои обращения | /personal/appeals/ | /service?kind=appeal | site-source/personal/.personal.menu.php | PARTIAL |
| personal | Мои возвраты | /personal/returns/applications/ | /workspace/returns | site-source/personal/.personal.menu.php | PARTIAL |
| personal | Адреса доставки | /personal/address-delivery/ | /workspace/addresses | site-source/personal/.personal.menu.php | PARTIAL |
| personal | Способы оплаты | /personal/payment-methods/ | /workspace/payment-methods | site-source/personal/.personal.menu.php | PARTIAL |
| personal | Настройки уведомлений | /personal/notifications/ | /notifications | site-source/personal/.personal.menu.php | PARTIAL |
| organization | Данные организации | /organization/info/ | /workspace/requisites | site-source/organization/.personal.menu.php | PARTIAL |
| organization | Заказы | /organization/orders/active/ | /orders | site-source/organization/.personal.menu.php | PARTIAL |
| organization | Избранное | /favorite/ | /favorites | site-source/organization/.personal.menu.php | PARTIAL |
| organization | Лист ожидания | /waiting-list/ | /workspace/waiting-list | site-source/organization/.personal.menu.php | PARTIAL |
| organization | Сравнение | /comparison/ | /compare | site-source/organization/.personal.menu.php | PARTIAL |
| organization | Мои отзывы и вопросы | /organization/questions-and-reviews/ | /workspace/reviews | site-source/organization/.personal.menu.php | PARTIAL |
| organization | Мои обращения | /organization/appeals/ | /service?kind=appeal | site-source/organization/.personal.menu.php | PARTIAL |
| organization | Мои возвраты | /organization/returns/applications/ | /workspace/returns | site-source/organization/.personal.menu.php | PARTIAL |
| organization | Адреса доставки | /organization/address-delivery/ | /workspace/addresses | site-source/organization/.personal.menu.php | PARTIAL |
| organization | Способы оплаты | /organization/payment-methods/ | /workspace/payment-methods | site-source/organization/.personal.menu.php | PARTIAL |
| organization | Настройки уведомлений | /organization/notifications/ | /notifications | site-source/organization/.personal.menu.php | PARTIAL |

## Каталог

226 импортированных узлов со всеми source URL и точными mobile routes перечислены в menu.json/catalogItems. Корни: 16, 37, 41, 56, 64, 71, 72, 79, 113, 125, 141, 157, 173, 179, 200, 203, 207, 221, 250, 231. Совпадение taxonomy не означает полноту товаров и динамических фильтров.

## Доказательства и незакрытые пункты

- Публичный mobile burger, mobile search и desktop catalog действительно открывались; скриншоты evidence/menu-*.png. Массив controls в menu-interactions.json содержит DOM страницы после открытия, не только перекрывающую панель.
- Source содержит три социальные ссылки: VK, YouTube и Telegram. MoreScreen восстанавливает все три; browser-проверка внешних переходов фиксируется отдельно, без отправки сообщений.
- /faq/ и /warranty/ не самостоятельные публичные source pages; FAQ расположен в UF_FAQ, гарантия относится к товарным документам.
- Полная функциональность документов организации сохраняется, хотя пункт Documents закомментирован в source organization menu.

## Восстановление навигации в коде

Root добавил MenuButton и source-группы MoreScreen. Контентный resolver сохраняет конкретные статьи, рубрики (`kind=projects|video`), категории, товары и legal routes. Документы содержат исходный PDF-каталог. Тесты нового App Shell/back/cart badge ведёт независимый QA; этот реестр не заменяет их.

## Актуальная проверка переходов — 06d88

Все 41 пункта меню проверены нажатием на 320 и 390 px: 82/82 PASS. На целевом экране сохранены нижняя навигация и корзина; UI Back возвращает в меню. JavaScript page errors: 0. Отдельные документы/формы/содержимое не объявлены COMPLETE по этому тесту. Доказательство: `evidence/recovery-content-06d88/results.json`; полный обзор: [content-recovery-review.md](content-recovery-review.md).


## Решение владельца и актуальная проверка — release 05

Быстрый заказ по артикулам удалён по прямому поручению от 12.09.2026; /quick-order перенаправляет в /procurement. Пункт «Отправить список потребности» переименован в «Отправить заявку на просчет». Текущих пунктов 40, групп пять. Все 80 переходов при 320/390 px прошли с Back и cart badge. Доказательство: evidence/partner05-public/report.json (134/134 полный targeted suite). Предыдущие 41-пунктовые проверки выше являются историей, не текущим составом.
