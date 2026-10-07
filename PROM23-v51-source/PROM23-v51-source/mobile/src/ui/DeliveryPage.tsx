import React, { useRef, useState, type ReactNode, type RefObject } from 'react';
import { Animated, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowDown, ArrowRight, Box, Building2, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Container, CreditCard, FileText, MapPin, Navigation, Package, PackageCheck, Phone, Route, RotateCcw, Ruler, ShieldCheck, ShoppingBag, Truck, UserRound, Warehouse, Weight, type LucideIcon } from 'lucide-react-native';
import { useShop } from '../store';
import { settlementLabel } from '../location-domain';
import { siteContacts } from '../content/siteContent';
import { colors, type } from './theme';
import { palette } from './tokens';
import { LocationPicker } from './LocationPicker';
import { DeliveryWarehouses } from './DeliveryWarehouses';
import { VerticalReveal, VerticalScrollProvider } from './VerticalReveal';
import { useReducedMotion } from './useReducedMotion';

const methods = [
  { id: 'pickup', Icon: Warehouse, title: 'Самовывоз', text: 'Заберите заказ со склада ГК «Промышленник» после подтверждения готовности.' },
  { id: 'courier', Icon: Truck, title: 'Курьерская доставка', text: 'Получите заказ по указанному адресу или непосредственно на строительном объекте, если такой способ доступен для вашего региона и состава заказа.' },
  { id: 'pvz', Icon: PackageCheck, title: 'Пункт выдачи', text: 'Для подходящих по весу и габаритам заказов доступно получение в ПВЗ СДЭК или Яндекс Маркета.' },
  { id: 'freight', Icon: Container, title: 'Транспортная компания', text: 'Для междугородних, тяжёлых, длинномерных и крупногабаритных грузов — доставка до терминала перевозчика или до адреса.' },
] as const;
const factors: [LucideIcon, string][] = [[Weight, 'Вес'], [Box, 'Объём'], [Ruler, 'Габариты'], [Package, 'Количество грузовых мест'], [Warehouse, 'Склад отгрузки'], [MapPin, 'Населённый пункт назначения'], [Truck, 'Способ получения'], [CreditCard, 'Тариф перевозчика']];
const buyerTiles: [LucideIcon, string, string, Href][] = [
  [CreditCard, 'Оплата', 'Доступные способы оплаты заказа', '/information/payment'],
  [RotateCcw, 'Возврат', 'Условия возврата и оформление обращения', '/pages/returns'],
  [ShieldCheck, 'Гарантия', 'Гарантийные условия и документы', '/pages/warranty'],
  [UserRound, 'Личный кабинет', 'Заказы, обращения и сохранённые данные', '/account'],
  [FileText, 'Документы', 'Условия покупки, политика и согласия', '/pages/documents'],
  [CircleHelp, 'Вопросы', 'Ответы на частые вопросы', '/pages/faq'],
  [MapPin, 'Контакты', 'Филиалы, склады и способы связи', '/information/contacts'],
];
function P({ children }: { children: string }) { return <Text style={type.body}>{children}</Text>; }
function Heading({ children, level = 2 }: { children: string; level?: 2 | 3 | 4 }) {
  const title = <Text accessibilityRole="header" aria-level={level} style={level === 2 ? s.sectionTitle : level === 3 ? s.subsectionTitle : s.detailTitle}>{children}</Text>;
  return level === 2 ? <View style={s.sectionTitleMark}>{title}</View> : title;
}
function Action({ label, onPress, primary = false, Icon = ArrowRight, href }: { label: string; onPress: () => void; primary?: boolean; Icon?: LucideIcon; href?: string }) {
  return <Pressable accessibilityRole={href ? "link" : "button"} accessibilityLabel={label} {...(href ? { href } : {})} onPress={event => { if (href) event.preventDefault(); onPress(); }} style={({ pressed }) => [s.action, primary && s.primary, pressed && s.pressed]}><Text style={[type.label, { flex: 1, color: primary ? colors.white : colors.brand }]}>{label}</Text><Icon strokeWidth={1.8} size={20} color={primary ? colors.white : colors.brand} aria-hidden /></Pressable>;
}
function List({ items }: { items: string[] }) { return <View style={{ gap: 9 }}>{items.map(item => <View key={item} style={s.listRow}><Check strokeWidth={1.8} size={16} color={colors.brand} aria-hidden /><Text style={[type.body, { flex: 1 }]}>{item}</Text></View>)}</View>; }
function Flow({ items, testID, finalChoice }: { items: { Icon: LucideIcon; label: string }[]; testID: string; finalChoice?: string[] }) {
  return <View testID={testID} style={s.flow}>{items.map(({ Icon, label }, index) => <View key={label} style={s.flowRow}>
    {index < items.length - 1 && <View aria-hidden style={s.flowTrack}><VerticalReveal kind="line" testID="delivery-path-fill" style={s.flowFill} /></View>}
    <VerticalReveal kind="scale" delay={index * 20} style={s.flowNode}><Icon strokeWidth={1.8} size={19} color={colors.brand} aria-hidden /></VerticalReveal><VerticalReveal style={{ flex: 1 }} delay={index * 20}><Text style={type.label}>{label}</Text></VerticalReveal>
  </View>)}{finalChoice && <View style={s.fork}>{finalChoice.map((label, index) => <VerticalReveal key={label} kind="scale" delay={index * 40} style={s.forkOption}><ArrowDown strokeWidth={1.8} size={18} color={colors.brand} aria-hidden /><Text style={type.label}>{label}</Text></VerticalReveal>)}</View>}</View>;
}
function DeliveryMethod({ id, index, title, Icon, children, anchor, highlight }: { id: string; index: number; title: string; Icon: LucideIcon; children: ReactNode; anchor: (id: string) => (node: View | null) => void; highlight: string }) {
    return <View ref={anchor(id)} collapsable={false} testID={'delivery-' + id} style={[s.method, highlight === id && s.highlight]}>
      {index < 3 && <View aria-hidden style={s.methodTrack}><VerticalReveal kind="line" style={s.methodFill} testID="method-path-fill" /></View>}
      <View style={s.methodHeading}><VerticalReveal kind="scale" style={s.methodNode}><Icon strokeWidth={1.8} size={24} color={colors.brand} aria-hidden /></VerticalReveal><View style={{ flex: 1, gap: 4 }}><Text style={s.step}>СПОСОБ 0{index + 1}</Text><Heading level={3}>{title}</Heading></View></View>
      <View style={s.methodBody}>{children}</View>
    </View>;
  }

