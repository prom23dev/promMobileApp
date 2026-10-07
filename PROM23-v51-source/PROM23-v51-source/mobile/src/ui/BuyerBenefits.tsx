import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowUpRight, Truck, UserRound, Headphones, ShieldCheck, CreditCard } from 'lucide-react-native';
import { colors, layout, type } from './theme';
import { Reveal } from './Reveal';
const benefits = [
  { id: 'delivery', Icon: Truck, label: 'Получить удобно', title: 'До двери, в ПВЗ или самовывозом', text: 'Способ получения подбирается под ваш адрес, вес и размеры оборудования.', action: 'Выбрать доставку', route: '/information/delivery' },
  { id: 'support', Icon: Headphones, label: 'Помощь в выборе', title: 'Можно не разбираться в артикулах', text: 'Расскажите о задаче. Поможем подобрать размер, высоту и комплектацию оборудования.', action: 'Связаться с магазином', route: '/information/contacts' },
  { id: 'service', Icon: ShieldCheck, label: 'После покупки', title: 'Сервис и обращения в одном месте', text: 'Условия гарантии, возврат и помощь с приобретённым товаром доступны из приложения.', action: 'Гарантия и возврат', route: '/pages/returns' },
  { id: 'account', Icon: UserRound, label: 'Мои покупки', title: 'Возвращайтесь к нужному быстрее', text: 'Сохраняйте избранное и сравнивайте товары. В кабинете магазина — история заказов, адреса, обращения и документы.', action: 'Возможности кабинета', route: '/account' },
] as const;
export function BuyerBenefits() {
  const router = useRouter(); const [selected, setSelected] = useState<typeof benefits[number]['id']>('delivery');
  const current = benefits.find(item => item.id === selected)!;
  return <View testID="home-buyer-benefits" style={{ gap: 12 }}>
    <Text accessibilityRole="header" aria-level={2} style={type.heading}>Покупать проще, когда всё рядом</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{benefits.map(item => <Pressable key={item.id} accessibilityRole="tab" accessibilityState={{ selected: selected === item.id }} aria-selected={selected === item.id} onPress={() => setSelected(item.id)} style={({ pressed }) => ({ flexBasis: '47%', flexGrow: 1, minHeight: 72, padding: 12, gap: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: selected === item.id ? colors.pale : colors.background, borderRadius: 14, opacity: pressed ? 0.7 : 1 })}><item.Icon size={22} color={selected === item.id ? colors.accent : colors.brand} /><Text style={[type.label, { flex: 1 }]}>{item.label}</Text></Pressable>)}</View>
    <Reveal key={current.id}><View style={{ gap: 7, paddingVertical: 8 }}><Text style={type.subheading}>{current.title}</Text><Text style={[type.body, { color: colors.muted }]}>{current.text}</Text><Pressable accessibilityRole="button" onPress={() => router.push(current.route)} style={[layout.row, { gap: 6, minHeight: 44 }]}><Text style={[type.label, { color: colors.brand }]}>{current.action}</Text><ArrowUpRight size={17} color={colors.accent} /></Pressable></View></Reveal>
    <Pressable accessibilityRole="button" onPress={() => router.push('/information/payment')} style={[layout.row, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8, gap: 10, minHeight: 48 }]}><CreditCard size={18} color={colors.brand} /><Text style={[type.caption, { flex: 1 }]}>Карта, СБП, Сплит и баллы Плюса · способы оплаты</Text><ArrowUpRight size={17} color={colors.brand} /></Pressable>
  </View>;
}
