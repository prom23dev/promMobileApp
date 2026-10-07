import React, { useEffect, useRef, type ReactNode } from 'react';
import { motion } from './tokens';
import { AccessibilityInfo, Animated, Easing, Platform } from 'react-native';

// One short entrance, no artificial loading delay. Native driver for iOS/Android.
export function Reveal({ children }: { children: ReactNode }) {
  const progress = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let active = true;
    const stop = () => { progress.stopAnimation(); progress.setValue(1); };
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', reduce => { if (reduce) stop(); });
    void AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active || reduce) return;
      progress.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: motion.entrance, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start();
    }).catch(stop);
    return () => { active = false; listener.remove(); stop(); };
  }, [progress]);
  return <Animated.View style={{ opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }), transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [9, 0] }) }] }}>{children}</Animated.View>;
}
