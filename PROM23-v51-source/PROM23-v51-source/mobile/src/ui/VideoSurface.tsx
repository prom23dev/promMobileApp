import React, { useEffect } from 'react';
import { VideoView, useVideoPlayer } from 'expo-video';
import { WebView } from 'react-native-webview';
import type { VideoSource } from '../video-source';

function FileVideo({ source, onError }: { source: VideoSource; onError: () => void }) {
  const player = useVideoPlayer(source.url, player => { player.play(); });
  useEffect(() => { const event = player.addListener('statusChange', event => { if (event.status === 'error') onError(); }); return () => event.remove(); }, [player, onError]);
  return <VideoView player={player} nativeControls contentFit="contain" fullscreenOptions={{ enable: true }} style={{ width: '100%', height: '100%' }} />;
}
export function VideoSurface({ source, title, onError }: { source: VideoSource; title: string; onError: () => void }) {
  if (source.kind === 'file') return <FileVideo source={source} onError={onError} />;
  return <WebView accessibilityLabel={title} source={{ uri: source.url, headers: { Referer: 'https://www.prom23.ru/' } }} style={{ flex: 1 }} allowsInlineMediaPlayback allowsFullscreenVideo mediaPlaybackRequiresUserAction={false} setSupportMultipleWindows={false} onError={onError}
    onShouldStartLoadWithRequest={request => !request.isTopFrame || request.url === source.url || request.url === 'about:blank'} onOpenWindow={() => {}} />;
}
