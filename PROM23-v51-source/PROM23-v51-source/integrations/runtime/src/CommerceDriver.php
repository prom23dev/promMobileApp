<?php
declare(strict_types=1);
namespace Prom23\Runtime;

use Bitrix\Main\Loader;
use Bitrix\Sale;
use Bitrix\Catalog;
require_once __DIR__.'/CommerceLegal.php';
require_once __DIR__.'/ConsentLedger.php';

/** Source Sale adapter. No catalog snapshot, fabricated delivery, CRM duplicate, or browser payment HTML. */
final class CommerceDriver
{
    private array $config;
    private ?\PDO $db;
    public function __construct(array $config = [])
    {
        $this->config = $config['commerce'] ?? [];
        $this->db = ($config['pdo'] ?? null) instanceof \PDO ? $config['pdo'] : null;
        if ($this->db) $this->db->exec('CREATE TABLE IF NOT EXISTS commerce_quotes(id TEXT PRIMARY KEY, actor TEXT NOT NULL, scope TEXT NOT NULL, quote TEXT NOT NULL, expires INTEGER NOT NULL, state TEXT NOT NULL, reference TEXT); CREATE TABLE IF NOT EXISTS commerce_order_meta(reference TEXT PRIMARY KEY, actor TEXT NOT NULL, payment_preference TEXT NOT NULL)');
    }

    public function run(string $operation, array $payload, array $actor): array
    {
        if (!in_array($operation, ['checkout.options','cart.quote','cart.coupon','order.submit','payment.session','commerce.offer'], true)) self::fail('OPERATION_UNSUPPORTED', 404);
        $this->assertActor($payload, $actor, $operation==='commerce.offer');
        if (!class_exists(Loader::class) || !Loader::includeModule('sale') || !Loader::includeModule('catalog') || !Loader::includeModule('iblock')) self::fail('BITRIX_MODULE_UNAVAILABLE');
        if ($operation === 'payment.session') return $this->payment($payload, $actor);
        if ($operation === 'commerce.offer') return $this->offer($payload, $actor);
        $p = self::scope($payload);
        $region = $this->region($p, $actor);
        if ($operation === 'cart.coupon') {
            $code = self::text($payload['code'] ?? '', 100);
            if ($code === '') return ['status'=>'invalid','code'=>$code];
            $p['coupon'] = $code;
            try { $model = $this->calculate($p, $actor, $region, false); }
            catch (RuntimeExceptionCode $e) {
                if (in_array($e->getMessage(), ['COUPON_INVALID','COUPON_NOT_APPLICABLE','COUPON_EXPIRED'], true)) return ['status'=>['COUPON_INVALID'=>'invalid','COUPON_NOT_APPLICABLE'=>'not-applicable','COUPON_EXPIRED'=>'expired'][$e->getMessage()], 'code'=>$code];
                throw $e;
            }
            return ['status'=>'applied', 'code'=>$code];
        }
        if ($operation === 'checkout.options') {
            $model = $this->calculate($p, $actor, $region, false, true);
            return ['contextKey'=>$p['contextKey'], 'expiresAt'=>gmdate('c', time()+300), 'deliveryOptions'=>$model['options'], 'paymentMethods'=>$model['payments']];
        }
        if ($operation === 'order.submit') return $this->submit($payload, $p, $actor, $region);
        $model = $this->calculate($p, $actor, $region, true);
        $q = $model['quote']; $q['id'] = bin2hex(random_bytes(24)); $q['expiresAt'] = gmdate('c', time()+300);
        $this->storeQuote($q, $p, $actor);
        return ['quote'=>$q];
    }

    /** Defence in depth. Dispatcher alone derives the actor from a live Bitrix session. */
    private function assertActor(array $p, array $a, bool $guest=false): void
    {
        if (!is_int($a['userId'] ?? null) || $a['userId'] < ($guest?0:1) || !preg_match('/^[a-f0-9]{64}$/D', $a['sessionKey'] ?? '') || !hash_equals($a['sessionKey'], (string)($p['sessionKey'] ?? ''))) self::fail('AUTH_REQUIRED', 401);
        $context = $p['context'] ?? '';
        if ($context === 'business') self::fail('ORGANIZATION_REQUIRED', 409);
        if ($context === 'personal') {
            if (!empty($p['organizationId'])) self::fail('FORBIDDEN', 403);
            return;
        }
        if (!is_string($context) || !preg_match('/^organization:([1-9][0-9]*)$/D', $context, $m) || (int)$m[1] !== ($a['organizationId'] ?? 0) || (isset($p['organizationId']) && (int)$p['organizationId'] !== (int)$m[1])) self::fail('FORBIDDEN', 403);
    }

