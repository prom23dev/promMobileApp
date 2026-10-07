# Сотрудничество — focused page sprint 06

Дата: 12.09.2026. Статус реализации: VERIFIED — опубликовано и проверено, детали ниже. **Визуальная приёмка пользователем не получена.**

## CHANGED

Отдельный `mobile/src/ui/CooperationPage.tsx`: фото реального цеха, утверждённый hero, пять направлений, шесть trust items, три шага и контакты. Business — фирменный navy; specification — акцентная рамка/primary; selection — светлый сервисный блок с примерами; supplier — открытая карточка с боковым маркером; franchise — тонкая рамка. Все карточки вертикальны, по одной в строке; навигационные действия отделены от текста. Hero не содержит лишней кнопки.

Scroll-driven линия, активация иконки и смещение текста8px связаны с положением строки, не с таймером. Reduce Motion отключает эффекты. Заголовок hero — единственный H1; appbar сохраняет название, Back, call/menu. Существующая типографика/палитра и Lucide сохранены.

В procurement добавлен необязательный observer бинарной загрузки: чтение → подтверждённые чанки/процент → проверка → upload token; ошибка, сохранение ввода и повтор. Completed upload не означает отправку заявки. Удаление и размер файла доступны. Исправлен web drag/drop: хранится исходный File, чтение не нарушает connect-src CSP. Политика безопасности не изменялась. После исправления поля убирается устаревшее общее сообщение об ошибке.

В связанной навигации Supplier/Franchise исправлен принудительный business expectedContext: теперь передаётся текущий контекст, как ожидает защищённый FormScreen/BFF. Режим и корзина не переключаются; серверная проверка контекста/организации сохранена. Визуал этих страниц не менялся.

## TEXT USED

49 основных строк из маркированных полей COPY LOCK проверены на точное вхождение: `evidence/cooperation06-copy-lock.json`. Все benefits и примеры также сохранены. Подтверждённые факты не потребовали правок. У supporting строки спецификации техническая оговорка «— если такие типы файлов поддерживает реальный backend» трактуется как условие задания, не пользовательский текст. Это решение зафиксировано до реализации в PROGRESS. Поддерживаемые форматы ниже; чертёж — PDF/изображение, поддержка CAD/DWG не обещается. Примеры selection оформлены одной строкой с разделителями, смысл и слова сохранены.

## PRESERVED FROM WEB/SOURCE

| Сценарий | Маршрут / источник | Что сохранено |
|---|---|---|
| Business | `/information/business`; `/business/`, `site-source/business/index.php` | КП, резерв, поставка на объект, документы/ЭДО и полный отдельный экран |
| Specification | `/procurement?mode=list`; `get-business-advice-form-action.php`; `runtime-procurement.md` | Derived approved business flow: first-name*, phone*, email*, company-name*, comment/file, INN optional, structured GAR/version, mode, context, два согласия |
| Selection | `/procurement?mode=selection` | Тот же бизнес-процесс и comment, без нового выдуманного handler |
| Supplier | `/pages/suppliers` → `/forms/supplier`; `suppliers/index.php`, `local/ajax/form/suppliers-form-action.php` | first-name*, company-name*, email*, phone*, product-category*, product-desc*, comment, attachment; два согласия; источник HL/CFile/Bitrix24/mail |
| Franchise | `/pages/franchise` → `/forms/partner`; `frontend/h/franchise.php`, `local/ajax/form/partners-form-action.php` | Полная страница, условия/поддержка/требования, существующие steps/CTA и форма |
| Contacts | `/information/contacts`; siteContent.supportPhone | Телефон +78002002590, контакты, существующий support flow |

Сотрудничество было агрегатором трёх source-направлений, не отдельной исходной формой. Все три сохранены; два procurement-входа показывают уже реализованный процесс. BuyerInfoGrid прежней страницы заменён заданным конечным CTA; его сервисные назначения остаются в глобальном меню, capability не удалена. FAQ/требования/условия поставщиков и франшизы остаются на исходных полноценных экранах. Новых legacy-исключений нет.

