<?php
declare(strict_types=1);
/** Isolated policy/model doubles. No Bitrix bootstrap, DB, user account or sender. */
namespace ProfileTest {
 final class Cursor {public function __construct(private array $rows){}public function fetch(){return array_shift($this->rows)?:false;}}
 final class Result {public function __construct(private int$id=1){}public function isSuccess(){return true;}public function getId(){return$this->id;}}
 final class Connection {public function startTransaction(){}public function commitTransaction(){}public function rollbackTransaction(){}}
}
namespace Bitrix\Main {final class Application {public static function getConnection(){return new \ProfileTest\Connection();}}}
namespace Bitrix\Main\Type {final class DateTime {}}
namespace Prom\Model\EO {
 final class AddressDeliveryUsersTable {
  public static array$rows=[1=>['ID'=>1,'USER_ID'=>11,'ORGANIZATION_ID'=>null,'FULL_ADDRESS'=>'UNIT-A','LOCATION_CODE'=>'SALE-A','ZIP'=>'000000','IS_MAIN'=>true],2=>['ID'=>2,'USER_ID'=>22,'ORGANIZATION_ID'=>null,'FULL_ADDRESS'=>'OTHER-OWNER','LOCATION_CODE'=>'SALE-B','ZIP'=>null,'IS_MAIN'=>false],3=>['ID'=>3,'USER_ID'=>11,'ORGANIZATION_ID'=>7,'FULL_ADDRESS'=>'OTHER-CONTEXT','LOCATION_CODE'=>'SALE-C','ZIP'=>null,'IS_MAIN'=>false]];
  public static function getList($q){$rows=array_values(array_filter(self::$rows,static function($r)use($q){foreach($q['filter']as$k=>$v)if(($r[ltrim($k,'=')]??null)!==$v)return false;return true;}));return new \ProfileTest\Cursor($rows);}
  public static function add($fields){$id=max(array_keys(self::$rows))+1;self::$rows[$id]=['ID'=>$id]+$fields;return new \ProfileTest\Result($id);}
  public static function update($id,$fields){self::$rows[$id]=array_replace(self::$rows[$id],$fields);return new \ProfileTest\Result($id);}
  public static function delete($id){unset(self::$rows[$id]);return new \ProfileTest\Result($id);}
 }
}
namespace Prom23\Runtime {final class LocationDriver {public function __construct(array$c){}public function resolve(string$id):array{return['locationCode'=>'CONTRACT-LOCATION','zip'=>'000000','name'=>'Контрактный населённый пункт'];}}}
namespace {
 class CUser {
  public static array$user=['ID'=>11,'ACTIVE'=>'Y','UF_DELETE_ACCOUNT_BY_USER'=>false,'NAME'=>'Before','LAST_NAME'=>'Surname','EMAIL'=>'unit@example.invalid','LOGIN'=>'unit@example.invalid','PERSONAL_CITY'=>'City','UF_PHONE'=>'9000000000'];
  public static array$updates=[];
  public static function GetByID($id){return new \ProfileTest\Cursor($id===11?[self::$user]:[]);}
  public function Update($id,$fields){if($id!==11)return false;self::$updates[]=$fields;self::$user=array_replace(self::$user,$fields);return true;}
 }
 require_once __DIR__.'/../src/Protocol.php';require_once __DIR__.'/../src/ProfileDriver.php';
 use Prom23\Runtime\ProfileDriver as Driver;use Prom23\Runtime\RuntimeExceptionCode;
 $count=0;
 function ok(bool$v,string$name):void{global$count;if(!$v)throw new RuntimeException('FAIL '.$name);$count++;echo'PASS '.$name."\n";}
 function rejects(callable$fn,string$code,string$name):void{try{$fn();}catch(RuntimeExceptionCode$e){ok($e->getMessage()===$code,$name.' ['.$e->getMessage().']');return;}throw new RuntimeException('FAIL '.$name.' accepted');}
 $a=['userId'=>11,'organizationId'=>0,'sessionKey'=>str_repeat('a',64)];$p=['sessionKey'=>str_repeat('a',64),'context'=>'personal','target'=>[]];
 $forms=json_decode(file_get_contents(__DIR__.'/../form-contracts.json'),true,32,JSON_THROW_ON_ERROR)['forms'];
 $d=new Driver(['formContracts'=>$forms,'enabledForms'=>Driver::IDS]);
 $submit=function(string$id,array$values=[],array$target=[])use($d,$a,$p){$payload=$p+['formId'=>$id,'values'=>$values];$payload['target']=$target;$ctx=$d->run('forms.context',$payload,$a);return$d->run('forms.submit',$payload+['revision'=>$ctx['revision']],$a);};
 ok(count(Driver::IDS)===13,'exact registry scope 13 IDs, passport explicit legacy');
 foreach(Driver::IDS as$id)ok(isset($forms[$id]),'source registry '.$id);
 rejects(fn()=>Driver::actor($p,array_replace($a,['userId'=>0])),'AUTH_REQUIRED','guest cannot mutate profile');
 rejects(fn()=>Driver::actor($p,array_replace($a,['sessionKey'=>str_repeat('b',64)])),'AUTH_REQUIRED','session-bound profile actor');
 rejects(fn()=>Driver::actor(array_replace($p,['context'=>'organization:7']),$a),'FORBIDDEN','forged organization context');
 rejects(fn()=>Driver::actor($p,array_replace($a,['organizationId'=>7])),'FORBIDDEN','personal cannot retain corporate actor');
 ok(Driver::phone('+7 (900) 000-00-00')==='9000000000'&&Driver::phone('89000000000')==='9000000000','source phone normalizes to ten-digit UF_PHONE');
 foreach(['9000000000','+12345678901','123',123]as$value)rejects(fn()=>Driver::phone($value),'VALIDATION_ERROR','invalid phone');
 $v=['email_order_info'=>true,'email_promotions'=>false,'sms_order_info'=>true,'sms_promotions'=>false];$prefs=Driver::preferences($v);ok($prefs===['UF_EMAIL_INFORM'=>true,'UF_EMAIL_MARKETING'=>false,'UF_SMS_INFORM'=>true,'UF_SMS_MARKETING'=>false],'four explicit bool notification flags');
 foreach([[],array_replace($v,['email_promotions'=>'false']),$v+['IS_ADMIN'=>true]]as$bad)rejects(fn()=>Driver::preferences($bad),'VALIDATION_ERROR','missing/string/injected preference');
 $loc=['settlementId'=>'7dfa745e-aa19-4688-b121-b655c11e482f','version'=>2];Driver::locationIdentity($loc);ok(true,'structured GAR accepted');
 foreach([['city'=>'Краснодар'],array_replace($loc,['version'=>0]),array_replace($loc,['settlementId'=>'City']),$loc+['fullName'=>'Injected']]as$bad)rejects(fn()=>Driver::locationIdentity($bad),'SETTLEMENT_REQUIRED','free text/version/extra location rejected');
 $pending=['userId'=>11,'organizationId'=>0,'baseVersion'=>Driver::contactVersion(CUser::$user)];Driver::pending($pending,$a,CUser::$user);ok(true,'challenge bound to current contacts');
 rejects(fn()=>Driver::pending(array_replace($pending,['userId'=>22]),$a,CUser::$user),'STALE_CONTEXT','challenge owner');
 rejects(fn()=>Driver::pending(array_replace($pending,['organizationId'=>7]),$a,CUser::$user),'STALE_CONTEXT','challenge corporate context');
 rejects(fn()=>Driver::pending($pending,$a,array_replace(CUser::$user,['EMAIL'=>'changed@example.invalid'])),'STALE_CONTEXT','changed contact invalidates old challenge');
 $before=CUser::$user;$r=$submit('profile-name',['name'=>'После']);ok($r['reference']==='user-11'&&CUser::$updates[0]===['NAME'=>'После'],'name update changes exactly NAME and uses persisted identity');
 ok(CUser::$user['EMAIL']===$before['EMAIL']&&CUser::$user['UF_PHONE']===$before['UF_PHONE']&&CUser::$user['LAST_NAME']===$before['LAST_NAME'],'name update preserves all other profile values');
 $submit('profile-surname',['last_name'=>'После2']);ok(CUser::$updates[1]===['LAST_NAME'=>'После2'],'surname exact field');
 rejects(fn()=>$submit('profile-name',['name'=>'Name','IS_ADMIN'=>true]),'VALIDATION_ERROR','profile field injection');
 rejects(fn()=>$submit('profile-passport',[]),'SOURCE_LEGACY_UNAVAILABLE','passport source stub is not a data collection');
 rejects(fn()=>$d->run('forms.submit',$p+['formId'=>'profile-name','values'=>['name'=>'Name'],'revision'=>'wrong'],$a),'STALE_CONTEXT','stale profile revision');
 foreach(['2','3','0','-1','2x']as$id)rejects(fn()=>$submit('address-delete',[],['addressId'=>$id]),'ADDRESS_NOT_FOUND','foreign/other-context/invalid address');
 rejects(fn()=>$d->run('forms.context',array_replace($p,['formId'=>'address-create','context'=>'business']),$a),'ORGANIZATION_REQUIRED','business draft never aliases personal address book');
 $r=$submit('address-create',['full_address'=>'UNIT NEW','location'=>$loc]);ok($r['reference']==='address-4','address creation returns actual persisted record id');
 $row=\Prom\Model\EO\AddressDeliveryUsersTable::$rows[4];ok($row['FULL_ADDRESS']==='UNIT NEW'&&$row['LOCATION_CODE']==='CONTRACT-LOCATION'&&$row['ZIP']==='000000'&&$row['USER_ID']===11&&$row['ORGANIZATION_ID']===null,'address text and actual location separated with actor owner');
 $submit('address-edit',['full_address'=>'UNIT UPDATED','location'=>$loc],['addressId'=>'4']);ok(\Prom\Model\EO\AddressDeliveryUsersTable::$rows[4]['FULL_ADDRESS']==='UNIT UPDATED','edit own address');
 $submit('address-default',[],['addressId'=>'4']);ok(\Prom\Model\EO\AddressDeliveryUsersTable::$rows[4]['IS_MAIN']&&!\Prom\Model\EO\AddressDeliveryUsersTable::$rows[1]['IS_MAIN'],'default address resets only current actor context');
 $submit('address-delete',[],['addressId'=>'4']);ok(!isset(\Prom\Model\EO\AddressDeliveryUsersTable::$rows[4])&&isset(\Prom\Model\EO\AddressDeliveryUsersTable::$rows[2],\Prom\Model\EO\AddressDeliveryUsersTable::$rows[3]),'delete preserves other owner and organization');
 echo "SKIP profile-city actual CUser + private SQLite distributed persistence and live sender/provider execution; target-runtime integration unavailable\n";
 echo'TOTAL '.$count." PASS (isolated policy/model doubles only; live CUser/OTP/subscribe/GAR unverified)\n";
}
