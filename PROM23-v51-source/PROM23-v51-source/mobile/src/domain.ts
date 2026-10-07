import { cleanSearch, rememberSearch } from './search-history';
export type ContextId = 'personal' | 'business' | `organization:${number}` | 'organization-demo';
export type ProductKind = 'scaffold' | 'tower' | 'ladder' | 'mixer' | 'tool' | 'equipment';
export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  kind: ProductKind;
  priceKopecks: number;
  oldPriceKopecks?: number;
  discountPercent?: number;
  stock: number | null;
  saleMode?: 'BUYABLE' | 'REQUEST_ONLY' | 'CUSTOM_PRODUCTION';
  // Editing limit for an unconfirmed basket, never evidence of physical inventory.
  draftQuantityLimit?: number;
  unit: string;
  specs: { label: string; value: string }[];
  imageFile?: string;
  sourceUrl?: string;
  importedAt?: string;
  availabilityText?: string;
  priceSource?: string;
  stockSource?: string;
  unitSource?: string;
  sectionIds?: string[];
  popularRank?: number;
};
export type CartLine = { productId: string; quantity: number; selected?: boolean };
export type ShopState = {
  context: ContextId;
  activeOrganization?: { id: number; name: string; inn?: string } | null;
  carts: Record<ContextId, CartLine[]>;
  favorites: string[];
  comparison: string[];
  city: string;
  viewed?: Partial<Record<ContextId, string[]>>;
  searches?: Partial<Record<ContextId, string[]>>;
};
export const initialState: ShopState = {
  context: 'personal',
  carts: { personal: [], business: [], 'organization-demo': [] },
  favorites: [], comparison: [], city: '', viewed: { personal: [], business: [], 'organization-demo': [] }, searches: { personal: [], business: [], 'organization-demo': [] },
};
export type ShopAction =
  | { type: 'context'; context: ContextId }
  | { type: 'quantity'; product: Product; quantity: number }
  | { type: 'cart-select'; productId?: string; selected: boolean }
  | { type: 'favorite'; productId: string }
  | { type: 'compare'; productId: string }
  | { type: 'city'; city: string }
  | { type: 'view'; productId: string }
  | { type: 'clear-viewed' }
  | { type: 'search'; query: string }
  | { type: 'remove-search'; query: string }
  | { type: 'clear-searches' }
  | { type: 'reset' };

export function shopReducer(state: ShopState, action: ShopAction): ShopState {
  switch (action.type) {
    case 'search':
    case 'remove-search':
    case 'clear-searches': {
      const searches = state.searches ?? { personal: [], business: [], 'organization-demo': [] };
      const previous = searches[state.context] ?? [];
      const next = action.type === 'clear-searches' ? [] : action.type === 'search' ? rememberSearch(previous, action.query) : previous.filter(q => q.toLocaleLowerCase('ru') !== cleanSearch(action.query).toLocaleLowerCase('ru'));
      return { ...state, searches: { ...searches, [state.context]: next } };
    }
    case 'context': return { ...state, context: action.context };
    case 'city': return { ...state, city: action.city };
    case 'reset': return { ...initialState, carts: { personal: [], business: [], 'organization-demo': [] }, viewed: { personal: [], business: [], 'organization-demo': [] } };
    case 'view': {
      const viewed = state.viewed ?? { personal: [], business: [], 'organization-demo': [] };
      return { ...state, viewed: { ...viewed, [state.context]: [action.productId, ...(viewed[state.context] ?? []).filter(id => id !== action.productId)].slice(0, 30) } };
    }
    case 'clear-viewed': return { ...state, viewed: { ...state.viewed, personal: state.viewed?.personal ?? [], 'organization-demo': state.viewed?.['organization-demo'] ?? [], [state.context]: [] } };
    case 'favorite': return { ...state, favorites: toggle(state.favorites, action.productId) };
    case 'compare': {
      if (!state.comparison.includes(action.productId) && state.comparison.length >= 6) return state;
      return { ...state, comparison: toggle(state.comparison, action.productId) };
    }
    case 'cart-select': return { ...state, carts: { ...state.carts, [state.context]: state.carts[state.context].map(line => !action.productId || line.productId === action.productId ? { ...line, selected: action.selected } : line) } };
    case 'quantity': {
      if (!Number.isSafeInteger(action.quantity) || action.quantity < 0) return state;
      const limit = productQuantityLimit(action.product);
      if (limit === 0 && action.product.stock !== 0) return state;
      const quantity = Math.min(action.quantity, limit);
      const current = state.carts[state.context].filter(line => line.productId !== action.product.id);
      if (quantity > 0) current.push({ productId: action.product.id, quantity, ...(state.carts[state.context].find(l => l.productId === action.product.id)?.selected === false ? { selected: false } : {}) });
      return { ...state, carts: { ...state.carts, [state.context]: current } };
    }
  }
}
function toggle(items: string[], id: string): string[] {
  return items.includes(id) ? items.filter(item => item !== id) : [...items, id];
}
export function productQuantityLimit(product: Product): number {
  if (product.stock !== null && (!Number.isSafeInteger(product.stock) || product.stock < 0)) return 0;
  const draftLimit = product.draftQuantityLimit ?? 999;
  if (!Number.isSafeInteger(draftLimit) || draftLimit < 1 || draftLimit > 999) return 0;
  return Math.min(product.stock ?? 999, draftLimit, 999);
}
export function productAvailability(product: Product): string {
  return product.stock === null ? 'Наличие уточняйте при заказе' : product.stock === 0 ? 'Нет в наличии' : 'В наличии';
}
export function cartTotal(lines: CartLine[], catalog: Product[]): number {
  return lines.reduce((total, line) => {
    const product = catalog.find(item => item.id === line.productId);
    if (!product || !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > productQuantityLimit(product)) {
      throw new Error('Корзина требует обновления');
    }
    if (!Number.isSafeInteger(product.priceKopecks) || product.priceKopecks < 0) throw new Error('Некорректная цена');
    const next = total + product.priceKopecks * line.quantity;
    if (!Number.isSafeInteger(next) || next < 0) throw new Error('Некорректная сумма');
    return next;
  }, 0);
}
export function formatMoney(kopecks: number): string {
  if (!Number.isSafeInteger(kopecks) || kopecks < 0) throw new Error('Некорректная цена');
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency', currency: 'RUB', minimumFractionDigits: kopecks % 100 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(kopecks / 100);
}
export function searchProducts(catalog: Product[], query: string, category = 'Все', sort = 'default'): Product[] {
  const terms = query.trim().toLocaleLowerCase('ru-RU').split(/\s+/).filter(Boolean);
  const results = catalog.filter(product => {
    const text = `${product.name} ${product.sku}`.toLocaleLowerCase('ru-RU');
    return (category === 'Все' || product.category === category) && terms.every(term => text.includes(term));
  });
  if (sort === 'price-asc') results.sort((a, b) => a.priceKopecks - b.priceKopecks);
  if (sort === 'price-desc') results.sort((a, b) => b.priceKopecks - a.priceKopecks);
  return results;
}

// Unknown stock is a request scenario, never a promise of immediate purchase.
export const productSaleMode = (product: Product) => product.saleMode ?? (product.stock === null ? 'REQUEST_ONLY' : 'BUYABLE');

// Unknown stock does not prevent a business basket draft; actual order remains quote-gated.
export const canDraftBusinessPurchase = (product: Product) => !product.saleMode && product.stock !== 0 && Number.isSafeInteger(product.priceKopecks) && product.priceKopecks > 0;
