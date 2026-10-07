<?php
declare(strict_types=1);
namespace Prom23\Runtime;
require_once __DIR__.'/WorkspaceDriver.php';

final class PublicationDriver {
    public const IDS=['review','question','order-review','review-edit','question-edit','review-delete','question-delete','review-reply','question-reply','product-notify'];
    public function __construct(private array $config) {}
    public static function authorizedRow(array $row,int $productId,array $actor,bool $owned): void {
        if(empty($row['UF_ACTIVE'])||(int)$row['UF_TARGET_ID']!==$productId||($owned&&((int)$row['UF_USER_ID']!==$actor['userId']||!$actor['userId']||(int)($row['UF_ORGANIZATION_ID']??0)!==$actor['organizationId'])))throw new RuntimeExceptionCode('NOT_FOUND',404);
    }
    private function context(array $p,array $a): array {
        $id=$p['formId'];$kind=str_starts_with($id,'question')?'question':'review';$productId=WorkspaceDriver::product($p['target']['productId']??'');$data=['formId'=>$id,'initialValues'=>[]];$row=null;$parentId=null;
        if($id==='order-review'){
            $order=\Bitrix\Sale\Order::load((int)($p['target']['orderId']??0));if(!$order)throw new RuntimeExceptionCode('NOT_FOUND',404);ServiceDriver::ownedOrder($order,$a);
            $found=false;foreach($order->getBasket() as $item)if((int)$item->getProductId()===$productId)$found=true;if(!$found)throw new RuntimeExceptionCode('NOT_FOUND',404);
        }
        if(preg_match('/-(edit|delete|reply)$/D',$id,$mode)){
            $key=$mode[1]==='reply'?'parentId':$kind.'Id';$value=$p['target'][$key]??'';
            if(!is_string($value)||!preg_match('/^[1-9][0-9]*$/D',$value))throw new RuntimeExceptionCode('NOT_FOUND',404);
            $fields=['ID','UF_TARGET_ID','UF_ACTIVE','UF_USER_ID','UF_ORGANIZATION_ID','UF_TEXT'];if($kind==='review')$fields=[...$fields,'UF_RATING','UF_PROS','UF_MEDIA'];
            if($id==='review-edit')$fields=[...$fields,'UF_MEDIA_COUNT','UF_PARENT_ID','UF_DELETE_BY_USER'];
            $class=WorkspaceDriver::hl($kind==='review'?'HLBL_ID_REVIEWS':'HLBL_ID_QUESTIONS',$fields);$row=$class::getList(['select'=>$fields,'filter'=>['=ID'=>(int)$value],'limit'=>1])->fetch();if(!$row)throw new RuntimeExceptionCode('NOT_FOUND',404);self::authorizedRow($row,$productId,$a,$mode[1]!=='reply');
            if($mode[1]==='reply')$parentId=(int)$value;
            if($mode[1]==='edit'){
                if($class::getList(['filter'=>['=UF_PARENT_ID'=>(int)$row['ID'],'=UF_ACTIVE'=>true],'select'=>['ID'],'limit'=>1])->fetch())throw new RuntimeExceptionCode('PUBLICATION_HAS_REPLIES',409);
                $data['initialValues'][$kind.'-text']=WorkspaceDriver::text($row['UF_TEXT'],20000);
                if($kind==='review'){$data['initialValues']['rate']=(string)$row['UF_RATING'];$pros=array_map('trim',explode(',',(string)($row['UF_PROS']??'')));foreach(['vote-quality'=>'quality','vote-value'=>'quality-value-balance','vote-delivery'=>'fast-delivery']as$field=>$value)$data['initialValues'][$field]=in_array($value,$pros,true)||in_array(['quality'=>'Хорошее качество товара','quality-value-balance'=>'Приятное соотношение цены и качества','fast-delivery'=>'Быстрая доставка'][$value],$pros,true);
                    // Source edit handler unconditionally replaces UF_MEDIA; this driver bypasses it, so it also owns
                    // exposing existing media for a selective-removal choice the source never offered.
                    $data['initialValues']['existingMedia']=WorkspaceDriver::media($row,$this->config);}
            }
        }
        if($id==='product-notify'){
            if(!$a['userId'])throw new RuntimeExceptionCode('AUTH_REQUIRED',401);
            $class=WorkspaceDriver::hl('HLBL_ID_CATALOG_WAITLIST',['ID','UF_USER_ID','UF_PRODUCT_ID','UF_ORGANIZATION_ID']);
            $row=$class::getList(['select'=>['ID'],'filter'=>['=UF_USER_ID'=>$a['userId'],'=UF_PRODUCT_ID'=>$productId,'=UF_ORGANIZATION_ID'=>$a['organizationId']?:false],'limit'=>1])->fetch()?:null;
        }
        $data['revision']=hash('sha256',json_encode([$this->config['formContracts'][$id],$p['context'],$p['target']??[],$row,$data],JSON_THROW_ON_ERROR));return [$data,$productId,$row,$parentId];
    }
    public function run(string $operation,array $payload,array $actor): array {
        [$current,$productId,$row,$parentId]=$this->context($payload,$actor);if($operation==='forms.context')return $current;
        if(($payload['revision']??'')!==$current['revision'])throw new RuntimeExceptionCode('STALE_CONTEXT',409);
        $id=$payload['formId'];$values=$payload['values']??[];$form=$this->config['formContracts'][$id];$post=[];$files=[];
        if(array_diff(array_keys($values),array_column($form['fields'],'name')))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        if($id==='product-notify'){
            // Source toggleItem and AJAX log user identifiers publicly and ignore failed delete/add. Same table, checked result.
            $class=WorkspaceDriver::hl('HLBL_ID_CATALOG_WAITLIST',['ID','UF_USER_ID','UF_PRODUCT_ID','UF_ORGANIZATION_ID']);
            $result=$row?$class::delete((int)$row['ID']):$class::add(['UF_USER_ID'=>$actor['userId'],'UF_PRODUCT_ID'=>$productId,'UF_ORGANIZATION_ID'=>$actor['organizationId']?:false]);
            if(!$result->isSuccess())throw new RuntimeExceptionCode('SOURCE_UPDATE_FAILED');
            return ['status'=>'accepted','reference'=>'waiting-'.($row?(int)$row['ID']:(int)$result->getId())];
        }
        // A legacy handler derives name/city from the account and cannot implement the user's publication choice.
        // Require the configured privacy-aware writer rather than silently forwarding to that handler.
        // Edits never create a new publication under a chosen display name (the author/city stay the original
        // publication's), so this consent-gated writer does not apply to them; without this exclusion review-edit
        // and question-edit could never reach their own update paths below.
        if(!str_ends_with($id,'-delete')&&!str_ends_with($id,'-edit')){
            $name=trim((string)($values['public-author']??''));$permission=false;
            foreach($payload['consents']??[] as $c)if(($c['name']??'')==='publish_author'&&($c['accepted']??false)===true&&($c['documentIds']??[])===['distribution'])$permission=true;
            if($name!==''&&(!$permission||preg_match('/[@\r\n]|https?:|\+?\d[\d ()-]{8,}/i',$name)))throw new RuntimeExceptionCode('DISTRIBUTION_CONSENT_REQUIRED',422);
            $writer=$this->config['publicationWriter']??null;
            if(!is_callable($writer))throw new RuntimeExceptionCode('PUBLICATION_PRIVACY_ADAPTER_REQUIRED',503);
            return $writer($payload,$actor,['displayName'=>$name?:'Анонимно','city'=>null,'avatar'=>null,'conditions'=>$values['publication-conditions']??'','moderationRequired'=>true],$current);
        }
        $removeMediaIds=[];
        foreach($form['fields'] as $field){$value=$values[$field['name']]??null;if(!empty($field['required'])&&($value===null||$value===''||$value===[]))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);if($value===null)continue;
            $name=$field['sourceName']??$field['name'];
            if($id==='review-edit'&&$field['name']==='remove-media-ids'){
                // Client-only selection of which owned existing photos to drop; the source has no equivalent
                // field (its edit handler always wholesale-replaces UF_MEDIA - see reviewEditData()).
                if(!is_array($value)||count($value)>10)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
                foreach($value as $mediaId){if((!is_string($mediaId)&&!is_int($mediaId))||!preg_match('/^[1-9][0-9]{0,15}$/D',(string)$mediaId))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);$removeMediaIds[]=(int)$mediaId;}
                continue;
            }
            if($field['type']==='file'){
                $uploads=new UploadDriver($this->config);$sourceField=$id==='review'?'photos':'media';if(!is_array($value)||count($value)>10)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
                foreach($value as $i=>$file)$files[$sourceField.'['.$i.']']=$uploads->resolve($payload,$field['name'],$file['uploadToken']??'');
            }elseif(isset($field['sourceValue'])){if(!is_bool($value))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);if($value)$post['votes'][]=$field['sourceValue'];}
            else{if(!is_string($value)||strlen($value)>20000||isset($field['options'])&&!in_array($value,array_column($field['options'],'value'),true))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);$post[$name]=$value;}
        }
        if(str_ends_with($id,'-edit')&&!($id==='review-edit'&&($removeMediaIds||$files))&&WorkspaceDriver::text($row['UF_TEXT'],20000)===trim($post[str_starts_with($id,'question')?'question-text':'review-text']??''))throw new RuntimeExceptionCode('PUBLICATION_UNCHANGED',422);
        $post['product-id']=$productId;
        foreach($payload['consents']??[] as $consent)$post[$consent['name']]=!empty($consent['accepted'])?'on':'';
        if($id==='order-review')$post['order-id']=(int)$payload['target']['orderId'];
        if(str_ends_with($id,'-reply'))$post['parent-id']=$parentId;
        if(str_ends_with($id,'-edit'))$post[str_starts_with($id,'question')?'question-id':'review-id']=(int)$row['ID'];
        if(str_ends_with($id,'-delete'))$post=['id'=>(int)$row['ID'],'action_name'=>str_starts_with($id,'question')?'question':'review'];
        if($id==='review-edit')return $this->editReview($payload,$actor,$post,$files,$removeMediaIds);
        $raw=(new SourceHttp($this->config))->call($form['sourceAction'],[],$post,$files);
        try{$response=json_decode($raw,true,32,JSON_THROW_ON_ERROR);}catch(\Throwable $e){throw new RuntimeExceptionCode('RESULT_RECONCILIATION_REQUIRED',409);}
        $reply=str_ends_with($id,'-reply');
        if($reply?(($response['status']??'')!=='success'||(int)($response['parent_id']??0)!==$parentId):($response['STATUS']??'')!=='OK')throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        return (new SubmissionReceipt($this->config))->record($payload,$actor,$reply?'source-publication-reply':'source-status-ok',$row&&!$reply?(int)$row['ID']:null);
    }

    /** Existing HL media IDs (minus any owned removals) stay owned values. New uploads use the original image-only edit policy. */
    public static function reviewEditData(array $row,array $post,array $files,array $removeMediaIds=[]):array {
        $text=$post['review-text']??null;$rate=$post['rate']??null;
        if(!is_string($text)||trim($text)===''||mb_strlen($text,'UTF-8')>300||!is_string($rate)||!preg_match('/^[1-5]$/D',$rate))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        if(!empty($row['UF_DELETE_BY_USER']))throw new RuntimeExceptionCode('NOT_FOUND',404);
        $old=self::mediaIds($row['UF_MEDIA']??[]);
        // The source edit handler has no selective-removal concept at all (it either drops everything not
        // reuploaded, or - in this driver's own path - keeps everything); requested IDs must already belong
        // to this exact row, never a media ID guessed from another review.
        if(array_diff($removeMediaIds,$old))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        $kept=array_values(array_diff($old,$removeMediaIds));
        if(count($files)>10||count($kept)+count($files)>10)throw new RuntimeExceptionCode('UPLOAD_LIMIT',422);
        foreach($files as$file){
            if(!is_array($file)||($file['error']??null)!==UPLOAD_ERR_OK||!is_string($file['tmp_name']??null)||!is_file($file['tmp_name'])||is_link($file['tmp_name'])||!in_array(strtolower(pathinfo($file['name']??'',PATHINFO_EXTENSION)),['jpg','jpeg','png'],true)||!in_array($file['type']??'',['image/jpeg','image/png'],true)||!\CFile::IsImage($file['name'],$file['type'])||!getimagesize($file['tmp_name'])||(new \finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name'])!==$file['type'])throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        }
        $map=['quality'=>'Хорошее качество товара','quality-value-balance'=>'Приятное соотношение цены и качества','fast-delivery'=>'Быстрая доставка'];$pros=[];
        if(isset($post['votes'])&&!is_array($post['votes']))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        foreach($post['votes']??[] as$v){if(!is_string($v)||!isset($map[$v]))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);$pros[]=$map[$v];}
        $data=['UF_RATING'=>(int)$rate,'UF_TEXT'=>htmlspecialcharsbx(trim($text)),'UF_PROS'=>implode(', ',$pros),'UF_ACTIVE'=>0,'UF_MEDIA_COUNT'=>count($kept)+count($files)];
        // Untouched media (no removal, no new upload) does not even invoke the file field's write/delete hooks.
        if($files||$removeMediaIds)$data['UF_MEDIA']=[...$kept,...array_values($files)];
        return $data;
    }
    private static function mediaIds(mixed $value):array {
        if($value===null||$value===false)$value=[];
        if(!is_array($value))throw new RuntimeExceptionCode('SOURCE_MEDIA_UNAVAILABLE');$ids=[];
        foreach($value as$id){if(!(is_int($id)||is_string($id))||!preg_match('/^[1-9][0-9]{0,15}$/D',(string)$id))throw new RuntimeExceptionCode('SOURCE_MEDIA_UNAVAILABLE');$ids[]=(int)$id;}
        return $ids;
    }
    private function editReview(array $payload,array $actor,array $post,array $files,array $removeMediaIds=[]):array {
        $fields=['ID','UF_TARGET_ID','UF_ACTIVE','UF_USER_ID','UF_ORGANIZATION_ID','UF_TEXT','UF_RATING','UF_PROS','UF_MEDIA','UF_MEDIA_COUNT','UF_PARENT_ID','UF_DELETE_BY_USER'];
        $class=WorkspaceDriver::hl('HLBL_ID_REVIEWS',$fields);$connection=\Bitrix\Main\Application::getConnection();$connection->startTransaction();$committed=false;
        try{
            // Resolve again immediately before the effect, after upload resolution. No client IDs/media are trusted.
            [$current,$productId,$row]=$this->context($payload,$actor);
            if(($payload['revision']??'')!==$current['revision'])throw new RuntimeExceptionCode('STALE_CONTEXT',409);
            self::authorizedRow($row,$productId,$actor,true);
            if($class::getList(['filter'=>['=UF_PARENT_ID'=>(int)$row['ID'],'=UF_ACTIVE'=>true],'select'=>['ID'],'limit'=>1])->fetch())throw new RuntimeExceptionCode('PUBLICATION_HAS_REPLIES',409);
            if(!$removeMediaIds&&!$files&&WorkspaceDriver::text($row['UF_TEXT'],20000)===trim($post['review-text']??''))throw new RuntimeExceptionCode('PUBLICATION_UNCHANGED',422);
            $old=self::mediaIds($row['UF_MEDIA']??[]);$data=self::reviewEditData($row,$post,$files,$removeMediaIds);
            $kept=array_values(array_diff($old,$removeMediaIds));
            // Only editable source fields are changed. Original author/city/date/parent and buyer identity remain intact.
            $result=$class::update((int)$row['ID'],$data);
            if(!is_object($result)||!method_exists($result,'isSuccess')||!$result->isSuccess())throw new RuntimeExceptionCode('SOURCE_UPDATE_FAILED');
            $stored=$class::getList(['select'=>$fields,'filter'=>['=ID'=>(int)$row['ID']],'limit'=>1])->fetch();
            if(!$stored)throw new RuntimeExceptionCode('RESULT_RECONCILIATION_REQUIRED',409);
            $media=self::mediaIds($stored['UF_MEDIA']??[]);
            if(array_slice($media,0,count($kept))!==$kept||count($media)!==count($kept)+count($files)||(int)$stored['UF_MEDIA_COUNT']!==count($media)||!empty($stored['UF_ACTIVE'])||$stored['UF_TEXT']!==$data['UF_TEXT'])throw new RuntimeExceptionCode('RESULT_RECONCILIATION_REQUIRED',409);
            $connection->commitTransaction();$committed=true;
        }catch(\Throwable $e){if(!$committed)$connection->rollbackTransaction();throw$e;}
        if(defined('BX_COMP_MANAGED_CACHE'))$GLOBALS['CACHE_MANAGER']->ClearByTag('hlblock_id_'.HLBL_ID_REVIEWS);
        \Prom\Model\Reviews::clearCache($actor['userId']);if($actor['organizationId'])\Prom\Model\Reviews::clearCache(null,$actor['organizationId']);
        return (new SubmissionReceipt($this->config))->record($payload,$actor,'source-status-ok',(int)$row['ID']);
    }
}
