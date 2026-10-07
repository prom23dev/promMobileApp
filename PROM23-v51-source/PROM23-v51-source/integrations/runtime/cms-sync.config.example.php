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
                // The template's own FIELD_CODE for this block is PREVIEW_TEXT/
                // DATE_ACTIVE_FROM/PROPERTY_IMG only, with no NAME — but that
                // only proves the *template* doesn't render NAME, not that the
                // elements have none. Not verified against live data (no DB
                // access this session). If real elements do have a NAME that
                // shouldn't appear (e.g. an internal-only review title), add
                // 'nameOnly' => true's inverse is not available yet — check the
                // live content once reachable and add a 'previewOnly' option to
                // blockSection() if needed, rather than guessing here.
                ['id' => 'cases-and-reviews', 'title' => 'Отзывы', 'iblockConstant' => 'IBLOCK_ID_CASES_AND_REVIEWS', 'listProperty' => 'UF_CASES_AND_REVIEWS', 'asBullets' => true],
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
        // Owner decision pending: real content is IBLOCK_ID_FAQ (Q&A list), not the
        // /delivery/ warranty tab the curated snapshot currently points "faq" at.
        // Do not enable until the owner confirms which is the actual /faq/ replacement.
        // 'faq' => ['type' => 'faq-list', 'sourceUrl' => 'https://prom.myfast.space/faq/'],

        // 'recommendations' is NOT MIGRATABLE from an iblock element at all
        // — a hardcoded HTML/PHP template with no CMS element behind it
        // (same situation as 'cookies' above, just not yet wired through
        // 'static-template'). See runtime-cms.md.
        // 'recommendations' => ['type' => 'static-template', 'file' => 'recom-tech-info/index.php', ...],

        // 'privacy' is NOT a static-template case (correction 2026-10-06):
        // the real cms-sync.config.php (private, run against prom-stage
        // 2026-09-29) found a matching IBLOCK_ID_PAGES=9 element at
        // CODE='/privacy/' with textProperty='UF_CONTENT', whose text
        // matched the hardcoded privacy-policy/index.php template
        // byte-for-byte on its revision-date line. Left commented here
        // because *why* a duplicate element exists alongside the hardcoded
        // template is unexplained (see runtime-cms.md/runtime-consent.md) —
        // confirm with the owner before wiring it live, same bar as any
        // other owner-pending slug.
        // 'privacy' => ['type' => 'page-element', 'code' => '/privacy/', 'textProperty' => 'UF_CONTENT', 'sourceUrl' => 'https://prom.myfast.space/privacy-policy/', 'links' => []],

        // NOT FOUND anywhere in prom23marketplace — no /promotions/ route, no
        // matching iblock or index.php. Needs owner clarification before any
        // adapter work; likely mobile-only content today.
        // 'promotions' => intentionally absent.
    ],
];
