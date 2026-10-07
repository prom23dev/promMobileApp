// Import only a read-only HL4 export and existing catalog products. No brand IDs/counts are invented.
import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {buildBrandModel,normalizeName} from '../../server/brands/model.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const input=process.argv[2];
if(!input)throw Error('Usage: node scripts/brands/import.mjs /absolute/hl4.json [https://prom.myfast.space]');
const origin=new URL(process.argv[3]||'https://prom.myfast.space');
if(origin.protocol!=='https:'||origin.hostname!=='prom.myfast.space')throw Error('Only the approved test source is allowed');
const source=JSON.parse(readFileSync(resolve(input),'utf8'));
const official=process.argv[4]?JSON.parse(readFileSync(resolve(process.argv[4]),'utf8')):{};
const presentation=JSON.parse(readFileSync(resolve(root,'data/brands/presentation.json'),'utf8'));
if(source.hlblockId!==4||source.brandProperty!=='PROP_368')throw Error('Wrong source model');
const target=resolve(root,'data/brands'),assets={},native={};
mkdirSync(resolve(root,'mobile/public/brand-assets'),{recursive:true});
mkdirSync(resolve(root,'mobile/assets/brands'),{recursive:true});
for(const raw of source.brands){
 const entry=Object.entries(presentation).find(([slug,p])=>[slug,p.canonicalName,...p.alternateNames].some(n=>[raw.UF_XML_ID,raw.UF_NAME].some(v=>normalizeName(v)===normalizeName(n))));
 if(!entry)continue;
 const [slug,copy]=entry, fallback=official[slug];
 let originalPath=copy.preferredLogo||raw.logoPath,officialWebsite;
 if(!originalPath){
  if(Number(raw.UF_FILE)>0)throw Error(`UF_FILE has no resolved path: ${slug}`);
  if(!fallback)continue;
  const site=new URL(fallback.officialWebsite),asset=new URL(fallback.assetUrl);
  if(fallback.reviewedOfficialSource!==true||site.protocol!=='https:'||asset.protocol!=='https:'||site.username||site.password||asset.username||asset.password||asset.hostname!==site.hostname)throw Error(`Official fallback requires a reviewed same-host original: ${slug}`);
  officialWebsite=site.href;originalPath=asset.href;
 }
 const url=new URL(originalPath,origin);
 if(!officialWebsite&&(url.origin!==origin.origin||!/^\/(upload\/uf\/|frontend\/img\/h\/brands\/)/.test(url.pathname)||url.search||url.hash))throw Error('Untrusted source logo path');
 let body;
 if(copy.isOwnBrand){body=readFileSync(resolve(root,`mobile/assets/franchise/${slug==='team'?'team':'prom'}.svg`));}
 else {
  const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw Error(`Logo download failed: ${slug} ${response.status}`);
  if(Number(response.headers.get('content-length'))>2_000_000)throw Error('Logo too large');
  const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>2_000_000)throw Error('Logo too large');chunks.push(chunk);}body=Buffer.concat(chunks);
 }
 if(!body.length||body.length>2_000_000)throw Error(`Invalid logo size: ${slug}`);
 const ext=extname(url.pathname).toLowerCase();
 if(!['.svg','.png','.jpg','.jpeg','.webp'].includes(ext))throw Error('Unsupported original logo format');
 if(ext==='.svg'){
  const xml=body.toString('utf8');
  if(!/<svg\b/i.test(xml)||/<(?:script|foreignObject|image)\b|\bon\w+\s*=|(?:href|src)\s*=\s*["']\s*(?:https?:|javascript:|data:|\/\/)|<!ENTITY/i.test(xml))throw Error(`Unsafe SVG: ${slug}`);
  native[slug]={xml};
 } else {
  const magic=ext==='.png'?body.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):ext==='.webp'?body.toString('ascii',0,4)==='RIFF'&&body.toString('ascii',8,12)==='WEBP':body[0]===255&&body[1]===216;
  if(!magic)throw Error(`Wrong image format: ${slug}`);
  native[slug]={file:`${slug}${ext}`};
 }
 const file=`${slug}${ext}`;writeFileSync(resolve(root,'mobile/public/brand-assets',file),body);writeFileSync(resolve(root,'mobile/assets/brands',file),body);
 assets[slug]={verified:true,originalPath,publicPath:`/brand-assets/${file}`,sha256:createHash('sha256').update(body).digest('hex'),...(officialWebsite?{officialWebsite,officialSourceReviewed:true}:{}),provenance:copy.isOwnBrand?'Existing local official SVG':officialWebsite?'Reviewed official original':`HL4 UF_FILE=${raw.UF_FILE}`,retrievedAt:new Date().toISOString()};
}
// Category membership uses the same normalized catalog tree as the app. The API performs final validation.
writeFileSync(resolve(target,'hl4.json'),JSON.stringify(source,null,2)+'\n');
writeFileSync(resolve(target,'assets.json'),JSON.stringify(assets,null,2)+'\n');
const entries=Object.entries(native).map(([slug,value])=>`${JSON.stringify(slug)}:${value.xml?JSON.stringify(value):`{image:require('../../assets/brands/${value.file}')}`}`);
writeFileSync(resolve(root,'mobile/src/brands/logoAssets.ts'),`// Generated from verified, unchanged source assets by scripts/brands/import.mjs.\nimport type { ImageSourcePropType } from 'react-native';\nexport const logoAssets:Record<string,{xml?:string;image?:ImageSourcePropType}>={${entries.join(',\n')}};\n`);
console.log(JSON.stringify({brandsMatched:Object.keys(assets).length,missing:Object.keys(presentation).filter(k=>!assets[k]),next:'Run brand audit and catalog completeness checks before publication.'}));
