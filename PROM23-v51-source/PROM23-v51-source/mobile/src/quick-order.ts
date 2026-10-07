import type { Product } from './domain';
export type SpecificationLine = { line: number; sku: string; quantity: number | null; product?: Product; error?: string };
export const MAX_SPECIFICATION_LINES = 40;
export function parseSpecification(input: string, products: Product[]): SpecificationLine[] {
  const normalize = (s: string) => s.trim().normalize('NFKC').toLocaleUpperCase('ru');
  const bySku = new Map(products.map(product => [normalize(product.sku), product]));
  const rows = input.replace(/\r/g, '').split('\n').map(s => s.trim()).filter(Boolean);
  if (rows.length > MAX_SPECIFICATION_LINES) return [{ line: 0, sku: '', quantity: null, error: `За один раз можно добавить до ${MAX_SPECIFICATION_LINES} строк.` }];
  return rows.map((row, index) => {
    if (row.length > 160) return { line: index + 1, sku: row.slice(0, 40), quantity: null, error: 'Слишком длинная строка.' };
    // Columns pasted from a spreadsheet, CSV with semicolon, or SKU + integer quantity.
    const match = row.match(/^(.+?)(?:\t+|\s*;\s*|\s+[xх×]\s+|\s+)(\d+)\s*$/u);
    if (!match) return { line: index + 1, sku: row, quantity: null, error: 'Укажите артикул и целое количество: ВПТ0728 2' };
    const sku = match[1].trim(); const quantity = Number(match[2]);
    if (!sku || sku.length > 80 || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 9999) return { line: index + 1, sku, quantity: null, error: 'Количество — от 1 до 9999.' };
    return { line: index + 1, sku, quantity, product: bySku.get(normalize(sku)) };
  });
}
export function specificationComment(lines: SpecificationLine[]): string {
  if (!lines.length || lines.some(line => line.error || line.quantity === null)) throw new Error('Проверьте спецификацию');
  const value = 'Прошу рассчитать поставку по спецификации:\n' + lines.map(line => `${line.sku} — ${line.quantity} ед.${line.product ? '' : ' (требует уточнения)'}`).join('\n');
  if (value.length > 2400) throw new Error('Сократите список до 2400 символов.');
  return value;
}

// An ephemeral draft keeps a business specification out of navigation URLs and access logs.
const drafts = new Map<string, { value: string; context: string; expiresAt: number }>();
export function saveSpecificationDraft(value: string, context: string): string {
  if (!value || value.length > 2400) throw new Error('Проверьте список');
  const now = Date.now();
  for (const [key, item] of drafts) if (item.expiresAt < now) drafts.delete(key);
  if (drafts.size >= 10) drafts.delete(drafts.keys().next().value!);
  const id = 'spec-' + now.toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  drafts.set(id, { value, context, expiresAt: now + 30 * 60 * 1000 });
  return id;
}
export function readSpecificationDraft(id: string, context: string): string {
  const draft = drafts.get(id);
  return draft && draft.context === context && draft.expiresAt > Date.now() ? draft.value : '';
}
export function removeSpecificationDraft(id: string): void { drafts.delete(id); }
