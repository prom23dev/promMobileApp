import { usePrivacy } from './PrivacyPreferences';
import { currentPrivacy } from './privacy-model';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { initialState, type Product, type ShopAction, type ShopState } from './domain';
import { createLocalSession, localRequest, readSession, LocalApiError, type CatalogResponse } from './api/local';
import { loadLocation, saveLocation } from './api/location';
import type { LocationState } from './location-domain';
import { emptyCatalogTree, type CatalogTree } from './catalog-tree';

type Store = { selectOrganization: (id: number) => Promise<void>; location: LocationState | null; selectLocation: (id: string) => Promise<void>; state: ShopState; products: Product[]; categories: string[]; catalogTree: CatalogTree; importedAt: string; ready: boolean; busy: boolean; error: string | null; clearError: () => void; dispatch: (action: ShopAction) => void; refresh: () => Promise<void>; retry: () => void };
const ShopContext = createContext<Store | undefined>(undefined);
export function ShopProvider({ children }: { children: ReactNode }) {
  const privacy = usePrivacy();
  const [location, setLocation] = useState<LocationState | null>(null);
  const locationRef = useRef<LocationState | null>(null);
  const acceptLocation = useCallback((value: LocationState) => { locationRef.current = value; setLocation(value); }, []);
  const [state, setState] = useState<ShopState>(initialState);
  const [catalog, setCatalog] = useState<CatalogResponse>({ products: [], categories: [], importedAt: '', mode: 'local-sandbox' });
  const [catalogTree, setCatalogTree] = useState<CatalogTree>(emptyCatalogTree);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const requests = useRef(0);
  const stateRef = useRef(state);
  const synchronized = useRef(false);
  const initializing = useRef(false);
  const acceptState = useCallback((value: ShopState) => { stateRef.current = value; setState(value); synchronized.current = true; }, []);
  const refresh = useCallback(async () => { await queue.current; acceptState(await localRequest<ShopState>('/state')); acceptLocation(await loadLocation()); }, [acceptState, acceptLocation]);
  const initialize = useCallback(async () => {
    if (initializing.current) return;
    initializing.current = true;
    await queue.current;
    synchronized.current = false;
    setError(null); setReady(false);
    try {
      const [catalogValue, saved, tree] = await Promise.all([localRequest<CatalogResponse>('/catalog'), readSession(), localRequest<CatalogTree>('/catalog-tree')]);
      if (!Array.isArray(catalogValue.products) || !catalogValue.products.every(p => typeof p.id === 'string' && Number.isSafeInteger(p.priceKopecks) && p.priceKopecks >= 0 && (p.stock === null || (Number.isSafeInteger(p.stock) && p.stock >= 0)) && (p.draftQuantityLimit === undefined || (Number.isSafeInteger(p.draftQuantityLimit) && p.draftQuantityLimit >= 1 && p.draftQuantityLimit <= 999)) && (p.discountPercent === undefined || (Number.isSafeInteger(p.discountPercent) && p.discountPercent >= 1 && p.discountPercent <= 99)))) throw new Error('Не удалось прочитать каталог');
      let sessionState: ShopState;
      try { sessionState = saved ? await localRequest<ShopState>('/state') : await createLocalSession(); }
      catch (e) { if (e instanceof LocalApiError && e.status === 401) sessionState = await createLocalSession(); else throw e; }
      if (!Array.isArray(tree.sections) || !Array.isArray(tree.rootIds)) throw new Error('Не удалось прочитать разделы каталога');
      setCatalogTree(tree); setCatalog(catalogValue); acceptState(sessionState); setReady(true);
      try { acceptLocation(await loadLocation()); } catch { locationRef.current = null; setLocation(null); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Не удалось подключиться к магазину'); }
    finally { initializing.current = false; }
  }, [acceptState, acceptLocation]);
  useEffect(() => { if (privacy.ready) void initialize(); }, [initialize, privacy.ready]);
  useEffect(() => { if (ready && privacy.ready) void refresh().catch(() => {}); }, [privacy.choice]);
  const dispatch = useCallback((action: ShopAction) => {
    if (action.type === 'favorite' && !currentPrivacy().functional) { privacy.setSettingsOpen(true); return; }
    if (!synchronized.current || (['view', 'search'].includes(action.type) && !currentPrivacy().functional)) return;
    const expectedContext = stateRef.current.context;
    requests.current++; setBusy(true); setError(null);
    queue.current = queue.current.then(async () => {
      try {
        if (!synchronized.current || (['view', 'search', 'favorite'].includes(action.type) && !currentPrivacy().functional)) return;
        const body = action.type === 'quantity' ? { type: action.type, productId: action.product.id, quantity: action.quantity } : action;
        acceptState(await localRequest<ShopState>('/actions', { method: 'POST', body: { ...body, expectedContext } }));
      } catch (e) {
        synchronized.current = false;
        const message = e instanceof Error ? e.message : 'Не удалось сохранить изменения';
        // A timed-out POST may already have committed. Reconcile before any later mutation.
        try { acceptState(await localRequest<ShopState>('/state')); }
        catch { setReady(false); }
        setError(message);
      }
      finally { requests.current--; setBusy(requests.current > 0); }
    });
  }, [acceptState]);
  const selectLocation = useCallback((id: string): Promise<void> => {
    const expectedContext = stateRef.current.context;
    const expectedVersion = locationRef.current?.version ?? 0;
    requests.current++; setBusy(true); setError(null);
    const operation = queue.current.then(async () => {
      try {
        if (!synchronized.current) throw new Error('Обновите подключение к магазину и повторите выбор.');
        acceptLocation(await saveLocation(id, expectedVersion, expectedContext));
        acceptState(await localRequest<ShopState>('/state'));
      } catch (e) {
        try { acceptState(await localRequest<ShopState>('/state')); acceptLocation(await loadLocation()); }
        catch { synchronized.current = false; setReady(false); }
        throw e;
      } finally { requests.current--; setBusy(requests.current > 0); }
    });
    queue.current = operation.catch(() => {});
    return operation;
  }, [acceptState, acceptLocation]);
  const selectOrganization = useCallback((organizationId: number): Promise<void> => {
    const expectedContext = stateRef.current.context;
    requests.current++; setBusy(true); setError(null);
    const operation = queue.current.then(async () => {
      try { acceptState(await localRequest<ShopState>('/v1/buyer/select', { method: 'POST', body: { organizationId, expectedContext, transferDraft: expectedContext === 'business' } })); acceptLocation(await loadLocation()); }
      finally { requests.current--; setBusy(requests.current > 0); }
    });
    queue.current = operation.catch(() => {}); return operation;
  }, [acceptState, acceptLocation]);
  return <ShopContext.Provider value={{ selectOrganization, location, selectLocation, state: privacy.choice?.functional ? state : { ...state, viewed: {}, searches: {}, favorites: [] }, products: catalog.products, categories: ['Все', ...catalog.categories.filter(c => c !== 'Все')], catalogTree, importedAt: catalog.importedAt, ready, busy, error, clearError: () => setError(null), dispatch, refresh, retry: () => { void initialize(); } }}>{children}</ShopContext.Provider>;
}
export function useShop(): Store {
  const store = useContext(ShopContext);
  if (!store) throw new Error('ShopProvider missing');
  return store;
}
