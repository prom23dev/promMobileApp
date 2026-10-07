# coding: utf-8
from pathlib import Path
import json,html,re
repo=Path('/Users/prom23/Projects/prom23-mobile');out=Path('/Users/prom23/Downloads/Служебные страницы/оформление заказа');out.mkdir(exist_ok=True);(out/'assets').mkdir(exist_ok=True);(out/'bitrix').mkdir(exist_ok=True)
c=json.loads((repo/'docs/parity/CHECKOUT_GUIDE_COPY.json').read_text())
def rich(t):
 return ''.join(('<strong>'+html.escape(x)+'</strong>') if i%2 else html.escape(x) for i,x in enumerate(t.split('**')))
arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>'
paths={'delivery':'/delivery/','payment':'/payment/','leasing':'#p23o-leasing','catalog':'/catalog/','organization':'/organization/'}
def action(t,key,primary=False):
 return '<a '+('id="p23o-leasing-trigger" ' if key=='leasing' else '')+'class="p23o-action'+(' p23o-primary' if primary else '')+'" data-route="'+key+'" href="'+paths[key]+'"><span>'+html.escape(t)+'</span>'+arrow+'</a>'
content='<article id="prom23-order-guide" lang="ru" aria-labelledby="p23o-h1"><h1 id="p23o-h1">'+c['title']+'</h1>'
for n,step in enumerate(c['steps'],1):
 content+=f'<section class="p23o-section" aria-labelledby="p23o-step-{n}"><h2 id="p23o-step-{n}">'+step['title']+'</h2><div class="p23o-content">'
 for i,b in enumerate(step['blocks']):
  if b['kind']=='p':content+='<p>'+rich(b['text'])+'</p>'
  elif b['kind']=='heading':
   level=b['level'];content+=f'<h{level}'+(' class="p23o-divider"' if level==3 and i>0 else '')+'>'+b['text']+f'</h{level}>'
  elif b['kind']=='list':content+='<ul>'+''.join('<li>'+html.escape(t)+'</li>' for t in b['items'])+'</ul>'
  else:content+=action(b['text'],{'/information/delivery':'delivery','/information/payment':'payment','leasing':'leasing'}[b['route']],b['route']=='leasing')
 content+='</div></section>'