    public static function scope(array $p): array
    {
        $cart = $p['cart'] ?? null;
        if (!is_array($cart) || count($cart)<1 || count($cart)>500) self::fail('EMPTY_CART', 409);
        $seen=[]; $lines=[];
        foreach ($cart as $line) {
            if (!is_array($line) || !is_string($line['productId'] ?? null) || !preg_match('/^[A-Za-z0-9_-]{1,120}$/D', $line['productId']) || isset($seen[$line['productId']]) || !is_int($line['quantity'] ?? null) || $line['quantity']<1 || $line['quantity']>999) self::fail('INVALID_CART', 400);
            $seen[$line['productId']]=true; $lines[]=['productId'=>$line['productId'],'quantity'=>$line['quantity']];
        }
        if (!preg_match('/^[a-f0-9-]{36}$/Di', $p['settlementId'] ?? '') || !is_int($p['locationVersion'] ?? null) || $p['locationVersion']<1) self::fail('SETTLEMENT_REQUIRED', 409);
        if (!preg_match('/^[a-f0-9]{64}$/D', $p['contextKey'] ?? '')) self::fail('INVALID_CONTEXT', 400);
        $out=['context'=>$p['context'], 'organizationId'=>$p['organizationId'] ?? null,'cart'=>$lines,'settlementId'=>strtolower($p['settlementId']),'locationVersion'=>$p['locationVersion'],'contextKey'=>$p['contextKey']];
        foreach (['delivery','payment','address','pickupId','pod','etag','office','comment','coupon'] as $k) $out[$k]=self::text($p[$k] ?? '', $k==='coupon'?100:500);
        if ($out['delivery']!=='' && !in_array($out['delivery'], ['pickup','pvz','courier','terminal'], true)) self::fail('INVALID_DELIVERY',400);
        if ($out['payment']!=='' && !in_array($out['payment'], ['online','split','receipt','invoice'], true)) self::fail('INVALID_PAYMENT',400);
        return $out;
    }

    private function region(array $p, array $actor): array
    {
        // Explicit GAR → commercial region AND Sale location; never use a city display name.
        // Source Regions.php:465-481 personal/DEFAULT_CITY override is applied by the dispatcher
        // (endpoint.php) before this driver runs, via LocationDriver::effectiveSettlement() — this
        // driver only sees 'commerce'-scoped config, never the root 'location' config it needs.
        $kind=$p['context']==='personal'?'personal':'organization';
        $mapping=$this->config['regionBySettlement'][$p['settlementId']][$kind] ?? null;
        if (!is_array($mapping) || !is_int($mapping['regionId'] ?? null) || $mapping['regionId']<1 || !is_string($mapping['locationCode'] ?? null) || $mapping['locationCode']==='') self::fail('REGION_MAPPING_REQUIRED');
        $location=Sale\Location\LocationTable::getList(['filter'=>['=CODE'=>$mapping['locationCode']], 'select'=>['ID','CODE'], 'limit'=>1])->fetch();
        if (!$location) self::fail('LOCATION_MAPPING_INVALID');
        if (!defined('IBLOCK_ID_REGIONS')) self::fail('REGION_SCHEMA_UNAVAILABLE');
        $el=\CIBlockElement::GetList([], ['ID'=>$mapping['regionId'],'IBLOCK_ID'=>IBLOCK_ID_REGIONS,'ACTIVE'=>'Y'], false, false, ['ID','NAME'])->Fetch();
        if (!$el) self::fail('REGION_MAPPING_INVALID');
        $properties=[];
        $rows=\CIBlockElement::GetProperty(IBLOCK_ID_REGIONS,$mapping['regionId'],[],[]);
        while ($r=$rows->Fetch()) if ($r['VALUE']!==null && $r['VALUE']!=='') $properties[$r['CODE']][]=$r['VALUE'];
        $prices=array_values(array_unique($properties['PRICE_CODE'] ?? []));
        if ($kind==='organization' && defined('DEFAULT_CITY') && $mapping['regionId']===(int)DEFAULT_CITY['id']) $prices=['KRD','KRD_SALE'];
        if (!$prices) self::fail('REGIONAL_PRICE_UNAVAILABLE');
        $region=['locationCode'=>$location['CODE'],'priceCodes'=>$prices,'storeId'=>(int)($properties['STORE'][0] ?? 0), 'pickup'=>(int)($properties['DELIVERY_SERVICE_PICKUP'][0] ?? 0), 'terminal'=>array_map('intval',$properties['DELIVERY_SERVICE_PICKUP_TK'] ?? []), 'courier'=>array_map('intval',$properties['DELIVERY_SERVICE_TK'] ?? []),'payments'=>array_map('intval',$properties['PAYMENT_SYSTEM'] ?? [])];
        // Source delivery_courier = DELIVERY_SERVICE_TK; physical buyers clear that group,
        // not DELIVERY_SERVICE_PICKUP_TK. Group names are not the configured UI method classification.
        if ($kind==='personal') $region['courier']=[];
        else $region['courier']=array_values(array_diff($region['courier'],[defined('DELIVERY_SERVICE_YANDEX_COURIER_ID')?(int)DELIVERY_SERVICE_YANDEX_COURIER_ID:7]));
        return $region;
    }

    /**
     * `StoreProductTable` read for the region's confirmed warehouse
     * (`Regions.php:558` STORE_VALUE, single store per region element —
     * see `regionBySettlement`). Mirrors `change-region.php:129-134`
     * semantics, not `Helpers::getStoreQuantity()` (which filters
     * `AMOUNT>0` and can never report a zero row): an explicit row with
     * `AMOUNT<=0` means genuinely out of stock; a MISSING row means the
     * warehouse has no quantity-tracking record for that product and
     * must not block the sale on stock alone (source treats it as
     * "unknown, gate on price presence instead"). Ids absent from the
     * returned map have no store record at all.
     *
     * "Full store scope" per `integrations/README.md`#3 is still
     * un-confirmed by the owner: today this only reads the single
     * `region.storeId` resolved from iblock 22, matching how
     * `deliveryOptions()` already picks the pickup warehouse. If a
     * region can be served by more than one physical store, extend the
     * filter to `'@STORE_ID'=>$storeIds` once that mapping exists —
     * do not silently aggregate multiple stores without confirmation.
     */
    private function readInventory(array $elementIds, int $storeId): array
    {
        if (!$elementIds || $storeId<1) return [];
        $out=[];
        $rows=Catalog\StoreProductTable::getList([
            'filter'=>['@PRODUCT_ID'=>array_values($elementIds),'=STORE_ID'=>$storeId],
            'select'=>['PRODUCT_ID','AMOUNT'],
        ]);
        while ($row=$rows->fetch()) $out[(int)$row['PRODUCT_ID']]=(float)$row['AMOUNT'];
        return $out;
    }

