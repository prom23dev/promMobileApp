import React, { useRef, useState } from 'react';
import { Image, Modal, PanResponder, Pressable, ScrollView, Text, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Minus, Plus, X, Maximize2 } from 'lucide-react-native';
import { useReducedMotion } from './useReducedMotion';
import { IconButton } from './primitives';
import { colors, layout, type } from './theme';
export type GalleryImage = { id: string; source: ImageSourcePropType; alt: string };
function ZoomImage({ image }: { image: GalleryImage }) {
  const [zoom, setZoom] = useState(1); const zoomRef = useRef(1); const start = useRef(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); const origin = useRef(offset);
  const change = (value: number) => { const next = Math.max(1, Math.min(4, value)); zoomRef.current = next; setZoom(next); if (next === 1) { origin.current = { x: 0, y: 0 }; setOffset(origin.current); } };
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: e => e.nativeEvent.touches.length > 1 || zoomRef.current > 1,
    onPanResponderGrant: e => { const t = e.nativeEvent.touches; start.current = t.length > 1 ? Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY) / zoomRef.current : 0; },
    onPanResponderMove: (e, g) => { const t = e.nativeEvent.touches; if (t.length > 1 && start.current) change(Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY) / start.current); else if (zoomRef.current > 1) setOffset({ x: Math.max(-300, Math.min(300, origin.current.x + g.dx)), y: Math.max(-400, Math.min(400, origin.current.y + g.dy)) }); },
    onPanResponderRelease: () => { setOffset(value => { origin.current = value; return value; }); },
  })).current;
  return <><View {...pan.panHandlers} style={{ flex: 1, overflow: 'hidden' }}><Image source={image.source} accessibilityLabel={image.alt} resizeMode="contain" style={{ width: '100%', height: '100%', transform: [{ translateX: offset.x }, { translateY: offset.y }, { scale: zoom }] }} /></View><View style={[layout.row, { justifyContent: 'center', gap: 18 }]}><IconButton label="Уменьшить фото" disabled={zoom <= 1} onPress={() => change(zoom - 0.5)}><Minus size={22} color={colors.brand} /></IconButton><Pressable accessibilityRole="button" accessibilityLabel="Сбросить увеличение" onPress={() => { origin.current = { x: 0, y: 0 }; change(1); }} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={type.label}>{Math.round(zoom * 100)}%</Text></Pressable><IconButton label="Увеличить фото" disabled={zoom >= 4} onPress={() => change(zoom + 0.5)}><Plus size={22} color={colors.brand} /></IconButton></View></>;
}
export function ProductGallery({ images }: { images: GalleryImage[] }) {
  const { width } = useWindowDimensions(); const reducedMotion = useReducedMotion(); const [pageWidth, setPageWidth] = useState(Math.min(width, 720));
  const [index, setIndex] = useState(0); const [open, setOpen] = useState(false); const rail = useRef<ScrollView>(null);
  const go = (value: number) => { const next = Math.max(0, Math.min(images.length - 1, value)); setIndex(next); rail.current?.scrollTo({ x: next * pageWidth, animated: false }); };
  if (!images.length) return <View style={{ padding: 40 }}><Text style={type.caption}>Фото пока недоступно</Text></View>;
  const image = images[Math.min(index, images.length - 1)];
  return <View testID="product-gallery" onLayout={e => setPageWidth(e.nativeEvent.layout.width)} style={{ backgroundColor: colors.white }}>
    <ScrollView ref={rail} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={e => setIndex(Math.round(e.nativeEvent.contentOffset.x / pageWidth))}>
      {images.map((item, i) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Открыть фото ${i + 1} из ${images.length}`} onPress={() => { setIndex(i); setOpen(true); }} style={{ width: pageWidth, height: Math.min(pageWidth * 0.76, 290) }}>{Math.abs(i - index) <= 1 && <Image source={item.source} accessibilityLabel={item.alt} resizeMode="contain" style={{ width: '100%', height: '100%' }} />}</Pressable>)}
    </ScrollView>
    <View style={[layout.between, { paddingHorizontal: 12 }]}><IconButton label="Предыдущее фото" disabled={index === 0} onPress={() => go(index - 1)}><ChevronLeft size={20} color={colors.brand} /></IconButton><View style={[layout.row, { gap: 5 }]}>{images.length <= 12 ? images.map((item, i) => <View key={item.id} style={{ width: i === index ? 18 : 5, height: 5, borderRadius: 4, backgroundColor: i === index ? colors.accent : colors.line }} />) : <Text style={type.caption}>{index + 1} / {images.length}</Text>}</View><IconButton label="Следующее фото" disabled={index === images.length - 1} onPress={() => go(index + 1)}><ChevronRight size={20} color={colors.brand} /></IconButton></View>
    <Modal visible={open} animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={() => setOpen(false)}><SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}><View style={[layout.between, { paddingHorizontal: 12 }]}><Text style={type.label}>Фото {index + 1} из {images.length}</Text><IconButton label="Закрыть галерею" onPress={() => setOpen(false)}><X size={24} color={colors.ink} /></IconButton></View><ZoomImage key={image.id} image={image} /><View style={[layout.between, { paddingHorizontal: 16 }]}><IconButton label="Предыдущее фото в галерее" disabled={index === 0} onPress={() => go(index - 1)}><ChevronLeft size={24} color={colors.brand} /></IconButton><Text style={type.caption}>Разведите пальцы, чтобы увеличить</Text><IconButton label="Следующее фото в галерее" disabled={index === images.length - 1} onPress={() => go(index + 1)}><ChevronRight size={24} color={colors.brand} /></IconButton></View></SafeAreaView></Modal>
  </View>;
}
