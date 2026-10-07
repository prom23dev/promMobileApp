import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from 'react-native-svg';
import type { ProductKind } from '../domain';
import { colors } from './theme';

// Original schematic drawings, not product photography or technical assembly plans.
export function EquipmentArt({ kind, size = 150 }: { kind: ProductKind; size?: number }) {
  const stroke = colors.brand;
  return <Svg width="100%" height={size} viewBox="0 0 240 185" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <Ellipse cx="120" cy="164" rx="88" ry="9" fill="#DCE5EF" />
    {kind === 'scaffold' && <G fill="none" stroke={stroke} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
      <Path d="M48 153V42L170 24V139M73 161V63L194 44V150" />
      <Path d="M48 42L73 63M170 24L194 44M48 94L73 114M170 78L194 99M48 150L73 160M170 138L194 149" strokeWidth="3" />
      <Path d="M48 94L170 78M73 114L194 99M48 150L170 138M73 160L194 149" />
      <Path d="M73 63L194 99M194 44L73 114M73 114L194 149M194 99L73 160" strokeWidth="2" />
      <Path d="M48 90L170 74L194 94L73 110Z" fill="#E3B688" stroke="#B28768" strokeWidth="2" />
      <Path d="M49 38L170 20L194 40L73 59Z" fill="#F0CEAB" stroke="#B28768" strokeWidth="2" />
      <Path d="M43 153H54M66 163H80M164 140H176M188 151H200" stroke={colors.orange} strokeWidth="5" />
    </G>}
    {kind === 'tower' && <G fill="none" stroke={stroke} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
      <Path d="M76 151V29L145 17V138M97 158V42L167 29V145M76 29L97 42M145 17L167 29" />
      <Path d="M76 75L145 62L167 75L97 89ZM76 122L145 109L167 123L97 137" />
      <Path d="M97 43L167 76M167 29L97 88M97 90L167 123M167 77L97 136" strokeWidth="2" />
      <Path d="M77 69L145 56L167 69L97 82Z" fill="#F0CEAB" stroke="#B28768" strokeWidth="2" />
      <Path d="M64 150L151 134M87 158L179 143M76 122L53 157M167 123L191 154" />
      <Circle cx="65" cy="154" r="6" fill={colors.ink} /><Circle cx="94" cy="164" r="6" fill={colors.ink} /><Circle cx="154" cy="138" r="6" fill={colors.ink} /><Circle cx="178" cy="148" r="6" fill={colors.ink} />
      <Path d="M65 146L65 140M178 141V135" stroke={colors.orange} />
    </G>}
    {kind === 'ladder' && <G strokeLinecap="round" strokeLinejoin="round" fill="none">
      <Path d="M62 159L116 28L153 29L101 161M123 30L183 161M151 31L200 153" stroke="#8E9DB0" strokeWidth="6" />
      {[0, 1, 2, 3, 4, 5, 6].map(i => <Line key={i} x1={112 - i * 6.8} y1={44 + i * 17} x2={146 - i * 6.8} y2={45 + i * 17} stroke={stroke} strokeWidth="5" />)}
      <Path d="M86 113L165 110M101 119L185 116" stroke={stroke} strokeWidth="3" />
      <Path d="M58 161H70M97 163H108M177 163H189M195 155H205" stroke={colors.orange} strokeWidth="6" />
      <Path d="M113 26L153 27" stroke={colors.orange} strokeWidth="6" />
    </G>}
    {kind === 'mixer' && <G strokeLinejoin="round" strokeLinecap="round">
      <Path d="M92 102L72 158M143 102L168 156M81 136H157" fill="none" stroke={stroke} strokeWidth="7" />
      <Circle cx="80" cy="158" r="13" fill={colors.ink} /><Circle cx="80" cy="158" r="5" fill="#ADBBCC" /><Circle cx="170" cy="156" r="13" fill={colors.ink} /><Circle cx="170" cy="156" r="5" fill="#ADBBCC" />
      <Path d="M88 42C63 50 58 83 77 106L116 119C145 112 162 82 150 62L128 35Z" fill={colors.orange} stroke={colors.accent} strokeWidth="3" />
      <Ellipse cx="111" cy="40" rx="28" ry="12" transform="rotate(-18 111 40)" fill={colors.ink} stroke={colors.accent} strokeWidth="5" />
      <Path d="M66 81L155 95M71 70L156 86" fill="none" stroke={colors.accent} strokeWidth="3" />
      <Rect x="157" y="77" width="25" height="33" rx="5" fill={stroke} />
      <Path d="M59 76L51 103L65 120" fill="none" stroke={stroke} strokeWidth="4" /><Circle cx="52" cy="83" r="16" fill="none" stroke={stroke} strokeWidth="4" />
    </G>}
  </Svg>;
}
