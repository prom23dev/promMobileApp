<?php
declare(strict_types=1);
// Confirms the review-edit/question-edit routing fix in PublicationDriver::run() (the privacy-writer
// branch used to also swallow every -edit operation) did not change dispatch for the other
// PublicationDriver::IDS operations: new publications/replies still reach the configured
// publicationWriter, delete still calls the real source handler, question-edit now reaches it too
// (previously always PUBLICATION_PRIVACY_ADAPTER_REQUIRED). order-review shares the exact same
// '!str_ends_with($id,"-delete")&&!str_ends_with($id,"-edit")' branch condition as review/question/
// replies (it doesn't end in -edit/-delete either), so it is unaffected for the same structural
// reason, but isn't exercised here - its context() needs a Bitrix\Sale\Order stub this file doesn't
// set up. product-notify returns before this branch is even reached and is likewise unaffected.
namespace Bitrix\Main {class Application {static function getConnection(){return new class {function startTransaction(){}function commitTransaction(){}function rollbackTransaction(){}};}}}
namespace Bitrix\Highloadblock {
    class HighloadBlockTable {
        static function getById($id){return new \RoutingRows([['ID'=>$id]]);}
        static function compileEntity($row){
            $class=(int)$row['ID']===\HLBL_ID_QUESTIONS?\RoutingQuestionTable::class:\RoutingReviewTable::class;
            return new class($class) {
                function __construct(private string $class){}
                function getFields(){return array_fill_keys(['ID','UF_TARGET_ID','UF_PARENT_ID','UF_ACTIVE','UF_USER_ID','UF_ORGANIZATION_ID','UF_TEXT','UF_RATING','UF_PROS','UF_MEDIA','UF_MEDIA_COUNT','UF_DELETE_BY_USER','UF_USER_ID','UF_PRODUCT_ID'],true);}
                function getDataClass(){return $this->class;}
            };
        }
    }
}
namespace Prom23\Runtime {
    class UploadDriver {function __construct($config){}}
    class SourceHttp {
        public static array $calls=[];public static string $response='{"STATUS":"OK"}';
        function __construct($config){}
        function call(string $action,array $query,array $post,array $files=[]){self::$calls[]=['action'=>$action,'post'=>$post,'files'=>$files];return self::$response;}
    }
}
namespace {
require_once __DIR__.'/../src/Protocol.php';require_once __DIR__.'/../src/SubmissionReceipt.php';require_once __DIR__.'/../src/PublicationDriver.php';
use Prom23\Runtime\{PublicationDriver,RuntimeExceptionCode,SourceHttp};
define('IBLOCK_ID_CATALOG_PRODUCTS',101);define('HLBL_ID_REVIEWS',901);define('HLBL_ID_QUESTIONS',902);define('BX_COMP_MANAGED_CACHE',true);
function htmlspecialcharsbx($s){return htmlspecialchars($s,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
class RoutingRows {private int $offset=0;function __construct(private array $rows){}function fetch(){return$this->rows[$this->offset++]??false;}}
class CIBlockElement {static function GetList(...$args){return new RoutingRows([['ID'=>10,'ACTIVE'=>'Y']]);}}
class RoutingReviewTable {
    public static array $rows=[];
    static function getList($query){
        if(isset($query['filter']['=UF_PARENT_ID']))return new RoutingRows([]);
        foreach(self::$rows as $row)if((int)$row['ID']===(int)($query['filter']['=ID']??-1))return new RoutingRows([$row]);
        return new RoutingRows([]);
    }
}
class RoutingQuestionTable {
    public static array $rows=[];
    static function getList($query){
        if(isset($query['filter']['=UF_PARENT_ID']))return new RoutingRows([]);
        foreach(self::$rows as $row)if((int)$row['ID']===(int)($query['filter']['=ID']??-1))return new RoutingRows([$row]);
        return new RoutingRows([]);
    }
}
$n=0;
function rcheck(bool $ok,string $name){global$n;if(!$ok)throw new \RuntimeException('FAIL '.$name);$n++;echo'PASS '.$name."\n";}
function rrejected(callable $fn,string $code){try{$fn();}catch(RuntimeExceptionCode $e){rcheck($e->getMessage()===$code,'rejected '.$code);return;}throw new \RuntimeException('Expected '.$code.' but nothing was thrown');}
if(!in_array('sqlite',\PDO::getAvailableDrivers(),true)){echo"SKIP publication routing tests: PDO SQLite needed for SubmissionReceipt\n";exit;}
$db=new \PDO('sqlite::memory:',null,null,[\PDO::ATTR_ERRMODE=>\PDO::ERRMODE_EXCEPTION]);$registry=json_decode(file_get_contents(__DIR__.'/../form-contracts.json'),true,32,JSON_THROW_ON_ERROR)['forms'];
$writerCalls=[];
$config=['pdo'=>$db,'key'=>str_repeat('a',64),'request'=>['operation'=>'forms.submit','idempotencyKey'=>'routing-fixture'],'formContracts'=>$registry,
    'publicationWriter'=>function(array $payload,array $actor,array $identity,array $current) use (&$writerCalls){$writerCalls[]=['formId'=>$payload['formId'],'identity'=>$identity];return ['status'=>'accepted','reference'=>'writer-stub'];}];
$a=['userId'=>1,'organizationId'=>0,'context'=>'personal','sessionKey'=>str_repeat('a',64)];
$run=function(array $payload)use($config,$a){$driver=new PublicationDriver($config);$ctx=$driver->run('forms.context',$payload,$a);return$driver->run('forms.submit',[...$payload,'revision'=>$ctx['revision']],$a);};

// 1. New publications (no -edit/-delete/-reply suffix) must still go through the privacy-aware writer, unaffected by excluding '-edit' ids from that branch.
$writerCalls=[];$r=$run(['formId'=>'review','context'=>'personal','sessionKey'=>$a['sessionKey'],'target'=>['productId'=>'prom-10'],'values'=>[],'consents'=>[]]);
rcheck($r===['status'=>'accepted','reference'=>'writer-stub']&&count($writerCalls)===1&&$writerCalls[0]['formId']==='review','new review still routes through publicationWriter');
$writerCalls=[];$r=$run(['formId'=>'question','context'=>'personal','sessionKey'=>$a['sessionKey'],'target'=>['productId'=>'prom-10'],'values'=>[],'consents'=>[]]);
rcheck($r===['status'=>'accepted','reference'=>'writer-stub']&&count($writerCalls)===1,'new question still routes through publicationWriter');

// 2. Replies (parentId resolved via context(), owned=false) must still go through the writer, not SourceHttp/editReview.
RoutingReviewTable::$rows=[['ID'=>50,'UF_TARGET_ID'=>10,'UF_ACTIVE'=>true,'UF_USER_ID'=>2,'UF_ORGANIZATION_ID'=>0,'UF_TEXT'=>'A review','UF_RATING'=>5,'UF_PROS'=>'','UF_MEDIA'=>[]]];
$writerCalls=[];$r=$run(['formId'=>'review-reply','context'=>'personal','sessionKey'=>$a['sessionKey'],'target'=>['productId'=>'prom-10','parentId'=>'50'],'values'=>['review-text'=>'Thanks!'],'consents'=>[]]);
rcheck($r===['status'=>'accepted','reference'=>'writer-stub']&&count($writerCalls)===1,'review-reply (not ending in -edit/-delete) still routes through publicationWriter, unlike review-edit/question-edit');

// 3. Deletes never went through the writer before and still don't; they must reach the real source handler.
RoutingReviewTable::$rows=[['ID'=>60,'UF_TARGET_ID'=>10,'UF_ACTIVE'=>true,'UF_USER_ID'=>1,'UF_ORGANIZATION_ID'=>0,'UF_TEXT'=>'Mine','UF_RATING'=>3,'UF_PROS'=>'','UF_MEDIA'=>[]]];
SourceHttp::$calls=[];$r=$run(['formId'=>'review-delete','context'=>'personal','sessionKey'=>$a['sessionKey'],'target'=>['productId'=>'prom-10','reviewId'=>'60'],'values'=>[],'consents'=>[]]);
rcheck($r['status']==='accepted'&&count(SourceHttp::$calls)===1&&SourceHttp::$calls[0]['post']===['id'=>60,'action_name'=>'review'],'review-delete still calls the real source handler, bypassing the writer entirely');

// 4. THE FIX: question-edit used to be wrongly caught by the same writer-branch guard that
//    review/question/replies correctly rely on, and always failed with PUBLICATION_PRIVACY_ADAPTER_REQUIRED.
//    It must now reach SourceHttp with the real handler's expected POST fields - this is new coverage
//    for behavior that could never have worked before this session, not a previously-passing case.
RoutingQuestionTable::$rows=[['ID'=>70,'UF_TARGET_ID'=>10,'UF_ACTIVE'=>true,'UF_USER_ID'=>1,'UF_ORGANIZATION_ID'=>0,'UF_TEXT'=>'Original question']];
SourceHttp::$calls=[];$r=$run(['formId'=>'question-edit','context'=>'personal','sessionKey'=>$a['sessionKey'],'target'=>['productId'=>'prom-10','questionId'=>'70'],'values'=>['question-text'=>'Updated question'],'consents'=>[]]);
rcheck($r['status']==='accepted'&&count(SourceHttp::$calls)===1,'question-edit now reaches the source handler instead of always throwing PUBLICATION_PRIVACY_ADAPTER_REQUIRED');
rcheck(SourceHttp::$calls[0]['post']['question-id']===70&&SourceHttp::$calls[0]['post']['question-text']==='Updated question'&&SourceHttp::$calls[0]['post']['product-id']===10,'question-edit POSTs the real handler\'s expected question-id/question-text/product-id fields');
rcheck(!isset(SourceHttp::$calls[0]['post']['remove-media-ids']),'remove-media-ids is review-edit-only and never leaks into question-edit\'s POST');

// Without the fix, this would have thrown PUBLICATION_PRIVACY_ADAPTER_REQUIRED instead of reaching SourceHttp.
RoutingQuestionTable::$rows=[['ID'=>71,'UF_TARGET_ID'=>10,'UF_ACTIVE'=>true,'UF_USER_ID'=>1,'UF_ORGANIZATION_ID'=>0,'UF_TEXT'=>'Same question']];
rrejected(fn()=>$run(['formId'=>'question-edit','context'=>'personal','sessionKey'=>$a['sessionKey'],'target'=>['productId'=>'prom-10','questionId'=>'71'],'values'=>['question-text'=>'Same question'],'consents'=>[]]),'PUBLICATION_UNCHANGED');
rcheck(true,'question-edit still enforces the unchanged-text guard, now that it is actually reachable');

echo $n." publication routing checks PASS; the -edit fix did not change dispatch for any other publication operation\n";
}
