# Для бизнеса — обновлённое содержание, версия 35

Источник: предоставленный владельцем файл `29e80267-d537-4e0d-8957-a4be3e01d7bd/pasted-text.txt`, сохранён в `evidence/business35/owner-content.txt`.

## Что обновлено

Сохранён порядок нового материала: баннер → шесть преимуществ → предложение расчёта по спецификации → шесть этапов поставки → доставка → документооборот → корпоративные условия → личный кабинет → шесть товарных направлений → производство → 15 вопросов → форма КП.

Новые тексты преимуществ, этапов, доставки, документов, условий, кабинета и ассортимента перенесены без сокращения смысла. FAQ заменён на 15 вопросов из новой редакции; это явное обновление содержания владельцем. Связанные страницы оплаты, доставки, возврата, компании и наград остаются доступны. Самостоятельное оформление заказа от юрлица сохранено в раскрывающемся ответе в блоке кабинета.

В оформлении используются фирменные шрифты и цвета, парные карточки с выравниванием заголовков, оранжевая подложка спецификации, вертикальная схема шести этапов, иллюстрация транспорта, реальные фотографии оборудования и производства. Интерактивные действия соответствуют названиям: расчёт ведёт к форме, документы/ЭДО — в кабинет, категории — в каталог.

Форма сохраняет существующие загрузки, проверку полей, согласия, обработку ошибок и подтверждение приёма. Для B2B обновлены подписи «Есть спецификация» и «Загрузить файл»; многострочная подпись режима центрирована. Обычная форма закупки не меняется.

## Факты и ссылки

«Проверить поставщика» открывает ИНН 2311108272 и ссылки на ЕГРЮЛ ФНС и реестр недобросовестных поставщиков ЕИС. Сведения о действующей организации и отсутствии в РНП предоставлены владельцем; дополнительно найдены в открытой карточке https://zachestnyibiznes.ru/company/ul/1082311003356_2311108272_OOO-PROMYShLENNIK и карточке https://check.tochka.com/company/1082311003356/. Прямой текущий запрос к официальным реестрам не завершился (таймаут), поэтому автоматическая государственная проверка не заявляется. В окне предложено проверить актуальные сведения самостоятельно.

В производственном абзаце сохранены две площадки в Краснодарском крае по предыдущему прямому уточнению владельца; названия площадок не указаны. Остальной новый текст производства сохранён.

Подключение Bitrix по-прежнему пропущено по поручению владельца. Страница не обещает автоматический кредитный лимит, скидку после регистрации или скачивание всех документов в приложении. Реальные внешние обращения при тестировании не отправляются.

## Проверки и выпуск

Локально: 375 проверок страницы на 320/390/768/1280; 52 проверки формы с перехватом загрузок/отправки только в браузере. Проверяются все карточки новой редакции, 15 FAQ, порядок разделов, отсутствие переполнения, навигация, ссылки, поиск FAQ, согласия, ошибки загрузки и регистрация. Скриншоты мобильной и широкой версии просмотрены. Итог релиза и публичной проверки будет дополнен ниже.


Окончательная локальная сборка: TypeScript и экспорт web/iOS/Android прошли. 375 проверок страницы, 52 проверки формы, 4 проверки контекста/анимации. Для анимации тест ожидает завершения появления элементов, а не фиксированный короткий интервал. Mobile commit 6c787bf. Изменены только businessPage.ts, BusinessPage.tsx и условные подписи/выравнивание бизнес-формы в ProcurementScreen.tsx.


## Размещение
Релиз v0.10-20260917-35 активирован только в изолированном preview. Адрес: http://159.253.19.172:18087/information/business?v=35. Проверены 500 файлов, предыдущий релиз 34 и резервная копия собственной БД сохранены. Изменения манифеста только внутри mobile/dist. SHA256 архива: 158ff4109bdd3d1819f184fb43a199790b29754d6101ce40034d8b33f81bd3d2. Публичный bundle entry-4f59b259ad291f5897dd44116e9c865b.js совпадает с локальным. Защищённые файлы, процессы и HTTP до/после идентичны.


## Business 35 — published, 17.09.2026
Updated page from owner attachment 29e80267-d537-4e0d-8957-a4be3e01d7bd: http://159.253.19.172:18087/information/business?v=35. New hero, six benefits, specification CTA, six supply steps, fleet/delivery, documents, corporate terms, six account capabilities, six assortment groups, production, revised 15 FAQs and quote form. Source copy preserved except production plural retains previously owner-confirmed two unnamed sites. Self-service ordering retained in cabinet accordion; supplier sheet includes INN and official registry links. Prior FAQs replaced by explicitly revised owner content. Underlying forms/routes preserved.
Mobile commit 6c787bf; changed businessPage.ts, BusinessPage.tsx and business-only form labels/alignment in ProcurementScreen.tsx. TypeScript and web/iOS/Android export passed. 375 page + 52 form + 4 context/motion checks passed locally and publicly at 320/390/768/1280; no JS errors. Form upload/submit tests intercepted in browser; no real external submission. Photos, mobile layouts and wide alignment visually reviewed. Isolated v0.10-20260917-35 verified 500 files, public/local bundle matches, previous v34 and own DB backup retained; protected files/processes/HTTP unchanged.
Bitrix integration remains skipped by owner; physical-device acceptance and live official registry lookup not claimed. All requested implementation and deployment complete; next step owner visual review, PAGE ACCEPTED not set. Report: parity/BUSINESS_35.md. No new blockers in this page scope.
