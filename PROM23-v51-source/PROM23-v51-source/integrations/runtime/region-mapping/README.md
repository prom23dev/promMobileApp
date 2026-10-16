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

**Open items for the owner (status as of 2026-10-14):**
1. ~~Decide whether to invest in a fuller FIAS/GAR import on the Bitrix side~~
   — **decided 2026-10-15: yes, import village-level data.** See the
   "Village-level import" section below — done.
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

## Village-level import (2026-10-15) — closes the item-1 gap above

The owner chose **variant B**: write a custom importer into Bitrix's own
`Sale\Location` tables from the mobile app's existing `gar.sqlite` (full
FIAS, 160,478 settlements nationwide), rather than running Bitrix's own
remote classifier-import wizard (`bitrix/modules/sale/lib/location/import/
importprocess.php` — downloads its own CSV layout from Bitrix's classifier
server; would need a fresh multi-GB download and doesn't accept GAR data
directly) or switching `LocationDriver::resolve()` to the site's DaData
integration (works, but moves a server-side dependency into the mobile
runtime's critical path for no benefit once the import below landed).

Scripts (new, kept in this directory):
- `build_villages_to_import.py matched.json sale-locations.json --out
  villages-to-import.json` — diffs `matched.json` against the 2,017 already
  resolved by `resolve-sale-locations.php`, extracting district name from
  `garFullName`'s `"р-н <name>"` fragment for each remaining (mostly
  village) settlement. Output: 97,136 settlements to import.
- `import-villages.php villages-to-import.json [limit]` — run on the Bitrix
  instance (same prolog/bootstrap pattern as `resolve-sale-locations.php`).
  Inserts one `Sale\Location\LocationTable` row per settlement (`TYPE_ID=6`
  VILLAGE) via the **public `LocationTable::addExtended()` API** (not raw
  SQL), attached as a child of the matching `SUBREGION` (district, `TYPE_ID=
  4`) row by exact name match (`<district> район`), falling back to the
  matching `REGION` row (`TYPE_ID=3`) when no district match exists. Also
  registers a new `GAR` row in `b_sale_loc_ext_srv` (didn't exist on this
  instance) and attaches each new location's FIAS UUID as an `EXTERNAL`
  row against it. Bulk inserts use `REBALANCE=>false` (append-only, O(1)
  per row — `Tree::addExtended()` just stamps `LEFT_MARGIN=parent.RIGHT_
  MARGIN`/`RIGHT_MARGIN=parent.RIGHT_MARGIN+1` without shifting siblings
  when this flag is off), followed by a single `LocationTable::resort()`
  at the end, which rebuilds `LEFT_MARGIN`/`RIGHT_MARGIN` for the whole
  tree purely from `PARENT_ID` edges (`Tree::resort()`,
  `bitrix/modules/sale/lib/location/tree.php` — read before writing this
  script, confirmed it ignores pre-existing margins entirely). Idempotent:
  `CODE` (`gar-<fiasId>`) has a `UNIQUE` index
  (`IX_SALE_LOCATION_CODE`), and the script pre-loads existing `gar-%`
  codes to skip them on a re-run rather than attempting (and discarding)
  a duplicate insert.

**Before writing:** took a JSON snapshot of all `b_sale_loc*` tables
(`/var/backups/prom23-db/sale-location-snapshot-before-village-import-
<timestamp>.json.gz` on the server, ~173KB gzipped — tables were small
enough that a full mysqldump wasn't needed; `mysqldump` itself also hit an
unrelated auth-plugin mismatch against this DB, a PHP `mysqli` snapshot
sidestepped it). Tested on a 300-row slice first (`checkIntegrity()` passed,
manually walked one inserted row's `PARENT_ID` chain all the way to the
`Россия` root and confirmed it matched the GAR `garFullName` exactly),
**then ran the full 97,136-row batch** (4m3s wall time):

```
{"inserted":95750,"skipped_existing":298,"no_region":1088,
 "parent_region_fallback":9358,"parent_district":86690,"insert_error":0}
```

