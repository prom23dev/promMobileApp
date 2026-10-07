# RECOVERY01 — реальные функциональные пробелы

## Текущее состояние после recovery — 12.09.2026

Полный baseline ниже сохранён. Сейчас [functions.json](functions.json): **6 COMPLETE ограниченного scope /125 PARTIAL /3 MISSING /6 LEGACY_REVIEW**. [Изменения статусов](evidence/parity-status-reconciliation.json) хранят старые counts14/117/6/3 и конкретные12 изменённых строк. Это не означает, что осталось только3 проблемы: у PARTIAL отдельно перечислена отсутствующая реализация и непроверенный runtime.

- R01: глобальное меню и41destination/Back восстановлены,82/82PASS. Полный retained-stack/native history scope остаётся PARTIAL(NAV04).
- R02: personal/business intent и раздельные корзины подтверждены36/36publicUI; source organization/membership/price wrappers PARTIAL, реальные организации не принимались.
- R03–R06: coupon/options/quote/submit/GAR/address chains и concrete Sale/Delivery/Payment adapters реализованы. Live цены/доставка/PSP не проверены; Payment offers/Plus/schedule, полный invoicePDF/fiscalization/webhook остаются MISSING_IMPLEMENTATION. Доказательства: [commerce UI](evidence/public-commerce-ui/report.json), [server156](evidence/recovery-server-address-final.log), [Delivery](runtime-delivery.md), [Payment](runtime-payments.md).
- R07–R08: old unconditional form/workspace stubs заменены конкретным dispatch и source drivers.65form flows PARTIAL/3LEGACY; dynamic schema/DB/OTP/CRM/mail ещё не приняты. Отсутствуют authenticated document download, полная publication pagination/q-popular/selective old-photo removal.
- Не закрыты CAT07 (очистка сравнения целиком/по категории), PDP09 (SKU offer selector), BASK07 (групповое удаление корзины), полный каталог и прочие content/entity gaps из crawl.Никаких новых количеств entity без отдельной проверки не вводится.

Срез опубликованной версии `f511f4c425f0956cb8c2dd105ef3dba2` от 12.09.2026. Это baseline перед recovery. Последующие исправления принимаются отдельными доказательствами, исходный снимок не переписывается в «всё работает».

Источники: [реестр функций](functions.md), [его JSON](functions.json), [свежая проверка приложения и временного сайта](evidence/functions-runtime-before.json), [checkout source audit](checkout-source.md). Новая сессия Chrome 390×844; сайт только GET. На приложении разрешены только собственные session/cart actions. Реальных заказов, звонков, отправок форм и авторизации не было. Чужие аккаунты не исследовались.

## Обычный покупатель: что мешает довести заказ

Персона: Алексей, 58 лет, мастер. Обычно общается в мессенджере, покупает вышку для дома, иногда оборудование для ИП. Хочет проверить доставку и промокод; не будет искать важные разделы в настройках кабинета.

Его реакция: «Товар положил — корзина прямо снизу, это понятно. А где условия магазина? Почему за ними надо идти в кабинет? Хочу выбрать доставку и оплату, а вместо выбора поля, которые не работают. И куда вводить промокод в корзине? Если беру для ИП, почему кнопка просто показывает рекламу для бизнеса?»

Это интерпретация поведения персонажа, а не цитата реального исследуемого человека. После прагматической проверки шум вроде «не люблю приложения» отброшен: проблемы ниже воспроизводятся и у занятого уверенного пользователя. Создано 9 локальных actionable tickets; никакие внешние трекеры не использовались.

| Ticket | Факт / доказательство | Статус baseline | Что восстановить | Проверка приёмки |
|---|---|---|---|---|
| R01 / P0.1 / RED | Глобальной кнопки меню нет на Home/Catalog/PDP; `/more` доступен через кабинет. NAV01/05. [Home](evidence/functions-before-_.png) | MISSING | Отдельное меню рядом с поиском; buyer/company/business/legal; Back и нижняя корзина | Поиск не открывает меню; каждая ссылка открывается и возвращает; корзина за 1 tap |
| R02 / P0.2 / RED | `ContextSwitch` — две ссылки; `ContextId` содержит `personal\|organization-demo`. CTX01/03. [Home](evidence/functions-before-_.png) | MISSING | `personal` и отдельный `business` draft; `organization:${id}` только по подтверждённому membership. Guest не обязан выбирать организацию | Переключение меняет контекст/корзину; переключение назад сохраняет товары; поддельная организация отклоняется |
| R03 / P0.3 / RED | Наполненная корзина не содержит купон; source `CouponController`/Sale flow существует. BASK04/05. [Корзина](evidence/functions-before-cart-filled.png) | MISSING | Ввод/применение/снятие/ошибки купона и пересчёт через authoritative backend; также source `delete_multiple` | Валидный/невалидный/истёкший/удалённый купон, повторный клик, изменение qty; не менять сумму локальным процентом |
| R04 / P0.4 / RED | `CheckoutScreen` суммирует snapshot цены на клиенте; нет quote на каждое изменение. BASK06/ORDER07. [Checkout](evidence/functions-before-checkout-filled.png) | MISSING | Версионированный серверный расчёт строк/скидок/доставки/total, привязанный к actor/context/location | Изменения qty/coupon/delivery/payment/context дают новый quote; устаревший ответ не заменяет актуальный |
| R05 / P0.4 / RED | DELIVERY_ID/PAY_SYSTEM_ID — disabled awaiting, нет источника вариантов; `loadCommerceOffer` всегда null. ORDER02/04/05/06 | MISSING | Полный options→selection→quote→order flow. Карты/СБП/Pay/Split/счёт только при реальном provider/config/eligibility | Способы выбираются; тариф/условия влияют на quote; отказ/timeout не приводят к «оплачено». До подключения не обещать доступность |
| R06 / P0.5 / RED | GAR identity уже реализована; проблема в commercial mapping и адресе курьера, не в отсутствии городов. GEO03/04/ORDER09. [Выбор города профиля](evidence/functions-before-_forms_profile_city.png) | PARTIAL | Отделить settlement/serviceRegion/warehouse/address; подключить refresh цены/остатков/доставки/корзины и структурированный адрес | Село/хутор/одноимённые пункты; free text нельзя сохранить; смена места сохраняет корзину и инвалидирует старый quote |
| R07 / P0.6 / RED | `loadSiteFormContext` возвращает `{}`, `submitSiteForm` всегда throws; 68 UI definitions не означают 68 подключённых форм | PARTIAL | Конкретный transport/handler mapping, dynamic fields, owner/context/OTP, upload, consent receipts, errors/success по реальному ID | Каждая активная форма: malformed/required/files/consents/duplicate/timeout; успешная отправка только по настоящему response reference |
| R08 / P0.6 / RED | `loadSiteWorkspace` всегда unavailable; orders preview пусты; publication loader unavailable. ACC01–11/B2B01/02 | PARTIAL | Реальные read/edit routes кабинета: организации, заказы, адреса, документы/ЭДО, отзывы/вопросы, обращения/возвраты, waitlist | Actor/org ownership, загрузка/ошибка/пустой список различимы; действия только с реальными объектами и правами |
| R09 / P1 / RED | Не перенесены очистка сравнения по категории/целиком и выбор SKU offer. CAT07/PDP09. Source Comparison/offer handlers | MISSING | Сохранить эти возможности; presentation можно изменить без удаления функций | Category clear не затрагивает другую; SKU меняет цену/картинки/остаток/позицию корзины |

