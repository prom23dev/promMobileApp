import React, { useRef, useState, type ReactNode, type RefObject, type ComponentProps } from 'react';
import { Animated, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowDown, ArrowRight, Award, ChevronDown, ChevronUp, Factory, FileCheck2, MapPin, Building2, Users, Store, Globe2, Monitor, Ruler } from 'lucide-react-native';
import { useShop } from '../store';
import { aboutCompany, aboutHistory, companyScale, productionScale, aboutClients, aboutChannels } from '../content/aboutCompany';
import { companyAwards } from '../content/companyContent';
import { branchPhotos } from '../content/editorialContent';
import { siteContacts, supportPhoneLabel } from '../content/siteContent';
import { CategoryPictogram } from './CategoryPictogram';
import { VerticalReveal, VerticalScrollProvider } from './VerticalReveal';
import { useReducedMotion } from './useReducedMotion';
import { colors } from './theme';
import { AboutHero } from './AboutHero';

const anchors = [['history', 'История'], ['production', 'Производство'], ['range', 'Ассортимент'], ['clients', 'Клиенты'], ['channels', 'Форматы работы'], ['trust', 'Проекты'], ['awards', 'Награды'], ['network', 'География']] as const;
const productGroups = [
  { title: 'Работы на высоте', text: 'Строительные леса, вышки-туры, подмости, настилы и комплектующие.', category: 'Леса', ids: ['250', '16', '37'] },
  { title: 'Монолитное строительство', text: 'Опалубка фундамента, стен и перекрытий, стойки, балки, фанера, зажимы, замки и расходные элементы.', category: 'Опалубка', ids: ['79', '72'] },
  { title: 'Бетон и арматура', text: 'Бадьи, тара, вибраторы бетона, станки и ручной инструмент для гибки, резки и вязки арматуры.', category: 'Оборудование для бетонных работ', ids: ['141', '125', '113'] },
  { title: 'Склад и грузоподъёмные работы', text: 'Тележки, штабелеры, погрузчики, тали, лебёдки, стропы и подъёмные столы.', category: 'Техника для склада', ids: ['157', '64', '56'] },
];
const historyMedia: Record<string, { image: number; caption: string }> = {
  '2008': { image: require('../../assets/about-history/2008-supplies.png'), caption: 'Первые поставки оборудования · ИИ-иллюстрация' },
  '2015': { image: require('../../assets/about-history/2015-network.png'), caption: 'Развитие складской сети · ИИ-иллюстрация' },
  '2021': { image: require('../../assets/about-history/2021-workshop.png'), caption: 'Начало серийного производства · ИИ-иллюстрация' },
};
const projects = [
  { id: 'projects-moscow-city', title: 'Москва-Сити', text: 'Опалубка стен и перекрытий, средства подмащивания.', image: require('../../assets/blog/gallery-moscow-city-02.jpg') },
  { id: 'projects-development-plaza-krasnodar', title: 'Development Plaza · Краснодар', text: 'Телескопические стойки, опалубка и средства подмащивания.', image: require('../../assets/blog/gallery-development-plaza-krasnodar-02.jpg') },
  { id: 'projects-krc-oktyabr-astrakhan', title: 'КРК «Октябрь» · Астрахань', text: 'Хомутовые леса с оцинкованными настилами для реконструкции.', image: require('../../assets/blog/gallery-krc-oktyabr-astrakhan-05.jpg') },
];
function Tap({ style, ...props }: ComponentProps<typeof Pressable>) {
  const [focused, setFocused] = useState(false);
  return <Pressable {...props} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={state => [typeof style === 'function' ? style(state) : style, focused && s.focus, state.pressed && s.pressed]} />;
}
function P({ children, emphasis }: { children: ReactNode; emphasis?: string }) {
  const start = typeof children === 'string' && emphasis ? children.indexOf(emphasis) : -1;
  return <Text selectable style={s.body}>{start >= 0 && typeof children === 'string' && emphasis ? <>{children.slice(0, start)}<Text style={s.emphasis}>{emphasis}</Text>{children.slice(start + emphasis.length)}</> : children}</Text>;
}
function H({ children, level = 2 }: { children: ReactNode; level?: 2 | 3 }) {
  const title = <Text accessibilityRole="header" aria-level={level} style={level === 2 ? s.h2 : s.h3}>{children}</Text>;
  return level === 2 ? <View style={s.sectionTitleMark}>{title}</View> : title;
}
function Action({ title, route, onPress, primary, white }: { title: string; route?: Href; onPress?: () => void; primary?: boolean; white?: boolean }) {
  const router = useRouter();
  return <Tap accessibilityRole="button" accessibilityLabel={title} onPress={onPress ?? (() => route && router.push(route))} style={[s.action, primary && s.primary, white && s.whiteAction]}><Text style={[s.actionText, primary && s.whiteText, white && { color: colors.accent }]}>{title}</Text><ArrowRight size={20} color={primary ? colors.white : colors.brand} aria-hidden style={{ flexShrink: 0 }} /></Tap>;
}
function Disclosure({ title, children, testID }: { title: string; children: ReactNode; testID?: string }) {
  const [open, setOpen] = useState(false); const Icon = open ? ChevronUp : ChevronDown;
  return <View testID={testID} style={s.disclosure}><Tap accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} aria-expanded={open} onPress={() => setOpen(!open)} style={s.disclosureButton}><Text style={s.actionText}>{title}</Text><Icon size={19} color={colors.brand} /></Tap>{open && <View style={s.disclosureBody}>{children}</View>}</View>;
}
function Metrics({ data, note }: { data: typeof companyScale; note: string }) {
  const { width, fontScale } = useWindowDimensions(); const wide = width >= 640 && fontScale < 1.4;
  return <View style={s.metrics}><View style={s.metricsGrid}>{data.map(item => <View key={item.label} style={[s.metric, wide ? { width: '30%' } : s.metricRow]}><Text style={[s.metricValue, !wide && { width: 88 }]}>{item.value}</Text><Text style={[s.metricLabel, !wide && { flex: 1 }]}>{item.label}</Text></View>)}</View><Text style={s.caption}>{note}</Text></View>;
}

