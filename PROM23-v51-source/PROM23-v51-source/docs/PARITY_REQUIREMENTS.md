# PARITY_REQUIREMENTS.md

# PROM23 — требования функционального и контентного соответствия

Последнее обновление:  
2026-09-12T02:00:07+03:00

---

# 1. ГЛАВНОЕ ПРАВИЛО

Мобильное приложение должно воспроизводить весь значимый пользовательский контент и функциональность:

https://prom.myfast.space/

и предоставленного исходного кода сайта.

Текущий mobile frontend НЕ является source of truth.

---

# 2. PARITY =

## CONTENT PARITY

Смысловой контент страниц сохранён.

## FUNCTIONAL PARITY

Пользовательские действия сохранены.

## FORM PARITY

Формы и их бизнес-смысл сохранены.

## BUSINESS LOGIC PARITY

Цена, корзина, checkout, организация, доставка, оплата и другие правила соответствуют source code.

---

# 3. PAGE INVENTORY

Реестр содержит 75 source route families. Это не число товаров или статей. Отдельные URL, HTTP-результат, source-файлы и найденные потери: [pages.md](parity/pages.md), [pages.json](parity/pages.json). Полный public crawl4434/4434 завершён:3484 HTTP200,950 HTTP404,0 network errors. Наличие маршрута не закрывает контент.

| Web URL | Название | Тип | Mobile route | Content | Function | Status |
|---|---|---|---|---|---|---|
| / | «Промышленник» - производство и продажа строительного оборудования | source-page | / | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /about/ | О компании | source-page | /pages/about | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /awards/ | Награды и сертификаты | source-page | /pages/awards | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /basket/ | В корзине пока пусто | source-page | /cart | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /blog/ | Статьи | source-page | /blog | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /blog/projects/ | Проекты | dynamic/public | /blog?kind=projects | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /blog/projects/{code}/ | /blog/projects/{code}/ | dynamic/public | /blog/[id] | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /blog/video/ | Видео | dynamic/public | /blog?kind=video | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /blog/{code}/ | /blog/{code}/ | dynamic/public | /blog/[id] | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /brands/ | Бренды | source-page | /pages/brands | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /business/ | Поставка строительного оборудования для юридических лиц и ИП | source-page | /information/business | Owner revised content B2B35: parity/BUSINESS_35.md | 431 local + 431 public; integration skipped by owner | UI COMPLETE / connected runtime NOT_RUN |
| /cart/ | В корзине пока пусто | alias | /cart | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /catalog-vyshki/ | Каталог | source-page | /catalog?section=vyshki-tury | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /catalog/ | Каталог | source-page | /catalog | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /catalog/{section}/{product}/ | /catalog/{section}/{product}/ | dynamic/public | /product/[id] | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /checkout/ | Оформление заказа | alias | /pages/checkout | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /chek/ | Личный кабинет | technical | — | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | LEGACY_REVIEW |
| /comparison/ | Сравнивать пока нечего | source-page | /compare | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /contacts/ | Контакты в г. Краснодар | source-page | /information/contacts | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /cookie-policy/ | Политика использования cookie-файлов | source-page | /legal/cookies | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /delivery/ | Доставка | source-page | /information/delivery | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /details/ | Реквизиты | alias | /pages/details | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /favorite/ | Избранных товаров нет | source-page | /favorites | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /franchise/ | Франшиза для малого бизнеса от компании «Промышленник» | source-page | /pages/franchise | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /oferta/ | Оферта | alias | /legal/offer | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /order/ | Личный кабинет | source-page | /checkout-preview | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /order/good/ | «Промышленник» - производство и продажа строительного оборудования | source-page | — | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | LEGACY_REVIEW |
| /organization/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /account | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/address-delivery/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/addresses | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/appeals/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/appeals | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/appeals/list/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/appeals | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/appeals/list/{id}/ | /organization/appeals/list/{id}/ | dynamic-detail | /workspace/appeals | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/dashboard/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /account | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/documents/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/documents | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/info/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/organizations | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/notifications/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /notifications | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/orders/active/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /orders | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/orders/completed/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /orders | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/orders/goods/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /orders | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/orders/{id}/ | /organization/orders/{id}/ | dynamic-detail | /order/[id] | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/payment-methods/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/payments | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/questions-and-reviews/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/reviews | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/returns/applications/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/returns | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/returns/applications/{id}/ | /organization/returns/applications/{id}/ | dynamic-detail | /workspace/returns | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /organization/returns/orders/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/returns | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /payment/ | Оплата | alias | /information/payment | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/ | Личный кабинет | source-page | /account | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/address-delivery/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/addresses | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/appeals/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/appeals | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/appeals/list/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/appeals | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/appeals/list/{id}/ | /personal/appeals/list/{id}/ | dynamic-detail | /workspace/appeals | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/dashboard/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /account | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/info/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /account | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/info/edit/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /account | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/notifications/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /notifications | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/order/payment/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /account | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/orders/active/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /orders | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/orders/completed/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /orders | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/orders/goods/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /orders | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/orders/{id}/ | /personal/orders/{id}/ | dynamic-detail | /order/[id] | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/organizations/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/organizations | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/payment-methods/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/payments | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/questions-and-reviews/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/reviews | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/returns/applications/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/returns | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/returns/applications/{id}/ | /personal/returns/applications/{id}/ | dynamic-detail | /workspace/returns | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /personal/returns/orders/ | «Промышленник» - производство и продажа строительного оборудования | source-page | /workspace/returns | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /privacy-policy/ | ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ | source-page | /legal/privacy | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /recom-tech-info/ | Согласие на обработку персональных данных | source-page | /legal/recommendations | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /return/ | Правила возврата | alias | /pages/returns | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /search/ | Найдите нужные вам товары | source-page | /catalog?q=… | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /search/map/ | Карта сайта | technical | — | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | LEGACY_REVIEW |
| /suppliers/ | Поставщикам | source-page | /pages/suppliers | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /user-agreement/ | Согласие на обработку персональных данных | source-page | /legal/consent | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /vendor/ | Производство | dynamic/public | /information/production | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |
| /waiting-list/ | Лист ожидания | source-page | /workspace/waitlist | Проверка смысловых блоков: parity/content-blocks.md | Проверка действий: parity/functions.md | PARTIAL |

Статусы:

- COMPLETE
- PARTIAL
- MISSING
- LEGACY_REVIEW
- BLOCKED_EXTERNAL

Цель:

`MISSING = 0`.

---

# 4. ОБЯЗАТЕЛЬНЫЕ ТИПЫ СТРАНИЦ

Инвентаризация должна включать минимум:

## Commerce

- Главная;
- Каталог;
- Категория;
- Поиск;
- Товар;
- Корзина;
- Checkout;
- Заказ;
- Избранное;
- Сравнение;
- Лист ожидания.

## B2C Account

- Личные данные;
- Заказы;
- Возвраты;
- Обращения;
- Отзывы;
- Вопросы;
- Адреса;
- Оплата;
- Уведомления.

## B2B

- Для бизнеса;
- Закупка;
- Организации;
- B2B заказы;
- Документы;
- ЭДО;
- корпоративные формы.

## Company

- О компании;
- Производство;
- Проекты;
- Награды;
- Бренды;
- Контакты.

## Cooperation

- Поставщикам;
- Франшиза;
- другие реальные разделы.

## Buyers

- Доставка;
- Оплата;
- Оформление заказа;
- Возврат;
- Гарантия;
- FAQ.

## Legal

- Оферта;
- Политика конфиденциальности;
- Обработка ПД;
- cookies;
- рекомендательные технологии;
- другие документы.

Этот список не считать исчерпывающим.

Source/web crawl имеет приоритет.

---

# 5. FORM INVENTORY

68 definitions =64 базовые формы+4 alias. До recovery и сейчас:65 PARTIAL/3 LEGACY_REVIEW; connected runtime accepted0. Drivers реализованы, это не полная field/live приёмка. Source controls сохранены в [forms.json](parity/forms.json), текущая delta и baseline: [forms.md](parity/forms.md). Отдельно derived procurement и quick-order, без увеличения source count.

| Web / source | Форма | Handler | Поля | Required | Files | Consent | Integration | Mobile | Status |
|---|---|---|---|---|---|---|---|---|---|
| site-source/local/templates/.default/components/bitrix/system.auth.form/.default/template.php | auth-login | /local/include/forms/auth-reg/action-auth.php | login | login | — | — | AuthDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/auth-login | PARTIAL (до: PARTIAL) |
| site-source/local/include/forms/auth-reg/form-auth-by-email.php | auth-email | /local/include/forms/auth-reg/action-auth-by-email.php | email, password | email, password | — | — | AuthDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/auth-email | PARTIAL (до: PARTIAL) |
| site-source/local/include/forms/auth-reg/form-reg.php | auth-register | /local/include/forms/auth-reg/action-reg.php | email, password, password_repeat | email, password, password_repeat | — | agree_policy_reg, agree_consent_reg | AuthDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/auth-register | PARTIAL (до: PARTIAL) |
| site-source/local/include/forms/auth-reg/form-auth-by-phone.php | auth-phone | /local/include/forms/auth-reg/action-get-code-for-phone.php | phone | phone | — | — | AuthDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/auth-phone | PARTIAL (до: PARTIAL) |
| site-source/local/include/forms/auth-reg/form-auth-by-phone.php | auth-otp | /local/include/forms/auth-reg/action-auth-by-phone.php | phone, code | phone, code | — | — | AuthDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/auth-otp | PARTIAL (до: PARTIAL) |
| site-source/local/include/forms/auth-reg/form-reg-step-phone.php | auth-register-phone | /local/include/forms/auth-reg/action-reg-step-phone.php | phone | phone | — | — | AuthDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/auth-register-phone | PARTIAL (до: PARTIAL) |
| site-source/local/include/forms/auth-reg/form-reg-step-phone-code.php | auth-register-otp | /local/include/forms/auth-reg/action-reg-step-phone-code.php | phone, code | phone, code | — | — | AuthDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/auth-register-otp | PARTIAL (до: PARTIAL) |
| site-source/local/include/forms/auth-reg/password-recovery.php | auth-recovery | /local/include/forms/auth-reg/action-password-recovery.php | email | email | — | — | AuthDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/auth-recovery | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/info/edit/forms/change-name.php | profile-name | /local/ajax/lk/info/edit/change-user-data.php | name | name | — | — | ProfileDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/profile-name | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/info/edit/forms/change-family.php | profile-surname | /local/ajax/lk/info/edit/change-user-data.php | last_name | last_name | — | — | ProfileDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/profile-surname | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/info/edit/forms/change-city.php | profile-city | /local/ajax/lk/info/edit/change-user-data.php | city | city | — | — | ProfileDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/profile-city | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/info/edit/forms/change-email.php | profile-email | /local/ajax/lk/info/edit/forms/change-email-get-code-action.php | email | email | — | — | ProfileDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/profile-email | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/info/edit/forms/code-verification-by-email.php | profile-email-otp | /local/ajax/lk/info/edit/forms/change-email-check-code-action.php | email, code | email, code | — | — | ProfileDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/profile-email-otp | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/info/edit/forms/change-phone.php | profile-phone | /local/ajax/lk/info/edit/forms/change-phone-get-code-action.php | phone | phone | — | — | ProfileDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/profile-phone | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/info/edit/forms/code-verification-by-phone.php | profile-phone-otp | /local/ajax/lk/info/edit/forms/change-phone-check-code-action.php | phone, code | phone, code | — | — | ProfileDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/profile-phone-otp | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/info/edit/forms/gosuslugi.php | profile-passport | — | country, unmapped-0, unmapped-1, unmapped-2, unmapped-3, unmapped-4, unmapped-5, unmapped-6, unmapped-7, unmapped-no-patronymic, unmapped-passport-storage | — | — | — | ProfileDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/profile-passport | LEGACY_REVIEW (до: LEGACY_REVIEW) |
| site-source/local/ajax/lk/order-placing/popup-courier.php | address-create | /local/ajax/lk/address-delivery/add-address-action.php | full_address | full_address | — | — | ProfileDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/address-create | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/order-placing/popup-courier.php | address-edit | /local/ajax/lk/address-delivery/add-address-action.php | full_address | full_address | — | — | ProfileDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/address-edit | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/address-delivery/change-main-address.php | address-default | /local/ajax/lk/address-delivery/change-main-address.php | — | — | — | — | ProfileDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/address-default | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/address-delivery/remove-address-action.php | address-delete | /local/ajax/lk/address-delivery/remove-address-action.php | — | — | — | — | ProfileDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/address-delete | PARTIAL (до: PARTIAL) |
| site-source/local/components/prom.personal/personal_my_organizations_add/templates/.default/template.php | organization-add | /local/ajax/lk/organization/organizations-add.php | inn, kpp, store_region_id, name, legal-addresss, fact-address, bik, payment-bill, bank-name, correspondent-bill | inn, store_region_id | — | — | OrganizationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/organization-add | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/organization/organizations-details.php | organization-requisites | /local/ajax/lk/organization/action-organizations-details.php | company_letter, card_company, scan_card | company_letter, card_company, scan_card | company_letter, card_company, scan_card | — | OrganizationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/organization-requisites | PARTIAL (до: PARTIAL) |
| site-source/local/components/prom.personal/personal_my_organizations_add/templates/.default/template.php | organization-bank | — | bik, payment-bill, bank-name, correspondent-bill | — | — | — | OrganizationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/organization-bank | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/organization/organization-verify.php | organization-verify | /local/ajax/lk/organization/action-organization-verify.php | fio, phone | fio, phone | — | — | OrganizationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/organization-verify | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/organization/organization-edo.php | organization-edo | /local/ajax/lk/organization/action-organization-edo.php | edo_id, edo_operator | edo_id, edo_operator | — | — | OrganizationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/organization-edo | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/organization/organizations-consignee.php | organization-consignee | — | unmapped-0, unmapped-1, unmapped-2 | — | — | — | OrganizationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/organization-consignee | LEGACY_REVIEW (до: LEGACY_REVIEW) |
| site-source/local/ajax/lk/organization/organizations-switcher.php | organization-switch | /local/ajax/lk/organization/action-organizations-switcher.php | organization | organization | — | — | OrganizationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/organization-switch | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/organization/form-delete-organization.php | organization-delete | — | — | — | — | — | OrganizationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/organization-delete | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/info/edit/delete-account.php | account-delete | — | — | — | — | — | AccountActionDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/account-delete | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/info/edit/terminate-session.php | sessions-terminate | /local/ajax/lk/info/edit/terminate-session.php | — | — | — | — | AccountActionDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/sessions-terminate | PARTIAL (до: PARTIAL) |
| site-source/local/templates/main/components/bitrix/form.result.new/request-document/template.php | document-request | /local/ajax/form/request-document-action.php | DOC_TYPE, PERIOD_FROM, PERIOD_TO, COMMENT | — | — | — | DocumentRequestDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/document-request | PARTIAL (до: PARTIAL) |
| site-source/local/components/prom.personal/personal_payment_methods/templates/.default/template.php | payment-card | — | — | — | — | — | AccountActionDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/payment-card | LEGACY_REVIEW (до: LEGACY_REVIEW) |
| site-source/local/ajax/lk/payment-methods/change-main-card-action.php | payment-default | /local/ajax/lk/payment-methods/change-main-card-action.php | — | — | — | — | AccountActionDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/payment-default | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/payment-methods/remove-card-action.php | payment-remove | /local/ajax/lk/payment-methods/remove-card-action.php | — | — | — | — | AccountActionDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/payment-remove | PARTIAL (до: PARTIAL) |
| site-source/local/templates/main/components/bitrix/sale.order.ajax/main/template.php | checkout | /order/ | ORDER_FIO, ORDER_EMAIL, ORDER_PHONE, ORDER_COMPANY, ORDER_INN, ORDER_KPP, ORDER_CONTACT_PERSON, DELIVERY_ID, ORDER_ADDRESS, pod, etag, office, comment, DELIVERY_PICKUP_ID, delivery-date, time, PAY_SYSTEM_ID, promo_code | ORDER_FIO, ORDER_EMAIL, ORDER_PHONE, DELIVERY_ID, PAY_SYSTEM_ID | — | agree_policy_order, agree_consent_order | CommerceDriver/dedicated BFF wired; live NOT_RUN; см. forms.json currentRecovery | /forms/checkout | PARTIAL (до: PARTIAL) |
| site-source/local/components/prom.personal/personal_order_detail/templates/.default/template.php | order-cancel | — | — | — | — | — | OrderActionDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/order-cancel | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/orders/order-repeat.php | order-repeat | /local/ajax/lk/orders/order-repeat.php | — | — | — | — | OrderActionDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/order-repeat | PARTIAL (до: PARTIAL) |
| site-source/local/components/prom.personal/personal_order_detail/templates/.default/template.php | order-pay | — | — | — | — | — | OrderActionDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/order-pay | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/catalog/request-a-call.php | callback | /local/ajax/catalog/action-request-a-call.php | form_text_24, form_text_25 | form_text_24, form_text_25 | — | agree_policy_call, agree_consent_call | FormsDriver/SourceHttp wired; live NOT_RUN; см. forms.json currentRecovery | /forms/callback | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/catalog/buy-one-click.php | buy-one-click | /local/ajax/catalog/action-buy-one-click.php | form_text_12, form_text_13, form_text_14, form_text_16 | form_text_12, form_text_13, form_text_16 | — | agree_policy_one_click, agree_consent_one_click | FormsDriver/SourceHttp wired; live NOT_RUN; см. forms.json currentRecovery | /forms/buy-one-click | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/catalog/request-a-rent.php | rent | /local/ajax/catalog/action-request-a-rent.php | form_text_20, form_text_21, form_text_23 | form_text_20, form_text_23 | — | agree_policy_rent, agree_consent_rent | FormsDriver/SourceHttp wired; live NOT_RUN; см. forms.json currentRecovery | /forms/rent | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/catalog/request-a-leasing.php | leasing | /local/ajax/catalog/action-request-a-call.php | form_text_30, form_text_31, form_text_32, form_email_33, form_text_34 | form_text_30, form_text_31, form_text_32, form_email_33, form_text_34 | — | agree_policy_leasing, agree_consent_leasing | FormsDriver/SourceHttp wired; live NOT_RUN; см. forms.json currentRecovery | /forms/leasing | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/catalog/form-found-it-cheaper.php | found-cheaper | /local/ajax/catalog/action-found-it-cheaper.php | form_text_6, form_text_7, form_text_8, form_text_9 | form_text_6, form_text_7, form_text_8, form_text_9 | — | agree_policy_cheaper, agree_consent_cheaper | FormsDriver/SourceHttp wired; live NOT_RUN; см. forms.json currentRecovery | /forms/found-cheaper | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/form/book-a-tour.php | tour | /local/ajax/form/book-a-tour-action.php | form_text_17, form_text_18, form_text_19 | form_text_17, form_text_18, form_text_19 | — | agree_policy_tour, agree_consent_tour | FormsDriver/SourceHttp wired; live NOT_RUN; см. forms.json currentRecovery | /forms/tour | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/form/get-business-advice-form-action.php | business-advice | /local/ajax/form/get-business-advice-form-action.php | first-name, phone, email, company-name, comment-text | first-name, phone, email, company-name, comment-text | — | agree_policy, agree_consent | FormsDriver/SourceHttp wired; live NOT_RUN; см. forms.json currentRecovery | /forms/business-advice | PARTIAL (до: PARTIAL) |
| site-source/suppliers/index.php | supplier | /local/ajax/form/suppliers-form-action.php | first-name, company-name, email, phone, product-category, product-desc, comment, attachment | first-name, company-name, email, phone, product-category, product-desc | attachment | agree_policy, agree_consent | FormsDriver/SourceHttp wired; live NOT_RUN; см. forms.json currentRecovery | /forms/supplier | PARTIAL (до: PARTIAL) |
| site-source/franchise/index.php | partner | /local/ajax/form/partners-form-action.php | inn, company-name, email, phone, first-name, has-warehouse, warehouse-address, warehouse-phone, warehouse-schedule | inn, company-name, email, phone, first-name | — | agree_policy, agree_consent | FormsDriver/SourceHttp wired; live NOT_RUN; см. forms.json currentRecovery | /forms/partner | PARTIAL (до: PARTIAL) |
| site-source/local/templates/main/components/bitrix/form.result.new/orange-form-ask/template.php | advice | /local/ajax/form/orangeAsk-action.php | — | — | — | agree_policy, agree_consent | FormsDriver/SourceHttp wired; live NOT_RUN; см. forms.json currentRecovery | /forms/advice | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/reviews/form-review-add.php | review | /local/ajax/reviews/form-review-add-action.php | rate, vote-quality, vote-value, vote-delivery, review-text, media[] | rate, review-text | media[] | — | PublicationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/review | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/orders/form-review-add.php | order-review | /local/ajax/lk/orders/action-review-add.php | rate, vote-quality, vote-value, vote-delivery, review-text, media[] | rate, review-text | media[] | — | PublicationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/order-review | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/reviews/form-question-add.php | question | /local/ajax/reviews/form-question-add-action.php | question-text | question-text | — | agree_policy_question, agree_consent_question | PublicationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/question | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/reviews/form-review-reply-action.php | review-reply | /local/ajax/reviews/form-review-reply-action.php | review-text | review-text | — | — | PublicationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/review-reply | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/reviews/form-question-reply-action.php | question-reply | /local/ajax/reviews/form-question-reply-action.php | question-text | question-text | — | — | PublicationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/question-reply | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/questions-and-reviews/form-edit-review.php | review-edit | /local/ajax/lk/questions-and-reviews/action-edit-review.php | rate, vote-quality, vote-value, vote-delivery, review-text, media[] | rate, review-text | media[] | — | PublicationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/review-edit | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/questions-and-reviews/form-edit-question.php | question-edit | /local/ajax/lk/questions-and-reviews/action-edit-question.php | question-text | question-text | — | — | PublicationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/question-edit | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/questions-and-reviews/action-delete.php | review-delete | /local/ajax/lk/questions-and-reviews/action-delete.php | — | — | — | — | PublicationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/review-delete | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/questions-and-reviews/action-delete.php | question-delete | /local/ajax/lk/questions-and-reviews/action-delete.php | — | — | — | — | PublicationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/question-delete | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/appeals/appeals-questions.php | appeal | /local/ajax/lk/appeals/appeals-text-action.php | theme, comment | theme, comment | — | — | ServiceDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/appeal | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/appeals/appeals-order-form.php | appeal-order | /local/ajax/lk/appeals/appeals-order-form-action.php | theme, tags[], comment, photos[] | theme, comment | photos[] | — | ServiceDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/appeal-order | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/appeals/appeals-rate-add.php | appeal-rating | /local/ajax/lk/appeals/appeals-rate-action.php | rate | rate | — | — | ServiceDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/appeal-rating | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/lk/returns-products/returns-product.php | return | /local/ajax/lk/returns-products/action-returns-product.php | selected-products | selected-products | — | — | ServiceDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/return | PARTIAL (до: PARTIAL) |
| site-source/local/templates/main/footer.php | subscription | /local/ajax/subscription/subscription.php | email | email | — | agree_policy | FormsDriver/SourceHttp wired; live NOT_RUN; см. forms.json currentRecovery | /forms/subscription | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/catalog/action-add-to-waitlist.php | product-notify | /local/ajax/catalog/action-add-to-waitlist.php | — | — | — | — | PublicationDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/product-notify | PARTIAL (до: PARTIAL) |
| site-source/local/components/prom.personal/personal_notifications/templates/.default/template.php | notification-preferences | /local/ajax/lk/notifications/notifications.php | email_order_info, email_promotions, sms_order_info, sms_promotions | — | — | — | ProfileDriver wired; live NOT_RUN; см. forms.json currentRecovery | /forms/notification-preferences | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/form/get-business-advice-form-action.php | quote | /local/ajax/form/get-business-advice-form-action.php | first-name, phone, email, company-name, comment-text | first-name, phone, email, company-name, comment-text | — | agree_policy, agree_consent | FormsDriver/SourceHttp wired; live NOT_RUN; см. forms.json currentRecovery | /forms/quote | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/form/get-business-advice-form-action.php | production-request | /local/ajax/form/get-business-advice-form-action.php | first-name, phone, email, company-name, comment-text | first-name, phone, email, company-name, comment-text | — | agree_policy, agree_consent | FormsDriver/SourceHttp wired; live NOT_RUN; см. forms.json currentRecovery | /forms/production-request | PARTIAL (до: PARTIAL) |
| site-source/local/ajax/catalog/request-a-call.php | contact | /local/ajax/catalog/action-request-a-call.php | form_text_24, form_text_25 | form_text_24, form_text_25 | — | agree_policy_call, agree_consent_call | FormsDriver/SourceHttp wired; live NOT_RUN; см. forms.json currentRecovery | /forms/contact | PARTIAL (до: PARTIAL) |
| site-source/franchise/index.php | franchise | /local/ajax/form/partners-form-action.php | inn, company-name, email, phone, first-name, has-warehouse, warehouse-address, warehouse-phone, warehouse-schedule | inn, company-name, email, phone, first-name | — | agree_policy, agree_consent | FormsDriver/SourceHttp wired; live NOT_RUN; см. forms.json currentRecovery | /forms/franchise | PARTIAL (до: PARTIAL) |



