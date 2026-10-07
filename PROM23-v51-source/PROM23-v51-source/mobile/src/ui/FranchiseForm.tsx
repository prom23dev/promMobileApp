import React, { useEffect, useRef, useState } from 'react';
import { Text, TextInput, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useShop } from '../store';
import { loadSiteFormContext, submitSiteForm, submissionKey } from '../api/site';
import { LocalApiError } from '../api/local';
import { siteForms, initialConsentValues } from '../forms/siteForms';
import { visibleFranchiseFields, franchiseErrors, franchiseValues } from '../forms/franchiseForm';
import { ConsentFields } from './ConsentFields';
import { FranchiseTap as Tap, FranchiseAction as Action, FranchiseHeading as H, FranchiseText as P, fs } from './FranchiseUI';
import { colors } from './theme';
import { palette } from './tokens';
export function FranchiseForm({onSubmitted}:{onSubmitted?:()=>void}={}) {
  const router=useRouter(),{state}=useShop();const scope=useRef(state.context);scope.current=state.context;
  const [values,setValues]=useState<Record<string,string|string[]|boolean>>({}),[errors,setErrors]=useState<Record<string,string>>({}),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[receipt,setReceipt]=useState('');
  const [consents,setConsents]=useState(()=>initialConsentValues(siteForms.partner.consents));
  const lock=useRef(false),attempt=useRef<{key:string;fingerprint:string}|null>(null);
  useEffect(()=>{if(receipt){const frame=requestAnimationFrame(()=>onSubmitted?.());return ()=>cancelAnimationFrame(frame);}},[receipt]);
  const inputs=useRef<Record<string,TextInput|null>>({});
  function change(name:string,value:string|string[]) {if(busy)return;setValues(old=>({...old,[name]:value}));setErrors(old=>({...old,[name]:''}));setMessage('');}
  async function submit() {
    if(lock.current||receipt)return;
    const next=franchiseErrors(values);for(const c of siteForms.partner.consents)if(c.required&&!consents[c.name])next[c.name]='Подтвердите согласие.';
    setErrors(next);setMessage('');if(Object.keys(next).length){setMessage('Проверьте отмеченные поля.');inputs.current[Object.keys(next)[0]]?.focus();return;}
    const request={formId:'partner',context:state.context,values:franchiseValues(values),consents:siteForms.partner.consents.map(c=>({name:c.name,accepted:!!consents[c.name],documentIds:c.documents}))};
    const fingerprint=JSON.stringify(request);if(attempt.current?.fingerprint!==fingerprint)attempt.current={key:submissionKey(),fingerprint};
    lock.current=true;setBusy(true);const original=state.context;
    try {const context=await loadSiteFormContext({formId:'partner',context:original});if(scope.current!==original)throw new Error('Режим покупок изменился. Проверьте заявку и отправьте ещё раз.');const result=await submitSiteForm({...request,revision:context.revision,idempotencyKey:attempt.current.key});if(scope.current!==original)throw new Error('Режим покупок изменился. Уточните статус заявки перед повторной отправкой.');if(result.status!=='accepted')throw new Error('Получение заявки не подтверждено. Уточните статус у менеджера.');setReceipt(result.reference);}
    catch(e){if(e instanceof LocalApiError&&e.fieldErrors)setErrors(e.fieldErrors);setMessage('Не удалось подтвердить отправку заявки. Введённые данные сохранены в форме. Повторите попытку или свяжитесь с менеджером.');}
    finally{lock.current=false;setBusy(false);}
  }
  return <View testID="franchise-form" style={{gap:20}}>{receipt?<View testID="franchise-receipt" accessibilityLiveRegion="polite" style={{gap:12}}><H>Заявка отправлена</H><P>Спасибо. Мы получили информацию и свяжемся с вами после рассмотрения заявки.</P><Text selectable style={fs.label}>Номер: {receipt}</Text><Action label="Заполнить ещё одну заявку" onPress={()=>{setReceipt('');setValues({});setErrors({});setConsents(initialConsentValues(siteForms.partner.consents));attempt.current=null;}}/></View>:<>
    {visibleFranchiseFields(values).map(f=><View key={f.name} style={{gap:8}}><Text nativeID={'franchise-label-'+f.name} style={fs.label}>{f.label}{f.required?' *':''}</Text>{f.type==='select'?<View style={[fs.wrap,f.multiple&&{flexDirection:'column'}]} accessibilityRole={f.multiple?'none':'radiogroup'} accessibilityLabel={f.label}>{f.options!.map(option=>{const selected=f.multiple?Array.isArray(values[f.name])&&(values[f.name] as string[]).includes(option.value):values[f.name]===option.value;return <Tap key={option.value} accessibilityRole={f.multiple?'checkbox':'radio'} accessibilityLabel={option.label} accessibilityState={{checked:selected,disabled:busy}} aria-checked={selected} disabled={busy} onPress={()=>{if(f.multiple){const old=Array.isArray(values[f.name])?values[f.name] as string[]:[];change(f.name,selected?old.filter(x=>x!==option.value):[...old,option.value]);}else change(f.name,option.value);}} style={[s.choice,selected&&s.selected,f.multiple&&{borderWidth:0,paddingLeft:0,backgroundColor:'transparent'}]}>{f.multiple&&<View style={[s.box,selected&&{backgroundColor:colors.accent,borderColor:colors.accent}]}>{selected&&<Check size={16} color={colors.white}/>}</View>}<Text style={[fs.label,{flexShrink:1}]}>{option.label}</Text></Tap>;})}</View>:<TextInput ref={v=>{inputs.current[f.name]=v;}} accessibilityLabel={f.label} aria-invalid={!!errors[f.name]} aria-required={f.required} aria-describedby={errors[f.name]?'franchise-error-'+f.name:undefined} value={typeof values[f.name]==='string'?values[f.name] as string:''} onChangeText={v=>change(f.name,v)} placeholder={f.placeholder??f.label} placeholderTextColor={colors.muted} multiline={f.type==='textarea'} maxLength={f.maxLength} autoCapitalize={f.type==='email'?'none':'sentences'} keyboardType={f.type==='email'?'email-address':f.type==='tel'?'phone-pad':'default'} editable={!busy} style={[s.input,f.type==='textarea'&&{minHeight:120,textAlignVertical:'top'},errors[f.name]&&{borderColor:colors.accent}]}/>}{f.hint&&<Text style={fs.caption}>{f.hint}</Text>}{errors[f.name]&&<Text nativeID={'franchise-error-'+f.name} accessibilityRole="alert" style={s.error}>{errors[f.name]}</Text>}</View>)}
    <ConsentFields disabled={busy} consents={siteForms.partner.consents} values={consents} errors={errors} onChange={(name,value)=>{setConsents(old=>({...old,[name]:value}));setErrors(old=>({...old,[name]:''}));}}/>
    {!!message&&<Text accessibilityRole="alert" style={s.error}>{message}</Text>}<Action label={busy?'Отправляем…':'Отправить заявку'} primary disabled={busy} onPress={()=>void submit()}/>
  </>}<Action label="Связаться с менеджером" onPress={()=>router.push('/information/contacts')}/></View>;
}
const s=StyleSheet.create({input:{minHeight:50,borderWidth:1,borderColor:colors.line,borderRadius:10,padding:12,backgroundColor:colors.background,fontSize:16,lineHeight:23,color:colors.ink},choice:{minHeight:46,padding:12,flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderColor:colors.line,borderRadius:10},selected:{borderColor:colors.accent,backgroundColor:palette.orange100},box:{width:22,height:22,borderRadius:4,borderWidth:1,borderColor:colors.muted,alignItems:'center',justifyContent:'center'},error:{fontSize:13,lineHeight:20,color:colors.accent}});
