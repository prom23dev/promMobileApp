import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { palette } from './tokens';

/** Decorative technical illustrations, not photographs of a real facility. */
export function CooperationGraphic({ kind }: { kind: 'supply' | 'franchise' | 'project' }) {
  const { navy700: ink, orange600: accent, navy100: pale, white, orange100 } = palette;
  return <View testID={'cooperation-graphic-' + kind} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden style={{ width: '100%', aspectRatio: 2.5, overflow: 'hidden', backgroundColor: kind === 'franchise' ? pale : orange100 }}>
    <Svg width="100%" height="100%" viewBox="0 0 400 160" fill="none">
      <Path d="M0 132H400M32 0V160M368 0V160" stroke={ink} strokeOpacity={0.08} />
      {kind === 'supply' && <>
        <Path d="M38 132V54L116 22L194 54V132" fill={white} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
        <Path d="M55 59H177M64 132V72H167V132M64 87H167M64 101H167M64 115H167" stroke={ink} strokeWidth={2} />
        <Rect x={102} y={39} width={29} height={9} rx={2} fill={accent} />
        <Path d="M144 128V101L163 91L184 101V128L163 139Z" fill={pale} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
        <Path d="M144 101L163 112L184 101M163 112V139" stroke={ink} strokeWidth={2} />
        <Path d="M217 86H306V125H217Z" fill={ink} />
        <Path d="M306 99H333L354 115V125H306Z" fill={accent} />
        <Path d="M316 105H330L341 114H316Z" fill={white} />
        <Path d="M229 99H278M229 109H262" stroke={white} strokeWidth={3} strokeLinecap="round" />
        <Circle cx={239} cy={129} r={10} fill={white} stroke={ink} strokeWidth={3} />
        <Circle cx={331} cy={129} r={10} fill={white} stroke={ink} strokeWidth={3} />
        <Path d="M216 48H320M308 37L320 48L308 59" stroke={accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </>}
      {kind === 'franchise' && <>
        <Path d="M89 133V62H309V133" fill={white} stroke={ink} strokeWidth={2.5} />
        <Rect x={96} y={27} width={206} height={29} rx={3} fill={ink} />
        <Path d="M122 37H275M149 46H248" stroke={white} strokeWidth={3} strokeLinecap="round" />
        <Path d="M92 57H306L319 77H79Z" fill={accent} />
        <Path d="M82 77V85Q96 96 110 85Q124 96 138 85Q152 96 166 85Q180 96 194 85Q208 96 222 85Q236 96 250 85Q264 96 278 85Q292 96 306 85L316 81V77" fill={accent} />
        <Path d="M111 98H174V133H111ZM225 98H286V133H225ZM189 97H213V133H189Z" fill={pale} stroke={ink} strokeWidth={2} />
        <Path d="M121 123L145 102M143 128L164 109" stroke={white} strokeWidth={3} />
        <Circle cx={48} cy={109} r={14} fill={white} stroke={ink} strokeWidth={2} />
        <Path d="M48 123V141M35 141H61" stroke={ink} strokeWidth={2} />
        <Path d="M341 36C341 25 364 25 364 36C364 45 352 54 352 54S341 45 341 36Z" fill={accent} />
        <Circle cx={352.5} cy={36} r={3.5} fill={white} />
        <Path d="M331 66H368M342 77H368" stroke={ink} strokeOpacity={0.3} strokeWidth={2} />
      </>}
      {kind === 'project' && <>
        <Rect x={47} y={28} width={145} height={111} rx={5} fill={white} stroke={ink} strokeWidth={2} />
        <Rect x={90} y={20} width={60} height={15} rx={3} fill={ink} />
        <G stroke={accent} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><Path d="M65 56L69 60L76 52M65 79L69 83L76 75M65 102L69 106L76 98" /></G>
        <Path d="M87 57H172M87 80H156M87 103H169M65 122H132" stroke={ink} strokeWidth={3} strokeLinecap="round" />
        <Path d="M218 138V26H329V138M218 33H329M218 70H329M218 107H329M224 33L323 70L224 107L323 138M323 33L224 70L323 107L224 138" stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
        <Path d="M210 70H337M210 108H337" stroke={accent} strokeWidth={6} />
        <Path d="M345 29H358M351 29V136M345 136H358" stroke={ink} strokeOpacity={0.35} strokeWidth={1.5} />
        <Path d="M210 143H231M316 143H337" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      </>}
    </Svg>
  </View>;
}
