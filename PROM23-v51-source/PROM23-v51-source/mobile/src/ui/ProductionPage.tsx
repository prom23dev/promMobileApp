import { InlineVideo } from './InlineVideo';
import { productionVideo } from '../video-source';
import React, { useId, useRef, useState, type ReactNode, type RefObject, type ComponentProps } from 'react';
import { Animated, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowDown, ArrowRight, Award, Check, ChevronDown, ChevronUp, Factory, FileCheck2, Layers3, Play, Ruler, ShieldCheck } from 'lucide-react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useShop } from '../store';
import { productionPage, productionSites, manufacturingSteps, manufacturedGroups, productionTests, productionBenefits, manufacturingFaq } from '../content/productionPage';
import recovery from '../content/sourceRecoveryContent.json';
import { colors } from './theme';
import { CategoryPictogram } from './CategoryPictogram';
import { VerticalReveal, VerticalScrollProvider } from './VerticalReveal';
import { useReducedMotion } from './useReducedMotion';

const navigation = [['sites', 'Площадки'], ['cycle', 'Процессы'], ['products', 'Продукция'], ['quality', 'Качество'], ['custom', 'Под заказ']] as const;
function Tap({ style, ...props }: ComponentProps<typeof Pressable>) {
  const [focused, setFocused] = useState(false);
  return <Pressable {...props} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={state => [typeof style === 'function' ? style(state) : style, focused && s.focus, state.pressed && { opacity: .75 }]} />;
}
function P({ children, light = false }: { children: ReactNode; light?: boolean }) { return <Text selectable style={[s.body, light && s.white]}>{children}</Text>; }
function H({ children, level = 2 }: { children: ReactNode; level?: 2 | 3 }) {
  const text = <Text accessibilityRole="header" aria-level={level} style={level === 2 ? s.h2 : s.h3}>{children}</Text>;
  return level === 2 ? <View style={s.titleMark}>{text}</View> : text;
}
function Strong({ children }: { children: ReactNode }) { return <Text style={s.strong}>{children}</Text>; }
function Action({ title, route, onPress, primary = false, light = false }: { title: string; route?: Href; onPress?: () => void; primary?: boolean; light?: boolean }) {
  const router = useRouter();
  return <Tap accessibilityRole="button" accessibilityLabel={title} onPress={onPress ?? (() => route && router.push(route))} style={[s.action, light && s.lightAction, primary && s.primary]}><Text style={[s.actionText, primary && s.white]}>{title}</Text><ArrowRight size={20} aria-hidden color={primary ? colors.white : colors.brand} style={{ flexShrink: 0 }} /></Tap>;
}
function Detail({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false); const Icon = open ? ChevronUp : ChevronDown;
  return <View style={s.detail}><Tap accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} aria-expanded={open} style={s.detailTrigger} onPress={() => setOpen(!open)}><Text style={s.actionText}>{title}</Text><Icon size={20} color={colors.brand} /></Tap>{open && <View style={s.detailBody}>{children}</View>}</View>;
}
function Photo({ source, caption, height = 200 }: { source: number; caption: string; height?: number }) {
  return <VerticalReveal kind="fade" style={s.photo}><Image source={source} accessibilityLabel={caption} resizeMode="cover" style={{ width: '100%', height }} /><Text style={s.captionInset}>{caption}</Text></VerticalReveal>;
}
function Banner({ children, source, label, warm = false }: { children: ReactNode; source: number; label: string; warm?: boolean }) {
  const id = useId().replace(/:/g, '');
  return <View style={[s.banner, warm && s.warmBanner]}><Image source={source} accessibilityLabel={label} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} /><Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%" aria-hidden><Defs><LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="60%"><Stop offset="0" stopColor={warm ? '#352C25' : '#192F3C'} stopOpacity=".98" /><Stop offset=".7" stopColor={warm ? '#352C25' : '#192F3C'} stopOpacity=".9" /><Stop offset="1" stopColor={warm ? '#544331' : '#192F3C'} stopOpacity=".4" /></LinearGradient></Defs><Rect width="100%" height="100%" fill={'url(#' + id + ')'} /></Svg><View style={s.bannerCopy}>{children}</View></View>;
}
export function ProductionPage({ scrollRef, scrollY }: { scrollRef: RefObject<ScrollView | null>; scrollY: Animated.Value }) {
  const { state, catalogTree } = useShop(); const { width, fontScale } = useWindowDimensions(); const wide = width >= 640 && fontScale < 1.4;
  const reduced = useReducedMotion(); const positions = useRef<Record<string, number>>({}); const [error, setError] = useState('');
  const form = (id: string): Href => ({ pathname: '/forms/[id]', params: { id, expectedContext: state.context } });
  const roots = catalogTree.rootIds.flatMap(id => catalogTree.sections.find(x => x.id === id) ?? []);
  const jump = (id: string) => scrollRef.current?.scrollTo({ y: Math.max(0, (positions.current[id] ?? 0) - 12), animated: !reduced });
  const open = async (url: string) => { setError(''); try { await Linking.openURL(url); } catch { setError('Не удалось открыть материал. Повторите попытку или свяжитесь с менеджером.'); } };
  const section = (id: string, children: ReactNode) => <View key={id} testID={'production-' + id} style={s.section} onLayout={e => { positions.current[id] = e.nativeEvent.layout.y; }}>{children}</View>;
  return <VerticalScrollProvider value={scrollY}><View testID="production-editorial" style={s.page}>
    <Banner source={require('../../assets/brand/factory-wide.webp')} label="Производственный цех компании в Краснодарском крае">
      <Text style={[s.eyebrow, s.white]}>ООО «ТЕАМ ИНДАСТРИ»</Text><Text style={[s.caption, s.white]}>Производственная компания ГК «Промышленник»</Text>
      <Text accessibilityRole="header" aria-level={1} style={s.h1}>{productionPage.title}</Text>
      <P light>Проектируем и выпускаем оборудование на двух производственных площадках в Краснодарском крае.</P>
      <Action title="Получить предложение" primary route={form('production-request')} /><Action title="Перейти в каталог" light route="/catalog" />
    </Banner>
    <View style={s.navigation}>{navigation.map(([id, title]) => <Tap key={id} accessibilityRole="button" accessibilityLabel={'К разделу: ' + title} onPress={() => jump(id)} style={s.nav}><Text style={s.navText}>{title}</Text><ArrowDown size={14} color={colors.accent} aria-hidden /></Tap>)}</View>
    {section('scale', <>
      <H>Масштаб для серийного выпуска</H><P>С <Strong>2021 года</Strong> производим строительное оборудование под марками <Strong>«Промышленник» и TeaM</Strong>. Собственные технологии, инженерный отдел и лаборатория позволяют управлять качеством и сроками выпуска.</P>
      <View style={s.metrics}>{productionPage.stats.map(item => <View key={item.label} style={[s.metric, { width: wide ? '23%' : '48%' }]}><Text style={[s.metricValue, item.value.length > 7 && { fontSize: 23 }]}>{item.value}</Text><Text style={s.metricLabel}>{item.label}</Text></View>)}</View>
      <Text style={s.caption}>По данным ООО «ТЕАМ ИНДАСТРИ» на I квартал 2026 года.</Text>
    </>)}
    {section('sites', <>
      <H>Две площадки — одна система</H><P>Обе площадки находятся <Strong>в Краснодарском крае</Strong>. Распределяем операции с учётом технологии, загрузки оборудования и требований к изделию.</P>
      <View testID="production-shop-equation" accessibilityLabel="8 цехов на первой площадке плюс 3 цеха на второй — всего 11" style={s.equation}>
        {[['8', 'площадка 01'], ['3', 'площадка 02'], ['11', 'цехов всего']].map(([number, label], i) => <React.Fragment key={number}>{i > 0 && <Text style={s.equationSign}>{i === 1 ? '+' : '='}</Text>}<View style={s.equationTerm}><Text style={[s.equationNumber, i === 2 && s.orange]}>{number}</Text><Text style={s.equationLabel}>{label}</Text></View></React.Fragment>)}
      </View>
      {productionSites.map(site => <View key={site.number} testID={'production-site-' + site.number} style={s.siteCard}>
        <View style={s.siteHead}><Text style={s.siteNumber}>{site.number}</Text><View style={s.grow}><Text style={s.eyebrow}>ПРОИЗВОДСТВЕННАЯ ПЛОЩАДКА</Text><H level={3}>{site.title}</H></View></View>
        <P>{site.text}</P><View style={s.siteFacts}><Text style={s.fact}>{site.count} {site.count === 3 ? 'цеха' : 'цехов'}</Text><Text style={s.fact}>{site.area}</Text></View>
        <View style={s.shopBar} aria-hidden>{site.zones.map(zone => <View key={zone.title} style={{ flex: zone.count, backgroundColor: zone.color, height: 12 }} />)}</View>
        <View style={s.zoneRows}>{site.zones.map(zone => <View key={zone.title} style={s.zoneRow}><View style={[s.zoneDot, { backgroundColor: zone.color }]} /><Text style={s.zoneText}>{zone.title}</Text><Text style={s.zoneCount}>{zone.count}</Text></View>)}</View>
        <Detail title={'Площади и оснащение площадки ' + site.number}>{site.zones.map(zone => <View key={zone.title} style={s.detailItem}><H level={3}>{zone.title}</H><P>{zone.detail}</P></View>)}{site.number === '01' && <Text style={s.caption}>Восемь цехов объединены в четыре функциональные зоны. Отдельно действует исследовательская и испытательная лаборатория. Площади зон указаны ориентировочно.</Text>}</Detail>
      </View>)}
    </>)}
    {section('cycle', <>
      <H>Как заготовка становится изделием</H><P>Восемь этапов — от инженерной разработки до готовой партии. Маршрут конкретного изделия зависит от его конструкции.</P>
      <Photo source={require('../../assets/brand/laser-wide.webp')} caption="Лазерная обработка металла" />
      <View testID="production-cycle-steps" style={s.steps}>{manufacturingSteps.map((step, i) => <VerticalReveal key={step.title} testID={'production-step-' + (i + 1)} style={s.step}><View style={s.stepRail}><Text style={s.stepNumber}>{String(i + 1).padStart(2, '0')}</Text>{i < 7 && <View style={s.stepLine} />}</View><View style={s.grow}><H level={3}>{step.title}</H><P>{step.text}</P></View></VerticalReveal>)}</View>
      <Detail title="Подразделения и ответственность">{recovery.departments.map(item => <View key={item.title} style={s.detailItem}><H level={3}>{item.title}</H><P>{item.text}</P></View>)}</Detail>
      <InlineVideo title="Фильм о производстве" url={productionVideo} />
    </>)}
    {section('products', <>
      <H>Что мы производим</H><P><Strong>Более 300 моделей</Strong> для монолитного, гражданского и промышленного строительства.</P>
      <Photo source={require('../../assets/brand/equipment-wide.webp')} caption="Готовая продукция под маркой «Промышленник»" />
      <View testID="production-product-photos" style={s.productPhotos}>{[
        { id: 'prom-2733', title: 'Рамные леса', image: require('../../assets/catalog/prom-2733.png') },
        { id: 'prom-2017', title: 'Анкеры для опалубки', image: require('../../assets/catalog/prom-2017.png') },
        { id: 'prom-969', title: 'Бадьи для бетона', image: require('../../assets/catalog/prom-969.jpg') },
      ].map(item => <View key={item.id} style={[s.productExample, { width: wide ? '31.8%' : '100%', flexDirection: wide ? 'column' : 'row', alignItems: wide ? 'stretch' : 'center' }]}><Image source={item.image} accessibilityLabel={item.title} resizeMode="contain" style={[s.productImage, !wide && { width: 72, height: 92 }]} /><View style={{ flex: 1, gap: 10 }}><Text style={s.exampleTitle}>{item.title}</Text><Action title="Смотреть товар" route={{ pathname: '/product/[id]', params: { id: item.id } }} /></View></View>)}</View>
      <View style={s.productGrid}>{manufacturedGroups.map(item => <View key={item.title} style={[s.productCard, { width: wide ? '48.5%' : '100%' }]}><View style={s.productHead}><CategoryPictogram name={item.icon} size={32} /><H level={3}>{item.title}</H></View><P>{item.text}</P><Action title={'Каталог: ' + item.title} route={{ pathname: '/catalog', params: { section: item.section } }} /></View>)}</View>
      <Detail title="Все разделы каталога">{roots.map(item => <Action key={item.id} title={item.name} route={{ pathname: '/catalog', params: { section: item.id } }} />)}</Detail>
      <View style={s.brandBox}><Text style={s.h3}>Продукция наших марок</Text><View style={s.actionRow}><Action title="Продукция «Промышленник»" route={{ pathname: '/catalog', params: { brand: 'Промышленник' } }} /><Action title="Продукция TeaM" route={{ pathname: '/catalog', params: { brand: 'TeaM' } }} /></View></View>
    </>)}
    {section('quality', <>
      <H>Качество проверяем на каждом этапе</H><P>Собственная <Strong>исследовательская и испытательная лаборатория</Strong> участвует в контроле материалов, технологических операций и готовой продукции.</P>
      <View style={s.qualityCards}>{[
        ['На входе', 'Материалы, комплектующие и документы.'],
        ['В процессе', 'Геометрия, сварные швы, резьба, покрытие и комплектность.'],
        ['Перед отгрузкой', 'Готовое изделие и предусмотренные для него испытания.'],
      ].map(([title, text]) => <View key={title} style={[s.qualityCard, { width: wide ? '31.8%' : '100%' }]}><ShieldCheck size={25} color={colors.brand} /><H level={3}>{title}</H><P>{text}</P></View>)}</View>
      <View style={s.testing}><H level={3}>Что испытываем</H>{productionTests.map(item => <View key={item.title} style={s.testRow}><Check size={20} color={colors.accent} /><View style={s.grow}><Text style={s.itemTitle}>{item.title}</Text><P>{item.text}</P></View></View>)}</View>
      <View style={s.award}><Award size={30} color={colors.accent} /><View style={s.grow}><Text style={s.eyebrow}>ПОДТВЕРЖДЁННОЕ КАЧЕСТВО</Text><H level={3}>«Сделано на Кубани»</H><P>Знаком отмечены малярные столики Н80 и Н80 «Промышленник» (Л), а также пружинные зажимы HIT производства ООО «ТЕАМ ИНДАСТРИ».</P><Action title="Награды и дипломы" route="/pages/awards" /></View></View>
      <Action title="Паспорта и документы на оборудование" route="/pages/warranty" />
    </>)}
    {section('custom', <View style={s.custom}><Ruler size={30} color={colors.accent} /><H>Нужно изделие под вашу задачу?</H><P>Рассмотрим <Strong>адаптацию серийной продукции или изготовление по техническому заданию</Strong>. Для оценки подготовьте:</P><View style={s.inputs}>{['Чертёж или эскиз', 'Размеры и нагрузка', 'Материал', 'Количество', 'Желаемый срок'].map(item => <View key={item} style={s.inputChip}><Check size={16} color={colors.accent} /><Text style={s.chipText}>{item}</Text></View>)}</View><Action title="Отправить заявку на изготовление" primary route={form('production-request')} /><Action title="Передать спецификацию файлом" route="/procurement?mode=list" /><Text style={s.caption}>Возможность выпуска, минимальную партию, срок и стоимость согласуем после технической оценки.</Text></View>)}
    {section('benefits', <>
      <H>Что это даёт вашему бизнесу</H><View style={s.benefits}>{productionBenefits.map((item, i) => { const Icon = [Factory, Ruler, FileCheck2, Layers3][i]; return <View key={item.title} style={s.benefit}><Icon size={25} color={colors.accent} /><View style={s.grow}><H level={3}>{item.title}</H><P>{item.text}</P></View></View>; })}</View><View style={s.actionRow}><Action title="Оборудование на объектах" route="/blog?kind=projects" /><Action title="О группе компаний" route="/pages/about" /></View>
    </>)}
    {section('questions', <><H>Перед оформлением заказа</H>{manufacturingFaq.map(item => <Detail title={item.title} key={item.title}><P>{item.text}</P></Detail>)}</>)}
    {section('visit', <Banner source={require('../../assets/brand/factory-wide.webp')} label="Общий вид производственного цеха" warm><Text style={[s.eyebrow, s.white]}>ЗНАКОМСТВО С ПРОИЗВОДСТВОМ</Text><Text accessibilityRole="header" aria-level={2} style={s.bannerTitle}>Посмотрите, как мы работаем</Text><P light>Приглашаем на экскурсию. Время и место встречи согласуем после заявки.</P><Action title="Записаться на экскурсию" primary route={form('tour')} /></Banner>)}
    {section('contact', <View style={s.contact}><H>Обсудим вашу производственную задачу</H><P>Опишите изделие или планируемую поставку — специалисты уточнят технические параметры и предложат следующий шаг.</P><Action title="Обсудить изготовление" primary route={form('production-request')} /><Action title="Скачать каталог оборудования · PDF" onPress={() => { void open('https://prom.myfast.space/upload/uf/c2e/z9a89bazeaxnc6s09bwmuabw6t6p9bdg/katalog.pdf'); }} /><Action title="Связаться с отделом продаж" route="/information/contacts" /><View style={s.actionRow}><Action title="Доставка" route="/information/delivery" /><Action title="Оплата" route="/information/payment" /></View></View>)}
    {error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
  </View></VerticalScrollProvider>;
}
const s = StyleSheet.create({
  page: { gap: 36 }, section: { gap: 18 }, grow: { flex: 1, minWidth: 0, gap: 8 },
  h1: { color: colors.white, fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -.5 }, h2: { color: colors.brand, fontSize: 25, lineHeight: 31, fontWeight: '800', letterSpacing: -.4 }, h3: { color: colors.ink, fontSize: 18, lineHeight: 24, fontWeight: '700', flexShrink: 1 }, titleMark: { borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 12 },
  body: { color: colors.ink, fontSize: 15, lineHeight: 23 }, strong: { color: colors.brand, fontWeight: '700' }, caption: { color: colors.muted, fontSize: 12, lineHeight: 18 }, eyebrow: { color: colors.brand, fontSize: 11, lineHeight: 17, fontWeight: '700', letterSpacing: .7 }, white: { color: colors.white }, orange: { color: colors.accent },
  banner: { overflow: 'hidden', borderRadius: 20, backgroundColor: '#192F3C', minHeight: 430 }, warmBanner: { minHeight: 330, backgroundColor: '#352C25' }, bannerCopy: { gap: 14, padding: 24, maxWidth: 510 }, bannerTitle: { color: colors.white, fontSize: 28, lineHeight: 34, fontWeight: '800' },
  action: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 52, maxWidth: '100%', borderWidth: 2, borderColor: colors.line, backgroundColor: colors.pale, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 }, primary: { backgroundColor: colors.accent, borderColor: colors.accent }, lightAction: { backgroundColor: colors.white, borderColor: colors.white }, actionText: { fontSize: 14, lineHeight: 21, fontWeight: '600', color: colors.brand, flex: 1 }, actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, focus: { borderColor: colors.ink },
  navigation: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 7 }, nav: { minHeight: 44, padding: 9, borderWidth: 2, borderColor: 'transparent', borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }, navText: { color: colors.brand, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', columnGap: '2.5%', rowGap: 20 }, metric: { backgroundColor: colors.white, padding: 12, borderRadius: 14, gap: 8 }, metricValue: { color: colors.accent, fontWeight: '800', fontSize: 27, lineHeight: 33, letterSpacing: -.6 }, metricLabel: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  equation: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.pale, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 22 }, equationTerm: { flex: 1, alignItems: 'center', gap: 5 }, equationNumber: { color: colors.brand, fontSize: 38, lineHeight: 44, fontWeight: '800' }, equationSign: { color: colors.muted, fontSize: 23, lineHeight: 30 }, equationLabel: { color: colors.muted, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  siteCard: { backgroundColor: colors.white, borderRadius: 18, padding: 18, gap: 16 }, siteHead: { flexDirection: 'row', alignItems: 'center', gap: 14 }, siteNumber: { fontSize: 38, lineHeight: 44, fontWeight: '800', color: colors.accent }, siteFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, fact: { color: colors.brand, fontSize: 14, lineHeight: 21, fontWeight: '700' }, shopBar: { flexDirection: 'row', gap: 3, overflow: 'hidden', borderRadius: 6 }, zoneRows: { gap: 10 }, zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, zoneDot: { width: 9, height: 9, borderRadius: 3 }, zoneText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 21 }, zoneCount: { color: colors.brand, fontSize: 18, lineHeight: 24, fontWeight: '700' },
  detail: { borderRadius: 12, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', backgroundColor: colors.white }, detailTrigger: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, borderWidth: 2, borderColor: 'transparent', padding: 12 }, detailBody: { borderTopWidth: 1, borderTopColor: colors.line, padding: 16, gap: 18 }, detailItem: { gap: 8 },
  photo: { overflow: 'hidden', borderRadius: 16, backgroundColor: colors.white }, captionInset: { color: colors.muted, fontSize: 12, lineHeight: 18, padding: 12 }, steps: { padding: 18, backgroundColor: colors.white, borderRadius: 16, gap: 0 }, step: { flexDirection: 'row', gap: 16, paddingBottom: 22 }, stepRail: { width: 35, position: 'relative' }, stepNumber: { color: colors.accent, fontSize: 21, lineHeight: 28, fontWeight: '800' }, stepLine: { width: 2, backgroundColor: '#F4C8BA', position: 'absolute', top: 36, bottom: -14, left: 13 },
  video: { flexDirection: 'row', gap: 14, alignItems: 'center' }, productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, productCard: { backgroundColor: colors.white, borderRadius: 16, padding: 18, gap: 14 }, productHead: { flexDirection: 'row', alignItems: 'center', gap: 12 }, brandBox: { gap: 14, padding: 18, borderRadius: 16, backgroundColor: colors.pale },
  productPhotos: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, productExample: { padding: 14, gap: 10, borderRadius: 14, backgroundColor: colors.white }, productImage: { width: '100%', height: 115 }, exampleTitle: { fontSize: 14, lineHeight: 21, color: colors.ink, fontWeight: '700' },
  qualityCards: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, qualityCard: { padding: 16, borderRadius: 14, backgroundColor: '#EAF2F4', gap: 10 }, testing: { padding: 18, backgroundColor: colors.white, borderRadius: 16, gap: 20 }, testRow: { flexDirection: 'row', gap: 12 }, itemTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: colors.brand }, award: { padding: 18, borderRadius: 16, backgroundColor: '#FFF0E9', flexDirection: 'row', gap: 14 },
  custom: { padding: 20, borderRadius: 18, backgroundColor: '#FFF0E9', gap: 18 }, inputs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, inputChip: { flexDirection: 'row', alignItems: 'center', maxWidth: '100%', gap: 6, backgroundColor: colors.white, padding: 10, borderRadius: 8 }, chipText: { fontSize: 13, lineHeight: 19, color: colors.ink, flexShrink: 1 }, benefits: { gap: 20 }, benefit: { flexDirection: 'row', gap: 14 }, contact: { backgroundColor: '#EAF2F4', borderRadius: 18, padding: 20, gap: 16 }, error: { fontSize: 14, lineHeight: 21, color: colors.accent },
});
