<?php
declare(strict_types=1);
namespace Prom23\Runtime;

/**
 * Source cancel/repeat/pay only ever mutate or read an *existing* order.
 * `OnSaleOrderSaved` (events.php:221-371) fires `Bitrix24Webhook::createDeal`
 * only when `$order->isNew()` is true — true exactly once, on the initial
 * `Order::save()` that creates the order. This driver must never call
 * `Order::create()`/`save()` for a new order, or it duplicates the CRM deal:
 *  - order-cancel mirrors `Models\Order::cancelOrderByUser()`
 *    (local/class/Models/Order.php:868-912) byte-for-byte: same allowed
 *    source statuses (STATUS_ORDER_NO_PAY/ASSEMBLING/DELIVERY/READY),
 *    same CANCELED='Y'+STATUS_ID=STATUS_ORDER_CANCEL+save() on the *same*
 *    order row (isNew()===false afterwards, handler no-ops).
 *  - order-repeat never calls Order::save()/create() at all; it only
 *    projects the source order's basket into a cart array for the BFF's
 *    active-cart CAS (mirrors local/ajax/lk/orders/order-repeat.php's
 *    intent — reuse product/qty from the old order — without touching the
 *    website's own FUSER basket).
 *  - order-pay throws PAYMENT_ROUTE_REQUIRED; payment against an existing
 *    order/payment row is CommerceDriver::payment(), never a new order.
 * Only CommerceDriver::submit() may create+save a new Order (see its
 * single, CAS-claimed `$order->save()` call).
 */
final class OrderActionDriver {
    public const IDS=['order-cancel','order-repeat','order-pay'];
    public function __construct(private array $config) {}
    public static function cancelAllowed(string $status,array $allowed): void {if(!in_array($status,$allowed,true))throw new RuntimeExceptionCode('ORDER_CANNOT_CANCEL',409);}
    public static function repeatItems(iterable $basket,callable $exists): array {
        $cart=[];foreach($basket as $item){$productId=(int)$item->getProductId();$quantity=$item->getQuantity();
            if(!$exists($productId))continue;
            if(!is_numeric($quantity)||(float)$quantity!==(float)(int)$quantity||$quantity<1||$quantity>999||isset($cart[$productId]))throw new RuntimeExceptionCode('ORDER_ITEMS_INVALID',409);
            $cart[$productId]=['productId'=>'prom-'.$productId,'quantity'=>(int)$quantity];
        }
        if(!$cart||count($cart)>500)throw new RuntimeExceptionCode('ORDER_ITEMS_UNAVAILABLE',409);return array_values($cart);
    }
    public function run(string $operation,array $payload,array $actor): array {
        if(!$actor['userId'])throw new RuntimeExceptionCode('AUTH_REQUIRED',401);
        $id=$payload['formId'];$target=$payload['target']??[];
        if(array_diff(array_keys($target),['orderId'])||!preg_match('/^[1-9][0-9]*$/D',$target['orderId']??''))throw new RuntimeExceptionCode('NOT_FOUND',404);
        $order=\Bitrix\Sale\Order::load((int)$target['orderId']);if(!$order)throw new RuntimeExceptionCode('NOT_FOUND',404);ServiceDriver::ownedOrder($order,$actor);
        $data=['formId'=>$id,'revision'=>hash('sha256',json_encode([$this->config['formContracts'][$id],$payload['context'],$order->getId(),$order->getField('STATUS_ID'),$order->getField('CANCELED'),$order->getField('PAYED'),$order->getPrice()],JSON_THROW_ON_ERROR))];
        if($operation==='forms.context')return $data;
        if(($payload['revision']??'')!==$data['revision'])throw new RuntimeExceptionCode('STALE_CONTEXT',409);
        if(!empty($payload['values']))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        if($id==='order-repeat'){
            $cart=self::repeatItems($order->getBasket(),static fn(int $productId)=>boolval(\CIBlockElement::GetList([],['ID'=>$productId,'ACTIVE'=>'Y','IBLOCK_ID'=>IBLOCK_ID_CATALOG_PRODUCTS],false,['nTopCount'=>1],['ID'])->Fetch()));
            // BFF CAS replaces the mobile active cart. Website FUSER is never overwritten before that CAS.
            return ['status'=>'accepted','reference'=>'order-'.$order->getId(),'cart'=>$cart];
        }
        if($id==='order-pay'){
            throw new RuntimeExceptionCode('PAYMENT_ROUTE_REQUIRED',409);
        }
        $allowed=[];foreach(['STATUS_ORDER_NO_PAY','STATUS_ORDER_ASSEMBLING','STATUS_ORDER_DELIVERY','STATUS_ORDER_READY'] as $constant){if(!defined($constant))throw new RuntimeExceptionCode('SOURCE_SCHEMA_REQUIRED');$allowed[]=constant($constant);}self::cancelAllowed((string)$order->getField('STATUS_ID'),$allowed);
        if(!defined('STATUS_ORDER_CANCEL'))throw new RuntimeExceptionCode('SOURCE_SCHEMA_REQUIRED');
        foreach(['CANCELED'=>'Y','STATUS_ID'=>STATUS_ORDER_CANCEL] as $field=>$value){$result=$order->setField($field,$value);if(!$result->isSuccess())throw new RuntimeExceptionCode('ORDER_CANCEL_FAILED');}
        $result=$order->save();if(!$result->isSuccess())throw new RuntimeExceptionCode('ORDER_CANCEL_FAILED');
        return ['status'=>'accepted','reference'=>'order-'.$order->getId()];
    }
}
