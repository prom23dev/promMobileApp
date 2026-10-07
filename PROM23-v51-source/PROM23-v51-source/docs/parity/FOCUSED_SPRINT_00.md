# FOCUSED SPRINT 00 — меню и уведомление места получения

Проверено и опубликовано 12.09.2026. [Открыть меню](http://159.253.19.172:18087/more).
Релиз `v0.10-20260912-04`, bundle `a9a35a5bad5ba2f5b66a202462dc7a05`.

## Проверка каждого пункта поручения

| Пункт | Результат и граница проверки |
|---|---|
| 1. Глобальное меню | 41 прежний title/route/source сохранён, автоматическое сравнение с mobile 7b29fb5; все переходы открыты. |
| 2. Пиктограммы | Lucide на всех 41 строках, единый stroke 1.7, без emoji и дополнительных библиотек. |
| 3. Иерархия | Прежние пять групп и порядок сохранены; отдельные групповые заголовки. |
| 4. Menu row | Иконка, название, chevron; минимум 54 px, перенос длинного названия, компактный разделитель. |
| 5. Позвонить | Один компактный quick action использует прежний supportPhone и tel flow. Header call скрыт только в меню. Реальный звонок не совершался. |
| 6. Bottom navigation | Пять вкладок нажаты, active state и badge проверены; navigation присутствует на всех menu destinations. |
| 7–8. Location notification | Появляется после успешного GAR выбора, timeout 4000 ms, X удаляет немедленно, полностью освобождает layout. После navigation/reload не воспроизводится. |
| 9. Смысл | Сохранена правдивая формулировка: корзина сохранена, наличие/цены/доставка требуют подтверждения. Source quote invalidation не выдается за connected revalidation. |
| 10. Motion | Enter 160 ms / exit 140 ms, fade/slide до 6 px. На 390 записана фактическая opacity progression, на 320 Reduce Motion без промежуточных значений/смещения. |
| 11. Accessibility | Decorative icons hidden, close 48 px с доступным именем, polite status без focus theft. Native announceForAccessibility предусмотрен; physical VoiceOver/TalkBack NOT_RUN. |
| 12. Тесты | Новый browser-focused00: local 137/137, public 137/137; errors 0. Mobile 88/88, TypeScript и export PASS. |
| 13. Visual review | Просмотрены 10 локальных PNG на 320/390: menu top/middle/bottom, toast visible/dismissed; дополнительно два публичных PNG на 390. Alignment/density/typography/spacing/tab bar/overflow проверены. |
| 14. Узкий scope | Изменены только navigation-menu, MoreScreen, Header.showCall, MenuRow, LocationChangeNotice, TransientNotice. Другие экраны/backend/source без изменений. |
| 15. Документация | CURRENT_TASK, PROGRESS, DECISIONS ADR-030 и scoped ACCEPTANCE_CHECKLIST обновлены по фактическим результатам. |
| 16. Отчёт и следующий шаг | Конкретный отчёт CHANGED / TESTED / SCREENSHOTS REVIEWED / REGRESSIONS / NEXT. NEXT: FAQ PAGE. |

## Доказательства

- [Локальная браузерная проверка](evidence/focused00-local/report.json): 137/137.
- [Публичная браузерная проверка](evidence/focused00-public/report.json): 137/137; совпадающий bundle, 0 page errors.
- [Mobile suite](evidence/focused00-mobile.log): 88/88; [TypeScript](evidence/focused00-typecheck.log): exit 0; [Expo export](evidence/focused00-export.log): PASS.
- [Manifest и SHA архива](evidence/focused00-package.json), [активация и rollback target](evidence/focused00-deploy.log).
- [Защитная сверка](evidence/focused00-production-protection.json): 82 theme hashes unchanged, shared process IDs/starttimes unchanged, HTTPS 200; DNS не менялся.

## Просмотренные скриншоты

| Состояние | 320 px (Reduce Motion) | 390 px |
|---|---|---|
| Верх меню | [PNG](evidence/focused00-local/menu-top-320.png) | [PNG](evidence/focused00-local/menu-top-390.png) |
| Середина меню | [PNG](evidence/focused00-local/menu-middle-320.png) | [PNG](evidence/focused00-local/menu-middle-390.png) |
| Низ меню | [PNG](evidence/focused00-local/menu-bottom-320.png) | [PNG](evidence/focused00-local/menu-bottom-390.png) |
| Уведомление видно | [PNG](evidence/focused00-local/toast-visible-320.png) | [PNG](evidence/focused00-local/toast-visible-390.png) |
| После автозакрытия | [PNG](evidence/focused00-local/toast-dismissed-320.png) | [PNG](evidence/focused00-local/toast-dismissed-390.png) |

Дополнительно просмотрены опубликованные [верх меню](evidence/focused00-public/menu-top-390.png) и [после автозакрытия](evidence/focused00-public/toast-dismissed-390.png). Остальные публичные PNG сохранены рядом с report.json. Длинные строки корректно переносятся; горизонтального переполнения нет; нижняя корзина и badge доступны; баннер не оставляет пустой области.

## Регрессии и ограничения

В итоговых проверенных сценариях регрессий не обнаружено. Первичные сбои browser harness сохранены в focused00-local/initial-*.json: ожидание завершения tab navigation, формат GAR label с пунктуацией, допустимое начальное opacity=0. Исправлены ожидания/утверждения, итоговый прогон полностью PASS.

Телефонный вызов, реальные заказы/платежи/CRM и native VoiceOver/TalkBack на физических устройствах не выполнялись. Это приёмка узкого web UI спринта, не всего recovery и не публикации в магазинах. Предыдущий релиз 03 и before-v0.10-20260912-04.sqlite сохранены. Только собственная user unit prom23-preview.service перезапущена.

NEXT: FAQ PAGE.
