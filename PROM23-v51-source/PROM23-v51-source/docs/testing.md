# V7 — план приёмки и фактическое состояние проверок

Обновлено 11.09.2026. Статусы: PASS — есть доказательство конкретной версии; BLOCKED — отсутствует окружение/сервис; PENDING — ещё не выполнено. Прохождение браузерных тестов не подтверждает нативную сборку, production-интеграции или правовую готовность.

## Что уже подтверждено

| Проверка | Версия / результат | Доказательство |
| --- | --- | --- |
| Mobile unit/domain/forms | V6, 36 passed / 0 failed | `docs/mobile-tests-v6.log` |
| Local server / Bitrix contract | V6, 40 passed / 0 failed | `docs/server-tests-v6.log`; это не подключение production Bitrix |
| Chromium mobile journeys | V6, 15 passed / 0 failed | `docs/qa-v6-report.json`, `docs/qa-v6-final.md` |
| Responsive | V6: 320, 390, 430, 768 и landscape 844×390 | `docs/qa-v6-home-*.png`, report layouts |
| Browser scaling | V6: CSS zoom 200% при 768×1024, home/account | `docs/qa-v6-browser-scaling.json`; не Dynamic Type и не TalkBack/VoiceOver |
| Rendered SEO | V6: 5 routes + SPA account + accordions | `docs/seo-v6-rendered.json`; preview noindex |
| Security/store review | V7 discovery, статическая проверка | `docs/security.md`, `docs/store-compliance.md`; не пентест |
| Новый интерфейс V7 | **PASS: 14/14**, entry-9bd376941d209cef85b2f91b43359fc7.js | `docs/qa-v7-report.json`, `docs/qa-v7-final.md`; isolated Chrome, только localhost |
| Mobile unit/domain/forms V7 | 48 passed / 0 failed | `docs/mobile-tests-v7.log` |
| Server/contracts V7 | 50 passed / 0 failed | `docs/server-tests-v7.log`; внешние интеграции этим не подтверждены |
| Спецификация/черновики V7 | 7 passed / 0 failed, отдельный повтор reviewer | `docs/qa-v7-quick-order-tests.log` |
| EAS release gate V7 | preview exit0, production exit1 | `scripts/eas-release-gate.cjs`, `docs/release-gate-v7.log`; direct native/manual upload ещё не покрыты |

## Native toolchain: read-only проверка этой машины

| Команда / область | Результат 11.09.2026 | Вывод |
| --- | --- | --- |
| `xcodebuild -version` | exit 1: активная папка — CommandLineTools | Archive/simulator tests BLOCKED |
| `xcode-select -p` | `/Library/Developer/CommandLineTools` | Полный Xcode не выбран; `/Applications/Xcode*.app` не найден |
| `java -version` | exit 1: Unable to locate a Java Runtime | Android Gradle build BLOCKED |
| `command -v adb`, стандартный `~/Library/Android/sdk/platform-tools/adb` | Не найдено | Устройство/эмулятор Android через adb пока недоступны |
| `command -v maestro`, `~/.maestro/bin/maestro` | Не найдено | Maestro flow не запускался |
| `command -v pod`, `eas`, `gradle`, `watchman` | Не найдены в PATH | Это не доказательство отсутствия всех возможных установок; рабочие инструменты не подтверждены |

