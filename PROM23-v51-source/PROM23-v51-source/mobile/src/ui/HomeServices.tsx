import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronDown, MapPin, Phone, Truck, CreditCard, UserRound, Package, Warehouse, ArrowUpRight } from 'lucide-react-native';
import { useShop } from '../store';
import { getSiteContact, supportPhone, supportPhoneLabel } from '../content/siteContent';
import { AccountBenefits } from './AccountBenefits';
import { Button } from './primitives';
import { Reveal } from './Reveal';
import { colors, layout, type } from './theme';
import { palette } from './tokens';

export function HomeServices() {
  const [open, setOpen] = useState<string | null>(null);
  const [callError, setCallError] = useState('');
  const { state, location } = useShop(); const router = useRouter(); const branch = getSiteContact(location?.settlement?.name ?? '');
  const sections = [
    { id: 'delivery', Icon: Truck, title: 'Как получить заказ', subtitle: 'Самовывоз, ПВЗ, курьер и транспортные компании', bg: colors.background },
    { id: 'payment', Icon: CreditCard, title: 'Сплит, Пэй и баллы Плюса', subtitle: 'Как оплатить покупку и получить баллы', bg: colors.background },
    { id: 'account', Icon: UserRound, title: 'Зачем нужен личный кабинет', subtitle: 'Заказы, адреса и документы в одном месте', bg: colors.background },
  ];
  const deliveryRows = [
    { Icon: Warehouse, title: 'Самовывоз со склада', text: branch ? 'Адрес филиала: ' + branch.address : 'Уточните ближайший склад у менеджера.', detail: 'Склад отгрузки и готовность заказа уточните до поездки.' },
    { Icon: Package, title: 'В пункт выдачи', text: 'ПВЗ Яндекс Маркета и СДЭК', detail: 'Доступность пункта зависит от веса и размеров заказа.' },
    { Icon: Truck, title: 'До двери или на объект', text: 'Курьер, экспресс-доставка в городах присутствия или транспортная компания.', detail: 'Способ и срок согласуем по адресу и составу заказа.' },
    { Icon: ArrowUpRight, title: 'До терминала ТК — бесплатно', text: 'Передадим груз выбранной транспортной компании.', detail: 'Саму перевозку вы оплачиваете отдельно по тарифу ТК.' },
  ];
  return <View testID="home-services" style={{ gap: 14 }}><Text accessibilityRole="header" aria-level={2} style={type.heading}>От выбора до получения</Text>
    <View style={{ backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line }}>{sections.map(({ id, Icon, title, subtitle, bg }) => <View key={id} style={{ borderBottomWidth: 1, borderBottomColor: colors.background }}>
      <Pressable testID={'home-service-' + id} accessibilityRole="button" accessibilityState={{ expanded: open === id }} aria-expanded={open === id} onPress={() => setOpen(open === id ? null : id)} style={({ pressed }) => [layout.row, { gap: 12, paddingVertical: 18, minHeight: 88, backgroundColor: pressed ? colors.pale : colors.white }]}><View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}><Icon size={21} color={colors.brand} /></View><View style={{ flex: 1, gap: 4 }}><Text style={type.subheading}>{title}</Text><Text style={type.caption}>{subtitle}</Text></View><ChevronDown size={18} color={colors.brand} style={{ transform: [{ rotate: open === id ? '180deg' : '0deg' }] }} /></Pressable>
      {open === id && <Reveal key={id}><View style={{ paddingHorizontal: 18, paddingBottom: 20, gap: 18 }}>
        {id === 'delivery' && <><Text style={type.label}>Место получения: {location?.settlement?.fullName ?? 'выберите в шапке'}</Text>{deliveryRows.map(row => <View key={row.title} style={[layout.row, { gap: 12, alignItems: 'flex-start' }]}><row.Icon size={20} color={colors.brand} /><View style={{ flex: 1, gap: 4 }}><Text style={type.label}>{row.title}</Text><Text style={type.body}>{row.text}</Text><Text style={type.caption}>{row.detail}</Text></View></View>)}<Button label="Все условия доставки" variant="secondary" onPress={() => router.push('/information/delivery')} /></>}
        {id === 'payment' && <><View style={{ gap: 7 }}><Text style={type.subheading}>Оплатите удобным способом</Text><Text style={type.body}>Картой, СБП, наличными или по счёту для компании — доступные способы зависят от заказа.</Text></View><View style={{ padding: 14, borderRadius: 12, backgroundColor: palette.green100, gap: 6 }}><Text style={[type.subheading, { color: palette.green700 }]}>Сплит — оплата частями</Text><Text style={type.body}>Откройте товар, чтобы увидеть пример платежей. Доступность, суммы и даты Яндекс определит до подтверждения оплаты.</Text></View><View style={{ padding: 14, borderRadius: 12, backgroundColor: palette.violet100, gap: 6 }}><Text style={[type.subheading, { color: palette.violet700 }]}>Баллы Плюса с Пэй</Text><Text style={type.body}>Выберите Пэй и войдите в Яндекс ID. При активном Плюсе сервис покажет доступные баллы до покупки.</Text><Text style={type.caption}>Размер начисления зависит от предложения сервиса. Начисление при Сплите не обещается.</Text></View><Button label="Все условия оплаты" variant="secondary" onPress={() => router.push('/information/payment')} /></>}
        {id === 'account' && <><AccountBenefits /><Button label="Открыть личный кабинет" onPress={() => router.push('/account')} /><Text style={type.caption}>Для просмотра каталога и обращения к менеджеру регистрация не нужна.</Text></>}
      </View></Reveal>}
    </View>)}</View>
    <View style={{ borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 18, gap: 12 }}><View style={layout.between}><Text style={type.subheading}>Мы на связи</Text><Pressable accessibilityRole="button" accessibilityLabel="Контакты и адреса магазинов" onPress={() => router.push('/information/contacts')} style={[layout.row, { minHeight: 44, gap: 5 }]}><MapPin size={17} color={colors.brand} /><Text style={[type.label, { color: colors.brand }]}>Контакты</Text></Pressable></View><Button label={'Позвонить · ' + supportPhoneLabel} icon={<Phone size={18} color={colors.white} />} onPress={() => { void Linking.openURL('tel:' + supportPhone).catch(() => setCallError('Наберите ' + supportPhoneLabel + ' в приложении телефона.')); }} /><Button label="Заказать обратный звонок" variant="quiet" onPress={() => router.push('/forms/callback')} />{callError && <Text accessibilityRole="alert" style={type.body}>{callError}</Text>}</View>
  </View>;
}
