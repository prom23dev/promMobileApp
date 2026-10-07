import { BuyerContextSwitch } from './BuyerContextSwitch';
import React, { useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell, Building2, Check, ChevronDown, MapPin, Phone, Search, Menu, X, WifiOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useShop } from '../store';
import { colors, layout, type } from './theme';
import { Sheet } from './Sheet';
import { LocationPicker } from './LocationPicker';
import { settlementLabel } from '../location-domain';
import { BrandLogo } from './BrandLogo';
import { supportPhone, supportPhoneLabel } from '../content/siteContent';

export function Button({ label, onPress, icon, variant = 'primary', disabled = false, style }: {
  label: string; onPress: () => void; icon?: ReactNode; variant?: 'primary' | 'secondary' | 'quiet'; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} aria-disabled={disabled} disabled={disabled}
    onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [s.button, variant === 'primary' ? s.primary : variant === 'secondary' ? s.secondary : s.quiet, focused && s.focus, pressed && { opacity: 0.72 }, disabled && { opacity: 0.5 }, style]}>
    {icon}<Text style={[type.label, variant === 'primary' && { color: colors.white }, { textAlign: 'center', flexShrink: 1 }]}>{label}</Text>
  </Pressable>;
}

export function IconButton({ label, onPress, children, selected, disabled = false }: {
  label: string; onPress: () => void; children: ReactNode; selected?: boolean; disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
    accessibilityState={{ selected, disabled }} aria-selected={selected} aria-disabled={disabled} disabled={disabled} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [s.iconButton, focused && s.focus, pressed && { backgroundColor: colors.pale }, disabled && { opacity: 0.4 }]}>{children}</Pressable>;
}

export function DemoNote() {
  return null;
}

export { Sheet } from './Sheet';


export function CallButton({ labelled = false }: { labelled?: boolean }) {
  const [error, setError] = useState(false);
  return <>{labelled ? <Pressable accessibilityRole="button" accessibilityLabel={'Позвонить · ' + supportPhoneLabel} onPress={() => { void Linking.openURL('tel:' + supportPhone).catch(() => setError(true)); }} style={({ pressed }) => ({ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, borderRadius: 12, backgroundColor: colors.background, opacity: pressed ? 0.7 : 1 })}><Phone size={18} color={colors.accent} /><Text style={[type.caption, { color: colors.ink, fontWeight: '600' }]}>Позвонить</Text></Pressable> : <IconButton label={'Позвонить · ' + supportPhoneLabel} onPress={() => { void Linking.openURL('tel:' + supportPhone).catch(() => setError(true)); }}><Phone size={22} color={colors.accent} /></IconButton>}<Sheet visible={error} onClose={() => setError(false)} title="Связаться с магазином"><Text selectable style={type.heading}>{supportPhoneLabel}</Text><Text style={type.body}>Наберите этот номер в приложении телефона.</Text><Button label="Закрыть" variant="secondary" onPress={() => setError(false)} /></Sheet></>;
}

export function MenuButton() {
  const router = useRouter();
  return <IconButton label="Открыть меню" onPress={() => router.push('/more')}><Menu size={22} color={colors.brand} /></IconButton>;
}

export function ShopHeader({ children, back = false }: { children?: ReactNode; back?: boolean; compact?: boolean }) {
  const router = useRouter(); const { location } = useShop();
  const [cityOpen, setCityOpen] = useState(false); const [query, setQuery] = useState('');
  const { width } = useWindowDimensions();
  const search = () => router.push({ pathname: '/catalog', params: query.trim() ? { q: query.trim() } : { search: '1' } });
  const city = <Pressable accessibilityRole="button" accessibilityLabel={'Населённый пункт: ' + settlementLabel(location?.settlement) + '. Изменить'} onPress={() => setCityOpen(true)} testID="header-city" style={[s.city, { maxWidth: '42%', flexShrink: 0, paddingRight: 4 }]}><MapPin style={{ flexShrink: 0 }} size={15} color={colors.accent} /><Text numberOfLines={2} style={[type.caption, { color: colors.ink, flexShrink: 1, minWidth: 0, fontSize: 13, lineHeight: 17, fontWeight: '600' }]}>{location?.settlement ? settlementLabel(location.settlement) : 'Город'}</Text><ChevronDown style={{ flexShrink: 0 }} size={12} color={colors.muted} /></Pressable>;
  return <View testID="shop-header" style={s.header}><View style={[layout.content, { paddingHorizontal: 12, paddingBottom: 10, gap: 8 }]}>
    <View style={[layout.between, { minHeight: 48, gap: 2 }]}><MenuButton />
      <Pressable accessibilityRole="button" accessibilityLabel="Промышленник — на главную" onPress={() => router.navigate('/')} style={{ minHeight: 44, justifyContent: 'center', flex: 1, minWidth: 0 }}><BrandLogo compact small narrow={width < 390} tight={width < 360} /></Pressable><IconButton label="Уведомления" onPress={() => router.push('/notifications')}><Bell size={22} color={colors.brand} /></IconButton><CallButton /></View>
    <View testID="city-search-row" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>{city}<View style={{ flex: 1, minWidth: 0 }}>{children ?? <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 50, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, borderRadius: 12 }}><IconButton label="Найти товары" onPress={search}><Search size={23} color={colors.accent} /></IconButton><TextInput accessibilityLabel="Поиск по названию, бренду или артикулу" placeholder={width < 390 ? "Поиск" : width < 600 ? "Поиск товаров" : "Найти товар или артикул"} placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} onSubmitEditing={search} maxLength={100} returnKeyType="search" autoCorrect={false} style={{ flex: 1, minWidth: 0, paddingVertical: 12, paddingRight: 12, fontSize: 16, color: colors.ink }} /></View>}</View></View>
    {back && <Pressable accessibilityRole="button" accessibilityLabel="Назад" onPress={() => router.canGoBack() ? router.back() : router.replace('/catalog')} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}><ArrowLeft size={20} color={colors.brand}/><Text style={type.caption}>Назад</Text></Pressable>}
  </View><LocationPicker visible={cityOpen} onClose={() => setCityOpen(false)} /></View>;
}

