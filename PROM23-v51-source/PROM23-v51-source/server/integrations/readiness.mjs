import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function inspectIntegrationSource(root = fileURLToPath(new URL('../../site-source/', import.meta.url))) {
  const present = path => existsSync(resolve(root, path));
  const read = path => { try { return readFileSync(resolve(root, path), 'utf8'); } catch { return ''; } };
  const events = read('local/php_interface/events.php');
  const crm = read('local/class/Controllers/Bitrix24WebhookController.php');
  const checks = [
    { id: 'bitrix-core', status: present('bitrix/modules/main/include/prolog_before.php') ? 'present-unverified' : 'missing', scope: 'runtime' },
    { id: 'existing-checkout', status: present('order/index.php') ? 'source-present' : 'missing', scope: 'bitrix:sale.order.ajax' },
    { id: 'crm-event', status: /function onSaleOrderSavedHandler/.test(events) ? 'source-present' : 'missing', scope: 'OnSaleOrderSaved → Bitrix24Webhook::createDeal' },
    { id: 'crm-event-signature', status: /function onSaleOrderSavedHandler\(\$order\)[\s\S]{0,180}\$order->isNew\(\)/.test(events) ? 'review-required' : 'unverified', scope: 'Event ENTITY/IS_NEW compatibility' },
    { id: 'crm-tls-verification', status: /CURLOPT_SSL_VERIFYPEER\s*=>\s*false/.test(crm) ? 'blocked' : 'unverified', scope: 'existing CRM transport' },
    { id: 'checkout-component-events', status: /OnSaleComponentOrderOneStepComplete/.test(events) ? 'must-preserve' : 'unverified', scope: 'CDEK cleanup and installed modules' },
    { id: 'one-c-documents', status: present('local/php_interface/lib/Documents1C.php') ? 'source-present' : 'missing', scope: 'fetch existing posted PDFs only' },
    { id: 'one-c-order-exchange', status: 'unverified', scope: 'CommerceML/module/config not included as working runtime' },
    { id: 'mobile-identity-binding', status: 'missing', scope: 'production user/organization session and membership' },
    { id: 'apns-fcm-delivery', status: 'not-configured', scope: 'credentials, registration and physical-device tests required' },
  ];
  return { protocol: 'prom23-bitrix-readonly-v1', operation: 'source.readiness', writeEnabled: false,
    runtimeConnected: false, claims: { bitrix24DeliveryTested: false, oneCExchangeTested: false, paymentTested: false, pushTested: false }, checks };
}
