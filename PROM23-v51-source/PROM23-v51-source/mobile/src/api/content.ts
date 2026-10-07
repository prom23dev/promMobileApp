// Public presentation only. Forms, target IDs, consent documents and permissions stay local/server-authenticated.
import { sitePages, type SitePage, type SitePageSection, type SitePageLink } from '../content/sitePages';
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const plain = (s: unknown, max: number): s is string => typeof s === 'string' && s.length <= max && !/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(s);
const textArray = (v: unknown): v is string[] => Array.isArray(v) && v.length <= 120 && v.every(s => plain(s, 20000));
const allowedKeys = (v: Record<string, unknown>, keys: string[]) => Object.keys(v).every(k => keys.includes(k));
const safeUrl = (v: unknown): v is string => {
  try { const u = new URL(String(v)); return u.protocol === 'https:' && ['prom.myfast.space','prom23.ru'].includes(u.hostname) && !u.port && !u.username && !u.password && !u.search && !u.hash && !/^\/(local|bitrix|personal|organization|api)(?:\/|$)/i.test(u.pathname) && !/\.php$/i.test(u.pathname); } catch { return false; }
};
export function parseContentPage(value: unknown, slug: string): SitePage {
  const fallback = sitePages[slug];
  const invalid = (): never => { throw new Error('INVALID_CONTENT_PAGE'); };
  if (!fallback || !object(value) || !allowedKeys(value,['schemaVersion','revision','sourceCheckedAt','mode','page']) || value.schemaVersion !== 1 || value.mode !== 'source-snapshot' || !plain(value.revision,64) || !/^[a-f0-9]{64}$/.test(value.revision) || !plain(value.sourceCheckedAt,10) || !/^\d{4}-\d{2}-\d{2}$/.test(value.sourceCheckedAt) || !object(value.page)) return invalid();
  const p = value.page;
  if (!allowedKeys(p,['slug','title','sourceUrl','sections','links']) || p.slug !== slug || p.sourceUrl !== fallback.sourceUrl || !plain(p.title,300) || !Array.isArray(p.sections) || p.sections.length > 80) return invalid();
  const known = new Set(fallback.sections.map(s=>s.id)); const seen = new Set<string>();
  const sections: SitePageSection[] = p.sections.map(section => {
    if (!object(section) || !allowedKeys(section,['id','title','paragraphs','bullets']) || typeof section.id !== 'string' || !known.has(section.id) || seen.has(section.id) || !textArray(section.paragraphs) || (section.title !== undefined && !plain(section.title,300)) || (section.bullets !== undefined && !textArray(section.bullets))) return invalid();
    seen.add(section.id);
    return {id:section.id,paragraphs:[...section.paragraphs],...(section.title === undefined ? {} : {title:section.title as string}),...(section.bullets === undefined ? {} : {bullets:[...(section.bullets as string[])]})};
  });
  if (seen.size !== known.size || !Array.isArray(p.links) || p.links.length > 40) return invalid();
  const links: SitePageLink[] = p.links.map(link=> {
    if (!object(link) || !allowedKeys(link,['label','url']) || !plain(link.label,200) || !safeUrl(link.url)) return invalid();
    return {label:link.label,url:link.url};
  });
  // Fields/consents/forms/sourceReviewRequired/dataContract are immutable local definitions.
  return {...fallback,title:p.title,sections,links};
}
function endpoint(slug: string, base?: string) {
  if (!sitePages[slug] || !/^[a-z][a-z0-9-]{0,79}$/.test(slug)) return null;
  const path=`/api/v1/content/pages/${slug}`;
  if (!base) return typeof window !== 'undefined' && window.location?.origin ? path : null;
  try { const u=new URL(base); if(u.username || u.password || u.search || u.hash || !['/api','/api/','/api/v1','/api/v1/'].includes(u.pathname) || (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['127.0.0.1','localhost','[::1]'].includes(u.hostname)))) return null; return `${u.origin}${path}`; } catch {return null;}
}
export async function loadContentPage(slug: string, options: {signal?:AbortSignal;timeoutMs?:number;baseUrl?:string;fetcher?:typeof fetch} = {}): Promise<SitePage | null> {
  const fallback = sitePages[slug] ?? null;
  const url=endpoint(slug,options.baseUrl ?? process.env.EXPO_PUBLIC_APP_API_URL ?? process.env.EXPO_PUBLIC_LOCAL_API_URL);
  const timeout=options.timeoutMs ?? 1500;
  if(!fallback || !url || options.signal?.aborted || !Number.isSafeInteger(timeout) || timeout<1 || timeout>5000) return fallback;
  const controller = new AbortController();let cancel=()=>{};let timer:ReturnType<typeof setTimeout>|undefined;
  const aborted = new Promise<never>((_resolve,reject)=>{cancel=()=>{controller.abort();reject(new Error('CONTENT_CANCELLED'));};timer=setTimeout(cancel,timeout);options.signal?.addEventListener('abort',cancel,{once:true});});
  const request=async()=>{
    const response=await (options.fetcher ?? fetch)(url,{method:'GET',headers:{Accept:'application/json'},credentials:'omit',redirect:'error',signal:controller.signal});
    if(!response.ok || response.redirected || !response.headers.get('content-type')?.toLowerCase().startsWith('application/json') || Number(response.headers.get('content-length'))>524288) throw new Error('INVALID_CONTENT_RESPONSE');
    const body=await response.text();if(body.length>524288) throw new Error('CONTENT_TOO_LARGE');
    const envelope:unknown=JSON.parse(body);if(!object(envelope) || !allowedKeys(envelope,['data'])) throw new Error('INVALID_CONTENT_ENVELOPE');
    return parseContentPage(envelope.data,slug);
  };
  try{return await Promise.race([request(),aborted]);}catch{return fallback;}finally{clearTimeout(timer);options.signal?.removeEventListener('abort',cancel);}
}
