# coding: utf-8
from pathlib import Path
import re,json,sys,zipfile
root=Path(__file__).resolve().parent.parent
patterns=[('credential_assignment',re.compile(r'''(?i)(?:[A-Z_]*(?:TOKEN|SECRET|PASSWORD|API_?KEY|AUTH_?KEY)[A-Z_]*|token|secret|password)\s*['"]?\s*(?:=>|:|=|,)\s*['"]([^'"\r\n]{12,200})['"]''')),('crm_webhook',re.compile(r'https://[^\s"<>]+/rest/\d+/([A-Za-z0-9]{16,64})/')),('jwt_literal',re.compile(r'(eyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,})'))]
findings=[];values=set();files=0
for p in (root/'site-source').rglob('*'):
 if not p.is_file() or p.suffix.lower() not in ['.php','.js','.json','.html','.env','.ts']:continue
 files+=1
 try:s=p.read_text()
 except(UnicodeError,OSError):continue
 for kind,pat in patterns:
  for m in pat.finditer(s):
   v=m.group(1)
   if '${' in v or '{{' in v or 'getenv(' in v or re.match(r'^(?:Bearer |PROM23_|YOUR_|process\.|EXAMPLE_|Введите)',v) or len(set(v))<7:continue
   # Credential-like literal, not a label/regular expression/path or prose.
   if kind=='credential_assignment' and (re.search(r'\s',v) or v.startswith(('/','http','function','document')) or not(re.search('[A-Za-z]',v) and re.search('[0-9]',v))):continue
   values.add(v);findings.append({'path':str(p.relative_to(root)),'line':s.count('\n',0,m.start())+1,'type':kind,'status':'rotation_owner_verification_required'})
leaks=[]
for folder in ['mobile/src','mobile/app','mobile/dist','server','integrations','data','docs','scripts','preview','deploy','mobile/native-export']:
 for p in (root/folder).rglob('*'):
  if not p.is_file() or any(x in p.parts for x in ['test','tests']):continue
  if p.suffix.lower() not in ['.mjs','.js','.cjs','.ts','.tsx','.php','.json','.html','.md','.log','.txt','.py','.hbc']:continue
  try:s=p.read_bytes()
  except OSError:continue
  if any(v.encode() in s for v in values):leaks.append(str(p.relative_to(root)))
# Compare known source literals with source handoff archives without ever writing the literals.
for p in (root/'deliverables').glob('prom23-mobile-source-*.zip'):
 with zipfile.ZipFile(p) as z:
  for name in z.namelist():
   if name.endswith(('.ts','.tsx','.js','.cjs','.mjs','.php','.json','.html','.md','.log')):
    s=z.read(name).decode('utf-8',errors='replace')
    if any(v in s for v in values):leaks.append(str(p.relative_to(root))+':'+name)
result={'sourceFilesScanned':files,'candidateLocations':findings,'uniqueCandidateValues':len(values),'sourceValuesFoundInAppArtifacts':sorted(set(leaks)),'gitHistory':'Local root and nested mobile recovery checkpoints exist. This scan covers worktree/artifacts, not external repository history or credential rotation.','valuesExcluded':True}
(root/'docs/security/secrets-audit-recovery01.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False))

if leaks: sys.exit(1)
