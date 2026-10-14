<?php
// Copy outside all served directories, mode 0600. No archive credentials.
require_once __DIR__ . '/src/LocationDriver.php';
// regionBySettlement.json/.manifest.json come from region-mapping/build_region_by_settlement.py
// (see region-mapping/README.md) — never hand-write this mapping, and never load it without
// its manifest: loadRegionBySettlement() refuses a config/manifest pair that drifted apart.
$regionMappingDir = '/absolute/private/prom23-runtime/region-mapping';
return [
    'siteRoot' => '/absolute/path/to/isolated/shop-bitrix',
    'stateDirectory' => '/absolute/private/prom23-runtime',
    'keyFile' => '/absolute/private/prom23-runtime/hmac-key',
    'endpointPath' => '/local/prom23-runtime/endpoint.php',
    'enabledOperations' => [],
    'enabledForms' => [],
    // Explicit operator confirmation after replacing/reviewing every original embedded provider credential.
    'sourceSecretsReplaced' => false,
    'sourceOrigin' => '',
    'sourceAllowedOrigins' => [],
    // Owner-approved public documents, edition 01.10.2026. Deploy together with matching UI/contracts.
    // Versioned document hashes are loaded by endpoint.php from its own deployment directory.
    'ffprobePath' => null,
    'location' => [
        // Verify actual installed Sale location external service name. Do not copy blindly.
        // Checked live on prom-stage 2026-10-14: Sale\Location\ExternalTable has ZERO rows for
        // SERVICE.CODE IN ('FIAS','GAR') on that instance (only YAMARKET/ZIP/ZIP_LOWER/
        // BX_ISO_3166_NUMERIC/ADD_DLV exist) — LocationDriver::resolve() will throw
        // LOCATION_MAPPING_REQUIRED for every settlement there until that instance gets a
        // fuller FIAS/GAR import. See region-mapping/README.md "Executed live" section.
        // Re-verify on whichever instance actually goes live before trusting this value.
        'externalServiceCode' => 'FIAS',
        // This deployment's own Bitrix site domain code (defines.php DEFAULT_DOMAIN='space' means
        // "no separate country domain" — the main .ru site). Regions.php:465-481 forces personal
        // buyers off this list onto defaultSettlementId; see LocationDriver::effectiveSettlement().
        'siteDomain' => 'space',
        'cisDomains' => ['kg', 'am', 'az', 'kz', 'by'],
        // Real GAR UUID for DEFAULT_CITY (Krasnodar, defines.php:88) — must have a matching
        // entry in regionBySettlement below. Resolved 2026-10-14 from the live
        // region-mapping export: GAR settlement "край Краснодарский, г. Краснодар"
        // (region-mapping/matched.json bitrixCityId=67743) — not the unrelated
        // same-named "х. Краснодар" hamlet in Воронежская область
        // (bitrixCityId=81638, fiasId 6b960d8b-...), which is a real but
        // different GAR settlement that also happens to fall into Krasnodar's
        // catch-all price zone. Verify this UUID still matches regionId=2868
        // in regionBySettlement.json after any pipeline re-run.
        'defaultSettlementId' => '7dfa745e-aa19-4688-b121-b655c11e482f',
    ],
    // Explicit fresh runtime configuration after schema verification; never fabricated GAR mappings.
    'commerce' => [
        'regionBySettlement' => \Prom23\Runtime\LocationDriver::loadRegionBySettlement(
            $regionMappingDir . '/regionBySettlement.json',
            $regionMappingDir . '/regionBySettlement.manifest.json'
        ),
    ],
    // After verifying source-patches/returns-intake-2026.patch on the isolated shop.
    'returns' => ['legacyTemplatesEscaped' => false],
];

// Legal42: configure legalContextResolver (actual seller + immutable offer/signed contract),
// saleModeResolver (authoritative BUYABLE/REQUEST_ONLY/CUSTOM_PRODUCTION), and
// publicationWriter (chosen author/anonymous, separate distribution consent, moderation)
// before enabling the corresponding production write capability. Do not infer identity from region.
