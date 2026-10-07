import React, { useRef } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../ui/primitives';
import { PageMeta } from '../ui/PageMeta';
import { FranchiseForm } from '../ui/FranchiseForm';
import { layout } from '../ui/theme';
export default function FranchiseFormScreen(){const scroll=useRef<ScrollView>(null);return <SafeAreaView style={layout.screen} edges={['top','left','right']}><Header title="Заявка на франшизу" back/><PageMeta title="Заявка на франшизу"/><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView buyerControls ref={scroll} keyboardShouldPersistTaps="handled" style={layout.content} contentContainerStyle={{padding:20,paddingBottom:32}}><FranchiseForm onSubmitted={()=>scroll.current?.scrollTo({y:0,animated:false})}/></ScrollView></KeyboardAvoidingView></SafeAreaView>;}
