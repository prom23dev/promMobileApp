import React, { type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors, layout, type } from './theme';
import { useReducedMotion } from './useReducedMotion';
export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  return <Modal visible={visible} transparent animationType={reducedMotion ? "none" : "fade"} onRequestClose={onClose}>
    <View style={s.scrim}>
      <Pressable accessibilityLabel="Закрыть окно" accessibilityRole="button" style={StyleSheet.absoluteFill} onPress={onClose} />
      <SafeAreaView edges={['bottom']} style={s.sheet} accessibilityViewIsModal>
        <View style={[layout.between, { padding: 16 }]}><Text accessibilityRole="header" aria-level={1} style={[type.heading, { flex: 1 }]}>{title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Закрыть окно" onPress={onClose} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><X color={colors.ink} size={22} /></Pressable></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}>{children}</ScrollView>
      </SafeAreaView>
    </View>
  </Modal>;
}

const s = StyleSheet.create({scrim: {flex: 1, backgroundColor: 'rgba(20, 27, 50, .4)', justifyContent: 'flex-end'}, sheet: {backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, width: '100%', maxWidth: 650, alignSelf: 'center', maxHeight: '88%'}});
