import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Truck, CreditCard, ClipboardList, RotateCcw, ShieldCheck, CircleHelp, BadgePercent, CirclePlay, FileDown, BookOpen, Building2, Factory, Construction, Award, Tags, MapPin, Landmark, BriefcaseBusiness, ListOrdered, Handshake, PackageCheck, Store, UserRound, ShoppingBag, Heart, ChartNoAxesColumn, BellRing, MessagesSquare, MessageCircle, MapPinHouse, Wallet, Bell, Files, FileText, LockKeyhole, Cookie, Sparkles, ChevronRight } from 'lucide-react-native';
import type { MenuEntry } from '../navigation-menu';
import { colors, type } from './theme';

const icons = { Truck, CreditCard, ClipboardList, RotateCcw, ShieldCheck, CircleHelp, BadgePercent, CirclePlay, FileDown, BookOpen, Building2, Factory, Construction, Award, Tags, MapPin, Landmark, BriefcaseBusiness, ListOrdered, Handshake, PackageCheck, Store, UserRound, ShoppingBag, Heart, ChartNoAxesColumn, BellRing, MessagesSquare, MessageCircle, MapPinHouse, Wallet, Bell, Files, FileText, LockKeyhole, Cookie, Sparkles };
export type MenuIconName = keyof typeof icons;

export function MenuRow({ entry, onPress, last = false }: { entry: MenuEntry; onPress: () => void; last?: boolean }) {
  const Icon = icons[entry.icon];
  const [focused, setFocused] = useState(false);
  return <Pressable testID={'menu-row:' + entry.route} accessibilityRole="link" accessibilityLabel={entry.title}
    onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [s.row, (pressed || focused) && { backgroundColor: colors.pale }]}>
    <View testID={'menu-icon:' + entry.icon} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden style={s.icon}>
      <Icon size={21} strokeWidth={1.7} color={colors.brand} />
    </View>
    <View style={[s.label, !last && s.divider]}><Text style={[type.label, { flex: 1, minWidth: 0 }]}>{entry.title}</Text>
      <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden><ChevronRight size={16} strokeWidth={1.7} color={colors.muted} /></View>
    </View>
  </Pressable>;
}
const s = StyleSheet.create({
  row: { minHeight: 54, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 32, height: 32, borderRadius: 9, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  label: { flex: 1, minWidth: 0, minHeight: 54, paddingVertical: 12, paddingRight: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
});
