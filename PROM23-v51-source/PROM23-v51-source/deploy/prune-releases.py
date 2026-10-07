"""Scoped release retention. Dry run by default; never touches databases/services."""
import argparse
import json
import pathlib
import re
import shutil

BASE = pathlib.Path('/var/www/fastuser/data/prom23-mobile-preview')
RELEASE = re.compile(r'v[0-9.]+-[0-9-]+')
def version_key(name):
    return tuple(int(part) for part in re.findall(r'\d+', name))

def prune(base, previous, apply=False, force=False):
    base = base.resolve(strict=True)
    releases = base / 'releases'
    incoming = base / 'incoming'
    assert not releases.is_symlink() and not incoming.is_symlink()
    active = (base / 'current').resolve(strict=True)
    assert active.parent == releases and RELEASE.fullmatch(active.name)
    assert RELEASE.fullmatch(previous) and previous != active.name
    rollback = releases / previous
    assert rollback.is_dir() and not rollback.is_symlink()
    state_file = base / 'state' / 'release-retention.json'
    assert not state_file.is_symlink()
    state = json.loads(state_file.read_text()) if state_file.exists() else {'lastRelease': None, 'pending': 0}
    if state['lastRelease'] != active.name:
        state['lastRelease'] = active.name
        state['pending'] += 1
    due = force or state['pending'] >= 2
    keep = {active.name, previous}
    targets = []
    skipped = []
    for path in releases.iterdir():
        if path.name in keep or (RELEASE.fullmatch(path.name) and version_key(path.name) >= version_key(active.name)):
            continue
        if path.is_symlink() or not path.is_dir() or not RELEASE.fullmatch(path.name):
            skipped.append(str(path.relative_to(base))); continue
        manifest = path / 'deploy/release-manifest.json'
        if not manifest.is_file() or manifest.is_symlink() or json.loads(manifest.read_text()).get('id') != path.name:
            skipped.append(str(path.relative_to(base))); continue
        targets.append(path)
    for path in incoming.iterdir():
        match = re.fullmatch(r'prom23-preview-(v[0-9.]+-[0-9-]+)\.tar\.gz', path.name)
        if match and match[1] not in keep and version_key(match[1]) < version_key(active.name) and path.is_file() and not path.is_symlink():
            targets.append(path)
    def size(path):
        return path.stat().st_size if path.is_file() else sum(p.stat().st_size for p in path.rglob('*') if p.is_file() and not p.is_symlink())
    result = {'current': active.name, 'retained': sorted(keep), 'due': due, 'apply': apply,
              'targets': [str(p.relative_to(base)) for p in targets], 'bytes': sum(size(p) for p in targets), 'skipped': skipped}
    if apply:
        if due:
            # Recheck immediately before deletion; never race a changed current link.
            assert (base / 'current').resolve(strict=True) == active
            for path in targets:
                assert path.parent in (releases, incoming) and not path.is_symlink() and path.name not in keep
                if path.is_dir(): shutil.rmtree(path)
                else: path.unlink()
            state['pending'] = 0
        temporary = state_file.with_suffix('.tmp')
        assert not temporary.is_symlink()
        temporary.write_text(json.dumps(state, indent=2)+'\n')
        temporary.replace(state_file)
    return result

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--previous', required=True)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--force', action='store_true')
    args = parser.parse_args()
    print(json.dumps(prune(BASE, args.previous, args.apply, args.force)))