Проверить минимум:

- login;
- registration;
- OTP;
- password recovery;
- callback;
- checkout;
- one-click;
- нашли дешевле;
- leasing;
- rent;
- review;
- question;
- return;
- appeal;
- procurement;
- suppliers;
- franchise;
- organization;
- EDO;
- newsletter;
- contacts;
- product-related forms.

---

# 6. FUNCTION INVENTORY

140 строк:76 capabilities+64 canonical form flows;4 alias повторно не считаются. **До recovery:14 MISSING/117 PARTIAL/6 LEGACY_REVIEW/3 COMPLETE. Сейчас:3 MISSING/124 PARTIAL/6 LEGACY_REVIEW/6 COMPLETE/1 REMOVED_BY_USER.**

COMPLETE только у ограниченных доказанных NAV01/02/03/05, CTX01 и GEO01. 82 menu/36 commerce/30 forms UI не заменяют live приёмку Bitrix/PSP. До-recovery JSON/Markdown сохранены byte-for-byte и в полях beforeRecoveryStatus/currentAppBaseline/gapBeforeRecovery. [Текущая матрица](parity/functions.md), [полный JSON](parity/functions.json).

| ID / Function | Source code | Web | Mobile | Before → Current | Текущая реализация / точная граница |
|---|---|---|---|---|---|
| NAV01 / Глобальное вторичное меню | site-source/local/php_interface/lib/Menu.php:1 | https://prom.myfast.space/ | /more | MISSING → COMPLETE | MenuButton отделён от поиска и звонка; 41 source пункт доступен из глобального меню, 82/82 перехода при 320/390 с Back и нижней корзиной. |
| NAV02 / Нижние вкладки и глобальная корзина | site-source/local/templates/main/header.php:1 | https://prom.myfast.space/ | / | COMPLETE → COMPLETE | Bottom navigation/cart подтверждены на 41 menu destination и проверенных auth/callback/orders/checkout сценариях при 320/390. Скрытие при экранной клавиатуре остаётся намеренным. |
| NAV03 / Cart badge и обратная связь добавления | site-source/local/ajax/basket/checkBasket.php:1 | https://prom.myfast.space/basket/ | /cart | COMPLETE → COMPLETE | PDP→добавить→badge/корзина за один tap; personal/business корзины и reload сохранены в 36/36 локальных и 36/36 публичных проверках. |
| NAV04 / Back и сохранение независимых стеков | site-source/local/templates/main/header.php:1 | https://prom.myfast.space/ | /catalog | PARTIAL → PARTIAL | UI Back работает на проверенных 41 menu destinations; retained stacks существуют. Полная матрица history/scroll/filter и native hardware Back после recovery не перепроверена. |
| NAV05 / Служебные/content/legal deep links | site-source/urlrewrite.php:1 | https://prom.myfast.space/ | /more | PARTIAL → COMPLETE | 41 source menu entry открывает свой маршрут и возвращается через UI Back; 82/82 при 320/390. COMPLETE относится к этим переходам, не полноте содержимого и всех dynamic URL. |
| CTX01 / Явный выбор «Для себя / Для бизнеса» | site-source/local/ajax/lk/switch-person-type.php:36 | https://prom.myfast.space/personal/ | / | MISSING → COMPLETE | Personal default и отдельный business intent реально меняют собственные корзины; обратное переключение/reload сохраняют их. Business не выдаётся за авторизованную организацию. |
| CTX02 / Список доступных пользователю организаций | site-source/local/class/Models/Organization.php:32 | https://prom.myfast.space/organization/ | /workspace/organizations | PARTIAL → PARTIAL | BuyerDriver/OrganizationDriver/WorkspaceDriver дают actor-owned список и переключение организации; signed BFF wiring реализован. Actual membership/options на source Bitrix ещё не проверены. |
| CTX03 / Организационная корзина и тип цены | site-source/local/class/Models/BasketUsers.php:88, site-source/local/class/Models/BasketUsers.php:278 | https://prom.myfast.space/organization/cart/ | /cart | MISSING → PARTIAL | personal/business/organization:<ID>, отдельные drafts, verified membership и региональный price binding реализованы. Реальные корпоративные корзины и типы цен source runtime не проверены. |
| CTX04 / Проверка полномочий участника организации | site-source/local/class/Models/Organization.php:99, site-source/local/ajax/lk/switch-person-type.php:1 | https://prom.myfast.space/organization/ | /workspace/organizations | PARTIAL → PARTIAL | BFF отвергает произвольный organization ID; PHP fresh user/membership и actor-derived org реализованы. Live организация и смена полномочий не проверялись. |
| CAT01 / Каталог и дерево вложенных разделов | site-source/catalog/index.php:1 | https://prom.myfast.space/catalog/ | /catalog | PARTIAL → PARTIAL | 226 source-backed разделов,28 SKU snapshot, вложенные visual tiles. |
| CAT02 / Поиск по названию/артикулу/производителю | site-source/local/ajax/search/headSearch.php:1, site-source/local/php_interface/lib/Search.php:1 | https://prom.myfast.space/catalog/ | /catalog | PARTIAL → PARTIAL | Локальный snapshot search/hints, server search dataset не подключён. |
| CAT03 / История поисковых запросов | site-source/local/ajax/search/setHistory.php:1, site-source/local/ajax/search/removeHistory.php:1 | https://prom.myfast.space/catalog/ | /catalog | PARTIAL → PARTIAL | Local own-session history/clear/remove существуют. |
| CAT04 / Фильтры и сортировка | site-source/catalog/index.php:1 | https://prom.myfast.space/catalog/ | /catalog | PARTIAL → PARTIAL | Price/brand/spec filters по28 SKU; серверные facets/постраничность не используются. |
| CAT05 / Избранное: список и переключение товара | site-source/local/class/Models/Favorite.php:39, site-source/local/ajax/favorite/addToFavorite.php:1 | https://prom.myfast.space/favorite/ | /favorites | PARTIAL → PARTIAL | Действующая own-preview favorites операция; upstream actor/org sync нет. |
| CAT06 / Сравнение товаров и характеристик | site-source/local/class/Models/Comparison.php:18, site-source/local/ajax/comparison/addToComparison.php:1 | https://prom.myfast.space/comparison/ | /compare | PARTIAL → PARTIAL | Local6items сравнение; source category sync отсутствует. |
| CAT07 / Очистка сравнения целиком и по категории | site-source/local/class/Models/Comparison.php:448, site-source/local/class/Models/Comparison.php:491 | https://prom.myfast.space/comparison/ | /compare | MISSING → MISSING | В app поштучный список; source clear-category отсутствует. |
| CAT08 / Лист ожидания: просмотр и статус поступления | site-source/local/class/Models/WaitingList.php:36, site-source/local/class/Models/WaitingList.php:166 | https://prom.myfast.space/personal/waiting-list/ | /workspace/waiting-list | PARTIAL → PARTIAL | WorkspaceDriver читает source WaitingList, product-notify имеет PublicationDriver; прежний unconditional unavailable убран. Actual owned list/stock и полный ассортимент не проверены. |
| CAT09 / Ранее просмотренные товары | site-source/catalog/index.php:1 | https://prom.myfast.space/catalog/ | / | PARTIAL → PARTIAL | История просмотра own session/context и рекомендации на её основе. |
| PDP01 / Галерея и полноэкранный просмотр | site-source/local/templates/main/components/bitrix/catalog.element/old/template.php:28 | https://prom.myfast.space/catalog/ | /product/[id] | PARTIAL → PARTIAL | Галерея8/zoom/fullscreen проверялась; actual source snapshots28products. |
| PDP02 / Цена, старая цена и скидка | site-source/local/php_interface/lib/Basket.php:199 | https://prom.myfast.space/catalog/ | /product/[id] | PARTIAL → PARTIAL | Snapshot money/oldPrice/discount сохранены. Server quote использует source региональный Sale pricing после подключения; live обновление полного каталога/PDP по org/месту не подтверждено. |
| PDP03 / Наличие и склады | site-source/local/php_interface/lib/Helpers.php:256, site-source/local/php_interface/lib/Regions.php:1 | https://prom.myfast.space/catalog/ | /product/[id] | PARTIAL → PARTIAL | BFF availability bound to product/location/context, unknown без реального mapping. |
| PDP04 / Описание, характеристики, преимущества, комплектация | site-source/local/templates/main/components/bitrix/catalog.element/old/template.php:508 | https://prom.myfast.space/catalog/ | /product/[id] | PARTIAL → PARTIAL | Source product-details DTO/expandable text есть, ограничен28 снимками. |
| PDP05 / Рекомендации/сопутствующие товары | site-source/local/templates/main/components/bitrix/catalog.element/old/template.php:1 | https://prom.myfast.space/catalog/ | /product/[id] | PARTIAL → PARTIAL | Source-linked local shelves; не все relation types подтверждены. |
| PDP06 / Отзывы/вопросы: чтение и фильтры | site-source/local/class/Models/Reviews.php:45, site-source/local/class/Models/Questions.php:45 | https://prom.myfast.space/catalog/ | /product/[id] | PARTIAL → PARTIAL | Publications loader и WorkspaceDriver/PublicationDriver wired; owner/filter/media DTO реализованы. Нет pagination >200/q-popular, actual published records не проверены. |
| PDP07 / Фото/видео отзывов и ответы магазина | site-source/local/ajax/reviews/gallery.php:1, site-source/local/class/Models/Reviews.php:1 | https://prom.myfast.space/catalog/ | /product/[id] | PARTIAL → PARTIAL | Scoped upload tokens, source media/replies и owner edit/delete реализованы. Нет selective удаления старых фото; source moderation/remote media retrieval не проверены. |
| PDP08 / Документы на товар после покупки | site-source/local/templates/main/components/bitrix/catalog.element/old/template.php:1, site-source/local/php_interface/lib/Documents1C.php:397 | https://prom.myfast.space/catalog/ | /product/[id] | PARTIAL → PARTIAL | Пояснение/заказы/документы есть; actual manifests не загружаются. |
| BASK01 / Добавить товар и изменить количество | site-source/local/ajax/basket/basket-handler.php:1, site-source/local/php_interface/lib/Basket.php:12 | https://prom.myfast.space/basket/ | /cart | PARTIAL → PARTIAL | Local preview server validates product/quantity, qty2 reloadPASS. |
| BASK02 / Удалить товар из корзины | site-source/local/ajax/basket/basket-handler.php:1 | https://prom.myfast.space/basket/ | /cart | PARTIAL → PARTIAL | Qty0 удаляет локальную строку, UI delete существует. |
| BASK03 / Корзины аккаунта, восстановление и login merge | site-source/local/class/Models/BasketUsers.php:216, site-source/local/class/Models/BasketUsers.php:278 | https://prom.myfast.space/basket/ | /cart | PARTIAL → PARTIAL | Own personal/business корзины сохраняются; source actor и verified org sessions реализованы. Website FUSER/login merge и синхронизация всех source корзин не приняты на подключённом runtime. |
| BASK04 / Купон: проверка права/срока/статуса | site-source/local/ajax/basket/coupon-handler.php:1, site-source/local/class/Controllers/CouponController.php:21 | https://prom.myfast.space/basket/ | /cart | MISSING → PARTIAL | CartCoupon и scoped POST проверки купона → CommerceDriver DiscountCouponsManager реализованы. Валидность, истечение и ограничения actual source coupon не проверены; guest/unauthenticated upstream возвращает отказ. |
| BASK05 / Применить/удалить купон и пересчитать скидку | site-source/local/class/Controllers/CouponController.php:80, site-source/local/templates/main/components/bitrix/sale.order.ajax/main/script.js:1 | https://prom.myfast.space/order/ | /checkout-preview | MISSING → PARTIAL | Применение/снятие купона и quote invalidation подключены к BFF и Sale discount driver. Live скидки и срок/применимость купона не подтверждены; source buggy CouponController не копируется. |
| BASK06 / Итоги товара/скидки/доставки/заказа | site-source/local/php_interface/lib/Basket.php:160, site-source/local/templates/main/components/bitrix/sale.order.ajax/main/script.js:1 | https://prom.myfast.space/basket/ | /cart | MISSING → PARTIAL | BFF проверяет exact lines, integer money, discounts/delivery/total, context и expiry; CheckoutScreen показывает confirmed quote отдельно от snapshot. Live расчёт Sale не выполнялся. |
| ORDER01 / Доступные person types и order properties | site-source/order/index.php:1, site-source/local/templates/main/components/bitrix/sale.order.ajax/main/template.php:1 | https://prom.myfast.space/order/ | /checkout-preview | PARTIAL → PARTIAL | Dedicated checkout и CommerceDriver source personType/order properties по контексту реализованы; source fields сохраняются. Installed properties/enums и реальная организация требуют connected acceptance. |
| ORDER02 / Реальный выбор способов доставки | site-source/local/php_interface/lib/Order.php:193, site-source/local/templates/main/components/bitrix/sale.order.ajax/main/script.js:1 | https://prom.myfast.space/order/ | /checkout-preview | MISSING → PARTIAL | Выбор способа получения и actual options→pickupId→quote реализованы; DeliveryDriver даёт concrete CDEK/Yandex/Sale point resolver. Provider mappings/tariffs не подключены, это не реальные выбранные тарифы. |
| ORDER03 / Адрес курьера, ПВЗ/самовывоз, дата и интервал | site-source/local/ajax/order/popup-curier.php:1, site-source/local/ajax/order/popup-pickup.php:1 | https://prom.myfast.space/order/ | /checkout-preview | PARTIAL → PARTIAL | Курьерский адрес требует canonical suggestion; pod/etag/office/comment сохранены, выбранный source point связан с quote. Provider slots/date/time и реальная география пока не проверены. |
| ORDER04 / Выбор способов оплаты | site-source/local/templates/main/components/bitrix/sale.order.ajax/main/template.php:1, site-source/local/templates/main/components/bitrix/sale.order.ajax/main/script.js:1 | https://prom.myfast.space/order/ | /checkout-preview | MISSING → PARTIAL | Checkout radio и source PAY_SYSTEM_ID binding реализованы, personal invoice исключён; server валидирует exact payment ID. Actual available provider methods на установленном сайте не проверены. |
| ORDER05 / Yandex Pay / Split session and eligibility | site-source/local/templates/main/components/bitrix/sale.order.ajax/main/script.js:1 | https://prom.myfast.space/order/ | /checkout-preview | MISSING → PARTIAL | Pay/Split selection, payment session/status and fresh owned invoice tickets implemented. PHP08 Payment83 PASS includes durable retry and guarded manual Sale reconciliation. Actual offers/Plus/schedule, full PDF, fiscalization and automatic webhook/background reconciliation remain MISSING_IMPLEMENTATION; live PSP/Bitrix NOT_RUN. |
| ORDER06 / Счёт/банковский перевод и СБП/прочие системы | site-source/local/templates/main/components/bitrix/sale.order.ajax/main/script.js:1 | https://prom.myfast.space/order/ | /checkout-preview | MISSING → PARTIAL | Source payment methods и invoice для verified organization включены в driver/BFF. PaymentHandoff даёт очищенный одноразовый invoice HTML, PaymentDriver конкретный PSP transport. Полный PDF/печати, fiscalization/module mapping не реализованы; actual СБП/банк не принимались. |
| ORDER07 / Пересчёт при количестве/доставке/купоне/контексте | site-source/local/templates/main/components/bitrix/sale.order.ajax/main/script.js:1 | https://prom.myfast.space/order/ | /checkout-preview | MISSING → PARTIAL | Версионированный quote привязан к cart/context/GAR/options/payment/address/coupon; изменения отзывают его, late responses/CAS проверены. Реальный Sale recalculation не запускался. |
| ORDER08 / Создание заказа и дальнейшая оплата | site-source/local/templates/main/components/bitrix/sale.order.ajax/main/script.js:1, site-source/local/php_interface/events.php:1 | https://prom.myfast.space/order/ | /checkout-preview | PARTIAL → PARTIAL | Dedicated submit → signed runtime → один Sale save, durable pending, consent receipt и payment handoff реализованы. Actual order/CRM/1C/PSP не вызывались; непроверенный итог не даёт создать заказ. |
| GEO01 / Structured GAR/ФИАС поиск и выбор | site-source/local/ajax/geo/cityList.php:1, site-source/local/ajax/order/resolve-location.php:1 | https://prom.myfast.space/ | / | COMPLETE → COMPLETE | Сохранён structured GAR registry160478, UUID selection, запрет free-text, отдельные settlement identity/version. В recovery 36 UI проверках выбраны официальные пункты и сохранён context. Это не приёмка delivery mapping. |
| GEO02 / Изменение города профиля только выбором | site-source/local/ajax/lk/info/edit/forms/change-city.php:1 | https://prom.myfast.space/personal/info/ | /forms/profile-city | PARTIAL → PARTIAL | ProfileDriver сохраняет PERSONAL_CITY только из exact LocationDriver GAR→SaleCODE; identity хранится отдельно, BFF сверяет текущие ID/version. Live CUser/sidecar не проверены. |
| GEO03 / Settlement→ServiceRegion mapping | site-source/local/php_interface/lib/Regions.php:1, site-source/local/ajax/order/change-region.php:1 | https://prom.myfast.space/order/ | / | PARTIAL → PARTIAL | LocationDriver exact FIAS/GAR external mapping и server-only settlement/service region map реализованы. Actual полная таблица источника и installed Sale location требуют конфигурации/проверки. |
| GEO04 / Склады/доставка/корзина после смены места | site-source/local/php_interface/lib/Regions.php:1, site-source/local/php_interface/lib/delivery/ProductDeliveryCalculator.php:1 | https://prom.myfast.space/order/ | /cart | PARTIAL → PARTIAL | Смена GAR/context сохраняет drafts и отзывает quote/address/options; поздние ответы отклоняются. Live prices/stock/warehouses/carrier conditions после смены места не проверены. |
| GEO05 / Расчёт CDEK/YandexDelivery/Pickup | site-source/local/php_interface/lib/delivery/ProductDeliveryCalculator.php:1, site-source/local/php_interface/lib/delivery/Providers/CdekCourierProvider.php:1 | https://prom.myfast.space/catalog/ | /product/[id] | PARTIAL → PARTIAL | Concrete DeliveryDriver: CDEK/Yandex/Sale points, canonical DaData address и bind к source properties. Provider HTTP не вызывался; tariff/weight/dims и actual module mapping не подтверждены. |
| ACC01 / Личные данные и контакты профиля | site-source/local/class/Models/User.php:73 | https://prom.myfast.space/personal/info/ | /workspace/profile | PARTIAL → PARTIAL | WorkspaceDriver read + ProfileDriver actor-owned updates/OTP/GAR wired. Actual профиль и подтверждение контактов не проверены. |
| ACC02 / Активные сеансы пользователя | site-source/local/class/Models/User.php:223 | https://prom.myfast.space/personal/info/ | /workspace/sessions | PARTIAL → PARTIAL | Workspace sessions и AccountActionDriver termination wired; mandatory loggedOut + own-only draft reset проверены HTTP. Live source sessions не проверены. |
| ACC03 / Заказы: все/активные/завершённые | site-source/local/class/Models/Order.php:156, site-source/local/class/Models/Order.php:231, site-source/local/class/Models/Order.php:408 | https://prom.myfast.space/personal/orders/ | /orders | PARTIAL → PARTIAL | Owned source order list через WorkspaceDriver и BFF wired; synthetic orders публично не выдаются. Actual заказы, paging/filter/counts не проверены. |
| ACC04 / Карточка заказа/товары/доступные действия | site-source/local/class/Models/Order.php:669 | https://prom.myfast.space/personal/orders/ | /order/[id] | PARTIAL → PARTIAL | Source owned order detail/allowed actions + OrderActionDriver wired; cancel/repeat/pay не заменены fake success. Actual records/status/permissions не проверены. |
| ACC05 / Список адресов и основной адрес | site-source/local/class/Models/AddressDeliveryUsers.php:111, site-source/local/class/Models/AddressDeliveryUsers.php:198 | https://prom.myfast.space/personal/address-delivery/ | /workspace/addresses | PARTIAL → PARTIAL | Workspace addresses + actor/org owned ProfileDriver create/edit/default/delete, GAR/LOCATION_CODE/ZIP реализованы. Реальная адресная книга source не проверена. |
| ACC06 / Сохранённые способы оплаты | site-source/local/class/Models/ConfirmedCards.php:20 | https://prom.myfast.space/personal/payment-methods/ | /workspace/payment-methods | PARTIAL → PARTIAL | Workspace tokenized card metadata + owned default/remove реализованы. Новый card capture source legacy; реальные записи/PSP tokens не проверены. |
| ACC07 / Мои отзывы/вопросы | site-source/local/class/Models/Reviews.php:172, site-source/local/class/Models/Questions.php:171 | https://prom.myfast.space/personal/questions-and-reviews/ | /workspace/reviews | PARTIAL → PARTIAL | WorkspaceDriver/PublicationDriver read/edit/delete/replies wired. Actual records/permissions не проверены, bounded200/pagination gaps сохранены. |
| ACC08 / Уведомления: чтение/удаление | site-source/local/class/Models/UserNotifications.php:28, site-source/local/ajax/lk/notifications/delete-notification.php:1 | https://prom.myfast.space/personal/notifications/ | /notifications | PARTIAL → PARTIAL | Source WorkspaceDriver notifications read/actions и ProfileDriver preferences wired. Live notification records/expiry/delivery не проверены. |
| ACC09 / Обращения: список/заказ/статус | site-source/local/ajax/lk/appeals/appeals-orders.php:1, site-source/local/ajax/lk/appeals/appeals-questions.php:1 | https://prom.myfast.space/personal/appeals/ | /service | PARTIAL → PARTIAL | Workspace/ServiceDriver owned appeals и source enum/context/form actions wired. Actual statuses, order links и source response не проверены. |
| ACC10 / Возвраты: собственные заказы и статусы заявок | site-source/local/ajax/lk/returns-products/returns-product.php:1 | https://prom.myfast.space/personal/returns/ | /workspace/returns | PARTIAL → PARTIAL | ServiceDriver completed owned order→selected products/reasons/indexed files, Workspace returns wired. Реальные заявки/причины/attachments не проверены. |
| B2B01 / Документы 1С: список/manifest/download | site-source/local/php_interface/lib/Documents1C.php:397, site-source/local/php_interface/lib/Documents1C.php:527 | https://prom.myfast.space/organization/documents/ | /workspace/documents | PARTIAL → PARTIAL | Source read-only document manifest bridge сохранён; DocumentRequestDriver создаёт запрос через CForm. Authenticated workspace download/open документа всё ещё MISSING_IMPLEMENTATION. |
| B2B02 / Реквизиты, банковские данные, ЭДО | site-source/local/class/Models/Organization.php:19, site-source/local/ajax/lk/organization/organization-edo.php:1 | https://prom.myfast.space/organization/info/ | /workspace/requisites | PARTIAL → PARTIAL | OrganizationDriver: INN lookup, requisites files, ЭДО и verification wired; банковские данные read-only. Live organization/enum/CRM effects не проверены. |
| B2B03 / Сотрудники и грузополучатель | site-source/local/ajax/lk/organization/organizations-consignee.php:1 | https://prom.myfast.space/organization/ | /workspace/staff | LEGACY_REVIEW → LEGACY_REVIEW | Source has incomplete/unnamed controls, appinfo form only. |
| B2B04 / Загрузка спецификации / потребности | site-source/business/index.php:1 | https://prom.myfast.space/business/ | /procurement | PARTIAL → PARTIAL | Procurement UI→scoped uploads/BFF→source business HL+вложения+одна CRM lead; реальный reference/pending, idempotency и сохранение ошибок. Bitrix/CRM/mail не вызывались. |
| B2B05 / Быстрый заказ по артикулам | site-source/business/index.php:1 | https://prom.myfast.space/business/ | /quick-order → /procurement | PARTIAL → REMOVED_BY_USER | Явное решение владельца 12.09.2026; не восстанавливать. |
| CONTENT01 / Блог и статьи | site-source/blog/index.php:1 | https://prom.myfast.space/blog/ | /blog | PARTIAL → PARTIAL | 28 source articles/projects и179 inline images восстановлены, source links сохраняются. Full crawl показал content/entity gaps; полный блог/все dynamic links ещё не приняты. |
| CONTENT02 / Комментарии статей | site-source/local/templates/main/components/bitrix/news/blog/detail.php:1 | https://prom.myfast.space/blog/ | /blog/[id] | LEGACY_REVIEW → LEGACY_REVIEW | Includecommentsdisabledinsource; no publiccommentsUI. |
| CONTENT03 / О компании/история/награды/производство | site-source/about/index.php:1 | https://prom.myfast.space/about/ | /pages/about | PARTIAL → PARTIAL | О компании/производство/история/награды доступны через восстановленное меню, добавлены source departments/projects. Полнота всех смысловых блоков остаётся отдельной незавершённой проверкой. |
| CONTENT04 / Контакты/филиалы/звонок/маршрут | site-source/contacts/index.php:1 | https://prom.myfast.space/contacts/ | /information/contacts | PARTIAL → PARTIAL | 18 branch cards/search/details; ownlocation distinct, notinline map. |
| CONTENT05 / Доставка/оплата/возврат/гарантия/FAQ | site-source/delivery/index.php:1, site-source/personal/order/payment/index.php:1 | https://prom.myfast.space/delivery/ | /more | PARTIAL → PARTIAL | Buyer guides/legal доступны из меню; checkout intents/options/error states восстановлены. Реальные delivery/payment/returns conditions и legal acceptance ещё не подтверждены. |
| CONTENT06 / Поставщикам/франшиза/сотрудничество | site-source/suppliers/index.php:1, site-source/franchise/index.php:1 | https://prom.myfast.space/suppliers/ | /pages/cooperation | PARTIAL → PARTIAL | Source cooperation pages/menu и FormsDriver allowlisted supplier/partner transport wired. Actual CRM/mail/files и полная content parity не проверены. |
| CONTENT07 / Legal documents/согласия/cookies/recommendations | site-source/local/ajax/consent-validate.php:1 | https://prom.myfast.space/ | /legal/[id] | PARTIAL → PARTIAL | Source unchecked consents/links, canonical required IDs/revisions, durable ConsentLedger реализованы. Актуальность approved legal versions/withdrawal и real ledger на Bitrix ещё не приняты. |
| INTEGR01 / Заказ→Bitrix24/CRM событие | site-source/local/php_interface/events.php:1, site-source/local/class/Controllers/Bitrix24WebhookController.php:156 | https://prom.myfast.space/order/ | /checkout-preview | PARTIAL → PARTIAL | CommerceDriver сохраняет Sale order один раз и использует existing source events; повторный прямой CRM lead не создаёт. Live CRM/event outcome и reconciliation не проверены. |
| INTEGR02 / Обмен1С/прайсы/остатки/документы | site-source/local/php_interface/lib/Exchange.php:1, site-source/local/php_interface/lib/Documents1C.php:1 | https://prom.myfast.space/organization/documents/ | /workspace/documents | PARTIAL → PARTIAL | Bridge/read-only integration pieces; active exchange notexecuted. |
| INTEGR03 / OTP/email/SMS/challenge lifecycle | site-source/local/class/Models/ConfirmationCodes.php:40, site-source/local/class/Models/ConfirmationCodes.php:130 | https://prom.myfast.space/personal/ | /forms/auth-login | PARTIAL → PARTIAL | AuthDriver/CUser/Rest typed challenges, protected transport, OTP TTL/retry/binding реализованы. Actual sender/code delivery/auth/session lifecycle не запускались. |
| PDP09 / Выбор торгового предложения / варианта товара | site-source/local/ajax/catalog-detail/offer.php:15 | https://prom.myfast.space/catalog/ | /product/[id] | MISSING → MISSING | В mobile Product DTO нет дерева предложений и активного offer ID. |
| PDP10 / Быстрый просмотр товара из каталога | site-source/local/ajax/catalog-detail/fast-view.php:1 | https://prom.myfast.space/catalog/ | /product/[id] | PARTIAL → PARTIAL | Карточка открывает PDP; исходное содержимое quick-view доступно частично через общий товарный DTO. |
| BASK07 / Выбор и удаление нескольких позиций корзины | site-source/local/ajax/basket/basket-page-handler.php:40 | https://prom.myfast.space/basket/ | /cart | MISSING → MISSING | В mobile есть только поштучное удаление, группового выбора нет. |
| ORDER09 / Подсказки адреса и координаты курьера | site-source/local/ajax/order/courier-dropdown-results.php:1, site-source/local/ajax/order/courier-geocode.php:1 | https://prom.myfast.space/order/ | /checkout-preview | PARTIAL → PARTIAL | Canonical BFF address suggestions bind exact GAR/context/version; DeliveryDriver validates fresh house UUID and coordinates. PHP08 Delivery41 PASS, BFF address8 PASS. Actual provider geography and installed module configuration remain unverified. |
| ACC11 / Оценка купленного товара из заказа | site-source/local/ajax/lk/orders/orders-reviews.php:36 | https://prom.myfast.space/personal/orders/ | /order/[id] | PARTIAL → PARTIAL | Workspace owned order item projection + PublicationDriver order-review link реализованы. Actual NEED_REVIEW list и запись отзыва купленного товара не проверены. |
| ACC12 / Поддержка по заказу: звонок/email/обращение | site-source/local/ajax/lk/appeals/order-support-contacts.php:1 | https://prom.myfast.space/personal/appeals/ | /order/[id] | PARTIAL → PARTIAL | Source owned order support context и ServiceDriver order-appeal wired; глобальный звонок/контакты доступны. Live order-specific channels/контакты не проверены. |
| FORM:auth-login / Вход или регистрация | site-source/local/templates/.default/components/bitrix/system.auth.form/.default/template.php:1, site-source/local/include/forms/auth-reg/action-auth.php:1 | https://prom.myfast.space/local/include/forms/auth-reg/action-auth.php | /forms/auth-login | PARTIAL → PARTIAL | AuthDriver wired. CUser/Rest auth и typed challenge реализованы. Не проверены реальные вход, регистрация, OTP/recovery и доставка кода; нужны изолированный Bitrix, действующие sender settings и проверка account/session lifecycle. |
| FORM:auth-email / Вход по электронной почте | site-source/local/include/forms/auth-reg/form-auth-by-email.php:1, site-source/local/include/forms/auth-reg/action-auth-by-email.php:1 | https://prom.myfast.space/local/include/forms/auth-reg/action-auth-by-email.php | /forms/auth-email | PARTIAL → PARTIAL | AuthDriver wired. CUser/Rest auth и typed challenge реализованы. Не проверены реальные вход, регистрация, OTP/recovery и доставка кода; нужны изолированный Bitrix, действующие sender settings и проверка account/session lifecycle. |
| FORM:auth-register / Регистрация | site-source/local/include/forms/auth-reg/form-reg.php:1, site-source/local/include/forms/auth-reg/action-reg.php:1 | https://prom.myfast.space/local/include/forms/auth-reg/action-reg.php | /forms/auth-register | PARTIAL → PARTIAL | AuthDriver wired. CUser/Rest auth и typed challenge реализованы. Не проверены реальные вход, регистрация, OTP/recovery и доставка кода; нужны изолированный Bitrix, действующие sender settings и проверка account/session lifecycle. |
| FORM:auth-phone / Вход по телефону | site-source/local/include/forms/auth-reg/form-auth-by-phone.php:1, site-source/local/include/forms/auth-reg/action-get-code-for-phone.php:1 | https://prom.myfast.space/local/include/forms/auth-reg/action-get-code-for-phone.php | /forms/auth-phone | PARTIAL → PARTIAL | AuthDriver wired. CUser/Rest auth и typed challenge реализованы. Не проверены реальные вход, регистрация, OTP/recovery и доставка кода; нужны изолированный Bitrix, действующие sender settings и проверка account/session lifecycle. |
| FORM:auth-otp / Подтверждение телефона | site-source/local/include/forms/auth-reg/form-auth-by-phone.php:1, site-source/local/include/forms/auth-reg/action-auth-by-phone.php:1 | https://prom.myfast.space/local/include/forms/auth-reg/action-auth-by-phone.php | /forms/auth-otp | PARTIAL → PARTIAL | AuthDriver wired. CUser/Rest auth и typed challenge реализованы. Не проверены реальные вход, регистрация, OTP/recovery и доставка кода; нужны изолированный Bitrix, действующие sender settings и проверка account/session lifecycle. |
| FORM:auth-register-phone / Телефон для регистрации | site-source/local/include/forms/auth-reg/form-reg-step-phone.php:1, site-source/local/include/forms/auth-reg/action-reg-step-phone.php:1 | https://prom.myfast.space/local/include/forms/auth-reg/action-reg-step-phone.php | /forms/auth-register-phone | PARTIAL → PARTIAL | AuthDriver wired. CUser/Rest auth и typed challenge реализованы. Не проверены реальные вход, регистрация, OTP/recovery и доставка кода; нужны изолированный Bitrix, действующие sender settings и проверка account/session lifecycle. |
| FORM:auth-register-otp / Подтверждение регистрации | site-source/local/include/forms/auth-reg/form-reg-step-phone-code.php:1, site-source/local/include/forms/auth-reg/action-reg-step-phone-code.php:1 | https://prom.myfast.space/local/include/forms/auth-reg/action-reg-step-phone-code.php | /forms/auth-register-otp | PARTIAL → PARTIAL | AuthDriver wired. CUser/Rest auth и typed challenge реализованы. Не проверены реальные вход, регистрация, OTP/recovery и доставка кода; нужны изолированный Bitrix, действующие sender settings и проверка account/session lifecycle. |
| FORM:auth-recovery / Восстановление пароля | site-source/local/include/forms/auth-reg/password-recovery.php:1, site-source/local/include/forms/auth-reg/action-password-recovery.php:1 | https://prom.myfast.space/local/include/forms/auth-reg/action-password-recovery.php | /forms/auth-recovery | PARTIAL → PARTIAL | AuthDriver wired. CUser/Rest auth и typed challenge реализованы. Не проверены реальные вход, регистрация, OTP/recovery и доставка кода; нужны изолированный Bitrix, действующие sender settings и проверка account/session lifecycle. |
| FORM:profile-name / Имя | site-source/local/ajax/lk/info/edit/forms/change-name.php:1, site-source/local/ajax/lk/info/edit/change-user-data.php:1 | https://prom.myfast.space/local/ajax/lk/info/edit/change-user-data.php | /forms/profile-name | PARTIAL → PARTIAL | ProfileDriver wired. Actor-owned CUser/адресные записи и контакты с challenge реализованы. Реальные CUser/AddressDeliveryUsers/подписки, OTP и совместная фиксация GAR sidecar с source DB не проверены. |
| FORM:profile-surname / Фамилия | site-source/local/ajax/lk/info/edit/forms/change-family.php:1, site-source/local/ajax/lk/info/edit/change-user-data.php:1 | https://prom.myfast.space/local/ajax/lk/info/edit/change-user-data.php | /forms/profile-surname | PARTIAL → PARTIAL | ProfileDriver wired. Actor-owned CUser/адресные записи и контакты с challenge реализованы. Реальные CUser/AddressDeliveryUsers/подписки, OTP и совместная фиксация GAR sidecar с source DB не проверены. |
| FORM:profile-city / Город | site-source/local/ajax/lk/info/edit/forms/change-city.php:1, site-source/local/ajax/lk/info/edit/change-user-data.php:1 | https://prom.myfast.space/local/ajax/lk/info/edit/change-user-data.php | /forms/profile-city | PARTIAL → PARTIAL | ProfileDriver wired. Actor-owned CUser/адресные записи и контакты с challenge реализованы. Реальные CUser/AddressDeliveryUsers/подписки, OTP и совместная фиксация GAR sidecar с source DB не проверены. |
| FORM:profile-email / Изменить электронную почту | site-source/local/ajax/lk/info/edit/forms/change-email.php:1, site-source/local/ajax/lk/info/edit/forms/change-email-get-code-action.php:1 | https://prom.myfast.space/local/ajax/lk/info/edit/forms/change-email-get-code-action.php | /forms/profile-email | PARTIAL → PARTIAL | ProfileDriver wired. Actor-owned CUser/адресные записи и контакты с challenge реализованы. Реальные CUser/AddressDeliveryUsers/подписки, OTP и совместная фиксация GAR sidecar с source DB не проверены. |
| FORM:profile-email-otp / Подтвердить электронную почту | site-source/local/ajax/lk/info/edit/forms/code-verification-by-email.php:1, site-source/local/ajax/lk/info/edit/forms/change-email-check-code-action.php:1 | https://prom.myfast.space/local/ajax/lk/info/edit/forms/change-email-check-code-action.php | /forms/profile-email-otp | PARTIAL → PARTIAL | ProfileDriver wired. Actor-owned CUser/адресные записи и контакты с challenge реализованы. Реальные CUser/AddressDeliveryUsers/подписки, OTP и совместная фиксация GAR sidecar с source DB не проверены. |
| FORM:profile-phone / Изменить телефон | site-source/local/ajax/lk/info/edit/forms/change-phone.php:1, site-source/local/ajax/lk/info/edit/forms/change-phone-get-code-action.php:1 | https://prom.myfast.space/local/ajax/lk/info/edit/forms/change-phone-get-code-action.php | /forms/profile-phone | PARTIAL → PARTIAL | ProfileDriver wired. Actor-owned CUser/адресные записи и контакты с challenge реализованы. Реальные CUser/AddressDeliveryUsers/подписки, OTP и совместная фиксация GAR sidecar с source DB не проверены. |
| FORM:profile-phone-otp / Подтвердить новый телефон | site-source/local/ajax/lk/info/edit/forms/code-verification-by-phone.php:1, site-source/local/ajax/lk/info/edit/forms/change-phone-check-code-action.php:1 | https://prom.myfast.space/local/ajax/lk/info/edit/forms/change-phone-check-code-action.php | /forms/profile-phone-otp | PARTIAL → PARTIAL | ProfileDriver wired. Actor-owned CUser/адресные записи и контакты с challenge реализованы. Реальные CUser/AddressDeliveryUsers/подписки, OTP и совместная фиксация GAR sidecar с source DB не проверены. |
| FORM:profile-passport / Паспортные данные | site-source/local/ajax/lk/info/edit/forms/gosuslugi.php:1 | https://prom.myfast.space/personal/ | /forms/profile-passport | LEGACY_REVIEW → LEGACY_REVIEW | ProfileDriver wired. LEGACY_REVIEW: source unnamed passport controls не имеют работающего handler. Read-only пояснение и явный отказ сохранения; сбор паспортных данных не придуман. |
| FORM:address-create / Добавить адрес | site-source/local/ajax/lk/order-placing/popup-courier.php:1, site-source/local/ajax/lk/address-delivery/add-address-action.php:1 | https://prom.myfast.space/local/ajax/lk/address-delivery/add-address-action.php | /forms/address-create | PARTIAL → PARTIAL | ProfileDriver wired. Actor-owned CUser/адресные записи и контакты с challenge реализованы. Реальные CUser/AddressDeliveryUsers/подписки, OTP и совместная фиксация GAR sidecar с source DB не проверены. |
| FORM:address-edit / Изменить адрес | site-source/local/ajax/lk/order-placing/popup-courier.php:1, site-source/local/ajax/lk/address-delivery/add-address-action.php:1 | https://prom.myfast.space/local/ajax/lk/address-delivery/add-address-action.php | /forms/address-edit | PARTIAL → PARTIAL | ProfileDriver wired. Actor-owned CUser/адресные записи и контакты с challenge реализованы. Реальные CUser/AddressDeliveryUsers/подписки, OTP и совместная фиксация GAR sidecar с source DB не проверены. |
| FORM:address-default / Сделать адрес основным | site-source/local/ajax/lk/address-delivery/change-main-address.php:1 | https://prom.myfast.space/local/ajax/lk/address-delivery/change-main-address.php | /forms/address-default | PARTIAL → PARTIAL | ProfileDriver wired. Actor-owned CUser/адресные записи и контакты с challenge реализованы. Реальные CUser/AddressDeliveryUsers/подписки, OTP и совместная фиксация GAR sidecar с source DB не проверены. |
| FORM:address-delete / Удалить адрес | site-source/local/ajax/lk/address-delivery/remove-address-action.php:1 | https://prom.myfast.space/local/ajax/lk/address-delivery/remove-address-action.php | /forms/address-delete | PARTIAL → PARTIAL | ProfileDriver wired. Actor-owned CUser/адресные записи и контакты с challenge реализованы. Реальные CUser/AddressDeliveryUsers/подписки, OTP и совместная фиксация GAR sidecar с source DB не проверены. |
| FORM:organization-add / Добавить организацию | site-source/local/components/prom.personal/personal_my_organizations_add/templates/.default/template.php:1, site-source/local/ajax/lk/organization/organizations-find.php:1, site-source/local/ajax/lk/organization/organizations-add.php:1 | https://prom.myfast.space/local/ajax/lk/organization/organizations-add.php | /forms/organization-add | PARTIAL → PARTIAL | OrganizationDriver wired. Fresh membership, INN lookup, организация, реквизиты/файлы и ЭДО реализованы. Не проверены реальные справочники, реквизиты, ответы lookup и source события на подключённом Bitrix. |
| FORM:organization-requisites / Изменить реквизиты | site-source/local/ajax/lk/organization/organizations-details.php:1, site-source/local/ajax/lk/organization/action-organizations-details.php:1 | https://prom.myfast.space/local/ajax/lk/organization/action-organizations-details.php | /forms/organization-requisites | PARTIAL → PARTIAL | OrganizationDriver wired. Fresh membership, INN lookup, организация, реквизиты/файлы и ЭДО реализованы. Не проверены реальные справочники, реквизиты, ответы lookup и source события на подключённом Bitrix. |
| FORM:organization-bank / Банковские реквизиты | site-source/local/components/prom.personal/personal_my_organizations_add/templates/.default/template.php:1, site-source/local/ajax/lk/organization/organizations-find.php:1 | https://prom.myfast.space/personal/ | /forms/organization-bank | LEGACY_REVIEW → LEGACY_REVIEW | OrganizationDriver wired. Source банковские данные доступны read-only из проверенного INN lookup; отдельный save handler отсутствует. Read-only capability PARTIAL, самостоятельное редактирование остаётся LEGACY_REVIEW в function inventory. |
| FORM:organization-verify / Подтвердить полномочия | site-source/local/ajax/lk/organization/organization-verify.php:1, site-source/local/ajax/lk/organization/action-organization-verify.php:1 | https://prom.myfast.space/local/ajax/lk/organization/action-organization-verify.php | /forms/organization-verify | PARTIAL → PARTIAL | OrganizationDriver wired. Fresh membership, INN lookup, организация, реквизиты/файлы и ЭДО реализованы. Не проверены реальные справочники, реквизиты, ответы lookup и source события на подключённом Bitrix. |
| FORM:organization-edo / Подключить ЭДО | site-source/local/ajax/lk/organization/organization-edo.php:1, site-source/local/ajax/lk/organization/action-organization-edo.php:1 | https://prom.myfast.space/local/ajax/lk/organization/action-organization-edo.php | /forms/organization-edo | PARTIAL → PARTIAL | OrganizationDriver wired. Fresh membership, INN lookup, организация, реквизиты/файлы и ЭДО реализованы. Не проверены реальные справочники, реквизиты, ответы lookup и source события на подключённом Bitrix. |
| FORM:organization-consignee / Грузополучатель | site-source/local/ajax/lk/organization/organizations-consignee.php:1 | https://prom.myfast.space/personal/ | /forms/organization-consignee | LEGACY_REVIEW → LEGACY_REVIEW | OrganizationDriver wired. LEGACY_REVIEW: unnamed source controls не задают исполняемый save contract. Нужны решение по реальной source модели и mapping; фиктивного грузополучателя нет. |
| FORM:organization-switch / Выбрать организацию | site-source/local/ajax/lk/organization/organizations-switcher.php:1, site-source/local/ajax/lk/organization/action-organizations-switcher.php:1 | https://prom.myfast.space/local/ajax/lk/organization/action-organizations-switcher.php | /forms/organization-switch | PARTIAL → PARTIAL | OrganizationDriver wired. Fresh membership, INN lookup, организация, реквизиты/файлы и ЭДО реализованы. Не проверены реальные справочники, реквизиты, ответы lookup и source события на подключённом Bitrix. |
| FORM:organization-delete / Удалить организацию | site-source/local/ajax/lk/organization/form-delete-organization.php:1 | https://prom.myfast.space/personal/ | /forms/organization-delete | PARTIAL → PARTIAL | OrganizationDriver wired. Fresh membership, INN lookup, организация, реквизиты/файлы и ЭДО реализованы. Не проверены реальные справочники, реквизиты, ответы lookup и source события на подключённом Bitrix. |
| FORM:account-delete / Удалить аккаунт | site-source/local/ajax/lk/info/edit/delete-account.php:1 | https://prom.myfast.space/personal/ | /forms/account-delete | PARTIAL → PARTIAL | AccountActionDriver wired. Checked owner/context action и явный loggedOut реализованы. Реальные source user/session/card records и жизненный цикл аккаунта не проверены; PAN/CVV не принимаются. |
| FORM:sessions-terminate / Завершить сеанс | site-source/local/ajax/lk/info/edit/terminate-session.php:1 | https://prom.myfast.space/local/ajax/lk/info/edit/terminate-session.php | /forms/sessions-terminate | PARTIAL → PARTIAL | AccountActionDriver wired. Checked owner/context action и явный loggedOut реализованы. Реальные source user/session/card records и жизненный цикл аккаунта не проверены; PAN/CVV не принимаются. |
| FORM:document-request / Запросить документ | site-source/local/templates/main/components/bitrix/form.result.new/request-document/template.php:1, site-source/local/ajax/form/request-document-action.php:1 | https://prom.myfast.space/local/ajax/form/request-document-action.php | /forms/document-request | PARTIAL → PARTIAL | DocumentRequestDriver wired. REQUEST_DOCUMENT resolve-by-SID и actual CForm answer IDs реализованы. Dynamic schema/required и события конкретной установленной CForm ещё не проверены; authenticated download документа остаётся отдельным MISSING_IMPLEMENTATION. |
| FORM:payment-card / Привязать карту | site-source/local/components/prom.personal/personal_payment_methods/templates/.default/template.php:1, site-source/local/ajax/lk/payment-methods/add-card-action.php:1 | https://prom.myfast.space/personal/ | /forms/payment-card | LEGACY_REVIEW → LEGACY_REVIEW | AccountActionDriver wired. LEGACY_REVIEW: исходный card capture не является безопасным PSP tokenization flow; поля PAN/CVV не собираются. Новую привязку нельзя объявлять подключённой по наличию payment.session. |
| FORM:payment-default / Сделать карту основной | site-source/local/ajax/lk/payment-methods/change-main-card-action.php:1 | https://prom.myfast.space/local/ajax/lk/payment-methods/change-main-card-action.php | /forms/payment-default | PARTIAL → PARTIAL | AccountActionDriver wired. Checked owner/context action и явный loggedOut реализованы. Реальные source user/session/card records и жизненный цикл аккаунта не проверены; PAN/CVV не принимаются. |
| FORM:payment-remove / Удалить сохранённую карту | site-source/local/ajax/lk/payment-methods/remove-card-action.php:1 | https://prom.myfast.space/local/ajax/lk/payment-methods/remove-card-action.php | /forms/payment-remove | PARTIAL → PARTIAL | AccountActionDriver wired. Checked owner/context action и явный loggedOut реализованы. Реальные source user/session/card records и жизненный цикл аккаунта не проверены; PAN/CVV не принимаются. |
| FORM:checkout / Оформление заказа | site-source/local/templates/main/components/bitrix/sale.order.ajax/main/template.php:1, site-source/local/templates/main/components/bitrix/sale.order.ajax/main/script.js:1, site-source/local/ajax/order/popup-curier.php:1, site-source/order/index.php:1 | https://prom.myfast.space/order/ | /forms/checkout | PARTIAL → PARTIAL | CommerceDriver/dedicated BFF wired. Dedicated CheckoutScreen → BFF options/quote/submit/payment → Sale driver реализован. Нужны actual Sale properties, GAR/provider mapping, delivery/payment configuration и connected acceptance; график Сплита/баллы не вычисляются предположением. |
| FORM:order-cancel / Отменить заказ | site-source/local/components/prom.personal/personal_order_detail/templates/.default/template.php:1, site-source/local/components/prom.organization/organization_order_detail/templates/.default/template.php:1 | https://prom.myfast.space/personal/ | /forms/order-cancel | PARTIAL → PARTIAL | OrderActionDriver wired. Owned Sale cancel/repeat/pay и BFF CAS реализованы. Не проверены реальные заказы/статусы/права/PSP; повтор неизвестного в snapshot SKU отклоняется, пока каталог неполный. |
| FORM:order-repeat / Повторить заказ | site-source/local/ajax/lk/orders/order-repeat.php:1 | https://prom.myfast.space/local/ajax/lk/orders/order-repeat.php | /forms/order-repeat | PARTIAL → PARTIAL | OrderActionDriver wired. Owned Sale cancel/repeat/pay и BFF CAS реализованы. Не проверены реальные заказы/статусы/права/PSP; повтор неизвестного в snapshot SKU отклоняется, пока каталог неполный. |
| FORM:order-pay / Оплатить заказ | site-source/local/components/prom.personal/personal_order_detail/templates/.default/template.php:1, site-source/local/components/prom.organization/organization_order_detail/templates/.default/template.php:1 | https://prom.myfast.space/personal/ | /forms/order-pay | PARTIAL → PARTIAL | OrderActionDriver wired. Owned Sale cancel/repeat/pay и BFF CAS реализованы. Не проверены реальные заказы/статусы/права/PSP; повтор неизвестного в snapshot SKU отклоняется, пока каталог неполный. |
| FORM:callback / Заказать звонок | site-source/local/ajax/catalog/request-a-call.php:1, site-source/local/templates/main/components/bitrix/form.result.new/request-a-call/template.php:1, site-source/local/ajax/catalog/action-request-a-call.php:1 | https://prom.myfast.space/local/ajax/catalog/action-request-a-call.php | /forms/callback | PARTIAL → PARTIAL | FormsDriver/SourceHttp wired. Signed context/revision/submit, source hidden fields, canonical consents и multipart tokens реализованы. Actual CForm/HL schema, accepted source result и downstream CRM/mail на установленном сайте не проверены; receipt не означает доставку сообщения. |
| FORM:buy-one-click / Купить в один клик | site-source/local/ajax/catalog/buy-one-click.php:1, site-source/local/templates/main/components/bitrix/form.result.new/buy-one-click/template.php:1, site-source/local/ajax/catalog/action-buy-one-click.php:1 | https://prom.myfast.space/local/ajax/catalog/action-buy-one-click.php | /forms/buy-one-click | PARTIAL → PARTIAL | FormsDriver/SourceHttp wired. Signed context/revision/submit, source hidden fields, canonical consents и multipart tokens реализованы. Actual CForm/HL schema, accepted source result и downstream CRM/mail на установленном сайте не проверены; receipt не означает доставку сообщения. |
| FORM:rent / Заявка на аренду | site-source/local/ajax/catalog/request-a-rent.php:1, site-source/local/templates/main/components/bitrix/form.result.new/request-a-rent/template.php:1, site-source/local/ajax/catalog/action-request-a-rent.php:1 | https://prom.myfast.space/local/ajax/catalog/action-request-a-rent.php | /forms/rent | PARTIAL → PARTIAL | FormsDriver/SourceHttp wired. Signed context/revision/submit, source hidden fields, canonical consents и multipart tokens реализованы. Actual CForm/HL schema, accepted source result и downstream CRM/mail на установленном сайте не проверены; receipt не означает доставку сообщения. |
| FORM:leasing / Заявка на лизинг | site-source/local/ajax/catalog/request-a-leasing.php:1, site-source/local/templates/main/components/bitrix/form.result.new/request-a-leasing/template.php:1, site-source/local/ajax/catalog/action-request-a-call.php:1 | https://prom.myfast.space/local/ajax/catalog/action-request-a-call.php | /forms/leasing | PARTIAL → PARTIAL | FormsDriver/SourceHttp wired. Signed context/revision/submit, source hidden fields, canonical consents и multipart tokens реализованы. Actual CForm/HL schema, accepted source result и downstream CRM/mail на установленном сайте не проверены; receipt не означает доставку сообщения. В source action-request-a-call указан также для лизинга; соответствие installed CForm/answer IDs требуется проверить, а не предположить. |
| FORM:found-cheaper / Нашли дешевле? | site-source/local/ajax/catalog/form-found-it-cheaper.php:1, site-source/local/templates/main/components/bitrix/form.result.new/found-it-cheaper/template.php:1, site-source/local/ajax/catalog/action-found-it-cheaper.php:1 | https://prom.myfast.space/local/ajax/catalog/action-found-it-cheaper.php | /forms/found-cheaper | PARTIAL → PARTIAL | FormsDriver/SourceHttp wired. Signed context/revision/submit, source hidden fields, canonical consents и multipart tokens реализованы. Actual CForm/HL schema, accepted source result и downstream CRM/mail на установленном сайте не проверены; receipt не означает доставку сообщения. |
| FORM:tour / Записаться на экскурсию | site-source/local/ajax/form/book-a-tour.php:1, site-source/local/templates/main/components/bitrix/form.result.new/book-a-tour/template.php:1, site-source/local/ajax/form/book-a-tour-action.php:1 | https://prom.myfast.space/local/ajax/form/book-a-tour-action.php | /forms/tour | PARTIAL → PARTIAL | FormsDriver/SourceHttp wired. Signed context/revision/submit, source hidden fields, canonical consents и multipart tokens реализованы. Actual CForm/HL schema, accepted source result и downstream CRM/mail на установленном сайте не проверены; receipt не означает доставку сообщения. |
| FORM:business-advice / Консультация для бизнеса | site-source/local/ajax/form/get-business-advice-form-action.php:1, site-source/frontend/h/production.php:1 | https://prom.myfast.space/local/ajax/form/get-business-advice-form-action.php | /forms/business-advice | PARTIAL → PARTIAL | FormsDriver/SourceHttp wired. Signed context/revision/submit, source hidden fields, canonical consents и multipart tokens реализованы. Actual CForm/HL schema, accepted source result и downstream CRM/mail на установленном сайте не проверены; receipt не означает доставку сообщения. |
| FORM:supplier / Стать поставщиком | site-source/suppliers/index.php:1, site-source/local/ajax/form/suppliers-form-action.php:1 | https://prom.myfast.space/local/ajax/form/suppliers-form-action.php | /forms/supplier | PARTIAL → PARTIAL | FormsDriver/SourceHttp wired. Signed context/revision/submit, source hidden fields, canonical consents и multipart tokens реализованы. Actual CForm/HL schema, accepted source result и downstream CRM/mail на установленном сайте не проверены; receipt не означает доставку сообщения. |
| FORM:partner / Стать партнёром | site-source/franchise/index.php:1, site-source/local/ajax/form/partners-form-action.php:1 | https://prom.myfast.space/local/ajax/form/partners-form-action.php | /forms/partner | PARTIAL → PARTIAL | FormsDriver/SourceHttp wired. Signed context/revision/submit, source hidden fields, canonical consents и multipart tokens реализованы. Actual CForm/HL schema, accepted source result и downstream CRM/mail на установленном сайте не проверены; receipt не означает доставку сообщения. |
| FORM:advice / Задать вопрос специалисту | site-source/local/templates/main/components/bitrix/form.result.new/orange-form-ask/template.php:1, site-source/local/ajax/form/orangeAsk-action.php:1 | https://prom.myfast.space/local/ajax/form/orangeAsk-action.php | /forms/advice | PARTIAL → PARTIAL | FormsDriver/SourceHttp wired. Signed context/revision/submit, source hidden fields, canonical consents и multipart tokens реализованы. Actual CForm/HL schema, accepted source result и downstream CRM/mail на установленном сайте не проверены; receipt не означает доставку сообщения. Динамические вопросы/answer IDs WEB_FORM_ORANGE_ASK извлекаются через CForm::GetDataByID; статический пустой список ниже — baseline, а не текущий dynamic schema. |
| FORM:review / Написать отзыв | site-source/local/ajax/reviews/form-review-add.php:1, site-source/local/ajax/reviews/form-review-add-action.php:1 | https://prom.myfast.space/local/ajax/reviews/form-review-add-action.php | /forms/review | PARTIAL → PARTIAL | PublicationDriver wired. Source publication context, ownership, media uploads и операции реализованы. Нет полной пагинации за пределами 200 записей, q-popular и выборочного удаления старых фото; реальные moderation/DB/file handlers не проверены. |
| FORM:order-review / Оценить товар из заказа | site-source/local/ajax/lk/orders/form-review-add.php:1, site-source/local/ajax/lk/orders/action-review-add.php:1 | https://prom.myfast.space/local/ajax/lk/orders/action-review-add.php | /forms/order-review | PARTIAL → PARTIAL | PublicationDriver wired. Source publication context, ownership, media uploads и операции реализованы. Нет полной пагинации за пределами 200 записей, q-popular и выборочного удаления старых фото; реальные moderation/DB/file handlers не проверены. |
| FORM:question / Задать вопрос о товаре | site-source/local/ajax/reviews/form-question-add.php:1, site-source/local/ajax/reviews/form-question-add-action.php:1 | https://prom.myfast.space/local/ajax/reviews/form-question-add-action.php | /forms/question | PARTIAL → PARTIAL | PublicationDriver wired. Source publication context, ownership, media uploads и операции реализованы. Нет полной пагинации за пределами 200 записей, q-popular и выборочного удаления старых фото; реальные moderation/DB/file handlers не проверены. |
| FORM:review-reply / Ответить на отзыв | site-source/local/ajax/reviews/form-review-reply-action.php:1 | https://prom.myfast.space/local/ajax/reviews/form-review-reply-action.php | /forms/review-reply | PARTIAL → PARTIAL | PublicationDriver wired. Source publication context, ownership, media uploads и операции реализованы. Нет полной пагинации за пределами 200 записей, q-popular и выборочного удаления старых фото; реальные moderation/DB/file handlers не проверены. |
| FORM:question-reply / Ответить на вопрос | site-source/local/ajax/reviews/form-question-reply-action.php:1 | https://prom.myfast.space/local/ajax/reviews/form-question-reply-action.php | /forms/question-reply | PARTIAL → PARTIAL | PublicationDriver wired. Source publication context, ownership, media uploads и операции реализованы. Нет полной пагинации за пределами 200 записей, q-popular и выборочного удаления старых фото; реальные moderation/DB/file handlers не проверены. |
| FORM:review-edit / Изменить отзыв | site-source/local/ajax/lk/questions-and-reviews/form-edit-review.php:1, site-source/local/ajax/lk/questions-and-reviews/action-edit-review.php:1 | https://prom.myfast.space/local/ajax/lk/questions-and-reviews/action-edit-review.php | /forms/review-edit | PARTIAL → PARTIAL | PublicationDriver wired. Source publication context, ownership, media uploads и операции реализованы. Нет полной пагинации за пределами 200 записей, q-popular и выборочного удаления старых фото; реальные moderation/DB/file handlers не проверены. |
| FORM:question-edit / Изменить вопрос | site-source/local/ajax/lk/questions-and-reviews/form-edit-question.php:1, site-source/local/ajax/lk/questions-and-reviews/action-edit-question.php:1 | https://prom.myfast.space/local/ajax/lk/questions-and-reviews/action-edit-question.php | /forms/question-edit | PARTIAL → PARTIAL | PublicationDriver wired. Source publication context, ownership, media uploads и операции реализованы. Нет полной пагинации за пределами 200 записей, q-popular и выборочного удаления старых фото; реальные moderation/DB/file handlers не проверены. |
| FORM:review-delete / Удалить отзыв | site-source/local/ajax/lk/questions-and-reviews/action-delete.php:1 | https://prom.myfast.space/local/ajax/lk/questions-and-reviews/action-delete.php | /forms/review-delete | PARTIAL → PARTIAL | PublicationDriver wired. Source publication context, ownership, media uploads и операции реализованы. Нет полной пагинации за пределами 200 записей, q-popular и выборочного удаления старых фото; реальные moderation/DB/file handlers не проверены. |
| FORM:question-delete / Удалить вопрос | site-source/local/ajax/lk/questions-and-reviews/action-delete.php:1 | https://prom.myfast.space/local/ajax/lk/questions-and-reviews/action-delete.php | /forms/question-delete | PARTIAL → PARTIAL | PublicationDriver wired. Source publication context, ownership, media uploads и операции реализованы. Нет полной пагинации за пределами 200 записей, q-popular и выборочного удаления старых фото; реальные moderation/DB/file handlers не проверены. |
| FORM:appeal / Задать вопрос | site-source/local/ajax/lk/appeals/appeals-questions.php:1, site-source/local/ajax/lk/appeals/appeals-text-action.php:1 | https://prom.myfast.space/local/ajax/lk/appeals/appeals-text-action.php | /forms/appeal | PARTIAL → PARTIAL | ServiceDriver wired. Owned order, actual enums, selected items и indexed return/appeal attachments реализованы. Реальные причины/темы/теги, source statuses и сохранение/обработка файлов на Bitrix не проверены. |
| FORM:appeal-order / Проблема с заказом | site-source/local/ajax/lk/appeals/appeals-order-form.php:1, site-source/local/ajax/lk/appeals/appeals-order-form-action.php:1, site-source/local/php_interface/functions.php:1 | https://prom.myfast.space/local/ajax/lk/appeals/appeals-order-form-action.php | /forms/appeal-order | PARTIAL → PARTIAL | ServiceDriver wired. Owned order, actual enums, selected items и indexed return/appeal attachments реализованы. Реальные причины/темы/теги, source statuses и сохранение/обработка файлов на Bitrix не проверены. |
| FORM:appeal-rating / Оценить качество обслуживания | site-source/local/ajax/lk/appeals/appeals-rate-add.php:1, site-source/local/ajax/lk/appeals/appeals-rate-action.php:1 | https://prom.myfast.space/local/ajax/lk/appeals/appeals-rate-action.php | /forms/appeal-rating | PARTIAL → PARTIAL | ServiceDriver wired. Owned order, actual enums, selected items и indexed return/appeal attachments реализованы. Реальные причины/темы/теги, source statuses и сохранение/обработка файлов на Bitrix не проверены. |
| FORM:return / Возврат товаров | site-source/local/ajax/lk/returns-products/returns-product.php:1, site-source/local/ajax/lk/returns-products/action-returns-product.php:1, site-source/local/php_interface/functions.php:1 | https://prom.myfast.space/local/ajax/lk/returns-products/action-returns-product.php | /forms/return | PARTIAL → PARTIAL | ServiceDriver wired. Owned order, actual enums, selected items и indexed return/appeal attachments реализованы. Реальные причины/темы/теги, source statuses и сохранение/обработка файлов на Bitrix не проверены. |
| FORM:subscription / Подписка на рассылку | site-source/local/templates/main/footer.php:1, site-source/local/ajax/subscription/subscription.php:1 | https://prom.myfast.space/local/ajax/subscription/subscription.php | /forms/subscription | PARTIAL → PARTIAL | FormsDriver/SourceHttp wired. Signed context/revision/submit, source hidden fields, canonical consents и multipart tokens реализованы. Actual CForm/HL schema, accepted source result и downstream CRM/mail на установленном сайте не проверены; receipt не означает доставку сообщения. |
| FORM:product-notify / Сообщить о поступлении | site-source/local/ajax/catalog/action-add-to-waitlist.php:1 | https://prom.myfast.space/local/ajax/catalog/action-add-to-waitlist.php | /forms/product-notify | PARTIAL → PARTIAL | PublicationDriver wired. Source publication context, ownership, media uploads и операции реализованы. Нет полной пагинации за пределами 200 записей, q-popular и выборочного удаления старых фото; реальные moderation/DB/file handlers не проверены. |
| FORM:notification-preferences / Настройки уведомлений | site-source/local/components/prom.personal/personal_notifications/templates/.default/template.php:1, site-source/local/components/prom.organization/organization_notifications/templates/.default/template.php:1, site-source/local/ajax/lk/notifications/notifications.php:1 | https://prom.myfast.space/local/ajax/lk/notifications/notifications.php | /forms/notification-preferences | PARTIAL → PARTIAL | ProfileDriver wired. Actor-owned CUser/адресные записи и контакты с challenge реализованы. Реальные CUser/AddressDeliveryUsers/подписки, OTP и совместная фиксация GAR sidecar с source DB не проверены. |