    private function prices(array $p, array $region): array
    {
        $groups=Catalog\GroupTable::getList(['filter'=>['@NAME'=>$region['priceCodes']], 'select'=>['ID','NAME','XML_ID']])->fetchAll();
        $sale=array_values(array_filter($groups, static fn($g)=>substr($g['NAME'],-5)==='_SALE'));
        if (count($sale)!==1 || !$sale[0]['XML_ID']) self::fail('PRICE_GROUP_MAPPING_REQUIRED');
        $xml=$sale[0]['XML_ID']; $prices=[]; $ids=[];
        $allowed=$this->config['catalogIblockIds'] ?? array_values(array_filter(array_map(static fn($c)=>defined($c)?(int)constant($c):null,['IBLOCK_ID_CATALOG_PRODUCTS','IBLOCK_ID_CATALOG_FOREST_NEW','IBLOCK_ID_CATALOG_YTP_NEW','IBLOCK_ID_CATALOG_NEW','IBLOCK_ID_CATALOG_WT','IBLOCK_ID_CATALOG_OFFERS_WT'])));
        if (!$allowed) self::fail('CATALOG_SCHEMA_UNAVAILABLE');
        $elementIds=[];
        foreach ($p['cart'] as $line) {
            $id=$this->config['productIdMap'][$line['productId']] ?? null;
            if ($id===null && preg_match('/^prom-([1-9][0-9]*)$/D',$line['productId'],$m)) $id=(int)$m[1];
            if (!is_int($id) || $id<1 || isset($ids[$id])) self::fail('PRODUCT_MAPPING_INVALID',422);
            $ids[$id]=true;
            if (!\CIBlockElement::GetList([],['ID'=>$id,'IBLOCK_ID'=>$allowed,'ACTIVE'=>'Y'],false,false,['ID'])->Fetch()) self::fail('PRODUCT_UNAVAILABLE',422);
            $elementIds[]=$id;
        }
        $stock=$this->readInventory($elementIds,$region['storeId']);
        foreach ($p['cart'] as $line) {
            $id=$this->config['productIdMap'][$line['productId']] ?? (preg_match('/^prom-([1-9][0-9]*)$/D',$line['productId'],$m)?(int)$m[1]:null);
            if (array_key_exists($id,$stock) && $stock[$id]<=0.0) self::fail('PRODUCT_OUT_OF_STOCK',422);
            $filter=['=PRODUCT_ID'=>$id,'=CATALOG_GROUP.XML_ID'=>$xml];
            $price=Catalog\PriceTable::getList(['filter'=>$filter,'limit'=>1])->fetch();
            if (!$price && substr($xml,-5)==='_SALE') { $filter['=CATALOG_GROUP.XML_ID']=substr($xml,0,-5); $price=Catalog\PriceTable::getList(['filter'=>$filter,'limit'=>1])->fetch(); }
            if (!$price || ($price['CURRENCY'] ?? '')!=='RUB' || self::money($price['PRICE'])<=0) self::fail('REGIONAL_PRICE_UNAVAILABLE');
            $prices[$id]=['row'=>$price,'line'=>$line,'xml'=>$xml];
        }
        return $prices;
    }

