<?php
declare(strict_types=1);
/**
 * ONE-OFF EXPORT SCRIPT — RUN ONLY ON AN ISOLATED/STAGING BITRIX INSTANCE.
 *
 * `commerce.regionBySettlement[GAR UUID][kind]` (see CommerceDriver.php and
 * config.example.php) needs a Bitrix Sale `LocationTable.CODE` per matched
 * settlement, in addition to the region element ID that
 * export-bitrix-regions.php produces. That CODE is Bitrix's own internal
 * Sale location identity, generated when Bitrix imports its FIAS/GAR
 * dictionary — it cannot be derived offline from gar.sqlite. It must be
 * looked up the same way LocationDriver::resolve() looks it up at request
 * time (src/LocationDriver.php:14-31): FIAS/GAR external XML_ID -> LOCATION_ID
 * -> Sale LocationTable.CODE.
 *
 * This script takes the *matched* output of match-bitrix-cities-to-gar.py
 * (a list of {"fiasId": "<uuid>", ...}) and resolves each one's Sale CODE,
 * so build-region-by-settlement.py can join them into the final
 * regionBySettlement.json without duplicating LocationDriver's lookup logic.
 *
 * Usage:
 *   php resolve-sale-locations.php matched.json > sale-locations.json
 *
 * Input: matched.json — JSON array of objects with at least a "fiasId" key
 * (lowercase UUID, GAR/FIAS identity — matched.json from step 2 of this
 * pipeline carries it as the gar.sqlite settlement's own "id"/"fiasId").
 *
 * Output: JSON object keyed by fiasId ->
 *   {"locationCode": "...", "name": "...", "zip": "..."} on success, or
 *   {"error": "LOCATION_MAPPING_REQUIRED"|"LOCATION_MAPPING_AMBIGUOUS"|"LOCATION_MAPPING_INVALID"}
 * for settlements with no usable Bitrix Sale location — those go in the
 * unmatched/manual-review pile, not into regionBySettlement.json.
 */

require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php';

use Bitrix\Main\Loader;
use Bitrix\Sale\Location\ExternalTable;
use Bitrix\Sale\Location\LocationTable;

if (!Loader::includeModule('sale')) {
    fwrite(STDERR, "Sale module unavailable.\n");
    exit(1);
}

$inputPath = $argv[1] ?? null;
if (!$inputPath || !is_file($inputPath)) {
    fwrite(STDERR, "Usage: php resolve-sale-locations.php <matched.json>\n");
    exit(1);
}

$matched = json_decode(file_get_contents($inputPath), true, 512, JSON_THROW_ON_ERROR);
if (!is_array($matched)) {
    fwrite(STDERR, "matched.json must decode to a JSON array.\n");
    exit(1);
}

// Same two service codes LocationDriver::resolve() accepts (src/LocationDriver.php:20-21).
// Try FIAS first (Bitrix default), then GAR, matching the same fallback the driver allows
// via config — but here we detect whichever is actually installed for this site.
$serviceCandidates = ['FIAS', 'GAR'];

$out = [];
foreach ($matched as $entry) {
    $fiasId = strtolower((string)($entry['fiasId'] ?? $entry['id'] ?? ''));
    if (!preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/D', $fiasId)) {
        continue;
    }
    if (isset($out[$fiasId])) {
        continue; // matched.json may list the same settlement under both personal/organization rows.
    }

    $resolved = null;
    foreach ($serviceCandidates as $service) {
        $rows = ExternalTable::getList([
            'select' => ['LOCATION_ID'],
            'filter' => ['=XML_ID' => $fiasId, '=SERVICE.CODE' => $service],
            'limit' => 3,
        ])->fetchAll();
        $ids = array_values(array_unique(array_map(static fn($row) => (int)$row['LOCATION_ID'], $rows)));
        if (count($ids) === 0) {
            continue; // try next service code
        }
        if (count($ids) > 1) {
            $resolved = ['error' => 'LOCATION_MAPPING_AMBIGUOUS'];
            break;
        }
        $locationRows = LocationTable::getList([
            'select' => ['ID', 'CODE', 'LOCATION_NAME' => 'NAME.NAME'],
            'filter' => ['=ID' => $ids[0], '=NAME.LANGUAGE_ID' => 'ru'],
            'limit' => 2,
        ])->fetchAll();
        if (count($locationRows) !== 1 || !is_string($locationRows[0]['CODE'] ?? null) || $locationRows[0]['CODE'] === '') {
            $resolved = ['error' => 'LOCATION_MAPPING_INVALID'];
            break;
        }
        $zipRows = ExternalTable::getList([
            'select' => ['XML_ID'],
            'filter' => ['=LOCATION_ID' => $ids[0], '=SERVICE.CODE' => 'ZIP'],
            'limit' => 100,
        ])->fetchAll();
        $zips = array_values(array_unique(array_filter(
            array_column($zipRows, 'XML_ID'),
            static fn($zip) => is_string($zip) && preg_match('/^[0-9]{6}$/D', $zip)
        )));
        $resolved = [
            'locationCode' => $locationRows[0]['CODE'],
            'name' => $locationRows[0]['LOCATION_NAME'],
            'zip' => count($zips) === 1 ? $zips[0] : '',
            'service' => $service,
        ];
        break;
    }

    $out[$fiasId] = $resolved ?? ['error' => 'LOCATION_MAPPING_REQUIRED'];
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
