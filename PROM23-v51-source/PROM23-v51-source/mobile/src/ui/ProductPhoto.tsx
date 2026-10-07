import React from 'react';
import { Image, View, Text, type StyleProp, type ViewStyle } from 'react-native';
import type { Product } from '../domain';
import { catalogAssets } from '../catalog-assets';
import { colors, type } from './theme';

export function ProductPhoto({ product, style }: { product: Product; style?: StyleProp<ViewStyle> }) {
  const source = catalogAssets[product.id];
  return <View style={[{ backgroundColor: colors.white, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, style]}>
    {source ? <Image source={source} accessibilityLabel={product.name} resizeMode="contain" style={{ width: '100%', height: '100%' }} /> : <Text style={type.caption}>Фото недоступно</Text>}
  </View>;
}
