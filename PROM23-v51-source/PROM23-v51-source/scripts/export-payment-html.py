# coding: utf-8
from pathlib import Path
import json,re,html,shutil,hashlib,zipfile
root=Path('/Users/prom23/Projects/prom23-mobile');out=Path('/Users/prom23/Downloads/Служебные страницы/оплата');out.mkdir(exist_ok=True);(out/'assets').mkdir(exist_ok=True);(out/'bitrix').mkdir(exist_ok=True)
s=(root/'mobile/src/content/paymentPageCopy.ts').read_text();c=json.loads(s[s.index('{'):s.rindex('}')+1]);icons=json.loads((root/'docs/parity/evidence/payment-html/icons.json').read_text())
def svg(s):return re.sub(r' class="[^"]*"','',s).replace('<svg ','<svg focusable="false" ')
def p(t):return '<p>'+html.escape(t)+'</p>'
def ps(a):return ''.join(map(p,a))
def h(t,n=3):return f'<h{n}>'+html.escape(t)+f'</h{n}>'
def ul(a):return '<ul>'+''.join('<li>'+html.escape(t)+'</li>' for t in a)+'</ul>'
arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>'
paths={'delivery':'/delivery/','returns':'/return/','warranty':'/return/','account':'/personal/','documents':'/details/','faq':'#p23p-help','contacts':'/contacts/','cart':'/basket/','orders':'/personal/orders/active/','organization':'/organization/','pay':'https://yandex.ru/legal/yapay_terms/ru/','privacy':'https://yandex.ru/legal/confidential_pay/ru/','split':'https://yandex.ru/legal/pravilarassrochki/ru/'}
def action(t,key,primary=False):return '<a class="p23p-action'+(' p23p-primary' if primary else '')+'" data-route="'+key+'" href="'+paths[key]+'"><span>'+html.escape(t)+'</span>'+arrow+'</a>'
def box(id,body,cls=''):return f'<section id="p23p-{id}" class="p23p-content {cls}" aria-labelledby="p23p-title-{id}">'+body.replace('<h3>',f'<h3 id="p23p-title-{id}">',1)+'</section>'
flows={'security':['Вы','Платёжный сервис','Банк'],'sbp':['Заказ','Выбор СБП','Приложение банка / платёжный интерфейс','Подтверждение оплаты'],'yandex-data':['Оформление заказа','Необходимые данные для платежа','Сервис Яндекс Пэй','Подтверждение оплаты'],'split':['Покупка','Первый платёж','Следующие платежи','График и условия показывает Яндекс'],'invoice':['Состав заказа','Согласование','Счёт','Оплата','Заказ в работу'],'availability':['Состав заказа','Регион','Способ получения','Доступные способы оплаты']}
def flow(key):
 a=flows[key];result=f'<div class="p23p-flow p23p-flow-{key}"><div class="p23p-ribbon" tabindex="0" role="region" aria-label="'+('От чего зависят способы оплаты' if key=='availability' else 'Последовательность действий')+'">'
 for i,t in enumerate(a):
  if i:result+='<span class="p23p-connector" aria-hidden="true">'+('+' if key=='availability' and i<3 else arrow)+'</span>'
  result+='<div class="p23p-flow-item'+(' p23p-result' if key=='availability' and i==3 else '')+'"><span class="p23p-node">'+svg(icons['flows'][key][i])+'</span><span>'+html.escape(t)+'</span></div>'
 return result+'</div><p class="p23p-hint">Листайте схему вправо →</p></div>'
content='<article id="prom23-payment" lang="ru" aria-labelledby="p23p-h1"><header class="p23p-hero"><p class="p23p-eyebrow">'+c['4']['eyebrow']+'</p><h1 id="p23p-h1">'+c['4']['h1']+'</h1>'+ps(c['4']['text'])+'</header><nav class="p23p-methods" aria-label="Способы оплаты">'
for i,id in enumerate(['card','sbp','pay','split','receipt','invoice']):
 d=c[str(i+5)];content+=f'<a class="p23p-method" href="#p23p-{id}"><span class="p23p-method-icon">'+svg(icons['nav'][i])+'</span><strong>'+d['title']+'</strong><span>'+d['text'][0]+'</span></a>'
