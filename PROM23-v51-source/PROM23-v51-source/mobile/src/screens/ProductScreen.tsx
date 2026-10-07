import React, { useCallback, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, PackageSearch, Check, FileText, MessageCircle, Building2, Phone } from 'lucide-react-native';
import { formatMoney } from '../domain';
import { useShop } from '../store';
import { colors, layout, type } from '../ui/theme';
import { Button, ConnectionState, EmptyState, Header, ShopError } from '../ui/primitives';
import { ProductActions, ProductCard, ProductPrice, QuantityControl } from '../ui/ProductCard';
import { AvailabilityBlock } from '../ui/AvailabilityBlock';
import { ProductGallery } from '../ui/ProductGallery';
import { catalogAssets } from '../catalog-assets';
import { getProductDetails } from '../content/productDetails';
import { displaySpecs } from '../ui/product-data';
import { ProductDiscussion } from '../ui/ProductDiscussion';
import { DeliveryBenefit, PaymentBenefit } from '../ui/CommerceBenefits';
import { CommerceAccordion } from '../ui/CommerceAccordion';
import { PageMeta } from '../ui/PageMeta';

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const router = useRouter();
  const { state, products, catalogTree, ready, dispatch, location } = useShop();
  const [documentError, setDocumentError] = useState('');
  const scroll = useRef<ScrollView>(null); const [specTop, setSpecTop] = useState(0);
  const product = products.find(item => item.id === id); const productId = product?.id;
  useFocusEffect(useCallback(() => { if (ready && productId) dispatch({ type: 'view', productId }); }, [ready, productId, state.context, dispatch]));
  if (!ready) return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}><Header title="Товар" back search /><ConnectionState /></SafeAreaView>;
  if (!product) return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}><Header title="Товар" back search /><ScrollView buyerControls style={layout.content}><EmptyState icon={<PackageSearch size={32} color={colors.brand} />} title="Товар не найден" message="Выберите другой товар или свяжитесь с менеджером." action={<Button label="Открыть каталог" onPress={() => router.replace('/catalog')} />} /></ScrollView></SafeAreaView>;
  const detail = getProductDetails(product.id); const specs = displaySpecs(product);
  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 8);
  const section = [...(product.sectionIds ?? [])].reverse().map(id => catalogTree.sections.find(s => s.id === id)).find(Boolean);
  const manufacturer = product.specs.find(spec => spec.label === 'Производитель')?.value ?? '';
  const own = /^(Промышленник|TeaM|ТЕАМ)(\s|$)/i.test(manufacturer);
  const inCart = state.carts[state.context].some(line => line.productId === product.id);
  const gallery = detail?.gallery?.length ? detail.gallery : catalogAssets[product.id] ? [{ id: product.id, source: catalogAssets[product.id], alt: product.name }] : [];
  const goForm = (form: string) => router.push({ pathname: '/forms/[id]', params: { id: form, productId: product.id, expectedContext: state.context } });
  const actions = [ ...(detail?.capabilities.canBuyOneClick ? [['buy-one-click', 'Купить в один клик']] : []), ...(detail?.capabilities.canRent ? [['rent', 'Уточнить аренду']] : []), ...(detail?.capabilities.canLease ? [['leasing', 'Заявка на лизинг']] : []), ...(detail?.capabilities.canRequestBetterPrice ? [['found-cheaper', 'Нашли дешевле?']] : []) ];
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}>
    <PageMeta title={product.name} description={detail?.descriptionParagraphs[0] ?? product.name} />
    <Header title="Товар" back search /><ShopError />
    <ScrollView buyerControls ref={scroll} style={layout.content} contentContainerStyle={{ paddingBottom: 24 }}>
      <ProductGallery images={gallery} />
      <View style={{ padding: 16, gap: 12 }}>
        <View style={layout.between}><Text selectable style={type.caption}>Артикул {product.sku}</Text><ProductActions product={product} /></View>
        <Text accessibilityRole="header" aria-level={1} style={[type.title, { fontSize: 23, lineHeight: 29 }]}>{product.name}</Text>
        {own ? <Pressable accessibilityRole="button" onPress={() => router.push('/information/production')} style={[layout.row, { gap: 6, minHeight: 44 }]}><Check size={16} color={colors.brand} /><Text style={[type.caption, { color: colors.brand, fontWeight: '600' }]}>Собственное производство · {manufacturer}</Text><ChevronRight size={15} color={colors.brand} /></Pressable> : !!manufacturer && <Text style={type.caption}>Производитель: {manufacturer}</Text>}
        <ProductPrice product={product} large showUnit />
        {!!product.oldPriceKopecks && product.oldPriceKopecks > product.priceKopecks && <Text style={[type.caption, { color: colors.success }]}>Экономия {formatMoney(product.oldPriceKopecks - product.priceKopecks)} за {product.unit}</Text>}
        <AvailabilityBlock key={`${product.id}:${location?.version}:${state.context}`} productId={product.id} unit={product.unit} />
        <PaymentBenefit product={product} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{specs.slice(0, 4).map((spec, i) => <View key={i} style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: colors.white, padding: 10, borderRadius: 10, gap: 4 }}><Text style={type.caption}>{spec.label}</Text><Text numberOfLines={2} style={type.label}>{spec.value}</Text></View>)}</View>
        <Pressable accessibilityRole="button" onPress={() => scroll.current?.scrollTo({ y: specTop, animated: false })} style={[layout.between, { minHeight: 44 }]}><Text style={[type.label, { color: colors.brand }]}>Все характеристики · {specs.length}</Text><ChevronRight size={18} color={colors.brand} /></Pressable>
        <DeliveryBenefit product={product} />
        {actions.map(([form, title]) => <Pressable key={form} accessibilityRole="button" onPress={() => goForm(form)} style={[layout.between, { minHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.line }]}><Text style={[type.label, { flex: 1 }]}>{title}</Text><ChevronRight size={18} color={colors.brand} /></Pressable>)}
        <Pressable accessibilityRole="button" onPress={() => router.push('/procurement')} style={[layout.row, { gap: 10, padding: 12, borderRadius: 12, backgroundColor: colors.pale }]}><Building2 size={22} color={colors.brand} /><View style={{ flex: 1, gap: 3 }}><Text style={type.label}>Нужна партия или комплект?</Text><Text style={type.caption}>Получить предложение для бизнеса</Text></View><ChevronRight size={18} color={colors.brand} /></Pressable>
        <Pressable accessibilityRole="button" onPress={() => goForm('question')} style={[layout.row, { minHeight: 44, gap: 8 }]}><MessageCircle size={19} color={colors.brand} /><Text style={[type.label, { color: colors.brand }]}>Задать вопрос о товаре</Text></Pressable>
      </View>
      <View onLayout={event => setSpecTop(event.nativeEvent.layout.y)} style={{ paddingHorizontal: 16, gap: 6 }}>
        {!!detail?.descriptionParagraphs.length && <CommerceAccordion title="О товаре" defaultOpen><Text style={type.body}>{detail.descriptionParagraphs[0]}</Text>{detail.descriptionParagraphs.length > 1 && <CommerceAccordion title="Полное описание">{detail.descriptionParagraphs.slice(1).map((p, i) => <Text key={i} selectable style={type.body}>{p}</Text>)}</CommerceAccordion>}</CommerceAccordion>}
        {!!detail?.advantages.length && <CommerceAccordion title="Преимущества">{detail.advantages.map((p, i) => <View key={i} style={[layout.row, { gap: 8, alignItems: 'flex-start' }]}><Check size={18} color={colors.success} /><Text style={[type.body, { flex: 1 }]}>{p}</Text></View>)}</CommerceAccordion>}
        <CommerceAccordion title={`Характеристики · ${specs.length}`} defaultOpen>{specs.map((spec, index) => <View key={spec.label + index} style={[s.spec, spec.value.length > 120 && { flexDirection: 'column', gap: 6 }]}><Text style={[type.body, { color: colors.muted, flex: 1 }]}>{spec.label}</Text><Text selectable style={[type.label, { flex: 1 }]}>{spec.value}</Text></View>)}</CommerceAccordion>
        {!!detail?.packageContents.length && <CommerceAccordion title="Комплектация">{detail.packageContents.map((p, i) => <Text key={i} style={type.body}>{p}</Text>)}</CommerceAccordion>}
        <CommerceAccordion title="Документы на товар">{detail?.documents.map(doc => <Pressable key={doc.id} accessibilityRole="link" onPress={() => { setDocumentError(''); void Linking.openURL(doc.url).catch(() => setDocumentError('Документ не открылся. Повторите позже или обратитесь в магазин.')); }} style={[layout.row, { gap: 8, minHeight: 48 }]}><FileText size={21} color={colors.brand} /><Text style={[type.label, { flex: 1 }]}>{doc.name}</Text></Pressable>)}{!detail?.documents.length && <Text style={type.body}>Публичные документы для этой позиции пока не получены. Документы по покупке доступны владельцу заказа в кабинете магазина.</Text>}{!!documentError && <Text accessibilityRole="alert" style={type.body}>{documentError}</Text>}<Button label="Заказы и документы" variant="secondary" onPress={() => router.push('/orders')} /></CommerceAccordion>
        <CommerceAccordion title="Продавец, гарантия и обращения"><Text style={type.body}>Фактический продавец и условия покупки указываются до подтверждения заказа. Срок гарантии, если она установлена, относится к конкретному товару и его документации.</Text><Button label="Реквизиты компании" variant="quiet" onPress={() => router.push('/pages/details')} /><Button label="Гарантия и обслуживание" variant="quiet" onPress={() => router.push('/pages/warranty')} /><Button label="Претензии и обращения" variant="quiet" onPress={() => router.push('/claims')} /></CommerceAccordion><ProductDiscussion productId={product.id} />
        {related.length > 0 && <View style={{ gap: 12, paddingTop: 20 }}><Text accessibilityRole="header" aria-level={2} style={type.heading}>В этой категории</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>{related.map(item => <View key={item.id} style={{ width: 176 }}><ProductCard product={item} compact /></View>)}</ScrollView></View>}
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/catalog/section/[section]', params: { section: section?.id ?? 'all' } })} style={[layout.row, { minHeight: 48, gap: 5 }]}><Text style={[type.caption, { flex: 1 }]}>{section?.name ?? product.category}</Text><ChevronRight size={16} color={colors.brand} /></Pressable>
      </View>
    </ScrollView>
    <View testID="sticky-purchase-bar" style={s.bottom}>{inCart && <Pressable accessibilityRole="button" accessibilityLabel="Открыть корзину после добавления" onPress={() => router.push('/cart')} style={[layout.between, { paddingHorizontal: 16, minHeight: 36, backgroundColor: colors.successPale }]}><View style={[layout.row, { gap: 6 }]}><Check size={16} color={colors.success} /><Text accessibilityLiveRegion="polite" style={[type.caption, { color: colors.success }]}>Добавлено в корзину</Text></View><Text style={[type.caption, { color: colors.success, fontWeight: '700' }]}>Открыть →</Text></Pressable>}<View style={[layout.between, { paddingHorizontal: 16, paddingVertical: 8, gap: 8 }]}><View style={{ flex: 1 }}><Text style={type.subheading}>{formatMoney(product.priceKopecks)}</Text><Text style={type.caption}>за {product.unit}</Text></View><View style={{ flex: 1.15, maxWidth: 250 }}><QuantityControl product={product} /></View></View></View>
  </SafeAreaView>;
}
const s = StyleSheet.create({ spec: { flexDirection: 'row', gap: 12, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.line }, bottom: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line } });
