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
        'externalServiceCode' => 'FIAS',
        // This deployment's own Bitrix site domain code (defines.php DEFAULT_DOMAIN='space' means
        // "no separate country domain" — the main .ru site). Regions.php:465-481 forces personal
        // buyers off this list onto defaultSettlementId; see LocationDriver::effectiveSettlement().
        'siteDomain' => 'space',
        'cisDomains' => ['kg', 'am', 'az', 'kz', 'by'],
        // Real GAR UUID for DEFAULT_CITY (Krasnodar, defines.php:88) — must have a matching
        // entry in regionBySettlement below.
        'defaultSettlementId' => '',
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
