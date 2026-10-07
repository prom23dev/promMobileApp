import React, { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { colors, layout, type } from './theme';
import { Reveal } from './Reveal';
export function CommerceAccordion({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return <View style={{ borderBottomWidth: 1, borderBottomColor: colors.line }}><Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ expanded: open }} aria-expanded={open} onPress={() => setOpen(!open)} style={[layout.between, { minHeight: 56, paddingVertical: 12 }]}><Text accessibilityRole="header" aria-level={2} style={[type.subheading, { flex: 1 }]}>{title}</Text>{open ? <ChevronUp size={20} color={colors.brand} /> : <ChevronDown size={20} color={colors.brand} />}</Pressable>{open && <Reveal><View style={{ gap: 12, paddingBottom: 16 }}>{children}</View></Reveal>}</View>;
}
