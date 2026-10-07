# coding: utf-8
from pathlib import Path
import re,json,html,shutil
repo=Path('/Users/prom23/Projects/prom23-mobile'); out=Path('/Users/prom23/Downloads/Служебные страницы/сотрудничество'); out.mkdir(parents=True,exist_ok=True); (out/'assets').mkdir(exist_ok=True); (out/'bitrix').mkdir(exist_ok=True)
s=(repo/'mobile/src/ui/CooperationPage.tsx').read_text(); data=json.loads(Path('/Users/prom23/Projects/prom23-mobile/docs/parity/evidence/cooperation-html/source-capture.json').read_text())
paras=re.findall(r'<P>([^<{]+)</P>',s)
dirs=re.findall(r"\{ id: '([^']+)', icon: \w+, title: '([^']+)', text: '([^']+)', cta: '([^']+)' \}",s)
facts=re.findall(r"\{ title: '([^']+)', text: '([^']+)' \}",s)
def p(i): return '<p>'+html.escape(paras[i])+'</p>'
def h(t,n=2): return f'<h{n}>'+html.escape(t)+f'</h{n}>'
arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>'
paths={'business':'/business/','specification':'#p23c-request','selection':'#p23c-request','productionRequest':'#p23c-request','production':'/vendor/','suppliers':'/suppliers/#become-supplier','franchise':'/franchise/','contacts':'/contacts/'}
def action(label,key,primary=False): return '<a class="p23c-action'+(' p23c-primary' if primary else '')+'" data-route="'+key+'" href="'+paths[key]+'"><span>'+label+'</span>'+arrow+'</a>'
def section(id,title,content): return '<section id="p23c-'+id+'" class="p23c-section" aria-labelledby="p23c-title-'+id+'"><h2 id="p23c-title-'+id+'">'+title+'</h2><div class="p23c-content">'+content+'</div></section>'
nav='<nav class="p23c-directions" aria-label="Форматы сотрудничества">'
for i,(id,title,txt,cta) in enumerate(dirs):
    icon=re.sub(r' class="[^"]*"','',data['icons'][i]); icon=icon.replace('<svg ','<svg focusable="false" ')
    nav+='<a class="p23c-direction" href="#p23c-'+id+'"><span class="p23c-direction-heading">'+icon+'<span>'+title+'</span></span><span class="p23c-direction-copy">'+txt+'</span><span class="p23c-direction-cta">'+cta+arrow.replace('p23c-','p23c-').replace('d="M5 12h14m-6-6 6 6-6 6"','d="M12 5v14m-6-6 6 6 6-6"')+'</span></a>'
