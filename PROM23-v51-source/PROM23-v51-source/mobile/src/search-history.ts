export const SEARCH_HISTORY_LIMIT = 10;
export function cleanSearch(value: string): string {
  return value.normalize('NFKC').replace(/\s+/gu, ' ').trim().slice(0, 100);
}
export function rememberSearch(history: string[], value: string): string[] {
  const query = cleanSearch(value);
  if (!query) return history;
  return [query, ...history.filter(item => item.toLocaleLowerCase('ru') !== query.toLocaleLowerCase('ru'))].slice(0, SEARCH_HISTORY_LIMIT);
}
