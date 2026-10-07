<?php
declare(strict_types=1);

// Stubs only: this test never loads the archive, Bitrix core, a database or a network client.
namespace Bitrix\Main {
    final class Loader { public static function includeModule($name): bool { return true; } }
}
namespace {
    final class CUser {
        public static $row = false;
        public static int $reads = 0;
        public static function GetList(&$by, &$direction, $filter, $options): self {
            if ($filter !== ['ID' => 12] || ($options['SELECT'] ?? []) !== ['UF_DELETE_ACCOUNT_BY_USER'] ||
                ($options['FIELDS'] ?? []) !== ['ID', 'ACTIVE']) throw new \RuntimeException('Explicit revocation projection is required');
            self::$reads++; return new self();
        }
        public function Fetch() { return self::$row; }
    }
    require_once __DIR__ . '/../src/Bridge.php';
    require_once __DIR__ . '/../src/ReadOnlyBitrix.php';
    $count = 0;
    $bridge = new \Prom23\MobileBridge\ReadOnlyBitrix();
    foreach ([false, ['ACTIVE' => 'N'], ['ACTIVE' => 'Y', 'UF_DELETE_ACCOUNT_BY_USER' => true],
        ['ACTIVE' => 'Y', 'UF_DELETE_ACCOUNT_BY_USER' => '1']] as $user) {
        CUser::$row = $user;
        foreach (['order.export', 'documents.manifest', 'notifications.export', 'preferences.export'] as $operation) {
            try {
                $bridge->run(['operation' => $operation, 'actor' => ['userId' => 12, 'organizationId' => 3], 'orderId' => 456]);
                throw new \RuntimeException('Rejected user reached an export');
            } catch (\Prom23\MobileBridge\BridgeException $error) {
                if ($error->getMessage() !== 'PILOT_USER_NOT_ALLOWED' || $error->httpStatus !== 403) throw $error;
                $count++;
            }
        }
    }
    CUser::$row = ['ID' => '12', 'ACTIVE' => 'Y'];
    foreach (['order.export', 'documents.manifest', 'notifications.export', 'preferences.export'] as $operation) {
        try {
            $bridge->run(['operation' => $operation, 'actor' => ['userId' => 12, 'organizationId' => 3], 'orderId' => 456]);
            throw new \RuntimeException('Missing revocation field reached an export');
        } catch (\Prom23\MobileBridge\BridgeException $error) {
            if ($error->getMessage() !== 'BITRIX_SCHEMA_MISSING' || $error->httpStatus !== 503) throw $error;
            $count++;
        }
    }
    // No CIBlockElement / Sale / notification stubs exist: reaching any of those would fail the test.
    if (CUser::$reads !== 20) throw new \RuntimeException('Each operation must re-read revocation');
    echo "Read-only export revocation tests passed: {$count}\n";
}
