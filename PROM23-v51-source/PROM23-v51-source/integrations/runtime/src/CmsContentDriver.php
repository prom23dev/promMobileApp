<?php
declare(strict_types=1);
namespace Prom23\Runtime;
require_once __DIR__.'/Protocol.php';

/**
 * Live CMS read adapter for the public /api/v1/content/pages/:slug seam
 * (server/integrations/public-content.mjs). Read-only: never calls
 * CIBlockElement::Add/Update/Delete. Runs as an offline sync (see
 * integrations/runtime/cms-sync.php), not per public request — content pages
 * change rarely and the public BFF must not depend on live Bitrix uptime.
 *
 * Mirrors the field-level safety checks in public-content.mjs's
 * normalizeContentPage()/safeContentUrl() so a single malformed source
 * element is rejected here, with its own provenance in the error, instead of
 * silently reaching the BFF and being dropped without explanation.
 */
final class CmsContentDriver {
    private const ID = '/^[a-z][a-z0-9-]{0,79}$/D';
    public function __construct(private array $config) {}

    /** @return array{slug:string,title:string,sourceUrl:?string,sections:array,links:array,provenance:array} */
    public function page(string $slug): array {
        $spec = $this->config['pages'][$slug] ?? null;
        if (!$spec || !preg_match(self::ID, $slug)) throw new RuntimeExceptionCode('CMS_SLUG_NOT_CONFIGURED', 404);
        $result = match ($spec['type']) {
            'page-element' => $this->withIblock(fn() => $this->fromPageElement($slug, $spec)),
            'delivery-tab' => $this->withIblock(fn() => $this->fromDeliveryTab($slug, $spec)),
            'faq-list' => $this->withIblock(fn() => $this->fromFaqList($slug, $spec)),
            'promotions-list' => $this->withIblock(fn() => $this->fromPromotionsList($slug, $spec)),
            'static-template' => $this->fromStaticTemplate($slug, $spec),
            default => throw new RuntimeExceptionCode('CMS_SOURCE_NOT_MIGRATED', 503),
        };
        return $this->validated($slug, $result);
    }

    private function withIblock(callable $fn): array {
        \Bitrix\Main\Loader::includeModule('iblock');
        return $fn();
    }

    /**
     * about/brands/suppliers/franchise/awards/cooperation/personal-data: base
     * element in IBLOCK_ID_PAGES, selected by CODE (identical filter to
     * \Prom\Page::init()). Optional 'blocks' config resolves the linked
     * banner/achievements/history-style iblocks referenced by the page
     * element's own UF_ list properties, in the stored element order — the
     * same pattern local templates use via bitrix:news.list + ID-list filter.
     * Only 'about' and 'personal-data' block wiring is confirmed against
     * source templates; other slugs must add their own 'blocks'/'textProperty'
     * entries after auditing that page's own index.php (see runtime-cms.md).
     */
    private function fromPageElement(string $slug, array $spec): array {
        if (!defined('IBLOCK_ID_PAGES')) throw new RuntimeExceptionCode('SOURCE_SCHEMA_REQUIRED');
        $element = $this->element((int)IBLOCK_ID_PAGES, $spec['code']);
        $sections = [];
        if (isset($spec['banner'])) {
            $bannerSection = $this->bannerSection($spec['banner'], $element['props'][$spec['banner']['listProperty']]['VALUE'] ?? null);
            if ($bannerSection) $sections[] = $bannerSection;
        }
        if (isset($spec['textProperty'])) {
            $text = $this->text($element['props'][$spec['textProperty']]['VALUE'] ?? null);
            if ($text !== '') $sections[] = $this->section('content', null, $text);
        }
        foreach ($spec['blocks'] ?? [] as $block) {
            $ids = $this->idList($element['props'][$block['listProperty']]['VALUE'] ?? null);
            if (!$ids) continue;
            // Some blocks' real on-page heading is itself a page-element UF_
            // text property (e.g. UF_BLOCK_ACHIEVEMENTS_TITLE), not a literal
            // string in the template — 'titleProperty' reads that instead of
            // trusting a hardcoded label to stay in sync with editors.
            if (isset($block['titleProperty'])) {
                $resolved = $this->text($element['props'][$block['titleProperty']]['VALUE'] ?? '', 300);
                if ($resolved !== '') $block['title'] = $resolved;
            }
            $sections[] = $this->blockSection($block, $ids);
        }
        return [
            'title' => $this->text($element['fields']['NAME'] ?? '', 300),
            'sourceUrl' => $spec['sourceUrl'] ?? null,
            'sections' => $sections,
            'links' => $spec['links'] ?? [],
            'provenance' => $this->provenance('IBLOCK_ID_PAGES', (int)IBLOCK_ID_PAGES, (int)$element['fields']['ID'], $element['fields']),
        ];
    }

