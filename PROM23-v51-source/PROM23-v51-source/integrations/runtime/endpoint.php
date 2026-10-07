<?php
declare(strict_types=1);
use Prom23\Runtime\{Protocol,RequestLedger,RuntimeExceptionCode,Actor,BuyerDriver,AuthDriver,UploadDriver,FormsDriver};
require_once __DIR__.'/src/Protocol.php';
ini_set('display_errors','0'); umask(0077);
$request=null; $ledger=null; $binding=null; $baseLevel=ob_get_level();
$emit=static function(array $data,int $status=200) use (&$request,&$ledger,&$binding,$baseLevel): void {
    while(ob_get_level()>$baseLevel)ob_end_clean();
    if($ledger && $binding && session_id())$ledger->pdo()->prepare('UPDATE prom23_session_bindings SET php_session_id=?,updated=? WHERE session_key=?')->execute([session_id(),time(),$binding]);
    header_remove('Set-Cookie');header_remove('Location');http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');header('X-Robots-Tag: noindex, nofollow');
    echo json_encode(['protocol'=>Protocol::VERSION,'requestId'=>$request['requestId']??'','operation'=>$request['operation']??'',...$data],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
};
try {
    if(($_SERVER['REQUEST_METHOD']??'')!=='POST')throw new RuntimeExceptionCode('METHOD_NOT_ALLOWED',405);
    if(isset($_SERVER['HTTP_ORIGIN'])||isset($_SERVER['HTTP_COOKIE']))throw new RuntimeExceptionCode('FORBIDDEN',403);
    if(strtolower(trim(explode(';',$_SERVER['CONTENT_TYPE']??'')[0]))!=='application/json'||isset($_SERVER['HTTP_CONTENT_ENCODING']))throw new RuntimeExceptionCode('INVALID_BODY',415);
    $configPath=getenv('PROM23_RUNTIME_CONFIG_FILE')?:'';$realConfig=realpath($configPath);
    if(!$realConfig||is_link($configPath)||!is_file($realConfig)||(fileperms($realConfig)&0077))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
    $config=require $realConfig;
    $root=realpath($config['siteRoot']??'');$state=realpath($config['stateDirectory']??'');$keyFile=realpath($config['keyFile']??'');
    foreach([$realConfig,$state,$keyFile] as $private)if(!$root||!$private||$private===$root||str_starts_with($private,$root.DIRECTORY_SEPARATOR))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
    if(!is_dir($state)||(fileperms($state)&0077)||is_link($config['stateDirectory'])||is_link($config['keyFile'])||(fileperms($keyFile)&0077)||filesize($keyFile)>256)throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
    $key=trim((string)file_get_contents($keyFile));$path=$config['endpointPath']??'/local/prom23-runtime/endpoint.php';
    if(($_SERVER['REQUEST_URI']??'')!==$path)throw new RuntimeExceptionCode('FORBIDDEN',403);
    $body=file_get_contents('php://input',false,null,0,131073);if($body===false)throw new RuntimeExceptionCode('INVALID_BODY',400);
    $headers=[];foreach(['TIMESTAMP','NONCE','SIGNATURE'] as $name)$headers['x-prom23-'.strtolower($name)]=$_SERVER['HTTP_X_PROM23_'.$name]??'';
    if(isset($_SERVER['HTTP_IDEMPOTENCY_KEY']))$headers['idempotency-key']=$_SERVER['HTTP_IDEMPOTENCY_KEY'];
    $request=Protocol::decode($body,$headers,$path,$key,time());$operation=$request['operation'];$payload=$request['payload'];
    if(!in_array($operation,$config['enabledOperations']??[],true))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
    if(in_array($operation,['forms.submit','order.submit','cart.quote','commerce.offer','checkout.addresses','checkout.options','payment.session','payment.status','procurement.submit'],true)&&($config['sourceSecretsReplaced']??false)!==true)throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
    if(in_array($operation,['forms.submit','order.submit','uploads.complete','procurement.submit'],true)&&!isset($request['idempotencyKey']))throw new RuntimeExceptionCode('IDEMPOTENCY_CONFLICT',409);
    $ledger=new RequestLedger($state.'/runtime.sqlite');$ledger->nonce($request['requestId'],time());
    $db=$ledger->pdo();$db->exec('CREATE TABLE IF NOT EXISTS prom23_session_bindings(session_key TEXT PRIMARY KEY,php_session_id TEXT,updated INTEGER)');
    $binding=$payload['sessionKey'];$s=$db->prepare('SELECT php_session_id FROM prom23_session_bindings WHERE session_key=?');$s->execute([$binding]);$sessionId=$s->fetchColumn();
    if(!$sessionId){if((int)$db->query('SELECT count(*) FROM prom23_session_bindings')->fetchColumn()>=500)throw new RuntimeExceptionCode('RATE_LIMITED',429);$sessionId=bin2hex(random_bytes(24));$db->prepare('INSERT INTO prom23_session_bindings VALUES(?,?,?)')->execute([$binding,$sessionId,time()]);}
    $_SERVER['DOCUMENT_ROOT']=$root;$_COOKIE=[];
    ini_set('session.use_cookies','0');session_id($sessionId);
    foreach(['NO_AGENT_CHECK','NO_KEEP_STATISTIC','STOP_STATISTICS','NO_AGENT_STATISTIC'] as $flag)if(!defined($flag))define($flag,true);
    $bootstrap=$root.'/bitrix/modules/main/include/prolog_before.php';if(!is_file($bootstrap))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
    ob_start();require_once $bootstrap;
    foreach(['sale','catalog','iblock','form','highloadblock'] as $module)if(!\Bitrix\Main\Loader::includeModule($module))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
    require_once __DIR__.'/src/Actor.php';require_once __DIR__.'/src/AuthDriver.php';require_once __DIR__.'/src/UploadDriver.php';require_once __DIR__.'/src/FormsDriver.php';
    $config['legalVersions']=json_decode(file_get_contents(__DIR__.'/legal-versions.json'),true,512,JSON_THROW_ON_ERROR);
    $config['key']=$key;$config['pdo']=$db;$config['request']=$request;$config['formContracts']=json_decode(file_get_contents(__DIR__.'/form-contracts.json'),true,32,JSON_THROW_ON_ERROR)['forms'];
    $config['uploadDirectory']=$state.'/uploads';
    require_once __DIR__.'/src/ConsentLedger.php';
    if(in_array($operation,['checkout.options','cart.quote','cart.coupon','order.submit'],true)){
        require_once __DIR__.'/src/DeliveryDriver.php';
        $deliveryDriver=new \Prom23\Runtime\DeliveryDriver($config);
        foreach($deliveryDriver->callbacks() as $name=>$callbacks)$config['commerce'][$name]=array_replace($config['commerce'][$name]??[],$callbacks);
    }
    if(in_array($operation,['checkout.options','cart.quote','cart.coupon','order.submit','payment.session','payment.status','commerce.offer'],true)){
        require_once __DIR__.'/src/PaymentDriver.php';
        $paymentDriver=new \Prom23\Runtime\PaymentDriver($config);
        foreach($paymentDriver->callbacks() as $name=>$callback)if(!array_key_exists($name,$config['commerce']))$config['commerce'][$name]=$callback;
    }
    $formId=$payload['formId']??'';$publicForms=['callback','contact','buy-one-click','rent','leasing','found-cheaper','tour','business-advice','quote','production-request','supplier','partner','franchise','advice','subscription','procurement','review','question','review-reply','question-reply'];
    $guest=$operation==='procurement.submit'||in_array($operation,['auth.session','auth.logout','publications.read','commerce.offer','checkout.addresses'],true)||str_starts_with($formId,'auth-')||in_array($formId,$publicForms,true);
    $actor=Actor::resolve($payload,$guest);
    $ledgerRequest=$operation==='payment.session'?$paymentDriver->handoffLedgerRequest($request,$actor):$request;
    $result=$ledger->begin($ledgerRequest);
    if($result===null){
        if($operation==='checkout.addresses'){require_once __DIR__.'/src/DeliveryDriver.php';$result=(new \Prom23\Runtime\DeliveryDriver($config))->addressSuggestions($payload,$actor);}
        elseif($operation==='payment.status'){require_once __DIR__.'/src/PaymentDriver.php';$result=(new \Prom23\Runtime\PaymentDriver($config))->run($operation,$payload,$actor);}
        elseif(str_starts_with($operation,'buyer.'))$result=(new BuyerDriver())->run($operation,$payload,$actor);
        elseif(str_starts_with($operation,'auth.'))$result=(new AuthDriver($config))->run($operation,$payload,$actor);
        elseif(str_starts_with($operation,'uploads.'))$result=(new UploadDriver($config))->run($operation,$payload,$actor);
        elseif(in_array($operation,['forms.context','forms.submit','workspace.read','publications.read','procurement.submit'],true))$result=(new FormsDriver($config))->run($operation,$payload,$actor);
        else {
            require_once __DIR__.'/src/CommerceDriver.php';
            // Source Regions.php:465-481: a personal buyer off the site's own CIS domain always
            // prices against DEFAULT_CITY, never their picked settlement. Applied here (not inside
            // CommerceDriver) because only the dispatcher holds the root 'location' config.
            if(is_string($payload['settlementId']??null)){
                require_once __DIR__.'/src/LocationDriver.php';
                $kind=($payload['context']??'')==='personal'?'personal':'organization';
                $payload['settlementId']=(new \Prom23\Runtime\LocationDriver($config))->effectiveSettlement($payload['settlementId'],$kind);
            }
            $result=(new \Prom23\Runtime\CommerceDriver($config))->run($operation,$payload,$actor);
        }
        $ledger->complete($ledgerRequest,$result);
    }
    $emit(['data'=>$result]);
}catch(RuntimeExceptionCode $error){$safe=[];foreach($error->fields as $name=>$code)if(is_string($name)&&preg_match('/^[A-Za-z0-9_.\[\]-]{1,100}$/D',$name)&&in_array($code,['INVALID','REQUIRED','EMAIL','PHONE','PASSWORD','PASSWORD_REPEAT','CODE','OPTION','FILE','LENGTH','CONSENT'],true))$safe[$name]=$code;
    $emit(['error'=>['code'=>$error->getMessage(),...($safe?['fields'=>$safe]:[]),...($error->retryAfterSeconds!==null?['retryAfterSeconds'=>max(0,min(3600,$error->retryAfterSeconds))]:[])]],$error->status);}
catch(Throwable $error){$emit(['error'=>['code'=>'INTEGRATION_UNAVAILABLE']],503);}