    private function calculate(array $p,array $actor,array $region,bool $select, bool $optionsOnly=false,array $contact=[],?callable $onReady=null): array
    {
        $prices=$this->prices($p,$region);
        if($select){
            $resolver=$this->config['saleModeResolver']??null;
            if(!is_callable($resolver))self::fail('SALE_MODE_REQUIRED',409);
            foreach($p['cart'] as $line)if($resolver($line['productId'],$actor,$region)!=='BUYABLE')self::fail('PRODUCT_REQUEST_ONLY',409);
        }
        $site=$this->config['siteId'] ?? (defined('SITE_ID')?SITE_ID:'');
        if (!is_string($site)||!preg_match('/^[A-Za-z0-9]{1,2}$/D',$site)) self::fail('SITE_MAPPING_REQUIRED');
        $manager=\Bitrix\Main\EventManager::getInstance();
        // Source CatalogProvider requires persisted BASKET_ID. A scoped hook applies its trusted
        // regional price to transient items; CUSTOM_PRICE stays N so Sale coupons still run.
        $hook=$manager->addEventHandler('catalog','OnGetOptimalPrice',static function($id) use($prices) {
            if (!isset($prices[$id])) return true;
            $r=$prices[$id]['row'];$price=$r['PRICE'];
            return ['PRICE'=>$r,'RESULT_PRICE'=>['ID'=>$r['ID'],'PRICE'=>$price,'CURRENCY'=>'RUB','BASE_PRICE'=>$price,'DISCOUNT_PRICE'=>$price,'DISCOUNT'=>0,'PERCENT'=>0,'UNROUND_BASE_PRICE'=>$price,'UNROUND_DISCOUNT_PRICE'=>$price],'DISCOUNT'=>['PRICE'=>$price,'CURRENCY'=>'RUB','DISCOUNT'=>0,'PERCENT'=>0,'BASE_PRICE'=>$price]];
        });
        // MODE_ORDER isolates this calculation from coupons in the customer's website basket.
        Sale\DiscountCouponsManager::init(Sale\DiscountCouponsManager::MODE_ORDER,['userId'=>$actor['userId'],'orderId'=>0],true);
        try {
            if ($p['coupon']!=='' && !Sale\DiscountCouponsManager::add($p['coupon'])) self::fail('COUPON_INVALID',422);
            $order=Sale\Order::create($site,$actor['userId'],'RUB');
            self::result($order->setPersonTypeId($p['context']==='personal'?1:2),'PERSON_TYPE_UNAVAILABLE');
            $basket=Sale\Basket::create($site);
            foreach ($prices as $id=>$entry) {
                $item=$basket->createItem('catalog',$id);
                self::result($item->setFields(['QUANTITY'=>$entry['line']['quantity'],'CURRENCY'=>'RUB','LID'=>$site,'CUSTOM_PRICE'=>'N','PRODUCT_PROVIDER_CLASS'=>'\\Bitrix\\Catalog\\Product\\CatalogProvider']),'BASKET_INVALID');
                $item->getPropertyCollection()->setProperty([['NAME'=>'Тип цены','CODE'=>'CATALOG_GROUP_XML_ID','VALUE'=>$entry['xml'],'SORT'=>100]]);
            }
            self::result($basket->refresh(Sale\Basket\RefreshFactory::create(Sale\Basket\RefreshFactory::TYPE_FULL)),'BASKET_UNAVAILABLE');
            foreach ($basket as $item) {
                $trusted=$prices[(int)$item->getProductId()];
                if ((float)$item->getQuantity()!== (float)$trusted['line']['quantity'] || self::money($item->getBasePrice())!==self::money($trusted['row']['PRICE']) || $item->getField('CAN_BUY')!=='Y') self::fail('BASKET_PRICE_OR_STOCK_CHANGED',409);
            }
            self::result($order->setBasket($basket),'BASKET_INVALID');
            $this->properties($order,$p,$actor,$region,$contact);
            $shipment=$order->getShipmentCollection()->createItem();
            foreach ($basket as $item) self::result($shipment->getShipmentItemCollection()->createItem($item)->setQuantity($item->getQuantity()),'SHIPMENT_INVALID');
            $options=($select||$optionsOnly)?$this->deliveryOptions($order,$shipment,$p,$region):[];
            $chosen=null;
            if ($select) {
                foreach ($options as $o) if ($p['pickupId']!=='' && hash_equals($o['id'],$p['pickupId'])) $chosen=$o;
                if (!$chosen && $p['delivery']==='courier' && $p['pickupId']==='' && count($options)===1) $chosen=$options[0];
                if (!$chosen) self::fail('DELIVERY_OPTION_REQUIRED',422);
                $this->bindDelivery($order,$shipment,$p,$chosen);
                $calc=$shipment->calculateDelivery(); self::result($calc,'DELIVERY_CALCULATION_UNAVAILABLE');
                self::result($shipment->setField('PRICE_DELIVERY',$calc->getPrice()),'DELIVERY_CALCULATION_UNAVAILABLE');
            }
            $payment=$order->getPaymentCollection()->createItem();
            self::result($payment->setFields(['SUM'=>$basket->getPrice(),'CURRENCY'=>'RUB']),'PAYMENT_INVALID');
            $payments=$this->paymentOptions($payment,$p,$region);
            if ($select) {
                $choice=null;foreach($payments as $m) if($m['id']===$p['payment'])$choice=$m;
                if (!$choice) self::fail('PAYMENT_NOT_AVAILABLE',422);
                self::result($payment->setFields(['PAY_SYSTEM_ID'=>(int)$choice['sourceId'],'PAY_SYSTEM_NAME'=>$choice['name']]),'PAYMENT_NOT_AVAILABLE');
            }
            self::result($order->doFinalAction(true),'ORDER_CALCULATION_UNAVAILABLE');
            if ($p['coupon']!=='') {
                $coupons=Sale\DiscountCouponsManager::get(true,['COUPON'=>$p['coupon']],true,true);
                $applied=false;foreach((array)$coupons as $coupon) if (($coupon['COUPON']??'')===$p['coupon'] && ($coupon['STATUS']??0)===Sale\DiscountCouponsManager::STATUS_APPLY) $applied=true;
                if (!$applied) self::fail('COUPON_NOT_APPLICABLE',422);
            }
            $lines=[];$subtotal=0;$net=0;
            foreach($basket as $item){$unit=self::money($item->getBasePrice());$qty=(int)$item->getQuantity();$line=$unit*$qty;$subtotal+=$line;if($subtotal>9007199254740991)self::fail('INVALID_MONEY');$net+=self::money($item->getFinalPrice());$lines[]=['productId'=>$prices[(int)$item->getProductId()]['line']['productId'],'quantity'=>$qty,'unitPriceKopecks'=>$unit,'lineTotalKopecks'=>$line];}
            $delivery=self::money($order->getDeliveryPrice());$total=self::money($order->getPrice());
            if($net>$subtotal || $total!==$net+$delivery)self::fail('TOTAL_RECONCILIATION_REQUIRED',409);
            self::result($payment->setField('SUM',$total/100),'PAYMENT_INVALID');
            // Re-evaluate restrictions with final discounted total, not an earlier basket estimate.
            if($select && !in_array($p['payment'],array_column($this->paymentOptions($payment,$p,$region),'id'),true))self::fail('PAYMENT_NOT_AVAILABLE',422);
            $legal=$select?CommerceLegal::resolve($this->config,$p,$actor,$region):null;
            $model = ['legal'=>$legal,'order'=>$order,'shipment'=>$shipment,'options'=>$options,'payments'=>$payments,'quote'=>['contextKey'=>$p['contextKey'],'currency'=>'RUB','subtotalKopecks'=>$subtotal,'discountKopecks'=>$subtotal-$net,'deliveryKopecks'=>$delivery,'totalKopecks'=>$total,'deliveryId'=>(string)($chosen['sourceId']??''),'deliveryOptionId'=>(string)($chosen['id']??''),'paymentId'=>(string)($payment->getField('PAY_SYSTEM_ID')??''),'items'=>$lines,'legal'=>$legal?CommerceLegal::publicView($legal):null]];
            if ($onReady) $onReady($model);
            return $model;
        } finally { $manager->removeEventHandler('catalog','OnGetOptimalPrice',$hook); Sale\DiscountCouponsManager::clear(true); }
    }

