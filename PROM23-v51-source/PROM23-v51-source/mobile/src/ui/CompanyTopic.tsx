import React, { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowRight, ArrowUpRight, Box, ClipboardList, Factory, FileText, Layers3, MapPin, PackageCheck, Ruler, Truck, UserRound } from 'lucide-react-native';
import { useShop } from '../store';
import { businessAdvantages, businessCategoryGroups, businessQuestions, productionQuestions, productionStages } from '../content/companyContent';
import { QuestionAnswer } from './QuestionAnswer';
import { CompanyDisclosure, CompanyTrust } from './CompanyTrust';
import { ProjectShowcase } from './ProjectShowcase';
import { CompanyProjectDirectory, ProductionDepartments, ProductionFilm } from './SourceCompanyContent';
import { Button } from './primitives';
import { Reveal } from './Reveal';
import { ContentLink, ContentSection, EvidenceGallery, SupplyWorkflow, e } from './EditorialContent';
import { ProductCard } from './ProductCard';
import { colors, layout, type } from './theme';
import { palette, spacing } from './tokens';

const advantageIcons = { offer: ClipboardList, kit: Layers3, reserve: PackageCheck, production: Factory, delivery: Truck, documents: FileText };

function Photo({ source, label, caption }: { source: ImageSourcePropType; label: string; caption: string }) {
  return <View style={s.photoGroup}><View style={s.photo}><Image source={source} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} accessibilityLabel={label} accessibilityIgnoresInvertColors /></View><Text style={type.caption}>{caption}</Text></View>;
}

function CatalogGroups() {
  const router = useRouter();
  const { catalogTree } = useShop();
  return <View style={s.section}>
    <Text accessibilityRole="header" aria-level={2} style={type.heading}>Для основных этапов работ</Text>
    <Text style={type.body}>Складские, производственные и заказные позиции можно собрать в одну поставку.</Text>
    <View>{businessCategoryGroups.map(group => {
      const sections = group.sectionIds.flatMap(id => catalogTree.sections.find(item => item.id === id) ?? []);
      return <CompanyDisclosure key={group.title} title={group.title}>
        <Text style={type.caption}>{group.description}</Text>
        {sections.map(section => <Button key={section.id} variant="quiet" label={section.name} icon={<ArrowUpRight size={17} color={colors.brand} />} onPress={() => router.push({ pathname: '/catalog', params: { section: section.id } })} />)}
        {!sections.length && <Button variant="quiet" label="Подобрать оборудование в каталоге" onPress={() => router.push('/catalog')} />}
      </CompanyDisclosure>;
    })}</View>
    <Button label="Весь каталог" variant="secondary" icon={<ArrowRight color={colors.brand} size={18} />} onPress={() => router.push('/catalog')} />
  </View>;
}

function BusinessFaq() {
  const [active, setActive] = useState(0);
  return <View testID="business-faq" style={s.section}>
    <Text accessibilityRole="header" aria-level={2} style={type.heading}>Условия без недосказанности</Text>
    <View style={s.topicTabs} accessibilityRole="tablist" accessibilityLabel="Темы вопросов для бизнеса">
      {businessQuestions.map((group, index) => <TopicTab key={group.title} title={group.title} active={active === index} onPress={() => setActive(index)} />)}
    </View>
    <View key={active}>{businessQuestions[active].items.map(item => <QuestionAnswer key={item.question} question={item.question} answer={item.answer} />)}</View>
  </View>;
}

function TopicTab({ title, active, onPress }: { title: string; active: boolean; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} aria-selected={active} onPress={onPress}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={({ pressed }) => [s.tab, active && s.tabActive, focused && s.focus, pressed && { opacity: 0.75 }]}>
    <Text style={[type.label, { textAlign: 'center' }, active ? { color: colors.white } : { color: colors.brand }]}>{title}</Text>
  </Pressable>;
}

function ProductionProcess() {
  const [selected, setSelected] = useState(0);
  const [focused, setFocused] = useState<number | null>(null);
  return <View testID="production-process" style={s.section}>
    <View style={s.headingRow}><Ruler size={23} color={colors.accent} /><Text accessibilityRole="header" aria-level={2} style={[type.heading, { flex: 1 }]}>Как создаём оборудование</Text></View>
    <Text style={type.body}>Конструкторский отдел, склад сырья, производственный цех и контроль качества работают над одним изделием.</Text>
    <View style={s.processTabs} accessibilityRole="tablist" accessibilityLabel="Этапы производства">
      {productionStages.map((stage, index) => <Pressable key={stage.title} accessibilityRole="tab" accessibilityLabel={`${index + 1}. ${stage.title}`} accessibilityState={{ selected: selected === index }} aria-selected={selected === index} onPress={() => setSelected(index)} onFocus={() => setFocused(index)} onBlur={() => setFocused(null)} style={({ pressed }) => [s.processTab, selected === index && s.processTabActive, focused === index && s.focus, pressed && { opacity: 0.7 }]}>
        <Text style={[s.stageNumber, selected === index && { color: colors.white }]}>{String(index + 1).padStart(2, '0')}</Text>
        <Text style={[type.caption, { color: selected === index ? colors.white : colors.brand }]}>{stage.title}</Text>
      </Pressable>)}
    </View>
    <Reveal key={selected}><View style={s.processBody}><Text accessibilityRole="header" aria-level={3} style={type.subheading}>{productionStages[selected].title}</Text><Text style={type.body}>{productionStages[selected].text}</Text></View></Reveal>

  </View>;
}

