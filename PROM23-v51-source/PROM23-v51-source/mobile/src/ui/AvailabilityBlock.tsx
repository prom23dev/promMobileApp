import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PackageCheck, ChevronDown } from 'lucide-react-native';
import { localRequest } from '../api/local';
import { parseAvailability, type Availability } from '../availability-domain';
import { useShop } from '../store';
import { settlementLabel } from '../location-domain';
import { colors, layout, type } from './theme';
export function AvailabilityBlock({ productId, unit }: { productId: string; unit: string }) {
  const { location, state } = useShop(); const router = useRouter();
  const [data, setData] = useState<Availability | null>(null); const [expanded, setExpanded] = useState(false);
  const [revision, retry] = useState(0); const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const id = location?.settlement?.id; const version = location?.version;
  useEffect(() => {
    const controller = new AbortController(); let active = true; let expiry: ReturnType<typeof setTimeout> | undefined;
    setData(null); setPhase('loading');
    if (!id || version === undefined) { setPhase('ready'); return () => { active = false; }; }
    const expected = { productId, settlementId: id, locationVersion: version, buyerContext: state.context === 'personal' ? 'personal' as const : 'organization' as const };
    void localRequest(`/v1/products/${encodeURIComponent(productId)}/availability`, { signal: controller.signal }).then(value => {
      if (!active) return;
      const result = parseAvailability(value, expected); setData(result); setPhase('ready');
      if (result.expiresAt) expiry = setTimeout(() => { setData(null); setPhase('error'); }, Math.max(1, Math.min(2_147_483_647, Date.parse(result.expiresAt) - Date.now())));
    }).catch(() => { if (active) setPhase('error'); });
    return () => { active = false; controller.abort(); clearTimeout(expiry); };
  }, [productId, id, version, state.context, revision]);
  return <View testID="product-availability" style={{ gap: 5 }}>
    <View style={[layout.row, { gap: 7 }]}><PackageCheck size={18} color={data?.status === 'in-stock' ? colors.success : colors.brand} /><Text style={[type.label, { flex: 1 }]}>{phase === 'loading' ? 'Уточняем наличие…' : data?.status === 'in-stock' ? `На складах: ${data.totalQuantity} ${unit}` : data?.status === 'out-of-stock' ? 'Сейчас нет на складах' : 'Наличие уточняется'}</Text></View>
    {!!data?.warehouses.length && <><Pressable accessibilityRole="button" accessibilityState={{ expanded }} aria-expanded={expanded} onPress={() => setExpanded(v => !v)} style={[layout.between, { minHeight: 44 }]}><Text style={type.caption}>Склады для {settlementLabel(location?.settlement)}</Text><ChevronDown size={18} color={colors.brand} /></Pressable>{expanded && data.warehouses.map(w => <View key={w.id} style={layout.between}><Text style={[type.caption, { flex: 1 }]}>{w.name || `Склад ${w.id}`}</Text><Text style={type.label}>{w.quantity === null ? 'Уточняется' : `${w.quantity} ${unit}`}</Text></View>)}<Text style={type.caption}>Остаток на складе. Доступность отгрузки и самовывоза подтвердит магазин.</Text></>}
    {phase !== 'loading' && (!data || data.status === 'unknown') && <Pressable accessibilityRole="button" onPress={() => router.push('/information/contacts')} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={[type.caption, { color: colors.brand }]}>Уточнить склад и готовность к отгрузке →</Text></Pressable>}
    {phase === 'error' && <Pressable accessibilityRole="button" onPress={() => retry(n => n + 1)} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={[type.caption, { color: colors.brand }]}>Не удалось обновить · Повторить</Text></Pressable>}
  </View>;
}
