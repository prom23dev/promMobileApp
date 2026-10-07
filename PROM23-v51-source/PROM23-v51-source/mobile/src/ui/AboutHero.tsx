import React, { useId } from 'react';
import { Image, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { ArrowDown } from 'lucide-react-native';
import { aboutCompany } from '../content/aboutCompany';
import { Button } from './primitives';
import { colors } from './theme';

// Keep the owner's full photograph: people and equipment must not be cropped.
export function AboutHero({ onHistory }: { onHistory: () => void }) {
  const { width, fontScale } = useWindowDimensions();
  const overlay = width >= 640 && fontScale < 1.4;
  const id = 'about-photo-' + useId().replace(/:/g, '');
  const copy = <View testID="about-banner-copy" style={[s.copy, overlay && s.overlayCopy]}>
    <Text style={s.eyebrow}>ГК «ПРОМЫШЛЕННИК» · С 2008 ГОДА</Text>
    <Text accessibilityRole="header" aria-level={1} style={[s.title, overlay && s.wideTitle]}>{aboutCompany.title}</Text>
    {!overlay && <Button label="История компании" onPress={onHistory} icon={<ArrowDown size={18} color={colors.white} />} style={{ marginTop: 6 }} />}
  </View>;
  return <View testID="about-banner" style={s.banner}>
    <View testID="about-banner-photo-frame" style={s.photoFrame}>
      <Image testID="about-banner-photo" source={require('../../assets/company/about-exhibition-team.jpg')} resizeMode="contain" accessibilityLabel="Команда Промышленника на выставочном стенде: строительные леса, опалубка и оборудование TeaM" style={s.photo} />
      {overlay && <View testID="about-banner-gradient" pointerEvents="none" aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%"><Defs><LinearGradient id={id} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={s.banner.backgroundColor} stopOpacity={0.94} />
          <Stop offset="21%" stopColor={s.banner.backgroundColor} stopOpacity={0.85} />
          <Stop offset="29%" stopColor={s.banner.backgroundColor} stopOpacity={0} />
          <Stop offset="100%" stopColor={s.banner.backgroundColor} stopOpacity={0} />
        </LinearGradient></Defs><Rect width="100%" height="100%" fill={'url(#' + id + ')'} /></Svg>
      </View>}
      {overlay && copy}
      {overlay && <View style={s.overlayAction}><Button label="Наша история" onPress={onHistory} icon={<ArrowDown size={18} color={colors.white} />} /></View>}
    </View>
    {!overlay && copy}
  </View>;
}
const s = StyleSheet.create({
  banner: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#292C2E' },
  photoFrame: { width: '100%', aspectRatio: 4 / 3 },
  photo: { width: '100%', height: '100%' },
  copy: { padding: 18, gap: 9 },
  overlayCopy: { position: 'absolute', top: 0, left: 0, right: 0, padding: 22 },
  eyebrow: { color: colors.white, fontSize: 10, lineHeight: 14, fontWeight: '600', letterSpacing: 0.5 },
  title: { color: colors.white, fontSize: 23, lineHeight: 28, fontWeight: '800', letterSpacing: -0.6 },
  wideTitle: { fontSize: 28, lineHeight: 33 },
  overlayAction: { position: 'absolute', bottom: 18, left: 18, width: 180 },
});
