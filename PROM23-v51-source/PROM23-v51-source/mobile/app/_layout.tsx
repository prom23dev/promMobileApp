import React from 'react';
import { ActivityIndicator, Pressable, StatusBar, Text, View } from 'react-native';
import { DefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ShopProvider, useShop } from '../src/store';
import { colors } from '../src/ui/theme';
import { BrandLogo } from '../src/ui/BrandLogo';
import { LocationChangeNotice } from '../src/ui/LocationChangeNotice';
import { ShopSkeleton } from '../src/ui/ShopSkeleton';
import { PrivacyPreferencesProvider } from '../src/PrivacyPreferences';
import { PrivacyControls } from '../src/ui/PrivacyControls';
import PushObserver from '../src/PushObserver';

export const unstable_settings = { initialRouteName: '(tabs)' };
const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.brand, background: colors.background, card: colors.white, text: colors.ink, border: colors.line, notification: colors.accent } };

export default function RootLayout() {
  return <SafeAreaProvider><ThemeProvider value={theme}><PrivacyPreferencesProvider><ShopProvider><StatusBar barStyle="dark-content" /><ConnectedApp /></ShopProvider></PrivacyPreferencesProvider></ThemeProvider></SafeAreaProvider>;
}

function ConnectedApp() {
  const { ready, error, retry, clearError } = useShop();
  const pathname = usePathname();
  const legalRoute = /^\/(?:legal\/|privacy-policy|personal-data-consent|advertising-consent|personal-data-distribution-consent|offer|oferta|claims|user-agreement|cookie-policy|recom-tech-info|pages\/(?:offer|advertising|distribution|privacy|personal-data|cookies|recommendations))/.test(pathname);
  const brandRoute = /^\/(?:brands(?:\/|$)|catalog\/brand\/)/.test(pathname);
  if (!ready && !legalRoute) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28, gap: 18, backgroundColor: colors.background }}>
    <BrandLogo />
    {error ? <><Text accessibilityRole="alert" style={{ textAlign: 'center', color: colors.ink }}>{error}</Text><Pressable accessibilityRole="button" onPress={retry} style={{ padding: 16, backgroundColor: colors.brand, borderRadius: 14 }}><Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Повторить подключение</Text></Pressable></> : <><ShopSkeleton /><Text style={{ color: colors.muted }}>Загружаем каталог</Text></>}
  </View>;
  return <View style={{ flex: 1, width: '100%', maxWidth: brandRoute ? 1180 : 720, alignSelf: 'center' }}>
    <PushObserver /><LocationChangeNotice />
    {error && !legalRoute && <View style={{ padding: 16, backgroundColor: '#FFF0ED', flexDirection: 'row', alignItems: 'center', gap: 12 }}><Text accessibilityRole="alert" style={{ flex: 1, color: colors.ink }}>{error}</Text><Pressable accessibilityRole="button" accessibilityLabel="Закрыть сообщение" onPress={clearError} style={{ padding: 12 }}><Text>Закрыть</Text></Pressable></View>}
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="+not-found" /></Stack><PrivacyControls />
  </View>;
}