export function CompanyTopic({ topic }: { topic: 'business' | 'production' }) {
  const router = useRouter();
  const { state, products } = useShop();
  const business = topic === 'business';
  const procurement = () => router.push('/procurement' as Href);
  const productionRequest = () => router.push({ pathname: '/forms/[id]', params: { id: 'production-request', expectedContext: state.context } });
  const contacts = () => router.push('/information/contacts');

  return <View testID={'company-topic-' + topic} style={s.page}>
    <View style={s.intro}>
      <Text style={s.eyebrow}>{business ? 'ДЛЯ ЮРИДИЧЕСКИХ ЛИЦ И ИП' : 'ПРОМЫШЛЕННИК · TeaM'}</Text>
      <Text accessibilityRole="header" aria-level={2} style={s.headline}>{business ? 'Снабжение объекта.\nОт задачи до поставки.' : 'Создаём оборудование\nдля вашей работы.'}</Text>
      <Text style={[type.body, { color: colors.muted }]}>{business ? 'Подберём комплект, подготовим предложение и согласуем отгрузку. Начать можно с файла или описания задачи.' : 'Собственное производство в Краснодарском крае: конструкторская разработка, изготовление и контроль качества.'}</Text>
      <Button label={business ? 'Отправить заявку на закупку' : 'Обсудить изготовление'} icon={<ArrowRight size={18} color={colors.white} />} onPress={business ? procurement : productionRequest} />
      {business && <Text style={type.caption}>Спецификация, перечень позиций или потребность своими словами. Артикулы необязательны.</Text>}
    </View>

    <Photo source={business ? require('../../assets/brand/equipment-wide.webp') : require('../../assets/brand/factory-wide.webp')} label={business ? 'Бадьи для бетона с маркировкой Промышленник — собственная продукция на фото компании' : 'Собственная производственная база Промышленника — общий вид цеха'} caption={business ? 'Оборудование под маркой «Промышленник»' : 'Производственная база · Краснодарский край'} />

    {business ? <>
      <View style={s.section}>
        <Text accessibilityRole="header" aria-level={2} style={type.heading}>{'Одна закупка.\nСогласованный комплект.'}</Text>
        <View style={e.grid}>{businessAdvantages.map(item => {
          const Icon = advantageIcons[item.id];
          return <View key={item.id} style={{ width: '47%', flexGrow: 1, padding: 12, gap: 7, backgroundColor: colors.white, borderRadius: 12 }}><Icon size={22} color={colors.brand} /><Text accessibilityRole="header" aria-level={3} style={type.subheading}>{item.title}</Text><Text numberOfLines={2} style={type.caption}>{item.text}</Text><CompanyDisclosure title="Условия"><Text style={type.body}>{item.text}</Text></CompanyDisclosure></View>;
        })}</View>
      </View>

      <View style={s.warehouse}><Box size={27} color={colors.brand} /><View style={{ flex: 1, gap: 4 }}><Text style={s.warehouseNumber}>12 000 м²</Text><Text style={type.label}>Краснодарский склад</Text><Text style={type.caption}>Логистический узел для отгрузок по Югу России, в другие регионы и страны СНГ.</Text></View></View>
      <SupplyWorkflow />
      <CatalogGroups />
      {!!products.length && <ContentSection title="Оборудование для объекта"><FlatList horizontal data={products.slice(0, 6)} keyExtractor={item => item.id} showsHorizontalScrollIndicator initialNumToRender={2} ItemSeparatorComponent={() => <View style={{ width: 10 }} />} renderItem={({ item }) => <View style={{ width: 190 }}><ProductCard product={item} compact /></View>} /><ContentLink title="Нужен один товар? В каталог" route="/catalog" /></ContentSection>}
      <ProjectShowcase /><CompanyProjectDirectory />

      <View style={s.account}>
        <UserRound size={25} color={colors.brand} />
        <Text accessibilityRole="header" aria-level={2} style={type.heading}>Кабинет для повторных закупок</Text>
        <Text style={type.body}>Реквизиты организации, история заказов, статусы и документы — в одном профиле. Доступ сотрудников к заказам организации зависит от их прав.</Text>
        <Text style={type.caption}>Первую заявку можно отправить до создания организации. ЭДО подключается отдельно по согласованию.</Text>
        <Button label="Открыть кабинет" variant="secondary" onPress={() => router.push('/account')} />
      </View>
      <BusinessFaq />
      <CompanyTrust variant="expanded" />
      <View style={s.finalAction}><Text accessibilityRole="header" aria-level={2} style={type.heading}>Есть задача на закупку?</Text><Text style={type.body}>Передайте потребность, сроки и место поставки. Менеджер уточнит детали и подготовит предложение.</Text><Button label="Отправить заявку на закупку" onPress={procurement} /><Button label="Связаться с отделом продаж" variant="quiet" onPress={contacts} /></View>
    </> : <>
      <View style={s.manufacturer}><Factory size={24} color={colors.brand} /><View style={{ flex: 1, gap: 6 }}><Text style={type.subheading}>ООО «ТЕАМ ИНДАСТРИ»</Text><Text style={type.body}>Выпускаем продукцию под марками «Промышленник» и TeaM. Стандартные изделия и производственные позиции под техническую задачу.</Text></View></View>
      <ProductionProcess />
      <ProductionDepartments />
      <ProductionFilm />
      <EvidenceGallery items={[
        { source: require('../../assets/brand/factory-wide.webp'), label: 'Общий вид производственной базы компании', caption: 'Производственный цех' },
        { source: require('../../assets/brand/laser-wide.webp'), label: 'Лазерная обработка материала на производстве', caption: 'Обработка материалов' },
        { source: require('../../assets/brand/equipment-wide.webp'), label: 'Бадьи для бетона с маркировкой Промышленник', caption: 'Готовая продукция' },
      ]} />
      <View style={s.section}>
        <Text accessibilityRole="header" aria-level={2} style={type.heading}>Нужно своё исполнение?</Text>
        <Text style={type.body}>Чертёж или размеры, нагрузка, материал, количество и срок помогут конструктору оценить задачу. Возможность изготовления проверяем до подтверждения заказа.</Text>
        <Button label="Передать требования к изделию" icon={<Ruler size={18} color={colors.white} />} onPress={productionRequest} />
        <Button label="Выбрать готовое оборудование" variant="secondary" onPress={() => router.push('/catalog')} />
      </View>
      <CatalogGroups />
      <ProjectShowcase /><CompanyProjectDirectory />
      <ContentLink title="Паспорта и документы на оборудование" caption="Запросить документ для своего изделия" route="/pages/warranty" />
      <CompanyTrust variant="expanded" />
      <View style={s.section}>
        <Text accessibilityRole="header" aria-level={2} style={type.heading}>О продукции и производстве</Text>
        <View>{productionQuestions.map(item => <QuestionAnswer key={item.question} question={item.question} answer={item.answer} />)}</View>
      </View>
      <View style={s.finalAction}>
        <Text accessibilityRole="header" aria-level={2} style={type.heading}>Посмотрите, как мы работаем</Text>
        <Text style={type.body}>Запишитесь на экскурсию, чтобы познакомиться с производством. Время и место встречи согласуем с вами.</Text>
        <View style={[layout.row, { gap: 8, alignItems: 'flex-start' }]}><MapPin size={18} color={colors.brand} /><Text style={[type.caption, { flex: 1 }]}>Краснодар, ул. Карла Гусника, 17/20</Text></View>
        <Button label="Записаться на экскурсию" onPress={() => router.push({ pathname: '/forms/[id]', params: { id: 'tour', expectedContext: state.context } })} />
        <Button label="Адрес и связь с менеджером" variant="quiet" onPress={contacts} />
      </View>
    </>}
  </View>;
}