    private function properties($order,array $p,array $a,array $r,array $contact): void
    {
        $values=['LOCATION'=>$r['locationCode'],'ADDRESS'=>$p['address']];
        if($contact)$values+=['FIO'=>$contact['name'],'EMAIL'=>$contact['email'],'PHONE'=>$contact['phone']];
        if($p['context']!=='personal'){
            if(!defined('IBLOCK_ID_ORGANIZATIONS'))self::fail('ORGANIZATION_SCHEMA_UNAVAILABLE');
            $entity=\CIBlockElement::GetList([],['ID'=>$a['organizationId'],'IBLOCK_ID'=>IBLOCK_ID_ORGANIZATIONS,'ACTIVE'=>'Y','PROPERTY_USER_IDS'=>$a['userId']],false,false,['ID','NAME'])->GetNextElement();
            if(!$entity)self::fail('FORBIDDEN',403);
            $fields=$entity->GetFields();$properties=$entity->GetProperties();
            $values['COMPANY']=self::text($fields['NAME'],500);
            foreach(['INN','KPP'] as $k)$values[$k]=self::text((string)($properties[$k]['VALUE']??''),100);
            if($values['INN']==='')self::fail('ORGANIZATION_PROPERTIES_UNAVAILABLE');
            if($contact)$values['CONTACT_PERSON']=$contact['name'];
            $values['ORGANIZATION_ID']=(string)$a['organizationId'];
        }
        $codes=[];foreach($order->getPropertyCollection() as $prop){$code=$prop->getField('CODE');$codes[$code]=true;if(array_key_exists($code,$values))self::result($prop->setValue($values[$code]),'ORDER_PROPERTY_INVALID');}
        foreach(array_keys($values) as $code)if(!isset($codes[$code])&&($values[$code]!==''))self::fail('ORDER_PROPERTY_MAPPING_REQUIRED');
        // Source auxiliary address fields must not be silently lost. They are preserved together
        // in the order comment (and available to provider binders), without invented property IDs.
        $parts=[];foreach(['pod'=>'Подъезд','etag'=>'Этаж','office'=>'Квартира/офис','comment'=>'Комментарий'] as $key=>$label)if($p[$key]!=='')$parts[]=$label.': '.$p[$key];
        if($parts)self::result($order->setField('USER_DESCRIPTION',implode("\n",$parts)),'ORDER_PROPERTY_INVALID');
    }

