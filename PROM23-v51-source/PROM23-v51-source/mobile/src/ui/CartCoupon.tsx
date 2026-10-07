import React,{useEffect,useRef,useState} from 'react';
import {Text,TextInput,View} from 'react-native';
import {useShop} from '../store';
import {localRequest} from '../api/local';
import type {CheckoutSummary} from '../checkout-domain';
import {Button} from './primitives';
import {colors,layout,type} from './theme';
export function CartCoupon({onChange,onBusyChange,disabled=false}:{onChange?:()=>void;onBusyChange?:(busy:boolean)=>void;disabled?:boolean}){
 const {state}=useShop();const context=useRef(state.context);context.current=state.context;const mounted=useRef(true);useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[]);const [code,setCode]=useState(''),[applied,setApplied]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{onBusyChange?.(busy)},[busy,onBusyChange]);
 useEffect(()=>{let active=true;setCode('');setApplied('');setError('');setBusy(false);void localRequest<CheckoutSummary>('/v1/cart/summary').then(r=>{if(active){setCode(r.draft.coupon);setApplied(r.draft.coupon)}}).catch(()=>{});return()=>{active=false}},[state.context]);
 async function submit(remove=false){if(busy||disabled)return;setBusy(true);setError('');const binding=state.context;try{const r=await localRequest<CheckoutSummary>('/v1/cart/coupon',{method:'POST',body:{code:remove?'':code.trim(),expectedContext:state.context}});if(mounted.current&&context.current===binding){setApplied(r.draft.coupon);setCode(r.draft.coupon);onChange?.()}}catch(e){if(mounted.current&&context.current===binding)setError(e instanceof Error?e.message:'Не удалось проверить промокод.')}finally{if(mounted.current&&context.current===binding)setBusy(false)}}
 return <View style={layout.card}><Text style={type.subheading}>Промокод</Text><TextInput accessibilityLabel="Промокод" placeholder="Введите промокод" value={code} editable={!busy&&!disabled} onChangeText={setCode} maxLength={100} autoCapitalize="characters" style={{minHeight:48,borderWidth:1,borderColor:colors.line,borderRadius:10,padding:12,fontSize:16,color:colors.ink}}/>{applied&&<Text style={type.body}>Промокод: {applied}. Скидка учитывается в расчёте магазина.</Text>}{!!error&&<Text accessibilityRole="alert" style={type.body}>{error}</Text>}<Button disabled={disabled||busy||!code.trim()} label={busy?'Проверяем…':'Применить промокод'} variant="secondary" onPress={()=>{void submit()}}/>{!!applied&&<Button disabled={disabled||busy} label="Удалить промокод" variant="quiet" onPress={()=>{void submit(true)}}/>}</View>
}