const s = StyleSheet.create({
  page: { gap: spacing.section },
  intro: { gap: 13, paddingTop: 4 },
  eyebrow: { ...type.caption, color: colors.brand, letterSpacing: 1, fontSize: 11, fontWeight: '700' },
  headline: { ...type.title, fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  section: { gap: 16 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photoGroup: { gap: 8 },
  photo: { width: '100%', height: 150, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.pale },
  advantage: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 19, borderTopWidth: 1, borderTopColor: colors.line },
  warehouse: { flexDirection: 'row', gap: 17, padding: 20, backgroundColor: colors.white, borderRadius: 16 },
  warehouseNumber: { ...type.title, color: colors.brand, fontSize: 30, lineHeight: 36 },
  account: { padding: 20, gap: 13, borderRadius: 16, backgroundColor: colors.pale },
  topicTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 3, paddingHorizontal: 2 },
  tab: { width: '47%', flexGrow: 1, minHeight: 50, paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.white, justifyContent: 'center' },
  tabActive: { backgroundColor: colors.brand },
  focus: { outlineColor: colors.brand, outlineStyle: 'solid', outlineWidth: 2 },
  manufacturer: { flexDirection: 'row', gap: 13, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  processTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  processTab: { width: '47%', flexGrow: 1, minHeight: 78, padding: 12, gap: 6, borderRadius: 12, backgroundColor: colors.white },
  processTabActive: { backgroundColor: colors.brand },
  stageNumber: { ...type.heading, color: colors.brand, fontSize: 21 },
  processBody: { minHeight: 115, gap: 8 },
  finalAction: { padding: 20, gap: 13, backgroundColor: palette.orange100, borderRadius: 18 },
});