content+='</nav><section class="p23p-section" aria-labelledby="p23p-b2c"><h2 id="p23p-b2c">Для физических лиц</h2>'
d=c['14'];content+=box('card',h(d['h3'])+ps(d['text'][:2])+'<p class="p23p-note"><strong>'+d['note']+'</strong></p>'+p(d['text'][2])+flow('security'))
d=c['16'];content+=box('sbp',h(d['h3'])+ps(d['text'])+flow('sbp'))
d=c['18'];content+=box('pay',h(d['h3'])+p(d['text'][0])+flow('yandex-data')+p(d['text'][1])+'<div class="p23p-note">'+p(d['text'][2])+'</div>'+ps(d['text'][3:])+'<div class="p23p-legal">'+action('Условия Яндекс Пэй','pay')+action('Политика конфиденциальности Яндекс Пэй','privacy')+'</div>')
d=c['21'];content+=box('split',h(d['h3'])+p(d['text'][0])+flow('split')+p(d['text'][1])+ul(d['list'])+ps(d['text'][2:])+action('Условия Сплита','split'))
d=c['24'];content+=box('plus',h(d['h3'])+ps(d['text']),'p23p-plus')
d=c['26'];content+=box('receipt',h(d['h3'])+ps(d['text'])+flow('availability'))
content+='</section><section class="p23p-section" aria-labelledby="p23p-b2b"><h2 id="p23p-b2b">Для юридических лиц и ИП</h2>'
d=c['29'];body=h(d['h3'])+p(d['text'][0])+ps(d['terms'])+flow('invoice')+p(d['text'][1])+ul(d['list'])+p(d['text'][2]);d=c['31'];body+='<div class="p23p-subsection">'+h(d['h3'])+ps(d['text'][:2])+ul(d['list'])+p(d['text'][2])+'</div>';content+=box('invoice',body,'p23p-business')
d=c['leasing'];content+=box('leasing',h(d['h3'])+ps(d['text'])+action('Открыть кабинет организации','organization'))+'</section>'
content+='<section class="p23p-section" aria-labelledby="p23p-process"><h2 id="p23p-process">Как проходит оплата</h2><ol class="p23p-process">'
for i in range(5):
 d=c[str(i+33)];content+='<li><span class="p23p-number" aria-hidden="true">0'+str(i+1)+'</span><div>'+h(d['title'])+ps(d['text'])+'</div></li>'
content+='</ol><div class="p23p-cart"><div><strong>Корзина</strong><p data-cart-count hidden></p></div>'+action('Открыть корзину','cart')+'</div></section>'
d=c['42'];content+='<section id="p23p-help" class="p23p-help" aria-labelledby="p23p-help-title"><h2 id="p23p-help-title">'+d['h2']+'</h2>'+ps(d['text'])+action('Связаться с менеджером','contacts',True)+action('Заказы и документы','orders')+'<a class="p23p-action" href="tel:+78002002590">Позвонить 8 (800) 200-25-90</a></section>'
content+='<section class="p23p-section" aria-labelledby="p23p-buyer"><h2 id="p23p-buyer">Покупателю</h2><nav class="p23p-buyers" aria-label="Информация покупателю">'
for i,key in enumerate(['delivery','returns','warranty','account','documents','faq','contacts']):
 d=c[str(45+i)];content+='<a class="p23p-tile" data-route="'+key+'" href="'+paths[key]+'">'+svg(icons['buyer'][i])+'<strong>'+d['title']+'</strong><span>'+d['text'][0]+'</span></a>'
