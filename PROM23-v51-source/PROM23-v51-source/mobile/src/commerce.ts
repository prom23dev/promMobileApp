import type { ContextId } from './domain';

export type CommerceRequest = {
  context: ContextId; city: string; settlementId?: string | null; locationVersion?: number;
  items: { productId: string; quantity: number; priceKopecks: number }[];
};
export type CommerceOffer = {
  requestKey: string; expiresAt: string;
  split?: { payments: { label: string; amountKopecks: number }[]; terms: string };
  plus?: { points: number; terms: string };
  delivery: { id: string; name: string; method: 'pickup' | 'point' | 'courier' | 'terminal'; priceKopecks: number; period: string; address?: string; trackingLabel?: string }[];
};
export function commerceKey(request: CommerceRequest): string {
  return JSON.stringify([request.context, request.city, request.settlementId ?? null, request.locationVersion ?? 0, [...request.items].sort((a, b) => a.productId.localeCompare(b.productId)).map(i => [i.productId, i.quantity, i.priceKopecks])]);
}
export function splitExample(amount: number): number[] {
  if (!Number.isSafeInteger(amount) || amount <= 0) return [];
  const part = Math.floor(amount / 4);
  return [amount - part * 3, part, part, part];
}
const money = (value: unknown) => Number.isSafeInteger(value) && Number(value) >= 0;
// Reject offers for another city, quantity, buyer or an expired calculation.
export function currentCommerceOffer(value: CommerceOffer | null, request: CommerceRequest, now = Date.now()): CommerceOffer | null {
  if (!value || value.requestKey !== commerceKey(request) || !Number.isFinite(Date.parse(value.expiresAt)) || Date.parse(value.expiresAt) <= now || !Array.isArray(value.delivery)) return null;
  if (value.delivery.some(d => !d || !d.id || !d.name || !['pickup', 'point', 'courier', 'terminal'].includes(d.method) || !money(d.priceKopecks) || !d.period)) return null;
  if (value.plus && (!money(value.plus.points) || !value.plus.terms)) return null;
  if (value.split && (!Array.isArray(value.split.payments) || !value.split.payments.length || !value.split.terms || value.split.payments.some(p => !p || !p.label || !money(p.amountKopecks)))) return null;
  return request.context === 'personal' ? value : { ...value, split: undefined, plus: undefined };
}
export function plusLabel(points: number): string {
  const word = new Intl.PluralRules('ru').select(points);
  return `${points} ${word === 'one' ? 'балл' : word === 'few' ? 'балла' : 'баллов'} Плюса`;
}
