import { currentCommerceOffer, type CommerceOffer, type CommerceRequest } from '../commerce';
import { localRequest } from './local';
export async function loadCommerceOffer(request: CommerceRequest, signal: AbortSignal): Promise<CommerceOffer | null> {
  if (!request.settlementId) return null;
  const value = await localRequest<CommerceOffer>('/v1/commerce/offer', { method: 'POST', signal, body: {
    expectedContext: request.context, expectedLocationVersion: request.locationVersion,
    items: request.items.map(({ productId, quantity }) => ({ productId, quantity })),
  } });
  return currentCommerceOffer(value, request);
}