    /**
     * returns/details/offer/checkout/warranty: all five tabs live on the
     * single /delivery/ page element as parallel multi-value UF properties
     * (UF_CONTENT_TABS, UF_CONTENT_TABS_TEXT, UF_CONTENT_TABS_SLUG,
     * UF_CONTENT_TABS_H1) — see site's delivery/index.php. Resolve the tab by
     * matching spec['tabSlug'] against UF_CONTENT_TABS_SLUG, not by array
     * position: editors can reorder tabs without a code change here.
     */
    private function fromDeliveryTab(string $slug, array $spec): array {
        if (!defined('IBLOCK_ID_PAGES')) throw new RuntimeExceptionCode('SOURCE_SCHEMA_REQUIRED');
        $element = $this->element((int)IBLOCK_ID_PAGES, '/delivery/');
        $slugs = $this->multiValue($element['props']['UF_CONTENT_TABS_SLUG']['VALUE'] ?? null);
        $labels = $this->multiValue($element['props']['UF_CONTENT_TABS']['VALUE'] ?? null);
        $h1s = $this->multiValue($element['props']['UF_CONTENT_TABS_H1']['VALUE'] ?? null);
        $bodies = $this->multiValue($element['props']['UF_CONTENT_TABS_TEXT']['VALUE'] ?? null);
        $index = array_search($spec['tabSlug'], $slugs, true);
        if ($index === false) throw new RuntimeExceptionCode('CMS_TAB_NOT_FOUND', 404);
        $title = $this->text($h1s[$index] ?? $labels[$index] ?? '', 300);
        $body = $this->text($bodies[$index] ?? '');
        if ($title === '' || $body === '') throw new RuntimeExceptionCode('CMS_TAB_EMPTY', 503);
        return [
            'title' => $title,
            'sourceUrl' => $spec['sourceUrl'] ?? null,
            'sections' => $this->chunkedSections('content', $body),
            'links' => $spec['links'] ?? [],
            'provenance' => [...$this->provenance('IBLOCK_ID_PAGES', (int)IBLOCK_ID_PAGES, (int)$element['fields']['ID'], $element['fields']), 'tabSlug' => $spec['tabSlug'], 'tabIndex' => $index],
        ];
    }

    /**
     * normalizeContentPage() caps a section's paragraphs at 120 — long legal
     * tabs (e.g. 'oferta', 124 numbered clauses) exceed that in one section.
     * Split into 'id', 'id-2', 'id-3'... chunks instead of raising the shared
     * safety cap (mirrored in public-content.mjs) just for this one source.
     */
    private function chunkedSections(string $id, string $body): array {
        $paragraphs = array_values(array_filter(array_map('trim', preg_split('/\r?\n+/', $body)), static fn($p) => $p !== ''));
        $sections = [];
        foreach (array_chunk($paragraphs, 100) as $i => $chunk) {
            $sections[] = ['id' => $i === 0 ? $id : $id.'-'.($i + 1), 'paragraphs' => $chunk];
        }
        return $sections;
    }