Ничего не устанавливалось, developer directory не менялся, credentials не читались. Для выбранного Expo 57 подготовить полный Xcode **26.4+**; его официальная таблица также указывает iOS 16.4+, Android 7+, compile/target SDK 36. Это требования выбранного toolchain, отдельно от минимальных правил загрузки магазина. Нужны совместимый JDK/Android SDK, зависимости проекта и устройства на выделенной машине/CI. [Expo 57: версии и системные требования](https://docs.expo.dev/versions/v57.0.0/). Не закрывать BLOCKED скриншотами Expo Web.

## Воспроизводимые команды

Команды запускаются из корня `/Users/prom23/Projects/prom23-mobile`. Результаты относятся к версии из таблицы выше; после изменения bundle требуется проверка затронутых сценариев. Runtime server требует Node ≥24, mobile package — ≥22.13; единый Node 24+ упрощает запуск. В текущей рабочей среде доступен bundled Node:

```sh
export PROM23_NODE_DIR=/Users/prom23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin
export PATH="$PROM23_NODE_DIR:$PATH"
node --version
npm --prefix mobile run typecheck
npm --prefix mobile test
npm --prefix server test
npm --prefix mobile run check:release
```

Последняя команда сейчас **должна завершиться ошибкой**: это корректный запрет выпуска с неподключёнными сервисами. Не изменять её на exit 0 ради зелёного отчёта. Локальные unit/server tests используют свои fixtures; перед запуском новых интеграционных тестов убедиться, что они не берут production env.

После согласованного стабильного локального экспорта/старта preview:

```sh
QA_BASE_URL=http://127.0.0.1:8087 QA_EXPECTED_ENTRY=9bd376941d209cef85b2f91b43359fc7 node mobile/scripts/browser-qa-v7.cjs
```

Сценарий V7 использует isolated Chromium/Chrome, ограничен localhost, допускает только local `/api/sessions` и `/api/actions`; блокирует остальные записи и tel/sms/mailto. Он сохраняет `qa-v7-*` и проверяет ожидаемый bundle при прямой навигации, чтобы не принимать смешанный результат во время экспорта. Не направлять его на публичный сервер. В V7 проверялись заполнение и переходы формы, но не её внешняя отправка; более ранняя проверка ошибки неподключённой формы относится к V6.

План native-команд **после** подготовки инструментов, package IDs/окружения и согласованной сборки:

```sh
cd /Users/prom23/Projects/prom23-mobile/mobile
npm run ios
npm run android
```

Эти команды реальной сборки/запуска в этом исследовании не выполнялись. Отдельные Hermes exports и prebuild без установки зависимостей, выполненные основной задачей V7, не заменяют Gradle/Xcode build и испытания. Для подписанного release нужен отдельный профиль, не существующий preview/debug. Maestro — опциональный способ автоматизации после установки и проверки testID; отсутствие Maestro не блокирует ручной device QA.

## V7: реальные клиентские сценарии

1. Первый запуск гостем: логотип, поисковый ввод, видимые «Позвонить» и «Контакты», понятная польза главного экрана. Проверить tel-адрес статически, **не совершать звонок**.
2. Поиск отдельно от меню; история/удаление/очистка, пустая выдача и опечатка; переход в товар и Back сохраняет контекст. Закрытие drawer/modal по Back/Escape; фокус остаётся внутри modal и возвращается к инициатору.
3. Категории совпадают с источником, леса первые. Популярные товары с истинным источником, загрузка ещё без дублей; интересы и рекомендации объяснимы и не требуют аккаунта.
4. B2B-путь: выбрать задачу → релевантный результат → КП с сохранением выбранной задачи/позиций. Форма объясняет результат и обязательные поля; выключенные согласия; повторный tap не создаёт повторную заявку.
5. Товар → корзина → оформление: цена/единица, наличие и условия доставки/Сплита/Плюса соответствуют источнику или реальной quote. Не показывать неподтверждённую точную дату/стоимость как обещание. B2B не получает B2C-бонусы по умолчанию.
6. Смена personal/company изолирует корзины/историю/документы. При неизвестных ролях не отображать чужие корпоративные данные. Для серверной проверки нужны два независимых пользователя/организации на staging.
7. Личный кабинет объясняет преимущества до входа, гость может продолжить покупки/обращение. Нет вымышленных заказов/баланса/документов. Вход/удаление недоступны честно до подключения API.
8. Каждый полезный раздел (доставка, производство, B2B, проекты, блог, контакты, возврат/правовые документы) доступен с мобильного и имеет возврат; CTA соответствует содержанию.
9. Ошибка сети/timeout/отказ разрешения: нет ложного success, бесконечного spinner, потери введённого без объяснения, повторной отправки автоматически. Неподключённый provider не маскируется демонстрационным номером.

## Доступность и performance

Минимальная браузерная матрица: 320×844, 390×844, 430×932, 768×1024, 844×390; keyboard-only; 200% browser text/layout scaling; reduced-motion. Проверять реальную обрезку, горизонтальный overflow, контраст, видимый focus, имя/роль/state controls, порядок H1/H2, error announcement и доступность нижнего CTA при клавиатуре.

Нативная матрица отдельно: небольшое iOS-устройство + iPad/landscape, Android 16 и минимально поддерживаемая версия, слабое устройство, fontScale до 2, VoiceOver/TalkBack, системный Back/predictive Back, safe areas, клавиатуры, permission deny/allow, приложение из background/terminated, 16 KB. Touch цели: минимум 44pt iOS/48dp Android как проектная цель, расширенный hitSlop учитывать. Браузерный автоматический порог 24px из V6 не означает нативную приёмку touch targets.

Performance измерять на release build: cold/warm launch, каталог с объёмом реального API, память/время JS/UI, загрузка изображений, list virtualization, скролл, low-network/offline. Снимать устройство/OS/build/сеть и метод измерения, не объявлять «скорость как Ozon» по ноутбуку. Анимация не должна задерживать получение данных или создавать искусственное ожидание.

## Выходные доказательства

Для каждого прогона: версия/commit или hash экспортного bundle, дата, окружение, сценарий, expected/actual, severity, screenshot/video без ПД, лог ошибок, известные ограничения. Дефект закрывается повтором изменённого сценария и затронутых зависимых путей; не увеличивать счётчик тестов ради процента. Релиз требует также [security negative cases](security.md) и [store gates](store-compliance.md).
