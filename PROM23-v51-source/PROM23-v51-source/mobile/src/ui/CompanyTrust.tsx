import React, { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowUpRight, Award, ChevronDown, Factory, Globe2, History } from 'lucide-react-native';
import { companyAwards, companyHistory } from '../content/companyContent';
import { Button } from './primitives';
import { Reveal } from './Reveal';
import { colors, layout, type } from './theme';
import { spacing } from './tokens';

export function CompanyDisclosure({ title, children, initialOpen = false }: { title: string; children: ReactNode; initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [focused, setFocused] = useState(false);
  return <View style={s.disclosure}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} aria-expanded={open}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      onPress={() => setOpen(!open)} style={({ pressed }) => [s.disclosureButton, focused && s.focus, pressed && s.pressed]}>
      <Text style={[type.subheading, { flex: 1 }]}>{title}</Text><ChevronDown color={colors.brand} size={20} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
    </Pressable>
    {open && <Reveal><View style={s.disclosureBody}>{children}</View></Reveal>}
  </View>;
}

const facts = [
  { title: 'На рынке с 2008', caption: 'История компании', icon: History, route: '/pages/about' },
  { title: 'Своё производство', caption: 'Краснодарский край', icon: Factory, route: '/information/production' },
  { title: '«Экспортер года»', caption: 'Награды компании', icon: Award, route: '/pages/awards' },
  { title: 'Экспорт продукции', caption: 'СНГ, Азия, Африка', icon: Globe2, route: '/pages/about' },
] as const;

/** Shared company evidence for personal and business purchases. No account requirement. */
export function CompanyTrust({ variant = 'compact' }: { variant?: 'compact' | 'expanded' }) {
  const router = useRouter();
  const expanded = variant === 'expanded';
  return <View testID={'company-trust-' + variant} style={s.section}>
    <View style={s.titleBlock}>
      <Text style={s.eyebrow}>ГРУППА КОМПАНИЙ «ПРОМЫШЛЕННИК»</Text>
      <Text accessibilityRole="header" aria-level={2} style={type.heading}>Компания с историей.{ '\n' }Собственное производство.</Text>
    </View>
    <View style={s.facts}>
      {facts.map(fact => <TrustFact key={fact.title} fact={fact} onPress={() => router.push(fact.route as Href)} />)}
    </View>
    {expanded && <>
      <Text style={type.body}>ООО «ТЕАМ ИНДАСТРИ» выпускает строительное оборудование под марками «Промышленник» и TeaM. Продукция компании поставляется в страны СНГ, Азии и Африки.</Text>
      <View>
        <CompanyDisclosure title="История: от первых складов к производству">
          {companyHistory.map((item, index) => <View key={item.year} style={s.timelineRow}>
            <View style={s.yearColumn}><Text style={s.year}>{item.year}</Text>{index < companyHistory.length - 1 && <View style={s.timelineLine} />}</View>
            <View style={s.timelineCopy}><Text style={type.subheading}>{item.title}</Text><Text style={type.body}>{item.text}</Text></View>
          </View>)}
          <Button label="Вся история компании" variant="quiet" icon={<ArrowUpRight size={18} color={colors.brand} />} onPress={() => router.push('/pages/about')} />
        </CompanyDisclosure>
        <CompanyDisclosure title="Награды за развитие и экспорт">
          {companyAwards.map(award => <View key={award.title} style={s.awardRow}><Award size={23} color={colors.accent} /><View style={{ flex: 1, gap: 3 }}><Text style={[type.subheading, { color: colors.brand }]}>{award.place}</Text><Text style={type.body}>{award.title}</Text></View></View>)}
          <Button label="Реестр наград" variant="quiet" icon={<ArrowUpRight size={18} color={colors.brand} />} onPress={() => router.push('/pages/awards')} />
        </CompanyDisclosure>
      </View>
    </>}
  </View>;
}

function TrustFact({ fact, onPress }: { fact: typeof facts[number]; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  const Icon = fact.icon;
  return <Pressable accessibilityRole="button" accessibilityLabel={`${fact.title}. ${fact.caption}`} onPress={onPress}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [s.fact, focused && s.focus, pressed && s.pressed]}>
    <View style={layout.between}><Icon size={21} color={colors.brand} /><ArrowUpRight size={15} color={colors.muted} /></View>
    <Text style={type.label}>{fact.title}</Text><Text style={type.caption}>{fact.caption}</Text>
  </Pressable>;
}

const s = StyleSheet.create({
  section: { gap: spacing.lg },
  titleBlock: { gap: 7 },
  eyebrow: { ...type.caption, color: colors.brand, fontSize: 10, letterSpacing: 1, fontWeight: '700' },
  facts: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12 },
  fact: { width: '47%', flexGrow: 1, paddingVertical: 13, paddingHorizontal: 2, gap: 5, borderBottomWidth: 1, borderBottomColor: colors.line },
  focus: { outlineStyle: 'solid', outlineWidth: 2, outlineColor: colors.brand },
  pressed: { backgroundColor: colors.pale },
  disclosure: { borderBottomWidth: 1, borderBottomColor: colors.line },
  disclosureButton: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 2, gap: 12 },
  disclosureBody: { paddingTop: 2, paddingBottom: 18, gap: 14 },
  timelineRow: { flexDirection: 'row', gap: 15 },
  yearColumn: { width: 52, alignItems: 'center', gap: 7 },
  year: { ...type.subheading, color: colors.accent },
  timelineLine: { width: 1, minHeight: 24, flex: 1, backgroundColor: colors.line },
  timelineCopy: { flex: 1, gap: 4, paddingBottom: 6 },
  awardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
});
