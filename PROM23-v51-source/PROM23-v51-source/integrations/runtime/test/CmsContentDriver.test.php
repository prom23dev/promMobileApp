<?php
declare(strict_types=1);
require_once __DIR__.'/../src/Protocol.php';
require_once __DIR__.'/../src/CmsContentDriver.php';
use Prom23\Runtime\{CmsContentDriver,RuntimeExceptionCode};
$count=0;
function assertCms(bool $value,string $name):void{global$count;if(!$value)throw new RuntimeException('FAIL '.$name);$count++;}
function rejectCms(callable $fn,string $code):void{try{$fn();}catch(RuntimeExceptionCode $e){assertCms($e->getMessage()===$code,'expected '.$code);return;}throw new RuntimeException('Expected rejection '.$code);}

$root=sys_get_temp_dir().'/prom23-cms-'.bin2hex(random_bytes(8));
mkdir($root.'/privacy-policy',0700,true);
// Fixture mirrors privacy-policy/index.php's real shape confirmed 2026-10-09: a <ul> with some
// <li> wrapping a <p> (the common case) and some <li> with raw bullet text and no <p> child at
// all (lines ~528-612 in the real file) — the bug this fixture guards against is the latter
// silently vanishing from the extracted content.
file_put_contents($root.'/privacy-policy/index.php', <<<'PHP'
<?php require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php"); ?>
<div class="container"><div class="header-policy">
<h1>ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ</h1>
<p>Вводный абзац политики.</p>
<h3>1. ОБЩИЕ ПОЛОЖЕНИЯ</h3>
<p>Текст первого раздела.</p>
<ul>
    <li><p>Пункт с обёрткой p.</p></li>
    <li>
        • факты добавления товаров в корзину и в «Избранное»;
    </li>
</ul>
</div></div>
<?php require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php"); ?>
PHP);

$config=['siteRoot'=>$root,'pages'=>['privacy'=>['type'=>'static-template','file'=>'privacy-policy/index.php','sourceUrl'=>'https://prom.myfast.space/privacy-policy/']]];
$driver=new CmsContentDriver($config);
$page=$driver->page('privacy');
assertCms($page['title']==='ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ','own <h1> becomes the title, not a body paragraph');
$paragraphs=$page['sections'][0]['paragraphs'];
assertCms(in_array('Вводный абзац политики.',$paragraphs,true),'ordinary <p> paragraph is kept');
assertCms(in_array('1. ОБЩИЕ ПОЛОЖЕНИЯ',$paragraphs,true),'<h3> heading text is kept as its own paragraph');
assertCms(in_array('Пункт с обёрткой p.',$paragraphs,true),'<li><p>…</p></li> still yields exactly one paragraph, not a duplicate');
assertCms(in_array('• факты добавления товаров в корзину и в «Избранное»;',$paragraphs,true),'bare <li> with no <p> child is no longer silently dropped');
assertCms(!in_array('',$paragraphs,true),'no empty paragraph entries leak through');

rejectCms(fn()=>(new CmsContentDriver(['siteRoot'=>$root,'pages'=>['missing'=>['type'=>'static-template','file'=>'nowhere/index.php']]]))->page('missing'),'CMS_ELEMENT_NOT_FOUND');
// '../outside.php' never reaches the realpath/siteRoot check at all: the leading 'file' pattern
// (`^[a-z0-9_/-]+\.php$`) already excludes '.' outside the trailing '.php', so '..' trips
// SOURCE_SCHEMA_REQUIRED first. Traversal is still blocked — just by the earlier guard.
rejectCms(fn()=>(new CmsContentDriver(['siteRoot'=>$root,'pages'=>['escape'=>['type'=>'static-template','file'=>'../outside.php']]]))->page('escape'),'SOURCE_SCHEMA_REQUIRED');
rejectCms(fn()=>$driver->page('not-configured-at-all'),'CMS_SLUG_NOT_CONFIGURED');

unlink($root.'/privacy-policy/index.php');rmdir($root.'/privacy-policy');rmdir($root);
echo $count." CMS content driver policy checks PASS; pure file-read fixtures, no Bitrix bootstrap/DB\n";
