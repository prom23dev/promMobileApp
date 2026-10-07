<?php
declare(strict_types=1);
require_once __DIR__.'/../src/Protocol.php';require_once __DIR__.'/../src/CommerceLegal.php';
use Prom23\Runtime\CommerceLegal;
$snapshot='TEST DOCUMENT ONLY';$value=['seller'=>['id'=>'test','legalName'=>'TEST SELLER','inn'=>'1234567890','kpp'=>'123456789','ogrn'=>'1234567890123','legalAddress'=>'TEST ADDRESS','email'=>'seller@example.test','phone'=>'+70000000000'],'documentType'=>'offer','sellerInn'=>'1234567890','version'=>'test-1','snapshot'=>$snapshot,'hash'=>hash('sha256',$snapshot),'url'=>'/offer/'];
CommerceLegal::validate($value,false);if(isset(CommerceLegal::publicView($value)['snapshot']))throw new RuntimeException('Private snapshot leaked');
$count=2;foreach([['hash'=>'bad'],['sellerInn'=>'0000000000'],['seller'=>[]]]as$patch){try{CommerceLegal::validate(array_replace($value,$patch),false);throw new RuntimeException('Invalid accepted');}catch(Prom23\Runtime\RuntimeExceptionCode $e){$count++;}}
try{CommerceLegal::validate($value,true);throw new RuntimeException('Offer treated as B2B');}catch(Prom23\Runtime\RuntimeExceptionCode $e){$count++;}
CommerceLegal::validate(array_replace($value,['contractNumber'=>'TEST-1','contractStatus'=>'signed','supplierId'=>'test']),true);$count++;
echo "PASS $count seller, snapshot and separate B2B contract assertions\n";
