export type VideoSource = { kind: 'file' | 'embed'; url: string; provider: string };
export const productionVideo = 'https://prom.myfast.space/frontend/video/promyshlennik_gotov_2024_1080p.mov';
export const rutubeChannel = 'https://rutube.ru/channel/35767003/';

export function videoSource(value: string): VideoSource | null {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
    if (u.hostname === 'rutube.ru') {
      const id = u.pathname.match(/^\/(?:video|shorts|play\/embed)\/([a-f0-9]{32})\/?$/i)?.[1];
      return id ? { kind: 'embed', url: `https://rutube.ru/play/embed/${id}`, provider: 'RUTUBE' } : null;
    }
    if (['youtube.com', 'www.youtube.com', 'youtu.be', 'www.youtube-nocookie.com'].includes(u.hostname)) {
      const id = u.hostname === 'youtu.be' ? u.pathname.slice(1) : u.pathname === '/watch' ? u.searchParams.get('v') : u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)\/?$/)?.[1];
      return id && /^[\w-]{11}$/.test(id) ? { kind: 'embed', url: `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0`, provider: 'YouTube' } : null;
    }
    if (['prom.myfast.space', 'prom23.ru', 'www.prom23.ru', 'prom-krd.ru'].includes(u.hostname) && /^\/(?:upload|frontend\/video)\//.test(u.pathname) && /\.(mp4|webm|mov)$/i.test(u.pathname)) {
      return { kind: 'file', url: u.href, provider: 'Промышленник' };
    }
    return null;
  } catch { return null; }
}