nav+='</nav>'
benefits=re.findall(r"'([^']+)'",re.search(r'const benefits = \[(.*?)\];',s).group(1))
inputs=re.findall(r"'([^']+)'",re.search(r'const inputs = \[(.*?)\];',s).group(1))
business=h('Снабжение компании и строительных объектов',3)+p(2)+'<ul class="p23c-benefits">'+''.join('<li>'+x+'</li>' for x in benefits)+'</ul>'+action('Все возможности для бизнеса','business')
business+='<div class="p23c-subsection">'+h('Есть спецификация или смета?',4)+p(3)+p(4)+action('Загрузить спецификацию','specification',True)+'</div>'
business+='<div class="p23c-subsection">'+h('Нужно подобрать оборудование?',4)+p(5)+p(6)+action('Подобрать оборудование','selection')+'</div>'
production=h('Изготовим под вашу задачу',3)+p(7)+p(8)+'<ul>'+''.join('<li>'+x+'</li>' for x in inputs)+'</ul>'+p(9)+action('Отправить заявку на изготовление','productionRequest',True)+action('Подробнее о производстве','production')
content='<article id="prom23-cooperation" lang="ru" aria-labelledby="p23c-h1"><header class="p23c-hero"><p class="p23c-eyebrow">Сотрудничество</p><h1 id="p23c-h1">Работаем с бизнесом и партнёрами</h1>'+p(0)+p(1)+'</header>'+nav
content+=section('business','Для бизнеса',business)+section('production','Производство под заказ',production)
content+=section('suppliers','Поставщикам',h('Хотите предложить нам продукцию?',3)+p(10)+p(11)+action('Предложить продукцию','suppliers',True))
content+=section('franchise','Франшиза',h('Развивайте бизнес под брендом «Промышленник»',3)+p(12)+p(13)+action('Условия франшизы','franchise'))
content+=section('trust','«Промышленник» в работе',''.join('<div class="p23c-fact">'+h(t,3)+'<p>'+x+'</p></div>' for t,x in facts))
content+='<section class="p23c-final" aria-labelledby="p23c-help-title"><h2 id="p23c-help-title">Нужна помощь?</h2>'+p(14)+action('Связаться с нами','contacts',True)+'<a class="p23c-action" href="tel:+78002002590">Позвонить 8 (800) 200-25-90</a></section>'
# Default request fallback stays useful without JS; integrated form URLs/host adapters override it.
content+='''<aside id="p23c-request" class="p23c-request" aria-labelledby="p23c-request-title" tabindex="-1"><h2 id="p23c-request-title">Связаться со специалистом</h2><p>Позвоните нам, чтобы обсудить задачу и уточнить способ передачи спецификации, чертежей или других файлов.</p><a class="p23c-action p23c-primary" href="tel:+78002002590">Позвонить 8 (800) 200-25-90</a><a class="p23c-action" data-route="contacts" href="/contacts/">Контакты компании</a><button class="p23c-action p23c-close" type="button">Вернуться на страницу</button></aside></article>'''
(out/'content.html').write_text(content+'\n')
css='''/* Scoped to this fragment; no resets for the host Bitrix page. */
#prom23-cooperation{--p23c-ink:#202338;--p23c-brand:#3D4471;--p23c-accent:#D93916;--p23c-line:#E5E7ED;--p23c-canvas:#F5F6F8;--p23c-header-offset:100px;box-sizing:border-box;max-width:1000px;margin:0 auto;padding:28px 24px 44px;background:var(--p23c-canvas);color:var(--p23c-ink);font:400 16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;text-align:left;display:flex;flex-direction:column;gap:40px;overflow-wrap:break-word}
#prom23-cooperation *,#prom23-cooperation *::before,#prom23-cooperation *::after{box-sizing:border-box}
#prom23-cooperation h1,#prom23-cooperation h2,#prom23-cooperation h3,#prom23-cooperation h4,#prom23-cooperation p{margin:0;padding:0;font-family:inherit;text-transform:none}
#prom23-cooperation h1{font-size:36px;line-height:1.18;font-weight:800;letter-spacing:-.6px;color:var(--p23c-ink)}
#prom23-cooperation h2{font-size:27px;line-height:1.24;font-weight:800;letter-spacing:-.4px;color:var(--p23c-brand);border-left:3px solid var(--p23c-accent);padding-left:12px}
#prom23-cooperation h3{font-size:22px;line-height:1.3;font-weight:700;color:var(--p23c-ink)}
#prom23-cooperation h4{font-size:18px;line-height:1.4;font-weight:700;color:var(--p23c-brand)}
#prom23-cooperation p{font-size:inherit;line-height:inherit;color:inherit}
#prom23-cooperation a{font-family:inherit;text-decoration:none;color:var(--p23c-brand)}
#prom23-cooperation svg{width:24px;height:24px;flex:0 0 24px;display:block;color:inherit}
#prom23-cooperation .p23c-hero{display:flex;flex-direction:column;gap:16px;padding:0 4px}
#prom23-cooperation .p23c-eyebrow{font-size:12px;line-height:18px;font-weight:700;color:var(--p23c-brand)}
#prom23-cooperation .p23c-directions{background:white;border-radius:18px;margin-top:-16px;overflow:hidden;display:block}
#prom23-cooperation .p23c-direction{display:flex;flex-direction:column;gap:12px;padding:22px 24px;border:2px solid transparent;border-bottom:1px solid var(--p23c-line);color:var(--p23c-ink);transition:background .18s}
#prom23-cooperation .p23c-direction:last-child{border-bottom-color:transparent}
#prom23-cooperation .p23c-direction-heading{display:flex;gap:12px;align-items:center;font-size:20px;line-height:26px;font-weight:700;color:var(--p23c-brand)}
#prom23-cooperation .p23c-direction-cta{display:flex;gap:12px;align-items:center;justify-content:space-between;padding-top:4px;font-size:15px;line-height:22px;font-weight:600;color:var(--p23c-brand)}
#prom23-cooperation .p23c-section{display:flex;flex-direction:column;gap:18px;scroll-margin-top:var(--p23c-header-offset)}
#prom23-cooperation .p23c-content{display:flex;flex-direction:column;gap:16px;background:white;padding:24px;border-radius:18px}
#prom23-cooperation .p23c-subsection{display:flex;flex-direction:column;gap:14px;border-top:1px solid var(--p23c-line);padding-top:22px;margin-top:4px}
#prom23-cooperation ul{list-style:disc;margin:0;padding:4px 0 4px 20px;display:flex;flex-direction:column;gap:10px}
#prom23-cooperation li{padding:0 0 0 4px;margin:0;list-style:disc;color:var(--p23c-ink);font:inherit}
#prom23-cooperation li::marker{color:var(--p23c-brand)}
#prom23-cooperation .p23c-benefits{font-weight:600}
#prom23-cooperation .p23c-fact{display:flex;flex-direction:column;gap:10px}
#prom23-cooperation .p23c-fact+.p23c-fact{border-top:1px solid var(--p23c-line);padding-top:18px}
#prom23-cooperation .p23c-final{background:#D7F4F7;padding:24px;border-radius:18px;display:flex;flex-direction:column;gap:16px}
#prom23-cooperation .p23c-action{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:52px;padding:12px 14px;border:2px solid transparent;border-radius:12px;font:600 15px/22px -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;color:var(--p23c-brand);cursor:pointer;background:transparent;text-align:left;transition:background .18s,opacity .18s}
#prom23-cooperation .p23c-action svg{width:20px;height:20px;flex-basis:20px}
#prom23-cooperation .p23c-primary{background:var(--p23c-accent);color:#fff}
#prom23-cooperation a:focus-visible,#prom23-cooperation button:focus-visible{outline:3px solid var(--p23c-accent);outline-offset:3px}
#prom23-cooperation a:active,#prom23-cooperation button:active{opacity:.75}
#prom23-cooperation .p23c-request{display:none;background:#fff;border:1px solid var(--p23c-line);border-radius:18px;padding:24px;scroll-margin-top:var(--p23c-header-offset)}
#prom23-cooperation .p23c-request:target,#prom23-cooperation .p23c-request.p23c-open{display:flex;flex-direction:column;gap:16px}
#prom23-cooperation .p23c-close{display:none}
#prom23-cooperation.p23c-js .p23c-close{display:flex}
#prom23-cooperation .p23c-enter{animation:p23c-fade .35s ease-out both}
@keyframes p23c-fade{from{opacity:.25}to{opacity:1}}
@media(hover:hover){#prom23-cooperation .p23c-direction:hover,#prom23-cooperation .p23c-action:not(.p23c-primary):hover{background:#EDF0F7}#prom23-cooperation .p23c-primary:hover{background:#BD3011}}
@media(max-width:600px){#prom23-cooperation{padding:22px 16px 32px;font-size:15px;line-height:22px}#prom23-cooperation h1{font-size:28px;line-height:33px}#prom23-cooperation h2{font-size:25px;line-height:31px}#prom23-cooperation h3{font-size:20px;line-height:26px}#prom23-cooperation h4{font-size:17px;line-height:24px}#prom23-cooperation .p23c-content,#prom23-cooperation .p23c-final,#prom23-cooperation .p23c-direction,#prom23-cooperation .p23c-request{padding:18px}#prom23-cooperation .p23c-direction-heading{font-size:18px;line-height:24px}#prom23-cooperation .p23c-direction-cta,#prom23-cooperation .p23c-action{font-size:14px;line-height:20px}}
@media(prefers-reduced-motion:reduce){#prom23-cooperation *,#prom23-cooperation *::before,#prom23-cooperation *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
@media print{#prom23-cooperation{max-width:none;background:white;padding:0}#prom23-cooperation .p23c-directions,#prom23-cooperation .p23c-request{display:none}#prom23-cooperation .p23c-section{break-inside:avoid}#prom23-cooperation .p23c-action{color:#202338;background:white}}
'''
(out/'assets/cooperation.css').write_text(css)
config='''/* Set real website form URLs or existing host form trigger selectors before release.
   null means use the honest contact fallback, not a simulated submission.
   Define window.Prom23CooperationConfig BEFORE this file to override defaults. */
window.Prom23CooperationConfig = Object.assign({
  siteOrigin: 'https://prom23.ru',
  headerOffset: 100,
  routes: {business:'/business/',production:'/vendor/',suppliers:'/suppliers/#become-supplier',franchise:'/franchise/',contacts:'/contacts/',specification:null,selection:null,productionRequest:null},
  formTriggers: {specification:null,selection:null,productionRequest:null}
}, window.Prom23CooperationConfig || {});
'''
(out/'assets/config.js').write_text(config)
js='''(function(){'use strict';
function init(){
 const root=document.getElementById('prom23-cooperation');if(!root||root.dataset.ready)return;root.dataset.ready='true';root.classList.add('p23c-js');
 const cfg=window.Prom23CooperationConfig||{}, routes=Object.assign({business:'/business/',production:'/vendor/',suppliers:'/suppliers/#become-supplier',franchise:'/franchise/',contacts:'/contacts/'},cfg.routes), reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 if(Number.isFinite(cfg.headerOffset))root.style.setProperty('--p23c-header-offset',Math.max(0,cfg.headerOffset)+'px');
 root.querySelectorAll('[data-route]').forEach(a=>{const path=routes[a.dataset.route];if(!path)return;try{const url=new URL(path,location.protocol==='file:'?(cfg.siteOrigin||'https://prom23.ru'):location.origin);if(/^https?:$/.test(url.protocol))a.href=url.href;}catch(_){}});
 let returnTo=null,priorHash='';
 root.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||!root.contains(a)||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;
   const selector=(cfg.formTriggers||{})[a.dataset.route];if(selector){let trigger;try{trigger=document.querySelector(selector);}catch(_){}if(trigger&&!root.contains(trigger)){e.preventDefault();trigger.click();return;}}
   const href=a.getAttribute('href');if(!href||!href.startsWith('#p23c-'))return;const target=document.getElementById(href.slice(1));if(!target)return;
   e.preventDefault();if(href==='#p23c-request'){returnTo=a;priorHash=location.hash;target.classList.add('p23c-open');}
   try{history.replaceState(null,'',href);}catch(_){location.hash=href;}
   target.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
 });
 root.querySelector('.p23c-close').addEventListener('click',()=>{root.querySelector('.p23c-request').classList.remove('p23c-open');try{history.replaceState(null,'',location.pathname+location.search+priorHash);}catch(_){location.hash=priorHash;}const target=returnTo||root;target.scrollIntoView({behavior:'auto',block:'center'});target.focus({preventScroll:true});});
 if('IntersectionObserver' in window&&!reduced.matches){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('p23c-enter');observer.unobserve(entry.target);}}),{threshold:.08});root.querySelectorAll('.p23c-section,.p23c-final').forEach(el=>observer.observe(el));}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
'''
(out/'assets/cooperation.js').write_text(js)
head='''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Сотрудничество — Промышленник</title><meta name="description" content="Комплектация строительных объектов, производство под заказ, предложения поставщиков и франшиза Промышленник в России и за рубежом."><link rel="stylesheet" href="assets/cooperation.css"><style>body{margin:0;background:#E9EBF0}.p23c-preview-header{max-width:1000px;margin:0 auto;padding:18px 24px;background:white;font:700 18px/26px -apple-system,BlinkMacSystemFont,Arial,sans-serif;display:flex;flex-wrap:wrap;justify-content:space-between;gap:8px;color:#202338}.p23c-preview-header a{color:#3D4471;text-decoration:none;font-size:14px;min-height:44px;display:flex;align-items:center}.p23c-preview-header span{align-self:center}</style></head><body><header class="p23c-preview-header"><span>Сотрудничество</span><a href="tel:+78002002590">Позвонить</a></header><main>'''
(out/'index.html').write_text(head+content+'</main><script src="assets/config.js"></script><script src="assets/cooperation.js"></script></body></html>')
(out/'для-вставки.html').write_text('<style>'+css+'</style>\n'+content+'\n<script>'+config+'</script>\n<script>'+js+'</script>\n')
(out/'bitrix/include.php').write_text('''<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) { return; }
$promCooperationBase = '/local/prom23-cooperation';
\\Bitrix\\Main\\Page\\Asset::getInstance()->addCss($promCooperationBase . '/assets/cooperation.css');
\\Bitrix\\Main\\Page\\Asset::getInstance()->addJs($promCooperationBase . '/assets/config.js');
\\Bitrix\\Main\\Page\\Asset::getInstance()->addJs($promCooperationBase . '/assets/cooperation.js');
readfile(dirname(__DIR__) . '/content.html');
''')
(out/'bitrix/page-example.php').write_text('''<?php
// Example for a NEW preview page, e.g. /cooperation-preview/index.php.
// Do not overwrite an existing site page or shared template.
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');
$APPLICATION->SetTitle('Сотрудничество');
$APPLICATION->SetPageProperty('title', 'Сотрудничество — Промышленник');
$APPLICATION->SetPageProperty('description', 'Комплектация объектов, производство под заказ, предложения поставщиков и франшиза Промышленник.');
require($_SERVER['DOCUMENT_ROOT'] . '/local/prom23-cooperation/bitrix/include.php');
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
''')
lic=repo/'mobile/node_modules/lucide-react-native/LICENSE'
if lic.exists():shutil.copyfile(lic,out/'assets/LICENSE-lucide.txt')
(out/'ПРОЧИТАТЬ.txt').write_text('''СОТРУДНИЧЕСТВО — HTML ДЛЯ БИТРИКС
Версия: 12 сентября 2026. Основа: Cooperation v12, mobile commit 2354e11.

1. ЧТО ОТКРЫТЬ
index.html — автономный просмотр на компьютере и телефоне, без React и интернета.
content.html — только содержимое страницы, без шапки/подвала приложения.
для-вставки.html — тот же фрагмент с CSS и JS внутри. Вставлять в режиме HTML, а не через визуальный редактор (он может удалить scripts/styles).
assets/ — CSS, JS, настройки и лицензия иконок. Внешних шрифтов, CDN, фотографий и сборщика нет. SVG встроены.

2. УСТАНОВКА В БИТРИКС
Скопируйте папку целиком в /local/prom23-cooperation/.
В шаблоне страницы после подключения bitrix/header.php подключите:
require($_SERVER['DOCUMENT_ROOT'] . '/local/prom23-cooperation/bitrix/include.php');
bitrix/page-example.php — пример НОВОЙ страницы /cooperation-preview/index.php для проверки.
Не перезаписывайте существующую страницу или общий шаблон. Если шаблон уже выводит H1 «Сотрудничество», отключите только его автоматический вывод на этой странице: внутри фрагмента уже есть один H1. Заголовок браузера и хлебные крошки можно сохранить.
CSS ограничен #prom23-cooperation, классы имеют префикс p23c-. Не вставляйте один фрагмент дважды на одной странице.
Шапку, меню, подвал и уведомления сайта обеспечивает ваш шаблон Битрикс. Не вставляйте в него целиком index.html.
При строгой CSP используйте include.php и внешние assets, а не файл со встроенными скриптами. После обновления сбросьте кеш этой страницы/ресурсов.

3. ДЕСКТОП И МОБИЛЬНЫЙ
Одна последовательная колонка. Максимум 1000 px на десктопе, адаптивные поля и типографика ниже 600 px. Навигационные направления ведут к разделам. Заголовки, списки и все утверждённые абзацы сохранены. Плавное появление не скрывает содержимое до загрузки JS; Reduce Motion и отсутствие JS поддерживаются.

4. ССЫЛКИ И ФОРМЫ — НАСТРОЙКИ ПЕРЕД ПУБЛИКАЦИЕЙ
assets/config.js содержит маршруты и headerOffset — высоту закреплённой шапки для якорей.
Ссылки сайта: /business/, /vendor/, /suppliers/#become-supplier, /franchise/, /contacts/.
На HTTP(S) используется текущий домен. При открытии с диска — https://prom23.ru, будущий домен сайта. Телефон: +7 (800) 200-25-90.

Три действия требуют привязки к формам вашего Битрикс:
specification — загрузка спецификации с вложением;
selection — подбор оборудования;
productionRequest — изготовление под заказ.
Для каждого задайте routes.<ключ> = фактический URL страницы формы. Или задайте formTriggers.<ключ> = CSS-селектор уже работающей кнопки открытия формы в общем шаблоне сайта (за пределами этого фрагмента). Код нажмёт существующую кнопку, сохранив штатные обработчики, поля и согласия. Используйте только проверенные селекторы своего шаблона.
Пример после создания реальной страницы: routes.specification = '/ВАШ-ПУТЬ-К-ФОРМЕ/'; это пример настройки, такого URL пакет не создаёт.

Пока значение null, эти три действия открывают явно обозначенный блок связи со специалистом с телефоном и контактами. Он не содержит загрузчика и не сообщает об отправке. Это честный запасной путь, а не готовая интеграция формы. Ссылка «Предложить продукцию» открывает существующую форму поставщика на /suppliers/#become-supplier.
Не привязывайте загрузку файлов к get-business-advice-form-action.php без доработки: в предоставленном исходном контракте этой формы нет файла. Пакет не добавляет серверный upload handler, сессию, CSRF-токены, CRM/1С или обработку согласий. Их сохраняют и подключают штатные формы магазина. Не отправляйте данные напрямую в AJAX-обработчик обычной ссылкой.
После привязки проверить выбор файлов, обязательные поля, отдельные согласия, ошибки и реальный результат отправки в своей среде.

5. ГРАНИЦЫ ПРОВЕРКИ
HTML/CSS/JS проверены локально; установка на реальный Битрикс, PHP и отправка заявок в CRM/1С здесь не выполнялись. Ключей, паролей, внешних трекеров, запросов к preview-серверу и имитации отправки в пакете нет.
''')
print(out)
