import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowUpRight, Headphones, Phone } from 'lucide-react-native';
import { useShop } from '../store';
import { supportPhone, supportPhoneLabel } from '../content/siteContent';
import { Button, Sheet } from './primitives';
import { colors, layout, type } from './theme';
import { palette } from './tokens';

export function AssistedPurchase({ productId, compact = false, title = 'Поможем выбрать под вашу задачу' }: { productId?: string; compact?: boolean; title?: string }) {
  const router = useRouter(); const { state } = useShop();
  const [open, setOpen] = useState(false); const [error, setError] = useState('');
  const form = (id: string) => { setOpen(false); router.push({ pathname: '/forms/[id]', params: { id, ...(productId ? { productId } : {}), expectedContext: state.context } }); };
  return <><Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => setOpen(true)} style={({ pressed }) => [{ padding: compact ? 12 : 18, backgroundColor: palette.cyan100, borderRadius: 16, gap: 12, opacity: pressed ? 0.75 : 1 }]}><View style={[layout.row, { gap: 12 }]}><Headphones size={compact ? 22 : 28} color={palette.cyan700} /><View style={{ flex: 1, gap: 4 }}><Text style={type.subheading}>{title}</Text>{!compact && <Text style={type.caption}>Подбор комплектации, расчёт поставки и доставка на объект</Text>}</View><ArrowUpRight size={20} color={palette.cyan700} /></View>{!compact && <Text style={[type.label, { color: palette.cyan700 }]}>Обсудить с менеджером</Text>}</Pressable>
    <Sheet visible={open} onClose={() => setOpen(false)} title="Помощь с покупкой"><Text style={type.body}>{productId ? 'Уточним характеристики и комплектацию этого товара, поможем с доставкой.' : 'Расскажите, какое оборудование нужно и для каких работ. Поможем с выбором и условиями поставки.'}</Text><Button label={'Позвонить · ' + supportPhoneLabel} icon={<Phone size={18} color={colors.white} />} onPress={() => { void Linking.openURL('tel:' + supportPhone).catch(() => setError('Наберите ' + supportPhoneLabel + ' в приложении телефона.')); }} /><Button label="Заказать обратный звонок" variant="secondary" onPress={() => form('callback')} /><Button label={state.context === 'personal' ? 'Запросить подбор и стоимость' : 'Получить коммерческое предложение'} variant="secondary" onPress={() => form('quote')} />{error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}<Text style={type.caption}>Вы сами выбираете удобный способ связи.</Text></Sheet>
  </>;
}
