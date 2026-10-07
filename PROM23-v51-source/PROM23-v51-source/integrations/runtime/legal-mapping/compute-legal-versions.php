<?php
declare(strict_types=1);
/**
 * Reproducible sha256/version computation for the legal documents that
 * ConsentLedger stamps into consent receipts (`legal-versions.json`).
 *
 * Why this exists: `integrations/runtime/legal-versions.json` currently ships
 * hashes of the mobile app's own "legal42" canonical texts (edition
 * 2026-10-01, see mobile/src/content/legalDocuments.ts). Those are NOT
 * verified against what is actually published on the live Bitrix site:
 *   - /privacy-policy/ renders a hardcoded "Редакция от 06 июля 2026 года"
 *     text baked into privacy-policy/index.php (no DB, no CMS).
 *   - /user-agreement/ renders a DB-only field, UF_USER_AGREEMENT_TEXT, a
 *     user field on the IBLOCK_ID_PAGES element with CODE="user-agreement"
 *     (see local/class/Prom/Page.php, user-agreement/index.php:35). It DOES
 *     self-declare a revision ("...редакция опубликована: 26 мая 2025
 *     года."), confirmed from a real capture in
 *     cms-sync-output/site-pages.live.json (2026-09-29) — just phrased
 *     differently than privacy-policy's "Редакция от ...", which this
 *     script's parseRevisionDate() now also matches.
 * Before ConsentLedger's receipts can be treated as evidence of what a real
 * user actually read on the live site, someone with access to the live
 * Bitrix instance must run this script there and reconcile the result
 * against legal-versions.json / mobile/src/content/legalDocuments.ts. This
 * script does not publish or change any Bitrix content — it only reads and
 * hashes.
 *
 * Usage (no Bitrix required — hashes the static template file as shipped in
 * the prom23marketplace source checkout):
 *   php compute-legal-versions.php --privacy-policy-file=/path/to/prom23marketplace/privacy-policy/index.php
 *
 * Usage (requires running inside a Bitrix request/CLI with prolog_before.php
 * already included, e.g. via a one-off admin/console script on the real
 * instance — this repo has no DB access to run it):
 *   php compute-legal-versions.php --user-agreement --site-root=/path/to/bitrix/root
 *
 * Offline fallback for user-agreement (paste the rendered admin-panel value
 * into a plain text file, e.g. via "Copy element" in the Bitrix admin, since
 * no DB access is available from here):
 *   php compute-legal-versions.php --user-agreement-text-file=/path/to/pasted.txt --user-agreement-version=2026-07-06
 *
 * Output: a JSON fragment shaped like legal-versions.json entries, plus a
 * diff against the currently committed legal-versions.json so drift is
 * visible rather than silently overwritten.
 */

