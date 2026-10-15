<?php
declare(strict_types=1);
/**
 * ONE-OFF IMPORT SCRIPT — RUN ONLY ON AN ISOLATED/STAGING BITRIX INSTANCE.
 *
 * Owner-approved "variant B": the 2026-10-14 pipeline run
 * (resolve-sale-locations.php) found that this Bitrix instance's
 * Sale\Location dictionary only has city/town granularity (~2,000 rows) —
 * no FIAS/GAR identity rows, no village-level rows at all. This script
 * closes that gap by inserting a new VILLAGE-type Sale\Location row for
 * every GAR-matched settlement that resolve-sale-locations.php could not
 * resolve (see build_villages_to_import.py), attached as a child of the
 * matching SUBREGION (district) row by name, falling back to the matching
 * REGION row directly when no district match is found.
 *
 * Uses the public Bitrix\Sale\Location\LocationTable::addExtended() API
 * (not raw SQL) so NAME/EXTERNAL rows and nested-set bookkeeping stay
 * consistent with how Bitrix's own importer (location/import/importprocess.php)
 * does it. Bulk inserts use REBALANCE=>false (append-only, O(1) per row)
 * and a single LocationTable::resort() call at the end recomputes
 * LEFT_MARGIN/RIGHT_MARGIN for the whole tree from PARENT_ID alone — see
 * Tree::resort() in bitrix/modules/sale/lib/location/tree.php, confirmed
 * safe to read before writing this script.
 *
 * Idempotent: CODE has a UNIQUE index (IX_SALE_LOCATION_CODE) and this
 * script generates CODE = 'gar-'.$fiasId, so re-running after a partial
 * failure just skips rows that already made it in.
 *
 * Usage:
 *   php import-villages.php villages-to-import.json [limit]
 *
 * Output (stdout): JSON {fiasId: {locationCode, name, method}} for
 * successful inserts, {fiasId: {error}} for failures — same shape as
 * resolve-sale-locations.php's output, so build_region_by_settlement.py
 * can consume both merged together.
 */

ini_set('memory_limit', '2G');
set_time_limit(0);
$_SERVER['DOCUMENT_ROOT'] = '/var/www/prom_myfast__usr/data/www/prom.myfast.space';
chdir($_SERVER['DOCUMENT_ROOT']);
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php';

use Bitrix\Main\Loader;
use Bitrix\Main\Application;
use Bitrix\Sale\Location\LocationTable;

if (!Loader::includeModule('sale')) {
    fwrite(STDERR, "Sale module unavailable.\n");
    exit(1);
}

$inputPath = $argv[1] ?? null;
$limit = isset($argv[2]) ? (int)$argv[2] : null;
if (!$inputPath || !is_file($inputPath)) {
    fwrite(STDERR, "Usage: php import-villages.php <villages-to-import.json> [limit]\n");
    exit(1);
}

$villages = json_decode(file_get_contents($inputPath), true, 512, JSON_THROW_ON_ERROR);
if (!is_array($villages)) {
    fwrite(STDERR, "Input must decode to a JSON object.\n");
    exit(1);
}

$connection = Application::getConnection();

// 1. Ensure the GAR external service row exists (b_sale_loc_ext_srv has no
//    FIAS/GAR row on this instance at all — see resolve-sale-locations.php's
//    docblock).
$garServiceId = (int)($connection->query("SELECT ID FROM b_sale_loc_ext_srv WHERE CODE = 'GAR'")->fetch()['ID'] ?? 0);
if ($garServiceId === 0) {
    $connection->query("INSERT INTO b_sale_loc_ext_srv (CODE) VALUES ('GAR')");
    $garServiceId = (int)$connection->getInsertedId();
    fwrite(STDERR, "Created b_sale_loc_ext_srv CODE=GAR, ID={$garServiceId}\n");
} else {
    fwrite(STDERR, "Using existing b_sale_loc_ext_srv CODE=GAR, ID={$garServiceId}\n");
}

// 2. Build regionName -> regionId map (TYPE_ID=3, 82 rows on this instance).
$regionMap = [];
$res = $connection->query(
    "SELECT l.ID, n.NAME FROM b_sale_location l " .
    "JOIN b_sale_loc_name n ON n.LOCATION_ID = l.ID AND n.LANGUAGE_ID = 'ru' " .
    "WHERE l.TYPE_ID = 3"
);
while ($row = $res->fetch()) {
    $regionMap[$row['NAME']] = (int)$row['ID'];
}
fwrite(STDERR, "Loaded " . count($regionMap) . " regions.\n");

