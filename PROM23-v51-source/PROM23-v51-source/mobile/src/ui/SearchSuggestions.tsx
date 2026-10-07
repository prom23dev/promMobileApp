import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Clock3, Search, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { formatMoney, productAvailability } from '../domain';
import { productSuggestions, viewedProductSections } from '../search-discovery';
import { ProductPhoto } from './ProductPhoto';
import { useShop } from '../store';
import { IconButton } from './primitives';
import { colors, layout, type } from './theme';

export function SearchSuggestions({ query = '', onChoose, onClose }: { query?: string; onChoose: (value: string) => void; onClose: () => void }) {
  const router = useRouter();
  const { state, dispatch, busy, products, catalogTree } = useShop();
  const recent = (state.viewed?.[state.context] ?? []).map(id => products.find(p => p.id === id)).filter(p => !!p).slice(0, 3);
  const history = state.searches?.[state.context] ?? [];
  const viewed = state.viewed?.[state.context] ?? [];
  const sections = useMemo(() => viewedProductSections(viewed, products, catalogTree), [viewed, products, catalogTree]);
  const matching = useMemo(() => productSuggestions(products, query, 4), [products, query]);
  const ranked = products.filter(product => Number.isInteger(product.popularRank) && product.popularRank! > 0).sort((a, b) => a.popularRank! - b.popularRank!).slice(0, 3);
  const suggestions = query.trim() ? matching : recent.length ? recent : ranked.length ? ranked : products.slice(0, 3);
  const suggestionTitle = query.trim() ? 'Подходящие товары' : recent.length ? 'Недавно смотрели' : ranked.length ? 'Популярные товары' : 'Товары из каталога';
  const openProduct = (id: string) => { if (query.trim()) dispatch({ type: 'search', query }); onClose(); router.push({ pathname: '/product/[id]', params: { id } }); };
  return <View style={[layout.card, { padding: 12, gap: 4, borderWidth: 1, borderColor: colors.line }]}>
    <View style={layout.between}><Text style={type.subheading}>История поиска</Text><Pressable accessibilityRole="button" accessibilityLabel="Закрыть подсказки поиска" onPress={onClose} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={[type.label, { color: colors.brand }]}>Готово</Text></Pressable></View>
    {history.length ? <><ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 180 }}>{history.map(historyQuery => <View key={historyQuery} style={[layout.row, { gap: 6 }]}><Pressable accessibilityRole="button" accessibilityLabel={'Искать снова: ' + historyQuery} onPress={() => onChoose(historyQuery)} style={[layout.row, { flex: 1, minHeight: 44, gap: 10 }]}><Clock3 size={17} color={colors.muted} /><Text style={[type.body, { flex: 1 }]} numberOfLines={2}>{historyQuery}</Text></Pressable><IconButton label={'Удалить запрос: ' + historyQuery} disabled={busy} onPress={() => dispatch({ type: 'remove-search', query: historyQuery })}><X size={17} color={colors.muted} /></IconButton></View>)}</ScrollView><Pressable accessibilityRole="button" disabled={busy} onPress={() => dispatch({ type: 'clear-searches' })} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={[type.caption, { color: colors.brand }]}>Очистить историю поиска</Text></Pressable></> : <Text style={[type.caption, { paddingBottom: 10 }]}>Здесь появятся запросы, которые вы искали.</Text>}
    <Text style={[type.label, { paddingVertical: 8 }]}>Быстрый поиск</Text><View style={[layout.row, { flexWrap: 'wrap', gap: 7 }]}>{['Леса', 'Вышка-тура', 'Стремянка'].map(quickQuery => <Pressable key={quickQuery} accessibilityRole="button" onPress={() => onChoose(quickQuery)} style={[layout.row, { minHeight: 44, borderRadius: 10, backgroundColor: colors.pale, gap: 6, paddingHorizontal: 10 }]}><Search size={14} color={colors.brand} /><Text style={type.caption}>{quickQuery}</Text></Pressable>)}</View>
    {sections.length > 0 && <View testID="search-recent-categories" style={{ gap: 6, paddingTop: 12 }}><Text style={type.label}>Разделы просмотренных товаров</Text><View style={[layout.row, { flexWrap: 'wrap', gap: 6 }]}>{sections.map(section => <Pressable key={section.id} accessibilityRole="button" accessibilityLabel={'Открыть недавний раздел: ' + section.name} onPress={() => { onClose(); router.push({ pathname: '/catalog/section/[section]', params: { section: section.id } }); }} style={{ minHeight: 44, maxWidth: '100%', paddingHorizontal: 10, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.pale, justifyContent: 'center' }}><Text style={type.caption}>{section.name}</Text></Pressable>)}</View></View>}
    {suggestions.length > 0 && <View testID="search-product-suggestions"><Text style={[type.label, { paddingTop: 12 }]}>{suggestionTitle}</Text>{suggestions.map(product => <Pressable key={product.id} accessibilityRole="button" accessibilityLabel={(suggestionTitle === 'Недавно смотрели' ? 'Открыть недавно просмотренный товар: ' : 'Открыть подсказку товара: ') + product.name} onPress={() => openProduct(product.id)} style={[layout.row, { gap: 10, paddingVertical: 10, minHeight: 88, borderBottomWidth: 1, borderBottomColor: colors.line }]}><ProductPhoto product={product} style={{ width: 48, height: 60 }} /><View style={{ flex: 1, gap: 3 }}><Text numberOfLines={2} style={type.caption}>{product.name}</Text><Text style={type.label}>{formatMoney(product.priceKopecks)}</Text><Text style={type.caption}>{productAvailability(product)}</Text><Text numberOfLines={1} style={[type.caption, { color: colors.brand }]}>{product.category}</Text></View></Pressable>)}</View>}
  </View>;
}
