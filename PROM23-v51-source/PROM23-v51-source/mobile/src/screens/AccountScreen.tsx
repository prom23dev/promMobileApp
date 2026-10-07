import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { Bell, Building2, ChevronRight, CreditCard, FileText, Heart, Landmark, MapPin, MessageSquare, Package, Phone, RotateCcw, Settings2, ShieldCheck, ShoppingBag, UserRound, UsersRound, type LucideIcon } from 'lucide-react-native';
import {localRequest} from '../api/local';
import { useShop } from '../store';
import { colors, layout, type } from '../ui/theme';
import { PageMeta } from '../ui/PageMeta';
import { AccountBenefits } from '../ui/AccountBenefits';
import { Button, Header } from '../ui/primitives';

type AccountLink = { title: string; subtitle: string; icon: LucideIcon; href: string };
const personalLinks: AccountLink[] = [
  { title: 'Личные данные', subtitle: 'Имя, фамилия и город', icon: UserRound, href: '/workspace/profile' },
  { title: 'Телефон и почта', subtitle: 'Контакты и подтверждение', icon: Phone, href: '/workspace/contacts' },
  { title: 'Адреса доставки', subtitle: 'Получатели и основной адрес', icon: MapPin, href: '/workspace/addresses' },
  { title: 'Способы оплаты', subtitle: 'Сохранённые способы оплаты', icon: CreditCard, href: '/workspace/payment-methods' },
];
const companyLinks: AccountLink[] = [
  { title: 'Мои организации', subtitle: 'Выбор компании или ИП', icon: Building2, href: '/workspace/organizations' },
  { title: 'Реквизиты организации', subtitle: 'Сведения и адрес компании', icon: FileText, href: '/workspace/requisites' },
  { title: 'Банковские реквизиты', subtitle: 'Счёт, банк и БИК', icon: Landmark, href: '/workspace/bank' },
  { title: 'Сотрудники и полномочия', subtitle: 'Представители организации', icon: UsersRound, href: '/workspace/staff' },
  { title: 'Адреса и грузополучатели', subtitle: 'Получение заказов компании', icon: MapPin, href: '/workspace/addresses' },
  { title: 'Способы оплаты', subtitle: 'Оплата покупок организации', icon: CreditCard, href: '/workspace/payment-methods' },
  { title: 'Электронный документооборот', subtitle: 'Оператор и подключение ЭДО', icon: FileText, href: '/forms/organization-edo' },
];
const supportLinks: AccountLink[] = [
  { title: 'Лист ожидания', subtitle: 'Товары, поступления которых вы ждёте', icon: Bell, href: '/workspace/waiting-list' },
  { title: 'Сравнение товаров', subtitle: 'Характеристики рядом', icon: ShoppingBag, href: '/compare' },
  { title: 'Мои обращения', subtitle: 'Вопросы и помощь по заказам', icon: MessageSquare, href: '/service' },
  { title: 'Возвраты', subtitle: 'Заявки и доступные к возврату товары', icon: RotateCcw, href: '/workspace/returns' },
  { title: 'Мои отзывы и вопросы', subtitle: 'Публикации о товарах', icon: MessageSquare, href: '/workspace/reviews' },
  { title: 'Связаться с магазином', subtitle: 'Магазины и отдел продаж', icon: Phone, href: '/information/contacts' },
];

