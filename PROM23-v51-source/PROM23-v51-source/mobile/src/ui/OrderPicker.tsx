import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { localRequest, LocalApiError } from '../api/local';
import { isCustomerOrder, recordDate, type CustomerOrder } from '../screens/OrdersScreen';
import { Button, Sheet } from './primitives';
import { colors, layout, type } from './theme';
import type { ContextId } from '../domain';

// The server limits this list to the verified buyer and active organization.
// A target is checked again by the form endpoint; a picker selection grants no access.
export function OrderPicker({ visible, context, completedOnly = false, onClose, onSelect }: {
  visible: boolean; context: ContextId; completedOnly?: boolean;
  onClose: () => void; onSelect: (order: CustomerOrder) => void;
}) {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    setOrders([]); setLoading(true); setError(''); setSearch('');
    void localRequest<{ orders: unknown[] }>('/v1/workspace/orders', {
      method: 'POST', body: { context }, signal: controller.signal,
    }).then(result => {
      if (!Array.isArray(result.orders) || !result.orders.every(isCustomerOrder) || result.orders.some(order => order.context !== context)) throw new Error('Invalid orders');
      if (!controller.signal.aborted) setOrders(result.orders);
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof LocalApiError && ['AUTH_REQUIRED', 'AUTH_EXPIRED'].includes(error.code)
        ? 'Чтобы выбрать заказ, войдите в свой аккаунт. Текст обращения остаётся в форме.'
        : 'Не удалось загрузить заказы. Повторите загрузку — введённые данные остаются в форме.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [visible, context, revision]);
  const eligible = orders.filter(order => !completedOnly || order.statusGroup === 'completed');
  const query = search.trim().toLocaleLowerCase('ru');
  const found = eligible.filter(order => `${order.number} ${order.items.map(item => item.name).join(' ')}`.toLocaleLowerCase('ru').includes(query));
  return <Sheet visible={visible} title="Выберите заказ" onClose={onClose}>
    <Text style={type.caption}>Заказы {context === 'personal' ? 'из личного кабинета' : 'выбранной организации'}. После выбора вы продолжите заполнять эту же форму.</Text>
    {loading ? <View style={layout.row}><ActivityIndicator color={colors.brand} /><Text style={type.body}>Загружаем заказы…</Text></View>
      : error ? <><Text accessibilityRole="alert" style={type.body}>{error}</Text><Button label="Повторить загрузку заказов" variant="secondary" onPress={() => setRevision(value => value + 1)} /></>
      : <>
        {!!eligible.length && <TextInput accessibilityLabel="Найти заказ по номеру или товару" placeholder="Номер заказа или название товара" value={search} onChangeText={setSearch} style={{ minHeight: 48, padding: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 10, fontSize: 16 }} />}
        {found.map(order => <View key={order.id} style={[layout.card, { borderWidth: 1, borderColor: colors.line }]}>
          <Text style={type.subheading}>Заказ {order.number}</Text><Text style={type.caption}>{recordDate(order.createdAt)}</Text>
          <Text style={type.body}>{order.items.map(item => item.name).join(', ')}</Text>
          <Button label={`Выбрать заказ ${order.number}`} variant="secondary" onPress={() => onSelect(order)} />
        </View>)}
        {!found.length && <Text style={type.body}>{query ? 'По вашему запросу заказы не найдены.' : completedOnly ? 'Завершённых заказов в этом кабинете пока нет.' : 'В этом кабинете пока нет заказов. Если покупали без регистрации, укажите номер или дату покупки в комментарии.'}</Text>}
      </>}
    <Button label="Вернуться к форме" variant="quiet" onPress={onClose} />
  </Sheet>;
}
