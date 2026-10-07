import React, { useMemo, useState, type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ImageSourcePropType } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowRight, ArrowUpRight, Award, Building2, Check, ChevronLeft, ChevronRight, CreditCard, FileText, HelpCircle, MapPin, PackageCheck, RotateCcw, Search, ShieldCheck, Truck, UserRound, X } from 'lucide-react-native';
import { useShop } from '../store';
import { historyMilestones, helpCategories, helpItems, supplyWorkflow, type HelpItem } from '../content/editorialContent';
import { companyAwards } from '../content/companyContent';
import { Button, IconButton, Sheet } from './primitives';
import { QuestionAnswer } from './QuestionAnswer';
import { CompanyDisclosure } from './CompanyTrust';
import { CategoryPictogram } from './CategoryPictogram';
import { Reveal } from './Reveal';
import { colors, layout, type } from './theme';

export function ContentSection({ title, children, testID }: { title?: string; children: ReactNode; testID?: string }) {
  return <View testID={testID} style={e.section}>{title && <Text accessibilityRole="header" aria-level={2} style={type.heading}>{title}</Text>}{children}</View>;
}
export function ContentLink({ title, caption, route, onPress, icon }: { title: string; caption?: string; route?: string; onPress?: () => void; icon?: ReactNode }) {
  const router = useRouter(); const [focus, setFocus] = useState(false);
  return <Pressable accessibilityRole="button" onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} onPress={onPress ?? (() => route && router.push(route as Href))} style={({ pressed }) => [e.link, pressed && e.pressed, focus && e.focus]}>
    {icon}<View style={{ flex: 1, gap: 3 }}><Text style={type.label}>{title}</Text>{caption && <Text style={type.caption}>{caption}</Text>}</View><ArrowUpRight color={colors.brand} size={18} />
  </Pressable>;
}
const buyerLinks = [
  { title: 'Доставка', caption: 'Способы получения', route: '/information/delivery', Icon: Truck },
  { title: 'Оплата', caption: 'Карта, Сплит, счёт', route: '/information/payment', Icon: CreditCard },
  { title: 'Возврат', caption: 'Помощь с заказом', route: '/pages/returns', Icon: RotateCcw },
  { title: 'Гарантия', caption: 'Документы на товар', route: '/pages/warranty', Icon: ShieldCheck },
  { title: 'Кабинет', caption: 'Заказы и обращения', route: '/account', Icon: UserRound },
  { title: 'Документы', caption: 'Условия и согласия', route: '/pages/documents', Icon: FileText },
  { title: 'Вопросы', caption: 'Найти ответ', route: '/pages/faq', Icon: HelpCircle },
  { title: 'Контакты', caption: 'Филиалы и связь', route: '/information/contacts', Icon: MapPin },
];
export function BuyerInfoGrid({ exclude }: { exclude?: string }) {
  const router = useRouter();
  return <ContentSection title="Покупателю" testID="buyer-info-grid"><View style={e.grid}>{buyerLinks.filter(item => item.route !== exclude).map(({ Icon, ...item }) => <Pressable accessibilityRole="button" accessibilityLabel={item.title + '. ' + item.caption} onPress={() => router.push(item.route as Href)} key={item.title} style={({ pressed }) => [{ width: '47%', flexGrow: 1, padding: 13, gap: 7, minHeight: 102, borderRadius: 12, backgroundColor: colors.white }, pressed && e.pressed]}><Icon size={22} color={colors.brand} /><Text style={type.label}>{item.title}</Text><Text numberOfLines={1} style={type.caption}>{item.caption}</Text></Pressable>)}</View></ContentSection>;
}
export function EditorialPhoto({ source, label, caption, height = 150 }: { source: ImageSourcePropType; label: string; caption?: string; height?: number }) {
  return <View style={{ gap: 7 }}><View style={[e.photo, { height }]}><Image source={source} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="cover" accessibilityLabel={label} /></View>{caption && <Text style={type.caption}>{caption}</Text>}</View>;
}
export type EvidencePhoto = { source: ImageSourcePropType; label: string; caption: string };
export function EvidenceGallery({ items, title = 'На производстве' }: { items: EvidencePhoto[]; title?: string }) {
  const [index, setIndex] = useState(0); const [open, setOpen] = useState(false); const item = items[index];
  return <ContentSection title={title} testID="evidence-gallery"><Pressable accessibilityRole="button" accessibilityLabel={'Открыть фото: ' + item.label} onPress={() => setOpen(true)}><EditorialPhoto source={item.source} label={item.label} caption={item.caption} height={180} /></Pressable>
    <View style={layout.between}><IconButton label="Предыдущее фото" onPress={() => setIndex((index + items.length - 1) % items.length)}><ChevronLeft size={20} color={colors.brand} /></IconButton><Text accessibilityLiveRegion="polite" style={type.caption}>Фото {index + 1} из {items.length}</Text><IconButton label="Следующее фото" onPress={() => setIndex((index + 1) % items.length)}><ChevronRight size={20} color={colors.brand} /></IconButton></View>
    <Sheet visible={open} title={item.caption} onClose={() => setOpen(false)}><View style={{ width: '100%', height: 320 }}><Image source={item.source} accessibilityLabel={item.label} resizeMode="contain" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} /></View><Text style={type.body}>{item.label}</Text><Button label="Закрыть фотографию" variant="secondary" onPress={() => setOpen(false)} /></Sheet>
  </ContentSection>;
}
export function CompanyTimeline() {
  const [active, setActive] = useState(0); const item = historyMilestones[active];
  return <ContentSection title="Как росла компания" testID="company-timeline"><ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ gap: 8, paddingVertical: 4 }} accessibilityRole="tablist" accessibilityLabel="Годы истории компании">{historyMilestones.map((milestone, index) => <ContentTab key={milestone.year} label={milestone.year} active={active === index} onPress={() => setActive(index)} />)}</ScrollView>
    <Reveal key={active}><View style={e.timelinePanel}><Text style={e.year}>{item.year}</Text><View style={{ flex: 1, gap: 8 }}>{item.paragraphs.map(text => <Text key={text} style={type.body}>{text}</Text>)}</View></View></Reveal>
    <CompanyDisclosure title="Вся хронология">{historyMilestones.map(milestone => <View key={milestone.year} style={e.timelineRow}><Text style={[type.label, { color: colors.accent }]}>{milestone.year}</Text><View style={{ flex: 1, gap: 5 }}>{milestone.paragraphs.map(text => <Text style={type.body} key={text}>{text}</Text>)}</View></View>)}</CompanyDisclosure>
  </ContentSection>;
}
export function ContentTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const [focus, setFocus] = useState(false);
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} aria-selected={active} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} onPress={onPress} style={({ pressed }) => [e.tab, active && { backgroundColor: colors.brand }, focus && e.focus, pressed && e.pressed]}><Text style={[type.label, { color: active ? colors.white : colors.brand }]}>{label}</Text></Pressable>;
}
export function FAQExplorer({ items = helpItems, categories = helpCategories, title }: { items?: HelpItem[]; categories?: string[]; title?: string }) {
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('Все'); const router = useRouter();
  const results = useMemo(() => items.filter(item => (category === 'Все' || category === item.category) && (!query.trim() || `${item.question} ${item.answer} ${item.details ?? ''}`.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru')))), [items, query, category]);
  return <ContentSection title={title} testID="faq-explorer"><View style={e.search}><Search size={20} color={colors.brand} /><TextInput value={query} onChangeText={setQuery} accessibilityLabel="Поиск по вопросам" placeholder="Например, доставка или счёт" placeholderTextColor={colors.muted} style={[type.body, e.input]} returnKeyType="search" autoCorrect={false} />{!!query && <IconButton label="Очистить поиск вопросов" onPress={() => setQuery('')}><X size={18} color={colors.brand} /></IconButton>}</View>
    <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ gap: 8, paddingVertical: 4 }} accessibilityRole="tablist" accessibilityLabel="Темы вопросов">{categories.map(label => <ContentTab key={label} label={label} active={category === label} onPress={() => setCategory(label)} />)}</ScrollView>
    {(query || category !== 'Все') && <Text accessibilityLiveRegion="polite" style={type.caption}>Найдено ответов: {results.length}</Text>}
    <View key={category}>{results.map(item => <QuestionAnswer key={item.id} question={item.question} answer={item.answer} relatedLink={item.relatedLink}>{item.details && <Text style={type.body}>{item.details}</Text>}</QuestionAnswer>)}</View>
    {!results.length && <View style={e.notice}><Text style={type.subheading}>Похожего вопроса пока нет</Text><Text style={type.body}>Попробуйте другое слово или передайте вопрос менеджеру.</Text><Button label="Сбросить поиск" variant="secondary" onPress={() => { setQuery(''); setCategory('Все'); }} /></View>}
    <ContentLink title="Не нашли ответ?" caption="Задать вопрос менеджеру" onPress={() => router.push('/forms/appeal')} icon={<HelpCircle size={22} color={colors.accent} />} />
  </ContentSection>;
}
export function CompanyCatalog() {
  const { catalogTree } = useShop(); const router = useRouter(); const sections = ['250', '16', '37', '49'].flatMap(id => catalogTree.sections.find(item => item.id === id) ?? []);
  return <ContentSection title="Оборудование для работы"><View style={e.grid}>{sections.map(section => <Pressable accessibilityRole="button" key={section.id} onPress={() => router.push({ pathname: '/catalog', params: { section: section.id } })} style={({ pressed }) => [e.category, pressed && e.pressed]}><CategoryPictogram name={section.name} size={33} /><Text style={type.label}>{section.name}</Text><ArrowRight size={18} color={colors.brand} /></Pressable>)}</View><ContentLink title="Все разделы каталога" route="/catalog" /></ContentSection>;
}
export function AwardHighlights() {
  const router = useRouter();
  const photos = [require('../../assets/company/award-0.png'), require('../../assets/company/award-2.png'), require('../../assets/company/award-4.png')];
  return <ContentSection title="Признание работы компании"><ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ gap: 18, paddingVertical: 4 }} accessibilityLabel="Награды компании — листайте">{companyAwards.map((award, index) => <Pressable accessibilityRole="button" accessibilityLabel={award.place + '. ' + award.title + '. Подробнее'} onPress={() => router.push('/pages/awards')} key={award.title} style={({ pressed }) => [{ width: 190, paddingBottom: 12, gap: 9, borderBottomWidth: 1, borderBottomColor: colors.line }, pressed && e.pressed]}><Image source={photos[index]} accessibilityLabel={award.title + ' — изображение награды с сайта'} resizeMode="contain" style={{ width: 70, height: 100 }} /><Text style={[type.label, { color: colors.accent }]}>{award.place}</Text><Text style={type.body}>{award.title}</Text></Pressable>)}</ScrollView><ContentLink title="Все награды и подробности" route="/pages/awards" icon={<Award size={22} color={colors.brand} />} /></ContentSection>;
}
export function SupplyWorkflow() {
  const [group, setGroup] = useState(0); const groups = ['Подготовка', 'Согласование', 'Получение'];
  return <ContentSection title="От заявки до получения" testID="supply-workflow"><View style={e.grid}>{groups.map((label, i) => <ContentTab key={label} label={label} active={group === i} onPress={() => setGroup(i)} />)}</View><Reveal key={group}><View>{supplyWorkflow.map((step, index) => step.group === groups[group] && <View key={step.title} style={{ flexDirection: 'row', gap: 14, paddingVertical: 12 }}><View style={{ width: 32, alignItems: 'center', gap: 8 }}><View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' }}><Text style={[type.label, { color: colors.brand }]}>{index + 1}</Text></View>{index % 3 !== 2 && <View style={{ width: 1, flex: 1, backgroundColor: colors.line }} />}</View><View style={{ flex: 1, gap: 5 }}><Text style={type.subheading}>{step.title}</Text><Text style={type.body}>{step.text}</Text></View></View>)}</View></Reveal></ContentSection>;
}
export const e = StyleSheet.create({
  section: { gap: 14 }, page: { gap: 30 }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, half: { width: '47%', flexGrow: 1 },
  link: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
  photo: { overflow: 'hidden', borderRadius: 14, backgroundColor: colors.pale, width: '100%' },
  tab: { minHeight: 44, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  timelinePanel: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: colors.pale, padding: 18, borderRadius: 14, minHeight: 160 }, year: { fontSize: 25, lineHeight: 30, fontWeight: '700', color: colors.brand }, timelineRow: { flexDirection: 'row', gap: 14, paddingVertical: 8 },
  search: { minHeight: 50, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white }, input: { flex: 1, minWidth: 0, minHeight: 50, paddingRight: 10, fontSize: 16 },
  notice: { gap: 10, padding: 16, backgroundColor: colors.pale, borderRadius: 14 },
  category: { width: '47%', flexGrow: 1, padding: 16, gap: 10, borderRadius: 14, backgroundColor: colors.white },
  award: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 8 }, focus: { outlineColor: colors.brand, outlineStyle: 'solid', outlineWidth: 2 }, pressed: { opacity: 0.75 },
});