export default function AccountScreen() {
  const router = useRouter();
  const { state,refresh,dispatch,ready } = useShop();
  const {mode}=useLocalSearchParams<{mode?:string}>();const entered=useRef(false);
  useEffect(()=>{if(ready&&mode==='business'&&!entered.current){entered.current=true;if(state.context==='personal')dispatch({type:'context',context:'business'});}},[ready,mode,state.context]);
  const [authenticated,setAuthenticated]=useState(false),[authError,setAuthError]=useState(''),[authLoading,setAuthLoading]=useState(false),[authRevision,setAuthRevision]=useState(0);
  useFocusEffect(useCallback(()=>{let active=true;setAuthLoading(true);setAuthError('');void localRequest<{authenticated:boolean}>('/v1/auth/session').then(r=>{if(active)setAuthenticated(r.authenticated)}).catch(e=>{if(active){setAuthenticated(false);setAuthError(e.message)}}).finally(()=>{if(active)setAuthLoading(false)});return()=>{active=false}},[authRevision]));
  async function logout(){setAuthLoading(true);setAuthError('');try{await localRequest('/v1/auth/logout',{method:'POST',body:{}});setAuthenticated(false);await refresh();}catch(e){setAuthError(e instanceof Error?e.message:'Не удалось выйти.')}finally{setAuthLoading(false)}}
  const company = state.context !== 'personal';
  const open = (href: string) => { if (href === '/account?mode=business' && state.context === 'personal') dispatch({ type: 'context', context: 'business' }); router.push(href as Href); };
  const links = (items: AccountLink[]) => <View style={s.links}>{items.map(item => <AccountRow key={item.title} item={item} onPress={() => open(item.href)} />)}</View>;
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}>
    <PageMeta title={company ? 'Кабинет для бизнеса' : 'Кабинет покупателя'} />
    <Header title={company ? 'Кабинет для бизнеса' : 'Кабинет'} />
    <ScrollView buyerControls style={layout.content} contentContainerStyle={s.content}>
      <View style={s.welcome}>
        <View style={{ gap: 6 }}><Text accessibilityRole="header" aria-level={2} style={type.heading}>{company ? 'Личный кабинет для бизнеса' : 'Ваши покупки под контролем'}</Text><Text style={type.body}>{authenticated?'Вы вошли в аккаунт. Заказы и данные доступны в разделах ниже.':'Войдите, чтобы сохранять данные и управлять заказами.'}</Text></View>
        <Text style={[type.caption, { color: colors.muted }]}>{company ? 'Заказы · счета и УПД · реквизиты · ЭДО' : 'Заказы и чеки · сохранённые адреса · обращения в магазин'}</Text>
        {authenticated?<Button label="Выйти из аккаунта" variant="secondary" disabled={authLoading} onPress={()=>{void logout()}}/>:<Button label="Войти или зарегистрироваться" disabled={authLoading} onPress={() => open('/forms/auth-login')} />}{!!authError&&<><Text accessibilityRole="alert" style={type.caption}>{authError}</Text><Button label="Повторить проверку входа" variant="quiet" disabled={authLoading} onPress={()=>setAuthRevision(v=>v+1)}/></>}
      </View>
      <View style={s.shortcuts}>{[
        { title: 'Заказы', icon: Package, href: '/orders' },
        { title: company ? 'Счета и документы' : 'Избранное', icon: company ? FileText : Heart, href: company ? '/workspace/documents' : '/favorites' },
        { title: company ? 'Корзина для бизнеса' : 'Корзина', icon: ShoppingBag, href: '/cart' },
        { title: 'Уведомления', icon: Bell, href: '/notifications' },
      ].map(item => <QuickLink key={item.title} item={item} onPress={() => open(item.href)} />)}</View>
      <View style={s.section}><Text accessibilityRole="header" aria-level={2} style={s.sectionTitle}>{company ? 'Организация' : 'Профиль'}</Text>{links(company ? companyLinks : personalLinks)}</View>
      <View style={s.section}><Text accessibilityRole="header" aria-level={2} style={s.sectionTitle}>Покупки и документы</Text>{links([
        { title: company ? 'Документы и акты' : 'Чеки и документы', subtitle: company ? 'Счета, УПД и акты сверки' : 'Документы по вашим заказам', icon: FileText, href: '/workspace/documents' },
        ...(company ? [{ title: 'Заявка для бизнеса', subtitle: 'Прикрепите список или опишите задачу', icon: FileText, href: '/procurement' }, { title: 'Поставка для бизнеса', subtitle: 'Подбор, предложение и сопровождение', icon: Package, href: '/information/business' }] : []),
        ...supportLinks,
      ])}</View>
      <View style={s.section}><Text accessibilityRole="header" aria-level={2} style={s.sectionTitle}>Для вашей компании</Text><Text style={type.body}>Выбирайте товары в каталоге, добавляйте в корзину и оформляйте заказ по счёту. Для индивидуального подбора можно отправить заявку специалисту.</Text><Button label="Выбрать товары" onPress={() => open('/catalog')} /><Button variant="secondary" label="Отправить потребность" onPress={() => open('/procurement')} />{state.carts['organization-demo'].length > 0 && <Button label="Ранее выбранные товары для компании" variant="secondary" onPress={() => router.push({ pathname: '/procurement', params: { previousCart: 'company' } })} />}{!company && <Button label="Открыть кабинет организации" variant="secondary" onPress={() => open('/account?mode=business')} />}</View>
      <View style={s.section}><Text accessibilityRole="header" aria-level={2} style={s.sectionTitle}>Настройки</Text>{links([
        { title: 'Уведомления и рассылки', subtitle: 'Заказы, новости и способы связи', icon: Bell, href: '/notifications' },
        { title: 'Устройства и сеансы', subtitle: 'Управление доступом к аккаунту', icon: ShieldCheck, href: '/workspace/sessions' },
        { title: 'Данные и безопасность', subtitle: 'Контакты, доступ и удаление аккаунта', icon: Settings2, href: '/workspace/security' },
        { title: 'О компании', subtitle: 'Производство, история и достижения', icon: Building2, href: '/pages/about' },
        { title: 'Все разделы магазина', subtitle: 'Блог, сотрудничество и помощь', icon: ShoppingBag, href: '/more' },
      ])}</View>
      <Text style={s.footer}>Промышленник · prom23.ru</Text>
    </ScrollView>
  </SafeAreaView>;
}

