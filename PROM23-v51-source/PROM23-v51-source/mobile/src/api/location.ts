import { localRequest } from './local';
import { parseLocation, parseSuggestions } from '../location-domain';
import type { ContextId } from '../domain';
export async function loadLocation(signal?: AbortSignal) { return parseLocation(await localRequest('/v1/location', { signal })); }
export async function suggestLocations(query: string, signal?: AbortSignal) { return parseSuggestions(await localRequest('/v1/locations/suggest?q=' + encodeURIComponent(query.trim()) + '&limit=10', { signal })); }
export async function saveLocation(settlementId: string, expectedVersion: number, expectedContext: ContextId) { return parseLocation(await localRequest('/v1/location', { method: 'POST', body: { settlementId, expectedVersion, expectedContext } })); }
