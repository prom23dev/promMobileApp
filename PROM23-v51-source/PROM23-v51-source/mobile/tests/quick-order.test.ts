import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseSpecification, specificationComment, saveSpecificationDraft, readSpecificationDraft, removeSpecificationDraft } from '../src/quick-order';
import type { Product } from '../src/domain';

const known = { id: 'qa-product', sku: 'ВПТ0728', name: 'Синтетический товар' } as Product;
test('specification preserves spreadsheet rows, quantities, duplicates and unknown SKUs for manager review', () => {
  const rows = parseSpecification(' впт0728\t2\r\n\nUNKNOWN; 3\nВПТ0728 × 4', [known]);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].product?.id, known.id);
  assert.deepEqual(rows.map(row => row.quantity), [2, 3, 4]);
  assert.equal(rows[1].product, undefined);
  const comment = specificationComment(rows);
  assert.match(comment, /впт0728 — 2 ед\./);
  assert.match(comment, /UNKNOWN — 3 ед\. \(требует уточнения\)/);
  assert.match(comment, /ВПТ0728 — 4 ед\./);
});
test('invalid and unsafe quantities never become actionable supply requests', () => {
  for (const qty of ['0', '-1', '1.5', '1,5', '10000', '9007199254740992', 'NaN', 'Infinity']) {
    const rows = parseSpecification(`ВПТ0728 ${qty}`, [known]);
    assert.ok(rows.some(row => row.error), qty);
    assert.throws(() => specificationComment(rows));
  }
});
test('empty input, oversized row count and overlong lines cannot silently truncate a request', () => {
  assert.deepEqual(parseSpecification(' \n\t', [known]), []);
  assert.throws(() => specificationComment([]));
  assert.throws(() => specificationComment(parseSpecification(Array.from({length:41},()=> 'ВПТ0728 1').join('\n'), [known])));
  assert.throws(() => specificationComment(parseSpecification('X'.repeat(161)+' 1', [known])));
});
test('valid upper quantity boundary and missing-match lines remain explicit', () => {
  const rows=parseSpecification('UNKNOWN 9999', []);
  assert.equal(rows[0].quantity, 9999);
  assert.match(specificationComment(rows), /UNKNOWN — 9999 ед\. \(требует уточнения\)/);
});
test('long comments fail instead of silently losing specification rows', () => {
  const rows=parseSpecification(Array.from({length:40},(_,i)=>'SKU'+i+'X'.repeat(70)+' 1').join('\n'), []);
  assert.ok(rows.every(row=>!row.error));
  assert.throws(()=>specificationComment(rows), /2400/);
});
test('draft ID contains no specification and cannot read another buyer context', () => {
  const value='Синтетическая спецификация — 2 ед.';
  const id=saveSpecificationDraft(value,'personal');
  assert.ok(!id.includes('спецификация'));
  assert.equal(readSpecificationDraft(id,'personal'),value);
  assert.equal(readSpecificationDraft(id,'organization-demo'),'');
  removeSpecificationDraft(id);
  assert.equal(readSpecificationDraft(id,'personal'),'');
});
test('draft expires at 30 minutes without extending retention on read', () => {
  const original=Date.now; const start=original();
  let now=start; Date.now=()=>now;
  try {
    const id=saveSpecificationDraft('SKU — 1 ед.','personal');
    now=start+29*60*1000;assert.equal(readSpecificationDraft(id,'personal'),'SKU — 1 ед.');
    now=start+30*60*1000;assert.equal(readSpecificationDraft(id,'personal'),'');
    removeSpecificationDraft(id);
  } finally { Date.now=original; }
});
