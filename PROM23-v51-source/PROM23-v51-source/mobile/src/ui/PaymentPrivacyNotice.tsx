import React from 'react';
import { Linking, Text, View } from 'react-native';
import { legalCopy } from '../content/legalCopy';
import { paymentLegalLinks } from '../content/paymentLinks';
import { Button } from './primitives';
import { type } from './theme';
export function PaymentPrivacyNotice({ method }: { method: string }) {
  const yandex = /online|yandex|yapay|split/i.test(method), split = /split/i.test(method);
  if (!yandex && !/card|online/i.test(method)) return null;
  return <View style={{ gap: 8 }}><Text style={type.caption}>{legalCopy.card}</Text>{yandex && <Text style={type.caption}>{legalCopy.yandexPay}</Text>}{split && <Text style={type.caption}>{legalCopy.split}</Text>}{yandex && <><Button label="Условия Яндекс Пэй" variant="quiet" onPress={() => { void Linking.openURL(paymentLegalLinks.pay); }} /><Button label="Политика конфиденциальности Яндекс Пэй" variant="quiet" onPress={() => { void Linking.openURL(paymentLegalLinks.privacy); }} />{split && <Button label="Условия Яндекс Сплита" variant="quiet" onPress={() => { void Linking.openURL(paymentLegalLinks.split); }} />}</>}</View>;
}
