// Brand primitives match the site's mixins.scss. Darker CTA preserves white-text contrast.
export const palette = {
  navy950: '#171B30', navy900: '#202338', navy700: '#3D4471', navy800: '#30375F', navy100: '#EDF0F7', navy50: '#F5F6F8',
  orange600: '#D93916', orange500: '#FF4016', orange100: '#FFF0E9', orange200: '#F6D6C6',
  white: '#FFFFFF', grey500: '#626679', grey200: '#E5E7ED',
  green700: '#185C37', green600: '#217E48', green500: '#27614F', green100: '#E3F3E8',
  violet700: '#663489', violet600: '#8342A9', violet100: '#F3EAFB',
  cyan100: '#D7F4F7', cyan700: '#245D68', blue100: '#E4EAFB', scrim: '#20233899',
};
export const surface = { canvas: palette.navy50, card: palette.white, brand: palette.navy700, subdued: palette.navy100, business: palette.orange100, split: palette.green100, plus: palette.violet100 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, section: 32 };
export const motion = { press: 120, standard: 220, entrance: 300 };
export const component = { button: { height: 48, radius: 12 }, card: { radius: 18, padding: 16 }, hero: { radius: 22 }, icon: { small: 18, regular: 22, large: 28 } };
