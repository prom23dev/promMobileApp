<?php
declare(strict_types=1);
/**
 * ONE-OFF EXPORT SCRIPT — RUN ONLY ON AN ISOLATED/STAGING BITRIX INSTANCE.
 *
 * Never run this against the production prom23.ru database from an untrusted
 * context. It is read-only (no ::add/::update calls), but it must run inside
 * a real Bitrix bootstrap (prolog_before.php) because it uses the D7 ORM and
 * highloadblock/iblock modules exactly like the real site code does.
 *
 * Usage (from the Bitrix site root, e.g. via `php` CLI SAPI or as an admin
 * page under /bitrix/admin/):
 *   php export-bitrix-regions.php > regions-export.json
 *
 * What it does
 * ------------
 * Bitrix has no single "city" catalog. Pricing/delivery/payment/warehouse
 * config lives on elements of iblock IBLOCK_ID_REGIONS=22 (one element per
 * *geographic region*, not per city — see Regions.php:getRegionData()).
 * Many highloadblock cities (HLBL_ID_CITIES=8) can share one iblock element,
 * joined indirectly through HLBL_ID_REGIONS=7's UF_XML_ID text key, which is
 * stored as the iblock element's own "REGION" property value. This mirrors
 * exactly the join Prom\Regions::getCitiesList() performs
 * (local/php_interface/lib/Regions.php:175-318) — this script reuses that
 * join, but iterates every active city instead of filtering by a search
 * string, and reads the full config property set instead of only
 * REGION/IS_DOMAIN.
 *
 * Output shape (one row per HL city that resolves to an active region
 * element) — see also CONFIG_REQUEST_CHECKLIST_FILLED.md and
 * docs/parity/runtime-commerce.md for how this feeds `commerce.regionBySettlement`:
 *
 * [{
 *   "cityName": "Краснодар",
 *   "regionName": "Краснодарский край",
 *   "bitrixCityId": 123,           // HLBL_ID_CITIES row ID (informational only)
 *   "bitrixRegionId": 2868,        // IBLOCK_ID_REGIONS element ID — this is
 *                                  // what LocationDriver/CommerceDriver call
 *                                  // "regionId" in regionBySettlement
 *   "coords": "45.049694710362,38.965225830078",
 *   "code": "krd",                 // iblock element CODE
 *   "priceCode": ["KRD"],          // PRICE_CODE property, may be multi-value
 *   "deliveryTk": [7, 12],         // DELIVERY_SERVICE_TK  (source: delivery_courier)
 *   "deliveryPickup": 3,           // DELIVERY_SERVICE_PICKUP (source: delivery_pickup / Sale service id)
 *   "deliveryPickupTk": [9],       // DELIVERY_SERVICE_PICKUP_TK (source: delivery_pickup_tk)
 *   "paymentSystem": [2, 16, 17],  // PAYMENT_SYSTEM property
 *   "storeId": 1                   // STORE property (Bitrix Catalog Store)
 * }, ...]
 *
 * Only ACTIVE=Y elements/cities are exported. Nothing here decides which
 * city is "the" default (Krasnodar, id=2868, defines.php:88) — that stays a
 * runtime rule in LocationDriver.php, not exported data.
 */

require_once $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php';

use Bitrix\Highloadblock as HL;
use Bitrix\Main\Entity;
use Bitrix\Main\Loader;

if (!Loader::includeModule('highloadblock') || !Loader::includeModule('iblock')) {
    fwrite(STDERR, "Required Bitrix modules unavailable (highloadblock/iblock).\n");
    exit(1);
}

if (!defined('IBLOCK_ID_REGIONS') || !defined('HLBL_ID_CITIES') || !defined('HLBL_ID_REGIONS')) {
    fwrite(STDERR, "IBLOCK_ID_REGIONS / HLBL_ID_CITIES / HLBL_ID_REGIONS not defined — wrong site bootstrap?\n");
    exit(1);
}

// ---- 1. Load all active HL cities joined to their HL region (same join as
//         Prom\Regions::getCitiesList(), minus the UF_NAME LIKE filter). ----