export function AboutPage({ scrollRef, scrollY }: { scrollRef: RefObject<ScrollView | null>; scrollY: Animated.Value }) {
  const { catalogTree, state } = useShop(); const { width, fontScale } = useWindowDimensions();
  const wide = width >= 640 && fontScale < 1.4; const reduced = useReducedMotion();
  const positions = useRef<Record<string, number>>({}); const [city, setCity] = useState('Краснодар'); const [error, setError] = useState('');
  const roots = catalogTree.rootIds.flatMap(id => catalogTree.sections.find(section => section.id === id) ?? []);
  const branch = siteContacts[city];
  const jump = (id: string) => scrollRef.current?.scrollTo({ y: (positions.current[id] ?? 0) + 4, animated: !reduced });
  const open = async (url: string, fallback: string) => { setError(''); try { await Linking.openURL(url); } catch { setError(fallback); } };
  const section = (id: string, children: ReactNode) => <View key={id} testID={'about-' + id} onLayout={event => { positions.current[id] = event.nativeEvent.layout.y; }} style={s.section}>{children}</View>;
  return <VerticalScrollProvider value={scrollY}><View testID="about-editorial" style={s.page}>
    <View testID="about-hero" style={s.hero}>
      <AboutHero onHistory={() => jump('history')} />
      <P emphasis="Комплексно оснащаем строительные и промышленные объекты">{aboutCompany.intro}</P>
      <Text style={s.caption}>Собственная продукция и оборудование российских и зарубежных брендов — в одном заказе.</Text>
    </View>
    <Metrics data={companyScale} note="Данные компании на I квартал 2026 года." />
    <View testID="about-navigation" style={s.navigation}>{anchors.map(([id, title]) => <Tap key={id} accessibilityRole="button" accessibilityLabel={'К разделу: ' + title} onPress={() => jump(id)} style={s.navLink}><Text style={s.navText}>{title}</Text><ArrowDown size={13} color={colors.accent} /></Tap>)}</View>
    {section('history', <>
      <View style={s.heading}><Text style={s.eyebrow}>2008 — 2026</Text><H>История нашего развития</H><P>От первых поставок на Юге России — к собственному производству и международной сети.</P></View>
      <View testID="about-timeline" style={s.timeline}>{aboutHistory.map((item, index) => <VerticalReveal testID={'about-history-' + item.year} key={item.year} style={s.milestone}>
        {index < aboutHistory.length - 1 && <View style={s.timelineLine} aria-hidden />}
        <View style={[s.timelineDot, index === aboutHistory.length - 1 && s.timelineDotLast]} aria-hidden />
        <View style={s.milestoneBody}><Text style={s.year}>{item.year}</Text><H level={3}>{item.title}</H><P>{item.text}</P>
          {historyMedia[item.year] && <View testID={'about-history-media-' + item.year} style={s.historyMedia}><View testID="about-history-photo-frame" style={s.historyPhotoFrame}><Image source={historyMedia[item.year].image} resizeMode="cover" accessibilityLabel={historyMedia[item.year].caption} style={s.historyPhoto} /></View><Text style={s.historyCaption}>{historyMedia[item.year].caption}</Text></View>}
        </View>
      </VerticalReveal>)}</View>
    </>)}
    {section('production', <>
      <View style={s.heading}><Text style={s.eyebrow}>ООО «ТЕАМ ИНДАСТРИ»</Text><H>От чертежа до готового изделия</H></View>
      <P emphasis="«Промышленник» и TeaM">Наше производственное предприятие выпускает оборудование под марками «Промышленник» и TeaM. Производство работает на двух площадках в Краснодарском крае.</P>
      <VerticalReveal style={s.cover}><Image source={require('../../assets/brand/factory-wide.webp')} resizeMode="cover" accessibilityLabel="Производственный цех ООО ТЕАМ ИНДАСТРИ" style={s.productionPhoto} /><Text style={s.photoCaption}>Собственные цеха · Краснодарский край</Text></VerticalReveal>
      <View testID="about-production-flow" style={s.process}>
        <H level={3}>Контролируем каждый этап</H>
        {[
          ['Разрабатываем', 'Конструкция, чертежи и техническая документация.', Ruler],
          ['Производим', 'Металлообработка, сварка, порошковая окраска и сборка.', Factory],
          ['Проверяем', 'Входной, операционный и приёмочный контроль. Испытания на прочность и ресурс в собственной лаборатории.', FileCheck2],
        ].map(([title, text, Icon], i) => { const StepIcon = Icon as typeof Ruler; return <View key={String(title)} style={s.flowRow}><View style={s.flowIcon}><StepIcon size={22} color={colors.accent} />{i < 2 && <View style={s.flowLine} />}</View><View style={s.grow}><H level={3}>{String(title)}</H><P>{String(text)}</P></View></View>; })}
        <Text style={s.caption}>После проверки — комплектование, упаковка и подготовка к отгрузке.</Text>
      </View>
      <VerticalReveal style={s.cover}><Image source={require('../../assets/brand/laser-wide.webp')} resizeMode="cover" accessibilityLabel="Лазерная обработка металла" style={s.detailPhoto} /><Text style={s.photoCaption}>Точность начинается с обработки металла.</Text></VerticalReveal>
      <Metrics data={productionScale} note="Производственные показатели по данным компании." />
      <P emphasis="индивидуальную продукцию по техническому заданию заказчика">Кроме серийного выпуска изготавливаем индивидуальную продукцию по техническому заданию заказчика: чертежам, эскизам и размерам.</P>
      <View style={s.linksRow}><Action title="О производстве" route="/information/production" /><Action title="Заказать изготовление" primary route={{ pathname: '/forms/[id]', params: { id: 'business-advice', expectedContext: state.context } }} /></View>
    </>)}
    {section('team', <>
      <H>За каждым этапом — команда</H>
      <View style={s.teamLead}><Text style={s.teamNumber}>350</Text><View style={s.grow}><Text style={s.h3}>сотрудников</Text><Text style={s.caption}>группа компаний «Промышленник»</Text></View></View>
      <P>Производственные и коммерческие специалисты работают вместе, чтобы клиент получал точную информацию о продукции, наличии, документах и поставке.</P>
      <View style={s.teamRows}>{[
        [Ruler, 'Инженеры и конструкторы', 'Прорабатывают техническое решение.'],
        [Factory, 'Мастера, лаборатория и контроль качества', 'Отвечают за изготовление и испытания.'],
        [Users, 'Закупки, продажи, логистика и экспорт', 'Сопровождают заказ до отгрузки.'],
      ].map(([Icon, title, text]) => { const TeamIcon = Icon as typeof Users; return <View key={String(title)} style={s.teamRow}><TeamIcon size={22} color={colors.brand} /><View style={s.grow}><Text style={s.h3}>{String(title)}</Text><P>{String(text)}</P></View></View>; })}</View>
    </>)}
    {section('range', <>
      <H>Оборудование для разных этапов работ</H>
      <P emphasis="Подбираем совместимые позиции">Подбираем совместимые позиции: оборудование, комплектующие и расходные элементы. Основные направления каталога:</P>
      <View style={s.groupGrid}>{productGroups.map(group => <View key={group.title} style={[s.productGroup, { width: wide ? '48.5%' : '100%' }]}><View style={s.groupHead}><CategoryPictogram name={group.category} size={29} /><H level={3}>{group.title}</H></View><P>{group.text}</P><View style={s.categoryLinks}>{group.ids.map(id => { const item = roots.find(root => root.id === id); return item && <Action key={id} title={item.name} route={{ pathname: '/catalog', params: { section: id } }} />; })}</View></View>)}</View>
      <Disclosure title={'Все разделы каталога · ' + roots.length} testID="about-all-categories">{roots.map(item => <Action key={item.id} title={item.name} route={{ pathname: '/catalog', params: { section: item.id } }} />)}</Disclosure>
    </>)}
    {section('clients', <>
      <H>Для кого мы работаем</H>
      <View style={s.clientList}>{aboutClients.map((item, i) => { const Icon = [Building2, Factory, FileCheck2, Store, Users][i]; return <View key={item.title} style={s.clientRow}><Icon size={24} color={colors.accent} /><View style={s.grow}><H level={3}>{item.title}</H><P>{item.text}</P></View></View>; })}</View>
    </>)}
    {section('channels', <>
      <H>Один поставщик — несколько форматов работы</H>
      <P>От прямого заказа и региональной розницы мы перешли к работе через интернет-магазин, партнёров, закупочные процедуры и экспорт.</P>
      <View testID="about-channels-diagram" style={s.channelList}>{aboutChannels.map((group, i) => { const Icon = [Store, Monitor, Globe2][i]; return <View key={group.title} style={s.channel}><View style={s.channelHead}><Icon size={25} color={colors.accent} /><H level={3}>{group.title}</H></View><View style={s.channelItems}>{group.items.map(item => <View key={item.title} style={s.channelItem}><Text style={s.itemTitle}>{item.title}</Text><P>{item.text}</P></View>)}</View></View>; })}</View>
      <View style={s.linksRow}><Action title="Для бизнеса" route="/information/business" /><Action title="Франшиза и партнёрство" route="/pages/franchise" /><Action title="Поставщикам" route="/pages/suppliers" /></View>
    </>)}
    {section('trust', <>
      <H>Наше оборудование на объектах</H>
      <P>Поставляем оборудование для нового строительства и реконструкции. Вот несколько проектов из нашей практики.</P>
      <View testID="about-projects" style={s.projectList}>{projects.map(project => <VerticalReveal key={project.id} style={s.project}><Image source={project.image} resizeMode="cover" accessibilityLabel={project.title} style={s.projectPhoto} /><View style={s.projectBody}><H level={3}>{project.title}</H><P>{project.text}</P><Action title={'Подробнее: ' + project.title} route={{ pathname: '/blog/[id]', params: { id: project.id } }} /></View></VerticalReveal>)}</View>
      <Action title="Все проекты и объекты" route="/blog?kind=projects" />
    </>)}
    {section('awards', <>
      <H>Деловая репутация в фактах</H>
      <View style={s.supplierAward}><Award size={32} color={colors.accent} /><View style={s.grow}><Text style={s.eyebrow}>ЗАКУПКИ И КОНТРАКТЫ</Text><H level={3}>Лучший поставщик года — 2024</H><P>ООО «Промышленник» — победитель конкурса.</P></View></View>
      <View style={s.awards}>{companyAwards.map(award => <View key={award.title} style={s.award}><Award size={28} color={colors.accent} /><View style={s.grow}><Text style={s.awardPlace}>{award.place}</Text><P>{award.title}</P></View></View>)}</View>
      <Action title="Все награды и дипломы" route="/pages/awards" />
      <P>На оборудование предоставляем паспорта, руководства и обязательные документы о соответствии — с учётом категории товара.</P>
      <Action title="Гарантия и документы на оборудование" route="/pages/warranty" />
    </>)}
    {section('network', <>
      <H>Рядом с вашими объектами</H>
      <P emphasis="более чем в десяти городах России">Развиваем филиалы, склады, франчайзинговые и партнёрские точки более чем в десяти городах России.</P>
      <View style={s.geography}><MapPin size={24} color={colors.accent} /><View style={s.grow}><H level={3}>Международные направления</H><P>Беларусь, Грузия, Армения, Казахстан и Узбекистан.</P></View></View>
      <VerticalReveal style={s.cover}><Image source={require('../../assets/company/branch-krasnodar.webp')} resizeMode="cover" accessibilityLabel="Склад Промышленника в Краснодаре" style={s.productionPhoto} /><View style={s.warehouseCaption}><Text style={s.warehouseNumber}>12 000 м²</Text><View style={s.grow}><Text style={s.h3}>Краснодарский склад</Text><Text style={s.caption}>Отгрузки по Югу России, Кавказу и в страны СНГ.</Text></View></View></VerticalReveal>
      <Disclosure title="Адреса и контакты филиалов" testID="about-branches">
        <View style={s.cities}>{Object.values(siteContacts).map(item => <Tap key={item.city} accessibilityRole="button" accessibilityLabel={'Филиал: ' + item.city} accessibilityState={{ selected: city === item.city }} aria-selected={city === item.city} onPress={() => setCity(item.city)} style={[s.city, { width: fontScale >= 1.4 ? '100%' : wide ? '31%' : '47%' }, city === item.city && s.citySelected]}><Text style={s.cityText}>{item.city}</Text></Tap>)}</View>
        <View testID="about-branch-detail" style={s.branchDetail}>{branchPhotos[city] && <Image source={branchPhotos[city]} resizeMode="cover" accessibilityLabel={'Филиал Промышленника: ' + city} style={s.branchPhoto} />}<H level={3}>{city}</H><P>{branch.address}</P>{branch.hours?.map(line => <Text key={line} style={s.caption}>{line}</Text>)}
          <Action title={branch.phoneLabel} onPress={() => { void open('tel:' + branch.phone, branch.phoneLabel); }} />
          <Action title="Построить маршрут" onPress={() => { void open(branch.mapUrl, branch.address); }} />
          {branch.email && <Action title={branch.email} onPress={() => { void open('mailto:' + branch.email, branch.email!); }} />}
        </View>
      </Disclosure>
      <Action title="Все контакты и графики работы" route="/information/contacts" />
    </>)}
    {section('contact', <View style={s.contact}><H>Начнём с вашей задачи</H><P>Пришлите спецификацию или опишите, какое оборудование вам нужно.</P><Action title="Получить предложение" primary route="/procurement?mode=list" /><Action title="Все форматы сотрудничества" route="/pages/cooperation" /><Action title={'Контакты компании · ' + supportPhoneLabel} route="/information/contacts" /><View style={s.linksRow}><Action title="Доставка" route="/information/delivery" /><Action title="Оплата" route="/information/payment" /></View></View>)}
    {error && <Text accessibilityRole="alert" style={s.body}>{error}</Text>}
  </View></VerticalScrollProvider>;
}
const s = StyleSheet.create({
  sectionTitleMark: { borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 12 }, emphasis: { color: colors.brand, fontWeight: '700' },
  detailPhoto: { width: '100%', height: 160 }, linksRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  flowRow: { flexDirection: 'row', gap: 16, paddingBottom: 14 }, flowIcon: { width: 28, alignItems: 'center', position: 'relative' }, flowLine: { position: 'absolute', width: 2, top: 32, bottom: -19, backgroundColor: colors.line },
  teamLead: { flexDirection: 'row', alignItems: 'center', gap: 20 }, teamNumber: { fontSize: 52, lineHeight: 58, fontWeight: '800', color: colors.accent, letterSpacing: -2 },
  teamRows: { gap: 18 }, teamRow: { flexDirection: 'row', gap: 15 },
  clientList: { borderRadius: 16, paddingHorizontal: 18, backgroundColor: colors.white }, clientRow: { flexDirection: 'row', gap: 14, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.line },
  channelList: { gap: 14 }, channel: { borderRadius: 16, backgroundColor: colors.white, overflow: 'hidden' }, channelHead: { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 18, backgroundColor: colors.pale }, channelItems: { padding: 18, gap: 18 }, channelItem: { gap: 5 }, itemTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700', color: colors.ink },
  warehouseCaption: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', padding: 18, gap: 15 }, warehouseNumber: { fontSize: 27, lineHeight: 34, fontWeight: '800', color: colors.accent },
  projectList: { gap: 22 }, projectBody: { padding: 18, gap: 8 }, supplierAward: { flexDirection: 'row', gap: 16, padding: 20, backgroundColor: '#FFF0E9', borderRadius: 16 },

  page: { gap: 36 }, section: { gap: 18 }, hero: { gap: 16 }, heading: { gap: 10 }, grow: { flex: 1, minWidth: 0, gap: 8 },
  eyebrow: { fontSize: 11, lineHeight: 17, letterSpacing: .8, fontWeight: '700', color: colors.brand },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '800', letterSpacing: -.5, color: colors.ink },
  h2: { fontSize: 25, lineHeight: 31, fontWeight: '800', letterSpacing: -.4, color: colors.brand },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: colors.ink, flexShrink: 1 },
  body: { fontSize: 15, lineHeight: 23, color: colors.ink }, caption: { fontSize: 12, lineHeight: 18, color: colors.muted },
  cover: { borderRadius: 16, overflow: 'hidden', backgroundColor: colors.white }, coverPhoto: { width: '100%', height: 185 }, photoCaption: { padding: 14, color: colors.muted, fontSize: 13, lineHeight: 19 }, productionPhoto: { width: '100%', height: 210 },
  navigation: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 7 },
  navLink: { minHeight: 44, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 2, borderColor: 'transparent', borderRadius: 8 }, navText: { fontSize: 13, lineHeight: 19, fontWeight: '600', color: colors.brand },
  metrics: { padding: 18, borderRadius: 16, backgroundColor: colors.white, gap: 15 }, metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: '5%', rowGap: 18 }, metric: { gap: 5 }, metricRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 14 }, metricValue: { fontSize: 25, lineHeight: 32, fontWeight: '800', color: colors.accent, letterSpacing: -.5 }, metricLabel: { fontSize: 13, lineHeight: 19, color: colors.ink },
  timeline: { padding: 18, paddingBottom: 0, borderRadius: 18, backgroundColor: colors.white }, milestone: { paddingLeft: 30, paddingBottom: 27, position: 'relative' }, milestoneBody: { gap: 8 }, timelineLine: { position: 'absolute', left: 6, top: 12, bottom: -12, width: 2, backgroundColor: '#F4C8BA' }, timelineDot: { position: 'absolute', left: 0, top: 7, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: colors.accent, backgroundColor: colors.white }, timelineDotLast: { backgroundColor: colors.accent }, year: { fontSize: 21, lineHeight: 28, fontWeight: '800', color: colors.accent },
  historyMedia: { marginTop: 5, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.background }, historyPhotoFrame: { width: '100%', aspectRatio: 16 / 9 }, historyPhoto: { width: '100%', height: '100%' }, historyCaption: { padding: 10, fontSize: 11, lineHeight: 17, color: colors.muted },
  process: { backgroundColor: colors.white, padding: 18, borderRadius: 16, gap: 14 },
  groupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, productGroup: { padding: 18, backgroundColor: colors.white, borderRadius: 16, gap: 13 }, groupHead: { flexDirection: 'row', alignItems: 'center', gap: 10 }, categoryLinks: { gap: 8, paddingTop: 8, marginTop: 'auto' },
  disclosure: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 12, overflow: 'hidden' }, disclosureButton: { minHeight: 54, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: 'transparent' }, disclosureBody: { borderTopWidth: 1, borderTopColor: colors.line, padding: 14, gap: 12 },
  geography: { flexDirection: 'row', alignItems: 'flex-start', gap: 13, padding: 18, borderRadius: 16, backgroundColor: colors.white },
  cities: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, city: { minHeight: 46, padding: 7, justifyContent: 'center', borderWidth: 2, borderColor: 'transparent', backgroundColor: colors.background, borderRadius: 8 }, citySelected: { backgroundColor: '#FFF0E9', borderColor: colors.accent }, cityText: { fontSize: 12, lineHeight: 18, color: colors.ink, textAlign: 'center' }, branchDetail: { paddingTop: 10, gap: 10 }, branchPhoto: { height: 165, width: '100%', borderRadius: 10 },
  project: { overflow: 'hidden', borderRadius: 16, backgroundColor: colors.white }, projectPhoto: { width: '100%', height: 220 }, awards: { paddingHorizontal: 18, backgroundColor: colors.white, borderRadius: 16 }, award: { paddingVertical: 18, flexDirection: 'row', gap: 12, borderBottomWidth: 1, borderBottomColor: colors.line }, awardPlace: { fontSize: 18, lineHeight: 24, fontWeight: '700', color: colors.accent },
  contact: { padding: 20, backgroundColor: '#EDF4F6', borderRadius: 18, gap: 16 }, action: { minHeight: 52, maxWidth: '100%', paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.pale, borderWidth: 2, borderColor: colors.line, borderRadius: 12 }, actionText: { fontSize: 14, lineHeight: 21, fontWeight: '600', color: colors.brand, flex: 1 }, primary: { backgroundColor: colors.accent, borderColor: colors.accent }, whiteAction: { backgroundColor: colors.white }, whiteText: { color: colors.white }, focus: { borderColor: colors.ink }, pressed: { opacity: .72 },
});
