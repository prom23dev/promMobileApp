<?php
declare(strict_types=1);
namespace Prom23\Runtime;

/** Versioned receipt for the attempt; not a claim of legal approval or message delivery. */
final class ConsentLedger {
    public function __construct(private array $config) {
        $config['pdo']->exec('CREATE TABLE IF NOT EXISTS prom23_consent_receipts(id TEXT PRIMARY KEY,session_scope TEXT,user_id INTEGER,organization_id INTEGER,purpose TEXT,documents TEXT,created INTEGER)');
    }
    public function record(array $consents,array $actor,string $purpose): string {
        if(!$consents||count($consents)>12)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        $documents=[];
        foreach($consents as $consent){
            if(!is_bool($consent['accepted']??null)||!preg_match('/^[a-zA-Z0-9_-]{1,100}$/D',$consent['name']??'')||!is_array($consent['documentIds']??null))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            // UI-only marketing choices have their own approved text/version; a refusal is recorded as false.
            $ids=$consent['documentIds']?:['ui'];
            foreach($ids as $id){
                $version=$this->config['legalVersions'][$id]??null;
                if(!$version||!preg_match('/^[a-f0-9]{64}$/D',$version['sha256']??'')||!is_string($version['version']??null)||strlen($version['version'])>100)throw new RuntimeExceptionCode('CONSENT_VERSION_REQUIRED');
                $formId=str_starts_with($purpose,'form:')?substr($purpose,5):$purpose;
                $form=$this->config['formContracts'][$formId]??[];$label='';foreach($form['consents']??[]as$entry)if($entry['name']===$consent['name'])$label=$entry['label'];
                $request=$this->config['request']['payload']??[];$values=$request['values']??[];
                if($label==='')foreach($form['fields']??[]as$field)if(($field['name']??'')===$consent['name'])$label=$field['label'];
                $recipient=$id==='advertising'?($values['email']??null):null;
                if($id==='advertising'&&$formId==='notification-preferences'&&$actor['userId']>0){$user=\CUser::GetByID($actor['userId'])->Fetch();$recipient=$consent['name']==='sms_promotions'?($user['PERSONAL_PHONE']??null):($user['EMAIL']??null);}
                if($id==='advertising'&&$consent['accepted']&&(!is_string($recipient)||trim($recipient)===''))throw new RuntimeExceptionCode('ADVERTISING_RECIPIENT_REQUIRED',422);
                $documents[]=['name'=>$consent['name'],'documentId'=>$id,'version'=>$version['version'],'sha256'=>$version['sha256'],'accepted'=>$consent['accepted'],'formId'=>$formId,'purposeCode'=>$form['purposeCode']??strtoupper(str_replace('-','_',$formId)),'shownLabel'=>$label,'shownLabelHash'=>hash('sha256',$label),'source'=>'mobile-form','runtimePeerIp'=>$_SERVER['REMOTE_ADDR']??null,
                 'formFields'=>array_map(static fn($field)=>['name'=>$field['name'],'label'=>$field['label'],'type'=>$field['type']],$form['fields']??[]),'transportPeerIp'=>$request['audit']['transportPeerIp']??null,'recipient'=>$recipient,'channel'=>$id==='advertising'?($consent['name']==='sms_promotions'?'sms':'email'):null,
                 'publicData'=>$id==='distribution'?['displayName'=>$values['public-author']??'','city'=>null,'avatar'=>null,'conditions'=>$values['publication-conditions']??'']:null];
            }
        }
        $key=$this->config['request']['idempotencyKey']??'';if(!$key)throw new RuntimeExceptionCode('IDEMPOTENCY_CONFLICT',409);
        $scope=hash('sha256',$actor['sessionKey']);$id=hash('sha256',$scope."\n".$purpose."\n".$key);
        $this->config['pdo']->prepare('INSERT OR IGNORE INTO prom23_consent_receipts VALUES(?,?,?,?,?,?,?)')->execute([$id,$scope,$actor['userId'],$actor['organizationId'],$purpose,json_encode($documents,JSON_THROW_ON_ERROR),time()]);
        return $id;
    }
}
