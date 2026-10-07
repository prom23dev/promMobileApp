import { LegalAccess } from '../ui/PrivacyControls';
import React, { useRef, useState } from 'react';
import { Animated, Linking, Text, View } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Building2, CreditCard, MapPin, PackageCheck, Phone, Truck } from 'lucide-react-native';
import { useShop } from '../store';
import { getSiteContact, isSiteTopic, siteContent, supportPhone, supportPhoneLabel, type SiteTopic } from '../content/siteContent';
import { Button, Header } from '../ui/primitives';
import { PageMeta } from '../ui/PageMeta';
import { BusinessPage } from '../ui/BusinessPage';
import { businessPage } from '../content/businessPage';
import { CompanyTopic } from '../ui/CompanyTopic';
import { CompanyDisclosure } from '../ui/CompanyTrust';
import { DeliveryPage } from '../ui/DeliveryPage';
import { ProductionPage } from '../ui/ProductionPage';
import { productionPage } from '../content/productionPage';
import { PaymentPage } from '../ui/PaymentPage';
import { BranchExplorer } from '../ui/BranchExplorer';
import { BuyerInfoGrid, ContentSection, ContentLink, e } from '../ui/EditorialContent';
import { colors, layout, type } from '../ui/theme';
const labels: Record<SiteTopic, string> = { delivery: 'Доставка', payment: 'Оплата', business: 'Для бизнеса', production: 'Производство', contacts: 'Контакты' };
export default function InformationScreen() {
  const params = useLocalSearchParams<{ topic?: string | string[] }>(); const raw = Array.isArray(params.topic) ? params.topic[0] : params.topic;
  const topic = isSiteTopic(raw) ? raw : undefined; const page = topic ? siteContent[topic] : undefined; const router = useRouter();
  const scrollRef = useRef<ScrollView>(null); const scrollY = useRef(new Animated.Value(0)).current;
  const { location } = useShop(); const regional = getSiteContact(location?.settlement?.name ?? ''); const [error, setError] = useState('');
  if (!page || !topic) return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}><Header title="Информация" back /><ScrollView contentContainerStyle={{ padding: 16 }}><Button label="В каталог" onPress={() => router.replace('/catalog')} /></ScrollView></SafeAreaView>;
  const companyTopic = topic === 'business' || topic === 'production';
  async function call() { setError(''); try { await Linking.openURL('tel:' + (regional?.phone ?? supportPhone)); } catch { setError('Наберите номер ' + (regional?.phoneLabel ?? supportPhoneLabel)); } }
  const methods = [
    { Icon: CreditCard, title: 'Онлайн', caption: 'Доступные способы покажет оформление' },
    { Icon: CreditCard, title: 'Сплит', caption: 'Частями, по предложению Яндекса' },
    { Icon: PackageCheck, title: 'При получении', caption: 'Если доступно для вашего заказа' },
    { Icon: Building2, title: 'По счёту', caption: 'Для юридических лиц и ИП' },
  ];
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}><PageMeta title={topic === 'business' ? businessPage.title : topic === 'production' ? productionPage.title : page.title} description={topic === 'business' ? businessPage.description : topic === 'production' ? productionPage.description : page.subtitle} /><Header title={labels[topic]} back heading={topic !== 'business' && topic !== 'production' && topic !== 'delivery' && topic !== 'payment'} /><ScrollView keyboardShouldPersistTaps={topic === 'business' ? 'handled' : undefined} ref={scrollRef} onScroll={topic === 'business' || topic === 'production' || topic === 'delivery' || topic === 'payment' ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false }) : undefined} scrollEventThrottle={16} key={topic} style={layout.content} contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 30 }}>
    {topic === 'business' ? <BusinessPage scrollRef={scrollRef} scrollY={scrollY} /> : topic === 'production' ? <ProductionPage scrollRef={scrollRef} scrollY={scrollY} /> : topic === 'delivery' ? <DeliveryPage scrollRef={scrollRef} scrollY={scrollY} /> : topic === 'payment' ? <PaymentPage scrollRef={scrollRef} scrollY={scrollY} /> : companyTopic ? <CompanyTopic topic={topic} /> : topic === 'contacts' ? <BranchExplorer /> : <>
      <ContentSection><Text accessibilityRole="header" aria-level={2} style={type.title}>{'Оплата под вашу покупку'}</Text><Text style={type.body}>{'Личная покупка или поставка для компании. Все суммы и доступные условия — до подтверждения.'}</Text><View style={e.grid}>{methods.map(({ Icon, title, caption }) => <View key={title} style={{ width: '47%', flexGrow: 1, padding: 14, gap: 7, borderBottomWidth: 1, borderBottomColor: colors.line }}><Icon size={24} color={colors.brand} /><Text style={type.subheading}>{title}</Text><Text style={type.caption}>{caption}</Text></View>)}</View></ContentSection>
      <ContentSection title={'Условия оплаты'}>{page.sections.map(section => <CompanyDisclosure title={section.title} key={section.id}>{section.paragraphs.map((paragraph, index) => <Text key={index} style={type.body}>{paragraph}</Text>)}{section.bullets?.map((bullet, index) => <Text key={index} style={type.body}>• {bullet}</Text>)}</CompanyDisclosure>)}</ContentSection>
      <View style={e.notice}><Text style={type.subheading}>{'Есть вопрос об оплате?'}</Text><Text style={type.body}>{'Менеджер поможет уточнить доступный способ и документы.'}</Text><Button label={'Связаться с менеджером'} onPress={() => router.push('/information/contacts')} /><ContentLink title={'Заказы и документы'} route={'/orders'} /></View>
      <ContentLink title="Позвонить менеджеру" caption={regional?.phoneLabel ?? supportPhoneLabel} onPress={() => { void call(); }} icon={<Phone size={22} color={colors.brand} />} />
    </>}
    {error && <Text accessibilityRole="alert" style={[type.body, { color: colors.accent }]}>{error}</Text>}
    {topic !== 'business' && topic !== 'production' && topic !== 'delivery' && topic !== 'payment' && <BuyerInfoGrid exclude={'/information/' + topic} />}
  <LegalAccess /></ScrollView></SafeAreaView>;
}
