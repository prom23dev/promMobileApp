# Runtime forms — recovery implementation delta

12.09.2026. Реальный Bitrix, его БД и провайдеры не подключались. Исходные файлы сайта не изменялись и не исполнялись при локальном тестировании.

Реализованы signed HTTPS transport, собственная server-side session binding, fresh actor/account flag и membership, auth challenge, source form schema, проверяемые загрузки файлов, checked model writes, durable consent и submission receipts. Наличие этих слоёв не означает, что каждый flow прошёл connected runtime acceptance.

## Реализованные группы

| Группа | Исполняемый адаптер | Точная граница |
|---|---|---|
| Вход, регистрация, recovery | AuthDriver | CUser, source ConfirmationCodes, непрозрачные encrypted challenge. Ответ mail/SMS API не означает доставку пользователю. |
| Профиль и адреса | ProfileDriver, LocationDriver | Fresh user/owned address; OTP для контактов; FIAS→Sale CODE; никаких произвольных GUID/label от клиента. |
| Организации | OrganizationDriver, BuyerDriver | INN lookup→review→source add; current membership; requisites uploads/EDO/verification; банковские сведения read-only. |
| Аккаунт, сеансы, карты | AccountActionDriver | Собственные записи и checked result; карточный capture остаётся source legacy, PAN/CVV generic API не принимает. |
| Обращения и возвраты | ServiceDriver | Реальные enum из БД, completed owned order, выбранные позиции и indexed source fields. |
| Отзывы и вопросы | PublicationDriver, WorkspaceDriver | Published parent/product link; owner+org edit/delete; исходные handlers и соответствующие поля/ответы. |
| Заказы | OrderActionDriver, WorkspaceDriver, CommerceDriver | Реальный Sale read/cancel; repeat projection→BFF CAS; payment через отдельный payment.session. |
| Запрос документов | DocumentRequestDriver | CForm REQUEST_DOCUMENT по SID, actual answer IDs/type/required; CFormResult::Add и существующие события. |
| Прочие формы | FormsDriver→SourceHttp | Allowlisted original handler, server hidden context, реальные CForm поля и source multipart. |
| Закупка | ProcurementDriver | Derived mobile contract из source business request; не увеличивает исходные64 формы. QA отдельно проверяет вложения и состояние доставки каналов. |

Все группы пока PARTIAL по приёмке реального исполнения. Полный dispatch всех64 исходных форм,4 alias и1 derived procurement фиксируется в runtime-dispatch-coverage.json. Наличие класса или button не становится COMPLETE.

## Контракты подключения

- `sessionKey` — SHA opaque BFF token, не пользовательский ID. Actor восстанавливает отдельную PHP session и проверяет ACTIVE/UF_DELETE_ACCOUNT_BY_USER/membership без24h authorization cache.
- Submit повторно получает revision. BFF проверяет context после await. Для profile-city/address-create/address-edit location ID/version сверяются с текущим GAR перед runtime call; PHP заново разрешает GUID через LocationDriver.
- Return: completed owned order, выбранные products, REASONS XML_ID из актуального справочника, `item-N-id/reason-N/comment/photos[]`. Общие обращения допускают темы `comment_*`; вопросы заказа — остальные темы и TAGS_HELP XML_ID. Source strlen применяется в байтах.
- Edit/delete публикаций сверяют владельца и организацию. Edit запрещён при опубликованных ответах. Reply проверяет связь parent/product также для гостя. Изменение текста сохраняет существующие фото записи, чтобы не повторить source overwrite.
- SubmissionReceipt — сохраняемая квитанция ответа обработчика сайта. Она не утверждает доставку в CRM/email. Actual entity ID возвращается там, где подтверждён. Unknown outcome оставляет durable pending и требует сверки без автоматического повтора.
- Repeat возвращает позиции собственного заказа. BFF заменяет только текущую mobile корзину после CAS. Website FUSER не перезаписывается побочно. Form order-pay не выдаёт принятие формы за оплату.
- Sale save сохраняет существующий event pipeline. Mobile не создаёт повторные CRM lead/deal напрямую.

