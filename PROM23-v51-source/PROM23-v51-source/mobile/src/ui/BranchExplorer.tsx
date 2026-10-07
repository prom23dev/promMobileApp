import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, ChevronDown, ChevronRight, Clock3, Mail, MapPin, MessageSquare, Phone, PhoneCall, Search } from 'lucide-react-native';
import { useShop } from '../store';
import { getSiteContact, siteContacts, supportPhone, supportPhoneLabel } from '../content/siteContent';
import branchDetails from '../content/branchDetails.json';
import { branchPhotos } from '../content/editorialContent';
import { Button } from './primitives';
import { LocationPicker } from './LocationPicker';
import { ContentLink, ContentSection, EditorialPhoto, e } from './EditorialContent';
import { colors, layout, type } from './theme';
import { CompanyDisclosure } from './CompanyTrust';

export function BranchExplorer() {
  const { location, state } = useShop(); const router = useRouter(); const settlement = location?.settlement?.name;
  const [selected, setSelected] = useState(getSiteContact(settlement ?? '')?.city ?? 'Краснодар');
  const [query, setQuery] = useState(''); const [all, setAll] = useState(false); const [error, setError] = useState(''); const [locationOpen, setLocationOpen] = useState(false); const input = useRef<TextInput>(null);
  useEffect(() => { const match = getSiteContact(settlement ?? ''); if (match) setSelected(match.city); }, [settlement]);
  const branches = useMemo(() => Object.values(siteContacts).map(item => { const details = (branchDetails as Record<string, { hours: string[]; photoUrl: string | null }>)[item.city]; return { ...item, hours: details?.hours.length ? details.hours : item.hours, sourcePhoto: details?.photoUrl }; }).filter(item => `${item.city} ${item.address}`.toLowerCase().includes(query.trim().toLowerCase())), [query]);
  async function open(url: string, fallback: string) { setError(''); try { await Linking.openURL(url); } catch { setError(fallback); } }
  const quick = [
    { label: 'Позвонить', Icon: Phone, action: () => { void open('tel:' + supportPhone, 'Наберите номер ' + supportPhoneLabel); } },
    { label: 'Написать', Icon: MessageSquare, action: () => router.push({ pathname: '/forms/[id]', params: { id: 'appeal', expectedContext: state.context } }) },
    { label: 'Филиалы', Icon: Building2, action: () => input.current?.focus() },
    { label: 'Обратный звонок', Icon: PhoneCall, action: () => router.push({ pathname: '/forms/[id]', params: { id: 'callback', expectedContext: state.context } }) },
  ];
  return <View testID="branch-explorer" style={e.page}>
    <View style={s.quick}>{quick.map(({ label, Icon, action }) => <Pressable key={label} accessibilityRole="button" onPress={action} style={({ pressed }) => [s.quickAction, pressed && e.pressed]}><Icon size={24} color={colors.brand} /><Text style={[type.caption, { textAlign: 'center', color: colors.ink }]}>{label}</Text></Pressable>)}</View>
    <Pressable accessibilityRole="button" accessibilityLabel="Изменить населённый пункт доставки" onPress={() => setLocationOpen(true)} style={s.location}><MapPin size={21} color={colors.accent} /><View style={{ flex: 1, gap: 3 }}><Text style={type.caption}>Населённый пункт доставки</Text><Text style={type.label}>{location?.settlement?.fullName ?? 'Куда доставить заказ?'}</Text></View><ChevronDown size={18} color={colors.brand} /></Pressable>
    <ContentSection title="Найти филиал"><View style={e.search}><Search size={19} color={colors.brand} /><TextInput ref={input} accessibilityLabel="Поиск филиала по городу или адресу" placeholder="Город или адрес филиала" value={query} onChangeText={setQuery} style={[type.body, e.input]} returnKeyType="search" autoCorrect={false} /></View><Text style={type.caption}>Выбор филиала для связи не меняет населённый пункт доставки.</Text>
    </ContentSection>
    <ContentSection title="Филиалы" testID="branch-results">{(query || all ? branches : branches.slice(0, 6)).map(item => <View key={item.city}>
      <Pressable accessibilityRole="button" accessibilityLabel={'Филиал ' + item.city + '. ' + item.address} accessibilityState={{ expanded: selected === item.city }} aria-expanded={selected === item.city} onPress={() => setSelected(selected === item.city ? '' : item.city)} style={({ pressed }) => [s.branchRow, selected === item.city && { backgroundColor: colors.pale }, pressed && e.pressed]}><MapPin size={18} color={selected === item.city ? colors.accent : colors.brand} /><View style={{ flex: 1 }}><Text style={type.label}>{item.city}</Text><Text style={type.caption}>{item.address}</Text></View><ChevronDown size={18} color={colors.brand} style={{ transform: [{ rotate: selected === item.city ? '180deg' : '0deg' }] }} /></Pressable>
      {selected === item.city && <View testID="branch-detail" style={{ gap: 12, paddingVertical: 16 }}>{(branchPhotos[selected] || item.sourcePhoto) && <EditorialPhoto source={branchPhotos[selected] ?? { uri: item.sourcePhoto! }} label={'Филиал ' + selected + ' — фото с сайта компании'} height={150} />}<View style={s.hours}><Clock3 size={19} color={colors.brand} /><View style={{ flex: 1, gap: 3 }}>{item.hours ? item.hours.map(line => <Text key={line} style={type.body}>{line}</Text>) : <Text style={type.body}>График работы уточните перед поездкой.</Text>}</View></View>
        <View style={e.grid}><View style={e.half}><ContentLink title="Позвонить" caption={item.phoneLabel} icon={<Phone size={20} color={colors.accent} />} onPress={() => { void open('tel:' + item.phone, 'Телефон филиала: ' + item.phoneLabel); }} /></View><View style={e.half}><ContentLink title="Маршрут" caption="Открыть в картах" icon={<MapPin size={20} color={colors.brand} />} onPress={() => { void open(item.mapUrl, 'Не удалось открыть карту. Адрес: ' + item.address); }} /></View></View>{item.email && <ContentLink title={item.email} icon={<Mail size={19} color={colors.brand} />} onPress={() => { void open('mailto:' + item.email, 'Напишите по адресу ' + item.email); }} />}
        <Text style={type.caption}>Перед самовывозом уточните склад отгрузки, готовность заказа и правила въезда.</Text>
        {selected === 'Краснодар' && <CompanyDisclosure title="Офис, склад и торговый зал"><Text style={type.body}>Краснодарский склад открыт в 2008 году. Площадь — 12 000 м². Он обеспечивает логистику между филиалами Юга России и Кавказа и отгрузки в страны СНГ.</Text><Text style={type.body}>В 2019 году в Краснодаре открыт главный офис с большим торговым залом, где представлены экземпляры большинства товаров ассортимента. В 2020 году после реконструкции открыт зал с образцами строительного оборудования.</Text><Text style={type.body}>В офисе есть зоны для переговоров с клиентами и партнёрами, зоны отдыха и два конференц-зала для мероприятий B2B. Филиал поставляет оборудование по России и работает с компаниями, которые занимаются экспортом.</Text></CompanyDisclosure>}
      </View>}
    </View>)}
      {!query && branches.length > 6 && <Button label={all ? 'Свернуть список филиалов' : `Все филиалы · ${branches.length}`} variant="secondary" onPress={() => setAll(!all)} />}
      {!branches.length && <View style={e.notice}><Text style={type.subheading}>Филиал не найден</Text><Text style={type.body}>Проверьте город или адрес. Доставка может быть доступна и там, где нет филиала.</Text><ContentLink title="Все способы получения" route="/information/delivery" /></View>}
    </ContentSection>
    {error && <Text accessibilityRole="alert" selectable style={[type.body, { color: colors.accent }]}>{error}</Text>}
    <LocationPicker visible={locationOpen} onClose={() => setLocationOpen(false)} />
  </View>;
}
const s = StyleSheet.create({ quick: { flexDirection: 'row', gap: 6 }, quickAction: { flex: 1, minHeight: 76, padding: 5, gap: 9, alignItems: 'center', justifyContent: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.line }, location: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: colors.white }, branchRow: { flexDirection: 'row', gap: 10, minHeight: 50, paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: colors.line, alignItems: 'center' }, hours: { flexDirection: 'row', gap: 10 } });