---

# 7. MENU PARITY

Реальный source/mobile реестр: [menu.md](parity/menu.md); 40 глобальных пунктов после явного удаления владельцем быстрого заказа, 23 пункта account-меню, 226 узлов каталога. Соцсети footer восстановлены отдельными ссылками. Приёмка переходов требует browser-проверки текущего export.

Все значимые web-разделы должны быть доступны из mobile navigation.

Ни одна страница не должна быть потеряна только потому, что она не помещается в bottom navigation.

Secondary content хранится в global menu.

---

# 8. HOME REQUIREMENTS

Главная должна включать реальные и полезные блоки.

Предпочтительная иерархия:

1. App header.
2. B2C/B2B context.
3. Location.
4. Search.
5. Compact hero.
6. Categories.
7. Product section.
8. B2B.
9. Production.
10. About/trust.
11. Product sections.
12. Projects.
13. Useful information.

Не использовать без пересмотра:

- «Покупать проще, когда всё рядом»;
- «Что планируете делать?»;
- «От выбора до получения».

---

# 9. PRODUCT CARD REQUIREMENTS

Logical slots:

- image;
- badges;
- manufacturer;
- title;
- price;
- old price;
- discount;
- stock;
- payment teaser;
- delivery teaser;
- cart action.

Cards одного ряда:

