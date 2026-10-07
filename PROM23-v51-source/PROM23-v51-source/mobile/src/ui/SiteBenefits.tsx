import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, FileCheck2, PackageCheck, Truck, Check } from 'lucide-react-native';
import { useShop } from '../store';
import { Button } from './primitives';
import { TaskGuide } from './TaskGuide';
import { HomeServices } from './HomeServices';
import { colors, layout, type } from './theme';
import { Reveal } from './Reveal';

export function HomeBenefits() {
  return <View style={{ gap: 36, paddingTop: 16 }}><BusinessBenefit /><TaskGuide /><HomeServices /></View>;
}
export function BusinessBenefit({ compact = false }: { compact?: boolean }) {
  const router = useRouter(); const { state } = useShop(); const { fontScale } = useWindowDimensions();
  const [hasList, setHasList] = useState(true); const [processOpen, setProcessOpen] = useState(false);
  return <View testID="home-business" style={{ gap: 14 }}>
    <View style={{ gap: 9 }}><Text style={s.eyebrow}>СНАБЖЕНИЕ БИЗНЕСА</Text><Text accessibilityRole="header" aria-level={2} style={s.heading}>Закупка для вашего объекта</Text><Text style={[type.body, { color: colors.muted }]}>Подберём оборудование по спецификации. Согласуем цену, документы и доставку на объект.</Text></View>

    <View style={{ gap: 12, padding: 16, backgroundColor: colors.ink, borderRadius: 18 }}>
        <View style={{ flexDirection: fontScale > 1.5 ? 'column' : 'row', gap: 8 }}>{[{ value: true, label: 'Есть список' }, { value: false, label: 'Нужен подбор' }].map(item => <Pressable key={item.label} accessibilityRole="radio" accessibilityState={{ checked: hasList === item.value }} aria-checked={hasList === item.value} onPress={() => setHasList(item.value)} style={({ pressed }) => ({ flex: 1, minHeight: 48, borderRadius: 10, padding: 10, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 6, backgroundColor: hasList === item.value ? colors.white : colors.brand, opacity: pressed ? 0.8 : 1 })}>{hasList === item.value && <Check size={16} color={colors.brand} />}<Text style={[type.label, { color: hasList === item.value ? colors.ink : colors.white }]}>{item.label}</Text></Pressable>)}</View>
      <Reveal key={String(hasList)}><Text style={[type.body, { color: '#E2E6F2' }]}>{hasList ? 'Прикрепите смету, спецификацию, чертёж или фото. Артикулы знать не обязательно.' : 'Расскажите об объекте и работах. Менеджер поможет подобрать комплектацию.'}</Text></Reveal>
      <Button label={hasList ? 'Прикрепить потребность' : 'Запросить подбор'} onPress={() => router.push({ pathname: '/procurement', params: { mode: hasList ? 'list' : 'selection' } })} />
    </View>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: processOpen }} aria-expanded={processOpen} onPress={() => setProcessOpen(!processOpen)} style={[layout.between, { minHeight: 48, borderBottomWidth: 1, borderBottomColor: colors.line }]}><Text style={type.label}>Как проходит поставка</Text><ArrowRight size={18} color={colors.brand} style={{ transform: [{ rotate: processOpen ? '-90deg' : '90deg' }] }} /></Pressable>
    {processOpen && <Reveal><View style={{ gap: 0 }}>{[
      { Icon: PackageCheck, title: 'Комплектация по спецификации', text: 'Состав, наличие и изготовление по вашему ТЗ.' },
      { Icon: Truck, title: 'Поставка под ваш объект', text: 'Адрес, габариты, срок и условия разгрузки.' },
      { Icon: FileCheck2, title: 'Счёт и документы', text: 'НДС, закрывающие документы и ЭДО.' },
    ].map(({ Icon, title, text }, index) => <View key={title} style={[layout.row, s.benefit]}><View style={s.number}><Text style={[type.label, { color: colors.brand }]}>{index + 1}</Text></View><View style={{ flex: 1, gap: 3 }}><Text style={type.label}>{title}</Text><Text style={type.caption}>{text}</Text></View><Icon size={20} color={colors.brand} /></View>)}</View></Reveal>}
    <Pressable accessibilityRole="button" accessibilityLabel="Условия поставок для бизнеса" onPress={() => router.push('/information/business')} style={[layout.between, { minHeight: 48 }]}><Text style={[type.label, { color: colors.brand }]}>Все возможности для бизнеса</Text><ArrowRight size={19} color={colors.accent} /></Pressable>
  </View>;
}
const s = StyleSheet.create({
  eyebrow: { fontSize: 11, lineHeight: 17, color: colors.accent, fontWeight: '700', letterSpacing: 1.2 },
  heading: { color: colors.ink, fontSize: 23, lineHeight: 29, fontWeight: '700', letterSpacing: -0.7 },
  benefit: { gap: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line, alignItems: 'flex-start' },
  number: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
});
export { DeliveryBenefit, PaymentBenefit } from './CommerceBenefits';
