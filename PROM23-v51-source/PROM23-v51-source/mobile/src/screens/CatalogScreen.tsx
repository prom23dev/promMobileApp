import { usePrivacy } from '../PrivacyPreferences';
import { CatalogFilterSheet, initialFilters, valuesOf, type Filters } from '../ui/CatalogFilterSheet';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { ScrollView, FlatList } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, ChartNoAxesColumnIncreasing, ChevronRight, Heart, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { searchProducts, type Product } from '../domain';
import { productInSection, sectionTrail, type CatalogSection } from '../catalog-tree';
import { useShop } from '../store';
import { colors, layout, type } from '../ui/theme';
import { Button, ConnectionState, DemoNote, EmptyState, IconButton, ShopError, ShopHeader } from '../ui/primitives';
import { ProductCard } from '../ui/ProductCard';
import { ProductPhoto } from '../ui/ProductPhoto';
import { CategoryPictogram } from '../ui/CategoryPictogram';
import { HomeBenefits } from '../ui/SiteBenefits';
import { ProductShelves } from '../ui/ProductShelves';
import { SearchSuggestions } from '../ui/SearchSuggestions';
import { cleanSearch } from '../search-history';
import { correctedProductQuery, recoverySections } from '../search-discovery';
import { PageMeta } from '../ui/PageMeta';
import { HomeHero } from '../ui/HomeHero';
import { HomeFeed } from '../ui/HomeFeed';
import { AssistedPurchase } from '../ui/AssistedPurchase';

