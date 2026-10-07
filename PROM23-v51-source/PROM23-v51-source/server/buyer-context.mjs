// Source: Organization::checkUserInOrganization + BasketUsers USER_ID/ORGANIZATION_ID.
// business is a purchase intention with an unassigned draft, never an organization identity.
export const validBuyerContext = value => ['personal', 'business', 'organization-demo'].includes(value) || (typeof value === 'string' && /^organization:[1-9][0-9]{0,11}$/.test(value));
export const organizationIdFor = value => /^organization:[1-9][0-9]{0,11}$/.test(value ?? '') ? Number(value.slice(13)) : null;
export function ensureBuyerState(state) {
  state.carts.business ??= [];
  state.viewed ??= {};
  state.searches ??= {};
  for (const key of ['personal', 'business', 'organization-demo', state.context]) {
    state.carts[key] ??= []; state.viewed[key] ??= []; state.searches[key] ??= [];
  }
  return state;
}
export function verifiedOrganization(value) {
  return value && Number.isSafeInteger(value.id) && value.id > 0 && value.id <= 999999999999 && typeof value.name === 'string' && value.name.trim().length > 0 && value.name.length < 400 && (!value.inn || /^\d{10}(\d{2})?$/.test(value.inn));
}
export async function readOrganizations(runtime, sessionKey) {
  const result = await runtime.call('buyer.organizations', { sessionKey });
  if (!Array.isArray(result.organizations) || result.organizations.length > 100 || !result.organizations.every(verifiedOrganization)) throw new Error('INVALID_ORGANIZATIONS_RESPONSE');
  return { organizations: result.organizations.map(({ id, name, inn }) => ({ id, name, inn })), available: true };
}

// Transfer an unassigned B2B draft only after verified organization access.
// Cart quantities are drafts; availability/prices still require an authoritative checkout quote.
export function mergeBusinessDraft(base, draft, products) {
  const merged = new Map();
  for (const line of [...base, ...draft]) {
    const product = products.get(line.productId);
    if (!product || !Number.isSafeInteger(line.quantity) || line.quantity < 1) throw new Error('INVALID_DRAFT');
    const previous = merged.get(line.productId);
    const quantity = (previous?.quantity ?? 0) + line.quantity;
    const limit = Math.min(product.stock ?? 999, product.draftQuantityLimit ?? 999);
    if (!Number.isSafeInteger(quantity) || quantity > limit) throw new Error('DRAFT_LIMIT');
    const selected = (previous ? previous.selected !== false : false) || line.selected !== false;
    merged.set(line.productId, { productId: line.productId, quantity, ...(selected ? {} : { selected: false }) });
  }
  if (merged.size > 500) throw new Error('DRAFT_LIMIT');
  return [...merged.values()];
}
