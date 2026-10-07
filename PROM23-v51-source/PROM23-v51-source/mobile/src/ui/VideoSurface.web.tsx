import React from 'react';
import type { VideoSource } from '../video-source';
export function VideoSurface({ source, title, onError }: { source: VideoSource; title: string; onError: () => void }) {
  const style = { width: '100%', height: '100%', border: 0, display: 'block', background: '#000' };
  return source.kind === 'file'
    ? <video src={source.url} aria-label={title} style={style} controls playsInline autoPlay preload="metadata" onError={onError} />
    : <iframe src={source.url} title={title} style={style} allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" onError={onError} />;
}
