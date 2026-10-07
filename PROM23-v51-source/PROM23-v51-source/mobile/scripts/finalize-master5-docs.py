# -*- coding: utf-8 -*-
from pathlib import Path
import json, shutil, re
root=Path(__file__).resolve().parents[2];d=root/'docs/testing';a=json.loads((d/'master5-acceptance.json').read_text());r=json.loads((d/'qa-v9-final-routes.json').read_text());rows=r['surfaces'][0]['screens']
# Retain the baseline table but publish a current inventory with identical route coverage.
p=root/'docs/audit/mobile-screen-inventory.md'; before=root/'docs/audit/mobile-screen-inventory-v8-baseline.md'
if not before.exists():shutil.copyfile(p,before)
old=before.read_text(); mapped={}
for line in old.splitlines():
    if line.startswith('| `/'):
        cells=[c.strip() for c in line.strip('|').split('|')]
        if len(cells)>=8:mapped[cells[0].strip('`')]=cells
md=['# Mobile screen inventory — MASTER5 / V9','', '**412 URL:400 обычных с нижней навигацией,12 объяснённых immersive,0 подтверждённых broken/missing tabs.**','', 'Полный проход выполнен на ed830, повторены только измерения, поймавшие rate limit/объявленный export503; f511 отдельно проверен по затронутым трём immersive-веткам и procurement. Детальная привязка каждой строки к сборке — [JSON](../testing/qa-v9-final-routes.json). Публичная f511 проверена семью пользовательскими сценариями.','', 'Rendered и navigation PASS не означают подключённую операцию магазина. Source-backed preview и недоступность реальных аккаунтов/заказов указаны отдельно. [BEFORE412](mobile-screen-inventory-v8-baseline.md), [общая приёмка249](../testing/master5-acceptance.md).','', '| Route | Screen / вход | Источник и функциональная граница | Expected bottom nav | Фактический nav | Back | Action |','|---|---|---|---|---|---|---|']
for row in rows:
    parts=mapped.get(row['route'],[]);screen=(parts[1]+'; '+parts[2]) if len(parts)>2 else row['route'];data=(parts[5]+'; '+parts[6]) if len(parts)>6 else 'Source/own preview session; real writes not accepted'
    data=data.replace('own1item','own isolated').replace('PLACEHOLDER','connection boundary')
    action='KEEP navigation; external runtime BLOCKED' if any(z in row['route'] for z in ['/forms/','/workspace/','/order','/service']) else 'KEEP; states outside evidence UNVERIFIED'
    md.append(f"| `{row['route']}` | {screen} | {data} | {'yes' if row['expectBottomNav'] else 'immersive exception'} | {row['navStatus']} | {'yes' if row.get('back') else 'root/not observed'} | {action} |")
md+=['','Шаблоны исходных24 route patterns и инфраструктурные файлы сохранены в [BEFORE inventory](mobile-screen-inventory-v8-baseline.md). Новая shell-архитектура использует пять retained Stack внутри tabs; shared route wrappers переэкспортируют экран, а root checkout и явно перечисленные формы остаются immersive.']
p.write_text('\n'.join(md)+'\n')
# Replace stale OPEN summaries with concrete remainder, preserving original counts in backups/JSON.
md=['# MASTER5 — оставшаяся работа после V9','', 'Открытых строк без объяснения нет. UNVERIFIED — не MISSING. Приёмка UI и исходных контрактов не подменяет приёмку реального магазина.','', f"Итог: {a['counts']['PASS']} PASS / {a['counts']['PARTIAL']} PARTIAL / {a['counts']['BLOCKED']} BLOCKED. Подробности по всем подпунктам в [реестре](master5-acceptance.json).",'', '| № | Статус | Раздел | Оставшаяся граница |','|---:|---|---|---|']
for row in a['rows']:
    if row['status']!='PASS':md.append(f"| {row['id']} | {row['status']} | {row['title']} | {row['evidence'].replace('|','/')} |")
