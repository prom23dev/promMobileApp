<?php
// Copy outside all served directories, mode 0600. Input to cms-sync.php.
// Only list slugs that have been individually audited against their own
// site-source/*/index.php (see docs/parity/runtime-cms.md's mapping table
// and "still open" column) — enabling an unaudited slug risks silently
// mis-mapping content, not a crash, so it will not fail loudly on its own.

// about/brands/suppliers/franchise all render the same IBLOCK_ID_BANNER
// hero block (bitrix:news.list "banner_page", FIELD_CODE PROPERTY_TITLE/
// PROPERTY_DESCRIPTION — those FIELD_CODE names are the news.list component's
// own naming convention, the actual IBLOCK property CODEs underneath are
// just TITLE/DESCRIPTION).
$pageBanner = ['listProperty' => 'UF_BANNER_PAGE', 'iblockConstant' => 'IBLOCK_ID_BANNER', 'titleProperty' => 'TITLE', 'descriptionProperty' => 'DESCRIPTION'];

// suppliers and cooperation are the exact same source element
// (CODE=/suppliers/) — the curated snapshot already treats them as one
// page, so cms-sync.php writing both 'suppliers' and 'cooperation' slugs
// from this one spec is intentional, not a duplicate-fetch bug.
$suppliersPage = [
    'type' => 'page-element', 'code' => '/suppliers/', 'sourceUrl' => 'https://prom.myfast.space/suppliers/',
    'banner' => $pageBanner,
    'blocks' => [
        // Heading is itself a page-element UF_ text property here (no literal
        // <h2> in the template), unlike 'about's hardcoded block titles.
        ['id' => 'achievements', 'titleProperty' => 'UF_BLOCK_ACHIEVEMENTS_TITLE', 'iblockConstant' => 'IBLOCK_ID_ACHIEVEMENTS', 'listProperty' => 'UF_BLOCK_ACHIEVEMENTS_LIST', 'asBullets' => true],
        ['id' => 'coop-stages', 'title' => 'Этапы сотрудничества', 'iblockConstant' => 'IBLOCK_ID_ACHIEVEMENTS', 'listProperty' => 'UF_COOP_STAGES', 'asBullets' => true],
        // UF_FAQ holds a page-specific *subset* of IBLOCK_ID_FAQ element IDs
        // (news.list filtered by 'ID'=>UF_FAQ, not the full FAQ list) — distinct
        // from the site-wide /faq/ page (see fromFaqList()/the 'faq' slug below).
        ['id' => 'faq', 'title' => 'Часто задаваемые вопросы', 'iblockConstant' => 'IBLOCK_ID_FAQ', 'listProperty' => 'UF_FAQ', 'asBullets' => true],
    ],
    // "Как стать поставщиком" / "Требования к поставщикам" (how_to_title/
    // description/items.php, require_title/items.php) are hardcoded files
    // under local/include/page_suppliers/*.php, not CMS content — same
    // category as privacy/cookies/recommendations, just at block granularity
    // instead of whole-page. The become-a-supplier form is a lead-gen form,
    // not content. Both intentionally omitted.
];

