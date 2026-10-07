import { legalCopy } from '../content/legalCopy';
import React from 'react';
import { Linking, Text, View } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { legalDocuments, type LegalDocumentId } from '../content/legalDocuments';
import { Header, Button } from '../ui/primitives';
import { PrivacyFooter } from '../ui/PrivacyControls';
import { colors, layout, type } from '../ui/theme';
const paths: Record<string, LegalDocumentId> = { '/privacy-policy/':'privacy', '/user-agreement/':'consent', '/cookie-policy/':'cookies', '/recom-tech-info/':'recommendations', '/oferta/':'offer', '/offer/':'offer', '/personal-data-consent/':'consent', '/advertising-consent/':'advertising', '/personal-data-distribution-consent/':'distribution' };
export default function LegalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(), router = useRouter();
  const document = Object.hasOwn(legalDocuments, id ?? '') ? legalDocuments[id as LegalDocumentId] : undefined;
  function open(value: string) { const url = new URL(value); const local = ['prom23.ru', 'www.prom23.ru'].includes(url.hostname) ? paths[url.pathname.replace(/\/$/, '') + '/'] : null; if (local) router.push({ pathname:'/legal/[id]', params:{id:local} }); else void Linking.openURL(value); }
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right', 'bottom']}><Header title="Документы" heading={false} back /><ScrollView key={id} testID="legal-document" style={layout.content} contentContainerStyle={{ padding: 18, gap: 18, paddingBottom: 32 }}>
    <Text accessibilityRole="header" aria-level={1} style={type.title}>{document?.title ?? 'Документ не найден'}</Text>
    <View style={{ padding: 18, borderRadius: 16, backgroundColor: colors.white, gap: 16 }}>{(document?.content ?? 'Откройте документ из меню.').split(/\n\s*\n/).filter(Boolean).filter((paragraph, index) => (!document || index > 0) && !['u', '/'].includes(paragraph.trim())).map((paragraph, index) => {
      const heading = /^\d+\.\s[^\n]+$/.test(paragraph) && paragraph.length < 180;
      return <Text key={index} selectable accessibilityRole={heading ? 'header' : undefined} aria-level={heading ? 2 : undefined} style={[heading ? type.subheading : type.body, heading && { marginTop: 10 }]}>{paragraph.split(/(https:\/\/[^\s«»<>]+|info@prom23\.ru)/g).map((piece, i) => /^https:\/\//.test(piece) || piece === 'info@prom23.ru' ? <Text key={i} accessibilityRole="link" onPress={() => piece.includes('@') ? void Linking.openURL('mailto:' + piece) : open(piece.replace(/[.,;)]$/, ''))} style={{ color: colors.brand, textDecorationLine: 'underline' }}>{piece}</Text> : piece)}</Text>;
    })}</View>
    <Text style={type.body}>{legalCopy.contact}</Text>
    <Button label="По вопросам персональных данных: info@prom23.ru" variant="secondary" onPress={() => { void Linking.openURL('mailto:info@prom23.ru'); }} />
    <PrivacyFooter />
  </ScrollView></SafeAreaView>;
}
