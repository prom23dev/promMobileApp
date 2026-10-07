<?php
declare(strict_types=1);
namespace Prom23\Runtime;
/** Call from the trusted handover/notification delivery callback, not page views
 * or checkout submission. This records evidence; it does not send a document. */
final class ReturnInformationReceipt {
    public function __construct(private \PDO $db) {
        $db->exec('CREATE TABLE IF NOT EXISTS prom23_return_information(event_id TEXT PRIMARY KEY,order_id INTEGER NOT NULL,seller_id TEXT NOT NULL,version TEXT NOT NULL,content_sha256 TEXT NOT NULL,channel TEXT NOT NULL,provided_at TEXT NOT NULL,evidence_id TEXT NOT NULL)');
    }
    public function recordProvided(array $event): void {
        foreach(['eventId','sellerId','version','sha256','channel','providedAt','evidenceId'] as $key)if(!is_string($event[$key]??null)||trim($event[$key])===''||strlen($event[$key])>200)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        if(!is_int($event['orderId']??null)||$event['orderId']<1||!preg_match('/^[a-f0-9]{64}$/D',$event['sha256'])||!in_array($event['channel'],['handover-paper','handover-electronic','delivery-confirmed-email'],true)||strtotime($event['providedAt'])===false)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        $data=[$event['eventId'],$event['orderId'],$event['sellerId'],$event['version'],$event['sha256'],$event['channel'],$event['providedAt'],$event['evidenceId']];
        $read=$this->db->prepare('SELECT * FROM prom23_return_information WHERE event_id=?');$read->execute([$event['eventId']]);$old=$read->fetch(\PDO::FETCH_NUM);
        if($old){if(array_map('strval',$old)!==array_map('strval',$data))throw new RuntimeExceptionCode('IDEMPOTENCY_CONFLICT',409);return;}
        $this->db->prepare('INSERT INTO prom23_return_information VALUES(?,?,?,?,?,?,?,?)')->execute($data);
    }
}
