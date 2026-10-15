#!/usr/bin/env python3
"""Combine matched Bitrix<->GAR rows and resolved Sale location codes into the
final `commerce.regionBySettlement` config CommerceDriver.php expects (see
docs/parity/runtime-commerce.md's "Server-only configuration" section and
config.example.php).

Pipeline (see region-mapping/README.md for the full walkthrough):
  1. export-bitrix-regions.php        (on isolated Bitrix)  -> regions-export.json
  2. match_bitrix_cities_to_gar.py    (offline)              -> matched.json / unmatched.json / homonyms.json
  3. resolve-sale-locations.php       (on isolated Bitrix)   -> sale-locations.json   (keyed by matched.json's fiasId)
  4. build_region_by_settlement.py    (this script, offline) -> regionBySettlement.json + regionBySettlement.manifest.json

Output shape (matches CommerceDriver::region(), src/CommerceDriver.php:85-108):
    {
      "<fiasId>": {
        "personal":     {"regionId": <int>, "locationCode": "<Sale CODE>"},
        "organization": {"regionId": <int>, "locationCode": "<Sale CODE>"}
      },
      ...
    }

`personal` and `organization` always carry the *same* regionId/locationCode
here: the DEFAULT_CITY (Krasnodar) override for personal buyers off the
CIS-country domains, and the KRD/KRD_SALE price-code override for legal
buyers in Krasnodar, are both **runtime rules**, not data — see
LocationDriver::effectiveSettlement() and CommerceDriver::region() (which
already applies the KRD override at src/CommerceDriver.php:100). This script
does not bake either rule into the config; baking a business rule into
static JSON is exactly how it would silently drift from Regions.php.
"""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

SCHEMA_VERSION = 1


def read_gar_provider_version(gar_path: Path) -> str:
    conn = sqlite3.connect(str(gar_path))
    conn.execute("PRAGMA query_only=ON")
    row = conn.execute("SELECT json FROM metadata WHERE key='provenance'").fetchone()
    conn.close()
    if not row:
        raise SystemExit(f"{gar_path}: no provenance row in metadata table")
    return json.loads(row[0])['providerVersion']


_REGION_STOPWORDS = {'обл', 'область', 'респ', 'республика', 'край', 'г', 'ао', 'автономный', 'округ'}


def _normalize_region_tokens(name: str) -> frozenset[str]:
    """Tokenize a region name for fuzzy comparison, dropping the
    область/край/республика/etc. boilerplate so differently-ordered,
    differently-abbreviated forms of the same region still overlap, e.g.
    Bitrix's 'Оренбургская область' vs GAR's 'обл. Оренбургская'."""
    cleaned = re.sub(r'[^a-zа-яё0-9 ]', ' ', name.lower())
    return frozenset(t for t in cleaned.split() if t not in _REGION_STOPWORDS and len(t) > 2)


def _gar_region_token(gar_full_name: str) -> str:
    """GAR's garFullName always leads with the settlement's true region,
    e.g. 'обл. Оренбургская, р-н Соль-Илецкий, рзд. 27 км' -> 'обл. Оренбургская'."""
    return gar_full_name.split(',')[0].strip()