    private function deliveryOptions($order,$shipment,array $p,array $region): array
    {
        $restricted=Sale\Delivery\Services\Manager::getRestrictedList($shipment,Sale\Services\Base\RestrictionManager::MODE_CLIENT);
        $allowed=array_unique(array_filter(array_merge([$region['pickup']],$region['terminal'],$region['courier'])));$out=[];
        foreach($restricted as $key=>$row){$id=(int)($row['ID']??$key);if(!in_array($id,$allowed,true))continue;
            $method=$id===$region['pickup']?'pickup':($this->config['deliveryMethods'][$id]??null);
            if(!$method||$method!==$p['delivery'])continue;
            $service=Sale\Delivery\Services\Manager::getObjectById($id);if(!$service)continue;
            $base=['method'=>$method,'sourceId'=>(string)$id,'provider'=>self::text($row['NAME']??$service->getName(),500),'name'=>self::text($row['NAME']??$service->getName(),500),'address'=>''];
            if($method==='pickup'){
                $store=Catalog\StoreTable::getList(['filter'=>['=ID'=>$region['storeId'],'=ACTIVE'=>'Y'],'select'=>['ID','TITLE','ADDRESS'],'limit'=>1])->fetch();
                if(!$store||!trim((string)$store['ADDRESS']))self::fail('WAREHOUSE_UNAVAILABLE');
                $out[]=$base+['id'=>'delivery-'.$id.'-store-'.$store['ID'],'pointId'=>(string)$store['ID']];$out[count($out)-1]['address']=$store['ADDRESS'];$out[count($out)-1]['name']=$store['TITLE']?:$base['name'];
            }elseif($method==='courier'){$out[]=$base+['id'=>'delivery-'.$id];}
            else{
                $resolver=$this->config['pointResolvers'][$id]??null;if(!is_callable($resolver))self::fail('DELIVERY_POINTS_RESOLVER_REQUIRED');
                $points=$resolver($p['settlementId'],$region['locationCode'],$shipment,$p);
                if(!is_array($points)||count($points)>500)self::fail('DELIVERY_POINTS_INVALID');
                foreach($points as $point){if(!is_array($point)||!isset($point['pointId'],$point['name'],$point['address']))self::fail('DELIVERY_POINTS_INVALID');$pointId=self::text((string)$point['pointId'],200);if($pointId===''||self::text($point['address'],500)==='')self::fail('DELIVERY_POINTS_INVALID');$out[]=array_replace($base,['id'=>'delivery-'.$id.'-point-'.hash('sha256',$pointId),'pointId'=>$pointId,'name'=>self::text($point['name'],500),'address'=>$point['address']]);}
            }
        }
        if(!$out)self::fail('DELIVERY_NOT_AVAILABLE',422);
        return $out;
    }
    private function bindDelivery($order,$shipment,array $p,array $option): void
    {
        $id=(int)$option['sourceId'];$service=Sale\Delivery\Services\Manager::getObjectById($id);
        self::result($shipment->setFields(['DELIVERY_ID'=>$id,'DELIVERY_NAME'=>$service->getName()]),'DELIVERY_NOT_AVAILABLE');
        if($option['method']==='pickup')self::result($shipment->setField('STORE_ID',(int)$option['pointId']),'WAREHOUSE_UNAVAILABLE');
        if($option['method']==='courier'&&$p['address']==='')self::fail('ADDRESS_REQUIRED',400);
        if(in_array($option['method'],['pvz','terminal','courier'],true)){
            $binder=$this->config['deliveryBinders'][$id]??null;
            if(!is_callable($binder))self::fail('DELIVERY_ADDRESS_BINDER_REQUIRED');
            // Callback receives only freshly resolved point + validated scope, not client tariff.
            if($binder($order,$shipment,$option,$p)!==true)self::fail('DELIVERY_ADDRESS_INVALID',422);
        }
        $restricted=Sale\Delivery\Services\Manager::getRestrictedList($shipment,Sale\Services\Base\RestrictionManager::MODE_CLIENT);
        $ids=[];foreach($restricted as $k=>$r)$ids[]=(int)($r['ID']??$k);if(!in_array($id,$ids,true))self::fail('DELIVERY_NOT_AVAILABLE',422);
    }
    private function paymentOptions($payment,array $p,array $region): array
    {
        $rows=Sale\PaySystem\Manager::getListWithRestrictions($payment,Sale\Services\Base\RestrictionManager::MODE_CLIENT);
        $out=[];$ids=[];foreach($rows as $key=>$row)$ids[(int)($row['ID']??$key)]=$row;
        $mapping=$p['context']==='personal'?['online'=>14,'receipt'=>17]:['invoice'=>defined('INVOICE_PAYMENT_SYSTEM')?(int)INVOICE_PAYMENT_SYSTEM:16];
        foreach($mapping as $key=>$id)if(in_array($id,$region['payments'],true)&&isset($ids[$id]))$out[]=['id'=>$key,'sourceId'=>$id,'name'=>self::text($ids[$id]['NAME'],500),'description'=>''];
        if($p['context']==='personal'&&in_array('online',array_column($out,'id'),true)){
            $eligibility=$this->config['splitEligibility']??null;
            if(is_callable($eligibility)&&is_callable($this->config['splitPaymentHandoff']??null)&&$eligibility($payment,$p)===true)$out[]=['id'=>'split','sourceId'=>14,'name'=>'Яндекс Сплит','description'=>'Условия и доступность — на странице оплаты'];
        }
        return $out;
    }

