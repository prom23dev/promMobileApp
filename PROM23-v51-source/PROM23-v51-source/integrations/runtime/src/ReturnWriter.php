<?php
declare(strict_types=1);
namespace Prom23\Runtime;

/** Creates a claim, never authorizes a refund. Invoked only after owned-order,
 * context, quantity, consent, upload and idempotency checks in the runtime.
 * Keeps IBLOCK_ID_RETURNS / JSON_RETURNS compatibility with the supplied site.
 * A previous claim or elapsed days must not suppress a new claim.
 *
 * Field-for-field parity target: local/ajax/lk/returns-products/action-returns-product.php
 * (PROPERTY_VALUES USER_ID/ORGANIZATION_ID/ORDER_ID/STATUS/JSON_RETURNS, one
 * JSON_RETURNS row per item with GOOD/QUANTITY/COMMENT/REASONS/MEDIA). The
 * STATUS_ID===STATUS_ORDER_FINISH gate and the "one claim per order" removal
 * both live in the caller (ServiceDriver::context/id==='return' checks
 * STATUS_ORDER_FINISH before this class ever runs) — this class intentionally
 * has no status or duplicate-claim check of its own, matching
 * integrations/runtime/source-patches/returns-intake-2026.patch, which
 * deletes prod's old "Заявка на возврат этого заказа уже существует" block
 * and the 14-day disablement. Verified 2026-09-23 against the current prod
 * source: the patch's removed hunks still match action-returns-product.php
 * byte-for-byte, so it remains directly applicable, not stale. Requires
 * config['returns']['legacyTemplatesEscaped']=true (companion output-escaping
 * fix to the two returns-detail templates) before ServiceDriver will call
 * this — see RETURNS-2026.md. */
final class ReturnWriter {
    public function save(array $post,array $files,array $schema,array $actor): array {
        $saved=[];$created=false;
        try {
            $status=\CIBlockPropertyEnum::GetList([],['IBLOCK_ID'=>IBLOCK_ID_RETURNS,'CODE'=>'STATUS','XML_ID'=>'IN_WORK'])->Fetch();
            if(!$status)throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
            $items=[];$owned=array_column($schema['repeatedItems']['items'],null,'key');
            foreach($post as $name=>$productId){
                if(!preg_match('/^item-([1-9][0-9]*)-id$/D',$name,$m))continue;
                $prefix='item-'.$m[1];$row=$owned[(string)$productId]??null;
                if(!$row)throw new RuntimeExceptionCode('NOT_FOUND',404);
                $reasons=[];foreach($row['options']['reason'] as $i=>$reason)if(($post[$prefix.'-reason-'.($i+1)]??null)===$reason['value'])$reasons[]=['XML_ID'=>$reason['value'],'NAME'=>$reason['label']];
                $media=[];foreach($files as $field=>$file){
                    if(!str_starts_with($field,$prefix.'-photos['))continue;
                    $fileId=(int)\CFile::SaveFile([...$file,'MODULE_ID'=>'iblock'],'returns',true);
                    if(!$fileId)throw new RuntimeExceptionCode('UPLOAD_FAILED',503);
                    $saved[]=$fileId;$info=\CFile::GetFileArray($fileId);
                    if(!$info)throw new RuntimeExceptionCode('UPLOAD_FAILED',503);
                    $media[]=['FILE_ID'=>$fileId,'URL'=>$info['SRC'],'ORIGINAL_NAME'=>$file['name']];
                }
                $product=\CIBlockElement::GetList([],['ID'=>(int)$productId],false,['nTopCount'=>1],['ID','DETAIL_PAGE_URL','CODE','IBLOCK_SECTION_ID','IBLOCK_ID'])->GetNext();
                $items[]=json_encode(['GOOD'=>['ID'=>(int)$productId,'NAME'=>$row['label'],'DETAIL_PAGE_URL'=>(string)($product['DETAIL_PAGE_URL']??'')],
                    'QUANTITY'=>$post[$prefix.'-quantity'],'COMMENT'=>$post[$prefix.'-comment'],'REASONS'=>$reasons,'MEDIA'=>$media],JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR);
            }
            if(!$items)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            $entity=new \CIBlockElement();$id=$entity->Add(['IBLOCK_ID'=>IBLOCK_ID_RETURNS,'NAME'=>'Заявка на возврат','ACTIVE'=>'Y',
                'PROPERTY_VALUES'=>['USER_ID'=>$actor['userId'],'ORGANIZATION_ID'=>$actor['organizationId']?:false,
                    'ORDER_ID'=>$post['orderID'],'STATUS'=>(int)$status['ID'],'JSON_RETURNS'=>$items]]);
            if(!$id)throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
            $created=true;
            return ['status'=>'accepted','reference'=>'return-'.$id];
        } finally {
            if(!$created)foreach($saved as $fileId)\CFile::Delete($fileId);
        }
    }
}
