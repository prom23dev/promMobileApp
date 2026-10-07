import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Check } from 'lucide-react-native';
import { useShop } from '../store';
import { CategoryPictogram } from './CategoryPictogram';
import { Button } from './primitives';
import { Reveal } from './Reveal';
import { colors, layout, type } from './theme';

const tasks = [
  { id: 'height', title: 'Работа на высоте', icon: 'Леса', text: 'Леса для фасада, мобильная вышка или стремянка для небольших работ.', categories: ['Леса', 'Вышки-туры', 'Лестницы и стремянки'] },
  { id: 'concrete', title: 'Бетонные работы', icon: 'Оборудование для бетонных работ', text: 'Оборудование для приготовления, подачи, уплотнения и обработки бетона.', categories: ['Оборудование для бетонных работ', 'Вибротехника для строительства', 'Опалубка'] },
  { id: 'rebar', title: 'Работа с арматурой', icon: 'Оборудование для работы с арматурой', text: 'Подберите станок для резки или гибки под диаметр арматуры и объём работ.', categories: ['Оборудование для работы с арматурой'] },
  { id: 'cover', title: 'Укрытие и защита', icon: 'Сетка, тенты, брезенты', text: 'Тенты, плёнка и защитные сетки для материалов и строительной площадки.', categories: ['Сетка, тенты, брезенты'] },
];
export function TaskGuide({ home = false }: { home?: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter(); const { catalogTree, state } = useShop();
  const task = tasks.find(item => item.id === selected);
  return <View testID="home-guide" style={{ gap: 14 }}>
    <View style={{ gap: 4 }}><Text accessibilityRole="header" aria-level={2} style={type.heading}>{home ? 'Подбор по виду работ' : 'Что планируете делать?'}</Text><Text style={type.body}>Начните с работ — покажем нужные разделы.</Text></View>
    <ScrollView horizontal={home} showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', flexWrap: home ? 'nowrap' : 'wrap', gap: 8 }}>{tasks.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: selected === item.id, expanded: selected === item.id }} aria-selected={selected === item.id} aria-expanded={selected === item.id} onPress={() => setSelected(selected === item.id ? null : item.id)} style={({ pressed }) => ({ flexBasis: home ? undefined : '46%', flexGrow: home ? undefined : 1, width: home ? 148 : undefined, borderWidth: 1.5, borderColor: selected === item.id ? colors.brand : colors.line, borderRadius: 14, backgroundColor: selected === item.id ? colors.pale : colors.white, padding: 12, gap: 10, opacity: pressed ? 0.75 : 1 })}><View style={layout.between}><CategoryPictogram name={item.icon} size={30} />{selected === item.id && <Check size={18} color={colors.brand} />}</View><Text style={type.label}>{item.title}</Text></Pressable>)}</ScrollView>
    {task && <Reveal key={task.id}><View style={[layout.card, { borderLeftWidth: 3, borderLeftColor: colors.accent }]}><Text style={type.body}>{task.text}</Text>{task.categories.map(name => { const section = catalogTree.sections.find(item => item.name === name); return section ? <Pressable key={name} accessibilityRole="button" onPress={() => router.push({ pathname: '/catalog', params: { section: section.id } })} style={[layout.between, { minHeight: 44, gap: 8 }]}><Text style={[type.label, { flex: 1, color: colors.brand }]}>{name}</Text><ArrowRight size={18} color={colors.brand} /></Pressable> : null; })}<Button variant="secondary" label="Помочь с выбором комплектации" onPress={() => router.push({ pathname: '/forms/[id]', params: { id: 'quote', expectedContext: state.context, purchaseTask: task.id } })} /><Text style={type.caption}>Менеджер уточнит размеры, нагрузку и объём работ.</Text></View></Reveal>}
  </View>;
}