export default function CatalogScreen({ mode = 'catalog', nested = false }: { mode?: 'home' | 'catalog' | 'favorites'; nested?: boolean }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; section?: string; brand?: string; search?: string; q?: string }>();
  const privacy = usePrivacy();
  const { state, products, catalogTree, ready, dispatch } = useShop();
  const { width, fontScale } = useWindowDimensions();
  const columns = fontScale > 1.5 ? 1 : width >= 700 ? 3 : 2;
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInput = useRef<TextInput>(null);
  const productList = useRef<FlatList<Product>>(null);
  const commitSearch = (value = query) => { const text = cleanSearch(value); setQuery(text); if (text) dispatch({ type: 'search', query: text }); setSearchFocused(false); Keyboard.dismiss(); searchInput.current?.blur(); };
  useEffect(() => { setQuery(''); setSearchFocused(false); }, [state.context]);
  useEffect(() => { if (params.search === '1') { const timer = setTimeout(() => searchInput.current?.focus(), 80); return () => clearTimeout(timer); } }, [params.search]);
  const [sectionId, setSectionId] = useState('');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [browseAll, setBrowseAll] = useState(false);
  const byId = useMemo(() => new Map(catalogTree.sections.map(s => [s.id, s])), [catalogTree]);
  const roots = catalogTree.rootIds.map(id => byId.get(id)).filter((s): s is CatalogSection => !!s)
    .sort((a, b) => Number(b.name === 'Леса') - Number(a.name === 'Леса'));
  const selected = byId.get(sectionId);
  const children = selected ? selected.children.map(id => byId.get(id)).filter((s): s is CatalogSection => !!s) : roots;
  const trail = sectionTrail(catalogTree, sectionId);
  useEffect(() => {
    const target = typeof params.section === 'string' ? byId.get(params.section) : catalogTree.sections.find(s => s.name === params.category);
    if (typeof params.brand === 'string') { setSectionId(''); setFilters({ ...initialFilters, brand: params.brand }); setBrowseAll(true); setQuery(''); }
    else if (target) { setSectionId(target.id); setFilters(initialFilters); setBrowseAll(true); setQuery(''); }
    else { setSectionId(''); setFilters(initialFilters); setBrowseAll(!!params.q); setQuery(typeof params.q === 'string' ? cleanSearch(params.q) : ''); }
  }, [params.section, params.category, params.brand, params.q, byId, catalogTree]);
  const source = useMemo(() => products.filter(p => (mode !== 'favorites' || state.favorites.includes(p.id)) && (!selected || !!query.trim() || productInSection(p, selected))), [mode, products, state.favorites, selected, query]);
  const results = useMemo(() => {
    const words = query.trim().toLocaleLowerCase('ru-RU').split(/\s+/).filter(Boolean);
    return searchProducts(source, '', 'Все', filters.sort).filter(p => {
      const searchable = [p.name, p.sku, ...p.specs.filter(s => s.label === 'Производитель').map(s => s.value)].join(' ').toLocaleLowerCase('ru-RU');
      return words.every(word => searchable.includes(word)) && (!filters.min || p.priceKopecks >= Number(filters.min) * 100) && (!filters.max || p.priceKopecks <= Number(filters.max) * 100) && (!filters.brand || p.specs.some(s => s.label === 'Производитель' && s.value.toLocaleLowerCase('ru') === filters.brand.toLocaleLowerCase('ru'))) && (!filters.technical || p.specs.some(s => s.label === filters.technicalLabel && s.value === filters.technical));
    });
  }, [source, query, filters]);
  const correctedQuery = useMemo(() => results.length === 0 ? correctedProductQuery(query, source) : null, [query, source, results.length]);
  const alternativeSections = useMemo(() => recoverySections(correctedQuery ?? query, products, catalogTree, (privacy.choice?.personalization ? state.viewed?.[state.context] : []) ?? []), [privacy.choice?.personalization, query, correctedQuery, products, catalogTree, state.viewed, state.context]);
  const matchingSections = query.trim().length > 1 ? catalogTree.sections.filter(section => section.name.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru'))).slice(0, 5) : [];
  const homeLanding = mode === 'home' && !query.trim();
  const categoryRoot = mode === 'catalog' && !selected && !query.trim() && !browseAll;
  const brands = valuesOf(source, 'Производитель');
  const technicalLabel = selected ? [...new Set(source.flatMap(p => p.specs.map(s => s.label)))].find(label => /^(Материал|Тип|Рабочая высота|Количество ступеней)(\b|,|\s|$)/u.test(label) && valuesOf(source, label).length > 1 && valuesOf(source, label).length <= 12) ?? '' : '';
  const technicalValues = technicalLabel ? valuesOf(source, technicalLabel) : [];
  const filterCount = [!!filters.min, !!filters.max, !!filters.brand, !!filters.technical, filters.sort !== 'default'].filter(Boolean).length;
  const choose = (section: CatalogSection) => {
    router.push({ pathname: '/catalog/section/[section]', params: { section: section.id } });
  };
  const reset = () => { setQuery(''); setFilters(initialFilters); };
  const root = () => router.push({ pathname: '/catalog', params: { section: 'all' } });
  const categoryTile = (section: CatalogSection, horizontal = false) => {
    return <Pressable key={section.id} accessibilityRole="button" accessibilityLabel={'Раздел каталога: ' + section.name} onPress={() => choose(section)} style={[s.category, horizontal ? { width: 100, minHeight: 114 } : { width: fontScale > 1.5 ? '100%' : '48%', flexDirection: 'row', minHeight: 88 }]}>
      <View style={[s.categoryIcon, { width: horizontal ? 60 : 48, height: horizontal ? 54 : 56 }]}><CategoryPictogram name={section.name} size={horizontal ? 40 : 40} /></View>
      <Text style={[s.categoryName, horizontal ? { textAlign: 'center' } : { flex: 1, minWidth: 0 }]}>{section.name}</Text>
    </Pressable>;
  };
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}>
    <PageMeta title={mode === 'home' ? 'Строительное оборудование и инструмент' : mode === 'favorites' ? 'Избранное' : selected?.name ?? 'Каталог строительного оборудования'} description={mode === 'home' ? 'Строительное оборудование и инструмент: опалубка, леса, вышки-туры и техника. Личные покупки и поставки для бизнеса. Доставка и самовывоз.' : 'Подберите опалубку, строительные леса, вышки-туры, инструмент и оборудование. Характеристики и комплектация товаров, подбор для объекта и производства.'} />
    <ShopHeader compact={mode === 'home'} back={mode === 'favorites' || nested}><View style={[s.search, searchFocused && { borderColor: colors.accent }]}><IconButton label="Найти товары" onPress={() => query.trim() ? commitSearch() : searchInput.current?.focus()}><Search size={23} color={colors.accent} /></IconButton><TextInput ref={searchInput} accessibilityLabel="Поиск по названию, бренду или артикулу" placeholder={width < 390 ? "Поиск" : width < 600 ? "Поиск товаров" : "Найти товар или артикул"} placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} onFocus={() => { setSearchFocused(true); productList.current?.scrollToOffset({ offset: 0, animated: false }); }} onSubmitEditing={() => commitSearch()} maxLength={100} returnKeyType="search" autoCorrect={false} style={s.searchInput} />{query.length > 0 && <IconButton label="Очистить поиск" onPress={() => { setQuery(''); searchInput.current?.focus(); }}><X size={19} color={colors.muted} /></IconButton>}</View></ShopHeader>
    <ShopError />
    {!ready ? <ConnectionState /> : homeLanding ? <HomeFeed roots={roots} onChoose={choose} searchFocused={searchFocused} searchHeader={searchFocused ? <SearchSuggestions query={query} onChoose={commitSearch} onClose={() => { setSearchFocused(false); Keyboard.dismiss(); searchInput.current?.blur(); }} /> : undefined} /> : <FlatList buyerControls={mode !== 'favorites'} ref={productList} key={columns} data={categoryRoot || homeLanding ? [] : results} numColumns={columns} keyExtractor={item => item.id} style={layout.content} contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24, flexGrow: 1 }} columnWrapperStyle={columns > 1 ? { gap: 10, marginBottom: 12 } : undefined} renderItem={({ item }) => <View style={{ width: columns > 1 ? ((100 / columns - 1) + '%') as `${number}%` : '100%', marginBottom: columns === 1 ? 12 : 0 }}><ProductCard product={item} onOpen={() => { if (query.trim()) dispatch({ type: 'search', query: cleanSearch(query) }); }} /></View>} initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      ListHeaderComponent={<View style={{ gap: 14, paddingTop: 6, paddingBottom: 14 }}>
        {searchFocused && <SearchSuggestions query={query} onChoose={commitSearch} onClose={() => { setSearchFocused(false); Keyboard.dismiss(); searchInput.current?.blur(); }} />}
        {homeLanding ? <HomeHero /> : <View style={[layout.between, { gap: 6 }]}><Text accessibilityRole="header" style={[mode === 'home' ? type.label : type.heading, { flex: 1 }]}>{mode === 'home' ? 'Оборудование для вашего дела' : mode === 'favorites' ? 'Избранное' : 'Каталог'}</Text><DemoNote /></View>}
        {mode === 'home' && !query.trim() && <><View style={layout.between}><Text accessibilityRole="header" aria-level={2} style={type.heading}>Каталог</Text><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/catalog', params: { section: 'all' } })} style={[layout.row, { minHeight: 44, gap: 5 }]}><Text style={[type.label, { color: colors.brand }]}>Все разделы</Text><ArrowRight size={18} color={colors.brand} /></Pressable></View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{roots.map(section => categoryTile(section, true))}</ScrollView><ProductShelves /><HomeBenefits /><Button label="Перейти ко всем товарам" variant="secondary" onPress={() => router.push('/catalog')} /></>}
        {mode === 'catalog' && <>
          {!categoryRoot && <View style={{ gap: 4 }}>{nested && <Button label="Назад" variant="quiet" icon={<ArrowLeft size={18} color={colors.brand} />} onPress={() => router.canGoBack() ? router.back() : router.replace('/catalog')} style={{ alignSelf: 'flex-start', paddingHorizontal: 0 }} />}<Pressable accessibilityRole="button" onPress={root} style={[layout.row, { minHeight: 44, gap: 6 }]}><ArrowLeft size={18} color={colors.brand} /><Text style={[type.label, { color: colors.brand }]}>Все разделы</Text></Pressable>{trail.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>{trail.slice(0, -1).map(section => <Pressable key={section.id} accessibilityRole="button" onPress={() => choose(section)} style={[layout.row, { minHeight: 44, gap: 5 }]}><Text style={type.caption}>{section.name}</Text><ChevronRight size={14} color={colors.muted} /></Pressable>)}</ScrollView>}{selected && <Text accessibilityRole="header" aria-level={2} style={type.heading}>{selected.name}</Text>}</View>}
          {categoryRoot ? <><Text style={type.caption}>Разделы и подразделы вашего магазина</Text><View style={s.categoryGrid}>{roots.map(section => categoryTile(section))}</View><ProductShelves /><Button label="Все товары" variant="secondary" icon={<ArrowRight size={18} color={colors.brand} />} onPress={() => setBrowseAll(true)} /></> : !query.trim() && selected && children.length > 0 ? <View style={s.categoryGrid}>{children.map(section => <Pressable key={section.id} accessibilityRole="button" accessibilityLabel={'Подраздел: ' + section.name} onPress={() => choose(section)} style={({ pressed }) => [s.category, { width: fontScale > 1.5 ? '100%' : '48%', minHeight: 144, justifyContent: 'center', borderWidth: 1, borderColor: colors.line }, pressed && { opacity: 0.7 }]}><View style={[s.categoryIcon, { width: 78, height: 76, backgroundColor: colors.white }]}>{products.find(p => productInSection(p, section)) ? <ProductPhoto product={products.find(p => productInSection(p, section))!} style={{ width: 74, height: 72 }} /> : <CategoryPictogram name={section.name} size={48} />}</View><Text style={[type.label, { textAlign: 'center', flexShrink: 1 }]}>{section.name}</Text></Pressable>)}</View> : null}
        </>}
        {matchingSections.length > 0 && <View style={{ gap: 8 }}><Text style={type.subheading}>Разделы по вашему запросу</Text>{matchingSections.map(section => <Pressable key={section.id} accessibilityRole="button" onPress={() => { commitSearch(); choose(section); }} style={[layout.row, { minHeight: 48, paddingHorizontal: 12, backgroundColor: colors.pale, borderRadius: 10, gap: 10 }]}><Search size={18} color={colors.brand} /><Text style={[type.label, { flex: 1 }]}>{section.name}</Text><ChevronRight size={18} color={colors.brand} /></Pressable>)}</View>}
        {!categoryRoot && !homeLanding && <><View style={layout.between}><View style={{ flex: 1 }}><Text accessibilityRole="header" aria-level={2} style={type.subheading}>{query.trim() ? 'Результаты поиска' : mode === 'favorites' ? 'Сохранённые товары' : 'Товары из каталога'}</Text><Text accessibilityLiveRegion="polite" style={type.caption}>{results.length} {new Intl.PluralRules('ru').select(results.length) === 'one' ? 'товар' : new Intl.PluralRules('ru').select(results.length) === 'few' ? 'товара' : 'товаров'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={'Фильтры и сортировка. Применено: ' + filterCount} onPress={() => { setFilterOpen(true); }} style={s.filterButton}><SlidersHorizontal size={19} color={colors.brand} /><Text style={[type.label, { color: colors.brand }]}>Фильтры{filterCount ? ' · ' + filterCount : ''}</Text></Pressable></View>{filterCount > 0 && <Button label="Сбросить фильтры" variant="quiet" onPress={reset} />}</>}
        {state.comparison.length > 0 && <Pressable accessibilityRole="button" onPress={() => router.push('/compare')} style={s.compare}><ChartNoAxesColumnIncreasing size={20} color={colors.brand} /><Text style={[type.label, { flex: 1 }]}>Сравнить оборудование · {state.comparison.length}</Text><ChevronRight size={19} color={colors.brand} /></Pressable>}
      </View>}
      ListEmptyComponent={categoryRoot || homeLanding ? null : mode === 'favorites' && !privacy.choice?.functional ? <EmptyState icon={<Heart size={32} color={colors.brand} />} title="Избранное и ваши настройки" message="Чтобы сохранять и просматривать избранное, включите функциональные cookie. Ранее сохранённые товары останутся в вашем списке." action={<Button label="Настройки cookie" onPress={() => privacy.setSettingsOpen(true)} />} /> : <EmptyState icon={mode === 'favorites' ? <Heart size={32} color={colors.brand} /> : <Search size={32} color={colors.brand} />} title={mode === 'favorites' && !source.length ? 'Нужное всегда под рукой' : selected && !source.length ? 'Подберём оборудование для вас' : 'Товары не найдены'} message={mode === 'favorites' && !source.length ? 'Сохраняйте товары нажатием на сердце.' : selected && !source.length ? 'Уточните ассортимент этого раздела у менеджера. Поможем подобрать оборудование под вашу задачу.' : 'Измените запрос или сбросьте фильтры.'} action={<Button label={selected && !source.length ? 'Связаться с менеджером' : mode === 'favorites' && !source.length ? 'Открыть каталог' : 'Сбросить поиск и фильтры'} onPress={() => selected && !source.length ? router.push('/information/contacts') : mode === 'favorites' && !source.length ? router.push('/catalog') : reset()} />} />}
      ListFooterComponent={!categoryRoot && !homeLanding && results.length === 0 ? <View style={{ gap: 14, paddingVertical: 14 }}>
        {!!query.trim() && <View testID="search-recovery" style={{ gap: 10 }}>
          {correctedQuery && <View style={{ gap: 4 }}><Text style={type.label}>Возможно, вы искали</Text><Button label={correctedQuery} variant="secondary" onPress={() => { setFilters(initialFilters); commitSearch(correctedQuery); }} /></View>}
          {alternativeSections.length > 0 && <><Text style={type.label}>Продолжить в каталоге</Text>{alternativeSections.map(section => <Pressable key={section.id} accessibilityRole="button" accessibilityLabel={'Открыть предложенный раздел: ' + section.name} onPress={() => { setFilters(initialFilters); choose(section); }} style={[layout.between, { gap: 10, minHeight: 48, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line }]}><CategoryPictogram name={section.name} size={24} /><Text style={[type.label, { flex: 1 }]}>{section.name}</Text><ChevronRight size={18} color={colors.brand} /></Pressable>)}</>}
        </View>}
        <AssistedPurchase compact title="Помочь найти нужное оборудование?" />
      </View> : null}
    />}
    <CatalogFilterSheet visible={filterOpen} onClose={() => setFilterOpen(false)} value={filters} label={selected?.name} brands={brands} technicalLabel={technicalLabel} technicalValues={technicalValues} onApply={value => { setFilters(value); setBrowseAll(true); setFilterOpen(false); }} />
  </SafeAreaView>;
}
const s = StyleSheet.create({
  search: { minHeight: 52, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingLeft: 4, gap: 2 }, searchInput: { flex: 1, minHeight: 50, fontSize: 16, color: colors.ink, paddingVertical: 10, minWidth: 0 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, category: { backgroundColor: colors.white, borderRadius: 14, alignItems: 'center', gap: 8, padding: 10 }, categoryIcon: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8ECFA' }, categoryName: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  subsections: { backgroundColor: colors.white, borderRadius: 14, overflow: 'hidden' }, subsection: { minHeight: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.background },
  filterButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, backgroundColor: colors.white, borderRadius: 10 }, compare: { minHeight: 48, backgroundColor: colors.pale, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 },
});
