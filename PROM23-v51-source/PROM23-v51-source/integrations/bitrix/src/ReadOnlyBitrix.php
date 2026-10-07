<?php
declare(strict_types=1);

namespace Prom23\MobileBridge;

/** Uses existing read-only Bitrix APIs; never calls Order::save(), CRM webhooks, agents or payment initiation. */
final class ReadOnlyBitrix
{
    public function run(array $request): array
    {
        $result = ['protocol' => Bridge::PROTOCOL, 'operation' => $request['operation'], 'writeEnabled' => false];
        if ($request['operation'] === 'readiness') return $result + $this->readiness();
        $actor = $request['actor'];
        $this->assertActorActive($actor);
        $result['actor'] = $actor;
        switch ($request['operation']) {
            case 'order.export': return $result + ['order' => $this->exportOrder($this->ownedOrder($actor, $request['orderId']))];
            case 'documents.manifest': return $result + ['documents' => $this->documents($actor, $request['orderId']), 'downloadEnabled' => false];
            case 'notifications.export': return $result + ['notifications' => $this->notifications($actor), 'marksRead' => false];
            case 'preferences.export': return $result + ['preferences' => $this->preferences($actor)];
        }
        throw new BridgeException('BITRIX_WRITE_NOT_READY');
    }

    private function modules(): void
    {
        foreach (['sale', 'iblock', 'highloadblock'] as $module) if (!\Bitrix\Main\Loader::includeModule($module)) throw new BridgeException('BITRIX_MODULE_MISSING');
    }

    private function readiness(): array
    {
        $this->modules();
        $connection = \Bitrix\Main\Application::getConnection();
        $reachable = (string)$connection->queryScalar('SELECT 1') === '1';
        // config() only reads the reviewed settings array. It does not resolve HL entities or log errors.
        $documentSettingsAvailable = class_exists('Prom\\Documents1C') && is_readable($_SERVER['DOCUMENT_ROOT'] . '/local/php_interface/include/documents1c.php');
        $documentConfig = $documentSettingsAvailable ? \Prom\Documents1C::config() : [];
        $agent = \CAgent::GetList([], ['NAME' => '\\Prom\\Documents1C::agent();'])->Fetch();
        $eventNames = [];
        foreach (GetModuleEvents('sale', 'OnSaleOrderSaved', true) as $entry) {
            $name = $entry['TO_NAME'] ?? $entry['CALLBACK'] ?? '';
            if (is_string($name) && preg_match('/^[A-Za-z0-9_\\\\:]{1,160}$/D', $name)) $eventNames[] = $name;
        }
        return ['runtimeConnected' => $reachable, 'readExportsEnabled' => $reachable,
            'existingOrderSavedHandlers' => array_values(array_unique($eventNames)),
            'bitrix24' => ['configured' => defined('WEBHOOK_URL_B24') && is_string(WEBHOOK_URL_B24) && trim(WEBHOOK_URL_B24) !== '', 'deliveryTested' => false],
            'oneC' => ['documentsClassAvailable' => class_exists('Prom\\Documents1C'), 'settingsAvailable' => $documentSettingsAvailable, 'agentRegistered' => (bool)$agent,
                'agentActive' => $agent && $agent['ACTIVE'] === 'Y', 'enabled' => !empty($documentConfig['ENABLED']),
                'tlsVerification' => !empty($documentConfig['SSL_VERIFY']), 'credentialsConfigured' => !empty($documentConfig['LOGIN']) && !empty($documentConfig['PASSWORD']),
                'documentFetchTested' => false, 'orderExchangeTested' => false],
            'blockedWrites' => ['order.create', 'payment.start', 'crm.create', 'one-c.run', 'notifications.mark-read', 'preferences.update', 'push.send'],
            'reasons' => ['CHECKOUT_COMPONENT_EVENTS_NOT_VERIFIED', 'CRM_TRANSPORT_REVIEW_REQUIRED', 'MOBILE_IDENTITY_BINDING_REQUIRED', 'PAYMENT_AND_1C_ACCEPTANCE_REQUIRED']];
    }

