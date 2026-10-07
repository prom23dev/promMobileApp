import type { ContextId } from './domain';
export type NotificationPreferences = { pushOrders: boolean; pushMarketing: boolean; emailOrders: boolean; emailMarketing: boolean; smsOrders: boolean; smsMarketing: boolean };
export type InboxItem = { id: string; kind: 'order' | 'marketing'; title: string; body: string; createdAt: string; orderId?: string; context: ContextId; read: boolean };
export type Inbox = { items: InboxItem[]; preferences: NotificationPreferences; mode: string; channels: { push: string; email: string; sms: string } };
// A push payload is untrusted. It cannot choose arbitrary URLs, switch organizations or carry PII.
export function notificationDestination(data: unknown, context: ContextId): string {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return '/notifications';
  const payload = data as Record<string, unknown>;
  if (payload.context !== context) return '/notifications';
  if (payload.kind === 'order' && typeof payload.orderId === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(payload.orderId)) return `/order/${payload.orderId}`;
  return '/notifications';
}
