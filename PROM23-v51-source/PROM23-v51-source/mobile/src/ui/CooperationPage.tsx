import React, { useRef, useState, type ReactNode, type RefObject } from 'react';
import { Animated, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowDown, ArrowRight, Building2, Factory, Package, Store, type LucideIcon } from 'lucide-react-native';
import { colors, type } from './theme';
import { palette } from './tokens';
import { VerticalReveal, VerticalScrollProvider } from './VerticalReveal';
import { useReducedMotion } from './useReducedMotion';
import { supportPhone } from '../content/siteContent';
import { useShop } from '../store';

const directions = [
  { id: 'business', icon: Building2, title: 'Для бизнеса', text: 'Комплектуем объекты оборудованием и материалами, готовим коммерческие предложения, резервируем товар, организуем доставку и предоставляем необходимые документы.', cta: 'Все возможности для бизнеса' },
  { id: 'production', icon: Factory, title: 'Производство под заказ', text: 'Изготавливаем оборудование и металлоконструкции по размерам, чертежам, эскизам и техническому заданию.', cta: 'Заказать изготовление' },
  { id: 'suppliers', icon: Package, title: 'Поставщикам', text: 'Рассматриваем предложения производителей и поставщиков строительного оборудования, материалов и комплектующих.', cta: 'Предложить продукцию' },
  { id: 'franchise', icon: Store, title: 'Франшиза', text: 'Развиваем сеть под брендом «Промышленник» в России и за рубежом.', cta: 'Условия франшизы' },
];
const facts = [
  { title: 'С 2008 года', text: 'Мы работаем на рынке строительного оборудования.' },
  { title: 'Собственное производство', text: 'Мы выпускаем оборудование на собственном производстве в Краснодарском крае.' },
  { title: 'Производство под заказ', text: 'Изготавливаем оборудование и металлоконструкции по индивидуальным требованиям заказчиков.' },
  { title: 'Комплектация объектов', text: 'Комплектуем одним заказом оборудование и материалы разных товарных групп.' },
  { title: 'Россия и зарубежные рынки', text: 'Поставляем продукцию по России и развиваем экспортное и партнёрское направления.' },
];

