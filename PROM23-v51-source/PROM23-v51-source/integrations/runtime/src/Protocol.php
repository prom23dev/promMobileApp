<?php
declare(strict_types=1);
namespace Prom23\Runtime;

final class RuntimeExceptionCode extends \RuntimeException {
    public function __construct(string $code, public int $status = 503, public array $fields = [], public ?int $retryAfterSeconds = null) { parent::__construct($code); }
}
final class Protocol {
    public const VERSION = 'prom23-runtime-v1';
    public static function decode(string $body, array $headers, string $path, string $key, int $now): array {
        if (strlen($body) > 131072) throw new RuntimeExceptionCode('BODY_TOO_LARGE', 413);
        $time = $headers['x-prom23-timestamp'] ?? ''; $nonce = $headers['x-prom23-nonce'] ?? '';
        $signature = $headers['x-prom23-signature'] ?? '';
        if (!preg_match('/^[a-f0-9]{64}$/iD', $key) || !preg_match('/^[0-9]{10}$/D', $time) || abs($now - (int)$time) > 60 ||
            !preg_match('/^[a-f0-9]{48}$/D', $nonce) || !preg_match('/^[a-f0-9]{64}$/D', $signature) ||
            !hash_equals(hash_hmac('sha256', "POST\n{$path}\n{$time}\n{$nonce}\n" . hash('sha256', $body), $key), $signature)) throw new RuntimeExceptionCode('FORBIDDEN', 403);
        try { $request = json_decode($body, true, 32, JSON_THROW_ON_ERROR); } catch (\Throwable $e) { throw new RuntimeExceptionCode('INVALID_JSON', 400); }
        if (!is_array($request) || ($request['protocol'] ?? '') !== self::VERSION || ($request['requestId'] ?? '') !== $nonce ||
            !preg_match('/^[a-z.]{1,60}$/D', $request['operation'] ?? '') || !is_array($request['payload'] ?? null) ||
            !preg_match('/^[a-f0-9]{64}$/D', $request['payload']['sessionKey'] ?? '') || array_intersect(['actor','userId','permissions','authenticated'], array_keys($request['payload']))) throw new RuntimeExceptionCode('INVALID_BODY', 400);
        $idempotency = $request['idempotencyKey'] ?? null;
        if ($idempotency !== ($headers['idempotency-key'] ?? null) || ($idempotency !== null && !preg_match('/^[A-Za-z0-9_-]{8,128}$/D', $idempotency))) throw new RuntimeExceptionCode('IDEMPOTENCY_CONFLICT', 409);
        return $request;
    }
    public static function activeUser(array $value): void {
        if (!array_key_exists('UF_DELETE_ACCOUNT_BY_USER', $value)) throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        if (($value['ACTIVE'] ?? '') !== 'Y' || !empty($value['UF_DELETE_ACCOUNT_BY_USER'])) throw new RuntimeExceptionCode('AUTH_EXPIRED', 401);
    }
}

/** Private SQLite is bounded and survives process restarts. No request values/PII stored. */
final class RequestLedger {
    private \PDO $db;
    public function __construct(string $path) {
        if (is_link($path) || !is_dir(dirname($path)) || (fileperms(dirname($path)) & 0077)) throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        $this->db = new \PDO('sqlite:' . $path, null, null, [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
        chmod($path, 0600);
        $this->db->exec('PRAGMA busy_timeout=5000; PRAGMA max_page_count=8192; CREATE TABLE IF NOT EXISTS nonces(nonce TEXT PRIMARY KEY,expires INTEGER); CREATE TABLE IF NOT EXISTS requests(scope TEXT PRIMARY KEY, hash TEXT, status TEXT, result TEXT, created INTEGER)');
    }
    public function nonce(string $nonce, int $now): void {
        $this->db->prepare('DELETE FROM nonces WHERE expires < ?')->execute([$now]);
        if ((int)$this->db->query('SELECT count(*) FROM nonces')->fetchColumn() >= 10000) throw new RuntimeExceptionCode('RATE_LIMITED', 429);
        try { $this->db->prepare('INSERT INTO nonces VALUES (?,?)')->execute([$nonce, $now + 120]); }
        catch (\PDOException $e) { throw new RuntimeExceptionCode('FORBIDDEN', 403); }
    }
    public function pdo(): \PDO { return $this->db; }
    public function begin(array $request): ?array {
        if (!isset($request['idempotencyKey'])) return null;
        $scope = hash('sha256', $request['payload']['sessionKey'] . "\n" . $request['operation'] . "\n" . $request['idempotencyKey']);
        $hash = hash('sha256', json_encode($request['payload'], JSON_THROW_ON_ERROR));
        $this->db->exec('BEGIN IMMEDIATE');$transaction=true;
        try {
            $statement = $this->db->prepare('SELECT * FROM requests WHERE scope=?'); $statement->execute([$scope]); $row = $statement->fetch(\PDO::FETCH_ASSOC);
            if ($row) {
                $this->db->exec('COMMIT');$transaction=false;
                if (!hash_equals($row['hash'], $hash)) throw new RuntimeExceptionCode('IDEMPOTENCY_CONFLICT', 409);
                if ($row['status'] !== 'complete') throw new RuntimeExceptionCode('RESULT_RECONCILIATION_REQUIRED', 409);
                return json_decode($row['result'], true, 32, JSON_THROW_ON_ERROR);
            }
            if ((int)$this->db->query('SELECT count(*) FROM requests')->fetchColumn() >= 100000) throw new RuntimeExceptionCode('RATE_LIMITED', 429);
            $this->db->prepare('INSERT INTO requests VALUES (?,?,?,?,?)')->execute([$scope, $hash, 'pending', null, time()]);
            $this->db->exec('COMMIT');$transaction=false; return null;
        } catch (\Throwable $e) { if ($transaction) $this->db->exec('ROLLBACK'); throw $e; }
    }
    public function complete(array $request, array $result): void {
        if (!isset($request['idempotencyKey'])) return;
        $scope = hash('sha256', $request['payload']['sessionKey'] . "\n" . $request['operation'] . "\n" . $request['idempotencyKey']);
        $encoded = json_encode($result, JSON_THROW_ON_ERROR);
        if (strlen($encoded) > 16384) throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        $this->db->prepare('UPDATE requests SET status=?, result=? WHERE scope=? AND status=?')->execute(['complete', $encoded, $scope, 'pending']);
    }
}
