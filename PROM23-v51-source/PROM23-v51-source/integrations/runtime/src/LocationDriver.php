<?php
declare(strict_types=1);
namespace Prom23\Runtime;

use Bitrix\Main\Loader;
use Bitrix\Sale\Location\ExternalTable;
use Bitrix\Sale\Location\LocationTable;

/** Resolve an exact GAR/FIAS identity. A display name is never a lookup key. */
final class LocationDriver
{
    public function __construct(private array $config = []) {}

    public function resolve(string $settlementId): array
    {
        $id = strtolower($settlementId);
        if (!preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/D', $id)) throw new RuntimeExceptionCode('SETTLEMENT_REQUIRED', 422);
        if (!class_exists(Loader::class) || !Loader::includeModule('sale')) throw new RuntimeExceptionCode('BITRIX_MODULE_UNAVAILABLE');
        // FIAS is the source external service. GAR installations may explicitly configure GAR.
        $service = $this->config['location']['externalServiceCode'] ?? 'FIAS';
        if (!in_array($service, ['FIAS', 'GAR'], true)) throw new RuntimeExceptionCode('LOCATION_SCHEMA_UNAVAILABLE');
        $rows = ExternalTable::getList(['select'=>['LOCATION_ID'], 'filter'=>['=XML_ID'=>$id, '=SERVICE.CODE'=>$service], 'limit'=>3])->fetchAll();
        $ids = array_values(array_unique(array_map(static fn($row) => (int)$row['LOCATION_ID'], $rows)));
        if (count($ids) !== 1 || $ids[0] < 1) throw new RuntimeExceptionCode(count($ids) > 1 ? 'LOCATION_MAPPING_AMBIGUOUS' : 'LOCATION_MAPPING_REQUIRED', 409);
        $row = LocationTable::getList(['select'=>['ID','CODE','LOCATION_NAME'=>'NAME.NAME'], 'filter'=>['=ID'=>$ids[0], '=NAME.LANGUAGE_ID'=>'ru'], 'limit'=>2])->fetchAll();
        if (count($row) !== 1 || !is_string($row[0]['CODE'] ?? null) || $row[0]['CODE'] === '' || !is_string($row[0]['LOCATION_NAME'] ?? null) || trim($row[0]['LOCATION_NAME']) === '') throw new RuntimeExceptionCode('LOCATION_MAPPING_INVALID', 409);
        $zips = ExternalTable::getList(['select'=>['XML_ID'], 'filter'=>['=LOCATION_ID'=>$ids[0], '=SERVICE.CODE'=>'ZIP'], 'limit'=>100])->fetchAll();
        $zips = array_values(array_unique(array_filter(array_column($zips, 'XML_ID'), static fn($zip) => is_string($zip) && preg_match('/^[0-9]{6}$/D', $zip))));
        // A city may have multiple postcodes. Do not silently choose a random street postcode.
        return ['settlementId'=>$id, 'locationCode'=>$row[0]['CODE'], 'name'=>$row[0]['LOCATION_NAME'], 'zip'=>count($zips) === 1 ? $zips[0] : ''];
    }

    /**
     * Source Regions.php:445-481. On any request host other than the site's
     * own declared CIS-country domain (checked there against
     * TEST_SERVER_NAME/DEFAULT_SERVER_NAME, defines.php:86-87), a *physical*
     * buyer's region/pricing always comes from DEFAULT_CITY (Krasnodar,
     * id=2868, defines.php:88) — regardless of which settlement they picked:
     *   $rule = $userType === 'physical' && !in_array($cityData['domain'], $domains);
     *   $city = $rule ? DEFAULT_CITY : $cityData;
     * `$domains` only ever lists kg/am/az/kz/by, and only on the site's own
     * test/CIS host — on every other host (the mobile app's single deployed
     * domain) it is empty, so the condition reduces to "always, for
     * personal buyers". The mobile app talks to exactly one Bitrix
     * site/domain (see CommerceDriver config 'siteId'), so which case
     * applies is a fixed deployment fact, not something to detect from
     * $_SERVER on every request — hence 'location.siteDomain'/'cisDomains'
     * come from config, not the request.
     *
     * The companion rule — legal buyers whose resolved region is
     * DEFAULT_CITY get PRICE_CODE forced to ['KRD','KRD_SALE']
     * (Regions.php:583-587) — already lives in CommerceDriver::region()
     * (src/CommerceDriver.php:100), because it depends on the region's
     * PRICE_CODE property, which this driver never reads. It is not
     * duplicated here.
     */
    public function effectiveSettlement(string $requestedSettlementId, string $actorKind): string
    {
        $id = strtolower($requestedSettlementId);
        $domain = $this->config['location']['siteDomain'] ?? null;
        if (!is_string($domain) || $domain === '') throw new RuntimeExceptionCode('LOCATION_DOMAIN_UNAVAILABLE');
        $cisDomains = $this->config['location']['cisDomains'] ?? ['kg', 'am', 'az', 'kz', 'by'];
        $isPhysical = $actorKind !== 'organization';
        if ($isPhysical && !in_array($domain, $cisDomains, true)) {
            $default = $this->config['location']['defaultSettlementId'] ?? null;
            if (!is_string($default) || $default === '') throw new RuntimeExceptionCode('DEFAULT_SETTLEMENT_MAPPING_REQUIRED');
            return strtolower($default);
        }
        return $id;
    }

    /**
     * Load `commerce.regionBySettlement` from the exported JSON produced by
     * region-mapping/build_region_by_settlement.py, refusing to use it if it
     * does not match its own manifest — same defence-in-depth idea as
     * server/location/provider.mjs's refresh() (provider.mjs:64-96): a
     * config file and a manifest that silently drifted apart from each
     * other is worse than an explicit startup failure.
     */
    public static function loadRegionBySettlement(string $jsonPath, string $manifestPath): array
    {
        if (!is_file($jsonPath) || !is_file($manifestPath)) throw new RuntimeExceptionCode('REGION_MAPPING_CONFIG_UNAVAILABLE');
        $regionBySettlement = json_decode((string)file_get_contents($jsonPath), true);
        $manifest = json_decode((string)file_get_contents($manifestPath), true);
        if (!is_array($regionBySettlement) || !is_array($manifest)) throw new RuntimeExceptionCode('REGION_MAPPING_CONFIG_UNAVAILABLE');
        if (($manifest['schemaVersion'] ?? null) !== 1
            || ($manifest['provider'] ?? null) !== 'bitrix-iblock22-region-mapping'
            || !preg_match('/^[0-9]{8}$/D', (string)($manifest['providerVersion'] ?? ''))
            || !preg_match('/^[0-9]{8}$/D', (string)($manifest['sourceGarProviderVersion'] ?? ''))
            || !is_int($manifest['settlementCount'] ?? null) || $manifest['settlementCount'] < 0
            || !is_int($manifest['regionCount'] ?? null) || $manifest['regionCount'] < 0
            || !is_int($manifest['unmatchedCount'] ?? null) || $manifest['unmatchedCount'] < 0
        ) throw new RuntimeExceptionCode('REGION_MAPPING_MANIFEST_INVALID');
        $settlementIds = array_keys($regionBySettlement);
        if (count($settlementIds) !== $manifest['settlementCount']) throw new RuntimeExceptionCode('REGION_MAPPING_MANIFEST_INVALID');
        $regionIds = [];
        foreach ($regionBySettlement as $settlementId => $entry) {
            if (!preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/D', $settlementId)
                || !is_array($entry) || !isset($entry['personal'], $entry['organization'])
            ) throw new RuntimeExceptionCode('REGION_MAPPING_MANIFEST_INVALID');
            foreach (['personal', 'organization'] as $kind) {
                $row = $entry[$kind];
                if (!is_array($row) || !is_int($row['regionId'] ?? null) || $row['regionId'] < 1
                    || !is_string($row['locationCode'] ?? null) || $row['locationCode'] === ''
                ) throw new RuntimeExceptionCode('REGION_MAPPING_MANIFEST_INVALID');
                $regionIds[$row['regionId']] = true;
            }
        }
        if (count($regionIds) !== $manifest['regionCount']) throw new RuntimeExceptionCode('REGION_MAPPING_MANIFEST_INVALID');
        return $regionBySettlement;
    }
}
