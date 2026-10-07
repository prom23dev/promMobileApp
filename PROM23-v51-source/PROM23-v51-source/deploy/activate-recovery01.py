"""Activate only the isolated PROM23 unit, with verified artifact and automatic rollback."""
import hashlib,json,os,pathlib,re,sqlite3,subprocess,sys,tarfile,time,urllib.request
base=pathlib.Path('/var/www/fastuser/data/prom23-mobile-preview')
release_id,digest=sys.argv[1:]
assert re.fullmatch(r'v[0-9.]+-[0-9-]+',release_id) and re.fullmatch('[a-f0-9]{64}',digest)
assert os.getuid()==1000 and base.is_dir()
archive=base/'incoming'/f'prom23-preview-{release_id}.tar.gz'
assert hashlib.sha256(archive.read_bytes()).hexdigest()==digest
current=base/'current';previous=current.resolve(strict=True)
assert previous.parent==base/'releases'
release=base/'releases'/release_id
release.mkdir(mode=0o700,exist_ok=False)
with tarfile.open(archive,'r:gz')as package:
 for member in package.getmembers():
  p=pathlib.PurePosixPath(member.name)
  assert member.isfile() and not p.is_absolute() and '..' not in p.parts
 package.extractall(release,filter='data')
manifest=json.loads((release/'deploy/release-manifest.json').read_text());assert manifest['id']==release_id
assert {str(p.relative_to(release))for p in release.rglob('*')if p.is_file()}==set(manifest['files'])|{'deploy/release-manifest.json'}
for relative,digest in manifest['files'].items():
 p=release/relative;assert p.resolve().is_relative_to(release) and not p.is_symlink() and hashlib.sha256(p.read_bytes()).hexdigest()==digest
 if p.suffix=='.mjs':subprocess.run(['/usr/local/bin/node','--check',str(p)],check=True)
unit=subprocess.check_output(['systemctl','--user','show','prom23-preview.service','-p','ExecStart,WorkingDirectory,PrivateUsers,InaccessiblePaths,MemoryMax,CPUQuotaPerSecUSec'],text=True)
assert 'PrivateUsers=yes' in unit and 'InaccessiblePaths=/var/www/fastuser/data/www' in unit and 'WorkingDirectory='+str(current) in unit
backup=base/'state'/('before-'+release_id+'.sqlite')
assert not backup.exists()
with sqlite3.connect('file:'+str(base/'state/runtime.sqlite')+'?mode=ro',uri=True)as source:
 with sqlite3.connect(backup)as target:source.backup(target)
os.chmod(backup,0o600)
next_link=base/'recovery-next';next_link.symlink_to(release);next_link.replace(current)
def fetch(path,method='GET',body=None,token=None):
 headers={'Content-Type':'application/json'}
 if token:headers['Authorization']='Bearer '+token
 req=urllib.request.Request('http://127.0.0.1:18087'+path,data=json.dumps(body).encode()if body is not None else None,headers=headers,method=method)
 with urllib.request.urlopen(req,timeout=4)as response:return json.load(response)['data']
try:
 subprocess.run(['systemctl','--user','restart','prom23-preview.service'],check=True)
 for attempt in range(30):
  try:
   tree=fetch('/api/catalog-tree');assert len(tree['sections'])==226
   token=fetch('/api/sessions','POST',{})['token']
   try:
    state=fetch('/api/state',token=token);assert state['context']=='personal' and state['carts']['business']==[]
    summary=fetch('/api/v1/cart/summary',token=token);assert summary['totalKopecks']is None
    assert {'online','split','receipt'}=={p['id']for p in summary['paymentMethods']}
   finally:fetch('/api/session','DELETE',token=token)
   break
  except Exception:
   if attempt==29:raise
   time.sleep(.3)
except Exception:
 rollback=base/'recovery-rollback';rollback.symlink_to(previous);rollback.replace(current)
 subprocess.run(['systemctl','--user','restart','prom23-preview.service'],check=True)
 raise
retention={'status':'not-configured'}
pruner=release/'deploy/prune-releases.py'
if pruner.is_file():
 try:
  retention=json.loads(subprocess.check_output([sys.executable,str(pruner),'--previous',previous.name,'--apply'],text=True))
 except Exception as error:
  retention={'status':'retry-required','error':str(error)}
print(json.dumps({'release':release_id,'previous':previous.name,'filesVerified':len(manifest['files']),'unitPreserved':True,'stateBackup':backup.name,'checks':['personal-default','separate-business-cart','unconfirmed-total','source-payment-preferences'],'retention':retention}))
