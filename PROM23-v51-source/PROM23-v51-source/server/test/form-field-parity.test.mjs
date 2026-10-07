import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createFormsService} from '../integrations/forms-service.mjs';
const forms=JSON.parse(readFileSync(new URL('../integrations/form-contracts.json',import.meta.url))).forms;
function harness(id, values) {
  let effects=0;
  const service=createFormsService({runtime:{call:async(op,payload)=>{if(op==='forms.context')return {formId:id,revision:'fields-r1',options:{theme:[{value:'1',label:'Source theme'}],'product-category':[{value:'1',label:'Source category'}]}};effects++;return {status:'accepted',reference:'contract-only'};}}});
  const body={context:'personal',revision:'fields-r1',values,consents:forms[id].consents.map(c=>({name:c.name,accepted:true,documentIds:c.documents}))};
  return {effects:()=>effects,submit:()=>service.submit({tokenHash:'a'.repeat(64),state:{context:'personal'}},id,body,'field-review-test-001')};
}
test('quantity source ranges are enforced before invoking form effect',async()=>{
  for(const[id,name,base]of [['buy-one-click','form_text_16',{form_text_12:'Fixture',form_text_13:'+79990000000'}],['rent','form_text_23',{form_text_20:'Fixture'}]]) {
    for(const value of ['0','100','-1','1.5','1e2','999999999999999999']){const h=harness(id,{...base,[name]:value});await assert.rejects(h.submit(),e=>e.code==='VALIDATION_ERROR');assert.equal(h.effects(),0);}
    for(const value of ['1','99']){const h=harness(id,{...base,[name]:value});await h.submit();assert.equal(h.effects(),1);}
  }
});
test('UTF-8 appeal byte overflow cannot escape the BFF with Cyrillic/emoji',async()=>{
  for(const[id,limit]of [['appeal',2000],['appeal-order',500]]) {
    for(const comment of ['я'.repeat(limit/2+1),'🙂'.repeat(limit/4+1)]){const h=harness(id,{theme:'1',comment});await assert.rejects(h.submit(),e=>e.code==='VALIDATION_ERROR');assert.equal(h.effects(),0);}
    const h=harness(id,{theme:'1',comment:'я'.repeat(limit/2)});await h.submit();assert.equal(h.effects(),1);
  }
});
test('ordinary review accepts only its source video allowlist; order/edit stay image-only',async()=>{
  const file=name=>({name,size:100,uploadToken:'a'.repeat(48)});
  for(const ext of ['mp4','mov','webm']){const h=harness('review',{rate:'5','review-text':'Fixture review','media[]':[file('clip.'+ext)]});await h.submit();assert.equal(h.effects(),1);}
  for(const id of ['order-review','review-edit']){const h=harness(id,{rate:'5','review-text':'Fixture review','media[]':[file('clip.mp4')]});await assert.rejects(h.submit(),e=>e.code==='UPLOAD_INVALID');assert.equal(h.effects(),0);}
});
test('short questions are rejected before source effect, counting trimmed Unicode characters',async()=>{
  for (const id of ['question','question-edit']) {
    for (const value of ['', '    ', 'тест', '  тест  ', '🙂🙂🙂']) {
      const h=harness(id,{'question-text':value});await assert.rejects(h.submit(),e=>e.code==='VALIDATION_ERROR');assert.equal(h.effects(),0);
    }
    for (const value of ['Какая', '  Какая  ', '🙂🙂🙂🙂🙂']) {
      const h=harness(id,{'question-text':value});await h.submit();assert.equal(h.effects(),1);
    }
  }
});
