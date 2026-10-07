<?php
declare(strict_types=1);

namespace Prom23\MobileBridge;

final class BridgeException extends \RuntimeException
{
    public int $httpStatus;
    public function __construct(string $code, int $status = 503) { parent::__construct($code); $this->httpStatus = $status; }
}

/** No Bitrix dependency: request authentication and business scope can be tested independently. */
final class Bridge
{
    public const PROTOCOL = 'prom23-bitrix-readonly-v1';
    public const OPERATIONS = ['readiness', 'order.export', 'documents.manifest', 'notifications.export', 'preferences.export'];

    public static function authenticate(array $headers, string $body, string $target, string $key, string $keyId, int $now): string
    {
        if (strlen($body) > 32768) throw new BridgeException('BODY_TOO_LARGE', 413);
        if (!preg_match('/^[a-f0-9]{64}$/iD', $key) || ($headers['x-prom23-key-id'] ?? '') !== $keyId) throw new BridgeException('BRIDGE_UNAUTHORIZED', 401);
        $timestamp = (string)($headers['x-prom23-timestamp'] ?? '');
        $nonce = (string)($headers['x-prom23-nonce'] ?? '');
        $signature = (string)($headers['x-prom23-signature'] ?? '');
        if (!preg_match('/^[0-9]{10}$/D', $timestamp) || abs($now - (int)$timestamp) > 60 ||
            !preg_match('/^[a-f0-9]{32}$/D', $nonce) || !preg_match('/^[a-f0-9]{64}$/D', $signature)) throw new BridgeException('BRIDGE_UNAUTHORIZED', 401);
        $canonical = "POST\n{$target}\n{$timestamp}\n{$nonce}\n" . hash('sha256', $body);
        if (!hash_equals(hash_hmac('sha256', $canonical, $key), $signature)) throw new BridgeException('BRIDGE_UNAUTHORIZED', 401);
        return $nonce;
    }

    public static function consumeNonce(string $directory, string $nonce, int $now): void
    {
        $real = realpath($directory);
        if (!$real || !is_dir($real) || is_link($directory) || (fileperms($real) & 0077) !== 0) throw new BridgeException('BRIDGE_PRIVATE_STORAGE_REQUIRED');
        $files = glob($real . DIRECTORY_SEPARATOR . '*.nonce') ?: [];
        if (count($files) >= 1000) {
            foreach ($files as $file) if (is_file($file) && filemtime($file) < $now - 120) unlink($file);
            if (count(glob($real . DIRECTORY_SEPARATOR . '*.nonce') ?: []) >= 1000) throw new BridgeException('BRIDGE_RATE_LIMIT', 429);
        }
        $file = @fopen($real . DIRECTORY_SEPARATOR . $nonce . '.nonce', 'x');
        if (!$file) throw new BridgeException('BRIDGE_REPLAY', 409);
        fclose($file);
    }

    public static function request(string $body, array $allowedUserIds): array
    {
        try { $value = json_decode($body, true, 32, JSON_THROW_ON_ERROR); }
        catch (\Throwable $error) { throw new BridgeException('INVALID_JSON', 400); }
        if (!is_array($value) || !isset($value['operation']) || !is_string($value['operation'])) throw new BridgeException('INVALID_BODY', 400);
        $operation = $value['operation'];
        if (!in_array($operation, self::OPERATIONS, true)) throw new BridgeException('BITRIX_WRITE_NOT_READY');
        $keys = $operation === 'readiness' ? ['operation'] : (in_array($operation, ['order.export', 'documents.manifest'], true) ? ['operation', 'actor', 'orderId'] : ['operation', 'actor']);
        if (array_diff(array_keys($value), $keys) || array_diff($keys, array_keys($value))) throw new BridgeException('INVALID_BODY', 400);
        if ($operation !== 'readiness') {
            $actor = $value['actor'];
            if (!is_array($actor) || array_diff(array_keys($actor), ['userId', 'organizationId']) ||
                !isset($actor['userId'], $actor['organizationId']) || !is_int($actor['userId']) || $actor['userId'] <= 0 ||
                !is_int($actor['organizationId']) || $actor['organizationId'] < 0) throw new BridgeException('TRUSTED_ACTOR_REQUIRED', 400);
            if (!in_array($actor['userId'], $allowedUserIds, true)) throw new BridgeException('PILOT_USER_NOT_ALLOWED', 403);
        }
        if (isset($value['orderId']) && (!is_int($value['orderId']) || $value['orderId'] <= 0)) throw new BridgeException('ORDER_ID_REQUIRED', 400);
        return $value;
    }

    public static function assertUserActive($user): void
    {
        // Source login treats UF_DELETE_ACCOUNT_BY_USER as a boolean revocation flag.
        // The source delete action does not change ACTIVE, so both conditions are required.
        if (!is_array($user) || ($user['ACTIVE'] ?? null) !== 'Y' || !empty($user['UF_DELETE_ACCOUNT_BY_USER'])) {
            throw new BridgeException('PILOT_USER_NOT_ALLOWED', 403);
        }
        if (!array_key_exists('UF_DELETE_ACCOUNT_BY_USER', $user)) throw new BridgeException('BITRIX_SCHEMA_MISSING');
    }

    public static function assertOrderScope(array $actor, int $ownerId, int $organizationId, int $personTypeId, bool $liveMembership): void
    {
        if ($ownerId !== $actor['userId'] || $organizationId !== $actor['organizationId'] || ($organizationId > 0 && !$liveMembership)) throw new BridgeException('ORDER_NOT_FOUND', 404);
        // Source event sets ORGANIZATION_ID for PERSON_TYPE_ID=2. Missing property must not become B2C.
        if ($personTypeId === 2 && $organizationId <= 0) throw new BridgeException('ORDER_CONTEXT_UNRESOLVED', 409);
    }

    public static function kopecks($value): int
    {
        $text = (string)$value;
        if (!preg_match('/^(0|[1-9][0-9]{0,10})(?:\.([0-9]{1,2}))?$/D', $text, $match)) throw new BridgeException('INVALID_SOURCE_MONEY');
        return ((int)$match[1] * 100) + (int)str_pad($match[2] ?? '', 2, '0');
    }

    public static function text($value, int $limit = 2000): string
    {
        $text = html_entity_decode(strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", (string)$value)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        return mb_substr($text, 0, $limit, 'UTF-8');
    }
}