$hlblockCities = HL\HighloadBlockTable::getById(HLBL_ID_CITIES)->fetch();
$entityCities = HL\HighloadBlockTable::compileEntity($hlblockCities);
$cityDataClass = $entityCities->getDataClass();

$hlblockRegions = HL\HighloadBlockTable::getById(HLBL_ID_REGIONS)->fetch();
$entityRegions = HL\HighloadBlockTable::compileEntity($hlblockRegions);
$regionDataClass = $entityRegions->getDataClass();

$cityRows = $cityDataClass::getList([
    'select' => [
        'ID',
        'UF_NAME',
        'UF_REGION',
        'UF_COORDS',
        'UF_SORT',
        'UF_COUNTRY',
        'REGION_XML_ID' => 'REGION_DATA.UF_XML_ID',
        'REGION_NAME' => 'REGION_DATA.UF_NAME',
    ],
    'order' => ['UF_NAME' => 'ASC'],
    'runtime' => [
        new Entity\ReferenceField(
            'REGION_DATA',
            $regionDataClass,
            ['=this.UF_REGION' => 'ref.ID']
        ),
    ],
])->fetchAll();

if (!$cityRows) {
    fwrite(STDERR, "No rows in HLBL_ID_CITIES=" . HLBL_ID_CITIES . " — check highloadblock ID.\n");
    exit(1);
}

// ---- 2. Load all active IBLOCK_ID_REGIONS elements with the properties
//         CommerceDriver/LocationDriver need, keyed by their REGION property
//         (the region XML_ID text key), same as Regions::getCitiesList(). ----

$regionTable = \Bitrix\Iblock\Iblock::wakeUp(IBLOCK_ID_REGIONS)->getEntityDataClass();

$regionElements = $regionTable::getList([
    'order' => ['SORT' => 'ASC'],
    'filter' => ['=ACTIVE' => 'Y'],
    'select' => [
        'ID',
        'NAME',
        'CODE',
        'REGION_' => 'REGION',
        'PRICE_CODE_' => 'PRICE_CODE',
        'DELIVERY_SERVICE_TK_' => 'DELIVERY_SERVICE_TK',
        'DELIVERY_SERVICE_PICKUP_' => 'DELIVERY_SERVICE_PICKUP',
        'DELIVERY_SERVICE_PICKUP_TK_' => 'DELIVERY_SERVICE_PICKUP_TK',
        'PAYMENT_SYSTEM_' => 'PAYMENT_SYSTEM',
        'STORE_' => 'STORE',
    ],
])->fetchAll();

if (!$regionElements) {
    fwrite(STDERR, "No active elements in IBLOCK_ID_REGIONS=" . IBLOCK_ID_REGIONS . ".\n");
    exit(1);
}