export function Header({ title, back = false, brand = false, heading = true, children }: { heading?: boolean; title?: string; back?: boolean; brand?: boolean; search?: boolean; showCall?: boolean; children?: ReactNode }) {
  const router = useRouter();
  return <View style={s.header}><ShopHeader />{(title || back || children) && <View style={[layout.content, layout.between, { paddingHorizontal: 16, paddingVertical: 8, minHeight: 52, gap: 8 }]}>
    {back && <IconButton label="Назад" onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><ArrowLeft color={colors.ink} size={22} /></IconButton>}
    {!brand && <Text accessibilityRole={heading ? 'header' : undefined} aria-level={heading ? 1 : undefined} numberOfLines={2} style={[type.heading, { flex: 1, minWidth: 0, fontSize: 20, lineHeight: 26 }]}>{title}</Text>}{children}
  </View>}</View>;
}

export const ContextSwitch = BuyerContextSwitch;

export function ConnectionState() {
  const { ready, error, retry } = useShop();
  if (ready) return null;
  return error ? <EmptyState icon={<WifiOff size={30} color={colors.brand} />} title="Не удалось загрузить магазин" message={error} action={<Button label="Повторить подключение" onPress={retry} />} /> :
    <View style={s.empty}><ActivityIndicator size="large" color={colors.brand} /><Text accessibilityLiveRegion="polite" style={type.body}>Загружаем каталог…</Text></View>;
}

export function ShopError() {
  const { ready, error, clearError } = useShop();
  if (!ready || !error) return null;
  return <View accessibilityRole="alert" style={[layout.card, { margin: 16, borderWidth: 1, borderColor: colors.accent }]}>
    <Text style={type.label}>Изменения не сохранены</Text><Text style={type.body}>{error}</Text><Button label="Закрыть" variant="secondary" onPress={clearError} />
  </View>;
}

export function EmptyState({ title, message, icon, action }: { title: string; message: string; icon: ReactNode; action?: ReactNode }) {
  return <View style={s.empty}><View style={s.emptyIcon}>{icon}</View><Text style={[type.heading, { textAlign: 'center' }]}>{title}</Text><Text style={[type.body, { color: colors.muted, textAlign: 'center', maxWidth: 360 }]}>{message}</Text>{action}</View>;
}

const s = StyleSheet.create({
  button: { minHeight: 48, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 2, borderColor: 'transparent' },
  primary: { backgroundColor: colors.accent }, secondary: { backgroundColor: colors.pale }, quiet: { backgroundColor: 'transparent' }, focus: { borderColor: colors.orange },
  iconButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  demo: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 }, demoDot: { width: 5, height: 5, borderRadius: 5, backgroundColor: colors.accent }, demoText: { fontSize: 11, lineHeight: 16, color: colors.muted },
  scrim: { flex: 1, backgroundColor: 'rgba(20, 27, 50, 0.4)', justifyContent: 'flex-end' }, sheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, width: '100%', maxWidth: 650, alignSelf: 'center', maxHeight: '88%' },
  option: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  header: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.line },
  city: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  input: { minHeight: 50, padding: 12, fontSize: 16, color: colors.ink, backgroundColor: colors.background, borderRadius: 10, borderWidth: 1, borderColor: colors.line },
  context: { flexDirection: 'row', padding: 4, backgroundColor: colors.pale, borderRadius: 14, gap: 4 }, segment: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, borderRadius: 10 }, segmentActive: { backgroundColor: colors.white },
  empty: { paddingHorizontal: 24, paddingVertical: 48, alignItems: 'center', gap: 16 }, emptyIcon: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
});
