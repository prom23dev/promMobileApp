<?php
declare(strict_types=1);
namespace Prom23\Runtime;

require_once __DIR__.'/ServiceDriver.php';
require_once __DIR__.'/PaymentHandoff.php';

/** Saved Sale order -> hosted PSP payment. Never receives client prices, card data or source credentials. */
final class PaymentDriver
{
    private array $config;
    private ?\PDO $db;
    private $http;

    /** The optional transport exists only for isolated contract tests; cURL is the deployment transport. */
    public function __construct(array $config, ?callable $http = null)
    {
        $this->config=$config['payment']??[]; $this->db=$config['pdo']??null; $this->http=$http;
        if($this->db){
            $this->db->exec('CREATE TABLE IF NOT EXISTS prom23_payments(scope TEXT PRIMARY KEY,provider_id TEXT UNIQUE,owner TEXT,fingerprint TEXT,state TEXT,url TEXT,expires INTEGER,request_id TEXT,created INTEGER,attempt INTEGER NOT NULL DEFAULT 0)');
            if(!in_array('attempt',array_column($this->db->query('PRAGMA table_info(prom23_payments)')->fetchAll(\PDO::FETCH_ASSOC),'name'),true))$this->db->exec('ALTER TABLE prom23_payments ADD COLUMN attempt INTEGER NOT NULL DEFAULT 0');
            $this->db->exec('CREATE TABLE IF NOT EXISTS prom23_payment_attempts(provider_id TEXT PRIMARY KEY,scope TEXT,status TEXT,created INTEGER)');
        }
    }

    /** Refreshable document tickets / Split use their own lifecycle, not a cached one-use URL.
     * Other PSP writes retain the generic pending/result ledger. Client preference is never trusted.
     */
    public function handoffLedgerRequest(array $request,array $actor):array
    {
        if(($request['operation']??'')!=='payment.session')return $request;
        $payload=$request['payload']??[];
        if(($payload['sessionKey']??'')!==($actor['sessionKey']??'')||($payload['context']??'')!==($actor['context']??''))self::fail('FORBIDDEN',403);
        if(!preg_match('/^[1-9][0-9]{0,15}$/D',$payload['reference']??''))self::fail('ORDER_NOT_FOUND',404);
        $order=\Bitrix\Sale\Order::load((int)$payload['reference']);if(!$order)self::fail('ORDER_NOT_FOUND',404);
        $payments=[];foreach($order->getPaymentCollection()as$payment)if(!$payment->isInner())$payments[]=$payment;
        if(count($payments)!==1)self::fail('PAYMENT_SELECTION_REQUIRED',409);
        $payment=$payments[0];self::ownedPayment($order,$payment,$actor);
        $invoiceId=defined('INVOICE_PAYMENT_SYSTEM')?(int)INVOICE_PAYMENT_SYSTEM:16;
        $refreshable=(int)$payment->getPaymentSystemId()===$invoiceId&&(int)$order->getPersonTypeId()===2;
        if((int)$payment->getPaymentSystemId()===14&&(int)$order->getPersonTypeId()===1&&$this->db&&$this->db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='commerce_order_meta'")->fetchColumn()){
            $q=$this->db->prepare('SELECT payment_preference FROM commerce_order_meta WHERE reference=?');$q->execute([$payload['reference']]);
            $refreshable=$q->fetchColumn()==='split';
        }
        if($refreshable)unset($request['idempotencyKey']);
        return $request;
    }

    public function callbacks(): array
    {
        return [
            'splitEligibility'=>fn($payment,array $scope):bool=>$this->splitEligibility($payment,$scope),
            'splitPaymentHandoff'=>fn($order,$payment,array $actor):string=>$this->splitPaymentHandoff($order,$payment,$actor),
            'offerResolver'=>fn(array $payload,array $actor):array=>$this->offerResolver($payload,$actor),
            'invoiceHandoff'=>fn($order,$payment,array $actor,$result):string=>$this->invoiceHandoff($order,$payment,$actor,$result),
        ];
    }