- title aligned;
- price aligned;
- payment block aligned;
- delivery aligned;
- CTA aligned.

---

# 10. PDP REQUIREMENTS

Обязательно:

- gallery;
- product code;
- title;
- manufacturer/brand;
- rating;
- reviews;
- questions;
- favorite;
- compare;
- price;
- old price;
- discount;
- stock;
- warehouses if available;
- location;
- delivery;
- add-to-cart;
- quantity;
- characteristics;
- description;
- documents;
- reviews;
- questions;
- related products.

Дополнительные actions переносить, если существуют:

- one-click;
- cheaper;
- leasing;
- rent;
- quote/request.

---

# 11. CART REQUIREMENTS

- global access;
- badge;
- items;
- quantity;
- remove;
- current price;
- discounts;
- coupon;
- total;
- checkout.

---

# 12. CHECKOUT REQUIREMENTS

Первый контекст:

- Для себя;
- Для организации.

Далее:

- contact;
- settlement;
- address;
- delivery;
- payment;
- coupon;
- totals;
- confirmation.

Все реальные способы delivery/payment определять из source code.

---

# 13. LOCATION

Свободный ввод не является выбранным населённым пунктом.

Хранить structured entity.

Отделять:

- Settlement;
- ServiceRegion;
- Warehouse;
- DeliveryAddress.

