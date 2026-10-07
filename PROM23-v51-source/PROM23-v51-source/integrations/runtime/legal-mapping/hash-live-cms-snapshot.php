<?php
declare(strict_types=1);
/**
 * Computes sha256 for the legal documents (privacy/consent/offer) out of
 * integrations/runtime/cms-sync-output/site-pages.live.json — a real
 * capture from `cms-sync.php` run against prom-stage on 2026-09-29
 * (`cms-sync-output/site-pages.live.manifest.json`: 14/14 slugs, 0 errors).
 *
 * Unlike `compute-legal-versions.php` (written when no live capture was
 * known to exist), this script needs no Bitrix/PHP CLI on a live instance —
 * the content is already sitting in the repo. It exists to make the hash
 * reproducible from that committed snapshot rather than computed once by
 * hand and pasted into a doc.
 *
 * Caveat: this reflects site state as of 2026-09-29, not whatever is live
 * right now. Treat it as a strong starting point for reconciling
 * `legal-versions.json`, not a live source of truth — re-run
 * `cms-sync.php` and this script together when that matters.
 *
 * Usage:
 *   php hash-live-cms-snapshot.php [path/to/site-pages.live.json]
 *   (defaults to ../cms-sync-output/site-pages.live.json)
 */

function canonicalText(array $page): string
{
    $sections = [];
    foreach ($page['sections'] ?? [] as $section) {
        $sections[] = implode("\n\n", $section['paragraphs'] ?? []);
    }
    return trim(implode("\n\n", $sections));
}

function sha256Text(string $text): string
{
    return hash('sha256', rtrim($text, "\n") . "\n");
}

$path = $argv[1] ?? __DIR__ . '/../cms-sync-output/site-pages.live.json';
if (!is_file($path)) {
    fwrite(STDERR, "snapshot not found: $path\n");
    exit(1);
}
$snapshot = json_decode((string)file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

// slug in the CMS snapshot -> document id in legal-versions.json / legalDocuments.ts
$slugToDocumentId = ['privacy' => 'privacy', 'personal-data' => 'consent', 'offer' => 'offer'];

$existingPath = __DIR__ . '/../legal-versions.json';
$existing = is_file($existingPath) ? json_decode((string)file_get_contents($existingPath), true) : [];

$report = [];
foreach ($snapshot['pages'] ?? [] as $page) {
    $slug = $page['slug'];
    if (!isset($slugToDocumentId[$slug])) {
        continue;
    }
    $documentId = $slugToDocumentId[$slug];
    $text = canonicalText($page);
    $sha256 = sha256Text($text);
    $committed = $existing[$documentId] ?? null;
    $report[$slug] = [
        'documentId' => $documentId,
        'sourceUrl' => $page['sourceUrl'] ?? null,
        'capturedAt' => $snapshot['sourceCheckedAt'] ?? null,
        'provenance' => $page['provenance'] ?? null,
        'sha256' => $sha256,
        'textLength' => mb_strlen($text),
        'committedInLegalVersionsJson' => $committed,
        'matchesCommitted' => $committed !== null && ($committed['sha256'] ?? null) === $sha256,
    ];
}

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), "\n";