    /** Signed dispatcher operation. Reference is the existing Sale order ID, never a provider-supplied URL. */
    public function run(string $operation,array $payload,array $actor):array
    {
        if($operation!=='payment.status'||!preg_match('/^[1-9][0-9]{0,15}$/D',$payload['reference']??''))self::fail('ORDER_NOT_FOUND',404);
        if(($payload['sessionKey']??'')!==($actor['sessionKey']??'')||($payload['context']??'')!==($actor['context']??''))self::fail('FORBIDDEN',403);
        $order=\Bitrix\Sale\Order::load((int)$payload['reference']);if(!$order)self::fail('ORDER_NOT_FOUND',404);
        ServiceDriver::ownedOrder($order,$actor);$payments=[];foreach($order->getPaymentCollection()as$p)if(!$p->isInner())$payments[]=$p;
        if(count($payments)!==1)self::fail('PAYMENT_SELECTION_REQUIRED',409);
        return ($this->config['reconcileEnabled']??false)===true?$this->reconcile($order,$payments[0],$actor):$this->status($order,$payments[0],$actor);
    }

    /** Merchant capability + existing Sale restriction, NOT approval/terms for a particular person. */
    public function splitEligibility($payment,array $scope): bool
    {
        if(($scope['context']??'')!=='personal'||($this->config['splitMerchantEnabled']??false)!==true) return false;
        $this->ready();
        $rows=\Bitrix\Sale\PaySystem\Manager::getListWithRestrictions($payment,\Bitrix\Sale\Services\Base\RestrictionManager::MODE_CLIENT);
        foreach($rows as $id=>$row) if((int)($row['ID']??$id)===14) return true;
        return false;
    }

    public function splitPaymentHandoff($order,$payment,array $actor): string
    {
        $this->ready();
        if(($this->config['splitMerchantEnabled']??false)!==true) self::fail('PAYMENT_NOT_AVAILABLE',409);
        self::ownedPayment($order,$payment,$actor);
        if((int)$order->getPersonTypeId()!==1||(int)$payment->getPaymentSystemId()!==14) self::fail('PAYMENT_NOT_AVAILABLE',409);
        $rows=\Bitrix\Sale\PaySystem\Manager::getListWithRestrictions($payment,\Bitrix\Sale\Services\Base\RestrictionManager::MODE_CLIENT);
        $allowed=false; foreach($rows as $id=>$row) if((int)($row['ID']??$id)===14)$allowed=true;
        if(!$allowed) self::fail('PAYMENT_NOT_AVAILABLE',409);
        $snapshot=self::saleSnapshot($order,$payment);
        return $this->createHosted($snapshot,$actor);
    }

    /** A callback can truthfully return no PSP teaser. No arithmetic "four payments" or guessed Plus points. */
    public function offerResolver(array $payload,array $actor): array
    {
        self::scope($payload,$actor);
        return ['requestKey'=>$payload['requestKey'],'expiresAt'=>gmdate('c',time()+60),'delivery'=>[], 'offerReady'=>false];
    }

    /** The current source invoice handler supplies its actual HTML; this never generates new bank requisites. */
    public function invoiceHandoff($order,$payment,array $actor,$result): string
    {
        self::ownedPayment($order,$payment,$actor);
        $id=defined('INVOICE_PAYMENT_SYSTEM')?(int)INVOICE_PAYMENT_SYSTEM:16;
        if((int)$payment->getPaymentSystemId()!==$id||(int)$order->getPersonTypeId()!==2) self::fail('PAYMENT_HANDOFF_ADAPTER_REQUIRED');
        if(!is_object($result)||!method_exists($result,'isSuccess')||!$result->isSuccess()||!method_exists($result,'getTemplate')) self::fail('PAYMENT_INIT_FAILED');
        if(($this->config['invoiceEnabled']??false)!==true||!$this->db) self::fail('PAYMENT_HANDOFF_ADAPTER_REQUIRED');
        $vault=new PaymentHandoff($this->db,$this->config['handoff']??[]);
        return $vault->issue($result->getTemplate(),$actor,(string)$order->getId());
    }