content+='''<aside id="p23o-leasing" class="p23o-request" aria-labelledby="p23o-leasing-title" tabindex="-1"><h2 id="p23o-leasing-title">Заявка на лизинг</h2><p>Выберите товар в каталоге. В карточке товара, для которого доступен лизинг, нажмите «Заявка на лизинг».</p><p>Для оформления заявки зарегистрируйтесь и добавьте юридическое лицо в кабинете организации.</p>'''+action('Выбрать товар','catalog',True)+action('Открыть кабинет организации','organization')+'<a class="p23o-action" href="#p23o-leasing-trigger" data-close>Вернуться на страницу</a></aside></article>'
css='''/* Isolated HTML fragment, no styles for the surrounding Bitrix template. */
#prom23-order-guide{--p23o-ink:#202338;--p23o-brand:#3D4471;--p23o-accent:#D93916;--p23o-line:#E5E7ED;--p23o-canvas:#F5F6F8;--p23o-offset:100px;box-sizing:border-box;max-width:1000px;margin:0 auto;padding:28px 24px 44px;background:var(--p23o-canvas);color:var(--p23o-ink);font:400 16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;text-align:left;display:flex;flex-direction:column;gap:32px;overflow-wrap:break-word}
#prom23-order-guide *,#prom23-order-guide *::before,#prom23-order-guide *::after{box-sizing:border-box}
#prom23-order-guide h1,#prom23-order-guide h2,#prom23-order-guide h3,#prom23-order-guide h4,#prom23-order-guide p{margin:0;padding:0;font-family:inherit;color:inherit;text-transform:none}
#prom23-order-guide h1{font-size:36px;line-height:1.18;font-weight:800;letter-spacing:-.6px}
#prom23-order-guide h2{font-size:27px;line-height:1.24;font-weight:800;letter-spacing:-.4px;color:var(--p23o-brand);border-left:3px solid var(--p23o-accent);padding-left:12px}
#prom23-order-guide h3{font-size:22px;line-height:1.3;font-weight:700;padding-top:4px}
#prom23-order-guide h4{font-size:18px;line-height:1.4;font-weight:700;color:var(--p23o-brand);padding-top:4px}
#prom23-order-guide p{font-size:inherit;line-height:inherit}
#prom23-order-guide p strong{font-weight:700;color:var(--p23o-brand)}
#prom23-order-guide a{font-family:inherit;text-decoration:none;color:var(--p23o-brand)}
#prom23-order-guide .p23o-section{display:flex;flex-direction:column;gap:18px;min-width:0}
#prom23-order-guide [id]{scroll-margin-top:var(--p23o-offset)}
#prom23-order-guide .p23o-content{display:flex;flex-direction:column;gap:16px;padding:24px;border-radius:18px;background:#fff;min-width:0}
#prom23-order-guide .p23o-divider{border-top:1px solid var(--p23o-line);padding-top:22px;margin-top:4px}
#prom23-order-guide ul{list-style:disc;margin:0;padding:0 0 0 20px;display:flex;flex-direction:column;gap:9px}
#prom23-order-guide li{list-style:disc;margin:0;padding:0 0 0 4px;font:inherit;color:inherit}#prom23-order-guide li::marker{color:var(--p23o-brand)}
#prom23-order-guide .p23o-action{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:52px;padding:12px;border:2px solid transparent;border-radius:12px;font-size:15px;line-height:22px;font-weight:600;cursor:pointer;text-align:left;transition:background .18s,opacity .18s}
#prom23-order-guide .p23o-action svg{width:20px;height:20px;flex:0 0 20px;display:block;color:inherit}
#prom23-order-guide .p23o-primary{background:var(--p23o-accent);color:white}
#prom23-order-guide a:focus-visible{outline:3px solid var(--p23o-accent);outline-offset:2px}#prom23-order-guide a:active{opacity:.75}
#prom23-order-guide .p23o-request{display:none;background:white;padding:24px;border-radius:18px;outline:none}
#prom23-order-guide .p23o-request:target,#prom23-order-guide .p23o-dialog .p23o-request{display:flex;flex-direction:column;gap:16px}
#prom23-order-guide .p23o-dialog{position:fixed;inset:auto 0 0;width:calc(100% - 24px);max-width:650px;max-height:88dvh;margin:0 auto;padding:0;border:0;border-radius:24px 24px 0 0;background:white;color:var(--p23o-ink);font:inherit;overflow-y:auto;text-align:left}
#prom23-order-guide .p23o-dialog:not([open]){display:none}#prom23-order-guide .p23o-dialog::backdrop{background:rgba(20,27,50,.4)}
#prom23-order-guide .p23o-dialog h2{border:0;padding:0;font-size:23px;line-height:29px;color:var(--p23o-ink)}
#prom23-order-guide .p23o-enter{animation:p23o-reveal .3s ease-out both}@keyframes p23o-reveal{from{opacity:.4}to{opacity:1}}
@media(hover:hover){#prom23-order-guide .p23o-action:not(.p23o-primary):hover{background:#EDF0F7}#prom23-order-guide .p23o-primary:hover{background:#BD3011}}
@media(max-width:600px){#prom23-order-guide{padding:22px 16px 32px;font-size:15px;line-height:22px}#prom23-order-guide h1{font-size:28px;line-height:34px}#prom23-order-guide h2{font-size:25px;line-height:31px}#prom23-order-guide h3{font-size:20px;line-height:26px}#prom23-order-guide h4{font-size:17px;line-height:24px}#prom23-order-guide .p23o-content,#prom23-order-guide .p23o-request{padding:18px}#prom23-order-guide .p23o-action{font-size:14px;line-height:20px}#prom23-order-guide .p23o-dialog{width:100%}}
@media(prefers-reduced-motion:reduce){#prom23-order-guide *,#prom23-order-guide *::before,#prom23-order-guide *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
@media print{#prom23-order-guide{max-width:none;background:white;padding:0}#prom23-order-guide .p23o-request,#prom23-order-guide .p23o-dialog{display:none!important}#prom23-order-guide .p23o-content{break-inside:avoid}}
'''
config='''/* Override before this file. Use existing website pages, never AJAX handlers. */
window.Prom23OrderGuideConfig=Object.assign({siteOrigin:'https://prom23.ru',headerOffset:100,routes:{delivery:'/delivery/',payment:'/payment/',catalog:'/catalog/',organization:'/organization/',leasing:null}},window.Prom23OrderGuideConfig||{});
'''
js='''(function(){'use strict';function init(){const root=document.getElementById('prom23-order-guide');if(!root||root.dataset.ready)return;root.dataset.ready='true';const cfg=window.Prom23OrderGuideConfig||{},reduced=matchMedia('(prefers-reduced-motion: reduce)');if(Number.isFinite(cfg.headerOffset))root.style.setProperty('--p23o-offset',Math.max(0,cfg.headerOffset)+'px');
root.querySelectorAll('[data-route]').forEach(a=>{const path=(cfg.routes||{})[a.dataset.route]||a.getAttribute('href');if(!path||path.startsWith('#'))return;try{const url=new URL(path,location.protocol==='file:'?(cfg.siteOrigin||'https://prom23.ru'):location.origin);if(/^https?:$/.test(url.protocol))a.href=url.href}catch(_){}});
const request=root.querySelector('#p23o-leasing');let dialog=null,returnTo=null;
if(typeof HTMLDialogElement!=='undefined'&&typeof HTMLDialogElement.prototype.showModal==='function'){dialog=document.createElement('dialog');dialog.className='p23o-dialog';dialog.setAttribute('aria-labelledby','p23o-leasing-title');root.append(dialog);dialog.append(request);dialog.addEventListener('close',()=>{if(returnTo)returnTo.focus({preventScroll:true})});dialog.addEventListener('click',e=>{const b=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom))dialog.close()});}
root.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||!root.contains(a)||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const href=a.getAttribute('href');if(a.hasAttribute('data-close')&&dialog&&dialog.open){e.preventDefault();dialog.close();return}if(!href||!href.startsWith('#p23o-'))return;const target=document.getElementById(href.slice(1));if(!target)return;e.preventDefault();if(href==='#p23o-leasing'&&dialog){returnTo=a;dialog.showModal();return}try{history.replaceState(null,'',href)}catch(_){}target.setAttribute('tabindex','-1');target.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});target.focus({preventScroll:true});});
if('IntersectionObserver'in window&&!reduced.matches){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('p23o-enter');observer.unobserve(e.target)}}),{threshold:.08});root.querySelectorAll('.p23o-section>h2').forEach(el=>observer.observe(el))}
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()})();
'''
(out/'content.html').write_text(content);(out/'assets/order-guide.css').write_text(css);(out/'assets/config.js').write_text(config);(out/'assets/order-guide.js').write_text(js)
head='''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Оформление заказа — для себя и бизнеса | Промышленник</title><meta name="description" content="Как оформить заказ в Промышленник: выбрать товары, указать покупателя, способ получения и оплаты, проверить итог. Инструкция для физических лиц и бизнеса."><link rel="stylesheet" href="assets/order-guide.css"><style>body{margin:0;background:#E9EBF0}</style></head><body><main>'''
(out/'index.html').write_text(head+content+'</main><script src="assets/config.js"></script><script src="assets/order-guide.js"></script></body></html>')
(out/'для-вставки.html').write_text('<style>'+css+'</style>\n'+content+'\n<script>'+config+'</script>\n<script>'+js+'</script>')
(out/'bitrix/include.php').write_text('''<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) { return; }
$promOrderGuideBase = '/local/prom23-order-guide';
\\Bitrix\\Main\\Page\\Asset::getInstance()->addCss($promOrderGuideBase . '/assets/order-guide.css');
\\Bitrix\\Main\\Page\\Asset::getInstance()->addJs($promOrderGuideBase . '/assets/config.js');
\\Bitrix\\Main\\Page\\Asset::getInstance()->addJs($promOrderGuideBase . '/assets/order-guide.js');
readfile(dirname(__DIR__) . '/content.html');
''')
(out/'bitrix/page-example.php').write_text('''<?php
// Example for a NEW information page /order-guide-preview/index.php.
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');
$APPLICATION->SetTitle('Оформление заказа');
$APPLICATION->SetPageProperty('title', 'Оформление заказа — Промышленник');
$APPLICATION->SetPageProperty('description', 'Инструкция по оформлению заказа: товары, покупатель, получение, оплата и проверка. Для физических лиц и бизнеса.');
require($_SERVER['DOCUMENT_ROOT'] . '/local/prom23-order-guide/bitrix/include.php');
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
''')
(out/'ПРОЧИТАТЬ.txt').write_text('''ОФОРМЛЕНИЕ ЗАКАЗА — HTML ДЛЯ БИТРИКС
13 сентября 2026. Основа: страница v16, mobile commit 4e23710.

ЧТО ВНУТРИ
index.html — автономный просмотр для компьютера и телефона.
content.html — фрагмент без шапки, меню и подвала приложения.
для-вставки.html — содержимое со встроенными CSS/JS, для HTML-режима редактора.
assets/ — CSS/JS и настройки. bitrix/ — подключение и пример страницы.
Все ресурсы локальные, внешних шрифтов, CDN, React и сборщика нет. Текст доступен без интернета, ссылки на сайт требуют сеть.

УСТАНОВКА
Все файлы UTF-8. Страница Битрикс должна отдавать UTF-8; для старой установки Windows-1251 нужно согласовать кодировку фрагмента и ресурсов.
1. Скопируйте папку в /local/prom23-order-guide/.
2. После bitrix/header.php подключите:
require($_SERVER['DOCUMENT_ROOT'] . '/local/prom23-order-guide/bitrix/include.php');
3. bitrix/page-example.php — пример НОВОЙ информационной страницы /order-guide-preview/index.php. Не заменяйте им действующее оформление заказа или общий шаблон.
4. Фрагмент содержит один H1. Отключите только его дубль, если заголовок уже выводит шаблон; хлебные крошки и метаданные сохраняйте.
5. CSS ограничен #prom23-order-guide. Шапка, подвал, меню, уведомления и согласия сайта остаются штатными. Не вставляйте index.html целиком и не дублируйте фрагмент на одной странице.
6. При строгой CSP используйте include.php и внешние assets. Визуальный редактор может удалить CSS/scripts из для-вставки.html. После установки очистите кеш страницы и ресурсов.

ВЁРСТКА
Пять последовательных шагов, H1/H2/H3/H4, обычные списки. Тексты совпадают с согласованной страницей v16; сроки оплаты и сумма лизинга выделены. Максимальная ширина 1000 px; мобильная типографика ниже 600 px. Включены видимый фокус, мягкое появление заголовков и Reduce Motion.
Без JavaScript текст и ссылки доступны. Ссылка на лизинг открывает нижний блок пояснения через якорь; возврат ведёт к исходной кнопке. С JavaScript блок открывается в диалоге, который можно закрыть кнопкой возврата, Escape или нажатием на фон.

НАСТРОЙКИ И ССЫЛКИ
assets/config.js: headerOffset — высота закреплённой шапки; routes — пути реальных страниц Битрикс.
По умолчанию: /delivery/, /payment/, /catalog/, /organization/.
На HTTP(S) используется текущий домен. При открытии с диска ссылки ведут на https://prom23.ru. Проверяйте пути в вашей установленной версии сайта.

ЛИЗИНГ
По умолчанию routes.leasing = null: кнопка открывает объяснение выбора товара и регистрации организации, как в приложении v16. Заявка в исходном коде требует product-id; пользователь выбирает товар и открывает заявку из его карточки, если лизинг доступен. Прямая отправка или одобрение не имитируются.
Если на сайте есть самостоятельная работающая страница оформления лизинга, можно задать routes.leasing её URL. Не указывайте AJAX-обработчик вместо страницы и не добавляйте фиктивный product-id. Пакет не создаёт регистрацию, проверку организации или лизинговую заявку.

ГРАНИЦЫ
Это информационная страница «Как оформить заказ», а не корзина или платёжная форма. Выбор позиций, промокоды, суммы, получение, платежи, авторизация, формы с согласиями, CRM/1С выполняются штатными компонентами магазина. Пакет не собирает персональные данные и не отправляет заказы.
HTML/CSS/JS проверяются локально. PHP, установка на Битрикс и реальные операции заказа/оплаты/лизинга здесь не запускались. Секретов, внешних трекеров и обращений к preview-серверу в пакете нет.
''')
print(out)
