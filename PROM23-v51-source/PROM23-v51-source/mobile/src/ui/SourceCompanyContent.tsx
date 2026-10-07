import { InlineVideo } from './InlineVideo';
import { productionVideo } from '../video-source';
import React, { useState } from 'react';
import { Image, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { blogArticles } from '../content/blogContent';
import recovery from '../content/sourceRecoveryContent.json';
import { CompanyDisclosure } from './CompanyTrust';
import { ContentLink, ContentSection } from './EditorialContent';
import { type } from './theme';
import { colors } from './theme';

export function PublishedCompanyScale() {
  return <ContentSection title="Масштаб компании"><CompanyDisclosure title="Проекты, склады и достижения">
    <Text style={type.body}>В презентации компании на корпоративном сайте указаны более 10 000 успешных проектов, собственные склады в 15+ регионах России и СНГ и более 10 наград за экспорт строительного оборудования.</Text>
    <Text style={type.caption}>Это опубликованные показатели компании. Хронология развития и реестр наград представлены отдельно.</Text>
    <ContentLink title="Награды и сертификаты" route="/pages/awards" /><ContentLink title="Адреса складов и представительств" route="/information/contacts" />
  </CompanyDisclosure></ContentSection>;
}

/** Full descriptions from the four active /vendor/ department blocks. */
export function ProductionDepartments() {
  return <ContentSection title="Подразделения производства"><View testID="production-departments">
    {recovery.departments.map(department => <CompanyDisclosure key={department.title} title={department.title}>
      <Text selectable style={type.body}>{department.text}</Text>
      {!!department.images[0] && <Image source={{ uri: department.images[0] }} accessibilityLabel={department.title + ' — фотография со страницы производства'} resizeMode="cover" style={{ width: '100%', height: 160, borderRadius: 12 }} />}
    </CompanyDisclosure>)}
  </View></ContentSection>;
}

export function ProductionFilm() {
  return <ContentSection title="Посмотрите, как мы создаём оборудование"><InlineVideo title="Фильм о производстве" url={productionVideo} /></ContentSection>;
}

/** Keep every source project reachable, including entries outside the three hero slides. */
export function CompanyProjectDirectory() {
  const router = useRouter();
  const projects = blogArticles.filter(article => article.kind === 'projects');
  return <View testID="company-project-directory"><CompanyDisclosure title="Все проекты и объекты">
    {projects.map(article => <ContentLink key={article.id} title={article.title} caption={article.excerpt} onPress={() => router.push({ pathname: '/blog/[id]', params: { id: article.id } })} />)}
    <ContentLink title="Открыть раздел проектов" onPress={() => router.push({ pathname: '/blog', params: { kind: 'projects' } })} />
  </CompanyDisclosure></View>;
}
