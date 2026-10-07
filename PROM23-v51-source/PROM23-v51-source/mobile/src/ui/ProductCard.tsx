import { productSaleMode, canDraftBusinessPurchase } from '../domain';
import React, { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChartNoAxesColumnIncreasing, Heart, Minus, Plus } from 'lucide-react-native';
import { formatMoney, productAvailability, productQuantityLimit, type Product } from '../domain';
import { useShop } from '../store';
import { ProductPhoto } from './ProductPhoto';
import { Button, IconButton, Sheet } from './primitives';
import { colors, layout, type } from './theme';
import { Reveal } from './Reveal';
import { PurchaseBenefits } from './PurchaseBenefits';

export function QuantityControl({ product }: { product: Product }) {
  const router = useRouter();
  const { state, dispatch, busy, ready } = useShop();
  const quantity = state.carts[state.context].find(line => line.productId === product.id)?.quantity ?? 0;
  const limit = productQuantityLimit(product);
  const saleMode = productSaleMode(product);
  if (saleMode !== 'BUYABLE' && !(state.context !== 'personal' && canDraftBusinessPurchase(product)) && !quantity) return <Button label={saleMode === 'CUSTOM_PRODUCTION' ? 'Заказать изготовление' : 'Получить предложение'} disabled={!ready || busy} onPress={() => router.push({pathname:'/forms/[id]', params:{id:saleMode === 'CUSTOM_PRODUCTION' ? 'production-request' : 'quote',productId:product.id,expectedContext:state.context}})} style={s.add} />;
  if (product.stock === 0) return <Button label="Сообщить о поступлении" variant="secondary" disabled={!ready || busy} onPress={() => router.push({ pathname: '/forms/[id]', params: { id: 'product-notify', productId: product.id, expectedContext: state.context } })} style={s.add} />;
  if (!quantity) return <Button label={state.context === 'personal' ? 'В корзину' : 'Купить'} disabled={!ready || busy || limit === 0} onPress={() => dispatch({ type: 'quantity', product, quantity: 1 })} style={s.add} />;
  return <Reveal><View style={s.stepper}>
    <IconButton label={'Уменьшить количество: ' + product.name} disabled={busy} onPress={() => dispatch({ type: 'quantity', product, quantity: quantity - 1 })}><Minus size={18} color={colors.ink} /></IconButton>
    <Text style={type.label} accessibilityLiveRegion="polite" accessibilityLabel={product.name + ': ' + quantity + ' ' + product.unit}>{quantity}</Text>
    <IconButton label={'Увеличить количество: ' + product.name} disabled={!ready || busy || quantity >= limit} onPress={() => dispatch({ type: 'quantity', product, quantity: quantity + 1 })}><Plus size={18} color={colors.ink} /></IconButton>
  </View></Reveal>;
}

export function ProductPrice({ product, large = false, showUnit = false }: { product: Product; large?: boolean; showUnit?: boolean }) {
  const oldPrice = Number.isSafeInteger(product.oldPriceKopecks) && product.oldPriceKopecks! > product.priceKopecks ? product.oldPriceKopecks : undefined;
  const discount = oldPrice && Number.isSafeInteger(product.discountPercent) && product.discountPercent! >= 1 && product.discountPercent! <= 99 ? product.discountPercent : undefined;
  return <View style={{ gap: 3 }}>
    <Text style={[s.price, large && { fontSize: 28, lineHeight: 35 }, oldPrice !== undefined && { color: colors.accent }]}>{formatMoney(product.priceKopecks)}{showUnit && <Text style={[type.caption, { fontWeight: '400' }]}> / {product.unit}</Text>}</Text>
    {oldPrice !== undefined && <View style={[layout.row, { gap: 7, flexWrap: 'wrap' }]}>
      <Text accessibilityLabel={'Прежняя цена: ' + formatMoney(oldPrice)} style={[type.caption, { textDecorationLine: 'line-through' }]}>{formatMoney(oldPrice)}</Text>
      {discount !== undefined && <Text accessibilityLabel={'Скидка ' + discount + '%'} style={[type.caption, { color: colors.accent, fontWeight: '600' }]}>−{discount}%</Text>}
    </View>}
  </View>;
}

