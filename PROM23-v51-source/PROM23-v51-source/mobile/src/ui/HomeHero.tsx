import React, { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowUpRight, ArrowRight } from 'lucide-react-native';
import { useShop } from '../store';
import { formatMoney } from '../domain';
import { colors, layout, type } from './theme';
import { Reveal } from './Reveal';
import { ProductPhoto } from './ProductPhoto';
const scenes = [
  { label: 'Производство', title: 'Леса. Вышки.\nОборудование.', subtitle: 'Технологический визуал', image: require('../../assets/brand/automated-tube-concept.png'), alt: 'Технологический визуал: автоматизированная обработка круглой трубы, не фотография предприятия', route: '/information/production' },
  { label: 'На объектах', title: 'От мастерской\nдо Москва-Сити', subtitle: 'Посмотрите реальные проекты', image: require('../../assets/blog/gallery-moscow-city-02.jpg'), alt: 'Строительные леса на объекте Москва-Сити', route: '/blog/projects-moscow-city' },
] as const;
export function HomeHero() {
  const router = useRouter(); const { state, products } = useShop();
  const [selected, setSelected] = useState(0); const scene = scenes[selected];
  const lines = state.carts[state.context]; const first = products.find(p => p.id === lines[0]?.productId);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + (products.find(p => p.id === line.productId)?.priceKopecks ?? 0) * line.quantity, 0);
  return <View testID="home-hero" style={{ gap: 10 }}>
    <View style={{ borderRadius: 18, overflow: 'hidden', backgroundColor: colors.pale }}>
      <Reveal key={scene.label}><Pressable accessibilityRole="button" accessibilityLabel={scene.label + ': подробнее'} onPress={() => router.push(scene.route)} style={({ pressed }) => ({ flexDirection: 'row', opacity: pressed ? 0.8 : 1 })}>
        <View style={{ flex: 1, padding: 14, gap: 5 }}><Text style={[type.caption, { fontSize: 10, fontWeight: '700', color: colors.brand, letterSpacing: 0.7 }]}>КОМПАНИЯ С 2008 ГОДА</Text><Text accessibilityRole="header" aria-level={1} style={[type.subheading, { fontSize: 19, lineHeight: 22, letterSpacing: -0.5 }]}>{scene.title}</Text><Text style={[type.caption, { color: colors.brand }]}>{scene.subtitle}</Text><Text style={[type.caption, { color: colors.brand, fontWeight: '600' }]}>{selected === 0 ? 'О производстве →' : 'Смотреть проект →'}</Text></View>
        <View style={{ width: '35%', minHeight: 106 }}><Image source={scene.image} accessibilityLabel={scene.alt} resizeMode="cover" style={{ width: '100%', height: '100%' }} /><View style={{ position: 'absolute', right: 8, bottom: 8, backgroundColor: colors.white, borderRadius: 20, padding: 5 }}><ArrowUpRight size={17} color={colors.brand} /></View></View>
      </Pressable></Reveal>
      <View style={{ flexDirection: 'row', paddingHorizontal: 8, borderTopWidth: 1, borderTopColor: colors.line }}>{scenes.map((item, index) => <Pressable key={item.label} accessibilityRole="tab" accessibilityState={{ selected: selected === index }} aria-selected={selected === index} accessibilityLabel={'Показать: ' + item.label} onPress={() => setSelected(index)} style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: index === selected ? colors.accent : 'transparent' }}><Text style={[type.caption, { color: index === selected ? colors.ink : colors.muted, fontWeight: '600' }]}>{item.label}</Text></Pressable>)}</View>
    </View>
    {count > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Продолжить оформление корзины" onPress={() => router.push('/cart')} style={({ pressed }) => [layout.row, { gap: 10, borderRadius: 14, padding: 10, backgroundColor: colors.background, opacity: pressed ? 0.75 : 1 }]}>{first && <ProductPhoto product={first} style={{ width: 44, height: 44, borderRadius: 8 }} />}<View style={{ flex: 1 }}><Text style={type.label}>В корзине {count} ед. · {formatMoney(total)}</Text><Text style={[type.caption, { color: colors.accent, fontWeight: '600' }]}>Открыть корзину</Text></View><ArrowRight size={20} color={colors.accent} /></Pressable>}
  </View>;
}
