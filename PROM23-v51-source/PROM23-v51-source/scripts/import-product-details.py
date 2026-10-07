#!/usr/bin/env python3
"""Explicit read-only public PDP snapshot, no credentials/PHP execution/cookies/form POST."""
import concurrent.futures, datetime, hashlib, json, pathlib, re, urllib.parse, urllib.request
from html.parser import HTMLParser
ROOT=pathlib.Path(__file__).resolve().parents[1]
ORIGIN='https://prom.myfast.space'
CACHE=pathlib.Path('/tmp/prom23-master5-pdp')
class Node:
 def __init__(self,tag='',attrs=(),parent=None): self.tag=tag;self.attrs=dict(attrs);self.parent=parent;self.children=[]
 def walk(self):
  yield self
  for c in self.children:
   if isinstance(c,Node): yield from c.walk()
 def has(self,c): return c in self.attrs.get('class','').split()
 def text(self): return ' '.join((c.text() if isinstance(c,Node) else c) for c in self.children if not isinstance(c,Node) or c.tag not in ('script','style','svg'))
class Parser(HTMLParser):
 def __init__(self):super().__init__();self.root=Node();self.cur=self.root
 def handle_starttag(self,t,a):
  n=Node(t,a,self.cur);self.cur.children.append(n)
  if t not in ('area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'):self.cur=n
 def handle_endtag(self,t):
  n=self.cur
  while n.parent and n.tag!=t:n=n.parent
  if n.parent:self.cur=n.parent
 def handle_data(self,s):self.cur.children.append(s)
def text(n):return re.sub(r'\s+',' ',n.text()).strip()
def paragraphs(n):
 def render(x):
  if isinstance(x,str):return x
  if x.tag in ('script','style','svg'):return ''
  value=''.join(render(c) for c in x.children)
  return ('\n'+value+'\n') if x.tag in ('p','li','h2','h3','h4','div','br') else value
 return [re.sub(r'\s+',' ',part).strip() for part in render(n).split('\n') if part.strip()]
def safe_url(u,kind):
 p=urllib.parse.urlsplit(urllib.parse.urljoin(ORIGIN,u))
 if p.scheme!='https' or p.netloc!='prom.myfast.space' or p.query or p.fragment or not p.path.startswith('/'+kind+'/'):raise ValueError('Unapproved public URL')
 return p.geturl()
class NoRedirect(urllib.request.HTTPRedirectHandler):
 def redirect_request(self,req,fp,code,msg,headers,newurl):return None
def get(u,limit=3_000_000):
 r=urllib.request.build_opener(NoRedirect()).open(urllib.request.Request(u,headers={'User-Agent':'Prom23-readonly-public-snapshot/1'}),timeout=40)
 if r.geturl()!=u: raise ValueError('Redirect forbidden')
 b=r.read(limit+1)
 if len(b)>limit:raise ValueError('Response limit')
 return b

