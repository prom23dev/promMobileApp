import test from 'node:test';
import assert from 'node:assert/strict';
import { videoSource, productionVideo } from '../src/video-source';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../src/content/blogContent.ts', import.meta.url), 'utf8');
const blogArticles = JSON.parse(source.split('export const blogArticles: BlogArticle[] = ')[1].split('];')[0]+']') as {links:{kind:string;url:string}[]}[];
test('all source article videos resolve to inline players',()=>{
 const links=blogArticles.flatMap(a=>a.links.filter(l=>l.kind==='video'));
 assert.ok(links.length>=5);for(const link of links)assert.ok(videoSource(link.url),link.url);
 assert.equal(videoSource(productionVideo)?.kind,'file');
});
test('provider URLs normalize without external navigation or untrusted parameters',()=>{
 const id='92fb53f99ac4a5a342ce69675c109a98';
 for(const kind of ['video','shorts','play/embed'])assert.equal(videoSource(`https://rutube.ru/${kind}/${id}/?autoplay=1`)?.url,`https://rutube.ru/play/embed/${id}`);
 assert.equal(videoSource('https://youtu.be/y0lGvhq9aeA')?.url,'https://www.youtube-nocookie.com/embed/y0lGvhq9aeA?playsinline=1&rel=0');
 for(const value of ['javascript:alert(1)','http://rutube.ru/video/'+id,'https://evil.test/video.mp4','https://rutube.ru.evil.test/video/'+id,'https://user@rutube.ru/video/'+id,'https://prom23.ru/page.mp4','https://rutube.ru/channel/35767003/'])assert.equal(videoSource(value),null);
});
