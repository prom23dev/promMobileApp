<?php
declare(strict_types=1);
require_once __DIR__.'/../src/Protocol.php';
require_once __DIR__.'/../src/FormsDriver.php';
// Pure boundary test: capture the single ledger write without a DB or Bitrix.
final class ConsentStatementSpy {
    public function __construct(private ConsentDatabaseSpy $db) {}
    public function execute(array $params): bool { $this->db->writes[]=$params;return true; }
}
final class ConsentDatabaseSpy {
    public array $writes=[];
    public function exec(string $sql): int { return 0; }
    public function prepare(string $sql): ConsentStatementSpy { return new ConsentStatementSpy($this); }
}
$forms=json_decode(file_get_contents(__DIR__.'/../form-contracts.json'),true)['forms'];
$form=$forms['notification-preferences'];$db=new ConsentDatabaseSpy();$versions=[];
foreach(['consent','privacy','advertising'] as $id)$versions[$id]=['version'=>'UI-TEST','sha256'=>str_repeat('a',64)];
$payload=['context'=>'personal','values'=>['email_promotions'=>false,'sms_promotions'=>false], 'consents'=>array_map(static fn($c)=>['name'=>$c['name'],'accepted'=>true,'documentIds'=>$c['documents']],$form['consents'])];
$driver=new Prom23\Runtime\FormsDriver(['pdo'=>$db,'formContracts'=>$forms,'legalVersions'=>$versions,'request'=>['idempotencyKey'=>'ux45-pure-test','payload'=>$payload]]);
$method=new ReflectionMethod($driver,'consent');$method->invoke($driver,$form,$payload,['sessionKey'=>'pure-test','userId'=>0,'organizationId'=>0]);
if(count($db->writes)!==1)throw new RuntimeException('Choices must share one receipt, not collide on idempotency');
$docs=json_decode($db->writes[0][5],true);
if(array_column($docs,'documentId')!==['consent','privacy','advertising','advertising']||array_column($docs,'accepted')!==[true,true,false,false])throw new RuntimeException('Independent policy/processing and marketing refusals were not preserved');
echo "PASS independent processing, privacy and two marketing refusals retained in one idempotent receipt\n";
