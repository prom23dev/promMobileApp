import { StyleSheet } from 'react-native';
import { palette } from './tokens';

export const colors = {
  ink: palette.navy900, brand: palette.navy700, accent: palette.orange600, orange: palette.orange500,
  background: palette.navy50, white: palette.white, muted: palette.grey500, line: palette.grey200,
  pale: palette.navy100, success: palette.green500, successPale: palette.green100,
};

export const type = StyleSheet.create({
  title: { color: colors.ink, fontSize: 26, fontWeight: '800', letterSpacing: -0.6, lineHeight: 32 },
  heading: { color: colors.ink, fontSize: 23, fontWeight: '700', letterSpacing: -0.4, lineHeight: 29 },
  subheading: { color: colors.ink, fontSize: 16, fontWeight: '700', lineHeight: 22 },
  body: { color: colors.ink, fontSize: 15, lineHeight: 22 },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '600', lineHeight: 20 },
});

export const layout = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 840, alignSelf: 'center' },
  inset: { paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 18, gap: 12 },
});
