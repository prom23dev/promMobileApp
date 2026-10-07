import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check } from 'lucide-react-native';
import type { Product } from '../domain';
import { colors, layout, type } from '../ui/theme';
import { Button, Sheet } from '../ui/primitives';
import { readableSpecLabel } from '../ui/product-data';
export const sortOptions = [{ value: 'default', label: 'По порядку в каталоге' }, { value: 'price-asc', label: 'Сначала дешевле' }, { value: 'price-desc', label: 'Сначала дороже' }] as const;
export type Sort = (typeof sortOptions)[number]['value'];
export type Filters = { min: string; max: string; brand: string; technical: string; technicalLabel: string; sort: Sort };
export const initialFilters: Filters = { min: '', max: '', brand: '', technical: '', technicalLabel: '', sort: 'default' };
export const valuesOf = (items: Product[], label: string) => [...new Set(items.flatMap(p => p.specs.filter(s => s.label === label).map(s => s.value)))].sort((a, b) => a.localeCompare(b, 'ru'));
function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} aria-selected={selected} onPress={onPress} style={[s.chip, selected && s.activeChip]}><Text style={[type.label, selected && { color: colors.white }]}>{label}</Text></Pressable>;
}

export function CatalogFilterSheet({visible,onClose,onApply,value,label,brands=[],technicalLabel='',technicalValues=[]}:{visible:boolean;onClose:()=>void;onApply:(filters:Filters)=>void;value:Filters;label?:string;brands?:string[];technicalLabel?:string;technicalValues?:string[]}) {
 const [draft,setDraft]=useState(value);
 useEffect(()=>{if(visible)setDraft(value);},[visible,value]);
 const invalidPrice=!!draft.min&&!!draft.max&&Number(draft.min)>Number(draft.max);
 return (    <Sheet visible={visible} onClose={onClose} title="Фильтры и сортировка">
      {label && <Text style={type.caption}>{label}</Text>}
      <Text style={type.subheading}>Цена, ₽</Text><View style={[layout.row, { gap: 10 }]}><TextInput value={draft.min} onChangeText={min => setDraft({ ...draft, min: min.replace(/\D/g, '').slice(0, 9) })} accessibilityLabel="Цена от, рублей" placeholder="От" placeholderTextColor={colors.muted} keyboardType="number-pad" style={s.priceInput} /><TextInput value={draft.max} onChangeText={max => setDraft({ ...draft, max: max.replace(/\D/g, '').slice(0, 9) })} accessibilityLabel="Цена до, рублей" placeholder="До" placeholderTextColor={colors.muted} keyboardType="number-pad" style={s.priceInput} /></View>
      {invalidPrice && <Text accessibilityRole="alert" style={[type.caption, { color: colors.accent }]}>Цена «от» должна быть меньше или равна цене «до».</Text>}
      {brands.length > 1 && <><Text style={type.subheading}>Производитель</Text><View style={s.choices}><Choice label="Любой" selected={!draft.brand} onPress={() => setDraft({ ...draft, brand: '' })} />{brands.map(brand => <Choice key={brand} label={brand} selected={draft.brand === brand} onPress={() => setDraft({ ...draft, brand })} />)}</View></>}
      {technicalValues.length > 1 && <><Text style={type.subheading}>{readableSpecLabel(technicalLabel)}</Text><View style={s.choices}><Choice label="Любой" selected={!draft.technical} onPress={() => setDraft({ ...draft, technical: '', technicalLabel: '' })} />{technicalValues.map(technical => <Choice key={technical} label={technical} selected={draft.technical === technical} onPress={() => setDraft({ ...draft, technical, technicalLabel })} />)}</View></>}
      <Text style={type.subheading}>Порядок товаров</Text>{sortOptions.map(item => <Pressable key={item.value} accessibilityRole="radio" accessibilityState={{ checked: draft.sort === item.value }} aria-checked={draft.sort === item.value} onPress={() => setDraft({ ...draft, sort: item.value })} style={s.sortOption}><Text style={[type.body, { flex: 1 }]}>{item.label}</Text>{draft.sort === item.value && <Check size={22} color={colors.accent} />}</Pressable>)}
      <Button label="Показать товары" disabled={invalidPrice} onPress={() => onApply(draft)} /><Button label="Сбросить фильтры" variant="secondary" onPress={() => setDraft(initialFilters)} />
    </Sheet>);
}
const s = StyleSheet.create({chip:{ paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, justifyContent: 'center', borderRadius: 11, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },activeChip:{ backgroundColor: colors.brand, borderColor: colors.brand },choices:{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 },priceInput:{ flex: 1, minWidth: 0, minHeight: 52, fontSize: 16, color: colors.ink, paddingHorizontal: 13, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, borderRadius: 10 },sortOption:{ minHeight: 52, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line }});
