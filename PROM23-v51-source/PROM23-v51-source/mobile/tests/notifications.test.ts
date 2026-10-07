import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationDestination } from '../src/notifications-domain';
const id = '00000000-0000-0000-0000-000000000001';
test('push opens an order only in its own customer context', () => {
  assert.equal(notificationDestination({ kind: 'order', context: 'personal', orderId: id }, 'personal'), `/order/${id}`);
  assert.equal(notificationDestination({ kind: 'order', context: 'organization-demo', orderId: id }, 'personal'), '/notifications');
});
test('push cannot navigate to external URLs or traverse paths', () => {
  for (const payload of [null, [], { url: 'https://example.invalid/' }, { kind: 'order', context: 'personal', orderId: '../account' }, { kind: 'marketing', context: 'personal', orderId: id }]) assert.equal(notificationDestination(payload, 'personal'), '/notifications');
});