---

# 14. B2C

Сохранить:

- orders;
- favorites;
- comparison;
- waiting list;
- reviews;
- questions;
- appeals;
- returns;
- addresses;
- payment methods;
- notifications;
- viewed products.

---

# 15. B2B

Сохранить:

- organizations;
- active organization;
- B2B cart;
- B2B orders;
- procurement;
- quote request;
- documents;
- EDO;
- manager interaction.

---

# 16. PROCUREMENT

Основной flow:

«Есть список потребности?»

Поля:

- имя;
- телефон;
- email;
- компания;
- ИНН при необходимости;
- населённый пункт;
- комментарий;
- attachments;
- consent.

Quick order по артикулам удалён по прямому поручению владельца от 12.09.2026. Старый URL перенаправляется на /procurement. Название действия: «Отправить заявку на просчет». ИНН отображается без слова «необязательно»; required-валидация не меняется.

---

# 17. CONTENT PAGE RULE

Если web-page содержит 8 смысловых блоков, mobile не может содержать 2 и называться parity.

Mobile может:

- объединить;
- переставить;
- спрятать secondary content в accordion.

Но смысл и функции должны сохраниться.

---

# 18. EXTERNAL BLOCKERS

Разрешённые статусы:

`BLOCKED_BY_EXTERNAL_ACCESS`

