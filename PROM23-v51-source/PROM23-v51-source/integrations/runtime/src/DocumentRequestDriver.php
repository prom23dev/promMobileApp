<?php
declare(strict_types=1);
namespace Prom23\Runtime;

/** Source REQUEST_DOCUMENT CForm: resolve answer IDs/required flags freshly; retain CFormResult events. */
final class DocumentRequestDriver {
    public function __construct(private array $config) {}
    private function schema(array $payload,array $actor): array {
        if(!$actor['userId'])throw new RuntimeExceptionCode('AUTH_REQUIRED',401);
        if(!$actor['organizationId'])throw new RuntimeExceptionCode('ORGANIZATION_REQUIRED',409);Actor::organization($actor['userId'],$actor['organizationId']);
        $form=\CForm::GetBySID('REQUEST_DOCUMENT')->Fetch();if(!$form||($form['ACTIVE']??'')!=='Y')throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
        $formData=[];$questions=[];$answers=[];$dropdown=[];$multi=[];\CForm::GetDataByID((int)$form['ID'],$formData,$questions,$answers,$dropdown,$multi);$fields=[];$mapping=[];
        foreach($questions as $question){$sid=$question['SID'];if(!in_array($sid,['DOC_TYPE','PERIOD_FROM','PERIOD_TO','COMMENT'],true))throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_CHANGED');
            $structures=$answers[$sid]??$answers[$question['ID']]??null;if(!is_array($structures)||count($structures)!==1)throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');$answer=array_values($structures)[0];$type=$answer['FIELD_TYPE']??'';
            if(!in_array($type,['text','textarea','date'],true)||!ctype_digit((string)($answer['ID']??'')))throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
            $fields[]=['name'=>$sid,'label'=>WorkspaceDriver::text($question['TITLE']??$sid),'type'=>$type,'required'=>($question['REQUIRED']??'')==='Y'];$mapping[$sid]='form_'.$type.'_'.$answer['ID'];
        }
        if(!$fields)throw new RuntimeExceptionCode('SOURCE_FORM_SCHEMA_REQUIRED');
        return ['formId'=>'document-request','revision'=>hash('sha256',json_encode([$form['ID'],$actor['userId'],$actor['organizationId'],$fields,$mapping],JSON_THROW_ON_ERROR)),'fields'=>$fields,'mapping'=>$mapping,'sourceFormId'=>(int)$form['ID']];
    }
    public function run(string $operation,array $payload,array $actor): array {
        $schema=$this->schema($payload,$actor);if($operation==='forms.context')return array_intersect_key($schema,array_flip(['formId','revision','fields']));
        if(($payload['revision']??'')!==$schema['revision'])throw new RuntimeExceptionCode('STALE_CONTEXT',409);$values=$payload['values']??[];$post=[];$dates=[];
        if(array_diff(array_keys($values),array_keys($schema['mapping'])))throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        foreach($schema['fields'] as $field){$value=$values[$field['name']]??'';if(!is_string($value)||strlen($value)>20000||$field['required']&&trim($value)==='')throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
            if($field['type']==='date'&&$value!==''){$time=MakeTimeStamp($value);if(!$time)throw new RuntimeExceptionCode('VALIDATION_ERROR',422);$dates[$field['name']]=$time;}
            $post[$schema['mapping'][$field['name']]]=$value;
        }
        if(isset($dates['PERIOD_FROM'],$dates['PERIOD_TO'])&&$dates['PERIOD_FROM']>$dates['PERIOD_TO'])throw new RuntimeExceptionCode('VALIDATION_ERROR',422);
        $result=\CFormResult::Add($schema['sourceFormId'],$post);if(!(int)$result)throw new RuntimeExceptionCode('DOCUMENT_REQUEST_FAILED');
        return ['status'=>'accepted','reference'=>'document-request-'.(int)$result];
    }
}
