<?php
declare(strict_types=1);
namespace Bitrix\Main {class Application {static function getConnection(){return $GLOBALS['reviewConnection'];}}}
namespace Bitrix\Highloadblock {
    class HighloadBlockTable {
        static function getById($id){return new \ReviewRows([['ID'=>$id]]);}
        static function compileEntity($row){return new class {function getFields(){return array_fill_keys(array_keys(\ReviewTable::$row),true);}function getDataClass(){return \ReviewTable::class;}};}
    }
}
namespace Prom\Model {class Reviews {public static array $cleared=[];static function clearCache($user=null,$org=null){self::$cleared[]=[$user,$org];}}}
namespace Prom23\Runtime {
    class UploadDriver {public static array $files=[];function __construct($config){}function resolve($p,$field,$token){if(!isset(self::$files[$token]))throw new RuntimeExceptionCode('FORBIDDEN',403);return self::$files[$token];}}
    class SourceHttp {function __construct($config){}function call(...$args){throw new \RuntimeException('Review edit must not call source HTTP');}}
}
namespace {
require_once __DIR__.'/../src/Protocol.php';require_once __DIR__.'/../src/SubmissionReceipt.php';require_once __DIR__.'/../src/PublicationDriver.php';
use Prom23\Runtime\{PublicationDriver,RuntimeExceptionCode,UploadDriver};
define('IBLOCK_ID_CATALOG_PRODUCTS',101);define('HLBL_ID_REVIEWS',901);define('BX_COMP_MANAGED_CACHE',true);
function htmlspecialcharsbx($s){return htmlspecialchars($s,ENT_QUOTES|ENT_SUBSTITUTE,'UTF-8');}
class ReviewRows {private int $offset=0;function __construct(private array $rows){}function fetch(){return$this->rows[$this->offset++]??false;}}
class CIBlockElement {static function GetList(...$args){return new ReviewRows([['ID'=>10,'ACTIVE'=>'Y']]);}}
class CFile {
    static function IsImage($name,$type){return in_array($type,['image/jpeg','image/png'],true);}
    static function MakeFileArray(...$args){throw new \RuntimeException('Existing media must never be reuploaded');}
    // Read for the review-edit existingMedia preview (context() -> WorkspaceDriver::media()), never for the
    // write path itself - odd IDs are the fixture's image, even IDs its video, matching resetReview()'s [201,202].
    static function GetFileArray($id){return ['CONTENT_TYPE'=>$id%2===0?'video/mp4':'image/jpeg','SRC'=>'/upload/test-'.$id.($id%2===0?'.mp4':'.jpg')];}
    static function Delete(...$args){throw new \RuntimeException('Existing media must never be deleted');}
}
class ReviewTable {
    public static array $row=[];public static bool $replies=false;public static array $updates=[];public static bool $fail=false;public static bool $dropMedia=false;public static int $newFiles=0;
    static function getList($query){
        if(isset($query['filter']['=UF_PARENT_ID']))return new ReviewRows(self::$replies?[['ID'=>200,'UF_ACTIVE'=>true]]:[]);
        return new ReviewRows([array_intersect_key(self::$row,array_flip($query['select']??array_keys(self::$row)))]);
    }
    static function update($id,$data){self::$updates[]=$data;
        if(!self::$fail){if(isset($data['UF_MEDIA'])){$media=[];foreach($data['UF_MEDIA']as$v)$media[]=is_array($v)?900+(++self::$newFiles):$v;$data['UF_MEDIA']=$media;}self::$row=array_replace(self::$row,$data);if(self::$dropMedia)self::$row['UF_MEDIA']=[];}
        return new class {function isSuccess(){return !ReviewTable::$fail;}};
    }
}
class ReviewConnection {
    public $onStart=null;private array $saved=[];public int $commits=0;public int $rollbacks=0;
    function startTransaction(){if($this->onStart){($this->onStart)();$this->onStart=null;}$this->saved=ReviewTable::$row;}
    function commitTransaction(){$this->commits++;}
    function rollbackTransaction(){ReviewTable::$row=$this->saved;$this->rollbacks++;}
}
$GLOBALS['reviewConnection']=new ReviewConnection;$GLOBALS['CACHE_MANAGER']=new class {public array $tags=[];function ClearByTag($tag){$this->tags[]=$tag;}};
$n=0;
function mcheck(bool $ok,string $name){global$n;if(!$ok)throw new \RuntimeException('FAIL '.$name);$n++;echo'PASS '.$name."\n";}
function mrejected(callable $fn,string $code){try{$fn();}catch(RuntimeExceptionCode $e){mcheck($e->getMessage()===$code,'rejected '.$code);return;}throw new \RuntimeException('Expected '.$code);}
function resetReview(){ReviewTable::$row=['ID'=>99,'UF_TARGET_ID'=>10,'UF_ACTIVE'=>true,'UF_USER_ID'=>1,'UF_ORGANIZATION_ID'=>0,'UF_TEXT'=>'Original text','UF_RATING'=>4,'UF_PROS'=>'','UF_MEDIA'=>[201,202],'UF_MEDIA_COUNT'=>2,'UF_PARENT_ID'=>0,'UF_DELETE_BY_USER'=>false,'UF_AUTHOR_NAME'=>'Original author','UF_CITY'=>'Original city','UF_DATE'=>'2025-01-01'];ReviewTable::$replies=false;ReviewTable::$updates=[];ReviewTable::$newFiles=0;ReviewTable::$fail=false;ReviewTable::$dropMedia=false;$GLOBALS['reviewConnection']=new ReviewConnection;\Prom\Model\Reviews::$cleared=[];}
if(!in_array('sqlite',\PDO::getAvailableDrivers(),true)){echo"SKIP review edit model tests: PDO SQLite needed for real SubmissionReceipt; no source writes\n";exit;}
$db=new \PDO('sqlite::memory:',null,null,[\PDO::ATTR_ERRMODE=>\PDO::ERRMODE_EXCEPTION]);$registry=json_decode(file_get_contents(__DIR__.'/../form-contracts.json'),true,32,JSON_THROW_ON_ERROR)['forms'];
$config=['pdo'=>$db,'key'=>str_repeat('a',64),'request'=>['operation'=>'forms.submit','idempotencyKey'=>'review-media-fixture'],'formContracts'=>$registry,'sourceOrigin'=>'https://prom23.ru','sourceAllowedOrigins'=>['https://prom23.ru']];
$driver=new PublicationDriver($config);$a=['userId'=>1,'organizationId'=>0,'context'=>'personal','sessionKey'=>str_repeat('a',64)];
$p=['formId'=>'review-edit','context'=>'personal','sessionKey'=>$a['sessionKey'],'target'=>['productId'=>'prom-10','reviewId'=>'99'],'values'=>['rate'=>'5','review-text'=>'Changed & preserved'],'consents'=>[]];
$run=function(array $payload)use($driver,$a){$ctx=$driver->run('forms.context',$payload,$a);return$driver->run('forms.submit',[...$payload,'revision'=>$ctx['revision']],$a);};
resetReview();$ctx0=$driver->run('forms.context',$p,$a);
mcheck($ctx0['initialValues']['existingMedia']===[['id'=>'201','kind'=>'image','url'=>'https://prom23.ru/upload/test-201.jpg','alt'=>'Материал покупателя'],['id'=>'202','kind'=>'video','url'=>'https://prom23.ru/upload/test-202.mp4','alt'=>'Материал покупателя']],'forms.context exposes the owned review\'s current media for selective removal, source has no such view');
resetReview();$r=$run($p);
mcheck($r['status']==='accepted'&&str_starts_with($r['reference'],'receipt-'),'real review update has durable acknowledgement');
mcheck(ReviewTable::$row['UF_MEDIA']===[201,202]&&!array_key_exists('UF_MEDIA',ReviewTable::$updates[0]),'text-only edit does not touch original image201 or video202');
mcheck(ReviewTable::$newFiles===0&&ReviewTable::$row['UF_MEDIA_COUNT']===2,'no old file copy/delete and count preserved');
mcheck(ReviewTable::$row['UF_TEXT']==='Changed &amp; preserved'&&ReviewTable::$row['UF_RATING']===5&&ReviewTable::$row['UF_ACTIVE']===0,'source escaping, rating and premoderation retained');
mcheck(ReviewTable::$row['UF_CITY']==='Original city'&&ReviewTable::$row['UF_AUTHOR_NAME']==='Original author'&&ReviewTable::$row['UF_PARENT_ID']===0,'editing text preserves original identity metadata');
mcheck(\Prom\Model\Reviews::$cleared===[[1,null]]&&in_array('hlblock_id_901',$GLOBALS['CACHE_MANAGER']->tags,true),'source user and managed cache invalidated');
mcheck((int)$db->query('SELECT entity_id FROM prom23_submission_receipts LIMIT 1')->fetchColumn()===99,'receipt records the actual review ID');
$png=tempnam(sys_get_temp_dir(),'prom23-review-image-');file_put_contents($png,base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j9N8AAAAASUVORK5CYII='));chmod($png,0600);
try{
    UploadDriver::$files=['image-token'=>['tmp_name'=>$png,'name'=>'fixture.png','type'=>'image/png','size'=>filesize($png),'error'=>UPLOAD_ERR_OK]];
    resetReview();$run([...$p,'values'=>[...$p['values'],'media[]'=>[['uploadToken'=>'image-token']]]]);
    mcheck(ReviewTable::$row['UF_MEDIA']===[201,202,901]&&ReviewTable::$row['UF_MEDIA_COUNT']===3,'new image appends to owned existing image and video IDs');
    mcheck(ReviewTable::$newFiles===1&&ReviewTable::$updates[0]['UF_MEDIA'][0]===201&&ReviewTable::$updates[0]['UF_MEDIA'][1]===202,'only new image is an upload array');
    resetReview();ReviewTable::$row['UF_MEDIA']=range(201,210);ReviewTable::$row['UF_MEDIA_COUNT']=10;mrejected(fn()=>$run([...$p,'values'=>[...$p['values'],'media[]'=>[['uploadToken'=>'image-token']]]]),'UPLOAD_LIMIT');mcheck(ReviewTable::$updates===[],'existing files count toward source ten-file limit for additions');
    UploadDriver::$files['video-token']=[...UploadDriver::$files['image-token'],'name'=>'new.mp4','type'=>'video/mp4'];
    resetReview();mrejected(fn()=>$run([...$p,'values'=>[...$p['values'],'media[]'=>[['uploadToken'=>'video-token']]]]),'VALIDATION_ERROR');mcheck(ReviewTable::$updates===[],'new videos remain disallowed by edit form');
    resetReview();ReviewTable::$row['UF_USER_ID']=2;mrejected(fn()=>$run($p),'NOT_FOUND');mcheck(ReviewTable::$updates===[],'foreign review never updated');
    resetReview();ReviewTable::$row['UF_ORGANIZATION_ID']=3;mrejected(fn()=>$run($p),'NOT_FOUND');
    resetReview();$ctx=$driver->run('forms.context',$p,$a);ReviewTable::$row['UF_TEXT']='Concurrent text';mrejected(fn()=>$driver->run('forms.submit',[...$p,'revision'=>$ctx['revision']],$a),'STALE_CONTEXT');mcheck(ReviewTable::$updates===[],'stale revision has no write');
    resetReview();$GLOBALS['reviewConnection']->onStart=static function(){ReviewTable::$row['UF_TEXT']='Late concurrent text';};mrejected(fn()=>$run($p),'STALE_CONTEXT');mcheck(ReviewTable::$updates===[]&&ReviewTable::$row['UF_TEXT']==='Late concurrent text','fresh revision is checked again immediately before write');
    resetReview();$GLOBALS['reviewConnection']->onStart=static function(){ReviewTable::$row['UF_USER_ID']=2;};mrejected(fn()=>$run($p),'NOT_FOUND');mcheck(ReviewTable::$updates===[],'late ownership change has no write');
    resetReview();$GLOBALS['reviewConnection']->onStart=static function(){ReviewTable::$replies=true;};mrejected(fn()=>$run($p),'PUBLICATION_HAS_REPLIES');mcheck(ReviewTable::$updates===[],'late reply prevents edit');
    resetReview();ReviewTable::$fail=true;mrejected(fn()=>$run($p),'SOURCE_UPDATE_FAILED');mcheck(ReviewTable::$row['UF_MEDIA']===[201,202]&&$GLOBALS['reviewConnection']->commits===0,'failed HL result rolls back');
    resetReview();ReviewTable::$dropMedia=true;mrejected(fn()=>$run($p),'RESULT_RECONCILIATION_REQUIRED');mcheck(ReviewTable::$row['UF_MEDIA']===[201,202]&&$GLOBALS['reviewConnection']->commits===0,'postcondition rejects an ORM that loses existing files');
    resetReview();ReviewTable::$row['UF_DELETE_BY_USER']=true;mrejected(fn()=>$run($p),'NOT_FOUND');mcheck(ReviewTable::$updates===[],'deleted review never updated');
    $unchanged=['rate'=>'4','review-text'=>'Original text'];
    resetReview();$run([...$p,'values'=>[...$unchanged,'remove-media-ids'=>['201']]]);
    mcheck(ReviewTable::$row['UF_MEDIA']===[202]&&ReviewTable::$row['UF_MEDIA_COUNT']===1,'selective removal keeps only the unselected owned media id, source never offers this');
    resetReview();$run([...$p,'values'=>[...$unchanged,'remove-media-ids'=>['201'],'media[]'=>[['uploadToken'=>'image-token']]]]);
    mcheck(ReviewTable::$row['UF_MEDIA']===[202,901]&&ReviewTable::$row['UF_MEDIA_COUNT']===2,'removal and a new upload combine: kept owned id first, then the new file');
    resetReview();mrejected(fn()=>$run([...$p,'values'=>$unchanged]),'PUBLICATION_UNCHANGED');mcheck(ReviewTable::$updates===[],'unchanged text alone with no media change still rejects');
    resetReview();mrejected(fn()=>$run([...$p,'values'=>[...$unchanged,'remove-media-ids'=>['999']]]),'VALIDATION_ERROR');mcheck(ReviewTable::$updates===[],'a media id not owned by this review cannot be targeted for removal');
    resetReview();ReviewTable::$row['UF_MEDIA']=range(201,210);ReviewTable::$row['UF_MEDIA_COUNT']=10;
    mrejected(fn()=>$run([...$p,'values'=>[...$unchanged,'remove-media-ids'=>['201'],'media[]'=>[['uploadToken'=>'image-token'],['uploadToken'=>'image-token']]]]),'UPLOAD_LIMIT');
    mcheck(ReviewTable::$updates===[],'kept-plus-new total still enforces the source ten-file cap after selective removal');
}finally{unlink($png);}
echo$n." review edit media model checks PASS; no Bitrix runtime/source HTTP/live media writes\n";
}