function extractVisibleText(string $html): string
{
    // Canonicalization rule (must match on every run): drop PHP/script/style
    // blocks, strip tags, decode entities, collapse whitespace runs to a
    // single space, trim. This mirrors how mobile/src/content/legalDocuments.ts
    // stores plain paragraph text rather than markup, so a document's hash
    // does not change because of unrelated CSS class renames.
    $text = preg_replace('/<\?php.*?\?>|<\?=.*?\?>/s', ' ', $html) ?? $html;
    $text = preg_replace('/<script\b[^>]*>.*?<\/script>/is', ' ', $text) ?? $text;
    $text = preg_replace('/<style\b[^>]*>.*?<\/style>/is', ' ', $text) ?? $text;
    $text = preg_replace('/<!--.*?-->/s', ' ', $text) ?? $text;
    $text = preg_replace('/<(br|p|div|li|h[1-6])\b[^>]*>/i', "\n", $text) ?? $text;
    $text = strip_tags($text);
    $text = html_entity_decode($text, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $text = preg_replace('/[ \t]+/', ' ', $text) ?? $text;
    $text = preg_replace('/\n[ \t]*/', "\n", $text) ?? $text;
    $text = preg_replace('/\n{3,}/', "\n\n", $text) ?? $text;
    return trim($text);
}

function sha256Text(string $text): string
{
    // Trailing newline is part of the canonical form so hashing is stable
    // across editors that do/don't add a final newline to the source file.
    return hash('sha256', rtrim($text, "\n") . "\n");
}

function parseRevisionDate(string $text): ?string
{
    // Matches the "Редакция от DD <месяц> YYYY года" convention used by
    // privacy-policy/index.php:19. Returns ISO 8601 (YYYY-MM-DD) or null if
    // the document has no such line (this is the user-agreement's situation
    // today — see the module docblock).
    $months = [
        'января' => '01', 'февраля' => '02', 'марта' => '03', 'апреля' => '04',
        'мая' => '05', 'июня' => '06', 'июля' => '07', 'августа' => '08',
        'сентября' => '09', 'октября' => '10', 'ноября' => '11', 'декабря' => '12',
    ];
    // Matches both "Редакция от DD месяц YYYY года" (privacy-policy's convention) and
    // "...редакция опубликована: DD месяц YYYY года" (found in the live UF_USER_AGREEMENT_TEXT
    // capture, 2026-09-29 — see docs/parity/runtime-consent.md's 06.10.2026 update). Earlier
    // versions of this function only matched the first form and reported "no date found" for
    // documents that actually do self-describe a revision, just with different wording.
    if (!preg_match('/(?:Редакция от|редакция опубликована:)\s+(\d{1,2})\s+([а-яё]+)\s+(\d{4})\s+года/iu', $text, $m)) {
        return null;
    }
    $month = $months[mb_strtolower($m[2])] ?? null;
    if ($month === null) {
        return null;
    }
    return sprintf('%04d-%02d-%02d', (int)$m[3], (int)$month, (int)$m[1]);
}

function readOpt(array $argv, string $name): ?string
{
    foreach ($argv as $arg) {
        if (str_starts_with($arg, '--' . $name . '=')) {
            return substr($arg, strlen($name) + 3);
        }
    }
    return null;
}

function hasFlag(array $argv, string $name): bool
{
    return in_array('--' . $name, $argv, true);
}

$argv = $argv ?? [];
$result = [];
$warnings = [];

$privacyFile = readOpt($argv, 'privacy-policy-file');
if ($privacyFile !== null) {
    if (!is_file($privacyFile)) {
        fwrite(STDERR, "privacy-policy-file not found: $privacyFile\n");
        exit(1);
    }
    $html = (string)file_get_contents($privacyFile);
    $text = extractVisibleText($html);
    $version = parseRevisionDate($text);
    if ($version === null) {
        $warnings[] = 'privacy-policy: no "Редакция от ..." line found — check extraction/canonicalization did not strip it.';
    }
    $result['privacy-policy'] = [
        'version' => $version,
        'sha256' => sha256Text($text),
        'sourceFile' => $privacyFile,
        'canonicalization' => 'strip-tags+collapse-whitespace (see extractVisibleText())',
    ];
}

$userAgreementTextFile = readOpt($argv, 'user-agreement-text-file');
if ($userAgreementTextFile !== null) {
    if (!is_file($userAgreementTextFile)) {
        fwrite(STDERR, "user-agreement-text-file not found: $userAgreementTextFile\n");
        exit(1);
    }
    $raw = (string)file_get_contents($userAgreementTextFile);
    $text = extractVisibleText($raw);
    $version = parseRevisionDate($text) ?? readOpt($argv, 'user-agreement-version');
    if ($version === null) {
        $warnings[] = 'user-agreement: no explicit revision date found in the text and no --user-agreement-version= given. '
            . 'Recommend either (a) asking an editor to add a "Редакция от DD месяц YYYY года" line to '
            . 'UF_USER_AGREEMENT_TEXT so it is self-describing like privacy-policy, or (b) using the iblock '
            . 'element TIMESTAMP_X as the version, e.g. "uf-text-2026-07-06T10:15:00+03:00" via --user-agreement mode.';
    }
    $result['user-agreement'] = [
        'version' => $version,
        'sha256' => sha256Text($text),
        'sourceFile' => $userAgreementTextFile,
        'canonicalization' => 'strip-tags+collapse-whitespace (see extractVisibleText())',
        'note' => 'Pasted export — re-run against the live DB value with --user-agreement before trusting this for production.',
    ];
}

if (hasFlag($argv, 'user-agreement')) {
    $siteRoot = readOpt($argv, 'site-root');
    if ($siteRoot === null || !is_file($siteRoot . '/bitrix/modules/main/include/prolog_before.php')) {
        fwrite(STDERR, "user-agreement mode requires --site-root=<bitrix root> with a real Bitrix install; not available in this checkout.\n");
        exit(1);
    }
    $_SERVER['DOCUMENT_ROOT'] = $siteRoot;
    foreach (['NO_AGENT_CHECK', 'NO_KEEP_STATISTIC', 'STOP_STATISTICS', 'NO_AGENT_STATISTIC'] as $flag) {
        if (!defined($flag)) {
            define($flag, true);
        }
    }
    ob_start();
    require_once $siteRoot . '/bitrix/modules/main/include/prolog_before.php';
    \Bitrix\Main\Loader::includeModule('iblock');
    $page = \Prom\Page::getInstance();
    $page->init('user-agreement');
    $data = $page->getData();
    ob_end_clean();
    if (!$data) {
        fwrite(STDERR, "user-agreement page element not found (CODE=user-agreement in IBLOCK_ID_PAGES).\n");
        exit(1);
    }
    $rawText = (string)($data['PROPS']['UF_USER_AGREEMENT_TEXT'] ?? '');
    $text = extractVisibleText($rawText);
    $revisionInText = parseRevisionDate($text);
    $timestampX = (string)($data['FIELDS']['TIMESTAMP_X'] ?? '');
    // Prefer an explicit "Редакция от ..." line if editors ever add one;
    // otherwise fall back to the element's last-modified timestamp, which is
    // the only version signal that currently exists for this document.
    $version = $revisionInText ?? ('uf-text-' . str_replace(' ', 'T', $timestampX));
    if ($revisionInText === null) {
        $warnings[] = 'user-agreement: falling back to TIMESTAMP_X-based version because no "Редакция от ..." line exists in UF_USER_AGREEMENT_TEXT. '
            . 'This is fragile: TIMESTAMP_X also changes on unrelated saves (e.g. re-saving without content changes) — confirm with the CMS owner before relying on it in production.';
    }
    $result['user-agreement'] = [
        'version' => $version,
        'sha256' => sha256Text($text),
        'timestampX' => $timestampX,
        'source' => 'live DB (IBLOCK_ID_PAGES, CODE=user-agreement, UF_USER_AGREEMENT_TEXT)',
    ];
}

if (!$result) {
    fwrite(STDERR, "Nothing to do. See the docblock at the top of this file for usage.\n");
    exit(1);
}

$existingPath = __DIR__ . '/../legal-versions.json';
$existing = is_file($existingPath) ? json_decode((string)file_get_contents($existingPath), true) : [];
$diff = [];
foreach ($result as $id => $entry) {
    $committedId = $id === 'privacy-policy' ? 'privacy' : ($id === 'user-agreement' ? 'consent' : $id);
    $committed = $existing[$committedId] ?? null;
    if ($committed === null) {
        $diff[$id] = 'no committed entry named "' . $committedId . '" in legal-versions.json to compare against';
    } elseif (($committed['sha256'] ?? null) !== $entry['sha256']) {
        $diff[$id] = 'MISMATCH vs committed "' . $committedId . '": committed version=' . ($committed['version'] ?? '?')
            . ' sha256=' . ($committed['sha256'] ?? '?') . ' — this computed hash is of the live Bitrix page, not the '
            . 'mobile app\'s bundled legal42 text. Reconcile before treating consent receipts as matching what users saw on /' . $id . '/.';
    } else {
        $diff[$id] = 'matches committed "' . $committedId . '"';
    }
}

echo json_encode(['computed' => $result, 'comparedToCommitted' => $diff, 'warnings' => $warnings], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), "\n";