    private function storeQuote(array $q,array $p,array $a): void
    {
        if(!$this->db)self::fail('QUOTE_STORAGE_UNAVAILABLE');
        $this->db->prepare('DELETE FROM commerce_quotes WHERE expires < ? AND state=?')->execute([time(),'fresh']);
        if((int)$this->db->query('SELECT count(*) FROM commerce_quotes')->fetchColumn()>100000)self::fail('RATE_LIMITED',429);
        $this->db->prepare('INSERT INTO commerce_quotes VALUES(?,?,?,?,?,?,?)')->execute([$q['id'],self::actorKey($a,$p),self::scopeHash($p),json_encode($q,JSON_THROW_ON_ERROR),strtotime($q['expiresAt']),'fresh',null]);
    }
    private function submit(array $payload,array $p,array $actor,array $region): array
    {
        self::consents($payload['consents']??null,$p['context']!=='personal',$this->config['formContracts']['checkout']['consents']??null);
        $contact=$payload['contact']??[];
        if(!is_array($contact)||self::text($contact['name']??'',150)===''||!filter_var($contact['email']??'',FILTER_VALIDATE_EMAIL)||!preg_match('/^\+?[0-9 ()-]{10,30}$/D',$contact['phone']??''))self::fail('CONTACT_REQUIRED',400);
        if(!$this->db||!preg_match('/^[a-f0-9]{48}$/D',$payload['quoteId']??''))self::fail('QUOTE_REQUIRED',409);
        $stmt=$this->db->prepare('SELECT * FROM commerce_quotes WHERE id=?');$stmt->execute([$payload['quoteId']]);$saved=$stmt->fetch(\PDO::FETCH_ASSOC);
        if(!$saved||!hash_equals($saved['actor'],self::actorKey($actor,$p))||!hash_equals($saved['scope'],self::scopeHash($p)))self::fail('QUOTE_REQUIRED',409);
        if($saved['state']==='complete'&&$saved['reference'])return ['status'=>'accepted','reference'=>$saved['reference']];
        if($saved['state']!=='fresh')self::fail('RESULT_RECONCILIATION_REQUIRED',409);
        if((int)$saved['expires']<=time())self::fail('QUOTE_EXPIRED',409);
        $reference=null;
        $this->calculate($p,$actor,$region,true,false,$contact,function(array $model)use($saved,$p,$actor,$payload,&$reference):void{
            $prior=json_decode($saved['quote'],true,32,JSON_THROW_ON_ERROR);$new=$model['quote'];unset($prior['id'],$prior['expiresAt']);
            if($prior!==$new)self::fail('QUOTE_CHANGED',409);
            // Claim before irreversible Sale save; a crash requires reconciliation, never another save.
            $claim=$this->db->prepare('UPDATE commerce_quotes SET state=? WHERE id=? AND state=?');$claim->execute(['pending',$saved['id'],'fresh']);if($claim->rowCount()!==1)self::fail('RESULT_RECONCILIATION_REQUIRED',409);
            $order=$model['order'];self::result($order->setField('XML_ID','prom23-mobile-'.$saved['id']),'ORDER_PROPERTY_INVALID');
            CommerceLegal::record($this->db,'quote:'.$saved['id'],$model['legal'],$actor);
            $consentConfig=$this->config;
            $consentConfig['legalVersions']['offer']=['version'=>$model['legal']['version'],'sha256'=>$model['legal']['hash']];
            (new ConsentLedger($consentConfig))->record($payload['consents'],$actor,'form:checkout');
            // Source OnSaleOrderSaved handles 1C/CRM. Save inside price/coupon scope exactly once.
            self::result($order->save(),'ORDER_SAVE_FAILED');
            $reference=(string)$order->getId();if(!preg_match('/^[1-9][0-9]*$/D',$reference))self::fail('RESULT_RECONCILIATION_REQUIRED',409);
            $this->db->prepare('UPDATE commerce_legal_receipts SET order_id=? WHERE order_id=?')->execute([$reference,'quote:'.$saved['id']]);
            $this->db->prepare('INSERT INTO commerce_order_meta VALUES(?,?,?)')->execute([$reference,self::actorKey($actor,$p),$p['payment']]);
            $this->db->prepare('UPDATE commerce_quotes SET state=?, reference=? WHERE id=?')->execute(['complete',$reference,$saved['id']]);
        });
        return ['status'=>'accepted','reference'=>$reference];
    }

