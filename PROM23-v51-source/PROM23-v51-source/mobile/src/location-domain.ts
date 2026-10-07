export type AdministrativeArea = { id: string; name: string; typeShort: string };
export type Settlement = { id: string; fiasId: string; garId: string; name: string; type: string; typeShort: string; region: AdministrativeArea | null; district: AdministrativeArea | null; fullName: string; providerVersion: string };
export type LocationState = { version: number; settlement: Settlement | null; recent: Settlement[]; migrationRequired?: boolean; commerce: { status: string }; cartValidation: { status: string } };
export type LocationSuggestions = { items: Settlement[]; query: string; providerVersion: string; coverage: unknown };
const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, limit = 300): v is string => typeof v === 'string' && v.length > 0 && v.length <= limit && !/[\u0000-\u001f]/u.test(v);
const uuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const area = (v: unknown): v is AdministrativeArea | null => v === null || (object(v) && text(v.id, 50) && text(v.name) && typeof v.typeShort === 'string' && v.typeShort.length <= 30);
export function isSettlement(value: unknown): value is Settlement {
  return object(value) && uuid(value.id) && value.id === value.fiasId && typeof value.garId === 'string' && /^\d{1,20}$/.test(value.garId) && text(value.name) && text(value.type, 60) && text(value.typeShort, 30) && text(value.fullName, 600) && text(value.providerVersion, 100) && area(value.region) && area(value.district);
}
export function parseLocation(value: unknown): LocationState {
  if (!object(value) || !Number.isSafeInteger(value.version) || Number(value.version) < 0 || (value.settlement !== null && !isSettlement(value.settlement)) || !Array.isArray(value.recent) || value.recent.length > 8 || !value.recent.every(isSettlement) || !object(value.commerce) || !text(value.commerce.status, 60) || !object(value.cartValidation) || !text(value.cartValidation.status, 60)) throw new Error('Не удалось прочитать населённый пункт. Повторите выбор.');
  return value as LocationState;
}
export function parseSuggestions(value: unknown): LocationSuggestions {
  if (!object(value) || !Array.isArray(value.items) || value.items.length > 20 || !value.items.every(isSettlement) || typeof value.query !== 'string' || value.query.length > 120 || !text(value.providerVersion, 100)) throw new Error('Не удалось прочитать результаты поиска.');
  return value as LocationSuggestions;
}
export function settlementLabel(value: Settlement | null | undefined): string { return value ? (value.typeShort === 'г' || value.typeShort === 'г.' ? value.name : `${value.typeShort} ${value.name}`) : 'Выберите населённый пункт'; }
