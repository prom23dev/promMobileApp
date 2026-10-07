<?php
declare(strict_types=1);
namespace Bitrix\Sale\Services\Base { class RestrictionManager {const MODE_CLIENT=1;} }
namespace Bitrix\Sale\PaySystem { class Manager {public static array $rows=[14=>['ID'=>14]];static function getListWithRestrictions($p,$mode){return self::$rows;}} }
namespace Bitrix\Sale { class Order {public static $fixture;static function load(int $id){return self::$fixture&&self::$fixture->getId()===$id?self::$fixture:null;}} }
namespace {
require_once __DIR__.'/../src/Protocol.php';require_once __DIR__.'/../src/PaymentDriver.php';
use Prom23\Runtime\{PaymentDriver,PaymentHandoff,RuntimeExceptionCode};
$n=0;$skips=0;
function pcheck(bool $v,string $name):void{global$n;if(!$v)throw new \RuntimeException('FAIL '.$name);$n++;}
function preject(callable $fn,string $code):void{try{$fn();}catch(RuntimeExceptionCode $e){pcheck($e->getMessage()===$code,'expected '.$code.', got '.$e->getMessage());return;}throw new \RuntimeException('Expected '.$code);}
class PayResult {function isSuccess(){return true;}}
class PayProperty {function __construct(private $org){}function getValue(){return$this->org;}}
class PayProperties {function __construct(private $org){}function getItemByOrderPropertyCode($code){return new PayProperty($this->org);}}
class PayItem {function __construct(public int $id=10,public $q=2,public $price=10){}function getProductId(){return$this->id;}function getQuantity(){return$this->q;}function getFinalPrice(){return$this->price;}function getField($f){return'Test item';}}
class PayPayment {public bool $paid=false;public int $system=14;public int $id=2;public $sum=10.5;function getId(){return$this->id;}function getPaymentSystemId(){return$this->system;}function isPaid(){return$this->paid;}function isInner(){return false;}function getField($f){return'RUB';}function getSum(){return$this->sum;}function setPaid($v){$this->paid=$v==='Y';return new PayResult;}}
class PayOrder {public int $user=1;public int $org=0;public bool $cancelled=false;public int $saves=0;public array $items;public PayPayment $payment;public $price=10.5;public $delivery=.5;function __construct(){$this->payment=new PayPayment;$this->items=[new PayItem];}function getId(){return 1;}function getUserId(){return$this->user;}function getPersonTypeId(){return$this->org?2:1;}function getPropertyCollection(){return new PayProperties($this->org);}function getPaymentCollection(){return[$this->payment];}function isCanceled(){return$this->cancelled;}function isPaid(){return$this->payment->paid;}function getBasket(){return$this->items;}function getPrice(){return$this->price;}function getCurrency(){return'RUB';}function getDeliveryPrice(){return$this->delivery;}function save(){$this->saves++;return new PayResult;}}
$a=['userId'=>1,'organizationId'=>0,'context'=>'personal','sessionKey'=>str_repeat('a',64)];$o=new PayOrder;
PaymentDriver::ownedPayment($o,$o->payment,$a);pcheck(true,'actual owned Sale payment');
preject(fn()=>PaymentDriver::ownedPayment($o,$o->payment,[...$a,'userId'=>2]),'NOT_FOUND');
preject(fn()=>PaymentDriver::ownedPayment($o,$o->payment,[...$a,'organizationId'=>3]),'NOT_FOUND');
preject(fn()=>PaymentDriver::ownedPayment($o,$o->payment,[...$a,'userId'=>0]),'AUTH_REQUIRED');
$other=new PayPayment;$other->id=9;preject(fn()=>PaymentDriver::ownedPayment($o,$other,$a),'PAYMENT_NOT_AVAILABLE');
$snapshot=PaymentDriver::saleSnapshot($o,$o->payment);
pcheck($snapshot['cart']['items'][0]['total']==='10.00'&&$snapshot['cart']['items'][1]['total']==='0.50'&&$snapshot['amountKopecks']===1050,'whole exact cart plus delivery');
$cents=new PayOrder;$cents->items=[new PayItem(10,3,.3)];$cents->price=.8;$cents->payment->sum=.8;
pcheck(PaymentDriver::saleSnapshot($cents,$cents->payment)['amountKopecks']===80,'decimal cents stay exact');
$bad=clone$o;$bad->items=[new PayItem(10,1.5)];preject(fn()=>PaymentDriver::saleSnapshot($bad,$bad->payment),'PAYMENT_ITEMS_INVALID');
$bad=clone$o;$bad->items=[new PayItem,new PayItem];preject(fn()=>PaymentDriver::saleSnapshot($bad,$bad->payment),'PAYMENT_ITEMS_INVALID');
$bad=clone$o;$bad->price=11;preject(fn()=>PaymentDriver::saleSnapshot($bad,$bad->payment),'PAYMENT_AMOUNT_MISMATCH');
pcheck(PaymentDriver::decimalMoney('0.1')===10&&PaymentDriver::decimalMoney('10.01')===1001,'provider decimal parsing');
foreach(['-1.00','1e2','1.001','NaN']as$v)preject(fn()=>PaymentDriver::decimalMoney($v),'PAYMENT_AMOUNT_INVALID');
foreach(['http://pay.example/x','https://pay.example.evil/x','https://u@pay.example/x','https://pay.example:444/x','https://pay.example/\\evil','https://pay.example/\n']as$url)preject(fn()=>PaymentDriver::httpsUrl($url,['pay.example']),'PAYMENT_URL_INVALID');
pcheck(PaymentDriver::httpsUrl('https://pay.example/pay/a',['pay.example'])==='https://pay.example/pay/a','exact hosted HTTPS URL');
$merchant='11111111-1111-4111-8111-111111111111';$remote=['order'=>['orderId'=>'fixture-1-2','merchantId'=>$merchant,'currencyCode'=>'RUB','orderAmount'=>'10.50','paymentStatus'=>'CAPTURED','paymentUrl'=>'https://pay.example/a']];
pcheck(PaymentDriver::checkedStatus($remote,'fixture-1-2',1050,$merchant)['status']==='CAPTURED','authenticated status normalized');
foreach(['orderId'=>'other','merchantId'=>'other','currencyCode'=>'USD','orderAmount'=>'10.49','paymentStatus'=>'SUCCESS']as$k=>$v){$r=$remote;$r['order'][$k]=$v;preject(fn()=>PaymentDriver::checkedStatus($r,'fixture-1-2',1050,$merchant),'PAYMENT_PROVIDER_RESPONSE_INVALID');}
$driver=new PaymentDriver([]);pcheck(!$driver->splitEligibility(null,['context'=>'personal']),'disabled merchant means no option');
$offer=$driver->offerResolver(['sessionKey'=>$a['sessionKey'],'context'=>'personal','requestKey'=>'request-1'],$a);
pcheck($offer['delivery']===[]&&$offer['offerReady']===false&&!isset($offer['plus'])&&!isset($offer['split']),'no synthetic PSP teaser');
preject(fn()=>$driver->offerResolver(['sessionKey'=>$a['sessionKey'],'context'=>'organization:3','requestKey'=>'request-1'],$a),'ORGANIZATION_REQUIRED');
preject(fn()=>$driver->run('payment.status',['reference'=>'1','sessionKey'=>$a['sessionKey'],'context'=>'organization:3'],$a),'FORBIDDEN');
$hc=['url'=>'https://runtime.example/payment-handoff.php','allowedHosts'=>['runtime.example']];
pcheck(PaymentHandoff::endpoint($hc)===$hc['url'],'fixed handoff endpoint');
preject(fn()=>PaymentHandoff::endpoint([...$hc,'url'=>$hc['url'].'?token=secret']),'PAYMENT_HANDOFF_ADAPTER_REQUIRED');
pcheck(str_contains(PaymentHandoff::headers()['Content-Security-Policy'],"script-src 'none'")&&PaymentHandoff::headers()['Referrer-Policy']==='no-referrer','invoice CSP blocks executable source');
if(class_exists(\DOMDocument::class)){
    $html=PaymentHandoff::sanitize('<html><head><script>steal()</script><style>body{background:url(https://evil)}</style></head><body onload="steal()"><h1>Invoice</h1><table><tr><td colspan="2" onclick="steal()">100.01</td></tr></table><img src="https://evil"><form action="https://evil"><input value="private"></form><a href="javascript:steal()">Text</a></body></html>');
    pcheck(str_contains($html,'100.01')&&str_contains($html,'colspan="2"'),'invoice text and table retained');
    foreach(['steal','https://evil','<img','<form','<input','onclick','onload','javascript:']as$v)pcheck(!str_contains($html,$v),'drops active invoice '.$v);
    preject(fn()=>PaymentHandoff::sanitize('<script>only()</script>'),'PAYMENT_TEMPLATE_INVALID');
}else{$skips++;echo"SKIP DOM invoice sanitizer tests: extension unavailable\n";}
if(in_array('sqlite',\PDO::getAvailableDrivers(),true)){
    $path=tempnam(sys_get_temp_dir(),'prom23-pay-test-');chmod($path,0600);file_put_contents($path,str_repeat('x',32));$dbPath=tempnam(sys_get_temp_dir(),'prom23-pay-db-');chmod($dbPath,0600);
    try{
        $db=new \PDO('sqlite:'.$dbPath,null,null,[\PDO::ATTR_ERRMODE=>\PDO::ERRMODE_EXCEPTION]);
        $config=['pdo'=>$db,'payment'=>['enabled'=>true,'environment'=>'sandbox','apiKeyFile'=>$path,'merchantId'=>$merchant,'orderPrefix'=>'fixture','splitMerchantEnabled'=>true,'merchantReceiptsConfirmed'=>true,'reconcileEnabled'=>true,'paymentAllowedHosts'=>['pay.example'],'returnAllowedHosts'=>['return.example'],'redirectUrls'=>['onSuccess'=>'https://return.example/ok','onAbort'=>'https://return.example/abort','onError'=>'https://return.example/error']]];
        // A consumed invoice URL must not be replayed from the generic request cache.
        $replayDriver=new PaymentDriver($config);$replayOrder=new PayOrder;\Bitrix\Sale\Order::$fixture=$replayOrder;
        $replayRequest=['operation'=>'payment.session','idempotencyKey'=>'same-open-key','payload'=>['reference'=>'1','context'=>'personal','sessionKey'=>$a['sessionKey']]];
        pcheck(isset($replayDriver->handoffLedgerRequest($replayRequest,$a)['idempotencyKey']),'unreviewed online PSP keeps generic write guard');
        $db->exec('CREATE TABLE commerce_order_meta(reference TEXT PRIMARY KEY,payment_preference TEXT)');$db->exec("INSERT INTO commerce_order_meta VALUES('1','split')");
        pcheck(!isset($replayDriver->handoffLedgerRequest($replayRequest,$a)['idempotencyKey']),'saved Split uses durable provider attempts instead of cached URL');
        preject(fn()=>$replayDriver->handoffLedgerRequest($replayRequest,[...$a,'userId'=>2]),'NOT_FOUND');
        preject(fn()=>$replayDriver->handoffLedgerRequest($replayRequest,[...$a,'sessionKey'=>str_repeat('b',64)]),'FORBIDDEN');
        $replayOrder->payment->paid=true;preject(fn()=>$replayDriver->handoffLedgerRequest($replayRequest,$a),'PAYMENT_NOT_AVAILABLE');$replayOrder->payment->paid=false;
        $replayOrder->org=9;$replayOrder->payment->system=16;$company=[...$a,'organizationId'=>9,'context'=>'organization:9'];$invoiceRequest=$replayRequest;$invoiceRequest['payload']['context']=$company['context'];
        pcheck(!isset($replayDriver->handoffLedgerRequest($invoiceRequest,$company)['idempotencyKey']),'owned invoice opens a fresh one-use ticket');
        preject(fn()=>$replayDriver->handoffLedgerRequest($invoiceRequest,$a),'FORBIDDEN');
        pcheck($replayDriver->handoffLedgerRequest(['operation'=>'forms.submit','idempotencyKey'=>'guard'],$a)['idempotencyKey']==='guard','other mutations retain generic idempotency');
        $calls=[];$status='PENDING';$providerId='fixture-1-2';
        $transport=function($method,$url,$headers,$body)use(&$calls,&$status,&$providerId,$merchant){$calls[]=[$method,$url,$body];if($method==='POST'){$providerId=$body['orderId'];$data=['paymentUrl'=>'https://pay.example/link'];}else{$data=['order'=>['orderId'=>$providerId,'merchantId'=>$merchant,'currencyCode'=>'RUB','orderAmount'=>'10.50','paymentStatus'=>$status,'paymentUrl'=>'https://pay.example/link']];}return['status'=>200,'body'=>json_encode(['code'=>200,'status'=>'success','data'=>$data])];};
        $d=new PaymentDriver($config,$transport);
        pcheck($d->splitEligibility($o->payment,['context'=>'personal']),'merchant configured and actual Sale14 restriction');
        \Bitrix\Sale\PaySystem\Manager::$rows=[];pcheck(!$d->splitEligibility($o->payment,['context'=>'personal']),'missing Sale14 prevents option');\Bitrix\Sale\PaySystem\Manager::$rows=[14=>['ID'=>14]];
        $body=$d->createBody($snapshot);pcheck($body['availablePaymentMethods']===['SPLIT']&&!isset($body['isPrepayment'],$body['publicConstructor'],$body['risk']),'hosted Split no unverified parameters');
        pcheck($d->splitPaymentHandoff($o,$o->payment,$a)==='https://pay.example/link'&&count($calls)===1,'one actual create adapter request');
        pcheck($calls[0][2]['orderId']==='fixture-1-2'&&str_starts_with($calls[0][1],'https://sandbox.pay.yandex.ru/api/merchant/'),'fixed sandbox host and stable PSP key');
        $reopenDb=new \PDO('sqlite:'.$dbPath,null,null,[\PDO::ATTR_ERRMODE=>\PDO::ERRMODE_EXCEPTION]);$reopen=new PaymentDriver([...$config,'pdo'=>$reopenDb],$transport);$reopen->createHosted($snapshot,$a);
        pcheck(count($calls)===2&&$calls[1][0]==='GET','durable duplicate/reopen uses GET only');
        preject(fn()=>$d->createHosted($snapshot,[...$a,'userId'=>2]),'PAYMENT_CHANGED');pcheck(count($calls)===2,'foreign owner never reaches PSP');
        $db->exec('UPDATE prom23_payments SET expires=1');
        preject(fn()=>$d->createHosted($snapshot,$a),'PAYMENT_LINK_EXPIRED');pcheck(count(array_filter($calls,fn($v)=>$v[0]==='POST'))===1,'expired PENDING does not create duplicate');
        $status='FAILED';$d->createHosted($snapshot,$a);
        pcheck($providerId==='fixture-1-2-r1'&&count(array_filter($calls,fn($v)=>$v[0]==='POST'))===2,'verified terminal state permits next attempt');
        pcheck($db->query("SELECT status FROM prom23_payment_attempts WHERE provider_id='fixture-1-2'")->fetchColumn()==='FAILED','prior terminal attempt retained');
        $status='PENDING';$d->createHosted($snapshot,$a);pcheck(end($calls)[0]==='GET'&&str_ends_with(end($calls)[1],'fixture-1-2-r1'),'renewed attempt retry looks up actual attempt');
        \Bitrix\Sale\Order::$fixture=$o;$status='AUTHORIZED';$reply=$d->run('payment.status',['reference'=>'1','sessionKey'=>$a['sessionKey'],'context'=>'personal'],$a);
        pcheck($reply['status']==='AUTHORIZED'&&!$o->payment->paid&&$o->saves===0,'authorized funds are not paid');
        $status='CAPTURED';$reply=$d->run('payment.status',['reference'=>'1','sessionKey'=>$a['sessionKey'],'context'=>'personal'],$a);
        pcheck($reply['status']==='CAPTURED'&&$o->payment->paid&&$o->saves===1,'captured status single Sale event save');
        $d->run('payment.status',['reference'=>'1','sessionKey'=>$a['sessionKey'],'context'=>'personal'],$a);pcheck($o->saves===1,'repeat captured status does not save again');
        // An uncertain initial POST remains durable pending; next invocation only queries the same provider ID.
        $db2=new \PDO('sqlite::memory:',null,null,[\PDO::ATTR_ERRMODE=>\PDO::ERRMODE_EXCEPTION]);$uncertainCalls=[];
        $uncertain=new PaymentDriver([...$config,'pdo'=>$db2],function($method,$url,$headers,$body)use(&$uncertainCalls){$uncertainCalls[]=$method;return['status'=>503,'body'=>'private provider error'];});
        preject(fn()=>$uncertain->createHosted($snapshot,$a),'RESULT_RECONCILIATION_REQUIRED');
        preject(fn()=>$uncertain->createHosted($snapshot,$a),'PAYMENT_PROVIDER_UNAVAILABLE');pcheck($uncertainCalls===['POST','GET'],'uncertain write never retried automatically');
        pcheck($db2->query('SELECT state FROM prom23_payments')->fetchColumn()==='pending','uncertain outcome retains reconciliation record');
        $db3=new \PDO('sqlite::memory:',null,null,[\PDO::ATTR_ERRMODE=>\PDO::ERRMODE_EXCEPTION]);
        $late=new PaymentDriver([...$config,'pdo'=>$db3],function()use($db3){$db3->exec("UPDATE prom23_payments SET state='paid'");return['status'=>200,'body'=>json_encode(['code'=>200,'status'=>'success','data'=>['paymentUrl'=>'https://pay.example/link']])];});
        preject(fn()=>$late->createHosted($snapshot,$a),'RESULT_RECONCILIATION_REQUIRED');pcheck($db3->query('SELECT state FROM prom23_payments')->fetchColumn()==='paid','late create response cannot overwrite reconciliation state');
        if(class_exists(\DOMDocument::class)){
            $db->exec('CREATE TABLE prom23_session_bindings(session_key TEXT PRIMARY KEY)');$db->prepare('INSERT INTO prom23_session_bindings VALUES(?)')->execute([$a['sessionKey']]);
            $vault=new PaymentHandoff($db,$hc);$url=$vault->issue('<table><tr><td>1050</td></tr></table>',$a,'1');$token=parse_url($url,PHP_URL_FRAGMENT);
            pcheck(!str_contains(parse_url($url,PHP_URL_PATH),$token)&&str_contains($vault->consume($token),'1050'),'one-use private invoice retrieved without cookies');
            preject(fn()=>$vault->consume($token),'NOT_FOUND');
            $token=parse_url($vault->issue('<p>Invoice</p>',$a,'1'),PHP_URL_FRAGMENT);$db->exec('UPDATE prom23_invoice_tickets SET expires=1');preject(fn()=>$vault->consume($token),'NOT_FOUND');
            $token=parse_url($vault->issue('<p>Invoice</p>',$a,'1'),PHP_URL_FRAGMENT);PaymentHandoff::revokeIfExists($db,$a['sessionKey']);preject(fn()=>$vault->consume($token),'NOT_FOUND');
            $other=[...$a,'sessionKey'=>str_repeat('b',64)];$db->prepare('INSERT INTO prom23_session_bindings VALUES(?)')->execute([$other['sessionKey']]);
            $token=parse_url($vault->issue('<p>Other invoice</p>',$other,'2'),PHP_URL_FRAGMENT);PaymentHandoff::revokeIfExists($db,$a['sessionKey']);pcheck(str_contains($vault->consume($token),'Other invoice'),'revocation does not affect another session');
            $t1=parse_url($vault->issue('<p>First session</p>',$a,'1'),PHP_URL_FRAGMENT);$t2=parse_url($vault->issue('<p>Second session</p>',$other,'1'),PHP_URL_FRAGMENT);
            $anotherUser=[...$a,'userId'=>2,'sessionKey'=>str_repeat('c',64)];$db->prepare('INSERT INTO prom23_session_bindings VALUES(?)')->execute([$anotherUser['sessionKey']]);
            $t3=parse_url($vault->issue('<p>Another user</p>',$anotherUser,'3'),PHP_URL_FRAGMENT);PaymentHandoff::revokeUserIfExists($db,1);
            preject(fn()=>$vault->consume($t1),'NOT_FOUND');preject(fn()=>$vault->consume($t2),'NOT_FOUND');pcheck(str_contains($vault->consume($t3),'Another user'),'account deletion revokes all own sessions only');
        }
    }finally{unlink($path);unlink($dbPath);}
}else{$skips++;echo"SKIP SQLite payment/renewal/status/invoice durability tests: pdo_sqlite unavailable\n";}
echo$n." payment adapter checks PASS; ".$skips." groups SKIP; isolated doubles only, no Bitrix/PSP network\n";
}
