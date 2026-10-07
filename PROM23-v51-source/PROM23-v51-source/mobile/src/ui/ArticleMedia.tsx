import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, Expand } from 'lucide-react-native';
import type { BlogImage } from '../content/blogContent';
import { IconButton, Button } from './primitives';
import { colors, layout, type } from './theme';

/** Image references come from the body of the corresponding source article. */
export function ArticleMedia({ images, title, active, onOpen }: { images: BlogImage[]; title?: string; active: boolean; onOpen: (image: BlogImage) => void }) {
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const item = images[index];
  if (!item) return null;
  const change = (next: number) => { setLoaded(false); setFailed(false); setIndex((next + images.length) % images.length); };
  return <View testID={images.length > 1 ? 'article-gallery' : 'article-inline-image'} style={s.group}>
    {title && <Text accessibilityRole="header" aria-level={2} style={type.heading}>{title}</Text>}
    <Pressable accessibilityRole="button" accessibilityLabel={'Открыть изображение: ' + (item.alt || 'иллюстрация к материалу')} onPress={() => onOpen(item)} style={s.frame}>
      {active && !failed && <Image key={item.url + attempt} source={{ uri: item.url }} resizeMode="contain" accessibilityLabel={item.alt || 'Иллюстрация к материалу'} accessibilityIgnoresInvertColors style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setFailed(true); }} />}
      {!active && <Text style={type.caption}>Иллюстрация к материалу</Text>}
      {active && !loaded && !failed && <ActivityIndicator accessibilityLabel="Загружаем изображение" color={colors.brand} />}
      {failed && <Text style={type.caption}>Не удалось загрузить изображение</Text>}
      <View style={s.expand}><Expand size={18} color={colors.brand} /></View>
    </Pressable>
    {failed && <Button label="Загрузить изображение ещё раз" variant="quiet" onPress={() => { setFailed(false); setAttempt(value => value + 1); }} />}
    {!!item.alt && <Text style={type.caption}>{item.alt}</Text>}
    {images.length > 1 && <View style={layout.between}>
      <IconButton label="Предыдущее фото объекта" onPress={() => change(index - 1)}><ChevronLeft size={21} color={colors.brand} /></IconButton>
      <Text accessibilityLiveRegion="polite" style={type.caption}>Фото {index + 1} из {images.length}</Text>
      <IconButton label="Следующее фото объекта" onPress={() => change(index + 1)}><ChevronRight size={21} color={colors.brand} /></IconButton>
    </View>}
  </View>;
}
const s = StyleSheet.create({
  group: { gap: 10, marginVertical: 8 },
  frame: { width: '100%', aspectRatio: 1.45, maxHeight: 360, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  expand: { position: 'absolute', right: 8, bottom: 8, width: 32, height: 32, borderRadius: 8, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
});
