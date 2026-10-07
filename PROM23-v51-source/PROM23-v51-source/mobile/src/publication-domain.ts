import type { ProductPublication, PublicationFilters } from './api/site';
export const defaultPublicationFilters: PublicationFilters = { rating: null, withMedia: false, withReplies: false, sort: 'new' };
export function safePublicationMedia(url: string): boolean {
  try { const u = new URL(url); return u.protocol === 'https:' && ['prom23.ru', 'prom.myfast.space', 'prom-krd.ru'].includes(u.hostname) && u.pathname.startsWith('/upload/') && /\.(?:jpe?g|png|webp|gif|avif|mp4|webm|mov)$/i.test(u.pathname) && !u.port && !u.username && !u.password && !u.search && !u.hash; } catch { return false; }
}
export function selectPublications(items: ProductPublication[], productId: string, kind: ProductPublication['kind'], filters: PublicationFilters): ProductPublication[] {
  return items.filter(i => i.productId === productId && i.kind === kind && (!filters.rating || kind === 'question' || i.rating === filters.rating) && (!filters.withMedia || i.media?.some(m => safePublicationMedia(m.url))) && (!filters.withReplies || !!i.replies?.length))
    .slice().sort((a, b) => {
      if (kind === 'review' && filters.sort !== 'new') { const diff = (a.rating ?? 0) - (b.rating ?? 0); if (diff) return filters.sort === 'high-rate' ? -diff : diff; }
      return (Date.parse(b.publishedAt ?? '') || 0) - (Date.parse(a.publishedAt ?? '') || 0);
    });
}