export function ProductActions({ product, withLabels = false }: { product: Product; withLabels?: boolean }) {
  const router = useRouter();
  const { state, dispatch, busy } = useShop();
  const [limitOpen, setLimitOpen] = useState(false);
  const favorite = state.favorites.includes(product.id);
  const compared = state.comparison.includes(product.id);
  const compare = () => {
    if (!compared && state.comparison.length >= 6) { setLimitOpen(true); return; }
    dispatch({ type: 'compare', productId: product.id });
  };
  return <>
    <View style={[layout.row, withLabels && { gap: 8, flexWrap: 'wrap' }]}>
      {withLabels ? <Button disabled={busy} label={favorite ? 'В избранном' : 'В избранное'} variant="secondary" icon={<Heart size={18} color={favorite ? colors.accent : colors.brand} fill={favorite ? colors.accent : 'none'} />} onPress={() => dispatch({ type: 'favorite', productId: product.id })} style={{ flex: 1, minWidth: 130 }} /> : <IconButton disabled={busy} selected={favorite} label={(favorite ? 'Убрать из избранного: ' : 'В избранное: ') + product.name} onPress={() => dispatch({ type: 'favorite', productId: product.id })}><Heart size={20} color={favorite ? colors.accent : colors.brand} fill={favorite ? colors.accent : 'none'} /></IconButton>}
      {withLabels ? <Button disabled={busy} label={compared ? 'В сравнении' : 'Сравнить'} variant="secondary" icon={<ChartNoAxesColumnIncreasing size={18} color={compared ? colors.accent : colors.brand} />} onPress={compare} style={{ flex: 1, minWidth: 130 }} /> : <IconButton disabled={busy} selected={compared} label={(compared ? 'Убрать из сравнения: ' : 'Сравнить: ') + product.name} onPress={compare}><ChartNoAxesColumnIncreasing size={19} color={compared ? colors.accent : colors.brand} /></IconButton>}
    </View>
    <Sheet visible={limitOpen} onClose={() => setLimitOpen(false)} title="В сравнении уже 6 товаров"><Text style={type.body}>Уберите один товар из сравнения, чтобы добавить этот.</Text><Button label="Открыть сравнение" onPress={() => { setLimitOpen(false); router.push('/compare'); }} /><Button label="Продолжить выбор" variant="secondary" onPress={() => setLimitOpen(false)} /></Sheet>
  </>;
}

export const ProductCard = memo(function ProductCard({ product, compact = false, home = false, onOpen }: { product: Product; compact?: boolean; home?: boolean; onOpen?: () => void }) {
  const router = useRouter();
  const { state } = useShop();
  const inCart = state.carts[state.context].some(line => line.productId === product.id);
  const own = product.specs.some(spec => spec.label === 'Производитель' && /^(Промышленник|TeaM|ТЕАМ)(\s|$)/i.test(spec.value));
  const open = () => { onOpen?.(); router.push({ pathname: '/product/[id]', params: { id: product.id } }); };
  return <View style={s.card}>
    <View style={s.art}>
      <Pressable accessibilityRole="button" accessibilityLabel={'Открыть товар: ' + product.name} onPress={open} style={[s.artLink, compact && { aspectRatio: 1.2, minHeight: 105 }]}><ProductPhoto product={product} style={{ width: '100%', height: '100%' }} /></Pressable>
      <View style={s.actions}><ProductActions product={product} /></View>
    </View>
    <View style={s.details}>
      {(own || home) && <Text numberOfLines={1} style={[type.caption, { color: colors.brand, fontWeight: '600', paddingTop: 3, minHeight: home ? 20 : undefined }]}>{own ? 'От производителя' : product.sku}</Text>}
      <Pressable accessibilityRole="button" accessibilityLabel={product.name} onPress={open} style={{ minHeight: 44, paddingVertical: 3 }}><Text numberOfLines={2} style={s.productName}>{product.name}</Text></Pressable>
      <View style={home ? { minHeight: 49 } : undefined}><ProductPrice product={product} /></View>
      {!compact && <Text numberOfLines={1} style={s.sku}>Код: {product.sku}</Text>}
      <Text numberOfLines={1} style={s.stock}>{productAvailability(product)}</Text>
      <PurchaseBenefits product={product} />
      <QuantityControl product={product} />
      {inCart && !compact && <Pressable accessibilityRole="button" accessibilityLabel={'Оформить: ' + product.name} onPress={() => router.push('/cart')} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={[type.caption, { color: colors.accent, fontWeight: '600' }]}>В корзине · оформить →</Text></Pressable>}
    </View>
  </View>;
});

const s = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.white, borderRadius: 14, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  art: { backgroundColor: colors.white, position: 'relative', paddingTop: 32 }, artLink: { aspectRatio: 1.18, minHeight: 120 }, actions: { position: 'absolute', right: 2, top: 0, backgroundColor: colors.white, borderBottomLeftRadius: 12 },
  details: { padding: 10, paddingTop: 8, flex: 1 }, price: { color: colors.ink, fontSize: 22, fontWeight: '800', letterSpacing: -0.65, lineHeight: 29 }, productName: { fontSize: 14, lineHeight: 19, color: colors.ink, fontWeight: '500' }, sku: { fontSize: 12, lineHeight: 16, color: colors.muted }, stock: { fontSize: 12, lineHeight: 16, color: colors.muted, marginTop: 5, marginBottom: 0 },
  add: { paddingHorizontal: 5, minHeight: 46, marginTop: 'auto' }, stepper: { minHeight: 46, backgroundColor: colors.pale, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
});
