<?php
declare(strict_types=1);
namespace Prom23\Runtime;
/** The operator maps the actual seller and signed B2B contract; never infer them from a city. */
final class CommerceLegal {
 public static function validate(array $value, bool $business): array {
  $seller=$value['seller']??[];
  foreach(['id','legalName','inn','ogrn','legalAddress','email','phone'] as $key)if(!is_string($seller[$key]??null)||trim($seller[$key])===''||strlen($seller[$key])>2000)throw new RuntimeExceptionCode('SELLER_REQUIRED',409);
  if(!preg_match('/^\d{10}(?:\d{2})?$/D',$seller['inn'])||!preg_match('/^\d{13}(?:\d{2})?$/D',$seller['ogrn'])||!filter_var($seller['email'],FILTER_VALIDATE_EMAIL))throw new RuntimeExceptionCode('SELLER_REQUIRED',409);
  if(strlen($seller['inn'])===10&&!preg_match('/^\d{9}$/D',$seller['kpp']??''))throw new RuntimeExceptionCode('SELLER_REQUIRED',409);
  foreach(['version','hash','snapshot','url'] as $key)if(!is_string($value[$key]??null)||$value[$key]==='')throw new RuntimeExceptionCode('LEGAL_VERSION_REQUIRED',409);
  if(!hash_equals(hash('sha256',$value['snapshot']),$value['hash']))throw new RuntimeExceptionCode('LEGAL_VERSION_REQUIRED',409);
  if($business){if(empty($value['contractNumber'])||($value['contractStatus']??'')!=='signed'||($value['supplierId']??null)!==$seller['id'])throw new RuntimeExceptionCode('B2B_CONTRACT_REQUIRED',409);}
  elseif(($value['documentType']??'')!=='offer'||($value['sellerInn']??null)!==$seller['inn'])throw new RuntimeExceptionCode('SELLER_MISMATCH',409);
  return $value;
 }
 public static function resolve(array $config,array $p,array $actor,array $region):array {
  $resolver=$config['legalContextResolver']??null;if(!is_callable($resolver))throw new RuntimeExceptionCode('SELLER_REQUIRED',409);
  return self::validate($resolver($p,$actor,$region),$p['context']!=='personal');
 }
 public static function publicView(array $value):array { $result=$value;unset($result['snapshot']);return$result; }
 public static function record(\PDO $db,string $orderId,array $value,array $actor):void {
  $db->exec('CREATE TABLE IF NOT EXISTS commerce_legal_receipts(order_id TEXT PRIMARY KEY, seller_id TEXT NOT NULL, version TEXT NOT NULL, content_hash TEXT NOT NULL, snapshot TEXT NOT NULL, evidence TEXT NOT NULL, created_at TEXT NOT NULL)');
  $db->prepare('INSERT INTO commerce_legal_receipts VALUES(?,?,?,?,?,?,?)')->execute([$orderId,$value['seller']['id'],$value['version'],$value['hash'],$value['snapshot'],json_encode(['legal'=>$value,'actor'=>['userId'=>$actor['userId'],'organizationId'=>$actor['organizationId'],'session'=>hash('sha256',$actor['sessionKey'])]],JSON_THROW_ON_ERROR),gmdate('c')]);
 }
}