    private function assertActorActive(array $actor): void
    {
        $this->modules();
        $by = 'id'; $direction = 'asc';
        // Explicit UF selection avoids relying on a core-specific default GetByID projection.
        $user = \CUser::GetList($by, $direction, ['ID' => $actor['userId']], [
            'FIELDS' => ['ID', 'ACTIVE'], 'SELECT' => ['UF_DELETE_ACCOUNT_BY_USER'], 'NAV_PARAMS' => ['nTopCount' => 1],
        ])->Fetch();
        Bridge::assertUserActive($user);
        if ((int)($user['ID'] ?? 0) !== $actor['userId']) throw new BridgeException('PILOT_USER_NOT_ALLOWED', 403);
        if ($actor['organizationId'] > 0 && !$this->liveMembership($actor)) throw new BridgeException('PILOT_USER_NOT_ALLOWED', 403);
    }

    private function liveMembership(array $actor): bool
    {
        if ($actor['organizationId'] === 0) return true;
        if (!defined('IBLOCK_ID_ORGANIZATIONS')) throw new BridgeException('BITRIX_SCHEMA_MISSING');
        // Same schema/filter as Organization::checkUserInOrganization, without its 24-hour membership cache.
        return (bool)\CIBlockElement::GetList([], ['IBLOCK_ID' => IBLOCK_ID_ORGANIZATIONS, 'ID' => $actor['organizationId'], 'ACTIVE' => 'Y', 'PROPERTY_USER_IDS' => $actor['userId']], false, ['nTopCount' => 1], ['ID'])->Fetch();
    }

    private function ownedOrder(array $actor, int $orderId)
    {
        $order = \Bitrix\Sale\Order::load($orderId);
        if (!$order) throw new BridgeException('ORDER_NOT_FOUND', 404);
        $organizationId = (int)\Prom\Model\Order::getOrderOrganizationId($orderId);
        Bridge::assertOrderScope($actor, (int)$order->getUserId(), $organizationId, (int)$order->getPersonTypeId(), $this->liveMembership($actor));
        return $order;
    }

    private function exportOrder($order): array
    {
        if ($order->getCurrency() !== 'RUB') throw new BridgeException('UNSUPPORTED_SOURCE_CURRENCY');
        $items = [];
        foreach ($order->getBasket() as $item) {
            if (count($items) >= 200) throw new BridgeException('SOURCE_EXPORT_TOO_LARGE');
            $quantity = (float)$item->getQuantity();
            if (!is_finite($quantity) || $quantity <= 0) throw new BridgeException('INVALID_SOURCE_QUANTITY');
            $items[] = ['productId' => (string)$item->getField('PRODUCT_ID'), 'name' => Bridge::text($item->getField('NAME'), 500),
                'quantity' => $quantity, 'unitPriceKopecks' => Bridge::kopecks($item->getPrice())];
        }
        $article = $order->getPropertyCollection()->getItemByOrderPropertyCode('ARTICLE');
        $pairs = $article ? json_decode((string)$article->getValue(), true) : [];
        $articlePairs = [];
        if (is_array($pairs)) foreach (array_slice($pairs, 0, 200) as $pair) if (is_array($pair)) $articlePairs[] = ['code' => Bridge::text($pair['code'] ?? '', 100), 'article' => Bridge::text($pair['article'] ?? '', 100)];
        return ['id' => (string)$order->getId(), 'number' => Bridge::text($order->getField('ACCOUNT_NUMBER'), 100),
            'personTypeId' => (int)$order->getPersonTypeId(), 'status' => Bridge::text($order->getField('STATUS_ID'), 30),
            'paid' => $order->getField('PAYED') === 'Y', 'cancelled' => $order->getField('CANCELED') === 'Y',
            'currency' => 'RUB', 'totalKopecks' => Bridge::kopecks($order->getPrice()), 'items' => $items, 'articlePairs' => $articlePairs,
            'crmDeliveryConfirmed' => false, 'oneCOrderExchangeConfirmed' => false];
    }

