import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, MessageSquare, Package, RotateCcw } from 'lucide-react-native';
import { localRequest, type ServiceRecord } from '../api/local';
import { useShop } from '../store';
import { colors, layout, type } from '../ui/theme';
import { Button, EmptyState, Header, Sheet } from '../ui/primitives';
import { isCustomerOrder, recordDate, type CustomerOrder } from './OrdersScreen';

type Kind = 'appeal' | 'return';
type CustomerRecord = ServiceRecord & { mode?: string; context?: string; statusLabel?: string; canRate?: boolean };
function visibleRecord(value: unknown, context: string): value is CustomerRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<CustomerRecord>;
  return record.mode !== 'local-sandbox' && typeof record.status === 'string' && !record.status.startsWith('test-') &&
    typeof record.id === 'string' && /^[A-Za-z0-9_-]{1,80}$/.test(record.id) && typeof record.number === 'string' && typeof record.createdAt === 'string' &&
    ['topic', 'reason', 'message', 'statusLabel'].every(key => (record as Record<string, unknown>)[key] === undefined || typeof (record as Record<string, unknown>)[key] === 'string') &&
    (record.context === undefined || record.context === context);
}
export default function ServiceScreen() {
  const params = useLocalSearchParams<{ orderId?: string; kind?: string }>();
  const incomingOrder = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const { state, ready, busy, error: shopError, retry } = useShop();
  const router = useRouter();
  const [kind, setKind] = useState<Kind>(params.kind === 'return' ? 'return' : 'appeal');
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [appeals, setAppeals] = useState<CustomerRecord[]>([]);
  const [returns, setReturns] = useState<CustomerRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<CustomerRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => { setKind(params.kind === 'return' ? 'return' : 'appeal'); }, [params.kind]);
  useFocusEffect(useCallback(() => {
    setOrders([]); setAppeals([]); setReturns([]); setSelectedRecord(null); setError(null); setLoading(true);
    const controller = new AbortController();
    if (!ready || busy) return () => controller.abort();
    Promise.all([
      localRequest<unknown[]>('/orders', { signal: controller.signal }),
      localRequest<unknown[]>('/appeals', { signal: controller.signal }),
      localRequest<unknown[]>('/returns', { signal: controller.signal }),
    ]).then(([orderValues, appealValues, returnValues]) => {
      if (controller.signal.aborted) return;
      setOrders(orderValues.filter(isCustomerOrder).filter(order => order.context === state.context));
      setAppeals(appealValues.filter((record): record is CustomerRecord => visibleRecord(record, state.context)));
      setReturns(returnValues.filter((record): record is CustomerRecord => visibleRecord(record, state.context)));
    }).catch(() => { if (!controller.signal.aborted) setError('Не удалось загрузить историю. Попробуйте снова.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [ready, busy, state.context, revision]));
  const selectedOrder = orders.find(order => order.id === incomingOrder);
  const returnable = orders.filter(order => Array.isArray(order.availableActions) && order.availableActions.includes('return'));
  const records = kind === 'return' ? returns : appeals;
  const form = (id: string, order?: CustomerOrder) => router.push({ pathname: '/forms/[id]', params: { id, expectedContext: state.context, ...(order ? { orderId: order.id } : {}) } });
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right', 'bottom']}>
    <Header title="Помощь и возвраты" back />
    <ScrollView buyerControls style={layout.content} contentContainerStyle={s.content}>
      <View style={s.tabs}>{([{ id: 'appeal', label: 'Обращения', icon: MessageSquare }, { id: 'return', label: 'Возвраты', icon: RotateCcw }] as const).map(item => {
        const Icon = item.icon;
        return <Pressable key={item.id} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: kind === item.id }} aria-selected={kind === item.id} onPress={() => { setKind(item.id); setSelectedRecord(null); }} style={[s.tab, kind === item.id && s.selected]}><Icon size={20} color={kind === item.id ? colors.accent : colors.muted} /><Text style={type.label}>{item.label}</Text></Pressable>;
      })}</View>
      <Text style={type.caption}>{state.context === 'personal' ? 'Личные покупки' : 'Покупки организации'}</Text>
      {kind === 'return' ? <View style={layout.card}><Text style={type.heading}>Оформить возврат</Text><Text style={type.body}>Выберите завершённый заказ и товары, которые хотите вернуть. Условия зависят от товара и типа покупателя.</Text>{returnable.map(order => <Button key={order.id} label={`Заказ ${order.number}`} variant="secondary" onPress={() => form('return', order)} />)}{!returnable.length && <Button label="Выбрать заказ" variant="secondary" onPress={() => router.push('/orders')} />}<Button label="Помощь с возвратом" variant="quiet" onPress={() => router.push('/information/contacts')} /></View> : <View style={layout.card}>
        <Text style={type.heading}>Чем помочь?</Text><Text style={type.body}>Задайте общий вопрос или опишите проблему с конкретным заказом.</Text>
        <Button label="Задать вопрос" onPress={() => form('appeal')} />
        <Button label={selectedOrder ? `Помощь с заказом ${selectedOrder.number}` : 'Проблема с заказом'} variant="secondary" onPress={() => form('appeal-order', selectedOrder)} />
        <Button label="Связаться с магазином" variant="quiet" onPress={() => router.push('/information/contacts')} />
      </View>}
      <View style={layout.between}><Text style={type.heading}>{kind === 'return' ? 'Мои заявки' : 'Мои обращения'}</Text><Button label="Обновить" variant="quiet" disabled={busy || (ready && loading)} onPress={() => ready ? setRevision(value => value + 1) : retry()} /></View>
      {(error || shopError) && <View style={layout.card}><Text accessibilityRole="alert" style={s.error}>{error ?? 'История сейчас недоступна. Попробуйте подключиться снова.'}</Text><Button label="Попробовать снова" variant="secondary" disabled={busy} onPress={() => ready ? setRevision(value => value + 1) : retry()} /></View>}
      {loading && !error && !shopError ? <View style={s.loading}><ActivityIndicator color={colors.brand} /><Text style={type.body}>Загружаем историю…</Text></View> : !error && !shopError && (records.length ? records.map(record => <Pressable key={record.id} accessibilityRole="button" accessibilityLabel={`${kind === 'return' ? 'Заявка' : 'Обращение'} ${record.number}`} onPress={() => setSelectedRecord(record)} style={({ pressed }) => [layout.card, pressed && { opacity: 0.75 }]}><View style={layout.between}><Text style={type.subheading}>{record.number}</Text><ChevronRight size={19} color={colors.muted} /></View><Text style={type.caption}>{recordDate(record.createdAt)}</Text><Text style={type.label}>{record.topic ?? record.reason ?? (kind === 'return' ? 'Возврат товара' : 'Обращение в магазин')}</Text><Text style={type.caption}>{record.statusLabel ?? 'Статус уточняется'}</Text></Pressable>) : <EmptyState title={kind === 'return' ? 'Заявок на возврат пока нет' : 'Ваши обращения будут здесь'} message="Войдите в аккаунт, чтобы увидеть историю и ответы магазина." icon={kind === 'return' ? <RotateCcw size={32} color={colors.brand} /> : <MessageSquare size={32} color={colors.brand} />} action={<Button label="Войти в аккаунт" variant="secondary" onPress={() => form('auth-login')} />} />)}
    </ScrollView>
    <Sheet visible={!!selectedRecord} title={selectedRecord ? `${kind === 'return' ? 'Заявка' : 'Обращение'} ${selectedRecord.number}` : 'Подробности'} onClose={() => setSelectedRecord(null)}>
      {selectedRecord && <><Text style={type.caption}>{recordDate(selectedRecord.createdAt)}</Text><Text style={type.subheading}>{selectedRecord.statusLabel ?? 'Статус уточняется'}</Text><Text style={type.body}>{selectedRecord.topic ?? selectedRecord.reason ?? ''}</Text>{typeof selectedRecord.message === 'string' && <Text style={type.body}>{selectedRecord.message}</Text>}{orders.some(order => order.id === selectedRecord.orderId) && <Button label="Открыть заказ" variant="secondary" icon={<Package size={20} color={colors.brand} />} onPress={() => { setSelectedRecord(null); router.push({ pathname: '/order/[id]', params: { id: selectedRecord.orderId! } }); }} />}{kind === 'appeal' && selectedRecord.canRate && <Button label="Оценить помощь" variant="secondary" onPress={() => { router.push({ pathname: '/forms/[id]', params: { id: 'appeal-rating', appealId: selectedRecord.id, expectedContext: state.context } }); setSelectedRecord(null); }} />}</>}
    </Sheet>
  </SafeAreaView>;
}
const s = StyleSheet.create({ content: { padding: 16, gap: 14, paddingBottom: 30 }, loading: { padding: 30, gap: 12, alignItems: 'center' }, error: { color: colors.accent, fontSize: 14, lineHeight: 21 }, tabs: { flexDirection: 'row', padding: 4, gap: 5, backgroundColor: colors.white, borderRadius: 14 }, tab: { flex: 1, minHeight: 52, borderRadius: 10, padding: 8, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' }, selected: { borderColor: colors.accent, backgroundColor: colors.pale } });
