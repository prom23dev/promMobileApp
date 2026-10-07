import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { legalDocuments } from '../src/content/legalDocuments';
import { legalCopy } from '../src/content/legalCopy';
import { siteFormList, siteForms, businessCheckoutConsents, initialConsentValues } from '../src/forms/siteForms';
import { parsePrivacy, optionalOff, optionalOn, createPrivacyChoice, activatePrivacy, currentPrivacy } from '../src/privacy-model';
const now = Date.parse('2026-09-18T12:00:00Z');
test('all approved documents preserve complete exact text and provenance hashes', () => {
  for (const id of ['privacy','consent','cookies','recommendations','offer','advertising','distribution'] as const) {
    const doc = legalDocuments[id], source = readFileSync(new URL('../../' + doc.sourceFiles[0], import.meta.url).pathname.replace('/mobile/docs/', '/docs/'), 'utf8');
    assert.equal(doc.content, source); assert.equal(doc.originalContent, source);
    assert.equal(createHash('sha256').update(source).digest('hex'), doc.sourceTextSha256);
    assert.match(source, /01 октября 2026 года/);
  }
});
test('owner-requested processing, policy and offer controls are separate and unchecked', () => {
  for (const form of siteFormList) {
    for (const consent of form.consents) { assert.equal(initialConsentValues(form.consents)[consent.name], false); assert.equal(consent.documents.length, 1); }
  }
  assert.equal(siteForms.subscription.consents.find(c => c.name === 'marketing')?.required, false);
  assert.deepEqual(siteForms.checkout.consents.flatMap(c=>c.documents).sort(), ['consent','offer','privacy']);
  assert.deepEqual(businessCheckoutConsents.flatMap(c=>c.documents).sort(), ['consent','privacy']);
  for(const form of siteFormList){for(const id of ['privacy','consent'])assert.equal(form.consents.filter(c=>c.documents.includes(id as any)&&c.required).length,1,form.id+' '+id);}
  assert.deepEqual(siteForms.subscription.consents.find(c => c.name === 'marketing')?.documents, ['advertising']);
  for (const form of siteFormList) for (const consent of form.consents) assert.ok(!consent.label.includes('[КОНКРЕТНАЯ'));
  assert.ok(siteForms.review.consents.some(c => c.name === 'publish_author' && c.documents.includes('distribution') && !c.required));
  assert.match(legalCopy.serviceConsent, /для рассмотрения и обработки моего обращения/);
});
test('missing, corrupt, old, expired and future-dated preference records fail closed', () => {
  const value = createPrivacyChoice(optionalOn, now);
  assert.equal(parsePrivacy(null, now), null); assert.equal(parsePrivacy('{', now), null);
  for (const bad of [{...value, edition:'old'}, {...value, expiresAt:new Date(now).toISOString()}, {...value, chosenAt:new Date(now+1000).toISOString()}, {...value, functional:'true'}]) assert.equal(parsePrivacy(JSON.stringify(bad), now), null);
  assert.deepEqual(parsePrivacy(JSON.stringify(value), now), value);
  const rejected = createPrivacyChoice(optionalOff, now); assert.deepEqual(parsePrivacy(JSON.stringify(rejected), now), rejected);
});

test("expired optional choice cannot authorize a request before the UI timer runs", () => { activatePrivacy(createPrivacyChoice(optionalOn, Date.now() - 181 * 86400000)); assert.deepEqual(currentPrivacy(), optionalOff); activatePrivacy(optionalOff); });