    private function payment(array $p,array $a): array
    {
        if(!preg_match('/^[1-9][0-9]{0,15}$/D',$p['reference']??''))self::fail('ORDER_NOT_FOUND',404);
        $order=Sale\Order::load((int)$p['reference']);if(!$order||(int)$order->getUserId()!==$a['userId'])self::fail('ORDER_NOT_FOUND',404);
        $org=0;foreach($order->getPropertyCollection()as$prop)if($prop->getField('CODE')==='ORGANIZATION_ID')$org=(int)$prop->getValue();
        if(($p['context']==='personal'&&($org!==0||(int)$order->getPersonTypeId()!==1))||($p['context']!=='personal'&&($org!==($a['organizationId']??0)||(int)$order->getPersonTypeId()!==2)))self::fail('ORDER_NOT_FOUND',404);
        if($order->isCanceled()||$order->isPaid())self::fail('PAYMENT_NOT_AVAILABLE',409);
        $unpaid=[];foreach($order->getPaymentCollection()as$pay)if(!$pay->isPaid()&&!$pay->isInner())$unpaid[]=$pay;
        if(count($unpaid)!==1)self::fail('PAYMENT_SELECTION_REQUIRED',409);
        $pay=$unpaid[0];$service=$pay->getPaySystem();if(!$service)self::fail('PAYMENT_NOT_AVAILABLE',422);
        $meta=null;if($this->db){$stmt=$this->db->prepare('SELECT payment_preference FROM commerce_order_meta WHERE reference=?');$stmt->execute([$p['reference']]);$meta=$stmt->fetch(\PDO::FETCH_ASSOC);}
        if(($meta['payment_preference']??'')==='split'){
            $handoff=$this->config['splitPaymentHandoff']??null;if(!is_callable($handoff))self::fail('SPLIT_PAYMENT_ADAPTER_REQUIRED');
            $url=$handoff($order,$pay,$a);if(!is_string($url))self::fail('PAYMENT_INIT_FAILED');
        }else{
            $result=$service->initiatePay($pay,null,Sale\PaySystem\BaseServiceHandler::STRING);self::result($result,'PAYMENT_INIT_FAILED');
            $url=method_exists($result,'getPaymentUrl')?$result->getPaymentUrl():'';
            if(!is_string($url)||$url===''){
                $handoff=$this->config['invoiceHandoff']??null;if(!is_callable($handoff))self::fail('PAYMENT_HANDOFF_ADAPTER_REQUIRED');
                $url=$handoff($order,$pay,$a,$result);
                if(!is_string($url))self::fail('PAYMENT_INIT_FAILED');
            }
        }
        if($url==='')self::fail('PAYMENT_HANDOFF_ADAPTER_REQUIRED');
        self::paymentUrl($url,$this->config['paymentAllowedHosts']??[]);
        return ['url'=>$url,'expiresAt'=>gmdate('c',time()+300)];
    }
    private function offer(array $p,array $a): array
    {
        // No hand-computed four-payments or guessed Plus points. Only configured PSP offers.
        self::scope(array_replace($p,['cart'=>$p['items']??null,'contextKey'=>hash('sha256',self::text($p['requestKey']??'',100000))]));
        $resolver=$this->config['offerResolver']??null;
        if(!is_callable($resolver))self::fail('COMMERCE_OFFER_ADAPTER_REQUIRED');
        $value=$resolver($p,$a);
        if(!is_array($value)||($value['requestKey']??null)!==($p['requestKey']??null)||strtotime($value['expiresAt']??'')<=time()||strtotime($value['expiresAt'])>time()+1800||!is_array($value['delivery']??null))self::fail('COMMERCE_OFFER_INVALID');
        foreach($value['delivery']as$d)if(!is_array($d)||!in_array($d['method']??'', ['pickup','point','courier','terminal'],true)||empty($d['id'])||empty($d['name'])||empty($d['period'])||!is_int($d['priceKopecks']??null)||$d['priceKopecks']<0)self::fail('COMMERCE_OFFER_INVALID');
        if($p['context']!=='personal')unset($value['plus'],$value['split']);
        if(isset($value['plus'])&&(!is_int($value['plus']['points']??null)||$value['plus']['points']<0||empty($value['plus']['terms'])))self::fail('COMMERCE_OFFER_INVALID');
        if(isset($value['split'])){if(empty($value['split']['terms'])||empty($value['split']['payments'])||!is_array($value['split']['payments']))self::fail('COMMERCE_OFFER_INVALID');foreach($value['split']['payments']as$pay)if(empty($pay['label'])||!is_int($pay['amountKopecks']??null)||$pay['amountKopecks']<0)self::fail('COMMERCE_OFFER_INVALID');}
        $out=['requestKey'=>$value['requestKey'],'expiresAt'=>$value['expiresAt'],'delivery'=>[]];
        foreach($value['delivery']as$d){$safe=['id'=>self::text((string)$d['id'],200),'name'=>self::text($d['name'],500),'method'=>$d['method'],'priceKopecks'=>$d['priceKopecks'],'period'=>self::text($d['period'],500)];foreach(['address','trackingLabel']as$k)if(isset($d[$k]))$safe[$k]=self::text($d[$k],500);$out['delivery'][]=$safe;}
        if(isset($value['plus']))$out['plus']=['points'=>$value['plus']['points'],'terms'=>self::text($value['plus']['terms'],2000)];
        if(isset($value['split']))$out['split']=['terms'=>self::text($value['split']['terms'],2000),'payments'=>array_map(static fn($r)=>['label'=>self::text($r['label'],100),'amountKopecks'=>$r['amountKopecks']],$value['split']['payments'])];
        return $out;
    }
    public static function consents($consents,bool $business=false,?array $definitions=null): void
    {
        $definitions??=json_decode(file_get_contents(__DIR__.'/../form-contracts.json'),true,512,JSON_THROW_ON_ERROR)['forms']['checkout']['consents'];
        $expected=array_values(array_filter($definitions,static fn($c)=>!$business||!in_array('offer',$c['documents'],true)));
        if(!is_array($consents)||count($consents)!==count($expected))self::fail('CONSENT_REQUIRED',422);
        foreach($expected as $item){$matches=array_values(array_filter($consents,static fn($c)=>is_array($c)&&($c['name']??null)===$item['name']));
            if(count($matches)!==1||($matches[0]['accepted']??null)!==true||!is_array($matches[0]['documentIds']??null))self::fail('CONSENT_REQUIRED',422);
            $actual=$matches[0]['documentIds'];$wanted=$item['documents'];sort($actual);sort($wanted);if($actual!==$wanted)self::fail('CONSENT_REQUIRED',422);
        }
    }
    public static function paymentUrl(string $url,array $hosts): void
    {
        $p=parse_url($url);if(!$p||($p['scheme']??'')!=='https'||isset($p['user'])||isset($p['pass'])||(isset($p['port'])&&$p['port']!==443)||!in_array(strtolower($p['host']??''),$hosts,true)||preg_match('/[\x00-\x20]/',$url))self::fail('PAYMENT_URL_INVALID');
    }
    public static function money($value): int
    {
        if(!is_numeric($value)||!is_finite((float)$value)||(float)$value<0||(float)$value>90000000000)self::fail('INVALID_MONEY');
        return (int)round((float)$value*100,0,PHP_ROUND_HALF_UP);
    }
    private static function text($s,int $max):string {if(!is_string($s)||strlen($s)>$max*4||preg_match('/[\x00-\x1f]/',$s))self::fail('INVALID_FIELD',400);return trim($s);}
    private static function scopeHash(array $p):string{return hash('sha256',json_encode($p,JSON_THROW_ON_ERROR));}
    private static function actorKey(array $a,array $p):string{return hash('sha256',$a['sessionKey'].'|'.$a['userId'].'|'.$p['context']);}
    private static function result($result,string $code):void {if($result===false)self::fail($code);if(is_object($result)&&method_exists($result,'isSuccess')&&!$result->isSuccess())self::fail($code);}
    private static function fail(string $code,int $status=503):never {throw new RuntimeExceptionCode($code,$status);}
}