    private function documents(array $actor, int $orderId): array
    {
        $this->ownedOrder($actor, $orderId);
        if ($actor['organizationId'] <= 0) throw new BridgeException('ORGANIZATION_CONTEXT_REQUIRED', 409);
        if (!class_exists('Prom\\Documents1C') || !is_readable($_SERVER['DOCUMENT_ROOT'] . '/local/php_interface/include/documents1c.php')) throw new BridgeException('BITRIX_SCHEMA_MISSING');
        $types = (array)(\Prom\Documents1C::config()['TYPES'] ?? []);
        // Do NOT call Documents1C::getOrderDocumentLink/getEntityClass: missing HL schema invokes its file logger.
        return DocumentManifest::read($orderId, array_slice($types, 0, 20, true), defined('HLBL_ID_ORDER_DOCUMENTS') ? (int)HLBL_ID_ORDER_DOCUMENTS : null,
            static function (int $id): ?array {
                $block = \Bitrix\Highloadblock\HighloadBlockTable::getById($id)->fetch();
                if (!$block) return null;
                $entity = \Bitrix\Highloadblock\HighloadBlockTable::compileEntity($block);
                return ['dataClass' => $entity->getDataClass(), 'fields' => array_keys($entity->getFields())];
            },
            static function (array $schema, int $id): iterable {
                $dataClass = $schema['dataClass'];
                $rows = $dataClass::getList(['select' => ['ID', 'UF_ORDER_ID', 'UF_TYPE', 'UF_LINK'],
                    'filter' => ['=UF_ORDER_ID' => $id], 'order' => ['ID' => 'DESC'], 'limit' => 201]);
                while ($row = $rows->fetch()) yield $row;
            },
            static function (string $link): bool {
                $upload = realpath($_SERVER['DOCUMENT_ROOT'] . '/upload');
                $file = realpath($_SERVER['DOCUMENT_ROOT'] . $link);
                return $upload && $file && str_starts_with($file, $upload . DIRECTORY_SEPARATOR) && is_file($file);
            }
        );
    }

    private function notifications(array $actor): array
    {
        $filter = ['=USER_ID' => $actor['userId']];
        if ($actor['organizationId'] > 0) $filter['=ORGANIZATION_ID'] = $actor['organizationId'];
        else $filter[] = ['LOGIC' => 'OR', ['=ORGANIZATION_ID' => 0], ['=ORGANIZATION_ID' => null]];
        // Do NOT use UserNotifications::getUserNotifications: it marks records read and saves them.
        $rows = \Prom\Model\EO\UserNotificationsTable::getList(['select' => ['ID', 'USER_ID', 'ORGANIZATION_ID', 'MESSAGE', 'SHOW_NOTIFICATION', 'CREATED_AT'], 'filter' => $filter, 'order' => ['ID' => 'DESC'], 'limit' => 10]);
        $items = [];
        while ($row = $rows->fetch()) {
            if ((int)$row['USER_ID'] !== $actor['userId'] || (int)$row['ORGANIZATION_ID'] !== $actor['organizationId']) throw new BridgeException('SOURCE_CONTEXT_MISMATCH');
            $items[] = ['id' => (string)$row['ID'], 'message' => Bridge::text($row['MESSAGE']),
                'read' => in_array($row['SHOW_NOTIFICATION'], [true, 1, '1', 'Y'], true),
                'createdAt' => $row['CREATED_AT'] instanceof \Bitrix\Main\Type\DateTime ? gmdate('c', $row['CREATED_AT']->getTimestamp()) : null,
                'kind' => 'legacy', 'target' => null];
        }
        return $items;
    }

    private function preferences(array $actor): array
    {
        $user = \CUser::GetByID($actor['userId'])->Fetch();
        $enabled = static fn($value): bool => in_array($value, [true, 1, '1', 'Y'], true);
        return ['email' => ['transactional' => $enabled($user['UF_EMAIL_INFORM'] ?? false), 'marketing' => $enabled($user['UF_EMAIL_MARKETING'] ?? false)],
            'sms' => ['transactional' => $enabled($user['UF_SMS_INFORM'] ?? false), 'marketing' => $enabled($user['UF_SMS_MARKETING'] ?? false)],
            'push' => ['configured' => false, 'transactional' => null, 'marketing' => null]];
    }
}
