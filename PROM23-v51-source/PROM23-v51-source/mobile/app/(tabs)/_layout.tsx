import React from 'react';
import { Tabs } from 'expo-router';
import { BottomNavigation } from '../../src/ui/BottomNavigation';
export const unstable_settings = { initialRouteName: '(home)' };
export default function AppShell() {
  return <Tabs initialRouteName="(home)" tabBar={props => <BottomNavigation {...props} />} screenOptions={{ headerShown: false, popToTopOnBlur: false }}>
    <Tabs.Screen name="(home)" options={{ title: 'Главная' }} />
    <Tabs.Screen name="(search)" options={{ title: 'Каталог' }} />
    <Tabs.Screen name="(shopping)" options={{ title: 'Корзина' }} />
    <Tabs.Screen name="(saved)" options={{ title: 'Избранное' }} />
    <Tabs.Screen name="(user)" options={{ title: 'Кабинет' }} />
  </Tabs>;
}
