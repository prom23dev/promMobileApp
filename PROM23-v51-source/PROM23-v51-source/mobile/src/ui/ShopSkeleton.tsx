import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Platform, View } from 'react-native';
import { colors } from './theme';
export function ShopSkeleton() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => { let active = true; let animation: Animated.CompositeAnimation | undefined; void AccessibilityInfo.isReduceMotionEnabled().then(reduce => { if (!active || reduce) return; animation = Animated.loop(Animated.sequence([Animated.timing(opacity, { toValue: 0.45, duration: 700, useNativeDriver: Platform.OS !== 'web' }), Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' })])); animation.start(); }); const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', reduce => { if (reduce) { animation?.stop(); opacity.setValue(1); } }); return () => { active = false; animation?.stop(); listener.remove(); }; }, [opacity]);
  return <Animated.View accessibilityLabel="Загружаем каталог" style={{ width: '100%', maxWidth: 620, gap: 16, opacity }}><View style={{ height: 48, borderRadius: 12, backgroundColor: colors.line }} /><View style={{ flexDirection: 'row', gap: 12 }}>{[1, 2, 3, 4].map(i => <View key={i} style={{ flex: 1, height: 66, borderRadius: 12, backgroundColor: colors.line }} />)}</View><View style={{ flexDirection: 'row', gap: 12 }}>{[1, 2].map(i => <View key={i} style={{ flex: 1, height: 200, borderRadius: 16, backgroundColor: colors.line }} />)}</View></Animated.View>;
}
