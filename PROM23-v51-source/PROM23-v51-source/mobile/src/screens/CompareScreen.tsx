import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChartNoAxesColumnIncreasing, Check, X } from 'lucide-react-native';
import { formatMoney, type Product } from '../domain';
import { useShop } from '../store';
import { colors, layout, type } from '../ui/theme';
import { Button, ConnectionState, EmptyState, Header, IconButton, ShopError } from '../ui/primitives';
import { QuantityControl } from '../ui/ProductCard';
import { ProductPhoto } from '../ui/ProductPhoto';
import { displaySpecs } from '../ui/product-data';

const specValue = (product: Product, label: string) => [...new Set(displaySpecs(product).filter(s => s.label === label).map(s => s.value))].join(' / ') || 'Не указано';

export default function CompareScreen() {
  const { state, products, dispatch, ready, busy } = useShop();
  const router = useRouter();
  const [differences, setDifferences] = useState(false);
  const [category, setCategory] = useState('');
  const { fontScale } = useWindowDimensions();
  const saved = products.filter(product => state.comparison.includes(product.id));
  const categories = [...new Set(saved.map(product => product.category))];
  const activeCategory = categories.includes(category) ? category : categories[0];
  const selected = saved.filter(product => product.category === activeCategory);
  const allLabels = [...new Set(selected.flatMap(product => displaySpecs(product).map(spec => spec.label)))];
  const labels = differences && selected.length > 1 ? allLabels.filter(label => new Set(selected.map(p => specValue(p, label))).size > 1) : allLabels;
  const cellWidth = fontScale > 1.5 ? 250 : 184;
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right', 'bottom']}>
    <Header title={'Сравнение · ' + saved.length} back />
    <ShopError />
    {!ready ? <ConnectionState /> : selected.length ? <ScrollView buyerControls style={layout.content} contentContainerStyle={{ paddingVertical: 12, gap: 12 }}>
      <View style={{ paddingHorizontal: 16, gap: 4 }}>
        <Text style={type.body}>Характеристики и цены рядом.</Text>
        <Text style={type.caption}>Комплектацию и наличие уточняйте при заказе.</Text>
        {categories.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 10, paddingBottom: 6 }}>
          {categories.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: item === activeCategory }} aria-selected={item === activeCategory} onPress={() => setCategory(item)} style={[s.category, item === activeCategory && { backgroundColor: colors.brand }]}><Text style={[type.label, item === activeCategory && { color: colors.white }]}>{item} · {saved.filter(p => p.category === item).length}</Text></Pressable>)}
        </ScrollView>}
        {selected.length === 1 ? <Text style={type.caption}>Добавьте ещё товар, чтобы увидеть различия.</Text> : <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: differences }} aria-checked={differences} onPress={() => setDifferences(!differences)} style={[layout.row, { minHeight: 48, gap: 10 }]}>
          <View style={[s.checkbox, differences && { backgroundColor: colors.brand }]}>{differences && <Check size={16} color={colors.white} />}</View><Text style={type.label}>Только различия</Text>
        </Pressable>}
      </View>
      <ScrollView horizontal contentContainerStyle={{ paddingHorizontal: 16 }}>
        <View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {selected.map(product => <View key={product.id} style={[s.product, { width: cellWidth }]}>
              <View style={{ alignItems: 'flex-end' }}><IconButton disabled={busy} label={'Убрать из сравнения: ' + product.name} onPress={() => dispatch({ type: 'compare', productId: product.id })}><X color={colors.brand} size={19} /></IconButton></View>
              <Pressable accessibilityRole="button" accessibilityLabel={'Открыть: ' + product.name} onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}><ProductPhoto product={product} style={{ height: 140, width: '100%' }} /></Pressable>
              <View style={{ padding: 12, gap: 8 }}>
                <Text numberOfLines={4} style={[type.label, { minHeight: 80 * Math.min(fontScale, 1.5) }]}>{product.name}</Text>
                <Text numberOfLines={1} style={type.caption}>{product.sku}</Text>
                <Text style={type.heading}>{formatMoney(product.priceKopecks)}</Text>
                <Text style={[type.caption, { minHeight: 40 }]}>Наличие уточняйте при заказе</Text>
                <QuantityControl product={product} />
              </View>
            </View>)}
          </View>
          {labels.map(label => <View key={label} style={{ paddingTop: 18 }}>
            <Text style={[type.caption, { paddingBottom: 7, paddingHorizontal: 3 }]}>{label}</Text>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'stretch' }}>{selected.map(product => <View key={product.id} style={{ width: cellWidth, backgroundColor: colors.white, padding: 12, borderRadius: 10 }}><Text selectable style={type.body}>{specValue(product, label)}</Text></View>)}</View>
          </View>)}
        </View>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}><Button label={selected.length < 3 ? 'Добавить из каталога' : 'Вернуться в каталог'} variant="secondary" onPress={() => router.push('/catalog')} /></View>
    </ScrollView> : <ScrollView buyerControls style={layout.content}><EmptyState icon={<ChartNoAxesColumnIncreasing color={colors.brand} size={34} />} title="Сравните перед покупкой" message="Добавьте до шести товаров кнопкой сравнения в каталоге. Здесь появятся их цены и технические характеристики." action={<Button label="Открыть каталог" onPress={() => router.push('/catalog')} />} /></ScrollView>}
  </SafeAreaView>;
}
const s = StyleSheet.create({
  product: { backgroundColor: colors.white, borderRadius: 15, overflow: 'hidden' },
  category: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 11, backgroundColor: colors.white },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
});