    /**
     * faq: IBLOCK_ID_FAQ is a distinct iblock (real question/answer list),
     * not a IBLOCK_ID_PAGES element — the mobile app's current curated entry
     * ("faq" slug pointing at the /delivery/ warranty tab URL) is very
     * likely a content mismatch inherited from an earlier manual copy, not a
     * deliberate design; keep both source paths available and pick with the
     * owner before enabling this slug's live flag (see runtime-cms.md).
     */
    private function fromFaqList(string $slug, array $spec): array {
        if (!defined('IBLOCK_ID_FAQ')) throw new RuntimeExceptionCode('SOURCE_SCHEMA_REQUIRED');
        $cursor = \CIBlockElement::GetList(['SORT' => 'ASC', 'ID' => 'ASC'], ['IBLOCK_ID' => (int)IBLOCK_ID_FAQ, 'ACTIVE' => 'Y'], false, ['nTopCount' => 80], ['ID', 'NAME', 'DETAIL_TEXT', 'PREVIEW_TEXT', 'TIMESTAMP_X']);
        $sections = [];
        $latest = null;
        while ($row = $cursor->Fetch()) {
            $question = $this->text($row['NAME'] ?? '', 300);
            // DETAIL_TEXT is '' (not null) when unused on this iblock, so ??
            // never falls through to PREVIEW_TEXT — every live FAQ answer
            // actually lives in PREVIEW_TEXT, so check emptiness explicitly.
            $detail = $this->text($row['DETAIL_TEXT'] ?? '');
            $answer = $detail !== '' ? $detail : $this->text($row['PREVIEW_TEXT'] ?? '');
            if ($question === '' || $answer === '') continue;
            $sections[] = $this->section('faq-'.$row['ID'], $question, $answer);
            if ($latest === null || (string)$row['TIMESTAMP_X'] > $latest) $latest = (string)$row['TIMESTAMP_X'];
        }
        if (!$sections) throw new RuntimeExceptionCode('CMS_TAB_EMPTY', 503);
        return [
            'title' => $spec['title'] ?? 'Вопросы и ответы',
            'sourceUrl' => $spec['sourceUrl'] ?? null,
            'sections' => $sections,
            'links' => $spec['links'] ?? [],
            'provenance' => ['source' => 'IBLOCK_ID_FAQ', 'iblockId' => (int)IBLOCK_ID_FAQ, 'itemCount' => count($sections), 'lastModified' => $latest],
        ];
    }

    /**
     * promotions: owner decided 2026-10-06 to create a dedicated iblock
     * (no equivalent existed anywhere in the real backend — see
     * runtime-cms.md's "promotions — not found" note) rather than fake a
     * mapping onto an unrelated source. IBLOCK_ID_PROMOTIONS was created via
     * local/php_interface/migrations/Version20261009130000.php, shaped like
     * IBLOCK_ID_NEW_PRODUCTS/IBLOCK_ID_NEWS (plain NAME/PREVIEW_TEXT/
     * DETAIL_TEXT/ACTIVE_FROM/ACTIVE_TO — no custom UF_ date properties
     * needed, those two fields are native CIBlockElement fields). Only the
     * read-only CMS content page is implemented here; the mobile app's
     * `data-contract` also lists `productIds`/`buyerTypes`/`regions` for a
     * *structured* promotions resource/feed — that is a separate, not yet
     * built API shape and is intentionally out of scope for this adapter,
     * which only feeds the `/promotions/` content page's title+sections.
     */
    private function fromPromotionsList(string $slug, array $spec): array {
        if (!defined('IBLOCK_ID_PROMOTIONS')) throw new RuntimeExceptionCode('SOURCE_SCHEMA_REQUIRED');
        $cursor = \CIBlockElement::GetList(['SORT' => 'ASC', 'ID' => 'ASC'], ['IBLOCK_ID' => (int)IBLOCK_ID_PROMOTIONS, 'ACTIVE' => 'Y'], false, ['nTopCount' => 80], ['ID', 'NAME', 'PREVIEW_TEXT', 'DETAIL_TEXT', 'ACTIVE_FROM', 'ACTIVE_TO', 'TIMESTAMP_X']);
        $sections = [];
        $latest = null;
        while ($row = $cursor->Fetch()) {
            $title = $this->text($row['NAME'] ?? '', 300);
            $detail = $this->text($row['DETAIL_TEXT'] ?? '');
            $body = $detail !== '' ? $detail : $this->text($row['PREVIEW_TEXT'] ?? '');
            if ($title === '' || $body === '') continue;
            // ACTIVE_FROM/ACTIVE_TO are site-locale Bitrix date strings (not
            // ISO) — same FormatDate/MakeTimeStamp handling as awards'
            // yearField, but keeping the full date, not just the year, since
            // the mobile data-contract names these validFrom/validTo.
            $validFrom = !empty($row['ACTIVE_FROM']) && \MakeTimeStamp($row['ACTIVE_FROM']) ? \FormatDate('d.m.Y', \MakeTimeStamp($row['ACTIVE_FROM'])) : null;
            $validTo = !empty($row['ACTIVE_TO']) && \MakeTimeStamp($row['ACTIVE_TO']) ? \FormatDate('d.m.Y', \MakeTimeStamp($row['ACTIVE_TO'])) : null;
            if ($validFrom !== null || $validTo !== null) {
                $body .= "\n".'Срок действия: '.($validFrom ?? '—').' — '.($validTo ?? '—');
            }
            $sections[] = $this->section('promo-'.$row['ID'], $title, $body);
            if ($latest === null || (string)$row['TIMESTAMP_X'] > $latest) $latest = (string)$row['TIMESTAMP_X'];
        }
        if (!$sections) throw new RuntimeExceptionCode('CMS_TAB_EMPTY', 503);
        return [
            'title' => $spec['title'] ?? 'Акции и предложения',
            'sourceUrl' => $spec['sourceUrl'] ?? null,
            'sections' => $sections,
            'links' => $spec['links'] ?? [],
            'provenance' => ['source' => 'IBLOCK_ID_PROMOTIONS', 'iblockId' => (int)IBLOCK_ID_PROMOTIONS, 'itemCount' => count($sections), 'lastModified' => $latest],
        ];
    }

