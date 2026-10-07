from pathlib import Path
import gzip,tarfile,json,hashlib,sys,re,subprocess
root=Path(__file__).resolve().parent.parent
release_id=sys.argv[1]
assert re.fullmatch(r'v[0-9.]+-[0-9-]+',release_id)
# Brand routes must not ship with invented identities, missing reviewed logos.
subprocess.run(['node', str(root/'scripts/brands/audit.mjs')], check=True)
assert (root/'mobile/dist/brands/routes.json').is_file(), 'Export brand initial HTML before packaging'
for p in (root/'mobile/dist').rglob('*'):
 if p.is_file() and p.suffix in ('.js','.html','.css','.json'):
  p.with_name(p.name+'.gz').write_bytes(gzip.compress(p.read_bytes(),compresslevel=9,mtime=0))
files=[Path(p) for p in ['server/app.mjs','server/buyer-context.mjs','server/commerce-recovery.mjs', 'server/commerce-legal.mjs','server/integrations/runtime-client.mjs','server/integrations/procurement-service.mjs','server/integrations/forms-service.mjs','server/integrations/form-contracts.json','server/integrations/public-content.mjs','server/integrations/product-detail.mjs','data/site-pages.json','data/product-details.json','server/notifications.mjs','server/public-v1.mjs','server/content/home.json','preview/http.mjs','preview/index.mjs','data/catalog.json','data/catalog-tree.json','deploy/prom23-preview.service']]
files += [Path(p) for p in ['server/brands/model.mjs','server/brands/service.mjs','server/brands/seo.mjs','data/brands/presentation.json','data/brands/editorial.json','data/brands/assets.json']]
files.append(Path('deploy/prune-releases.py'))
if (root/'data/brands/hl4.json').exists(): files.append(Path('data/brands/hl4.json'))
files += [Path(p) for p in ['server/location/provider.mjs','server/location/service.mjs',
    'server/location/data/gar.sqlite','server/location/data/gar.manifest.json']]
files+=sorted(p.relative_to(root) for p in (root/'mobile/dist').rglob('*') if p.is_file())
manifest={str(p):hashlib.sha256((root/p).read_bytes()).hexdigest() for p in files}
(root/'deploy/release-manifest.json').write_text(json.dumps({'id':release_id,'files':manifest},indent=2)+'\n')
files.append(Path('deploy/release-manifest.json'))
archive=root/'deliverables'/f'prom23-preview-{release_id}.tar.gz'
with tarfile.open(archive,'w:gz') as t:
 for p in files:
  assert not (root/p).is_symlink() and '..' not in p.parts
  t.add(root/p,arcname=str(p),recursive=False)
print(json.dumps({'id':release_id,'files':len(files),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()}))
