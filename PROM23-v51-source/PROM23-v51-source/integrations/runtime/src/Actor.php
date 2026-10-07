<?php
declare(strict_types=1);
namespace Prom23\Runtime;

final class Actor {
    public static function resolve(array $payload, bool $guestAllowed = false): array {
        global $USER;
        $id = ($USER && $USER->IsAuthorized()) ? (int)$USER->GetID() : 0;
        if (!$id && !$guestAllowed) throw new RuntimeExceptionCode('AUTH_REQUIRED', 401);
        if ($id) {
            $user = \CUser::GetByID($id)->Fetch();
            if (!is_array($user)) throw new RuntimeExceptionCode('AUTH_EXPIRED', 401);
            Protocol::activeUser($user);
        }
        $context = $payload['context'] ?? 'personal'; $organizationId = 0;
        if (preg_match('/^organization:([1-9][0-9]{0,11})$/D', $context, $match)) {
            $organizationId = (int)$match[1]; self::organization($id, $organizationId);
        } elseif (!in_array($context, ['personal', 'business'], true)) throw new RuntimeExceptionCode('FORBIDDEN', 403);
        // Clear both legacy switches; source components must see the same verified context.
        unset($_SESSION['SELECT_ORGANIZATION'], $_SESSION['ORGANIZATION_ID']);
        if ($organizationId) $_SESSION['ORGANIZATION_ID'] = $organizationId;
        return ['userId' => $id, 'organizationId' => $organizationId, 'sessionKey' => $payload['sessionKey'], 'context' => $context];
    }
    public static function organization(int $userId, int $organizationId): array {
        if (!$userId || !defined('IBLOCK_ID_ORGANIZATIONS')) throw new RuntimeExceptionCode('AUTH_REQUIRED', 401);
        // Source Organization::checkUserInOrganization uses 24h cache. Read its exact filter uncached for authorization.
        $cursor = \CIBlockElement::GetList([], ['IBLOCK_ID' => IBLOCK_ID_ORGANIZATIONS, 'ID' => $organizationId,
            'ACTIVE' => 'Y', 'PROPERTY_USER_IDS' => $userId], false, ['nTopCount' => 1], ['ID','IBLOCK_ID','NAME','PROPERTY_INN']);
        $value = $cursor->Fetch();
        if (!$value) throw new RuntimeExceptionCode('FORBIDDEN', 403);
        $result = ['id' => (int)$value['ID'], 'name' => html_entity_decode(strip_tags((string)$value['NAME']), ENT_QUOTES | ENT_HTML5, 'UTF-8')];
        if (preg_match('/^(?:[0-9]{10}|[0-9]{12})$/D', (string)($value['PROPERTY_INN_VALUE'] ?? ''))) $result['inn'] = $value['PROPERTY_INN_VALUE'];
        return $result;
    }
}
final class BuyerDriver {
    public function run(string $operation, array $payload, array $actor): array {
        if (!$actor['userId']) throw new RuntimeExceptionCode('AUTH_REQUIRED', 401);
        if ($operation === 'buyer.organizations') {
            if (!defined('IBLOCK_ID_ORGANIZATIONS')) throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
            $cursor = \CIBlockElement::GetList(['ID'=>'DESC'], ['IBLOCK_ID'=>IBLOCK_ID_ORGANIZATIONS,'ACTIVE'=>'Y','PROPERTY_USER_IDS'=>$actor['userId']], false, ['nTopCount'=>101], ['ID']);
            $items = [];
            while ($row = $cursor->Fetch()) { if (count($items) >= 100) throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE'); $items[] = Actor::organization($actor['userId'], (int)$row['ID']); }
            return ['organizations' => $items];
        }
        if ($operation !== 'buyer.select' || !is_int($payload['organizationId'] ?? null) || $payload['organizationId'] <= 0) throw new RuntimeExceptionCode('VALIDATION_ERROR', 422);
        $organization = Actor::organization($actor['userId'], $payload['organizationId']);
        // Source BasketUsers::getBasketForUser cache key omits organizationId. Preserve its table/filter, not that cache bug.
        $row = \Prom\Model\EO\BasketUsersTable::getList(['select'=>['JSON_ITEMS'], 'filter'=>['=USER_ID'=>$actor['userId'],'=ORGANIZATION_ID'=>$organization['id']], 'limit'=>1])->fetch();
        $items = $row ? json_decode((string)$row['JSON_ITEMS'], true, 32, JSON_THROW_ON_ERROR) : [];
        if (!is_array($items) || count($items) > 500) throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        $cart = [];
        foreach ($items as $id => $value) {
            // Source BasketUsers JSON_ITEMS shape is normalized here only when explicit product identity/quantity exist.
            // BasketUsers::initBasketForUser reads item->ID and item->QUANTITY (source:340–341).
            $productId = is_array($value) ? ($value['ID'] ?? null) : null;
            $quantity = is_array($value) ? ($value['QUANTITY'] ?? null) : null;
            if (!is_numeric($productId) || (int)$productId <= 0 || !is_numeric($quantity) || (float)$quantity !== (float)(int)$quantity || (int)$quantity < 1 || (int)$quantity > 999) throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
            $cart[] = ['productId'=>'prom-' . (int)$productId, 'quantity'=>(int)$quantity];
        }
        $_SESSION['ORGANIZATION_ID'] = $organization['id'];
        return ['organization'=>$organization,'cart'=>$cart];
    }
}
