<?php
declare(strict_types=1);
require_once __DIR__ . '/../src/Bridge.php';
require_once __DIR__ . '/../src/DocumentManifest.php';
use Prom23\MobileBridge\Bridge;
use Prom23\MobileBridge\BridgeException;
use Prom23\MobileBridge\DocumentManifest;

$count = 0;
function check(bool $value, string $name): void { global $count; if (!$value) throw new RuntimeException($name); $count++; }
function rejects(callable $fn, string $code): void { try { $fn(); } catch (BridgeException $e) { check($e->getMessage() === $code, $code); return; } throw new RuntimeException('Expected ' . $code); }
$key = str_repeat('a', 64); // Synthetic key, never real credentials.
$body = '{"operation":"readiness"}';
$target = '/local/prom23-mobile/endpoint.php';
$timestamp = '1789113600';
$nonce = str_repeat('b', 32);
$headers = ['x-prom23-key-id' => 'test', 'x-prom23-timestamp' => $timestamp, 'x-prom23-nonce' => $nonce,
    'x-prom23-signature' => hash_hmac('sha256', "POST\n{$target}\n{$timestamp}\n{$nonce}\n" . hash('sha256', $body), $key)];
check(Bridge::authenticate($headers, $body, $target, $key, 'test', (int)$timestamp) === $nonce, 'signed request');
rejects(fn() => Bridge::authenticate($headers, $body . ' ', $target, $key, 'test', (int)$timestamp), 'BRIDGE_UNAUTHORIZED');
rejects(fn() => Bridge::authenticate($headers, $body, $target, $key, 'test', (int)$timestamp + 61), 'BRIDGE_UNAUTHORIZED');
rejects(fn() => Bridge::request('{"operation":"order.create"}', [12]), 'BITRIX_WRITE_NOT_READY');
rejects(fn() => Bridge::request('{"operation":"order.export","actor":{"userId":99,"organizationId":3},"orderId":10}', [12]), 'PILOT_USER_NOT_ALLOWED');
$request = Bridge::request('{"operation":"order.export","actor":{"userId":12,"organizationId":3},"orderId":10}', [12]);
check($request['actor']['organizationId'] === 3, 'typed actor');
foreach ([false, null, [], ['ACTIVE' => 'N'], ['ACTIVE' => 'Y', 'UF_DELETE_ACCOUNT_BY_USER' => true],
    ['ACTIVE' => 'Y', 'UF_DELETE_ACCOUNT_BY_USER' => 1], ['ACTIVE' => 'Y', 'UF_DELETE_ACCOUNT_BY_USER' => '1']] as $blockedUser) {
    rejects(fn() => Bridge::assertUserActive($blockedUser), 'PILOT_USER_NOT_ALLOWED');
}
foreach ([false, 0, '0', '', null] as $clearFlag) {
    Bridge::assertUserActive(['ACTIVE' => 'Y', 'UF_DELETE_ACCOUNT_BY_USER' => $clearFlag]);
    check(true, 'active user with clear deletion flag');
}
rejects(fn() => Bridge::assertUserActive(['ACTIVE' => 'Y']), 'BITRIX_SCHEMA_MISSING');
Bridge::assertOrderScope($request['actor'], 12, 3, 2, true); check(true, 'owner/context allowed');
rejects(fn() => Bridge::assertOrderScope($request['actor'], 99, 3, 2, true), 'ORDER_NOT_FOUND');
rejects(fn() => Bridge::assertOrderScope($request['actor'], 12, 4, 2, true), 'ORDER_NOT_FOUND');
rejects(fn() => Bridge::assertOrderScope($request['actor'], 12, 3, 2, false), 'ORDER_NOT_FOUND');
rejects(fn() => Bridge::assertOrderScope(['userId' => 12, 'organizationId' => 0], 12, 0, 2, true), 'ORDER_CONTEXT_UNRESOLVED');
check(Bridge::kopecks('100.05') === 10005, 'exact kopecks');
check(Bridge::kopecks('0') === 0, 'zero price');
rejects(fn() => Bridge::kopecks('-1'), 'INVALID_SOURCE_MONEY');
rejects(fn() => Bridge::kopecks('1.001'), 'INVALID_SOURCE_MONEY');
$directory = sys_get_temp_dir() . '/prom23-bridge-' . bin2hex(random_bytes(8));
mkdir($directory, 0700);
try {
    Bridge::consumeNonce($directory, $nonce, time()); check(true, 'nonce first use');
    rejects(fn() => Bridge::consumeNonce($directory, $nonce, time()), 'BRIDGE_REPLAY');
} finally { foreach (glob($directory . '/*') ?: [] as $file) unlink($file); rmdir($directory); }

