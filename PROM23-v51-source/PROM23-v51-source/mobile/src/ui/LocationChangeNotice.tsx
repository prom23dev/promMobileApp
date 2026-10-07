import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';
import { useShop } from '../store';
import { settlementLabel } from '../location-domain';
import { TransientNotice, type NoticeMessage } from './TransientNotice';

export function LocationChangeNotice() {
  const { location, state } = useShop();
  const reduced = useReducedMotion();
  const seen = useRef<number | null>(null);
  const [notice, setNotice] = useState<NoticeMessage | null>(null);
  const hasCart = state.carts[state.context].length > 0;
  useEffect(() => {
    if (!location) return;
    // Initial hydration/reload establishes the baseline, never replays feedback.
    if (seen.current !== null && location.version !== seen.current && location.settlement) {
      setNotice({ id: location.version, shownAt: Date.now(), title: settlementLabel(location.settlement) + ' — место получения изменено',
        body: hasCart ? 'Корзина сохранена. Наличие, цены и доставку нужно подтвердить для нового адреса.' : 'Варианты получения зависят от нового адреса и выбранного товара.' });
    }
    seen.current = location.version;
  }, [location, hasCart]);
  const dismiss = useCallback((id: number) => setNotice(current => current?.id === id ? null : current), []);
  return notice ? <TransientNotice key={notice.id} notice={notice} onDismiss={dismiss} reduced={reduced} /> : null;
}
