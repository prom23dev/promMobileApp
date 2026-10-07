import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Play } from 'lucide-react-native';
import { videoSource } from '../video-source';
import { VideoSurface } from './VideoSurface';
import { Button } from './primitives';
import { colors, layout, type } from './theme';

export function InlineVideo({ url, title }: { url: string; title: string }) {
  const source = videoSource(url);
  const [active, setActive] = useState(false), [failed, setFailed] = useState(false);
  useEffect(() => { setActive(false); setFailed(false); }, [url]);
  useFocusEffect(useCallback(() => () => { setActive(false); }, []));
  const fail = useCallback(() => setFailed(true), []);
  return <View testID="inline-video" style={[layout.card, { padding: 0, overflow: 'hidden' }]}>
    <View style={{ padding: 16, gap: 8 }}><Text accessibilityRole="header" style={type.subheading}>{title}</Text>
      {!active && <><Text style={type.caption}>{source?.kind === 'embed' ? `Плеер ${source.provider} загрузится после нажатия. Видео откроется здесь.` : 'Видео откроется здесь. Можно поставить на паузу или развернуть на весь экран.'}</Text><Button label={'Смотреть: ' + title} icon={<Play color={colors.white} size={20} />} disabled={!source} onPress={() => { setFailed(false); setActive(true); }} /></>}
      {!source && <Text style={type.caption}>Ссылка на запись недоступна.</Text>}
    </View>
    {active && source && !failed && <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.ink }}><VideoSurface source={source} title={title} onError={fail} /></View>}
    {active && <View style={{ padding: 12, gap: 8 }}>{failed && <><Text accessibilityRole="alert" style={type.body}>Не удалось загрузить видео. Проверьте подключение и повторите воспроизведение.</Text><Button label="Повторить воспроизведение" variant="secondary" onPress={() => setFailed(false)} /></>}<Button label="Закрыть видео" variant="quiet" onPress={() => setActive(false)} /></View>}
  </View>;
}
