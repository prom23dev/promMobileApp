<?php
declare(strict_types=1);
/**
 * Offline CMS sync — run on an isolated/staging Bitrix instance (never
 * against prom23.ru directly), never invoked per public request. Reads the
 * configured slugs via CmsContentDriver (read-only) and writes a
 * live-snapshot JSON + manifest pair, in the same shape
 * server/integrations/public-content.mjs already expects from
 * data/site-pages.json, plus a per-page 'provenance' field.
 *
 * Usage: php cms-sync.php cms-sync.config.php out/site-pages.live.json
 *
 * Deploy the two output files (site-pages.live.json +
 * site-pages.live.manifest.json) outside the web root, mode 0600, and point
 * the BFF at them via createPublicContentService({liveSnapshotPath, liveSlugs}).
 * See docs/parity/runtime-cms.md for the enable-one-slug-at-a-time rollout.
 */
require_once __DIR__.'/src/Protocol.php';
require_once __DIR__.'/src/CmsContentDriver.php';

[$configPath, $outPath] = [$argv[1] ?? null, $argv[2] ?? null];
if (!$configPath || !$outPath) { fwrite(STDERR, "usage: php cms-sync.php <config.php> <out.json>\n"); exit(1); }
$config = require $configPath;
if (!is_array($config) || !isset($config['pages']) || !isset($config['siteRoot'])) { fwrite(STDERR, "invalid config\n"); exit(1); }
$siteRoot = rtrim($config['siteRoot'], '/');
// Bitrix's autoloader (lib/loader.php) resolves module paths via
// $_SERVER['DOCUMENT_ROOT'], which is unset under CLI — without this the
// bootstrap fails on the very first autoloaded class (loc.php not found).
$_SERVER['DOCUMENT_ROOT'] = $siteRoot;
chdir($siteRoot);
require_once $siteRoot.'/bitrix/modules/main/include/prolog_before.php';

$driver = new \Prom23\Runtime\CmsContentDriver($config);
$pages = [];
$errors = [];
foreach (array_keys($config['pages']) as $slug) {
    try {
        $page = $driver->page($slug);
        $pages[] = $page;
    } catch (\Throwable $e) {
        // A bad/missing single slug must not block syncing the rest. The
        // previous live snapshot (or curated fallback) keeps serving that
        // slug until this is fixed and re-run.
        $errors[$slug] = $e instanceof \Prom23\Runtime\RuntimeExceptionCode ? $e->getMessage() : 'UNEXPECTED_ERROR';
    }
}

$sourceCheckedAt = gmdate('Y-m-d');
$snapshot = ['schemaVersion' => 1, 'sourceCheckedAt' => $sourceCheckedAt, 'sourceFile' => 'integrations/runtime/cms-sync.php', 'mode' => 'live-cms', 'pages' => $pages];
$manifest = ['generatedAt' => gmdate('c'), 'slugCount' => count($pages), 'requestedSlugs' => array_keys($config['pages']), 'errors' => $errors];

file_put_contents($outPath, json_encode($snapshot, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n");
file_put_contents(preg_replace('/\.json$/', '.manifest.json', $outPath), json_encode($manifest, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)."\n");

fwrite(STDOUT, sprintf("Synced %d/%d pages.%s\n", count($pages), count($config['pages']), $errors ? ' Failed: '.implode(', ', array_keys($errors)) : ''));
exit($errors ? 1 : 0);
