import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Bell, Building2, ChevronRight, CreditCard, FileText, KeyRound, Landmark, Mail, MapPin, MessageSquare, Package, Phone, RotateCcw, ShieldCheck, Smartphone, UserRound, UsersRound, type LucideIcon } from 'lucide-react-native';
import { useShop } from '../store';
import { colors, layout, type } from '../ui/theme';
import { Button, EmptyState, Header } from '../ui/primitives';
import { loadSiteWorkspace, type WorkspaceRecord } from '../api/site';
import { siteForms } from '../forms/siteForms';

type WorkspaceAction = { label: string; hint?: string; href: string; icon?: LucideIcon; destructive?: boolean };
type WorkspacePage = { title: string; description: string; icon: LucideIcon; emptyTitle?: string; emptyMessage?: string; primary?: WorkspaceAction; actions: WorkspaceAction[] };

// These pages contain navigation and empty states. Account/company records come from authenticated shop data.
// Every form is handled by the shared form boundary; no profile, role, payment or deletion success is fabricated here.
const pages: Record<string, WorkspacePage> = {
  profile: {
    title: 'Личные данные', description: 'Данные владельца аккаунта для общения и оформления покупок.', icon: UserRound,
    primary: { label: 'Войти в аккаунт', href: '/forms/auth-login' },
    actions: [
      { label: 'Имя', hint: 'Имя владельца аккаунта', href: '/forms/profile-name', icon: UserRound },
      { label: 'Фамилия', hint: 'Фамилия владельца аккаунта', href: '/forms/profile-surname', icon: UserRound },
      { label: 'Город', hint: 'Город в личных данных', href: '/forms/profile-city', icon: MapPin },
      { label: 'Телефон и почта', hint: 'Изменение с подтверждением', href: '/workspace/contacts', icon: Phone },
      { label: 'Паспортные данные', hint: 'Сведения для документов', href: '/forms/profile-passport', icon: FileText },
    ],
  },
  contacts: {
    title: 'Телефон и почта', description: 'Для изменения контакта потребуется подтвердить его кодом.', icon: Phone,
    primary: { label: 'Войти в аккаунт', href: '/forms/auth-login' },
    actions: [
      { label: 'Номер телефона', hint: 'Изменить и подтвердить номер', href: '/forms/profile-phone', icon: Phone },
      { label: 'Электронная почта', hint: 'Изменить и подтвердить адрес', href: '/forms/profile-email', icon: Mail },
      { label: 'Уведомления и рассылки', hint: 'Выбрать, о чём получать сообщения', href: '/notifications', icon: Bell },
    ],
  },
  addresses: {
    title: 'Адреса доставки', description: 'Адреса и получатели для текущего покупателя.', icon: MapPin,
    emptyTitle: 'Ваши адреса будут здесь', emptyMessage: 'Добавьте адрес, чтобы выбирать его при оформлении заказа.',
    primary: { label: 'Добавить адрес', href: '/forms/address-create' }, actions: [],
  },
  organizations: {
    title: 'Мои организации', description: 'Покупки, документы и доступ для компании или ИП.', icon: Building2,
    emptyTitle: 'Выберите свою организацию', emptyMessage: 'Добавьте компанию по ИНН. Доступ к её данным зависит от подтверждённых полномочий.',
    primary: { label: 'Добавить организацию', href: '/forms/organization-add' },
    actions: [
      { label: 'Выбрать организацию', hint: 'Доступные вам компании и ИП', href: '/forms/organization-switch', icon: Building2 },
      { label: 'Реквизиты организации', hint: 'Сведения о компании и изменение данных', href: '/workspace/requisites', icon: FileText },
      { label: 'Сотрудники и полномочия', hint: 'Представители выбранной организации', href: '/workspace/staff', icon: UsersRound },
    ],
  },
  requisites: {
    title: 'Реквизиты организации', description: 'Данные выбранной компании для заказов и документов.', icon: FileText,
    emptyTitle: 'Организация не выбрана', emptyMessage: 'Выберите компанию, чтобы увидеть её реквизиты и подготовить изменения.',
    primary: { label: 'Выбрать организацию', href: '/forms/organization-switch' },
    actions: [
      { label: 'Изменение реквизитов', hint: 'Заявка с подтверждающими документами', href: '/forms/organization-requisites', icon: FileText },
      { label: 'Банковские реквизиты', hint: 'Расчётный счёт, банк и БИК', href: '/workspace/bank', icon: Landmark },
      { label: 'Грузополучатель', hint: 'Данные получателя заказа', href: '/forms/organization-consignee', icon: Package },
      { label: 'Электронный документооборот', hint: 'Оператор и идентификатор участника', href: '/forms/organization-edo', icon: FileText },
      { label: 'Подтвердить полномочия', hint: 'Документы представителя организации', href: '/forms/organization-verify', icon: ShieldCheck },
      { label: 'Выйти из организации', hint: 'Прекратить свой доступ к компании', href: '/forms/organization-delete', icon: Building2, destructive: true },
    ],
  },
  bank: {
    title: 'Банковские реквизиты', description: 'Банковские сведения входят в реквизиты организации.', icon: Landmark,
    emptyTitle: 'Банковские сведения не загружены', emptyMessage: 'Выберите организацию, чтобы увидеть её банк, БИК, расчётный и корреспондентский счета.',
    primary: { label: 'Выбрать организацию', href: '/forms/organization-switch' },
    actions: [
      { label: 'Посмотреть банковские сведения', hint: 'Данные выбранной организации', href: '/forms/organization-bank', icon: Landmark },
      { label: 'Сообщить об изменении реквизитов', hint: 'Приложить подтверждающие документы', href: '/forms/organization-requisites', icon: FileText },
    ],
  },
  staff: {
    title: 'Сотрудники и полномочия', description: 'Доступ к данным компании определяется полномочиями её представителей.', icon: UsersRound,
    emptyTitle: 'Представители не загружены', emptyMessage: 'Войдите и выберите организацию, чтобы увидеть доступные вам сведения.',
    primary: { label: 'Подтвердить полномочия', href: '/forms/organization-verify' },
    actions: [
      { label: 'Выбрать организацию', hint: 'Компании, к которым у вас есть доступ', href: '/forms/organization-switch', icon: Building2 },
      { label: 'Добавить организацию', hint: 'Найти компанию или ИП по ИНН', href: '/forms/organization-add', icon: Building2 },
      { label: 'Помощь с доступом', hint: 'Связаться с отделом продаж', href: '/information/contacts', icon: Phone },
    ],
  },
  documents: {
    title: 'Документы', description: 'Документы по вашим заказам и запросы в магазин.', icon: FileText,
    emptyTitle: 'Документы пока не загружены', emptyMessage: 'Войдите, чтобы увидеть документы по своим покупкам. Для документов компании выберите организацию.',
    primary: { label: 'Войти в аккаунт', href: '/forms/auth-login' },
    actions: [
      { label: 'Запросить документ', hint: 'Документы по заказу и акты сверки', href: '/forms/document-request', icon: FileText },
      { label: 'Мои заказы', hint: 'Состав покупки и документы заказа', href: '/orders', icon: Package },
    ],
  },
  sessions: {
    title: 'Устройства и сеансы', description: 'Контролируйте, с каких устройств открыт ваш аккаунт.', icon: Smartphone,
    emptyTitle: 'Войдите, чтобы увидеть устройства', emptyMessage: 'Здесь будут активные сеансы аккаунта и возможность завершить выбранный сеанс.',
    primary: { label: 'Войти в аккаунт', href: '/forms/auth-login' },
    actions: [
      { label: 'Завершить сеанс', hint: 'Выбрать устройство для выхода', href: '/forms/sessions-terminate', icon: Smartphone },
      { label: 'Восстановить доступ', hint: 'Если не получается войти', href: '/forms/auth-recovery', icon: KeyRound },
    ],
  },
  security: {
    title: 'Данные и безопасность', description: 'Контакты, настройки связи и управление доступом к аккаунту.', icon: ShieldCheck,
    actions: [
      { label: 'Телефон и почта', hint: 'Изменение с подтверждением контакта', href: '/workspace/contacts', icon: Phone },
      { label: 'Устройства и сеансы', hint: 'Посмотреть и завершить сеансы', href: '/workspace/sessions', icon: Smartphone },
      { label: 'Восстановить доступ', hint: 'Восстановление входа в аккаунт', href: '/forms/auth-recovery', icon: KeyRound },
      { label: 'Уведомления и рассылки', hint: 'Настройки сообщений о заказах и новостях', href: '/notifications', icon: Bell },
      { label: 'Обработка персональных данных', href: '/legal/privacy', icon: ShieldCheck },
      { label: 'Удалить аккаунт', hint: 'Открыть запрос на удаление', href: '/forms/account-delete', icon: UserRound, destructive: true },
    ],
  },
  'payment-methods': {
    title: 'Способы оплаты', description: 'Сохранённые способы оплаты ваших покупок.', icon: CreditCard,
    emptyTitle: 'Способы оплаты не загружены', emptyMessage: 'Войдите, чтобы увидеть сохранённые способы. Банковскую карту можно добавить на защищённой странице платёжного сервиса.',
    primary: { label: 'Добавить способ оплаты', href: '/forms/payment-card' },
    actions: [{ label: 'Как оплатить заказ', hint: 'Доступные способы и условия', href: '/information/payment', icon: CreditCard }],
  },
  reviews: {
    title: 'Мои отзывы и вопросы', description: 'Ваши публикации о товарах и ответы магазина.', icon: MessageSquare,
    emptyTitle: 'Ваши публикации будут здесь', emptyMessage: 'Войдите, чтобы увидеть свои отзывы и вопросы. Новый вопрос можно задать в карточке товара.',
    primary: { label: 'Войти в аккаунт', href: '/forms/auth-login' },
    actions: [
      { label: 'Найти товар', hint: 'Задать вопрос о товаре', href: '/catalog', icon: Package },
      { label: 'Мои заказы', hint: 'Оставить отзыв о покупке', href: '/orders', icon: Package },
    ],
  },
  'waiting-list': {
    title: 'Лист ожидания', description: 'Товары, о поступлении которых вы хотите узнать.', icon: Bell,
    emptyTitle: 'Лист ожидания не загружен', emptyMessage: 'Сейчас список недоступен. Вы можете найти нужный товар в каталоге или связаться с магазином.',
    primary: { label: 'Перейти в каталог', href: '/catalog' },
    actions: [
      { label: 'Войти в аккаунт', hint: 'Для доступа к вашему листу ожидания', href: '/forms/auth-login', icon: UserRound },
      { label: 'Связаться с магазином', href: '/information/contacts', icon: Phone },
    ],
  },
  returns: {
    title: 'Возвраты', description: 'Возврат товаров и история ваших заявок.', icon: RotateCcw,
    emptyTitle: 'Заявки пока не загружены', emptyMessage: 'Для оформления возврата выберите завершённый заказ и нужные товары.',
    primary: { label: 'Выбрать заказ для возврата', href: '/forms/return' },
    actions: [
      { label: 'История обращений и возвратов', href: '/service', icon: MessageSquare },
      { label: 'Претензии и способы обращения', href: '/claims', icon: Phone },
    ],
  },
  about: {
    title: 'О магазине', description: 'Промышленник · prom23.ru', icon: Building2,
    actions: [
      { label: 'Магазины и контакты', hint: 'Адреса филиалов и отдел продаж', href: '/information/contacts', icon: Phone },
      { label: 'Доставка', hint: 'Способы получения покупок', href: '/information/delivery', icon: Package },
      { label: 'Оплата', href: '/information/payment', icon: CreditCard },
      { label: 'Для бизнеса', hint: 'Комплексные поставки и сопровождение', href: '/information/business', icon: Building2 },
      { label: 'Публичная оферта', href: '/legal/offer', icon: FileText },
      { label: 'Политика в отношении обработки персональных данных', href: '/legal/privacy', icon: ShieldCheck },
      { label: 'Согласие на обработку данных', href: '/legal/consent', icon: FileText },
      { label: 'Использование cookies', href: '/legal/cookies', icon: FileText },
      { label: 'Рекомендательные технологии', href: '/legal/recommendations', icon: FileText },
    ],
  },
};

