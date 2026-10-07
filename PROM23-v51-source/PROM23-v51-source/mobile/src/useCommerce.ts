import { useEffect, useMemo, useState } from 'react';
import type { Product } from './domain';
import { useShop } from './store';
import { commerceKey, currentCommerceOffer, type CommerceOffer, type CommerceRequest } from './commerce';
import { loadCommerceOffer } from './api/commerce';

export function useCommerce(product?: Product) {
  const { state, products, location } = useShop();
  const request: CommerceRequest = { context: state.context, city: state.city, settlementId: location?.settlement?.id ?? null, locationVersion: location?.version ?? 0, items: product ? [{ productId: product.id, quantity: 1, priceKopecks: product.priceKopecks }] : state.carts[state.context].flatMap(line => {
    const item = products.find(p => p.id === line.productId);
    return item ? [{ productId: item.id, quantity: line.quantity, priceKopecks: item.priceKopecks }] : [];
  }) };
  const key = commerceKey(request);
  const stable = useMemo(() => request, [key]);
  const [result, setResult] = useState<CommerceOffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setResult(null); setLoading(false);
    if (!stable.items.length) return () => controller.abort();
    setLoading(true);
    void loadCommerceOffer(stable, controller.signal).then(value => { if (active) setResult(currentCommerceOffer(value, stable)); }).catch(() => { if (active) setResult(null); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [stable, revision]);
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => setResult(null), Math.max(0, Math.min(2_147_483_647, Date.parse(result.expiresAt) - Date.now())));
    return () => clearTimeout(timer);
  }, [result]);
  return { request, offer: currentCommerceOffer(result, request), loading, refresh: () => setRevision(n => n + 1), amount: request.items.reduce((sum, i) => sum + i.priceKopecks * i.quantity, 0) };
}
