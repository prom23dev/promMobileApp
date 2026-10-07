<?php
declare(strict_types=1);

namespace Prom23\MobileBridge;

/** Pure manifest projection with injected read-only schema/row access; never invokes source document getters. */
final class DocumentManifest
{
    public static function read(int $orderId, array $types, ?int $hlBlockId, callable $schemaReader, callable $rowReader, callable $fileExists): array
    {
        if ($hlBlockId === null || $hlBlockId <= 0) throw new BridgeException('BITRIX_SCHEMA_MISSING');
        try {
            $schema = $schemaReader($hlBlockId);
            if (!is_array($schema) || !isset($schema['fields']) || !is_array($schema['fields']) ||
                array_diff(['ID', 'UF_ORDER_ID', 'UF_TYPE', 'UF_LINK'], $schema['fields'])) throw new BridgeException('BITRIX_SCHEMA_MISSING');
            $rows = $rowReader($schema, $orderId);
            $manifest = []; $seen = []; $count = 0;
            foreach ($rows as $row) {
                if (++$count > 200) throw new BridgeException('SOURCE_EXPORT_TOO_LARGE');
                if (!is_array($row) || (int)($row['UF_ORDER_ID'] ?? 0) !== $orderId) throw new BridgeException('SOURCE_CONTEXT_MISMATCH');
                $typeId = (int)($row['UF_TYPE'] ?? 0);
                $type = $types[$typeId] ?? null;
                if (!is_array($type) || isset($seen[$typeId])) continue;
                // Source getOrderDocumentLink uses the latest row even when its link is missing/invalid.
                $seen[$typeId] = true;
                $code = (string)($type['CODE'] ?? '');
                $link = trim((string)($row['UF_LINK'] ?? ''));
                if (!preg_match('/^[a-zA-Z0-9_-]{1,40}$/D', $code) || !str_starts_with($link, '/upload/') ||
                    str_contains($link, "\0") || str_contains($link, '\\') || preg_match('#(?:^|/)\.\.(?:/|$)#', $link)) continue;
                if ($fileExists($link)) $manifest[] = ['typeId' => $typeId, 'type' => $code,
                    'name' => Bridge::text($type['NAME'] ?? 'Документ', 100), 'available' => true];
            }
            return $manifest;
        } catch (BridgeException $error) { throw $error; }
        catch (\Throwable $error) {
            // Do not call Documents1C::log and do not expose SDK/SQL/path details.
            throw new BridgeException('BITRIX_READ_UNAVAILABLE');
        }
    }
}
