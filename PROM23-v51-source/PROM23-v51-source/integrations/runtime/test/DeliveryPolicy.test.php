<?php
declare(strict_types=1);
/** Tests the real region/property path with isolated source table doubles. No Bitrix/provider bootstrap. */
namespace Bitrix\Sale\Location {
    class LocationTable {static function getList(array $query){return new class {function fetch(){return ['ID'=>1,'CODE'=>'fixture-location'];}};}}
}
namespace Bitrix\Sale\Services\Base {class RestrictionManager {const MODE_CLIENT=1;}}
namespace Bitrix\Sale\Delivery\Services {
    class Manager {
        static function getRestrictedList($shipment,$mode){return array_map(static fn($id)=>['ID'=>$id,'NAME'=>'Fixture service '.$id],[201,202,301,302,707]);}
        static function getObjectById($id){return new class {function getName(){return 'Fixture service';}};}
    }
}
namespace {
require_once __DIR__.'/../src/Protocol.php';require_once __DIR__.'/../src/CommerceDriver.php';
use Prom23\Runtime\{CommerceDriver,RuntimeExceptionCode};
define('IBLOCK_ID_REGIONS',901);define('DELIVERY_SERVICE_YANDEX_COURIER_ID',707);
class RegionFixtureRows {
    private int $i=0;function __construct(private array $rows){}function Fetch(){return $this->rows[$this->i++]??false;}
}
class CIBlockElement {
    static function GetList(...$args){return new RegionFixtureRows([['ID'=>1,'NAME'=>'Fixture region']]);}
    static function GetProperty(...$args){$out=[];foreach(['PRICE_CODE'=>['FIXTURE','FIXTURE_SALE'],'STORE'=>[11],'DELIVERY_SERVICE_PICKUP'=>[101],'DELIVERY_SERVICE_PICKUP_TK'=>[201,202],'DELIVERY_SERVICE_TK'=>[301,707,302],'PAYMENT_SYSTEM'=>[14,16,17]]as$code=>$values)foreach($values as$value)$out[]=['CODE'=>$code,'VALUE'=>$value];return new RegionFixtureRows($out);}
}
$count=0;
function policyCheck(bool $ok,string $name):void{global$count;if(!$ok)throw new \RuntimeException('FAIL '.$name);$count++;echo'PASS '.$name."\n";}
$gar='11111111-1111-4111-8111-111111111111';$point=static fn(...$args)=>[['pointId'=>'fixture-point','name'=>'Fixture point','address'=>'Fixture address']];
$config=['commerce'=>[
    'regionBySettlement'=>[$gar=>['personal'=>['regionId'=>1,'locationCode'=>'fixture-location'],'organization'=>['regionId'=>1,'locationCode'=>'fixture-location']]],
    // Deliberately classify provider IDs independently of the property's legacy group name.
    'deliveryMethods'=>[201=>'pvz',202=>'terminal',301=>'terminal',302=>'pvz',707=>'courier'],
    'pointResolvers'=>[201=>$point,202=>$point,301=>$point,302=>$point],
]];
$driver=new CommerceDriver($config);$regionMethod=new \ReflectionMethod(CommerceDriver::class,'region');$optionsMethod=new \ReflectionMethod(CommerceDriver::class,'deliveryOptions');
$p=['context'=>'personal','settlementId'=>$gar,'delivery'=>'pvz'];$a=['userId'=>1,'organizationId'=>0];
$physical=$regionMethod->invoke($driver,$p,$a);
policyCheck($physical['courier']===[],'physical excludes DELIVERY_SERVICE_TK group');
policyCheck($physical['terminal']===[201,202],'physical retains DELIVERY_SERVICE_PICKUP_TK IDs');
policyCheck($physical['pickup']===101&&$physical['storeId']===11,'own pickup and warehouse unchanged');
policyCheck($physical['payments']===[14,16,17]&&$physical['priceCodes']===['FIXTURE','FIXTURE_SALE'],'delivery policy does not alter prices/payment groups');
$options=$optionsMethod->invoke($driver,null,null,$p,$physical);
policyCheck(array_column($options,'sourceId')===['201']&&$options[0]['method']==='pvz','physical pickup-TK service remains selectable as configured PVZ');
$options=$optionsMethod->invoke($driver,null,null,[...$p,'delivery'=>'terminal'],$physical);
policyCheck(array_column($options,'sourceId')===['202'],'physical terminal UI preference uses actual private service classification');
$legal=$regionMethod->invoke($driver,[...$p,'context'=>'organization:9'],['userId'=>1,'organizationId'=>9]);
policyCheck($legal['courier']===[301,302],'legal removes only configured Yandex courier constant from TK group');
policyCheck($legal['terminal']===[201,202]&&$legal['pickup']===101,'legal retains pickup-TK and own pickup');
$options=$optionsMethod->invoke($driver,null,null,[...$p,'context'=>'organization:9'],$legal);
policyCheck(array_column($options,'sourceId')===['201','302'],'legal PVZ selection spans eligible groups by private classification');
$options=$optionsMethod->invoke($driver,null,null,[...$p,'context'=>'organization:9','delivery'=>'terminal'],$legal);
policyCheck(array_column($options,'sourceId')===['202','301'],'legal terminal keeps non-Yandex providers');
try{$optionsMethod->invoke($driver,null,null,[...$p,'context'=>'organization:9','delivery'=>'courier'],$legal);throw new \RuntimeException('Expected unavailable Yandex courier');}
catch(RuntimeExceptionCode $e){policyCheck($e->getMessage()==='DELIVERY_NOT_AVAILABLE','excluded Yandex courier cannot reappear via UI preference');}
echo $count." delivery group policy checks PASS; isolated source tables, no provider or Bitrix runtime\n";
}
