import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Keyboard, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, ChartNoAxesColumnIncreasing, Grid2X2, Heart, House, ShoppingCart, UserRound } from 'lucide-react-native';
import { useShop } from '../store';
import { colors } from './theme';
import { usePathname, useRouter } from 'expo-router';
const items = [
  { name: '(home)', title: 'Главная', icon: House },
  { name: '(search)', title: 'Каталог', icon: Grid2X2 },
  { name: '(shopping)', title: 'Корзина', icon: ShoppingCart },
  { name: '(saved)', title: 'Избранное', icon: Heart },
  { name: '(user)', title: 'Кабинет', icon: UserRound },
];
export function CartBadge({ count }: { count: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (!active || reduce || !count) return;
      Animated.sequence([Animated.timing(scale, { toValue: 1.18, duration: 110, useNativeDriver: Platform.OS !== 'web' }), Animated.spring(scale, { toValue: 1, speed: 24, bounciness: 2, useNativeDriver: Platform.OS !== 'web' })]).start();
    });
    return () => { active = false; scale.stopAnimation(); scale.setValue(1); };
  }, [count, scale]);
  return count > 0 ? <Animated.View accessible={false} style={{ position: 'absolute', right: -12, top: -6, minWidth: 18, paddingHorizontal: 4, height: 18, borderRadius: 9, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', transform: [{ scale }] }}><Text style={{ fontSize: 10, lineHeight: 14, color: colors.white, fontWeight: '700' }}>{count > 99 ? '99+' : count}</Text></Animated.View> : null;
}
// Every destination is an independent retained navigator, not a recreated root page.
export function BottomNavigation({ state: navigationState, navigation }: { state: any; navigation: any }) {
  const { state } = useShop(); const insets = useSafeAreaInsets();
  const router = useRouter(); const pathname = usePathname();
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => { const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true)); const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false)); return () => { show.remove(); hide.remove(); }; }, []);
  const count = state.carts[state.context].reduce((sum, line) => sum + line.quantity, 0);
  if (keyboard) return null;
  return <View>
    {state.comparison.length > 0 && pathname !== '/compare' && <Pressable testID="comparison-shortcut" accessibilityRole="button" accessibilityLabel={'Открыть сравнение. Товаров: ' + state.comparison.length} onPress={() => router.push('/compare')} style={({ pressed }) => ({ minHeight: 48, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: pressed ? '#FFE1D4' : '#FFF1EB', borderTopWidth: 1, borderTopColor: '#F3CDBE' })}>
      <ChartNoAxesColumnIncreasing size={21} color={colors.accent} />
      <Text style={{ flex: 1, color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '600' }}>Открыть сравнение</Text>
      <Text accessibilityLiveRegion="polite" accessibilityLabel={'Товаров в сравнении: ' + state.comparison.length} style={{ minWidth: 25, paddingHorizontal: 6, paddingVertical: 2, textAlign: 'center', borderRadius: 7, backgroundColor: colors.white, color: colors.accent, fontSize: 14, lineHeight: 20, fontWeight: '700' }}>{state.comparison.length}</Text>
      <ArrowRight size={19} color={colors.accent} />
    </Pressable>}
    <View testID="bottom-navigation" accessibilityLabel="Основная навигация" style={{ flexDirection: 'row', paddingTop: 5, paddingBottom: Math.max(insets.bottom, 6), backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line }}>
    {items.map(item => {
      const route = navigationState.routes.find((r: any) => r.name === item.name);
      if (!route) return null;
      const selected = navigationState.routes[navigationState.index].key === route.key;
      const color = selected ? colors.accent : colors.muted; const Icon = item.icon;
      const business = state.context !== 'personal';
      const title = business && item.name === '(user)' ? 'Бизнес-кабинет' : item.title;
      return <Pressable key={item.name} accessibilityRole="tab" accessibilityState={{ selected }} aria-selected={selected} accessibilityLabel={item.name === '(shopping)' ? `${business ? 'Корзина для бизнеса' : 'Корзина'}. Товаров: ${count}` : business && item.name === '(user)' ? 'Кабинет для бизнеса' : item.title} onPress={() => { const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true }); if (!selected && !event.defaultPrevented) navigation.navigate(route.name); }} style={({ pressed }) => ({ flex: 1, minHeight: 51, alignItems: 'center', justifyContent: 'center', gap: 3, opacity: pressed ? 0.6 : 1 })}>
        <View style={{ position: 'relative' }}><Icon size={23} color={color} strokeWidth={selected ? 2.1 : 1.7} />{item.name === '(shopping)' && <CartBadge count={count} />}</View><Text style={{ fontSize: 10, lineHeight: 15, fontWeight: selected ? '700' : '500', color, textAlign: 'center' }}>{title}</Text>
      </Pressable>;
    })}
  </View></View>;
}
