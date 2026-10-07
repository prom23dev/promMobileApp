<?php
declare(strict_types=1);
namespace ActionTest {
 class Cursor{public function __construct(private array $r){}function fetch(){return array_shift($this->r)?:false;}}
 class Result{function __construct(private bool $ok=true){}function isSuccess(){return $this->ok;}}
 class Connection{function startTransaction(){}function commitTransaction(){}function rollbackTransaction(){}}
}
namespace Bitrix\Main {class Application{static function getConnection(){return new \ActionTest\Connection();}}}
namespace Prom\Model\EO {
 class ConfirmedCardsTable{
 static array $rows=[1=>['ID'=>1,'USER_ID'=>11,'ORGANIZATION_ID'=>null,'IS_MAIN'=>true],2=>['ID'=>2,'USER_ID'=>11,'ORGANIZATION_ID'=>null,'IS_MAIN'=>false],3=>['ID'=>3,'USER_ID'=>22,'ORGANIZATION_ID'=>null,'IS_MAIN'=>true],4=>['ID'=>4,'USER_ID'=>11,'ORGANIZATION_ID'=>7,'IS_MAIN'=>true]];
 static function getList($q){return new \ActionTest\Cursor(array_values(array_filter(self::$rows,function($r)use($q){foreach($q['filter']as$k=>$v)if(($r[ltrim($k,'=')]??null)!==$v)return false;return true;})));}
 static function update($id,$v){self::$rows[$id]=array_replace(self::$rows[$id],$v);return new \ActionTest\Result();}
 static function delete($id){unset(self::$rows[$id]);return new \ActionTest\Result();}
 }
}
namespace {
 class CUser{static array $row=['ID'=>11,'ACTIVE'=>'Y','UF_DELETE_ACCOUNT_BY_USER'=>false];static bool $fail=false;static function GetByID($id){return new \ActionTest\Cursor($id===11?[self::$row]:[]);}function Update($id,$v){if(self::$fail)return false;self::$row=array_replace(self::$row,$v);return true;}function Logout(){}}
 $USER=new CUser();
 require_once __DIR__.'/../src/Protocol.php';require_once __DIR__.'/../src/ProfileDriver.php';require_once __DIR__.'/../src/AccountActionDriver.php';
 use Prom23\Runtime\AccountActionDriver as D;use Prom23\Runtime\RuntimeExceptionCode;
 $forms=json_decode(file_get_contents(__DIR__.'/../form-contracts.json'),true)['forms'];$d=new D(['formContracts'=>$forms,'enabledForms'=>D::IDS]);
 $a=['userId'=>11,'organizationId'=>0,'sessionKey'=>str_repeat('a',64)];$p=['sessionKey'=>str_repeat('a',64),'context'=>'personal'];$n=0;
 function ok($v,$name){global$n;if(!$v)throw new RuntimeException('FAIL '.$name);$n++;echo'PASS '.$name.PHP_EOL;}
 function rejects($f,$code){try{$f();}catch(RuntimeExceptionCode$e){ok($e->getMessage()===$code,$code);return;}throw new RuntimeException('FAIL accepted '.$code);}
 $submit=function($id,$target=[])use($d,$a,$p){$payload=$p+['formId'=>$id,'target'=>$target];$ctx=$d->run('forms.context',$payload,$a);return$d->run('forms.submit',$payload+['revision'=>$ctx['revision'],'values'=>[]],$a);};
 rejects(fn()=>$submit('payment-default',['cardId'=>'3']),'PAYMENT_METHOD_NOT_FOUND');
 rejects(fn()=>$submit('payment-remove',['cardId'=>'4']),'PAYMENT_METHOD_NOT_FOUND');
 rejects(fn()=>$submit('payment-default',[]),'TARGET_REQUIRED');
 rejects(fn()=>$submit('payment-default',['cardId'=>'1','userId'=>'22']),'FORBIDDEN');
 $result=$submit('payment-default',['cardId'=>'2']);ok($result['reference']==='card-2','actual card ID returned');$rows=\Prom\Model\EO\ConfirmedCardsTable::$rows;ok(!$rows[1]['IS_MAIN']&&$rows[2]['IS_MAIN']&&$rows[3]['IS_MAIN']&&$rows[4]['IS_MAIN'],'main flag scoped to buyer only');
 $submit('payment-remove',['cardId'=>'2']);ok(!isset(\Prom\Model\EO\ConfirmedCardsTable::$rows[2])&&isset(\Prom\Model\EO\ConfirmedCardsTable::$rows[3]),'remove own card only');
 rejects(fn()=>$submit('payment-card'),'SOURCE_LEGACY_UNAVAILABLE');
 rejects(fn()=>$d->run('forms.submit',$p+['formId'=>'account-delete','revision'=>'wrong','values'=>[]],$a),'STALE_CONTEXT');
 $ctx=$d->run('forms.context',$p+['formId'=>'account-delete'],$a);rejects(fn()=>$d->run('forms.submit',$p+['formId'=>'account-delete','revision'=>$ctx['revision'],'values'=>['ID'=>22]],$a),'VALIDATION_ERROR');
 CUser::$fail=true;rejects(fn()=>$submit('account-delete'),'ACCOUNT_UPDATE_FAILED');ok(CUser::$row['UF_DELETE_ACCOUNT_BY_USER']===false,'failed source update never reports success');CUser::$fail=false;
 $result=$submit('account-delete');ok($result['reference']==='user-11'&&$result['loggedOut']===true&&CUser::$row['UF_DELETE_ACCOUNT_BY_USER']===true,'source deletion marker verified then logout');
 echo'TOTAL '.$n.' PASS; SKIP live UserSessionTable/Bitrix/provider execution'.PHP_EOL;
}
