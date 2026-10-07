import { legalDocuments } from './content/legalDocuments';
// All optional purposes are off until an explicit, current choice is restored.
export const privacyKey = 'prom23-privacy-v1';
export const privacyEdition = '2026-10-01-final-42';
export type PrivacyCategories = { functional: boolean; analytics: boolean; advertising: boolean; personalization: boolean };
export type PrivacyChoice = PrivacyCategories & { edition: string; chosenAt: string; expiresAt: string; policyHash: string; recommendationsHash: string };
export const optionalOff: PrivacyCategories = { functional: false, analytics: false, advertising: false, personalization: false };
export const optionalOn: PrivacyCategories = { functional: true, analytics: true, advertising: true, personalization: true };
let active: PrivacyCategories & {expiresAt?:string} = optionalOff;
export const currentPrivacy = () => active.expiresAt && Date.parse(active.expiresAt) <= Date.now() ? optionalOff : active;
export function activatePrivacy(value: PrivacyCategories) { active = { ...value }; }
export function parsePrivacy(raw: string | null, now = Date.now()): PrivacyChoice | null {
  try { const value = JSON.parse(raw ?? 'null'); if (!value || value.edition !== privacyEdition || value.policyHash !== legalDocuments.cookies.sourceTextSha256 || value.recommendationsHash !== legalDocuments.recommendations.sourceTextSha256 || !Number.isFinite(Date.parse(value.chosenAt)) || Date.parse(value.chosenAt) > now || !(Date.parse(value.expiresAt) > now) || Object.keys(optionalOff).some(key => typeof value[key] !== 'boolean')) return null; return value; } catch { return null; }
}
export function createPrivacyChoice(value: PrivacyCategories, now = Date.now()): PrivacyChoice { return { ...value, edition: privacyEdition, policyHash: legalDocuments.cookies.sourceTextSha256, recommendationsHash: legalDocuments.recommendations.sourceTextSha256, chosenAt: new Date(now).toISOString(), expiresAt: new Date(now + 180 * 86400000).toISOString() }; }
