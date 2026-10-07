# Регрессионная матрица — MASTER4 baseline и итог V8

11.09.2026. Два равнозначных сценария: личные покупки без организации и закупка/поставка для бизнеса. Последнее уточнение владельца выше текста MASTER4 о consumer priority. Источников для текущей разработки достаточно; настоящие интеграционные испытания после подключения выполнят программисты, не требуем у владельца новые accounts.

**Текущий browser итог V8: 14/14 PASS на entry868a5bbc…, 32 layout observations, 0 JS errors, 0 запрещённых отправок.** [Итог](qa-v8-final.md), [полный JSON](qa-v8-final-report.json). Таблица ниже сохраняет исторический baseline V7; актуальное закрытие R-пунктов — в последнем разделе.

Объект baseline — [опубликованная V7](http://159.253.19.172:18087/), entry `9bd376941d209cef85b2f91b43359fc7`, SHA `9363d3ae94ab0f1b214535ff636e133a3bebae394dcb84e385c0b44ef683c91d`. Evidence: [current-build-runtime](../audit/current-build-runtime.json), [supplement](../audit/current-build-supplement.json). Скрипт: `mobile/scripts/current-build-audit.cjs`; новый isolated Chrome, никаких пользовательских профилей. Контроль мутаций допускает только `/api/sessions` и `/api/actions` этого выделенного preview.

| ID | Сценарий / ожидаемое поведение | Baseline V7: факт | Следующая приёмка / уровень |
| --- | --- | --- | --- |
| R01 | Fresh guest: личный магазин без mandatory organization | PASS: «Для себя», consumer account | Сохранить, browser + unit defaults |
| R02 | B2B столь же доступен, даёт поставку/КП и отдельный корпоративный context | PARTIAL: вход «Расчёт поставки» есть; ведёт к SKU, corporate context ещё demo | Два сильных CTA; procurement file-first; auth org ownership contract |
| R03 | Company switch → restart сохраняет выбор; можно вернуться personal | PASS локально; company account и «Счёт · НДС · ЭДО» после reload | Сохранять выбор, но не выдавать гостевой переключатель за организацию пользователя |
| R04 | Personal товар → корзина → checkout без компании | PASS до отображения checkout. Supplemental прогон использует фактическую кнопку «Перейти к оформлению» | Browser + unit context isolation; реальный submit после adapter подключения |
| R05 | Invalid location не сохраняется | FAIL: «Краснадарррр123» сохранён | P0: suggestion selection only; Enter/blur не создаёт location |
| R06 | Динская/село/посёлок/хутор/одноимённые места выбираются структурно | MISSING: FIAS contract отсутствует | Source-backed location unit/integration; official ID/name/type/region, disambiguation |
| R07 | Смена settlement обновляет price/stock/pickup/delivery/cart и сообщает изменения | MISSING: меняется city string | Contract tests resolver + revalidate; не притворяться выполненным по тексту шапки |
| R08 | Поиск отдельно от меню; history сохранена, clear/back работают | V7 14/14 ранее; текущие query/empty routes RENDERED | После правок повторить search/history/back; fuzzy cases отдельно измерить |
| R09 | Root и child categories — visual tiles с теми же source IDs | PARTIAL: root tiles, дети «Леса» текстовыми рядами | FIX: дочерние tiles; навигация/Back/empty category |
| R10 | Product source price/oldPrice/stock/media не теряются | FAIL: oldPrice есть в API, в PDP нет; одна картинка, generic stock | Unit DTO mapping + browser PDP; unknown stock nullable, не fake zero |
| R11 | Split/Plus для personal, corporate conditions для компании | PASS runtime: соответствующий блок меняется | Сохранить условия/оговорки; никакого fake bonus amount или client eligibility |
| R12 | Favorite/compare/cart не требуют auth и не теряются при смене экрана | UI/local state; полной sync модели нет | Browser add/remove/context; источник Favorite/Comparison/BasketUsers через adapter |
| R13 | Quick Order invalid qty/unknown rows/draft/Back | V7 unit7 + browser14 evidence сохранены | Не сломать secondary flow при добавлении procurement; без содержимого в URL |
| R14 | Procurement contacts + structured location + файл + комментарий | MISSING | UI поля/validation/upload states, source DTO; настоящее CRM success только после подтверждённого ответа |
| R15 | 68 forms открываются; mapping/consents не теряются | 68/68 RENDERED, отправки не выполнялись; часть awaits source context | Diff registry/source parity, required/options/attachments; unsafe fake success запрещён |
| R16 | Кабинет раскрывает обе модели, waitlist/активность доступны | PARTIAL: 14 workspace screens; waitlist нет | WaitingList source-backed UI, review/question grouping, address/payment/org routes |
| R17 | Заказы/документы/возвраты проверяют объект и владельца | Safe empty/not-found показаны; real records не проверялись | Source adapter tests ownership + valid fixture контракта; runtime data при подключении |
| R18 | Business/production сохраняют богатый content и сильную композицию | FAIL design: краткая стена текстовых карточек | Source content parity + screenshots 320/390/430/768; честный статус изображений |
| R19 | Contacts: public branch/address/hours/route/call | PASS отображение; действия внешних apps не запускались | Static tel/mailto/maps validation + branch selection; never call during QA |
| R20 | Content/blog/legal не теряются | 17 pages + 28 articles + 5 legal RENDERED; FAQ/warranty/promotions требуют source data | Route regression + content parity; legal release review отдельно |
| R21 | Accessibility/layout | 184 variants: doc width ≤390, pageerrors0; V7 5 viewport suite ранее | После UI правок 320/390/430/768/844×390; focus/Back/modal/reduced motion; native отдельно |
| R22 | Default preview не создаёт synthetic order и fake address | Source gap: debug fixture infrastructure требует отдельного gate | Default createApp disallow fixtures; explicit test option only, negative regression |
| R23 | Preview stays available and production protected | Baseline JS public=local; данный audit сервер не менял | Root deployment isolation verification, no zavod-antibpla file/process/DNS change |

## Фактические результаты этого прохода

- **184/184 URL variants — RENDERED**, 0 page errors, 0 document overflow при 390×844, 0 попыток запрещённых мутаций. Все source forms/pages/articles/workspaces и 28 текущих PDP просмотрены в guest context.
- Отдельно воспроизведены чистый personal, company после reload, возврат personal, invalid location, категория «Леса», personal checkout до формы и personal/company payment presentation.
- Изначальный consumer journey в универсальном скрипте ожидал старую подпись `/К оформлению/` и остановился. Это ошибка selector, а не корзины. Повтор с фактической «Перейти к оформлению» прошёл и сохранён в supplement; ошибочный первоначальный trace оставлен для прозрачности.
- Основной скрипт не проверяет завершение заказов/форм, все 226 section values или роли реальных пользователей. RENDERED нельзя переименовывать в functional parity PASS.
- V7 unit mobile48/server50 и browser14 остаются историческими доказательствами точного bundle. После изменения исходников эти цифры не являются новым V8 результатом.

## Граница automation

```sh
/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node mobile/scripts/current-build-audit.cjs
```

Скрипт жёстко привязан к разрешённому preview. Он создаёт только свою гостевую сессию, меняет только её shopping state, не сохраняет токены/credentials и не вызывает настоящие forms/payments/calls. Для V8 менять selectors только после анализа реального UI. Не размораживать fixture API ради зелёной регрессии.

Native iOS/Android builds, VoiceOver/TalkBack, Dynamic Type и provider sandbox purchase остаются вне этого прохода. Source contracts и локальные тесты можно завершать сейчас; настоящая интеграционная приёмка — этап программистов после подключения.

## P0 source update: изоляция synthetic fixtures

После сохранения аудита baseline в `server/app.mjs` добавлен `allowTestFixtureOperations = false`. Это параметр `createApp`, не environment variable и не клиентское поле. Только literal boolean допускается; тесты legacy API явно передают `true`. Обычный `server/index.mjs` флаг не включает.

При default false:

- `/api/addresses`, `/api/orders`, `/api/appeals`, `/api/returns` возвращают пустой массив с `meta.available:false`, а не вымышленные/исторические тестовые записи;
- notification inbox пуст, реальные подписки не имитируются;
- создание quote/order, чтение детали/отмена legacy order, support writes, запись notification preferences/read возвращают 503 `SHOP_INTEGRATION_REQUIRED`;
- shopping session/actions сохранены; история fixture DB не удаляется, корзина не очищается из-за отказа;
- реальная Bitrix domain logic не изменялась. Это защитный барьер старого sandbox, а не реализация настоящего commerce backend.

Проверено локально: **52/52** в четырёх test-файлах, включая три новых негативных теста в `fixture-gate.test.mjs`; [полный лог](fixture-gates-v8.log). Проверка старой БД сначала создаёт синтетический заказ с явным test opt-in, затем открывает ту же БД без флага: API его скрывает, запись физически остаётся. Дополнительно проверены отсутствие записей после запрещённых POST и невозможность включить тестовый режим JSON-полем запроса.

```sh
/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --test server/test/fixture-gate.test.mjs server/test/api.test.mjs server/test/public-v1.test.mjs server/test/bitrix-client.test.mjs
```

Это source/local-test результат, не повтор опубликованного baseline: deployment после интеграции P0 проверяется основной задачей отдельно. R22 закрыт на уровне кода и указанных тестов; не объявлять изменённый публичный сервер проверенным до его отдельного релиза.

## P0 source update: nullable stock, цена и формы

В `Product` остаток теперь `number | null`, а `draftQuantityLimit?: number` — самостоятельный лимит редактирования черновика. 28 импортированных SKU имеют `stock:null`, `stockSource:unverified`, `draftQuantityLimit:999`; текст из снимка availabilityText не выдается за актуальное наличие. Только явный stock=0 ведёт к «Сообщить о поступлении» с productId и контекстом покупателя. При stock=null кнопка корзины доступна, quantity reducer и cartTotal применяют отдельный лимит (по умолчанию999), а подтверждённый числовой остаток ограничивает его. Неверные/дробные/отрицательные лимиты и остатки не принимаются. Fixture-товары unit tests сохранены с явными числовыми остатками для негативных сценариев; они не загружаются в магазин.

`ProductPrice` общий для карточки и PDP: старая цена показывается только если это корректное целое число копеек больше текущей цены, процент — только из `discountPercent` DTO в диапазоне1..99. Клиент не рассчитывает скидку делением денежных чисел. Проекция и округление BigInt принадлежат BFF основной задачи; server/API-паритет проверяется после объединения, не этой записью.

Формы: courier pod/etag/office/comment сохраняются для обоих покупателей; видео metadata ограничено appeal-order и return, выбор media не считается принятой загрузкой. WaitingList использует unavailable boundary без фиктивных подписок. Подробности исходников/ограничений — [forms-parity](../audit/forms-parity.md).

Ограниченный прогон: **25/25 PASS** (`domain`, `catalog-tree`, `forms`) — [лог](forms-stock-v8.log). Проверены quantity25 при неизвестном остатке вместо старого cap20, cap999/отдельный cap40, переход к подтверждённому stock3/0, устаревшая корзина, некорректные лимиты, отсутствие искусственных остатков в snapshot, точное сохранение адресных деталей и media по выбранному товару. Browser stock0/notify, новая home/geo и серверная projection входят в последующий общий V8 regression; не подменять их unit результатом.

```sh
cd mobile
PATH=/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH node --import tsx --test tests/domain.test.ts tests/catalog-tree.test.ts tests/forms.test.ts
```

## Финальное закрытие V8 · 11.09.2026

Точный entry: `868a5bbc6dfffc180ef9df17946774da`; SHA256 `717cbbb0384c3bbc468d4d4637cd22faf3b8bb89262cde3ce7b67548d0dadec7`. Полный browser run **14/14 PASS**, 32 layout observations, 0 page errors, 0 forbidden writes. [Финальный отчёт](qa-v8-final.md), [JSON](qa-v8-final-report.json), [лог](qa-v8-final-run.log), [скриншоты](screenshots/).

| Пункты | Фактический статус V8 | Оставшаяся граница |
| --- | --- | --- |
| R01–R04 | PASS guest personal, равные hero-входы B2C/B2B, file-first procurement, личная корзина25→checkout без организации. Неподтверждённый company switch запрещён; старый company draft доступен через UI response fixture. | Реальный corporate context требует verified membership. UI fixture не заменяет server migration tests или auth integration. |
| R05–R07 | PASS официальные ID/тип/регион села и хутора, typo, запрет произвольного city, CAS409, cart preserved при смене settlement. | Delivery/stock/price/PVZ revalidation через живой Bitrix/provider остаётся неподключённой; смена шапки не считается live расчётом. |
| R08–R09 | PASS search/history/menu/back, visual child tiles. V8-UX-01 закрыт: отдельный Stack URL, child reload, browser Back к parent, второй child и внутренний Back, breadcrumbs. | Не обойдены все226 section IDs; проверен рабочий путь «Леса» и два дочерних раздела. |
| R10–R11 | PASS nullable stock + draft cap, oldPrice/discount DTO на PDP, Split/Plus/delivery/account explanations. stock0→notify проверен отдельным response fixture без success. | Полная галерея каждого SKU и live eligibility/bonus quote этим прогоном не подтверждены. |
| R12–R13 | Личная корзина и её сохранность при geo подтверждены; прежние source/unit проверки остаются. | Полный favorite/compare/QuickOrder browser сценарий в эти14 checks не включён; не переименовывать прежний V7 прогон в новый. |
| R14–R16 | PASS procurement file-first/invalid extension/required/unchecked consents/unavailable retention/privacy Back. WaitingList — честный unavailable. Source/model tests подтверждают courier detail names и media per-item. | Реальная загрузка видео, private file IDs, MIME/duration/malware validation, CRM reference и пользовательские списки — adapter этап. 68 форм заново целиком не отправлялись и не объявлены working backend. |
| R17 | Отсутствие fake order/quote/support success закрыто ранее default fixture gate tests. | Реальные ownership lifecycle/documents/returns зависят от подключения API. |
| R18–R20 | PASS compact company trust без повторного фото, история/награды,6 стадий, FAQ бизнеса, сильные CTA; контакты/телефон и legal Back. | Телефон не активирован; весь blog/legal content и законодательная release оценка не подменяются этим ограниченным browser прогоном. |
| R21 | PASS пять размеров, no document overflow, min24 CSSpx/имена видимых целей, reduced motion, keyboard focus. | Native accessibility, Dynamic Type и реальный performance device budget проверяются отдельно; это не полная WCAG/магазинная сертификация. |
| R22 | Ноль запрещённых запросов в браузере. Допуск только своей session/actions/location; формовые boundary дают честную недоступность. | Не включать server fixtures для демонстрации покупателю, не показывать ложные success после подключения. |

Промежуточные FAIL сохранены отдельно: `qa-v8-candidate-21b-report.json` и `qa-v8-history-scroll-probe.json`. History был реальным дефектом и исправлен root; недостижимость buyer block оказалась координатами/ожиданием harness, проверенными через реальные scroll metrics. Два специальных response fixtures (stock0, legacy company cart) маркированы в каждом результате. Промежуточный запуск после смены entry остановлен build guard; только финальный SHA считается пройденным.

```sh
PATH=/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH QA_EXPECTED_ENTRY=868a5bbc6dfffc180ef9df17946774da node mobile/scripts/browser-qa-v8.cjs
```

QA-подзадача сервер/DNS и боевой `zavod-antibpla.ru` не изменяла. Публичный release и его изоляция подтверждаются отдельной deployment-проверкой основной задачи, а не локальным browser run.

### Финальные source suites и уточнение комментариев

После основной сборки прочитаны фактические логи: [mobile-v8.log](mobile-v8.log) **59/59 PASS**, [server-v8.log](server-v8.log) **66/66 PASS**, [GAR import tests](../location-import-tests-master4.log) **8/8 PASS**. Их запуск принадлежит основной задаче; QA сверил финальные summary файлов. Browser14/14 остаётся отдельным результатом точного entry/SHA, не складывается с unit числами в процент готовности приложения.

Два последних mobile tests проверяют disabled article-comments contract. Уточнённый source finding: `blog/detail.php:85` комментирует include `comments.php`; projects/video его не подключают, публичный GET не содержит формы. Поэтому отсутствие комментариев под статьёй — **SOURCE-DISABLED**, а не пропущенная активная функция/P0 UI missing. Typed contract и source entity IDs сохранены для программистов; product questions/reviews являются другими сценариями. См. [forms-parity](../audit/forms-parity.md).
