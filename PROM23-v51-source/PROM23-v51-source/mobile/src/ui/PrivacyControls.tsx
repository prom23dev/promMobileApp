import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { usePrivacy } from '../PrivacyPreferences';
import { optionalOff, optionalOn, type PrivacyCategories } from '../privacy-model';
import { navigationMenu } from '../navigation-menu';
import { legalCopy } from '../content/legalCopy';
import { Button, Sheet } from './primitives';
import { colors, type } from './theme';
export function PrivacyControls() {
  const privacy = usePrivacy(), pathname = usePathname(), router = useRouter();
  const [draft, setDraft] = useState<PrivacyCategories>(optionalOff), [message, setMessage] = useState(''), [saving, setSaving] = useState(false);
  useEffect(() => { if (privacy.settingsOpen) setDraft(privacy.choice ?? optionalOff); }, [privacy.settingsOpen]);
  const documentOpen = /\/(legal\/|privacy-policy|user-agreement|cookie-policy|recom-tech-info)/.test(pathname);
  async function choose(value: PrivacyCategories, rejected = false) { setSaving(true); setMessage(''); try { await privacy.save(value); privacy.setSettingsOpen(false); if (rejected) setMessage(legalCopy.rejected); } catch (e) { setMessage((e as Error).message); privacy.setSettingsOpen(false); } finally { setSaving(false); } }
  const doc = () => { privacy.setSettingsOpen(false); router.push('/legal/cookies'); };
  return <>
    <Sheet visible={privacy.ready && !privacy.choice && !privacy.settingsOpen && !documentOpen} title="Настройки конфиденциальности" onClose={() => { privacy.setSettingsOpen(true); }}>
      <Text style={type.body}>{legalCopy.cookieBanner}</Text>
      <Button label="Принять все" variant="secondary" disabled={saving} onPress={() => { void choose(optionalOn); }} />
      <Button label="Отклонить необязательные" variant="secondary" disabled={saving} onPress={() => { void choose(optionalOff, true); }} />
      <Button label="Настроить" variant="secondary" onPress={() => privacy.setSettingsOpen(true)} />
      <Button label="Подробнее о cookie" variant="quiet" onPress={doc} />
    </Sheet>
    <Sheet visible={privacy.settingsOpen} title="Настройки cookie" onClose={() => privacy.setSettingsOpen(false)}>
      <Text style={type.caption}>Для избранного и истории просмотров нужны функциональные cookie. Персональные подборки включаются отдельно.</Text>
      {legalCopy.cookieCategories.map(category => { const required = category.id === 'necessary'; const key = category.id as keyof PrivacyCategories; const checked = required || draft[key]; return <View key={category.id} style={{ gap: 5 }}>
        <Pressable accessibilityRole="checkbox" accessibilityLabel={category.title} accessibilityState={{ checked, disabled: required }} aria-checked={checked} disabled={required} onPress={() => setDraft(old => ({ ...old, [key]: !old[key] }))} style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 24, height: 24, borderWidth: 1, borderColor: colors.brand, borderRadius: 4, backgroundColor: checked ? colors.brand : colors.white, alignItems: 'center', justifyContent: 'center' }}>{checked && <Check size={18} color={colors.white} />}</View><Text style={[type.subheading, { flex: 1 }]}>{category.title}{required ? ' · всегда включены' : ''}</Text>
        </Pressable><Text style={type.body}>{category.description}</Text>
      </View>; })}
      <Button label="Сохранить выбор" disabled={saving} onPress={() => { void choose(draft); }} />
      <Button label="Отклонить необязательные" variant="secondary" disabled={saving} onPress={() => { void choose(optionalOff, true); }} />
      <Button label="Подробнее о cookie" variant="quiet" onPress={doc} />
    </Sheet>
    <Sheet visible={!!message} title="Настройки конфиденциальности" onClose={() => setMessage('')}><Text accessibilityRole="alert" style={type.body}>{message}</Text><Button label="Понятно" onPress={() => setMessage('')} /></Sheet>
  </>;
}
export function PrivacyFooter() {
  const privacy = usePrivacy(), router = useRouter();
  return <View testID="privacy-footer" style={{ padding: 16, gap: 8 }}><Text style={type.caption}>{legalCopy.recommendations}</Text>{navigationMenu.filter(group => group.title === 'Документы и правила').flatMap(group => group.entries).filter(entry => entry.route !== '/legal/recommendations').map(entry => <Button key={entry.route} variant="quiet" label={entry.title} onPress={() => router.push(entry.route as any)} />)}<Button variant="quiet" label="Для бизнеса · договор поставки" onPress={() => router.push('/information/business')} /><Button variant="quiet" label="Возврат товара" onPress={() => router.push('/pages/returns')} /><Button variant="quiet" label="Гарантия" onPress={() => router.push('/pages/warranty')} /><Button variant="quiet" label="Претензии и контакты" onPress={() => router.push('/claims')} /><Button variant="quiet" label="Правила применения рекомендательных технологий" onPress={() => router.push('/legal/recommendations')} /><Button variant="secondary" label="Настройки cookie" onPress={() => privacy.setSettingsOpen(true)} /></View>;
}

export function LegalAccess() {
 const privacy = usePrivacy(), router = useRouter();
 return <View testID="legal-access" style={{gap:8,paddingTop:16}}><Button variant="quiet" label="Документы и правила" onPress={() => router.push('/pages/documents')} /><Button variant="quiet" label="Настройки cookie" onPress={() => privacy.setSettingsOpen(true)} /><Button variant="quiet" label={legalCopy.recommendations} onPress={() => router.push('/legal/recommendations')} /></View>;
}
