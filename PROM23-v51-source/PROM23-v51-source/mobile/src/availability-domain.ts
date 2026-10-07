export type Availability = { status: 'unknown' | 'in-stock' | 'out-of-stock'; totalQuantity: number | null;
  warehouses: { id: string; name?: string; quantity: number | null }[]; measuredAt: string | null; expiresAt: string | null };
export type AvailabilityContext = { productId: string; settlementId: string; locationVersion: number; buyerContext: 'personal' | 'organization' };
const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const quantity = (v: unknown) => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1e12);
export function parseAvailability(value: unknown, expected: AvailabilityContext, now = Date.now()): Availability {
  const invalid = (): never => { throw new Error('Остатки требуют обновления'); };
  if (!object(value) || Object.entries(expected).some(([key, v]) => value[key] !== v) || !object(value.availability)) return invalid();
  const a = value.availability;
  if (!['unknown', 'in-stock', 'out-of-stock'].includes(a.status) || a.quantityBasis !== 'physical-on-hand' || !quantity(a.totalQuantity) || !Array.isArray(a.warehouses) || a.warehouses.length > 500) return invalid();
  if (a.warehouses.some((w: unknown) => !object(w) || typeof w.id !== 'string' || !/^[1-9][0-9]{0,11}$/.test(w.id) || !quantity(w.quantity) || (w.name !== undefined && (typeof w.name !== 'string' || w.name.length > 300))) || new Set(a.warehouses.map((w: any) => w.id)).size !== a.warehouses.length) return invalid();
  if (a.measuredAt !== null && (!Number.isFinite(Date.parse(a.measuredAt)) || Date.parse(a.measuredAt) > now)) return invalid();
  if (a.expiresAt !== null && (!Number.isFinite(Date.parse(a.expiresAt)) || Date.parse(a.expiresAt) <= now)) return invalid();
  if (a.status !== 'unknown' && (a.measuredAt === null || a.expiresAt === null || a.totalQuantity === null || !a.warehouses.length || a.warehouses.some((w: any) => w.quantity === null) || Math.abs(a.warehouses.reduce((sum: number, w: any) => sum + w.quantity, 0) - a.totalQuantity) > 0.000001 || (a.status === 'in-stock') !== (a.totalQuantity > 0))) return invalid();
  return { status: a.status, totalQuantity: a.totalQuantity, warehouses: a.warehouses.map((w: any) => ({ id: w.id, name: w.name, quantity: w.quantity })), measuredAt: a.measuredAt, expiresAt: a.expiresAt };
}