$rowCalls = 0; $fileCalls = 0;
$schema = ['fields' => ['ID', 'UF_ORDER_ID', 'UF_TYPE', 'UF_LINK']];
$types = [1 => ['CODE' => 'invoice', 'NAME' => 'Invoice']];
$loadRows = static function ($schema, $id) use (&$rowCalls): array { $rowCalls++; return [['ID' => 1, 'UF_ORDER_ID' => $id, 'UF_TYPE' => 1, 'UF_LINK' => '/upload/order/invoice.pdf']]; };
$fileExists = static function ($link) use (&$fileCalls): bool { $fileCalls++; return true; };
rejects(fn() => DocumentManifest::read(10, $types, null, fn($id) => $schema, $loadRows, $fileExists), 'BITRIX_SCHEMA_MISSING');
rejects(fn() => DocumentManifest::read(10, $types, 1, fn($id) => null, $loadRows, $fileExists), 'BITRIX_SCHEMA_MISSING');
rejects(fn() => DocumentManifest::read(10, $types, 1, fn($id) => ['fields' => ['ID']], $loadRows, $fileExists), 'BITRIX_SCHEMA_MISSING');
check($rowCalls === 0 && $fileCalls === 0, 'missing HL/fields fails before row/file access, without source logger');
rejects(fn() => DocumentManifest::read(10, $types, 1, fn($id) => $schema, fn($schema, $id) => [['ID' => 1, 'UF_ORDER_ID' => 99]], $fileExists), 'SOURCE_CONTEXT_MISMATCH');
rejects(fn() => DocumentManifest::read(10, $types, 1, function ($id) { throw new RuntimeException('private SQL details'); }, $loadRows, $fileExists), 'BITRIX_READ_UNAVAILABLE');
$manifest = DocumentManifest::read(10, $types, 1, fn($id) => $schema, $loadRows, $fileExists);
check(count($manifest) === 1 && $manifest[0]['type'] === 'invoice' && !isset($manifest[0]['link']), 'direct HL manifest never exposes UF_LINK');
$outside = DocumentManifest::read(10, $types, 1, fn($id) => $schema, fn($schema, $id) => [['UF_ORDER_ID' => 10, 'UF_TYPE' => 1, 'UF_LINK' => '/upload/../private.key']], $fileExists);
check($outside === [], 'manifest refuses path traversal');
$stale = DocumentManifest::read(10, $types, 1, fn($id) => $schema, fn($schema, $id) => [
    ['ID' => 2, 'UF_ORDER_ID' => 10, 'UF_TYPE' => 1, 'UF_LINK' => '/upload/missing.pdf'],
    ['ID' => 1, 'UF_ORDER_ID' => 10, 'UF_TYPE' => 1, 'UF_LINK' => '/upload/older.pdf'],
], fn($link) => $link === '/upload/older.pdf');
check($stale === [], 'missing newest document never falls back to older record');
$invalidLatest = DocumentManifest::read(10, $types, 1, fn($id) => $schema, fn($schema, $id) => [
    ['ID' => 2, 'UF_ORDER_ID' => 10, 'UF_TYPE' => 1, 'UF_LINK' => ''],
    ['ID' => 1, 'UF_ORDER_ID' => 10, 'UF_TYPE' => 1, 'UF_LINK' => '/upload/older.pdf'],
], $fileExists);
check($invalidLatest === [], 'invalid newest link never falls back to older record');
echo "PHP policy tests passed: {$count}\n";
