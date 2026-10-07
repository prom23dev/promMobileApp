<?php
declare(strict_types=1);
namespace Prom23\Runtime;

/** Reads source entities uncached. No mark-read, Documents1C agents, CRM or mail calls. */
final class WorkspaceDriver {
    public function __construct(private array $config) {}
    public static function text(mixed $value,int $length=3000): string {
        if(is_array($value))$value=$value['TEXT']??'';
        return mb_substr(html_entity_decode(strip_tags((string)$value),ENT_QUOTES|ENT_HTML5,'UTF-8'),0,$length);
    }
    public static function hl(string $constant,array $fields): string {
        if(!defined($constant))throw new RuntimeExceptionCode('SOURCE_SCHEMA_REQUIRED');
        $row=\Bitrix\Highloadblock\HighloadBlockTable::getById(constant($constant))->fetch();if(!$row)throw new RuntimeExceptionCode('SOURCE_SCHEMA_REQUIRED');
        $entity=\Bitrix\Highloadblock\HighloadBlockTable::compileEntity($row);
        if(array_diff($fields,array_keys($entity->getFields())))throw new RuntimeExceptionCode('SOURCE_SCHEMA_REQUIRED');return $entity->getDataClass();
    }
    public static function product(string $id): int {
        if(!preg_match('/^prom-([1-9][0-9]*)$/D',$id,$m)||!defined('IBLOCK_ID_CATALOG_PRODUCTS'))throw new RuntimeExceptionCode('NOT_FOUND',404);
        if(!\CIBlockElement::GetList([],['ID'=>(int)$m[1],'IBLOCK_ID'=>IBLOCK_ID_CATALOG_PRODUCTS,'ACTIVE'=>'Y'],false,['nTopCount'=>1],['ID'])->Fetch())throw new RuntimeExceptionCode('NOT_FOUND',404);return (int)$m[1];
    }
    private static function detail(string $label,mixed $value): array {return ['label'=>$label,'value'=>self::text($value)];}
    private static function action(string $label,string $formId,array $target): array {return compact('label','formId','target');}
    private function addresses(array $actor): array {
        $cursor=\Prom\Model\EO\AddressDeliveryUsersTable::getList(['filter'=>['=USER_ID'=>$actor['userId'],'=ORGANIZATION_ID'=>$actor['organizationId']?:null],'order'=>['ID'=>'DESC'],'limit'=>501]);$records=[];
        while($row=$cursor->fetch()){$id=(string)$row['ID'];$records[]=['id'=>$id,'title'=>self::text($row['FULL_ADDRESS']),'details'=>[self::detail('Основной адрес',!empty($row['IS_MAIN'])?'Да':'Нет')],'actions'=>[self::action('Изменить','address-edit',['addressId'=>$id]),self::action('Сделать основным','address-default',['addressId'=>$id]),self::action('Удалить','address-delete',['addressId'=>$id])]];}return $records;
    }
    private function organizations(array $actor): array {
        $list=(new BuyerDriver())->run('buyer.organizations',[],$actor);$records=[];
        foreach($list['organizations'] as $org)$records[]=['id'=>(string)$org['id'],'title'=>$org['name'],'details'=>isset($org['inn'])?[self::detail('ИНН',$org['inn'])]:[],'actions'=>[self::action('Подтвердить полномочия','organization-verify',['organizationId'=>(string)$org['id']])]];
        return $records;
    }
    private function organizationInfo(string $kind,array $actor): array {
        if(!$actor['organizationId'])throw new RuntimeExceptionCode('ORGANIZATION_REQUIRED',409);$org=Actor::organization($actor['userId'],$actor['organizationId']);
        if($kind==='staff'){
            // Source exposes verification of the current member; there is no invitation/role administration model.
            $props=[];foreach(['USER_IDS_VERIFY','USER_IDS_VERIFY_DATE'] as $code){$v=[];$cursor=\CIBlockElement::GetProperty(IBLOCK_ID_ORGANIZATIONS,$org['id'],[],['CODE'=>$code]);while($r=$cursor->Fetch())$v[]=$r['VALUE'];$props[$code]=['VALUE'=>$v];}$verified=\Prom\Model\Organization::isUserVerified(['PROPERTIES'=>$props],$actor['userId']);
            return [['id'=>(string)$actor['userId'],'title'=>'Ваши полномочия','details'=>[self::detail('Подтверждение',$verified?'Подтверждены':'Требуется подтверждение')],'actions'=>[self::action('Подтвердить полномочия','organization-verify',['organizationId'=>(string)$org['id']])]]];
        }
        $codes=$kind==='bank'?['БИК'=>'BIK','Расчётный счёт'=>'PAYMENT_SCORE_BANK','Банк'=>'NAME_BANK','Корреспондентский счёт'=>'CORRESPONDENT_SCORE_BANK']:['ИНН'=>'INN','КПП'=>'KPP','Юридический адрес'=>'LEGAL_ADDRESS','Фактический адрес'=>'ACTUAL_ADDRESS'];$details=[];
        foreach($codes as $label=>$code){$row=\CIBlockElement::GetProperty(IBLOCK_ID_ORGANIZATIONS,$org['id'],[],['CODE'=>$code])->Fetch();if($row)$details[]=self::detail($label,$row['VALUE']??'');}
        return [['id'=>(string)$org['id'],'title'=>$org['name'],'details'=>$details,'actions'=>[self::action('Изменить реквизиты','organization-requisites',['organizationId'=>(string)$org['id']])]]];
    }
    private function serviceRecords(string $kind,array $actor): array {
        $constant=$kind==='returns'?'IBLOCK_ID_RETURNS':'IBLOCK_ID_APPEALS';if(!defined($constant))throw new RuntimeExceptionCode('SOURCE_SCHEMA_REQUIRED');
        $cursor=\CIBlockElement::GetList(['ID'=>'DESC'],['IBLOCK_ID'=>constant($constant),'ACTIVE'=>'Y','PROPERTY_USER_ID'=>$actor['userId'],'PROPERTY_ORGANIZATION_ID'=>$actor['organizationId']?:false],false,['nTopCount'=>501],['ID','NAME','DATE_CREATE','IBLOCK_ID']);$records=[];
        while($entity=$cursor->GetNextElement()){$row=$entity->GetFields();$p=$entity->GetProperties();$details=[self::detail('Дата',$row['DATE_CREATE']),self::detail('Статус',$p['STATUS']['VALUE_ENUM']??$p['STATUS']['VALUE']??'')];
            foreach(['COMMENT'=>'Комментарий','USER_COMMENT'=>'Комментарий покупателя','ADMIN_COMMENT'=>'Ответ'] as $code=>$label)if(isset($p[$code]['VALUE']))$details[]=self::detail($label,$p[$code]['VALUE']);
            $orderId=$p[$kind==='returns'?'ORDER_ID':'ORDER_ID_PROBLEM']['VALUE']??null;if($orderId)$details[]=self::detail('Заказ',$orderId);
            if($kind==='returns')foreach((array)($p['JSON_RETURNS']['VALUE']??[]) as $json){
                $item=is_string($json)?json_decode($json,true):null;if(!is_array($item))continue;
                $details[]=self::detail('Товар',$item['GOOD']['NAME']??$item['GOOD']['ID']??'');
                if(isset($item['QUANTITY']))$details[]=self::detail('Количество',$item['QUANTITY']);
                $details[]=self::detail('Причина',implode(', ',array_column($item['REASONS']??[],'NAME')));
                $details[]=self::detail('Комментарий по товару',$item['COMMENT']??'');
            }
            $actions=$kind==='appeals'?[self::action('Оценить решение','appeal-rating',['appealId'=>(string)$row['ID']])]:[];
            $records[]=['id'=>(string)$row['ID'],'title'=>self::text($row['NAME']),'details'=>$details,'actions'=>$actions];
        }return $records;
    }
    private function sessions(array $actor): array {
        $class=self::hl('HLBL_ID_HISTORY_SESSION_USERS',['ID','UF_USER_ID','UF_SESSION_ID','UF_DEVICE','UF_DATE_AUTHORIZATION','UF_CITY']);
        $cursor=$class::getList(['filter'=>['=UF_USER_ID'=>$actor['userId']],'order'=>['UF_DATE_AUTHORIZATION'=>'DESC'],'limit'=>501]);$records=[];
        while($row=$cursor->fetch()){$id=(string)$row['ID'];$records[]=['id'=>$id,'title'=>self::text($row['UF_DEVICE']),'details'=>[self::detail('Вход',$row['UF_DATE_AUTHORIZATION']),self::detail('Местоположение',$row['UF_CITY']),self::detail('Текущий сеанс',hash_equals((string)$row['UF_SESSION_ID'],session_id())?'Да':'Нет')],'actions'=>[self::action('Завершить','sessions-terminate',['sessionId'=>$id])]];}return $records;
    }
    private function cards(array $actor): array {
        $cursor=\Prom\Model\EO\ConfirmedCardsTable::getList(['filter'=>['=USER_ID'=>$actor['userId'],'=ORGANIZATION_ID'=>$actor['organizationId']?:null],'limit'=>501]);$records=[];
        while($row=$cursor->fetch()){
            // Source column can contain a PAN. Return only the final four digits, never the raw value.
            $digits=preg_replace('/\D/','',(string)$row['CARD_NUMBER']);$last=strlen($digits)>=4?substr($digits,-4):'';$id=(string)$row['ID'];
            $records[]=['id'=>$id,'title'=>self::text($row['BANK_NAME']).($last?' · •••• '.$last:''),'details'=>[self::detail('Платёжная система',$row['TYPE_CARD']),self::detail('Основной способ',!empty($row['IS_MAIN'])?'Да':'Нет')],
                'actions'=>[self::action('Сделать основным','payment-default',['cardId'=>$id]),self::action('Удалить','payment-remove',['cardId'=>$id])]];
        }return $records;
    }
    private function waiting(array $actor): array {
        $class=self::hl('HLBL_ID_CATALOG_WAITLIST',['ID','UF_PRODUCT_ID','UF_USER_ID','UF_ORGANIZATION_ID']);$cursor=$class::getList(['filter'=>['=UF_USER_ID'=>$actor['userId'],'=UF_ORGANIZATION_ID'=>$actor['organizationId']?:false],'order'=>['ID'=>'DESC'],'limit'=>501]);$records=[];
        while($row=$cursor->fetch()){$product=\CIBlockElement::GetList([],['ID'=>(int)$row['UF_PRODUCT_ID'],'IBLOCK_ID'=>IBLOCK_ID_CATALOG_PRODUCTS,'ACTIVE'=>'Y'],false,['nTopCount'=>1],['ID','NAME'])->Fetch();if(!$product)continue;
            $records[]=['id'=>(string)$row['ID'],'title'=>self::text($product['NAME']),'details'=>[],'actions'=>[self::action('Убрать из листа ожидания','product-notify',['productId'=>'prom-'.$product['ID']])]];}return $records;
    }
    public static function media(array $row,array $config): array {
        $out=[];foreach(array_slice((array)($row['UF_MEDIA']??[]),0,10) as $fileId){$file=\CFile::GetFileArray((int)$fileId);if(!$file)continue;$mime=(string)($file['CONTENT_TYPE']??'');$kind=str_starts_with($mime,'image/')?'image':(str_starts_with($mime,'video/')?'video':null);if(!$kind)continue;
            $path=(string)($file['SRC']??'');if(!preg_match('#^/upload/[A-Za-z0-9_./%-]+$#D',$path)||str_contains(rawurldecode($path),'..'))continue;
            $origin=$config['sourceOrigin']??'';if(!preg_match('#^https://[A-Za-z0-9.-]+(?::[0-9]+)?$#D',$origin)||!in_array($origin,$config['sourceAllowedOrigins']??[],true))continue;
            $out[]=['id'=>(string)$fileId,'kind'=>$kind,'url'=>$origin.$path,'alt'=>'Материал покупателя'];
        }return $out;
    }
    private function publicationRows(string $kind,array $filter,int $limit=201): array {
        $fields=['ID','UF_TARGET_ID','UF_PARENT_ID','UF_ACTIVE','UF_USER_ID','UF_ORGANIZATION_ID','UF_AUTHOR_NAME','UF_TEXT','UF_DATE'];if($kind==='review')$fields=[...$fields,'UF_RATING','UF_MEDIA'];
        $class=self::hl($kind==='review'?'HLBL_ID_REVIEWS':'HLBL_ID_QUESTIONS',$fields);$cursor=$class::getList(['select'=>$fields,'filter'=>$filter,'order'=>['UF_DATE'=>'DESC','ID'=>'DESC'],'limit'=>$limit]);$rows=[];while($row=$cursor->fetch())$rows[]=$row;return $rows;
    }
    private function publication(array $row,string $kind,array $actor,array $replies=[]): array {
        $owned=$actor['userId']>0&&(int)$row['UF_USER_ID']===$actor['userId']&&(int)($row['UF_ORGANIZATION_ID']??0)===$actor['organizationId'];$date=self::text($row['UF_DATE'],100);
        $item=['id'=>(string)$row['ID'],'productId'=>'prom-'.$row['UF_TARGET_ID'],'kind'=>$kind,'author'=>self::text($row['UF_AUTHOR_NAME'],200),'publishedLabel'=>$date,'text'=>self::text($row['UF_TEXT'],20000),'actions'=>$owned?['reply','edit','delete']:['reply'],'replies'=>array_map(static fn($r)=>['id'=>(string)$r['ID'],'author'=>self::text($r['UF_AUTHOR_NAME'],200),'text'=>self::text($r['UF_TEXT'],20000),'publishedLabel'=>self::text($r['UF_DATE'],100)],$replies)];
        if($row['UF_DATE'] instanceof \DateTimeInterface||is_object($row['UF_DATE'])&&method_exists($row['UF_DATE'],'format'))$item['publishedAt']=$row['UF_DATE']->format('c');
        if($kind==='review'){if((int)$row['UF_RATING']>=1&&(int)$row['UF_RATING']<=5)$item['rating']=(int)$row['UF_RATING'];$item['media']=self::media($row,$this->config);}return $item;
    }
    public static function filters(array $filters): array {
        if(array_diff(array_keys($filters),['rating','withMedia','withReplies','sort'])||!in_array($filters['sort']??'new',['new','high-rate','low-rate'],true)||isset($filters['rating'])&&(!is_int($filters['rating'])||$filters['rating']<1||$filters['rating']>5))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        foreach(['withMedia','withReplies'] as $key)if(isset($filters[$key])&&!is_bool($filters[$key]))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);return $filters;
    }
    private const PUBLICATIONS_PAGE_SIZE=20;
    private const PUBLICATIONS_MAX_ROWS=2000;
    private function publications(array $payload,array $actor): array {
        $productId=self::product($payload['productId']??'');$f=self::filters($payload['filters']??[]);
        $cursor=$payload['cursor']??'0';if(!is_string($cursor)||!preg_match('/^[0-9]{1,7}$/D',$cursor))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        $offset=(int)$cursor;$items=[];
        foreach(['review','question'] as $kind){
            // Source product.reviews.list::getHlData base filter (UF_ACTIVE + UF_SKIP_RATE) governs the public list;
            // the cabinet's own-review listing (run() kind=reviews) intentionally omits UF_SKIP_RATE, per Reviews::getAllReviews.
            $base=['=UF_TARGET_ID'=>$productId,'=UF_ACTIVE'=>true];if($kind==='review')$base['=UF_SKIP_RATE']=false;
            $rootFilter=$base;$rootFilter['=UF_PARENT_ID']=false;if($kind==='review'&&isset($f['rating']))$rootFilter['=UF_RATING']=$f['rating'];
            $rows=$this->publicationRows($kind,$rootFilter,self::PUBLICATIONS_MAX_ROWS+1);
            $byParent=[];
            if($rows){
                // Replies are looked up without the rating filter: a reply has no UF_RATING of its own, and
                // the real product.reviews.list component resolves "has replies" from a separate, unfiltered
                // reply query (class.php getReviewsWithReplies()/getHlData()), not by reusing the rating-scoped
                // root filter. Reusing $rootFilter here would silently drop every reply attached to a review
                // that doesn't itself match the selected rating, making that review look reply-less.
                $replyFilter=$base;$replyFilter['@UF_PARENT_ID']=array_map(static fn($row)=>(int)$row['ID'],$rows);
                foreach($this->publicationRows($kind,$replyFilter,self::PUBLICATIONS_MAX_ROWS+1) as $reply)$byParent[(int)$reply['UF_PARENT_ID']][]=$reply;
            }
            foreach($rows as $row){$item=$this->publication($row,$kind,$actor,$byParent[(int)$row['ID']]??[]);if($kind==='review'&&!empty($f['withMedia'])&&empty($item['media']))continue;if(!empty($f['withReplies'])&&empty($item['replies']))continue;$items[]=$item;}
        }
        if(count($items)>self::PUBLICATIONS_MAX_ROWS)throw new RuntimeExceptionCode('WORKSPACE_PAGINATION_REQUIRED');
        usort($items,static function($a,$b)use($f){$sort=$f['sort']??'new';if($sort==='high-rate'||$sort==='low-rate'){$diff=($b['rating']??0)<=>($a['rating']??0);if($diff)return $sort==='high-rate'?$diff:-$diff;}return strcmp($b['publishedAt']??$b['publishedLabel'],$a['publishedAt']??$a['publishedLabel']);});
        $page=array_slice($items,$offset,self::PUBLICATIONS_PAGE_SIZE);
        $nextCursor=$offset+self::PUBLICATIONS_PAGE_SIZE<count($items)?(string)($offset+self::PUBLICATIONS_PAGE_SIZE):null;
        return ['items'=>$page,'available'=>true,'nextCursor'=>$nextCursor];
    }
    public static function orderDto(object $order,array $actor,array $statusLabels=[]): array {
        ServiceDriver::ownedOrder($order,$actor);
        if($order->getCurrency()!=='RUB')throw new RuntimeExceptionCode('ORDER_CURRENCY_UNSUPPORTED');
        require_once __DIR__.'/CommerceDriver.php';$items=[];
        foreach($order->getBasket() as $item){$quantity=(float)$item->getQuantity();if(!is_finite($quantity)||$quantity<=0)throw new RuntimeExceptionCode('ORDER_ITEMS_INVALID');
            $items[]=['productId'=>'prom-'.$item->getProductId(),'name'=>self::text($item->getField('NAME')),'quantity'=>$quantity,'unitPriceKopecks'=>CommerceDriver::money($item->getPrice()),'lineTotalKopecks'=>CommerceDriver::money($item->getFinalPrice())];}
        if(count($items)>500)throw new RuntimeExceptionCode('ORDER_ITEMS_LIMIT');
        $status=(string)$order->getField('STATUS_ID');$cancelled=$order->getField('CANCELED')==='Y';$completed=defined('STATUS_ORDER_FINISH')&&$status===STATUS_ORDER_FINISH;$actions=['repeat'];
        $allowed=[];foreach(['STATUS_ORDER_NO_PAY','STATUS_ORDER_ASSEMBLING','STATUS_ORDER_DELIVERY','STATUS_ORDER_READY'] as $c)if(defined($c))$allowed[]=constant($c);
        if(!$cancelled&&in_array($status,$allowed,true))$actions[]='cancel';
        if($completed&&!$cancelled){$actions[]='return';$actions[]='review';}
        if(!$cancelled&&!$order->isPaid())foreach($order->getPaymentCollection() as $payment)if(!$payment->isPaid()&&!$payment->isInner()&&(int)$payment->getPaymentSystemId()!==17){$actions[]='pay';break;}
        $delivery=[];foreach($order->getShipmentCollection() as $shipment)if(!$shipment->isSystem()){$name=self::text($shipment->getField('DELIVERY_NAME'));if($name!=='')$delivery[]=$name;}
        $date=$order->getDateInsert();if(!is_object($date)||!method_exists($date,'format'))throw new RuntimeExceptionCode('ORDER_DATE_INVALID');
        return ['id'=>(string)$order->getId(),'number'=>self::text($order->getField('ACCOUNT_NUMBER'),100),'context'=>$actor['organizationId']?'organization:'.$actor['organizationId']:'personal','items'=>$items,
            'totalKopecks'=>CommerceDriver::money($order->getPrice()),'deliveryKopecks'=>CommerceDriver::money($order->getDeliveryPrice()),'currency'=>'RUB','status'=>$status,'statusLabel'=>$statusLabels[$status]??$status,
            'statusGroup'=>$completed||$cancelled?'completed':'active','createdAt'=>$date->format('c'),'deliveryLabel'=>implode(', ',array_unique($delivery)),'availableActions'=>$actions];
    }
    private function orders(array $payload,array $actor): array {
        if(($payload['context']??'')==='business')throw new RuntimeExceptionCode('ORGANIZATION_REQUIRED',409);
        $target=$payload['target']??[];if(array_diff(array_keys($target),['orderId']))throw new RuntimeExceptionCode('FORBIDDEN',403);$ids=[];
        if(isset($target['orderId'])){if(!preg_match('/^[1-9][0-9]*$/D',$target['orderId']))throw new RuntimeExceptionCode('NOT_FOUND',404);$ids[]=(int)$target['orderId'];}
        else{$filter=['=USER_ID'=>$actor['userId'],'=PERSON_TYPE_ID'=>$actor['organizationId']?2:1];
            // Organization relation is checked again on each loaded order; no shared cached Order::getAll* result.
            $cursor=\Bitrix\Sale\Order::getList(['select'=>['ID'],'filter'=>$filter,'order'=>['DATE_INSERT'=>'DESC','ID'=>'DESC'],'limit'=>501]);while($row=$cursor->fetch())$ids[]=(int)$row['ID'];
            if(count($ids)>500)throw new RuntimeExceptionCode('WORKSPACE_PAGINATION_REQUIRED');
        }
        $labels=[];$cursor=\Bitrix\Sale\Internals\StatusLangTable::getList(['select'=>['STATUS_ID','NAME'],'filter'=>['=LID'=>'ru']]);while($row=$cursor->fetch())$labels[$row['STATUS_ID']]=self::text($row['NAME'],200);
        $orders=[];foreach($ids as $id){$order=\Bitrix\Sale\Order::load($id);if(!$order){if($target)throw new RuntimeExceptionCode('NOT_FOUND',404);continue;}
            try{$dto=self::orderDto($order,$actor,$labels);if(in_array('pay',$dto['availableActions'],true)&&$this->hasManagedPayment($order,$actor))$dto['availableActions'][]='check-payment';$orders[]=$dto;}catch(RuntimeExceptionCode $error){if($error->status!==404||$target)throw $error;}
        }return $orders;
    }
    private function hasManagedPayment($order,array $actor):bool{
        $db=$this->config['pdo']??null;if(!($db instanceof \PDO))return false;
        $q=$db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='prom23_payments'");if(!$q->fetchColumn())return false;
        $c=$this->config['payment']??[];$prefix=$c['orderPrefix']??'';$env=$c['environment']??'';
        if(!preg_match('/^[A-Za-z0-9_-]{3,40}$/D',$prefix)||!in_array($env,['sandbox','production'],true))return false;
        foreach($order->getPaymentCollection()as$p){if($p->isInner()||$p->isPaid()||(int)$p->getPaymentSystemId()!==14)continue;
            $scope=hash('sha256',$env.'|'.$prefix.'-'.$order->getId().'-'.$p->getId());
            $q=$db->prepare('SELECT owner FROM prom23_payments WHERE scope=?');$q->execute([$scope]);$owner=$q->fetchColumn();
            if(is_string($owner)&&hash_equals($owner,hash('sha256',$actor['userId'].'|'.($actor['organizationId']??0))))return true;
        }return false;
    }
    public function run(string $operation,array $payload,array $actor): array {
        if($operation==='publications.read')return $this->publications($payload,$actor);
        if(!$actor['userId'])throw new RuntimeExceptionCode('AUTH_REQUIRED',401);$kind=$payload['kind']??'';
        if($kind==='orders')return ['orders'=>$this->orders($payload,$actor)];
        if($kind==='addresses')$records=$this->addresses($actor);
        elseif($kind==='organizations')$records=$this->organizations($actor);
        elseif(in_array($kind,['requisites','bank','staff'],true))$records=$this->organizationInfo($kind,$actor);
        elseif(in_array($kind,['appeals','returns'],true))$records=$this->serviceRecords($kind,$actor);
        elseif($kind==='sessions')$records=$this->sessions($actor);
        elseif($kind==='payment-methods')$records=$this->cards($actor);
        elseif($kind==='waiting-list')$records=$this->waiting($actor);
        elseif(in_array($kind,['profile','contacts','security'],true)){
            $user=\CUser::GetByID($actor['userId'])->Fetch();Protocol::activeUser($user);$details=[];$fields=$kind==='profile'?['Имя'=>'NAME','Фамилия'=>'LAST_NAME','Город'=>'PERSONAL_CITY']:['Почта'=>'EMAIL','Телефон'=>'UF_PHONE'];foreach($fields as $label=>$code)$details[]=self::detail($label,$user[$code]??'');$records=[['id'=>(string)$actor['userId'],'title'=>'Личные данные','details'=>$details]];
        }elseif(in_array($kind,['reviews','questions'],true)){
            $publicationKind=$kind==='reviews'?'review':'question';$rows=$this->publicationRows($publicationKind,['=UF_ACTIVE'=>true,'=UF_USER_ID'=>$actor['userId'],'=UF_ORGANIZATION_ID'=>$actor['organizationId']?:false],501);$records=[];
            foreach($rows as $row){$id=(string)$row['ID'];$target=['productId'=>'prom-'.$row['UF_TARGET_ID'],$publicationKind.'Id'=>$id];$records[]=['id'=>$id,'title'=>self::text($row['UF_TEXT'],300),'details'=>[self::detail('Дата',$row['UF_DATE'])],'actions'=>[self::action('Изменить',$publicationKind.'-edit',$target),self::action('Удалить',$publicationKind.'-delete',$target)]];}
        }else throw new RuntimeExceptionCode($kind==='documents'?'DOCUMENT_DOWNLOAD_ADAPTER_REQUIRED':'NOT_FOUND',$kind==='documents'?503:404);
        if(count($records)>500)throw new RuntimeExceptionCode('WORKSPACE_PAGINATION_REQUIRED');return ['available'=>true,'records'=>$records];
    }
}
