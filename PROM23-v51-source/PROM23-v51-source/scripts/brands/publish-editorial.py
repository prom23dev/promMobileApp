"""Package reviewed original logos for the owner-approved editorial directory.
Inputs are downloaded original assets plus a reviewed provenance manifest, not HL IDs.
"""
from pathlib import Path
import hashlib,json,re,sys,shutil
root=Path(__file__).resolve().parents[2]
source=Path(sys.argv[1]); manifest=json.loads((source/'reviewed.json').read_text())
assets={};native=[]
for slug,entry in manifest.items():
 file=source/entry['file'];body=file.read_bytes();ext=file.suffix
 output=entry.get('outputFile',slug+ext)
 if not re.fullmatch(r'[a-z0-9-]+\.(svg|png|jpg|jpeg|webp)',output):raise ValueError('Unsafe asset filename '+slug)
 if ext=='.svg':
  xml=body.decode()
  if not re.search(r'<svg\b',xml) or re.search(r'<(?:script|foreignObject)\b|\bon\w+\s*=|<!ENTITY',xml,re.I):raise ValueError('Unsafe SVG '+slug)
  # Inline SVGs share the DOM. Namespace references without changing artwork.
  for ident in set(re.findall(r'\bid="([^"]+)"',xml)):
   unique=slug+'--'+ident
   xml=xml.replace('id="'+ident+'"','id="'+unique+'"').replace('url(#'+ident+')','url(#'+unique+')').replace('href="#'+ident+'"','href="#'+unique+'"')
  native.append(json.dumps(slug)+':'+json.dumps({'xml':xml}))
 else:native.append(json.dumps(slug)+":{image:require('../../assets/brands/"+output+"')}")
 for folder in ['mobile/public/brand-assets','mobile/assets/brands']:
  p=root/folder;p.mkdir(exist_ok=True,parents=True);(p/output).write_bytes(body)
 assets[slug]={**entry,'verified':True,'publicPath':'/brand-assets/'+output,'sha256':hashlib.sha256(body).hexdigest(),'retrievedAt':'2026-09-18'}
(root/'data/brands/assets.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2)+'\n')
(root/'mobile/src/brands/logoAssets.ts').write_text("// Original reviewed assets; provenance: data/brands/assets.json.\nimport type {ImageSourcePropType} from 'react-native';\nexport const logoAssets:Record<string,{xml?:string;image?:ImageSourcePropType}>={"+',\n'.join(native)+'};\n')
print('Packaged',len(assets),'reviewed logos')
