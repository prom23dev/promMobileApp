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

## Executed live on prom-stage (2026-10-14) — results and findings

Ran the full pipeline read-only against `prom.myfast.space` (confirmed
isolated instance, see memory `project-prom-stage-real-bitrix`):

- Step 1 (`export-bitrix-regions.php`): 150,610 of 156,237 active
  `HLBL_ID_CITIES` rows resolved to one of the 18 active `IBLOCK_ID_REGIONS`
  elements (5,627 had no matching region — some are HL data artifacts, e.g.
  a city row literally named `"01.05.2021"`).
- Step 2 (`match_bitrix_cities_to_gar.py`): 100,513 matched, 2,164 unmatched,
  **47,933 homonyms**. Inspected a sample of the homonym bucket: it is
  dominated by tiny, non-unique micro-placenames repeated nationwide (e.g.
  "12 км" railway-kilometer markers) — genuinely unresolvable by name alone,
  low business relevance for delivery. Did not attempt manual review of the
  full 48k backlog this session; treat as a known, mostly-low-value backlog
  rather than a blocking gap.
- Step 3 (`resolve-sale-locations.php`) — **had to be rewritten**: the
  original design resolved via `Sale\Location\ExternalTable`'s FIAS/GAR
  external-identity rows (same as `LocationDriver::resolve()`). Checked
  live: **this instance has zero rows for `SERVICE.CODE IN ('FIAS','GAR')`**
  — only `YAMARKET`/`ZIP`/`ZIP_LOWER`/`BX_ISO_3166_NUMERIC`/`ADD_DLV` exist.
  `LocationDriver::resolve()` is itself correctly designed (its test fixture
  in `test/LocationDriver.test.php` intentionally resolves village-level
  settlements via FIAS XML_ID, not city-name) — this is a live-environment
  gap on prom-stage (an incomplete/city-only FIAS import), not a code bug.
  Rewrote the script's lookup to match by the Bitrix HL city's own `cityName`
  against `LocationTable` (`=NAME.NAME` + `TYPE.CODE='CITY'`) instead — the
  same mechanism the live site's own `local/ajax/order/resolve-location.php`
  uses for free-address resolution. This does not need FIAS/GAR at all,
  since the name already came from Bitrix's own `HLBL_ID_CITIES`.
  - Result: only 2,017 of 100,513 resolved (~2%). This is **not** a bug in
    the name-matching approach — a biased test on city/town-type rows
    (`garFullName` containing `"г."`) hit 276/290 (95%). The real ceiling is
    that **this instance's `Sale\Location\LocationTable` itself only holds
    city/town-level granularity (roughly 2,000 rows)**, not full
    village-level FIAS data. Village-level `regionBySettlement` resolution
    is not achievable against this specific Bitrix instance until its
    location dictionary gets a fuller FIAS/GAR import — flag to the owner
    as an infrastructure gap, separate from any app-side code.
- Step 4 (`build_region_by_settlement.py`): final `regionBySettlement.json`
  — **2,017 settlements, 12 distinct Bitrix regions**. Committed alongside
  its manifest; the bulky intermediates (`regions-export.json` 100MB,
  `matched.json` 84MB, `homonyms.json` 661MB, `sale-locations.json` 9.4MB,
  `skipped.json` 87MB, `unmatched.json` 1.2MB) are regeneratable from a
  fresh live export and are now gitignored, not committed.

**Open items for the owner:**
1. Decide whether to invest in a fuller FIAS/GAR import on the Bitrix side
   to get village-level `regionBySettlement`/`LocationDriver::resolve()`
   coverage, or accept city-level-only resolution (2,017 settlements is
   still real coverage for every town/city a buyer is likely to search).
2. The 47,933-row homonym backlog and 2,164 unmatched rows need either
   manual review or an explicit decision to leave them as
   `REGION_MAPPING_REQUIRED` (dispatcher already fails safely for settlements
   absent from `regionBySettlement.json` — not a correctness risk, just a
   coverage gap).
3. `Моskva`/`Санкт-Петербург` federal-city granularity wasn't needed by this
   pipeline (it joins by HL city name, not by federal-subject coverage), so
   the Krasnodar-catch-all ambiguity found during an earlier (abandoned)
   federal-subject approach does not apply here — no action needed on that
   front.

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
