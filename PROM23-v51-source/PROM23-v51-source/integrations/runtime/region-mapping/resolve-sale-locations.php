<?php
declare(strict_types=1);
/**
 * ONE-OFF EXPORT SCRIPT — RUN ONLY ON AN ISOLATED/STAGING BITRIX INSTANCE.
 *
 * `commerce.regionBySettlement[GAR UUID][kind]` (see CommerceDriver.php and
 * config.example.php) needs a Bitrix Sale `LocationTable.CODE` per matched
 * settlement, in addition to the region element ID that
 * export-bitrix-regions.php produces.
 *
 * ORIGINAL DESIGN (superseded, kept here as a note): resolve via
 * Sale\Location\ExternalTable's FIAS/GAR external-identity rows, the same
 * way LocationDriver::resolve() does at request time. Checked live on
 * prom.myfast.space 2026-10-09: `ExternalTable` has ZERO rows for
 * SERVICE.CODE IN ('FIAS','GAR') on this instance — only YAMARKET, ZIP,
 * ZIP_LOWER, BX_ISO_3166_NUMERIC, ADD_DLV exist. This instance's Sale
 * location dictionary was evidently imported without the FIAS/GAR external
 *-identity rows, so that lookup path is unusable here (and
 * LocationDriver::resolve() itself would fail the same way against this
 * instance at request time — flagged separately for the owner).
 *
 * ACTUAL METHOD USED: resolve by city NAME instead, exactly the mechanism
 * the live site's own checkout already uses for free-address city
 * resolution (local/ajax/order/resolve-location.php:58-66 and
 * local/templates/main/components/bitrix/sale.order.ajax/main/
 * result_modifier.php's CITY_CODE logic): `LocationTable` filtered by
 * `NAME.NAME` + `TYPE.CODE='CITY'`. Each matched.json row already carries
 * the Bitrix HL city's own `cityName` (from export-bitrix-regions.php), so
 * no FIAS/GAR identity is needed for this step at all — the name came from
 * Bitrix's own HLBL_ID_CITIES to begin with.
 *
 * Usage:
 *   php resolve-sale-locations.php matched.json > sale-locations.json
 *
 * Input: matched.json — JSON array of objects with "cityName" and "fiasId".
 * Output: JSON object keyed by fiasId ->
 *   {"locationCode": "...", "name": "...", "method": "name-match"} on
 *   success, or {"error": "LOCATION_MAPPING_REQUIRED"|"LOCATION_MAPPING_AMBIGUOUS"}
 *   for settlements with no usable Bitrix Sale location — those go in the
 *   skipped pile, not into regionBySettlement.json.
 */

ini_set('memory_limit', '2G');
$_SERVER['DOCUMENT_ROOT'] = '/var/www/prom_myfast__usr/data/www/prom.myfast.space';
chdir($_SERVER['DOCUMENT_ROOT']);
require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php';

use Bitrix\Main\Loader;
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

$out = [];
$nameCache = [];

foreach ($matched as $entry) {
    $fiasId = strtolower((string)($entry['fiasId'] ?? $entry['id'] ?? ''));
    if (!preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/D', $fiasId)) {
        continue;
    }
    if (isset($out[$fiasId])) {
        continue; // matched.json may list the same settlement under both personal/organization rows.
    }

    $cityName = trim((string)($entry['cityName'] ?? ''));
    if ($cityName === '') {
        $out[$fiasId] = ['error' => 'LOCATION_MAPPING_REQUIRED'];
        continue;
    }

    if (!isset($nameCache[$cityName])) {
        $rows = LocationTable::getList([
            'select' => ['ID', 'CODE'],
            'filter' => [
                '=NAME.NAME' => $cityName,
                '=NAME.LANGUAGE_ID' => 'ru',
                '=TYPE.CODE' => 'CITY',
            ],
            'limit' => 2,
        ])->fetchAll();
        if (count($rows) === 0) {
            $nameCache[$cityName] = ['error' => 'LOCATION_MAPPING_REQUIRED'];
        } elseif (count($rows) > 1) {
            $nameCache[$cityName] = ['error' => 'LOCATION_MAPPING_AMBIGUOUS'];
        } elseif (!is_string($rows[0]['CODE']) || $rows[0]['CODE'] === '') {
            $nameCache[$cityName] = ['error' => 'LOCATION_MAPPING_INVALID'];
        } else {
            $nameCache[$cityName] = ['locationCode' => $rows[0]['CODE'], 'name' => $cityName, 'method' => 'name-match'];
        }
    }

    $out[$fiasId] = $nameCache[$cityName];
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