    public static function ownedPayment($order,$payment,array $actor): void
    {
        if(!is_int($actor['userId']??null)||$actor['userId']<1||!preg_match('/^[a-f0-9]{64}$/D',$actor['sessionKey']??'')) self::fail('AUTH_REQUIRED',401);
        ServiceDriver::ownedOrder($order,$actor);
        if((int)$order->getId()<1||(int)$payment->getId()<1)self::fail('ORDER_NOT_FOUND',404);
        $matches=0;foreach($order->getPaymentCollection()as$p)if((int)$p->getId()===(int)$payment->getId())$matches++;
        if($matches!==1||$payment->isInner()||$payment->isPaid()||$order->isPaid()||$order->isCanceled())self::fail('PAYMENT_NOT_AVAILABLE',409);
    }

    /** Exact total reconciliation; unsupported fractional/duplicate lines fail, never get silently rounded away. */
    public static function saleSnapshot($order,$payment): array
    {
        if($order->getCurrency()!=='RUB'||$payment->getField('CURRENCY')!=='RUB') self::fail('PAYMENT_CURRENCY_INVALID');
        $total=self::money($order->getPrice()); $sum=self::money($payment->getSum());
        if($sum!==$total||$total<1)self::fail('PAYMENT_AMOUNT_MISMATCH',409);
        $items=[];$seen=[];$subtotal=0;
        foreach($order->getBasket() as $item){
            $id=(string)$item->getProductId();$quantity=$item->getQuantity();
            if(!preg_match('/^[1-9][0-9]{0,15}$/D',$id)||isset($seen[$id])||!is_numeric($quantity)||(float)$quantity!==(float)(int)$quantity||(int)$quantity<1||(int)$quantity>999)self::fail('PAYMENT_ITEMS_INVALID');
            $seen[$id]=true;$line=self::money($item->getFinalPrice());$subtotal+=$line;
            $items[]=['productId'=>$id,'title'=>self::text($item->getField('NAME'),500),'quantity'=>['count'=>(string)(int)$quantity],'total'=>self::decimal($line)];
        }
        if(!$items||count($items)>500)self::fail('PAYMENT_ITEMS_INVALID');
        $delivery=self::money($order->getDeliveryPrice());
        if($delivery>0)$items[]=['productId'=>'delivery','title'=>'Доставка','quantity'=>['count'=>'1'],'total'=>self::decimal($delivery)];
        if($subtotal+$delivery!==$total)self::fail('PAYMENT_AMOUNT_MISMATCH',409);
        return ['orderId'=>(string)$order->getId(),'paymentId'=>(string)$payment->getId(),'amountKopecks'=>$total,'cart'=>['items'=>$items,'total'=>['amount'=>self::decimal($total)]]];
    }

