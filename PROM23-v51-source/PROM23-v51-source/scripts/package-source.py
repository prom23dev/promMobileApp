"""Package only the new application's source, public assets, and verification records."""
from pathlib import Path
import hashlib
import json
import zipfile
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
subprocess.run([sys.executable, str(ROOT / 'scripts/secret-scan.py')], stdout=sys.stderr, check=True)
OUTPUT = ROOT / 'deliverables'
NAME = 'prom23-mobile-source-recovery01'
files = set()

def include(path):
    source = ROOT / path
    if source.is_symlink():
        raise ValueError(f'Symlink is not an allowed source: {path}')
    if source.is_file():
        files.add(source.relative_to(ROOT))
    elif source.is_dir():
        for child in source.rglob('*'):
            if child.is_symlink():
                raise ValueError('Symlinks are not allowed in source directories')
            if child.is_file() and '__pycache__' not in child.parts and child.name != '.DS_Store':
                files.add(child.relative_to(ROOT))
    else:
        raise FileNotFoundError(path)

for item in [
    'README.md', 'prom23-mobile-v3.md',
    'mobile/app', 'mobile/src', 'mobile/assets', 'mobile/tests', 'mobile/scripts',
    'mobile/package.json', 'mobile/package-lock.json', 'mobile/app.json',
    'mobile/eas.json', 'mobile/tsconfig.json', 'mobile/LICENSE',
    'server/app.mjs', 'server/index.mjs', 'server/notifications.mjs', 'server/buyer-context.mjs', 'server/commerce-recovery.mjs',
    'server/public-v1.mjs', 'server/location', 'server/content', 'server/package.json', 'server/test', 'server/integrations',
    'integrations', 'preview', 'data', 'scripts', 'deploy',
]:
    include(item)
for item in (ROOT / 'docs').glob('*.md'):
    include(item.relative_to(ROOT))
for name in [
    'tests-v3-server.log', 'tests-v3-preview.log', 'tests-v3-mobile.log',
    'tests-v3-php.log', 'typecheck-v3.log', 'export-v3-web.log',
    'export-v3-native.log', 'prebuild-v3.log', 'release-check-v3.log',
    'performance-v3-api.json', 'deployment-v3-verification.json',
    'deploy-v3-result.json', 'integrations-readiness-v3.json',
]:
    include(Path('docs') / name)

for item in (ROOT / 'docs').glob('*v4*'):
    if item.is_file() and item.name != 'source-package-v4.json':
        include(item.relative_to(ROOT))
for item in (ROOT / 'docs/screenshots').glob('*v4*'):
    include(item.relative_to(ROOT))

for item in (ROOT / 'docs').glob('*v5*'):
    if item.is_file() and item.name != 'source-package-v5.json':
        include(item.relative_to(ROOT))
for item in (ROOT / 'docs/screenshots').glob('*v5*'):
    include(item.relative_to(ROOT))

for item in (ROOT / 'docs').glob('*v6*'):
    if item.is_file() and item.name != 'source-package-v6.json' and item.suffix != '.html':
        include(item.relative_to(ROOT))
for item in (ROOT / 'docs/screenshots').glob('*v6*'):
    include(item.relative_to(ROOT))

for folder in ['docs/discovery', 'docs/adr', 'docs/privacy', 'docs/security', 'docs/audit', 'docs/architecture', 'docs/design', 'docs/testing', 'docs/api']:
    for item in (ROOT / folder).rglob('*'):
        if item.is_file() and item.suffix in {'.json', '.md', '.png', '.jpg', '.log'}:
            include(item.relative_to(ROOT))
include('docs/openapi-v1.json')
for item in (ROOT / 'docs').glob('*v7*'):
    if item.is_file() and item.name != 'source-package-v7.json' and item.suffix != '.html':
        include(item.relative_to(ROOT))

for item in (ROOT / 'docs').glob('*v8*'):
    if item.is_file() and item.name != 'source-package-v8.json' and item.suffix != '.html':
        include(item.relative_to(ROOT))

for item in (ROOT / 'docs').glob('*v9*'):
    if item.is_file() and item.name != 'source-package-v9.json' and item.suffix != '.html':
        include(item.relative_to(ROOT))

for item in (ROOT / 'docs/parity').glob('*'):
    if item.is_file() and item.suffix in {'.md','.json','.txt'}:
        include(item.relative_to(ROOT))
for item in (ROOT / 'docs/parity/evidence').glob('*'):
    if item.is_file() and item.suffix in {'.json','.log'} and item.stat().st_size < 3_000_000:
        include(item.relative_to(ROOT))
for folder in ['docs/parity/baseline/recovery01','docs/parity/baseline/recovery02-fields','docs/parity/evidence/public-commerce-ui','docs/parity/evidence/public-forms-ui']:
    include(folder)
for item in ['AGENTS.md','docs/PARITY_REQUIREMENTS.md','docs/ACCEPTANCE_CHECKLIST.md','docs/CURRENT_TASK.md','docs/DECISIONS.md','docs/PROGRESS.md']:
    include(item)

for path in files:
    if any(part in {'site-source', 'node_modules', '.git', '.expo', 'ios', 'android', 'deliverables'} for part in path.parts):
        raise ValueError(f'Forbidden directory: {path}')
    if (path.suffix in {'.sqlite', '.db', '.pem', '.key', '.p12', '.mobileprovision'} and path != Path('server/location/data/gar.sqlite')) or path.name.startswith('.env'):
        raise ValueError(f'Forbidden file type: {path}')

manifest = {
    'version': 'recovery01',
    'scope': 'Source only; no installable store binaries, original site archive, runtime/session DB, credentials, or dependencies. The only included SQLite is the official public GAR reference index.',
    'files': {str(path): hashlib.sha256((ROOT / path).read_bytes()).hexdigest() for path in sorted(files)},
}
OUTPUT.mkdir(exist_ok=True)
archive = OUTPUT / f'{NAME}.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as output:
    for path in sorted(files):
        output.write(ROOT / path, f'{NAME}/{path}')
    output.writestr(f'{NAME}/SOURCE-MANIFEST.json', json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
with zipfile.ZipFile(archive) as check:
    assert check.testzip() is None
    for path, expected in manifest['files'].items():
        assert hashlib.sha256(check.read(f'{NAME}/{path}')).hexdigest() == expected
sha = hashlib.sha256(archive.read_bytes()).hexdigest()
archive.with_suffix('.zip.sha256').write_text(f'{sha}  {archive.name}\n')
print(json.dumps({'archive': str(archive), 'files': len(files) + 1, 'bytes': archive.stat().st_size, 'sha256': sha}))