Post-import: `LocationTable::checkIntegrity()` → OK. Total rows in
`b_sale_location`: 99,202 (3,154 original + 96,048 new `VILLAGE` rows —
298 from the test slice + 95,750 from the full run). 1,088 settlements had
no matching Bitrix `REGION` row by name at all (regionName string mismatch
or a region genuinely outside Bitrix's 12 delivery/price zones) and were
left unresolved, same as any other `LOCATION_MAPPING_REQUIRED` case.

Re-ran the pipeline's step 3+4 with the enlarged location tree
(`sale-locations.json` merged with the new `village-sale-locations.json`
output, fed into `build_region_by_settlement.py` unchanged): first pass
**`regionBySettlement.json` covered 98,065 settlements** across the same
12 Bitrix regions (up from 2,017 — a ~49x increase). 1,240 matched
settlements were skipped; inspecting `skipped.json`'s `saleLocationError`
breakdown found:

- **1,114 `LOCATION_MAPPING_REQUIRED`** — almost all (1,061) were **not** a
  real data gap, just regionName formatting differences between the HL
  "регионы продаж" block (where `matched.json`'s `regionName` comes from)
  and Bitrix's own `Sale\Location` region dictionary:
  - `"Республика Крым"` vs Bitrix's `"Крым"` (655 settlements)
  - `"Республика Северная Осетия - Алания"` (spaced dash) vs Bitrix's
    `"Республика Северная Осетия-Алания"` (no spaces) (197)
  - `"Ханты-Мансийский Автономный округ - Югра"` vs Bitrix's
    `"Ханты-Мансийский автономный округ"` (capitalization + no "- Югра"
    suffix) (170)
  - `"Севастополь"` — this instance has **no region-type row for
    Sevastopol at all** (only a city-type row nested under another
    region); mapped to the `"Крым"` region as the nearest
    administratively/commercially sensible delivery zone (39)
  - The remaining ~53 are genuinely outside Bitrix's region dictionary
    (Belarus/Armenia/Azerbaijan/Kazakhstan oblasts present in GAR's border
    data but not in this Russia-only Sale\Location classifier) — correctly
    unresolvable, not a bug.
  - Added these 4 as a `$regionAliases` map in `import-villages.php` and
    re-ran it (idempotent — the 96,048 already-inserted rows were skipped
    via the `gar-%` CODE pre-check, only the previously-failed ones were
    retried): **1,059 more inserted**, 29 still unresolved (the genuine
    foreign-topomym cases). Total villages: 97,107 of 97,136.
- **126 `CONFLICTING_REGION_FOR_SAME_SETTLEMENT`** — not a Sale\Location
  gap at all, a **pre-existing ambiguity in `matched.json` itself**: the
  same GAR `fiasId` appears against two different Bitrix HL cities that
  belong to two different price/delivery regions.
  `build_region_by_settlement.py:70-74` deliberately refuses to pick one
  silently. Needs manual/owner review per-case; out of scope for this
  import (it would exist regardless of Sale\Location coverage).

After the alias fix: `regionBySettlement.json` covered 99,124 settlements,
179 still skipped (126 conflicting + 53 unresolvable).

### `CONFLICTING_REGION_FOR_SAME_SETTLEMENT` disambiguation (2026-10-15)

Investigated the 126 conflicts by hand: every single matched.json group
(same `fiasId`, 2-3 different Bitrix HL city rows) had its `garFullName`
leading with the settlement's **true** region (e.g. `"респ. Дагестан,
р-н Тарумовский, ж/д рзд. 16-й"`), while exactly one candidate row's
`regionName` matched that region and the others didn't — generic
duplicate-name Bitrix cities ("27 км"/"29 км"/"5 км" railway markers,
"Алешата", "Актау" clashing with Kazakhstan's Aktau, "Агарак" clashing
with an Armenian city of the same name) or a `trigram-fuzzy` match that
should have lost to an exact match that already existed for the same
`fiasId` ("Аболдуевка" vs the correct "Болдаевка", "Амуши" vs the correct
"Мамуши"). The build script's original first-occurrence-wins rule had
**silently baked in the wrong region for some of these already** (e.g.
`"16-й"` was shipped pointing at Курганская область — matched.json's
first row — when GAR says it's in Дагестан, matched.json's second row).

Added `_gar_region_token()`/`_normalize_region_tokens()` to
`build_region_by_settlement.py`: for any `fiasId` with multiple candidate
rows, compare each candidate's `regionName` against the region token
parsed from `garFullName`'s leading `"обл./респ./край <Region>"` segment
(token-set overlap after stripping the `обл./область/респ./...`
boilerplate so differently-ordered/abbreviated forms still match). If
exactly one candidate's region matches GAR's own region, use that one;
if zero or more than one still match, leave it as a genuine
`CONFLICTING_REGION_FOR_SAME_SETTLEMENT` skip rather than guess.

Result: **125 of 126 resolved** (and 2 pre-existing wrong assignments,
including "16-й" above, got corrected in the process — `regionCount` in
the manifest actually *dropped* from 12 to 10, because two of those 12
"regions" turned out to be single-settlement artifacts of the bug: one
was literally Armenia's Сюник province, picked up only because of the
Агарак homonym). Final: **`regionBySettlement.json` covers 99,123
settlements**, manifest `providerVersion` still `20261015`. 30 settlements
remained skipped: the 29 genuinely-foreign/no-Bitrix-region cases, plus 1
true remaining conflict, manually investigated:

**`"Шорйыв"` (`fiasId` `e2a8d30b-57b5-4009-a978-57e16f64b19c`, GAR: край
Пермский, р-н Кудымкарский) — manually added, 2026-10-15.** `gar.sqlite`
has **three** settlements named "Шорйыв": two in Республика Коми
(disambiguated there as `"Шорйыв (Кожимский с/с)"` and `"Шорйыв
(Усть-Нёмский с/с)"`) and this one in Пермский край — a genuine
nationwide name homonym, not a data-entry typo. Bitrix's own HL city
export (`regions-export.json`) has **exactly two** cities named "Шорйыв",
both tagged `"Республика Коми"`, coordinates (`61.13,50.24` /
`60.91,49.72`) both sitting in Komi — Bitrix's own city list had no entry
for the Пермский-край homonym at all. `import-villages.php`'s batch run
had already inserted a `Sale\Location` row for this `fiasId` (`CODE=gar-
e2a8d30b...`, ID 96547) using the only matched.json candidates available
— both tagged "Республика Коми" — so it landed **parented under
Республика Коми, which was wrong**. Fixed by hand:
`LocationTable::updateExtended(96547, ['PARENT_ID' => 1958])` (1958 =
"Кудымкарский район", confirmed its own parent is "Пермский край"),
`checkIntegrity()` OK after. For the price-zone `regionId`: every one of
the 2,614 matched.json rows whose Bitrix `regionName` is literally
`"Пермский край"` carries `bitrixRegionId: 2866` / `priceCode: ["PER",
"PER_SALE"]` with zero exceptions — confident enough to hand-write this
one `regionBySettlement.json` entry (`{regionId: 2866, locationCode:
"gar-e2a8d30b..."}`) rather than route it through `matched.json`'s two
wrong candidate rows. Final count: **99,124 settlements**, 29 skipped
(only the genuinely-foreign cases left).

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