const benefits = ['Коммерческое предложение', 'Резерв товара', 'Доставка на объект', 'Документы и ЭДО'];
const inputs = ['чертёж', 'эскиз', 'размеры', 'техническое задание', 'фотографию образца', 'описание задачи'];
function P({ children }: { children: string }) { return <Text style={type.body}>{children}</Text>; }
// Match the approved Delivery hierarchy locally; no changes to shared typography.
function Heading({ children, level = 2 }: { children: string; level?: 2 | 3 | 4 }) {
  const text = <Text accessibilityRole="header" aria-level={level} style={level === 2 ? s.sectionTitle : level === 3 ? s.subsectionTitle : s.detailTitle}>{children}</Text>;
  return level === 2 ? <View style={s.sectionTitleMark}>{text}</View> : text;
}
function Action({ label, route, onPress, primary = false }: { label: string; route?: Href; onPress?: () => void; primary?: boolean }) {
  const router = useRouter(); const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole={route ? 'link' : 'button'} accessibilityLabel={label} onPress={onPress ?? (() => { if (route) router.push(route); })} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={({ pressed }) => [s.action, primary && s.primary, focused && s.focus, pressed && s.pressed]}>
    <Text style={[type.label, { flex: 1, color: primary ? colors.white : colors.brand }]}>{label}</Text><ArrowRight size={20} color={primary ? colors.white : colors.brand} aria-hidden style={{ flexShrink: 0 }} />
  </Pressable>;
}
function List({ items, strong = false, testID }: { items: string[]; strong?: boolean; testID: string }) {
  return <View testID={testID} style={s.list}>{items.map(item => <View key={item} style={s.listRow}><View aria-hidden style={s.bullet} /><Text style={[type.body, { flex: 1 }, strong && { fontWeight: '600' }]}>{item}</Text></View>)}</View>;
}
function Direction({ id, icon: Icon, title, text, cta, onPress, last }: { id: string; icon: LucideIcon; title: string; text: string; cta: string; onPress: () => void; last: boolean }) {
  const [focused, setFocused] = useState(false);
  return <Pressable testID={'cooperation-nav-' + id} accessibilityRole="button" accessibilityLabel={title + '. Перейти к разделу на странице'} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={({ pressed }) => [s.direction, !last && s.directionDivider, focused && s.focus, pressed && s.pressed]}>
    <View style={s.directionHeading}><Icon size={24} strokeWidth={1.7} color={colors.brand} aria-hidden /><Text style={s.directionTitle}>{title}</Text></View>
    <P>{text}</P><View style={s.directionAction}><Text style={[type.label, { flex: 1, color: colors.brand }]}>{cta}</Text><ArrowDown size={19} color={colors.brand} aria-hidden style={{ flexShrink: 0 }} /></View>
  </Pressable>;
}
export function CooperationPage({ scrollY, scrollRef }: { scrollY: Animated.Value; scrollRef: RefObject<ScrollView | null> }) {
  const reduced = useReducedMotion(); const { state } = useShop(); const router = useRouter();
  const anchors = useRef<Record<string, View | null>>({}); const [callError, setCallError] = useState(false); const [callFocus, setCallFocus] = useState(false);
  const anchor = (id: string) => (node: View | null) => { anchors.current[id] = node; };
  const jump = (id: string) => {
    const target = anchors.current[id], scroll = scrollRef.current;
    if (target && scroll) target.measureLayout(scroll.getInnerViewNode(), (_x, y) => scroll.scrollTo({ y: Math.max(0, y - 12), animated: !reduced }), () => {});
  };
  const productionRequest = () => router.push({ pathname: '/forms/[id]', params: { id: 'production-request', expectedContext: state.context } });
  return <VerticalScrollProvider value={scrollY}><View testID="cooperation-editorial" style={s.page}>
    <View testID="cooperation-hero" style={s.hero}>
      <Text style={s.eyebrow}>Сотрудничество</Text>
      <Text accessibilityRole="header" aria-level={1} style={s.h1}>Работаем с бизнесом и партнёрами</Text>
      <P>Мы комплектуем строительные объекты, производим оборудование под заказ, сотрудничаем с поставщиками и развиваем франшизную сеть в России и за рубежом.</P>
      <P>Выберите интересующий формат.</P>
    </View>
    <View testID="cooperation-directions" accessibilityLabel="Форматы сотрудничества" style={s.directions}>
      {directions.map((item, index) => <VerticalReveal key={item.id} kind="fade"><Direction {...item} last={index === directions.length - 1} onPress={() => jump(item.id)} /></VerticalReveal>)}
    </View>
    <View ref={anchor('business')} collapsable={false} testID="cooperation-business" style={s.section}>
      <Heading>Для бизнеса</Heading>
      <VerticalReveal kind="fade" style={s.content}>
        <Heading level={3}>Снабжение компании и строительных объектов</Heading>
        <P>Мы помогаем собрать оборудование и материалы под конкретную задачу: проверяем позиции и наличие, предлагаем аналоги при необходимости, готовим коммерческое предложение и организуем поставку.</P>
        <List items={benefits} strong testID="cooperation-benefits" />
        <Action label="Все возможности для бизнеса" route="/information/business" />
        <View testID="cooperation-specification" style={s.subsection}>
          <Heading level={4}>Есть спецификация или смета?</Heading>
          <P>Загрузите файл — мы сверим позиции, проверим наличие, подберём аналоги при необходимости и подготовим предложение.</P>
          <P>Можно приложить спецификацию, смету, перечень товаров, чертёж или фото.</P>
          <Action label="Загрузить спецификацию" route="/procurement?mode=list" primary />
        </View>
        <View testID="cooperation-selection" style={s.subsection}>
          <Heading level={4}>Нужно подобрать оборудование?</Heading>
          <P>Опишите задачу, объект или вид работ. Мы поможем определить подходящее оборудование и собрать комплект.</P>
          <P>Можно указать размеры объекта, высоту, требуемую нагрузку и другие исходные данные.</P>
          <Action label="Подобрать оборудование" route="/procurement?mode=selection" />
        </View>
      </VerticalReveal>
    </View>
    <View ref={anchor('production')} collapsable={false} testID="cooperation-production" style={s.section}>
      <Heading>Производство под заказ</Heading>
      <VerticalReveal kind="fade" style={s.content}>
        <Heading level={3}>Изготовим под вашу задачу</Heading>
        <P>У нас собственное производство, поэтому мы можем рассматривать индивидуальные заказы на оборудование и металлоконструкции.</P>
        <P>Для предварительной оценки можно предоставить:</P>
        <List items={inputs} testID="cooperation-production-inputs" />
        <P>Мы изучим исходные данные и уточним возможность изготовления, конструкцию, материалы, объём и условия производства.</P>
        <Action label="Отправить заявку на изготовление" onPress={productionRequest} primary />
        <Action label="Подробнее о производстве" route="/information/production" />
      </VerticalReveal>
    </View>
    <View ref={anchor('suppliers')} collapsable={false} testID="cooperation-suppliers" style={s.section}>
      <Heading>Поставщикам</Heading>
      <VerticalReveal kind="fade" style={s.content}>
        <Heading level={3}>Хотите предложить нам продукцию?</Heading>
        <P>Мы рассматриваем предложения производителей и поставщиков строительного оборудования, материалов и комплектующих.</P>
        <P>Расскажите о компании, ассортименте и условиях сотрудничества через форму для поставщиков.</P>
        <Action label="Предложить продукцию" route="/pages/suppliers" primary />
      </VerticalReveal>
    </View>
    <View ref={anchor('franchise')} collapsable={false} testID="cooperation-franchise" style={s.section}>
      <Heading>Франшиза</Heading>
      <VerticalReveal kind="fade" style={s.content}>
        <Heading level={3}>Развивайте бизнес под брендом «Промышленник»</Heading>
        <P>Мы развиваем франшизную сеть в России и за рубежом.</P>
        <P>Условия работы, требования к партнёрам, информацию о поддержке и форму заявки мы собрали на отдельной странице.</P>
        <Action label="Условия франшизы" route="/pages/franchise" />
      </VerticalReveal>
    </View>
    <View testID="cooperation-trust" style={s.section}>
      <Heading>«Промышленник» в работе</Heading>
      <View style={s.content}>{facts.map(({ title, text }, i) => <VerticalReveal key={title} kind="fade" testID={'cooperation-trust-' + i} style={[s.fact, i > 0 && s.factDivider]}><Heading level={3}>{title}</Heading><P>{text}</P></VerticalReveal>)}</View>
    </View>
    <View testID="cooperation-final" style={s.final}>
      <Heading>Нужна помощь?</Heading><P>Опишите задачу — мы передадим обращение специалисту нужного направления.</P>
      <Action label="Связаться с нами" route="/information/contacts" primary />
      <Pressable accessibilityRole="link" accessibilityLabel="Позвонить 8 (800) 200-25-90" onFocus={() => setCallFocus(true)} onBlur={() => setCallFocus(false)} onPress={() => { setCallError(false); void Linking.openURL('tel:' + supportPhone).catch(() => setCallError(true)); }} style={({ pressed }) => [s.action, callFocus && s.focus, pressed && s.pressed]}><Text style={[type.label, { color: colors.brand, flexShrink: 1 }]}>Позвонить 8 (800) 200-25-90</Text></Pressable>
      {callError && <Text accessibilityRole="alert" style={type.body}>Наберите 8 (800) 200-25-90 в приложении телефона.</Text>}
    </View>
  </View></VerticalScrollProvider>;
}
const s = StyleSheet.create({
  page: { gap: 40 }, hero: { paddingHorizontal: 4, gap: 16 }, eyebrow: { ...type.caption, fontSize: 12, lineHeight: 18, color: colors.brand, fontWeight: '700' }, h1: { ...type.title, fontSize: 28, lineHeight: 33 },
  directions: { backgroundColor: colors.white, borderRadius: 18, marginTop: -16, overflow: 'hidden' }, direction: { padding: 18, gap: 12, borderWidth: 2, borderColor: 'transparent' }, directionDivider: { borderBottomColor: colors.line, borderBottomWidth: 1 }, directionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 }, directionTitle: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: colors.brand, flex: 1 }, directionAction: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  section: { gap: 18 }, sectionTitleMark: { borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 12 }, sectionTitle: { color: colors.brand, fontSize: 25, lineHeight: 31, fontWeight: '800', letterSpacing: -.4 }, subsectionTitle: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: '700' }, detailTitle: { color: colors.brand, fontSize: 17, lineHeight: 24, fontWeight: '700' },
  content: { padding: 18, borderRadius: 18, backgroundColor: colors.white, gap: 16 }, subsection: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 22, marginTop: 4, gap: 14 }, list: { gap: 10, paddingVertical: 4 }, listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, bullet: { width: 5, height: 5, marginTop: 9, borderRadius: 3, backgroundColor: colors.brand }, fact: { gap: 10 }, factDivider: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 18 },
  final: { padding: 18, gap: 16, borderRadius: 18, backgroundColor: palette.cyan100 }, action: { minHeight: 52, paddingHorizontal: 10, paddingVertical: 10, borderWidth: 2, borderColor: 'transparent', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, primary: { backgroundColor: colors.accent }, focus: { borderColor: colors.orange }, pressed: { opacity: .72 },
});
