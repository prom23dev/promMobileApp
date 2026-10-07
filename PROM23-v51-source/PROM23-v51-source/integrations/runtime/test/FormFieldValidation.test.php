<?php
declare(strict_types=1);
require_once __DIR__.'/../src/Protocol.php';
require_once __DIR__.'/../src/FormsDriver.php';
use Prom23\Runtime\FormsDriver;
use Prom23\Runtime\RuntimeExceptionCode;
$contracts=json_decode(file_get_contents(__DIR__.'/../form-contracts.json'),true,512,JSON_THROW_ON_ERROR)['forms'];
$count=0;
function check(bool$ok,string$label):void {global$count;if(!$ok)throw new RuntimeException($label);$count++;}
function field(string$form,string$name):array {global$contracts;foreach($contracts[$form]['fields']as$f)if($f['name']===$name)return$f;throw new RuntimeException('missing field');}
function rejects(array$f,mixed$value):bool {try{FormsDriver::validateFieldValue($f,$value);return false;}catch(RuntimeExceptionCode$e){return true;}}
foreach([['buy-one-click','form_text_16'],['rent','form_text_23']]as[$id,$name]){
 $f=field($id,$name);foreach(['0','100','-1','1.5','1e2','999999999999999999']as$value)check(rejects($f,$value),$id.' invalid qty');
 foreach(['1','99']as$value){FormsDriver::validateFieldValue($f,$value);check(true,$id.' valid qty');}
}
foreach([['appeal',2000],['appeal-order',500]]as[$id,$bytes]){
 $f=field($id,'comment');$fit=str_repeat('я',intdiv($bytes,2));FormsDriver::validateFieldValue($f,$fit);check(true,'Cyrillic exact byte limit');check(rejects($f,$fit.'я'),'Cyrillic overflow');
 check(rejects($f,str_repeat('🙂',intdiv($bytes,4)+1)),'four-byte overflow');
}
$f=field('supplier','attachment');$file=['name'=>'terms.pdf','size'=>100,'uploadToken'=>str_repeat('a',48)];FormsDriver::validateFieldValue($f,[$file]);check(true,'supplier valid');
check(rejects($f,[$file,$file]),'supplier multiple');check(rejects($f,[array_replace($file,['name'=>'photo.jpg'])]),'supplier wrong extension');check(rejects($f,[array_replace($file,['size'=>20971521])]),'supplier oversize');
$review=field('review','media[]');check(in_array('mp4',$review['acceptedExtensions'],true),'ordinary review source video');check(!in_array('avi',$review['acceptedExtensions'],true),'ordinary review no invented format');
foreach(['order-review','review-edit']as$id)check(!in_array('mp4',field($id,'media[]')['acceptedExtensions'],true),'source image-only handler');
foreach(['question','question-edit']as$id){
 $f=field($id,'question-text');foreach(['','    ','тест','  тест  ','🙂🙂🙂']as$value)check(rejects($f,$value),'short Unicode question');
 foreach(['Какая','  Какая  ','🙂🙂🙂🙂🙂']as$value){FormsDriver::validateFieldValue($f,$value);check(true,'five Unicode characters');}
}
check(!isset(field('question-reply','question-text')['minLength']),'reply unchanged');
echo 'FormFieldValidation '.$count.'/'.$count." PASS (isolated constraints; no Bitrix/provider writes)\n";
