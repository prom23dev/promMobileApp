<?php
declare(strict_types=1);
namespace Prom23\Runtime;

final class OrganizationDriver {
    public function __construct(private array $config) {}
    private function target(array $payload,array $actor): int {
        $id=(int)($payload['target']['organizationId']??$actor['organizationId']);
        if(!$id)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);Actor::organization($actor['userId'],$id);return $id;
    }
    private function enums(string $constant,string $code): array {
        if(!defined($constant))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
        $cursor=\CIBlockPropertyEnum::GetList(['SORT'=>'ASC','ID'=>'ASC'],['IBLOCK_ID'=>constant($constant),'CODE'=>$code]);$options=[];
        while($row=$cursor->Fetch())$options[]=['value'=>(string)$row['ID'],'label'=>html_entity_decode(strip_tags($row['VALUE']),ENT_QUOTES|ENT_HTML5,'UTF-8')];return $options;
    }
    private function context(array $payload,array $actor): array {
        if(!$actor['userId'])throw new RuntimeExceptionCode('AUTH_REQUIRED',401);
        $id=$payload['formId'];$form=$this->config['formContracts'][$id];$value=['formId'=>$id,'options'=>[],'initialValues'=>[]];
        if($id==='organization-add'){
            if(!defined('IBLOCK_ID_REGIONS'))throw new RuntimeExceptionCode('INTEGRATION_UNAVAILABLE');
            $cursor=\CIBlockElement::GetList(['SORT'=>'ASC','NAME'=>'ASC'],['IBLOCK_ID'=>IBLOCK_ID_REGIONS,'ACTIVE'=>'Y','!PROPERTY_STORE'=>false],false,['nTopCount'=>200],['ID','NAME','PROPERTY_STORE']);
            $regions=[];while($row=$cursor->Fetch())$regions[]=['value'=>(string)$row['ID'],'label'=>html_entity_decode(strip_tags($row['NAME']),ENT_QUOTES|ENT_HTML5,'UTF-8')];$value['options']['store_region_id']=$regions;
            if(isset($payload['challengeId'])){$vault=new ChallengeVault($this->config['key']);$pending=$vault->read($payload['challengeId'],$id);$value['initialValues']=$pending['preview'];$value['challengeId']=$payload['challengeId'];}
        }elseif($id==='organization-switch'){
            $list=(new BuyerDriver())->run('buyer.organizations',$payload,$actor);$value['options']['organization']=array_map(static fn($v)=>['value'=>(string)$v['id'],'label'=>$v['name']],$list['organizations']);
        }else{
            $company=$this->target($payload,$actor);
            if($id==='organization-bank')foreach(['bik'=>'BIK','payment-bill'=>'PAYMENT_SCORE_BANK','bank-name'=>'NAME_BANK','correspondent-bill'=>'CORRESPONDENT_SCORE_BANK']as$name=>$code){$row=\CIBlockElement::GetProperty(IBLOCK_ID_ORGANIZATIONS,$company,[],['CODE'=>$code])->Fetch();$value['initialValues'][$name]=html_entity_decode(strip_tags((string)($row['VALUE']??'')),ENT_QUOTES|ENT_HTML5,'UTF-8');}
            if($id==='organization-edo')$value['options']['edo_operator']=$this->enums('IBLOCK_ID_ORGANIZATIONS_CHANGE_REQUISITES','EDO_OPERATOR');
        }
        $value['revision']=hash('sha256',json_encode([$form,$payload['context'],$payload['target']??[],$value],JSON_THROW_ON_ERROR));return $value;
    }
    private function response(string $raw,string $successPath=''): array {
        try{$response=json_decode($raw,true,32,JSON_THROW_ON_ERROR);}catch(\Throwable $e){throw new RuntimeExceptionCode('RESULT_RECONCILIATION_REQUIRED',409);}
        if(($response['success']??false)===true||($response['STATUS']??'')==='OK'||($successPath&&($response['STATUS']??'')==='OPEN_POPUP_AJAX'&&($response['POPUP_URL']??'')===$successPath))return $response;
        throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
    }
    public function run(string $operation,array $payload,array $actor): array {
        $current=$this->context($payload,$actor);if($operation==='forms.context')return $current;
        if(($payload['revision']??'')!==$current['revision'])throw new RuntimeExceptionCode('STALE_CONTEXT',409);
        $id=$payload['formId'];$v=$payload['values']??[];$entityId=null;$ack='source-popup';$http=new SourceHttp($this->config);
        if($id==='organization-add'){
            if(!preg_match('/^(?:[0-9]{10}|[0-9]{12})$/D',$v['inn']??'')||(!empty($v['kpp'])&&!preg_match('/^[0-9]{9}$/D',$v['kpp']))||!in_array((string)($v['store_region_id']??''),array_column($current['options']['store_region_id'],'value'),true))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            $vault=new ChallengeVault($this->config['key']);
            if(!isset($payload['challengeId'])){
                $found=$this->response($http->call('/local/ajax/lk/organization/organizations-find.php',[],['inn'=>$v['inn'],'kpp'=>$v['kpp']??'']));$d=$found['data']??[];$preview=['inn'=>$v['inn'],'kpp'=>$v['kpp']??'','store_region_id'=>$v['store_region_id']];
                foreach(['name'=>'name','legal-addresss'=>'legal_address','fact-address'=>'fact_address','bik'=>'bik','payment-bill'=>'payment_account','bank-name'=>'bank_name','correspondent-bill'=>'correspondent_account']as$name=>$source)$preview[$name]=html_entity_decode(strip_tags((string)($d[$source]??'')),ENT_QUOTES|ENT_HTML5,'UTF-8');
                return $vault->create($id,['preview'=>$preview]);
            }
            $pending=$vault->read($payload['challengeId'],$id)['preview'];
            if($pending['inn']!==$v['inn']||($pending['kpp']??'')!==($v['kpp']??''))throw new RuntimeExceptionCode('STALE_CONTEXT',409);
            $this->response($http->call('/local/ajax/lk/organization/organizations-add.php',[],['inn-company'=>$v['inn'],'kpp-company'=>$v['kpp']??'','store_region_id'=>$v['store_region_id']]));$vault->remove($payload['challengeId']);
            $filter=['IBLOCK_ID'=>IBLOCK_ID_ORGANIZATIONS,'ACTIVE'=>'Y','PROPERTY_INN'=>$v['inn'],'PROPERTY_USER_IDS'=>$actor['userId']];if(!empty($v['kpp']))$filter['PROPERTY_KPP']=$v['kpp'];
            $confirmed=\CIBlockElement::GetList([],$filter,false,['nTopCount'=>2],['ID']);$row=$confirmed->Fetch();if(!$row||$confirmed->Fetch())throw new RuntimeExceptionCode('RESULT_RECONCILIATION_REQUIRED',409);$entityId=(int)$row['ID'];$ack='source-membership';
        }elseif($id==='organization-switch'){
            throw new RuntimeExceptionCode('BUYER_SELECT_REQUIRED',409);
        }elseif($id==='organization-delete'){
            $company=$this->target($payload,$actor);$result=\Prom\Model\Organization::removeUserFromOrganization($actor['userId'],$company);
            if(empty($result['success']))throw new RuntimeExceptionCode('RESULT_RECONCILIATION_REQUIRED',409);
            if(\CIBlockElement::GetList([],['IBLOCK_ID'=>IBLOCK_ID_ORGANIZATIONS,'ID'=>$company,'PROPERTY_USER_IDS'=>$actor['userId']],false,['nTopCount'=>1],['ID'])->Fetch())throw new RuntimeExceptionCode('RESULT_RECONCILIATION_REQUIRED',409);$entityId=$company;$ack='source-membership-removed';
            if((int)($_SESSION['ORGANIZATION_ID']??0)===$company)unset($_SESSION['ORGANIZATION_ID'],$_SESSION['SELECT_ORGANIZATION']);
        }elseif(in_array($id,['organization-verify','organization-edo','organization-requisites'],true)){
            $company=$this->target($payload,$actor);$post=['companyID'=>$company];$files=[];
            if($id==='organization-verify'){$post['fio']=$v['fio']??'';$post['phone']=$v['phone']??'';$success='/local/ajax/lk/organization/organization-verify-popup-success.php';}
            elseif($id==='organization-edo'){
                if(!in_array((string)($v['edo_operator']??''),array_column($current['options']['edo_operator'],'value'),true))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
                $post['edo_id']=$v['edo_id']??'';$post['edo_operator']=$v['edo_operator'];$success='/local/ajax/lk/organization/organization-edo-popup-success.php';
            }else{
                $upload=new UploadDriver($this->config);foreach(['company_letter','card_company','scan_card']as$field){if(count($v[$field]??[])!==1)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);$files[$field]=$upload->resolve($payload,$field,$v[$field][0]['uploadToken']??'');}
                $success='/local/ajax/lk/organization/organizations-details-popup-success.php';
            }
            $path=$this->config['formContracts'][$id]['sourceAction'];$this->response($http->call($path,[],$post,$files),$success);
        }else throw new RuntimeExceptionCode('SOURCE_LEGACY_UNAVAILABLE',409);
        return (new SubmissionReceipt($this->config))->record($payload,$actor,$ack,$entityId);
    }
}
