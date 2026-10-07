import { legalCopy } from '../content/legalCopy';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { Bell, ChevronRight, Settings2 } from 'lucide-react-native';
import { useShop } from '../store';
import { localRequest } from '../api/local';
import { type Inbox, type InboxItem, type NotificationPreferences, notificationDestination } from '../notifications-domain';
import { colors, layout, type } from '../ui/theme';
import { Button, EmptyState, Header, Sheet } from '../ui/primitives';

const preferenceKeys: (keyof NotificationPreferences)[] = ['pushOrders', 'pushMarketing', 'emailOrders', 'emailMarketing', 'smsOrders', 'smsMarketing'];
const defaults = (): NotificationPreferences => ({ pushOrders: false, pushMarketing: false, emailOrders: false, emailMarketing: false, smsOrders: false, smsMarketing: false });
const validPreferences = (value: unknown): value is NotificationPreferences => !!value && typeof value === 'object' && preferenceKeys.every(key => typeof (value as NotificationPreferences)[key] === 'boolean');
function customerInbox(value: Inbox, context: string): Inbox {
  const preferences = defaults();
  if (value.mode === 'local-sandbox') return { ...value, items: [], preferences };
  if (validPreferences(value.preferences)) for (const key of preferenceKeys) preferences[key] = value.preferences[key];
  const items = value.items.filter(item => item && item.context === context && typeof item.id === 'string' && !item.id.startsWith('test-') &&
    (item.kind === 'order' || item.kind === 'marketing') && typeof item.title === 'string' && typeof item.body === 'string' &&
    typeof item.createdAt === 'string' && typeof item.read === 'boolean');
  return { ...value, items, preferences };
}

export default function NotificationsScreen() {
  const { state, busy, ready } = useShop();
  const router = useRouter();
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [filter, setFilter] = useState<'all' | 'order' | 'marketing'>('all');
  const [settings, setSettings] = useState(false);
  const [draftPreferences, setDraftPreferences] = useState<NotificationPreferences>(defaults);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const lock = useRef(false);
  const active = useRef(false);
  const currentContext = useRef(state.context); currentContext.current = state.context;
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!ready) return;
    const context = state.context;
    setError('');
    try {
      const value = await localRequest<Inbox>('/notifications', { signal });
      if (signal?.aborted || context !== currentContext.current || !active.current) return;
      // Sandbox events and previously saved draft choices never become customer messages or subscriptions.
      setInbox(customerInbox(value, context));
    } catch { if (!signal?.aborted && context === currentContext.current && active.current) setError('Не удалось загрузить уведомления. Попробуйте снова.'); }
  }, [state.context, ready]);
  useEffect(() => { setInbox(null); setSettings(false); setMessage(''); setError(''); setDraftPreferences(defaults()); }, [state.context, ready]);
  useFocusEffect(useCallback(() => { active.current = true; const controller = new AbortController(); void load(controller.signal); return () => { active.current = false; controller.abort(); }; }, [load]));
  async function open(item: InboxItem) {
    if (lock.current || busy || item.context !== state.context) return;
    const target = item.kind === 'order' && typeof item.orderId === 'string' && /^[1-9][0-9]{0,11}$/.test(item.orderId) ? `/order/${item.orderId}` : notificationDestination(item, state.context);
    router.push(target as Href);
  }
  const items = inbox?.items.filter(item => filter === 'all' || item.kind === filter) ?? [];
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}>
    <Header title="Уведомления" back />
    <ScrollView buyerControls style={layout.content} contentContainerStyle={s.content}>
      <View style={layout.between}><Text style={type.caption}>{state.context === 'personal' ? 'Личные покупки' : 'Покупки организации'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Настройки уведомлений и рассылок" disabled={saving || busy} onPress={() => { setDraftPreferences({ ...(inbox?.preferences ?? defaults()) }); setSettings(true); setMessage(''); setError(''); }} style={[layout.row, { minHeight: 44, gap: 7 }]}><Settings2 color={colors.brand} size={20} /><Text style={type.label}>Настройки</Text></Pressable></View>
      <View style={[layout.row, { gap: 8 }]}>{([{ id: 'all', label: 'Все' }, { id: 'order', label: 'Заказы' }, { id: 'marketing', label: 'Рассылки' }] as const).map(tab => <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected: filter === tab.id }} aria-selected={filter === tab.id} onPress={() => setFilter(tab.id)} style={[s.tab, filter === tab.id && { backgroundColor: colors.brand }]}><Text style={[type.label, filter === tab.id && { color: colors.white }]}>{tab.label}</Text></Pressable>)}</View>
      {error && !settings ? <View style={layout.card}><Text accessibilityRole="alert" style={type.body}>{error}</Text><Button label="Повторить загрузку" onPress={() => { void load(); }} /></View> : !inbox && ready ? <ActivityIndicator color={colors.brand} /> : null}
      {!!message && <Text accessibilityLiveRegion="polite" style={type.body}>{message}</Text>}
      {items.map(item => <Pressable key={item.id} accessibilityRole="button" disabled={saving || busy} accessibilityLabel={`${item.read ? '' : 'Новое. '}${item.title}. ${item.body}`} onPress={() => { void open(item); }} style={[layout.card, { borderLeftWidth: item.read ? 0 : 3, borderLeftColor: colors.accent }]}><View style={layout.between}><Text style={[type.label, { flex: 1 }]}>{item.title}</Text><ChevronRight size={18} color={colors.brand} /></View><Text style={type.body}>{item.body}</Text><Text style={type.caption}>{new Date(item.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</Text></Pressable>)}
      {(!ready || inbox) && !items.length && <EmptyState icon={<Bell size={30} color={colors.brand} />} title={filter === 'marketing' ? 'Предложений пока нет' : 'Здесь будут ваши уведомления'} message={filter === 'marketing' ? 'Здесь собраны новости, акции и предложения магазина.' : 'Сообщения о заказах помогут следить за оплатой, сборкой и получением покупок.'} action={<Button label="Настроить уведомления" variant="secondary" onPress={() => { setDraftPreferences({ ...(inbox?.preferences ?? defaults()) }); setSettings(true); setError(''); }} />} />}
    </ScrollView>
    <Sheet visible={settings} onClose={() => setSettings(false)} title="Уведомления и рассылки">
      <Text style={type.body}>{legalCopy.serviceMessages}</Text>
      <Text style={type.body}>Рекламные сообщения по электронной почте и SMS выбираются отдельно. Их можно отключить, сохранив сообщения о заказах.</Text>
      <Button label="Настроить email и SMS" onPress={() => { setSettings(false); router.push('/forms/notification-preferences'); }} />
      <Button label="Согласие на получение рекламы" variant="quiet" onPress={() => { setSettings(false); router.push('/legal/advertising'); }} />
      <Button label="Отказаться от рекламы по e-mail" variant="quiet" onPress={() => { void Linking.openURL('mailto:info@prom23.ru?subject='+encodeURIComponent('Отказ от рекламных сообщений')); }} />
    </Sheet>
  </SafeAreaView>;
}
const s = StyleSheet.create({ content: { padding: 16, gap: 16, paddingBottom: 32 }, tab: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderRadius: 12 }, preferenceGroup: { gap: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line } });
