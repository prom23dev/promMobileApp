import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useShop } from '../store';
import { formatMoney } from '../domain';
import { localRequest } from '../api/local';
import { checkoutScope, emptyChoices, pickCheckoutChoices, type CheckoutChoices, type CheckoutSummary, type CheckoutOptions } from '../checkout-domain';
import { Button, Header } from '../ui/primitives';
import { LocationPicker } from '../ui/LocationPicker';
import { settlementLabel } from '../location-domain';
import { CartCoupon } from '../ui/CartCoupon';
import { ConsentFields } from '../ui/ConsentFields';
import { PaymentPrivacyNotice } from '../ui/PaymentPrivacyNotice';
import { siteForms, initialConsentValues, businessCheckoutConsents } from '../forms/siteForms';
import { legalCopy } from '../content/legalCopy';
import { colors, layout, type } from '../ui/theme';

export default function CheckoutScreen() {
  const { state, location, products, busy: shopBusy } = useShop(), router = useRouter();
  const { payment: requestedPayment } = useLocalSearchParams<{ payment?: string }>();
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [choices, setChoices] = useState<CheckoutChoices>(emptyChoices);
  const [hydratedScope, setHydratedScope] = useState('');
  const [optionsResult, setOptionsResult] = useState<{ key: string; value: CheckoutOptions } | null>(null);
  const [quoteResult, setQuoteResult] = useState<{ key: string; value: CheckoutSummary } | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(false), [quoting, setQuoting] = useState(false);
  const [loadError, setLoadError] = useState(''), [optionsError, setOptionsError] = useState(''), [quoteError, setQuoteError] = useState(''), [error, setError] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [reload, setReload] = useState(0), [optionsRevision, setOptionsRevision] = useState(0), [quoteRevision, setQuoteRevision] = useState(0);
  const [cityOpen, setCityOpen] = useState(false), [busy, setBusy] = useState(false), [reference, setReference] = useState('');
  const [name, setName] = useState(''), [phone, setPhone] = useState(''), [email, setEmail] = useState('');
  const [consents, setConsents] = useState<Record<string, boolean>>(() => initialConsentValues(siteForms.checkout.consents));
  const [addressSuggestions, setAddressSuggestions] = useState<{ address: string }[]>([]), [addressLoading, setAddressLoading] = useState(false);
  const checkoutConsents = state.context === 'personal' ? siteForms.checkout.consents : businessCheckoutConsents;
  const selected = state.carts[state.context].filter(line => line.selected !== false);
  const scope = checkoutScope(state.context, location?.version ?? 0, state.carts[state.context]);
  const scopeRef = useRef(scope); scopeRef.current = scope;
  const choicesRef = useRef(choices); choicesRef.current = choices;
  const lock = useRef(false), suggestionGeneration = useRef(0);
  const optionsKey = JSON.stringify([scope, choices.delivery, choices.delivery === 'courier' ? choices.address : '', optionsRevision]);
  const options = optionsResult?.key === optionsKey ? optionsResult.value : null;
  const quoteKey = JSON.stringify([scope, choices, optionsRevision, quoteRevision]);
  const quote = !couponBusy && hydratedScope === scope && quoteResult?.key === quoteKey ? quoteResult.value.draft.quote : null;
  const readyForOptions = hydratedScope === scope && !!location?.settlement && selected.length > 0 && !!choices.delivery && (choices.delivery !== 'courier' || choices.address.trim().length >= 3);
  const readyForQuote = readyForOptions && !!options?.deliveryOptions.length && !!choices.payment && options.paymentMethods.some(m => m.id === choices.payment) && options.deliveryOptions.some(item => item.id === choices.pickupId);

  useEffect(() => {
    let active = true; const controller = new AbortController();
    setHydratedScope(''); setSummary(null); setOptionsResult(null); setQuoteResult(null); setLoadError(''); setError(''); setReference(''); setConsents(initialConsentValues(siteForms.checkout.consents)); setChoices(emptyChoices); setAddressSuggestions([]);
    void localRequest<CheckoutSummary>('/v1/cart/summary', { signal: controller.signal }).then(value => {
      if (!active) return;
      const draft = pickCheckoutChoices(value.draft);
      setSummary(value); setChoices({ ...draft, delivery: draft.delivery || value.deliveryMethods[0]?.id || '', payment: state.context !== 'personal' && requestedPayment === 'invoice' && value.paymentMethods.some(m => m.id === 'invoice') ? 'invoice' : draft.payment || value.paymentMethods[0]?.id || '' }); setHydratedScope(scope);
    }).catch(e => { if (active) setLoadError(e.message); });
    return () => { active = false; controller.abort(); };
  }, [scope, reload, requestedPayment]);

  // Delivery choices and the authoritative total refresh automatically. Each
  // response belongs to an exact input snapshot; stale totals are never shown.
  useEffect(() => {
    if (reference) return;
    setOptionsResult(null); setOptionsError(''); setQuoteResult(null); setQuoteError('');
    if (!readyForOptions || reference) { setLoadingOptions(false); return; }
    let active = true; const controller = new AbortController(); setLoadingOptions(true);
    const timer = setTimeout(() => {
      const { pickupId, ...input } = choicesRef.current;
      void localRequest<CheckoutOptions>('/v1/checkout/options', { method: 'POST', signal: controller.signal, body: { ...input, expectedContext: state.context, expectedLocationVersion: location?.version ?? 0 } }).then(value => {
        if (!active) return;
        setOptionsResult({ key: optionsKey, value });
        setChoices(old => ({ ...old, pickupId: value.deliveryOptions.some(item => item.id === old.pickupId) ? old.pickupId : value.deliveryOptions.length === 1 ? value.deliveryOptions[0].id : '', payment: value.paymentMethods.some(item => item.id === old.payment) ? old.payment : value.paymentMethods[0]?.id || '' }));
      }).catch(e => { if (active) setOptionsError(e.message); }).finally(() => { if (active) setLoadingOptions(false); });
    }, 350);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [optionsKey, readyForOptions, reference]);

  useEffect(() => {
    setQuoteError('');
    if (!readyForQuote || reference || shopBusy || couponBusy) { setQuoting(false); return; }
    let active = true; const controller = new AbortController(); setQuoting(true);
    const timer = setTimeout(() => {
      void localRequest<CheckoutSummary>('/v1/checkout/quote', { method: 'POST', signal: controller.signal, body: { ...choices, expectedContext: state.context, expectedLocationVersion: location?.version ?? 0 } }).then(value => { if (active) setQuoteResult({ key: quoteKey, value }); }).catch(e => { if (active) setQuoteError(e.message); }).finally(() => { if (active) setQuoting(false); });
    }, 350);
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [quoteKey, readyForQuote, reference, shopBusy, couponBusy]);
  useEffect(() => {
    if (!quote || reference) return;
    const timer = setTimeout(() => setQuoteRevision(value => value + 1), Math.max(0, Date.parse(quote.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [quote?.id, quote?.expiresAt, reference]);

  useEffect(() => {
    if (!options || reference) return;
    const timer = setTimeout(() => setOptionsRevision(v => v + 1), Math.max(0, Date.parse(options.expiresAt) - Date.now()));
    return () => clearTimeout(timer);
  }, [options?.expiresAt, reference]);

  const termsKey = quote?.legal ? JSON.stringify([quote.legal.seller.id, quote.legal.hash, quote.legal.version, quote.legal.contractNumber]) : '';
  const acceptedTermsKey = useRef('');
  useEffect(() => { if (termsKey && acceptedTermsKey.current !== termsKey) { setConsents(initialConsentValues(siteForms.checkout.consents)); acceptedTermsKey.current = termsKey; } }, [termsKey]);

  function change(key: keyof CheckoutChoices, value: string) {
    setError(''); suggestionGeneration.current++;
    if (key === 'address' || key === 'delivery') setAddressSuggestions([]);
    setChoices(old => ({ ...old, [key]: value, ...(['delivery', 'address'].includes(key) ? { pickupId: '' } : {}) }));
  }
  async function suggestAddress() {
    if (addressLoading || busy) return;
    const generation = ++suggestionGeneration.current, binding = scope;
    setAddressLoading(true); setError(''); setAddressSuggestions([]);
    try {
      const result = await localRequest<{ suggestions: { address: string }[] }>('/v1/checkout/address-suggestions', { method: 'POST', body: { query: choices.address, expectedContext: state.context, expectedLocationVersion: location?.version ?? 0 } });
      if (scopeRef.current === binding && generation === suggestionGeneration.current) { setAddressSuggestions(result.suggestions); if (!result.suggestions.length) setError('Уточните улицу и номер дома в выбранном населённом пункте.'); }
    } catch (e) { if (scopeRef.current === binding && generation === suggestionGeneration.current) setError(e instanceof Error ? e.message : 'Не удалось проверить адрес.'); }
    finally { setAddressLoading(false); }
  }
  async function submit() {
    if (lock.current || !quote?.legal || quoting || shopBusy || couponBusy) return;
    if (Date.parse(quote.expiresAt) <= Date.now()) { setQuoteRevision(v => v + 1); return; }
    const required = checkoutConsents.filter(c => c.required);
    if (required.some(c => !consents[c.name])) { setError('Подтвердите обязательные согласия.'); return; }
    if (!name.trim() || phone.replace(/\D/g, '').length < 10 || !/^\S+@\S+\.\S+$/.test(email)) { setError('Проверьте имя, телефон и email получателя.'); return; }
    lock.current = true; setBusy(true); setError(''); const binding = scope;
    try {
      const value = await localRequest<{ status: string; reference: string }>('/v1/checkout/submit', { method: 'POST', key: 'order_' + quote.id, body: { expectedContext: state.context, quoteId: quote.id, name, phone, email, consents: required.map(c => ({ name: c.name, accepted: !!consents[c.name], documentIds: c.documents })) } });
      if (scopeRef.current === binding) { if (value.status !== 'accepted' || !value.reference) throw new Error('Магазин не подтвердил создание заказа.'); setReference(value.reference); }
    } catch (e) { if (scopeRef.current === binding) setError(e instanceof Error ? e.message : 'Не удалось оформить заказ.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function pay() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); const binding = scope;
    try {
      const result = await localRequest<{ url: string }>('/v1/payment/session', { method: 'POST', key: 'payment_' + reference, body: { expectedContext: state.context, reference } });
      if (scopeRef.current !== binding) return;
      if (new URL(result.url).protocol !== 'https:') throw new Error('Не удалось открыть защищённую оплату.');
      await Linking.openURL(result.url);
    } catch (e) { if (scopeRef.current === binding) setError(e instanceof Error ? e.message : 'Не удалось открыть оплату.'); }
    finally { lock.current = false; setBusy(false); }
  }
  const input = (label: string, value: string, onChangeText: (v: string) => void, keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default') => <View style={{ gap: 6 }}><Text style={type.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} editable={!busy} onChangeText={onChangeText} keyboardType={keyboardType} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'} maxLength={500} style={[type.body, { minHeight: 50, padding: 12, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.background }]} /></View>;
  const methods = (kind: 'delivery' | 'payment', items: { id: string; name: string; description: string }[]) => <View style={{ gap: 8 }}>{items.map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={item.name} accessibilityState={{ checked: choices[kind] === item.id, disabled: busy }} aria-checked={choices[kind] === item.id} disabled={busy} onPress={() => change(kind, item.id)} style={{ padding: 14, minHeight: 60, borderWidth: 1, borderColor: choices[kind] === item.id ? colors.brand : colors.line, backgroundColor: choices[kind] === item.id ? colors.pale : colors.white, borderRadius: 12, gap: 4 }}><Text style={type.label}>{choices[kind] === item.id ? '● ' : '○ '}{item.name}</Text><Text style={type.caption}>{item.description}</Text></Pressable>)}</View>;
  const sectionTitle = (text: string) => <Text accessibilityRole="header" aria-level={2} style={type.heading}>{text}</Text>;
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}><Header title="Оформление заказа" back /><ScrollView buyerControls keyboardShouldPersistTaps="handled" style={layout.content} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 36 }}>

    {reference ? <View style={layout.card}>{sectionTitle('Заказ ' + reference)}<Text style={type.body}>Заказ оформлен. Статус оплаты и получения доступен в личном кабинете.</Text>{quote?.legal && <><Text style={type.body}>Продавец: {quote.legal.seller.legalName} · ИНН {quote.legal.seller.inn}</Text><Text style={type.caption}>Редакция условий: {quote.legal.version}</Text></>}{choices.payment !== 'receipt' && choices.payment !== 'invoice' && <Button label="Перейти к оплате" disabled={busy} onPress={() => { void pay(); }} />}{!!error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}{state.context !== 'personal' && <Button label="Счёт и документы заказа" variant="secondary" onPress={() => router.push('/workspace/documents')} />}<Button label="Мои заказы" onPress={() => router.push('/orders')} /></View>
      : !selected.length ? <View style={layout.card}>{sectionTitle('Выберите товары для заказа')}<Text style={type.body}>Отметьте нужные позиции в корзине.</Text><Button label="В корзину" onPress={() => router.push('/cart')} /></View> : <>
        <View style={layout.card}>{sectionTitle('Получатель')}{state.context !== 'personal' && <Text style={type.label}>{state.activeOrganization?.name ?? 'Выберите организацию в переключателе выше'}</Text>}{input('ФИО получателя', name, setName)}{input('Телефон', phone, setPhone, 'phone-pad')}{input('Email', email, setEmail, 'email-address')}</View>
        <View style={layout.card}>{sectionTitle('Получение')}<Button label={settlementLabel(location?.settlement)} variant="secondary" disabled={busy} onPress={() => setCityOpen(true)} />
          {summary ? methods('delivery', summary.deliveryMethods) : <ActivityIndicator accessibilityLabel="Загружаем способы получения" />}
          {choices.delivery === 'courier' && <>{input('Улица и дом', choices.address, v => change('address', v))}<Button label={addressLoading ? 'Ищем адрес…' : 'Найти точный адрес'} variant="quiet" disabled={busy || addressLoading || choices.address.trim().length < 3} onPress={() => { void suggestAddress(); }} />{addressSuggestions.map(item => <Button key={item.address} label={item.address} variant="secondary" onPress={() => change('address', item.address)} />)}{input('Подъезд', choices.pod, v => change('pod', v))}{input('Этаж', choices.etag, v => change('etag', v))}{input('Квартира или офис', choices.office, v => change('office', v))}</>}
          {loadingOptions && <View style={layout.row}><ActivityIndicator /><Text style={type.caption}>Обновляем варианты получения…</Text></View>}
          {!!optionsError && <View style={{ gap: 8 }}><Text accessibilityRole="alert" style={type.body}>{optionsError}</Text><Button label="Повторить загрузку вариантов" variant="secondary" onPress={() => setOptionsRevision(v => v + 1)} /></View>}
          {options && <View style={{ gap: 8 }}>{!options.deliveryOptions.length && <Text style={type.body}>Нет доступных вариантов. Выберите другой способ получения или обратитесь в магазин.</Text>}{options.deliveryOptions.map(item => <Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={item.name + ', ' + item.address} accessibilityState={{ checked: choices.pickupId === item.id, disabled: busy }} aria-checked={choices.pickupId === item.id} disabled={busy} onPress={() => change('pickupId', item.id)} style={{ padding: 14, gap: 5, borderRadius: 12, borderWidth: 1, backgroundColor: choices.pickupId === item.id ? colors.pale : colors.white, borderColor: choices.pickupId === item.id ? colors.brand : colors.line }}><Text style={type.label}>{choices.pickupId === item.id ? '● ' : '○ '}{item.name}</Text><Text style={type.caption}>{item.provider}</Text>{!!item.address && <Text style={type.body}>{item.address}</Text>}{!!item.period && <Text style={type.caption}>{item.period}</Text>}{item.priceKopecks !== undefined && <Text style={type.label}>{formatMoney(item.priceKopecks)}</Text>}</Pressable>)}</View>}
          <Text style={type.caption}>{legalCopy.address}</Text>{input('Комментарий к доставке', choices.comment, v => change('comment', v))}<Text style={type.caption}>Если нужно: время приёмки, контакт на объекте, условия въезда и разгрузки.</Text>
        </View>
        <View style={layout.card}>{sectionTitle('Оплата')}{summary && methods('payment', options?.paymentMethods ?? summary.paymentMethods)}<Text style={type.caption}>{state.context === 'personal' ? 'Данные карты вводятся в защищённой форме платёжного сервиса.' : 'Оплата банковским переводом по счёту на выбранную компанию или ИП. Счёт и документы подтверждённого заказа доступны в кабинете.'}</Text><PaymentPrivacyNotice method={choices.payment} /></View>
        <CartCoupon disabled={busy} onBusyChange={setCouponBusy} onChange={() => { setQuoteResult(null); setOptionsRevision(v => v + 1); }} />
        <View style={[layout.card, { borderWidth: 1, borderColor: colors.line }]}>{sectionTitle('Ваш заказ')}
          {(quote?.items ?? selected.map(line => ({ ...line, unitPriceKopecks: undefined, lineTotalKopecks: undefined }))).map(item => <View key={item.productId} style={{ gap: 4, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}><Text style={type.label}>{products.find(product => product.id === item.productId)?.name ?? item.productId}</Text><Text style={type.caption}>{item.quantity} шт.{item.unitPriceKopecks !== undefined ? ' × ' + formatMoney(item.unitPriceKopecks) : ''}</Text>{item.lineTotalKopecks !== undefined && <Text style={type.subheading}>{formatMoney(item.lineTotalKopecks)}</Text>}</View>)}
          <View accessibilityLiveRegion="polite" testID="checkout-total" style={{ gap: 10, paddingVertical: 8 }}>{quote ? <>
            <View style={layout.between}><Text style={type.body}>Товары</Text><Text style={type.subheading}>{formatMoney(quote.subtotalKopecks)}</Text></View>
            {!!quote.discountKopecks && <View style={layout.between}><Text style={type.body}>Скидка</Text><Text style={type.subheading}>−{formatMoney(quote.discountKopecks)}</Text></View>}
            <View style={layout.between}><Text style={type.body}>Доставка</Text><Text style={type.subheading}>{formatMoney(quote.deliveryKopecks)}</Text></View>
            {!!quote.deliveryLabel && <Text style={type.caption}>{quote.deliveryLabel}{quote.deliveryAddress ? ' · ' + quote.deliveryAddress : ''}</Text>}
            <View style={[layout.between, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 14 }]}><Text style={type.heading}>Итого</Text><Text style={[type.heading, { color: colors.accent }]}>{formatMoney(quote.totalKopecks)}</Text></View><Text style={type.caption}>Включает товары и доставку</Text>
          </> : <View style={{ gap: 8 }}>{(quoting || loadingOptions) && <ActivityIndicator />}<Text style={type.body}>{quoting || loadingOptions ? 'Обновляем итоговую сумму…' : !location?.settlement ? 'Выберите населённый пункт и способ получения — итог появится автоматически.' : optionsError || quoteError ? 'Итог пока не получен. Заказ можно оформить после подтверждения стоимости.' : 'Выберите вариант получения и оплату — итог появится автоматически.'}</Text></View>}</View>
          {!!loadError && <><Text accessibilityRole="alert" style={type.body}>{loadError}</Text><Button label="Повторить загрузку" variant="secondary" onPress={() => setReload(v => v + 1)} /></>}
          {!!quoteError && <><Text accessibilityRole="alert" style={type.body}>{quoteError}</Text><Button label="Обновить условия заказа" variant="secondary" onPress={() => setQuoteRevision(v => v + 1)} /></>}
          {quote?.legal && <View style={{ gap: 6, paddingVertical: 12 }}><Text style={type.label}>Продавец: {quote.legal.seller.legalName}</Text><Text selectable style={type.caption}>ИНН {quote.legal.seller.inn} · ОГРН {quote.legal.seller.ogrn}</Text><Text style={type.caption}>{quote.legal.seller.legalAddress}</Text><Text style={type.caption}>{quote.legal.seller.phone} · {quote.legal.seller.email}</Text><Text style={type.caption}>{state.context === 'personal' ? 'Редакция оферты: ' : 'Договор № ' + quote.legal.contractNumber + ' · версия: '}{quote.legal.version}</Text></View>}
          <Text style={type.caption}>{state.context === 'personal' ? legalCopy.checkoutPersonal : legalCopy.checkoutBusiness}</Text>
          {state.context !== 'personal' && <Button label="Договор и документы организации" variant="quiet" onPress={() => { if (quote?.legal?.url.startsWith('https://')) void Linking.openURL(quote.legal.url); else router.push('/workspace/documents'); }} />}
          <ConsentFields disabled={busy} documentActions={{ offer: () => { if (quote?.legal?.url.startsWith('https://')) void Linking.openURL(quote.legal.url); else router.push('/legal/offer'); } }} consents={checkoutConsents} values={consents} onChange={(key, value) => setConsents(old => ({ ...old, [key]: value }))} />
          {!!error && <Text accessibilityRole="alert" style={[type.body, { color: colors.accent }]}>{error}</Text>}
          {checkoutConsents.some(c => c.required && !consents[c.name]) && <Text style={{ fontSize: 13, lineHeight: 18, color: colors.muted }}>Чтобы оформить заказ, отметьте обязательные пункты выше.</Text>}
          <Button label={busy ? 'Оформляем заказ…' : state.context === 'personal' ? 'Оформить заказ' : 'Оформить заказ по счёту'} disabled={busy || shopBusy || couponBusy || quoting || !quote?.legal || checkoutConsents.some(c => c.required && !consents[c.name])} onPress={() => { void submit(); }} />
          {(!!optionsError || !!quoteError || (state.context !== 'personal' && !state.activeOrganization)) && <Button label={state.context === 'personal' ? 'Помощь с оформлением' : 'Отправить заявку для бизнеса'} variant="secondary" onPress={() => router.push(state.context === 'personal' ? '/information/contacts' : '/procurement')} />}
          <Button label="Вернуться в корзину" variant="quiet" onPress={() => router.push('/cart')} />
        </View>
      </>}
  </ScrollView><LocationPicker visible={cityOpen} onClose={() => setCityOpen(false)} /></SafeAreaView>;
}