// 3. Build (regionId|districtName) -> districtId map (TYPE_ID=4, ~1900 rows).
$districtMap = [];
$res = $connection->query(
    "SELECT l.ID, l.PARENT_ID, n.NAME FROM b_sale_location l " .
    "JOIN b_sale_loc_name n ON n.LOCATION_ID = l.ID AND n.LANGUAGE_ID = 'ru' " .
    "WHERE l.TYPE_ID = 4"
);
while ($row = $res->fetch()) {
    $districtMap[$row['PARENT_ID'] . '|' . $row['NAME']] = (int)$row['ID'];
}
fwrite(STDERR, "Loaded " . count($districtMap) . " districts.\n");

// 4. Idempotency: skip settlements already inserted by a previous partial run
//    (CODE has a UNIQUE index — IX_SALE_LOCATION_CODE — so this is cheap and
//    avoids relying on parsing Bitrix's localized validator error strings).
$existingCodes = [];
$res = $connection->query("SELECT CODE FROM b_sale_location WHERE CODE LIKE 'gar-%'");
while ($row = $res->fetch()) {
    $existingCodes[$row['CODE']] = true;
}
fwrite(STDERR, "Found " . count($existingCodes) . " already-imported village rows from a previous run.\n");

$out = [];
$stats = ['inserted' => 0, 'skipped_existing' => 0, 'no_region' => 0, 'parent_region_fallback' => 0, 'parent_district' => 0, 'insert_error' => 0];
$i = 0;

foreach ($villages as $fiasId => $entry) {
    $i++;
    if ($limit !== null && $i > $limit) {
        break;
    }

    $regionName = (string)($entry['regionName'] ?? '');
    $regionId = $regionMap[$regionName] ?? null;
    if ($regionId === null) {
        $out[$fiasId] = ['error' => 'LOCATION_MAPPING_REQUIRED', 'reason' => 'region-not-found', 'regionName' => $regionName];
        $stats['no_region']++;
        continue;
    }

    $parentId = $regionId;
    $district = $entry['district'] ?? null;
    if ($district) {
        $districtKey = $regionId . '|' . $district . ' район';
        if (isset($districtMap[$districtKey])) {
            $parentId = $districtMap[$districtKey];
            $stats['parent_district']++;
        } else {
            $stats['parent_region_fallback']++;
        }
    } else {
        $stats['parent_region_fallback']++;
    }

    $cityName = (string)($entry['cityName'] ?? '');
    $code = 'gar-' . $fiasId;

    if (isset($existingCodes[$code])) {
        $out[$fiasId] = ['locationCode' => $code, 'name' => $cityName, 'method' => 'village-import-existing'];
        $stats['skipped_existing']++;
        continue;
    }

    $addResult = LocationTable::addExtended(
        [
            'CODE' => $code,
            'TYPE_ID' => 6, // VILLAGE
            'PARENT_ID' => $parentId,
            'SORT' => 100,
            'NAME' => ['ru' => ['NAME' => $cityName, 'SHORT_NAME' => $cityName]],
            'EXTERNAL' => [['SERVICE_ID' => $garServiceId, 'XML_ID' => $fiasId]],
        ],
        ['REBALANCE' => false]
    );

    if ($addResult->isSuccess()) {
        $out[$fiasId] = ['locationCode' => $code, 'name' => $cityName, 'method' => 'village-import'];
        $stats['inserted']++;
    } else {
        $errors = implode('; ', $addResult->getErrorMessages());
        if (stripos($errors, 'уже существует') !== false || stripos($errors, 'already') !== false || stripos($errors, 'unique') !== false) {
            // Idempotent re-run: row from a previous partial run.
            $out[$fiasId] = ['locationCode' => $code, 'name' => $cityName, 'method' => 'village-import-existing'];
            $stats['skipped_existing']++;
        } else {
            $out[$fiasId] = ['error' => 'INSERT_FAILED', 'details' => $errors];
            $stats['insert_error']++;
        }
    }

    if ($i % 5000 === 0) {
        fwrite(STDERR, "... {$i} processed\n");
    }
}

fwrite(STDERR, "Rebalancing tree (resort)...\n");
LocationTable::resort();
fwrite(STDERR, "Done. Stats: " . json_encode($stats) . "\n");

echo json_encode($out, JSON_UNESCAPED_UNICODE) . "\n";
