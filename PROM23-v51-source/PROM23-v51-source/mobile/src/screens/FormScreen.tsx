import { legalDocuments } from '../content/legalDocuments';
import { legalCopy } from '../content/legalCopy';
import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView as HorizontalScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { Check, ChevronDown, FileText, Paperclip } from 'lucide-react-native';
import {LocalApiError,localRequest} from '../api/local';
import { siteForms, businessCheckoutForm, publicationForms, initialConsentValues, type SiteFormField } from '../forms/siteForms';
import { OrderPicker } from '../ui/OrderPicker';
import type { CustomerOrder } from './OrdersScreen';
import { loadSiteFormContext, submitSiteForm, submissionKey, type SiteFormContext, type SiteFormTarget } from '../api/site';
import { expandFields, formFieldErrors, serializeFields, withReturnTransfer } from '../forms/formModel';
import { useShop } from '../store';
import { readSpecificationDraft, removeSpecificationDraft } from '../quick-order';
import { LocationPicker } from '../ui/LocationPicker';
import { settlementLabel } from '../location-domain';
import { ConsentFields } from '../ui/ConsentFields';
import { Button, EmptyState, Header, Sheet } from '../ui/primitives';
import { colors, layout, type } from '../ui/theme';

export default function FormScreen({ formId, children }: { formId?: string; children?: ReactNode }) {
  const params = useLocalSearchParams<{ id: string; expectedContext?: string; purchaseTask?: string; purpose?: string; specificationId?: string; challengeId?: string } & SiteFormTarget>();
  const routeId = formId ?? params.id;
  const warrantyRequest = routeId === 'appeal' && params.purpose === 'warranty';
  const claimRequest = routeId === 'appeal' && params.purpose === 'claim';
  const orderRequest = warrantyRequest || claimRequest;
  const returnRequest = routeId === 'return';
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [orderPickerOpen, setOrderPickerOpen] = useState(false);
  const id = orderRequest && selectedOrder ? 'appeal-order' : routeId;
  const router = useRouter(); const { state, location, refresh, selectOrganization } = useShop();
  const definition = typeof id === 'string' && Object.hasOwn(siteForms, id) ? id === 'checkout' && state.context !== 'personal' ? businessCheckoutForm : siteForms[id] : undefined;
  const needsSettlement = ['profile-city','address-create','address-edit'].includes(id ?? '');
  const contextMismatch = !!params.expectedContext && params.expectedContext !== state.context;
  const target: SiteFormTarget = {};
  for (const key of ['productId', 'orderId', 'organizationId', 'addressId', 'cardId', 'sessionId', 'reviewId', 'questionId', 'parentId', 'appealId', 'notificationId'] as const) if (typeof params[key] === 'string' && /^[A-Za-z0-9_-]{1,100}$/.test(params[key]!)) target[key] = params[key];
  if (selectedOrder?.context === state.context) target.orderId = selectedOrder.id;
  const targetKey = JSON.stringify(target);
  const taskLabels: Record<string, string> = { height: 'Работа на высоте', concrete: 'Бетонные работы', rebar: 'Работа с арматурой', cover: 'Укрытие и защита' };
  const purchaseTask = typeof params.purchaseTask === 'string' && Object.hasOwn(taskLabels, params.purchaseTask) ? taskLabels[params.purchaseTask] : '';

  const specificationId = typeof params.specificationId === 'string' ? params.specificationId : '';
  const [specificationMissing, setSpecificationMissing] = useState(false);

  const [locationOpen, setLocationOpen] = useState(false);
  const [context, setContext] = useState<SiteFormContext>({});
  const [contextLoading,setContextLoading]=useState(false),[contextFailed,setContextFailed]=useState(false),[contextRevision,setContextRevision]=useState(0);
  const challengeId=typeof params.challengeId==='string'&&/^[A-Za-z0-9_-]{24,128}$/.test(params.challengeId)?params.challengeId:undefined;
  const [values, setValues] = useState<Record<string, string | string[] | boolean | DocumentPicker.DocumentPickerAsset[]>>({});
  const visibleFields = definition ? expandFields(definition, context, state.context !== 'personal', values) : [];
  const [consents, setConsents] = useState<Record<string, boolean>>(() => initialConsentValues(definition?.consents ?? []));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState(''); const [saving, setSaving] = useState(false);
  const requestKey=useRef(submissionKey());
  const generation = useRef(0); const submitLock = useRef(false);
  const formScroll = useRef<ScrollView>(null); const fieldPositions = useRef<Record<string, number>>({});
  const [acceptedReference, setAcceptedReference] = useState('');
  const [selecting, setSelecting] = useState<SiteFormField | null>(null);
  const draftScope = useRef('');
  useEffect(() => { setSelectedOrder(null); setOrderPickerOpen(false); }, [routeId, state.context]);
  useEffect(() => {
    const specification = id === 'quote' ? readSpecificationDraft(specificationId, state.context) : '';
    setSpecificationMissing(id === 'quote' && !!specificationId && !specification);
    const scope = JSON.stringify([routeId, state.context, purchaseTask, specificationId, challengeId, warrantyRequest, claimRequest, orderRequest || returnRequest ? null : targetKey]);
    const preserveDraft = draftScope.current === scope;
    draftScope.current = scope;
    const defaults = { ...(claimRequest ? { comment: 'Претензия по заказу.\nИмя и контакты: \nТовар, номер или дата заказа: \nПродавец (из документов покупки): \nОбстоятельства: \nМоё требование: ' } : {}), ...(warrantyRequest ? { comment: 'Прошу рассмотреть обращение по гарантийному обслуживанию.\nТовар: \nНомер или дата заказа: \nОписание проблемы: ' } : {}), ...(purchaseTask && definition?.id === 'quote' ? { 'comment-text': 'Нужна помощь с комплектацией: ' + purchaseTask + '. ' } : {}), ...(specification ? { 'comment-text': specification } : {}) };
    let active = true; requestKey.current=submissionKey();generation.current++; submitLock.current = false; setSaving(false); setContext({});
    if (!preserveDraft) { setValues(defaults); setConsents(initialConsentValues(definition?.consents ?? [])); }
    setErrors({}); setMessage(''); setAcceptedReference('');setContextLoading(!!definition);setContextFailed(false);
    if (definition) void loadSiteFormContext({ formId: definition.id, context: state.context, target: JSON.parse(targetKey),challengeId }).then(result => {
      if (active) { setContext(result); setValues(previous => preserveDraft ? { ...result.initialValues, ...previous } : { ...defaults, ...result.initialValues }); }
    }).catch(e => { if (active){setContextFailed(true);setMessage(e instanceof Error?e.message:'Не удалось загрузить данные формы.');} }).finally(()=>{if(active)setContextLoading(false)});
    return () => { active = false; generation.current++; };
  }, [id, routeId, state.context, targetKey, purchaseTask, specificationId, challengeId, contextRevision, warrantyRequest, claimRequest]);
  useEffect(() => { if(needsSettlement){generation.current++;submitLock.current=false;setSaving(false);requestKey.current=submissionKey();setAcceptedReference('');} }, [needsSettlement,location?.settlement?.id,location?.version]);
  const change = (name: string, value: string | string[] | boolean | DocumentPicker.DocumentPickerAsset[]) => { if(saving||contextLoading)return;requestKey.current=submissionKey();setValues(previous => ({ ...previous, [name]: value })); setErrors(previous => ({ ...previous, [name]: '' })); setMessage(''); };
  const attach = async (field: SiteFormField) => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({ multiple: !!field.multiple, copyToCacheDirectory: true, base64: false });
      if (!picked.canceled) {
        const maxBytes = field.maxBytes ?? 20 * 1024 * 1024;
        if (picked.assets.some(asset => (asset.size ?? 0) > maxBytes)) { setErrors(previous => ({ ...previous, [field.name]: `Максимальный размер файла — ${Math.round(maxBytes / 1024 / 1024)} МБ.` })); return; }
        if (picked.assets.length > (field.maxFiles ?? 10)) { setErrors(previous => ({ ...previous, [field.name]: `Можно выбрать до ${field.maxFiles ?? 10} файлов.` })); return; }
        if (field.acceptedExtensions?.length && picked.assets.some(asset => !field.acceptedExtensions!.some(extension => asset.name.toLowerCase().endsWith(extension.startsWith('.') ? extension.toLowerCase() : '.' + extension.toLowerCase())))) { setErrors(previous => ({ ...previous, [field.name]: 'Выберите файл разрешённого формата: ' + field.acceptedExtensions!.join(', ') })); return; }
        change(field.name, picked.assets);
      }
    } catch { setErrors(previous => ({ ...previous, [field.name]: 'Не удалось открыть файл. Попробуйте ещё раз.' })); }
  };
  const submit = async () => {
    if (!definition || submitLock.current || saving || contextMismatch || contextLoading || contextFailed || !context.revision) return;
    const formValues = definition.id === 'profile-city' ? { ...values, city: location?.settlement?.fullName ?? '' } : definition.id === 'return' ? withReturnTransfer(visibleFields, values) : values;
    const next = formFieldErrors(visibleFields, definition.id === 'return' ? values : formValues);
    if(needsSettlement && !location?.settlement) next.location='Выберите населённый пункт из списка.';
    for (const consent of definition.consents) if (consent.required && !consents[consent.name]) next[consent.name] = 'Для продолжения подтвердите согласие.';
    if (publicationForms.has(definition.id) && String(values['public-author'] ?? '').trim() && !consents.publish_author) next.publish_author = 'Подтвердите публикацию имени или оставьте поле имени пустым.';
    setErrors(next); setMessage('');
    if (Object.keys(next).length) { setMessage('Проверьте отмеченные поля.'); formScroll.current?.scrollTo({ y: 0, animated: false }); return; }
    submitLock.current = true; setSaving(true); const attempt = generation.current;
    try {
      if(definition.id==='order-pay'){
        if(!target.orderId)throw new Error('Откройте оплату из нужного заказа.');
        const payment=await localRequest<{url:string;expiresAt:string}>('/v1/payment/session',{method:'POST',key:requestKey.current,body:{expectedContext:state.context,reference:target.orderId}});
        if(attempt!==generation.current)return;const url=new URL(payment.url);if(url.protocol!=='https:'||url.username||url.password||!Number.isFinite(Date.parse(payment.expiresAt))||Date.parse(payment.expiresAt)<=Date.now())throw new Error('Не удалось подтвердить защищённую оплату.');
        await Linking.openURL(url.href);setMessage('Статус оплаты обновится после подтверждения платёжного сервиса.');return;
      }
      if(definition.id==='organization-switch'){await selectOrganization(Number(values.organization));if(attempt===generation.current)router.replace('/account');return;}
      const submittedValues = serializeFields(visibleFields, formValues);
      if (needsSettlement) submittedValues.location = { settlementId: location?.settlement?.id, version: location?.version };
      if (definition.id === 'checkout') {
        if (!state.carts[state.context].length) { setMessage('Добавьте товары в корзину.'); return; }
        submittedValues.cart = state.carts[state.context].map(line => ({ productId: line.productId, quantity: line.quantity }));
        if (!location?.settlement) { setMessage('Выберите населённый пункт получения.'); return; }
        submittedValues.city = location.settlement.fullName;
        submittedValues.location = { settlementId: location.settlement.id, version: location.version };
      }
      const result = await submitSiteForm({ formId: definition.id, idempotencyKey:requestKey.current, values: submittedValues, target, challengeId: context.challengeId??challengeId, revision:context.revision, context: state.context, consents: definition.consents.map(consent => ({ name: consent.name, accepted: !!consents[consent.name], documentIds: consent.documents })) });
      if (attempt !== generation.current) return;
      setValues({}); setConsents(initialConsentValues(definition.consents));
      if(result.status==='next-step'){router.replace({pathname:'/forms/[id]',params:{...target,id:result.nextFormId,challengeId:result.challengeId,expectedContext:state.context}});}
      else if(result.status==='authenticated'){await refresh();router.replace('/account');}
      else if(result.status==='accepted'&&result.reference&&result.reference.length<=100){if(['organization-delete','account-delete','sessions-terminate','order-repeat'].includes(definition.id))await refresh();setAcceptedReference(result.reference);if(specificationId)removeSpecificationDraft(specificationId);}
      else throw new Error('Не удалось подтвердить отправку. Проверьте статус в кабинете.');
    } catch (error) { if (attempt !== generation.current) return; if(error instanceof LocalApiError&&error.fieldErrors)setErrors(Object.fromEntries(Object.entries(error.fieldErrors).filter(([key])=>visibleFields.some(f=>f.name===key)||definition.consents.some(c=>c.name===key)))); setMessage(error instanceof Error ? error.message : 'Не удалось отправить форму. Попробуйте позже.'); }
    finally { if (attempt === generation.current) { submitLock.current = false; setSaving(false); } }
  };
  if (!definition) return <SafeAreaView style={layout.screen}><Header title="Обращение" back /><EmptyState title="Форма недоступна" message="Свяжитесь с нами — поможем решить ваш вопрос." icon={<FileText color={colors.brand} size={30} />} action={<Button label="Контакты" onPress={() => router.push('/information/contacts')} />} /></SafeAreaView>;
  if (acceptedReference) return <SafeAreaView style={layout.screen}><Header title={warrantyRequest ? 'Гарантийный случай' : claimRequest ? 'Претензия по заказу' : definition.title} back /><EmptyState title="Данные приняты" message={'Номер подтверждения: ' + acceptedReference} icon={<Check size={32} color={colors.brand} />} action={<Button label="В кабинет" onPress={() => router.replace('/account')} />} /></SafeAreaView>;
  return <SafeAreaView style={layout.screen} edges={definition.id === 'checkout' || definition.group === 'auth' ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
    <Header title={warrantyRequest ? 'Гарантийный случай' : claimRequest ? 'Претензия по заказу' : definition.title} back />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView buyerControls ref={formScroll} keyboardShouldPersistTaps="handled" style={layout.content} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
        {children}
        {orderRequest && <View style={[layout.card, { backgroundColor: colors.pale }]}>
          <Text style={type.subheading}>{claimRequest ? 'Подать претензию по заказу' : 'Запросить гарантийное обслуживание'}</Text>
          <Text style={type.body}>Выберите заказ здесь и опишите проблему. К обращению по заказу можно приложить фото или видео. Если покупали без регистрации, укажите товар, номер или дату покупки в комментарии.</Text>
          {selectedOrder && <><Text style={type.label}>Выбран заказ {selectedOrder.number}</Text><Text style={type.caption}>{selectedOrder.items.map(item => item.name).join(', ')}</Text></>}
          <Button label={selectedOrder ? 'Выбрать другой заказ' : 'Выбрать заказ'} variant="secondary" disabled={saving} onPress={() => setOrderPickerOpen(true)} />
          {selectedOrder && <Button label="Продолжить без привязки к заказу" variant="quiet" disabled={saving} onPress={() => { setSelectedOrder(null); setValues(previous => ({ comment: previous.comment ?? '', ...(previous['photos[]'] ? { 'photos[]': previous['photos[]'] } : {}) })); }} />}
        </View>}
        {contextLoading&&<View style={layout.row}><ActivityIndicator/><Text style={type.caption}>Загружаем данные формы…</Text></View>}
        {contextFailed&&<View style={layout.card}><Text accessibilityRole="alert" style={type.body}>{message}</Text>{['appeal','appeal-order','return'].includes(definition.id) && <Button label="Другие способы обращения к продавцу" variant="quiet" onPress={() => router.push('/claims')} />}<Button label="Повторить загрузку формы" variant="secondary" onPress={()=>setContextRevision(v=>v+1)}/></View>}
        {!!Object.values(errors).filter(Boolean).length && <View accessibilityRole="alert" style={[layout.card, { backgroundColor: colors.pale }]}><Text style={type.label}>Проверьте заполнение</Text>{Object.entries(errors).filter(([, value]) => value).map(([name, value]) => <Text key={name} style={type.caption}>{visibleFields.find(field => field.name === name)?.label ?? 'Согласие'}: {value}</Text>)}</View>}
        {definition.id === 'return' && <View style={{ gap: 12 }}><View style={[layout.row, { gap: 8, flexWrap: 'wrap' }]}>{['Заказ', 'Товары и причина', 'Фото', 'Обращение'].map((title, i) => <Text key={title} style={[type.caption, { color: i === 0 ? colors.accent : colors.muted }]}>{i + 1}. {title}</Text>)}</View><Text style={type.body}>Начните с заказа. Для каждого товара можно указать причину, описание и приложить фото или видео.</Text>{selectedOrder && <Text style={type.label}>Выбран заказ {selectedOrder.number}</Text>}<Button label={selectedOrder ? "Выбрать другой заказ для возврата" : "Выбрать заказ для возврата"} variant="secondary" disabled={saving} onPress={() => setOrderPickerOpen(true)} /><Text style={type.caption}>Если заказ не найден или покупка была без регистрации, направьте обращение продавцу. Отсутствие чека само по себе не препятствует обращению.</Text><Button label="Претензии и способы обращения" variant="quiet" onPress={() => router.push('/claims')} /></View>}
        {specificationMissing && <View style={[layout.card, { gap: 8 }]}><Text accessibilityRole="alert" style={type.body}>Список товаров не сохранился после перезагрузки или срок черновика истёк. Прикрепите спецификацию к заявке на просчет или опишите задачу в комментарии.</Text><Button label="Отправить заявку на просчет" variant="secondary" onPress={() => router.push('/procurement')} /></View>}
        {['quote', 'callback', 'production-request'].includes(definition.id) && <View style={[layout.card, { backgroundColor: colors.pale }]}><Text style={type.subheading}>{definition.id === 'callback' ? 'Свяжемся удобным для вас способом' : definition.id === 'production-request' ? 'Изготовим под вашу задачу' : 'Подберём комплектацию и рассчитаем поставку'}</Text><Text style={type.caption}>{definition.id === 'callback' ? 'Оставьте номер — менеджер перезвонит и ответит на вопросы.' : 'Опишите задачу. Менеджер уточнит детали и подготовит предложение.'}</Text></View>}
        {contextMismatch && <Text accessibilityRole="alert" style={[type.body, { color: colors.accent }]}>Режим покупок изменился. Откройте форму заново из нужного кабинета.</Text>}
        {!!definition.description && <Text style={type.body}>{definition.description}</Text>}{definition.externalCapture === 'payment-provider' && <Text style={type.body}>{legalCopy.savedPayment}</Text>}
        {definition.awaitingFields && !visibleFields.length && <Text style={type.body}>Форма сейчас недоступна. Свяжитесь с менеджером — поможем с вашим вопросом.</Text>}
        {!!definition.repeatedFields?.length && !context.repeatedItems && <Text style={type.caption}>Сведения о каждом товаре появятся после выбора заказа.</Text>}
        {definition.id === 'notification-preferences' && <Text style={type.body}>{legalCopy.marketing} Выберите каналы ниже или снимите отметки, чтобы отказаться от рекламы.</Text>}
        <View style={[layout.card, { gap: 18 }]}>{(definition.id === 'checkout' || ['address-create','address-edit'].includes(definition.id)) && <><Text style={type.label}>Населённый пункт получения</Text><Button label={settlementLabel(location?.settlement)} variant="secondary" disabled={saving || contextLoading} onPress={() => setLocationOpen(true)} /><LocationPicker visible={locationOpen} onClose={() => setLocationOpen(false)} /></>}
        {visibleFields.map(field => <View key={field.name} style={{ gap: 7 }}>
          <>{field.groupTitle && <Text style={type.subheading}>{field.groupTitle}</Text>}</>{field.type !== 'checkbox' && <Text style={type.label}>{field.label}{field.required ? ' *' : ''}</Text>}
          {definition.id === 'profile-city' && field.name === 'city' ? <><Button label={settlementLabel(location?.settlement)} variant="secondary" disabled={saving || contextLoading} onPress={() => setLocationOpen(true)} /><LocationPicker visible={locationOpen} onClose={() => setLocationOpen(false)} /></> : field.type === 'checkbox' ? <Pressable accessibilityRole="checkbox" accessibilityLabel={field.label} accessibilityState={{ checked: !!values[field.name], disabled: field.readOnly || saving || contextLoading }} aria-checked={!!values[field.name]} disabled={field.readOnly || saving || contextLoading} onPress={() => change(field.name, !values[field.name])} style={s.choice}><View style={[s.box, !!values[field.name] && { backgroundColor: colors.brand }]}>{!!values[field.name] && <Check color={colors.white} size={18} />}</View><Text style={type.body}>{field.placeholder ?? field.label}</Text></Pressable>
            : field.type === 'select' ? <Pressable accessibilityRole="button" accessibilityLabel={field.label} accessibilityState={{disabled:field.readOnly || saving || contextLoading}} disabled={field.readOnly || saving || contextLoading} onPress={() => setSelecting(field)} style={s.choice}><Text style={[type.body, { flex: 1, color: values[field.name] ? colors.ink : colors.muted }]}>{(field.multiple ? field.options?.filter(option => Array.isArray(values[field.name]) && (values[field.name] as string[]).includes(option.value)).map(option => option.label).join(', ') || undefined : field.options?.find(option => option.value === values[field.name])?.label) ?? 'Выберите'}</Text><ChevronDown color={colors.brand} size={20} /></Pressable>
            : field.type === 'file' ? <><Text style={type.caption}>{legalCopy.upload}</Text><Button disabled={saving} label="Прикрепить файл" variant="secondary" icon={<Paperclip size={18} color={colors.brand} />} onPress={() => { void attach(field); }} />{Array.isArray(values[field.name]) && (values[field.name] as DocumentPicker.DocumentPickerAsset[]).map((file, index) => <View key={file.uri + index} style={layout.between}><Text style={[type.caption, { flex: 1 }]}>{file.name}{typeof file.size === 'number' ? ' · ' + (file.size / 1024 / 1024).toFixed(1) + ' МБ · выбран' : ''}</Text><Button label="Убрать" variant="quiet" onPress={() => change(field.name, (values[field.name] as DocumentPicker.DocumentPickerAsset[]).filter((_, i) => i !== index))} /></View>)}</>
            : field.type === 'media-selection' ? (!context.existingMedia?.length ? <Text style={type.caption}>Нет загруженных фотографий.</Text> : <HorizontalScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{context.existingMedia.map(item => { const selected = Array.isArray(values[field.name]) && (values[field.name] as string[]).includes(item.id); return <Pressable key={item.id} accessibilityRole="checkbox" accessibilityLabel={(item.kind === 'video' ? 'Видео' : 'Фото') + (selected ? ', отмечено для удаления' : '')} aria-checked={selected} disabled={saving || contextLoading} onPress={() => { const current = Array.isArray(values[field.name]) ? values[field.name] as string[] : []; change(field.name, selected ? current.filter(id => id !== item.id) : [...current, item.id]); }} style={{ width: 86, height: 86, borderRadius: 10, overflow: 'hidden' }}>{item.kind === 'image' ? <Image source={{ uri: item.url }} accessibilityLabel={item.alt} style={[{ width: '100%', height: '100%' }, selected && { opacity: 0.35 }]} resizeMode="cover" /> : <View style={[{ width: '100%', height: '100%', backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' }, selected && { opacity: 0.35 }]}><Text style={type.label}>▶ Видео</Text></View>}{selected && <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: colors.accent, borderRadius: 10, padding: 2 }}><Check color={colors.white} size={14} /></View>}</Pressable>; })}</HorizontalScrollView>)
            : <TextInput accessibilityLabel={field.label} value={typeof values[field.name] === 'string' ? values[field.name] as string : ''} onChangeText={value => change(field.name, value)} secureTextEntry={field.type === 'password'} multiline={field.type === 'textarea'} keyboardType={field.type === 'email' ? 'email-address' : field.type === 'tel' ? 'phone-pad' : definition.id === 'return' && field.repeat?.sourceName === 'quantity' ? 'decimal-pad' : field.type === 'number' || field.type === 'otp' ? 'number-pad' : 'default'} autoCapitalize={['email', 'password'].includes(field.type) ? 'none' : 'sentences'} autoCorrect={!['email', 'password', 'otp'].includes(field.type)} editable={!field.readOnly && !saving && !contextLoading} maxLength={field.maxLength ?? (field.type === 'textarea' ? 5000 : 500)} placeholder={field.placeholder ?? (field.type === 'date' ? 'ДД.ММ.ГГГГ' : field.label)} placeholderTextColor={colors.muted} style={[s.input, field.type === 'textarea' && { minHeight: 130, textAlignVertical: 'top' }, !!errors[field.name] && { borderColor: colors.accent }]} />}
          {!!field.hint && <Text style={type.caption}>{field.hint}</Text>}
          {!!errors[field.name] && <Text accessibilityRole="alert" style={[type.caption, { color: colors.accent }]}>{errors[field.name]}</Text>}
        </View>)}</View>
        {!!definition.notice && <Text style={type.caption}>{definition.notice}</Text>}
        {definition.id === 'return' && <View style={[layout.card, {gap:12}]}><Text style={type.subheading}>Передача товара продавцу</Text><Text style={type.caption}>Укажите предпочтительный способ: отправка перевозчиком, личная передача или другой вариант. Адрес и условия передачи уточните у фактического продавца до отправки. Эти сведения войдут в комментарий по каждому выбранному товару.</Text><TextInput accessibilityLabel="Способ передачи товара" placeholder="Как вам удобно передать товар" value={String(values['ui:return-method'] ?? '')} maxLength={300} editable={!saving} onChangeText={value => change('ui:return-method',value)} style={s.input} /><TextInput accessibilityLabel="Перевозчик и номер отправления" placeholder="Если товар уже отправлен" value={String(values['ui:return-tracking'] ?? '')} maxLength={200} editable={!saving} onChangeText={value => change('ui:return-tracking',value)} style={s.input} /><Text style={type.caption}>Номер отправления не подтверждает получение товара продавцом. Сохраните квитанцию перевозчика.</Text></View>}
        {['appeal', 'appeal-order', 'return'].includes(definition.id) && <Text style={type.body}>{legalCopy.service}</Text>}
        {['address-create', 'address-edit', 'profile-city'].includes(definition.id) && <Text style={type.body}>{legalCopy.address}</Text>}
        {definition.id === 'checkout' && <Text style={type.body}>{state.context === 'personal' ? legalCopy.checkoutPersonal : legalCopy.checkoutBusiness}</Text>}
        {publicationForms.has(definition.id) && <View style={layout.card}><Text style={type.subheading}>Будет опубликовано</Text><Text style={type.body}>Автор: {String(values['public-author'] ?? '').trim() || 'Анонимно'}</Text><Text style={type.body}>{String(values['review-text'] ?? values['question-text'] ?? '') || 'Ваш текст появится здесь'}</Text><Text style={type.caption}>Город, аватар, телефон, e-mail, адрес и данные заказа не публикуются. Проверьте, что сам текст и вложения не содержат лишних персональных данных. Материал проходит проверку перед публикацией.</Text></View>}
        <ConsentFields disabled={saving} consents={definition.consents} values={consents} errors={errors} onChange={(name, checked) => { if(saving)return;requestKey.current=submissionKey();setConsents(previous => ({ ...previous, [name]: checked })); setMessage(''); setErrors(previous => ({ ...previous, [name]: '' })); }} />
        {definition.legalDocuments?.filter(documentId => documentId !== 'privacy' && !definition.consents.some(consent => consent.documents.includes(documentId))).map(documentId => <Button key={documentId} label={legalDocuments[documentId].title} variant="quiet" onPress={() => router.push({ pathname: '/legal/[id]', params: { id: documentId } })} />)}
        {!!message && !contextFailed && <Text accessibilityRole="alert" style={[type.body, { color: colors.accent }]}>{message}</Text>}
        {saving && <ActivityIndicator color={colors.brand} />}
        <Button label={saving ? 'Отправляем…' : definition.submitLabel} disabled={(definition.id === 'subscription' && !consents.marketing) || saving || contextLoading || contextFailed || !context.revision || contextMismatch || (!!definition.awaitingFields && !visibleFields.length)} onPress={() => { void submit(); }} />
        {definition.relatedForms?.filter(target => siteForms[target]).map(target => <Button key={target} label={siteForms[target].title} variant="quiet" onPress={() => router.push({ pathname: '/forms/[id]', params: { ...params, id: target, expectedContext: state.context } })} />)}
        <Button label="Связаться с менеджером" variant="quiet" onPress={() => router.push('/information/contacts')} />
      </ScrollView>
    </KeyboardAvoidingView>
    <OrderPicker visible={orderPickerOpen} completedOnly={returnRequest} context={state.context} onClose={() => setOrderPickerOpen(false)} onSelect={order => {
      setValues(previous => returnRequest ? {} : ({ comment: previous.comment ?? '', ...(previous['photos[]'] ? { 'photos[]': previous['photos[]'] } : {}) }));
      setConsents(initialConsentValues(definition.consents));
      setSelectedOrder(order); setOrderPickerOpen(false); setSelecting(null);
    }} />
    <Sheet visible={!!selecting} title={selecting?.label ?? 'Выбор'} onClose={() => setSelecting(null)}>{selecting?.options?.length ? selecting.options.map(option => <Button key={option.value} label={(selecting.multiple && Array.isArray(values[selecting.name]) && (values[selecting.name] as string[]).includes(option.value) ? '✓ ' : '') + option.label} variant="secondary" onPress={() => { if (selecting.multiple) { const selected = Array.isArray(values[selecting.name]) ? values[selecting.name] as string[] : []; change(selecting.name, selected.includes(option.value) ? selected.filter(value => value !== option.value) : [...selected, option.value]); } else { change(selecting.name, option.value); setSelecting(null); } }} />) : <><Text style={type.body}>Не удалось загрузить варианты этого поля. Повторите загрузку формы — введённый текст сохранится.</Text><Button label="Повторить загрузку" onPress={() => { setSelecting(null); setContextRevision(value => value + 1); }} /></>}</Sheet>
  </SafeAreaView>;
}
const s = StyleSheet.create({ input: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background, borderRadius: 11, minHeight: 52, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, color: colors.ink }, choice: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, padding: 12, backgroundColor: colors.background, borderRadius: 11 }, box: { width: 24, height: 24, borderWidth: 1.5, borderColor: colors.brand, borderRadius: 5, alignItems: 'center', justifyContent: 'center' } });
