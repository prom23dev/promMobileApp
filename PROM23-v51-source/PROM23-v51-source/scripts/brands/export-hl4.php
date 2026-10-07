<?php
// Read-only CLI export. Run on the TEST Bitrix host; never expose this file as a URL.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = realpath($argv[1] ?? '');
if (!$root || !is_file($root . '/bitrix/modules/main/include/prolog_before.php')) { fwrite(STDERR, "Usage: php export-hl4.php /absolute/test-site-root > hl4.json\n"); exit(1); }
$_SERVER['DOCUMENT_ROOT'] = $root;
define('NO_KEEP_STATISTIC', true); define('NO_AGENT_CHECK', true); define('NO_AGENT_STATISTIC', true); define('NOT_CHECK_PERMISSIONS', false);
require $root . '/bitrix/modules/main/include/prolog_before.php';
\Bitrix\Main\Loader::includeModule('highloadblock'); \Bitrix\Main\Loader::includeModule('iblock');
$block = \Bitrix\Highloadblock\HighloadBlockTable::getById(4)->fetch();
if (!$block) throw new RuntimeException('HL4 is missing');
$class = \Bitrix\Highloadblock\HighloadBlockTable::compileEntity($block)->getDataClass();
$fields = $class::getEntity()->getFields();
$select = array_values(array_filter(['ID','UF_NAME','UF_XML_ID','UF_FILE','UF_DESCRIPTION','UF_SORT','UF_DEF','UF_LINK','UF_ACTIVE'], fn($name) => isset($fields[$name])));
$brands = $class::getList(['select'=>$select,'order'=>['ID'=>'ASC']])->fetchAll();
foreach ($brands as &$brand) $brand['logoPath'] = !empty($brand['UF_FILE']) ? CFile::GetPath($brand['UF_FILE']) : null;
unset($brand);
if (!defined('IBLOCK_ID_CATALOG_PRODUCTS')) throw new RuntimeException('Catalog iblock constant is missing; do not guess the iblock');
$property = CIBlockProperty::GetList([], ['IBLOCK_ID'=>IBLOCK_ID_CATALOG_PRODUCTS,'CODE'=>'PROP_368'])->Fetch();
if (!$property) throw new RuntimeException('PROP_368 not found');
$bindings=[];
$rows=CIBlockElement::GetList(['ID'=>'ASC'],['IBLOCK_ID'=>IBLOCK_ID_CATALOG_PRODUCTS,'ACTIVE'=>'Y','ACTIVE_DATE'=>'Y'],false,false,['ID','PROPERTY_PROP_368']);
while ($row=$rows->Fetch()) $bindings[]=['ID'=>(int)$row['ID'],'productId'=>'prom-'.$row['ID'],'PROP_368'=>$row['PROPERTY_PROP_368_VALUE']];
echo json_encode(['schemaVersion'=>1,'hlblockId'=>4,'brandProperty'=>'PROP_368','exportedAt'=>gmdate('c'),'catalogComplete'=>true,'brands'=>$brands,'productBrands'=>$bindings], JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR), "\n";
