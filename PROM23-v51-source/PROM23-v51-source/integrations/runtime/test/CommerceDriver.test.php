<?php
declare(strict_types=1);
/** Pure adapter policy tests: deliberately no Bitrix bootstrap, external calls or real orders. */
require_once __DIR__.'/../src/Protocol.php';
require_once __DIR__.'/../src/CommerceDriver.php';
use Prom23\Runtime\CommerceDriver as Driver;
use Prom23\Runtime\RuntimeExceptionCode;
$count=0;
function ok(bool $v,string $name):void{global$count;if(!$v)throw new RuntimeException('FAIL '.$name);$count++;echo 'PASS '.$name."\n";}
function rejects(callable $fn,string $code,string $name):void{try{$fn();}catch(RuntimeExceptionCode$e){ok($e->getMessage()===$code,$name.' ['.$e->getMessage().']');return;}throw new RuntimeException('FAIL '.$name.' accepted');}
$base=['context'=>'personal','organizationId'=>null,'sessionKey'=>str_repeat('a',64),'cart'=>[['productId'=>'prom-2414','quantity'=>2]],'settlementId'=>'7dfa745e-aa19-4688-b121-b655c11e482f','locationVersion'=>1,'contextKey'=>str_repeat('b',64),'delivery'=>'pickup','payment'=>'online','pickupId'=>'delivery-3-store-2'];
$actor=['userId'=>11,'organizationId'=>0,'sessionKey'=>str_repeat('a',64)];
$normalized=Driver::scope($base);
ok($normalized['cart']===$base['cart']&&$normalized['pickupId']===$base['pickupId'],'normalize preserves exact cart and option identity');
foreach([0,-1,1000,1.5,'2'] as$q)rejects(fn()=>Driver::scope(array_replace($base,['cart'=>[['productId'=>'prom-2414','quantity'=>$q]]])),'INVALID_CART','invalid quantity '.json_encode($q));
rejects(fn()=>Driver::scope(array_replace($base,['cart'=>[]])),'EMPTY_CART','empty cart');
rejects(fn()=>Driver::scope(array_replace($base,['cart'=>array_fill(0,501,$base['cart'][0])])),'EMPTY_CART','bounded cart');
rejects(fn()=>Driver::scope(array_replace($base,['cart'=>[$base['cart'][0],$base['cart'][0]]])),'INVALID_CART','duplicate product rejected');
rejects(fn()=>Driver::scope(array_replace($base,['settlementId'=>'Краснодар'])),'SETTLEMENT_REQUIRED','free-text is not GAR');
rejects(fn()=>Driver::scope(array_replace($base,['locationVersion'=>0])),'SETTLEMENT_REQUIRED','version required');
rejects(fn()=>Driver::scope(array_replace($base,['contextKey'=>'client-total'])),'INVALID_CONTEXT','context fingerprint required');
rejects(fn()=>Driver::scope(array_replace($base,['payment'=>'cash-unlisted'])),'INVALID_PAYMENT','unlisted payment');
rejects(fn()=>Driver::scope(array_replace($base,['delivery'=>'teleport'])),'INVALID_DELIVERY','unlisted delivery');
rejects(fn()=>Driver::scope(array_replace($base,['address'=>"street\nforged"])), 'INVALID_FIELD','address controls rejected');
$details=Driver::scope(array_replace($base,['delivery'=>'courier','address'=>'Улица 1','pod'=>'2','etag'=>'3','office'=>'4','comment'=>'Позвонить у ворот']));
ok($details['pod']==='2'&&$details['etag']==='3'&&$details['office']==='4'&&$details['comment']==='Позвонить у ворот','source address details preserved');
ok(Driver::money('123.45')===12345&&Driver::money('0.005')===1,'kopeck rounding at boundary');
foreach([-1,'nan',INF,90000000001]as$value)rejects(fn()=>Driver::money($value),'INVALID_MONEY','invalid money');
$consents=array_map(static fn($c)=>['name'=>$c['name'],'documentIds'=>$c['documents'],'accepted'=>true],json_decode(file_get_contents(__DIR__.'/../form-contracts.json'),true)['forms']['checkout']['consents']);
Driver::consents($consents);ok(true,'three independent checkout choices');
$business=array_values(array_filter($consents,static fn($c)=>!in_array('offer',$c['documentIds'],true)));Driver::consents($business,true);ok(true,'B2B keeps individual contract instead of consumer offer');
foreach([null,[],[$consents[0],$consents[0]],array_map(static fn($c)=>array_replace($c,['documentIds'=>['wrong']]),$consents),array_map(static fn($c)=>array_replace($c,['accepted'=>false]),$consents)]as$value)rejects(fn()=>Driver::consents($value),'CONSENT_REQUIRED','missing/forged/duplicate consent');
Driver::paymentUrl('https://pay.yandex.ru/payment/opaque?token=placeholder',['pay.yandex.ru']);ok(true,'exact HTTPS payment host');
foreach(['http://pay.yandex.ru/','https://pay.yandex.ru.evil.test/','https://pay.yandex.ru@evil.test/','https://user@pay.yandex.ru/','https://pay.yandex.ru:444/','javascript:alert(1)',"https://pay.yandex.ru/\nnext"]as$url)rejects(fn()=>Driver::paymentUrl($url,['pay.yandex.ru']),'PAYMENT_URL_INVALID','reject unsafe handoff');
$driver=new Driver();
rejects(fn()=>$driver->run('cart.quote',$base,array_replace($actor,['userId'=>0])),'AUTH_REQUIRED','no fabricated guest Bitrix user');
rejects(fn()=>$driver->run('cart.quote',$base,array_replace($actor,['sessionKey'=>str_repeat('c',64)])),'AUTH_REQUIRED','session bound actor');
rejects(fn()=>$driver->run('cart.quote',array_replace($base,['context'=>'organization:9','organizationId'=>9]),$actor),'FORBIDDEN','forged organization');
rejects(fn()=>$driver->run('cart.quote',array_replace($base,['context'=>'personal','organizationId'=>9]),$actor),'FORBIDDEN','personal cannot inject organization');
rejects(fn()=>$driver->run('cart.quote',array_replace($base,['context'=>'business']),$actor),'ORGANIZATION_REQUIRED','business draft is not real company');
rejects(fn()=>$driver->run('unknown',$base,$actor),'OPERATION_UNSUPPORTED','strict operation allowlist');
rejects(fn()=>$driver->run('cart.quote',$base,$actor),'BITRIX_MODULE_UNAVAILABLE','no runtime never returns fake quote');
rejects(fn()=>$driver->run('commerce.offer',$base,array_replace($actor,['userId'=>0])),'BITRIX_MODULE_UNAVAILABLE','public offers allow isolated guest actor but still require real runtime');
// SQLite available in target PHP; test quote identity/TTL without real products or DB.
if(in_array('sqlite',PDO::getAvailableDrivers(),true)){
 $pdo=new PDO('sqlite::memory:');$d=new Driver(['pdo'=>$pdo]);$store=new ReflectionMethod(Driver::class,'storeQuote');
 $q=['id'=>'local-policy-only','expiresAt'=>gmdate('c',time()+100),'items'=>[]];$store->invoke($d,$q,$normalized,$actor);
 $row=$pdo->query('SELECT * FROM commerce_quotes')->fetch(PDO::FETCH_ASSOC);
 ok($row['state']==='fresh'&&strlen($row['actor'])===64&&strlen($row['scope'])===64,'quote scope persisted as hashes');
 ok(!str_contains(json_encode($row),'Позвонить')&&!str_contains(json_encode($row),'Улица'),'quote table does not retain address/contact');
 $expired=['id'=>'expired-local-policy','expiresAt'=>gmdate('c',time()-1),'items'=>[]];$store->invoke($d,$expired,$normalized,$actor);$store->invoke($d,['id'=>'next-local-policy','expiresAt'=>gmdate('c',time()+100)],$normalized,$actor);
 ok((int)$pdo->query("SELECT count(*) FROM commerce_quotes WHERE id='expired-local-policy'")->fetchColumn()===0,'expired fresh quotes purged');
} else { echo "SKIP 3 SQLite quote-store policy assertions: pdo_sqlite unavailable; no extension installed\n"; }
echo 'TOTAL '.$count." PASS (policy only; Bitrix/provider integration unverified)\n";
