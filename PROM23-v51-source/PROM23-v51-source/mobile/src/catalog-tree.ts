import type { Product } from './domain';
export type CatalogSection = { id: string; name: string; url: string; parentId: string | null; children: string[]; productIds: string[] };
export type CatalogTree = { sourceUrl: string; importedAt: string; rootIds: string[]; sections: CatalogSection[] };
export const emptyCatalogTree: CatalogTree = { sourceUrl: '', importedAt: '', rootIds: [], sections: [] };
export function productInSection(product: Product, section: CatalogSection | undefined): boolean {
  return !!section && (product.sectionIds?.includes(section.id) === true || section.productIds.includes(product.id));
}
export function sectionTrail(tree: CatalogTree, id: string): CatalogSection[] {
  const trail: CatalogSection[] = []; const visited = new Set<string>();
  let node = tree.sections.find(s => s.id === id);
  while (node && !visited.has(node.id)) {
    visited.add(node.id); trail.unshift(node);
    node = node.parentId ? tree.sections.find(s => s.id === node?.parentId) : undefined;
  }
  return trail;
}
