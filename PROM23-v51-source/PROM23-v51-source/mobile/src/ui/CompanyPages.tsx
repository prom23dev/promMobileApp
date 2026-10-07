import React, { useEffect, useState } from 'react';
import { Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowRight, ArrowUpRight, Award, Building2, Check, ClipboardList, Factory, FileText, Globe2, GraduationCap, Layers3, Package, Phone, RotateCcw, ShieldCheck, Store, Truck } from 'lucide-react-native';
import { sitePages, type SitePage } from '../content/sitePages';
import { legalDocuments } from '../content/legalDocuments';
import { useShop } from '../store';
import { Button, Sheet } from './primitives';
import { CompanyDisclosure } from './CompanyTrust';
import { ContentSection, ContentLink, EditorialPhoto, ContentTab, BuyerInfoGrid, e } from './EditorialContent';
export { CooperationPage } from './CooperationPage';
import { colors, type } from './theme';

export { AboutPage } from './AboutPage';

function FranchiseAdvantages() {
  // Source: frontend/h/franchise.php, advantages and support sections.
  const advantages = [
    { Icon: Store, title: 'Готовая бизнес-модель', body: 'Готовые стандарты и инструменты для продажи строительного оборудования.' },
    { Icon: GraduationCap, title: 'Обучение вашей команды', body: 'Подготовка сотрудников и техническая поддержка в процессе работы.' },
    { Icon: Truck, title: 'Прямые поставки', body: 'Доступ к каталогу компании и условиям закупки для партнёров.' },
    { Icon: Layers3, title: 'Бренд и поддержка продаж', body: 'Фирменные маркетинговые материалы и CRM-система для учёта заказов.' },
  ];
  return <ContentSection testID="franchise-advantages" title="Преимущества работы под брендом «Промышленник»">
    <View style={s.advantageList}>{advantages.map(({ Icon, title, body }) => <View key={title} style={s.advantageRow}>
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden style={s.advantageIcon}><Icon color={colors.brand} size={24} strokeWidth={1.7} /></View>
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}><Text style={type.subheading}>{title}</Text><Text style={type.body}>{body}</Text></View>
    </View>)}</View>
  </ContentSection>;
}
export function PartnerPage({ kind, page: contentPage }: { kind: 'suppliers' | 'franchise'; page?: SitePage }) {
  const supplier = kind === 'suppliers'; const router = useRouter(); const [tab, setTab] = useState(0);
  const { state } = useShop();
  const page = contentPage ?? sitePages[kind]; const support = page.sections.find(x => x.id === 'support')?.bullets ?? []; const requirements = page.sections.find(x => x.id === 'requirements')?.bullets ?? [];
  const benefits = supplier ? [
    { Icon: Store, title: 'Аудитория', text: 'Покупатели строительного оборудования' }, { Icon: Package, title: 'Ассортимент', text: 'Мировые и собственные марки' }, { Icon: FileText, title: 'Договор', text: 'Согласованные условия поставки' }, { Icon: Phone, title: 'Сопровождение', text: 'Связь на этапах сотрудничества' },
  ] : [
    { Icon: Store, title: 'Бренд', text: 'Работа под маркой «Промышленник»' }, { Icon: GraduationCap, title: 'Обучение', text: 'Подготовка вашей команды' }, { Icon: Truck, title: 'Поставки', text: 'Прямой доступ к каталогу компании' }, { Icon: Layers3, title: 'Поддержка', text: 'Маркетинг и рабочие материалы' },
  ];
  const steps = page.sections.find(x => x.id === 'steps')?.bullets ?? [];
  const submit = () => router.push({ pathname: '/forms/[id]', params: { id: supplier ? 'supplier' : 'partner', expectedContext: state.context } });
  return <View testID={'partner-' + kind} style={e.page}>
    <ContentSection><EditorialPhoto source={supplier ? require('../../assets/brand/equipment-wide.webp') : require('../../assets/company/franchise.webp')} label={supplier ? 'Оборудование Промышленник — реальная продукция компании' : 'Фирменный транспорт Промышленника'} height={145} /><Text accessibilityRole="header" aria-level={2} style={type.title}>{supplier ? 'Ваши товары — в нашей сети' : '«Промышленник» в вашем городе'}</Text><Text style={type.body}>{supplier ? 'Сотрудничаем с производителями и дистрибьюторами строительного оборудования. Расскажите о продукции и условиях поставки.' : 'Развивайте продажи строительного оборудования под нашим брендом. Обсудим формат работы и условия для вашего города.'}</Text><Button label={supplier ? 'Предложить продукцию' : 'Обсудить франшизу'} onPress={submit} /></ContentSection>
    {supplier && <ContentSection title="Как строится сотрудничество"><View style={e.grid}>{benefits.map(({ Icon, title, text }) => <View key={title} style={s.benefit}><Icon size={24} color={colors.brand} /><Text style={type.subheading}>{title}</Text><Text style={type.caption}>{text}</Text></View>)}</View></ContentSection>}
    <CompanyDisclosure title={supplier ? 'Наш ассортимент и начало сотрудничества' : 'Подробности предложения франшизы'}>{page.sections.filter(section => ['intro', 'start', 'benefits', 'contact'].includes(section.id)).map(section => <View key={section.id} style={{ gap: 8 }}>{section.title && <Text style={type.subheading}>{section.title}</Text>}{section.paragraphs.map((paragraph, index) => <Text key={index} selectable style={type.body}>{paragraph}</Text>)}{section.bullets?.map((bullet, index) => <Text key={index} style={type.body}>• {bullet}</Text>)}</View>)}</CompanyDisclosure>
    <ContentSection title={supplier ? 'Что подготовить' : 'Распределяем задачи'}>{!supplier && <View style={e.grid}><ContentTab label="Что предоставляем" active={tab === 0} onPress={() => setTab(0)} /><ContentTab label="Что нужно от вас" active={tab === 1} onPress={() => setTab(1)} /></View>}
      <View key={tab}>{(supplier || tab === 1 ? requirements : support).map(text => <View key={text} style={s.check}><Check size={19} color={colors.accent} /><Text style={[type.body, { flex: 1 }]}>{text}</Text></View>)}</View>{supplier && <Text style={type.caption}>Сертификаты и лицензии предоставляются, когда они требуются для вашей продукции. Доступность и условия проверяются до заключения договора.</Text>}
    </ContentSection>
    <ContentSection title={supplier ? 'От предложения до поставки' : 'Как начать работу'}>{steps.map((text, index) => { const [title, ...body] = text.split(' — '); return <View key={text} style={s.step}><View style={s.stepNumber}><Text style={[type.label, { color: colors.brand }]}>{index + 1}</Text></View><View style={{ flex: 1, gap: 4 }}><Text style={type.subheading}>{title}</Text><Text style={type.body}>{body.join(' — ')}</Text></View></View>; })}{!supplier && <View testID="franchise-start-actions" style={{ gap: 6 }}><Button label="Отправить заявку на франшизу" onPress={submit} /><ContentLink title="Контакты компании" route="/information/contacts" icon={<Phone size={21} color={colors.brand} />} /></View>}</ContentSection>
    {!supplier && <FranchiseAdvantages />}
    <ContentSection title="Перед обращением"><CompanyDisclosure title={supplier ? 'Какие данные нужны в заявке?' : 'Обязателен ли собственный склад?'}><Text style={type.body}>{supplier ? 'Имя и контакты, название компании, категория и описание продукции. Можно приложить каталог или коммерческое предложение в формате TXT, DOC, DOCX или PDF.' : 'На сайте собственный склад указан как желательное условие. Если склад есть, в заявке можно добавить адрес, телефон и график работы.'}</Text></CompanyDisclosure><CompanyDisclosure title={supplier ? 'Когда обсуждаются условия?' : 'Как узнать стоимость и условия?'}><Text style={type.body}>{supplier ? 'После рассмотрения предложения команда свяжется с вами, уточнит сведения о продукции и согласует условия до подписания договора.' : 'Условия работы обсуждаются до подписания соглашения. Передайте город и сведения о компании — менеджер уточнит детали. Состав поддержки и обязательства сторон закрепляются в соглашении.'}</Text></CompanyDisclosure></ContentSection>
    <View style={e.notice}><Text style={type.subheading}>{supplier ? 'Готовы представить продукцию?' : 'Станьте партнёром «Промышленника»'}</Text><Text style={type.body}>{supplier ? 'Начните с категории и описания товаров. Документы помогут команде оценить предложение.' : 'Оставьте заявку на франшизу. Менеджер свяжется с вами, расскажет об условиях сотрудничества и ответит на вопросы.'}</Text><Button label={supplier ? 'Заполнить заявку поставщика' : 'Отправить заявку на франшизу'} onPress={submit} /><ContentLink title="Связаться с командой" route="/information/contacts" /></View>
  </View>;
}
export function ReturnGuide() {
  const { state, dispatch, busy, ready, error } = useShop();
  const [buyer, setBuyer] = useState<'personal' | 'business'>(state.context === 'personal' ? 'personal' : 'business');
  const context = buyer === 'personal' ? 'personal' : state.context.startsWith('organization:') ? state.context : 'business';
  const [opening, setOpening] = useState(false); const router = useRouter();
  useEffect(() => { if (!opening || busy) return; setOpening(false); if (ready && !error && state.context === context) router.push('/orders'); }, [opening, busy, ready, error, state.context, context]);
  const steps = [
    { title: 'Найдите заказ', body: 'Номер заказа, наименование и количество товаров помогут найти покупку. В кабинете откройте заказ и выберите возврат.', Icon: ClipboardList },
    { title: 'Опишите ситуацию', body: 'Укажите причину и состояние товара. Для недостатка — когда он обнаружен и как проявляется.', Icon: FileText },
    { title: 'Добавьте материалы', body: 'Фото товара, упаковки и повреждений, а при необходимости видео помогут рассмотреть обращение.', Icon: Package },
    { title: 'Согласуйте передачу', body: 'Уточните адрес, способ перевозки и документы. Для крупного оборудования важны габариты и условия разгрузки.', Icon: Truck },
    { title: 'Следите за обращением', body: 'Сохраните номер и переписку по обращению. Если нужна помощь — свяжитесь с менеджером.', Icon: Phone },
  ];
  return <View testID="return-guide" style={e.page}><ContentSection><View style={e.grid}><ContentTab label="Для себя" active={buyer === 'personal'} onPress={() => setBuyer('personal')} /><ContentTab label="Для компании" active={buyer === 'business'} onPress={() => setBuyer('business')} /></View><Text accessibilityRole="header" aria-level={2} style={type.title}>Поможем разобраться с покупкой</Text><Text style={type.body}>{context === 'personal' ? 'Выберите покупку и расскажите, что произошло. Подготовить обращение можно без поиска юридических пунктов.' : 'Для поставки организации подготовьте номер заказа, реквизиты покупателя и документы. Условия договора рассматриваются вместе с причиной возврата.'}</Text><Button label="Оформить возврат" icon={<RotateCcw size={18} color={colors.white} />} disabled={opening || busy || !ready} onPress={() => { if (state.context === context) router.push('/orders'); else { setOpening(true); dispatch({ type: 'context', context }); } }} />{error && <Text accessibilityRole="alert" style={[type.body, { color: colors.accent }]}>{error}</Text>}<ContentLink title="Нет заказа в списке?" caption="Оставить обращение с описанием покупки" onPress={() => router.push({ pathname: '/forms/[id]', params: { id: 'appeal', expectedContext: context } })} /></ContentSection>
    <ContentSection title="Подготовка к возврату">{steps.map(({ title, body, Icon }, index) => <CompanyDisclosure key={title} title={`${index + 1}. ${title}`}><View style={{ flexDirection: 'row', gap: 12 }}><Icon size={22} color={colors.brand} /><Text style={[type.body, { flex: 1 }]}>{body}</Text></View></CompanyDisclosure>)}</ContentSection>
    <ContentSection title="Что важно учитывать"><CompanyDisclosure title="Если обнаружен недостаток"><Text style={type.body}>Обращение зависит от характера недостатка, товара, гарантии и обстоятельств покупки. Приложите имеющиеся документы и описание. Не откладывайте сообщение о проблеме, но не отказывайтесь от обращения только из-за даты покупки.</Text></CompanyDisclosure><CompanyDisclosure title="Если товар не подошёл"><Text style={type.body}>Опишите состояние и комплектность товара. Условия возврата зависят от способа покупки и свойств изделия. Для продукции по индивидуальным параметрам обстоятельства рассматриваются отдельно.</Text></CompanyDisclosure><CompanyDisclosure title="Как передать товар"><Text style={type.body}>Возможны перевозчик, курьер или передача в согласованной точке. Уточните адрес и условия приёмки до отправки. Стоимость перевозки зависит от причины возврата и применимых условий.</Text></CompanyDisclosure><CompanyDisclosure title="Документы и условия покупки"><Text style={type.body}>Сохраните документы заказа и переписку. Сроки и порядок рассмотрения зависят от требования, товара и правового статуса покупателя.</Text><ContentLink title="Публичная оферта" route="/legal/offer" /><ContentLink title="Документы покупки в кабинете" route="/orders" /><ContentLink title="Уточнить условия у менеджера" route="/information/contacts" /></CompanyDisclosure></ContentSection><BuyerInfoGrid exclude="/pages/returns" /></View>;
}
export function WarrantyGuide() {
  const router = useRouter();
  return <View style={e.page}><ContentSection><ShieldCheck size={34} color={colors.brand} /><Text accessibilityRole="header" aria-level={2} style={type.title}>Гарантия на ваше оборудование</Text><Text style={type.body}>Гарантийные условия относятся к конкретному изделию и производителю. Проверьте паспорт, руководство и документы покупки.</Text><ContentLink title="Найти документы заказа" route="/orders" /></ContentSection><CompanyDisclosure title="Какие сведения подготовить"><Text style={type.body}>Наименование, модель или артикул, дату покупки и номер заказа. Опишите недостаток и приложите фото. Если есть серийный номер — укажите его.</Text></CompanyDisclosure><CompanyDisclosure title="Где уточнить срок гарантии"><Text style={type.body}>В документах производителя и в условиях вашей покупки. Если нужного документа нет, запросите его у магазина. Общий срок для всего каталога не устанавливается.</Text></CompanyDisclosure><Button label="Обратиться по товару" onPress={() => router.push('/forms/appeal')} /><ContentLink title="Помощь с возвратом" route="/pages/returns" /><BuyerInfoGrid exclude="/pages/warranty" /></View>;
}

