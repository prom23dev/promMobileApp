import React from 'react';
import { Stack } from 'expo-router';
import { useReducedMotion } from '../../../src/ui/useReducedMotion';
import { colors } from '../../../src/ui/theme';
export const unstable_settings = { initialRouteName: 'account' };
export default function TabStack() { const reducedMotion = useReducedMotion(); return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: reducedMotion ? 'none' : 'slide_from_right' }} />; }