export default function WorkspaceScreen() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const { state } = useShop();
  const router = useRouter();
  const [documentTab, setDocumentTab] = useState('Все');
  const [loadError,setLoadError]=useState(''),[loading,setLoading]=useState(false),[reload,setReload]=useState(0);
  const [records, setRecords] = useState<WorkspaceRecord[]>([]);
  useEffect(() => {
    let active = true; setRecords([]);setLoading(true);setLoadError('');
    if (typeof kind === 'string') void loadSiteWorkspace(kind, state.context).then(result => { if (active) setRecords(result.records); }).catch(e => { if (active){setRecords([]);setLoadError(e instanceof Error?e.message:'Не удалось загрузить данные.');} }).finally(()=>{if(active)setLoading(false)});
    return () => { active = false; };
  }, [kind, state.context,reload]);
  useEffect(() => { setDocumentTab('Все'); }, [kind, state.context]);
  const page = typeof kind === 'string' ? pages[kind] : undefined;
  const open = (href: string) => router.push(href as Href);
  if (!page) return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}><Header title="Кабинет" back /><ScrollView buyerControls style={layout.content}><EmptyState title="Раздел не найден" message="Выберите нужный раздел в кабинете." icon={<UserRound size={32} color={colors.brand} />} action={<Button label="В кабинет" onPress={() => router.replace('/account')} />} /></ScrollView></SafeAreaView>;
  const Icon = page.icon;
  const company = state.context !== 'personal';
  const visibleRecords = kind === 'documents' && documentTab !== 'Все' ? records.filter(record => record.category === documentTab) : records;
  const contextual = ['addresses', 'organizations', 'requisites', 'bank', 'staff', 'documents', 'payment-methods', 'returns', 'waiting-list'].includes(kind);
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}>
    <Header title={page.title} back />
    <ScrollView buyerControls style={layout.content} contentContainerStyle={s.content}>
      <View style={s.intro}><View style={s.introIcon}><Icon size={26} color={colors.brand} /></View><View style={s.flex}><Text style={type.body}>{page.description}</Text>{contextual && <Text style={s.context}>{company ? 'Покупки для организации' : 'Личные покупки'}</Text>}</View></View>
      {kind === 'documents' && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>{(company ? ['Все', 'Договоры', 'Счета', 'УПД', 'Акты сверки'] : ['Все', 'Чеки', 'Счета']).map(tab => <DocumentTab key={tab} label={tab} selected={tab === documentTab} onPress={() => setDocumentTab(tab)} />)}</ScrollView>}
      {loading&&<ActivityIndicator accessibilityLabel="Загружаем данные кабинета"/>}{!!loadError&&<View style={layout.card}><Text accessibilityRole="alert" style={type.body}>{loadError}</Text><Button label="Повторить загрузку" variant="secondary" onPress={()=>setReload(v=>v+1)}/><Button label="Войти в аккаунт" variant="quiet" onPress={()=>open('/forms/auth-login')}/></View>}
      {visibleRecords.map(record => <View key={record.id} style={[layout.card, { gap: 12 }]}><Text style={type.subheading}>{record.title}</Text>{record.details.map((detail, index) => <View key={detail.label + index} style={{ gap: 4 }}><Text style={type.caption}>{detail.label}</Text><Text selectable style={type.body}>{detail.value}</Text></View>)}{record.actions?.filter(action => Object.hasOwn(siteForms, action.formId)).map(action => <Button key={action.formId + action.label} label={action.label} variant="secondary" onPress={() => router.push({ pathname: '/forms/[id]', params: { ...action.target, id: action.formId, expectedContext: state.context } })} />)}</View>)}
      {!loading && !loadError && !records.length && (page.emptyTitle ? <View style={s.emptyCard}><EmptyState title={page.emptyTitle} message={page.emptyMessage ?? ''} icon={<Icon size={33} color={colors.brand} />} action={page.primary && <Button label={page.primary.label} onPress={() => open(page.primary!.href)} />} /></View> : page.primary ? <Button label={page.primary.label} onPress={() => open(page.primary!.href)} /> : null)}
      {page.actions.length > 0 && <View style={s.actions}>{page.actions.map(action => <ActionRow key={action.label} action={action} onPress={() => open(action.href)} />)}</View>}
      {kind === 'addresses' && company && <View style={s.actions}><ActionRow action={{ label: 'Грузополучатель', hint: 'Реквизиты получателя заказа', href: '/forms/organization-consignee', icon: Building2 }} onPress={() => open('/forms/organization-consignee')} /></View>}
      {kind === 'documents' && company && <View style={s.actions}><ActionRow action={{ label: 'Подключить ЭДО', hint: 'Оператор и идентификатор участника', href: '/forms/organization-edo', icon: FileText }} onPress={() => open('/forms/organization-edo')} /></View>}
      {kind === 'about' && <View style={s.about}><Text style={type.heading}>prom23.ru</Text><Text style={type.body}>Инструмент и оборудование для строительства, производства и дома.</Text><Text style={type.caption}>Промышленник</Text></View>}
    </ScrollView>
  </SafeAreaView>;
}

