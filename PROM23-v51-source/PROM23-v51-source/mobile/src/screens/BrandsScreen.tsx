import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, X, Check } from 'lucide-react-native';
import { localRequest } from '../api/local';
import type { BrandList } from '../brands/types';
import { BrandCard, Breadcrumbs, s } from '../brands/BrandComponents';
import { BrandMeta, brandIntro } from '../brands/BrandMeta';
import { Button, Header, Sheet } from '../ui/primitives';
import { colors, layout, type } from '../ui/theme';
import { VerticalReveal, VerticalScrollProvider } from '../ui/VerticalReveal';
const normalize=(s:string)=>s.normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/g,'е').trim();
export default function BrandsScreen(){
 useEffect(()=>{if(Platform.OS==='web')document.getElementById('brand-initial')?.remove();},[]);
 const {width,fontScale}=useWindowDimensions(),columns=fontScale>1.4?1:width>=1024?3:width>=640?2:1;
 const [data,setData]=useState<BrandList|null>(null),[error,setError]=useState(''),[retry,setRetry]=useState(0),[query,setQuery]=useState(''),[sort,setSort]=useState<'source'|'alphabet'>('source'),[sortOpen,setSortOpen]=useState(false);
 const scrollY=useRef(new Animated.Value(0)).current;
 useEffect(()=>{const c=new AbortController();setError('');void localRequest<BrandList>('/brands',{signal:c.signal}).then(value=>{if(!c.signal.aborted)setData(value);}).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[retry]);
 const brands=useMemo(()=>{const q=normalize(query);const result=(data?.brands??[]).filter(b=>[b.name,...b.alternateNames].some(n=>normalize(n).includes(q)));return sort==='alphabet'?result.sort((a,b)=>a.name.localeCompare(b.name,'ru')):result;},[query,sort,data]);
 const own=data?.brands.filter(b=>b.isOwnBrand)??[];
 const grid=(items:BrandList['brands'],cols:number,own=false)=><View style={s.grid}>{Array.from({length:Math.ceil(items.length/cols)},(_,r)=><View key={r} style={s.row}>{Array.from({length:cols},(_,c)=>{const item=items[r*cols+c];return <View key={item?.id??c} style={s.grow}>{item&&<BrandCard brand={item} own={own} index={c}/>}</View>;})}</View>)}</View>;
 return <SafeAreaView style={layout.screen} edges={['top','left','right']}><BrandMeta/><Header title="Бренды" back heading={false}/><VerticalScrollProvider value={scrollY}><ScrollView keyboardShouldPersistTaps="handled" onScroll={Animated.event([{nativeEvent:{contentOffset:{y:scrollY}}}],{useNativeDriver:false})} scrollEventThrottle={16} contentContainerStyle={{padding:width>=640?24:16,gap:32,paddingBottom:36}}>
 <VerticalReveal><Breadcrumbs/><View style={{gap:14,paddingVertical:12}}><Text style={s.eyebrow}>БРЕНДЫ</Text><Text accessibilityRole="header" aria-level={1} style={[s.h1,width<640&&type.title]}>Бренды строительного оборудования</Text><Text style={[type.body,{maxWidth:720}]}>{brandIntro}</Text></View></VerticalReveal>
 {error?<View style={s.surface}><Text accessibilityRole="alert" style={type.body}>{error}</Text><Button label="Повторить загрузку" onPress={()=>setRetry(v=>v+1)}/></View>:!data?<Text accessibilityLiveRegion="polite" style={type.body}>Загружаем бренды…</Text>:<>
 {!!own.length&&<View style={s.section}><Text accessibilityRole="header" aria-level={2} style={type.heading}>Наши бренды</Text>{grid(own,columns>1?2:1,true)}</View>}
 <View style={s.section}><Text accessibilityRole="header" aria-level={2} style={type.heading}>Все бренды</Text><View style={[s.toolbar,{alignItems:'stretch'}]}><View style={[s.search,{flex:1,minWidth:Math.min(250,width-32)}]}><Search size={21} color={colors.muted}/><TextInput accessibilityLabel="Найти бренд" placeholder="Найти бренд" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} maxLength={100} autoCorrect={false} style={s.input}/>{!!query&&<Pressable accessibilityRole="button" accessibilityLabel="Очистить поиск бренда" onPress={()=>setQuery('')} style={{padding:10}}><X size={18} color={colors.muted}/></Pressable>}</View><Pressable accessibilityRole="button" onPress={()=>setSortOpen(true)} style={s.sort}><SlidersHorizontal size={18} color={colors.brand}/><Text style={type.label}>{sort==='alphabet'?'По алфавиту':'Порядок брендов'}</Text></Pressable></View><Text accessibilityLiveRegion="polite" style={type.caption}>Найдено брендов: {brands.length}</Text>{brands.length?grid(brands,columns):<View style={s.surface}><Text accessibilityRole="header" aria-level={3} style={type.heading}>Бренд не найден</Text><Text style={type.body}>Проверьте название или попробуйте другое написание.</Text><Button label="Показать все бренды" variant="secondary" onPress={()=>setQuery('')}/></View>}</View></>}
 </ScrollView></VerticalScrollProvider><Sheet visible={sortOpen} title="Порядок брендов" onClose={()=>setSortOpen(false)}>{([{id:'source',label:'По умолчанию'},{id:'alphabet',label:'По алфавиту'}] as const).map(item=><Pressable key={item.id} accessibilityRole="radio" accessibilityState={{checked:sort===item.id}} onPress={()=>{setSort(item.id);setSortOpen(false);}} style={s.sort}><Text style={[type.body,{flex:1}]}>{item.label}</Text>{sort===item.id&&<Check size={20} color={colors.accent}/>}</Pressable>)}</Sheet></SafeAreaView>;
}