только если:

- UI flow реализован;
- adapter реализован;
- contract реализован;
- configuration documented;
- error handling реализован;
- известно, какие credentials/access нужны.

Запрещено использовать этот статус как оправдание отсутствующего кода.


## 19. Полный исходный бриф и реестры

Полный принятый recovery-промпт: [MASTER_PROMPT_RECOVERY.txt](parity/MASTER_PROMPT_RECOVERY.txt).
Он сохраняет все 48 разделов; сокращённые списки этого файла не заменяют полный бриф.
Детальные реестры ведутся в `docs/parity/pages.md`, `forms.md`, `functions.md`,
`integrations.md`, `menu.md`. Итог текущего public/source inventory:4434 URL,75 route families,68 form definitions,140 function rows,24 integration groups; private DB content отдельно не проверен.

`LEGACY_REVIEW` не означает разрешение удалить функцию. `BLOCKED_EXTERNAL` — краткое
обозначение внешней зависимости; обязательно указать точную причину
`BLOCKED_BY_EXTERNAL_ACCESS` или `BLOCKED_BY_CREDENTIALS` и доказать готовность UI,
adapter, contract, конфигурации, обработки ошибок. Отсутствующая реализация не становится блокером доступа.


## 20. Интеграции и checkout source decisions

24 integration groups, 17 CRM method mappings: [integrations.md](parity/integrations.md), [integrations.json](parity/integrations.json). Это не число работающих подключений.
Source checkout audit: [checkout-source.md](parity/checkout-source.md). Подтверждены PERSON_TYPE 1/2, online 14, receipt 17, invoice 16, региональные delivery restrictions. Source coupon controller содержит дефекты; перенос строится на Sale manager, а не на вызове отсутствующего метода.

## Recovery02: полевая сверка форм

Общий статус68 форм остаётся65 PARTIAL/3 LEGACY_REVIEW, connected accepted0. Before-recovery counts сохранены. 166/166 прежде не аттестованных controls прошли отдельный source review; подробные9 статусов и evidence: [field-mapping-review.md](parity/field-mapping-review.md), [JSON](parity/field-mapping-review.json). 6 controls исправлены по4 дефектам. Это не массовая аттестация runtimeMappingImplemented; отдельные dynamic/legacy/checkout/validation gaps сохранены. Targeted14 mobile/13 BFF/30 PHP PASS; full161 server/87 mobile/375 PHP assertions и37lint PASS.

## Recovery03: уточнение поля вопроса и commented checkout

Minimum5 в question/question-edit реализован на клиенте/BFF/signed PHP. Targeted15 mobile/14 BFF/TypeScript PASS; PHP47/47 и ReviewEditMedia30/30 PASS; PHP08 total430 assertions/38lint. В166-row review теперь8 исправленных controls по5 дефектам;2 delivery-date/time имеют COMMENTED_SOURCE/LEGACY_REVIEW (template.php310–394, June2025), а не MISSING active functionality. Existing-media preservation реализован и проверен моделями; selective previous-media removal остаётся PARTIAL. Остальные статусы source/live разделены; baseline сохранён.


### Focused cooperation06 — bounded update12.09.2026
Сотрудничество теперь показывает5существующих сценариев вместо3, source routes сохранены. Поля/consents/handlers не изменены; upload progress и File/Blob чтение восстановлены в approved procurement; supplier/partner ожидают текущий buyer context. Source counts/parity statuses не повышаются: real Bitrix/CRM/mail acceptance ещё BLOCKED_BY_EXTERNAL_ACCESS. Подробная source/web/mobile сверка и39пунктов: `parity/COOPERATION_PAGE_06.md`.


### Focused delivery07 — ограниченная область

Страница доставки содержит четыре интерактивных способа получения, инфографику стоимости и срока, существующий GAR picker, 18 реальных точек компании и динамический переход в корзину. Сохранены исходные условия и 73 утверждённые строки. Сверка всех 71 пунктов: parity/DELIVERY_PAGE_07.md. Q&A использует optional relatedLink без общей ссылки под группами ответов.

Общие статусы интеграций и количество функций не повышаются. Выбор части позиций в корзине остаётся нереализованным (пункт 37; уточнение scope ещё не получено). Наличие описания на странице не закрывает этот пробел.


Уточнение подачи доставки после релиза08: по прямому запросу владельца памятка стройплощадки — обычный список из семи пунктов, без checkbox и декоративной схемы. Данные не удалены; это разрешённое изменение presentation. Карточки плательщиков выровнены, условия оплаты сохранены. Остальные статусы parity не изменяются.


## Payment13 — 12.09.2026

Payment13: восстановлены6описаний способов, B2C/B2B, открытыйdata disclosure,8схем иbuyer routes. Полная проверка72пунктов в parity/PAYMENT_PAGE_13.md, copylock в PAYMENT_MASTER_PROMPT.txt. UI не закрывает livepayment parity; СБП иlegacyPAN остаются явно ограниченными.


## Payment14 — компактные ленты и корзина

Новый запрос владельца заменяет прежнее требование вертикальной подачи коротких схем оплаты: сделать горизонтальные ленты, убрать пустое пространство. Дополнительно уплотнить блок личной/корпоративной корзины. Согласованный текст, контексты и действия сохранить. Длинный процесс 01–05 остаётся вертикальным. Только PaymentPage; соседние страницы, архивы HTML и боевой сайт не изменять. Статус: VERIFIED UI, публикация v14.


Payment14 опубликован: v0.10-20260912-14, mobile 2d61807. На локальной и публичной версии прошли по 571 проверке страницы и 98 проверок вёрстки на четырёх ширинах; JS-ошибок нет. TypeScript и web/iOS/Android export прошли. 11 соседних маршрутов сохранились, Delivery/Cooperation визуально идентичны, ZIP-архивы неизменны. Защищённые 82 файла, общие процессы и HTTP совпали. Только собственный сервис обновлён. Отчёт: parity/PAYMENT_PAGE_14.md. Ожидается визуальный отзыв владельца.


## Payment15 — условия счёта и лизинг

По тексту владельца от 12.09.2026 в разделе юрлиц: счёт оплачивается в течение 3 рабочих дней, продление согласуется с менеджером; отгрузка в течение суток после оплаты, кроме товаров под заказ. Добавить отдельную оплату в лизинг: ежемесячные платежи, сумма от 100 000 до 30 000 000 ₽, заявка после регистрации юридического лица. Это новое дополнение к COPY LOCK. Переход — в существующий кабинет организации. Условия предоставлены владельцем; новая платёжная интеграция не создаётся. Сохранить вёрстку v14 и остальные страницы.


Payment15 опубликован: v0.10-20260912-15, mobile 8562591. По 437 проверок локально и публично на четырёх ширинах; TypeScript и web/iOS/Android export прошли. Согласованные сроки оплаты/отгрузки и условия лизинга добавлены, переход в кабинет организации проверен. Публичный тест уточнён: дожидается завершения переключения контекста вместо немедленного чтения старого состояния. Проверено 492 файла по манифесту; резервная v14 и копия собственной базы сохранены. Боевые 82 файла, процессы и HTTP неизменны. Отчёт: parity/PAYMENT_PAGE_15.md.


## HTML «Оплата» — завершено

По запросу владельца Payment v15 выгружен в адаптивный HTML для сайта, по образцу доставки. Архив /Users/prom23/Downloads/Служебные страницы/оплата.zip: 12 файлов, 35400 байт, SHA256 f5e5cb8808aefa3e36771665cb6f48f482f219010ffa8faf57a6e5e9a45c895b. Автономный просмотр, content.html, для-вставки.html, CSS/JS/config, подключение Битрикс, лицензия, инструкция и манифест. 521/521 браузерных проверок; CRC и хеши совпали. Все утверждённые тексты сохранены; корзина без выдуманного количества, счётчик подключается к шаблону, оба раздела B2C/B2B видны. Внешние ссылки и кабинет используют пути Битрикс, FAQ имеет контактный fallback. Страница требует UTF-8; это указано в инструкции. Установка на Битрикс, PHP и реальные платежи не выполнялись. Архивы доставки и сотрудничества неизменны. Приложение и сервер не менялись.


## Оформление заказа 16 — текущая задача

Создать страницу /pages/checkout по образцу утверждённой доставки и полному новому тексту владельца. Пять последовательных шагов, равная видимость B2C/B2B, H1/H2/H3/H4, обычные списки, ссылки на доставку/оплату. COPY LOCK: parity/CHECKOUT_GUIDE_COPY.json. Заявка на лизинг в source требует product-id: CTA открывает объяснение выбора товара и регистрации организации с действующими маршрутами, не пустую неподключённую форму. Только информационная страница и её подключение; настоящий checkout, формы, оплата, Delivery/Payment не меняются.


Оформление заказа 16 опубликовано: /pages/checkout?v=16, релиз v0.10-20260912-16, mobile 4e23710. 341/341 локально и 341/341 публично на четырёх ширинах, без JS-ошибок; TypeScript и экспорт web/iOS/Android прошли. Все пять шагов и COPY LOCK сохранены. Проверены ссылки, возврат, глобальное меню, пояснение заявки на лизинг и маршруты каталога/организации. 11 соседних маршрутов совпали; доставка и сотрудничество визуально идентичны. Проверено 492 файла по манифесту, резервная v15 и собственная база сохранены. Боевые 82 файла, процессы и HTTP совпали до/после. Только собственный preview service обновлён. Отчёт: parity/CHECKOUT_GUIDE_16.md. Ожидается отзыв владельца.


## HTML «Оформление заказа» — завершено 13.09.2026

Страница v16 выгружена для мобильного и десктопа. Архив: /Users/prom23/Downloads/Служебные страницы/оформление заказа.zip. 11 файлов, 20188 байт, SHA256 674cefa41fb2b75a52ff0a35a4b2134ad749b8f8e53180a3409b0eb9b8b9788e. Внутри автономный index.html, фрагмент, вариант для вставки, CSS/JS/config, подключение Битрикс, инструкция, отчёт и манифест. Все пять шагов и тексты сохранены; окно лизинга имеет маршруты каталога и организации, возврат/Escape и запасной вариант без JS. 354/354 браузерных проверок, CRC и SHA256 совпали. Три предыдущих архива неизменны. Приложение и сервер не менялись; PHP и установка на живой сайт не выполнялись.


## Возврат товаров 17 — 14.09.2026
Новый запрос: подробная страница по RETURNS_MASTER_PROMPT.txt в стиле доставки. Разделить B2C/дистанционную и обычную розницу/недостатки/технически сложные товары/B2B. Сохранить весь полезный текст и формы, проверить повторные заявки и медиа. Не менять боевой сайт, DNS и соседние страницы. Источник текста и COPY LOCK: parity/RETURNS_COPY.json. Реальные регистрации, возвраты денег и обмены без подключённого Bitrix не объявлять проверенными.


## Возврат товаров 17 — опубликовано 14.09.2026
Страница /pages/returns?v=17, релиз v0.10-20260914-17, mobile 1a62ec1. Вкладки B2C/B2B, четыре ситуации с переходами, пять шагов, подробные условия и сроки, контакты претензий и справочные ссылки. 1345 проверок локально и 1345 публично на ширинах 320/390/768/1280, без JS-ошибок. TypeScript и web/iOS/Android export PASS. 13 соседних страниц сохранили текст, доставка и сотрудничество совпали по скриншотам. В коде runtime подготовлены повторные обращения, количество по позиции, 10 медиафайлов на товар и подробности в карточке заявки. 21 Node + 11 mobile form + 40 PHP fixture checks PASS. Реальный PDO-тест фиксации вручения правил пропущен: в CLI нет PDO SQLite. Новый runtime требует исправления небезопасного вывода COMMENT в старых шаблонах; патч из пяти файлов приложен и проверен без изменения source. Реальный Bitrix, продавец конкретного заказа и события вручения правил ещё требуют подключения программистами; это не скрыто за fake success. Подробности: parity/RETURNS_17.md и integrations/runtime/RETURNS-2026.md. Проверены 492 файла релиза, сохранена v16 и резервная база. 82 боевых файла, процессы и HTTP неизменны. Только свой preview-service обновлён. Следующий шаг: отзыв владельца по странице; HTML-архив для Битрикс по отдельному запросу.


## Главная 18 — визуальная подача, 16.09.2026
Референсы магазинов используются только как UX-приёмы. Сохранены 20 source-категорий, обе группы покупателей, карточки/корзины/сравнение/избранное, история и рекомендации, источники производства/компании/блога, доставка/оплата/обращения. Подробнее: parity/HOME_18.md. Визуальная и доступная браузерная функциональность проверены; общая source/runtime parity не объявляется завершённой этим спринтом.

## Главная 19 — в работе, 16.09.2026
Уведомления рядом с телефоном; тексты/фотографии баннеров по запросу; производство, рекомендации, одинаковые цветные ссылки истории/наград/экспорта; заметная кнопка кабинета; автоматическая смешанная товарная лента в конце главной. Сохраняем существующие маршруты, карточки, корзины B2C/B2B и принятые страницы. Каталог содержит 28 реальных товаров: лента подгружает их без повторов и вымышленных позиций. Уведомления ведут в существующий раздел без фиктивного badge. Стили сверены с /frontend/h/ui.php и CSS сайта: фирменный #3d4471, оранжевый акцент, белые поверхности, округления.


## Главная 20 — в работе, 16.09.2026
Первое изображение должно быть внутри баннера; белая полоса товаров под баннером отменена. Из присланной вертикальной строительной сцены встроенным imagegen создан горизонтальный фон; он не объявляется фотографией реального объекта компании. Все три баннера получают разные цветовые спектры градиента: морской, сливовый, зелёный. Согласованный текст и CTA сохраняются. Новое уточнение: популярные товары — вертикальная сетка с раскрытием вниз, остальные подборки не меняются.



## Главная 20 — окончательное уточнение
Вертикальное раскрытие распространяется на обе подборки: «Популярные товары» и «Рекомендуем к покупке». Сразу под второй располагается «Вы интересовались» при наличии реальных просмотров. B2B-блок светлый, с выровненной типографикой и явными CTA. Существующие действия товаров и бизнес-маршруты сохранены. Приёмка и доказательства: parity/HOME_20.md.

## Главная 21 — оттенки градиентов, в работе
Первый синий градиент утверждён и сохраняется. Для цеха выбран тёплый графит #292C2E → #706354 по оттенкам стали и солнечного света; для стройки — стальной синий #18354B → #326B8C по небу и стеклянным фасадам. Меняются только четыре цвета в HomeMarketplace.tsx; фотографии, тексты, размеры, маршруты и функции сохранены.

## Сравнение 22 — в работе
После первого подтверждённого добавления показываем постоянную кнопку «Открыть сравнение» со счётчиком над нижней навигацией. Кнопка занимает собственное место в layout, не закрывает контент, скрыта на самой странице сравнения и при пустом списке. В окне лимита шести товаров — прямой переход к сравнению. Действия добавления/удаления, backend-состояние, таблица и пять основных вкладок сохранены.

## Баннеры 23 — в работе
Новый запрос заменяет старое решение «без таймера»: автоматическая смена баннера через 6 секунд и свайпы в обе стороны. Сохранить фотографии, градиенты, тексты, маршруты и точки навигации. Вертикальную прокрутку не блокировать; добавить паузу, учитывать reduced motion, активность экрана/приложения и взаимодействие пользователя.

## О компании 24 — в работе
Новый запрос: неудобная страница не показывает масштаб опыта, направлений, ассортимента, филиалов и репутации. Переработка только /pages/about. Новая структура: представление, направления деятельности, каталог, производство, сеть филиалов, полная история, проекты, награды, контакт. Источники: sitePages.about/historyMilestones, companyContent, siteContacts, каталог, реальные фотографии производства/филиалов/проектов, company-evidence. Числа первого экрана: год основания 2008, реальные корневые разделы каталога, список контактных городов. Недатированные маркетинговые 10 000+/15+/10+ сохранены как отдельные опубликованные показатели; не объявляются независимой статистикой. Все маршруты и действия доступны, остальные страницы сохраняются.

## О компании 24 — опубликовано 16.09.2026
http://159.253.19.172:18087/pages/about?v=24. Релиз v0.10-20260916-24, mobile 565a835. Перестроена только страница о компании: шесть направлений, 20 разделов каталога, собственное производство, 18 контактных городов с адресами и маршрутами, полная история с 2008 года, три реальных проекта, награды и понятные CTA. Единая типографика и светлая компоновка с оранжевыми акцентами. TypeScript и web/iOS/Android export PASS; 137 браузерных проверок локально и 137 публично на 320/390/768/1280, без JS-ошибок. В первом публичном прогоне проверка изображений выполнялась до завершения загрузки; добавлено ожидание загрузки, повторный прогон PASS. Тексты шести соседних страниц и снимки главной/доставки/сотрудничества совпали. Публичный bundle entry-1c977b8c9c71fb8952381fdf222c6a65.js соответствует локальному. Проверены 494 файла, сохранены v23 и резервная БД. 82 защищённых файла, процессы и HTTP неизменны. Изменений вне mobile/dist в артефакте нет. Физические устройства и production Bitrix не проверялись. Отчёт: parity/ABOUT_24.md. Незавершённых правок в объёме запроса нет; следующий шаг — отзыв владельца. HTML-экспорт этой страницы не запрашивался.

## О компании 25 — в работе, 17.09.2026
Новая редакция по документу владельца «О компании.docx». История — основа повествования: поставщик 2008 → региональная сеть → промышленная модель 2020 → первый цех 2021 → масштабирование → две площадки 2025–2026. Этот новый материал заменяет старую противоречащую хронологию на странице about. Цифры 2/300+/400 млн и производственные показатели взяты из файла владельца, без независимой проверки. Краткая презентация → масштаб → история → производство → четыре направления продукции → сеть → основания доверия и существующие награды → предложение/партнёрство. Подробный каталог и справочник филиалов сохраняются в раскрытиях; формы и маршруты не удаляются. Устаревшие недатированные счётчики v24 заменяются показателями новой редакции. Награды: отдельный файл в приложении не приложен, поэтому используются существующие подтверждённые записи. Сайт, другие страницы, HTML-архивы и защищённый production не менять.