Текущий web перечитан read-only: Business, Suppliers, Franchise, About, Vendor — все HTTP200; headings/forms записаны в `evidence/cooperation06-web-read.json`. Исходные формы и реестр `forms.md` сверены. Supplier attachment: один TXT/DOC/DOCX/PDF до20МиБ; procurement: PDF/XLS/XLSX/CSV/DOC/DOCX/JPEG/PNG/WebP, до10 файлов по20МиБ, общая runtime quota100МиБ. Исходный business handler сам не принимал файлы: существующий ProcurementDriver сохраняет их через CFile и передаёт CRM/mail с durable pending. Эта разработка не подменяется прямой отправкой в старый handler.

Факты: `frontend/h/about-company.php` подтверждает2008 и экспорт СНГ/Азия/Африка; Vendor/source content — собственное производство Краснодарского края; Business — комплектацию, наличие/резерв, документы и сопровождение. Фото `assets/brand/factory-wide.webp` соответствует source asset `iblock/bcc/z4gs8bwe6bxu0cm3ezw3lthrtl0hfhdy.webp`, provenance/SHA в `discovery/visual-assets-v7.json`.

## TESTED

- TypeScript PASS;90/90 mobile tests, включая два новых теста подтверждённого upload progress/error/retry/cache.
- Local134/134 при320/390px,0pageerrors: пять направлений, Contacts, Back,40menu entries,5tabs,cartbadge1 и переход в корзину.
- Form: required/email/company/GAR/INN, два unchecked consent; выбор файла/размер/remove, ошибочный тип supplier, бинарная загрузка, disabled/loading, error/retained inputs, retry, token-only body и accepted reference/durable pending.
- Supplier CTA теперь работает из B2C; контрактный accepted результат проверен с вложением, категорией и двумя согласиями. Franchise сохраняет контекст текущего посетителя.
- Link targets≥48px, focus, один H1, H2/H3 hierarchy, переносы без overflow, статичное состояние Reduce Motion и реальное изменение высоты линии от прокрутки.
- Телефонный intent сверён по source constant и обработчику `Linking.openURL('tel:'+supportPhone)`; исходящий звонок не выполнялся.
- Supplier/Procurement успешные и ошибочные ответы **перехвачены тестом в браузере**. Они не являются live заказами или CRM-приёмкой. Тестовые сессии собственного сервиса удаляются после проверки.

## BLOCKED_EXTERNAL

Реальное сохранение/передача заявки в установленный Bitrix/CRM/mail требует отдельного подключённого runtime и его настроек. Это прежний BLOCKED_BY_EXTERNAL_ACCESS; исходный код, контракты и UI реализованы/проверены, внешняя доставка не объявляется успешной. Без runtime приложение возвращает недоступность, не fake success. Native VoiceOver/TalkBack/реальные устройства в этом web-спринте не проверялись.

## SCREENSHOTS REVIEWED

Открыты и просмотрены Hero, Business, Specification, Selection, Suppliers, Franchise, Trust(top + continuation), Steps, Final CTA и форма вложений при320/390. Дополнительно error/retry, procurement fixture result, supplier fixture result и motion. Файлы: `evidence/cooperation06-local/`. Сняты с сохранённым appbar/bottom nav/badge. Первый визуальный проход выявил слишком высокий Image в web; исправлен явной высотой и проверен повторно. Кадр результата supplier обновлён после завершения layout, нижняя навигация дополнительно проверяется по координатам.

## REGRESSIONS

В проверенном scope не обнаружены. Восемь не затрагиваемых экранов сравнены old public05 ↔ local06: Home, About, Production, FAQ, Catalog, PDP, Cart, Checkout. Тексты идентичны8/8; FAQ/Catalog/Cart/Checkout — pixel-identical. На остальных небольшие различия каналов находятся в фотографиях (max6–12/255), вёрстка/типографика/тексты совпадают; это не заявляется как pixel-identical. Отчёт с bbox: `evidence/cooperation06-regression/report.json`. Скриншоты сравнения просмотрены. Source/backend/CSP/DNS не менялись.