    /**
     * cookies: unlike every other slug, /cookie-policy/ is not backed by any
     * iblock element at all — the legal text is hardcoded directly in the
     * page's own template file (local site confirmed 2026-09-29: no matching
     * CODE exists anywhere in IBLOCK_ID_PAGES). Reads that template file
     * (never executes it) and pulls the <h1>/<h2>/<h3>/<p> blocks between the
     * first heading and the bitrix/footer.php include, which is exactly the
     * page's visible body in this site's templates. A CMS editor changing
     * this text means editing this file, not an iblock element, so this
     * offline sync must be re-run after any such deploy for it to reflect.
     */
    private function fromStaticTemplate(string $slug, array $spec): array {
        if (!preg_match('#^[a-z0-9_/-]+\.php$#i', $spec['file'] ?? '')) throw new RuntimeExceptionCode('SOURCE_SCHEMA_REQUIRED');
        $siteRoot = realpath((string)($this->config['siteRoot'] ?? ''));
        $path = $siteRoot ? realpath($siteRoot.'/'.$spec['file']) : false;
        if (!$siteRoot || !$path || !str_starts_with($path, $siteRoot.DIRECTORY_SEPARATOR)) throw new RuntimeExceptionCode('CMS_ELEMENT_NOT_FOUND', 404);
        $raw = file_get_contents($path);
        if ($raw === false) throw new RuntimeExceptionCode('CMS_ELEMENT_NOT_FOUND', 404);
        $start = stripos($raw, '<h1');
        $end = stripos($raw, 'footer.php');
        if ($start === false) throw new RuntimeExceptionCode('CMS_TAB_EMPTY', 503);
        $body = substr($raw, $start, ($end !== false ? $end : strlen($raw)) - $start);
        // 'li' alongside h1/h2/h3/p: confirmed 2026-10-09 against privacy-policy/index.php
        // that several bullet lists there put raw text directly inside <li> with no <p>
        // child at all (e.g. lines 528-612) — a p-only pattern silently drops that text
        // instead of failing loudly. A <li> encountered before an inner <p> is matched as
        // one block (lazy .*? extends to the matching </li>, swallowing any nested <p> tags,
        // which the stripping in text() below still cleans up), so <li><p>…</p></li> pages
        // like cookie-policy/recom-tech-info are unaffected — each <li> still yields exactly
        // one paragraph, not a double count of the outer <li> and the inner <p>.
        preg_match_all('#<(h1|h2|h3|p|li)[^>]*>(.*?)</\1>#is', $body, $blocks, PREG_SET_ORDER);
        // One <p>/<li> per legal clause easily exceeds the 80-section cap (this
        // page alone has 100+) - group every block into a single 'content'
        // section's paragraph list, matching the pattern textProperty/
        // delivery-tab already use for long-form legal text.
        $paragraphs = [];
        $title = $spec['title'] ?? null;
        $sawH1 = false;
        foreach ($blocks as $block) {
            $text = $this->text($block[2]);
            if ($text === '') continue;
            // The page's own <h1> is always dropped from the body — either it
            // becomes the title (no override given) or, if 'title' was
            // supplied because this template's own heading is wrong, it's
            // simply discarded rather than leaking into the first paragraph.
            if (!$sawH1 && strtolower($block[1]) === 'h1') { $sawH1 = true; $title ??= $text; continue; }
            $paragraphs[] = $text;
        }
        if (!$paragraphs) throw new RuntimeExceptionCode('CMS_TAB_EMPTY', 503);
        return [
            'title' => $this->text($title ?? '', 300),
            'sourceUrl' => $spec['sourceUrl'] ?? null,
            'sections' => [array_filter(['id' => 'content', 'paragraphs' => $paragraphs], static fn($v) => $v !== null)],
            'links' => $spec['links'] ?? [],
            'provenance' => ['source' => 'STATIC_TEMPLATE', 'file' => $spec['file'], 'lastModified' => gmdate('Y-m-d\TH:i:s\Z', filemtime($path))],
        ];
    }

