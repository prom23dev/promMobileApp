"""Activate only the already isolated PROM23 preview; no webserver or production writes."""
import hashlib,json,os,pathlib,subprocess,tarfile,time,urllib.request
base=pathlib.Path('/var/www/fastuser/data/prom23-mobile-preview')
release_id='v0.8-20260911-01'
archive=base/'incoming'/f'prom23-preview-{release_id}.tar.gz'
assert os.getuid()==1000 and base.is_dir()
assert hashlib.sha256(archive.read_bytes()).hexdigest()=='b5adf0b5012961bf5a94c1f23405230bf4883814973a5dabdc8fe614b6db4fe9'
current=base/'current';previous=current.resolve(strict=True)
assert previous.parent==base/'releases' and previous.name.startswith('v0.')
release=base/'releases'/release_id
release.mkdir(mode=0o700,exist_ok=False)
with tarfile.open(archive,'r:gz') as package:
 for member in package.getmembers():
  path=pathlib.PurePosixPath(member.name)
  assert member.isfile() and not path.is_absolute() and '..' not in path.parts
 package.extractall(release,filter='data')
manifest=json.loads((release/'deploy/release-manifest.json').read_text())
assert manifest['id']==release_id
for relative,digest in manifest['files'].items():
 path=release/relative
 assert path.resolve().is_relative_to(release) and path.is_file() and not path.is_symlink()
 assert hashlib.sha256(path.read_bytes()).hexdigest()==digest
for relative in ['server/app.mjs','server/public-v1.mjs','server/notifications.mjs','preview/index.mjs','preview/http.mjs']:
 subprocess.run(['/usr/local/bin/node','--check',str(release/relative)],check=True)
unit=subprocess.run(['systemctl','--user','show','prom23-preview.service','-p','ExecStart,WorkingDirectory,PrivateUsers,InaccessiblePaths,MemoryMax,CPUQuotaPerSecUSec'],capture_output=True,text=True,check=True).stdout
assert 'PrivateUsers=yes' in unit and 'InaccessiblePaths=/var/www/fastuser/data/www' in unit
assert 'WorkingDirectory='+str(current) in unit
next_link=base/'current.v8-next';next_link.symlink_to(release);next_link.replace(current)
try:
 subprocess.run(['systemctl','--user','restart','prom23-preview.service'],check=True)
 for attempt in range(20):
  try:
   with urllib.request.urlopen('http://127.0.0.1:18087/api/catalog-tree',timeout=2) as response:tree=json.load(response)['data']
   assert len(tree['sections'])==226 and len(tree['rootIds'])==20
   with urllib.request.urlopen('http://127.0.0.1:18087/api/catalog',timeout=2) as response:catalog=json.load(response)['data']
   assert len(catalog['products'])==28 and all(p['sectionIds'] for p in catalog['products'])
   assert sum(bool(p.get('popularRank')) for p in catalog['products'])==10
   with urllib.request.urlopen('http://127.0.0.1:18087/api/v1/app-config',timeout=2) as response:config=json.load(response)['data']
   assert config['capabilities']['liveWrites'] is False and config['capabilities']['checkout'] is False
   with urllib.request.urlopen('http://127.0.0.1:18087/api/v1/home',timeout=2) as response:home=json.load(response)['data']
   assert len(home['blocks'])==11 and home['revision']=='home-v8-1'
   with urllib.request.urlopen('http://127.0.0.1:18087/api/v1/locations/915703c4-731d-4ebe-b893-561d99982172',timeout=2) as response:settlement=json.load(response)['data']
   assert settlement['name']=='Динская' and settlement['fiasId']=='915703c4-731d-4ebe-b893-561d99982172'
   assert all(p['stock'] is None and p['draftQuantityLimit']==999 for p in catalog['products'])
   break
  except Exception:
   if attempt==19:raise
   time.sleep(.3)
except Exception:
 rollback=base/'current.v8-rollback';rollback.symlink_to(previous);rollback.replace(current)
 subprocess.run(['systemctl','--user','restart','prom23-preview.service'],check=True)
 raise
print(json.dumps({'release':release_id,'previous':previous.name,'filesVerified':len(manifest['files']),'sections':len(tree['sections']),'products':len(catalog['products']),'unitPreserved':True,'settlementVerified':settlement['fiasId']}))