## Что не воспроизвелось как поломка

- После добавления товара badge стал 1; переход в корзину занял **одно нажатие**. Количество 2 сохранилось после reload.
- В новой проверке 9 обычных маршрутов показывают нижние вкладки. Checkout намеренно immersive. Его скрытый retained DOM не считается видимой нижней навигацией.
- Свободный текст в `LocationPicker` не является сохранённым settlement. GAR-модель уже есть; нужно сохранить её и завершить commercial refresh.
- Контакты, блог и основные content routes существуют. Проблема глобального доступа не равна отсутствию всех страниц. Полноту содержимого оценивают отдельные `pages.md`/`menu.md`.
- JS page errors в baseline: **0**. Это не подтверждает отсутствующие checkout/integration flows.

## Дефекты источника, которые нельзя слепо скопировать

`site-source/local/class/Controllers/CouponController.php`: `applyCouponToCart()` вызывает отсутствующий `checkCoupon()`; ветка проверки обращается к `Coupon::getUsageCount()`, которого нет в модели. Выборка купона не включает все поля, которые затем проверяет контроллер (`DATE_END`, `MAX_USE`, `USER_ID`). Восстанавливать намерение через корректный Sale discount flow, не выдавать старую ошибку за parity.

Source также содержит незавершённые/чувствительные ветки паспортных и банковских данных, карточных реквизитов и грузополучателя. Они помечены `LEGACY_REVIEW`: это не разрешение удалить нужный пользователю сценарий и не разрешение копировать небезопасную обработку.

## Граница внешнего доступа

Отсутствие production Bitrix не мешает написать UI, DTO, adapter, конфигурацию и обработку ошибок. Пока вместо транспорта стоит unconditional `return null`, `{}` или `throw`, функция остаётся **MISSING/PARTIAL**. `BLOCKED_BY_EXTERNAL_ACCESS` допустим только после готовой цепочки и точного описания отсутствующих runtime/credential/mapping. Реальные платежи, CRM/1С, сохранение заказов и документы нельзя считать проверенными по фикстурам.

## Проверки следующего шага

P0.1: [воспроизводимый browser script](../../mobile/scripts/browser-recovery-p01.cjs), результаты `evidence/recovery-p01.json`. Скрипт использует новый профиль, только собственную preview сессию/корзину, проверяет меню/поиск/ссылки/Back/badge при320/390. Финальный hash фиксируется при прогоне. После него — отдельные сценарии P0.2–P0.6 на новом коде; baseline статусы выше не меняются автоматически.

## Recovery02: остатки bounded field review

Полный166-row [реестр](field-mapping-review.json). Четыре исправления source constraints завершены и проверены14 mobile/13 BFF/30 PHP. Отдельно остались: question/question-edit minimum5 до source submit; existing-video review edit; installed numeric CForm ID/required/type reconciliation; authoritative checkout date/time и независимое поле контактного лица; unmapped passport/consignee legacy. Эти gaps не закрыты внешним доступом или тестовыми success. Ни один connected flow не повышен до COMPLETE.

## Recovery03: закрытие двух замечаний отчёта

Minimum5 question/question-edit реализован в app/BFF/PHP и проверен targeted tests. Дата/время доставки не являются активными source controls: PHP comment template.php310–394, статические датыJune2025. Прежнее указание на их потерю исправлено, восстановление фиктивного interval UI не требуется. Existing image/video preservation исправлен и проверен30 model assertions; selective removal прежних вложений остаётся отдельным PARTIAL gap. См. текущий field-mapping-review.json; recovery02 review сохранён в baseline/recovery02-fields.

Финальное доказательство recovery03: php-policy-recovery08.log — FormFieldValidation47/47, ReviewEditMedia30/30, Payment83;430 assertions/38 lint PASS. Граница: model/policy/transport doubles, не live Bitrix/provider acceptance.