## Проверка каждого пункта брифа

| № | Выполнение / доказательство |
|---|---|
| 0 | COPY LOCK49 основных строк + benefits/examples; выше описана условная оговорка |
| 1 | Пять самостоятельных направлений |
| 2 | Appbar/Back/menu/tabs/cartbadge/call сохранены, browser checks |
| 3 | Точный hero и реальный source цех, без CTA/stock |
| 4 | Точные заголовок и подзаголовок направлений |
| 5 | Business copy/4benefits/исходный route |
| 6 | Specification выделена, точные copy/CTA, запрещённых названий нет |
| 7 | Реальная derived form; поля/форматы/source handler, progress/error/retry |
| 8 | Selection copy/примеры/режим существующей формы |
| 9 | Supplier route, поля/required/attachments/consent/handler/state checks |
| 10 | Franchise route ведёт на полную страницу |
| 11 | Пять визуальных ролей, mobile одна строка/карточка |
| 12 | Lucide; без emoji |
| 13 | Утверждённые trust eyebrow/H2 |
| 14 | 2008 title/text |
| 15 | Производство title/text |
| 16 | Комплектация title/text |
| 17 | Спецификация title/text |
| 18 | География title/text |
| 19 | Сопровождение title/text |
| 20 | Source/web facts, без придуманных количеств/SLA |
| 21 | Вертикальная линия, scroll progress, иконки, без карусели |
| 22 | Утверждённый заголовок steps |
| 23 | 01 copy |
| 24 | 02 copy |
| 25 | 03 copy |
| 26 | Вертикальные steps и scroll animation |
| 27 | Конечные контакты/телефон и точный текст |
| 28 | Primary только specification/final; остальные navigation links |
| 29 | Реальное фото, provenance выше |
| 30 | Все6CTA открывают реальные routes |
| 31 | Source/web/mobile comparison и сохранённые обработчики выше |
| 32 | Три прежних направления/полные страницы сохранены; функции доступны через menu |
| 33 | Навигация default/pressed/focus; disabled/loading/error/success — на формах, где эти состояния применимы |
| 34 | H1–H3,48px targets,accessible labels,контраст/переносы/Reduce Motion/focus |
| 35 | Все10 требуемых видов сняты и действительно просмотрены |
| 36 |134local checks +90unit; public в разделе публикации |
| 37 | Только cooperation/related upload/context/Header option; остальные8экранов сравнены |
| 38 | CURRENT_TASK,PROGRESS,DECISIONS ADR032 и scoped acceptance обновлены; без пользовательской visual acceptance |
| 39 | Итог оформлен по заданным рубрикам |


## Публикация и финальная проверка

Release `v0.10-20260912-06`, bundle `a00bfc586c42484f5b63ce3c9dbfb82c`, archive SHA256 `b983f18c2f90e50137c59014132bf798bd5cc5357d9639f6c40f27b3025c0b91`. Опубликовано только на `http://159.253.19.172:18087/pages/cooperation`;252content files в manifest проверены,253файла вместе с manifest в архиве. Предыдущий05 и own SQLite backup сохранены.

Public134/134 PASS при320/390,0pageerrors; bundle совпадает с local. Дополнительно открыты публичные screenshots hero/specification/final/upload-error390. Все40пунктов имеют запись выше; external acceptance/native limitations не скрыты.

Protected82theme-file hashes и PID/starttime общих nginx/apache/MariaDB неизменны, HTTPS200;DNS не изменялся. Proof: evidence/cooperation06-protection.json. Первый public run проверил фотографию раньше её загрузки; тест исправлен ожиданием load, исходный report сохранён как initial-image-wait-report.json. Ранее найденные CSP/context/image-height дефекты исправлены до упаковки; итоговый134check suite проверяет исправления.

Регрессий в проверенном scope нет. Визуальная приёмка пользователем остаётся отдельным этапом, статус ACCEPTED не установлен.
