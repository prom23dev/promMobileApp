<?php
declare(strict_types=1);
namespace Prom23\Runtime;
require_once __DIR__.'/SourceHttp.php';
require_once __DIR__.'/ConsentLedger.php';
require_once __DIR__.'/SubmissionReceipt.php';
require_once __DIR__.'/OrganizationDriver.php';
require_once __DIR__.'/ServiceDriver.php';
require_once __DIR__.'/LocationDriver.php';
require_once __DIR__.'/ProfileDriver.php';
require_once __DIR__.'/AccountActionDriver.php';
require_once __DIR__.'/PublicationDriver.php';
require_once __DIR__.'/OrderActionDriver.php';
require_once __DIR__.'/DocumentRequestDriver.php';

final class FormsDriver {
    private const CONTEXT_PATHS=[
        'callback'=>'/local/ajax/catalog/request-a-call.php','buy-one-click'=>'/local/ajax/catalog/buy-one-click.php',
        'rent'=>'/local/ajax/catalog/request-a-rent.php','leasing'=>'/local/ajax/catalog/request-a-leasing.php','found-cheaper'=>'/local/ajax/catalog/form-found-it-cheaper.php',
        'tour'=>'/local/ajax/form/book-a-tour.php','supplier'=>'/suppliers/','partner'=>'/franchise/',
        'profile-name'=>'/local/ajax/lk/info/edit/forms/change-name.php','profile-surname'=>'/local/ajax/lk/info/edit/forms/change-family.php',
        'profile-city'=>'/local/ajax/lk/info/edit/forms/change-city.php','profile-email'=>'/local/ajax/lk/info/edit/forms/change-email.php',
        'profile-phone'=>'/local/ajax/lk/info/edit/forms/change-phone.php','organization-requisites'=>'/local/ajax/lk/organization/organizations-details.php',
        'organization-verify'=>'/local/ajax/lk/organization/organization-verify.php','organization-edo'=>'/local/ajax/lk/organization/organization-edo.php',
        'review'=>'/local/ajax/reviews/form-review-add.php','question'=>'/local/ajax/reviews/form-question-add.php',
        'review-edit'=>'/local/ajax/lk/questions-and-reviews/form-edit-review.php','question-edit'=>'/local/ajax/lk/questions-and-reviews/form-edit-question.php',
        'appeal'=>'/local/ajax/lk/appeals/appeals-questions.php','appeal-rating'=>'/local/ajax/lk/appeals/appeals-rate-add.php',
    ];
    public function __construct(private array $config) {}
    private function definition(string $id): array {
        $form=$this->config['formContracts'][$id]??null;if(!$form)throw new RuntimeExceptionCode('NOT_FOUND',404);return $form;
    }
    private function canonical(array $form): string {return $form['aliasOf']??$form['id'];}
    private function authorizedTarget(array $payload,array $actor): array {
        $target=$payload['target']??[];$query=[];
        foreach($target as $key=>$value)if(!is_string($value)||!preg_match('/^[A-Za-z0-9_-]{1,100}$/D',$value))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        if(isset($target['productId'])){
            if(!preg_match('/^prom-([1-9][0-9]*)$/D',$target['productId'],$match))throw new RuntimeExceptionCode('NOT_FOUND',404);
            $product=\CIBlockElement::GetByID((int)$match[1])->Fetch();if(!$product||($product['ACTIVE']??'')!=='Y')throw new RuntimeExceptionCode('NOT_FOUND',404);$query['id']=(int)$match[1];
        }
        if(isset($target['organizationId'])){if((int)$target['organizationId']!==$actor['organizationId'])throw new RuntimeExceptionCode('FORBIDDEN',403);Actor::organization($actor['userId'],(int)$target['organizationId']);$query['companyID']=(int)$target['organizationId'];}
        if(isset($target['orderId'])){
            $order=\Bitrix\Sale\Order::load((int)$target['orderId']);if(!$order||(int)$order->getUserId()!==$actor['userId'])throw new RuntimeExceptionCode('NOT_FOUND',404);
            $property=$order->getPropertyCollection()->getItemByOrderPropertyCode('ORGANIZATION_ID');$org=$property?(int)$property->getValue():0;
            if($org!==$actor['organizationId']||((int)$order->getPersonTypeId()===2&&!$org))throw new RuntimeExceptionCode('NOT_FOUND',404);
            $query['order_id']=(int)$target['orderId'];
        }
        // Publication ownership and status-dependent form contexts require their model reader below.
        if(array_intersect(['reviewId','questionId','appealId','addressId','sessionId','parentId'],array_keys($target)))throw new RuntimeExceptionCode('SOURCE_SCOPE_ADAPTER_REQUIRED');
        return $query;
    }
    private function schema(array $form,array $payload,array $actor): array {
        $id=$this->canonical($form);$query=$this->authorizedTarget($payload,$actor);
        $record=['formId'=>$form['id'],'target'=>$payload['target']??[],'context'=>$payload['context'],'hidden'=>[],'options'=>[],'fields'=>[],'initialValues'=>[]];
        if($id==='advice'){
            if(!defined('WEB_FORM_ORANGE_ASK'))throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
            $formData=[];$questions=[];$answers=[];$dropdown=[];$multiselect=[];
            if(!\CForm::GetDataByID(WEB_FORM_ORANGE_ASK,$formData,$questions,$answers,$dropdown,$multiselect))throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
            $record['hidden']['WEB_FORM_ID']=WEB_FORM_ORANGE_ASK;
            foreach($questions as $questionId=>$question){$structures=$answers[$questionId]??[];if(count($structures)!==1)throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_CHANGED');$answer=array_values($structures)[0];$type=$answer['FIELD_TYPE']??'';
                if(!in_array($type,['text','textarea','email','hidden'],true))throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_CHANGED');
                if($type==='hidden'){$record['hidden']['form_hidden_'.$questionId]=(string)($answer['VALUE']??'');continue;}
                $name='form_'.$type.'_'.$answer['ID'];$record['fields'][]=['name'=>$name,'label'=>WorkspaceDriver::text($question['TITLE']??$name),'type'=>$type,'required'=>($question['REQUIRED']??'')==='Y'];$record['initialValues'][$name]=(string)($answer['VALUE']??'');
            }
        }elseif(isset(self::CONTEXT_PATHS[$id])){
            if(!class_exists(\DOMDocument::class))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
            $html=(new SourceHttp($this->config))->call(self::CONTEXT_PATHS[$id],$query,[]);
            $document=new \DOMDocument();$previous=libxml_use_internal_errors(true);$document->loadHTML('<?xml encoding="UTF-8">'.$html,LIBXML_NONET|LIBXML_NOERROR|LIBXML_NOWARNING);libxml_clear_errors();libxml_use_internal_errors($previous);
            $selected=null;
            foreach($document->getElementsByTagName('form') as $node){$path=parse_url($node->getAttribute('action'),PHP_URL_PATH);if($path===($form['sourceAction']??null)){$selected=$node;break;}}
            if(!$selected)throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
            foreach(['input','select','textarea'] as $tag)foreach($selected->getElementsByTagName($tag) as $control){
                $name=$control->getAttribute('name');if(!$name||!preg_match('/^[A-Za-z0-9_.\[\]-]{1,100}$/D',$name))continue;
                $type=$tag==='input'?($control->getAttribute('type')?:'text'):$tag;
                if(in_array($type,['submit','button','password'],true))continue;
                $value=$tag==='textarea'?$control->textContent:$control->getAttribute('value');
                if($type==='hidden'){if($name!=='sessid')$record['hidden'][$name]=$value;continue;}
                if($tag==='select'){
                    $options=[];foreach($control->getElementsByTagName('option') as $option)if($option->getAttribute('value')!=='')$options[]=['value'=>$option->getAttribute('value'),'label'=>trim($option->textContent)];
                    $record['options'][$name]=$options;
                }
                if(!empty($form['awaitingFields']))$record['fields'][]=['name'=>$name,'label'=>$name,'type'=>in_array($type,['text','email','tel','textarea','select','date','file','checkbox','number'],true)?$type:'text','required'=>$control->hasAttribute('required'),...($tag==='select'?['options'=>$record['options'][$name]]:[])];
                if($type!=='file'&&$type!=='checkbox')$record['initialValues'][$name]=$value;
            }
        }elseif(!empty($form['awaitingFields'])||!empty($form['repeatedFields'])||array_filter($form['fields']??[],static fn($field)=>isset($field['awaitingOptions'])))throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
        $record['revision']=hash('sha256',json_encode([$form,$record],JSON_THROW_ON_ERROR));
        $_SESSION['PROM23_FORM_CONTEXTS']??=[];
        foreach($_SESSION['PROM23_FORM_CONTEXTS'] as $revision=>$cached)if(($cached['expires']??0)<time())unset($_SESSION['PROM23_FORM_CONTEXTS'][$revision]);
        if(count($_SESSION['PROM23_FORM_CONTEXTS'])>=30)throw new RuntimeExceptionCode('RATE_LIMITED',429);
        $_SESSION['PROM23_FORM_CONTEXTS'][$record['revision']]=[...$record,'expires'=>time()+600];return $record;
    }
    private function consent(array $form,array $payload,array $actor): void {
        if($form['id']==='checkout'&&($payload['context']??'personal')!=='personal')$form['consents']=array_values(array_filter($form['consents'],static fn($c)=>!in_array('offer',$c['documents'],true)));
        if(count($payload['consents']??[])!==count($form['consents']??[]))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        if($form['id']==='subscription'&&!array_filter($payload['consents']??[],static fn($c)=>($c['name']??'')==='marketing'&&($c['accepted']??false)===true))throw new RuntimeExceptionCode('MARKETING_CHOICE_REQUIRED',422);
        foreach($form['consents']??[] as $required){
            $matches=array_values(array_filter($payload['consents']??[],static fn($v)=>($v['name']??null)===$required['name']));
            if(count($matches)!==1||(!empty($required['required'])&&($matches[0]['accepted']??false)!==true))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            $expected=$required['documents'];$supplied=$matches[0]['documentIds']??[];sort($expected);sort($supplied);if($expected!==$supplied)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            foreach($required['documents'] as $id)if(!isset($this->config['legalVersions'][$id]['sha256'],$this->config['legalVersions'][$id]['version']))throw new RuntimeExceptionCode('CONSENT_VERSION_REQUIRED');
        }
        $choices=$payload['consents']??[];
        if($form['id']==='notification-preferences'){
            foreach(['email_promotions','sms_promotions'] as $channel){$accepted=$payload['values'][$channel]??null;if(!is_bool($accepted))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);$choices[]=['name'=>$channel,'accepted'=>$accepted,'documentIds'=>['advertising']];}
        }
        if($choices)(new ConsentLedger($this->config))->record($choices,$actor,'form:'.$form['id']);
    }
    /** Repeat declared source constraints at the signed runtime boundary. */
    public static function validateFieldValue(array $field,mixed $value): void {
        if(!empty($field['readOnly']))return;
        if(!empty($field['required'])&&($value===null||$value===false||$value===[]||(is_string($value)&&trim($value)==='')))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        if($value===null||$value==='')return;
        if(isset($field['minLength'])){
            if(!is_string($value))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            $length=preg_match_all('/./us',trim($value),$characters);
            if($length===false||$length<$field['minLength'])throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        }
        if(($field['type']??'')==='file'){
            if(!is_array($value)||count($value)>($field['maxFiles']??10))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            foreach($value as$file){
                if(!is_array($file)||!is_int($file['size']??null)||$file['size']<1||$file['size']>($field['maxBytes']??20971520)||!is_string($file['name']??null))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
                $ext=strtolower(pathinfo($file['name'],PATHINFO_EXTENSION));
                if(!empty($field['acceptedExtensions'])&&!in_array($ext,array_map(static fn($v)=>ltrim(strtolower($v),'.'),$field['acceptedExtensions']),true))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            }
            return; // Verified token/content still checked by UploadDriver::resolve.
        }
        if(isset($field['maxUtf8Bytes'])&&(!is_string($value)||strlen($value)>$field['maxUtf8Bytes']))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        if(($field['type']??'')==='number'){
            if(!is_string($value)||!preg_match('/^[0-9]+$/D',$value)||(float)$value>9007199254740991||isset($field['minValue'])&&(float)$value<$field['minValue']||isset($field['maxValue'])&&(float)$value>$field['maxValue'])throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        }
    }
    public function run(string $operation,array $payload,array $actor): array {
        if(in_array($operation,['workspace.read','publications.read'],true)){require_once __DIR__.'/WorkspaceDriver.php';return (new WorkspaceDriver($this->config))->run($operation,$payload,$actor);}
        if($operation==='procurement.submit'||($payload['formId']??'')==='procurement'){require_once __DIR__.'/ProcurementDriver.php';return (new ProcurementDriver($this->config))->run($operation,$payload,$actor);}
        $form=$this->definition($payload['formId']??'');$id=$this->canonical($form);
        if(str_starts_with($form['id'],'auth-')){
            $auth=new AuthDriver($this->config);$revision=hash('sha256',json_encode($form,JSON_THROW_ON_ERROR));
            if($operation==='forms.context')return $auth->context($payload,$revision);
            if(($payload['revision']??'')!==$revision)throw new RuntimeExceptionCode('STALE_CONTEXT',409);
            $this->consent($form,$payload,$actor);
            if(!in_array($form['id'],$this->config['enabledForms']??[],true))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
            return $auth->run($operation,$payload,$actor);
        }
        $driver=null;
        if(str_starts_with($id,'organization-'))$driver=new OrganizationDriver($this->config);
        elseif(in_array($id,OrderActionDriver::IDS,true))$driver=new OrderActionDriver($this->config);
        elseif($id==='document-request')$driver=new DocumentRequestDriver($this->config);
        elseif(in_array($id,PublicationDriver::IDS,true))$driver=new PublicationDriver($this->config);
        elseif(in_array($id,AccountActionDriver::IDS,true))$driver=new AccountActionDriver($this->config);
        elseif(in_array($id,ProfileDriver::IDS,true))$driver=new ProfileDriver($this->config);
        elseif(in_array($id,['return','appeal','appeal-order','appeal-rating'],true))$driver=new ServiceDriver($this->config);
        if($driver){
            if($operation==='forms.submit'){
                if(!in_array($form['id'],$this->config['enabledForms']??[],true))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
                foreach($form['fields']??[] as$field)if(isset($field['minLength'])||isset($field['minValue'])||isset($field['maxValue'])||isset($field['maxUtf8Bytes']))self::validateFieldValue($field,$payload['values'][$field['name']]??null);
                $this->consent($form,$payload,$actor);
            }
            return $driver->run($operation,$payload,$actor);
        }
        $schema=$this->schema($form,$payload,$actor);
        if($operation==='forms.context')return array_intersect_key($schema,array_flip(!empty($form['awaitingFields'])?['formId','revision','fields','initialValues','options']:['formId','revision','initialValues','options']));
        if($operation!=='forms.submit'||!in_array($form['id'],$this->config['enabledForms']??[],true)||empty($form['sourceAction']))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        if(($payload['revision']??'')!==$schema['revision'])throw new RuntimeExceptionCode('STALE_CONTEXT',409);$this->consent($form,$payload,$actor);
        // These require model-level composite changes; never send an incomplete partial profile/entity update.
        if(str_starts_with($id,'profile-')||str_starts_with($id,'organization-')||!empty($form['repeatedFields']))throw new RuntimeExceptionCode('SOURCE_COMPOSITE_ADAPTER_REQUIRED');
        $post=$schema['hidden'];$files=[];$uploads=null;$known=[];
        foreach((!empty($form['awaitingFields'])?$schema['fields']:($form['fields']??[])) as $field){$known[]=$field['name'];if(!empty($field['readOnly']))continue;$value=$payload['values'][$field['name']]??null;$name=$field['sourceName']??$field['name'];
            self::validateFieldValue($field,$value);
            if(!empty($field['required'])&&($value===null||$value===''||$value===[]))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            if($value===null)continue;
            if(isset($schema['hidden'][$name]))throw new RuntimeExceptionCode('FORBIDDEN',403);
            if($field['type']==='file'){
                $uploads??=new UploadDriver($this->config);if(!is_array($value))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
                if($id==='review'&&$name==='media[]')$name='photos[]';
                foreach($value as $i=>$uploaded){$fileName=(!empty($field['multiple'])||str_ends_with($name,'[]'))?preg_replace('/\[\]$/','',$name).'['.$i.']':$name;$files[$fileName]=$uploads->resolve($payload,$field['name'],$uploaded['uploadToken']??'');}
            }elseif(isset($field['sourceValue'])){if($value===true)$post[preg_replace('/\[\]$/','',$name)][]=$field['sourceValue'];}
            elseif($field['type']==='checkbox')$post[$name]=$value?($id==='notification-preferences'?'Y':'on'):'';
            else $post[$name]=$value;
        }
        if(array_diff(array_keys($payload['values']??[]),$known))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        foreach($payload['consents']??[] as $consent)$post[$consent['name']]=!empty($consent['accepted'])?'on':'';
        $query=$this->authorizedTarget($payload,$actor);
        if(isset($query['id'])&&in_array($id,['review','question','product-notify'],true))$post['id']=$query['id'];
        if(isset($query['order_id'])&&in_array($id,['order-review','order-repeat'],true))$post['order-id']=$query['order_id'];
        $raw=(new SourceHttp($this->config))->call($form['sourceAction'],[],$post,$files);
        try{$result=json_decode($raw,true,32,JSON_THROW_ON_ERROR);}catch(\Throwable $error){throw new RuntimeExceptionCode('RESULT_RECONCILIATION_REQUIRED',409);}
        if(($result['STATUS']??'')!=='OK'){
            $fields=[];foreach(array_keys(is_array($result['ERRORS']??null)?$result['ERRORS']:[]) as $name)if(is_string($name)&&in_array($name,$known,true))$fields[$name]='INVALID';
            throw new RuntimeExceptionCode('VALIDATION_ERROR',422,$fields);
        }
        // Source STATUS OK confirms handler acceptance, not provider delivery/CRM success.
        return (new SubmissionReceipt($this->config))->record($payload,$actor,'source-status-ok');
    }
}