    private function blockSection(array $block, array $ids): array {
        $rows = [];
        $fields = ['ID', 'NAME', 'PREVIEW_TEXT', 'DETAIL_TEXT'];
        if (!empty($block['yearField'])) $fields[] = 'ACTIVE_FROM';
        $cursor = \CIBlockElement::GetList([], ['IBLOCK_ID' => (int)constant($block['iblockConstant']), '=ID' => $ids, 'ACTIVE' => 'Y'], false, false, $fields);
        while ($row = $cursor->Fetch()) $rows[(int)$row['ID']] = $row;
        $bullets = [];
        $paragraphs = [];
        foreach ($ids as $id) {
            $row = $rows[$id] ?? null; if (!$row) continue;
            // Some card-style iblocks (e.g. IBLOCK_ID_ADVANTAGES) reuse the same
            // boilerplate PREVIEW_TEXT across every sibling card — 'nameOnly'
            // opts a block out of appending it, so bullets aren't duplicated text.
            $preview = empty($block['nameOnly']) ? ($row['PREVIEW_TEXT'] ?? '') : '';
            // 'yearField' mirrors awards/index.php's own "<h3>YYYY</h3> NAME"
            // table rows (FormatDate/MakeTimeStamp, not strtotime: ACTIVE_FROM
            // is a site-locale Bitrix date string, not necessarily ISO).
            $year = !empty($block['yearField']) && !empty($row['ACTIVE_FROM']) && \MakeTimeStamp($row['ACTIVE_FROM']) ? \FormatDate('Y', \MakeTimeStamp($row['ACTIVE_FROM'])) : null;
            // 'previewOnly' drops NAME from the line entirely. Confirmed 2026-10-09:
            // across every template that touches IBLOCK_ID_CASES_AND_REVIEWS (about/
            // business/vendor/franchise, all via the same cases_and_reviews news.list
            // instance), NAME is never requested as visible FIELD_CODE; the one place
            // the shared template reads $arItem['NAME'] at all is an <img alt="">, i.e.
            // Bitrix's default per-element placeholder, not real editorial content —
            // so including it here would leak "Элемент #123"-style text into bullets.
            $name = empty($block['previewOnly']) ? $this->text($row['NAME'] ?? '', 300) : '';
            $line = trim(($year !== null ? $year.' — ' : '').$name.($preview ? ' — '.$this->text($preview) : ''), ' —');
            if ($line === '') continue;
            if (!empty($block['asBullets'])) { $bullets[] = $line; continue; }
            // DETAIL_TEXT is often '' (not null) when unused — '' must still fall
            // through to PREVIEW_TEXT, which is where several card iblocks (e.g.
            // IBLOCK_ID_FAQ) actually store their body text.
            $detail = $this->text($row['DETAIL_TEXT'] ?? '');
            $paragraphs[] = $detail !== '' ? $detail : $this->text($preview !== '' ? $preview : ($row['PREVIEW_TEXT'] ?? $line));
        }
        return array_filter([
            'id' => $block['id'],
            'title' => $block['title'] ?? null,
            'paragraphs' => $paragraphs,
            'bullets' => $bullets ?: null,
        ], static fn($v) => $v !== null);
    }

