import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowUpRight } from 'lucide-react-native';
import { blogImages, getBlogArticle } from '../content/blogContent';
import { colors, layout, type } from './theme';
import { motion } from './tokens';

// Short summaries of the linked source projects; they describe supplied equipment,
// not ownership of the buildings or responsibility for their construction.
const projects = [
  {
    id: 'projects-krc-oktyabr-astrakhan', city: 'Астрахань', title: 'КРК «Октябрь»', stage: 'Реконструкция',
    equipment: 'Хомутовые леса с цельнометаллическими оцинкованными настилами — для работы со сложной архитектурой здания.',
  },
  {
    id: 'projects-moscow-city', city: 'Москва', title: 'Москва-Сити', stage: 'Монолитное строительство',
    equipment: 'Опалубка стен и перекрытий, средства подмащивания — для монолитных работ на высотной площадке.',
  },
  {
    id: 'projects-development-plaza-krasnodar', city: 'Краснодар', title: 'Development Plaza', stage: 'Комплексное оснащение',
    equipment: 'Телескопические стойки, опалубка и средства подмащивания — от монолитного каркаса до фасадных работ.',
  },
].flatMap(project => {
  const article = getBlogArticle(project.id);
  const image = ({ 'projects-krc-oktyabr-astrakhan': require('../../assets/blog/gallery-krc-oktyabr-astrakhan-05.jpg'), 'projects-moscow-city': require('../../assets/blog/gallery-moscow-city-02.jpg'), 'projects-development-plaza-krasnodar': require('../../assets/blog/gallery-development-plaza-krasnodar-02.jpg') } as Record<string, import('react-native').ImageSourcePropType>)[project.id] ?? blogImages[project.id];
  return article?.kind === 'projects' && image ? [{ ...project, article, image }] : [];
});

export function ProjectShowcase() {
  const router = useRouter();
  const { fontScale } = useWindowDimensions();
  const [selected, setSelected] = useState(0);
  const activeIndex = useRef(0);
  const reducedMotion = useRef(true);
  const fades = useRef(projects.map((_, index) => new Animated.Value(index === 0 ? 1 : 0))).current;

  useEffect(() => {
    let mounted = true;
    const applyPreference = (reduce: boolean) => {
      reducedMotion.current = reduce;
      if (reduce) fades.forEach((fade, index) => {
        fade.stopAnimation();
        fade.setValue(index === activeIndex.current ? 1 : 0);
      });
    };
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', applyPreference);
    void AccessibilityInfo.isReduceMotionEnabled().then(reduce => {
      if (mounted) applyPreference(reduce);
    }).catch(() => { /* Keep the static, fully usable fallback. */ });
    return () => {
      mounted = false;
      listener.remove();
      fades.forEach(fade => fade.stopAnimation());
    };
  }, [fades]);

  const select = (index: number) => {
    if (index === activeIndex.current) return;
    activeIndex.current = index;
    setSelected(index);
    fades.forEach((fade, imageIndex) => {
      fade.stopAnimation();
      if (reducedMotion.current) fade.setValue(imageIndex === index ? 1 : 0);
      else Animated.timing(fade, {
        toValue: imageIndex === index ? 1 : 0,
        duration: motion.standard,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    });
  };

  const project = projects[selected];
  if (!project) return null;
  const open = () => router.push({ pathname: '/blog/[id]', params: { id: project.article.id } });

  return <View testID="project-showcase" style={s.section}>
    <View style={layout.between}>
      <Text accessibilityRole="header" aria-level={2} style={[type.heading, { flex: 1 }]}>Оборудование в деле</Text>
      <Text accessibilityLabel={`Проект ${selected + 1} из ${projects.length}`} style={type.caption}>{selected + 1} / {projects.length}</Text>
    </View>

    <View accessibilityRole="tablist" accessibilityLabel="Выберите проект" style={s.tabs}>
      {projects.map((item, index) => <Pressable
        key={item.id}
        testID={'project-tab-' + item.id}
        accessibilityRole="tab"
        accessibilityLabel={`${item.city}: ${item.title}`}
        accessibilityState={{ selected: selected === index }}
        aria-selected={selected === index}
        onPress={() => select(index)}
        style={({ pressed }) => [s.tab, selected === index && s.activeTab, pressed && s.pressed]}
      ><Text style={[type.label, s.tabLabel, selected === index && s.activeLabel]}>{item.city}</Text></Pressable>)}
    </View>

    <View style={s.scene}>
      <View style={s.photo}>
        {projects.map((item, index) => <Animated.View
          key={item.id}
          pointerEvents="none"
          accessibilityElementsHidden={selected !== index}
          importantForAccessibility={selected === index ? 'auto' : 'no-hide-descendants'}
          aria-hidden={selected !== index}
          style={[StyleSheet.absoluteFill, { opacity: fades[index] }]}
        ><Image source={item.image} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} accessibilityIgnoresInvertColors accessibilityLabel={'Оборудование на объекте из проекта: ' + item.article.title} /></Animated.View>)}
      </View>

      <View style={s.caption}>
        <Text style={[type.caption, s.stage]}>{project.stage} · {project.city}</Text>
        <Text accessibilityRole="header" aria-level={3} accessibilityLiveRegion="polite" style={[type.heading, s.projectTitle]}>{project.title}</Text>
        <Text style={[type.body, s.equipment, fontScale > 1.5 && { minHeight: 0 }]}>{project.equipment}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Смотреть проект: ' + project.article.title}
          onPress={open}
          style={({ pressed }) => [s.cta, pressed && s.pressed]}
        ><Text style={[type.label, { color: colors.brand }]}>Смотреть проект</Text><ArrowUpRight size={23} color={colors.accent} /></Pressable>
      </View>
    </View>
  </View>;
}

const s = StyleSheet.create({
  section: { gap: 14 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line },
  tab: { flex: 1, minHeight: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: colors.accent },
  tabLabel: { color: colors.muted, textAlign: 'center', fontSize: 13 },
  activeLabel: { color: colors.brand },
  pressed: { backgroundColor: colors.pale },
  scene: { overflow: 'hidden', borderRadius: 18, backgroundColor: colors.white },
  photo: { overflow: 'hidden', width: '100%', aspectRatio: 1.5, maxHeight: 320, backgroundColor: colors.pale },
  caption: { padding: 18, paddingBottom: 6, gap: 8 },
  stage: { color: colors.muted, fontWeight: '500' },
  projectTitle: { fontSize: 24, lineHeight: 30, minHeight: 30 },
  equipment: { minHeight: 88 },
  cta: { minHeight: 52, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});
