#!/usr/bin/env python3
r"""One-off helper for the village-level FIAS import (owner-approved variant B).

Takes matched.json (GAR-matched settlements) and sale-locations.json (which
of those already have a Bitrix Sale LocationTable CODE, built by
resolve-sale-locations.php via CITY name match) and produces the list of
settlements that still need a new Bitrix Sale\Location row created (mostly
villages, since only ~2% of matched settlements are city/town-grade).

Usage:
    python build_villages_to_import.py matched.json sale-locations.json \
        --out villages-to-import.json
"""
import argparse
import json
import re

DISTRICT_RE = re.compile(r"р-н\s+([^,]+)")


def extract_district(gar_full_name: str) -> str | None:
    m = DISTRICT_RE.search(gar_full_name or "")
    return m.group(1).strip() if m else None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("matched")
    parser.add_argument("sale_locations")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    with open(args.matched, encoding="utf-8") as f:
        matched = json.load(f)
    with open(args.sale_locations, encoding="utf-8") as f:
        resolved = json.load(f)

    already_ok = {fiasId for fiasId, v in resolved.items() if "locationCode" in v}

    out = {}
    skipped_no_name = 0
    for entry in matched:
        fiasId = str(entry.get("fiasId") or entry.get("garId") or "").lower()
        if not fiasId or fiasId in already_ok or fiasId in out:
            continue
        cityName = (entry.get("cityName") or "").strip()
        if not cityName:
            skipped_no_name += 1
            continue
        out[fiasId] = {
            "cityName": cityName,
            "regionName": (entry.get("regionName") or "").strip(),
            "garRegionName": (entry.get("garRegionName") or "").strip(),
            "district": extract_district(entry.get("garFullName") or ""),
            "garFullName": entry.get("garFullName") or "",
        }

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False)

    print(f"villages to import: {len(out)} (skipped no cityName: {skipped_no_name})")


if __name__ == "__main__":
    main()