    /**
     * Hero/banner intro text: 'listProperty' (e.g. UF_BANNER_PAGE) is a
     * single-value iblock_element UF property linking to one element in
     * IBLOCK_ID_BANNER, whose own TITLE/DESCRIPTION IBLOCK properties hold
     * the page's marketing headline — not exposed via textProperty/blocks,
     * which only read the page element's own fields.
     */
    private function bannerSection(array $spec, mixed $linkValue): ?array {
        $id = is_array($linkValue) ? (int)($linkValue[0] ?? 0) : (int)($linkValue ?? 0);
        if ($id <= 0) return null;
        $rs = \CIBlockElement::GetList([], ['IBLOCK_ID' => (int)constant($spec['iblockConstant']), 'ID' => $id, 'ACTIVE' => 'Y'], false, ['nTopCount' => 1]);
        $ob = $rs->GetNextElement();
        if (!$ob) return null;
        $props = $ob->GetProperties();
        $title = $this->text($props[$spec['titleProperty']]['VALUE'] ?? '', 300);
        $description = $this->text($props[$spec['descriptionProperty']]['VALUE'] ?? '');
        $paragraphs = array_values(array_filter([$title, $description], static fn($p) => $p !== ''));
        if (!$paragraphs) return null;
        return ['id' => 'intro', 'paragraphs' => $paragraphs];
    }

    private function section(string $id, ?string $title, string $body): array {
        $paragraphs = array_values(array_filter(array_map('trim', preg_split('/\r?\n+/', $body)), static fn($p) => $p !== ''));
        return array_filter(['id' => $id, 'title' => $title, 'paragraphs' => $paragraphs], static fn($v) => $v !== null);
    }

    /** @return array{fields:array,props:array} */
    private function element(int $iblockId, string $code): array {
        $rs = \CIBlockElement::GetList([], ['IBLOCK_ID' => $iblockId, 'CODE' => $code, 'ACTIVE' => 'Y'], false, ['nTopCount' => 1]);
        $ob = $rs->GetNextElement();
        if (!$ob) throw new RuntimeExceptionCode('CMS_ELEMENT_NOT_FOUND', 404);
        $fields = $ob->GetFields();
        $props = $ob->GetProperties();
        global $USER_FIELD_MANAGER;
        foreach ($USER_FIELD_MANAGER->GetUserFields('ELEMENT_PROP_'.$fields['ID'], (int)$fields['ID'], LANGUAGE_ID) as $ufCode => $uf) $props[$ufCode] = $uf;
        return ['fields' => $fields, 'props' => $props];
    }

