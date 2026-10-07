# MASTER5 — текущая сборка: доказательный baseline V9

Проверены **412 URL опубликованной V8** и отдельно **412 URL первой локальной Foundation**. Опубликованная версия открывается; основной подтверждённый P0 — нижняя навигация отсутствует на 392 обычных маршрутах. После добавления товара PDP не предоставляет переход в корзину одним нажатием.

Это аудит существующей реализации, а не подтверждение приёма реальных заказов. Наличие формы и HTTP200 не означают успешную интеграцию Bitrix24/1С/платёжного сервиса.

## Версии и границы

| Поверхность | Фаза | Entry | SHA-256 |
|---|---|---|---|
| http://159.253.19.172:18087 | V8 BEFORE | `/_expo/static/js/web/entry-868a5bbc6dfffc180ef9df17946774da.js` | `717cbbb0384c3bbc468d4d4637cd22faf3b8bb89262cde3ce7b67548d0dadec7` |
| http://127.0.0.1:8087 | First Foundation, **не BEFORE** | `/_expo/static/js/web/entry-5176674040bdc4054942c3c39bf2c89e.js` | `42330e7e18d1e0bb2c0fda149d45a56ceba126898e0474844c5ce19882b2d6fa` |

Локальный export изменился до первого локального открытия браузера. Скриншоты BEFORE поэтому относятся только к опубликованной V8. Реестр исходных routes V8 сохранён до перестройки оболочки. Browser contexts изолированы, размер390×844, reduced-motion включён. Для проверки корзины добавлена1 единица товара в собственную гостевую сессию; контакты/аккаунты владельца не использовались. Разрешены только собственные preview sessions/actions; реальные формы, платежи, звонки и внешние POST не выполнялись. QA не управляла сервером и не изменяла UI.

## Покрытие

| Метрика | Опубликованная V8 | First Foundation |
|---|---:|---:|
| URL | 412 | 412 |
| Отрисовались после проверки | 412 | 412 |
| Перепроверены после первоначального timeout | 11 | 16 |
| Неподтверждённая отрисовка после повторной проверки | 0 | 0 |
| Обычные URL, ожидается bottom nav | 400 | 400 |
| Отсутствует ожидаемая bottom nav | 392 | 1 |
| Явно разрешённые immersive исключения | 12 | 12 |
| Document overflow в выполненных измерениях | 0 | 0 |
| JavaScript page errors | 0 | 0 |
| Попытки запрещённых POST | 0 | 0 |

Реестр:24 route patterns,68 form definitions,15 workspace,17 site pages,28 blog articles,28 PDP,226 категорий. Дополнительно проверены query search/zero, отсутствующий заказ, return service и fallback.12 immersive исключений — checkout, auth forms и payment-provider capture. Возможность скрыть nav в immersive не означает запрет показывать её, если поток остаётся обычным экраном.

Первичный массовый обход ограничивал ожидание6s и использовал >2control как readiness. Юридические экраны V8 имеют только2control; сетевые ожидания и промежуточная гидрация также давали timeout. Эти результаты сохранены в raw и перепроверены отдельно. Timeout сам по себе не назван сломанным экраном. Первые скриншоты фиксируют текущий viewport; для главной/PDP/About/Contacts есть settled снимки с дополнительным ожиданием медиа. Проверка document width не заменяет визуальную оценку каждого вложенного компонента, нативный Dynamic Type или устройство.

## Дефекты BEFORE и действия