(d/'master5-open-work.md').write_text('\n'.join(md)+'\n')
x=json.loads((d/'master5-ui-crossreference.json').read_text());md=['# MASTER5 — UI/source crossreference','', '249 разделов и1720 подпунктов сохранены в [JSON](master5-ui-crossreference.json). Статусы — итоговая ограниченная приёмка V9; полный текст требований находится в [MASTER](../audit/master-prompt-5.md).','', '| № | Статус | Исходники | Доказательство / граница |','|---:|---|---|---|']
for q in x['requirements']:md.append(f"| {q['section']} | {q['acceptanceStatus']} | "+'; '.join(q['files'])+' | '+q['review'].replace('|','/')+' |')
(d/'master5-ui-crossreference.md').write_text('\n'.join(md)+'\n')
# Preserve the V8 matrix and publish the final test evidence.
p=d/'regression-matrix.md';archive=d/'regression-matrix-before-v9.md'
if not archive.exists():shutil.copyfile(p,archive)
p.write_text('''# V9 — регрессионная матрица

11.09.2026 · final `entry-f511f4c425f0956cb8c2dd105ef3dba2.js`.

| Объём | Результат | Доказательство | Граница |
|---|---|---|---|
| Полный маршрутный реестр |412/412 render;400/400 обычных tabs;12 immersive;0broken | [route JSON](qa-v9-final-routes.json) | Full ed830 + scoped f511 regression; не412 повторных reload на f511 |
| Точные f511 изменения |9/9 PASS | [affected](qa-v9-final-affected.json) |3 ordinary,3 immersive,PDF drop/remove,EXE/11limit,retained input; no upload receipt |
| Покупательские цепочки |6/6 PASS | [flows](qa-v9-final-flows-report.json) | Home, gallery/zoom, add/cart/qty/payment info, save/compare/context, search/history, fake geo |
| Расширенная функциональность |7/7 PASS с отдельным harness retry | [supplement](qa-v9-final-supplement.json) | real hints/correction,Динская/cart/notice,stack/scroll/back,reviews unavailable,procurement validation,contacts/return,25layouts |
| Публичная версия |7/7 PASS; JS SHA до/после одинаковый | [public](qa-v9-public-flows-report.json) | Изолированная собственная сессия; реальные формы/платежи/звонки не выполнялись |
| Дизайнер, content |52 layout views +10 content interactions; исправленные4 headers | [design](../design-critique-v9.md) | Точная привязка candidate1/candidate2 указана в отчёте; minorP2 сохранены |
| Responsive финального UI |25 комбинаций; ширины320/390/430/768 и844×390;0pageoverflow | [supplement](qa-v9-final-supplement.json) | Web viewport, не реальные устройства |
| Reduced motion | Browser media query включён; flows прошли | [supplement](qa-v9-final-supplement.json) | Native system setting/assistive technology UNVERIFIED |
| Формы / DTO |73 клиентских теста PASS | [technical](technical-release-v9.md) | Source contracts/invalid cases; не73 успешных операции магазина |
| BFF / интеграционные границы |82 server+1proxy PASS | [technical](technical-release-v9.md) | Local isolated fixtures/HTTP; live Bitrix/1C/PSP acceptance BLOCKED |
| Метаданные |5direct+SPA account PASS | [DOM](technical-release-v9-metadata.json) | noindex preview; production SEO не заявлено |
| Native build/device/store | BLOCKED | [technical](technical-release-v9.md) | Expo export/prebuild≠подписанные IPA/AAB/APK, установка/производительность/магазины |
| Полный ручной исходный click-through | PARTIAL | [249](master5-acceptance.md) | Source audit+all mobile routes; не каждый handler исходного сайта отправлен |

Исходные сбои не удалены:76 массовых измерений получили bootstrap rate limit; два paced retry попали в объявленное окно export HTTP503. Отдельные стабильные повторные измерения прошли. Первый geo supplemental тест ошибочно читал `.items` вместо `.data.items`; UI не менялся, правильный тест прошёл. См. `*initial.json`, `qa-v9-final-routes-retry*.json`, `qa-v9-final-supplement-geo-confirmation.json`.

Предыдущая V8 матрица сохранена в [архиве](regression-matrix-before-v9.md). Все доказательства ограничены собственными сессиями, без внешних POST и персональных аккаунтов.
''')
print('Final supporting docs written')