export function AwardRegister() {
  const [selected, setSelected] = useState<number | null>(null);
  const names = sitePages.awards.sections.flatMap(section => section.bullets ?? []).map(text => text.replace(/^\d{4} — /, ''));
  const images = [require('../../assets/company/award-0.png'), require('../../assets/company/award-1.png'), require('../../assets/company/award-2.png'), require('../../assets/company/award-3.png'), require('../../assets/company/award-4.png'), require('../../assets/company/award-5.png'), require('../../assets/company/award-6.png'), require('../../assets/company/award-7.png'), require('../../assets/company/award-8.png')];
  return <View testID="award-register" style={e.page}><Text style={type.body}>Награды за развитие и экспорт. В реестре представлены дипломы, награды компании и персональные достижения.</Text><View>{names.map((name, index) => <Pressable key={name} accessibilityRole="button" accessibilityLabel={'Подробнее: ' + name} onPress={() => setSelected(index)} style={({ pressed }) => [s.awardRow, pressed && e.pressed]}><Image source={images[index]} resizeMode="contain" accessibilityLabel={name} style={{ width: 56, height: 80 }} /><View style={{ flex: 1, gap: 5 }}><Text style={type.body}>{name}</Text>{/Ирина|Павла/.test(name) && <Text style={type.caption}>Персональная награда</Text>}</View><ArrowUpRight size={18} color={colors.brand} /></Pressable>)}</View><Text style={type.caption}>Награды компании не заменяют паспорт, сертификат или декларацию на конкретное изделие.</Text><ContentLink title="Документы на оборудование" route="/pages/warranty" /><Sheet visible={selected !== null} title="Награда" onClose={() => setSelected(null)}>{selected !== null && <><Image source={images[selected]} resizeMode="contain" accessibilityLabel={names[selected]} style={{ width: 86, height: 123, alignSelf: 'center' }} /><Text style={type.subheading}>{names[selected]}</Text><Text style={type.body}>Изображение из реестра компании. Увеличенная копия документа в текущей публикации не представлена.</Text><ContentLink title="Запросить подробности" route="/information/contacts" /></>}</Sheet><BuyerInfoGrid /></View>;
}

