<?php
declare(strict_types=1);
namespace Prom\Model { class ConfirmationCodes {} }
namespace {
require_once __DIR__.'/../src/Protocol.php';require_once __DIR__.'/../src/Actor.php';require_once __DIR__.'/../src/AuthDriver.php';
use Prom23\Runtime\{Protocol,RuntimeExceptionCode,ChallengeVault};
$count=0;
function check(bool $ok,string $name):void{global $count;if(!$ok)throw new \RuntimeException('FAIL '.$name);$count++;}
function rejected(callable $fn,string $code):void{try{$fn();}catch(RuntimeExceptionCode $e){check($e->getMessage()===$code,'expected '.$code);return;}throw new \RuntimeException('not rejected '.$code);}
$key=str_repeat('b',64);$time=1800000000;$nonce=str_repeat('c',48);$path='/local/prom23-runtime/endpoint.php';
$value=['protocol'=>Protocol::VERSION,'requestId'=>$nonce,'operation'=>'buyer.organizations','payload'=>['sessionKey'=>str_repeat('a',64)]];
$body=json_encode($value,JSON_THROW_ON_ERROR);
$headers=['x-prom23-timestamp'=>(string)$time,'x-prom23-nonce'=>$nonce,'x-prom23-signature'=>hash_hmac('sha256',"POST\n{$path}\n{$time}\n{$nonce}\n".hash('sha256',$body),$key)];
check(Protocol::decode($body,$headers,$path,$key,$time)===$value,'valid protocol');
rejected(fn()=>Protocol::decode($body,$headers,$path,$key,$time+61),'FORBIDDEN');
rejected(fn()=>Protocol::decode($body,$headers,$path.'/wrong',$key,$time),'FORBIDDEN');
rejected(fn()=>Protocol::decode($body.' ',$headers,$path,$key,$time),'FORBIDDEN');
foreach(['actor','userId','permissions','authenticated']as$field){$bad=$value;$bad['payload'][$field]=1;$badBody=json_encode($bad,JSON_THROW_ON_ERROR);$badHeaders=$headers;$badHeaders['x-prom23-signature']=hash_hmac('sha256',"POST\n{$path}\n{$time}\n{$nonce}\n".hash('sha256',$badBody),$key);rejected(fn()=>Protocol::decode($badBody,$badHeaders,$path,$key,$time),'INVALID_BODY');}
$badHeaders=$headers;$badHeaders['idempotency-key']='unsigned-key';rejected(fn()=>Protocol::decode($body,$badHeaders,$path,$key,$time),'IDEMPOTENCY_CONFLICT');
Protocol::activeUser(['ACTIVE'=>'Y','UF_DELETE_ACCOUNT_BY_USER'=>false]);check(true,'active user');
foreach([true,1,'1','Y']as$flag)rejected(fn()=>Protocol::activeUser(['ACTIVE'=>'Y','UF_DELETE_ACCOUNT_BY_USER'=>$flag]),'AUTH_EXPIRED');
rejected(fn()=>Protocol::activeUser(['ACTIVE'=>'N','UF_DELETE_ACCOUNT_BY_USER'=>false]),'AUTH_EXPIRED');
rejected(fn()=>Protocol::activeUser(['ACTIVE'=>'Y']),'INTEGRATION_UNAVAILABLE');
$_SESSION=[];$vault=new ChallengeVault($key);$pending=['email'=>'fixture@example.test','password'=>'Fixture9Password','hash'=>'source-only-hash'];
$step=$vault->create('auth-register-phone',$pending,60);check($step['status']==='next-step','challenge response');
check(!str_contains(json_encode($step),'Fixture9Password'),'password absent response');
check(!str_contains(json_encode($_SESSION),'Fixture9Password'),'password encrypted at rest');
check(!str_contains(json_encode($_SESSION),'fixture@example.test'),'email encrypted at rest');
check($vault->read($step['challengeId'],'auth-register-phone')===$pending,'pending roundtrip');
rejected(fn()=>$vault->read($step['challengeId'],'auth-otp'),'CODE_EXPIRED');
$saved=$_SESSION;$_SESSION=[];rejected(fn()=>$vault->read($step['challengeId'],'auth-register-phone'),'CODE_EXPIRED');$_SESSION=$saved;
$vault->remove($step['challengeId']);rejected(fn()=>$vault->read($step['challengeId'],'auth-register-phone'),'CODE_EXPIRED');
for($i=0;$i<8;$i++)$vault->create('auth-email',['email'=>'fixture@example.test']);rejected(fn()=>$vault->create('auth-email',[]),'RATE_LIMITED');
echo $count." runtime policy checks PASS; fixture only, no Bitrix bootstrap/network/provider calls\n";
}
