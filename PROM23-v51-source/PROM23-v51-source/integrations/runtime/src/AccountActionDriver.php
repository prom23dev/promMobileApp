<?php
declare(strict_types=1);
namespace Prom23\Runtime;

/** Source account actions with uncached ownership and checked model results. */
final class AccountActionDriver
{
    public const IDS=['account-delete','sessions-terminate','payment-default','payment-remove','payment-card'];
    public function __construct(private array $config) {}
    private static function id($value):int {if(!is_string($value)||!preg_match('/^[1-9][0-9]{0,9}$/D',$value))throw new RuntimeExceptionCode('TARGET_REQUIRED',422);return (int)$value;}
    private static function checked($result):void {if(!is_object($result)||!method_exists($result,'isSuccess')||!$result->isSuccess())throw new RuntimeExceptionCode('ACCOUNT_UPDATE_FAILED');}
    private function sessions():string {
        if(!defined('HLBL_ID_HISTORY_SESSION_USERS'))throw new RuntimeExceptionCode('SOURCE_SCHEMA_UNAVAILABLE');
        $block=\Bitrix\Highloadblock\HighloadBlockTable::getById(HLBL_ID_HISTORY_SESSION_USERS)->fetch();
        if(!$block)throw new RuntimeExceptionCode('SOURCE_SCHEMA_UNAVAILABLE');
        return \Bitrix\Highloadblock\HighloadBlockTable::compileEntity($block)->getDataClass();
    }
    public function run(string $operation,array $payload,array $actor):array {
        ProfileDriver::actor($payload,$actor);$id=$payload['formId']??'';
        if(!in_array($id,self::IDS,true)||!in_array($operation,['forms.context','forms.submit'],true))throw new RuntimeExceptionCode('OPERATION_UNSUPPORTED',404);
        $target=$payload['target']??[];$row=[];$entityId=$actor['userId'];$sessionClass=null;
        if($id==='payment-card')throw new RuntimeExceptionCode('SOURCE_LEGACY_UNAVAILABLE',409);
        $key=$id==='sessions-terminate'?'sessionId':(str_starts_with($id,'payment-')?'cardId':null);
        if(!is_array($target)||array_diff(array_keys($target),$key?[$key]:[]))throw new RuntimeExceptionCode('FORBIDDEN',403);
        if($key)$entityId=self::id($target[$key]??null);
        if($id==='sessions-terminate'){
            $sessionClass=$this->sessions();$row=$sessionClass::getList(['filter'=>['=ID'=>$entityId,'=UF_USER_ID'=>$actor['userId']],'select'=>['ID','UF_USER_ID','UF_SESSION_ID'],'limit'=>1])->fetch();
            if(!$row)throw new RuntimeExceptionCode('SESSION_NOT_FOUND',404);
        }elseif(str_starts_with($id,'payment-')){
            if($payload['context']==='business')throw new RuntimeExceptionCode('ORGANIZATION_REQUIRED',409);
            $row=\Prom\Model\EO\ConfirmedCardsTable::getList(['filter'=>['=ID'=>$entityId,'=USER_ID'=>$actor['userId'],'=ORGANIZATION_ID'=>$actor['organizationId']?:null],'select'=>['ID','USER_ID','ORGANIZATION_ID','IS_MAIN'],'limit'=>1])->fetch();
            if(!$row)throw new RuntimeExceptionCode('PAYMENT_METHOD_NOT_FOUND',404);
        }else{
            $row=\CUser::GetByID($actor['userId'])->Fetch();if(!$row)throw new RuntimeExceptionCode('AUTH_REQUIRED',401);Protocol::activeUser($row);
            $row=['ID'=>$actor['userId'],'deleteRequested'=>(bool)$row['UF_DELETE_ACCOUNT_BY_USER']];
        }
        $revision=hash('sha256',json_encode([$this->config['formContracts'][$id],$actor['userId'],$payload['context'],$target,$row],JSON_THROW_ON_ERROR));
        if($operation==='forms.context')return ['formId'=>$id,'revision'=>$revision];
        if(!in_array($id,$this->config['enabledForms']??[],true))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        if(($payload['revision']??'')!==$revision)throw new RuntimeExceptionCode('STALE_CONTEXT',409);
        if(($payload['values']??[])!==[])throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        $connection=\Bitrix\Main\Application::getConnection();$connection->startTransaction();
        try {
            if($id==='account-delete'){
                if(!(new \CUser())->Update($actor['userId'],['UF_DELETE_ACCOUNT_BY_USER'=>true]))throw new RuntimeExceptionCode('ACCOUNT_UPDATE_FAILED');
                $read=\CUser::GetByID($actor['userId'])->Fetch();if(empty($read['UF_DELETE_ACCOUNT_BY_USER']))throw new RuntimeExceptionCode('ACCOUNT_UPDATE_FAILED');
            }elseif($id==='sessions-terminate'){
                if(!is_string($row['UF_SESSION_ID'])||$row['UF_SESSION_ID']==='')throw new RuntimeExceptionCode('SESSION_INVALID',409);
                if($row['UF_SESSION_ID']!==session_id())self::checked(\Bitrix\Main\Session\Handlers\Table\UserSessionTable::delete($row['UF_SESSION_ID']));
                self::checked($sessionClass::delete($entityId));
            }elseif($id==='payment-remove')self::checked(\Prom\Model\EO\ConfirmedCardsTable::delete($entityId));
            else{
                $main=\Prom\Model\EO\ConfirmedCardsTable::getList(['filter'=>['=USER_ID'=>$actor['userId'],'=ORGANIZATION_ID'=>$actor['organizationId']?:null,'=IS_MAIN'=>true],'select'=>['ID']]);
                while($card=$main->fetch())self::checked(\Prom\Model\EO\ConfirmedCardsTable::update((int)$card['ID'],['IS_MAIN'=>false]));
                self::checked(\Prom\Model\EO\ConfirmedCardsTable::update($entityId,['IS_MAIN'=>true]));
            }
            $connection->commitTransaction();
        }catch(\Throwable $error){$connection->rollbackTransaction();throw $error;}
        $loggedOut=$id==='account-delete'||($id==='sessions-terminate'&&$row['UF_SESSION_ID']===session_id());
        if($loggedOut){if(($this->config['pdo']??null) instanceof \PDO){require_once __DIR__.'/PaymentHandoff.php';if($id==='account-delete')PaymentHandoff::revokeUserIfExists($this->config['pdo'],$actor['userId']);else PaymentHandoff::revokeIfExists($this->config['pdo'],$actor['sessionKey']);}global $USER;$USER->Logout();unset($_SESSION['PROM23_CHALLENGES'],$_SESSION['ORGANIZATION_ID'],$_SESSION['SELECT_ORGANIZATION']);}
        return ['status'=>'accepted','loggedOut'=>$loggedOut,'reference'=>($id==='account-delete'?'user-':($id==='sessions-terminate'?'session-':'card-')).$entityId];
    }
}
