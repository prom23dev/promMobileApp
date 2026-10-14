<?php

namespace Sprint\Migration;

use Bitrix\Main\Loader;

/**
 * Создаёт инфоблок "Акции" (CODE=akcii) для страницы /promotions/ мобильного
 * приложения — на сайте prom23marketplace такой страницы/инфоблока не было
 * вообще (подтверждено 2026-10-06/09, см. docs/parity/runtime-cms.md).
 * Владелец решил 2026-10-06: создать новый инфоблок, по образцу
 * IBLOCK_ID_NEW_PRODUCTS=17 / IBLOCK_ID_NEWS=18 (стандартные поля элемента:
 * NAME/PREVIEW_TEXT/DETAIL_TEXT/PREVIEW_PICTURE/DETAIL_PICTURE/ACTIVE_FROM/
 * ACTIVE_TO — у 17 и 18 нет кастомных UF_-свойств под даты, т.к. у них уже
 * есть встроенные ACTIVE_FROM/ACTIVE_TO).
 *
 * ID не захардкожен: инфоблок создаётся через saveIblock() по CODE, Bitrix
 * сам назначает следующий свободный ID (на момент миграции AUTO_INCREMENT
 * b_iblock=42, т.е. ожидается ID=42, но код никогда не предполагает
 * конкретное число — после миграции ID читается из результата и вручную
 * прописывается как IBLOCK_ID_PROMOTIONS в defines.php).
 *
 * Дополнительное свойство LINK (ссылка на товар/категорию, по аналогии с
 * LINK у IBLOCK_ID_NEW_PRODUCTS/IBLOCK_ID_NEWS) — остальные поля
 * structured-resource контракта (productIds/buyerTypes/regions из
 * cms-sync.config.example.php) не реализованы: этот инфоблок питает
 * read-only CMS-страницу (CmsContentDriver::fromPromotionsList()), а не
 * структурированный resource API.
 */
class Version20261009130000 extends Version
{
    protected $author = "claude";

    protected $description = "Создание инфоблока «Акции» (CODE=akcii) для страницы promotions мобильного приложения";

    protected $moduleVersion = "5.0.2";

    private const IBLOCK_CODE = 'akcii';

    public function up()
    {
        if (!Loader::includeModule('iblock')) {
            $this->outError('Не подключён модуль iblock');
            return;
        }

        $helper = $this->getHelperManager();

        $iblockId = $helper->Iblock()->saveIblock([
            'ACTIVE'           => 'Y',
            'NAME'             => 'Акции',
            'CODE'             => self::IBLOCK_CODE,
            'IBLOCK_TYPE_ID'   => 'content',
            'LID'              => ['s1'],
            'SORT'             => 500,
            'VERSION'          => 1,
            'WORKFLOW'         => 'N',
            'BIZPROC'          => 'N',
            'INDEX_ELEMENT'    => 'Y',
            'INDEX_SECTION'    => 'Y',
            'LIST_PAGE_URL'    => '#SITE_DIR#/content/index.php?ID=#IBLOCK_ID#',
            'DETAIL_PAGE_URL'  => '#SITE_DIR#/content/detail.php?ID=#ELEMENT_ID#',
            'SECTION_PAGE_URL' => '#SITE_DIR#/content/list.php?SECTION_ID=#SECTION_ID#',
        ]);

        $this->out('Инфоблок "Акции" готов, ID=' . $iblockId . ' (пропиши IBLOCK_ID_PROMOTIONS=' . $iblockId . ' в defines.php, если ещё не прописан)');

        $helper->Iblock()->saveProperty($iblockId, [
            'NAME'           => 'Ссылка',
            'ACTIVE'         => 'Y',
            'SORT'           => '100',
            'CODE'           => 'LINK',
            'DEFAULT_VALUE'  => '',
            'PROPERTY_TYPE'  => 'S',
            'ROW_COUNT'      => '1',
            'COL_COUNT'      => '30',
            'MULTIPLE'       => 'N',
            'IS_REQUIRED'    => 'N',
        ]);

        $this->out('Свойство LINK добавлено в инфоблок ' . $iblockId);
    }

    public function down()
    {
        if (!Loader::includeModule('iblock')) {
            $this->outError('Не подключён модуль iblock');
            return;
        }

        $helper = $this->getHelperManager();
        $deleted = $helper->Iblock()->deleteIblockIfExists(self::IBLOCK_CODE);

        if ($deleted) {
            $this->out('Инфоблок "Акции" (CODE=' . self::IBLOCK_CODE . ') удалён');
        } else {
            $this->out('Инфоблок "Акции" не найден — нечего удалять');
        }
    }
}