## О компании 25 — опубликовано 17.09.2026
http://159.253.19.172:18087/pages/about?v=25. Релиз v0.10-20260917-25, mobile 14a699a. Страница пересобрана по документу владельца: от поставщика 2008 года к торгово-производственной группе; история расположена перед производством, ассортиментом и географией. Восемь последовательных этапов, новые показатели из документа с атрибуцией, четыре направления продукции, региональная и партнёрская сеть, основания доверия, подтверждённые награды и CTA. Полный каталог, 18 контактных городов и проекты доступны в раскрытиях. По дополнительному запросу встроены три горизонтальные ИИ-иллюстрации этапов 2008/2015/2021; подписи обозначают их как иллюстрации. PNG, точные промпты и инструкция замены — mobile/assets/about-history/. TypeScript и web/iOS/Android export PASS. 157 проверок локально и 157 публично на 320/390/768/1280, JS-ошибок нет; проверены фактические рамки 16:9 и загрузка изображений. Тексты шести соседних страниц и снимки главной/доставки/сотрудничества совпали. Публичный bundle entry-8fe6b0eb366c7280abd9e4e4f9021eb8.js соответствует локальному. Проверены 500 файлов; v24 и резервная база сохранены. 82 защищённых файла, процессы и HTTP неизменны. Нативные устройства и production Bitrix не проверялись. Отчёт: parity/ABOUT_25.md. Незавершённых правок в объёме запроса нет; следующий шаг — отзыв владельца и замена временных иллюстраций собственными фото при их предоставлении. HTML-архив не запрашивался.

## О компании 26 — в работе, 17.09.2026
Владелец просит убрать смысловые повторы и использовать новое описание группы, клиентов, каналов, команды и репутации. Только /pages/about. Удалены повторный блок о группе, четыре повторяющихся основания доверия, повторные CTA и дублирующий FAQ не добавляется. История сохраняет восемь этапов и три подписанные ИИ-иллюстрации; новая информация не меняет дату первого цеха 2021. Производство, команда, ассортимент, пять аудиторий, семь каналов (три группы), география, реальные проекты и награды разграничены. 180 сотрудников — только ООО «ТЕАМ ИНДАСТРИ»; новая награда 2024 — из текста владельца без выдуманного диплома. Фотографии цеха, металлообработки, склада и проектов из имеющихся материалов показываются открыто. Этапы истории и фото плавно появляются при прокрутке, reduced motion отключает эффекты. Все ссылки каталога, контактов, форм, партнёрства, поставщиков и служебных страниц сохранены.

## О компании 26 — опубликовано 17.09.2026
http://159.253.19.172:18087/pages/about?v=26. Релиз v0.10-20260917-26, mobile 222fe3b. По новому тексту владельца убраны повторные рассказы о группе, trust-блок с пересказом производства/комплектации, повторные заявки и абзац франшизы. Повторяющий FAQ не добавлен. История сохранена; отдельно представлены производство, команда, ассортимент, пять аудиторий, семь каналов в трёх группах, география, три проекта и награды. 180 сотрудников относятся к ООО «ТЕАМ ИНДАСТРИ»; награда «Лучший поставщик года — 2024» добавлена по тексту владельца без выдуманного диплома. Десять открытых изображений: оборудование, три подписанные ИИ-иллюстрации истории, цех, обработка металла, склад и три проекта. Схема производственного цикла, компактные показатели, мягкое появление истории/фото с поддержкой reduced motion.
TypeScript и экспорт web/iOS/Android PASS; 186 браузерных + 9 motion-проверок локально и столько же публично, ширины 320/390/768/1280, JS-ошибок нет. Все категории, 18 контактных городов, основные ссылки и клавиатура проверены. Шесть соседних текстов и три снимка главной/доставки/сотрудничества совпали. Публичный bundle entry-5035c2d137cdc78cc1dae7905b00dda5.js совпадает с локальным. Проверено 500 файлов, изменения артефакта только mobile/dist, предыдущая v25 и резервная БД сохранены. 82 защищённых файла, процессы и HTTP неизменны. Физические устройства и production Bitrix не проверялись. Отчёт: parity/ABOUT_26.md. Работа в объёме запроса завершена; следующий шаг — отзыв владельца. HTML-архив не запрашивался.

## О компании 27 — в работе
По уточнению владельца: 350 сотрудников группы компаний «Промышленник» вместо 180 сотрудников ООО «ТЕАМ ИНДАСТРИ» на странице About. Исторические сведения и производственное юридическое лицо сохранены. Заголовки разделов получают цвет brand и оранжевый левый маркер, как на сотрудничестве; выборочные смысловые фразы — brand/bold. Вторичные кнопки с явной светлой поверхностью и рамкой, основные CTA оранжевые, цели 52+. Порядок: проекты → награды → география/филиалы → контакт. Остальные страницы и функции не менять.

## О компании 27 — опубликовано 17.09.2026
http://159.253.19.172:18087/pages/about?v=27. Релиз v0.10-20260917-27, mobile 7864e4c. По прямому уточнению владельца показатель заменён на 350 сотрудников группы компаний «Промышленник». На странице About заголовки разделов и пять смысловых фраз выделены цветом по образцу сотрудничества, добавлены оранжевые маркеры разделов, чёткие вторичные кнопки с заливкой/рамкой и основные оранжевые CTA. Порядок: проекты → награды → география/филиалы → контакты; отдельный якорь «Награды». Изменён только AboutPage.tsx; маршруты, функции и соседние страницы сохранены.
TypeScript и export web/iOS/Android PASS. 190 браузерных + 9 motion-проверок локально и 190 + 9 публично, ширины 320/390/768/1280, JS-ошибок нет. Шесть соседних текстов и три снимка главной/доставки/сотрудничества совпали. Bundle entry-4aeec0399742bae680a1d0c42953994d.js совпадает локально/публично; проверено 500 файлов. Предыдущая v26 и собственная резервная БД сохранены. 82 защищённых файла, процессы и HTTP неизменны. Физические устройства и production Bitrix не проверялись. Отчёт: parity/ABOUT_27.md. Все правки запроса выполнены, далее — отзыв владельца.

## Производство 28 — в работе
Новая страница /information/production по документу владельца «Производство.docx». Восемь цехов на первой площадке и три на второй; названия/адреса площадок не публиковать. Связанные названия удаляются также из About. Использовать имеющиеся фото компании, инфографику 8 + 3 = 11, восемь этапов, реальные испытания, шесть семейств продукции и существующие формы production-request/tour, каталог, документы, видео, проекты. Число сотрудников 180 не возвращать в презентацию: утверждённый на About показатель 350 относится к группе. Производственные показатели использовать с атрибуцией на I квартал 2026. Общие стили и остальные страницы сохраняются.

## Производство 28 — опубликовано 17.09.2026
http://159.253.19.172:18087/information/production?v=28. Релиз v0.10-20260917-28, mobile f8f5359. Новая страница по «Производство.docx»: фотографии на баннерах, показатели, две обезличенные площадки в Краснодарском крае, схема 8 + 3 = 11 цехов, восемь этапов изготовления, шесть семейств продукции, испытания, заявка по ТЗ, экскурсия и контакты. Цветовые заголовки и подложки, ясные кнопки, компактные карточки продукции на телефоне. Использованы существующие фото компании и товаров. Названия площадок также убраны из About; 350 сотрудников группы и порядок наград сохранены. Каталог, формы, видео, PDF, документы, подразделения и проекты доступны.
TypeScript и экспорт web/iOS/Android PASS. 181 браузерная + 9 motion/reduced-motion проверок локально и столько же публично на 320/390/768/1280; ошибок браузера нет. Шесть соседних текстов и три снимка главной/доставки/сотрудничества совпали. Bundle entry-a328b18ec46480337473cb6f1c9338ca.js совпадает локально/публично; 500 файлов проверены, изменения артефакта только mobile/dist. Предыдущая v27 и резервная БД сохранены. 82 защищённых файла, процессы и HTTP неизменны. Заявки не отправлялись, физические устройства и production Bitrix не проверялись. Отчёт: parity/PRODUCTION_28.md. Запрос выполнен; следующий шаг — отзыв владельца. Блокеров нет. HTML-архив не запрашивался.

## Гарантия 29 — в работе
Страница /pages/warranty по тексту владельца: пять шагов, цветовые акценты/подложки, отдельные условия B2C/B2B, кнопка гарантийного обращения в существующую форму appeal. Сохраняются заказы, история обращений, документы, помощь с возвратом и контакты. Редакторские указания исключаются, правовые ссылки проверяются; общий срок гарантии не выдумывается. План: parity/WARRANTY_29.md.

## Гарантия 29 — опубликовано 17.09.2026
http://159.253.19.172:18087/pages/warranty?v=29. Релиз v0.10-20260917-29, mobile 341b3a5. Страница по тексту владельца: схема пяти шагов, цветовые заголовки и подложки, условия для личных покупок и бизнеса в отдельных вкладках, раскрытия юридических подробностей, подготовка материалов, сервис и производители, статус обращения, помощь без заказа и переход к возврату. Кнопка «Гарантийный случай / Запросить гарантийное обслуживание» открывает существующую форму appeal с назначением warranty; особые заголовок, пояснение, редактируемая заготовка и ссылки на заказы/контакты. Изменения общей формы действуют только при purpose=warranty. Обычная форма сохранена. Проверены ссылки на статьи 18–20 ЗоЗПП и 470, 471, 476 ГК РФ; редакторские указания не публикуются.
TypeScript и экспорт web/iOS/Android PASS. 171 браузерная и 7 проверок формы локально и публично, четыре ширины 320/390/768/1280, ошибок браузера нет. Заготовка формы и приоритет серверного черновика проверены на изолированном browser fixture; реальные заявки не отправлялись. Восемь соседних текстов и пять снимков совпали. Bundle entry-a8a2ce466bbd689eb6bf263428f1c1e8.js совпадает локально/публично, проверено 500 файлов, изменения артефакта только mobile/dist. Предыдущая v28 и резервная БД сохранены. 82 защищённых файла, процессы и HTTP неизменны.
Ограничение: сервис загрузки контекста обращений в preview недоступен. Форма показывает ошибку и повтор, не разрешает отправку без подтверждённого контекста; заказы и контакты доступны. Реальный приём обращений production Bitrix не проверен, его доступы не запрашивались. Физические устройства не проверялись. Вёрстка и подключение кнопки завершены; ограничение внешнего сервиса сохранено явно. Следующий шаг — отзыв владельца; работа с внешней интеграцией остаётся за пределами этой страницы. HTML-архив не запрашивался. Отчёт: parity/WARRANTY_29.md.


## Forms 30 — in progress, 17.09.2026
Owner explicitly skipped Bitrix integration after selecting the test site. Implement remaining UI: inline warranty order selection preserving draft, editable initially checked consent boxes on all forms, Write next to Call in global menu. Owner instruction overrides former unchecked defaults. Exact form consent contracts are synchronized; no runtime enabled, no fake submissions or orders. See parity/FORMS_30.md.


## Forms 30 - published, 17.09.2026
Published http://159.253.19.172:18087/more?v=30 (v0.10-20260917-30; mobile f87e6ef + 9d6f076). Inline warranty order picker with search and same-page draft/consent preservation; checked editable square agreements throughout forms, synchronized 69 consent contracts; Write beside Call in menu opens verified email contact. TypeScript/export web+iOS+Android passed; mobile 94, server 163, browser 76 local + 76 public passed. Additional live non-fixture checkbox check passed. 500 files verified; previous release and own DB backup kept. 82 protected files, processes and HTTP unchanged. Owner explicitly skipped Bitrix integration; no claim of connected real orders/submissions. No outstanding work within revised scope. Details: parity/FORMS_30.md.


## Awards 31 override
/pages/awards uses the owner-provided Awards.docx: eight corporate plus two personal awards, correct recipients and stages, separate evaluation/award years. All nine original site photographs retained with captions, zoom and resolution disclosure. Official Kuban registry and company/document/contact routes retained. Browser-tested local and public; see parity/AWARDS_31.md. Broader integration limitations remain unchanged.


## Business 32 — in progress, 17.09.2026
Focused B2B page based on owner DOCX; existing route /information/business. Real imagery, capability infographic, registration/cabinet paths, four assortment groups, vertical procurement timeline, six verified review paraphrases, all 21 FAQs, inline reused procurement form. Conditional claims gated in audit/business-publish-gates.md. Bitrix integration remains skipped by owner; no fake receipt or account. TypeScript/export and 94 mobile tests passed; browser validation in progress. Details: parity/BUSINESS_32.md.


## Business 32 — published, 17.09.2026
Published http://159.253.19.172:18087/information/business?v=32 (v0.10-20260917-32; mobile bf1d6f8). Owner DOCX supplies all major copy: hero, intro, six advantages, registration, four assortment groups, four facts, six supply stages, four scenarios, six verified review paraphrases and all 21 FAQs. Publish-gate exceptions narrow unverified cabinet documents/staff claims, reserve term and outdated review aggregate. Real photos/pictograms, semantic orange accents, actual cabinet preview, search/topics/accordions, vertical reveal with reduced-motion, inline reused procurement form. SEO title/description/OG/canonical and WebPage/BreadcrumbList present; preview remains noindex.
TypeScript and web/iOS/Android export passed; 94 mobile tests; 517 page + 52 form + 4 context/motion browser checks passed both locally and publicly. No browser errors. All submissions/uploads tested with browser interception only, no external message. Eight neighbor texts unchanged, six screenshots byte-identical. Five public image assets confirmed. Public/local bundle entry-36d745221b707c8b4070e7da8a13f17a.js matches. 500 release files verified; previous v31 and own DB backup kept. Protected 82 files, shared processes and HTTP unchanged.
Bitrix integration explicitly skipped by owner; connected authentication/registration/documents/CRM acceptance not claimed. Physical native devices not tested. No unfinished work within revised page scope; next step is owner visual review. PAGE ACCEPTED is not set. HTML archive was not requested. Report: parity/BUSINESS_32.md; claim gates: audit/business-publish-gates.md.


## Business 33 — owner correction, in progress
Owner rejected duplicated narrative, alignment and warehouse-centric company block. This newer instruction authorizes editing/summarizing former DOCX copy. Consolidate repeated assortment/advantages/scenarios and registration descriptions; preserve all 21 legal/commercial FAQs, actual flows, links and form logic. Company block represents the group: since 2008, 350 employees, two production sites in Krasnodar Krai, regional network and export. Remove 12,000 m² warehouse emphasis from B2B overview. Only B2B presentation/content change; integration remains skipped.


## Business 33 — published, 17.09.2026
Published http://159.253.19.172:18087/information/business?v=33 (v0.10-20260917-33; mobile 2d50d98). Latest owner correction authorizes removing redundant DOCX narrative. Consolidated assortment, four purchasing steps, group-wide company story (2008, 350 group employees, two production sites), cabinet, actual projects, reviews, FAQ and request form. Removed warehouse-centric metric and repeated advantages/scenarios. Unified typography, paired equal-height cards/link slots, numeric facts and image proportions. Anchor measurement now updates after expanding FAQ/reviews.
TypeScript and web/iOS/Android export passed. 241 page + 4 context/motion checks passed both locally and publicly at 320/390/768/1280; no JS errors. All 21 FAQ answers and six reviews remain unchanged. Eight neighboring page texts unchanged; five screenshots byte-identical, production photo animation visually reviewed. Public bundle entry-9fec44f0e7d88f9308cc00f49f92ceb5.js matches local export. 500 release files verified; previous v32 and own DB backup retained. Protected files, processes and HTTP unchanged.
Only BusinessPage.tsx and businessPage.ts changed in mobile. Bitrix integration remains explicitly skipped; no real external submission or physical-device testing claimed. All requested implementation/deployment work complete; next step is owner visual review, PAGE ACCEPTED not set. Report: parity/BUSINESS_33.md. No new blockers within this design scope.


## Business 34 — owner priority correction, in progress
Owner rejected v33 hierarchy: supplier advantages first, followed by explicit online B2B ordering, value of site/app and document workflows. Preserve all FAQ/reviews and working destinations. Restore supplier benefits with actual reasons, four organization checkout steps plus specification alternative, account tasks and document/EDO actions. Company/projects/reviews move after purchasing content. No backend integration, fake data or blanket document-download promises. Source: organization/documents/index.php, organization/info/index.php, Documents1C.php, mobile WorkspaceScreen and Orders/OrderDetail screens.


## Business 34 — published, 17.09.2026
Owner rejected v33 information priority. Published http://159.253.19.172:18087/information/business?v=34. Supplier advantages now first: own production, complete supply, technical selection, volume-specific quote, stock/reserve and delivery. Then explicit organization checkout steps and specification alternative; site/app account benefits and document/EDO workflows with actual routes. Catalog, request and FAQ precede company/projects/reviews. All 21 FAQ answers and six reviews unchanged. Mobile commits 1e26b74, 1955bd9; only businessPage.ts/BusinessPage.tsx changed.
TypeScript and web/iOS/Android export passed. 277 page + 4 context/motion checks passed locally and publicly on 320/390/768/1280, no JS errors. Verified section order, six benefits, checkout instructions, document routes, category/company routes, dynamic anchors, registration/consents/validation, keyboard focus and no overflow. Screenshots visually checked. Isolated release v0.10-20260917-34: 500 files verified, previous v33 and own DB backup retained, public bundle matches; protected files/processes/HTTP unchanged. Release manifest changes only within mobile/dist.
Bitrix integration remains skipped by owner; no external submissions or physical native-device tests claimed. No unfinished implementation within this page scope. Next step: owner visual review; PAGE ACCEPTED not set. Detailed report: parity/BUSINESS_34.md. No new blockers.


## Business 35 — revised owner content, in progress
Apply owner attachment 29e80267-d537-4e0d-8957-a4be3e01d7bd/pasted-text.txt as new page content. Benefits first; specification CTA; six supply stages; own fleet/delivery; documents; corporate terms; six account capabilities; six assortment groups; production; revised 15 FAQs; quote form. New copy replaces prior FAQs and presentation, not underlying capabilities. Preserve self-service ordering guidance in cabinet accordion, real forms/routes and consents. Supplier verification sheet provides INN and official registry links; RNP/company status supplied by owner and corroborated via public company search, official live search not independently completed. Production plural retains owner-confirmed two sites without names. Integration remains explicitly skipped.