    private function idList(mixed $value): array {
        $out = [];
        foreach ((array)($value ?? []) as $id) if (preg_match('/^[1-9][0-9]*$/D', (string)$id)) $out[] = (int)$id;
        return $out;
    }
    private function multiValue(mixed $value): array { return array_values((array)($value ?? [])); }
    private function text(mixed $value, int $length = 20000): string {
        if (is_array($value)) $value = $value['TEXT'] ?? ($value['VALUE'] ?? '');
        // Some UF properties (e.g. banner TITLE/DESCRIPTION) store HTML with
        // entity-encoded tags (&lt;br&gt;) rather than literal ones — decode
        // entities *before* stripping tags, or the decoded '<br>' leaks through
        // strip_tags untouched and trips the '<>' safety check downstream.
        // <br>/<p> are converted to newlines first so words on either side
        // don't get jammed together once the tag itself is gone.
        $decoded = html_entity_decode((string)$value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $withBreaks = preg_replace('#<\s*(br|/p|/div)\s*/?\s*>#i', "\n", $decoded);
        $plain = strip_tags($withBreaks);
        $plain = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', $plain);
        return trim(mb_substr($plain, 0, $length));
    }
    private function provenance(string $sourceConstant, int $iblockId, int $elementId, array $fields): array {
        return ['source' => $sourceConstant, 'iblockId' => $iblockId, 'elementId' => $elementId, 'lastModified' => (string)($fields['TIMESTAMP_X'] ?? '')];
    }

    /**
     * Defense-in-depth mirror of public-content.mjs's normalizeContentPage()
     * checks. This does not replace that Node-side validation (the BFF still
     * re-validates on ingest); it exists so cms-sync.php can fail loudly and
     * attribute a *specific* slug/provenance when a live source element goes
     * bad, instead of a bad page only surfacing later as a generic BFF drop.
     */
    private function validated(string $slug, array $result): array {
        $title = $result['title']; $sourceUrl = $result['sourceUrl'];
        if (!preg_match(self::ID, $slug) || !$this->safeText($title, 300)) throw new RuntimeExceptionCode('CMS_CONTENT_UNSAFE', 502, ['slug' => $slug]);
        if ($sourceUrl !== null && !$this->safeUrl($sourceUrl)) throw new RuntimeExceptionCode('CMS_CONTENT_UNSAFE', 502, ['slug' => $slug]);
        if (count($result['sections']) > 80) throw new RuntimeExceptionCode('CMS_CONTENT_UNSAFE', 502, ['slug' => $slug]);
        $ids = [];
        foreach ($result['sections'] as $section) {
            if (!preg_match(self::ID, $section['id']) || in_array($section['id'], $ids, true)) throw new RuntimeExceptionCode('CMS_CONTENT_UNSAFE', 502, ['slug' => $slug]);
            $ids[] = $section['id'];
            if (isset($section['title']) && !$this->safeText($section['title'], 300)) throw new RuntimeExceptionCode('CMS_CONTENT_UNSAFE', 502, ['slug' => $slug]);
            if (!$this->safeStrings($section['paragraphs'] ?? [])) throw new RuntimeExceptionCode('CMS_CONTENT_UNSAFE', 502, ['slug' => $slug]);
            if (isset($section['bullets']) && !$this->safeStrings($section['bullets'])) throw new RuntimeExceptionCode('CMS_CONTENT_UNSAFE', 502, ['slug' => $slug]);
        }
        $links = [];
        foreach ($result['links'] as $link) if ($this->safeText($link['label'] ?? '', 200) && $this->safeUrl($link['url'] ?? '')) $links[] = ['label' => $link['label'], 'url' => $link['url']];
        return ['slug' => $slug, 'title' => $title, 'sourceUrl' => $sourceUrl, 'sections' => $result['sections'], 'links' => array_slice($links, 0, 40), 'provenance' => $result['provenance']];
    }
    private function safeText(mixed $s, int $max): bool { return is_string($s) && $s !== '' && mb_strlen($s, 'UTF-8') <= $max && !preg_match('/[<>\x00-\x08\x0B\x0C\x0E-\x1F]/', $s); }
    private function safeStrings(mixed $a): bool { if (!is_array($a) || count($a) > 120) return false; foreach ($a as $s) if (!$this->safeText($s, 20000)) return false; return true; }
    private function safeUrl(string $url): bool {
        $parts = parse_url($url);
        if (!$parts || ($parts['scheme'] ?? '') !== 'https' || !in_array($parts['host'] ?? '', ['prom.myfast.space', 'prom23.ru'], true) || isset($parts['port'], $parts['user'], $parts['pass'], $parts['query'], $parts['fragment'])) return false;
        $path = $parts['path'] ?? '/';
        return !preg_match('#^/(local|bitrix|personal|organization|api)(?:/|$)#i', $path) && !preg_match('/\.php$/i', $path);
    }
}
