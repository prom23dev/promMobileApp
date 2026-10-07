import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { FileText, PackageCheck, Truck } from 'lucide-react-native';
import { localRequest, LocalApiError } from '../api/local';
import { submitSiteForm,loadSiteFormContext,submissionKey } from '../api/site';
import { formatMoney } from '../domain';
import { useShop } from '../store';
import { colors, layout, type } from '../ui/theme';
import { Button, EmptyState, Header, Sheet } from '../ui/primitives';
import { isCustomerOrder, orderStatus, recordDate, type CustomerOrder } from './OrdersScreen';

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { state, ready, busy, error: shopError, retry } = useShop();
  const router = useRouter();
  const [order, setOrder] = useState<CustomerOrder | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);const cancelKey=useRef(submissionKey());
  const active = useRef(false);const currentId=useRef(id);currentId.current=id;
  const context = useRef(state.context); context.current = state.context;
  useEffect(() => { setMessage('');cancelKey.current=submissionKey(); }, [id, state.context]);
  useFocusEffect(useCallback(() => {
    active.current = true; setOrder(null); setUnavailable(false); setError(null); setCancelOpen(false); setReviewOpen(false); setLoading(true);
    const controller = new AbortController();
    if (!ready || busy) return () => { active.current = false; controller.abort(); };
    if (!id || !/^[A-Za-z0-9_-]{1,80}$/.test(id)) { setUnavailable(true); setLoading(false); return () => { active.current = false; }; }
    localRequest<{orders:unknown[]}>('/v1/workspace/orders', { method:'POST',body:{context:state.context,target:{orderId:id}},signal: controller.signal })
      .then(result => {
        const value=Array.isArray(result.orders)&&result.orders.length===1?result.orders[0]:null;
        if (controller.signal.aborted) return;
        if (!isCustomerOrder(value) || value.context !== state.context || value.id !== id) { setUnavailable(true); return; }
        setOrder(value);
      })
      .catch(e => {
        if (controller.signal.aborted) return;
        if (e instanceof LocalApiError && [401, 403, 404].includes(e.status)) setUnavailable(true);
        else setError('Не удалось открыть заказ. Проверьте подключение и попробуйте снова.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { active.current = false; controller.abort(); };
  }, [ready, busy, id, state.context, revision]));
  const allowed = (action: NonNullable<CustomerOrder['availableActions']>[number]) => Array.isArray(order?.availableActions) && order.availableActions.includes(action);
  const openForm = (formId: string, productId?: string) => { if (order) router.push({ pathname: '/forms/[id]', params: { id: formId, orderId: order.id, expectedContext: order.context, ...(productId ? { productId } : {}) } }); };
  async function refreshPayment() {
    if(lock.current||!order||busy)return;
    lock.current=true;setSaving(true);setError(null);setMessage('');const requestedContext=state.context,requestedId=order.id;
    try{
      await localRequest('/v1/payment/status',{method:'POST',body:{expectedContext:requestedContext,reference:requestedId}});
      if(!active.current||context.current!==requestedContext||currentId.current!==id)return;
      setMessage('Статус оплаты проверен. Обновляем данные заказа.');setRevision(value=>value+1);
    }catch(e){if(active.current&&context.current===requestedContext&&currentId.current===id)setError(e instanceof Error?e.message:'Не удалось проверить оплату.');}
    finally{lock.current=false;if(active.current)setSaving(false);}
  }
  async function cancel() {
    if (lock.current || !order || !allowed('cancel') || busy) return;
    lock.current = true; setSaving(true); setError(null); setMessage('');
    const requestedContext = state.context;
    try {
      const target={orderId:order.id};const formContext=await loadSiteFormContext({formId:'order-cancel',context:requestedContext,target});
      if(!active.current||context.current!==requestedContext||currentId.current!==id)return;
      const result = await submitSiteForm({ formId: 'order-cancel', values: {}, target,revision:formContext.revision,idempotencyKey:cancelKey.current,consents: [], context: requestedContext });
      if (!active.current || context.current !== requestedContext || currentId.current!==id) return;
      if (result.status !== 'accepted' || !result.reference) throw new Error('Не получено подтверждение отмены. Обновите заказ.');
      // Acceptance is a request result. Only a fresh order response may change the displayed status.
      setCancelOpen(false); setMessage('Запрос на отмену принят.'); setRevision(value => value + 1);
    } catch (e) {
      if (active.current && context.current === requestedContext && currentId.current===id) setError(e instanceof Error ? e.message : 'Не удалось отменить заказ.');
    } finally { lock.current = false; if (active.current) setSaving(false); }
  }
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right', 'bottom']}>
    <Header title={order ? `Заказ ${order.number}` : 'Заказ'} back />
    <ScrollView buyerControls style={layout.content} contentContainerStyle={s.content}>
      {(error || shopError) && <View style={layout.card}><Text accessibilityRole="alert" style={s.error}>{error ?? 'Заказ сейчас недоступен. Попробуйте подключиться снова.'}</Text>{!order && <><Button label="Повторить загрузку" variant="secondary" disabled={busy} onPress={() => ready ? setRevision(value => value + 1) : retry()} /><Button label="Все заказы" variant="quiet" onPress={() => router.replace('/orders')} /></>}</View>}
      {loading && !shopError ? <View style={s.loading}><ActivityIndicator color={colors.brand} /><Text style={type.body}>Открываем заказ…</Text></View> : unavailable ? <EmptyState title="Заказ недоступен" message="Проверьте аккаунт и выбранного покупателя или откройте заказ из своей истории." icon={<PackageCheck size={34} color={colors.brand} />} action={<Button label="Все заказы" onPress={() => router.replace('/orders')} />} /> : order && <>
        {!!message && <Text accessibilityLiveRegion="polite" style={type.body}>{message}</Text>}
        <View style={layout.card}><View style={layout.row}><PackageCheck size={28} color={colors.brand} /><Text accessibilityLiveRegion="polite" style={[type.heading, { flex: 1, marginLeft: 12 }]}>{orderStatus(order.status, order.statusLabel)}</Text></View><Text style={type.caption}>{recordDate(order.createdAt)} · {order.context === 'personal' ? 'Личные покупки' : 'Покупки организации'}</Text></View>
        <View style={layout.card}><View style={layout.row}><Truck size={23} color={colors.brand} /><Text style={[type.subheading, { marginLeft: 10 }]}>Получение</Text></View><Text style={type.body}>{order.deliveryLabel}</Text></View>
        <View style={layout.card}><Text style={type.heading}>Состав заказа</Text>{order.items.map(item => <View key={item.productId} style={s.line}><Text style={type.label}>{item.name}</Text><View style={layout.between}><Text style={type.caption}>{item.quantity} × {formatMoney(item.unitPriceKopecks)}</Text><Text style={type.label}>{formatMoney(item.lineTotalKopecks)}</Text></View></View>)}<View style={layout.between}><Text style={type.body}>Получение</Text><Text style={type.label}>{formatMoney(order.deliveryKopecks)}</Text></View><View style={layout.between}><Text style={type.heading}>Итого</Text><Text style={type.heading}>{formatMoney(order.totalKopecks)}</Text></View></View>
        {(allowed('pay') || allowed('repeat')) && <View style={layout.card}>{allowed('pay') && <><Button label="Оплатить заказ" disabled={saving || busy} onPress={() => openForm('order-pay')} />{allowed('check-payment')&&<Button label="Обновить статус оплаты" variant="secondary" disabled={saving||busy} onPress={()=>{void refreshPayment()}}/>}</>}{allowed('repeat') && <Button label="Повторить заказ" variant="secondary" disabled={saving || busy} onPress={() => openForm('order-repeat')} />}</View>}
        <View style={layout.card}><View style={layout.row}><FileText size={22} color={colors.brand} /><Text style={[type.subheading, { marginLeft: 10 }]}>Документы заказа</Text></View><Button label="Запросить документ" variant="secondary" disabled={saving || busy} onPress={() => openForm('document-request')} /><Button label="Все документы" variant="quiet" onPress={() => router.push({ pathname: '/workspace/[kind]', params: { kind: 'documents' } })} /></View>
        <View style={layout.card}><Text style={type.subheading}>Помощь с заказом</Text><Button label="Создать обращение" variant="secondary" disabled={saving || busy} onPress={() => openForm('appeal-order')} />{allowed('return') && <Button label="Оформить возврат" variant="secondary" disabled={saving || busy} onPress={() => openForm('return')} />}{allowed('review') && <Button label="Оставить отзыв" variant="secondary" disabled={saving || busy} onPress={() => setReviewOpen(true)} />}{allowed('cancel') && <Button label="Отменить заказ" variant="quiet" disabled={saving || busy} onPress={() => setCancelOpen(true)} />}</View>
      </>}
    </ScrollView>
    <Sheet visible={cancelOpen} title="Отменить заказ?" onClose={() => { if (!saving) setCancelOpen(false); }}><Text style={type.body}>Магазин проверит возможность отмены. Состояние заказа обновится после подтверждения. Если заказ оплачен, информация о возврате оплаты появится отдельно.</Text>{saving && <ActivityIndicator color={colors.accent} />}{error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}<Button label={saving ? 'Отправляем запрос…' : 'Подтвердить отмену'} disabled={saving || busy} onPress={() => { void cancel(); }} /><Button label="Оставить заказ" variant="secondary" disabled={saving} onPress={() => setCancelOpen(false)} /></Sheet>
    <Sheet visible={reviewOpen} title="О каком товаре оставить отзыв?" onClose={() => setReviewOpen(false)}>{order?.items.map(item => <Button key={item.productId} label={item.name} variant="secondary" onPress={() => { setReviewOpen(false); openForm('order-review', item.productId); }} />)}</Sheet>
  </SafeAreaView>;
}
const s = StyleSheet.create({ content: { padding: 16, gap: 14, paddingBottom: 30 }, loading: { padding: 30, gap: 12, alignItems: 'center' }, error: { color: colors.accent, fontSize: 14, lineHeight: 21 }, line: { paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.line } });
