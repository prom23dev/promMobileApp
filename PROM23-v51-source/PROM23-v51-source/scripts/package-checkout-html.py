# coding: utf-8
from pathlib import Path
import hashlib,json,zipfile
repo=Path('/Users/prom23/Projects/prom23-mobile');folder=Path('/Users/prom23/Downloads/Служебные страницы');out=folder/'оформление заказа';r=json.loads((repo/'docs/parity/evidence/checkout-html/report.json').read_text());assert all(c['pass'] for c in r['checks']) and not r['errors']
(out/'ПРОВЕРКА.txt').write_text('''Оформление заказа — HTML, 13.09.2026.
Основа: страница v16 / mobile 4e23710. Весь утверждённый текст сохранён.
354/354 браузерных проверок на ширинах 320, 390, 768, 1280 px.
Проверены: пять шагов, H1/H2/H3/H4, все абзацы и списки, выделенные условия счёта/лизинга, ссылки Битрикс, отсутствие переполнения, кнопки от 44 px, окно лизинга, фокус и его возврат, закрытие по Escape и ссылке возврата. Также: без JavaScript, автономный просмотр file://, настройки маршрутов, UTF-8 шаблон Битрикс, изоляция стилей, Reduce Motion. JS-ошибок нет.
Мобильные и широкие скриншоты просмотрены. CRC архива и SHA256 вложений проверены при упаковке. В manifest.json перечислены все файлы, кроме самого манифеста.
PHP, установка на реальный Битрикс, регистрация, отправка заказов и лизинговых заявок не выполнялись. Это информационная страница с переходами в штатные компоненты магазина.
''')
files={str(p.relative_to(out)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(out.rglob('*')) if p.is_file() and p.name!='manifest.json'}
(out/'manifest.json').write_text(json.dumps({'page':'Оформление заказа','source':'v16 / 4e23710','encoding':'UTF-8','files':files},ensure_ascii=False,indent=2))
archive=folder/'оформление заказа.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(out.rglob('*')):
  if p.is_file():z.write(p,out.name+'/'+str(p.relative_to(out)))
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None and len(z.namelist())==len(files)+1
 for n,d in files.items():assert hashlib.sha256(z.read(out.name+'/'+n)).hexdigest()==d
previous={'доставка.zip':'e72f9112303a0eabc38beaeaa1ac387b1b2ffd5d41eeeccd3535373dfff049be','сотрудничество.zip':'f38585a3f6cd9dbdefd996a1461367ce74e68f1b4fd528e2b73421ca3bc814d5','оплата.zip':'f5e5cb8808aefa3e36771665cb6f48f482f219010ffa8faf57a6e5e9a45c895b'}
for n,d in previous.items():assert hashlib.sha256((folder/n).read_bytes()).hexdigest()==d
result={'archive':str(archive),'files':len(files)+1,'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'checks':len(r['checks']),'previousArchivesUnchanged':True}
(repo/'docs/parity/evidence/checkout-html/package.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False))
