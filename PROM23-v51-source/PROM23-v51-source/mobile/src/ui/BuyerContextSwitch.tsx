import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Building2, ChevronDown } from 'lucide-react-native';
import { useShop } from '../store';
import { localRequest } from '../api/local';
import { Sheet } from './Sheet';
import { colors, layout, type } from './theme';
export function BuyerContextSwitch({ compact = false }: { compact?: boolean }) {
 const router = useRouter(); const { state, dispatch, busy, selectOrganization } = useShop();
 const [open,setOpen]=useState(false), [loading,setLoading]=useState(false), [error,setError]=useState('');
 const [organizations,setOrganizations]=useState<{id:number;name:string;inn?:string}[]>([]);
 async function load(){setOpen(true);setLoading(true);setError('');setOrganizations([]);try{const result=await localRequest<{organizations:{id:number;name:string;inn?:string}[]}>('/v1/buyer/organizations');setOrganizations(result.organizations)}catch(e){setError(e instanceof Error?e.message:'Не удалось загрузить организации.')}finally{setLoading(false)}}
 const action=(label:string,fn:()=>void)=><Pressable key={label} accessibilityRole="button" disabled={busy} onPress={fn} style={{minHeight:48,padding:12,borderRadius:12,backgroundColor:colors.pale,justifyContent:'center'}}><Text style={type.label}>{label}</Text></Pressable>;
 return <View style={{gap:2}}><View style={{flexDirection:'row',alignItems:'center',gap:10}}><View style={{flex:1,flexDirection:'row',padding:compact ? 2 : 4,backgroundColor:colors.pale,borderRadius:14}}>{(['personal','business'] as const).map(id=>{const selected=id==='personal'?state.context==='personal':state.context!=='personal';return <Pressable key={id} accessibilityRole="tab" accessibilityLabel={id==='personal'?'Для себя':'Для бизнеса'} accessibilityState={{selected,disabled:busy}} aria-selected={selected} aria-disabled={busy} disabled={busy} onPress={()=>{if(!selected)dispatch({type:'context',context:id})}} style={{flex:1,minHeight:44,alignItems:'center',justifyContent:'center',borderRadius:10,backgroundColor:selected?colors.white:'transparent'}}><Text style={[type.label, compact && { fontSize: 13, lineHeight: 18 }]}>{id==='personal'?'Для себя':'Для бизнеса'}</Text></Pressable>})}</View></View>

 {state.context!=='personal'&&<Pressable accessibilityRole="button" accessibilityLabel="Выбрать организацию покупателя" onPress={()=>{void load()}} style={[layout.between,{minHeight:44,paddingHorizontal:6}]}><Building2 size={17} color={colors.brand}/><Text style={[type.caption,{flex:1}]}>{state.activeOrganization?.name??'Выбрать организацию для оформления'}</Text><ChevronDown size={16} color={colors.brand}/></Pressable>}
 {state.context!=='personal' && <Text style={[type.caption,{fontSize:12,lineHeight:17}]}>Для себя — личные нужды, в том числе покупка ИП. Для бизнеса — предпринимательская деятельность.</Text>}

 <Sheet visible={open} onClose={()=>setOpen(false)} title="Организация покупателя"><Text style={type.body}>Выберите компанию, к которой у вас есть доступ. Её корзина и документы хранятся отдельно от личных покупок. Товары, выбранные в режиме «Для бизнеса», будут добавлены в корзину выбранной организации.</Text>{loading?<ActivityIndicator accessibilityLabel="Загружаем организации"/>:organizations.map(org=>action(org.name+(org.inn?' · ИНН '+org.inn:''),()=>{setError('');void selectOrganization(org.id).then(()=>setOpen(false)).catch(e=>setError(e.message))}))}
 {!!error&&<Text accessibilityRole="alert" style={type.body}>{error}</Text>}{!loading&&!organizations.length&&!error&&<Text style={type.body}>Доступных организаций пока нет.</Text>}
 {action('Войти или зарегистрироваться',()=>{setOpen(false);router.push('/forms/auth-login')})}{action('Добавить организацию',()=>{setOpen(false);router.push('/forms/organization-add')})}{action('Обновить список',()=>{void load()})}</Sheet></View>;
}