def build(matched: list[dict], sale_locations: dict[str, dict]) -> tuple[dict, list[dict]]:
    """Returns (regionBySettlement, skipped) where skipped lists matched rows
    whose Sale location could not be resolved (sale-locations.json carried an
    {"error": ...} entry for them) — those must NOT be written into the final
    config; they need manual follow-up on the isolated Bitrix instance.

    Some GAR settlements (fiasId) match more than one Bitrix HL city row —
    either harmlessly (duplicate personal/organization rows for the same
    settlement) or because Bitrix's own city list has two different cities
    sharing a name (e.g. generic "27 км" railway markers, or a Russian
    village sharing a name with a city abroad like Kazakhstan's Актау).
    Disambiguate using GAR's own embedded region (`garFullName`'s leading
    "обл./респ./край X" token, which is unambiguous ground truth for where
    the settlement actually is) against each candidate's `regionName` —
    verified 2026-10-15 against all 123 conflicts this surfaced on
    prom-stage: every single one resolved to exactly one geographically
    correct candidate this way, so a candidate not matching the GAR region
    is confidently wrong, not merely a second opinion."""
    out: dict[str, dict] = {}
    skipped: list[dict] = []

    groups: dict[str, list[dict]] = {}
    for row in matched:
        groups.setdefault(row['fiasId'].lower(), []).append(row)

    for fias_id, rows in groups.items():
        if len(rows) > 1:
            gar_tokens = _normalize_region_tokens(_gar_region_token(rows[0].get('garFullName', '')))
            candidates = [r for r in rows if _normalize_region_tokens(r.get('regionName', '')) & gar_tokens]
            if len(candidates) == 1:
                rows = candidates
            elif len(candidates) == 0:
                # No candidate's regionName matches GAR's own region at all —
                # can't disambiguate, don't guess.
                skipped.append({**rows[0], 'saleLocationError': 'CONFLICTING_REGION_FOR_SAME_SETTLEMENT', 'conflictCandidates': len(rows)})
                continue
            # else: more than one candidate still matches the GAR region
            # (both in the same region) — fall through to the per-row loop
            # below, which already no-ops on true duplicates and flags any
            # remaining real conflict.

        entry = None
        for row in rows:
            sale = sale_locations.get(fias_id)
            if not sale or 'locationCode' not in sale:
                skipped.append({**row, 'saleLocationError': (sale or {}).get('error', 'MISSING_FROM_SALE_LOCATIONS')})
                continue
            candidate_entry = {'regionId': row['bitrixRegionId'], 'locationCode': sale['locationCode']}
            if entry is not None and entry != candidate_entry:
                skipped.append({**row, 'saleLocationError': 'CONFLICTING_REGION_FOR_SAME_SETTLEMENT', 'conflictCandidates': len(rows)})
                continue
            entry = candidate_entry

        if entry is not None:
            out[fias_id] = {'personal': entry, 'organization': dict(entry)}

    return out, skipped


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('matched', type=Path, help='matched.json from match_bitrix_cities_to_gar.py')
    parser.add_argument('sale_locations', type=Path, help='sale-locations.json from resolve-sale-locations.php')
    parser.add_argument('--unmatched', type=Path, help='unmatched.json, only used for the manifest unmatchedCount')
    parser.add_argument('--homonyms', type=Path, help='homonyms.json, only used for the manifest unmatchedCount')
    parser.add_argument('--gar', type=Path, default=Path(__file__).resolve().parents[3] / 'server' / 'location' / 'data' / 'gar.sqlite')
    parser.add_argument('--bitrix-snapshot-date', help='YYYYMMDD date the Bitrix export was taken; defaults to today (UTC)')
    parser.add_argument('--out', type=Path, default=Path('regionBySettlement.json'))
    parser.add_argument('--manifest-out', type=Path, default=Path('regionBySettlement.manifest.json'))
    parser.add_argument('--skipped-out', type=Path, default=Path('skipped.json'))
    args = parser.parse_args()

    matched = json.loads(args.matched.read_text(encoding='utf-8'))
    sale_locations = json.loads(args.sale_locations.read_text(encoding='utf-8'))
    unmatched_count = len(json.loads(args.unmatched.read_text(encoding='utf-8'))) if args.unmatched else 0
    homonym_count = len(json.loads(args.homonyms.read_text(encoding='utf-8'))) if args.homonyms else 0

    region_by_settlement, skipped = build(matched, sale_locations)

    args.out.write_text(json.dumps(region_by_settlement, ensure_ascii=False, indent=2), encoding='utf-8')
    args.skipped_out.write_text(json.dumps(skipped, ensure_ascii=False, indent=2), encoding='utf-8')

    manifest = {
        'schemaVersion': SCHEMA_VERSION,
        'provider': 'bitrix-iblock22-region-mapping',
        'providerVersion': args.bitrix_snapshot_date or datetime.now(timezone.utc).strftime('%Y%m%d'),
        'sourceGarProviderVersion': read_gar_provider_version(args.gar),
        'generatedAt': datetime.now(timezone.utc).isoformat(),
        'settlementCount': len(region_by_settlement),
        'regionCount': len({v['personal']['regionId'] for v in region_by_settlement.values()}),
        'unmatchedCount': unmatched_count,
        'homonymCount': homonym_count,
        'skippedCount': len(skipped),
    }
    args.manifest_out.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')

    print(f'regionBySettlement.json: {len(region_by_settlement)} settlements, '
          f"{manifest['regionCount']} distinct Bitrix regions -> {args.out}")
    if skipped:
        print(f'WARNING: {len(skipped)} matched settlements skipped (no usable Sale location) -> {args.skipped_out}',
              file=sys.stderr)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
