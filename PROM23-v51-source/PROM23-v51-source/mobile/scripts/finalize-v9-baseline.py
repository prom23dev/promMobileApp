import json,pathlib,shutil,datetime,collections,urllib.parse
root=pathlib.Path(__file__).resolve().parents[2]; out=root/'docs/audit'; p=out/'current-build-v9-baseline.json'
r=json.loads(p.read_text()); assert r.get('finishedAt'),'Mass traversal still running; do not rewrite evidence while script writes'
reg=json.loads((out/'current-build-v9-registry.json').read_text()); supplemental=json.loads((out/'current-build-v9-supplement.json').read_text()); initial=json.loads((root/'docs/testing/v9-foundation-initial-probe.json').read_text())
raw=out/'current-build-v9-baseline-raw.json'
if not raw.exists(): shutil.copyfile(p,raw)
public=next(s for s in r['surfaces'] if s['id']=='published'); local=next(s for s in r['surfaces'] if s['id']=='local')
public['phase']='PUBLISHED_V8_BEFORE'; local['phase']='FIRST_FOUNDATION_NOT_BEFORE';r['phase']='MASTER5_PHASE0_PUBLISHED_BASELINE_PLUS_SEPARATE_LOCAL_FOUNDATION';r['phaseCaveat']='Published V8 was unchanged. Local Foundation was already deployed before first local browser navigation; local screenshots are NOT V8 BEFORE.'
retries={x['route']:x for x in supplemental['items']}
for row in public['screens']:
 if row['status']=='BROKEN' and row['route'] in retries:
  old=dict(row);row.update(retries[row['route']]);row['firstAttempt']={'status':old['status'],'error':old['error']};row['status']='RENDERED_AFTER_RETRY'; row['navStatus']=('PASS' if row['hasBottomNav'] else 'MISSING') if row['expectBottomNav'] else ('VISIBLE_IN_IMMERSIVE' if row['hasBottomNav'] else 'INTENTIONAL_HIDDEN');row['retryEvidence']='current-build-v9-supplement.json'
for row in local['screens']:
 match=next((a for a in initial['retries'] if a['route']==row['route']),None)
 if row['status']=='BROKEN' and match and match['nav']==1:
  row['firstAttempt']={'status':row['status'],'error':row['error']};row['status']='RENDERED_AFTER_RETRY';row['hasBottomNav']=True;row['title']=match['title'];row['excerpt']=match['body'];row['navStatus']='PASS' if row['expectBottomNav'] else 'VISIBLE_IN_IMMERSIVE';row['retryEvidence']='../testing/v9-foundation-initial-probe.json';row['measurementLimit']='Retry confirms body and shared nav; no separate overflow/back measurement.'
for item in supplemental['items']:
 if item.get('screenshot'):
  row=next((x for x in public['screens'] if x['route']==item['route']),None)
  if row:row['settledScreenshot']=item['screenshot']
for s in [public,local]:
 screens=s['screens']; s['initialSummary']=s.get('summary');s['summary']={'routes':len(screens),'rendered':sum(x['status'].startswith('RENDERED') for x in screens),'brokenUnresolved':sum(x['status']=='BROKEN' for x in screens),'retriedAndRendered':sum(x['status']=='RENDERED_AFTER_RETRY' for x in screens),'expectedBottomNav':sum(x['expectBottomNav'] for x in screens),'missingBottomNav':sum(x.get('navStatus')=='MISSING' for x in screens),'withBottomNav':sum(bool(x.get('hasBottomNav')) for x in screens),'immersiveExceptions':sum(not x['expectBottomNav'] for x in screens),'documentOverflowObserved':sum(x.get('documentWidth',0)>x.get('width',390)+1 for x in screens),'pageErrors':len(s['pageErrors']),'blockedWrites':len(s['blockedWrites'])}
# Correct misleading initial output directory naming; preserve raw original report as execution evidence.
old=out/'v9-before/local'; new=out/'v9-foundation-first'
if old.exists() and not new.exists(): shutil.move(old,new)
for obj in local['screens']+local['states']:
 for key in ['screenshot','settledScreenshot']:
  if obj.get(key):obj[key]=obj[key].replace('v9-before/local/','v9-foundation-first/')