content+='</nav></section></article>'
css='''/* Styles apply only to this fragment. */
#prom23-payment{--p23p-ink:#202338;--p23p-brand:#3D4471;--p23p-accent:#D93916;--p23p-line:#E5E7ED;--p23p-canvas:#F5F6F8;--p23p-pale:#EDF0F7;--p23p-offset:100px;box-sizing:border-box;max-width:1000px;margin:0 auto;padding:28px 24px 44px;background:var(--p23p-canvas);color:var(--p23p-ink);font:400 16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;text-align:left;display:flex;flex-direction:column;gap:38px;overflow-wrap:break-word}
#prom23-payment *,#prom23-payment *::before,#prom23-payment *::after{box-sizing:border-box}
#prom23-payment h1,#prom23-payment h2,#prom23-payment h3,#prom23-payment p{margin:0;padding:0;font-family:inherit;text-transform:none;color:inherit}
#prom23-payment h1{font-size:36px;line-height:1.18;font-weight:800;letter-spacing:-.6px}
#prom23-payment h2{font-size:27px;line-height:1.24;font-weight:800;color:var(--p23p-brand);border-left:3px solid var(--p23p-accent);padding-left:12px}
#prom23-payment h3{font-size:22px;line-height:1.3;font-weight:700}
#prom23-payment p{font-size:inherit;line-height:inherit}
#prom23-payment a{font:inherit;text-decoration:none;color:var(--p23p-brand)}
#prom23-payment svg{width:24px;height:24px;flex:0 0 24px;display:block;stroke:currentColor;color:var(--p23p-brand)}
#prom23-payment .p23p-hero,#prom23-payment .p23p-section{display:flex;flex-direction:column;gap:18px}
#prom23-payment .p23p-eyebrow{font-size:12px;font-weight:700;color:var(--p23p-brand)}
#prom23-payment .p23p-methods,#prom23-payment .p23p-buyers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
#prom23-payment .p23p-method,#prom23-payment .p23p-tile{display:flex;flex-direction:column;gap:11px;padding:18px;background:#fff;border:2px solid transparent;border-radius:18px}
#prom23-payment .p23p-method>strong{font-size:17px;line-height:23px}#prom23-payment .p23p-method>span:last-child{color:var(--p23p-ink)}
#prom23-payment .p23p-method-icon{display:flex;align-items:center;justify-content:center;width:42px;height:42px;background:var(--p23p-pale);border-radius:12px}
#prom23-payment .p23p-content{display:flex;flex-direction:column;gap:16px;padding:24px;background:#fff;border:2px solid transparent;border-radius:18px;min-width:0;scroll-margin-top:var(--p23p-offset)}
#prom23-payment .p23p-content:target{border-color:#FED7AA}
#prom23-payment .p23p-subsection{display:flex;flex-direction:column;gap:16px;border-top:1px solid var(--p23p-line);padding-top:22px;margin-top:6px}
#prom23-payment .p23p-note{padding:14px;background:var(--p23p-pale);border-radius:12px}
#prom23-payment .p23p-legal{border-top:1px solid var(--p23p-line);padding-top:8px}
#prom23-payment .p23p-plus{background:#F3E8FF}#prom23-payment .p23p-business{background:var(--p23p-pale)}
#prom23-payment ul{list-style:disc;display:flex;flex-direction:column;gap:9px;margin:0;padding:2px 0 2px 20px}
#prom23-payment ul>li{list-style:disc;margin:0;padding:0 0 0 4px;font:inherit;color:inherit}#prom23-payment li::marker{color:var(--p23p-brand)}
#prom23-payment .p23p-flow{border-radius:14px;background:var(--p23p-canvas);min-width:0;overflow:hidden}
#prom23-payment .p23p-flow-yandex-data{background:#D7F4F7}
#prom23-payment .p23p-ribbon{display:flex;align-items:flex-start;gap:0;padding:12px;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:thin}
#prom23-payment .p23p-flow-item{flex:1 0 128px;min-width:0;display:flex;flex-direction:column;align-items:center;gap:9px;padding:4px 2px;text-align:center;font-size:14px;line-height:20px;font-weight:600}
#prom23-payment .p23p-flow-security .p23p-flow-item{flex:1 1 0}#prom23-payment .p23p-flow-invoice .p23p-flow-item{flex-basis:96px}#prom23-payment .p23p-flow-availability .p23p-flow-item{flex-basis:104px}
#prom23-payment .p23p-node{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:1px solid var(--p23p-line);border-radius:10px;background:white;flex-shrink:0}#prom23-payment .p23p-node svg{width:20px;height:20px;flex-basis:20px}
#prom23-payment .p23p-connector{display:flex;align-items:center;justify-content:center;flex:0 0 24px;height:34px;margin-top:4px;color:var(--p23p-brand);font-size:19px}#prom23-payment .p23p-connector svg{width:18px;height:18px;flex-basis:18px}
#prom23-payment .p23p-result{background:var(--p23p-pale);border-radius:10px;color:var(--p23p-brand)}
#prom23-payment .p23p-hint{font-size:12px;line-height:18px;color:#5E647C;padding:0 14px 10px}#prom23-payment .p23p-hint[hidden]{display:none}
#prom23-payment .p23p-process{list-style:none;counter-reset:step;margin:0;padding:24px;background:white;border-radius:18px}
#prom23-payment .p23p-process>li{position:relative;list-style:none;display:flex;gap:14px;margin:0;padding:0 0 26px;color:inherit}
#prom23-payment .p23p-process>li:last-child{padding-bottom:0}#prom23-payment .p23p-process>li>div{flex:1;min-width:0;display:flex;flex-direction:column;gap:9px}
#prom23-payment .p23p-process>li:not(:last-child)::before{content:"";position:absolute;left:17px;top:36px;bottom:0;width:3px;background:var(--p23p-line)}
#prom23-payment .p23p-process>li:not(:last-child)::after{content:"";position:absolute;left:17px;top:36px;bottom:0;width:3px;background:var(--p23p-accent);transform:scaleY(var(--p23p-progress,1));transform-origin:top}
#prom23-payment .p23p-number{position:relative;z-index:1;width:38px;height:38px;flex:0 0 38px;display:flex;align-items:center;justify-content:center;background:#FFF0E8;color:var(--p23p-brand);border-radius:12px;font-size:14px;font-weight:800}
#prom23-payment .p23p-cart{display:flex;flex-wrap:wrap;align-items:center;gap:12px;padding:14px;border:1px solid var(--p23p-line);border-radius:16px;background:#fff}#prom23-payment .p23p-cart>div{flex:1 1 210px}#prom23-payment .p23p-cart .p23p-action{background:var(--p23p-pale)}#prom23-payment [data-cart-count]{font-size:14px;color:#5E647C}
#prom23-payment .p23p-help{display:flex;flex-direction:column;gap:16px;background:#D7F4F7;border-radius:18px;padding:24px;scroll-margin-top:var(--p23p-offset)}
#prom23-payment .p23p-action{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:52px;padding:12px 14px;border:2px solid transparent;border-radius:12px;font-weight:600;font-size:15px;line-height:22px;cursor:pointer}
#prom23-payment .p23p-action svg{width:20px;height:20px;flex-basis:20px}#prom23-payment .p23p-primary{background:var(--p23p-accent);color:#fff}#prom23-payment .p23p-primary svg{color:#fff}
#prom23-payment .p23p-tile{font-size:15px;line-height:21px}#prom23-payment .p23p-tile>span{font-size:14px;line-height:20px;color:#5E647C}
#prom23-payment a:focus-visible,#prom23-payment .p23p-ribbon:focus-visible{outline:3px solid var(--p23p-accent);outline-offset:2px}
#prom23-payment .p23p-enter{animation:p23p-fade .3s ease-out both}@keyframes p23p-fade{from{opacity:.3}to{opacity:1}}
@media(hover:hover){#prom23-payment .p23p-method:hover,#prom23-payment .p23p-tile:hover,#prom23-payment .p23p-action:not(.p23p-primary):hover{background:var(--p23p-pale)}}
@media(max-width:600px){#prom23-payment{padding:22px 16px 32px;font-size:15px;line-height:22px}#prom23-payment h1{font-size:28px;line-height:33px}#prom23-payment h2{font-size:25px;line-height:31px}#prom23-payment h3{font-size:20px;line-height:26px}#prom23-payment .p23p-content,#prom23-payment .p23p-help,#prom23-payment .p23p-process{padding:18px}#prom23-payment .p23p-action{font-size:14px;line-height:20px}#prom23-payment .p23p-cart .p23p-action{flex:1 1 184px}}
@media(max-width:379px){#prom23-payment .p23p-methods{grid-template-columns:minmax(0,1fr)}}
@media(prefers-reduced-motion:reduce){#prom23-payment *,#prom23-payment *::before,#prom23-payment *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}#prom23-payment .p23p-process>li::after{transform:none!important}}
@media print{#prom23-payment{max-width:none;padding:0;background:#fff}#prom23-payment .p23p-methods,#prom23-payment .p23p-hint{display:none}#prom23-payment .p23p-ribbon{flex-wrap:wrap;overflow:visible}#prom23-payment .p23p-content{break-inside:avoid}}
'''
config='''/* Override before this file; all routes are website routes, never preview API routes. */
window.Prom23PaymentConfig=Object.assign({
 siteOrigin:'https://prom23.ru', headerOffset:100,
 routes:{delivery:'/delivery/',returns:'/return/',warranty:'/return/',account:'/personal/',documents:'/details/',faq:null,contacts:'/contacts/',cart:'/basket/',orders:'/personal/orders/active/',organization:'/organization/'},
 cartCounter:null
},window.Prom23PaymentConfig||{});
'''
js='''(function(){'use strict';function init(){const root=document.getElementById('prom23-payment');if(!root||root.dataset.ready)return;root.dataset.ready='true';const cfg=window.Prom23PaymentConfig||{},motion=matchMedia('(prefers-reduced-motion: reduce)');if(Number.isFinite(cfg.headerOffset))root.style.setProperty('--p23p-offset',Math.max(0,cfg.headerOffset)+'px');
root.querySelectorAll('[data-route]').forEach(a=>{const path=(cfg.routes||{})[a.dataset.route]||a.getAttribute('href');if(!path||path.startsWith('#'))return;try{const url=new URL(path,location.protocol==='file:'?(cfg.siteOrigin||'https://prom23.ru'):location.origin);if(/^https?:$/.test(url.protocol))a.href=url.href}catch(_){}});
root.addEventListener('click',e=>{const a=e.target.closest('a');if(!a||!root.contains(a)||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const href=a.getAttribute('href');if(!href||!href.startsWith('#p23p-'))return;const target=document.getElementById(href.slice(1));if(!target)return;e.preventDefault();try{history.replaceState(null,'',href)}catch(_){}target.setAttribute('tabindex','-1');target.scrollIntoView({behavior:motion.matches?'auto':'smooth',block:'start'});target.focus({preventScroll:true});});
const ribbons=[...root.querySelectorAll('.p23p-ribbon')];function size(){ribbons.forEach(el=>{const overflow=el.scrollWidth>el.clientWidth+1;el.tabIndex=overflow?0:-1;el.nextElementSibling.hidden=!overflow})}size();if('ResizeObserver'in window){const ro=new ResizeObserver(size);ribbons.forEach(el=>ro.observe(el))}else window.addEventListener('resize',size);
if(cfg.cartCounter){let counter;try{counter=document.querySelector(cfg.cartCounter)}catch(_){}if(counter){const update=()=>{const t=counter.textContent.trim();const output=root.querySelector('[data-cart-count]');const n=Number(t);output.hidden=!/^\\d+$/.test(t)||!Number.isSafeInteger(n);if(!output.hidden)output.textContent=n+' ед. в корзине'};update();new MutationObserver(update).observe(counter,{childList:true,characterData:true,subtree:true});}}
if('IntersectionObserver'in window&&!motion.matches){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('p23p-enter');io.unobserve(e.target)}}),{threshold:.08});root.querySelectorAll('.p23p-content,.p23p-help').forEach(el=>io.observe(el))}
const steps=[...root.querySelectorAll('.p23p-process>li')];let pending=false;function progress(){pending=false;steps.forEach(el=>{const r=el.getBoundingClientRect();el.style.setProperty('--p23p-progress',motion.matches?1:Math.max(0,Math.min(1,(innerHeight*.68-r.top)/r.height)))})}function schedule(){if(!pending){pending=true;requestAnimationFrame(progress)}}window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);motion.addEventListener('change',schedule);progress();
}if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init()})();
'''
(out/'content.html').write_text(content)
(out/'assets/payment.css').write_text(css);(out/'assets/config.js').write_text(config);(out/'assets/payment.js').write_text(js)
head='''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Оплата — способы для физических и юридических лиц | Промышленник</title><meta name="description" content="Способы оплаты заказов Промышленник: карта, СБП, Яндекс Пэй, Сплит, оплата при получении, счёт для организаций и лизинг. Условия оплаты и отгрузки."><link rel="stylesheet" href="assets/payment.css"><style>body{margin:0;background:#E9EBF0}</style></head><body><main>'''
(out/'index.html').write_text(head+content+'</main><script src="assets/config.js"></script><script src="assets/payment.js"></script></body></html>')
(out/'для-вставки.html').write_text('<style>'+css+'</style>\n'+content+'\n<script>'+config+'</script>\n<script>'+js+'</script>')
(out/'bitrix/include.php').write_text('''<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) { return; }
$promPaymentBase = '/local/prom23-payment';
\\Bitrix\\Main\\Page\\Asset::getInstance()->addCss($promPaymentBase . '/assets/payment.css');
\\Bitrix\\Main\\Page\\Asset::getInstance()->addJs($promPaymentBase . '/assets/config.js');
\\Bitrix\\Main\\Page\\Asset::getInstance()->addJs($promPaymentBase . '/assets/payment.js');
readfile(dirname(__DIR__) . '/content.html');
''')
(out/'bitrix/page-example.php').write_text('''<?php
// Example for a NEW /payment-preview/index.php page.
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');
$APPLICATION->SetTitle('Оплата');
$APPLICATION->SetPageProperty('title', 'Оплата — Промышленник');
$APPLICATION->SetPageProperty('description', 'Способы оплаты для физических и юридических лиц: карта, СБП, Яндекс Пэй, Сплит, счёт и лизинг.');
require($_SERVER['DOCUMENT_ROOT'] . '/local/prom23-payment/bitrix/include.php');
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
''')
shutil.copyfile(root/'mobile/node_modules/lucide-react-native/LICENSE',out/'assets/LICENSE-lucide.txt')
(out/'ПРОЧИТАТЬ.txt').write_text('''ОПЛАТА — HTML ДЛЯ БИТРИКС
12 сентября 2026. Основа: Payment v15, mobile 8562591.

СОСТАВ
index.html — автономный просмотр на компьютере и телефоне.
content.html — содержимое без шапки/подвала приложения.
для-вставки.html — фрагмент со встроенными CSS/JS, для HTML-режима редактора.
assets/ — внешние CSS/JS, настройки и лицензия SVG-иконок.
bitrix/ — пример подключения и отдельной страницы.
Внешних шрифтов, CDN, React, ключей и сборщика нет. Открытие index.html не требует интернета; внешние ссылки требуют сеть.

УСТАНОВКА
Все файлы сохранены в UTF-8. Страница Битрикс должна отдавать UTF-8. Для старой установки Windows-1251 программисту нужно согласовать кодировку фрагмента и ресурсов.
1. Скопируйте папку в /local/prom23-payment/.
2. После bitrix/header.php подключите:
require($_SERVER['DOCUMENT_ROOT'] . '/local/prom23-payment/bitrix/include.php');
3. bitrix/page-example.php — пример НОВОЙ страницы /payment-preview/index.php. Не перезаписывайте текущую страницу или общий шаблон.
4. Внутри есть один H1: отключите дублирующий автоматический H1 только для этой страницы, сохранив хлебные крошки/метаданные шаблона.
5. Шапка, меню, подвал и согласия на cookie остаются штатными. CSS ограничен #prom23-payment; не вставлять фрагмент дважды. index.html целиком в шаблон не вставлять.
6. При строгой CSP используйте внешние assets/include.php. Вариант для-вставки.html может быть очищен визуальным редактором или заблокирован политикой CSP. Сбросьте кеш страницы и ресурсов после установки.

АДАПТИВ И ПОВЕДЕНИЕ
Максимальная ширина 1000 px, мобильная типографика ниже 600 px. Шесть коротких схем идут горизонтально. Длинные ленты на телефоне листаются; подсказка появляется только при переполнении. Подробные шаги 01–05 вертикальные. Сохранены лизинг, 3 рабочих дня на оплату и отгрузка в течение суток, кроме товаров под заказ.
Без JavaScript текст, якоря и ссылки работают; подсказки прокрутки остаются видимыми как запасной вариант. Reduce Motion отключает анимацию. Внутренние якоря учитывают headerOffset — высоту закреплённой шапки.

ССЫЛКИ И ДАННЫЕ
assets/config.js: routes — URL вашего сайта, headerOffset — высота шапки. HTTP(S) использует текущий домен, файл с диска — https://prom23.ru.
Маршруты основаны на исходниках и предыдущем экспорте доставки: /basket/, /delivery/, /return/, /personal/, /details/, /contacts/, /personal/orders/active/, /organization/.
Для гарантии отдельный URL в архиве не подтверждён — используется /return/. У FAQ нет подтверждённого отдельного URL: по умолчанию ведёт к видимому блоку помощи на этой странице. Задайте routes.faq, если на сайте есть отдельная страница.
Ссылки официальных условий Яндекс Пэй, конфиденциальности и Сплита сохранены. Телефон: +7 (800) 200-25-90.

Статический HTML не получает сессию приложения, не меняет тип покупателя и не придумывает количество товаров. Оба раздела B2C/B2B видны всем. Блок «Корзина» ведёт в настоящую корзину Битрикс. При необходимости задайте cartCounter — CSS-селектор реального счётчика товаров вашего шаблона; число читается только из него и обновляется при изменении. По умолчанию счётчик скрыт.
Кнопка кабинета организации открывает существующую /organization/; регистрацию, авторизацию и заявку на лизинг выполняет штатный сайт. Перед публикацией проверьте маршруты в вашей установленной версии Битрикс.

ГРАНИЦЫ
Это информационная HTML-страница. Она не создаёт оплату, заказ, кредит/лизинг, не собирает данные карты и не отправляет обращения. Тексты условий предоставлены владельцем. Платёжные сервисы, формы, согласия в формах, CRM/1С и авторизация остаются в штатных компонентах магазина. Установку на Битрикс, реальную оплату и отправку заявок здесь не выполняли. Перед запуском сохраняются ограничения исходного аудита магазина; экспорт HTML их не устраняет.
''')
print(out)
