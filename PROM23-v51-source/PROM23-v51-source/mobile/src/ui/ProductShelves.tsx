import { usePrivacy } from '../PrivacyPreferences';
import { legalCopy } from '../content/legalCopy';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import type { Product } from '../domain';
import { useShop } from '../store';
import { productShelves } from '../recommendations';
import { ProductCard } from './ProductCard';
import { Reveal } from './Reveal';
import { colors, layout, type } from './theme';

function Shelf({ title, products, subtitle, clear, home = false }: { title: string; products: Product[]; subtitle?: string; clear?: () => void; home?: boolean }) {
  const { width, fontScale } = useWindowDimensions();
  const rail = useRef<FlatList<Product>>(null);
  const [offset, setOffset] = useState(0);
  const cardWidth = fontScale > 1.5 ? 260 : home ? (width < 360 ? 150 : width < 700 ? 164 : 210) : Math.min(220, Math.max(164, (Math.min(width, 760) - 38) / 2));
  if (!products.length) return null;
  return <View style={{ gap: 10 }}>
    <View style={[layout.between, { gap: 8 }]}><Text accessibilityRole="header" aria-level={2} style={[type.heading, { flex: 1 }, home && { fontSize: 21, lineHeight: 26 }]}>{title}</Text>{clear && <Pressable accessibilityRole="button" accessibilityLabel="Очистить историю просмотров" onPress={clear} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 5 }}><Text style={[type.caption, { color: colors.brand }]}>Очистить</Text></Pressable>}</View>
    {subtitle && <Text style={type.caption}>{subtitle}</Text>}
    <FlatList ref={rail} onScroll={home ? event => setOffset(event.nativeEvent.contentOffset.x) : undefined} scrollEventThrottle={100} horizontal accessibilityLabel={title} data={products} keyExtractor={item => item.id} showsHorizontalScrollIndicator={!home} initialNumToRender={3} maxToRenderPerBatch={3} windowSize={3} ItemSeparatorComponent={() => <View style={{ width: 10 }} />} contentContainerStyle={{ paddingBottom: 8 }} renderItem={({ item }) => <View style={{ width: cardWidth }}><ProductCard product={item} compact={home} home={home} /></View>} />
    {home && products.length > 2 && <View style={layout.between}><Text style={type.caption}>{products.length} товаров в подборке</Text><View style={[layout.row, { gap: 8 }]}>{[-1, 1].map(direction => <Pressable key={direction} accessibilityRole="button" accessibilityLabel={(direction < 0 ? 'Предыдущие товары: ' : 'Следующие товары: ') + title} disabled={direction < 0 ? offset < 1 : offset >= products.length * (cardWidth + 10) - Math.min(width, 720) + 20} onPress={() => rail.current?.scrollToOffset({ offset: Math.max(0, offset + direction * (cardWidth + 10) * 2), animated: false })} style={({ pressed }) => ({ minHeight: 44, width: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 12, backgroundColor: colors.background, opacity: pressed ? 0.6 : 1 })}>{direction < 0 ? <ChevronLeft size={19} color={colors.brand} /> : <ChevronRight size={19} color={colors.brand} />}</Pressable>)}</View></View>}
  </View>;
}
function VerticalShelf({ title, subtitle, products, testID }: { title: string; subtitle?: string; products: Product[]; testID: string }) {
  const { width, fontScale } = useWindowDimensions(); const [limit, setLimit] = useState(6);
  const columns = fontScale > 1.5 ? 1 : width >= 700 ? 3 : 2;
  const shown = products.slice(0, limit);
  const rows = Array.from({ length: Math.ceil(shown.length / columns) }, (_, i) => shown.slice(i * columns, i * columns + columns));
  if (!products.length) return null;
  return <View testID={testID} style={{ gap: 12 }}><Text accessibilityRole="header" aria-level={2} style={[type.heading, { fontSize: 21, lineHeight: 26 }]}>{title}</Text>{subtitle && <Text style={type.body}>{subtitle}</Text>}
    {rows.map(row => <View key={row[0].id} style={{ flexDirection: 'row', gap: 10 }}>{row.map(product => <View key={product.id} testID={testID + '-card-' + product.id} style={{ flex: 1, minWidth: 0 }}><ProductCard product={product} compact home /></View>)}{Array.from({ length: columns - row.length }, (_, i) => <View key={i} style={{ flex: 1 }} />)}</View>)}
    <Text accessibilityLiveRegion="polite" style={type.caption}>Показано {shown.length} из {products.length}</Text>
    {limit < products.length && <Pressable accessibilityRole="button" accessibilityLabel={'Показать ещё: ' + title} onPress={() => setLimit(value => value + 6)} style={({ pressed }) => ({ minHeight: 48, padding: 12, borderRadius: 12, backgroundColor: colors.pale, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: pressed ? 0.7 : 1 })}><Text style={type.label}>Показать ещё товары</Text><ArrowDown size={18} color={colors.brand} /></Pressable>}
  </View>;
}
export function ProductShelves({ scope = 'all', home = false }: { home?: boolean; scope?: 'all' | 'popular' | 'personalized' | 'discounts' | 'manufactured' }) {
  const privacy = usePrivacy(); const router = useRouter();
  const { state, products, dispatch, busy } = useShop();
  const { width, fontScale } = useWindowDimensions();
  const popularWidth = fontScale > 1.5 ? Math.min(width, 720) - 32 : Math.floor((Math.min(width, 720) - (width >= 700 ? 52 : 42)) / (width >= 700 ? 3 : 2));
  const [expanded, setExpanded] = useState(false);
  const shelves = useMemo(() => productShelves(products, state, !!privacy.choice?.personalization), [products, state, privacy.choice?.personalization]);
  if (scope === 'discounts') return <Shelf home={home} title="Сейчас со скидкой" products={products.filter(p => p.oldPriceKopecks && p.oldPriceKopecks > p.priceKopecks).sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0)).slice(0, 10)} />;
  if (home && scope === 'popular') return <VerticalShelf testID="home-popular" title="Популярные товары" products={shelves.popular} />;
  if (home && scope === 'manufactured') return <VerticalShelf testID="home-manufactured" title="Рекомендуем к покупке" subtitle="Товары нашего производства" products={products.filter(p => p.specs.some(s => s.label === 'Производитель' && /^(Промышленник|TeaM|ТЕАМ)(\s|$)/i.test(s.value)))} />;
  if (scope === 'manufactured') return <Shelf home={home} title="Рекомендуем к покупке" products={products.filter(p => p.specs.some(s => s.label === 'Производитель' && /^(Промышленник|TeaM|ТЕАМ)(\s|$)/i.test(s.value))).slice(0, 10)} subtitle="Товары нашего производства" />;
  const shown = expanded ? shelves.popular : shelves.popular.slice(0, 6);
  return <View style={{ gap: 28, paddingTop: 0 }}>
    {scope !== 'personalized' && !!shown.length && <View testID="home-popular" style={{ gap: 12 }}>
      <View style={layout.between}><Text accessibilityRole="header" aria-level={2} style={[type.heading, { flex: 1 }]}>Популярные товары</Text><Text style={type.caption}>{shelves.popular.length}</Text></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{shown.map((product, index) => <View key={product.id} style={{ width: popularWidth, flexGrow: 1, maxWidth: popularWidth }}>{index < 6 ? <ProductCard product={product} compact home={home} /> : <Reveal><ProductCard product={product} compact home={home} /></Reveal>}</View>)}</View>
      {shelves.popular.length > 6 && <Pressable accessibilityRole="button" accessibilityState={{ expanded }} aria-expanded={expanded} onPress={() => setExpanded(!expanded)} style={({ pressed }) => ({ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, opacity: pressed ? 0.75 : 1 })}><Text style={[type.label, { color: colors.brand }]}>{expanded ? 'Свернуть подборку' : `Показать ещё · ${shelves.popular.length - 6}`}</Text></Pressable>}
    </View>}
    {scope !== 'popular' && <><Shelf home={home} title="Вы интересовались" products={shelves.viewed} clear={shelves.viewed.length && !busy ? () => dispatch({ type: 'clear-viewed' }) : undefined} />
    <>{privacy.choice?.personalization && shelves.recommended.length > 0 && <View style={{gap: 10}}><Shelf home={home} title="Могут понадобиться" products={shelves.recommended} subtitle="По разделам, которые вы просматривали" /><Text style={type.caption}>{legalCopy.personalization}</Text><Pressable accessibilityRole="button" onPress={() => privacy.setSettingsOpen(true)} style={{minHeight:44,justifyContent:"center"}}><Text style={type.label}>Настройки cookie</Text></Pressable><Pressable accessibilityRole="link" onPress={() => router.push("/legal/recommendations")} style={{minHeight:44,justifyContent:"center"}}><Text style={type.caption}>Правила применения рекомендательных технологий</Text></Pressable></View>}</></>}
  </View>;
}