    /** Public for contract testing. Deployment only calls this with saleSnapshot() of an owned saved order. */
    public function createHosted(array $snapshot,array $actor): string
    {
        $this->ready();
        $body=$this->createBody($snapshot);
        $scope=hash('sha256',$this->environment().'|'.$body['orderId']);$owner=self::owner($actor);
        $fingerprint=hash('sha256',json_encode($body,JSON_THROW_ON_ERROR));$now=time();
        $this->db->exec('BEGIN IMMEDIATE');$active=true;
        try{
            $q=$this->db->prepare('SELECT * FROM prom23_payments WHERE scope=?');$q->execute([$scope]);$existing=$q->fetch(\PDO::FETCH_ASSOC);
            if($existing){
                $this->db->exec('COMMIT');$active=false;
                if(!hash_equals($existing['owner'],$owner)||!hash_equals($existing['fingerprint'],$fingerprint))self::fail('PAYMENT_CHANGED',409);
                // Always GET an existing provider reference: pending requests are never blindly POSTed again.
                $data=$this->request('GET','/v1/orders/'.rawurlencode($existing['provider_id']),null,$existing['request_id']);
                $remote=self::checkedStatus($data,$existing['provider_id'],$snapshot['amountKopecks'],$this->config['merchantId']);
                if($remote['status']==='PENDING'){
                    // Provider allows 15 extra minutes after opening the page. Expiry alone is NOT proof of failure.
                    if((int)$existing['expires']<=$now)self::fail('PAYMENT_LINK_EXPIRED',409);
                    $url=$this->paymentUrl($remote['url']);
                    $q=$this->db->prepare('UPDATE prom23_payments SET state=?,url=? WHERE scope=? AND provider_id=? AND state IN (?,?)');$q->execute(['ready',$url,$scope,$existing['provider_id'],'pending','ready']);
                    if($q->rowCount()!==1)self::fail('RESULT_RECONCILIATION_REQUIRED',409);
                    return $url;
                }
                if(!in_array($remote['status'],['FAILED','VOIDED'],true)||(int)$existing['attempt']>=5)self::fail('PAYMENT_NOT_AVAILABLE',409);
                // A new attempt is allowed only after a terminal PSP status, keeping the same Sale payment.
                $attempt=(int)$existing['attempt']+1;$body['orderId'].='-r'.$attempt;$requestId=bin2hex(random_bytes(16));
                $this->db->exec('BEGIN IMMEDIATE');$active=true;
                $q=$this->db->prepare('UPDATE prom23_payments SET provider_id=?,state=?,url=?,expires=?,request_id=?,created=?,attempt=? WHERE scope=? AND provider_id=? AND state IN (?,?)');
                $q->execute([$body['orderId'],'pending','',$now+300,$requestId,$now,$attempt,$scope,$existing['provider_id'],'pending','ready']);
                if($q->rowCount()!==1)self::fail('RESULT_RECONCILIATION_REQUIRED',409);
                $this->db->prepare('UPDATE prom23_payment_attempts SET status=? WHERE provider_id=?')->execute([$remote['status'],$existing['provider_id']]);
                $this->db->prepare('INSERT INTO prom23_payment_attempts VALUES(?,?,?,?)')->execute([$body['orderId'],$scope,'pending',$now]);
                $this->db->exec('COMMIT');$active=false;
            }else{
                if((int)$this->db->query('SELECT COUNT(*) FROM prom23_payments')->fetchColumn()>=10000)self::fail('RATE_LIMITED',429);
                $requestId=bin2hex(random_bytes(16));
                $this->db->prepare('INSERT INTO prom23_payments VALUES(?,?,?,?,?,?,?,?,?,?)')->execute([$scope,$body['orderId'],$owner,$fingerprint,'pending','',$now+300,$requestId,$now,0]);
                $this->db->prepare('INSERT INTO prom23_payment_attempts VALUES(?,?,?,?)')->execute([$body['orderId'],$scope,'pending',$now]);
                $this->db->exec('COMMIT');$active=false;
            }
        }catch(\Throwable $e){if($active)$this->db->exec('ROLLBACK');throw $e;}
        // The durable pending row precedes the first possible PSP write; an uncertain result keeps that row.
        $data=$this->request('POST','/v1/orders',$body,$requestId);
        $url=$this->paymentUrl($data['paymentUrl']??'');
        $q=$this->db->prepare('UPDATE prom23_payments SET state=?,url=? WHERE scope=? AND provider_id=? AND state=?');$q->execute(['ready',$url,$scope,$body['orderId'],'pending']);
        if($q->rowCount()!==1)self::fail('RESULT_RECONCILIATION_REQUIRED',409);
        return $url;
    }

