import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, Package } from 'lucide-react-native';
import { localRequest, type LocalOrder } from '../api/local';
import { formatMoney } from '../domain';
import { useShop } from '../store';
import { colors, layout, type } from '../ui/theme';
import { Button, EmptyState, Header } from '../ui/primitives';

export type CustomerOrder = LocalOrder & { mode?: string; statusLabel?: string; statusGroup?: 'active' | 'completed'; availableActions?: ('cancel' | 'repeat' | 'pay' | 'return' | 'review' | 'check-payment')[] };
export function isCustomerOrder(value: unknown): value is CustomerOrder {
  if (!value || typeof value !== 'object') return false;
  const order = value as Partial<CustomerOrder>;
  return order.mode !== 'local-sandbox' && typeof order.status === 'string' && !order.status.startsWith('test-') &&
    typeof order.id === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(order.id) && typeof order.number === 'string' &&
    typeof order.createdAt === 'string' && typeof order.deliveryLabel === 'string' &&
    (order.statusLabel === undefined || typeof order.statusLabel === 'string') &&
    Number.isSafeInteger(order.totalKopecks) && order.totalKopecks! >= 0 && Number.isSafeInteger(order.deliveryKopecks) && order.deliveryKopecks! >= 0 &&
    Array.isArray(order.items) && order.items.every(item => item && typeof item === 'object' && typeof item.productId === 'string' && typeof item.name === 'string' &&
      typeof item.quantity === 'number' && Number.isFinite(item.quantity) && item.quantity > 0 &&
      Number.isSafeInteger(item.unitPriceKopecks) && item.unitPriceKopecks >= 0 && Number.isSafeInteger(item.lineTotalKopecks) && item.lineTotalKopecks >= 0);
}
export function orderStatus(status: string, statusLabel?: string) {
  if (statusLabel) return statusLabel;
  return ({ 'awaiting-payment': 'Ожидает оплаты', processing: 'В сборке', shipped: 'Передан в доставку', ready: 'Готов к получению', completed: 'Завершён', cancelled: 'Отменён' } as Record<string, string>)[status] ?? 'Статус уточняется';
}
export function recordDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? 'Дата не указана' : date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function OrdersScreen() {
  const { state, ready, busy, error: shopError, retry } = useShop();
  const router = useRouter();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useFocusEffect(useCallback(() => {
    setOrders([]); setError(null); setLoading(true);
    if (!ready || busy) return;
    const controller = new AbortController();
    localRequest<{orders:unknown[]}>('/v1/workspace/orders', { method:'POST',body:{context:state.context},signal: controller.signal })
      .then(value => { if (!Array.isArray(value.orders)||!value.orders.every(isCustomerOrder)||value.orders.some(order=>order.context!==state.context))throw new Error('Invalid orders');if (!controller.signal.aborted) setOrders(value.orders); })
      .catch(() => { if (!controller.signal.aborted) setError('Не удалось загрузить заказы. Проверьте подключение и попробуйте снова.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [ready, busy, state.context, revision]));
  const visible = orders.filter(order => filter === 'all' || order.statusGroup === filter);
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right', 'bottom']}>
    <Header title="Мои заказы" back />
    <ScrollView buyerControls style={layout.content} contentContainerStyle={s.content}>
      <View style={layout.between}><View style={{ flex: 1, gap: 3 }}><Text style={type.heading}>{state.context === 'personal' ? 'Личные покупки' : 'Покупки организации'}</Text><Text style={type.caption}>Состав, получение и документы</Text></View><Button label="Обновить" variant="quiet" disabled={loading || busy || !ready} onPress={() => setRevision(value => value + 1)} /></View>
      <View style={s.tabs}>{([{ id: 'all', label: 'Все' }, { id: 'active', label: 'Активные' }, { id: 'completed', label: 'Завершённые' }] as const).map(tab => <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected: filter === tab.id }} aria-selected={filter === tab.id} onPress={() => setFilter(tab.id)} style={[s.tab, filter === tab.id && { backgroundColor: colors.brand }]}><Text style={[type.label, filter === tab.id && { color: colors.white }]}>{tab.label}</Text></Pressable>)}</View>
      {error || shopError ? <View style={layout.card}><Text accessibilityRole="alert" style={s.error}>{error ?? 'Заказы сейчас недоступны. Попробуйте подключиться снова.'}</Text><Button label="Попробовать снова" variant="secondary" disabled={busy} onPress={() => ready ? setRevision(value => value + 1) : retry()} /></View> : loading ? <View style={s.loading}><ActivityIndicator color={colors.brand} /><Text style={type.body}>Загружаем заказы…</Text></View> : visible.length ? visible.map(order => <Pressable key={order.id} accessibilityRole="button" accessibilityLabel={`Заказ ${order.number}, ${orderStatus(order.status, order.statusLabel)}, ${formatMoney(order.totalKopecks)}`} onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })} style={({ pressed }) => [layout.card, pressed && { opacity: 0.75 }]}>
        <View style={layout.between}><Text style={type.subheading}>{order.number}</Text><ChevronRight size={20} color={colors.muted} /></View><Text style={type.caption}>{recordDate(order.createdAt)}</Text><View style={s.badge}><Text style={[type.caption, { color: colors.brand }]}>{orderStatus(order.status, order.statusLabel)}</Text></View><Text numberOfLines={2} style={type.body}>{order.items.map(item => item.name).join(', ')}</Text><View style={layout.between}><Text style={type.caption}>{order.items.reduce((sum, item) => sum + item.quantity, 0)} ед.</Text><Text style={type.heading}>{formatMoney(order.totalKopecks)}</Text></View>
      </Pressable>) : <EmptyState title={filter === 'active' ? 'Активных заказов пока нет' : filter === 'completed' ? 'Завершённых заказов пока нет' : 'Здесь будут ваши заказы'} message="Войдите в аккаунт, чтобы увидеть свои покупки, или выберите товары в каталоге." icon={<Package size={34} color={colors.brand} />} action={<View style={{ gap: 10 }}><Button label="Войти в аккаунт" onPress={() => router.push({ pathname: '/forms/[id]', params: { id: 'auth-login' } })} /><Button label="Перейти в каталог" variant="secondary" onPress={() => router.push('/catalog')} /></View>} />}
    </ScrollView>
  </SafeAreaView>;
}
const s = StyleSheet.create({ content: { padding: 16, gap: 14, paddingBottom: 30 }, loading: { padding: 30, gap: 12, alignItems: 'center' }, error: { color: colors.accent, fontSize: 14, lineHeight: 21 }, badge: { alignSelf: 'flex-start', borderRadius: 8, backgroundColor: colors.pale, paddingHorizontal: 10, paddingVertical: 6 }, tabs: { flexDirection: 'row', gap: 6 }, tab: { flex: 1, minHeight: 46, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 } });