export function DocumentsPage() {
  const [error, setError] = useState('');
  const downloadCatalog = async () => { setError(''); try { await Linking.openURL('https://prom.myfast.space/upload/uf/c2e/z9a89bazeaxnc6s09bwmuabw6t6p9bdg/katalog.pdf'); } catch { setError('Не удалось открыть каталог. Повторите попытку или запросите файл у менеджера.'); } };
  return <View style={e.page}><Text style={type.body}>Каталог оборудования, условия покупки и обработки данных. Документы конкретного заказа доступны в кабинете.</Text><ContentLink title="Скачать каталог оборудования" caption="PDF · каталог компании" onPress={() => { void downloadCatalog(); }} icon={<FileText size={21} color={colors.brand} />} />{error && <Text accessibilityRole="alert" style={[type.body, { color: colors.accent }]}>{error}</Text>}<View>{Object.values(legalDocuments).map(document => <ContentLink key={document.id} title={document.title} route={'/legal/' + document.id} icon={<FileText size={21} color={colors.brand} />} />)}</View><ContentLink title="Реквизиты компании" route="/pages/details" /><ContentLink title="Документы моих заказов" route="/orders" /><ContentLink title="Для бизнеса · индивидуальный договор поставки" route="/information/business" /><ContentLink title="Возврат и помощь с покупкой" route="/pages/returns" /><ContentLink title="Гарантия" route="/pages/warranty" /><ContentLink title="Претензии и контакты" route="/claims" /></View>;
}
const s = StyleSheet.create({
  cooperationCard: { borderRadius: 18, overflow: 'hidden', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  cooperationCopy: { padding: 20, gap: 10 },
  cooperationAction: { minHeight: 44, flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 4, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 },
  eyebrow: { ...type.caption, color: colors.brand, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  advantageList: { backgroundColor: colors.white, borderRadius: 18, padding: 18, gap: 24 },
  advantageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  advantageIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' },
  awardRow: { flexDirection: 'row', gap: 14, alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.line },
  facts: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line }, fact: { flex: 1, gap: 8, justifyContent: 'flex-start' }, factNumber: { fontSize: 24, lineHeight: 28, color: colors.brand, fontWeight: '800' },
  export: { flexDirection: 'row', alignItems: 'center', gap: 14 }, benefit: { width: '47%', flexGrow: 1, gap: 8, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.line }, check: { flexDirection: 'row', gap: 12, paddingVertical: 12 }, step: { flexDirection: 'row', gap: 14, paddingVertical: 12 }, stepNumber: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' },
});
