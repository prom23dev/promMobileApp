import React, { useRef, useState, type ReactNode, type RefObject } from 'react';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, ChevronDown, Factory, Globe2, PackageCheck, ShieldCheck, Trophy, ZoomIn } from 'lucide-react-native';
import { awardAlt, awardPhotos, corporateAwards, personalAwards, kubanRegisterUrl, type AwardEntry } from '../content/awards';
import { awardsIntro } from '../content/awardsCopy';
import { colors } from './theme';
import { Sheet } from './Sheet';
import { useReducedMotion } from './useReducedMotion';

function Action({ title, onPress, primary, disabled, compact }: { title: string; onPress: () => void; primary?: boolean; disabled?: boolean; compact?: boolean }) {
  const [focus, setFocus] = useState(false);
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled} accessibilityState={{ disabled: !!disabled }} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} onPress={onPress} style={({ pressed }) => [s.action, primary && s.primary, focus && s.focus, (pressed || disabled) && { opacity: .5 }]}><Text style={[s.actionText, primary && { color: colors.white }]}>{title}</Text>{!compact && <ArrowRight size={18} color={primary ? colors.white : colors.accent} />}</Pressable>;
}
function Detail({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false), [focus, setFocus] = useState(false);
  return <View><Pressable accessibilityRole="button" accessibilityLabel={label} aria-expanded={open} accessibilityState={{ expanded: open }} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} onPress={() => setOpen(!open)} style={[s.disclosure, focus && s.focus]}><Text style={s.actionText}>Подробности</Text><ChevronDown color={colors.accent} size={20} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} /></Pressable>{open && <View style={{ paddingTop: 8 }}>{children}</View>}</View>;
}
function Heading({ children }: { children: ReactNode }) { return <Text accessibilityRole="header" aria-level={2} style={s.h2}>{children}</Text>; }
const gallery = [...corporateAwards, ...personalAwards].flatMap(award => award.photos.map(photo => ({ award, photo })));
function AwardCard({ award, wide, onPhoto, onRegister }: { award: AwardEntry; wide: boolean; onPhoto: (photo: number) => void; onRegister: () => void }) {
  const sentenceEnd = award.body.indexOf('. ') + 1;
  const summary = sentenceEnd > 0 ? award.body.slice(0, sentenceEnd) : award.body;
  const rest = sentenceEnd > 0 ? award.body.slice(sentenceEnd).trim() : '';
  const [focusedPhoto, setFocusedPhoto] = useState(-1);
  return <View testID={`award-${award.id}`} style={[s.card, award.register && s.quality, wide && { flexDirection: 'row', gap: 24 }]}>
    <View style={{ flex: 1, minWidth: 0, gap: 12 }}>
      <View style={s.wrap}><Text style={s.result}>{award.result}</Text><Text style={s.level}>{award.level}</Text></View>
      <Text style={s.recipient}>{award.recipient}</Text>
      <Text accessibilityRole="header" aria-level={4} style={s.h3}>{award.title}</Text>
      <Text style={s.nomination}>{award.nomination}</Text>
      <View style={s.dateBox}><Text style={s.caption}>{award.date}</Text>{award.period && <Text style={[s.caption, { color: colors.ink, fontWeight: '600' }]}>{award.period}</Text>}</View>
      {award.register && <Text selectable style={s.body}>{summary}</Text>}
      {rest && (award.register ? <Text selectable style={s.body}>{rest}</Text> : <Detail label={`Подробности · ${award.title} · ${award.year} · ${award.result}`}><Text selectable style={s.body}>{award.body}</Text></Detail>)}
      {award.register && <Action title="Продукция в реестре «Сделано на Кубани»" onPress={onRegister} />}
    </View>
    {!!award.photos.length && <View style={[s.photos, wide && { width: award.photos.length > 1 ? 254 : 122 }]}>{award.photos.map(photo => <Pressable key={photo} testID={`award-photo-${photo}`} accessibilityRole="button" accessibilityLabel={`Открыть фото: ${awardAlt(award, photo)}`} onPress={() => onPhoto(photo)} onFocus={() => setFocusedPhoto(photo)} onBlur={() => setFocusedPhoto(-1)} style={[s.photo, focusedPhoto === photo && s.focus]}><Image source={awardPhotos[photo]} accessibilityLabel={awardAlt(award, photo)} resizeMode="contain" style={{ width: 86, height: 123 }} /><View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}><ZoomIn size={14} color={colors.accent} /><Text style={s.photoLabel}>Открыть</Text></View></Pressable>)}</View>}
  </View>;
}
export function AwardsPage({ scrollRef }: { scrollRef: RefObject<ScrollView | null> }) {
  const router = useRouter(), reduced = useReducedMotion(), { width, fontScale } = useWindowDimensions();
  const wide = width >= 680 && fontScale < 1.4;
  const positions = useRef<Record<string, number>>({});
  const [selected, setSelected] = useState<number | null>(null), [zoom, setZoom] = useState(false), [error, setError] = useState('');
  const current = selected === null ? null : gallery[selected];
  const jump = (id: string) => scrollRef.current?.scrollTo({ y: (positions.current[id] ?? 0) + 16, animated: !reduced });
  const openPhoto = (photo: number) => { setZoom(false); setSelected(gallery.findIndex(item => item.photo === photo)); };
  const openRegister = async () => { setError(''); try { await Linking.openURL(kubanRegisterUrl); } catch { setError('Не удалось открыть реестр. Попробуйте ещё раз.'); } };
  const introSplit = awardsIntro.indexOf('В числе организаций');
  return <View style={{ gap: 28 }}>
    <View style={s.hero}>
      <View style={s.wrap}><Trophy size={24} color={colors.accent} /><Text style={s.eyebrow}>ГК «ПРОМЫШЛЕННИК»</Text></View>
      <Text accessibilityRole="header" aria-level={1} style={[s.h1, width < 360 && { fontSize: 24, lineHeight: 31 }, wide && { fontSize: 36, lineHeight: 43 }]}>Награды и{ '\n' }профессиональное признание</Text>
      <Text style={s.body}>{introSplit > 0 ? awardsIntro.slice(0, introSplit).trim() : awardsIntro}</Text>
      <View style={s.domains}>{[[PackageCheck, 'Поставки'], [Factory, 'Производство'], [Globe2, 'Экспорт'], [ShieldCheck, 'Качество']].map(([Icon, label]) => { const Symbol = Icon as typeof Trophy; return <View key={String(label)} style={[s.domain, { width: wide ? '23%' : '47%' }]}><Symbol size={22} color={colors.accent} /><Text style={s.domainText}>{String(label)}</Text></View>; })}</View>
    </View>
    <View style={{ gap: 10 }}><Text style={s.caption}>ПЕРЕЙТИ К ГОДУ ВРУЧЕНИЯ</Text><View style={s.years}>{[2025, 2024, 2023, 2022].map(year => <View key={year} style={{ flex: 1 }}><Action compact title={String(year)} onPress={() => jump(String(year))} /></View>)}</View><Action title="Признание руководителей" onPress={() => jump('leaders')} /></View>
    <Heading>Награды компаний группы</Heading>
    {[2025, 2024, 2023, 2022].map(year => <View key={year} onLayout={event => { positions.current[String(year)] = event.nativeEvent.layout.y; }} style={{ gap: 16 }}><View style={s.yearLine}><Text accessibilityRole="header" aria-level={3} style={s.year}>{year}</Text><View style={s.line} /><Text style={s.caption}>год вручения</Text></View>{corporateAwards.filter(award => award.year === year).map(award => <AwardCard key={award.id} award={award} wide={wide} onPhoto={openPhoto} onRegister={() => void openRegister()} />)}</View>)}
    <View onLayout={event => { positions.current.leaders = event.nativeEvent.layout.y; }} style={{ gap: 16 }}><Heading>Признание руководителей</Heading><Text style={s.body}>Персональные награды за вклад в развитие промышленности и экспорта.</Text>{personalAwards.map(award => <AwardCard key={award.id} award={award} wide={wide} onPhoto={openPhoto} onRegister={() => void openRegister()} />)}</View>
    {introSplit > 0 && <View style={s.card}><Text style={s.body}>{awardsIntro.slice(introSplit)}</Text></View>}
    <View style={[s.card, { gap: 14 }]}><Heading>Познакомимся ближе</Heading><Text style={s.body}>Узнайте о нашей работе или обсудите с нами вашу задачу.</Text><View style={[{ gap: 10 }, wide && { flexDirection: 'row' }]}><View style={{ flex: 1, gap: 10 }}><Action title="О компании" onPress={() => router.push('/pages/about')} /><Action title="Наше производство" onPress={() => router.push('/information/production')} /></View><View style={{ flex: 1, gap: 10 }}><Action title="Наши проекты" onPress={() => router.push('/blog?kind=projects')} /><Action title="Документы на продукцию" onPress={() => router.push('/pages/documents')} /></View></View><Action title="Связаться с нами" primary onPress={() => router.push('/information/contacts')} /></View>
    {!!error && <Text accessibilityRole="alert" style={s.body}>{error}</Text>}
    <Sheet visible={current !== null} onClose={() => setSelected(null)} title={`Фото награды · ${(selected ?? 0) + 1} из ${gallery.length}`}>
      {current && <><Text style={s.recipient}>{current.award.recipient}</Text><Text style={s.h3}>{current.award.title}</Text><Text style={s.body}>{current.award.result} · {current.award.level} · {current.award.year}</Text><Image source={awardPhotos[current.photo]} accessibilityLabel={awardAlt(current.award, current.photo)} resizeMode="contain" style={{ width: zoom ? 258 : 172, height: zoom ? 369 : 246, maxWidth: '100%', alignSelf: 'center' }} /><Text style={s.caption}>Оригинал с сайта компании. Разрешение фото — 86 × 123 пикселя: при увеличении мелкий текст может быть нечётким.</Text><Action title={zoom ? 'Уменьшить фото' : 'Увеличить фото'} onPress={() => setZoom(!zoom)} /><View style={{ flexDirection: 'row', gap: 10 }}><View style={{ flex: 1 }}><Action title="Предыдущее" disabled={selected === 0} onPress={() => { setZoom(false); setSelected(value => Math.max(0, (value ?? 0) - 1)); }} /></View><View style={{ flex: 1 }}><Action title="Следующее" disabled={selected === gallery.length - 1} onPress={() => { setZoom(false); setSelected(value => Math.min(gallery.length - 1, (value ?? 0) + 1)); }} /></View></View></>}
    </Sheet>
  </View>;
}
const s = StyleSheet.create({
  hero: { backgroundColor: colors.white, borderRadius: 22, padding: 22, gap: 18, borderTopWidth: 4, borderTopColor: colors.accent },
  h1: { fontSize: 28, lineHeight: 35, fontWeight: '800', color: colors.ink, letterSpacing: -.6 },
  h2: { fontSize: 23, lineHeight: 30, fontWeight: '700', color: colors.ink },
  h3: { fontSize: 21, lineHeight: 28, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, lineHeight: 25, color: colors.ink },
  caption: { fontSize: 13, lineHeight: 20, color: colors.muted },
  eyebrow: { fontSize: 12, lineHeight: 18, letterSpacing: 1, fontWeight: '700', color: colors.brand },
  wrap: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  card: { borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 20, gap: 16 },
  quality: { backgroundColor: '#FFF4E8', borderColor: '#E8CE9A' },
  result: { fontSize: 22, lineHeight: 29, fontWeight: '800', color: colors.accent },
  level: { fontSize: 12, lineHeight: 18, fontWeight: '600', color: colors.brand, backgroundColor: colors.background, borderRadius: 7, paddingVertical: 5, paddingHorizontal: 8 },
  recipient: { fontSize: 14, lineHeight: 21, fontWeight: '700', color: colors.brand },
  nomination: { fontSize: 15, lineHeight: 23, color: colors.ink },
  dateBox: { borderLeftWidth: 2, borderLeftColor: colors.accent, paddingLeft: 10, gap: 3 },
  domains: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  domain: { minHeight: 72, padding: 10, gap: 6, backgroundColor: '#FFF4E8', borderRadius: 10 },
  domainText: { fontSize: 12, lineHeight: 18, fontWeight: '600', color: colors.ink },
  years: { flexDirection: 'row', gap: 6 },
  yearLine: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  year: { color: colors.accent, fontSize: 32, lineHeight: 39, fontWeight: '800' },
  line: { flex: 1, height: 1, backgroundColor: colors.line },
  action: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 12, gap: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionText: { fontSize: 14, lineHeight: 21, fontWeight: '700', color: colors.brand, flexShrink: 1 },
  primary: { backgroundColor: colors.accent, borderColor: colors.accent },
  focus: { outlineWidth: 2, outlineColor: colors.accent, outlineOffset: 3 },
  disclosure: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, alignSelf: 'flex-start' },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'flex-start' },
  photo: { width: 122, minHeight: 169, padding: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.white, alignItems: 'center', gap: 10 },
  photoLabel: { fontSize: 11, lineHeight: 17, color: colors.brand, fontWeight: '600' },
});
