<?php
declare(strict_types=1);
require_once __DIR__.'/../src/Protocol.php';
require_once __DIR__.'/../src/ConsentLedger.php';
use Prom23\Runtime\ConsentLedger;
if(!in_array('sqlite',PDO::getAvailableDrivers(),true)){echo "SKIP: pdo_sqlite unavailable\n";exit(0);}
$pdo=new PDO('sqlite::memory:');$versions=json_decode(file_get_contents(__DIR__.'/../legal-versions.json'),true,512,JSON_THROW_ON_ERROR);
$ledger=new ConsentLedger(['pdo'=>$pdo,'legalVersions'=>$versions,'request'=>['idempotencyKey'=>'legal41-policy-test']]);
$actor=['sessionKey'=>'isolated-test-session','userId'=>17,'organizationId'=>0];
$receipt=$ledger->record([['name'=>'agree_consent','accepted'=>true,'documentIds'=>['consent']],['name'=>'marketing','accepted'=>false,'documentIds'=>['advertising']]],$actor,'form:subscription');
$row=$pdo->query('SELECT * FROM prom23_consent_receipts')->fetch(PDO::FETCH_ASSOC);$documents=json_decode($row['documents'],true);
if(strlen($receipt)!==64||$documents[0]['version']!=='2026-10-01'||$documents[0]['sha256']!==$versions['consent']['sha256']||$documents[1]['accepted']!==false||$documents[1]['documentId']!=='advertising')throw new RuntimeException('Versioned separate consent receipt failed');
if($row['session_scope']===$actor['sessionKey']||$row['purpose']!=='form:subscription'||(int)$row['created']<=0)throw new RuntimeException('Scoped evidence failed');
echo "PASS: separate processing acceptance and marketing refusal, approved hashes/version, hashed actor, purpose and server timestamp\n";
