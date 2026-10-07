import React, { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Platform, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

// IntersectionObserver respects the clipping ScrollView on web. Native measures only
// unrevealed nodes, at most once per 100ms; all animations use the native driver.
const ScrollContext = createContext<Animated.Value | null>(null);
export const VerticalScrollProvider = ScrollContext.Provider;
export function VerticalReveal({ children, kind = 'rise', delay = 0, style, testID }: {
  children?: ReactNode; kind?: 'rise' | 'scale' | 'line' | 'fade'; delay?: number;
  style?: StyleProp<ViewStyle>; testID?: string;
}) {
  const node = useRef<View>(null); const progress = useRef(new Animated.Value(1)).current;
  const scrollY = useContext(ScrollContext); const reduced = useReducedMotion(); const { height } = useWindowDimensions();
  useEffect(() => {
    progress.stopAnimation(); progress.setValue(1);
    if (reduced) return;
    let done = false, active = true, last = 0;
    progress.setValue(0);
    const reveal = () => {
      if (!active || done) return; done = true;
      Animated.timing(progress, { toValue: 1, duration: 260, delay: Math.min(delay, 140), easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start();
    };
    let observer: IntersectionObserver | undefined; let listener: string | undefined;
    if (Platform.OS === 'web' && typeof IntersectionObserver !== 'undefined' && node.current) {
      observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { reveal(); observer?.disconnect(); } }, { threshold: 0.08 });
      observer.observe(node.current as unknown as Element);
    } else if (Platform.OS !== 'web') {
      const check = () => { if (done || Date.now() - last < 100) return; last = Date.now(); node.current?.measureInWindow((_x, y, _w, h) => { if (y < height * .93 && y + h > 0) reveal(); }); };
      listener = scrollY?.addListener(check); check();
    } else reveal();
    return () => { active = false; observer?.disconnect(); if (listener) scrollY?.removeListener(listener); progress.stopAnimation(); };
  }, [delay, height, progress, reduced, scrollY]);
  const transform = reduced ? [] : kind === 'line' ? [{ scaleY: progress }] : kind === 'scale' ? [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [.96, 1] }) }] : kind === 'rise' ? [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] : [];
  return <Animated.View ref={node} testID={testID} style={[style, { opacity: reduced ? 1 : progress.interpolate({ inputRange: [0, 1], outputRange: [kind === 'line' ? 0 : .88, 1] }), transform }, kind === 'line' && { transformOrigin: 'top' }]}>{children}</Animated.View>;
}
