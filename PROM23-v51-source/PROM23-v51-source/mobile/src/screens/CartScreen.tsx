import { CartCoupon } from '../ui/CartCoupon';
import { localRequest } from '../api/local';
import type { CheckoutSummary } from '../checkout-domain';
import React, { useCallback, useEffect, useState } from 'react';
import { LocationPicker } from '../ui/LocationPicker';
import { settlementLabel } from '../location-domain';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlatList } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowRight, Heart, MapPin, ShoppingBag, Trash2 } from 'lucide-react-native';
import { cartTotal, formatMoney, productAvailability } from '../domain';
import { useShop } from '../store';
import { colors, layout, type } from '../ui/theme';
import { Button, ConnectionState, EmptyState, Header, IconButton, ShopError } from '../ui/primitives';
import { QuantityControl } from '../ui/ProductCard';
import { ProductPhoto } from '../ui/ProductPhoto';
import { AssistedPurchase } from '../ui/AssistedPurchase';
import { DeliveryBenefit, PaymentBenefit } from '../ui/SiteBenefits';

export default function CartScreen() {
  const { state, products, dispatch, ready, busy, refresh, location } = useShop();
  const router = useRouter(); const [locationOpen, setLocationOpen] = useState(false);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  const lines = state.carts[state.context];
  const selectedLines = lines.filter(l => l.selected !== false);
  const allSelected = lines.length > 0 && selectedLines.length === lines.length;
  const [serverSummary, setServerSummary] = useState<CheckoutSummary | null>(null);
  const [summaryRevision, setSummaryRevision] = useState(0);
  const basketKey = JSON.stringify([state.context, lines, location?.version]);
  useEffect(() => { let active = true; setServerSummary(null); void localRequest<CheckoutSummary>('/v1/cart/summary').then(v => { if (active) setServerSummary(v); }).catch(() => {}); return () => { active = false; }; }, [basketKey, summaryRevision]);
  const sortedLines = lines.flatMap(line => { const product = products.find(p => p.id === line.productId); return product ? [{ product, quantity: line.quantity, selected: line.selected !== false }] : []; });
  const savings = sortedLines.filter(l => l.selected).reduce((sum, { product, quantity }) => sum + Math.max(0, (product.oldPriceKopecks ?? product.priceKopecks) - product.priceKopecks) * quantity, 0);
  let total = 0;
  let invalid = false;
  if (ready) { try { total = cartTotal(selectedLines, products); } catch { invalid = true; } }
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}>
    <Header title={state.context === 'personal' ? 'Корзина' : 'Корзина для бизнеса'} />
    <ShopError /><LocationPicker visible={locationOpen} onClose={() => setLocationOpen(false)} />
    {!ready ? <ConnectionState /> : invalid ? <EmptyState icon={<ShoppingBag size={30} color={colors.brand} />} title="Корзину нужно обновить" message="Состав или количество товаров изменились. Обновите корзину перед оформлением." action={<Button label="Обновить" onPress={() => { void refresh(); }} />} /> : <>
      <FlatList buyerControls data={sortedLines} keyExtractor={item => item.product.id} style={layout.content} contentContainerStyle={{ padding: 14, gap: 12, flexGrow: 1 }}
        ListHeaderComponent={<View style={{ gap: 12, paddingBottom: 4 }}>

          <View style={layout.between}><Text style={type.subheading}>{state.context === 'personal' ? 'Личная корзина' : (state.activeOrganization?.name ?? 'Покупки для бизнеса')}</Text><Text style={type.caption}>{lines.reduce((sum, line) => sum + line.quantity, 0)} ед.</Text></View>
          {state.context !== 'personal' && <Text style={type.caption}>Закупки компании сохраняются отдельно от личных покупок.</Text>}
          {lines.length > 0 && <Pressable accessibilityRole="checkbox" accessibilityLabel="Выбрать все товары" accessibilityState={{ checked: allSelected, disabled: busy }} aria-checked={allSelected} disabled={busy} onPress={() => dispatch({ type: 'cart-select', selected: !allSelected })} style={[layout.row, { minHeight: 44, gap: 8 }]}><Text style={{ color: colors.accent, fontSize: 24 }}>{allSelected ? "☑" : "☐"}</Text><Text style={type.label}>Выбрать все · {selectedLines.length} из {lines.length}</Text></Pressable>}
          {lines.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Выбрать населённый пункт доставки" onPress={() => setLocationOpen(true)} style={[layout.row, { gap: 6, minHeight: 44 }]}><MapPin size={16} color={colors.brand} /><Text style={[type.label, { flex: 1 }]}>{settlementLabel(location?.settlement)}</Text><Text style={type.caption}>Изменить</Text></Pressable>}
        </View>}
        renderItem={({ item: { product, quantity, selected } }) => {
          const open = () => router.push({ pathname: '/product/[id]', params: { id: product.id } });
          const favorite = state.favorites.includes(product.id);
          return <View style={s.line}>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected, disabled: busy }} aria-checked={selected} accessibilityLabel={"Выбрать: " + product.name} disabled={busy} onPress={() => dispatch({ type: 'cart-select', productId: product.id, selected: !selected })} style={[layout.row, { minHeight: 44, gap: 8 }]}><Text style={{ color: colors.accent, fontSize: 24 }}>{selected ? "☑" : "☐"}</Text><Text style={type.caption}>{selected ? "Выбран для оформления" : "Останется в корзине"}</Text></Pressable>
            <View style={[layout.row, { alignItems: 'flex-start', gap: 12 }]}>
              <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={'Открыть: ' + product.name} style={s.thumb}><ProductPhoto product={product} style={{ width: '100%', height: 116 }} /></Pressable>
              <View style={{ flex: 1, gap: 4 }}>
                <Pressable accessibilityRole="button" accessibilityLabel={product.name} onPress={open} style={{ minHeight: 44 }}><Text numberOfLines={3} style={type.label}>{product.name}</Text></Pressable>
                <Text style={type.caption}>{productAvailability(product)}</Text>
                <Text style={type.subheading}>{formatMoney(product.priceKopecks * quantity)}</Text>
                <Text style={type.caption}>{formatMoney(product.priceKopecks)} за {product.unit}</Text>{product.oldPriceKopecks && product.oldPriceKopecks > product.priceKopecks && <Text style={[type.caption, { color: colors.success }]}>Экономия {formatMoney((product.oldPriceKopecks - product.priceKopecks) * quantity)}</Text>}
              </View>
            </View>
            <View style={[layout.between, { marginTop: 12 }]}>
              <View style={layout.row}>
                <IconButton disabled={busy} selected={favorite} label={(favorite ? 'Убрать из избранного: ' : 'Сохранить в избранное: ') + product.name} onPress={() => dispatch({ type: 'favorite', productId: product.id })}><Heart size={20} color={favorite ? colors.accent : colors.muted} fill={favorite ? colors.accent : 'none'} /></IconButton>
                <IconButton disabled={busy} label={'Удалить из корзины: ' + product.name} onPress={() => dispatch({ type: 'quantity', product, quantity: 0 })}><Trash2 size={20} color={colors.muted} /></IconButton>
              </View>
              <View style={{ width: 145 }}><QuantityControl product={product} /></View>
            </View>
          </View>;
        }}
        ListEmptyComponent={<EmptyState icon={<ShoppingBag size={34} color={colors.brand} />} title="Добавьте нужное для работы" message={state.context === 'personal' ? 'Выберите оборудование в каталоге или вернитесь к сохранённым товарам.' : 'Корзина компании пока пуста. Личные покупки находятся в режиме «Для себя».'} action={<Button label="Открыть каталог" icon={<ArrowRight color={colors.white} size={18} />} onPress={() => router.push('/catalog')} />} />}
        ListFooterComponent={lines.length > 0 ? <View style={{ paddingTop: 8, gap: 12 }}>
          <View style={layout.card}><View style={layout.between}><Text style={type.body}>Выбрано · {selectedLines.length} поз.</Text><Text style={type.subheading}>{formatMoney(serverSummary?.draft.quote?.subtotalKopecks ?? serverSummary?.subtotalKopecks ?? total)}</Text></View>{savings > 0 && <View style={layout.between}><Text style={type.body}>Ваша экономия</Text><Text style={[type.label, { color: colors.success }]}>{formatMoney(savings)}</Text></View>}<View style={layout.between}><Text style={type.body}>Доставка</Text><Text style={type.caption}>При оформлении</Text></View></View>
          <CartCoupon onChange={() => setSummaryRevision(v => v + 1)} /><DeliveryBenefit /><PaymentBenefit /><AssistedPurchase compact title="Помочь с заказом или доставкой?" />
          <Text style={type.caption}>Итоговая стоимость доставки и доступность товаров подтверждаются при оформлении.</Text>
        </View> : null}
      />
      {lines.length > 0 && <View style={s.bottom}><View style={[layout.content, { padding: 14, gap: 10 }]}>
        <View style={layout.between}><Text style={type.subheading}>Товары на сумму</Text><Text style={type.heading}>{formatMoney(serverSummary?.draft.quote?.subtotalKopecks ?? serverSummary?.subtotalKopecks ?? total)}</Text></View>
        <Button disabled={busy || selectedLines.length === 0} label={state.context === 'personal' ? 'Оформить выбранные товары' : 'Купить по счёту'} icon={<ArrowRight size={19} color={colors.white} />} onPress={() => router.push(state.context === 'personal' ? '/checkout-preview' : '/checkout-preview?payment=invoice')} />
      </View></View>}
    </>}
  </SafeAreaView>;
}
const s = StyleSheet.create({
  line: { padding: 13, borderRadius: 16, backgroundColor: colors.white }, thumb: { width: 96, backgroundColor: colors.white, borderRadius: 12, overflow: 'hidden' },
  bottom: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
});