| ID | Приоритет | Маршрут / факт | Причина и действие | Доказательство |
|---|---|---|---|---|
| NAV01 | P0 | `/product/prom-2414`: после add1 есть stepper, но нет nav и Cart action | V8 root Stack расположен вне tab bar. Общая оболочка и Cart badge; доступ1tap | [PDP after add](v9-before/published/product-after-add.png), state в JSON |
| NAV02 | P0 | Category/content/blog/forms/service/workspace теряют bottom nav | В V8 tab bar только в пяти вкладках; перенести обычные routes в retained tab stacks | Полная [inventory](mobile-screen-inventory.md), JSON каждого URL |
| NAV03 | P2 | Fallback `/not-a-route` остаётся без bottom nav и в First Foundation | Сохранить обычный выход в магазин и единое правило оболочки; не оставлять необъяснённое исключение | Строка fallback в JSON |
| HOME01 | P1 | На390px главная до первого viewport занята заголовком, фото и двумя CTA, товарных карточек не видно | Уменьшить hero и перейти к commerce-first структуре, сохранить производство как доказательство | [Главная](v9-before/published/home-ready.png) |
| CONTENT01 | P1 | `/pages/about`: один шаблон карточек и длинная история ниже первого viewport | Editorial overview → timeline → доказательства/награды; сохранить подтверждённые факты | [О компании](v9-before/published/about-ready.png) |
| CONTENT02 | P1 | `/pages/returns`: юридический текст начинается сразу, действие возврата не видно | Быстрый выбор действия и понятные этапы; полный юридический документ отдельным раскрытием/ссылкой | [Возврат](v9-before/published/returns.png) |
| CONTENT03 | P1 | `/pages/faq`: первый ответ занимает около500px, следующие вопросы без содержимого на первом viewport | Темы/поиск/аккордеоны; сохранить source-backed ответы и форму вопроса | [FAQ](v9-before/published/faq.png) |
| CONTENT04 | P1 | `/pages/cooperation`: «Информация обновляется» и равнозначные широкие CTA | Hub для поставщиков/франшизы/бизнеса, явное различие предложений; проверить контент source | [Сотрудничество](v9-before/published/cooperation.png) |
| CONTACT01 | P1 | `/information/contacts`: контент есть, nav нет; без выбранного населённого пункта показана справочная | Различать населённый пункт и филиал, вернуть shell, добавить удобное представление филиалов | [Контакты](v9-before/published/contacts-ready.png) |

В категориях без выгруженных SKU отображается пустое состояние подбора. Это ограничение источника данных, не доказательство отсутствия раздела. В68формах определение и UI сохранены; реальную отправку/CRM этот аудит не подтверждает. Комментарии статей, отключённые в исходном live-шаблоне, не объявляются потерянной функцией.

## Первичная проверка новой оболочки

[Foundation gate](../testing/v9-foundation-gate.json), entry517…:4/4 PASS. PDP add1→badge1→Cart одним нажатием; Catalog `/section/179`→Cart→Catalog сохраняет URL и scrollTop1653; Кабинет→Контакты→Назад; child reload и browser Back возвращают parent.16 timeout массового local прохода отдельно открылись с body и общей nav, без сетевых ошибок. Это ограниченная приёмка первого Foundation, а не всего MASTER5 и не последующих export.

## Артефакты и следующий gate

- [Машинная матрица с версией и каждым URL](current-build-v9-baseline.json).
- [Исходный raw без нормализации повторов](current-build-v9-baseline-raw.json), [повторная проверка опубликованных маршрутов](current-build-v9-supplement.json).
- [Сохранённый реестр V8](current-build-v9-registry.json), [полная inventory](mobile-screen-inventory.md).
- [Все249 требований и подпункты](../testing/master5-acceptance.md).
- Скрипты: `mobile/scripts/current-build-v9-baseline.cjs`, `v9-baseline-supplement.cjs`, `v9-foundation-gate.cjs`.

Следующая приёмка должна привязываться к окончательному entry/hash: весь route/nav matrix, back/deep-link, retained stack/filter/scroll, PDP/gallery/cart, personal/company, location, content/forms,320/390/430/768 и landscape, reduced motion, network/error/empty. Реальную приёмку заказа, оплаты, заявки и CRM проводят после подключения обработчиков; UI и source contracts проверяются сейчас без выдуманного success.
