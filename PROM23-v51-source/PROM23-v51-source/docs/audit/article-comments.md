# Комментарии публикаций: source-disabled, не пропущенная действующая форма

Проверено 11.09.2026: статическое чтение архива и публичные GET 28 известных страниц блога. PHP не исполнялся; комментарии, CRM-лиды и сообщения не отправлялись. Полные страницы с sessid не сохранялись; в evidence — только публичный source URL, хеш и идентификаторы материала.

`local/components/prom/comments.view/component.php:28` читает HL comments по UF_TARGET_ID + UF_ENTITY_TYPE + UF_ACTIVE. Корневые комментарии/ответы строятся по UF_PARENT_ID; размер страницы по умолчанию4 (72), sort=new меняет порядок корневых записей. «Популярный» путь сам по себе не сортирует по числу лайков: исходный запрос ASC по времени.

`templates/.default/template.php:8–18` содержит comment_text, target_id, entity_type, Bitrix sessid; ответ добавляет parent_id (196–199). **В исходной форме нет отдельного согласия на обработку данных.** `ajax.php:16–36` требует sessid + X-Requested-With, непустой text и положительный target ID. `ajax.php:38–58` допускает гостя; обязательного входа нет. `PREMODERATION_ENABLED=true`, запись первоначально неактивна. `ajax.php:81` вызывает существующий `Bitrix24Webhook::addEntityComment`, а контроллер:618 создаёт соответствующий лид. Этот путь здесь не вызывался.

Ключевое уточнение после первоначального поиска форм: **`local/templates/main/components/bitrix/news/blog/detail.php:85` закомментировал include comments.php**. `projects-detail.php` и `video-detail.php` заканчиваются related-articles и не подключают comments.view. На проверенных публичных страницах отсутствовали main-comment-form/target_id; ссылка/иконка комментариев в news.detail не доказывает наличие формы. Поэтому ранний вердикт MISSING исправлен в forms-parity. ArticleScreen остаётся без публикационной формы; пользователь не просил включать отключённую функцию сайта.

## Проверенные идентификаторы для будущего подключения

`blog/bitrix/news.detail/.default/template.php:98,110` выводит `data-entity-type=articles`, `data-entity-id=arResult.ID`. `blog/detail.php:21` получает ElementID из news.detail; сохранённый `includes/comments.php:9–10` использовал его как TARGET_ID и ENTITY_TYPE_ARTICLES. `local/php_interface/include/defines.php:92` задаёт значение `articles`.

Публичные GET дали единственный article-like ID на19из28страниц: 5статей и14проектов; у1статьи и8видео этого доказательства не было. Это зафиксировано в [article-comment-targets.json](article-comment-targets.json). В `mobile/src/api/article-comments.ts` сохранены **только5 подтверждённых статей**, без преобразования slug или порядкового номера в Bitrix ID. Неподтверждённые URL возвращают null.

`loadArticleComments` всегда возвращает available=false/sourceFeatureEnabled=false/пустой список; `submitArticleComment` не имеет сети и не возвращает успех. Это выключенный типизированный контракт для программистов, не работающая интеграция. Никакие примерные комментарии/авторы/лайки не создавались, UI-контролы не добавлены.

Проверка: TypeScript — без ошибок;2offline теста подтверждают verified target/null для чужого URL, sourceFeatureEnabled=false и отсутствие сетевых вызовов/ложного accepted ([лог](../article-comments-tests-master4.log)).

Если владелец сайта позже явно включит функцию, до write нужны проверка target/parent scope на сервере, решения по гостевому доступу/лимитам/модерации, согласия и версии документов. Согласия в каждой мобильной форме — отдельное пользовательское требование; их нельзя выдавать за уже существующие в исходной comment-форме. Сейчас такой формы в UI нет, согласия не собираются и не сохраняются. Этот аудит не подтверждает юридическую или магазинную приёмку UGC.
