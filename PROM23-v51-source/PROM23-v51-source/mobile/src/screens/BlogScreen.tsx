import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ScrollView, FlatList } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ArrowUpRight, BookOpen, Search, X } from 'lucide-react-native';
import { blogArticles, blogCategories, blogImages, type BlogArticle, type BlogKind } from '../content/blogContent';
import { Button, Header } from '../ui/primitives';
import { colors, layout, type } from '../ui/theme';

const normalize = (value: string) => value.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е');

export default function BlogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ kind?: string | string[] }>();
  const [kind, setKind] = useState<BlogKind>('articles');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const selected = Array.isArray(params.kind) ? params.kind[0] : params.kind;
    if (blogCategories.some(category => category.id === selected)) setKind(selected as BlogKind);
  }, [params.kind]);
  const articles = useMemo(() => {
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
    return blogArticles.filter(article => (article.kind === kind || (kind === 'video' && article.links.some(link => link.kind === 'video'))) && terms.every(term => normalize(`${article.title} ${article.excerpt}`).includes(term)));
  }, [kind, query]);

  function card(article: BlogArticle) {
    const photo = blogImages[article.id];
    return <Pressable accessibilityRole="button" accessibilityLabel={article.title} onPress={() => router.push({ pathname: '/blog/[id]', params: { id: article.id } } as Href)} style={({ pressed }) => [s.card, pressed && s.pressed]}>
      {photo ? <Image source={photo} style={s.photo} resizeMode="cover" accessibilityIgnoresInvertColors accessible={false} /> : <View style={s.noPhoto}><BookOpen size={30} color={colors.brand} /></View>}
      <View style={s.cardCopy}>
        {(article.dateLabel || article.readTime) && <Text style={type.caption}>{[article.dateLabel, article.readTime].filter(Boolean).join(' · ')}</Text>}
        <Text style={s.cardTitle} numberOfLines={4}>{article.title}</Text>
        <Text style={s.excerpt} numberOfLines={2}>{article.excerpt}</Text>
        <View style={[layout.row, { gap: 4, marginTop: 5 }]}><Text style={s.read}>{article.links.some(link => link.kind === 'video') ? 'Смотреть видео' : 'Читать'}</Text><ArrowUpRight size={15} color={colors.brand} /></View>
      </View>
    </Pressable>;
  }

  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right', 'bottom']}>
    <Header title="Блог" back />
    <FlatList data={articles} keyExtractor={item => item.id} renderItem={({ item }) => card(item)} style={layout.content} contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" initialNumToRender={5} maxToRenderPerBatch={5} windowSize={5}
      ListHeaderComponent={<View style={s.listHeader}>
        <Text style={s.eyebrow}>prom23.ru</Text>
        <Text accessibilityRole="header" style={type.title}>Оборудование в деле</Text>
        <Text style={[type.body, { color: colors.muted }]}>Инструкции, выбор оборудования и проекты наших клиентов.</Text>
        <View style={s.search}><Search size={21} color={colors.muted} /><TextInput accessibilityLabel="Поиск по блогу" placeholder="Найти статью или проект" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} style={s.input} autoCorrect={false} returnKeyType="search" />{query.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Очистить поиск" onPress={() => setQuery('')} style={s.clear}><X size={20} color={colors.muted} /></Pressable>}</View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs} keyboardShouldPersistTaps="handled">{blogCategories.map(category => <Pressable key={category.id} accessibilityRole="tab" accessibilityState={{ selected: kind === category.id }} aria-selected={kind === category.id} onPress={() => setKind(category.id)} style={[s.tab, kind === category.id && s.activeTab]}><Text style={[type.label, kind === category.id && { color: colors.white }]}>{category.title}</Text></Pressable>)}</ScrollView>
        <Text accessibilityLiveRegion="polite" style={type.caption}>{query.trim() ? `Найдено материалов: ${articles.length}` : `Материалов: ${articles.length}`}</Text>
      </View>}
      ListEmptyComponent={<View style={[layout.card, { gap: 14 }]}><Text style={type.subheading}>Материалы не найдены</Text><Text style={type.body}>Попробуйте другое название или выберите другую рубрику.</Text><Button label="Очистить поиск" variant="secondary" onPress={() => setQuery('')} /></View>}
      ListFooterComponent={<View style={s.footer}><Text style={type.subheading}>Подберите оборудование для своей задачи</Text><Button label="Перейти в каталог" onPress={() => router.push('/catalog')} /></View>} />
  </SafeAreaView>;
}

const s = StyleSheet.create({
  content: { padding: 16, paddingBottom: 28, gap: 12 },
  listHeader: { gap: 12, marginBottom: 6 },
  eyebrow: { color: colors.brand, fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  search: { minHeight: 52, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, paddingLeft: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  input: { flex: 1, minHeight: 50, color: colors.ink, fontSize: 15, paddingVertical: 12, paddingRight: 8 },
  clear: { minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  tabs: { gap: 8 },
  tab: { minHeight: 46, paddingHorizontal: 15, paddingVertical: 12, backgroundColor: colors.white, borderRadius: 12, justifyContent: 'center' },
  activeTab: { backgroundColor: colors.brand },
  card: { flexDirection: 'row', gap: 13, backgroundColor: colors.white, borderRadius: 16, padding: 12, alignItems: 'flex-start' },
  pressed: { opacity: 0.8 },
  photo: { width: 96, height: 118, borderRadius: 10, backgroundColor: colors.pale },
  noPhoto: { width: 58, height: 58, borderRadius: 12, backgroundColor: colors.pale, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, gap: 6 },
  cardTitle: { fontSize: 16, lineHeight: 22, color: colors.ink, fontWeight: '700' },
  excerpt: { fontSize: 13, lineHeight: 19, color: colors.muted },
  read: { color: colors.brand, fontSize: 13, fontWeight: '700' },
  footer: { gap: 12, paddingVertical: 22 },
});