    public function createBody(array $snapshot):array
    {
        foreach(['orderId','paymentId']as$k)if(!preg_match('/^[1-9][0-9]{0,15}$/D',$snapshot[$k]??''))self::fail('ORDER_NOT_FOUND',404);
        if(!is_int($snapshot['amountKopecks']??null)||$snapshot['amountKopecks']<1||!is_array($snapshot['cart']['items']??null))self::fail('PAYMENT_ITEMS_INVALID');
        $prefix=$this->config['orderPrefix']??'';if(!preg_match('/^[A-Za-z0-9_-]{3,40}$/D',$prefix))self::fail('PAYMENT_CONFIG_REQUIRED');
        $items=[];$seen=[];$sum=0;
        foreach($snapshot['cart']['items']as$item){
            $id=self::text($item['productId']??'',100);$q=$item['quantity']['count']??'';
            if(isset($seen[$id])||!preg_match('/^(?:[1-9][0-9]{0,15}|delivery)$/D',$id)||!is_string($q)||!preg_match('/^[1-9][0-9]{0,2}$/D',$q))self::fail('PAYMENT_ITEMS_INVALID');
            $seen[$id]=true;$amount=self::decimalMoney($item['total']??'');$sum+=$amount;
            $items[]=['productId'=>$id,'title'=>self::text($item['title']??'',500),'quantity'=>['count'=>$q],'total'=>self::decimal($amount)];
        }
        if(!$items||count($items)>501||$sum!==$snapshot['amountKopecks']||($snapshot['cart']['total']['amount']??'')!==self::decimal($sum))self::fail('PAYMENT_AMOUNT_MISMATCH',409);
        $redirects=$this->config['redirectUrls']??[];
        if(array_diff(array_keys($redirects),['onSuccess','onAbort','onError']))self::fail('PAYMENT_CONFIG_REQUIRED');
        foreach(['onSuccess','onAbort','onError']as$k)self::httpsUrl($redirects[$k]??'',$this->config['returnAllowedHosts']??[]);
        return ['orderId'=>$prefix.'-'.$snapshot['orderId'].'-'.$snapshot['paymentId'],'currencyCode'=>'RUB','availablePaymentMethods'=>['SPLIT'],'preferredPaymentMethod'=>'SPLIT','orderSource'=>'APP','cart'=>['items'=>$items,'total'=>['amount'=>self::decimal($sum)]],'redirectUrls'=>$redirects,'ttl'=>300];
    }

    /** Read-only authenticated provider status. A browser redirect is never payment confirmation. */
    public function status($order,$payment,array $actor):array
    {
        $this->ready();ServiceDriver::ownedOrder($order,$actor);
        $matches=0;foreach($order->getPaymentCollection()as$p)if((int)$p->getId()===(int)$payment->getId())$matches++;
        if($matches!==1||(int)$payment->getPaymentSystemId()!==14||$payment->isInner())self::fail('PAYMENT_NOT_AVAILABLE',409);
        $body=$this->createBody(self::saleSnapshot($order,$payment));$scope=hash('sha256',$this->environment().'|'.$body['orderId']);
        $q=$this->db->prepare('SELECT * FROM prom23_payments WHERE scope=?');$q->execute([$scope]);$row=$q->fetch(\PDO::FETCH_ASSOC);
        if(!$row||!hash_equals($row['owner'],self::owner($actor))||!hash_equals($row['fingerprint'],hash('sha256',json_encode($body,JSON_THROW_ON_ERROR))))self::fail('PAYMENT_CHANGED',409);
        $data=$this->request('GET','/v1/orders/'.rawurlencode($row['provider_id']),null,$row['request_id']);
        $status=self::checkedStatus($data,$row['provider_id'],self::money($payment->getSum()),$this->config['merchantId']);
        return ['status'=>$status['status'],'sourceOrderId'=>(string)$order->getId(),'sourcePaymentId'=>(string)$payment->getId()];
    }

    /** Optional configured reconciliation; uses Sale events once, never direct CRM or browser success params. */
    public function reconcile($order,$payment,array $actor):array
    {
        if(($this->config['reconcileEnabled']??false)!==true)self::fail('PAYMENT_RECONCILIATION_DISABLED');
        $status=$this->status($order,$payment,$actor);
        if($status['status']==='CAPTURED'&&!$payment->isPaid()){
            $before=self::saleSnapshot($order,$payment);
            $fresh=\Bitrix\Sale\Order::load((int)$order->getId());if(!$fresh)self::fail('ORDER_NOT_FOUND',404);
            ServiceDriver::ownedOrder($fresh,$actor);$pay=null;foreach($fresh->getPaymentCollection()as$p)if((int)$p->getId()===(int)$payment->getId())$pay=$p;
            if(!$pay||$fresh->isCanceled()||self::saleSnapshot($fresh,$pay)!==$before)self::fail('RESULT_RECONCILIATION_REQUIRED',409);
            if($pay->isPaid())return$status;
            $providerId=$this->createBody($before)['orderId'];$scope=hash('sha256',$this->environment().'|'.$providerId);
            // Durable claim prevents duplicate Sale saves across concurrent status refreshes/crash retries.
            $q=$this->db->prepare('UPDATE prom23_payments SET state=? WHERE scope=? AND state IN (?,?)');$q->execute(['sync-pending',$scope,'pending','ready']);
            if($q->rowCount()!==1)self::fail('RESULT_RECONCILIATION_REQUIRED',409);
            self::checkedResult($pay->setPaid('Y'));self::checkedResult($fresh->save());
            $this->db->prepare('UPDATE prom23_payments SET state=? WHERE scope=?')->execute(['paid',$scope]);
        }
        return $status;
    }

