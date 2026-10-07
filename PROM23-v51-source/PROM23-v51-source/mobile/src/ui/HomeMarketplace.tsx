import React, { useId, useMemo, useState } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowRight, ArrowUpRight, Pause, Play, Award, Building2, Phone, ChevronRight, CreditCard, Factory, FileText, Globe2, History, MapPin, Package, ShieldCheck, Sparkles, Truck, UserRound } from 'lucide-react-native';
import { useShop } from '../store';
import { formatMoney } from '../domain';
import type { CatalogSection } from '../catalog-tree';
import { blogArticles, blogImages } from '../content/blogContent';
import { getSiteContact, supportPhone, supportPhoneLabel } from '../content/siteContent';
import { CategoryPictogram } from './CategoryPictogram';
import { ProductPhoto } from './ProductPhoto';
import { Reveal } from './Reveal';
import { useBannerCarousel } from './useBannerCarousel';
import { Button } from './primitives';
import { colors, layout, type } from './theme';
import { palette } from './tokens';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

// Home-only presentation: links reuse the store's existing screens and forms.
const banners = [
  { label: 'Оборудование', title: 'Леса, вышки, станки,\nопалубка, инструменты', text: 'Для ремонта, стройки\nи производства', cta: 'Выбрать в каталоге', route: '/catalog', image: require('../../assets/brand/construction-hero-wide-v20.png'), alt: 'Строительная площадка: опалубка, стойки и бадья для бетона', gradient: ['#122F43', '#246E82'], tag: 'ДЛЯ СЕБЯ И БИЗНЕСА' },
  { label: 'Производство', title: 'Производим\nпод вашу задачу', text: 'По чертежам, размерам\nи техническому заданию', cta: 'Наше производство', route: '/information/production', image: require('../../assets/brand/factory-wide.webp'), alt: 'Цех собственного производства', gradient: ['#292C2E', '#706354'], tag: 'СОБСТВЕННОЕ ПРОИЗВОДСТВО' },
  { label: 'Проекты', title: 'Оснащаем объекты\nпод ключ', text: 'От подбора оборудования\nдо комплексной поставки', cta: 'Смотреть проекты', route: '/blog?kind=projects', image: require('../../assets/blog/gallery-moscow-city-02.jpg'), alt: 'Оборудование на строительном объекте Москва-Сити', gradient: ['#18354B', '#326B8C'], tag: 'ПРОЕКТЫ НАШИХ КЛИЕНТОВ' },
] as const;
export function MarketplaceHero() {
  const carousel = useBannerCarousel(banners.length); const { index } = carousel; const router = useRouter();
  const { state, products } = useShop(); const { width, fontScale } = useWindowDimensions();
  const gradientId = useId().replace(/:/g, '');
  const banner = banners[index]; const largeText = fontScale > 1.4; const narrow = width < 360;
  const lines = state.carts[state.context]; const first = products.find(p => p.id === lines[0]?.productId);
  const count = lines.reduce((n, line) => n + line.quantity, 0);
  const total = lines.reduce((n, line) => n + (products.find(p => p.id === line.productId)?.priceKopecks ?? 0) * line.quantity, 0);
  return <View testID="home-hero" onPointerEnter={event => { if (event.nativeEvent.pointerType === 'mouse') carousel.setHovered(true); }} onPointerLeave={() => carousel.setHovered(false)} style={{ gap: 10 }}>
    <View testID="home-banner" ref={carousel.bannerRef} {...carousel.panHandlers} onTouchStart={() => carousel.setTouching(true)} onTouchEnd={() => carousel.setTouching(false)} onTouchCancel={() => carousel.setTouching(false)} style={[s.hero, { backgroundColor: banner.gradient[0] }, Platform.OS === 'web' && ({ touchAction: 'pan-y' } as ViewStyle)]}>
      <Image testID="home-banner-photo" source={banner.image} accessibilityLabel={banner.alt} style={[s.heroImage, width < 500 && { width: '150%' }]} resizeMode="cover" />
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden testID="home-banner-gradient" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%" accessible={false}>
          <Defs><LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="30%">
            <Stop offset="0%" stopColor={banner.gradient[0]} stopOpacity={1} />
            <Stop offset="42%" stopColor={banner.gradient[1]} stopOpacity={0.98} />
            <Stop offset="70%" stopColor={banner.gradient[0]} stopOpacity={largeText ? 0.96 : 0.78} />
            <Stop offset="100%" stopColor={banner.gradient[1]} stopOpacity={largeText ? 0.94 : 0.06} />
          </LinearGradient></Defs><Rect width="100%" height="100%" fill={'url(#' + gradientId + ')'} />
        </Svg>
      </View>
      <View testID="home-banner-copy" style={[s.heroCopy, { width: largeText ? '100%' : width < 500 ? '76%' : '66%', minHeight: width < 500 ? 310 : 250 }]}>
        <Text style={s.heroTag}>{banner.tag}</Text>
        <Reveal key={index}><View style={{ gap: 8 }}><Text accessibilityRole="header" aria-level={1} style={[s.heroTitle, width < 500 && { fontSize: narrow ? 20 : 23, lineHeight: narrow ? 25 : 28 }]}>{banner.title}</Text><Text style={s.heroText}>{banner.text}</Text></View></Reveal>
        <Pressable accessibilityRole="button" onFocus={() => carousel.setControlFocused(Platform.OS === 'web' && document.activeElement?.matches(':focus-visible') === true)} onBlur={() => carousel.setControlFocused(false)} onPress={() => router.push(banner.route as Href)} style={({ pressed }) => [s.heroCta, pressed && s.pressed]}><Text style={[type.label, { color: colors.white, flexShrink: 1 }]}>{banner.cta}</Text><ArrowRight size={17} color={colors.white} /></Pressable>
      </View>
    </View>
    <View style={layout.between}><Text style={[type.caption, { color: colors.brand, fontWeight: '600', flex: 1 }]}>Работаем с 2008 года</Text><View style={layout.row}>{banners.map((item, i) => <Pressable key={item.label} accessibilityRole="tab" accessibilityLabel={'Баннер: ' + item.label} accessibilityState={{ selected: index === i }} aria-selected={index === i} onFocus={() => carousel.setControlFocused(Platform.OS === 'web' && document.activeElement?.matches(':focus-visible') === true)} onBlur={() => carousel.setControlFocused(false)} onPress={() => carousel.select(i)} style={s.dotTarget}><View style={[s.dot, index === i && { backgroundColor: colors.accent, width: 19 }]} /></Pressable>)}<Pressable accessibilityRole="button" accessibilityLabel={carousel.playing ? 'Приостановить смену баннеров' : 'Включить смену баннеров'} onPress={carousel.togglePlaying} style={[s.dotTarget, { minWidth: 44 }]}>{carousel.playing ? <Pause size={16} color={colors.brand} /> : <Play size={16} color={colors.brand} />}</Pressable></View></View>
    <View style={{ flexDirection: 'row', gap: 6 }}>{[{ Icon: Truck, title: 'Доставка', route: '/information/delivery' }, { Icon: CreditCard, title: 'Оплата', route: '/information/payment' }, { Icon: MapPin, title: 'Контакты', route: '/information/contacts' }].map(item => <Pressable key={item.title} accessibilityRole="button" onPress={() => router.push(item.route as Href)} style={({ pressed }) => [layout.row, { flex: 1, justifyContent: 'center', gap: 5, minHeight: 44, backgroundColor: colors.pale, borderRadius: 10 }, pressed && s.pressed]}><item.Icon size={16} color={colors.brand} /><Text style={[type.caption, { color: colors.brand, fontWeight: '600' }]}>{item.title}</Text></Pressable>)}</View>
    {!!count && <Pressable accessibilityRole="button" accessibilityLabel="Продолжить оформление корзины" onPress={() => router.push('/cart')} style={({ pressed }) => [s.cart, pressed && s.pressed]}>{first && <ProductPhoto product={first} style={{ width: 38, height: 38, borderRadius: 8 }} />}<View style={{ flex: 1 }}><Text style={type.label}>В корзине {count} ед. · {formatMoney(total)}</Text><Text style={[type.caption, { color: colors.accent }]}>Продолжить оформление</Text></View><ArrowRight size={19} color={colors.accent} /></Pressable>}
  </View>;
}
export function MarketplaceCategories({ roots, onChoose }: { roots: CatalogSection[]; onChoose: (section: CatalogSection) => void }) {
  const router = useRouter(); const { width, fontScale } = useWindowDimensions();
  const ordered = useMemo(() => [...roots].sort((a,b) => Number(b.name === 'Леса') - Number(a.name === 'Леса')), [roots]);
  const columns = Array.from({ length: Math.ceil(ordered.length / 2) }, (_, i) => ordered.slice(i * 2, i * 2 + 2));
  const tileWidth = fontScale > 1.4 ? 180 : 132;
  return <View testID="home-categories" style={{ gap: 10 }}><SectionTitle title="Каталог" action="Все разделы" onPress={() => router.push('/catalog')} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }} accessibilityLabel="Категории товаров">{columns.map((column, index) => <View key={index} style={{ gap: 8 }}>{column.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={'Раздел каталога: ' + item.name} onPress={() => onChoose(item)} style={({ pressed }) => [s.category, { width: tileWidth, backgroundColor: item.name === 'Леса' ? palette.orange100 : colors.background }, pressed && s.pressed]}><Text numberOfLines={3} style={s.categoryName}>{item.name}</Text><View style={{ alignSelf: 'flex-end' }}><CategoryPictogram name={item.name} size={44} /></View></Pressable>)}</View>)}</ScrollView>
  </View>;
}
export function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={[layout.between, { gap: 8 }]}><Text accessibilityRole="header" aria-level={2} style={[s.title, { flex: 1 }]}>{title}</Text>{onPress && <Pressable accessibilityRole="button" accessibilityLabel={action ?? title} onPress={onPress} style={[layout.row, { minHeight: 44, gap: 4 }]}>{action && <Text style={[type.caption, { color: colors.brand, fontWeight: '600' }]}>{action}</Text>}<ArrowRight size={19} color={colors.accent} /></Pressable>}</View>;
}
export function PersonalShopping() {
  const router = useRouter();
  return <View testID="home-buyer-benefits" style={[s.audience, { backgroundColor: palette.cyan100 }]}>
    <View style={layout.between}><Text style={[s.eyebrow, { color: palette.cyan700 }]}>ДЛЯ ЛИЧНЫХ ПОКУПОК</Text><UserRound size={24} color={palette.cyan700} /></View>
    <Text accessibilityRole="header" aria-level={2} style={s.audienceTitle}>Покупайте для себя</Text><Text style={type.body}>Для дома, мастерской и ремонта. Выберите оборудование и удобный способ получения.</Text>
    <View style={s.benefitGrid}>{[{ Icon: CreditCard, title: 'Оплата частями', text: 'Яндекс Сплит', route: '/information/payment' }, { Icon: Sparkles, title: 'Баллы Плюса', text: 'Условия Яндекс Пэй', route: '/information/payment' }, { Icon: Truck, title: 'Доставка', text: 'До двери или в ПВЗ', route: '/information/delivery' }, { Icon: ShieldCheck, title: 'После покупки', text: 'Гарантия и возврат', route: '/pages/returns' }].map(item => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={item.title + '. ' + item.text} onPress={() => router.push(item.route as Href)} style={({ pressed }) => [s.benefit, pressed && s.pressed]}><item.Icon size={21} color={palette.cyan700} /><Text style={type.label}>{item.title}</Text><Text style={type.caption}>{item.text}</Text></Pressable>)}</View>
    <Text style={type.caption}>Доступные способы и персональные условия зависят от заказа и предложения сервиса.</Text>
  </View>;
}
export function BusinessShopping() {
  const router = useRouter(); const { width } = useWindowDimensions();
  return <View testID="home-business" style={{ backgroundColor: colors.background, borderRadius: 18, padding: 18, gap: 16 }}>
    <View style={layout.between}><Text style={[s.eyebrow, { color: colors.accent }]}>ДЛЯ КОМПАНИЙ И ИП</Text><Building2 size={22} color={colors.accent} /></View>
    <View style={{ gap: 8 }}><Text accessibilityRole="header" aria-level={2} style={s.title}>Снабжение вашего бизнеса</Text><Text style={[type.body, { fontSize: 14, lineHeight: 21 }]}>Соберём оборудование и материалы для объекта. Подготовим предложение по вашей спецификации.</Text></View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>{[{ Icon: FileText, text: 'Коммерческое предложение' }, { Icon: Package, text: 'Резерв товара' }, { Icon: Truck, text: 'Доставка на объект' }, { Icon: ShieldCheck, text: 'Документы и ЭДО' }].map(({ Icon, text }) => <View key={text} style={{ width: width < 360 ? '100%' : '47%', flexDirection: 'row', alignItems: 'center', gap: 8 }}><Icon size={18} color={colors.muted} /><Text style={[type.body, { flex: 1, fontSize: 14, lineHeight: 20 }]}>{text}</Text></View>)}</View>
    <Button label="Отправить заявку на просчёт" style={width >= 500 ? { alignSelf: 'flex-start' } : undefined} onPress={() => router.push({ pathname: '/procurement', params: { mode: 'list' } })} />
    <View style={{ gap: 8 }}>{[{ label: 'Все возможности для бизнеса', route: '/information/business' }, { label: 'Нужен подбор оборудования', route: '/procurement?mode=selection' }].map(item => <Pressable key={item.label} accessibilityRole="button" onPress={() => router.push(item.route as Href)} style={({ pressed }) => [layout.between, { minHeight: 48, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderRadius: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }, pressed && s.pressed]}><Text style={[type.label, { flex: 1 }]}>{item.label}</Text><ArrowRight size={18} color={colors.accent} /></Pressable>)}</View>
  </View>;
}
export function ManufacturerStory() {
  const router = useRouter();
  const facts = [{ Icon: History, title: 'С 2008 года', text: 'История компании', route: '/pages/about' }, { Icon: Award, title: 'Наши награды', text: '«Экспортёр года»', route: '/pages/awards' }, { Icon: Globe2, title: 'Экспорт', text: 'СНГ, Азия, Африка', route: '/pages/about' }];
  return <View testID="home-company" style={{ gap: 14 }}><SectionTitle title="Собственное производство" /><Pressable accessibilityRole="button" accessibilityLabel="Посмотреть собственное производство" onPress={() => router.push('/information/production')} style={({ pressed }) => [s.production, pressed && s.pressed]}><Image source={require('../../assets/brand/factory-wide.webp')} accessibilityLabel="Производственный цех в Краснодарском крае" style={{ width: '100%', height: 170 }} resizeMode="cover" /><View style={{ padding: 16, gap: 8 }}><View style={layout.between}><Factory size={23} color={colors.accent} /><ArrowUpRight size={23} color={colors.brand} /></View><Text style={s.title}>От чертежа до готовой продукции</Text><Text style={type.body}>Серийное производство строительных лесов, вышек-тур, подмостей, комплектующих для опалубки, оборудования для работы с бетоном, измерительных инструментов. Дополнительно изготавливаем индивидуальную продукцию по техническому заданию заказчиков.</Text></View></Pressable><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{facts.map(({ Icon, title, text, route }) => <Pressable key={title} accessibilityRole="button" onPress={() => router.push(route as Href)} style={({ pressed }) => [s.fact, pressed && s.pressed]}><View style={layout.between}><Icon size={22} color={colors.white} /><ArrowUpRight size={18} color={colors.white} /></View><Text style={[type.label, { color: colors.white }]}>{title}</Text><Text style={[type.caption, { color: colors.white }]}>{text}</Text></Pressable>)}</ScrollView><Button label="Обсудить изготовление" variant="secondary" onPress={() => router.push('/forms/production-request')} /></View>;
}
export function HomeReading() {
  const router = useRouter(); const articles = blogArticles.filter(a => a.kind === 'articles').slice(0, 5);
  return <View style={{ gap: 12 }}><SectionTitle title="Советы по выбору и работе" action="Блог" onPress={() => router.push('/blog')} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>{articles.map(article => <Pressable key={article.id} accessibilityRole="button" accessibilityLabel={'Читать: ' + article.title} onPress={() => router.push({ pathname: '/blog/[id]', params: { id: article.id } })} style={({ pressed }) => [{ width: 230, gap: 10 }, pressed && s.pressed]}>{blogImages[article.id] && <Image source={blogImages[article.id]} style={{ width: 230, height: 136, borderRadius: 14 }} resizeMode="cover" accessible={false} />}<Text style={type.label} numberOfLines={3}>{article.title}</Text><Text style={type.caption}>{article.readTime ?? 'Инструкция'} · Читать →</Text></Pressable>)}</ScrollView><View style={layout.row}><Button label="Проекты" variant="quiet" onPress={() => router.push('/blog?kind=projects')} /><Button label="Видео" variant="quiet" onPress={() => router.push('/blog?kind=video')} /></View></View>;
}
export function AccountInvitation() {
  const router = useRouter(); const { state } = useShop(); const business = state.context !== 'personal';
  return <View testID="home-account-invitation" style={[s.audience, { backgroundColor: colors.pale }]}><UserRound size={26} color={colors.brand} /><Text accessibilityRole="header" aria-level={2} style={s.audienceTitle}>{business ? 'Закупки под контролем' : 'Ваши покупки — под рукой'}</Text><Text style={type.body}>{business ? 'Организации, заказы и документы собраны в личном кабинете.' : 'Сохраняйте нужное и возвращайтесь к своим заказам в личном кабинете.'}</Text><View style={{ gap: 10 }}>{(business ? ['Реквизиты и адреса организаций', 'Счета, УПД и акты сверки', 'Заказы и обращения'] : ['История и состояние заказов', 'Сохранённые адреса доставки', 'Избранное, документы и обращения']).map(text => <View key={text} style={[layout.row, { gap: 8 }]}><Package size={16} color={colors.brand} /><Text style={[type.label, { flex: 1 }]}>{text}</Text></View>)}</View><Button label="Открыть личный кабинет" icon={<ArrowRight size={20} color={colors.white} />} onPress={() => router.push('/account')} /></View>;
}
const s = StyleSheet.create({
  title: { ...type.heading, fontSize: 21, lineHeight: 26 },
  hero: { minHeight: 210, backgroundColor: colors.brand, borderRadius: 20, overflow: 'hidden' },
  heroImage: { position: 'absolute', right: 0, top: 0, width: '100%', height: '100%' },
  heroCopy: { padding: 18, paddingRight: 10, gap: 13, justifyContent: 'space-between' },
  heroTag: { color: colors.white, fontSize: 9, lineHeight: 13, fontWeight: '600', letterSpacing: 0.5 },
  heroTitle: { color: colors.white, fontSize: 26, lineHeight: 30, fontWeight: '800', letterSpacing: -0.7 },
  heroText: { color: colors.white, fontSize: 13, lineHeight: 18 },
  heroCta: { minHeight: 44, borderRadius: 10, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, gap: 5 },
  dotTarget: { minWidth: 36, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, dot: { width: 6, height: 6, borderRadius: 8, backgroundColor: colors.line },
  cart: { ...layout.row, gap: 10, borderRadius: 12, padding: 10, backgroundColor: colors.pale },
  category: { minHeight: 126, borderRadius: 14, padding: 10, gap: 8, justifyContent: 'space-between' }, categoryName: { ...type.caption, color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: '600', minHeight: 48 },
  audience: { padding: 18, borderRadius: 20, gap: 14 }, audienceTitle: { ...type.heading, fontSize: 24, lineHeight: 29 },
  eyebrow: { fontSize: 10, lineHeight: 15, letterSpacing: 0.9, fontWeight: '700' },
  benefitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, benefit: { flexBasis: '47%', flexGrow: 1, padding: 12, borderRadius: 12, backgroundColor: colors.white, gap: 5 },
  businessFacts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  lightLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5, flexGrow: 1 },
  production: { borderWidth: 1, borderColor: colors.line, borderRadius: 18, overflow: 'hidden' },
  fact: { width: 152, minHeight: 124, padding: 14, backgroundColor: colors.brand, borderRadius: 14, gap: 8 },
  pressed: { opacity: 0.75 },
});

