<?php
declare(strict_types=1);
namespace Prom23\Runtime;

require_once __DIR__.'/LocationDriver.php';
require_once __DIR__.'/ConsentLedger.php';
require_once __DIR__.'/UploadDriver.php';

/** Source business HL + one business CRM lead + source mail event; supplier is never invoked. */
final class ProcurementDriver {
    private const FILE_FIELD='UF_CRM_1776267327660'; // Existing source lead attachment field, not a new CRM integration.
    public function __construct(private array $config) {}
    public static function identity(array $payload,array $actor): void {
        if(!is_string($payload['sessionKey']??null)||!hash_equals($actor['sessionKey']??'',$payload['sessionKey'])||!preg_match('/^[a-f0-9]{64}$/D',$payload['sessionKey']))throw new RuntimeExceptionCode('AUTH_EXPIRED',401);
        $context=$payload['context']??'';$organization=(int)($actor['organizationId']??0);
        if(($actor['context']??$context)!==$context||($payload['target']??[])!==[])throw new RuntimeExceptionCode('FORBIDDEN',403);
        if(in_array($context,['personal','business'],true)){if($organization)throw new RuntimeExceptionCode('FORBIDDEN',403);}
        elseif(!$organization||!($actor['userId']??0)||$context!=='organization:'.$organization)throw new RuntimeExceptionCode('FORBIDDEN',403);
    }
    private static function string(mixed $value,int $max,bool $required=true): string {
        if(!is_string($value)||mb_strlen($value)>$max||preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f]/',$value)||($required&&trim($value)===''))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        return trim($value);
    }
    public static function values(array $values): array {
        if(array_diff(array_keys($values),['first-name','phone','email','company-name','inn','comment-text','mode','files[]','location']))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        $v=[];foreach(['first-name'=>150,'phone'=>25,'email'=>254,'company-name'=>300,'inn'=>12,'comment-text'=>5000,'mode'=>10]as$name=>$max)$v[$name]=self::string($values[$name]??null,$max,!in_array($name,['inn','comment-text'],true));
        if(!preg_match('/^\+?[\d\s()\-]{10,25}$/D',$v['phone'])||strlen(preg_replace('/\D/','',$v['phone']))<10||!filter_var($v['email'],FILTER_VALIDATE_EMAIL)||($v['inn']&&!preg_match('/^(?:\d{10}|\d{12})$/D',$v['inn']))||!in_array($v['mode'],['list','selection'],true))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        $files=$values['files[]']??null;if(!is_array($files)||count($files)>10)throw new RuntimeExceptionCode('UPLOAD_INVALID',422);$tokens=[];
        foreach($files as$file){
            if(!is_array($file)||array_diff(array_keys($file),['name','size','uploadToken']))throw new RuntimeExceptionCode('UPLOAD_INVALID',422);
            $name=self::string($file['name']??null,240);
            if(preg_match('/[\\\\\/\r\n]/',$name)||!in_array(strtolower(pathinfo($name,PATHINFO_EXTENSION)),['pdf','xls','xlsx','csv','doc','docx','jpg','jpeg','png','webp'],true)||!is_int($file['size']??null)||$file['size']<1||$file['size']>20971520||!preg_match('/^[a-f0-9]{48}$/D',$file['uploadToken']??'')||isset($tokens[$file['uploadToken']]))throw new RuntimeExceptionCode('UPLOAD_INVALID',422);
            $tokens[$file['uploadToken']]=true;
        }
        if(!$files&&$v['comment-text']==='')throw new RuntimeExceptionCode('NEED_REQUIRED',422);
        $location=$values['location']??null;
        if(!is_array($location)||array_diff(array_keys($location),['settlementId','version'])||!preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/D',$location['settlementId']??'')||!is_int($location['version']??null)||$location['version']<1)throw new RuntimeExceptionCode('SETTLEMENT_REQUIRED',422);
        return $v+['files[]'=>$files,'location'=>$location];
    }
    public static function consents(array $supplied,array $expected): void {
        if(count($supplied)!==count($expected))throw new RuntimeExceptionCode('CONSENT_REQUIRED',422);
        foreach($expected as$required){$matches=array_values(array_filter($supplied,static fn($value)=>is_array($value)&&($value['name']??null)===$required['name']));
            if(count($matches)!==1||($matches[0]['accepted']??false)!==true||!is_array($matches[0]['documentIds']??null))throw new RuntimeExceptionCode('CONSENT_REQUIRED',422);
            $a=$matches[0]['documentIds'];$b=$required['documents'];sort($a);sort($b);if($a!==$b)throw new RuntimeExceptionCode('CONSENT_REQUIRED',422);
        }
    }
    public static function comment(array $v,array $location,array $actor,array $saved): string {
        $lines=[$v['comment-text'],'Тип потребности: '.($v['mode']==='list'?'Есть список':'Нужен подбор'),'Населённый пункт: '.$location['name'],'ГАР: '.$v['location']['settlementId'],'Версия выбора: '.$v['location']['version'],'Режим покупок: '.$actor['context']];
        if($v['inn']!=='')$lines[]='ИНН: '.$v['inn'];
        foreach($saved as$file)$lines[]='Вложение: '.$file['name'].'; '.$file['size'].' байт; файл Bitrix №'.$file['id'].'; SHA-256 '.$file['sha256'];
        return implode("\n",array_filter($lines,static fn($line)=>$line!==''));
    }
    public static function leadFields(array $v,string $comment,string $city,array $files,string $origin): array {
        $fields=['NAME'=>$v['first-name'],'PHONE'=>[['VALUE'=>formatPhoneNumber($v['phone']),'VALUE_TYPE'=>'WORK']],'EMAIL'=>[['VALUE'=>$v['email'],'VALUE_TYPE'=>'WORK']],
            'UF_CRM_1776267208372'=>$v['company-name'],'COMMENTS'=>$comment,'UF_CRM_1776267008813'=>$city,'ORIGINATOR_ID'=>'prom23-mobile-procurement','ORIGIN_ID'=>$origin];
        if($files){$fields['__HAS_FILES']=true;$fields[self::FILE_FIELD]=array_map(static fn($file)=>['fileData'=>[$file['name'],$file['base64']]],$files);}
        return $fields;
    }
    public static function crmEndpoint(array $config): string {
        $url=$config['crmWebhookUrl']??'';$parts=is_string($url)?parse_url($url):false;
        if(!$parts||($parts['scheme']??'')!=='https'||!is_string($parts['host']??null)||!in_array(strtolower($parts['host']),$config['allowedCrmHosts']??[],true)||isset($parts['user'],$parts['pass'])||isset($parts['query'])||isset($parts['fragment'])||isset($parts['user'])||isset($parts['pass'])||(($parts['port']??443)!==443)||!preg_match('#^/rest/[1-9][0-9]*/[A-Za-z0-9_-]{8,200}/$#D',$parts['path']??''))throw new RuntimeExceptionCode('CRM_CONFIGURATION_REQUIRED');
        return rtrim($url,'/').'/crm.lead.add.json';
    }
    private function sendLead(array $fields): bool {
        $url=self::crmEndpoint($this->config['procurement']??[]);
        if(!function_exists('curl_init'))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        unset($fields['__HAS_FILES']);
        // Same source lead method and fields; fix source GET-with-PII, disabled TLS and payload logging.
        $fields=['TITLE'=>'Заявка с сайта - Хотите узнать, как мы можем помочь вашему бизнесу','SOURCE_DESCRIPTION'=>'Мобильное приложение prom23.ru']+$fields;
        $curl=curl_init($url);$response='';
        curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>http_build_query(['fields'=>$fields]),CURLOPT_HTTPHEADER=>['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_MAXREDIRS=>0,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>20,
            CURLOPT_WRITEFUNCTION=>static function($handle,string $chunk)use(&$response):int{if(strlen($response)+strlen($chunk)>1048576)return 0;$response.=$chunk;return strlen($chunk);}]);
        try{$success=curl_exec($curl);$status=curl_getinfo($curl,CURLINFO_HTTP_CODE);$data=json_decode($response,true);return$success!==false&&$status===200&&!isset($data['error'])&&isset($data['result'])&&is_numeric($data['result'])&&(int)$data['result']>0;}
        finally{curl_close($curl);}
    }
    private function revision(array $payload,array $actor): string {return hash('sha256',json_encode([$this->config['formContracts']['procurement'],$this->config['legalVersions']??[],$actor['sessionKey'],$payload['context']],JSON_THROW_ON_ERROR));}
    private function db(): \PDO {
        $db=$this->config['pdo']??null;if(!$db instanceof \PDO)throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        // Only linkage/processing state. Contacts and content remain in the source business HL.
        $db->exec('CREATE TABLE IF NOT EXISTS prom23_procurement(scope TEXT PRIMARY KEY,request_hash TEXT,phase TEXT,source_id INTEGER,files_json TEXT,crm_state TEXT,mail_state TEXT,created INTEGER)');return$db;
    }
    private static function result(int $id,string $crm,string $mail): array {return['status'=>'accepted','reference'=>'business-'.$id,'deliveryStatus'=>$crm==='confirmed'&&$mail==='queued'?'complete':'pending'];}
    public function run(string $operation,array $payload,array $actor): array {
        self::identity($payload,$actor);
        if(($payload['formId']??'')!=='procurement'||!isset($this->config['formContracts']['procurement']))throw new RuntimeExceptionCode('NOT_FOUND',404);
        $revision=$this->revision($payload,$actor);
        if($operation==='forms.context')return['formId'=>'procurement','revision'=>$revision];
        if($operation!=='procurement.submit')throw new RuntimeExceptionCode('NOT_FOUND',404);
        if(!in_array('procurement',$this->config['enabledForms']??[],true)||($this->config['sourceSecretsReplaced']??false)!==true)throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        if(($payload['revision']??'')!==$revision)throw new RuntimeExceptionCode('STALE_CONTEXT',409);
        $v=self::values($payload['values']??[]);self::consents($payload['consents']??[],$this->config['formContracts']['procurement']['consents']);
        if(($payload['location']['settlement']['id']??null)!==$v['location']['settlementId']||($payload['location']['version']??null)!==$v['location']['version'])throw new RuntimeExceptionCode('LOCATION_CHANGED',409);
        $location=(new LocationDriver($this->config))->resolve($v['location']['settlementId']);
        if(!\Bitrix\Main\Loader::includeModule('highloadblock')||!defined('HLBL_ID_BUSINESS_ADVICE_REQUESTS')||!defined('SITE_ID'))throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
        $block=\Bitrix\Highloadblock\HighloadBlockTable::getById(HLBL_ID_BUSINESS_ADVICE_REQUESTS)->fetch();if(!$block)throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
        $entity=\Bitrix\Highloadblock\HighloadBlockTable::compileEntity($block);
        foreach(['UF_FIRST_NAME','UF_PHONE','UF_EMAIL','UF_COMPANY_NAME','UF_COMMENT_TEXT','UF_CREATED_AT']as$field)if(!$entity->hasField($field))throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
        $table=$entity->getDataClass();$db=$this->db();$key=$this->config['request']['idempotencyKey']??'';
        if(!preg_match('/^[A-Za-z0-9_-]{10,120}$/D',$key))throw new RuntimeExceptionCode('IDEMPOTENCY_CONFLICT',409);
        $scope=hash_hmac('sha256',$actor['sessionKey']."\n".$actor['context']."\n".$key,$this->config['key']);
        $requestHash=hash_hmac('sha256',json_encode($v,JSON_THROW_ON_ERROR),$this->config['key']);
        $s=$db->prepare('SELECT * FROM prom23_procurement WHERE scope=?');$s->execute([$scope]);$old=$s->fetch(\PDO::FETCH_ASSOC);
        if($old){if(!hash_equals($old['request_hash'],$requestHash))throw new RuntimeExceptionCode('IDEMPOTENCY_CONFLICT',409);
            if((int)$old['source_id']>0)return self::result((int)$old['source_id'],$old['crm_state'],$old['mail_state']);
            throw new RuntimeExceptionCode('RESULT_RECONCILIATION_REQUIRED',409);
        }
        // Validate all bytes/scopes before accepting or persisting anything.
        $incoming=[];$resolver=$v['files[]']?new UploadDriver($this->config):null;
        foreach($v['files[]']as$file){$real=$resolver->resolve($payload,'files[]',$file['uploadToken']);if($real['name']!==$file['name']||$real['size']!==$file['size']||!is_file($real['tmp_name'])||filesize($real['tmp_name'])!==$file['size'])throw new RuntimeExceptionCode('UPLOAD_INVALID',422);$incoming[]=$real;}
        (new ConsentLedger($this->config))->record($payload['consents'],$actor,'procurement');
        $db->prepare('INSERT INTO prom23_procurement VALUES(?,?,?,NULL,?,?,?,?)')->execute([$scope,$requestHash,'pending','[]','not-attempted','not-attempted',time()]);
        $saved=[];$id=0;$sourceAttempted=false;
        try{
            foreach($incoming as$file){if(!empty(\CFile::CheckFile($file,20971520,false,false)))throw new RuntimeExceptionCode('UPLOAD_INVALID',422);
                $fileId=(int)\CFile::SaveFile($file,'business-advice-requests');if(!$fileId)throw new RuntimeExceptionCode('UPLOAD_SAVE_FAILED');
                $saved[]=['id'=>$fileId,'name'=>$file['name'],'size'=>$file['size'],'sha256'=>hash_file('sha256',$file['tmp_name'])];
                $db->prepare('UPDATE prom23_procurement SET files_json=? WHERE scope=?')->execute([json_encode($saved,JSON_THROW_ON_ERROR),$scope]);
            }
            $comment=self::comment($v,$location,$actor,$saved);
            $html=static fn($value)=>htmlspecialcharsbx($value);
            $sourceAttempted=true;
            $result=$table::add(['UF_FIRST_NAME'=>$html($v['first-name']),'UF_PHONE'=>$html($v['phone']),'UF_EMAIL'=>$html($v['email']),'UF_COMPANY_NAME'=>$html($v['company-name']),'UF_COMMENT_TEXT'=>$html($comment),'UF_CREATED_AT'=>new \Bitrix\Main\Type\DateTime()]);
            if(!$result->isSuccess()||!($id=(int)$result->getId()))throw new RuntimeExceptionCode('REQUEST_SAVE_FAILED');
            $db->prepare('UPDATE prom23_procurement SET source_id=?,phase=? WHERE scope=?')->execute([$id,'saved',$scope]);
        }catch(\Throwable $error){
            if(!$id){if(!$sourceAttempted)foreach($saved as$file)\CFile::Delete($file['id']);throw new RuntimeExceptionCode('RESULT_RECONCILIATION_REQUIRED',409);}
            // Source record exists: never encourage a second request after a linkage failure.
            return self::result($id,'unknown','unknown');
        }
        $crm='unknown';$mail='unknown';
        try{
            $db->prepare('UPDATE prom23_procurement SET crm_state=? WHERE scope=?')->execute(['pending',$scope]);
            $encoded=[];foreach($incoming as$file){$bytes=file_get_contents($file['tmp_name']);if($bytes===false||strlen($bytes)!==$file['size'])throw new RuntimeExceptionCode('UPLOAD_INVALID');$encoded[]=['name'=>$file['name'],'base64'=>base64_encode($bytes)];}
            $fields=self::leadFields($v,$comment,$location['name'],$encoded,'business-'.$id);
            $crm=$this->sendLead($fields)?'confirmed':'pending';
            $db->prepare('UPDATE prom23_procurement SET crm_state=? WHERE scope=?')->execute([$crm,$scope]);
        }catch(\Throwable $error){$crm='pending';}
        try{
            $db->prepare('UPDATE prom23_procurement SET mail_state=? WHERE scope=?')->execute(['pending',$scope]);
            $mailResult=\Bitrix\Main\Mail\Event::send(['EVENT_NAME'=>'NEW_BUSINESS_ADVICE_REQUEST','LID'=>SITE_ID,'C_FIELDS'=>[
                'REQUEST_ID'=>$id,'FIRST_NAME'=>$html($v['first-name']),'PHONE'=>$html($v['phone']),'EMAIL'=>$html($v['email']),'COMPANY_NAME'=>$html($v['company-name']),'COMMENT_TEXT'=>$html($comment),'EMAIL_TO'=>\COption::GetOptionString('main','email_from')],'FILE'=>array_column($saved,'id')]);
            $mail=$mailResult->isSuccess()?'queued':'pending';
            $db->prepare('UPDATE prom23_procurement SET mail_state=? WHERE scope=?')->execute([$mail,$scope]);
        }catch(\Throwable $error){$mail='pending';}
        return self::result($id,$crm,$mail);
    }
}
