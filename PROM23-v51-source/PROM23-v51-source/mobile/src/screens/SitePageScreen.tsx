import { CompanyDetails } from '../ui/CompanyDetails';
import { LegalAccess } from '../ui/PrivacyControls';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Text, View } from 'react-native';
import { ScrollView } from '../ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { aboutCompany } from '../content/aboutCompany';
import { sitePages, type SitePage } from '../content/sitePages';
import { blogArticles, blogCategories } from '../content/blogContent';
import { loadContentPage } from '../api/content';
import { siteForms } from '../forms/siteForms';
import { useShop } from '../store';
import { Header } from '../ui/primitives';
import { ContentLink, ContentSection, BuyerInfoGrid, FAQExplorer, e } from '../ui/EditorialContent';
import { AboutPage, CooperationPage, PartnerPage, DocumentsPage } from '../ui/CompanyPages';
import { CompanyDisclosure } from '../ui/CompanyTrust';
import { PageMeta } from '../ui/PageMeta';
import { FranchisePage } from '../ui/FranchisePage';
import { franchisePage } from '../content/franchisePage';
import { AwardsPage } from '../ui/AwardsPage';
import { awardsIntro } from '../content/awardsCopy';
import { WarrantyPage } from '../ui/WarrantyPage';
import { ReturnsPage } from '../ui/ReturnsPage';
import { CheckoutGuidePage } from '../ui/CheckoutGuidePage';
import { colors, layout, type } from '../ui/theme';
export default function SitePageScreen() {
  const { id } = useLocalSearchParams<{id:string}>();
  const legalId = ({offer:'offer', advertising:'advertising', distribution:'distribution', privacy:'privacy', 'user-agreement':'consent', 'personal-data':'consent', recommendations:'recommendations', cookies:'cookies', 'recom-tech-info':'recommendations'} as Record<string,string>)[id];
  if (legalId) return <Redirect href={{ pathname: '/legal/[id]', params: {id: legalId} }} />;
  return id === 'brands' ? <Redirect href={'/brands/' as never} /> : <OtherSitePageScreen />;
}
function OtherSitePageScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const { id } = useLocalSearchParams<{ id: string }>(); const router = useRouter();
  const { state, catalogTree, products } = useShop(); const [error, setError] = useState('');
  useEffect(() => { if (id === 'cooperation' || id === 'checkout') scrollY.setValue(0); }, [id, scrollY]);
  const localPage = Object.hasOwn(sitePages, id ?? '') ? sitePages[id] : undefined;
  const [remotePage, setRemotePage] = useState<SitePage | null>(null);
  useEffect(() => { const controller = new AbortController(); setRemotePage(null); if (localPage) { void loadContentPage(id, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setRemotePage(value); }); } return () => controller.abort(); }, [id]);
  const page = remotePage?.slug === id ? remotePage : localPage;
  const title = id === 'awards' ? 'Награды' : id === 'warranty' ? 'Гарантия' : id === 'documents' ? 'Документы' : id === 'faq' ? 'Вопросы и ответы' : id === 'returns' ? 'Возврат товаров' : page?.title ?? 'Информация';
  const forms = Object.values(siteForms).filter(form => !form.aliasOf && page?.forms?.some(source => source.sourcePath === form.sourceAction));
  async function openLink(value: string) {
    setError('');
    try {
      const url = new URL(value, 'https://prom23.ru/'); if (url.protocol !== 'https:') throw new Error();
      if (['prom.myfast.space', 'prom23.ru', 'www.prom23.ru', 'prom-krd.ru'].includes(url.hostname)) {
        const path = decodeURI(url.pathname).replace(/\/+$/, '') + '/';
        const directRoutes = { '/': '/', '/basket/': '/cart', '/cart/': '/cart', '/order/': '/checkout-preview', '/favorite/': '/favorites', '/comparison/': '/compare', '/waiting-list/': '/workspace/waiting-list', '/personal/': '/account', '/organization/': '/account' } as const;
        const direct = directRoutes[path as keyof typeof directRoutes];
        if (direct) { router.push(direct); return; }
        const information = ({ '/vendor/': 'production', '/business/': 'business', '/delivery/': 'delivery', '/payment/': 'payment', '/contacts/': 'contacts' } as Record<string, string>)[path];
        if (information) { router.push({ pathname: '/information/[topic]', params: { topic: information } }); return; }
        const legal = ({ '/privacy-policy/': 'privacy', '/user-agreement/': 'consent', '/cookie-policy/': 'cookies', '/recom-tech-info/': 'recommendations', '/oferta/': 'offer', '/offer/': 'offer', '/personal-data-consent/': 'consent', '/advertising-consent/': 'advertising', '/personal-data-distribution-consent/': 'distribution' } as Record<string, string>)[path];
        if (legal) { router.push({ pathname: '/legal/[id]', params: { id: legal } }); return; }
        if (path.startsWith('/blog/')) {
          const article = blogArticles.find(item => decodeURI(new URL(item.sourceUrl).pathname).replace(/\/+$/, '') + '/' === path);
          if (article) { router.push({ pathname: '/blog/[id]', params: { id: article.id } }); return; }
          const category = blogCategories.find(item => new URL(item.sourceUrl).pathname === path);
          if (category) { router.push({ pathname: '/blog', params: { kind: category.id } }); return; }
          // Keep an unimported source article reachable instead of silently opening the blog index.
          await Linking.openURL(url.href); return;
        }
        const targetPage = Object.values(sitePages).find(item => item.slug !== 'cooperation' && item.sourceUrl && new URL(item.sourceUrl).pathname === path);
        if (targetPage) { router.push({ pathname: '/pages/[id]', params: { id: targetPage.slug } }); return; }
        if (path.startsWith('/catalog/')) {
          const product = products.find(item => item.sourceUrl && decodeURI(new URL(item.sourceUrl).pathname).replace(/\/+$/, '') + '/' === path);
          if (product) { router.push({ pathname: '/product/[id]', params: { id: product.id } }); return; }
          const section = catalogTree.sections.find(item => decodeURI(new URL(item.url).pathname).replace(/\/+$/, '') + '/' === path); const brand = path.match(/^\/catalog\/brand\/([^/]+)\/$/)?.[1];
          if (section || brand || path === '/catalog/') {
            router.push({ pathname: '/catalog', params: section ? { section: section.id } : brand ? { brand } : { section: 'all' } }); return;
          }
          // Retain the exact source product/filter until it has a native DTO and route mapping.
          await Linking.openURL(url.href); return;
        }
      }
      await Linking.openURL(url.href);
    } catch { setError('Не удалось открыть ссылку. Попробуйте ещё раз.'); }
  }
  const editorial = id === 'details' && page ? <CompanyDetails page={page} /> : id === 'checkout' ? <CheckoutGuidePage scrollY={scrollY} /> : id === 'about' ? <AboutPage scrollRef={scrollRef} scrollY={scrollY} /> : id === 'faq' ? <FAQExplorer /> : id === 'returns' ? <ReturnsPage scrollRef={scrollRef} /> : id === 'cooperation' ? <CooperationPage scrollY={scrollY} scrollRef={scrollRef} /> : id === 'franchise' ? <FranchisePage scrollRef={scrollRef} scrollY={scrollY} /> : id === 'suppliers' ? <PartnerPage kind={id} page={page} /> : id === 'warranty' ? <WarrantyPage scrollRef={scrollRef} /> : id === 'documents' ? <DocumentsPage /> : id === 'awards' ? <AwardsPage scrollRef={scrollRef} /> : null;
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}><PageMeta title={id === 'franchise' ? 'Франшиза строительного оборудования в России и за рубежом' : id === 'about' ? 'О компании — производство и поставки оборудования' : title} description={id === 'franchise' ? franchisePage.intro : id === 'awards' ? awardsIntro : id === 'about' ? aboutCompany.metadata : page?.sections.flatMap(section => section.paragraphs).find(Boolean) ?? title + ' — Промышленник'} /><Header title={title} back heading={id !== 'franchise' && id !== 'awards' && id !== 'about' && id !== 'cooperation' && id !== 'checkout' && id !== 'returns' && id !== 'warranty'} /><ScrollView keyboardShouldPersistTaps={id === 'franchise' ? 'handled' : undefined} ref={scrollRef} onScroll={id === 'franchise' || id === 'about' || id === 'cooperation' || id === 'checkout' ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false }) : undefined} scrollEventThrottle={16} style={layout.content} contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: 24 }} key={id}>
    {editorial ?? <View style={e.page}>{page?.sections.map(section => <ContentSection key={section.id} title={section.title}>{section.paragraphs.map((paragraph, index) => <Text selectable key={index} style={type.body}>{paragraph}</Text>)}{section.bullets?.map((bullet, index) => <View key={index} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line }}><Text style={type.body}>{bullet}</Text></View>)}</ContentSection>)}{!page?.sections.length && <View style={{ gap: 12 }}><Text style={type.subheading}>Поможем найти информацию</Text><ContentLink title="Связаться с менеджером" route="/information/contacts" /></View>}{forms.map(form => <ContentLink key={form.id} title={form.title} onPress={() => router.push({ pathname: '/forms/[id]', params: { id: form.id, expectedContext: state.context } })} />)}{page?.links?.map(link => <ContentLink key={link.url + link.label} title={link.label} onPress={() => { void openLink(link.url); }} />)}<BuyerInfoGrid /></View>}
    {error && <Text accessibilityRole="alert" style={[type.body, { color: colors.accent }]}>{error}</Text>}
  <LegalAccess /></ScrollView></SafeAreaView>;
}
