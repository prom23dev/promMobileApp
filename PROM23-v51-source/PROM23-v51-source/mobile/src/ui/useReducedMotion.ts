import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

// One OS subscription for all consumers. RN Web keys AccessibilityInfo handlers
// by their string representation, so per-component subscriptions can leak and
// deliver dozens of synchronous updates when the preference changes.
let reduced = true;
let disconnect: (() => void) | undefined;
const listeners = new Set<() => void>();
function update(value: boolean) {
  if (value === reduced) return;
  reduced = value;
  listeners.forEach(listener => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      const onChange = (event: MediaQueryListEvent) => update(event.matches);
      reduced = query.matches;
      query.addEventListener('change', onChange);
      disconnect = () => query.removeEventListener('change', onChange);
    } else {
      let active = true;
      void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) update(value); }).catch(() => {});
      const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
      disconnect = () => { active = false; subscription?.remove(); };
    }
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) { disconnect?.(); disconnect = undefined; }
  };
}
const getSnapshot = () => reduced;
const getServerSnapshot = () => true;
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
