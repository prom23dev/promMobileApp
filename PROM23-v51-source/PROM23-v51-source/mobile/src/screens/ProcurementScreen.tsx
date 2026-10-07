import { legalCopy } from '../content/legalCopy';
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { FileDropZone } from '../ui/FileDropZone';
import { FileUp, MapPin, Paperclip, X } from 'lucide-react-native';
import { useShop } from '../store';
import { businessRequestConsents, initialConsentValues } from '../forms/siteForms';
import { settlementLabel } from '../location-domain';
import { procurementErrors, type ProcurementFile } from '../procurement';
import type { UploadProgress } from '../api/upload';
import { submitProcurement, type ProcurementResult } from '../api/procurement';
import { submissionKey } from '../api/site';
import { Button, Header } from '../ui/primitives';
import { ConsentFields } from '../ui/ConsentFields';
import { LocationPicker } from '../ui/LocationPicker';
import { PageMeta } from '../ui/PageMeta';
import { colors, layout, type } from '../ui/theme';

export function ProcurementForm({ embedded = false, business = false }: { embedded?: boolean; business?: boolean }) {
  const router = useRouter(); const { location, state, products, dispatch, ready, busy: shopBusy, error: shopError } = useShop();
  const params = useLocalSearchParams<{ previousCart?: string; mode?: string }>();
  const initialComment = params.previousCart === 'company' ? state.carts['organization-demo'].map(line => { const p = products.find(p => p.id === line.productId); return `${p?.sku ?? line.productId} — ${line.quantity} ${p?.unit ?? 'ед.'}`; }).join('\n') : '';
  const [values, setValues] = useState({ name: '', phone: '', email: '', company: '', inn: '', comment: initialComment });
  const [objectAddress, setObjectAddress] = useState('');
  const [task, setTask] = useState('');
  const [deadline, setDeadline] = useState('');
  const [pendingBusiness, setPendingBusiness] = useState(false);
  useEffect(() => { if (!pendingBusiness || shopBusy) return; if (shopError) { setPendingBusiness(false); setMessage(shopError); } else if (state.context !== 'personal') { setPendingBusiness(false); void submit(); } }, [pendingBusiness, shopBusy, shopError, state.context]);
  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});
  const [files, setFiles] = useState<ProcurementFile[]>([]); const [consents, setConsents] = useState<Record<string, boolean>>(() => initialConsentValues(businessRequestConsents));
  const [errors, setErrors] = useState<Record<string, string>>({}); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [mode, setMode] = useState<'list' | 'selection'>(params.mode === 'selection' ? 'selection' : 'list');
  const [result, setResult] = useState<ProcurementResult | null>(null);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const currentScope = `${state.context}|${location?.settlement?.id ?? ''}|${location?.version ?? 0}`;
  const scopeRef = useRef(currentScope); scopeRef.current = currentScope;
  const sourceConsents = businessRequestConsents;
  function clearErrors(...keys:string[]) { setMessage(''); setErrors(old=>{const next={...old};for(const key of keys)delete next[key];return next;}); }
  function changeValue(key:keyof typeof values,value:string) { setValues(old=>({...old,[key]:value}));clearErrors(key); }
  useEffect(()=>{if(location?.settlement?.id)clearErrors('settlementId');},[location?.settlement?.id,location?.version]);
  function addFiles(incoming: ProcurementFile[]) {
    const combined = [...files, ...incoming];
    if (new Set(combined.map(file => file.uri)).size !== combined.length) { setErrors(old => ({ ...old, files: 'Этот файл уже выбран. Уберите повтор или выберите другой.' })); return false; }
    const error = procurementErrors({ ...values, context: state.context, mode, files: combined, settlementId: null, locationVersion: 0, consent: [] }).files;
    if (error) { setErrors(old => ({ ...old, files: error })); return false; }
    setFiles(combined); clearErrors('files','comment'); return true;
  }
  async function attach() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true, base64: false });
      if (!result.canceled) addFiles(result.assets);
    } catch { setErrors(old => ({ ...old, files: 'Не удалось открыть файлы. Повторите выбор.' })); }
  }
  async function submit() {
    if (lock.current || result) return;
    const request = { ...values, context: state.context, mode, files, settlementId: location?.settlement?.id ?? null, locationVersion: location?.version ?? 0, consent: sourceConsents.map(c => ({ name: c.name, accepted: !!consents[c.name], documentIds: c.documents })) };
    const next = procurementErrors(request);
    for (const c of sourceConsents) if (c.required && !consents[c.name]) next[c.name] = 'Подтвердите согласие.';
    setErrors(next); setMessage('');
    if (Object.keys(next).length) { setMessage('Проверьте отмеченные поля.'); return; }
    if (business && state.context === 'personal') { if (!ready || shopBusy) return; setPendingBusiness(true); dispatch({ type: 'context', context: 'business' }); return; }
    request.comment = [task && 'Тема: ' + task, deadline.trim() && 'Желаемый срок: ' + deadline.trim(), objectAddress.trim() && 'Адрес объекта: ' + objectAddress.trim(), request.comment].filter(Boolean).join('\n\n');
    if (request.comment.length > 5000) { setErrors({ comment: 'Описание, тема, срок и адрес вместе — до 5000 символов.' }); return; }
    lock.current = true; setBusy(true); setUploads({});
    const fingerprint = JSON.stringify(request);
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { fingerprint, key: submissionKey() };
    const startedScope = currentScope;
    try {
      const accepted = await submitProcurement(request, { idempotencyKey: attempt.current.key, onUploadProgress: progress => setUploads(old => ({ ...old, [progress.uri]: progress })), ensureCurrent: () => {
        if (scopeRef.current !== startedScope) throw new Error('Режим покупок или населённый пункт изменился. Проверьте заявку и отправьте заново.');
      } });
      setResult(accepted);
    }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Не удалось отправить. Файлы и текст остаются в форме.'); }
    finally { lock.current = false; setBusy(false); }
  }
  const content = <View testID={business ? "business-specification-form" : "procurement-form"} style={{gap:20}}>
    {result ? <View testID="procurement-result" style={[layout.card, { gap: 14 }]}><Text accessibilityRole="header" aria-level={2} style={type.heading}>Заявка сохранена</Text><Text style={type.body}>Номер: {result.reference}</Text><Text accessibilityRole="alert" style={type.body}>{result.deliveryStatus === 'pending' ? 'Заявка и вложения сохранены. Передача менеджеру пока не подтверждена. Повторная отправка не нужна — при обращении назовите номер заявки.' : 'Заявка и вложения переданы в CRM, уведомление менеджеру поставлено в очередь. Мы свяжемся с вами по указанным контактам.'}</Text><Button label="Создать другую заявку" variant="secondary" onPress={() => { setResult(null); setObjectAddress(''); setTask(''); setDeadline(''); setValues({ name: '', phone: '', email: '', company: '', inn: '', comment: '' }); setFiles([]); setUploads({}); setConsents(initialConsentValues(businessRequestConsents)); setErrors({}); setMessage(''); attempt.current = null; }} /></View> : <>
    <View style={{ gap: 12 }}><Text accessibilityRole="header" aria-level={2} style={type.heading}>Чем можем помочь?</Text><Text style={type.body}>Закупить оборудование, подобрать комплект, изготовить по чертежу или обсудить условия сотрудничества. Опишите задачу — уточним детали и подготовим ответ.</Text><View style={{flexDirection:'row',flexWrap:'wrap',gap:8}}>{['Закупка оборудования','Подбор комплекта','Изготовление по ТЗ','Условия сотрудничества','Другой вопрос'].map(label => <Pressable key={label} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{checked:task===label,disabled:busy}} aria-checked={task===label} disabled={busy} onPress={()=>{setTask(label);setMode(label==='Подбор комплекта'?'selection':'list');}} style={{minHeight:44,paddingHorizontal:12,paddingVertical:10,borderRadius:12,borderWidth:1,borderColor:task===label?colors.brand:colors.line,backgroundColor:task===label?colors.pale:colors.white}}><Text style={type.label}>{label}</Text></Pressable>)}</View></View>
    <View style={[layout.card, { borderWidth: 1, borderColor: colors.line, gap: 14 }]}><FileUp size={32} color={colors.accent} /><Text style={type.subheading}>Ваша задача</Text><Text style={type.label}>Что вам нужно?</Text><TextInput accessibilityLabel="Что вам нужно?" editable={!busy} value={values.comment} onChangeText={comment => changeValue('comment',comment)} placeholder="Например: леса для фасада 600 м², поставка в Краснодар. Или задайте вопрос об оплате, документах и сотрудничестве." multiline maxLength={5000} textAlignVertical="top" style={[type.body,{minHeight:136,borderWidth:1,borderColor:errors.comment?colors.accent:colors.line,borderRadius:12,padding:12,backgroundColor:colors.background}]} />{errors.comment && <Text accessibilityRole="alert" style={{color:colors.accent}}>{errors.comment}</Text>}<Text style={type.caption}>Достаточно описания или файла. Спецификация, смета, чертёж и фото — по желанию.</Text><Text style={type.caption}>{legalCopy.upload}</Text><FileDropZone files={files} disabled={busy} onFiles={addFiles} onError={files => setErrors(old => ({ ...old, files }))}><Button label="Прикрепить файлы" variant="secondary" icon={<Paperclip size={20} color={colors.brand} />} onPress={() => { void attach(); }} disabled={busy} /></FileDropZone><Text style={type.caption}>PDF, Excel, CSV, Word или фото. До 10 файлов, каждый до 20 МБ.</Text>{files.map((file, index) => { const progress = uploads[file.uri]; const percent = progress?.total ? Math.round(progress.sent / progress.total * 100) : 0;
      const status = !progress ? 'Выбран' : progress.status === 'reading' ? 'Читаем файл…' : progress.status === 'uploading' ? 'Загружаем · ' + percent + '%' : progress.status === 'verifying' ? 'Проверяем файл…' : progress.status === 'complete' ? 'Файл загружен' : 'Не удалось загрузить';
      return <View key={file.uri + index} testID="procurement-upload-file" style={{ gap: 7 }}><View style={layout.between}><View style={{ flex: 1 }}><Text numberOfLines={2} style={type.label}>{file.name}</Text><Text accessibilityLiveRegion="polite" style={type.caption}>{status} · {file.size ? (file.size / 1024 / 1024).toFixed(2) + ' МБ' : 'Размер не определён'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={'Убрать файл ' + file.name} accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => setFiles(old => old.filter((_, i) => i !== index))} style={({ pressed }) => ({ padding: 12, opacity: pressed || busy ? .5 : 1 })}><X size={20} color={colors.brand} /></Pressable></View>
      {progress && progress.status !== 'error' && <View accessibilityRole="progressbar" accessibilityLabel={'Загрузка ' + file.name} accessibilityValue={{ min: 0, max: 100, now: percent, text: status }} style={{ height: 4, backgroundColor: colors.pale, overflow: 'hidden', borderRadius: 2 }}><View style={{ width: percent + '%' as `${number}%`, height: 4, backgroundColor: colors.brand }} /></View>}
      {progress?.status === 'error' && <><Text accessibilityRole="alert" style={[type.caption, { color: colors.accent }]}>{progress.error}</Text><Button label={'Повторить загрузку ' + file.name} variant="secondary" disabled={busy} onPress={() => { void submit(); }} /></>}
      </View>;
    })}{errors.files && <Text accessibilityRole="alert" style={{ color: colors.accent }}>{errors.files}</Text>}