def extract(product):
 u=safe_url(product['sourceUrl'],'catalog');pid=product['id'];p=CACHE/(pid+'.html')
 b=p.read_bytes() if p.exists() else get(u)
 if not p.exists():p.write_bytes(b)
 tree=Parser();tree.feed(b.decode('utf-8'));nodes=list(tree.root.walk())
 if not any(n.has('js--catalog-detail') and n.attrs.get('data-product-id')==pid.removeprefix('prom-') for n in nodes):raise ValueError('PDP identity not confirmed')
 gallery=[]
 for node in nodes:
  if node.has('catalog-detail-slider__item'):
   for img in node.walk():
    if img.tag!='img':continue
    choices=[(0,img.attrs.get('src',''))]
    for pair in img.attrs.get('srcset','').split(','):
     parts=pair.strip().split()
     if len(parts)==2 and re.fullmatch(r'\d+w',parts[1]):choices.append((int(parts[1][:-1]),parts[0]))
    original_url=max(choices)[1]
    display_choices=[pair for pair in choices if 0 < pair[0] <= 720]
    try:imgurl=safe_url(max(display_choices or choices)[1],'upload')
    except ValueError:continue
    if imgurl not in [x['url'] for x in gallery]:gallery.append({'id':pid+'-photo-'+str(len(gallery)+1),'kind':'image','url':imgurl,'originalUrl':safe_url(original_url,'upload'),'alt':product['name'],**{k:int(img.attrs[k]) for k in ('width','height') if img.attrs.get(k,'').isdigit()}})
 desc=[];advantages=[];kit=[]
 for node in nodes:
  if node.has('catalog-detail-params-popup'):
   for sub in node.walk():
    if sub.has('style'):desc.extend(paragraphs(sub))
  if node.has('catalog-detail-mini-prev-text') and not node.has('_mobile'):
   for sub in node.walk():
    if sub.has('style'):advantages.extend(paragraphs(sub))
  if node.has('catalog-detail-komplektatsiya'):
   for sub in node.walk():
    if sub.has('style'):kit.extend(paragraphs(sub))
 buttons=[]
 for n in nodes:
  du=n.attrs.get('data-url','');parsed=urllib.parse.urlsplit(du)
  if parsed.path.startswith('/local/ajax/catalog/') and urllib.parse.parse_qs(parsed.query).get('id')==[pid.removeprefix('prom-')]:buttons.append(parsed.path)
 cap={name:path in buttons for name,path in [('canRent','/local/ajax/catalog/request-a-rent.php'),('canLease','/local/ajax/catalog/request-a-leasing.php'),('canBuyOneClick','/local/ajax/catalog/buy-one-click.php'),('canRequestBetterPrice','/local/ajax/catalog/form-found-it-cheaper.php'),('canRequestCallback','/local/ajax/catalog/request-a-call.php')]}
 cap['canRequestQuote']=False
 docs=[]
 for n in nodes:
  if not n.has('catalog-detail-grid'):continue
  for a in n.walk():
   if a.tag=='a' and re.search(r'\.(pdf|docx?|xlsx?)(?:$|\?)',a.attrs.get('href',''),re.I):
    try:du=safe_url(a.attrs['href'],'upload')
    except ValueError:continue
    if du not in [d['url'] for d in docs]:docs.append({'id':pid+'-document-'+str(len(docs)+1),'name':text(a),'url':du,'access':'public'})
 return {'productId':pid,'sourceUrl':u,'sourcePageSHA256':hashlib.sha256(b).hexdigest(),'capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'gallery':gallery,'descriptionParagraphs':list(dict.fromkeys(desc)),'advantages':list(dict.fromkeys(advantages)),'packageContents':list(dict.fromkeys(kit)),'documents':docs,'documentPolicy':{'requiresOrder':True,'manifestAvailable':False,'source':'catalog.element/old/template.php:503-505'},'capabilities':cap,'capabilityMode':'source-form-visibility','runtimeWritesAvailable':False}
def main():
 CACHE.mkdir(exist_ok=True)
 products=json.loads((ROOT/'data/catalog.json').read_text())
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: rows=list(pool.map(extract,products))
 (ROOT/'data/product-details.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
 if '--download-assets' in __import__('sys').argv: export_assets(rows)
 print(json.dumps({'products':len(rows),'galleryImages':sum(len(r['gallery']) for r in rows),'descriptionProducts':sum(bool(r['descriptionParagraphs']) for r in rows),'capabilities':{k:sum(r['capabilities'][k] for r in rows) for k in rows[0]['capabilities']},'documents':sum(len(r['documents']) for r in rows)},ensure_ascii=False))
def export_assets(rows):
 out=ROOT/'mobile/assets/product-gallery';out.mkdir(exist_ok=True)
 previous=set(out.glob('*'))
 def image_asset(url):
  b=get(safe_url(url,'upload'),8_000_000)
  ext='jpg' if b.startswith(b'\xff\xd8\xff') else 'png' if b.startswith(b'\x89PNG\r\n\x1a\n') else 'webp' if b[:4]==b'RIFF' and b[8:12]==b'WEBP' else None
  if not ext:raise ValueError('Non-raster gallery asset')
  digest=hashlib.sha256(b).hexdigest();f=digest[:24]+'.'+ext
  (out/f).write_bytes(b)
  return url,{'localFile':'mobile/assets/product-gallery/'+f,'sha256':digest,'bytes':len(b)}
 urls=list(dict.fromkeys(i['url'] for r in rows for i in r['gallery']))
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: assets=dict(pool.map(image_asset,urls))
 for row in rows:
  images=[];seen=set()
  for img in row['gallery']:
   img.pop('width',None);img.pop('height',None)
   info=assets[img['url']]
   if info['sha256'] not in seen: images.append({**img,**info});seen.add(info['sha256'])
  row['gallery']=images
 (ROOT/'data/product-details.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
 types="""// Generated from owned-site public PDPs by scripts/import-product-details.py. No live eligibility implied.
import type { ImageSourcePropType } from 'react-native';
export type ProductGalleryImage = { id: string; kind: 'image'; source: ImageSourcePropType; alt: string; url: string; originalUrl?: string; width?: number; height?: number; localFile: string; sha256: string; bytes: number };
export type ProductDetails = { productId: string; sourceUrl: string; sourcePageSHA256: string; capturedAt: string; gallery: ProductGalleryImage[]; descriptionParagraphs: string[]; advantages: string[]; packageContents: string[]; documents: {id:string;name:string;url:string;access:'public'}[]; documentPolicy: {requiresOrder:boolean;manifestAvailable:boolean;source:string}; capabilities: {canRent:boolean;canLease:boolean;canBuyOneClick:boolean;canRequestBetterPrice:boolean;canRequestQuote:boolean;canRequestCallback:boolean}; capabilityMode:'source-form-visibility';runtimeWritesAvailable:false };
const details: Record<string, ProductDetails> = {
"""
 for r in rows:
  data=json.loads(json.dumps(r))
  for im in data['gallery']: im['source']='__ASSET__'+im['localFile'].split('/')[-1]
  serialized=json.dumps(data,ensure_ascii=False,indent=2)
  serialized=re.sub(r'"__ASSET__([a-f0-9]+\.(?:jpg|png|webp))"',lambda m: "require('../../assets/product-gallery/"+m[1]+"')",serialized)
  types+=json.dumps(r['productId'])+': '+serialized+',\n'
 types+='};\nexport function getProductDetails(productId: string): ProductDetails | null { return details[productId] ?? null; }\nexport const productDetailsCount = Object.keys(details).length;\n'
 (ROOT/'mobile/src/content/productDetails.ts').write_text(types)
 used={ROOT/i['localFile'] for row in rows for i in row['gallery']}
 for old in previous-used:
  if re.fullmatch(r'[a-f0-9]{24}\.(jpg|png|webp)',old.name):old.unlink()
 print(json.dumps({'uniqueAssets':len(assets),'bytes':sum(x['bytes'] for x in assets.values())}))
if __name__=='__main__':main()
