import { InlineVideo } from './InlineVideo';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { loadProductPublications, type ProductPublication, type PublicationFilters } from '../api/site';
import { defaultPublicationFilters, safePublicationMedia, selectPublications } from '../publication-domain';
import { Sheet } from './Sheet';
import { ProductGallery } from './ProductGallery';
import { useShop } from '../store';
import { Button } from './primitives';
import { colors, layout, type } from './theme';

export function ProductDiscussion({ productId }: { productId: string }) {
  const router = useRouter(); const { state } = useShop();
  const [video, setVideo] = useState<string | null>(null);
  const [kind, setKind] = useState<'review' | 'question'>('review');
  const [items, setItems] = useState<ProductPublication[]>([]);
  const [available, setAvailable] = useState(false); const [loading, setLoading] = useState(true); const [revision, retry] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null); const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<PublicationFilters>(defaultPublicationFilters); const [media, setMedia] = useState<ProductPublication['media']>([]); const [mediaError, setMediaError] = useState('');
  useEffect(() => {
    let active = true; setItems([]); setAvailable(false); setLoading(true); setNextCursor(null);
    void loadProductPublications(productId, state.context, filters).then(result => {
      if (!active) return;
      setItems(result.items.filter(item => item.productId === productId)); setAvailable(result.available); setNextCursor(result.nextCursor); setLoading(false);
    }).catch(() => { if (active) { setAvailable(false); setLoading(false); } });
    return () => { active = false; };
  }, [productId, state.context, filters, revision]);
  const loadMore = () => {
    if (loadingMore || !nextCursor) return;
    setLoadingMore(true);
    void loadProductPublications(productId, state.context, filters, nextCursor).then(result => {
      setItems(previous => [...previous, ...result.items.filter(item => item.productId === productId)]); setNextCursor(result.nextCursor);
    }).catch(() => {}).finally(() => setLoadingMore(false));
  };
  const shown = selectPublications(items, productId, kind, filters);
  const activeFilters = filters.rating !== null || filters.withMedia || filters.withReplies;
  const chip = (label: string, selected: boolean, press: () => void) => <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected }} onPress={press} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 11, borderRadius: 10, backgroundColor: selected ? colors.brand : colors.pale }}><Text style={[type.caption, { color: selected ? colors.white : colors.ink, fontWeight: '600' }]}>{label}</Text></Pressable>;
  return <View style={layout.card}>
    <Text accessibilityRole="header" style={type.heading}>Отзывы и вопросы</Text>
    <View style={[layout.row, { gap: 8 }]}>{(['review', 'question'] as const).map(value => <Pressable key={value} accessibilityRole="tab" aria-selected={kind === value} accessibilityState={{ selected: kind === value }} onPress={() => setKind(value)} style={{ padding: 12, minHeight: 44, borderRadius: 10, backgroundColor: kind === value ? colors.brand : colors.pale }}><Text style={[type.label, { color: kind === value ? colors.white : colors.ink }]}>{value === 'review' ? 'Отзывы' : 'Вопросы'}</Text></Pressable>)}</View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
      {chip('С фото и видео', filters.withMedia, () => setFilters(f => ({ ...f, withMedia: !f.withMedia })))}
      {chip('С ответом', filters.withReplies, () => setFilters(f => ({ ...f, withReplies: !f.withReplies })))}
      {kind === 'review' && [5, 4, 3, 2, 1].map(n => chip(`${n} ★`, filters.rating === n, () => setFilters(f => ({ ...f, rating: f.rating === n ? null : n }))))}
    </ScrollView>
    {kind === 'review' && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>{([['new', 'Сначала новые'], ['high-rate', 'Высокая оценка'], ['low-rate', 'Низкая оценка']] as const).map(([sort, label]) => chip(label, filters.sort === sort, () => setFilters(f => ({ ...f, sort }))))}</ScrollView>}
    {loading ? <ActivityIndicator accessibilityLabel="Загружаем отзывы" color={colors.brand} /> : !available ? <View style={{ gap: 6 }}><Text style={type.body}>Не удалось получить публикации магазина. Повторите загрузку или обратитесь к специалисту.</Text><Button label="Обновить отзывы и вопросы" variant="quiet" onPress={() => retry(n => n + 1)} /></View> : !shown.length && <Text style={type.body}>{activeFilters ? 'По выбранным условиям публикаций нет.' : kind === 'review' ? 'Отзывов пока нет. Поделитесь своим опытом.' : 'Вопросов пока нет. Задайте вопрос специалисту.'}</Text>}
    {activeFilters && <Button label="Сбросить фильтры отзывов" variant="quiet" onPress={() => setFilters(defaultPublicationFilters)} />}

    {shown.map(item => <View key={item.id} style={{ gap: 9, borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 12 }}>
      <View style={layout.between}><Text style={type.label}>{item.author}</Text><Text style={type.caption}>{item.publishedLabel}</Text></View>
      {item.rating !== undefined && Number.isInteger(item.rating) && item.rating >= 1 && item.rating <= 5 && <Text accessibilityLabel={`Оценка: ${item.rating} из 5`} style={[type.label, { color: colors.accent }]}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</Text>}
      <Text selectable style={type.body}>{item.text}</Text>
      {!!item.media?.length && <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>{item.media.filter(m => safePublicationMedia(m.url)).map(m => <Pressable key={m.id} accessibilityRole="button" accessibilityLabel={m.kind === 'video' ? 'Открыть видео покупателя' : `Фото покупателя: ${m.alt}`} onPress={() => { if (m.kind === 'image') setMedia([m, ...item.media!.filter(other => other.id !== m.id && other.kind === 'image' && safePublicationMedia(other.url))]); else setVideo(m.url); }} style={{ width: 86, height: 86, backgroundColor: colors.pale, borderRadius: 10, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>{m.kind === 'image' ? <Image source={{ uri: m.url }} accessibilityLabel={m.alt} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Text style={type.label}>▶ Видео</Text>}</Pressable>)}</ScrollView>}
      {item.replies?.map(reply => <View key={reply.id} style={{ padding: 12, gap: 7, backgroundColor: colors.pale, borderRadius: 10 }}><Text style={type.label}>{reply.author}</Text><Text style={type.caption}>{reply.publishedLabel}</Text><Text selectable style={type.body}>{reply.text}</Text></View>)}
      <View style={{ gap: 6 }}>{item.actions.map(action => <Button key={action} label={action === 'reply' ? 'Ответить' : action === 'edit' ? 'Изменить' : 'Удалить'} variant="quiet" onPress={() => router.push({ pathname: '/forms/[id]', params: { id: `${item.kind}-${action}`, productId, ...(item.kind === 'review' ? { reviewId: item.id } : { questionId: item.id }), ...(action === 'reply' ? { parentId: item.id } : {}), expectedContext: state.context } })} />)}</View>
    </View>)}
    {!!nextCursor && <Button label={loadingMore ? 'Загружаем…' : 'Показать ещё'} variant="quiet" disabled={loadingMore} onPress={loadMore} />}
    <Button label={kind === 'review' ? 'Написать отзыв' : 'Задать вопрос'} variant="secondary" onPress={() => router.push({ pathname: '/forms/[id]', params: { id: kind, productId, expectedContext: state.context } })} />
    {!!mediaError && <Text accessibilityRole="alert" style={type.caption}>{mediaError}</Text>}
    <Sheet visible={!!video} title="Видео покупателя" onClose={() => setVideo(null)}>{video && <InlineVideo url={video} title="Видео покупателя" />}</Sheet>
    <Sheet visible={!!media?.length} title="Фото покупателей" onClose={() => setMedia([])}>{!!media?.length && <ProductGallery key={media[0].id} images={media.map(m => ({ id: m.id, source: { uri: m.url }, alt: m.alt }))} />}</Sheet>
  </View>;
}