## Business 35 — published, 17.09.2026
Updated page from owner attachment 29e80267-d537-4e0d-8957-a4be3e01d7bd: http://159.253.19.172:18087/information/business?v=35. New hero, six benefits, specification CTA, six supply steps, fleet/delivery, documents, corporate terms, six account capabilities, six assortment groups, production, revised 15 FAQs and quote form. Source copy preserved except production plural retains previously owner-confirmed two unnamed sites. Self-service ordering retained in cabinet accordion; supplier sheet includes INN and official registry links. Prior FAQs replaced by explicitly revised owner content. Underlying forms/routes preserved.
Mobile commit 6c787bf; changed businessPage.ts, BusinessPage.tsx and business-only form labels/alignment in ProcurementScreen.tsx. TypeScript and web/iOS/Android export passed. 375 page + 52 form + 4 context/motion checks passed locally and publicly at 320/390/768/1280; no JS errors. Form upload/submit tests intercepted in browser; no real external submission. Photos, mobile layouts and wide alignment visually reviewed. Isolated v0.10-20260917-35 verified 500 files, public/local bundle matches, previous v34 and own DB backup retained; protected files/processes/HTTP unchanged.
Bitrix integration remains skipped by owner; physical-device acceptance and live official registry lookup not claimed. All requested implementation and deployment complete; next step owner visual review, PAGE ACCEPTED not set. Report: parity/BUSINESS_35.md. No new blockers in this page scope.


## Franchise 36 — scoped revised owner brief
Franchise content replaces obsolete source marketing copy. Six confirmed active cities: Minsk, Tyumen, Irkutsk, Tbilisi, Astana, Yerevan. Closed cities and construction projects are excluded from partner network. Eight FAQ answers retained; store-domain implementation promise narrowed pending technical verification. New partner fields: country, region, business state, warehouse state (yes/no/planned), interests, about. Original company/INN and warehouse address/phone/schedule remain available. International prospect region is not shipping location. Source PHP requires legacy fields and lacks new fields: connected handler compatibility remains a production gate, not falsely accepted.


## Franchise 37 — owner correction, in progress
Natural assortment copy; all network points explicitly active. Owner replaces Astana with Almaty and adds Gudauta (Abkhazia) and Luhansk. Active network now eight cities. Separate selected-city outline from uniform active markers; numbered map/list controls, readable status on every card. Existing catalogue destinations, forms and integration boundary preserved.


## Franchise 38 — owner simplification, in progress
Owner explicitly removes lifting-equipment assortment card, repeated selected-city detail (Minsk / Belarus / active partner) and all Works labels. Preserve all eight locations and map/list selection. Remove combined warehouse/lifting card from this page only; other catalogue sections and backend remain available. Retain four correctly aligned category links/images. Latest request supersedes visible status labels required in v37.


## Brands 39 — focused sprint, in progress
Scope: /brands/, 15 brand entities/details, original logos, alias search/sort, actual brand/category products, SEO/initial HTML. Do not redesign other pages. User explicitly invokes brand skill; read logo/consistency references. Re-read source brands/index.php, frontend/h/brands.php, ui.php, prom:brands.list class/template, brands-menu.php, Brends.php, catalog/brands.php and urlrewrite. HL4 uses UF_NAME/XML_ID/FILE/DESCRIPTION/SORT/DEF and UF_LINK for own detail links; list currently filters >UF_FILE 0. Existing catalog brand route retained.
Public source on 18.09 contains only Fubag/Inforce/Ryobi, contrary to approved 15; source archive excludes assets and HL data. Local product snapshot has 28 products, four named brands and one unspecified. Asked owner asynchronously for authoritative HL4/product export URL. This is a data gate, not permission. No fabricated logos, HL IDs, counts or empty-inventory assertions. Approved copy becomes presentation enrichment of HL entities, not a second hardcoded entity list. Source catalog PROP_368 remains sole brand property; normalization must retain Lebedyan products under STROYMASH. Preview stays noindex; production brand canonical/index strategy documented separately. Build full scoped implementation and verify with test fixtures while source data is pending; do not publish incomplete brand entities.

### Brands 39 — implemented, source acceptance pending
Directory/detail/catalog-brand routes, alias search, 1/2/3 grid, own-brand emphasis, shared product cards/filter sheet, dynamic categories/counts/pagination, canonical/initial HTML/Brand JSON-LD implemented. Removed demo directory and its legacy public-content copy. Snapshot/region limitations match existing catalog. Required real-data audit for all 15 entities/logos/product bindings is BLOCKED_BY_EXTERNAL_ACCESS: public source publishes three excluded demo brands, archive has no HL rows or uploads. Do not treat fixture acceptance or source-copy approval as published brand data. Report: parity/BRANDS_39.md.


## Brands 39 — latest owner scope override
Owner now explicitly requests a simple Brands page using all approved descriptions and logos found online. Publish an editorial brand directory with details; HL4 import is optional and no longer blocks this scope. Preserve canonical names, original official logos, alias search and existing visual system. Unknown product bindings/counts are omitted, never represented as zero stock. Keep HL4 integration code for later. Only isolated preview may be deployed; visual acceptance remains with owner.


## Brands 39 — published, 18.09.2026
Published http://159.253.19.172:18087/brands/?v=39 under the latest owner-approved simplified scope. Directory and 14 canonical details use exact approved descriptions and reviewed original logos, own-brand emphasis, alias search/alphabet sort, responsive aligned cards and shared shell. Initial HTML, canonical and Brand structured data are present; preview remains noindex. No fake HL IDs, product counts or zero-inventory claims. Optional HL4 product integration remains implemented but deferred.
Mobile commit 221d73b. TypeScript/all-platform export passed; 178 server + 97 mobile tests. Real browser checks: 156 local + 156 public at 320/390/768/1280, no JS errors. All published logos/links, initial HTML, aliases, copy, canonical/schema, CTA, legacy menu route and shared catalog price validation passed. No form submissions or physical-device acceptance claimed. Public bundle entry-9e6356d606acfa1cf0bd74d7bdbc2311.js matches export. Isolated release v0.10-20260918-39: 560 manifest files verified; previous v38 and own DB backup retained; protected files/processes/HTTP unchanged.
One open content item: GEKA is not published because the precise trademark/logo could not be verified among unrelated namesakes. Its approved copy remains preserved; owner was asked for exact website. Other 14 brands are complete and published. Next step: owner visual review and GEKA identity clarification. PAGE ACCEPTED not set. Report: parity/BRANDS_39.md; logo provenance: data/brands/assets.json; public evidence: parity/evidence/brands39/browser-public.json.


## Brands 40 — uniform original logos, in progress
Owner rejects three blue-backed logos. Use positive original artwork on one white LogoFrame for all brands, in directory and detail/initial HTML. Promyshlennik black positive logo and TeaM orange/gray vector sourced from owner original PDF/Illustrator files in Downloads; Alumet blue vector sourced from official catalogue cover. No trademark recoloring or redrawing. Updated asset filenames prevent stale cached white variants. Native inline SVG IDs are namespaced by brand to prevent cross-logo clipping collisions; original public SVG bytes preserved. No changes to neighboring pages, copy, product integrations or pending GEKA identity. Visual acceptance remains pending.


## Brands 40 — published, 18.09.2026
Published http://159.253.19.172:18087/brands/?v=40. All 14 published brand logos now use uniform white frames, including own-brand cards and detail/initial HTML. Positive originals replace three reverse white variants: Promyshlennik from owner logo sheet, TeaM from owner orange/gray Illustrator master, Alumet blue from official catalogue. Shapes/colors preserved; source provenance and hashes recorded. Fixed inline SVG ID collisions in native/web bundled renderer. Mobile commit 406e6ec.
TypeScript/all-platform export and eight focused brand tests passed. Local browser: 174 checks passed at 320/390/768/1280; screenshots visually reviewed. Release v0.10-20260918-40 verified 563 files, previous v39 and own DB backup retained, public bundle matches; protected host files/processes/HTTP unchanged. Public visual verification recorded in parity/evidence/brands40. GEKA identity and optional product integration remain deferred from v39. No owner visual acceptance claimed; next step owner review. Report: parity/BRANDS_40.md.

Public v40 browser verification: 174/174 passed, no JS errors; desktop/mobile screenshots reviewed.

## Legal 41 — latest approved document requirement
Use the complete owner-approved 01.10.2026 editions of Privacy, Processing Consent, Cookie Policy and Recommendation Rules. Source provenance and internal implementation matrix: docs/legal41. Document 05 controls notices beside registration, B2C/B2B checkout, file/address/payment inputs, support forms, recommendation/footer and cookie settings. Do not publish matrix/editorial instructions. Policy is informational; processing, offer and marketing must remain distinct. New unchecked defaults supersede v30 prechecked consent. Optional tracking/history/personalization must respect stored choices and withdrawal, with no loss of basket or fake integration success. Production facts and external integration remain explicitly unverified; user still skips Bitrix integration.

## Legal42 — complete 00–13 source package
Seven public legal documents and aliases, purpose-specific form copy, separate advertising/distribution choices, public claims channel, independent email/SMS service/marketing preferences, partial cart selection and correct B2C/B2B legal context are required. Preserve approved source wording and provenance. Unknown stock uses request CTA; real saleMode mapping must be authoritative. Actual seller, legal version/hash/snapshot and signed B2B contract are required before confirmed order. No artificial checkout processing checkbox. All 46 technical sections have individual status in legal42/IMPLEMENTATION_AUDIT.md; production systems and integration deferred by owner must not be marked verified.


## Legal43 — full route/form audit
Owner requests every page/form reconciled to FINAL 00–13. Registry: legal43/inventory.json (456 concrete routes, 68 forms). Qualified shipment/reserve/invoice terms, personal-purpose IP distinction, seller/version guide, alias-specific consents, in-place return selection, transfer/tracking context, public alternative claim channels, legal aliases/footer and B2B contracts are required. Preserve all commerce capabilities and privacy defaults from Legal42. Integration remains explicitly skipped; UI fixtures are not proof of live transactions.

## UX44
Checkout final total updates automatically for selected goods, delivery and discounts, with no calculate CTA or stale payable amount. Inline playback on production, article and customer video surfaces; official Rutube social channel. Requisites telephone/email actions and exact-data DOCX. Universal business request with optional files/INN/address/deadline, existing source validation and a dedicated processing purpose. Preview release retention every other successful activation, keeping rollback. External integration remains skipped.


## UX45 — latest form requirement
Owner now requires visible independent checkboxes for processing consent and policy acknowledgement in every form, plus offer acceptance in personal checkout. This replaces contradictory earlier Legal42/43 checkbox presentation rules, without rewriting approved legal documents or changing independent optional marketing/publication. Use one compact responsive component (20px square, 14/20 body, 13/18 links, 44px interactive targets). Client/server must reject missing required choices; B2B keeps its individual contract.


## UX46 — owner requirements, implementation complete / verification in progress
Same menu on home, catalog, product, cart, checkout, content, legal, forms and account: burger/logo/bell/phone, city, buyer tabs, search. Business mode adds exact owner explanation and organization selection; internal-page title/back/share preserved below. Duplicate local switches removed. B2B gets Buy, separate basket, Buy by invoice and business account with orders, invoices/documents, company details, staff and EDI. Quote/custom actions remain for explicitly request-only goods. Integration still skipped; no external success simulation in published code.


## Final release — 18.09.2026
Published v0.10-20260918-46-1: http://159.253.19.172:18087/?v=46.1. Mobile commits a1810ec +3c58590. Final public browser: 1009 navigation/header/purchase checks plus 41 invoice checks at320/390/768/1280; no JavaScript errors or live order submissions. Direct business-account link and320×568 form also pass. Final patch adds explicit selected-state accessibility; local focused253 checks pass after the patch, in addition to933 baseline navigation +41 invoice checks. Screenshots reviewed. TypeScript/all-platform export and108 mobile/190 server tests pass.
Bundle entry-e40d770781659acc65f2af83b1d3ff6f.js matches export byte-for-byte; SHA256 da5dc118e3694c14bf9a892d5ff470b041900337d5682d389128a14e628f6d3e. Archive SHA256 c895411f1885f77655ae5aa3e2cc0dd05b3af40c0a8e632deeb374b44661aac4;566 payload files plus manifest verified. Protected production snapshot unchanged. Primary46 skipped cleanup; following patch46-1 triggered configured every-other-release cleanup, removing44/45 release/archive pairs (1075459648bytes), retaining46/46-1 and database backups.
All authorized UI/navigation work complete. External Bitrix integration remains deliberately disabled; actual identity verification, live order/invoice issuance and physical native device acceptance are not claimed. Next step owner visual review; ACCEPTED not set.


## UX47 — latest owner header requirement
Fixed shared navigation: logo/menu/notifications/phone plus one city/search row. Buyer mode and organization selection sit below in scrolling content, never persist in the fixed header. City names have more space and up to two lines. All existing location/search/context/cart capabilities remain; business explanation unchanged. Applies to primary content/list/form screens and empty states; no extra switches in nested rails or notifications.


## UX47 — завершено,18.09.2026
Опубликована версияv0.10-20260918-47: http://159.253.19.172:18087/?v=47. Mobile143fd57. Поиск рядом с расширенным двухстрочным городом; компактные режим покупателя, выбор организации и пояснение находятся в прокручиваемом содержимом. Сохраняются функциональность и выбранный контекст.
TypeScript/экспорт web+iOS+Android/108 mobile tests PASS. Финальные проверки:966 локальных и960 публичных, ширины320/390/768/1280 (320×568),0 JS errors. Дополнительно длинное название города/UI fixture, checkout scroll и сохранение текста формы прошли320/390/1280. Скриншоты просмотрены; живых заказов/обращений не было.
566 payload hashes плюс manifest проверены. Public bundle entry-c91656d33c5d0b20ab9a17f5d0032f6e.js совпадает побайтно; защищённый сайт не изменился.46-1 и backup собственнойБД сохранены, очистка по cadence на этом выпуске не выполнялась. Интеграция Битрикс по-прежнему пропущена. Следующий шаг — визуальная оценка владельца; ACCEPTED не выставлен. Report:ux47/REPORT.md.

## UX48
Owner requests longer search without reserved blank city space. Use intrinsic city width bounded42%, preserve44px target/two lines/full accessible label. Verify short, Saint Petersburg, long hyphenated settlement and longest66-character local GAR record at320/390/1280.


## UX48 - published and verified, 18.09.2026
Release v0.10-20260918-48: http://159.253.19.172:18087/?v=48. Mobile commits5f93102+cb82c30. Intrinsic city width capped42%, search fills remainder, icons keep size. Saint Petersburg city slot156px instead of240px on desktop, freeing84px for search. No logic or data changes.
TypeScript/all-platform export PASS. Local and public each12 city/viewport cases plus3 search flows at320/390/1280, zero JS errors. Tested short, long hyphenated and66-character GAR labels using UI-only fixtures, reviewed screenshots. Complete name remains in picker and accessibility; extreme labels truncate to two lines on small screens. No live submissions/native-device acceptance claimed.
566 payload files plus manifest verified; public bundle matches local and protected host snapshot unchanged. Retention cadence removed46/46-1 release/archive pairs (1075559024bytes), keeping47/48 and DB backups. Integration remains skipped. All authorized work completed; next step owner visual review, ACCEPTED not set.

## UX49
Hide personal/business/organization/explanation block in Favorites and editorial menu pages: More, SitePage (About/Awards/Franchise/Warranty/etc.), Information (Production/Business/Contacts/etc.), Legal, Brands directory/detail, Blog and Article. Keep controls for home/catalog/PDP/cart/checkout/forms/account/service and catalog-brand listing. Preserve favorites and selected buyer/organization across navigation; no feature/data removal.


## UX49 - published and verified, 18.09.2026
Release v0.10-20260918-49: http://159.253.19.172:18087/pages/about?v=49. Mobile1f3b075. Favorites and editorial/menu pages no longer render buyer/organization/explanation prefix. Shared header/search/city, saved favorites and buyer context remain. Shopping/form/account controls and local warranty-rule tabs are preserved.
TypeScript/all-platform export PASS.119 local and119 public navigation checks at390/1280,0 JavaScript errors; populated favorites, content routes, editorial-brand redirect, business context restoration and personal content views verified. Screenshots reviewed. No live orders/forms submitted, native physical-device testing not claimed.
566 payload hashes plus manifest verified; public bundle matches export and protected-host snapshot unchanged. Previous48 and own DB backup retained; cadence cleanup not due on49. External integration remains skipped. All authorized work complete; next step owner visual review, ACCEPTED not set.


## UX50
About hero uses original owner exhibition photograph without crop/face edits. Preserve people/equipment and approved company heading/intro. Shared Home banner style; photo stays completely unshaded on mobile, upper-only gradient on wider screens. Functional history CTA, single H1, no buyer prefix as UX49.


## UX50 - published and verified, 18.09.2026
Release v0.10-20260918-50: http://159.253.19.172:18087/pages/about?v=50. Mobile ea7e2de. Owner exhibition photo stays original/full4:3; Home-style rounded banner, white heading, orange history CTA. Upper-only gradient on wide screens, untinted full photo with copy below on mobile. Approved company content and UX49 header behavior preserved.
TypeScript and web/iOS/Android export pass. Local and public checks at320/390/640/768/1280 pass: original image loads,4:3 frame, single H1, no buyer prefix, copy above faces, working history scroll,0 JS errors. Published screenshots reviewed. No live submissions/native physical-device acceptance claimed.
568 payload hashes plus manifest verified; public bundle and original photo byte-identical to local assets, protected-host snapshot unchanged. Retention cadence removed47/48 release/archive pairs (1075579081bytes), retained49/50 and own DB backups. Integration remains skipped. All authorized work complete; next step owner visual review, ACCEPTED not set.


## UX51
No published app references to Baku/Bishkek or Azerbaijan/Kyrgyzstan (including Russian spelling variants). Closed branches must not appear in contacts, search, About disclosure or public app configuration. Other branch records and award facts stay unchanged.


## UX51 - published and verified, 18.09.2026
Release v0.10-20260918-51: http://159.253.19.172:18087/pages/about?v=51. Mobile3f24f55. Closed branch/country mentions removed from active app content, contact records and public city configuration. Remaining16 contacts preserved; award result retained without associated closed-location sentence. Historical source/evidence unchanged.
TypeScript and web/iOS/Android export PASS;9 existing public API tests PASS. Active runtime scan and67 exported/asset/document text files contain no matching terms. 27 local and27 public browser checks at390/1280 PASS,0 JS errors:8 content routes, About expanded branch list, contacts search exclusions and16-city public config. Published screenshot reviewed. No live submissions or native-device acceptance claimed.
568 payload hashes plus manifest verified; public bundle byte-identical to export; protected-host snapshot unchanged.50 rollback and own DB backup retained. Retention cleanup not due on51. Integration still intentionally skipped. No remaining implementation work; next step owner review. ACCEPTED not set.
