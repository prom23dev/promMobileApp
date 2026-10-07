import {readFileSync,existsSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {loadCatalog,loadCatalogTree} from '../../server/app.mjs';
import {loadBrandModel} from '../../server/brands/service.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const products=loadCatalog(resolve(root,'data/catalog.json')).products,tree=loadCatalogTree(resolve(root,'data/catalog-tree.json'));
const model=loadBrandModel(resolve(root,'data/brands'),products,tree),broken=[];
if(model.ready){const assets=JSON.parse(readFileSync(resolve(root,'data/brands/assets.json'),'utf8'));for(const b of model.brands){const file=resolve(root,'mobile/public',b.logo.slice(1));if(!existsSync(file)||createHash('sha256').update(readFileSync(file)).digest('hex')!==assets[b.slug].sha256)broken.push(b.slug);}}
const audit={checkedAt:new Date().toISOString(),status:model.ready&&!broken.length?'READY_FOR_VISUAL_REVIEW':'BLOCKED_BY_EXTERNAL_ACCESS',...model.audit,brokenLogos:broken,logoAuditCompleted:model.ready,brokenLogosCount:model.ready?broken.length:null,detailPagesReady:model.ready?model.brands.length:0};
if(!model.audit.sourceLoaded){audit.missingEntities=Object.keys(JSON.parse(readFileSync(resolve(root,'data/brands/presentation.json'),'utf8')));audit.missingOfficialLogos=audit.missingEntities.filter(s=>!['promyshlennik','team'].includes(s)).map(slug=>({slug,status:'UF_FILE_NOT_AVAILABLE_FOR_AUDIT'}));audit.localOwnSvgFilesAvailable=2;}
writeFileSync(resolve(root,'docs/parity/evidence/brands39/data-audit.json'),JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify(audit,null,2));if(audit.status!=='READY_FOR_VISUAL_REVIEW')process.exitCode=2;
