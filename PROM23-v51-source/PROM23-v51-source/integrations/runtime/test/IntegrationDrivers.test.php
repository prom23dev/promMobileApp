<?php
declare(strict_types=1);
require_once __DIR__.'/../src/Protocol.php';
require_once __DIR__.'/../src/ServiceDriver.php';
require_once __DIR__.'/../src/WorkspaceDriver.php';
require_once __DIR__.'/../src/PublicationDriver.php';
require_once __DIR__.'/../src/OrderActionDriver.php';
use Prom23\Runtime\{ServiceDriver,PublicationDriver,WorkspaceDriver,OrderActionDriver,RuntimeExceptionCode};
$count=0;
function assertDriver(bool $value,string $name):void{global$count;if(!$value)throw new RuntimeException('FAIL '.$name);$count++;}
function rejectDriver(callable $fn,string $code):void{try{$fn();}catch(RuntimeExceptionCode $e){assertDriver($e->getMessage()===$code,'expected '.$code);return;}throw new RuntimeException('Expected rejection '.$code);}
$actor=['userId'=>1,'organizationId'=>3,'sessionKey'=>str_repeat('a',64)];
$schema=['repeatedItems'=>['items'=>[['key'=>'10','label'=>'Fixture A','quantityMax'=>3,'options'=>['reason'=>[['value'=>'broken','label'=>'Fixture reason'],['value'=>'other','label'=>'Other fixture']]]],['key'=>'20','label'=>'Fixture B','quantityMax'=>2,'options'=>['reason'=>[['value'=>'other','label'=>'Other fixture']]]]]]];
$v=['selected-products'=>['20','10'],'items'=>[['key'=>'10','values'=>['quantity'=>'1','reason'=>['broken'],'comment'=>'Fixture A','photos[]'=>[['uploadToken'=>'token-fixture']]]],['key'=>'20','values'=>['quantity'=>'1','reason'=>['other'],'comment'=>'Fixture B']]]];
$mapped=ServiceDriver::returnPost($v,$schema,99);
assertDriver($mapped['post']['orderID']===99&&$mapped['post']['item-1-id']===20&&$mapped['post']['item-2-id']===10,'source selected order and source IDs');
assertDriver($mapped['post']['item-2-reason-1']==='broken','canonical reason XML ID');
assertDriver($mapped['uploads']['item-2-photos[0]']===['field'=>'items:10:photos[]','token'=>'token-fixture'],'file index stays bound to selected item');
$bad=$v;$bad['items'][0]['key']='999';rejectDriver(fn()=>ServiceDriver::returnPost($bad,$schema,99),'VALIDATION_ERROR');
$bad=$v;$bad['selected-products'][]='10';rejectDriver(fn()=>ServiceDriver::returnPost($bad,$schema,99),'VALIDATION_ERROR');
$bad=$v;$bad['items'][0]['values']['reason']=['invented'];rejectDriver(fn()=>ServiceDriver::returnPost($bad,$schema,99),'VALIDATION_ERROR');
$bad=$v;$bad['items'][0]['values']['comment']=' ';rejectDriver(fn()=>ServiceDriver::returnPost($bad,$schema,99),'VALIDATION_ERROR');
$bad=$v;$bad['items'][]=$bad['items'][0];rejectDriver(fn()=>ServiceDriver::returnPost($bad,$schema,99),'VALIDATION_ERROR');
$bad=$v;$bad['items'][0]['values']['userId']='2';rejectDriver(fn()=>ServiceDriver::returnPost($bad,$schema,99),'VALIDATION_ERROR');
class FixtureProperty {function __construct(private int $org){}function getValue(){return$this->org;}}
class FixtureProperties {function __construct(private int $org){}function getItemByOrderPropertyCode($code){return new FixtureProperty($this->org);}}
class FixtureOrder {function __construct(private int $user,private int $org,private int $person=2){}function getUserId(){return$this->user;}function getPropertyCollection(){return new FixtureProperties($this->org);}function getPersonTypeId(){return$this->person;}}
ServiceDriver::ownedOrder(new FixtureOrder(1,3),$actor);assertDriver(true,'owned B2B order');
rejectDriver(fn()=>ServiceDriver::ownedOrder(new FixtureOrder(2,3),$actor),'NOT_FOUND');
rejectDriver(fn()=>ServiceDriver::ownedOrder(new FixtureOrder(1,4),$actor),'NOT_FOUND');
rejectDriver(fn()=>ServiceDriver::ownedOrder(new FixtureOrder(1,0,2),[...$actor,'organizationId'=>0]),'NOT_FOUND');
$row=['UF_ACTIVE'=>true,'UF_TARGET_ID'=>10,'UF_USER_ID'=>1,'UF_ORGANIZATION_ID'=>3];PublicationDriver::authorizedRow($row,10,$actor,true);assertDriver(true,'owned publication');
rejectDriver(fn()=>PublicationDriver::authorizedRow($row,11,$actor,true),'NOT_FOUND');
rejectDriver(fn()=>PublicationDriver::authorizedRow($row,10,[...$actor,'organizationId'=>4],true),'NOT_FOUND');
rejectDriver(fn()=>PublicationDriver::authorizedRow([...$row,'UF_ACTIVE'=>false],10,$actor,false),'NOT_FOUND');
PublicationDriver::authorizedRow($row,10,[...$actor,'userId'=>0,'organizationId'=>0],false);assertDriver(true,'guest can reference published parent without editing it');
rejectDriver(fn()=>WorkspaceDriver::filters(['sort'=>'sql-injection']),'VALIDATION_ERROR');
rejectDriver(fn()=>WorkspaceDriver::filters(['rating'=>6]),'VALIDATION_ERROR');
rejectDriver(fn()=>WorkspaceDriver::filters(['withMedia'=>'yes']),'VALIDATION_ERROR');
class FixtureItem {function __construct(private int $id,private float $q){}function getProductId(){return$this->id;}function getQuantity(){return$this->q;}}
$cart=OrderActionDriver::repeatItems([new FixtureItem(10,2),new FixtureItem(20,1)],fn($id)=>$id===10);assertDriver($cart===[['productId'=>'prom-10','quantity'=>2]],'repeat skips unavailable product without inventing replacement');
rejectDriver(fn()=>OrderActionDriver::repeatItems([new FixtureItem(10,1.5)],fn()=>true),'ORDER_ITEMS_INVALID');
rejectDriver(fn()=>OrderActionDriver::repeatItems([new FixtureItem(10,1),new FixtureItem(10,2)],fn()=>true),'ORDER_ITEMS_INVALID');
rejectDriver(fn()=>OrderActionDriver::repeatItems([new FixtureItem(10,1)],fn()=>false),'ORDER_ITEMS_UNAVAILABLE');
rejectDriver(fn()=>OrderActionDriver::cancelAllowed('finished',['new','assembly']),'ORDER_CANNOT_CANCEL');
echo $count." integration driver policy checks PASS; pure fixtures, no source bootstrap/DB/network\n";
