# Bitrix region/city → GAR settlement mapping

Builds `commerce.regionBySettlement` (see `../config.example.php` and
`../../../docs/parity/runtime-commerce.md`) from the real Bitrix backend
(`IBLOCK_ID_REGIONS=22`, `HLBL_ID_CITIES=8`, `HLBL_ID_REGIONS=7` — see
`local/php_interface/lib/Regions.php:getRegionData()` in
`prom23marketplace`) and the mobile app's own GAR/FIAS registry
(`server/location/data/gar.sqlite`). There is no shared key between the two
systems — matching is by normalized city name + region name, and homonyms
(multiple cities sharing a name in different regions) are never guessed.

## Pipeline

Run on an **isolated/staging Bitrix instance** — never against prom23.ru
directly:

```sh
# 1. Dump iblock 22 joined to HL cities/regions (read-only)
php export-bitrix-regions.php > regions-export.json

# 2. Match against gar.sqlite offline (no Bitrix needed for this step)
python match_bitrix_cities_to_gar.py regions-export.json \
    --matched matched.json --unmatched unmatched.json --homonyms homonyms.json

# --- Manually review unmatched.json and homonyms.json here. Do not skip. ---
# Each homonym needs a human to pick which gar.sqlite candidate.id/fiasId is correct;
# each unmatched row needs its GAR settlement looked up by hand (e.g. via the app's own
# /location search) and appended to matched.json in the same shape before step 3.

# 3. Resolve each matched settlement's Bitrix Sale location CODE (back on Bitrix)
php resolve-sale-locations.php matched.json > sale-locations.json

# 4. Combine into the final config + manifest (offline)
python build_region_by_settlement.py matched.json sale-locations.json \
    --unmatched unmatched.json --homonyms homonyms.json \
    --out regionBySettlement.json --manifest-out regionBySettlement.manifest.json
```

Deploy `regionBySettlement.json` and `regionBySettlement.manifest.json`
together, outside the web root, mode 0600, next to the runtime's other
private state (see `config.example.php`'s `$regionMappingDir`). Load them
with `LocationDriver::loadRegionBySettlement()`
(`../src/LocationDriver.php`) — it refuses to load a JSON file whose actual
settlement/region counts don't match its manifest, the same defence
`server/location/provider.mjs`'s `refresh()` applies to `gar.sqlite`.

## Business rules ported into code, not baked into this data

Two rules from `Regions.php` change which region a request actually prices
against; they are **runtime logic**, not something this export bakes into
`regionBySettlement.json` (baking them into static data is exactly how they
would drift silently from the source the next time Bitrix's config
changes):

- **Personal buyers off the site's own CIS domain always price against
  DEFAULT_CITY** (Krasnodar, `defines.php:88`), regardless of which
  settlement they picked (`Regions.php:465-481`) — implemented in
  `LocationDriver::effectiveSettlement()` and called from
  `CommerceDriver::region()` before the `regionBySettlement` lookup.
- **Legal buyers whose resolved region is DEFAULT_CITY get PRICE_CODE
  forced to `['KRD','KRD_SALE']`** (`Regions.php:583-587`) — already
  implemented in `CommerceDriver::region()` (depends on the catalog price
  group lookup, which `LocationDriver` has no reason to know about).

## Re-running after a `gar.sqlite` refresh

`regionBySettlement.manifest.json`'s `sourceGarProviderVersion` records
which `gar.sqlite` snapshot the GAR UUIDs were matched against. If
`server/location/data/gar.sqlite` is later re-imported with a newer
`providerVersion` (see `gar.manifest.json`), those UUIDs are **not**
guaranteed to stay stable across GAR/FIAS registry snapshots for
newly-added/merged/renamed settlements. Re-run the full pipeline against
the new snapshot rather than assuming old UUIDs still resolve; the
mismatch is not currently detected automatically (that would need the PHP
runtime to read `gar.sqlite`'s own metadata, which it does not have access
to — see the `sourceGarProviderVersion` field as a manual cross-check
instead).
