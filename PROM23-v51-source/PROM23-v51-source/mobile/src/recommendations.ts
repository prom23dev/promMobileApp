import type { Product, ShopState } from './domain';

export function productShelves(products: Product[], state: ShopState, personalized = true) {
  const byId = new Map(products.map(product => [product.id, product]));
  const viewed = [...new Set(state.viewed?.[state.context] ?? [])]
    .flatMap(id => byId.has(id) ? [byId.get(id)!] : []).slice(0, 30);
  const excluded = new Set([...viewed.map(product => product.id), ...state.carts[state.context].map(line => line.productId)]);
  const recommended = (personalized ? products : []).filter(product => !excluded.has(product.id)).map(product => {
    // Prefer the deepest shared category and the most recent viewed product.
    // This suggests relevant equipment, without asserting component compatibility.
    const score = viewed.slice(0, 10).reduce((best, previous, index) => {
      const common = (product.sectionIds ?? []).filter(id => previous.sectionIds?.includes(id)).length;
      return Math.max(best, common ? common * 100 + 10 - index : 0);
    }, 0);
    return { product, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 8).map(item => item.product);
  const popular = products.filter(product => Number.isSafeInteger(product.popularRank) && product.popularRank! > 0)
    .sort((a, b) => a.popularRank! - b.popularRank!).slice(0, 20);
  return { viewed, recommended, popular };
}
