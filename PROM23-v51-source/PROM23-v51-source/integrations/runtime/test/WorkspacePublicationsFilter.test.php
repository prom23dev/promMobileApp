<?php
declare(strict_types=1);
// Regression test for a bug found while researching Этап 8 (Publications) against the real
// product.reviews.list/product.questions.list components (prom23marketplace):
//
// Before this fix, WorkspaceDriver::publications() fetched candidate rows (both root items and
// their replies) in a single query using one shared $filter, and that $filter included the
// optional `rating` restriction whenever one was requested. A reply has no UF_RATING of its own
// (it is not itself a 1-5 star review), so a rating filter would silently exclude replies that
// belonged to a review matching the filter, making that review look reply-less - breaking both
// the returned `replies` array and the `withReplies` filter for any request that combined
// `rating` with `withReplies`. The real `product.reviews.list` component (class.php
// getReviewsWithReplies()) avoids this: it looks up "has replies" via a *separate*, unfiltered
// reply query, never reusing the rating-scoped root filter.
//
// Also: `withReplies` used to be gated to `$kind==='review'` only, due to how the `&&`/`||`
// operators in the single combined condition grouped (`$kind==='review' && (A || B)`), so it
// silently had zero effect on questions. There is no real-site parity reason for that split -
// questions and reviews are merged into one feed/pager by this driver's own design (the real
// site renders them as two separate pages with unrelated filter sets), so a filter with no
// kind-specific name should apply to both kinds it is given for.
namespace Bitrix\Highloadblock {
    class HighloadBlockTable {
        static function getById($id){return new \WPFRows([['ID'=>$id]]);}
        static function compileEntity($row){
            $class=(int)$row['ID']===\HLBL_ID_QUESTIONS?\WPFQuestionTable::class:\WPFReviewTable::class;
            return new class($class) {
                function __construct(private string $class){}
                function getFields(){return array_fill_keys(['ID','UF_TARGET_ID','UF_PARENT_ID','UF_ACTIVE','UF_USER_ID','UF_ORGANIZATION_ID','UF_AUTHOR_NAME','UF_TEXT','UF_DATE','UF_RATING','UF_MEDIA','UF_SKIP_RATE'],true);}
                function getDataClass(){return $this->class;}
            };
        }
    }
}
namespace {
require_once __DIR__.'/../src/Protocol.php';require_once __DIR__.'/../src/WorkspaceDriver.php';
use Prom23\Runtime\{WorkspaceDriver,RuntimeExceptionCode};
define('IBLOCK_ID_CATALOG_PRODUCTS',101);define('HLBL_ID_REVIEWS',901);define('HLBL_ID_QUESTIONS',902);
class WPFRows {private int $offset=0;function __construct(private array $rows){}function fetch(){return$this->rows[$this->offset++]??false;}}
class CIBlockElement {static function GetList(...$args){return new WPFRows([['ID'=>10,'ACTIVE'=>'Y']]);}}

/** Filters rows the same way a real D7 ::getList(['filter'=>...]) would, for the subset of filter keys this test uses. */
function wpf_apply(array $rows,array $filter): array {
    return array_values(array_filter($rows,static function($row) use ($filter) {
        foreach ($filter as $key=>$value) {
            if ($key==='=UF_TARGET_ID'&&(int)$row['UF_TARGET_ID']!==$value) return false;
            if ($key==='=UF_ACTIVE'&&(bool)$row['UF_ACTIVE']!==$value) return false;
            if ($key==='=UF_SKIP_RATE'&&(bool)($row['UF_SKIP_RATE']??false)!==$value) return false;
            if ($key==='=UF_RATING'&&(int)($row['UF_RATING']??0)!==$value) return false;
            if ($key==='=UF_PARENT_ID'&&(bool)($row['UF_PARENT_ID']??0)!==$value) return false;
            if ($key==='@UF_PARENT_ID'&&!in_array((int)($row['UF_PARENT_ID']??0),$value,true)) return false;
        }
        return true;
    }));
}
class WPFReviewTable {
    public static array $rows=[];
    static function getList($query){return new WPFRows(wpf_apply(self::$rows,$query['filter']??[]));}
}
class WPFQuestionTable {
    public static array $rows=[];
    static function getList($query){return new WPFRows(wpf_apply(self::$rows,$query['filter']??[]));}
}
$n=0;
function wcheck(bool $ok,string $name){global$n;if(!$ok)throw new \RuntimeException('FAIL '.$name);$n++;echo'PASS '.$name."\n";}

$config=['formContracts'=>[]];
$driver=new WorkspaceDriver($config);
$run=function(array $filters) use ($driver) {
    return (new \ReflectionClass($driver))->getMethod('publications')->invoke($driver,['productId'=>'prom-10','filters'=>$filters],['userId'=>0,'organizationId'=>0]);
};

// Review #1 (5 stars) has a reply. Review #2 (3 stars) has no reply.
WPFReviewTable::$rows=[
    ['ID'=>1,'UF_TARGET_ID'=>10,'UF_PARENT_ID'=>0,'UF_ACTIVE'=>true,'UF_SKIP_RATE'=>false,'UF_RATING'=>5,'UF_AUTHOR_NAME'=>'A','UF_TEXT'=>'Great','UF_DATE'=>'2026-01-01','UF_MEDIA'=>[]],
    ['ID'=>2,'UF_TARGET_ID'=>10,'UF_PARENT_ID'=>0,'UF_ACTIVE'=>true,'UF_SKIP_RATE'=>false,'UF_RATING'=>3,'UF_AUTHOR_NAME'=>'B','UF_TEXT'=>'Ok','UF_DATE'=>'2026-01-02','UF_MEDIA'=>[]],
    ['ID'=>3,'UF_TARGET_ID'=>10,'UF_PARENT_ID'=>1,'UF_ACTIVE'=>true,'UF_SKIP_RATE'=>false,'UF_RATING'=>0,'UF_AUTHOR_NAME'=>'Seller','UF_TEXT'=>'Thanks!','UF_DATE'=>'2026-01-03','UF_MEDIA'=>[]],
];
WPFQuestionTable::$rows=[
    ['ID'=>201,'UF_TARGET_ID'=>10,'UF_PARENT_ID'=>0,'UF_ACTIVE'=>true,'UF_AUTHOR_NAME'=>'C','UF_TEXT'=>'When in stock?','UF_DATE'=>'2026-01-04'],
    ['ID'=>202,'UF_TARGET_ID'=>10,'UF_PARENT_ID'=>201,'UF_ACTIVE'=>true,'UF_AUTHOR_NAME'=>'Seller','UF_TEXT'=>'Next week.','UF_DATE'=>'2026-01-05'],
];

// Bug repro: rating=5 (matches review #1, which has the reply) combined with withReplies=true.
// Before the fix, the reply-grouping query reused the rating-scoped filter, so the reply (UF_RATING=0)
// never matched '=UF_RATING'=>5 and review #1 looked reply-less, failing the withReplies filter entirely.
// 'rating' only ever scopes the review root filter (publications() line ~111: `$kind==='review'&&isset($f['rating'])`)
// - questions have no UF_RATING at all, so question #201 (which has its own reply) legitimately still
// passes withReplies here too; this is the documented behavior at the top of this file, not a second bug.
$result=$run(['rating'=>5,'withReplies'=>true]);
wcheck(count($result['items'])===2,'rating+withReplies: both review #1 (5★, has a reply) and question #201 (unaffected by rating) are returned');
$review1=null;foreach($result['items'] as $item)if($item['id']==='1')$review1=$item;
wcheck($review1!==null,'rating+withReplies: review #1 is among the returned items');
wcheck(count($review1['replies'])===1&&$review1['replies'][0]['text']==='Thanks!','rating+withReplies: the reply text is actually attached, not dropped by the rating filter');

// Without any filter, both reviews are present and review #1 still carries its reply.
$result=$run([]);
$byId=[];foreach($result['items'] as $item)$byId[$item['id']]=$item;
wcheck(count($result['items'])===3,'no filter: both reviews and the question are returned (3 root items)');
wcheck(count($byId['1']['replies'])===1,'no filter: review #1 still has its reply attached');
wcheck(count($byId['2']['replies'])===0,'no filter: review #2 (no reply) has an empty replies array');

// withReplies alone (no rating) must also keep the question with a reply, not just reviews -
// this filter has no kind-specific name, so it should not silently skip questions.
$result=$run(['withReplies'=>true]);
$ids=array_column($result['items'],'id');
wcheck(in_array('1',$ids,true)&&in_array('201',$ids,true)&&!in_array('2',$ids,true),'withReplies applies to both reviews and questions, not just reviews');

echo $n." workspace publications filter checks PASS\n";
}
