import React from 'react';
import { Text, View } from 'react-native';
import { Package, MapPin, FileText, Building2 } from 'lucide-react-native';
import { useShop } from '../store';
import { colors, layout, type } from './theme';

export function AccountBenefits() {
  const { state } = useShop(); const company = state.context !== 'personal';
  const items = company ? [
    { Icon: Package, title: 'Закупки под контролем', text: 'Ваши заказы в выбранной организации.' },
    { Icon: Building2, title: 'Реквизиты в одном месте', text: 'Данные организации и адреса грузополучателей.' },
    { Icon: FileText, title: 'Документы по заказам', text: 'Счета, УПД и акты сверки.' },
  ] : [
    { Icon: Package, title: 'Следите за заказами', text: 'История покупок и состояние каждого заказа.' },
    { Icon: MapPin, title: 'Оформляйте удобнее', text: 'Контактные данные и сохранённые адреса доставки.' },
    { Icon: FileText, title: 'Документы под рукой', text: 'Документы по покупкам и обращения в магазин.' },
  ];
  return <View testID="home-account-benefits" style={{ gap: 16 }}>{items.map(({ Icon, title, text }) => <View key={title} style={[layout.row, { alignItems: 'flex-start', gap: 12 }]}><Icon size={21} color={colors.brand} /><View style={{ flex: 1, gap: 3 }}><Text style={type.label}>{title}</Text><Text style={type.caption}>{text}</Text></View></View>)}</View>;
}