## Что ещё не реализовано или не проверено

- Документы: read-only manifest есть в прежнем bridge; новое authenticated workspace download/open пока не связано с mobile. Скачивание остаётся MISSING_IMPLEMENTATION.
- Каталог содержит snapshot28 SKU. Repeat с неизвестными BFF товарами должен быть отвергнут, без молчаливого удаления или замены позиций.
- DeliveryDriver теперь содержит source delivery options/address resolution и GAR binding; PaymentDriver — saved-Sale payment create/get/reconcile и one-use invoice handoff. См. runtime-delivery.md и runtime-payments.md. Это конкретный код, но connected acceptance не выполнялась. Actual offers/Plus/schedule, полный invoice PDF/images, installed fiscalization mapping и automatic webhook/background reconciliation ещё MISSING_IMPLEMENTATION.
- Публикации (обновлено 2026-09-23, этап8 runtime-интеграции): `WorkspaceDriver::publications()` теперь фильтрует source `UF_SKIP_RATE=false` для отзывов (как `product.reviews.list::getHlData`, отдельно от собственного личного кабинета — `Reviews::getAllReviews` эту метку не исключает) и отдаёт настоящую курсорную пагинацию (`cursor`/`nextCursor`, страница20, общий bounded объём2000 объединённых отзывов+вопросов; свыше — `WORKSPACE_PAGINATION_REQUIRED`, как и остальные workspace-списки, вместо молчаливого `truncated`). Клиент (`loadProductPublications`, `ProductDiscussion.tsx`) получил кнопку «Показать ещё». Курсор общий на объединённый список отзывов+вопросов (не раздельно по вкладкам, в отличие от source, где `prom:product.reviews.list`/`prom:product.questions.list` — разные компоненты с раздельной пагинацией); на вкладке с малым числом публикаций одного вида может понадобиться несколько нажатий «Показать ещё», чтобы попался нужный вид. `q-popular` (сортировка вопросов по `UF_LIKES_CNT`, source-only) не реализован — мобильный `PublicationFilters` не выставляет такой сортировки в UI вообще, это осознанная граница продукта, а не пропуск.
- Выборочное удаление старых фото отзыва при `review-edit`: у source вообще нет такой возможности (`action-edit-review.php` либо полностью заменяет `UF_MEDIA` новыми файлами, либо — в обходном пути этого driver'а — сохраняет всё); добавлено только в `PublicationDriver` как новая возможность поверх источника: поле `remove-media-ids` (contract-only, `sourceMapping: none`, не уходит в Bitrix), `initialValues.existingMedia` в `forms.context` для review-edit (превью текущих фото/видео через тот же `WorkspaceDriver::media()`, что и публичный список). Валидируется дважды: формат ID в `PublicationDriver::run()`, принадлежность записи — в `reviewEditData()` (`array_diff` против текущего `UF_MEDIA`). Файлы физически не удаляются (`CFile::Delete` не вызывается нигде в source-обработке отзывов — только становятся orphan, как и до этого изменения). Мобильный UI подключён: новый тип поля `media-selection` в `siteForms.ts` (только `review-edit`), `existingMedia` вынесен из `initialValues` в отдельное поле `SiteFormContext` (`site.ts`, тот же `safePublicationMedia()`, что и в read-списке), рендер превью с переключением в `FormScreen.tsx`. Не проверялось в запущенном приложении (нет Node/Metro в этом окружении).
- При подключении обнаружен и исправлен блокирующий баг: consent-writer ветка в `PublicationDriver::run()` (строка "A legacy handler derives name/city…") перехватывала `-edit` формы точно так же, как `-delete`, из-за чего `review-edit`/`question-edit` никогда не доходили до `editReview()`/`SourceHttp` и всегда падали с `PUBLICATION_PRIVACY_ADAPTER_REQUIRED`, если `publicationWriter` не настроен. Существующий `ReviewEditMedia.test.php` (не выполнялся раньше — нет PHP CLI) уже ожидал прохождение через `editReview()`, то есть тест был написан verno, но не мог реально проходить до этого исправления.
- Passport, unnamed consignee save, generic card capture — LEGACY_REVIEW по исходнику, без придуманного сохранения.
- Схема неизвестных CForm/HL проверяется после подключения изолированного Bitrix. Неизвестный тип поля возвращает schema error.
- Source handlers могут подтверждать сохранение CForm/HL, не проверяя CRM/mail delivery. Durable submission receipt фиксирует только фактически полученный ответ.

## Проверки

Финальный recovery07: полный server161/161, mobile87/87 и TypeScript PASS; targeted новые constraints: mobile14/14 и BFF13/13. Логи: evidence/field-review-mobile.log, evidence/field-review-server.log, evidence/field-review-typecheck.log.

[evidence/php-policy-recovery07.log](evidence/php-policy-recovery07.log):37 PHP lint и375 isolated assertions PASS, включая новый FormFieldValidation30/30. SQLite/DOM доступны в выбранном /opt/php84 CLI; прежние3 SQLite Commerce проверки уже проходят. Это чистые policy/model/transport doubles, без Bitrix bootstrap/DB или внешних провайдеров. Отдельный SKIP в ProfileDriver по реальному CUser/OTP/private SQLite integration остаётся явным.

Независимый bounded field review:166/166 прежде не аттестованных static controls получили отдельную source/control/renderer/contract/driver запись в field-mapping-review.json. Четыре найденных дефекта исправили6 controls: source qty1–99, supplier attachment allowlist/count/size, ordinary-review video allowlist, appeal UTF-8 byte limits. Live acceptance0; original flags/baseline сохранены. Existing-review media preservation исправлен и проверен isolated model tests; selective removal и CForm static schema reconciliation остаются явными gaps. Recovery03 повторяет question minimum5 в app/BFF/signed runtime. Date/time checkout — COMMENTED_SOURCE: PHP comment310–394 и статический June2025; активный interval UI не утрачен.

## Recovery03 — сохранение существующего media при review-edit

`EXISTING_MEDIA_GAP` из предыдущего среза исправлен в коде `PublicationDriver::editReview/reviewEditData`: текстовое изменение вообще не передаёт `UF_MEDIA` в update, поэтому старое видео/фото не копируется и не удаляется. При добавлении фото передаются только принадлежащие текущей HL-записи existing file IDs и новые проверенные JPG/PNG arrays. Новое видео по правилам edit-формы по-прежнему не принимается; при добавлении действует общий предел10 вложений. Уже существующий длинный legacy список не препятствует изменению только текста.

Источники: `site-source/local/ajax/lk/questions-and-reviews/action-edit-review.php` — поля `UF_RATING/UF_TEXT/UF_PROS/UF_MEDIA/UF_MEDIA_COUNT`, `PREMODERATION_ENABLED=true`, проверка владельца/ответов, managed cache tag и `Reviews::clearCache`; исходный handler безусловно заменяет `UF_MEDIA`, поэтому больше не вызывается для этой операции. [Официальный file user type API](https://docs.1c-bitrix.ru/api/classes/CUserTypeFile.html) описывает обработчик файлового UF; совместимость конкретной установленной версии дополнительно защищена проверкой сохранённых IDs после update.

Перед effect повторно читается source context внутри транзакции: owner+organization, active/deleted flag, product, revision и отсутствие ответов. Update меняет только редактируемые поля, включает повторную премодерацию и сохраняет исходные author/city/date/parent/buyer metadata. После update проверяется, что прежние IDs сохранены в том же порядке, добавились только новые вложения и media count соответствует записи. Неуспешный результат не выдаёт accepted. Кэш очищается как в source; accepted содержит durable receipt с реальным review ID. Не вызываются `MakeFileArray`, source HTTP или операции удаления существующих media.

`test/ReviewEditMedia.test.php` проверяет text-only со старым видео, добавление image+old media, запрет new video/лимит, ownership/context, stale revision, late ownership/reply, failed HL result и контроль сохранности после update. HL/model — doubles, SubmissionReceipt — временная SQLite; новые image bytes — временный PNG. Фактический Bitrix user-field storage, конкурирующие legacy writers и физическое хранение файлов не проверялись. Полный runtime parity/COMPLETE из этого исправления не следует.

Финальный isolated PHP08: **30/30 review edit media model checks PASS**;38 PHP файлов прошли lint. [php-policy-recovery08.log](evidence/php-policy-recovery08.log) сохраняет результаты и SHA256. Проверенный PublicationDriver: `f35f3b7572d5b6c7d9e5e0338dc94f867b3d9d21cff394d8e80d9f1447afb728`, тест: `5d3635e9fe0ac2e3ca90a77879a2031715d47ec59c9c41491709ad83ddcb2d91`; это текущие неизменённые файлы после freeze.

Устройство CForm::GetDataByID сверено с [официальной документацией](https://www.dev.1c-bitrix.ru/api_help/form/classes/cform/getdatabyid.php): questions и answer groups используют идентификаторы вопросов; actual answer IDs формируют POST имена. Source REQUEST_DOCUMENT resolve-by-SID сохранён.

## 06.10.2026 — Publications read-filter correctness fix (`WorkspaceDriver::publications()`)

Follow-up to the 23.09.2026 Publications entry above, found while re-comparing `WorkspaceDriver::publications()`
against `local/components/prom/product.reviews.list/class.php`'s `getReviewsWithReplies()`/`getHlData()`.

**Bug:** the driver fetched root items and their replies in one query using a single shared `$filter`,
and that filter included the optional `rating` restriction whenever the client requested one
(`'=UF_RATING'=>$f['rating']`). A reply has no meaningful `UF_RATING` of its own (it isn't itself a
1-5 star review), so any rating filter silently excluded replies that belonged to an otherwise-matching
review — the review would come back with an empty `replies` array, and combining `rating` with
`withReplies` would wrongly drop the review from the results entirely (it looked reply-less). The real
`product.reviews.list` component never has this problem: `getReviewsWithReplies()` finds "has replies"
via a **separate**, unfiltered reply query (`getHlData([], ['>UF_PARENT_ID' => 0], ...)` / the two-query
root-then-replies structure), never reusing the rating-scoped root filter for replies.

Also found: `withReplies` was gated to `$kind==='review'` only, due to how the removed single combined
condition grouped its `&&`/`||` operators (effectively `$kind==='review' && (...)`), so it silently had
zero effect on questions. There's no real-site parity reason for that split — reviews and questions are
already merged into one feed/pager by this driver's own (mobile-only) design, unlike the real site's two
separately-paginated components, so a filter with no kind-specific name (`withReplies`, not
`reviewsWithReplies`) should apply uniformly to whichever kinds it's given.

**Fix:** split the single query into a rating-scoped root-row query (`=UF_PARENT_ID=>false`, optionally
`=UF_RATING`) and a separate, un-rated reply lookup (`@UF_PARENT_ID=>$rootIds`, same base
`UF_TARGET_ID`/`UF_ACTIVE`/`UF_SKIP_RATE` filter, no rating) — matching the real component's two-query
shape. Removed the accidental `$kind==='review'` gate from the `withReplies` check so it applies to both
reviews and questions. No change to the already-correct `withMedia` (review-only, matches the real site
where questions have no media) or to pagination/cursor logic from the 23.09.2026 fix.

New regression test: `test/WorkspacePublicationsFilter.test.php` (stubs `HighloadBlockTable` the same way
`PublicationDriverRouting.test.php` does). Covers: `rating`+`withReplies` combined no longer drops a
matching review's reply; `withReplies` alone now also keeps a question that has a reply, not just
reviews; the no-filter case still returns everything with replies correctly attached. Not run — no PHP
CLI available in this environment (same recurring constraint as every other stage in this plan).

## 23.09.2026 — Order/CRM/1C source verification (order-cancel, order-repeat, order-pay, return)

Первое прямое сравнение `OrderActionDriver`/`ReturnWriter` с реальным кодом `prom23marketplace` (ранее не проверялось; Этапы2/3 проверяли Regions/CommerceDriver, не этот блок).

**CRM-дедупликация (самое важное).** `events.php:221-371` регистрирует `AddEventHandler("sale","OnSaleOrderSaved","onSaleOrderSavedHandler")`. Обработчик выходит немедленно, если `!$order->isNew()` (строки223-225), и только на действительно новом заказе собирает `formData` (email/phone/сумма/состав/доставка/оплата/комментарий/регион/UTM-источник) и вызывает `Bitrix24Webhook::createDeal()` (local/class/Controllers/Bitrix24WebhookController.php:156-223) → `crm.deal.add` без какого-либо idempotency-ключа на стороне Б24. Значит защита от дублей — исключительно на уровне "сколько раз вызван `Order::save()` для *нового* заказа", а не на уровне CRM. Из этого прямо следует инвариант: **только `CommerceDriver::submit()` вправе создавать+сохранять новый `Order`**, и делает это ровно один раз внутри atomic CAS-перехода `quotes.state: fresh→pending` (CommerceDriver.php:349-357, комментарий "Source OnSaleOrderSaved handles 1C/CRM. Save inside price/coupon scope exactly once."). `OrderActionDriver` этот инвариант уже соблюдает: order-cancel только читает+обновляет существующий заказ (после чего `isNew()===false`, хендлер не создаёт вторую сделку), order-repeat вообще не вызывает `save()`/`create()`, order-pay кидает `PAYMENT_ROUTE_REQUIRED` и не создаёт заказ. Комментарии с точными цитатами добавлены прямо в `OrderActionDriver.php` и `ReturnWriter.php`.

**order-cancel.** `OrderActionDriver::run()` byte-for-byte повторяет `Models\Order::cancelOrderByUser()` (local/class/Models/Order.php:868-912): тот же список разрешённых статусов (`STATUS_ORDER_NO_PAY`,`STATUS_ORDER_ASSEMBLING`,`STATUS_ORDER_DELIVERY`,`STATUS_ORDER_READY`), то же `CANCELED='Y'`+`STATUS_ID=STATUS_ORDER_CANCEL`+`save()`. Уже подключено правильно, доп. логики (возврат денег, отдельное уведомление CRM) в источнике на отмену не найдено — `cancelOrderByUser` делает ровно это и ничего больше.

**order-repeat.** Прод-эндпоинт `local/ajax/lk/orders/order-repeat.php` очищает FUSER-корзину сайта и переносит товары исходного заказа через `\Prom\Basket::add($productID, $quantity, $catalogGroupXmlId)`, сохраняя `CATALOG_GROUP_XML_ID` из `BasketPropertyTable`. `OrderActionDriver::repeatItems()` сознательно этого не повторяет — он лишь проецирует `productId/quantity` в cart-массив для мобильного BFF CAS ("Website FUSER is never overwritten before that CAS" — komментарий в коде), так как у мобильного клиента нет доступа к website-сессии. Итоговую цену/наличие/тип цены всё равно пересчитывает `CommerceDriver::prices()` при следующем `cart.quote`, так что расхождение в `CATALOG_GROUP_XML_ID` не проблема — тип цены на исполнении берётся заново из `region.priceCodes`, не из старого заказа.

**return.** `local/ajax/lk/returns-products/action-returns-product.php` подтверждён как источник для `ReturnWriter`: тот же `IBLOCK_ID_RETURNS`, те же ключи `PROPERTY_VALUES` (`USER_ID`,`ORGANIZATION_ID`,`ORDER_ID`,`STATUS`,`JSON_RETURNS`), тот же формат одного JSON-объекта на товар (`GOOD`,`QUANTITY`,`COMMENT`,`REASONS`,`MEDIA`). Патч `source-patches/returns-intake-2026.patch` **проверен построчно против текущего прод-файла — совпадает без расхождений**, то есть не устарел и применим as-is. Патч убирает 14-дневное окно и блокировку повторной заявки на весь заказ; `ReturnWriter.php` их и не реализует, что корректно. Единственная зависимость — `config['returns']['legacyTemplatesEscaped']=true` после накатки патча на два `returns_applications_detail` шаблона (XSS через `COMMENT` без экранирования); в `config.example.php` стоит `false` по умолчанию — это ожидаемый gate, не баг.

**Documents1C — не является экспортом заказов.** `local/php_interface/lib/Documents1C.php` — это агент-*получатель*: раз в проход (`agent_events.php`) опрашивает HTTP-сервис 1С (`b2bdocs/get`, настройки в `local/php_interface/include/documents1c.php`) по уже существующим заказам (`ORDER_FILTER`: неотменённые заказы юрлиц) и сохраняет уже готовый PDF (invoice/УПД) в `HLBL_ID_ORDER_DOCUMENTS`, если 1С отвечает `200`+PDF. Если 1С ещё не провела документ — `404`, класс просто повторит запрос на следующем проходе. Класс **не инициирует и не подтверждает выгрузку заказа в 1С** — сам факт передачи заказа в 1С происходит снаружи этого класса (штатный Bitrix/1C commerce-обмен, не найден в рамках этого исследования — не смешивать с `Documents1C`). `DocumentRequestDriver.php` (мобильный) — вообще другой механизм (`CForm SID=REQUEST_DOCUMENT`, ручной запрос документа пользователем), не связан с `Documents1C`.

Изменения кода в этом проходе: только source-citation комментарии в `OrderActionDriver.php`/`ReturnWriter.php` (без изменения поведения) — оба драйвера уже были корректно подключены в `FormsDriver::run()` (строки144-151) и уже соответствовали прод-логике; `PARTIAL` в `runtime-dispatch-coverage.json` означает `NOT_RUN_ON_BITRIX`, не "не подключено". Реального разрыва между кодом и прод-источником не найдено.

## 23.09.2026 — Auth source verification (AuthDriver/Actor, Этап1)

Первое прямое сравнение `AuthDriver.php`/`Actor.php` с реальным кодом `prom23marketplace` (auth-login/-email/-register/-phone/-otp/-register-phone/-register-otp/-recovery). В отличие от Commerce/Delivery/Payment, этому адаптеру не нужен deployment ID-mapping config — он вызывает `\CUser`,`\Prom\Lib\Rest`,`\Prom\Model\ConfirmationCodes`,`\Prom\Controllers\ServiceVerification` напрямую, те же классы, что и прод-формы, внутри Bitrix bootstrap, который уже поднимает `endpoint.php`. `PARTIAL`/`NOT_RUN_ON_BITRIX` здесь означает буквально "не исполнялось на живом Bitrix", а не "не хватает mapping".

Прод не использует `local/ajax/auth*` — реальные хендлеры лежат в `local/include/forms/auth-reg/action-auth-by-email.php`/`action-auth-by-phone.php`/`action-reg*.php`/`action-password-recovery.php`, которые дергают `Prom\Lib\Rest::actionAuthorizeUserByEmail/Phone()` → внешний HMAC REST-вызов на `RestAuthController.php` (там и находятся реальные `CUser::Login/Add`). `AuthDriver.php` сознательно пропускает этот HTTP-хоп и вызывает те же классы напрямую (комментарий на строке89) — эквивалентно по эффекту, проверено построчно.

Найдены и исправлены два реальных расхождения:
1. **`LOGIN` для phone-only регистрации.** Прод (`RestAuthController.php:102-109`) кладёт в `LOGIN` голый 10-значный номер без кода страны (совпадает с `UF_PHONE`). Драйвер ставил `'7'.$phone` (11 знаков). Исправлено на `$phone`.
2. **Захардкоженное окно повтора OTP.** `ConfirmationCodes::createNewCode()` (`local/class/Models/ConfirmationCodes.php:40`) всегда возвращает `retry_after`, в т.ч. при `rate_limited`. Драйвер игнорировал это значение (жёстко `60` в `ChallengeVault::create()`, и не прокидывал `retryAfterSeconds` в исключение `RATE_LIMITED` вообще). Исправлено — оба места теперь читают `$issued['retry_after']`.

Проверено и **не требует изменений**: `CUser::Login(...,'N')` vs прод `'Y'` — третий параметр включает долгоживущую browser-cookie, а `endpoint.php` всегда стрипает `Set-Cookie`/использует HMAC+`prom23_session_bindings` вместо cookie-auth, так что параметр здесь не влияет на поведение. Password-policy регексы драйвера (`[A-ZА-ЯЁ]`/`[a-zа-яё]`) — строгий надмножество прод-правила `isValidPassword()` (`local/php_interface/functions.php:298-315`, без Ё), никогда не отклонит то, что прод примет. `Rest::findUserByLogin()` возвращает `[]` на miss — falsy-проверки в драйвере уже корректны. `auth-otp`: прод (`RestAuthController::userAuthorizationByPhone`, строки281-284) при неизвестном телефоне сам проваливается в регистрацию — драйвер уже это повторяет (строки117-124).

**Revocation/membership на каждый вызов — уже было реализовано верно, изменений не потребовалось.** Прод хранит признак удаления не в `ACTIVE`/блэклисте, а в кастомном UF `UF_DELETE_ACCOUNT_BY_USER` (`local/class/Models/User.php:210-225`, `deleteAccountByUser()`), и **сам прод проверяет этот флаг только при логине** (`RestAuthController.php:242,290-295`) — после установки cookie повторные запросы флаг не перепроверяют. Это ровно тот разрыв, о котором говорит п.1 `integrations/README.md`. `Actor::resolve()` (`Actor.php:6-23`) уже закрывает этот разрыв: вызывается на каждый API-запрос (`endpoint.php:60`, безусловно), при наличии userId заново (без кеша) делает `CUser::GetByID($id)->Fetch()` и `Protocol::activeUser($user)` (`Protocol.php:25-28`), которая отклоняет `AUTH_EXPIRED` при truthy `UF_DELETE_ACCOUNT_BY_USER` или `ACTIVE!=='Y'`. `AuthDriver::authorized()` вызывает тот же `Protocol::activeUser()` до `$USER->Authorize()`, так что отозванный аккаунт не может даже установить сессию. Членство в организации тоже перепроверяется без кеша на каждый вызов через `Actor::organization()` (`Actor.php:24-34`) — сознательно без 24h-кеша прод-класса `Organization::checkUserInOrganization` (комментарий на строке26).

**Мобильный клиент (`mobile/src`) — production auth/refresh/OTP отсутствует, изменений не вносилось (не входит в объём серверной задачи).** Все8 auth-форм рендерятся через общий `FormScreen.tsx`/`siteForms.ts` — форма ответа (`formId`/`challengeId`/`nextFormId`/`retryAfterSeconds`) уже верно смоделирована и совпадает с реальным выводом `AuthDriver`. Но весь transport сейчас идёт в локальный sandbox `127.0.0.1:8090` (`mobile/src/api/local.ts`, `mobile/docs/09-local-server.md:3`), сессия — один opaque sandbox-токен в `expo-secure-store`/`localStorage` без refresh-концепции (`mobile/src/api/local.ts:22-44`), 401 молча создаёт новую анонимную сессию вместо повторной аутентификации (`mobile/src/store.tsx:41`), нет `AuthContext`/`useAuth` (состояние — локальный `useState` в `AccountScreen.tsx`). `docs/audit/integrations.md:10` фиксирует то же самое независимо. Для боевого релиза потребуется: `EXPO_PUBLIC_LOCAL_API_URL` на подписанный BFF вместо sandbox, реальный refresh/re-auth interceptor вместо тихого анонимного fallback; отдельные OTP-экраны — желательны, но протоколом не требуются.

## Recovery03 field delta

Question/question-edit minimum5: Unicode code points после trim, replies unchanged. Targeted mobile15/15/BFF14/14/TypeScript PASS. FormFieldValidation расширен30→47 assertions:47/47 PASS в evidence/php-policy-recovery08.log. Финальный PHP08:430 assertions/38lint PASS, включая Payment83 и ReviewEditMedia30. Текущие SHA FormsDriver/PublicationDriver и двух связанных тестов совпадают с tested manifest. Все connected flow statuses остаются PARTIAL; policy/model doubles не подтверждают реальный Bitrix/PSP.
