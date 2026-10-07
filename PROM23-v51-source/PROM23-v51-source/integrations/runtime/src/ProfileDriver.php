<?php
declare(strict_types=1);
namespace Prom23\Runtime;

/** Actor-owned profile/address operations. Source property names are retained; no composite stale POST. */
final class ProfileDriver
{
    public const IDS=['profile-name','profile-surname','profile-city','profile-email','profile-email-otp','profile-phone','profile-phone-otp','profile-passport','address-create','address-edit','address-default','address-delete','notification-preferences'];
    private const NOTIFICATIONS=['email_order_info'=>'UF_EMAIL_INFORM','email_promotions'=>'UF_EMAIL_MARKETING','sms_order_info'=>'UF_SMS_INFORM','sms_promotions'=>'UF_SMS_MARKETING'];
    public function __construct(private array $config) {}
    public function run(string $operation,array $payload,array $actor):array
    {
        $id=$payload['formId']??'';
        if(!in_array($id,self::IDS,true)||!in_array($operation,['forms.context','forms.submit'],true))self::fail('OPERATION_UNSUPPORTED',404);
        self::actor($payload,$actor);
        if(str_starts_with($id,'address-')&&($payload['context']??'')==='business')self::fail('ORGANIZATION_REQUIRED',409);
        $form=$this->config['formContracts'][$id]??null;if(!is_array($form))self::fail('SOURCE_FORM_SCHEMA_REQUIRED');
        $user=\CUser::GetByID($actor['userId'])->Fetch();if(!is_array($user))self::fail('AUTH_EXPIRED',401);Protocol::activeUser($user);
        $target=$payload['target']??[];if(!is_array($target)||array_diff(array_keys($target),['addressId']))self::fail('FORBIDDEN',403);
        $address=null;
        if(in_array($id,['address-edit','address-default','address-delete'],true))$address=$this->address($target['addressId']??null,$actor);
        elseif($target)self::fail('FORBIDDEN',403);
        $initial=[];$challenge=null;
        if($id==='profile-name')$initial=['name'=>(string)$user['NAME']];
        if($id==='profile-surname')$initial=['last_name'=>(string)$user['LAST_NAME']];
        if($id==='profile-city')$initial=['city'=>(string)$user['PERSONAL_CITY']];
        if($id==='profile-email')$initial=['email'=>(string)$user['EMAIL']];
        if($id==='profile-phone')$initial=['phone'=>$user['UF_PHONE']?'7'.$user['UF_PHONE']:''];
        if($address&&$id==='address-edit')$initial=['full_address'=>(string)$address['FULL_ADDRESS']];
        if($id==='notification-preferences')foreach(self::NOTIFICATIONS as$field=>$uf)$initial[$field]=self::boolean($user[$uf]??false);
        if(in_array($id,['profile-email-otp','profile-phone-otp'],true)){
            $challenge=$this->vault()->read($payload['challengeId']??'',$id);
            self::pending($challenge,$actor,$user);
            $channel=$id==='profile-email-otp'?'email':'phone';$initial=[$channel=>$challenge[$channel]];
        }
        $revision=hash('sha256',json_encode([$form,$actor['userId'],$actor['organizationId'],$initial,$address,$payload['challengeId']??null],JSON_THROW_ON_ERROR));
        if($operation==='forms.context')return ['formId'=>$id,'revision'=>$revision,'initialValues'=>$initial,...($challenge?['challengeId'=>$payload['challengeId'],'retryAfterSeconds'=>$this->vault()->retry($payload['challengeId'])]:[])];
        if(!in_array($id,$this->config['enabledForms']??[],true))self::fail('INTEGRATION_UNAVAILABLE');
        if(($payload['revision']??'')!==$revision)self::fail('STALE_CONTEXT',409);
        if($id==='profile-passport')self::fail('SOURCE_LEGACY_UNAVAILABLE');
        $values=$payload['values']??[];if(!is_array($values))self::fail('VALIDATION_ERROR',422);
        $known=array_column($form['fields'],'name');if(in_array($id,['profile-city','address-create','address-edit'],true))$known[]='location';
        if(array_diff(array_keys($values),$known))self::fail('VALIDATION_ERROR',422);
        if($id==='profile-name'||$id==='profile-surname'){
            $field=$id==='profile-name'?'name':'last_name';$value=self::text($values[$field]??'',100);
            $this->updateUser($actor['userId'],[$field==='name'?'NAME':'LAST_NAME'=>$value]);
        }elseif($id==='profile-city'){
            $location=$this->location($values['location']??null);
            $display=$location['name']??$location['fullName']??$location['label']??null;
            if(!is_string($display)||!trim($display))self::fail('LOCATION_NAME_UNAVAILABLE');
            $pdo=$this->config['pdo']??null;if(!$pdo instanceof \PDO)self::fail('LOCATION_STORAGE_UNAVAILABLE');
            $pdo->exec('CREATE TABLE IF NOT EXISTS prom23_profile_locations(user_id INTEGER PRIMARY KEY,settlement_id TEXT NOT NULL,location_code TEXT NOT NULL,version INTEGER NOT NULL,updated INTEGER NOT NULL)');
            $connection=\Bitrix\Main\Application::getConnection();$connection->startTransaction();
            try{
                $this->updateUser($actor['userId'],['PERSONAL_CITY'=>$display]);
                $pdo->prepare('INSERT INTO prom23_profile_locations VALUES(?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET settlement_id=excluded.settlement_id,location_code=excluded.location_code,version=excluded.version,updated=excluded.updated')->execute([$actor['userId'],$values['location']['settlementId'],$location['locationCode'],$values['location']['version'],time()]);
                $connection->commitTransaction();
            }catch(\Throwable$e){$connection->rollbackTransaction();throw$e;}
        }elseif(in_array($id,['profile-email','profile-phone'],true))return $this->beginChange($id,$values,$actor,$user);
        elseif(in_array($id,['profile-email-otp','profile-phone-otp'],true))$this->finishChange($id,$values,$payload['challengeId'],$challenge,$actor,$user);
        elseif(str_starts_with($id,'address-'))return $this->changeAddress($id,$values,$address,$actor);
        elseif($id==='notification-preferences')$this->notifications($values,$actor,$user);
        return ['status'=>'accepted','reference'=>'user-'.$actor['userId']];
    }
    public static function actor(array$p,array$a):void
    {
        if(!is_int($a['userId']??null)||$a['userId']<1||!preg_match('/^[a-f0-9]{64}$/D',$a['sessionKey']??'')||!hash_equals($a['sessionKey'],(string)($p['sessionKey']??'')))self::fail('AUTH_REQUIRED',401);
        $c=$p['context']??'';if($c==='personal'||$c==='business'){if(($a['organizationId']??0)!==0)self::fail('FORBIDDEN',403);return;}
        if(!preg_match('/^organization:([1-9][0-9]*)$/D',(string)$c,$m)||(int)$m[1]!==($a['organizationId']??0))self::fail('FORBIDDEN',403);
    }
    private function updateUser(int$id,array$fields):void {if(!(new \CUser())->Update($id,$fields))self::fail('PROFILE_UPDATE_FAILED');}
    private function vault():ChallengeVault
    {
        if(!class_exists(ChallengeVault::class)||!class_exists(CheckedConfirmationCodes::class)||!is_string($this->config['key']??null))self::fail('AUTH_ADAPTER_UNAVAILABLE');
        return new ChallengeVault($this->config['key']);
    }
    public static function phone($value):string
    {
        if(!is_string($value)||strlen($value)>40)self::fail('VALIDATION_ERROR',422);
        $digits=preg_replace('/\D/','',$value);if(!preg_match('/^[78][0-9]{10}$/D',$digits))self::fail('VALIDATION_ERROR',422);return substr($digits,1);
    }
    public static function contactVersion(array$user):string {return hash('sha256',json_encode([$user['LOGIN']??'',$user['EMAIL']??'',$user['UF_PHONE']??''],JSON_THROW_ON_ERROR));}
    public static function pending(array$p,array$a,array$user):void
    {
        if(($p['userId']??null)!==$a['userId']||($p['organizationId']??null)!==$a['organizationId']||!is_string($p['baseVersion']??null)||!hash_equals($p['baseVersion'],self::contactVersion($user)))self::fail('STALE_CONTEXT',409);
    }
    private function available(string$value,string$channel,int$own):void
    {
        $by='id';$order='asc';$filter=$channel==='email'?['LOGIC'=>'OR','=EMAIL'=>$value,'=LOGIN'=>$value]:['LOGIC'=>'OR','=UF_PHONE'=>$value,'=LOGIN'=>'7'.$value];
        $cursor=\CUser::GetList($by,$order,$filter,['FIELDS'=>['ID']]);while($row=$cursor->Fetch())if((int)$row['ID']!==$own)self::fail('CONTACT_ALREADY_USED',422);
    }
    private function beginChange(string$id,array$v,array$a,array$user):array
    {
        $channel=$id==='profile-email'?'email':'phone';$value=$channel==='email'?self::text($v['email']??'',150):self::phone($v['phone']??'');
        if($channel==='email'&&!filter_var($value,FILTER_VALIDATE_EMAIL))self::fail('VALIDATION_ERROR',422);
        $this->available($value,$channel,$a['userId']);
        if($value===($user[$channel==='email'?'EMAIL':'UF_PHONE']??null))return ['status'=>'accepted','reference'=>'user-'.$a['userId']];
        $vault=$this->vault();$codes=new CheckedConfirmationCodes();$issued=$codes->createNewCode($value,$channel,$channel==='email');
        if(!empty($issued['rate_limited']))self::fail('RATE_LIMITED',429);
        if(empty($issued['status'])||!$codes->accepted||!is_string($issued['hash']??null))self::fail('INTEGRATION_UNAVAILABLE');
        $retry=max(0,min(600,(int)($issued['retry_after']??60)));
        return $vault->create($id.'-otp',[$channel=>$channel==='phone'?'7'.$value:$value,'hash'=>$issued['hash'],'userId'=>$a['userId'],'organizationId'=>$a['organizationId'],'baseVersion'=>self::contactVersion($user)],$retry);
    }
    private function finishChange(string$id,array$v,string$challengeId,array$pending,array$a,array$user):void
    {
        self::pending($pending,$a,$user);$channel=$id==='profile-email-otp'?'email':'phone';
        if(isset($v[$channel])&&$v[$channel]!==$pending[$channel])self::fail('STALE_CONTEXT',409);
        $value=$channel==='phone'?self::phone($pending['phone']):$pending['email'];$this->available($value,$channel,$a['userId']);
        $code=$v['code']??'';if(!is_string($code)||!preg_match('/^[0-9]{6}$/D',$code))self::fail('INVALID_CODE',422);
        $codes=new \Prom\Model\ConfirmationCodes();
        if(!$codes->validateCode($value,$pending['hash'],$code)||!$codes->validateHashChangeDataUser($value,$pending['hash']))self::fail('INVALID_CODE',422);
        // Two source confirmation stages consumed once. Only this contact and source LOGIN preference change.
        $fields=$channel==='email'?['EMAIL'=>$value,'LOGIN'=>$value]:['UF_PHONE'=>$value,'LOGIN'=>!empty($user['EMAIL'])?$user['EMAIL']:'7'.$value];
        $this->updateUser($a['userId'],$fields);$this->vault()->remove($challengeId);
    }
    private function location($value):array
    {
        self::locationIdentity($value);
        if(!class_exists(LocationDriver::class))self::fail('LOCATION_ADAPTER_UNAVAILABLE');
        $resolved=(new LocationDriver($this->config))->resolve($value['settlementId']);
        if(!is_array($resolved)||!is_string($resolved['locationCode']??null)||$resolved['locationCode']==='')self::fail('LOCATION_MAPPING_INVALID');
        return $resolved;
    }
    public static function locationIdentity($v):void {if(!is_array($v)||array_diff(array_keys($v),['settlementId','version'])||!is_string($v['settlementId']??null)||!preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/Di',$v['settlementId'])||!is_int($v['version']??null)||$v['version']<1)self::fail('SETTLEMENT_REQUIRED',409);}
    private function address($id,array$a):array
    {
        if(!is_string($id)||!preg_match('/^[1-9][0-9]{0,11}$/D',$id))self::fail('ADDRESS_NOT_FOUND',404);
        $row=\Prom\Model\EO\AddressDeliveryUsersTable::getList(['filter'=>['=ID'=>(int)$id,'=USER_ID'=>$a['userId'],'=ORGANIZATION_ID'=>$a['organizationId']?:null],'select'=>['ID','USER_ID','ORGANIZATION_ID','FULL_ADDRESS','LOCATION_CODE','ZIP','IS_MAIN'],'limit'=>1])->fetch();
        if(!$row)self::fail('ADDRESS_NOT_FOUND',404);return$row;
    }
    private function changeAddress(string$id,array$v,?array$row,array$a):array
    {
        $table='\\Prom\\Model\\EO\\AddressDeliveryUsersTable';
        if(in_array($id,['address-create','address-edit'],true)){
            $text=self::text($v['full_address']??'',1000);$l=$this->location($v['location']??null);
            $fields=['FULL_ADDRESS'=>$text,'LOCATION_CODE'=>$l['locationCode'],'ZIP'=>$l['zip']??$l['ZIP']??null];
            if($id==='address-create'){
                $existing=$table::getList(['filter'=>['=USER_ID'=>$a['userId'],'=ORGANIZATION_ID'=>$a['organizationId']?:null,'=FULL_ADDRESS'=>$text],'select'=>['ID'],'limit'=>1])->fetch();if($existing)self::fail('ADDRESS_ALREADY_EXISTS',422);
                $result=$table::add($fields+['USER_ID'=>$a['userId'],'ORGANIZATION_ID'=>$a['organizationId']?:null,'CREATED_AT'=>new \Bitrix\Main\Type\DateTime(),'IS_MAIN'=>false]);self::result($result,'ADDRESS_UPDATE_FAILED');$reference=(string)$result->getId();
            }else{$result=$table::update((int)$row['ID'],$fields);self::result($result,'ADDRESS_UPDATE_FAILED');$reference=(string)$row['ID'];}
            return ['status'=>'accepted','reference'=>'address-'.$reference];
        }
        if($id==='address-delete'){self::result($table::delete((int)$row['ID']),'ADDRESS_UPDATE_FAILED');return ['status'=>'accepted','reference'=>'address-'.$row['ID']];}
        $connection=\Bitrix\Main\Application::getConnection();$connection->startTransaction();
        try{
            $all=$table::getList(['filter'=>['=USER_ID'=>$a['userId'],'=ORGANIZATION_ID'=>$a['organizationId']?:null,'=IS_MAIN'=>true],'select'=>['ID']]);
            while($old=$all->fetch())self::result($table::update((int)$old['ID'],['IS_MAIN'=>false]),'ADDRESS_UPDATE_FAILED');
            self::result($table::update((int)$row['ID'],['IS_MAIN'=>true]),'ADDRESS_UPDATE_FAILED');$connection->commitTransaction();
        }catch(\Throwable$e){$connection->rollbackTransaction();throw$e;}
        return ['status'=>'accepted','reference'=>'address-'.$row['ID']];
    }
    public static function preferences(array$v):array
    {
        if(array_diff(array_keys($v),array_keys(self::NOTIFICATIONS)))self::fail('VALIDATION_ERROR',422);
        $out=[];foreach(self::NOTIFICATIONS as$field=>$uf){if(!array_key_exists($field,$v)||!is_bool($v[$field]))self::fail('VALIDATION_ERROR',422);$out[$uf]=$v[$field];}return$out;
    }
    private function notifications(array$v,array$a,array$user):void
    {
        $fields=self::preferences($v);
        if(!\Bitrix\Main\Loader::includeModule('subscribe')||!defined('TYPE_SUBSCRIPTION_EMAIL')||!defined('TYPE_SUBSCRIPTION_SMS'))self::fail('SUBSCRIPTION_SCHEMA_UNAVAILABLE');
        $rubrics=[];if($v['email_promotions'])$rubrics[]=(int)TYPE_SUBSCRIPTION_EMAIL;if($v['sms_promotions'])$rubrics[]=(int)TYPE_SUBSCRIPTION_SMS;
        if($rubrics&&empty($user['EMAIL']))self::fail('SUBSCRIPTION_EMAIL_REQUIRED',422);
        $connection=\Bitrix\Main\Application::getConnection();$connection->startTransaction();
        try{
            $this->updateUser($a['userId'],$fields);
            $existing=\CSubscription::GetList([],['USER_ID'=>$a['userId'],'CONFIRMED'=>'Y','ACTIVE'=>'Y'])->Fetch();$subscription=new \CSubscription();
            if($existing){if(!$subscription->Update((int)$existing['ID'],['RUB_ID'=>$rubrics,'SEND_CONFIRM'=>'N']))self::fail('SUBSCRIPTION_UPDATE_FAILED');}
            elseif($rubrics){$result=$subscription->Add(['USER_ID'=>$a['userId'],'EMAIL'=>$user['EMAIL'],'FORMAT'=>'html','CONFIRMED'=>'Y','ACTIVE'=>'Y','RUB_ID'=>$rubrics,'SEND_CONFIRM'=>'N']);if(!(int)$result)self::fail('SUBSCRIPTION_UPDATE_FAILED');}
            $connection->commitTransaction();
        }catch(\Throwable$e){$connection->rollbackTransaction();throw$e;}
    }
    public static function boolean($v):bool{return in_array($v,[true,1,'1','Y'],true);}
    private static function text($v,int$max):string {if(!is_string($v)||trim($v)===''||strlen($v)>$max*4||preg_match('/[\x00-\x1f]/',$v))self::fail('VALIDATION_ERROR',422);return trim($v);}
    private static function result($r,string$code):void{if(!is_object($r)||!method_exists($r,'isSuccess')||!$r->isSuccess())self::fail($code);}
    private static function fail(string$code,int$status=503):never{throw new RuntimeExceptionCode($code,$status);}
}
