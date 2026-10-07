# coding: utf-8
from pathlib import Path
import json,hashlib,zipfile
root=Path('/Users/prom23/Projects/prom23-mobile');folder=Path('/Users/prom23/Downloads/Служебные страницы');out=folder/'оплата';report=json.loads((root/'docs/parity/evidence/payment-html/report.json').read_text());assert all(x['pass'] for x in report['checks']) and not report['errors']
(out/'ПРОВЕРКА.txt').write_text('''HTML «Оплата», 12 сентября 2026.
Основа — Payment v15 (8562591), согласованные сроки оплаты/отгрузки и лизинг.

521/521 браузерных проверок прошли на 320, 390, 768 и 1280 px. Проверены утверждённые тексты, единственный H1, якоря, клавиатурная прокрутка лент, отсутствие переполнения страницы, кнопки не ниже 44 px, реальные маршруты, отсутствие форм оплаты и выдуманного счётчика корзины.
Дополнительно: без JavaScript, автономный file:// просмотр, UTF-8 шаблон сайта с изолированными стилями, переопределение маршрутов, чтение/обновление счётчика из шаблона, Reduce Motion, официальные ссылки. JS-ошибок нет. Мобильные и широкие скриншоты просмотрены.
Все ресурсы локальные, SVG встроены, лицензия иконок приложена. PHP не запускался; установка на настоящий Битрикс, авторизация, платежи и заявки на лизинг не тестировались. Проверялись HTML/CSS/JS и предусмотренные точки подключения.

В manifest.json — SHA256 каждого файла, кроме самого манифеста. Целостность ZIP и совпадение вложений с исходными файлами проверены при упаковке. Предыдущие архивы служебных страниц сохранены.
''')
files={str(p.relative_to(out)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(out.rglob('*')) if p.is_file() and p.name!='manifest.json'}
(out/'manifest.json').write_text(json.dumps({'page':'Оплата','source':'Payment v15 / 8562591','encoding':'UTF-8','files':files},ensure_ascii=False,indent=2))
archive=folder/'оплата.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(out.rglob('*')):
  if p.is_file():z.write(p,'оплата/'+str(p.relative_to(out)))
with zipfile.ZipFile(archive) as z:
 assert z.testzip() is None
 for name,digest in files.items():assert hashlib.sha256(z.read('оплата/'+name)).hexdigest()==digest
 assert len(z.namelist())==len(files)+1
previous={'доставка.zip':'e72f9112303a0eabc38beaeaa1ac387b1b2ffd5d41eeeccd3535373dfff049be','сотрудничество.zip':'f38585a3f6cd9dbdefd996a1461367ce74e68f1b4fd528e2b73421ca3bc814d5'}
for name,digest in previous.items():assert hashlib.sha256((folder/name).read_bytes()).hexdigest()==digest
result={'archive':str(archive),'files':len(files)+1,'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'checks':len(report['checks']),'previousArchivesUnchanged':True}
(root/'docs/parity/evidence/payment-html/package.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False))