export function CompanyAccountPreview({ onOpen }: { onOpen: (href: string) => void }) { return <View style={s.links}>{[companyLinks[0], companyLinks[1], companyLinks[4]].map(item => <AccountRow key={item.href} item={item} onPress={() => onOpen(item.href)} />)}</View>; }

function AccountRow({ item, onPress }: { item: AccountLink; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  const Icon = item.icon;
  return <Pressable accessibilityRole="button" accessibilityLabel={item.title} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={({ pressed }) => [s.link, pressed && s.pressed, focused && s.focus]}><View style={s.linkIcon}><Icon size={21} color={colors.brand} /></View><View style={s.linkText}><Text style={type.label}>{item.title}</Text><Text style={type.caption}>{item.subtitle}</Text></View><ChevronRight size={18} color={colors.muted} /></Pressable>;
}
function QuickLink({ item, onPress }: { item: Pick<AccountLink, 'title' | 'icon'>; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  const Icon = item.icon;
  return <Pressable accessibilityRole="button" accessibilityLabel={item.title} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={({ pressed }) => [s.shortcut, pressed && s.pressed, focused && s.focus]}><Icon size={25} color={colors.brand} /><Text style={type.label}>{item.title}</Text></Pressable>;
}
const s = StyleSheet.create({
  content: { padding: 16, gap: 22, paddingBottom: 36 }, welcome: { backgroundColor: colors.white, padding: 18, borderRadius: 20, gap: 18 },
  welcomeText: { flex: 1, gap: 7, marginLeft: 14 }, avatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, shortcut: { flexGrow: 1, flexBasis: '44%', minWidth: 120, minHeight: 90, backgroundColor: colors.white, borderRadius: 16, padding: 12, gap: 12, borderWidth: 2, borderColor: 'transparent' },
  section: { gap: 10 }, sectionTitle: { ...type.subheading, paddingHorizontal: 3 }, links: { backgroundColor: colors.white, borderRadius: 18, overflow: 'hidden' },
  link: { minHeight: 76, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', gap: 10, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.background, borderWidth: 2, borderColor: 'transparent' },
  linkIcon: { width: 32, alignItems: 'center' }, linkText: { flex: 1, gap: 3 }, pressed: { backgroundColor: colors.pale }, focus: { borderColor: colors.orange }, footer: { ...type.caption, textAlign: 'center' },
});
