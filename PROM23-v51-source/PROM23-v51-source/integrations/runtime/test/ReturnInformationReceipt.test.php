<?php
require_once __DIR__.'/../src/Protocol.php';
require_once __DIR__.'/../src/ReturnInformationReceipt.php';
use Prom23\Runtime\{ReturnInformationReceipt,RuntimeExceptionCode};
if(!in_array('sqlite',PDO::getAvailableDrivers(),true)){fwrite(STDERR,"SKIP: PDO SQLite required for receipt test; no server extension installed\n");exit(77);}
$db=new PDO('sqlite::memory:');$r=new ReturnInformationReceipt($db);
$e=['eventId'=>'fixture-event','orderId'=>2,'sellerId'=>'fixture-seller','version'=>'2026-09-14','sha256'=>str_repeat('a',64),'channel'=>'handover-paper','providedAt'=>'2026-09-14T12:00:00+03:00','evidenceId'=>'fixture-signed-act'];
$r->recordProvided($e);$r->recordProvided($e);
if($db->query('SELECT count(*) FROM prom23_return_information')->fetchColumn()!=1)throw new Exception('duplicate evidence');
try{$r->recordProvided([...$e,'orderId'=>3]);throw new Exception('must reject evidence rewrite');}catch(RuntimeExceptionCode $x){if($x->getMessage()!=='IDEMPOTENCY_CONFLICT')throw $x;}
try{$r->recordProvided([...$e,'channel'=>'page-view']);throw new Exception('must reject page view');}catch(RuntimeExceptionCode $x){if($x->getMessage()!=='VALIDATION_ERROR')throw $x;}
echo "3 handover evidence checks PASS; memory database, no notification sent\n";