function ActionRow({ action, onPress }: { action: WorkspaceAction; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  const Icon = action.icon ?? ChevronRight;
  return <Pressable accessibilityRole="button" accessibilityLabel={action.label} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={({ pressed }) => [s.action, pressed && s.pressed, focused && s.focus]}><Icon size={21} color={action.destructive ? colors.accent : colors.brand} /><View style={s.flex}><Text style={[type.label, action.destructive && { color: colors.accent }]}>{action.label}</Text>{action.hint && <Text style={type.caption}>{action.hint}</Text>}</View><ChevronRight size={18} color={colors.muted} /></Pressable>;
}
function DocumentTab({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }} aria-selected={selected} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={[s.tab, selected && s.tabSelected, focused && s.focus]}><Text style={[type.label, selected && { color: colors.white }]}>{label}</Text></Pressable>;
}
const s = StyleSheet.create({
  content: { padding: 16, gap: 18, paddingBottom: 36 }, intro: { flexDirection: 'row', gap: 13, alignItems: 'center', paddingVertical: 4 }, introIcon: { width: 54, height: 54, borderRadius: 17, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 4 }, context: { ...type.caption, color: colors.brand }, emptyCard: { backgroundColor: colors.white, borderRadius: 20 },
  actions: { backgroundColor: colors.white, borderRadius: 18, overflow: 'hidden' }, action: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 2, borderColor: 'transparent', borderBottomWidth: 1, borderBottomColor: colors.background },
  tabs: { gap: 8 }, tab: { paddingHorizontal: 18, minHeight: 44, justifyContent: 'center', borderRadius: 12, backgroundColor: colors.white, borderWidth: 2, borderColor: 'transparent' }, tabSelected: { backgroundColor: colors.brand },
  pressed: { backgroundColor: colors.pale }, focus: { borderColor: colors.orange }, about: { alignItems: 'center', gap: 10, padding: 24 },
});
