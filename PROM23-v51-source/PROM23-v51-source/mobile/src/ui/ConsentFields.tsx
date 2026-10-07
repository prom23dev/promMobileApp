import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import type { SiteConsent } from '../forms/siteForms';
import { legalDocuments, type LegalDocumentId } from '../content/legalDocuments';
import { colors } from './theme';

const linkLabels: Partial<Record<LegalDocumentId, string>> = {
  privacy: 'Политика конфиденциальности', consent: 'Согласие на обработку данных',
  offer: 'Публичная оферта', advertising: 'Согласие на рассылку', distribution: 'Условия публикации данных',
};
export function ConsentFields({ consents, values, onChange, errors = {}, disabled = false, documentActions = {} }: { consents: SiteConsent[]; values: Record<string, boolean>; onChange: (name: string, checked: boolean) => void; errors?: Record<string, string>; disabled?: boolean; documentActions?: Partial<Record<LegalDocumentId, () => void>> }) {
  const router = useRouter(); const [focused, setFocused] = useState<string | null>(null);
  return <View testID="form-consents" style={s.panel}>
    {consents.map(consent => <View key={consent.name} testID={'consent-' + consent.name} style={s.item}>
      <Pressable accessibilityRole="checkbox" accessibilityLabel={consent.label} accessibilityState={{ checked: !!values[consent.name], disabled }} aria-checked={!!values[consent.name]} aria-disabled={disabled} disabled={disabled}
        onFocus={() => setFocused(consent.name)} onBlur={() => setFocused(null)} onPress={() => onChange(consent.name, !values[consent.name])}
        style={({ pressed }) => [s.choice, focused === consent.name && s.focus, (pressed || disabled) && { opacity: .65 }]}>
        <View style={[s.box, values[consent.name] && s.checked, !!errors[consent.name] && { borderColor: colors.accent }]}>{values[consent.name] && <Check size={14} strokeWidth={2.5} color={colors.white} />}</View>
        <Text style={s.copy}>{consent.label}{!consent.required && <Text style={s.optional}> Необязательно.</Text>}</Text>
      </Pressable>
      <View style={s.links}>{consent.documents.map(id => <Pressable key={id} accessibilityRole="link" accessibilityLabel={legalDocuments[id]?.title ?? 'Открыть документ'} onPress={() => { if (documentActions[id]) documentActions[id]!(); else router.push({ pathname: '/legal/[id]', params: { id } }); }} style={s.link}><Text style={s.linkText}>{linkLabels[id] ?? legalDocuments[id]?.title ?? 'Открыть документ'}</Text></Pressable>)}</View>
      {!!errors[consent.name] && <Text accessibilityRole="alert" style={s.error}>{errors[consent.name]}</Text>}
    </View>)}
  </View>;
}
const s = StyleSheet.create({
  panel: { gap: 14, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.background },
  item: { gap: 0, minWidth: 0 },
  choice: { minHeight: 44, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 6, paddingVertical: 4 },
  focus: { outlineColor: colors.accent, outlineWidth: 2, outlineStyle: 'solid' },
  box: { width: 20, height: 20, marginTop: 1, flexShrink: 0, borderRadius: 4, borderWidth: 1.5, borderColor: colors.muted, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  checked: { borderColor: colors.brand, backgroundColor: colors.brand },
  copy: { flex: 1, minWidth: 0, color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '400' },
  optional: { color: colors.muted },
  links: { paddingLeft: 30, flexDirection: 'row', flexWrap: 'wrap', columnGap: 12 },
  link: { minHeight: 44, justifyContent: 'center', maxWidth: '100%', flexShrink: 1 },
  linkText: { color: colors.brand, fontSize: 13, lineHeight: 18, fontWeight: '400', textDecorationLine: 'underline' },
  error: { paddingLeft: 30, fontSize: 13, lineHeight: 18, color: colors.accent },
});