r['normalization']={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'raw':'current-build-v9-baseline-raw.json','supplement':'current-build-v9-supplement.json','localRetry':'../testing/v9-foundation-initial-probe.json','notes':'6s readiness/goto timeouts were explicitly rechecked; legal pages with only2controls did not satisfy the initial >2control heuristic. No failed state silently counted as passed.'};p.write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n')
summary=public['summary'];found=local['summary']
md=f'''# MASTER5 — текущая сборка: доказательный baseline V9

Проверены **{summary['routes']} URL опубликованной V8** и отдельно **{found['routes']} URL первой локальной Foundation**. Опубликованная версия открывается; основной подтверждённый P0 — нижняя навигация отсутствует на {summary['missingBottomNav']} обычных маршрутах. После добавления товара PDP не предоставляет переход в корзину одним нажатием.

Это аудит существующей реализации, а не подтверждение приёма реальных заказов. Наличие формы и HTTP200 не означают успешную интеграцию Bitrix24/1С/платёжного сервиса.

## Версии и границы

| Поверхность | Фаза | Entry | SHA-256 |
|---|---|---|---|
| http://159.253.19.172:18087 | V8 BEFORE | `{public['build']['entry']}` | `{public['build']['sha256']}` |
| http://127.0.0.1:8087 | First Foundation, **не BEFORE** | `{local['build']['entry']}` | `{local['build']['sha256']}` |

Локальный export изменился до первого локального открытия браузера. Скриншоты BEFORE поэтому относятся только к опубликованной V8. Реестр исходных routes V8 сохранён до перестройки оболочки. Browser contexts изолированы, размер390×844, reduced-motion включён. Для проверки корзины добавлена1 единица товара в собственную гостевую сессию; контакты/аккаунты владельца не использовались. Разрешены только собственные preview sessions/actions; реальные формы, платежи, звонки и внешние POST не выполнялись. QA не управляла сервером и не изменяла UI.

## Покрытие

| Метрика | Опубликованная V8 | First Foundation |
|---|---:|---:|
| URL | {summary['routes']} | {found['routes']} |
| Отрисовались после проверки | {summary['rendered']} | {found['rendered']} |
| Перепроверены после первоначального timeout | {summary['retriedAndRendered']} | {found['retriedAndRendered']} |
| Неподтверждённая отрисовка после повторной проверки | {summary['brokenUnresolved']} | {found['brokenUnresolved']} |
| Обычные URL, ожидается bottom nav | {summary['expectedBottomNav']} | {found['expectedBottomNav']} |
| Отсутствует ожидаемая bottom nav | {summary['missingBottomNav']} | {found['missingBottomNav']} |
| Явно разрешённые immersive исключения | {summary['immersiveExceptions']} | {found['immersiveExceptions']} |
| Document overflow в выполненных измерениях | {summary['documentOverflowObserved']} | {found['documentOverflowObserved']} |
| JavaScript page errors | {summary['pageErrors']} | {found['pageErrors']} |
| Попытки запрещённых POST | {summary['blockedWrites']} | {found['blockedWrites']} |

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
'''
(out/'current-build-v9-baseline.md').write_text(md)
# Full public route inventory; runtime result is separate from functional acceptance.
oldinv=out/'mobile-screen-inventory.md'; hist=out/'mobile-screen-inventory-pre-master5.md'
if oldinv.exists() and not hist.exists():shutil.copyfile(oldinv,hist)
forms={a['id']:a for a in reg['forms']}; pages={a['id']:a for a in reg['pages']}; prods={a['id']:a for a in reg['products']};cats={a['id']:a for a in reg['sections']};blog={a['id']:a for a in reg['blog']}
def meta(route):
 path=route.split('?')[0];id=urllib.parse.unquote(path.split('/')[-1])
 if path.startswith('/catalog/section/'):return cats.get(id,{}).get('name',id),'CatalogScreen nested','Каталог → категория','catalogTree + catalog DTO','source category; SKU subset/empty', 'FIX'
 if path.startswith('/product/'):return prods.get(id,{}).get('name',id),'ProductScreen','Каталог/поиск/подборки','catalog DTO + benefit/availability contracts','source SKU; stock nullable','FIX'
 if path.startswith('/forms/'):return forms.get(id,{}).get('title',id),'FormScreen','Workspace / PDP / content action','siteForms + source handler boundary','form render; submission not accepted','FIX'
 if path.startswith('/workspace/'):return id,'WorkspaceScreen','Кабинет','authenticated site boundary','guest/unavailable; no invented records','FIX'
 if path.startswith('/pages/'):return pages.get(id,{}).get('title',id),'SitePageScreen','Ещё / buyer info / company','sitePages source content','source text/links; no real submit','REDESIGN' if id in ['about','returns','faq','cooperation'] else 'FIX'
 if path.startswith('/blog/'):return blog.get(id,{}).get('title',id),'ArticleScreen','Блог → статья','blogArticles source content','article render; source-disabled comments','FIX'
 if path=='/blog':return 'Блог','BlogScreen','Ещё / главная','blogArticles source content','28articles','FIX'
 if path.startswith('/legal/'):return id,'LegalScreen','Согласия форм / legal links','legalDocuments source policies','read-only legal document','FIX'
 if path.startswith('/information/'):return id,'InformationScreen','Home benefits/company/contact','siteContent + location + source DTO','informational with contextual CTA','FIX'
 lookup={'/':('Главная','CatalogScreen home','Запуск / Главная','home blocks + catalog DTO','source-backed commerce','REDESIGN'),'/catalog':('Каталог / поиск','CatalogScreen','Нижняя вкладка / поиск','catalogTree/catalog DTO','search/category/query/zero','POLISH'),'/cart':('Корзина','CartScreen','Нижняя вкладка / add','own preview session/actions','own1item personal draft','POLISH'),'/favorites':('Избранное','CatalogScreen favorites','Нижняя вкладка','own session favorites','empty initial','POLISH'),'/account':('Кабинет','AccountScreen','Нижняя вкладка','own guest context + workspace links','guest personal; organization gated','POLISH'),'/checkout-preview':('Оформление','CheckoutScreen','Корзина → оформить','checkout capability + site boundary','draft; real order gated','POLISH'),'/more':('Ещё','MoreScreen','Header menu / account','sitePages/forms/navigation','grouped links','FIX'),'/not-a-route':('Не найдено','+not-found','Неверный deep link','router fallback','recoverable unavailable','FIX')}
 return lookup.get(path,(path,'Specialized screen','Account / service / commerce links','own session + site boundary','route render; no external action','FIX'))
