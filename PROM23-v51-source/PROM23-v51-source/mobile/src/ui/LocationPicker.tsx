import { legalCopy } from '../content/legalCopy';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, ChevronRight, MapPin, Search } from 'lucide-react-native';
import { Sheet } from './Sheet';
import { colors, type } from './theme';
import { useShop } from '../store';
import { suggestLocations } from '../api/location';
import { settlementLabel, type Settlement } from '../location-domain';

export function LocationPicker({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { location, selectLocation } = useShop();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => { if (visible) { setQuery(''); setError(null); } }, [visible]);
  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController(); let active = true;
    setLoading(true); setItems([]); setError(null);
    const timer = setTimeout(() => { void suggestLocations(query, controller.signal).then(result => { if (active) setItems(result.items); }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Поиск временно недоступен'); }).finally(() => { if (active) setLoading(false); }); }, query ? 250 : 0);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [query, visible, revision]);
  async function choose(item: Settlement) {
    if (saving) return;
    setSaving(item.id); setError(null);
    try { await selectLocation(item.id); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Не удалось сохранить населённый пункт'); }
    finally { setSaving(null); }
  }
  const recent = query.trim() ? [] : location?.recent ?? [];
  const rows = [...recent, ...items.filter(item => !recent.some(old => old.id === item.id))];
  return <Sheet visible={visible} onClose={() => { if (!saving) onClose(); }} title="Куда доставить заказ?">
    <Text style={type.body}>Выберите город, станицу, село или другой населённый пункт. Точный адрес указывается при оформлении.</Text>
    <View style={s.search}><Search size={20} color={colors.brand} /><TextInput accessibilityLabel="Поиск населённого пункта" placeholder="Например, Краснодар или Динская" value={query} onChangeText={setQuery} maxLength={120} autoCorrect={false} autoCapitalize="words" editable={!saving} style={[type.body, { flex: 1, minHeight: 48 }]} returnKeyType="search" /></View>
    <Text style={type.caption}>{legalCopy.address}</Text>
    <Text style={type.caption}>Выберите подходящий вариант из списка: названия могут повторяться в разных районах.</Text>
    {loading && <ActivityIndicator accessibilityLabel="Ищем населённые пункты" color={colors.brand} />}
    {error && <View style={{ gap: 6 }}><Text accessibilityRole="alert" style={[type.body, { color: colors.accent }]}>{error}</Text><Pressable accessibilityRole="button" onPress={() => setRevision(n => n + 1)} style={s.retry}><Text style={type.label}>Повторить поиск</Text></Pressable></View>}
    {!!recent.length && <Text style={type.label}>Вы выбирали ранее</Text>}
    {rows.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.fullName} disabled={!!saving} onPress={() => { void choose(item); }} style={({ pressed }) => [s.option, pressed && { backgroundColor: colors.pale }]}>
      <MapPin size={20} color={colors.brand} /><View style={{ flex: 1, gap: 4 }}><Text style={type.label}>{settlementLabel(item)}</Text><Text style={type.caption}>{item.fullName}</Text></View>
      {saving === item.id ? <ActivityIndicator color={colors.brand} /> : location?.settlement?.id === item.id ? <Check size={20} color={colors.accent} /> : <ChevronRight size={18} color={colors.muted} />}
    </Pressable>)}
    {!loading && !error && !rows.length && <Text accessibilityLiveRegion="polite" style={type.body}>Ничего не найдено. Проверьте написание или добавьте район и регион.</Text>}
  </Sheet>;
}
const s = StyleSheet.create({ search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, borderRadius: 12 }, option: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }, retry: { minHeight: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.pale, borderRadius: 12 } });
