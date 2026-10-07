<?php
declare(strict_types=1);
/** Isolated HTTP/Sale doubles. No network, database, secrets, source bootstrap or carrier writes. */
require_once __DIR__.'/../src/Protocol.php';
require_once __DIR__.'/../src/DeliveryDriver.php';
use Prom23\Runtime\DeliveryDriver as Driver;
use Prom23\Runtime\RuntimeExceptionCode;
$count=0;
function ok(bool $v,string $name):void {global $count;if(!$v)throw new RuntimeException('FAIL '.$name);$count++;echo 'PASS '.$name."\n";}
function rejects(callable $fn,string $code,string $name):void {try{$fn();}catch(RuntimeExceptionCode $e){ok($e->getMessage()===$code,$name.' ['.$e->getMessage().']');return;}throw new RuntimeException('FAIL '.$name.' accepted');}
class TestDeliveryResult {public function __construct(private bool $success=true){}public function isSuccess(){return $this->success;}}
class TestDeliveryProperty {public int $writes=0;public function __construct(public string $code,public string $value=''){}public function getField($key){return $this->code;}public function getValue(){return $this->value;}public function setValue($v){$this->value=$v;$this->writes++;return new TestDeliveryResult();}}
class TestDeliveryOrder {public array $props=[];public function __construct(array $codes){foreach($codes as $code)$this->props[$code]=new TestDeliveryProperty($code,$code==='LOCATION'?'SALE-UNIT':'');}public function getPropertyCollection(){return array_values($this->props);}public function writes(){return array_sum(array_map(fn($p)=>$p->writes,$this->props));}}
class TestDeliveryShipment {public function __construct(private int $id){}public function getField($key){return $this->id;}}
class TestDeliveryElement {public function GetFields(){return ['ID'=>77,'IBLOCK_ID'=>22,'NAME'=>'SOURCE UNIT POINT'];}public function GetProperties(){return ['ADRES'=>['VALUE'=>'SOURCE UNIT ADDRESS'],'MAP'=>['VALUE'=>'45.01,39.02']];}}
class TestDeliveryCursor {private bool $read=false;public function GetNextElement(){if($this->read)return false;$this->read=true;return new TestDeliveryElement();}}
class CIBlockElement {public static array $filter=[];public static function GetList($order,$filter,$group,$nav,$select){self::$filter=$filter;return new TestDeliveryCursor();}}
$gar='7dfa745e-aa19-4688-b121-b655c11e482f';$other='11111111-1111-4111-8111-111111111111';
$config=['delivery'=>['services'=>[10=>['provider'=>'cdek','method'=>'pvz','propertyCodes'=>['pointId'=>'CDEK_POINT','cityCode'=>'CDEK_CITY']],20=>['provider'=>'yandex','method'=>'pvz','propertyCodes'=>['pointId'=>'YANDEX_POINT'],'receiptPaymentMethod'=>'card_on_receipt'],30=>['provider'=>'sale','method'=>'terminal','pointIblockId'=>22,'propertyCodes'=>['pointId'=>'SALE_POINT']],40=>['provider'=>'yandex','method'=>'courier','propertyCodes'=>['latitude'=>'LATITUDE','longitude'=>'LONGITUDE','houseId'=>'HOUSE_GAR','postalCode'=>'ZIP']]],'settlementMap'=>[$gar=>['locationCode'=>'SALE-UNIT','cdekCityCode'=>44,'yandexGeoId'=>35,'salePointIds'=>[30=>[77]]]],'cdek'=>['clientId'=>'ISOLATED_TEST_ID','clientSecret'=>'ISOLATED_TEST_SECRET'],'yandex'=>['token'=>'ISOLATED_TEST_TOKEN'],'dadata'=>['token'=>'ISOLATED_TEST_TOKEN']]];
$scope=['settlementId'=>$gar,'locationVersion'=>2,'contextKey'=>str_repeat('a',64),'context'=>'personal','payment'=>'online','address'=>'UNIT CANONICAL ADDRESS'];
$cdekRow=['code'=>'KRD-UNIT','name'=>'CDEK UNIT POINT','type'=>'PVZ','have_cashless'=>true,'have_cash'=>false,'location'=>['city_code'=>44,'address_full'=>'UNIT CDEK ADDRESS','latitude'=>45.1,'longitude'=>39.2]];
$yandexRow=['id'=>'yandex-unit-point','name'=>'YANDEX UNIT POINT','type'=>'pickup_point','operator_id'=>'market_l4g','payment_methods'=>['already_paid','card_on_receipt'],'address'=>['geoId'=>35,'full_address'=>'UNIT YANDEX ADDRESS'],'position'=>['latitude'=>45.1,'longitude'=>39.2]];
$addressRow=['value'=>'UNIT CANONICAL ADDRESS','unrestricted_value'=>'UNIT FULL ADDRESS','data'=>['country_iso_code'=>'RU','city_fias_id'=>$gar,'settlement_fias_id'=>null,'house'=>'1','house_fias_id'=>'22222222-2222-4222-8222-222222222222','geo_lat'=>'45.11','geo_lon'=>'39.21','postal_code'=>'123456']];
$calls=[];
$http=function($method,$url,$headers,$body)use(&$calls,$cdekRow,$yandexRow,$addressRow){$calls[]=['method'=>$method,'url'=>$url,'body'=>$body];if(str_contains($url,'oauth'))$value=['access_token'=>'isolated-test-access-token'];elseif(str_contains($url,'deliverypoints'))$value=[$cdekRow,array_replace_recursive($cdekRow,['code'=>'OTHER-CITY','location'=>['city_code'=>999]])];elseif(str_contains($url,'pickup-points'))$value=['points'=>[$yandexRow,array_replace_recursive($yandexRow,['id'=>'other-geo','address'=>['geoId'=>999]])]];else$value=['suggestions'=>[$addressRow]];return ['status'=>200,'body'=>json_encode($value)];};
$d=new Driver($config,$http);$cb=$d->callbacks();
ok(count($cb['pointResolvers'])===3&&count($cb['deliveryBinders'])===4&&!isset($cb['pointResolvers'][40]),'concrete callbacks for three point services and courier binding');
$points=$d->resolvePoints(10,$gar,'SALE-UNIT',$scope);ok(count($points)===1&&$points[0]['pointId']==='KRD-UNIT','CDEK authoritative code and same-city filtering');
ok(str_contains($calls[1]['url'],'city_code=44')&&str_contains($calls[1]['url'],'type=PVZ'),'CDEK maps GAR to city code, never city name');
ok($calls[0]['method']==='POST'&&str_contains($calls[0]['body'],'grant_type=client_credentials'),'CDEK OAuth performed by concrete transport');
$before=count($calls);$d->resolvePoints(10,$gar,'SALE-UNIT',$scope);ok(count($calls)===$before,'request-scoped point cache avoids duplicate read during binder');
$d->resolvePoints(10,$gar,'SALE-UNIT',array_replace($scope,['payment'=>'receipt']));ok(count($calls)===$before+1,'payment selection invalidates points cache');
$y=$d->resolvePoints(20,$gar,'SALE-UNIT',$scope);ok(count($y)===1&&$y[0]['pointId']==='yandex-unit-point','Yandex points envelope parsed and wrong geo excluded');
$body=json_decode(end($calls)['body'],true);ok($body['geo_id']===35&&$body['operator_ids']===['market_l4g']&&!isset($body['latitude'],$body['longitude']),'Yandex exact geo mapping without copied city bounding box or new operators');
$sale=$d->resolvePoints(30,$gar,'SALE-UNIT',$scope);ok($sale[0]['pointId']==='77'&&CIBlockElement::$filter['ACTIVE']==='Y'&&CIBlockElement::$filter['ID']===[77],'Sale reads explicitly mapped active source iblock points');
rejects(fn()=>$d->resolvePoints(10,$gar,'OTHER-SALE',$scope),'DELIVERY_LOCATION_MAPPING_REQUIRED','Sale location mismatch');
rejects(fn()=>$d->resolvePoints(10,$other,'SALE-UNIT',$scope),'DELIVERY_SCOPE_INVALID','different GAR scope rejected');
rejects(fn()=>$d->resolvePoints(10,$gar,'SALE-UNIT',array_replace($scope,['context'=>'business'])),'DELIVERY_SCOPE_INVALID','unverified business intent cannot bind commerce scope');
$option=['sourceId'=>'10','method'=>'pvz']+$points[0];$order=new TestDeliveryOrder(['LOCATION','ADDRESS','CDEK_POINT','CDEK_CITY']);
ok($d->bind(10,$order,new TestDeliveryShipment(10),$option,$scope),'CDEK binder accepts freshly resolved point');
ok($order->props['ADDRESS']->value==='KRD-UNIT UNIT CDEK ADDRESS'&&$order->props['CDEK_POINT']->value==='KRD-UNIT'&&$order->props['CDEK_CITY']->value==='44','source address code plus installed carrier point/city properties retained');
$order=new TestDeliveryOrder(['LOCATION','ADDRESS','CDEK_POINT','CDEK_CITY']);
rejects(fn()=>$d->bind(10,$order,new TestDeliveryShipment(10),array_replace($option,['pointId'=>'forged']),$scope),'DELIVERY_POINT_NOT_AVAILABLE','forged point id rejected');
rejects(fn()=>$d->bind(10,$order,new TestDeliveryShipment(10),array_replace($option,['address'=>'forged']),$scope),'DELIVERY_POINT_CHANGED','forged display address rejected');
rejects(fn()=>$d->bind(10,$order,new TestDeliveryShipment(20),$option,$scope),'DELIVERY_SELECTION_INVALID','shipment service identity required');ok($order->writes()===0,'invalid option causes no property writes');
$order=new TestDeliveryOrder(['LOCATION','ADDRESS']);rejects(fn()=>$d->bind(10,$order,new TestDeliveryShipment(10),$option,$scope),'DELIVERY_PROPERTY_MAPPING_REQUIRED','missing installed carrier property rejected');ok($order->writes()===0,'property map validated before writes');
$invalid=$config;$invalid['delivery']['services'][10]['propertyCodes']['pointId']='EMAIL';$bad=new Driver($invalid,$http);rejects(fn()=>$bad->bind(10,new TestDeliveryOrder(['LOCATION','ADDRESS','EMAIL']),new TestDeliveryShipment(10),$option,$scope),'DELIVERY_PROPERTY_MAPPING_INVALID','mapping cannot overwrite buyer identity');
$actor=['userId'=>0,'organizationId'=>0,'sessionKey'=>str_repeat('b',64)];$payload=['sessionKey'=>$actor['sessionKey'],'context'=>'personal','settlementId'=>$gar,'locationVersion'=>2,'query'=>'UNIT CANONICAL ADDRESS'];
$answers=$d->addressSuggestions($payload,$actor);ok($answers===['suggestions'=>[['address'=>'UNIT CANONICAL ADDRESS']]],'guest address suggestions expose only canonical display address');
$body=json_decode(end($calls)['body'],true);ok($body['locations']===[['fias_id'=>$gar]]&&$body['restrict_value']===true&&$body['count']===10,'DaData bounded to chosen GAR, max ten candidates');
rejects(fn()=>$d->addressSuggestions(array_replace($payload,['sessionKey'=>str_repeat('c',64)]),$actor),'AUTH_REQUIRED','address read session binding');
rejects(fn()=>$d->addressSuggestions(array_replace($payload,['context'=>'organization:7']),$actor),'FORBIDDEN','address read cannot forge organization');
$order=new TestDeliveryOrder(['LOCATION','ADDRESS','LATITUDE','LONGITUDE','HOUSE_GAR','ZIP']);$co=['sourceId'=>'40','method'=>'courier'];ok($d->bind(40,$order,new TestDeliveryShipment(40),$co,$scope),'courier canonical address binds after fresh provider lookup');
ok($order->props['ADDRESS']->value==='UNIT CANONICAL ADDRESS'&&$order->props['LATITUDE']->value==='45.11'&&$order->props['LONGITUDE']->value==='39.21'&&$order->props['ZIP']->value==='123456','courier address coordinates house and actual postcode retained');
$order=new TestDeliveryOrder(['LOCATION','ADDRESS','LATITUDE','LONGITUDE','HOUSE_GAR','ZIP']);rejects(fn()=>$d->bind(40,$order,new TestDeliveryShipment(40),$co,array_replace($scope,['address'=>'UNIT AMBIGUOUS INPUT'])),'ADDRESS_CONFIRMATION_REQUIRED','provider first guess cannot silently replace typed address');ok($order->writes()===0,'unconfirmed corrected address causes no writes');
$wrongAddress=$addressRow;$wrongAddress['data']['settlement_fias_id']=$other;$bad=new Driver($config,fn()=>['status'=>200,'body'=>json_encode(['suggestions'=>[$wrongAddress]])]);ok($bad->addressSuggestions($payload,$actor)===['suggestions'=>[]],'more-specific different settlement excluded');
$noHouse=$addressRow;unset($noHouse['data']['house']);$bad=new Driver($config,fn()=>['status'=>200,'body'=>json_encode(['suggestions'=>[$noHouse]])]);ok($bad->addressSuggestions($payload,$actor)===['suggestions'=>[]],'street without house cannot become courier destination');
$bad=new Driver($config,fn()=>['status'=>200,'body'=>json_encode([$yandexRow])]);rejects(fn()=>$bad->resolvePoints(20,$gar,'SALE-UNIT',$scope),'DELIVERY_POINTS_RESPONSE_INVALID','legacy bare Yandex list is not current API envelope');
$bad=new Driver($config,fn()=>['status'=>503,'body'=>'PRIVATE PROVIDER FAILURE']);rejects(fn()=>$bad->resolvePoints(20,$gar,'SALE-UNIT',$scope),'DELIVERY_PROVIDER_UNAVAILABLE','provider body never exposed');
$bad=new Driver($config,fn()=>['status'=>200,'body'=>'<html>bad</html>']);rejects(fn()=>$bad->resolvePoints(20,$gar,'SALE-UNIT',$scope),'DELIVERY_PROVIDER_RESPONSE_INVALID','non-JSON provider body rejected');
$missing=$config;unset($missing['delivery']['yandex']['token']);$bad=new Driver($missing,$http);rejects(fn()=>$bad->resolvePoints(20,$gar,'SALE-UNIT',$scope),'DELIVERY_PROVIDER_CONFIG_REQUIRED','missing private credential is explicit, not fake empty list');
$many=[];for($i=0;$i<501;$i++)$many[]=array_replace($yandexRow,['id'=>'unit-'.$i]);$bad=new Driver($config,fn()=>['status'=>200,'body'=>json_encode(['points'=>$many])]);rejects(fn()=>$bad->resolvePoints(20,$gar,'SALE-UNIT',$scope),'DELIVERY_POINTS_LIMIT','oversized city list is not silently truncated');
$duplicate=new Driver($config,fn()=>['status'=>200,'body'=>json_encode(['points'=>[$yandexRow,$yandexRow]])]);rejects(fn()=>$duplicate->resolvePoints(20,$gar,'SALE-UNIT',$scope),'DELIVERY_POINTS_AMBIGUOUS','duplicate point identity rejected');
$unsafe=new ReflectionMethod(Driver::class,'request');foreach(['http://api.cdek.ru/','https://api.cdek.ru.evil.invalid/','https://user@api.cdek.ru/','https://api.cdek.ru:444/']as$url)rejects(fn()=>$unsafe->invoke($d,'GET',$url),'DELIVERY_PROVIDER_URL_INVALID','unsafe provider origin rejected');
echo 'TOTAL '.$count." PASS (isolated policy/HTTP/Sale doubles; no installed providers or production calls)\n";
