import type { Product } from './domain';

// Stable ordering avoids cards moving during cart/context updates. Round-robin
// categories keeps small departments visible; each real product appears once.
function rank(value: string): number {
  let result = 2166136261;
  for (let i = 0; i < value.length; i++) result = Math.imul(result ^ value.charCodeAt(i), 16777619);
  return result >>> 0;
}
export function mixedHomeProducts(products: readonly Product[]): Product[] {
  const unique = new Map(products.map(product => [product.id, product]));
  const groups = new Map<string, Product[]>();
  for (const product of unique.values()) {
    const group = groups.get(product.category) ?? [];
    group.push(product); groups.set(product.category, group);
  }
  const names = [...groups.keys()].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  for (const group of groups.values()) group.sort((a, b) => rank(a.id) - rank(b.id) || a.id.localeCompare(b.id));
  const result: Product[] = [];
  for (let round = 0; result.length < unique.size; round++) {
    for (let index = 0; index < names.length; index++) {
      const product = groups.get(names[(index + round) % names.length])?.[round];
      if (product) result.push(product);
    }
  }
  return result;
}