return [
    'siteRoot' => '/absolute/path/to/isolated/shop-bitrix',
    'pages' => [
        // Confirmed: base IBLOCK_ID_PAGES element, UF_USER_AGREEMENT_TEXT.
        'personal-data' => ['type' => 'page-element', 'code' => '/user-agreement/', 'textProperty' => 'UF_USER_AGREEMENT_TEXT', 'sourceUrl' => 'https://prom.myfast.space/user-agreement/'],
        // Confirmed: about's own banner + linked-iblock blocks.
        'about' => [
            'type' => 'page-element', 'code' => '/about/', 'sourceUrl' => 'https://prom.myfast.space/about/',
            'banner' => $pageBanner,
            'blocks' => [
                ['id' => 'history', 'title' => 'История нашего развития', 'iblockConstant' => 'IBLOCK_ID_HISTORY', 'listProperty' => 'UF_HISTORY', 'asBullets' => true],
                ['id' => 'awards', 'title' => 'Награды и сертификаты качества', 'iblockConstant' => 'IBLOCK_ID_CASES_AND_CERTIFICATES', 'listProperty' => 'UF_BLOCK_ACHIEVEMENTS_LIST', 'asBullets' => true],
            ],
        ],
        // Confirmed 2026-10-06 (brands/index.php): banner + the single
        // editorial "advantages" block. The brand name/logo grid (HLBL_ID_BRANDS)
        // and "popular products" catalog block are visual/catalog widgets, not
        // editorial text — intentionally not represented as a content section.
        'brands' => [
            'type' => 'page-element', 'code' => '/brands/', 'sourceUrl' => 'https://prom.myfast.space/brands/',
            'banner' => $pageBanner,
            'blocks' => [
                ['id' => 'advantages', 'title' => 'Почему выбирают наши бренды', 'iblockConstant' => 'IBLOCK_ID_ADVANTAGES', 'listProperty' => 'UF_ADVANTAGES', 'asBullets' => true],
            ],
        ],
        // Confirmed 2026-10-06 (suppliers/index.php). See $suppliersPage above.
        'suppliers' => $suppliersPage,
        'cooperation' => $suppliersPage,
        // Confirmed 2026-10-06 (franchise/index.php): banner + five editorial
        // blocks. UF_VIEW_MAP (local/include/franchise.php, a map widget) and
        // the "working_provide_*"/"working_require_*" hardcoded include files
        // plus the franchisee-application form are out of scope for the same
        // reason as suppliers' static includes.
        'franchise' => [
            'type' => 'page-element', 'code' => '/franchise/', 'sourceUrl' => 'https://prom.myfast.space/franchise/',
            'banner' => $pageBanner,
            'blocks' => [
                ['id' => 'advantages-row', 'title' => 'Преимущества', 'iblockConstant' => 'IBLOCK_ID_ADVANTAGES', 'listProperty' => 'UF_ADVANTAGES_ROW', 'asBullets' => true],
                ['id' => 'advantages-slider', 'title' => 'Преимущества франшизы', 'iblockConstant' => 'IBLOCK_ID_ADVANTAGES', 'listProperty' => 'UF_ADVANTAGES_SLIDER', 'asBullets' => true],
                ['id' => 'how-to-become', 'title' => 'Как стать франчайзи', 'iblockConstant' => 'IBLOCK_ID_ACHIEVEMENTS', 'listProperty' => 'UF_HOW_TO_BECOME_FRANCHISEES', 'asBullets' => true],
                ['id' => 'projects', 'title' => 'Примеры успешных партнёров', 'iblockConstant' => 'IBLOCK_ID_PROJECTS', 'listProperty' => 'UF_PROJECTS', 'asBullets' => true],
                // Confirmed 2026-10-09: NAME is never requested as a visible
                // FIELD_CODE by any of the 4 templates sharing this iblock
                // (about/business/vendor/franchise, same cases_and_reviews
                // news.list instance) — the shared template's one NAME read
                // is an <img alt="">, i.e. Bitrix's default placeholder, not
                // real content. 'previewOnly' drops it from the rendered line.
                ['id' => 'cases-and-reviews', 'title' => 'Отзывы', 'iblockConstant' => 'IBLOCK_ID_CASES_AND_REVIEWS', 'listProperty' => 'UF_CASES_AND_REVIEWS', 'asBullets' => true, 'previewOnly' => true],
                ['id' => 'faq', 'title' => 'Часто задаваемые вопросы', 'iblockConstant' => 'IBLOCK_ID_FAQ', 'listProperty' => 'UF_FAQ', 'asBullets' => true],
            ],
        ],
        // Confirmed 2026-10-06 (awards/index.php): this page does NOT use
        // \Prom\Page's news.list-block pattern — it reads UF_CASES_AND_CERTIFICATES
        // directly and queries CIBlockElement itself for ID/NAME/PREVIEW_PICTURE/
        // ACTIVE_FROM, rendering "<h3>YYYY</h3> NAME" rows with a popup image.
        // No PREVIEW_TEXT/DETAIL_TEXT is used at all, matching the curated
        // snapshot's "YYYY — NAME" bullet format exactly — 'nameOnly'+'yearField'.
        'awards' => [
            'type' => 'page-element', 'code' => '/awards/', 'sourceUrl' => 'https://prom.myfast.space/awards/',
            'blocks' => [
                ['id' => 'awards', 'title' => 'Награды и сертификаты', 'iblockConstant' => 'IBLOCK_ID_CASES_AND_CERTIFICATES', 'listProperty' => 'UF_CASES_AND_CERTIFICATES', 'asBullets' => true, 'nameOnly' => true, 'yearField' => true],
            ],
        ],
        // Confirmed: all five /delivery/ tabs share one element, matched by UF_CONTENT_TABS_SLUG.
        'returns' => ['type' => 'delivery-tab', 'tabSlug' => 'return', 'sourceUrl' => 'https://prom.myfast.space/return/'],
        'details' => ['type' => 'delivery-tab', 'tabSlug' => 'details', 'sourceUrl' => 'https://prom.myfast.space/details/'],
        'offer' => ['type' => 'delivery-tab', 'tabSlug' => 'oferta', 'sourceUrl' => 'https://prom.myfast.space/oferta/'],
        'checkout' => ['type' => 'delivery-tab', 'tabSlug' => 'checkout', 'sourceUrl' => 'https://prom.myfast.space/checkout/'],
        'warranty' => ['type' => 'delivery-tab', 'tabSlug' => 'warranty', 'sourceUrl' => 'https://prom.myfast.space/warranty/'],
        // Confirmed source, but not wired by default — static legal template,
        // no CMS element. See 'fromStaticTemplate()'/runtime-cms.md.
        'cookies' => ['type' => 'static-template', 'file' => 'cookie-policy/index.php', 'sourceUrl' => 'https://prom.myfast.space/cookie-policy/'],
        // Owner confirmed 2026-10-06: the curated snapshot's "faq" -> /delivery/
        // mapping was a copy-paste bug. Real content is IBLOCK_ID_FAQ (Q&A list)
        // at /faq/, below.
        'faq' => ['type' => 'faq-list', 'sourceUrl' => 'https://prom.myfast.space/faq/'],

        // Confirmed 2026-10-09 (recom-tech-info/index.php:1-162): hardcoded
        // template, no backing iblock element — single <h1> (line15) then
        // clean <h3>/<p>/<ul><li><p> blocks (lines26-154) before footer.php
        // (line160), structurally identical to cookie-policy's shape. Wired
        // the same way.
        'recommendations' => ['type' => 'static-template', 'file' => 'recom-tech-info/index.php', 'sourceUrl' => 'https://prom.myfast.space/recom-tech-info/'],

        // Resolved 2026-10-09 (was the open "duplicate element" question from
        // 2026-10-06): grepped every href="...privacy..." across all
        // templates/includes/forms/components — every single one points at
        // /privacy-policy/; zero link anywhere to /privacy/, and no
        // ./privacy directory exists on disk at all. The IBLOCK_ID_PAGES
        // CODE='/privacy/' element found earlier is orphaned — nothing
        // navigates to it. /privacy-policy/ is the real, canonical,
        // universally-linked route, so this is wired as a static-template
        // (same shape as cookies/recommendations above) instead of via that
        // unlinked iblock element.
        'privacy' => ['type' => 'static-template', 'file' => 'privacy-policy/index.php', 'sourceUrl' => 'https://prom.myfast.space/privacy-policy/'],

        // Built 09.10.2026 on owner go-ahead (2026-10-06): no promotions
        // route/iblock existed anywhere in the real backend (re-confirmed
        // 2026-10-09 — no IBLOCK_ID_* constant matching promo/akcii/special/
        // discount/sale, no matching top-level directory; Bitrix's sale-module
        // coupon/discount calculator is a checkout-time price calculator with
        // no editorial content, not a usable substitute). New dedicated
        // iblock created via local/php_interface/migrations/
        // Version20261009130000.php (CODE=akcii, ID=42, defines.php's
        // IBLOCK_ID_PROMOTIONS=42), shaped like IBLOCK_ID_NEW_PRODUCTS=17/
        // IBLOCK_ID_NEWS=18 (plain NAME/PREVIEW_TEXT/DETAIL_TEXT/ACTIVE_FROM/
        // ACTIVE_TO, no custom UF_ properties). 3 test elements added for
        // verification; real editorial content is the owner's to add going
        // forward via the Bitrix admin. The mobile data-contract's structured
        // fields (productIds/buyerTypes/regions) are NOT implemented — this
        // only feeds the page's title+sections content, not a structured feed.
        'promotions' => ['type' => 'promotions-list', 'title' => 'Акции и предложения', 'sourceUrl' => null],
    ],
];