    public static function checkedStatus(array $data,string $orderId,int $amount,string $merchantId):array
    {
        $o=$data['order']??null;
        if(!is_array($o)||($o['orderId']??'')!==$orderId||($o['merchantId']??'')!==$merchantId||($o['currencyCode']??'')!=='RUB'||self::decimalMoney($o['orderAmount']??'')!==$amount||!in_array($o['paymentStatus']??'', ['PENDING','AUTHORIZED','CAPTURED','VOIDED','REFUNDED','CONFIRMED','PARTIALLY_REFUNDED','FAILED'],true))self::fail('PAYMENT_PROVIDER_RESPONSE_INVALID');
        return ['status'=>$o['paymentStatus'],'url'=>$o['paymentUrl']??''];
    }

    private function ready():void
    {
        if(($this->config['enabled']??false)!==true||!$this->db||!preg_match('/^[a-f0-9-]{36}$/Di',$this->config['merchantId']??''))self::fail('PAYMENT_CONFIG_REQUIRED');
        // This direct link integration must use a reviewed merchant-side receipt workflow, not silently bypass it.
        if(($this->config['merchantReceiptsConfirmed']??false)!==true)self::fail('PAYMENT_RECEIPT_INTEGRATION_REQUIRED');
        $this->environment();$this->credential();
    }
    private function environment():string
    {
        $value=$this->config['environment']??'';
        if(!in_array($value,['sandbox','production'],true))self::fail('PAYMENT_CONFIG_REQUIRED');
        return $value;
    }
    private function credential():string
    {
        $path=$this->config['apiKeyFile']??'';
        if(!is_string($path)||$path===''||is_link($path)||!is_file($path)||(fileperms($path)&0077))self::fail('PAYMENT_CONFIG_REQUIRED');
        $v=trim((string)file_get_contents($path));if(!preg_match('/^[A-Za-z0-9._-]{16,4096}$/D',$v))self::fail('PAYMENT_CONFIG_REQUIRED');return$v;
    }
    private function request(string $method,string $path,?array $body,string $id):array
    {
        if(!(($method==='POST'&&$path==='/v1/orders')||($method==='GET'&&preg_match('~^/v1/orders/[A-Za-z0-9_-]{1,100}$~D',$path))))self::fail('PAYMENT_PATH_INVALID');
        $url=($this->environment()==='sandbox'?'https://sandbox.pay.yandex.ru':'https://pay.yandex.ru').'/api/merchant'.$path;
        $headers=['Accept: application/json','Content-Type: application/json','Authorization: Api-Key '.$this->credential(),'X-Request-Id: '.$id,'X-Request-Timeout: 10000','X-Request-Attempt: 0'];
        if($this->http){$response=($this->http)($method,$url,$headers,$body);}
        else{
            if(!function_exists('curl_init'))self::fail('PAYMENT_CONFIG_REQUIRED');
            $ch=curl_init($url);$raw='';
            curl_setopt_array($ch,[CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_HTTPHEADER=>$headers,CURLOPT_CONNECTTIMEOUT=>3,CURLOPT_TIMEOUT=>12,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2,CURLOPT_PROTOCOLS=>CURLPROTO_HTTPS,CURLOPT_WRITEFUNCTION=>static function($c,string $chunk)use(&$raw):int{if(strlen($raw)+strlen($chunk)>1048576)return 0;$raw.=$chunk;return strlen($chunk);}]);
            if($body!==null)curl_setopt($ch,CURLOPT_POSTFIELDS,json_encode($body,JSON_THROW_ON_ERROR));
            $ok=curl_exec($ch);$code=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);curl_close($ch);
            if($ok===false)self::fail($method==='POST'?'RESULT_RECONCILIATION_REQUIRED':'PAYMENT_PROVIDER_UNAVAILABLE',409);
            $response=['status'=>$code,'body'=>$raw];
        }
        if(!is_array($response)||!is_int($response['status']??null)||!is_string($response['body']??null)||strlen($response['body'])>1048576)self::fail('PAYMENT_PROVIDER_RESPONSE_INVALID');
        if($response['status']!==200)self::fail($method==='POST'?'RESULT_RECONCILIATION_REQUIRED':'PAYMENT_PROVIDER_UNAVAILABLE',409);
        try{$v=json_decode($response['body'],true,32,JSON_THROW_ON_ERROR);}catch(\Throwable $e){self::fail('PAYMENT_PROVIDER_RESPONSE_INVALID');}
        if(!is_array($v)||($v['status']??'')!=='success'||($v['code']??null)!==200||!is_array($v['data']??null))self::fail('PAYMENT_PROVIDER_RESPONSE_INVALID');
        return $v['data'];
    }
    private function paymentUrl($url):string{return self::httpsUrl($url,$this->config['paymentAllowedHosts']??[]);}
    public static function httpsUrl($url,array $hosts):string
    {
        if(!is_string($url)||strlen($url)>2048||preg_match('/[\x00-\x20\\\\]/',$url))self::fail('PAYMENT_URL_INVALID');
        $u=parse_url($url);if(!$u||($u['scheme']??'')!=='https'||isset($u['user'])||isset($u['pass'])||(isset($u['port'])&&$u['port']!==443)||!in_array(strtolower($u['host']??''),$hosts,true))self::fail('PAYMENT_URL_INVALID');return$url;
    }
    private static function scope(array $p,array $a):void
    {
        if(!is_int($a['userId']??null)||$a['userId']<0||!preg_match('/^[a-f0-9]{64}$/D',$a['sessionKey']??'')||($p['sessionKey']??'')!==$a['sessionKey'])self::fail('AUTH_REQUIRED',401);
        $context=$p['context']??'';
        if($context==='personal'){if(!empty($a['organizationId']))self::fail('FORBIDDEN',403);}
        elseif(!preg_match('/^organization:([1-9][0-9]*)$/D',$context,$m)||$a['userId']<1||(int)$m[1]!==($a['organizationId']??0))self::fail('ORGANIZATION_REQUIRED',409);
        self::text($p['requestKey']??'',100000);
    }
    private static function owner(array $a):string
    {
        if(!is_int($a['userId']??null)||$a['userId']<1||!preg_match('/^[a-f0-9]{64}$/D',$a['sessionKey']??''))self::fail('AUTH_REQUIRED',401);
        return hash('sha256',$a['userId'].'|'.($a['organizationId']??0));
    }
    private static function checkedResult($r):void{if(!is_object($r)||!method_exists($r,'isSuccess')||!$r->isSuccess())self::fail('RESULT_RECONCILIATION_REQUIRED',409);}
    public static function decimalMoney($v):int{if(!is_string($v)||!preg_match('/^(0|[1-9][0-9]{0,10})(?:\.([0-9]{1,2}))?$/D',$v,$m))self::fail('PAYMENT_AMOUNT_INVALID');return (int)$m[1]*100+(int)str_pad($m[2]??'',2,'0');}
    private static function money($v):int{if(!is_numeric($v)||!is_finite((float)$v)||(float)$v<0||(float)$v>90000000000)self::fail('PAYMENT_AMOUNT_INVALID');return(int)round((float)$v*100);}
    private static function decimal(int $n):string{return intdiv($n,100).'.'.str_pad((string)($n%100),2,'0',STR_PAD_LEFT);}
    private static function text($s,int $max):string{if(!is_string($s)||trim($s)===''||strlen($s)>$max*4||preg_match('/[\x00-\x1f]/',$s))self::fail('PAYMENT_VALUE_INVALID');return trim(strip_tags($s));}
    private static function fail(string $code,int $status=503):never{throw new RuntimeExceptionCode($code,$status);}
}
