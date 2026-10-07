import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, CreditCard, MapPin, Package, Sparkles, Truck } from 'lucide-react-native';
import { formatMoney, type Product } from '../domain';
import { plusLabel } from '../commerce';
import { useCommerce } from '../useCommerce';
import { useShop } from '../store';
import { getSiteContact } from '../content/siteContent';
import { settlementLabel } from '../location-domain';
import { LocationPicker } from './LocationPicker';
import { Button, Sheet } from './primitives';
import { colors, layout, type } from './theme';
import { palette } from './tokens';

export function PaymentBenefit({ product, compact = false }: { product?: Product; compact?: boolean }) {
  const router = useRouter(); const { state } = useShop(); const { offer } = useCommerce(product);
  const [open, setOpen] = useState(false);
  if (state.context !== 'personal') return <Pressable accessibilityRole="button" accessibilityLabel="Оплата по счёту, НДС и ЭДО" onPress={() => router.push('/information/payment')} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={[type.caption, { color: colors.brand }]}>Счёт · НДС · ЭДО</Text></Pressable>;
  const payment = offer?.split?.payments?.[0];
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Сплит и баллы Плюса. Условия оплаты" onPress={() => setOpen(true)} style={[layout.row, { gap: 6, minHeight: 44, padding: compact ? 0 : 12, borderRadius: 12, backgroundColor: compact ? 'transparent' : colors.background }]}><CreditCard size={16} color={palette.green700} /><View style={{ flex: 1, gap: 3 }}><Text style={[type.caption, { color: palette.green700, fontWeight: '600' }]}>{payment ? `${formatMoney(payment.amountKopecks)} × ${offer!.split!.payments.length} в Сплит` : 'Способы оплаты'}</Text>{!compact && <Text style={type.caption}>{offer?.plus ? '+' + plusLabel(offer.plus.points) : 'Выбор способа — при оформлении'}</Text>}</View>{!compact && <ChevronRight size={16} color={colors.muted} />}</Pressable>
    <Sheet visible={open} onClose={() => setOpen(false)} title="Сплит и баллы Плюса">
      <View style={[layout.row, { gap: 10 }]}><CreditCard size={23} color={palette.green700} /><Text style={type.subheading}>Оплатить частями</Text></View>
      {offer?.split ? <>{offer.split.payments.map((p, i) => <View key={i} style={layout.between}><Text style={type.body}>{p.label}</Text><Text style={type.label}>{formatMoney(p.amountKopecks)}</Text></View>)}<Text style={type.caption}>{offer.split.terms}</Text></> : <Text style={type.body}>Яндекс Сплит позволяет разделить оплату покупки. Доступность, суммы и даты платежей Яндекс покажет до подтверждения оплаты. Сейчас персональный график не получен.</Text>}
      <View style={[layout.row, { gap: 10, marginTop: 8 }]}><Sparkles size={23} color={palette.violet700} /><Text style={type.subheading}>{offer?.plus ? '+' + plusLabel(offer.plus.points) : 'Баллы Плюса с Пэй'}</Text></View><Text style={type.body}>{offer?.plus?.terms ?? 'При оплате Яндекс Пэй и активном Плюсе доступные баллы отображаются в предложении сервиса. Начисление при оплате Сплитом не гарантируется: это отдельные условия.'}</Text>
      <Button label="Все способы оплаты" variant="secondary" onPress={() => { setOpen(false); router.push('/information/payment'); }} />
    </Sheet>
  </>;
}

