# UX46 — единая шапка и покупки для бизнеса

Общий ShopHeader используется и на внутренних страницах: меню, фирменный логотип, уведомления, звонок, город, режим покупки и поиск. В B2B появляются точное пояснение владельца и выбор организации. Заголовок страницы, возврат и контекстные действия остаются ниже. Нижняя навигация содержит корзину с количеством и бизнес-кабинет. Поиск с любой страницы открывает отфильтрованный каталог.

В карточках/PDP для бизнеса доступна покупка товаров с известной ценой и неизвестным остатком в черновик корзины. Специально заданные REQUEST_ONLY/CUSTOM_PRODUCTION не заменены покупкой, нулевой остаток не становится наличием. «Купить по счёту» открывает оформление с существующей оплатой invoice/source16. Сохраняются окончательный итог товаров и доставки из подтверждённого расчёта, условия продавца/договора и отдельные согласия UX45.

Неоформленная корзина B2B переносится в выбранную организацию только после проверки доступа сервером. Количества объединяются с проверкой лимитов и одновременных изменений; исходный черновик очищается только после успеха. Личные покупки не переносятся. Повторный выбор сохраняет уже отредактированную корзину организации.

Проверки: TypeScript, web/iOS/Android export,108 mobile +190 server tests PASS. Браузерная проверка четырёх ширин и сценарий счёта выполняются; отчёт будет дополнен перед передачей. Все тестовые отправки перехватываются; реальные счета/заказы не создаются. Интеграция с Битрикс по поручению владельца не включалась. Визуальная приёмка владельцем не заявляется.


Локальная проверка завершена:933 проверки навигации/шапки/покупки +41 проверка оформления по счёту, ширины320/390/768/1280, без ошибок JS и реальных заказов. Скриншоты просмотрены. Начальные сбои тестового стенда: поиск скрытых сохранённых экранов, старое имя empty state и неполный GAR fixture; исправлены проверки/fixture, UI не обходился. Финальная mobile-версия a1810ec;108 mobile/190 server tests и экспорт трёх платформ PASS. Далее изолированная публикация46 и публичная проверка.


## Final release — 18.09.2026
Published v0.10-20260918-46-1: http://159.253.19.172:18087/?v=46.1. Mobile commits a1810ec +3c58590. Final public browser: 1009 navigation/header/purchase checks plus 41 invoice checks at320/390/768/1280; no JavaScript errors or live order submissions. Direct business-account link and320×568 form also pass. Final patch adds explicit selected-state accessibility; local focused253 checks pass after the patch, in addition to933 baseline navigation +41 invoice checks. Screenshots reviewed. TypeScript/all-platform export and108 mobile/190 server tests pass.
Bundle entry-e40d770781659acc65f2af83b1d3ff6f.js matches export byte-for-byte; SHA256 da5dc118e3694c14bf9a892d5ff470b041900337d5682d389128a14e628f6d3e. Archive SHA256 c895411f1885f77655ae5aa3e2cc0dd05b3af40c0a8e632deeb374b44661aac4;566 payload files plus manifest verified. Protected production snapshot unchanged. Primary46 skipped cleanup; following patch46-1 triggered configured every-other-release cleanup, removing44/45 release/archive pairs (1075459648bytes), retaining46/46-1 and database backups.
All authorized UI/navigation work complete. External Bitrix integration remains deliberately disabled; actual identity verification, live order/invoice issuance and physical native device acceptance are not claimed. Next step owner visual review; ACCEPTED not set.