export function DeliveryPage({ scrollRef, scrollY }: { scrollRef: RefObject<ScrollView | null>; scrollY: Animated.Value }) {
  const router = useRouter(); const { state, ready, location } = useShop(); const { width } = useWindowDimensions();
  const reduced = useReducedMotion(); const [locationOpen, setLocationOpen] = useState(false); const [highlight, setHighlight] = useState('');
  const [callError, setCallError] = useState('');
  const anchors = useRef<Record<string, View | null>>({}); const highlightTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  React.useEffect(() => () => clearTimeout(highlightTimer.current), []);
  const lines = state.carts[state.context] ?? []; const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const jump = (id: string) => {
    const target = anchors.current[id]; const scroll = scrollRef.current;
    if (!target || !scroll) return;
    target.measureLayout(scroll.getInnerViewNode(), (_x, y) => {
      scroll.scrollTo({ y: Math.max(0, y - 12), animated: !reduced });
      setHighlight(id); clearTimeout(highlightTimer.current); highlightTimer.current = setTimeout(() => setHighlight(''), 1500);
    }, () => {});
  };
  const anchor = (id: string) => (node: View | null) => { anchors.current[id] = node; };
  return <VerticalScrollProvider value={scrollY}><View testID="delivery-page" style={s.page}>
    <View testID="delivery-hero" style={s.hero}>
      <View style={s.heroCopy}><VerticalReveal delay={0} kind="fade"><Text style={s.eyebrow}>ДОСТАВКА</Text></VerticalReveal><VerticalReveal delay={30}><Text accessibilityRole="header" aria-level={1} style={s.h1}>Выберите удобный способ получения</Text></VerticalReveal><VerticalReveal delay={60}><P>Доступные варианты зависят от населённого пункта, склада отгрузки, веса, габаритов и состава заказа. Подходящий способ подтверждается при оформлении.</P></VerticalReveal></View>
      <View style={s.methodGrid}>{methods.map(({ id, Icon, title, text }, index) => <VerticalReveal key={id} kind="scale" delay={index * 30} style={{ width: width < 350 ? '100%' : '48%', flexGrow: 1 }}><Pressable accessibilityRole="button" accessibilityLabel={'Способ получения: ' + title} onPress={() => jump(id)} style={({ pressed }) => [s.methodCard, pressed && s.pressed]}><View style={s.cardTop}><Icon size={27} strokeWidth={1.8} color={colors.brand} aria-hidden /><ArrowDown strokeWidth={1.8} size={18} color={colors.brand} aria-hidden /></View><Text style={type.subheading}>{title}</Text><Text style={type.caption}>{text}</Text></Pressable></VerticalReveal>)}</View>
    </View>
    <View testID="delivery-location" style={s.location}><MapPin strokeWidth={1.8} size={23} color={colors.brand} aria-hidden /><View style={{ flex: 1 }}><Text style={type.caption}>Получение в</Text><Pressable accessibilityRole="button" accessibilityLabel="Изменить населённый пункт получения" onPress={() => setLocationOpen(true)} style={s.locationAction}><Text style={[type.label, { flex: 1 }]}>{location?.settlement ? settlementLabel(location.settlement) : 'Выбрать населённый пункт'}</Text><ChevronDown strokeWidth={1.8} color={colors.brand} size={18} aria-hidden /></Pressable></View></View>
    <View style={{ gap: 24 }}><VerticalReveal><Heading>Подробнее о способах получения</Heading></VerticalReveal>
      <View>
        <DeliveryMethod anchor={anchor} highlight={highlight} id="pickup" index={0} title="Самовывоз" Icon={Warehouse}>
          <VerticalReveal><P>Заказ можно забрать самостоятельно с доступного склада или филиала компании.</P></VerticalReveal><Text style={type.label}>Перед поездкой необходимо подтвердить:</Text><List items={['склад отгрузки;', 'готовность заказа;', 'время получения;', 'правила въезда и погрузки.']} />
          <View style={s.note}><P>Не приезжайте за заказом без подтверждения: отдельные позиции могут находиться на другом складе или требовать подготовки к выдаче.</P></View>
          <P>На складах есть подъёмно-транспортное оборудование и персонал для погрузки. Склады расположены рядом с федеральными трассами.</P>
          <Action label="Посмотреть склады и филиалы" onPress={() => jump('warehouses')} Icon={MapPin} />
        </DeliveryMethod>
        <DeliveryMethod anchor={anchor} highlight={highlight} id="courier" index={1} title="Курьерская доставка" Icon={Truck}>
          <VerticalReveal><P>Курьерская доставка возможна до:</P></VerticalReveal><List items={['частного адреса;', 'офиса или склада организации;', 'строительного объекта;', 'другого согласованного адреса.']} />
          <P>Доступность зависит от региона, расстояния, веса и габаритов заказа.</P>
          <P>Для доставки на строительный объект заранее понадобятся точный адрес, желаемое время приёмки, информация об ограничениях на въезд и условиях разгрузки.</P>
          <View style={s.note}><P>В городах нахождения склада предусмотрен экспресс-курьер, в регионе склада — курьер. Яндекс Доставка также доставляет до двери.</P></View>
        </DeliveryMethod>
        <DeliveryMethod anchor={anchor} highlight={highlight} id="pvz" index={2} title="Пункты выдачи" Icon={PackageCheck}>
          <VerticalReveal><P>Для компактных заказов можно подобрать ПВЗ СДЭК или Яндекс Маркета.</P></VerticalReveal>
          <Text style={type.label}>При выборе пункта учитываются:</Text>
          <View testID="delivery-pvz-infographic" style={s.pvz}><Heading level={4}>ПВЗ подходит?</Heading><ArrowDown strokeWidth={1.8} size={20} color={colors.brand} aria-hidden /><View style={s.factorGrid}>{[[Warehouse, 'склад отгрузки'], [Weight, 'вес'], [Ruler, 'размеры упаковки'], [Box, 'общий объём'], [Package, 'количество грузовых мест'], [ShieldCheck, 'ограничения конкретного ПВЗ']].map(([Icon, label], index) => { const Symbol = Icon as LucideIcon; return <VerticalReveal key={String(label)} delay={index * 20} kind="scale" style={s.pvzFactor}><Symbol strokeWidth={1.8} size={21} color={colors.brand} aria-hidden /><Text style={[type.label, { flexShrink: 1 }]}>{String(label)}</Text></VerticalReveal>; })}</View><Text style={type.caption}>Длина входит в размеры упаковки.</Text><ArrowDown strokeWidth={1.8} size={20} color={colors.brand} aria-hidden /><Text style={type.subheading}>Подтверждение доступного ПВЗ</Text></View>
          <P>Строительные леса, опалубка, длинномерные элементы и другое крупногабаритное оборудование могут превышать допустимые параметры пункта выдачи.</P>
          <P>Поэтому конкретный ПВЗ, возможность приёмки, срок и стоимость подтверждаются после проверки состава заказа.</P>
        </DeliveryMethod>
        <DeliveryMethod anchor={anchor} highlight={highlight} id="freight" index={3} title="Транспортная компания" Icon={Route}>
          <VerticalReveal><P>Для тяжёлого, длинномерного и крупногабаритного оборудования транспортная компания обычно является наиболее подходящим вариантом междугородней доставки.</P></VerticalReveal><P>Получить заказ можно двумя способами:</P>
          <View style={s.destinations}><View style={s.destination}><Warehouse strokeWidth={1.8} size={22} color={colors.brand} aria-hidden /><Heading level={4}>До терминала</Heading><P>Груз отправляется в терминал транспортной компании в вашем городе, откуда вы забираете его самостоятельно.</P></View><View style={s.destination}><Building2 strokeWidth={1.8} size={22} color={colors.brand} aria-hidden /><Heading level={4}>До адреса</Heading><P>Если перевозчик оказывает такую услугу, груз можно доставить от терминала непосредственно по указанному адресу или на строительный объект.</P></View></View>
          <P>Транспортная компания и вариант получения согласовываются при оформлении заказа.</P>
          <Flow testID="delivery-freight-route" items={[{ Icon: Warehouse, label: 'Склад «Промышленника»' }, { Icon: Package, label: 'Терминал ТК в городе отправления' }, { Icon: Truck, label: 'Междугородняя перевозка' }, { Icon: MapPin, label: 'Терминал в городе получателя' }]} finalChoice={['Самовывоз', 'Доставка до адреса']} />
        </DeliveryMethod>
      </View>
    </View>
    <View testID="delivery-cost" style={s.section}><VerticalReveal><Heading>Стоимость и сроки</Heading></VerticalReveal><Heading level={3}>Как рассчитывается стоимость доставки</Heading><P>Стоимость зависит от параметров конкретного заказа:</P>
      <View style={s.factorGrid}>{factors.map(([Icon, label], index) => <VerticalReveal key={label} kind="scale" delay={index * 20} style={s.factor}><Icon size={25} color={colors.brand} strokeWidth={1.8} aria-hidden /><Text style={type.label}>{label}</Text></VerticalReveal>)}</View>
      <P>Поэтому для строительного оборудования нельзя установить единую стоимость доставки заранее.</P>
      <Text style={type.body}>Счёт за товар и доставку выставляется, а оплата производится после согласования всех деталей. Услуги ТК оплачиваются отдельно при получении по условиям перевозчика.</Text>
      <View testID="delivery-payers" style={{ gap: 16, paddingTop: 24 }}><Heading level={3}>Доставка транспортной компанией</Heading>
        <P>Подвоз заказа со склада «Промышленника» до терминала выбранной транспортной компании в городе отправления — бесплатный.</P>
        <View style={s.payers}>
          <VerticalReveal testID="delivery-company-pays" kind="fade" style={[s.payerCard, s.companyPays]}>
            <View style={s.payerHeader}><Warehouse strokeWidth={1.8} color={colors.white} size={24} aria-hidden style={s.payerIcon} /><Text style={[type.label, s.white, s.payerTitle]}>ГК «Промышленник»</Text></View>
            <Text style={[type.body, s.white]}>Склад → терминал ТК</Text>
            <View style={s.payerRate}><Text style={[s.priceLabel, s.white]}>БЕСПЛАТНО</Text></View>
          </VerticalReveal>
          <VerticalReveal testID="delivery-buyer-pays" kind="fade" style={[s.payerCard, s.buyerPays]}>
            <View style={s.payerHeader}><Truck strokeWidth={1.8} color={colors.brand} size={24} aria-hidden style={s.payerIcon} /><Text style={[type.label, s.payerTitle]}>Покупатель</Text></View>
            <Text style={type.body}>Междугородняя перевозка{ '\n' }+ дополнительные услуги ТК</Text>
            <View style={s.payerRate}><Text style={[s.priceLabel, { color: colors.brand }]}>ПО ТАРИФУ ПЕРЕВОЗЧИКА</Text></View>
          </VerticalReveal>
        </View>
        <P>Междугороднюю перевозку, доставку от терминала до адреса и дополнительные услуги перевозчика покупатель оплачивает отдельно по тарифам транспортной компании.</P>
      </View>
      <View style={s.ownTransport}><Truck strokeWidth={1.8} size={27} color={colors.brand} aria-hidden /><Heading level={3}>Доставка транспортом компании</Heading><P>Если для заказа доступна доставка собственным транспортом «Промышленника», её условия и стоимость согласовываются до оформления.</P><P>Если для конкретной поставки предусмотрена бесплатная доставка, это также будет подтверждено заранее.</P></View>
      <View testID="delivery-timing" style={s.section}><Heading level={3}>От чего зависит срок получения</Heading><P>Срок зависит от:</P><Flow testID="delivery-time-flow" items={[{ Icon: PackageCheck, label: 'наличия товаров' }, { Icon: Warehouse, label: 'склада отгрузки' }, { Icon: Truck, label: 'выбранного способа получения' }, { Icon: MapPin, label: 'населённого пункта' }, { Icon: CalendarDays, label: 'графика перевозчика' }, { Icon: Clock3, label: 'Срок получения' }]} /><P>Если все позиции находятся на одном складе, заказ можно подготовить к отправке быстрее.</P><P>Если товары находятся на разных складах, может потребоваться перемещение между складами или несколько отдельных отправлений. Удобный вариант согласовывается при оформлении.</P></View>
    </View>
    <View testID="delivery-construction" style={s.construction}><Heading>Доставка на строительный объект</Heading><P>Для доставки непосредственно на стройплощадку заранее сообщите:</P>
      <View testID="delivery-construction-list" role="list" style={s.constructionList}>{['точный адрес', 'контактное лицо', 'желаемое время приёмки', 'ограничения на въезд', 'необходимость оформления пропуска', 'условия подъезда', 'условия разгрузки'].map((label, index) => <VerticalReveal key={label} delay={index * 20} kind="fade"><View role="listitem" style={s.constructionItem}><View aria-hidden accessible={false} style={s.listBullet} /><Text style={[type.body, { flex: 1 }]}>{label}</Text></View></VerticalReveal>)}</View>
      <P>Эта информация особенно важна при поставке крупногабаритного оборудования и использовании грузового транспорта.</P><P>Если товары находятся на разных складах, согласуем объединённую или раздельную отгрузку.</P>
    </View>
    <VerticalReveal testID="delivery-cart" style={s.cart}><ShoppingBag strokeWidth={1.8} size={30} color={colors.brand} aria-hidden />{ready ? count > 0 ? <><Heading>Перейдите к оформлению</Heading><P>Выберите в корзине товары, которые хотите заказать сейчас. Остальные позиции можно оставить на потом.</P><Text testID="delivery-cart-count" style={type.label}>В корзине: {count} {count % 10 === 1 && count % 100 !== 11 ? 'товар' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'товара' : 'товаров'}</Text></> : <><Heading>Выберите товары для оформления</Heading><P>Способ получения, стоимость и срок определяются для конкретного состава заказа.</P><P>В корзине можно выбрать все товары или только часть позиций, которые вы хотите оформить сейчас. После выбора переходите к оформлению — условия доставки будут определяться именно для выбранных товаров с учётом их веса, габаритов, склада отгрузки и населённого пункта.</P></> : <Text accessibilityLiveRegion="polite" style={type.body}>Загружаем корзину…</Text>}<Action label="Открыть корзину" primary onPress={() => router.push('/cart')} /></VerticalReveal>
    <View ref={anchor('warehouses')} collapsable={false} testID="delivery-warehouse-section" style={[s.section, highlight === 'warehouses' && s.highlight]}><VerticalReveal><Heading>Склады и филиалы</Heading></VerticalReveal><Heading level={3}>Выберите удобную точку</Heading><P>Самовывоз доступен из действующих складов и филиалов компании.</P><DeliveryWarehouses /></View>
    <VerticalReveal testID="delivery-manager" style={s.manager}><Phone strokeWidth={1.8} size={28} color={colors.brand} aria-hidden /><Heading>Нужна помощь с доставкой?</Heading><P>Поможем уточнить склад отгрузки и подобрать подходящий способ получения.</P><Text style={type.subheading}>{siteContacts['Краснодар'].phoneLabel}</Text><Action label="Позвонить менеджеру" href={'tel:' + siteContacts['Краснодар'].phone} Icon={Phone} onPress={() => { setCallError(''); void Linking.openURL('tel:' + siteContacts['Краснодар'].phone).catch(() => setCallError('Наберите ' + siteContacts['Краснодар'].phoneLabel)); }} />{!!callError && <Text accessibilityRole="alert" style={type.body}>{callError}</Text>}</VerticalReveal>
    <View testID="delivery-buyer" style={s.section}><VerticalReveal><Heading>Покупателю</Heading></VerticalReveal><View style={s.buyerGrid}>{buyerTiles.map(([Icon, title, caption, route], index) => <VerticalReveal key={title} kind="scale" delay={index * 25} style={{ width: '48%' }}><Pressable accessibilityRole="link" accessibilityLabel={title} onPress={() => router.push(route)} style={({ pressed }) => [s.buyerTile, pressed && s.pressed]}><View style={s.cardTop}><Icon strokeWidth={1.8} color={colors.brand} size={23} aria-hidden /><ChevronRight strokeWidth={1.8} color={colors.brand} size={18} aria-hidden /></View><Text style={type.subheading}>{title}</Text><Text style={type.caption}>{caption}</Text></Pressable></VerticalReveal>)}</View></View>
    <LocationPicker visible={locationOpen} onClose={() => setLocationOpen(false)} />
  </View></VerticalScrollProvider>;
}
const s = StyleSheet.create({
  page: { gap: 40 }, section: { gap: 18 },
  sectionTitleMark: { borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 12 }, sectionTitle: { color: colors.brand, fontSize: 25, lineHeight: 31, fontWeight: '800', letterSpacing: -.4 }, subsectionTitle: { color: colors.ink, fontSize: 20, lineHeight: 26, fontWeight: '700', marginTop: 4, marginBottom: 2 }, detailTitle: { color: colors.brand, fontSize: 17, lineHeight: 24, fontWeight: '700' }, hero: { gap: 12 }, heroCopy: { backgroundColor: colors.pale, padding: 20, borderRadius: 20, gap: 12 },
  eyebrow: { color: colors.brand, fontWeight: '700', letterSpacing: 1.6, fontSize: 11, lineHeight: 17 }, h1: { ...type.title, fontSize: 28, lineHeight: 33 },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, methodCard: { flex: 1, padding: 16, gap: 10, backgroundColor: colors.white, borderRadius: 16, borderBottomWidth: 3, borderBottomColor: colors.pale }, cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  location: { padding: 16, backgroundColor: palette.cyan100, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, locationAction: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  method: { paddingBottom: 36, paddingTop: 4, borderRadius: 12 }, highlight: { backgroundColor: palette.orange100 }, methodHeading: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingBottom: 18 }, methodNode: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' }, step: { ...type.caption, fontSize: 10, letterSpacing: 1, color: colors.brand }, methodBody: { paddingLeft: 30, gap: 16 }, methodTrack: { position: 'absolute', left: 10, top: 66, bottom: 10, width: 2, backgroundColor: colors.line }, methodFill: { width: 2, height: '100%', backgroundColor: colors.brand },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, note: { padding: 14, borderLeftWidth: 3, borderLeftColor: colors.brand, backgroundColor: colors.pale, gap: 10 }, action: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }, primary: { backgroundColor: colors.accent }, pressed: { opacity: .7 },
  pvz: { padding: 16, backgroundColor: palette.cyan100, borderRadius: 16, gap: 14 }, factorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, factor: { width: '48%', flexGrow: 1, backgroundColor: colors.white, borderRadius: 14, padding: 16, minHeight: 105, gap: 12 }, pvzFactor: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, width: '100%', paddingVertical: 4 },
  destinations: { gap: 16 }, destination: { gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line, paddingBottom: 16 },
  flow: { gap: 0, padding: 16, borderRadius: 16, backgroundColor: colors.pale }, flowRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 14, paddingBottom: 16 }, flowNode: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white }, flowTrack: { position: 'absolute', width: 2, backgroundColor: colors.line, left: 17, top: 34, bottom: -6 }, flowFill: { width: 2, height: '100%', backgroundColor: colors.brand }, fork: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: colors.brand, paddingTop: 10 }, forkOption: { flex: 1, gap: 9 },
  payers: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'stretch' }, payerCard: { flexBasis: 260, flexGrow: 1, flexShrink: 1, padding: 18, borderRadius: 16, gap: 12 }, companyPays: { backgroundColor: colors.brand }, buyerPays: { backgroundColor: colors.pale }, payerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 28 }, payerTitle: { flex: 1 }, payerIcon: { flexShrink: 0 }, payerRate: { marginTop: 'auto', paddingTop: 4, minHeight: 50, justifyContent: 'flex-end' }, priceLabel: { fontSize: 15, lineHeight: 22, fontWeight: '800', letterSpacing: .2 }, white: { color: colors.white }, ownTransport: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 20, gap: 14 },
  construction: { borderRadius: 20, padding: 18, backgroundColor: colors.white, gap: 16 }, constructionList: { gap: 8 }, constructionItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, listBullet: { width: 5, height: 5, marginTop: 9, borderRadius: 3, backgroundColor: colors.brand, flexShrink: 0 },
  cart: { gap: 16, borderTopWidth: 3, borderTopColor: colors.accent, padding: 20, borderRadius: 16, backgroundColor: colors.white }, manager: { gap: 14, padding: 20, borderRadius: 20, backgroundColor: palette.cyan100 }, buyerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, buyerTile: { flex: 1, padding: 14, minHeight: 155, gap: 10, borderRadius: 14, backgroundColor: colors.white },
});