export function HomeHelp() {
  const router = useRouter(); const { location } = useShop(); const branch = getSiteContact(location?.settlement?.name ?? '');
  const [callError, setCallError] = useState('');
  return <View testID="home-services" style={{ gap: 12 }}><SectionTitle title="Доставка и помощь" />
    {[
      { Icon: MapPin, title: 'Самовывоз со склада', text: branch ? branch.address : 'Адреса и контакты филиалов', route: '/information/contacts' },
      { Icon: Truck, title: 'Доставка по России', text: 'Курьер, ПВЗ, транспортная компания или на объект', route: '/information/delivery' },
      { Icon: CreditCard, title: 'Все способы оплаты', text: 'Для личных и корпоративных покупок', route: '/information/payment' },
      { Icon: FileText, title: 'Как оформить заказ', text: 'От выбора товаров до подтверждения', route: '/pages/checkout' },
    ].map(item => <Pressable key={item.title} accessibilityRole="button" onPress={() => router.push(item.route as Href)} style={({ pressed }) => [layout.row, { minHeight: 72, gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line }, pressed && s.pressed]}><item.Icon size={23} color={colors.brand} /><View style={{ flex: 1, gap: 4 }}><Text style={type.label}>{item.title}</Text><Text style={type.caption}>{item.text}</Text></View><ChevronRight size={18} color={colors.brand} /></Pressable>)}
    <View style={{ paddingTop: 8, gap: 10 }}><Text style={s.title}>Поможем с вашим заказом</Text><Text style={type.body}>Уточним характеристики, комплектацию и условия поставки.</Text><Button label="Связаться с нами" onPress={() => router.push('/information/contacts')} /><Button label={'Позвонить · ' + supportPhoneLabel} variant="secondary" icon={<Phone size={18} color={colors.brand} />} onPress={() => { void Linking.openURL('tel:' + supportPhone).catch(() => setCallError('Наберите ' + supportPhoneLabel + ' в приложении телефона.')); }} />{callError && <Text accessibilityRole="alert" style={type.body}>{callError}</Text>}<Button label="Заказать обратный звонок" variant="secondary" onPress={() => router.push('/forms/callback')} /></View>
    <Button label="Перейти ко всем товарам" variant="quiet" onPress={() => router.push('/catalog')} />
  </View>;
}
