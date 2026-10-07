import React, { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { colors, type } from './theme';
import { useReducedMotion } from './useReducedMotion';

export type RelatedAnswerLink = { label: string; route: string };
/** No default link: related content is an explicit, optional property of the answer. */
export function QuestionAnswer({ question, answer, children, relatedLink }: {
  question: string; answer: string; children?: ReactNode; relatedLink?: RelatedAnswerLink;
}) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(0); const progress = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion(); const router = useRouter(); const id = useId();
  useEffect(() => {
    progress.stopAnimation();
    if (reduced) progress.setValue(open ? 1 : 0);
    else Animated.timing(progress, { toValue: open ? 1 : 0, duration: 200, useNativeDriver: false }).start();
    return () => progress.stopAnimation();
  }, [open, progress, reduced]);
  return <View testID="question-answer" style={s.row}>
    <Pressable accessibilityRole="button" accessibilityLabel={question} aria-controls={id} accessibilityState={{ expanded: open }} aria-expanded={open} onPress={() => setOpen(value => !value)} style={({ pressed }) => [s.trigger, pressed && { opacity: .7 }]}>
      <Text style={[type.subheading, { flex: 1 }]}>{question}</Text>
      <View aria-hidden accessible={false} style={s.symbol}><View style={s.minus} /><Animated.View style={[s.minus, { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }), transform: [{ rotate: '90deg' }] }]} /></View>
    </Pressable>
    <Animated.View testID="answer-panel" nativeID={id} aria-hidden={!open} accessibilityElementsHidden={!open} importantForAccessibility={open ? 'auto' : 'no-hide-descendants'} pointerEvents={open ? 'auto' : 'none'} style={{ overflow: 'hidden', height: reduced ? (open ? height : 0) : progress.interpolate({ inputRange: [0, 1], outputRange: [0, height] }), opacity: reduced ? (open ? 1 : 0) : progress }}>
      <View onLayout={event => setHeight(event.nativeEvent.layout.height)} style={s.answer}>
        <Text style={type.body}>{answer}</Text>{children}
        {relatedLink && <Pressable accessibilityRole="link" accessibilityLabel={relatedLink.label} tabIndex={open ? 0 : -1} onPress={() => router.push(relatedLink.route as Href)} style={({ pressed }) => [s.link, pressed && { opacity: .7 }]}><Text style={[type.label, { color: colors.brand }]}>{relatedLink.label} →</Text></Pressable>}
      </View>
    </Animated.View>
  </View>;
}
const s = StyleSheet.create({
  row: { borderBottomWidth: 1, borderBottomColor: colors.line }, trigger: { minHeight: 68, paddingVertical: 18, paddingHorizontal: 2, flexDirection: 'row', gap: 16, alignItems: 'center' },
  symbol: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }, minus: { position: 'absolute', width: 14, height: 2, backgroundColor: colors.brand },
  answer: { position: 'absolute', top: 0, left: 0, right: 0, gap: 12, paddingBottom: 20, paddingHorizontal: 2 },
  link: { minHeight: 48, justifyContent: 'center' },
});
