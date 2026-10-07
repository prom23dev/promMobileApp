import React from 'react';
import { ScrollView } from '../../../src/ui/PageScroll';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PackageSearch } from 'lucide-react-native';
import { Button, EmptyState, Header } from '../../../src/ui/primitives';
import { colors, layout } from '../../../src/ui/theme';
export default function NotFound() {
  const router = useRouter();
  return <SafeAreaView style={layout.screen} edges={['top', 'left', 'right']}><Header title="Страница не найдена" back /><ScrollView buyerControls style={layout.content}><EmptyState icon={<PackageSearch size={34} color={colors.brand} />} title="Такой страницы нет" message="Ссылка могла устареть. Перейдите в каталог, чтобы продолжить." action={<Button label="Открыть каталог" onPress={() => router.replace('/catalog')} />} /></ScrollView></SafeAreaView>;
}
