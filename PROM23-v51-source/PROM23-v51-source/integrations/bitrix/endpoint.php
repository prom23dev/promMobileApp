<?php
declare(strict_types=1);

use Prom23\MobileBridge\Bridge;
use Prom23\MobileBridge\BridgeException;
use Prom23\MobileBridge\ReadOnlyBitrix;

// Install manually ONLY on the shop's isolated Bitrix staging after reviewing its bootstrap/init.
// This file must never be installed into the independent UAV site's document root.
require_once __DIR__ . '/src/Bridge.php';
require_once __DIR__ . '/src/DocumentManifest.php';
require_once __DIR__ . '/src/ReadOnlyBitrix.php';
ini_set('display_errors', '0');
umask(0077);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');

try {
    if (getenv('PROM23_BRIDGE_ENABLED') !== '1') throw new BridgeException('BITRIX_NOT_CONFIGURED');
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') throw new BridgeException('METHOD_NOT_ALLOWED', 405);
    if (($_SERVER['REQUEST_URI'] ?? '') !== '/local/prom23-mobile/endpoint.php') throw new BridgeException('BRIDGE_URL_INVALID', 400);
    if (isset($_SERVER['HTTP_ORIGIN']) || isset($_SERVER['HTTP_COOKIE'])) throw new BridgeException('SERVER_TO_SERVER_ONLY', 403);
    if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') throw new BridgeException('JSON_REQUIRED', 415);
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 32768 || isset($_SERVER['HTTP_CONTENT_ENCODING'])) throw new BridgeException('BODY_TOO_LARGE', 413);
    $body = file_get_contents('php://input', false, null, 0, 32769);
    if ($body === false || strlen($body) > 32768) throw new BridgeException('BODY_TOO_LARGE', 413);
    $root = realpath($_SERVER['DOCUMENT_ROOT'] ?? '');
    $keyPath = getenv('PROM23_BRIDGE_KEY_FILE') ?: '';
    $realKey = realpath($keyPath);
    $nonceDirectory = getenv('PROM23_BRIDGE_NONCE_DIR') ?: '';
    $realNonce = realpath($nonceDirectory);
    if (!$root || !$realKey || !$realNonce || $realNonce === $root || str_starts_with($realKey, $root . DIRECTORY_SEPARATOR) || str_starts_with($realNonce, $root . DIRECTORY_SEPARATOR) ||
        is_link($keyPath) || !is_file($realKey) || filesize($realKey) > 256 || (fileperms($realKey) & 0077) !== 0) throw new BridgeException('BRIDGE_PRIVATE_STORAGE_REQUIRED');
    $key = trim((string)file_get_contents($realKey));
    $headers = [];
    foreach (['KEY_ID', 'TIMESTAMP', 'NONCE', 'SIGNATURE'] as $field) $headers['x-prom23-' . strtolower(str_replace('_', '-', $field))] = $_SERVER['HTTP_X_PROM23_' . $field] ?? '';
    $nonce = Bridge::authenticate($headers, $body, '/local/prom23-mobile/endpoint.php', $key, getenv('PROM23_BRIDGE_KEY_ID') ?: '', time());
    Bridge::consumeNonce($nonceDirectory, $nonce, time());
    $allowed = array_filter(explode(',', getenv('PROM23_BRIDGE_ALLOWED_USER_IDS') ?: ''), static fn($value): bool => preg_match('/^[1-9][0-9]{0,9}$/D', trim($value)) === 1);
    $request = Bridge::request($body, array_map('intval', $allowed));
    $bootstrap = $root . '/bitrix/modules/main/include/prolog_before.php';
    if (!is_file($bootstrap)) throw new BridgeException('BITRIX_CORE_MISSING');
    // Suppress scheduled agents/statistics during this business-data read. Never authorize/switch a browser user.
    foreach (['NO_AGENT_CHECK', 'NO_KEEP_STATISTIC', 'STOP_STATISTICS', 'NO_AGENT_STATISTIC'] as $flag) if (!defined($flag)) define($flag, true);
    ob_start();
    require_once $bootstrap;
    ob_end_clean();
    $result = (new ReadOnlyBitrix())->run($request);
    if ($request['operation'] === 'readiness') {
        $result['pilotUserCount'] = count($allowed);
        $result['readExportsEnabled'] = $result['runtimeConnected'] && count($allowed) > 0;
    }
    echo json_encode(['data' => $result], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
} catch (BridgeException $error) {
    while (ob_get_level() > 0) ob_end_clean();
    http_response_code($error->httpStatus);
    echo json_encode(['error' => ['code' => $error->getMessage(), 'message' => 'Операция интеграции недоступна.']], JSON_UNESCAPED_UNICODE);
} catch (Throwable $error) {
    while (ob_get_level() > 0) ob_end_clean();
    http_response_code(503);
    // Do not expose or log exception text: Bitrix failures may embed SQL, personal data or credentials.
    echo '{"error":{"code":"BITRIX_READ_UNAVAILABLE","message":"Чтение данных магазина пока недоступно."}}';
}
