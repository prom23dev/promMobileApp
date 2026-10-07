import { PrivacyFooter } from './PrivacyControls';
import React, { useCallback, useEffect, useRef, useState, useMemo, type ReactNode } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { FlatList } from './PageScroll';
import { useShop } from '../store';
import type { CatalogSection } from '../catalog-tree';
import { defaultHomeConfig, loadHomeConfig } from '../api/home';
import { MarketplaceHero, MarketplaceCategories, PersonalShopping, BusinessShopping, ManufacturerStory, HomeReading, AccountInvitation, HomeHelp } from './HomeMarketplace';
import { ProductShelves } from './ProductShelves';
import { ProjectShowcase } from './ProjectShowcase';
import { TaskGuide } from './TaskGuide';
import { colors, type } from './theme';
import { Button } from './primitives';
import { ProductCard } from './ProductCard';
import { mixedHomeProducts } from '../home-discovery';
import type { Product } from '../domain';

type Block = (typeof defaultHomeConfig.blocks)[number];
type FeedItem = Block | { id: string; type: 'discovery-title' } | { id: string; type: 'product-row'; products: Product[] };

// A finite set of native sections. Unknown remote block types never become executable UI.
export function HomeFeed({ roots, onChoose, searchHeader, searchFocused }: { roots: CatalogSection[]; onChoose: (section: CatalogSection) => void; searchHeader?: ReactNode; searchFocused?: boolean }) {
  const [config, setConfig] = useState(defaultHomeConfig);
  const list = useRef<FlatList<FeedItem>>(null);
  const { state, products } = useShop();
  const { width, fontScale } = useWindowDimensions();
  const columns = fontScale > 1.5 ? 1 : width >= 700 ? 3 : 2;
  const [limit, setLimit] = useState(12);
  const mixed = useMemo(() => mixedHomeProducts(products), [products]);
  const loadMore = useCallback(() => setLimit(value => Math.min(value + 12, mixed.length)), [mixed.length]);
  useEffect(() => { let active = true; void loadHomeConfig().then(value => { if (active) setConfig(value); }); return () => { active = false; }; }, []);
  useEffect(() => { if (searchFocused) list.current?.scrollToOffset({ offset: 0, animated: false }); }, [searchFocused]);
  const blocks = config.blocks.filter(block => block.enabled && (block.type !== 'personalized' || (state.viewed?.[state.context]?.length ?? 0) > 0));
  const rows: FeedItem[] = [];
  for (let index = 0; index < Math.min(limit, mixed.length); index += columns) {
    const row = mixed.slice(index, Math.min(index + columns, limit));
    rows.push({ id: 'discovery-' + row[0].id, type: 'product-row', products: row });
  }
  const data: FeedItem[] = [...blocks, ...(mixed.length ? [{ id: 'discovery-title', type: 'discovery-title' as const }, ...rows] : [])];
  const renderBlock = useCallback(({ item }: { item: FeedItem }) => {
    if (item.type === 'discovery-title') return <View testID="home-discovery" style={{ padding: 16, paddingTop: 24, gap: 6 }}><Text accessibilityRole="header" aria-level={2} style={type.heading}>Ещё больше для ваших задач</Text><Text style={type.body}>Оборудование, инструменты и материалы</Text></View>;
    if (item.type === 'product-row') return <View testID={item.id} style={{ flexDirection: 'row', paddingHorizontal: 12, gap: 10, marginBottom: 10 }}>{item.products.map(product => <View key={product.id} testID={'discovery-product-' + product.id} style={{ flex: 1, minWidth: 0 }}><ProductCard product={product} home compact /></View>)}{Array.from({ length: columns - item.products.length }, (_, i) => <View key={i} style={{ flex: 1 }} />)}</View>;
    let content: ReactNode;
    switch (item.type) {
      case 'hero': content = <MarketplaceHero />; break;
      case 'categories': content = <MarketplaceCategories roots={roots} onChoose={onChoose} />; break;
      case 'discounts': content = <ProductShelves home scope="discounts" />; break;
      case 'manufactured': content = <ProductShelves home scope="manufactured" />; break;
      case 'popular': content = <ProductShelves home scope="popular" />; break;
      case 'buyers': content = <PersonalShopping />; break;
      case 'company': content = <ManufacturerStory />; break;
      case 'business': content = <BusinessShopping />; break;
      case 'production': content = <ManufacturerStory />; break;
      case 'projects': content = <ProjectShowcase />; break;
      case 'guide': content = <TaskGuide home />; break;
      case 'services': content = <><AccountInvitation /><HomeHelp /></>; break;
      case 'articles': content = <HomeReading />; break;
      case 'personalized': content = <ProductShelves home scope="personalized" />; break;
      default: return null;
    }
    return <View testID={'home-section-' + item.type} style={{ backgroundColor: colors.white, borderRadius: item.type === 'hero' ? 0 : 22, paddingHorizontal: 16, paddingVertical: item.type === 'hero' ? 10 : 18, marginBottom: 10, gap: 24 }}>{content}</View>;
  }, [roots, onChoose, columns]);
  return <FlatList buyerControls testID="home-feed" ref={list} style={{ flex: 1, backgroundColor: colors.background }} data={data} onEndReached={searchFocused ? undefined : loadMore} onEndReachedThreshold={1} ListFooterComponent={<>{mixed.length ? <View testID="home-discovery-footer" style={{ padding: 16, gap: 10 }}><Text accessibilityLiveRegion="polite" style={[type.caption, { textAlign: 'center' }]}>Показано {Math.min(limit, mixed.length)} из {mixed.length} товаров</Text>{limit < mixed.length ? <Button label="Показать ещё товары" variant="secondary" onPress={loadMore} /> : <Text style={[type.caption, { textAlign: 'center' }]}>Вы посмотрели все товары этой подборки</Text>}</View> : null}<PrivacyFooter /></>} renderItem={renderBlock} keyExtractor={item => item.id} initialNumToRender={3} maxToRenderPerBatch={6} updateCellsBatchingPeriod={30} windowSize={7} removeClippedSubviews={false} ListHeaderComponent={searchHeader ? <View style={{ padding: 16 }}>{searchHeader}</View> : null} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" />;
}
