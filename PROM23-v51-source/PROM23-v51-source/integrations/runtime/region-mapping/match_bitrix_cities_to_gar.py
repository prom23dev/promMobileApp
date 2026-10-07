#!/usr/bin/env python3
"""Match a Bitrix regions/cities export against server/location/data/gar.sqlite.

There is no shared key between Bitrix (iblock 22 + HL cities/regions) and the
GAR/FIAS registry the mobile app uses for location search. This script
matches by normalized city name + region name, using the *same*
normalization rules as server/location/provider.mjs (normalizeLocationQuery)
so results stay consistent with how the app's own /location search already
behaves — see normalizeLocationQuery() there (server/location/provider.mjs:6)
and its trigram fallback (server/location/provider.mjs:155-163).

Usage:
    python match_bitrix_cities_to_gar.py regions-export.json \
        --gar ../../../server/location/data/gar.sqlite \
        --matched matched.json \
        --unmatched unmatched.json \
        --homonyms homonyms.json

Input `regions-export.json` is the output of export-bitrix-regions.php
(the `{"rows": [...]}` wrapper is unwrapped automatically; a bare array is
also accepted).

Outputs:
    matched.json   — one row per Bitrix city name that resolved to exactly
                      one gar.sqlite settlement, unambiguously. Carries both
                      the original Bitrix fields and the resolved GAR
                      identity (id/fiasId/garId/fullName).
    unmatched.json — Bitrix cities with zero gar.sqlite candidates after
                      exact + fuzzy matching. Needs manual GAR lookup.
    homonyms.json   — Bitrix cities with 2+ gar.sqlite candidates that could
                      not be disambiguated by region name alone. Needs manual
                      review — this script never guesses a homonym.
"""
from __future__ import annotations

import argparse
import json
import re
import sqlite3
import sys
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path


# ---------------------------------------------------------------------------
# Ported from server/location/provider.mjs so matching stays consistent with
# how the app's own /location search normalizes and fuzzy-matches queries.
# ---------------------------------------------------------------------------

def normalize_location_query(value: str) -> str:
    """Port of provider.mjs normalizeLocationQuery (line 6)."""
    value = unicodedata.normalize('NFKC', value)
    value = value.lower()  # ru locale lowercasing; Python's default is equivalent for Cyrillic
    value = value.replace('ё', 'е')
    value = value.strip()
    value = re.sub(r'\s+', ' ', value)
    return value


_LETTER_WORD_RE = re.compile(r'[^\W_]+', re.UNICODE)


def letter_words(value: str) -> list[str]:
    """Port of provider.mjs letterWords (line 7): runs of letters/digits."""
    return _LETTER_WORD_RE.findall(value)


def edit_distance_bounded(left: str, right: str, maximum: int = 2) -> int:
    """Port of provider.mjs editDistanceBounded (lines 21-37) — bounded
    Damerau-Levenshtein distance (adjacent transposition counts as 1)."""
    if abs(len(left) - len(right)) > maximum:
        return maximum + 1
    previous = list(range(len(right) + 1))
    before_previous = None
    for i in range(1, len(left) + 1):
        current = [i] + [0] * len(right)
        minimum = i
        for j in range(1, len(right) + 1):
            cost = 0 if left[i - 1] == right[j - 1] else 1
            value = min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost)
            if i > 1 and j > 1 and left[i - 1] == right[j - 2] and left[i - 2] == right[j - 1]:
                value = min(value, before_previous[j - 2] + 1)
            current[j] = value
            minimum = min(minimum, value)
        if minimum > maximum:
            return maximum + 1
        before_previous = previous
        previous = current
    return previous[len(right)]


def trigrams(value: str) -> set[str]:
    return {value[i:i + 3] for i in range(len(value) - 2)}


# ---------------------------------------------------------------------------
# gar.sqlite access
# ---------------------------------------------------------------------------

@dataclass
class GarSettlement:
    id: str
    fias_id: str
    gar_id: str
    name: str
    type_short: str
    region_name: str
    full_name: str
    normalized_name: str
    normalized_region: str = field(default='')

    def __post_init__(self):
        self.normalized_region = normalize_location_query(self.region_name)


def load_gar(db_path: Path) -> list[GarSettlement]:
    conn = sqlite3.connect(str(db_path))
    conn.execute("PRAGMA query_only=ON")
    rows = conn.execute("SELECT payload, normalized_name FROM settlements").fetchall()
    conn.close()
    out = []
    for payload_json, normalized_name in rows:
        payload = json.loads(payload_json)
        region = payload.get('region') or {}
        out.append(GarSettlement(
            id=payload['id'],
            fias_id=payload['fiasId'],
            gar_id=payload['garId'],
            name=payload['name'],
            type_short=payload.get('typeShort', ''),
            region_name=region.get('name', ''),
            full_name=payload['fullName'],
            normalized_name=normalized_name,
        ))
    return out


def index_by_normalized_name(settlements: list[GarSettlement]) -> dict[str, list[GarSettlement]]:
    index: dict[str, list[GarSettlement]] = {}
    for s in settlements:
        index.setdefault(s.normalized_name, []).append(s)
    return index


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------

REGION_EXACT_MAX_DISTANCE = 3  # e.g. "краснодарский край" vs Bitrix's own phrasing


