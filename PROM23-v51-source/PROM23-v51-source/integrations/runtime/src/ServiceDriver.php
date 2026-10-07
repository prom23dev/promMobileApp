<?php
declare(strict_types=1);
namespace Prom23\Runtime;

/** Source forms: appeals/* and returns-products/*. No direct CRM or refund calls. */
final class ServiceDriver {
    public function __construct(private array $config) {}
    private static function text(mixed $value,int $bytes): string {
        if(!is_string($value)||trim($value)===''||strlen($value)>$bytes||preg_match('/[\x00\x08\x0b\x0c]/',$value))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        return trim($value);
    }
    public static function ownedOrder(object $order,array $actor): void {
        $property=$order->getPropertyCollection()->getItemByOrderPropertyCode('ORGANIZATION_ID');$org=$property?(int)$property->getValue():0;
        if((int)$order->getUserId()!==$actor['userId']||$org!==$actor['organizationId']||((int)$order->getPersonTypeId()===2&&!$org))throw new RuntimeExceptionCode('NOT_FOUND',404);
    }
    private function order(array $payload,array $actor): object {
        $id=$payload['target']['orderId']??'';
        if(!is_string($id)||!preg_match('/^[1-9][0-9]*$/D',$id))throw new RuntimeExceptionCode('NOT_FOUND',404);
        $order=\Bitrix\Sale\Order::load((int)$id);if(!$order)throw new RuntimeExceptionCode('NOT_FOUND',404);self::ownedOrder($order,$actor);return $order;
    }
    private function enums(string $constant,string $code): array {
        if(!defined($constant))throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
        $rows=[];$cursor=\CIBlockPropertyEnum::GetList(['SORT'=>'ASC','ID'=>'ASC'],['IBLOCK_ID'=>constant($constant),'CODE'=>$code]);
        while($row=$cursor->Fetch())$rows[]=$row;return $rows;
    }
    private static function options(array $rows,string $key='ID'): array {
        return array_map(static fn($row)=>['value'=>(string)$row[$key],'label'=>html_entity_decode(strip_tags((string)$row['VALUE']),ENT_QUOTES|ENT_HTML5,'UTF-8')],$rows);
    }
    private function appeal(array $payload,array $actor): array {
        $id=$payload['target']['appealId']??'';
        if(!is_string($id)||!preg_match('/^[1-9][0-9]*$/D',$id)||!defined('IBLOCK_ID_APPEALS'))throw new RuntimeExceptionCode('NOT_FOUND',404);
        $row=\CIBlockElement::GetList([],['IBLOCK_ID'=>IBLOCK_ID_APPEALS,'ID'=>(int)$id,'ACTIVE'=>'Y','PROPERTY_USER_ID'=>$actor['userId'],'PROPERTY_ORGANIZATION_ID'=>$actor['organizationId']?:false],false,['nTopCount'=>1],['ID','PROPERTY_RATING_BY_USER'])->Fetch();
        if(!$row)throw new RuntimeExceptionCode('NOT_FOUND',404);return $row;
    }
    private function context(array $payload,array $actor): array {
        if(!$actor['userId'])throw new RuntimeExceptionCode('AUTH_REQUIRED',401);
        $id=$payload['formId'];$data=['formId'=>$id,'options'=>[],'initialValues'=>[]];
        if($id==='return'){
            $order=$this->order($payload,$actor);
            if(!defined('STATUS_ORDER_FINISH')||$order->getField('STATUS_ID')!==STATUS_ORDER_FINISH)throw new RuntimeExceptionCode('ORDER_NOT_COMPLETED',409);
            if(!defined('IBLOCK_ID_RETURNS'))throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
            $reasons=self::options($this->enums('IBLOCK_ID_RETURNS','REASONS'),'XML_ID');
            if(!$reasons)throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
            $products=[];$quantities=[];foreach($order->getBasket() as $item){$key=(string)$item->getProductId();$products[$key]=html_entity_decode(strip_tags((string)$item->getField('NAME')),ENT_QUOTES|ENT_HTML5,'UTF-8');$quantities[$key]=($quantities[$key]??0)+(float)$item->getQuantity();}
            $data['options']['selected-products']=[];$data['repeatedItems']['items']=[];
            foreach($products as $key=>$label){$key=(string)$key;$data['options']['selected-products'][]=['value'=>$key,'label'=>$label];$data['repeatedItems']['items'][]=['key'=>$key,'label'=>$label,'quantityMax'=>$quantities[$key],'options'=>['reason'=>$reasons]];}
        }elseif($id==='appeal'||$id==='appeal-order'){
            $orderRelated=$id==='appeal-order';if($orderRelated)$this->order($payload,$actor);
            $themes=array_values(array_filter($this->enums('IBLOCK_ID_APPEALS','THEME'),static fn($row)=>str_starts_with((string)$row['XML_ID'],'comment_')!==$orderRelated));
            $data['options']['theme']=self::options($themes);
            if(!$themes)throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
            if($orderRelated){$tags=self::options($this->enums('IBLOCK_ID_APPEALS','TAGS_HELP'),'XML_ID');$data['options']['tags[]']=$tags;if($tags)$data['initialValues']['tags[]']=[$tags[0]['value']];}
        }elseif($id==='appeal-rating'){
            $row=$this->appeal($payload,$actor);$rate=(int)($row['PROPERTY_RATING_BY_USER_VALUE']??0);if($rate>=1&&$rate<=5)$data['initialValues']['rate']=(string)$rate;
        }else throw new RuntimeExceptionCode('NOT_FOUND',404);
        $data['revision']=hash('sha256',json_encode([$this->config['formContracts'][$id],$payload['context'],$payload['target']??[],$data],JSON_THROW_ON_ERROR));return $data;
    }
    /** Pure serialization retains source item indexes, XML reasons and exact upload field scope. */
    public static function returnPost(array $values,array $schema,int $orderId): array {
        if(array_diff(array_keys($values),['selected-products','items']))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        $selected=$values['selected-products']??null;$rows=$values['items']??null;
        if(!is_array($selected)||!$selected||count($selected)>500||count($selected)!==count(array_unique($selected,SORT_STRING))||!is_array($rows))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        $owned=array_column($schema['repeatedItems']['items']??[],null,'key');$mapped=[];
        foreach($rows as $row){$key=$row['key']??null;if(!is_string($key)||!in_array($key,$selected,true)||isset($mapped[$key])||!is_array($row['values']??null))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);$mapped[$key]=$row['values'];}
        $post=['orderID'=>$orderId];$uploads=[];
        foreach($selected as $position=>$key){
            if(!is_string($key)||!preg_match('/^[1-9][0-9]*$/D',$key)||!isset($owned[$key],$mapped[$key]))throw new RuntimeExceptionCode('NOT_FOUND',404);
            $item=$mapped[$key];if(array_diff(array_keys($item),['quantity','reason','comment','photos[]']))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            $quantity=$item['quantity']??null;$max=$owned[$key]['quantityMax']??null;
            if(!is_string($quantity)||!preg_match('/^[0-9]+(?:\.[0-9]{1,3})?$/D',$quantity)||!is_numeric($max)||!is_finite((float)$quantity)||(float)$quantity<=0||(float)$quantity>(float)$max)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            $index=$position+1;$post['item-'.$index.'-quantity']=(float)$quantity;$post['item-'.$index.'-id']=(int)$key;$post['item-'.$index.'-comment']=self::text($item['comment']??null,20000);
            $reasons=$item['reason']??[];$allowed=array_column($owned[$key]['options']['reason']??[],'value');
            if(!is_array($reasons)||count($reasons)!==count(array_unique($reasons,SORT_STRING)))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            foreach($reasons as $reason){$enum=array_search($reason,$allowed,true);if($enum===false)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);$post['item-'.$index.'-reason-'.($enum+1)]=$reason;}
            if(!is_array($item['photos[]']??[])||count($item['photos[]']??[])>10)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            foreach($item['photos[]']??[] as $fileIndex=>$file)$uploads['item-'.$index.'-photos['.$fileIndex.']']=['field'=>'items:'.$key.':photos[]','token'=>$file['uploadToken']??''];
        }
        return ['post'=>$post,'uploads'=>$uploads];
    }
    public function run(string $operation,array $payload,array $actor): array {
        $current=$this->context($payload,$actor);if($operation==='forms.context')return $current;
        if(($payload['revision']??'')!==$current['revision'])throw new RuntimeExceptionCode('STALE_CONTEXT',409);
        $id=$payload['formId'];$v=$payload['values']??[];$post=[];$files=[];
        if($id==='return'){
            // Supplied legacy return detail templates print COMMENT as raw HTML.
            // Require the companion output-escaping patch before sharing their records.
            if(empty($this->config['returns']['legacyTemplatesEscaped']))throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
            $mapped=self::returnPost($v,$current,(int)$payload['target']['orderId']);$post=$mapped['post'];$uploads=new UploadDriver($this->config);
            foreach($mapped['uploads'] as $name=>$file)$files[$name]=$uploads->resolve($payload,$file['field'],$file['token']);
            require_once __DIR__.'/ReturnWriter.php';
            return (new ReturnWriter())->save($mapped['post'],$files,$current,$actor);
        }elseif($id==='appeal-rating'){
            if(array_diff(array_keys($v),['rate'])||!in_array($v['rate']??'', ['1','2','3','4','5'],true))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            $post=['appealID'=>(int)$payload['target']['appealId'],'rate'=>(int)$v['rate']];
        }else{
            $isOrder=$id==='appeal-order';if(array_diff(array_keys($v),$isOrder?['theme','tags[]','comment','photos[]']:['theme','comment']))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            if(!in_array($v['theme']??'',array_column($current['options']['theme'],'value'),true))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            $post=[$isOrder?'theme_id':'theme'=>$v['theme'],'comment'=>self::text($v['comment']??null,$isOrder?500:2000)];
            if($isOrder){$post['order-help']=(int)$payload['target']['orderId'];$tags=$v['tags[]']??[];
                if(!is_array($tags)||array_diff($tags,array_column($current['options']['tags[]'],'value')))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);$post['tags']=$tags;
                if(!is_array($v['photos[]']??[])||count($v['photos[]']??[])>10)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
                $uploads=new UploadDriver($this->config);foreach($v['photos[]']??[] as $i=>$file)$files['photos['.$i.']']=$uploads->resolve($payload,'photos[]',$file['uploadToken']??'');
            }
        }
        $raw=(new SourceHttp($this->config))->call($this->config['formContracts'][$id]['sourceAction'],[],$post,$files);
        try{$result=json_decode($raw,true,32,JSON_THROW_ON_ERROR);}catch(\Throwable $e){throw new RuntimeExceptionCode('RESULT_RECONCILIATION_REQUIRED',409);}
        if($id==='appeal-rating'?($result['status']??false)!==true:($result['STATUS']??'')!=='OK')throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        return (new SubmissionReceipt($this->config))->record($payload,$actor,$id==='appeal-rating'?'source-rating':'source-status-ok',$id==='appeal-rating'?(int)$payload['target']['appealId']:null);
    }
}
