<?php
declare(strict_types=1);
require_once __DIR__.'/../src/Protocol.php';
require_once __DIR__.'/../src/ServiceDriver.php';
require_once __DIR__.'/../src/ReturnWriter.php';
use Prom23\Runtime\{ReturnWriter,ServiceDriver,RuntimeExceptionCode};
define('IBLOCK_ID_RETURNS',7);
class CIBlockPropertyEnum {static function GetList($a,$b){return new class {function Fetch(){return ['ID'=>9];}};}}
class CIBlockElement {static function GetList($a,$b,$c,$d,$e){return new class {function GetNext(){return ['DETAIL_PAGE_URL'=>'/catalog/fixture/'];}};}public static array $rows=[]; public static bool $fail=false;function Add($row){if(self::$fail)return false;self::$rows[]=$row;return count(self::$rows);}}
class CFile {public static array $deleted=[];static function SaveFile($a,$b,$c){return 42;}static function GetFileArray($id){return ['SRC'=>'/upload/fixture.jpg'];}static function Delete($id){self::$deleted[]=$id;}}
$count=0;function ck($v){global$count;if(!$v)throw new Exception('Assertion '.($count+1));$count++;}
$schema=['repeatedItems'=>['items'=>[['key'=>'10','label'=>'Fixture','quantityMax'=>2.5,'options'=>['reason'=>[['value'=>'defect','label'=>'Недостаток']]]]]]];
$v=['selected-products'=>['10'],'items'=>[['key'=>'10','values'=>['quantity'=>'1.5','reason'=>['defect'],'comment'=>'Fixture comment','photos[]'=>[]]]]];
$m=ServiceDriver::returnPost($v,$schema,15);ck($m['post']['item-1-quantity']===1.5);
foreach(['0','-1','3','1e1','NaN','1.0001',''] as $q){$bad=$v;$bad['items'][0]['values']['quantity']=$q;try{ServiceDriver::returnPost($bad,$schema,15);throw new Exception('Allowed bad quantity');}catch(RuntimeExceptionCode $e){ck($e->getMessage()==='VALIDATION_ERROR');}}
$writer=new ReturnWriter();$a=['userId'=>1,'organizationId'=>3];
$r=$writer->save($m['post'],[],$schema,$a);ck($r===['status'=>'accepted','reference'=>'return-1']);
$r=$writer->save($m['post'],[],$schema,$a);ck($r['reference']==='return-2');ck(count(CIBlockElement::$rows)===2); // repeated claim must not be rejected
$row=CIBlockElement::$rows[0]['PROPERTY_VALUES'];ck($row['USER_ID']===1&&$row['ORGANIZATION_ID']===3&&$row['ORDER_ID']===15);
$item=json_decode($row['JSON_RETURNS'][0],true);ck($item['QUANTITY']===1.5&&$item['GOOD']['ID']===10&&$item['REASONS'][0]['XML_ID']==='defect');
CIBlockElement::$fail=true;try{$writer->save($m['post'],['item-1-photos[0]'=>['name'=>'fixture.jpg']],$schema,$a);throw new Exception('Expected DB failure');}catch(RuntimeExceptionCode $e){ck(CFile::$deleted===[42]);}
echo "$count return checks PASS; isolated stubs, no Bitrix bootstrap or real orders\n";
