import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowRight, ChevronDown, PackageCheck, PackageX, Search, MessageSquare } from 'lucide-react-native';
import { returnsCopy as copy, type ReturnBlock } from '../content/returnsCopy';
import { useShop } from '../store';
import { colors, type } from './theme';
import { Button } from './primitives';
import { BuyerInfoGrid } from './EditorialContent';
import { useReducedMotion } from './useReducedMotion';

function Rich({ text }: { text: string }) {
  return <Text selectable style={type.body}>{text.split('**').map((part, i) => <Text key={i} style={i % 2 ? s.strong : undefined}>{part}</Text>)}</Text>;
}
function Tap({ title, onPress, children, expanded }: { title: string; onPress: () => void; children?: React.ReactNode; expanded?: boolean }) {
  const [focus, setFocus] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={title} aria-expanded={expanded} accessibilityState={expanded === undefined ? undefined : { expanded }} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} onPress={onPress} style={({ pressed }) => [s.tap, focus && s.focus, pressed && { opacity: .75 }]}>{children ?? <Text style={[type.label, { color: colors.brand, flex: 1 }]}>{title}</Text>}{expanded === undefined ? <ArrowRight size={19} color={colors.brand} /> : <ChevronDown size={21} color={colors.brand} style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }} />}</Pressable>;
}
export function ReturnsPage({ scrollRef }: { scrollRef: React.RefObject<ScrollView | null> }) {
  const router = useRouter(); const { state, dispatch, ready, busy, error } = useShop();
  const reduce = useReducedMotion();
  const [buyer, setBuyer] = useState<'personal' | 'business'>(state.context === 'personal' ? 'personal' : 'business');
  const [open, setOpen] = useState<Set<string>>(() => new Set(['r2', 'r14']));
  const [pending, setPending] = useState<{ route: Href; context: string } | null>(null);
  const [focusedTab, setFocusedTab] = useState('');
  const [linkError, setLinkError] = useState('');
  const positions = useRef<Record<string, number>>({});
  const context = buyer === 'personal' ? 'personal' : state.context.startsWith('organization:') ? state.context : 'business';
  useEffect(() => { if (!pending || busy) return; if (ready && !error && state.context === pending.context) { router.push(pending.route); setPending(null); } else if (error) setPending(null); }, [pending, busy, ready, error, state.context]);
  const go = (route: Href) => {
    if (!ready || busy) return;
    if (state.context === context) router.push(route);
    else { setPending({ route, context }); dispatch({ type: 'context', context }); }
  };
  const contact = async (url: string) => { setLinkError(''); try { await Linking.openURL(url); } catch { setLinkError('Не удалось открыть приложение. Напишите на promo@prom23.ru или позвоните 8 (800) 200-25-90.'); } };
  const jump = (id: string) => { setOpen(prev => new Set([...prev, id])); requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: Math.max(0, (positions.current[id] ?? 0) - 12), animated: !reduce })); };
  const action = (label: string) => {
    if (/Мои возвраты|мои возвраты/.test(label)) go('/workspace/returns');
    else if (/Оформить возврат/.test(label)) go('/orders');
    else if (/Связаться/.test(label)) router.push('/information/contacts');
    else go({ pathname: '/forms/[id]', params: { id: 'appeal', expectedContext: context } });
  };
  const blocks = (list: ReturnBlock[]) => list.map((block, i) => {
    if (block.kind === 'list') return <View key={i} style={s.list}>{block.items.map((item, j) => <View key={j} style={s.listRow}><View aria-hidden style={s.dot} /><View style={{ flex: 1 }}><Rich text={item} /></View></View>)}</View>;
    if (block.kind === 'heading') return <Text key={i} accessibilityRole="header" aria-level={block.level === 3 ? 4 : 3} style={[block.level === 3 ? s.h4 : s.h3, i > 0 && { marginTop: 12 }]}>{block.text}</Text>;
    if (block.kind === 'action') return <Button key={i} label={block.text} variant="secondary" disabled={busy || !ready || !!pending} onPress={() => action(block.text)} />;
    return <Rich key={i} text={block.text} />;
  });
  const section = (index: number, collapsible = true) => {
    const item = copy.sections[index], expanded = open.has(item.id);
    return <View key={item.id} testID={'returns-' + item.id} onLayout={e => { positions.current[item.id] = e.nativeEvent.layout.y; }} style={s.section}>
      {collapsible ? <View style={s.disclosure}><Tap title={item.title} expanded={expanded} onPress={() => setOpen(prev => { const next = new Set(prev); next.has(item.id) ? next.delete(item.id) : next.add(item.id); return next; })}><Text accessibilityRole="header" aria-level={2} style={[s.h3, { flex: 1 }]}>{item.title}</Text></Tap>{expanded && <View style={s.inside}>{blocks(item.blocks)}</View>}</View> : <><View style={s.marker}><Text accessibilityRole="header" aria-level={2} style={s.h2}>{item.title}</Text></View><View style={s.card}>{blocks(item.blocks)}</View></>}
    </View>;
  };
  const personal = buyer === 'personal';
  const situations = [
    { title: 'Товар не подошёл', text: 'Товар исправен, но вы решили отказаться от покупки.', id: personal ? 'r2' : 'r17', Icon: PackageCheck },
    { title: 'Есть недостаток', text: 'Товар неисправен, повреждён или работает не так, как должен.', id: personal ? 'r6' : 'r19', Icon: PackageX },
    { title: 'Не тот товар или комплектация', text: 'Получили другую позицию, недостаёт комплектующих или количество не соответствует заказу.', id: personal ? 'r12' : 'r22', Icon: Search },
    { title: 'Другая ситуация', text: 'Если подходящего варианта нет, оставьте обращение и опишите проблему.', id: 'r27', Icon: MessageSquare },
  ];
  return <View testID="returns-page" style={s.page}>
    <View style={{ gap: 12 }}><Text accessibilityRole="header" aria-level={1} style={s.h1}>Возврат товаров</Text><Text accessibilityRole="header" aria-level={2} style={s.h2}>Поможем оформить возврат</Text><Rich text="Условия зависят от того, **для кого был оформлен заказ**, каким способом был приобретён товар и по какой причине вы хотите его вернуть." /></View>
    <View style={s.tabs}>{(['personal', 'business'] as const).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityLabel={value === 'personal' ? 'Для себя' : 'Для бизнеса'} accessibilityState={{ selected: buyer === value }} aria-selected={buyer === value} onFocus={() => setFocusedTab(value)} onBlur={() => setFocusedTab('')} onPress={() => setBuyer(value)} style={({ pressed }) => [s.tab, buyer === value && s.selected, focusedTab === value && s.focus, pressed && { opacity: .75 }]}><Text style={[type.label, { color: buyer === value ? colors.white : colors.brand }]}>{value === 'personal' ? 'Для себя' : 'Для бизнеса'}</Text></Pressable>)}</View>
    <View style={s.actions}><Button label={personal ? 'Оформить возврат' : 'Оформить возврат для компании'} disabled={!ready || busy || !!pending} onPress={() => go('/orders')} /><Button label="Мои возвраты" variant="secondary" disabled={!ready || busy || !!pending} onPress={() => go('/workspace/returns')} /></View>
    <View style={s.summary}><Text style={s.summaryLabel}>{personal ? 'Личная покупка' : 'Заказ компании или ИП'}</Text><Text style={type.body}>{personal ? 'Через сайт — 7 дней после получения исправного товара. Для покупки в магазине и товара с недостатком действуют другие правила.' : 'Возврат и требования по поставке — по договору и Гражданскому кодексу РФ. Потребительские сроки не применяются автоматически.'}</Text><Tap title={personal ? 'Условия и исключения' : 'Условия для бизнеса'} onPress={() => jump(personal ? 'r2' : 'r14')} /></View>
    <View style={{ gap: 12 }}><Text accessibilityRole="header" aria-level={2} style={s.h2}>Выберите вашу ситуацию</Text><View style={s.grid}>{situations.map(({ title, text, id, Icon }) => <View key={id} style={s.scenario}><Tap title={title} onPress={() => jump(id)}><View style={{ flex: 1, gap: 10 }}><Icon color={colors.brand} size={24} /><Text style={type.label}>{title}</Text><Text style={type.caption}>{text}</Text></View></Tap></View>)}</View>{(error || linkError) && <Text accessibilityRole="alert" style={type.body}>{linkError || error}</Text>}<Tap title="Не нашли заказ? Оставить обращение" onPress={() => jump('r27')} /><Text style={type.caption}>Укажите всё, что известно о покупке. Мы поможем найти заказ и определить дальнейшие действия.</Text></View>
    {section(1, false)}
    {personal ? <>{section(2, false)}{[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(i => section(i))}</> : <>{section(14, false)}{[15, 16, 17, 18, 19, 20, 21, 22, 23].map(i => section(i))}</>}
    <View style={s.summary}><Text style={type.label}>{personal ? 'Оформляли заказ для компании?' : 'Покупали для личных нужд?'}</Text><Tap title={personal ? 'Посмотреть условия для бизнеса' : 'Посмотреть условия для физических лиц'} onPress={() => { setBuyer(personal ? 'business' : 'personal'); scrollRef.current?.scrollTo({ y: 0, animated: !reduce }); }} /></View>
    {section(24)}{section(25)}{section(26, false)}
    <View style={s.contacts}><Text style={s.h3}>Контакты по возвратам</Text><Text style={type.body}>ООО «Промышленник» · ИНН 2311108272</Text><Tap title="Написать на promo@prom23.ru" onPress={() => { void contact('mailto:promo@prom23.ru'); }} /><Tap title="Позвонить 8 (800) 200-25-90" onPress={() => { void contact('tel:+78002002590'); }} /><Text selectable style={type.caption}>350058, Краснодарский край, г. Краснодар, ул. им. Селезнёва, дом 201, офис 5</Text><Text style={type.caption}>Это адрес для письменных обращений. Адрес отправки товара уточните перед перевозкой. Если продавец в заказе другой, используйте его реквизиты.</Text><Tap title="Документы и контакты продавца в заказе" onPress={() => go('/orders')} /></View>
    {section(27)}{section(28, false)}
    <BuyerInfoGrid exclude="/pages/returns" />
    <Text style={type.caption}>Правила возврата · редакция от 14 сентября 2026 года</Text>
  </View>;
}
const s = StyleSheet.create({
  page: { gap: 24 }, h1: { ...type.title, fontSize: 28, lineHeight: 34 }, h2: { color: colors.brand, fontSize: 24, lineHeight: 30, fontWeight: '800' }, h4: { color: colors.brand, fontSize: 17, lineHeight: 24, fontWeight: '700' }, h3: { color: colors.ink, fontSize: 20, lineHeight: 25, fontWeight: '700' }, strong: { color: colors.brand, fontWeight: '700' },
  tabs: { flexDirection: 'row', gap: 6, padding: 5, backgroundColor: colors.pale, borderRadius: 14 }, tab: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12, minHeight: 48, borderRadius: 10, borderWidth: 2, borderColor: 'transparent' }, selected: { backgroundColor: colors.brand }, focus: { borderColor: colors.accent },
  summary: { padding: 16, gap: 8, borderRadius: 16, backgroundColor: colors.pale }, summaryLabel: { ...type.label, color: colors.brand }, marker: { borderLeftWidth: 3, borderColor: colors.accent, paddingLeft: 12 }, section: { gap: 16 }, card: { padding: 18, gap: 16, borderRadius: 18, backgroundColor: colors.white },
  disclosure: { borderRadius: 16, backgroundColor: colors.white, overflow: 'hidden' }, inside: { padding: 18, paddingTop: 0, gap: 16 }, tap: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 2, borderColor: 'transparent', borderRadius: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, scenario: { flexGrow: 1, flexBasis: '46%', minWidth: 260, backgroundColor: colors.white, borderRadius: 16 }, actions: { gap: 10 }, list: { gap: 10 }, listRow: { flexDirection: 'row', gap: 12 }, dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.brand, marginTop: 9 }, contacts: { padding: 18, gap: 10, borderRadius: 18, backgroundColor: colors.pale },
});
