import React, { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ChevronDown, Clock3, MapPin, Navigation, Phone, Search, Warehouse } from 'lucide-react-native';
import { siteContacts } from '../content/siteContent';
import branchDetails from '../content/branchDetails.json';
import { colors, type } from './theme';
import { VerticalReveal } from './VerticalReveal';

// Only these locations are expressly named as pickup warehouses on /delivery/.
const warehouseCities = ['Москва', 'Санкт-Петербург', 'Краснодар', 'Ростов-на-Дону', 'Пермь', 'Пятигорск', 'Симферополь', 'Грозный', 'Иркутск'];
export function DeliveryWarehouses() {
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState('Все');
  const [all, setAll] = useState(false); const [expanded, setExpanded] = useState(''); const [error, setError] = useState('');
  const points = useMemo(() => Object.values(siteContacts).filter(item =>
    (filter !== 'Склады' || warehouseCities.includes(item.city)) && `${item.city} ${item.address}`.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru'))
  ), [query, filter]);
  const visible = query || all ? points : points.slice(0, 3);
  async function open(url: string, fallback: string) { setError(''); try { await Linking.openURL(url); } catch { setError(fallback); } }
  return <View testID="delivery-warehouses" style={{ gap: 16 }}>
    <View style={s.search}><Search strokeWidth={1.8} size={20} color={colors.brand} aria-hidden /><TextInput accessibilityLabel="Поиск складов и филиалов по городу" placeholder="Город или адрес" value={query} onChangeText={setQuery} maxLength={120} autoCorrect={false} style={[type.body, s.input]} /></View>
    <View accessibilityRole="tablist" accessibilityLabel="Тип точки" style={{ flexDirection: 'row', gap: 8 }}>{['Все', 'Склады'].map(label => <Pressable key={label} accessibilityRole="tab" accessibilityState={{ selected: filter === label }} aria-selected={filter === label} onPress={() => { setFilter(label); setAll(false); }} style={({ pressed }) => [s.chip, filter === label && { backgroundColor: colors.brand }, pressed && { opacity: .7 }]}><Text style={[type.label, { color: filter === label ? colors.white : colors.brand }]}>{label}</Text></Pressable>)}</View>
    <Text accessibilityLiveRegion="polite" style={type.caption}>Найдено точек: {points.length}</Text>
    {visible.map((point, index) => {
      const isOpen = expanded === point.city;
      const hours = (branchDetails as Record<string, { hours: string[] }>)[point.city]?.hours ?? point.hours;
      return <VerticalReveal key={point.city} delay={index * 25} testID={'delivery-warehouse-' + point.city} style={s.card}>
        <Pressable accessibilityRole="button" accessibilityLabel={'Подробнее: ' + point.city} accessibilityState={{ expanded: isOpen }} aria-expanded={isOpen} onPress={() => setExpanded(isOpen ? '' : point.city)} style={({ pressed }) => [s.trigger, pressed && { opacity: .7 }]}>
          <Warehouse strokeWidth={1.8} size={23} color={colors.brand} aria-hidden /><View style={{ flex: 1, gap: 4 }}><Text style={type.subheading}>{point.city}</Text><Text style={type.caption}>{warehouseCities.includes(point.city) ? 'Склад' : 'Филиал'}</Text></View><ChevronDown strokeWidth={1.8} size={20} aria-hidden color={colors.brand} style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }} />
        </Pressable>
        <Text style={type.body}>{point.address}</Text>
        {!isOpen && <Pressable accessibilityRole="button" accessibilityLabel={'Режим работы и контакты: ' + point.city} onPress={() => setExpanded(point.city)} style={s.details}><Text style={[type.label, { color: colors.brand }]}>Подробнее</Text></Pressable>}
        {isOpen && <View testID="warehouse-expanded" style={{ gap: 12, paddingTop: 8 }}>
          <View style={s.row}><Clock3 strokeWidth={1.8} size={18} color={colors.brand} aria-hidden /><View style={{ flex: 1, gap: 3 }}>{hours?.length ? hours.map(line => <Text key={line} style={type.body}>{line}</Text>) : <Text style={type.body}>График работы уточните перед поездкой.</Text>}</View></View>
          <Text style={type.label}>{point.phoneLabel}</Text>
          <View style={s.actions}>
            <Pressable accessibilityRole="link" accessibilityLabel={'Позвонить: ' + point.city} {...{ href: 'tel:' + point.phone }} onPress={event => { event.preventDefault(); void open('tel:' + point.phone, 'Наберите ' + point.phoneLabel); }} style={({ pressed }) => [s.action, pressed && { opacity: .7 }]}><Phone strokeWidth={1.8} style={{ flexShrink: 0 }} size={18} color={colors.brand} aria-hidden /><Text style={[type.label, { flexShrink: 1 }]}>Позвонить</Text></Pressable>
            <Pressable accessibilityRole="link" accessibilityLabel={'Построить маршрут: ' + point.city} {...{ href: point.mapUrl }} onPress={event => { event.preventDefault(); void open(point.mapUrl, 'Адрес: ' + point.address); }} style={({ pressed }) => [s.action, pressed && { opacity: .7 }]}><Navigation strokeWidth={1.8} style={{ flexShrink: 0 }} size={18} color={colors.brand} aria-hidden /><Text style={[type.label, { flexShrink: 1 }]}>Построить маршрут</Text></Pressable>
          </View>
        </View>}
      </VerticalReveal>;
    })}
    {!points.length && <Text accessibilityLiveRegion="polite" style={type.body}>Точка не найдена. Проверьте город или адрес.</Text>}
    {!query && points.length > 3 && <Pressable accessibilityRole="button" onPress={() => setAll(value => !value)} style={s.show}><Text style={[type.label, { color: colors.brand }]}>{all ? 'Свернуть' : 'Показать все'} · {points.length}</Text><ChevronDown strokeWidth={1.8} color={colors.brand} size={18} aria-hidden style={{ transform: [{ rotate: all ? '180deg' : '0deg' }] }} /></Pressable>}
    {!!error && <Text accessibilityRole="alert" style={[type.body, { color: colors.accent }]}>{error}</Text>}
  </View>;
}
const s = StyleSheet.create({
  search: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.white, paddingLeft: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, input: { flex: 1, minWidth: 0, minHeight: 52, paddingRight: 12 },
  chip: { minHeight: 48, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 24, backgroundColor: colors.pale },
  card: { borderRadius: 16, padding: 16, backgroundColor: colors.white, gap: 8 }, trigger: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12 },
  details: { minHeight: 48, justifyContent: 'center' }, row: { flexDirection: 'row', gap: 10 }, actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { minHeight: 48, flex: 1, flexBasis: 110, flexDirection: 'row', gap: 8, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: colors.pale }, show: { minHeight: 52, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
});
