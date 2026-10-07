<?php
declare(strict_types=1);
/**
 * cms-sync.php config for the prom-stage Bitrix instance
 * (/var/www/prom_myfast__usr/data/www/prom.myfast.space on the prom-stage box).
 *
 * Only slugs verified against real UF_ property names/tab slugs on that
 * instance are listed here (see docs/parity/runtime-cms.md for the audit
 * trail). Add a slug only after confirming its element's real property
 * layout — CmsContentDriver::fromPageElement()'s 'textProperty'/'blocks'
 * assume a specific shape per page and will silently produce an empty page
 * (CMS_TAB_EMPTY) if it doesn't match.
 */
return [
    'siteRoot' => '/var/www/prom_myfast__usr/data/www/prom.myfast.space',
    'pages' => [
        // Single UF_ text property, confirmed 2026-09-29.
        'personal-data' => [
            'type' => 'page-element',
            'code' => '/user-agreement/',
            'textProperty' => 'UF_USER_AGREEMENT_TEXT',
            'sourceUrl' => 'https://prom.myfast.space/user-agreement/',
            'links' => [],
        ],
        // /delivery/ element's UF_CONTENT_TABS_SLUG includes 'checkout' and
        // 'details' tabs, confirmed 2026-09-29 (also has 'delivery','payment',
        // 'return','oferta','advertising-consent',
        // 'personal-data-distribution-consent' — not enabled here yet).
        'checkout' => [
            'type' => 'delivery-tab',
            'tabSlug' => 'checkout',
            'sourceUrl' => 'https://prom.myfast.space/checkout/',
            'links' => [],
        ],
        'details' => [
            'type' => 'delivery-tab',
            'tabSlug' => 'details',
            'sourceUrl' => 'https://prom.myfast.space/details/',
            'links' => [],
        ],
        // Added for the mobile-→stand comparison (2026-09-29): mobile's
        // 'returns'/'offer' slugs map to these two remaining /delivery/ tabs.
        'returns' => [
            'type' => 'delivery-tab',
            'tabSlug' => 'return',
            'sourceUrl' => 'https://prom.myfast.space/return/',
            'links' => [],
        ],
        'offer' => [
            'type' => 'delivery-tab',
            'tabSlug' => 'oferta',
            'sourceUrl' => 'https://prom.myfast.space/oferta/',
            'links' => [],
        ],
        // CODE is '/privacy/' but the live public URL is '/privacy-policy/'
        // (Bitrix 301-redirects /privacy/ -> /privacy-policy/) - single flat
        // UF_CONTENT text property, same shape as personal-data.
        'privacy' => [
            'type' => 'page-element',
            'code' => '/privacy/',
            'textProperty' => 'UF_CONTENT',
            'sourceUrl' => 'https://prom.myfast.space/privacy-policy/',
            'links' => [],
        ],
        // Audited 2026-09-29 (see task "Этап 1b"). Each of these 5 pages is
        // composed of a banner (UF_BANNER_PAGE -> IBLOCK_ID_BANNER element's
        // TITLE/DESCRIPTION) plus several UF_*_LIST properties pointing at
        // other iblocks. Two real data-quality findings from that audit:
        //  - IBLOCK_ID_ADVANTAGES (15) cards reuse identical boilerplate
        //    PREVIEW_TEXT across siblings on some pages (e.g. about's 4
        //    "advantages" all share one sentence) or have none at all
        //    (brands) - 'nameOnly' skips PREVIEW_TEXT for these so bullets
        //    aren't duplicated/misleading text.
        //  - IBLOCK_ID_ACHIEVEMENTS (14) is reused for two different card
        //    shapes: stat cards (NAME + image, no PREVIEW_TEXT - about's
        //    UF_BLOCK_ACHIEVEMENTS_LIST) and step cards (NAME + real
        //    PREVIEW_TEXT - suppliers' UF_COOP_STAGES, franchise's
        //    UF_HOW_TO_BECOME_FRANCHISEES). Only the stat-card usages get
        //    'nameOnly'.
        // OUR_TEAM (about) intentionally excluded: no bio text, only
        // NAME + custom POSITION/DEPARTMENT properties the driver doesn't
        // read yet - low value without a further driver change.
        'about' => [
            'type' => 'page-element',
            'code' => '/about/',
            'sourceUrl' => 'https://prom.myfast.space/about/',
            'banner' => ['listProperty' => 'UF_BANNER_PAGE', 'iblockConstant' => 'IBLOCK_ID_BANNER', 'titleProperty' => 'TITLE', 'descriptionProperty' => 'DESCRIPTION'],
            'textProperty' => 'UF_BLOCK_ACHIEVEMENTS_DESCRIPTION',
            'blocks' => [
                ['id' => 'history', 'title' => 'История компании', 'listProperty' => 'UF_HISTORY', 'iblockConstant' => 'IBLOCK_ID_HISTORY'],
                ['id' => 'reviews', 'title' => 'Отзывы партнёров', 'listProperty' => 'UF_CASES_AND_REVIEWS', 'iblockConstant' => 'IBLOCK_ID_CASES_AND_REVIEWS'],
                ['id' => 'certificates', 'title' => 'Награды и сертификаты', 'listProperty' => 'UF_CASES_AND_CERTIFICATES', 'iblockConstant' => 'IBLOCK_ID_CASES_AND_CERTIFICATES'],
                ['id' => 'achievements', 'title' => 'Достижения в цифрах', 'listProperty' => 'UF_BLOCK_ACHIEVEMENTS_LIST', 'iblockConstant' => 'IBLOCK_ID_ACHIEVEMENTS', 'asBullets' => true, 'nameOnly' => true],
                ['id' => 'advantages', 'title' => 'Преимущества', 'listProperty' => 'UF_ADVANTAGES', 'iblockConstant' => 'IBLOCK_ID_ADVANTAGES', 'asBullets' => true, 'nameOnly' => true],
            ],
            'links' => [],
        ],
        // Thin page: banner + icon-only advantage cards (no usable
        // PREVIEW_TEXT at all on this page's UF_ADVANTAGES instances).
        'brands' => [
            'type' => 'page-element',
            'code' => '/brands/',
            'sourceUrl' => 'https://prom.myfast.space/brands/',
            'banner' => ['listProperty' => 'UF_BANNER_PAGE', 'iblockConstant' => 'IBLOCK_ID_BANNER', 'titleProperty' => 'TITLE', 'descriptionProperty' => 'DESCRIPTION'],
            'blocks' => [
                ['id' => 'advantages', 'title' => 'Преимущества наших брендов', 'listProperty' => 'UF_ADVANTAGES', 'iblockConstant' => 'IBLOCK_ID_ADVANTAGES', 'asBullets' => true, 'nameOnly' => true],
            ],
            'links' => [],
        ],
        'suppliers' => [
            'type' => 'page-element',
            'code' => '/suppliers/',
            'sourceUrl' => 'https://prom.myfast.space/suppliers/',
            'banner' => ['listProperty' => 'UF_BANNER_PAGE', 'iblockConstant' => 'IBLOCK_ID_BANNER', 'titleProperty' => 'TITLE', 'descriptionProperty' => 'DESCRIPTION'],
            'textProperty' => 'UF_BLOCK_ACHIEVEMENTS_DESCRIPTION',
            'blocks' => [
                ['id' => 'coop-stages', 'title' => 'Как начать сотрудничество', 'listProperty' => 'UF_COOP_STAGES', 'iblockConstant' => 'IBLOCK_ID_ACHIEVEMENTS', 'asBullets' => true],
                // asBullets keeps each entry's question (NAME) prefixed to its
                // answer — without it the block loses the Q&A framing entirely
                // and (per the live IBLOCK_ID_FAQ audit) one of the 3 linked
                // items here duplicates another's answer verbatim, which reads
                // as a content bug on the CMS side, not a sync bug.
                ['id' => 'faq', 'title' => 'Вопросы и ответы', 'listProperty' => 'UF_FAQ', 'iblockConstant' => 'IBLOCK_ID_FAQ', 'asBullets' => true],
                ['id' => 'achievements', 'title' => 'Достижения в цифрах', 'listProperty' => 'UF_BLOCK_ACHIEVEMENTS_LIST', 'iblockConstant' => 'IBLOCK_ID_ACHIEVEMENTS', 'asBullets' => true, 'nameOnly' => true],
            ],
            'links' => [],
        ],
        'franchise' => [
            'type' => 'page-element',
            'code' => '/franchise/',
            'sourceUrl' => 'https://prom.myfast.space/franchise/',
            'banner' => ['listProperty' => 'UF_BANNER_PAGE', 'iblockConstant' => 'IBLOCK_ID_BANNER', 'titleProperty' => 'TITLE', 'descriptionProperty' => 'DESCRIPTION'],
            'blocks' => [
                ['id' => 'how-to-start', 'title' => 'Как стать партнёром', 'listProperty' => 'UF_HOW_TO_BECOME_FRANCHISEES', 'iblockConstant' => 'IBLOCK_ID_ACHIEVEMENTS', 'asBullets' => true],
                ['id' => 'projects', 'title' => 'Реализованные проекты', 'listProperty' => 'UF_PROJECTS', 'iblockConstant' => 'IBLOCK_ID_PROJECTS'],
                ['id' => 'reviews', 'title' => 'Отзывы партнёров', 'listProperty' => 'UF_CASES_AND_REVIEWS', 'iblockConstant' => 'IBLOCK_ID_CASES_AND_REVIEWS'],
                // asBullets keeps each entry's question (NAME) prefixed to its
                // answer — without it the block loses the Q&A framing entirely
                // and (per the live IBLOCK_ID_FAQ audit) one of the 3 linked
                // items here duplicates another's answer verbatim, which reads
                // as a content bug on the CMS side, not a sync bug.
                ['id' => 'faq', 'title' => 'Вопросы и ответы', 'listProperty' => 'UF_FAQ', 'iblockConstant' => 'IBLOCK_ID_FAQ', 'asBullets' => true],
                ['id' => 'advantages', 'title' => 'Преимущества франшизы', 'listProperty' => 'UF_ADVANTAGES_ROW', 'iblockConstant' => 'IBLOCK_ID_ADVANTAGES', 'asBullets' => true, 'nameOnly' => true],
                ['id' => 'advantages-more', 'title' => null, 'listProperty' => 'UF_ADVANTAGES_SLIDER', 'iblockConstant' => 'IBLOCK_ID_ADVANTAGES', 'asBullets' => true, 'nameOnly' => true],
            ],
            'links' => [],
        ],
        // No banner property on this element - only certificate/award cards.
        'awards' => [
            'type' => 'page-element',
            'code' => '/awards/',
            'sourceUrl' => 'https://prom.myfast.space/awards/',
            'blocks' => [
                ['id' => 'certificates', 'title' => null, 'listProperty' => 'UF_CASES_AND_CERTIFICATES', 'iblockConstant' => 'IBLOCK_ID_CASES_AND_CERTIFICATES'],
            ],
            'links' => [],
        ],
        // Этап 1c (2026-09-29): mobile's own 'faq' slug currently points at
        // /delivery/'s warranty tab, which is wrong — the real FAQ is a
        // distinct IBLOCK_ID_FAQ list with 24 live Q&A entries, rendered at
        // /faq/ (confirmed by curl: same question text appears there).
        'faq' => [
            'type' => 'faq-list',
            'title' => 'Часто задаваемые вопросы',
            'sourceUrl' => 'https://prom.myfast.space/faq/',
            'links' => [],
        ],
        // Этап 1c (2026-09-29): 'cookies' has no IBLOCK_ID_PAGES element at
        // all (confirmed: full CODE listing of that iblock has no cookie
        // entry) - /cookie-policy/index.php is a static template file with
        // the legal text hardcoded in its own HTML, not CMS-editable content.
        'cookies' => [
            'type' => 'static-template',
            'file' => 'cookie-policy/index.php',
            'sourceUrl' => 'https://prom.myfast.space/cookie-policy/',
            'links' => [],
        ],
        // Same static-template shape as cookies. 'title' is forced here
        // because this template's own <h1> is wrong on the live site itself
        // (says "Согласие на обработку персональных данных" - copy-paste
        // leftover from the personal-data page - while the body is genuinely
        // about recommendation-technology disclosure per 149-ФЗ ст.10.2-2).
        'recommendations' => [
            'type' => 'static-template',
            'file' => 'recom-tech-info/index.php',
            'title' => 'Сведения о рекомендательных технологиях',
            'sourceUrl' => 'https://prom.myfast.space/recom-tech-info/',
            'links' => [],
        ],
    ],
];
