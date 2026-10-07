import React, { useEffect, useRef, useState } from 'react';
import { Image, Platform, Pressable, Share, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import * as Linking from 'expo-linking';
import { ArrowUpRight, ExternalLink, List, Play, Share2 } from 'lucide-react-native';
import { blogArticles, blogCategories, blogImages, getBlogArticle, type BlogBlock, type BlogImage, type BlogLink } from '../content/blogContent';
import { useShop } from '../store';
import { AssistedPurchase } from '../ui/AssistedPurchase';
import { Button, Header, Sheet } from '../ui/primitives';
import { colors, layout, type } from '../ui/theme';
import { InlineVideo } from '../ui/InlineVideo';
import { videoSource } from '../video-source';
import { ArticleMedia } from '../ui/ArticleMedia';

function ArticleBlock({ block, mediaActive, onOpenImage }: { block: BlogBlock; mediaActive: boolean; onOpenImage: (image: BlogImage) => void }) {
  if (block.type === 'image') return <ArticleMedia images={[block.image]} active={mediaActive} onOpen={onOpenImage} />;
  if (block.type === 'gallery') return <ArticleMedia images={block.images} title={block.title} active={mediaActive} onOpen={onOpenImage} />;
  if (block.type === 'heading') return <Text accessibilityRole="header" selectable style={block.level === 2 ? s.heading : s.subheading}>{block.text}</Text>;
  if (block.type === 'paragraph') return <Text selectable style={[s.paragraph, block.tone === 'notice' && s.notice]}>{block.text}</Text>;
  if (block.type === 'list') return <View style={s.list}>{block.items.map((item, index) => <View key={index} style={s.listItem}><Text style={s.bullet}>{block.ordered ? `${index + 1}.` : '•'}</Text><Text selectable style={[s.paragraph, { flex: 1 }]}>{item}</Text></View>)}</View>;
  return <ScrollView horizontal showsHorizontalScrollIndicator accessibilityLabel="Таблица. Прокрутите по горизонтали для остальных столбцов" style={s.tableScroll}><View style={s.table}>{block.rows.map((row, rowIndex) => <View key={rowIndex} style={[s.tableRow, rowIndex === 0 && { backgroundColor: colors.pale }]}>{row.map((cell, columnIndex) => <View key={columnIndex} style={s.cell}><Text selectable style={[type.body, rowIndex === 0 && { fontWeight: '700' }]}>{cell}</Text></View>)}</View>)}</View></ScrollView>;
}

export default function ArticleScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const article = getBlogArticle(id);
  const router = useRouter();
  const { height: windowHeight } = useWindowDimensions();
  const { catalogTree, products } = useShop();
  const scroll = useRef<ScrollView>(null);
  const positions = useRef<Record<number, number>>({});
  const bodyY = useRef(0);
  const mediaLayouts = useRef<Record<number, { y: number; height: number }>>({});
  const scrollY = useRef(0);
  const viewportHeight = useRef(windowHeight);
  const [activeMedia, setActiveMedia] = useState<Set<number>>(new Set());
  const [selectedImage, setSelectedImage] = useState<BlogImage | null>(null);
  const [contentsOpen, setContentsOpen] = useState(false);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);
  function activateNearbyMedia() {
    const from = scrollY.current - 400;
    const to = scrollY.current + viewportHeight.current + 400;
    const nearby = Object.entries(mediaLayouts.current).filter(([, box]) => bodyY.current + box.y + box.height >= from && bodyY.current + box.y <= to).map(([index]) => Number(index));
    setActiveMedia(previous => nearby.some(index => !previous.has(index)) ? new Set([...previous, ...nearby]) : previous);
  }
  useEffect(() => { positions.current = {}; mediaLayouts.current = {}; bodyY.current = 0; scrollY.current = 0; setActiveMedia(new Set()); setSelectedImage(null); setError(''); setContentsOpen(false); scroll.current?.scrollTo({ y: 0, animated: false }); }, [id]);

  async function openLink(link: BlogLink) {
    if (opening) return;
    setError('');
    try {
      const url = new URL(link.url);
      if (url.protocol !== 'https:') throw new Error();
      if (['prom.myfast.space', 'prom23.ru', 'www.prom23.ru'].includes(url.hostname)) {
        const linkedArticle = blogArticles.find(item => new URL(item.sourceUrl).pathname === url.pathname);
        if (linkedArticle && linkedArticle.id !== article?.id) { router.push({ pathname: '/blog/[id]', params: { id: linkedArticle.id } } as Href); return; }
        if (url.pathname.startsWith('/catalog/')) {
          const product = products.find(item => item.sourceUrl && new URL(item.sourceUrl).pathname === url.pathname);
          if (product) { router.push({ pathname: '/product/[id]', params: { id: product.id } }); return; }
          const section = catalogTree.sections.find(item => new URL(item.url).pathname === url.pathname);
          if (section) { router.push({ pathname: '/catalog', params: { section: section.id } }); return; }
          if (url.pathname === '/catalog/') { router.push('/catalog'); return; }
          // An unknown product/filter remains the exact source URL, never its parent catalogue.
        }
      } else if (!['rutube.ru', 'youtube.com', 'www.youtube.com', 'youtu.be'].includes(url.hostname)) throw new Error();
      setOpening(true);
      await Linking.openURL(link.url);
    } catch { setError('Не удалось открыть ссылку. Попробуйте ещё раз.'); }
    finally { setOpening(false); }
  }

  async function share() {
    if (!article) return;
    try {
      await Share.share(Platform.OS === 'ios' ? { title: article.title, message: article.title, url: article.sourceUrl } : { title: article.title, message: `${article.title}\n${article.sourceUrl}` });
    } catch { setError('Не удалось открыть меню отправки.'); }
  }

  if (!article) return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right', 'bottom']}><Header title="Блог" back /><ScrollView contentContainerStyle={[layout.content, s.content]}><Text style={type.heading}>Материал не найден</Text><Text style={type.body}>Вернитесь к списку и выберите другую публикацию.</Text><Button label="Все материалы" onPress={() => router.replace('/blog' as Href)} /></ScrollView></SafeAreaView>;

  const headings = article.blocks.map((block, index) => ({ block, index })).filter(item => item.block.type === 'heading' && item.block.level === 2);
  const category = blogCategories.find(item => item.id === article.kind)!;
  const related = blogArticles.filter(item => item.kind === article.kind && item.id !== article.id).slice(0, 3);
  const source: BlogLink = { label: 'Открыть оригинал на сайте', kind: 'source', url: article.sourceUrl };

  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}>
    <Header title={article.kind === 'projects' ? 'Проект' : article.kind === 'video' ? 'Видео' : 'Статья'} back><Pressable accessibilityRole="button" accessibilityLabel="Поделиться материалом" onPress={() => { void share(); }} style={s.iconButton}><Share2 size={21} color={colors.brand} /></Pressable></Header>
    <ScrollView key={article.id} ref={scroll} style={layout.content} contentContainerStyle={s.content} scrollEventThrottle={100}
      onLayout={event => { viewportHeight.current = event.nativeEvent.layout.height; activateNearbyMedia(); }}
      onScroll={event => { scrollY.current = event.nativeEvent.contentOffset.y; activateNearbyMedia(); }}>
      <View style={s.intro}><Text style={s.brand}>prom23.ru · {category.title}</Text><Text selectable accessibilityRole="header" style={s.title}>{article.title}</Text>
        {(article.dateLabel || article.readTime) && <Text style={type.caption}>{[article.dateLabel, article.readTime].filter(Boolean).join(' · ')}</Text>}
        {article.author && <Text style={type.caption}>Автор: {article.author}</Text>}
        {article.updatedLabel && <Text style={type.caption}>{article.updatedLabel}</Text>}
      </View>
      {blogImages[article.id] && <View style={s.cover}><Image source={blogImages[article.id]} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="cover" accessibilityIgnoresInvertColors accessibilityLabel={article.title} /></View>}
      {headings.length > 2 && <Button label="Содержание статьи" variant="secondary" icon={<List size={19} color={colors.brand} />} onPress={() => setContentsOpen(true)} />}
      <View onLayout={event => { bodyY.current = event.nativeEvent.layout.y; activateNearbyMedia(); }} style={s.body}>{article.blocks.map((block, index) => <View key={index} onLayout={event => { if (block.type === 'heading') positions.current[index] = event.nativeEvent.layout.y; if (block.type === 'image' || block.type === 'gallery') { mediaLayouts.current[index] = event.nativeEvent.layout; activateNearbyMedia(); } }}><ArticleBlock block={block} mediaActive={activeMedia.has(index)} onOpenImage={setSelectedImage} /></View>)}</View>
      {!article.blocks.length && <View style={layout.card}><Text selectable style={s.paragraph}>{article.excerpt}</Text><Text style={type.caption}>В этой публикации нет ссылки на видеозапись.</Text></View>}
      {article.links.filter(link => link.kind === 'video' || videoSource(link.url)).map((link,index) => <InlineVideo key={link.url+index} title={link.label} url={link.url} />)}
      {article.links.some(link => link.kind !== 'video' && !videoSource(link.url)) && <View style={s.links}><Text accessibilityRole="header" style={type.subheading}>Ссылки из материала</Text>{article.links.filter(link => link.kind !== 'video' && !videoSource(link.url)).map((link, index) => <Button key={`${link.url}-${index}`} label={link.label} variant="secondary" disabled={opening} icon={<ArrowUpRight size={18} color={colors.brand} />} onPress={() => { void openLink(link); }} />)}</View>}
      {error ? <Text accessibilityRole="alert" style={[type.body, { color: colors.accent }]}>{error}</Text> : null}
      <View style={s.catalog}><Text style={type.heading}>От идеи — к делу</Text><Text style={type.body}>Выберите оборудование и комплектующие для своего проекта.</Text><Button label="Перейти в каталог" onPress={() => router.push('/catalog')} /></View>
      <AssistedPurchase compact title="Подобрать оборудование для этих работ" />
      {related.length > 0 && <View style={s.related}><Text accessibilityRole="header" style={type.subheading}>Другие материалы</Text>{related.map(item => <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/blog/[id]', params: { id: item.id } } as Href)} style={s.relatedLink}><Text style={[type.label, { flex: 1 }]}>{item.title}</Text><ArrowUpRight size={18} color={colors.brand} /></Pressable>)}</View>}
      <Button label={source.label} variant="quiet" disabled={opening} icon={<ExternalLink size={17} color={colors.muted} />} onPress={() => { void openLink(source); }} />
    </ScrollView>
    <Sheet visible={contentsOpen} title="Содержание" onClose={() => setContentsOpen(false)}>{headings.map(({ block, index }) => <Pressable key={index} accessibilityRole="button" onPress={() => { setContentsOpen(false); scroll.current?.scrollTo({ y: Math.max(0, bodyY.current + (positions.current[index] ?? 0) - 12), animated: false }); }} style={s.tocLink}><Text style={type.body}>{block.type === 'heading' ? block.text : ''}</Text></Pressable>)}</Sheet>
    <Sheet visible={selectedImage !== null} title="Изображение из материала" onClose={() => setSelectedImage(null)}>{selectedImage && <>
      <ScrollView maximumZoomScale={4} minimumZoomScale={1} centerContent contentContainerStyle={{ alignItems: 'center' }}><Image source={{ uri: selectedImage.originalUrl || selectedImage.url }} accessibilityLabel={selectedImage.alt || 'Иллюстрация к материалу'} resizeMode="contain" style={{ width: '100%', height: Math.max(220, Math.min(480, windowHeight * 0.55)) }} /></ScrollView>
      {!!selectedImage.alt && <Text style={type.body}>{selectedImage.alt}</Text>}
      <Button label="Открыть оригинал изображения" variant="secondary" onPress={() => { void openLink({ label: selectedImage.alt, kind: 'source', url: selectedImage.originalUrl || selectedImage.url }); }} />
    </>}</Sheet>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  content: { padding: 18, paddingBottom: 30, gap: 20 },
  intro: { gap: 10 },
  brand: { fontSize: 12, lineHeight: 18, color: colors.brand, fontWeight: '600' },
  title: { fontSize: 27, lineHeight: 34, fontWeight: '800', letterSpacing: -0.5, color: colors.ink },
  cover: { width: '100%', aspectRatio: 1.55, maxHeight: 340, borderRadius: 16, backgroundColor: colors.pale, overflow: 'hidden' },
  body: { gap: 16 },
  heading: { color: colors.ink, fontSize: 22, lineHeight: 29, fontWeight: '700', marginTop: 15 },
  subheading: { color: colors.ink, fontSize: 19, lineHeight: 26, fontWeight: '700', marginTop: 10 },
  paragraph: { color: colors.ink, fontSize: 17, lineHeight: 27 },
  notice: { padding: 16, backgroundColor: colors.pale, borderRadius: 12 },
  list: { gap: 10 }, listItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bullet: { color: colors.accent, fontSize: 17, lineHeight: 27, minWidth: 19 },
  tableScroll: { marginVertical: 4 }, table: { borderWidth: 1, borderColor: colors.line, borderRadius: 10, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.white },
  cell: { width: 175, padding: 13, borderRightWidth: 1, borderRightColor: colors.line },
  links: { gap: 10, marginTop: 10 },
  catalog: { backgroundColor: colors.white, padding: 18, borderRadius: 16, gap: 12 },
  related: { gap: 8 }, relatedLink: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 54, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.line },
  iconButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  tocLink: { minHeight: 48, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.line },
});
