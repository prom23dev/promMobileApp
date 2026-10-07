import React from 'react';
import { View } from 'react-native';
import type { Product } from '../domain';
import { PaymentBenefit, DeliveryBenefit } from './CommerceBenefits';
export function PurchaseBenefits({ product }: { product: Product }) {
  return <View style={{ gap: 4, marginBottom: 6 }}><PaymentBenefit product={product} compact /><DeliveryBenefit product={product} compact /></View>;
}
