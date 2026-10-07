import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, PanResponder, Platform, type View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useReducedMotion } from './useReducedMotion';

export function useBannerCarousel(length: number) {
  const bannerRef = useRef<View>(null);
  const [index, setIndex] = useState(0);
  const [revision, setRevision] = useState(0);
  const [touching, setTouching] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [controlFocused, setControlFocused] = useState(false);
  const [screenFocused, setScreenFocused] = useState(false);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [pageVisible, setPageVisible] = useState(true);
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  const reduced = useReducedMotion();
  const playing = userPlaying ?? !reduced;
  useFocusEffect(useCallback(() => { setScreenFocused(true); return () => { setScreenFocused(false); setTouching(false); setHovered(false); setControlFocused(false); }; }, []));
  useEffect(() => {
    const sub = AppState.addEventListener('change', value => setAppActive(value === 'active'));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const update = () => setPageVisible(document.visibilityState === 'visible');
    update(); document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => {
    if (!playing || touching || hovered || controlFocused || !screenFocused || !appActive || !pageVisible) return;
    const timer = setTimeout(() => setIndex(value => (value + 1) % length), 6000);
    return () => clearTimeout(timer);
  }, [index, revision, length, playing, touching, hovered, controlFocused, screenFocused, appActive, pageVisible]);
  const select = useCallback((value: number) => { setIndex((value + length) % length); setRevision(value => value + 1); }, [length]);
  // Native DOM touch listeners avoid RN Web's responder contention with the
  // vertical parent ScrollView. Only a deliberate horizontal gesture is claimed.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = bannerRef.current as unknown as HTMLElement | null;
    if (!node) return;
    let start: { x: number; y: number } | null = null;
    let swiped = false;
    const begin = (event: TouchEvent) => {
      swiped = false;
      start = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
      setTouching(true);
    };
    const move = (event: TouchEvent) => {
      if (event.touches.length !== 1) { start = null; return; }
      if (!start) return;
      const dx = event.touches[0].clientX - start.x, dy = event.touches[0].clientY - start.y;
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5 && event.cancelable) event.preventDefault();
    };
    const end = (event: TouchEvent) => {
      if (start && event.changedTouches.length === 1) {
        const dx = event.changedTouches[0].clientX - start.x, dy = event.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          swiped = true;
          if (event.cancelable) event.preventDefault();
          setIndex(value => (value + (dx < 0 ? 1 : length - 1)) % length);
        }
      }
      start = null; setTouching(false); setRevision(value => value + 1);
    };
    const cancel = () => { start = null; setTouching(false); setRevision(value => value + 1); };
    const click = (event: MouseEvent) => { if (swiped) { event.preventDefault(); event.stopPropagation(); swiped = false; } };
    node.style.touchAction = 'pan-y';
    node.addEventListener('touchstart', begin, { passive: true });
    node.addEventListener('touchmove', move, { passive: false });
    node.addEventListener('touchend', end, { passive: false });
    node.addEventListener('touchcancel', cancel);
    node.addEventListener('click', click, true);
    return () => {
      node.removeEventListener('touchstart', begin); node.removeEventListener('touchmove', move);
      node.removeEventListener('touchend', end); node.removeEventListener('touchcancel', cancel); node.removeEventListener('click', click, true);
    };
  }, [length]);
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) => gesture.numberActiveTouches === 1 && Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
    onPanResponderGrant: () => setTouching(true),
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) >= 45 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5) setIndex(value => (value + (gesture.dx < 0 ? 1 : length - 1)) % length);
      setTouching(false); setRevision(value => value + 1);
    },
    onPanResponderTerminate: () => { setTouching(false); setRevision(value => value + 1); },
    onPanResponderTerminationRequest: () => true,
  }), [length]);
  return { bannerRef, index, select, playing, togglePlaying: () => setUserPlaying(!playing), setTouching, setHovered, setControlFocused, panHandlers: Platform.OS === 'web' ? {} : pan.panHandlers };
}
