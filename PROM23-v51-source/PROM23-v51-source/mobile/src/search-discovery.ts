import type { Product } from './domain';
import type { CatalogSection, CatalogTree } from './catalog-tree';

const normalized = (value: string) => value.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').trim();
export function productSuggestions(products: Product[], query: string, limit = 4): Product[] {
  const words = normalized(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return products.filter(product => {
    const text = normalized([product.name, product.sku, ...product.specs.filter(spec => spec.label === 'Производитель').map(spec => spec.value)].join(' '));
    return words.every(word => text.includes(word));
  }).sort((a, b) => Number(normalized(b.sku) === normalized(query)) - Number(normalized(a.sku) === normalized(query))).slice(0, limit);
}

// Derived from the user's actual product views, not fabricated category visits or popularity.
export function viewedProductSections(viewedIds: string[], products: Product[], tree: CatalogTree, limit = 4): CatalogSection[] {
  const roots = new Set(tree.rootIds); const seen = new Set<string>(); const result: CatalogSection[] = [];
  for (const id of viewedIds) {
    const product = products.find(item => item.id === id);
    if (!product) continue;
    const section = tree.sections.find(item => roots.has(item.id) && (product.sectionIds?.includes(item.id) || item.productIds.includes(product.id)));
    if (section && !seen.has(section.id)) { seen.add(section.id); result.push(section); }
    if (result.length >= limit) break;
  }
  return result;
}
function distance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => Array.from({ length: b.length + 1 }, (_, j) => i ? (j ? 0 : i) : j));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + Number(a[i - 1] !== b[j - 1]));
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
  }
  return rows[a.length][b.length];
}
// Conservative spelling aid. Suggest only vocabulary present in real product names/brands/SKUs,
// and only when the corrected query actually matches a product. It never silently changes input.
export function correctedProductQuery(query: string, products: Product[]): string | null {
  const original = normalized(query);
  if (original.length < 4 || original.length > 64 || productSuggestions(products, original, 1).length) return null;
  const vocabulary = [...new Set(products.flatMap(product => [product.name, product.sku, ...product.specs.filter(spec => spec.label === 'Производитель').map(spec => spec.value)]).flatMap(value => normalized(value).split(/[^\p{L}\p{N}]+/u)).filter(word => word.length >= 4 && word.length <= 32))];
  const words = original.split(/\s+/); let changed = false;
  const corrected = words.map(word => {
    if (word.length < 4 || word.length > 32 || vocabulary.includes(word)) return word;
    const maxDistance = word.length < 6 ? 1 : 2;
    const candidates = vocabulary.filter(candidate => Math.abs(candidate.length - word.length) <= maxDistance && (candidate[0] === word[0] || (candidate[0] === word[1] && candidate[1] === word[0])))
      .map(value => ({ value, distance: distance(word, value) })).filter(item => item.distance <= maxDistance).sort((a, b) => a.distance - b.distance || a.value.localeCompare(b.value, 'ru'));
    if (!candidates.length || (candidates[1] && candidates[1].distance === candidates[0].distance)) return word;
    changed = true; return candidates[0].value;
  }).join(' ');
  return changed && productSuggestions(products, corrected, 1).length ? corrected : null;
}
export function recoverySections(query: string, products: Product[], tree: CatalogTree, viewedIds: string[], limit = 4): CatalogSection[] {
  const terms = normalized(query).split(/\s+/).filter(word => word.length > 2);
  const matches = tree.sections.filter(section => terms.some(word => normalized(section.name).includes(word)));
  const roots = tree.rootIds.map(id => tree.sections.find(section => section.id === id)).filter((item): item is CatalogSection => !!item);
  return [...new Map([...matches, ...viewedProductSections(viewedIds, products, tree), ...roots].map(section => [section.id, section])).values()].slice(0, limit);
}
