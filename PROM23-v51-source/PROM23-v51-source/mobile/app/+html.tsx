import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return <html lang="ru"><head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /><meta name="robots" content="noindex, nofollow" /><title>Промышленник — prom23.ru</title><ScrollViewStyleReset /><style>{`body { background:#E9EBF0; } #root { width:100%; max-width:720px; margin:0 auto; background:#F5F6F8; } *:focus-visible { outline:2px solid #3D4471; outline-offset:3px; } @media(prefers-reduced-motion:reduce){ * { scroll-behavior:auto!important; animation-duration:0.01ms!important; transition-duration:0.01ms!important; } }`}</style></head><body>{children}</body></html>;
}
