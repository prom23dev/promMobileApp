<?php
declare(strict_types=1);
/** Pure contract/security tests. No Bitrix bootstrap, account, DB or provider operation. */
require_once __DIR__.'/../src/Protocol.php';
require_once __DIR__.'/../src/ProcurementDriver.php';
use Prom23\Runtime\ProcurementDriver as Driver;
use Prom23\Runtime\RuntimeExceptionCode;
function formatPhoneNumber($value){return preg_replace('/\D/','',$value);}
$count=0;
function ok(bool$value,string$name):void{global$count;if(!$value)throw new RuntimeException('FAIL '.$name);$count++;echo'PASS '.$name."\n";}
function rejects(callable$fn,string$code,string$name):void{try{$fn();}catch(RuntimeExceptionCode$e){ok($e->getMessage()===$code,$name);return;}throw new RuntimeException('FAIL '.$name.' accepted');}
$forms=json_decode(file_get_contents(__DIR__.'/../form-contracts.json'),true,32,JSON_THROW_ON_ERROR)['forms'];
$actor=['userId'=>0,'organizationId'=>0,'sessionKey'=>str_repeat('a',64),'context'=>'business'];
$payload=['sessionKey'=>str_repeat('a',64),'context'=>'business','target'=>[],'formId'=>'procurement'];
$file=['name'=>'need.pdf','size'=>20,'uploadToken'=>str_repeat('b',48)];
$v=['first-name'=>'Имя','phone'=>'+79000000000','email'=>'contract@example.invalid','company-name'=>'Компания','inn'=>'1234567890','comment-text'=>'','mode'=>'list','files[]'=>[$file],'location'=>['settlementId'=>'7dfa745e-aa19-4688-b121-b655c11e482f','version'=>2]];
$consents=array_map(static fn($row)=>['name'=>$row['name'],'accepted'=>true,'documentIds'=>$row['documents']],$forms['procurement']['consents']);
ok($forms['procurement']['derived']===true&&$forms['procurement']['sourceBaseForm']==='quote','derived procurement retains original source form identity');
Driver::identity($payload,$actor);ok(true,'guest business request allowed without invented organization');
rejects(fn()=>Driver::identity(array_replace($payload,['context'=>'organization:7']),$actor),'FORBIDDEN','forged organization rejected');
rejects(fn()=>Driver::identity(array_replace($payload,['target'=>['userId'=>'7']]),$actor),'FORBIDDEN','injected target rejected');
rejects(fn()=>Driver::identity(array_replace($payload,['sessionKey'=>str_repeat('c',64)]),$actor),'AUTH_EXPIRED','session bound request');
ok(Driver::values($v)===$v,'file-first need retains exact contact/INN/mode/location/attachment');
foreach(['first-name','phone','email','company-name']as$field)rejects(fn()=>Driver::values(array_replace($v,[$field=>''])),'VALIDATION_ERROR','source required '.$field);
rejects(fn()=>Driver::values(array_replace($v,['files[]'=>[]])),'NEED_REQUIRED','missing file and comment rejected');
foreach([array_replace($file,['name'=>'../need.pdf']),array_replace($file,['name'=>'need.exe']),array_replace($file,['size'=>20971521]),array_replace($file,['uploadToken'=>'invalid']),$file+['uri'=>'file:///private']]as$bad)rejects(fn()=>Driver::values(array_replace($v,['files[]'=>[$bad]])),'UPLOAD_INVALID','unsafe/unverified file rejected');
rejects(fn()=>Driver::values(array_replace($v,['files[]'=>[$file,$file]])),'UPLOAD_INVALID','duplicate upload token rejected');
rejects(fn()=>Driver::values($v+['organizationId'=>7]),'VALIDATION_ERROR','no owner field injection');
rejects(fn()=>Driver::values(array_replace($v,['location'=>['name'=>'Свободный текст']])),'SETTLEMENT_REQUIRED','free text is not GAR');
Driver::consents($consents,$forms['procurement']['consents']);ok(true,'both exact source consents');
foreach([[],array_slice($consents,0,1),array_merge($consents,[$consents[0]]),array_map(static fn($r)=>array_replace($r,['documentIds'=>['fake']]),$consents)]as$bad)rejects(fn()=>Driver::consents($bad,$forms['procurement']['consents']),'CONSENT_REQUIRED','missing/extra/wrong consent rejected');
$saved=[['id'=>21,'name'=>'need.pdf','size'=>20,'sha256'=>str_repeat('e',64)]];
$comment=Driver::comment($v,['name'=>'Проверенное имя ГАР'],$actor,$saved);
foreach(['need.pdf','20 байт','Bitrix №21',$v['inn'],$v['location']['settlementId'],'Версия выбора: 2','Есть список','Режим покупок: business']as$part)ok(str_contains($comment,$part),'manifest retains '.$part);
$lead=Driver::leadFields($v,$comment,'Проверенное имя ГАР',[['name'=>'need.pdf','base64'=>'JVBERi0=']],'business-91');
ok($lead['UF_CRM_1776267208372']===$v['company-name']&&$lead['UF_CRM_1776267008813']==='Проверенное имя ГАР','exact source business CRM mapping');
ok($lead['UF_CRM_1776267327660']===[['fileData'=>['need.pdf','JVBERi0=']]]&&$lead['__HAS_FILES']===true,'source common lead file field preserves attachment bytes');
ok($lead['COMMENTS']===$comment&&$lead['ORIGIN_ID']==='business-91','actual HL reference and complete need in single lead');
$config=['crmWebhookUrl'=>'https://portal.example.invalid/rest/1/fixture-token/','allowedCrmHosts'=>['portal.example.invalid']];
ok(Driver::crmEndpoint($config)==='https://portal.example.invalid/rest/1/fixture-token/crm.lead.add.json','same CRM method with exact server allowlist');
foreach(['http://portal.example.invalid/rest/1/fixture-token/','https://wrong.example.invalid/rest/1/fixture-token/','https://user:secret@portal.example.invalid/rest/1/fixture-token/','https://portal.example.invalid:444/rest/1/fixture-token/','https://portal.example.invalid/rest/1/fixture-token/?a=1','https://portal.example.invalid/rest/1/fixture-token/#fragment']as$url)rejects(fn()=>Driver::crmEndpoint(array_replace($config,['crmWebhookUrl'=>$url])),'CRM_CONFIGURATION_REQUIRED','unsafe CRM endpoint rejected');
$driver=new Driver(['formContracts'=>$forms,'legalVersions'=>[]]);$ctx=$driver->run('forms.context',$payload,$actor);
ok($ctx['formId']==='procurement'&&preg_match('/^[a-f0-9]{64}$/D',$ctx['revision'])===1,'typed revision before upload');
rejects(fn()=>$driver->run('procurement.submit',$payload+['revision'=>$ctx['revision'],'values'=>$v,'consents'=>$consents],$actor),'INTEGRATION_UNAVAILABLE','disabled configuration cannot create source data');
echo "SKIP live CFile/HL persistence, SQLite durable pending, source mail queue and CRM acknowledgement: requires connected isolated Bitrix runtime; no real provider calls\n";
echo'TOTAL '.$count." PASS (pure contracts/security only)\n";
