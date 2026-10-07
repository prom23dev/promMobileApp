<?php
declare(strict_types=1);
namespace Prom23\Runtime;

/** Durable acknowledgement of the exact source handler; never a CRM delivery receipt. */
final class SubmissionReceipt {
    public function __construct(private array $config) {}
    public function record(array $payload,array $actor,string $acknowledgement,?int $entityId=null): array {
        $request=$this->config['request'];$key=$request['idempotencyKey']??'';
        if(!$key||!in_array($acknowledgement,['source-status-ok','source-publication-reply','source-popup','source-membership','source-membership-removed','source-rating','source-recovery-accepted'],true))throw new RuntimeExceptionCode('RESULT_RECONCILIATION_REQUIRED',409);
        $scope=hash('sha256',$actor['sessionKey']."\n".$request['operation']."\n".$key);
        $reference='receipt-'.substr(hash_hmac('sha256',$scope,$this->config['key']),0,48);
        $db=$this->config['pdo'];$db->exec('CREATE TABLE IF NOT EXISTS prom23_submission_receipts(reference TEXT PRIMARY KEY,scope TEXT UNIQUE,form_id TEXT,actor_hash TEXT,context TEXT,acknowledgement TEXT,entity_id INTEGER,created INTEGER)');
        $actorHash=hash('sha256',(string)$actor['userId'].':'.(string)$actor['organizationId']);
        $db->prepare('INSERT OR IGNORE INTO prom23_submission_receipts VALUES(?,?,?,?,?,?,?,?)')->execute([$reference,$scope,$payload['formId']??'',$actorHash,$actor['context'],$acknowledgement,$entityId,time()]);
        return ['status'=>'accepted','reference'=>$reference];
    }
}