text=['# Mobile screen inventory — MASTER5 / опубликованная V8','',f'Полный маршрутный runtime inventory: **{len(public["screens"])} URL**. Исходный V8 registry сохранён до перестройки AppShell. [Версия/границы/результаты](current-build-v9-baseline.md), [машинное доказательство](current-build-v9-baseline.json).','', '**Implemented/Rendered не равно Functional accepted.** Каждый URL реально открыт в изолированной сессии390×844; функциональные внешние операции не запускались. Action ниже относится к BEFORE V8. Отдельная новая Foundation уже исправляет shell; её финальная приёмка не переносится автоматически из baseline.','', '| Route | Screen / название | Entry point | Bottom nav: expected / V8 | Back visible | Data source | State / functional scope | UX action |','|---|---|---|---|---|---|---|---|']
esc=lambda x:str(x).replace('|','\\|').replace('\n',' ')
for row in public['screens']:
 title,screen,entry,data,state,action=meta(row['route']); nav=('yes' if row['expectBottomNav'] else 'immersive exception')+' / '+('yes' if row.get('hasBottomNav') else 'no');back='yes' if row.get('back') else 'no / not measured' if row['status']=='BROKEN' else 'no';status=state+'; '+row['status'];text.append('| `'+row['route']+'` | '+esc(screen+' — '+title)+' | '+entry+' | '+nav+' | '+back+' | '+data+' | '+status+' | '+action+' |')
text+=['','## Route patterns V8, сохранённые до изменения','', '| Pattern | Source file |','|---|---|']
for item in reg['patterns']:text.append(f'| `{item["route"]}` | `{item["file"]}` |')
text+=['','## Текущая Foundation — отдельная архитектурная запись','', 'После фиксации V8 registry root изменил AppShell:5вкладок `(home)/(search)/(shopping)/(saved)/(user)`, у каждой retained Stack и thin route reexports обычных экранов. Public URL-контракт сохранён. Поэтому количество физических файлов больше количества пользовательских экранов; это не дубликаты меню. Checkout остаётся root immersive, auth скрывает nav, fallback ещё требует решения.','', 'Foundation baseline прошёл те же412 URL; независимый4-сценарный gate подтверждает PDP→Cart1tap, ContactsBack, stack/scroll retention и childReload/Back. Это **не** проверка всех возможных group-qualified deep links и не нативная приёмка. На окончательном export нужен повтор route test с явным `expectBottomNav` и immersive gallery/keyboard checks.','', 'LocationPicker — модальный state, а не самостоятельный route: screenshot [опубликованная V8](v9-before/published/location.png). При открытом modal нижняя nav может быть недоступна фокусу; после закрытия должна возвращаться.','']
oldinv.write_text('\n'.join(text));print('Finalized',summary,found)