// A region element's multi-value properties (PRICE_CODE, DELIVERY_SERVICE_TK, ...)
// come back as one row per element per D7 join fan-out. Group them by REGION
// XML_ID key exactly like Regions::getCitiesList() does with $arRegions, but
// accumulate multi-value properties instead of overwriting.
$byRegionXmlId = [];
foreach ($regionElements as $row) {
    $xmlId = $row['REGION_VALUE'] ?? null;
    if ($xmlId === null || $xmlId === '') {
        continue;
    }
    if (!isset($byRegionXmlId[$xmlId])) {
        $byRegionXmlId[$xmlId] = [
            'ID' => (int)$row['ID'],
            'NAME' => $row['NAME'],
            'CODE' => $row['CODE'],
            'PRICE_CODE' => [],
            'DELIVERY_SERVICE_TK' => [],
            'DELIVERY_SERVICE_PICKUP' => null,
            'DELIVERY_SERVICE_PICKUP_TK' => [],
            'PAYMENT_SYSTEM' => [],
            'STORE' => null,
        ];
    }
    $bucket =& $byRegionXmlId[$xmlId];
    if ($row['PRICE_CODE_VALUE'] !== null && $row['PRICE_CODE_VALUE'] !== '' && !in_array($row['PRICE_CODE_VALUE'], $bucket['PRICE_CODE'], true)) {
        $bucket['PRICE_CODE'][] = $row['PRICE_CODE_VALUE'];
    }
    if ($row['DELIVERY_SERVICE_TK_VALUE'] !== null && $row['DELIVERY_SERVICE_TK_VALUE'] !== '' && !in_array($row['DELIVERY_SERVICE_TK_VALUE'], $bucket['DELIVERY_SERVICE_TK'], true)) {
        $bucket['DELIVERY_SERVICE_TK'][] = $row['DELIVERY_SERVICE_TK_VALUE'];
    }
    if ($bucket['DELIVERY_SERVICE_PICKUP'] === null && $row['DELIVERY_SERVICE_PICKUP_VALUE'] !== null && $row['DELIVERY_SERVICE_PICKUP_VALUE'] !== '') {
        $bucket['DELIVERY_SERVICE_PICKUP'] = $row['DELIVERY_SERVICE_PICKUP_VALUE'];
    }
    if ($row['DELIVERY_SERVICE_PICKUP_TK_VALUE'] !== null && $row['DELIVERY_SERVICE_PICKUP_TK_VALUE'] !== '' && !in_array($row['DELIVERY_SERVICE_PICKUP_TK_VALUE'], $bucket['DELIVERY_SERVICE_PICKUP_TK'], true)) {
        $bucket['DELIVERY_SERVICE_PICKUP_TK'][] = $row['DELIVERY_SERVICE_PICKUP_TK_VALUE'];
    }
    if ($row['PAYMENT_SYSTEM_VALUE'] !== null && $row['PAYMENT_SYSTEM_VALUE'] !== '' && !in_array($row['PAYMENT_SYSTEM_VALUE'], $bucket['PAYMENT_SYSTEM'], true)) {
        $bucket['PAYMENT_SYSTEM'][] = $row['PAYMENT_SYSTEM_VALUE'];
    }
    if ($bucket['STORE'] === null && $row['STORE_VALUE'] !== null && $row['STORE_VALUE'] !== '') {
        $bucket['STORE'] = $row['STORE_VALUE'];
    }
    unset($bucket);
}

// ---- 3. Emit one row per active city that resolves to a region element. ----

$out = [];
$skippedNoRegionMatch = [];

foreach ($cityRows as $city) {
    $xmlId = $city['REGION_XML_ID'] ?? null;
    if ($xmlId === null || $xmlId === '' || !isset($byRegionXmlId[$xmlId])) {
        $skippedNoRegionMatch[] = $city['UF_NAME'];
        continue;
    }
    $region = $byRegionXmlId[$xmlId];
    $out[] = [
        'cityName' => $city['UF_NAME'],
        'regionName' => $city['REGION_NAME'] ?? '',
        'bitrixCityId' => (int)$city['ID'],
        'bitrixRegionId' => $region['ID'],
        'coords' => $city['UF_COORDS'] ?? '',
        'code' => $region['CODE'],
        'priceCode' => $region['PRICE_CODE'],
        'deliveryTk' => array_map('intval', $region['DELIVERY_SERVICE_TK']),
        'deliveryPickup' => $region['DELIVERY_SERVICE_PICKUP'] !== null ? (int)$region['DELIVERY_SERVICE_PICKUP'] : null,
        'deliveryPickupTk' => array_map('intval', $region['DELIVERY_SERVICE_PICKUP_TK']),
        'paymentSystem' => array_map('intval', $region['PAYMENT_SYSTEM']),
        'storeId' => $region['STORE'] !== null ? (int)$region['STORE'] : null,
    ];
}

echo json_encode([
    'exportedAt' => gmdate('c'),
    'sourceHost' => $_SERVER['SERVER_NAME'] ?? '',
    'iblockIdRegions' => IBLOCK_ID_REGIONS,
    'hlblIdCities' => HLBL_ID_CITIES,
    'hlblIdRegions' => HLBL_ID_REGIONS,
    'cityCount' => count($out),
    'skippedCitiesWithoutRegionMatch' => $skippedNoRegionMatch,
    'rows' => $out,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";

if ($skippedNoRegionMatch) {
    fwrite(STDERR, count($skippedNoRegionMatch) . " cities had no matching active region element — see skippedCitiesWithoutRegionMatch in output.\n");
}
