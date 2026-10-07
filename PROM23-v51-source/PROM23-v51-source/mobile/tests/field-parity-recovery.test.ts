import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { siteForms } from '../src/forms/siteForms';
import { formFieldErrors } from '../src/forms/formModel';
const field = (form: string, name: string) => siteForms[form].fields.find(value => value.name === name)!;
test('source one-click/rent counters preserve inclusive 1–99 and reject invalid quantities', () => {
  for (const [id, name] of [['buy-one-click', 'form_text_16'], ['rent', 'form_text_23']]) {
    const f = field(id, name);
    for (const value of ['0', '100', '-1', '1.5', '1e2', '999999999999999999']) assert.ok(formFieldErrors([f], { [name]: value })[name]);
    for (const value of ['1', '99']) assert.deepEqual(formFieldErrors([f], { [name]: value }), {});
  }
});
test('appeal validation counts UTF-8 rather than JavaScript character length', () => {
  for (const [id, max] of [['appeal', 2000], ['appeal-order', 500]] as const) {
    const f = field(id, 'comment');
    assert.deepEqual(formFieldErrors([f], { comment: 'я'.repeat(max / 2) }), {});
    assert.ok(formFieldErrors([f], { comment: 'я'.repeat(max / 2 + 1) }).comment);
    assert.ok(formFieldErrors([f], { comment: '🙂'.repeat(max / 4 + 1) }).comment);
    assert.deepEqual(formFieldErrors([f], { comment: 'a'.repeat(max) }), {});
  }
});
test('questions require five trimmed Unicode characters, including edits but not replies', () => {
  for (const id of ['question', 'question-edit']) {
    const f = field(id, 'question-text');
    for (const value of ['', '    ', 'тест', '  тест  ', '🙂🙂🙂']) assert.ok(formFieldErrors([f], { 'question-text': value })['question-text']);
    for (const value of ['Какая', '  Какая  ', '🙂🙂🙂🙂🙂']) assert.deepEqual(formFieldErrors([f], { 'question-text': value }), {});
  }
  assert.equal(field('question-reply', 'question-text').minLength, undefined);
});
test('upload policy matches source handlers without enabling video on image-only review handlers', () => {
  const supplier = field('supplier', 'attachment');
  assert.deepEqual(supplier.acceptedExtensions, ['txt', 'doc', 'docx', 'pdf']);
  assert.equal(supplier.maxFiles, 1); assert.equal(supplier.maxBytes, 20 * 1024 * 1024);
  const review = field('review', 'media[]');
  for (const ext of ['mp4', 'mov', 'webm']) assert.ok(review.acceptedExtensions?.includes(ext));
  assert.ok(!review.acceptedExtensions?.includes('avi'));
  for (const id of ['order-review', 'review-edit']) assert.ok(!field(id, 'media[]').acceptedExtensions?.includes('mp4'));
});
test('the changed runtime/BFF contracts match mobile constraints exactly', () => {
  const bff = JSON.parse(readFileSync(new URL('../../server/integrations/form-contracts.json', import.meta.url), 'utf8')).forms;
  const runtime = JSON.parse(readFileSync(new URL('../../integrations/runtime/form-contracts.json', import.meta.url), 'utf8')).forms;
  for (const [id, name] of [['buy-one-click','form_text_16'],['rent','form_text_23'],['supplier','attachment'],['review','media[]'],['appeal','comment'],['appeal-order','comment'],['question','question-text'],['question-edit','question-text']]) {
    assert.deepEqual(bff[id].fields.find((value: {name: string}) => value.name === name), field(id, name));
    assert.deepEqual(runtime[id].fields.find((value: {name: string}) => value.name === name), field(id, name));
  }
});