def region_matches(bitrix_region_norm: str, candidate: GarSettlement) -> bool:
    if not bitrix_region_norm or not candidate.normalized_region:
        return False
    if bitrix_region_norm == candidate.normalized_region:
        return True
    if bitrix_region_norm in candidate.normalized_region or candidate.normalized_region in bitrix_region_norm:
        return True
    distance = edit_distance_bounded(bitrix_region_norm, candidate.normalized_region, REGION_EXACT_MAX_DISTANCE)
    return distance <= REGION_EXACT_MAX_DISTANCE


def fuzzy_candidates(city_norm: str, settlements: list[GarSettlement]) -> list[GarSettlement]:
    """Trigram-style fallback, mirroring provider.mjs suggest()'s trigram
    branch (lines 155-163): only used when there is no exact normalized-name
    hit, bounded by a tight edit distance so it never silently guesses."""
    words = letter_words(city_norm)
    if len(words) != 1 or len(city_norm) < 4 or len(city_norm) > 60:
        return []
    query_trigrams = trigrams(city_norm)
    maximum = 1 if len(city_norm) < 6 else 2
    out = []
    for s in settlements:
        if abs(len(s.normalized_name) - len(city_norm)) > maximum:
            continue
        candidate_trigrams = trigrams(s.normalized_name)
        if not (query_trigrams & candidate_trigrams):
            continue
        distance = edit_distance_bounded(city_norm, s.normalized_name, maximum)
        if distance <= maximum:
            out.append(s)
    return out


def match(bitrix_rows: list[dict], gar: list[GarSettlement]) -> tuple[list[dict], list[dict], list[dict]]:
    by_name = index_by_normalized_name(gar)
    matched, unmatched, homonyms = [], [], []

    for row in bitrix_rows:
        city_norm = normalize_location_query(row['cityName'])
        region_norm = normalize_location_query(row.get('regionName', ''))

        candidates = by_name.get(city_norm, [])
        matched_via = 'exact-name'
        if not candidates:
            candidates = fuzzy_candidates(city_norm, gar)
            matched_via = 'trigram-fuzzy'

        if not candidates:
            unmatched.append({**row, 'reason': 'NO_GAR_CANDIDATE'})
            continue

        if len(candidates) == 1:
            matched.append(_matched_row(row, candidates[0], matched_via, disambiguated=False))
            continue

        # Homonym: 2+ settlements share this normalized name. Try to
        # disambiguate by region name — but only accept if exactly one
        # candidate's region matches; otherwise this goes to manual review.
        region_filtered = [c for c in candidates if region_matches(region_norm, c)]
        if len(region_filtered) == 1:
            matched.append(_matched_row(row, region_filtered[0], matched_via, disambiguated=True))
        else:
            homonyms.append({
                **row,
                'reason': 'HOMONYM_AMBIGUOUS' if not region_filtered else 'HOMONYM_MULTIPLE_REGION_MATCHES',
                'candidates': [
                    {
                        'id': c.id,
                        'fiasId': c.fias_id,
                        'garId': c.gar_id,
                        'fullName': c.full_name,
                        'regionName': c.region_name,
                    }
                    for c in candidates
                ],
            })

    return matched, unmatched, homonyms


def _matched_row(row: dict, gar_settlement: GarSettlement, matched_via: str, disambiguated: bool) -> dict:
    return {
        **row,
        'garId': gar_settlement.id,
        'fiasId': gar_settlement.fias_id,
        'garNumericId': gar_settlement.gar_id,
        'garFullName': gar_settlement.full_name,
        'garRegionName': gar_settlement.region_name,
        'matchedVia': matched_via,
        'disambiguatedByRegion': disambiguated,
    }


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('export', type=Path, help='regions-export.json from export-bitrix-regions.php')
    parser.add_argument('--gar', type=Path, default=Path(__file__).resolve().parents[3] / 'server' / 'location' / 'data' / 'gar.sqlite')
    parser.add_argument('--matched', type=Path, default=Path('matched.json'))
    parser.add_argument('--unmatched', type=Path, default=Path('unmatched.json'))
    parser.add_argument('--homonyms', type=Path, default=Path('homonyms.json'))
    args = parser.parse_args()

    raw = json.loads(args.export.read_text(encoding='utf-8'))
    bitrix_rows = raw['rows'] if isinstance(raw, dict) and 'rows' in raw else raw
    if not isinstance(bitrix_rows, list):
        print('export file must contain a JSON array or {"rows": [...]}', file=sys.stderr)
        return 1

    gar = load_gar(args.gar)
    matched, unmatched, homonyms = match(bitrix_rows, gar)

    args.matched.write_text(json.dumps(matched, ensure_ascii=False, indent=2), encoding='utf-8')
    args.unmatched.write_text(json.dumps(unmatched, ensure_ascii=False, indent=2), encoding='utf-8')
    args.homonyms.write_text(json.dumps(homonyms, ensure_ascii=False, indent=2), encoding='utf-8')

    print(f'matched:   {len(matched):5d} -> {args.matched}')
    print(f'unmatched: {len(unmatched):5d} -> {args.unmatched}')
    print(f'homonyms:  {len(homonyms):5d} -> {args.homonyms}')
    print('unmatched + homonyms require manual review before building regionBySettlement.json.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