</View>
    <Text style={type.subheading}>Где нужна поставка или консультация</Text><Button label={settlementLabel(location?.settlement)} variant="secondary" icon={<MapPin size={20} color={colors.brand} />} disabled={busy} onPress={() => setLocationOpen(true)} />{errors.settlementId && <Text style={{ color: colors.accent }}>{errors.settlementId}</Text>}
    {([{ key: 'name', label: 'Контактное лицо', required: true }, { key: 'phone', label: 'Телефон', required: true }, { key: 'email', label: 'Электронная почта', required: true }, { key: 'company', label: 'Компания или ИП', required: true }, { key: 'inn', label: 'ИНН (необязательно)' }] as const).map(field => <View key={field.key} style={{ gap: 7 }}><Text style={type.label}>{field.label}{'required' in field ? ' *' : ''}</Text><TextInput accessibilityLabel={field.label} value={values[field.key]} editable={!busy} onChangeText={text => changeValue(field.key,text)} keyboardType={field.key === 'phone' ? 'phone-pad' : field.key === 'email' ? 'email-address' : field.key === 'inn' ? 'number-pad' : 'default'} autoCapitalize={field.key === 'email' ? 'none' : 'sentences'} maxLength={field.key === 'inn' ? 12 : field.key === 'company' ? 300 : field.key === 'email' ? 254 : field.key === 'phone' ? 25 : 150} style={[type.body, { minHeight: 52, paddingHorizontal: 12, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: errors[field.key] ? colors.accent : colors.line }]} />{errors[field.key] && <Text accessibilityRole="alert" style={{ color: colors.accent }}>{errors[field.key]}</Text>}</View>)}
    <View style={{gap:7}}><Text style={type.label}>Адрес объекта (необязательно)</Text><TextInput accessibilityLabel="Адрес объекта" value={objectAddress} editable={!busy} onChangeText={setObjectAddress} maxLength={500} style={[type.body,{minHeight:52,padding:12,borderRadius:12,backgroundColor:colors.white,borderWidth:1,borderColor:colors.line}]}/><Text style={type.label}>Желаемый срок (необязательно)</Text><TextInput accessibilityLabel="Желаемый срок" value={deadline} editable={!busy} onChangeText={setDeadline} maxLength={150} placeholder="Дата, месяц или пока не определён" style={[type.body,{minHeight:52,padding:12,borderRadius:12,backgroundColor:colors.white,borderWidth:1,borderColor:colors.line}]}/></View>
    <ConsentFields disabled={busy} consents={sourceConsents} values={consents} errors={errors} onChange={(name, checked) => { if (!busy) {setConsents(old => ({ ...old, [name]: checked }));clearErrors(name);} }} />
    <Button label={busy ? 'Отправляем…' : message && !Object.keys(errors).length ? 'Повторить отправку' : 'Отправить заявку'} disabled={busy} onPress={() => { void submit(); }} />{!!message && <Text accessibilityRole="alert" style={[type.body, { color: colors.accent }]}>{message}</Text>}
    </>}
    <Button label="Позвонить или связаться с менеджером" variant="secondary" onPress={() => router.push('/information/contacts')} />
  </View>;
  return embedded ? <>{content}<LocationPicker visible={locationOpen} onClose={() => setLocationOpen(false)} /></> : <SafeAreaView edges={['top','left','right']} style={layout.screen}><Header title="Заявка для бизнеса" back/><PageMeta title="Заявка для бизнеса — Промышленник"/><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView buyerControls keyboardShouldPersistTaps="handled" style={layout.content} contentContainerStyle={{padding:20,gap:20}}>{content}</ScrollView></KeyboardAvoidingView><LocationPicker visible={locationOpen} onClose={()=>setLocationOpen(false)}/></SafeAreaView>;
}
export default function ProcurementScreen(){ return <ProcurementForm/>; }
