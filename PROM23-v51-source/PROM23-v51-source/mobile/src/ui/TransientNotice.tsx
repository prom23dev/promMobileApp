import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, Text, View } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { colors, layout, type } from './theme';

export const NOTICE_TIMEOUT_MS = 4000;
export type NoticeMessage = { id: number; title: string; body: string; shownAt: number };

/** Mounted once in the app shell; no persisted notification or focus transfer. */
export function TransientNotice({ notice, onDismiss, reduced }: { notice: NoticeMessage; onDismiss: (id: number) => void; reduced: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const announced = useRef<number | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web' && announced.current !== notice.id) {
      AccessibilityInfo.announceForAccessibility(notice.title + '. ' + notice.body);
      announced.current = notice.id;
    }
  }, [notice]);
  useEffect(() => {
    let active = true;
    opacity.stopAnimation();
    if (reduced) opacity.setValue(1);
    else Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: Platform.OS !== 'web' }).start();
    // Preference changes and rerenders never extend the original deadline.
    const timer = setTimeout(() => {
      if (reduced) onDismiss(notice.id);
      else Animated.timing(opacity, { toValue: 0, duration: 140, useNativeDriver: Platform.OS !== 'web' }).start(({ finished }) => {
        if (active && finished) onDismiss(notice.id);
      });
    }, Math.max(0, notice.shownAt + NOTICE_TIMEOUT_MS - Date.now()));
    return () => { active = false; clearTimeout(timer); opacity.stopAnimation(); };
  }, [notice.id, notice.shownAt, onDismiss, opacity, reduced]);
  return <Animated.View testID="location-change-notice" style={{ opacity, transform: [{ translateY: reduced ? 0 : opacity.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }}>
    <View style={[layout.row, { gap: 8, backgroundColor: colors.successPale, paddingHorizontal: 12, paddingVertical: 8 }]}>
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden><Check size={18} strokeWidth={1.7} color={colors.success} /></View>
      <View accessibilityLiveRegion="polite" role={Platform.OS === 'web' ? 'status' : undefined} style={{ flex: 1, minWidth: 0 }}>
        <Text style={type.label}>{notice.title}</Text><Text style={type.caption}>{notice.body}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Закрыть уведомление о месте доставки" onPress={() => onDismiss(notice.id)}
        style={({ pressed }) => ({ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: pressed ? colors.white : 'transparent' })}>
        <X size={18} color={colors.brand} accessible={false} aria-hidden />
      </Pressable>
    </View>
  </Animated.View>;
}