export function DeliveryBenefit({ product, compact = false }: { product?: Product; compact?: boolean }) {
  const router = useRouter(); const { state, location } = useShop();
  const { offer, loading, refresh } = useCommerce(product);
  const [open, setOpen] = useState(false); const [cityOpen, setCityOpen] = useState(false);
  const branch = getSiteContact(location?.settlement?.name ?? ''); const rows = offer?.delivery ?? [];
  const minimum = [...rows].sort((a, b) => a.priceKopecks - b.priceKopecks)[0];
  const label = minimum ? `${minimum.period} · ${minimum.priceKopecks ? 'от ' + formatMoney(minimum.priceKopecks) : 'бесплатно'}` : compact ? 'Доставка и самовывоз' : 'Как получить заказ';
  const details = <View style={{ gap: 14 }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Изменить место доставки" onPress={() => setCityOpen(true)} style={[layout.row, { gap: 7, minHeight: 44 }]}><MapPin size={18} color={colors.accent} /><Text style={[type.label, { flex: 1 }]}>{location?.settlement ? settlementLabel(location.settlement) : 'Выберите населённый пункт'}</Text><ChevronRight size={18} color={colors.brand} /></Pressable>
    {loading ? <ActivityIndicator accessibilityLabel="Рассчитываем доставку" color={colors.brand} /> : rows.length ? rows.map(item => <View key={item.id} style={[layout.row, { alignItems: 'flex-start', gap: 10 }]}>{item.method === 'courier' ? <Truck size={21} color={colors.brand} /> : <Package size={21} color={colors.brand} />}<View style={{ flex: 1, gap: 3 }}><Text style={type.label}>{item.name}</Text><Text style={type.subheading}>{item.period} · {item.priceKopecks === 0 ? 'бесплатно' : formatMoney(item.priceKopecks)}</Text>{!!item.address && <Text style={type.caption}>{item.address}</Text>}{!!item.trackingLabel && <Text style={type.caption}>{item.trackingLabel}</Text>}</View></View>) : <>
      {[{ Icon: Package, title: 'Самовывоз', text: branch ? `Филиал: ${branch.address}. Готовность и склад отгрузки нужно подтвердить.` : 'Получение в филиале магазина после подтверждения готовности.' }, { Icon: Package, title: 'В пункт выдачи', text: 'Яндекс Маркет или СДЭК — если подходят вес и размеры заказа.' }, { Icon: Truck, title: 'До двери или на объект', text: 'Курьером или транспортной компанией. Для крупногабаритного оборудования учитываются адрес и разгрузка.' }].map(({ Icon, title, text }) => <View key={title} style={[layout.row, { alignItems: 'flex-start', gap: 10 }]}><Icon size={21} color={colors.brand} /><View style={{ flex: 1, gap: 3 }}><Text style={type.label}>{title}</Text><Text style={type.caption}>{text}</Text></View></View>)}
      <Text style={type.caption}>Способ, срок и стоимость зависят от места получения и состава заказа. Точный расчёт пока недоступен; менеджер поможет подобрать доставку.</Text>
    </>}
    <Button label="Уточнить доставку" variant="secondary" onPress={() => { setOpen(false); router.push('/information/contacts'); }} />
    <Pressable accessibilityRole="button" onPress={() => { setOpen(false); router.push('/information/delivery'); }} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={[type.label, { color: colors.brand }]}>Все способы и условия доставки →</Text></Pressable>
    {rows.length > 0 && <Button label="Обновить расчёт" variant="quiet" onPress={refresh} />}
  </View>;
  return <>
    {compact ? <Pressable accessibilityRole="button" accessibilityLabel="Доставка и самовывоз. Посмотреть варианты" onPress={() => setOpen(true)} style={[layout.row, { minHeight: 44, gap: 5 }]}><Truck size={14} color={colors.brand} /><Text style={[type.caption, { color: colors.brand, flex: 1 }]}>{label}</Text></Pressable> : <View style={{ gap: 8, padding: 16, backgroundColor: colors.white, borderRadius: 16 }}><Text accessibilityRole="header" aria-level={2} style={type.subheading}>{label}</Text>{details}</View>}
    <Sheet visible={open} onClose={() => setOpen(false)} title="Доставка и самовывоз">{details}</Sheet>
    <LocationPicker visible={cityOpen} onClose={() => setCityOpen(false)} />
  </>;
}
