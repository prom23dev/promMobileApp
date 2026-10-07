import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { checkoutGuideCopy as copy } from '../content/checkoutGuideCopy';
import { colors, type } from './theme';
import { Sheet } from './Sheet';
import { VerticalReveal, VerticalScrollProvider } from './VerticalReveal';

function RichText({ text }: { text: string }) {
  return <Text style={type.body}>{text.split('**').map((part, i) => <Text key={i} style={i % 2 ? { fontWeight: '700', color: colors.brand } : undefined}>{part}</Text>)}</Text>;
}
function Action({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) {
  const [focus, setFocus] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} style={({ pressed }) => [s.action, primary && s.primary, focus && s.focus, pressed && { opacity: .75 }]}><Text style={[type.label, { flex: 1, color: primary ? colors.white : colors.brand }]}>{label}</Text><ArrowRight size={20} color={primary ? colors.white : colors.brand} aria-hidden /></Pressable>;
}
export function CheckoutGuidePage({ scrollY }: { scrollY: Animated.Value }) {
  const router = useRouter();
  const [leasingOpen, setLeasingOpen] = useState(false);
  const open = (route: string) => route === 'leasing' ? setLeasingOpen(true) : router.push(route as Href);
  const proceed = (route: Href) => { setLeasingOpen(false); router.push(route); };
  return <VerticalScrollProvider value={scrollY}><View testID="checkout-guide" style={s.page}>
    <VerticalReveal kind="fade"><Text accessibilityRole="header" aria-level={1} style={s.h1}>{copy.title}</Text></VerticalReveal>
    {copy.steps.map((step, index) => <View key={step.title} testID={'checkout-guide-step-' + (index + 1)} style={s.section}>
      <VerticalReveal kind="fade"><View style={s.marker}><Text accessibilityRole="header" aria-level={2} style={s.h2}>{step.title}</Text></View></VerticalReveal>
      <View style={s.content}>{step.blocks.map((block, i) => {
        if (block.kind === 'p') return <RichText key={i} text={block.text} />;
        if (block.kind === 'heading') return <View key={i} style={[s.subheading, block.level === 3 && i > 0 && s.divider]}><Text accessibilityRole="header" aria-level={block.level} style={block.level === 3 ? s.h3 : s.h4}>{block.text}</Text></View>;
        if (block.kind === 'list') return <View key={i} style={s.list}>{block.items.map(item => <View key={item} style={s.row}><View style={s.bullet} aria-hidden /><Text style={[type.body, { flex: 1 }]}>{item}</Text></View>)}</View>;
        return <Action key={i} label={block.text} onPress={() => open(block.route)} primary={block.route === 'leasing'} />;
      })}</View>
    </View>)}
    <Sheet visible={leasingOpen} title="Заявка на лизинг" onClose={() => setLeasingOpen(false)}>
      <View style={s.sheet} testID="checkout-leasing-next-step">
        <Text style={type.body}>Выберите товар в каталоге. В карточке товара, для которого доступен лизинг, нажмите «Заявка на лизинг».</Text>
        <Text style={type.body}>Для оформления заявки зарегистрируйтесь и добавьте юридическое лицо в кабинете организации.</Text>
        <Action label="Выбрать товар" onPress={() => proceed('/catalog?section=all')} primary />
        <Action label="Открыть кабинет организации" onPress={() => proceed('/workspace/organizations')} />
      </View>
    </Sheet>
  </View></VerticalScrollProvider>;
}
const s = StyleSheet.create({
  page: { gap: 32 }, h1: { ...type.title, fontSize: 28, lineHeight: 34 }, section: { gap: 18 },
  marker: { borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 12 },
  h2: { color: colors.brand, fontSize: 25, lineHeight: 31, fontWeight: '800', letterSpacing: -.4 },
  h3: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: '700' },
  h4: { color: colors.brand, fontSize: 17, lineHeight: 24, fontWeight: '700' },
  content: { padding: 18, gap: 16, borderRadius: 18, backgroundColor: colors.white },
  subheading: { paddingTop: 4 }, divider: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 22, marginTop: 4 },
  list: { gap: 9 }, row: { flexDirection: 'row', gap: 12 }, bullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.brand, marginTop: 9 },
  action: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', padding: 12 },
  primary: { backgroundColor: colors.accent }, focus: { borderColor: colors.orange }, sheet: { gap: 16 },
});
