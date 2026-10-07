<?php
declare(strict_types=1);
namespace LocationTest {class Cursor{function __construct(private array $rows){}function fetchAll(){return $this->rows;}}}
namespace Bitrix\Main {class Loader{static function includeModule($m){return $m==='sale';}}}
namespace Bitrix\Sale\Location {
 class ExternalTable {static array $ids=[['LOCATION_ID'=>77]],$zips=[['XML_ID'=>'350000']],$queries=[];static function getList($q){self::$queries[]=$q;return new \LocationTest\Cursor($q['filter']['=SERVICE.CODE']==='ZIP'?self::$zips:self::$ids);}}
 class LocationTable {static array $rows=[['ID'=>77,'CODE'=>'ACTUAL-SALE-CODE','LOCATION_NAME'=>'Динская']];static function getList($q){return new \LocationTest\Cursor(self::$rows);}}
}
namespace {
 require_once __DIR__.'/../src/Protocol.php';require_once __DIR__.'/../src/LocationDriver.php';
 use Prom23\Runtime\LocationDriver;use Prom23\Runtime\RuntimeExceptionCode;use Bitrix\Sale\Location\ExternalTable as E;
 $id='915703c4-731d-4ebe-b893-561d99982172';$d=new LocationDriver();$n=0;
 function ok($v,$s){global$n;if(!$v)throw new RuntimeException('FAIL '.$s);$n++;echo'PASS '.$s.PHP_EOL;}
 function rejects($f,$c){try{$f();}catch(RuntimeExceptionCode$e){ok($e->getMessage()===$c,$c);return;}throw new RuntimeException('FAIL '.$c);}
 $v=$d->resolve(strtoupper($id));ok($v===['settlementId'=>$id,'locationCode'=>'ACTUAL-SALE-CODE','name'=>'Динская','zip'=>'350000'],'exact identity resolves village without CITY-only filter');ok(E::$queries[0]['filter']===['=XML_ID'=>$id,'=SERVICE.CODE'=>'FIAS'],'UUID filter, never free display name');
 rejects(fn()=>$d->resolve('Динская'),'SETTLEMENT_REQUIRED');rejects(fn()=>$d->resolve(str_repeat('-',36)),'SETTLEMENT_REQUIRED');
 E::$zips=[['XML_ID'=>'350000'],['XML_ID'=>'350001']];ok($d->resolve($id)['zip']==='','multiple city postcodes never guessed');
 E::$ids=[];rejects(fn()=>$d->resolve($id),'LOCATION_MAPPING_REQUIRED');E::$ids=[['LOCATION_ID'=>1],['LOCATION_ID'=>2]];rejects(fn()=>$d->resolve($id),'LOCATION_MAPPING_AMBIGUOUS');
 E::$ids=[['LOCATION_ID'=>77]];\Bitrix\Sale\Location\LocationTable::$rows=[];rejects(fn()=>$d->resolve($id),'LOCATION_MAPPING_INVALID');
 rejects(fn()=>(new LocationDriver(['location'=>['externalServiceCode'=>'NAME']]))->resolve($id),'LOCATION_SCHEMA_UNAVAILABLE');

 // effectiveSettlement(): Regions.php:465-481 DEFAULT_CITY override for personal buyers off the site's CIS domain.
 $defaultId='00000000-0000-0000-0000-000000000001';$otherId='11111111-1111-1111-1111-111111111111';
 $withDomain=fn($domain,$cis=null)=>new LocationDriver(['location'=>array_filter(['siteDomain'=>$domain,'cisDomains'=>$cis,'defaultSettlementId'=>$defaultId])]);
 ok($withDomain('space')->effectiveSettlement($otherId,'personal')===$defaultId,'personal buyer off CIS domain forced to DEFAULT_CITY');
 ok($withDomain('space')->effectiveSettlement($otherId,'organization')===$otherId,'legal buyer keeps their picked settlement');
 ok($withDomain('kg')->effectiveSettlement($otherId,'personal')===$otherId,'personal buyer on a configured CIS domain keeps their picked settlement');
 ok($withDomain('kg',['kg','am'])->effectiveSettlement($otherId,'personal')===$otherId,'custom cisDomains list is honored');
 ok($withDomain('am',['kg'])->effectiveSettlement($otherId,'personal')===$defaultId,'domain not in the configured cisDomains list still forces DEFAULT_CITY');
 rejects(fn()=>(new LocationDriver([]))->effectiveSettlement($otherId,'personal'),'LOCATION_DOMAIN_UNAVAILABLE');
 rejects(fn()=>(new LocationDriver(['location'=>['siteDomain'=>'space']]))->effectiveSettlement($otherId,'personal'),'DEFAULT_SETTLEMENT_MAPPING_REQUIRED');

 // loadRegionBySettlement(): manifest/content cross-check, modeled on server/location/provider.mjs refresh().
 $tmp=sys_get_temp_dir().'/prom23-rbs-test-'.bin2hex(random_bytes(4));mkdir($tmp);
 $writeManifest=function($overrides)use($tmp){file_put_contents($tmp.'/manifest.json',json_encode(array_replace([
     'schemaVersion'=>1,'provider'=>'bitrix-iblock22-region-mapping','providerVersion'=>'20260922',
     'sourceGarProviderVersion'=>'20260911','settlementCount'=>1,'regionCount'=>1,'unmatchedCount'=>0,
 ],$overrides)));};
 $goodJson=[$otherId=>['personal'=>['regionId'=>2868,'locationCode'=>'ACTUAL-SALE-CODE'],'organization'=>['regionId'=>2868,'locationCode'=>'ACTUAL-SALE-CODE']]];
 file_put_contents($tmp.'/rbs.json',json_encode($goodJson));$writeManifest([]);
 ok(LocationDriver::loadRegionBySettlement($tmp.'/rbs.json',$tmp.'/manifest.json')===$goodJson,'matching manifest loads regionBySettlement.json');
 $writeManifest(['settlementCount'=>2]);
 rejects(fn()=>LocationDriver::loadRegionBySettlement($tmp.'/rbs.json',$tmp.'/manifest.json'),'REGION_MAPPING_MANIFEST_INVALID');
 $writeManifest(['regionCount'=>2]);
 rejects(fn()=>LocationDriver::loadRegionBySettlement($tmp.'/rbs.json',$tmp.'/manifest.json'),'REGION_MAPPING_MANIFEST_INVALID');
 unlink($tmp.'/rbs.json');unlink($tmp.'/manifest.json');rmdir($tmp);
 rejects(fn()=>LocationDriver::loadRegionBySettlement($tmp.'/rbs.json',$tmp.'/manifest.json'),'REGION_MAPPING_CONFIG_UNAVAILABLE');

 echo'TOTAL '.$n.' PASS; source ORM execution still requires installed Bitrix'.PHP_EOL;
}
