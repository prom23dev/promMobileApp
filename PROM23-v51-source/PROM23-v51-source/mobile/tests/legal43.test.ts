import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { siteForms, siteFormList } from '../src/forms/siteForms';
import { paymentCopy } from '../src/content/paymentPageCopy';
import { checkoutGuideCopy } from '../src/content/checkoutGuideCopy';
import { businessQuestions } from '../src/content/companyContent';
import { expandFields, serializeFields, withReturnTransfer } from '../src/forms/formModel';

test('all form purposes and consent defaults match both validation boundaries', () => {
  for (const file of ['server/integrations/form-contracts.json', 'integrations/runtime/form-contracts.json']) {
    const contract = JSON.parse(readFileSync(new URL('../../' + file, import.meta.url), 'utf8'));
    for (const form of siteFormList) {
      assert.deepEqual(contract.forms[form.id].consents, form.consents, form.id);
      for (const consent of form.consents) {
        assert.equal(consent.initial, false);
        assert.equal(consent.documents.length,1,'Each document has a separate choice');
        assert.ok(!consent.label.includes('[КОНКРЕТНАЯ'));
      }
    }
  }
  assert.match(siteForms.quote.consents[0].label, /подготовки коммерческого предложения по моей спецификации/);
  assert.match(siteForms['production-request'].consents[0].label, /расчёта изготовления продукции по моему техническому заданию/);
  assert.match(siteForms.contact.consents[0].label, /ответа на моё обращение/);
});

test('purchasing guides qualify dispatch and reserve instead of promising unconditional deadlines', () => {
  for (const source of [paymentCopy, checkoutGuideCopy]) {
    const text = JSON.stringify(source);
    assert.doesNotMatch(text, /в течение суток|в течение 24 часов/);
    assert.match(text, /полностью оплаченный товар на согласованном складе/);
    assert.match(text, /1 рабочего дня, если иное не указано/);
  }
  assert.doesNotMatch(JSON.stringify(businessQuestions), /стандартный резерв — до 5/);
  assert.match(JSON.stringify(checkoutGuideCopy), /До подписания договора.*заявка на согласование/);
});

test('return delivery information is serialized only with selected items, without mutating the draft', () => {
  const values = {'selected-products':['a'], 'items:a:comment':'Недостаток', 'ui:return-method':'Перевозчиком', 'ui:return-tracking':'ПЭК 123'};
  const fields = expandFields(siteForms.return, {repeatedItems:{items:[{key:'a',label:'A'},{key:'b',label:'B'}]}}, false, values);
  const result = serializeFields(fields, withReturnTransfer(fields, values));
  const items = result.items as {key:string;values:Record<string,unknown>}[];
  assert.equal(items.length, 1);
  assert.equal(items[0].key, 'a');
  assert.match(String(items[0].values.comment), /Недостаток\n\nПредпочтительный способ передачи: Перевозчиком\nПеревозчик и номер отправления: ПЭК 123/);
  assert.equal(result['ui:return-tracking'], undefined);
  assert.equal(values['items:a:comment'], 'Недостаток');
});
