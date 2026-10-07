import pathlib,json,re,hashlib,runpy
r=pathlib.Path(__file__).resolve().parents[2]
def literal(p,marker):
 s=p.read_text();a=s.index('=',s.index(marker))+1;t=s[a:];space=len(t)-len(t.lstrip());d,n=json.JSONDecoder().raw_decode(t.lstrip());return s[:a],d,s[a+space+n:]
p=r/'mobile/src/content/legalDocuments.ts';pre,docs,end=literal(p,'export const legalDocuments')
pre=pre.replace("| 'recommendations';","| 'recommendations' | 'advertising' | 'distribution';")
q=r/'mobile/src/content/sitePages.ts';qp,pages,qs=literal(q,'export const sitePages:')
files=json.loads((r/'docs/legal42/folder.json').read_text());manifest={}
items=[('01','privacy','Политика в отношении обработки персональных данных','privacy-policy'),('02','consent','Согласие на обработку персональных данных','personal-data-consent'),('03','cookies','Политика использования cookie и аналогичных технологий','cookie-policy'),('04','recommendations','Правила применения рекомендательных технологий','recom-tech-info'),('06','advertising','Согласие на получение рекламы и информационно-рекламных сообщений','advertising-consent'),('07','distribution','Согласие на распространение персональных данных','personal-data-distribution-consent'),('08','offer','Публичная оферта для физических лиц','offer')]
for n,key,title,slug in items:
 path='docs/legal42/source/'+n+'.txt';txt=(r/path).read_text();sha=hashlib.sha256(txt.encode()).hexdigest();f=next(f for f in files if f['title'].startswith(n+' '));url=f['url']
 docs[key]={**docs['privacy'], 'id':key,'title':title,'content':txt,'originalContent':txt,'sourceTextSha256':sha,'sourceUrl':url,'sourceFiles':[path],'checkedAt':'2026-09-18'}
 manifest[key]={'document_type':key,'version':'2026-10-01','effective_from':'2026-10-01','edition':'2026-10-01','url':'/'+slug+'/','sha256':sha,'sourceUrl':url,'sourceFile':path}
 for page in pages.values():
  if page.get('id')==key or any('/'+x+'/' in (page.get('sourceUrl') or '') for x in [slug]+({'consent':['user-agreement'],'offer':['oferta']}.get(key,[]))):
   page.update(title=title,sections=[{'id':'approved-2026-10-01','paragraphs':re.split(r'\n\s*\n',txt.strip())}],links=[],sourceReviewRequired=[])
 (r/('mobile/app/'+slug+'.tsx')).write_text("import { Redirect } from 'expo-router';\nexport default function Page(){ return <Redirect href=\"/legal/"+key+"\" />; }\n")
p.write_text(pre+' '+json.dumps(docs,ensure_ascii=False,indent=2)+end);q.write_text(qp+' '+json.dumps(pages,ensure_ascii=False,indent=2)+qs)
raw=(r/'docs/legal42/source/05.txt').read_text();sections=re.split(r'\n\n+\d+\. [^\n]+\n\n+',raw)[1:]
paras=lambda n:[x.strip() for x in re.split(r'\n\s*\n',sections[n-1]) if x.strip()]
def unquote(t):return t.removeprefix('«').removesuffix('.').removesuffix('»')+'.'
copy={'edition':'2026-10-01','recommendations':unquote(paras(1)[1]),'cookieBanner':unquote(paras(2)[1]),'processing':paras(4)[1].removeprefix('☐ '),'marketing':paras(5)[1].removeprefix('☐ '),'distribution':paras(6)[2].removeprefix('☐ '),'registration':unquote(paras(7)[1]),'checkoutPersonal':unquote(paras(8)[2]),'checkoutBusiness':paras(9)[2], 'card':unquote(paras(10)[1]),'yandexPay':unquote(paras(11)[0]),'split':unquote(paras(12)[0]),'savedPayment':unquote(paras(13)[2].removeprefix('Пояснение:\n')),'address':unquote(paras(14)[0]),'upload':unquote(paras(15)[0]),'service':unquote(paras(16)[0]),'serviceMessages':unquote(paras(18)[1].removeprefix('Текст:\n'))}
# Existing explanatory controls remain accurate; this edition has no replacement for these texts.
oldpre,oldcopy,olds=literal(r/'mobile/src/content/legalCopy.ts','export const legalCopy')
for k in ['personalization','rejected','contact','serviceConsent']:copy[k]=oldcopy[k]
copy['cookieCategories']=[{'id':k,'title':p.split('\n')[0],'description':unquote('\n'.join(p.split('\n')[1:]))}for k,p in zip(['necessary','functional','analytics','advertising','personalization'],paras(3))]
(r/'mobile/src/content/legalCopy.ts').write_text('// Approved legal42 document 05. Do not edit legal wording independently.\nexport const legalCopy = '+json.dumps(copy,ensure_ascii=False,indent=2)+' as const;\n')
manifest['ui']={'edition':'2026-10-01','sha256':hashlib.sha256(raw.encode()).hexdigest(),'sourceFile':'docs/legal42/source/05.txt'}
(r/'docs/legal42/source-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(r/'integrations/runtime/legal-versions.json').write_text(json.dumps({k:{'version':v['edition'],'sha256':v['sha256']}for k,v in manifest.items()},ensure_ascii=False,indent=2)+'\n')
print(json.dumps(copy,ensure_ascii=False,indent=2))
