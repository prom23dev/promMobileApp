// Optional public content configuration. No session token, cookies, writes or remote UI code.
export const homeBlockTypes = ['hero', 'categories', 'popular', 'buyers', 'business', 'company', 'production', 'projects',
  'guide', 'services', 'articles', 'personalized', 'discounts', 'manufactured'] as const;
export type HomeBlockType = typeof homeBlockTypes[number];
export type HomeBlock = Readonly<{ id: string; type: HomeBlockType; enabled: true }>;
export type HomeConfig = Readonly<{ schemaVersion: 1; revision: string; blocks: readonly HomeBlock[] }>;
const known = new Set<string>(homeBlockTypes);
const freeze = (revision: string, blocks: HomeBlock[]): HomeConfig => Object.freeze({ schemaVersion: 1,
  revision, blocks: Object.freeze(blocks.map(block => Object.freeze(block))) });
export const defaultHomeConfig: HomeConfig = freeze('home-v20-1', (['hero', 'categories', 'popular', 'buyers', 'business', 'discounts', 'manufactured', 'personalized', 'company', 'guide', 'projects', 'articles', 'services'] as HomeBlockType[]).map(type => ({ id: `home-${type}`, type, enabled: true })));
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const keys = (value: Record<string, unknown>, expected: string[]) => Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));

/** Unknown future block types are ignored; malformed known blocks invalidate the configuration. */
export function parseHomeConfig(value: unknown): HomeConfig {
  const invalid = (): never => { throw new Error('INVALID_HOME_CONFIG'); };
  if (!object(value) || !keys(value, ['schemaVersion', 'revision', 'blocks']) || value.schemaVersion !== 1 ||
      typeof value.revision !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(value.revision) ||
      !Array.isArray(value.blocks) || value.blocks.length > 20) return invalid();
  const seen = new Set<string>();
  const blocks: HomeBlock[] = [];
  for (const block of value.blocks) {
    if (!object(block) || typeof block.type !== 'string' || block.type.length > 40) return invalid();
    if (!known.has(block.type)) continue;
    if (!keys(block, ['id', 'type', 'enabled']) || block.id !== `home-${block.type}` ||
        block.enabled !== true || seen.has(block.id as string)) return invalid();
    seen.add(block.id as string);
    blocks.push({ id: block.id as string, type: block.type as HomeBlockType, enabled: true });
  }
  if (blocks[0]?.type !== 'hero') return invalid();
  return freeze(value.revision, blocks);
}

function endpoint(base: string | undefined): string | null {
  if (base) {
    if (['/api', '/api/', '/api/v1', '/api/v1/'].includes(base)) return '/api/v1/home';
    try {
      const url = new URL(base);
      if (url.username || url.password || url.search || url.hash ||
          !['/api', '/api/', '/api/v1', '/api/v1/'].includes(url.pathname) ||
          (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)))) return null;
      return `${url.origin}/api/v1/home`;
    } catch { return null; }
  }
  // Native must be configured explicitly. It must not contact a guessed production domain.
  return typeof window !== 'undefined' && typeof window.location?.origin === 'string' ? '/api/v1/home' : null;
}

export async function loadHomeConfig(options: {
  signal?: AbortSignal; timeoutMs?: number; baseUrl?: string; fetcher?: typeof fetch;
} = {}): Promise<HomeConfig> {
  const url = endpoint(options.baseUrl ?? process.env.EXPO_PUBLIC_APP_API_URL ?? process.env.EXPO_PUBLIC_LOCAL_API_URL);
  if (!url || options.signal?.aborted) return defaultHomeConfig;
  const timeoutMs = options.timeoutMs ?? 1500;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 5000) return defaultHomeConfig;
  const controller = new AbortController();
  let cancel = () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancelled = new Promise<never>((_resolve, reject) => {
    cancel = () => { controller.abort(); reject(new Error('HOME_CANCELLED')); };
    timer = setTimeout(cancel, timeoutMs);
    options.signal?.addEventListener('abort', cancel, { once: true });
  });
  const request = async (): Promise<HomeConfig> => {
    const response = await (options.fetcher ?? fetch)(url, { method: 'GET', headers: { Accept: 'application/json' },
      credentials: 'omit', redirect: 'error', signal: controller.signal });
    if (!response.ok || response.redirected || !response.headers.get('content-type')?.toLowerCase().startsWith('application/json') ||
        Number(response.headers.get('content-length')) > 32768) throw new Error('INVALID_HOME_RESPONSE');
    const text = await response.text();
    if (text.length > 32768) throw new Error('HOME_RESPONSE_TOO_LARGE');
    const envelope: unknown = JSON.parse(text);
    if (!object(envelope) || !keys(envelope, ['data'])) throw new Error('INVALID_HOME_RESPONSE');
    return parseHomeConfig(envelope.data);
  };
  try { return await Promise.race([request(), cancelled]); }
  catch { return defaultHomeConfig; }
  finally { clearTimeout(timer); options.signal?.removeEventListener('abort', cancel); }
}
