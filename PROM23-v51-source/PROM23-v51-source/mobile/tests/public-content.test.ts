import test from 'node:test';import assert from 'node:assert/strict';
import {sitePages} from '../src/content/sitePages';
import {parseContentPage,loadContentPage} from '../src/api/content';
const source=sitePages.suppliers;
const dto=()=>({schemaVersion:1,revision:'a'.repeat(64),sourceCheckedAt:'2026-09-11',mode:'source-snapshot',page:{slug:source.slug,title:source.title,sourceUrl:source.sourceUrl,sections:structuredClone(source.sections),links:structuredClone(source.links??[])}});
test('content can update presentation while preserving immutable local forms',()=>{
 const value=dto();value.page.title='Поставщикам';const parsed=parseContentPage(value,'suppliers');assert.equal(parsed.title,'Поставщикам');assert.equal(parsed.forms,source.forms);
});
test('cross-page content, unknown/missing IDs, HTML and form overrides rejected',()=>{
 const attempts:any[]=[];let v:any=dto();v.page.slug='about';attempts.push(v);v=dto();v.page.sections[0].id='unknown';attempts.push(v);v=dto();v.page.sections=[];attempts.push(v);v=dto();v.page.title='<script>secret</script>';attempts.push(v);v=dto();v.page.forms=[];attempts.push(v);v=dto();v.page.links=[{label:'bad',url:'https://untrusted.example/'}];attempts.push(v);
 for(const a of attempts)assert.throws(()=>parseContentPage(a,'suppliers'));
});
test('optional GET never submits credentials and safe failure returns exact fallback',async()=>{
 let call:any;const fetched=await loadContentPage('suppliers',{baseUrl:'http://127.0.0.1:8090/api',fetcher:(async(u,init)=>{call={u,init};return new Response(JSON.stringify({data:dto()}),{headers:{'content-type':'application/json'}});}) as typeof fetch});
 assert.equal(fetched?.slug,'suppliers');assert.equal(call.init.method,'GET');assert.equal(call.init.credentials,'omit');assert.equal(call.init.redirect,'error');assert.equal(call.init.body,undefined);assert.equal(call.init.headers.Authorization,undefined);
 const failed=await loadContentPage('suppliers',{baseUrl:'http://127.0.0.1:8090/api',fetcher:(async()=>new Response('<html>',{status:503})) as typeof fetch});assert.equal(failed,source);
});
test('timeout/abort and invalid base cannot block startup or call a guessed origin',async()=>{
 const hanging=await loadContentPage('suppliers',{baseUrl:'http://127.0.0.1:8090/api',timeoutMs:5,fetcher:(()=>new Promise(()=>{})) as typeof fetch});assert.equal(hanging,source);
 let calls=0;const fallback=await loadContentPage('suppliers',{baseUrl:'http://public.example/api',fetcher:(async()=>{calls++;throw new Error();}) as typeof fetch});assert.equal(calls,0);assert.equal(fallback,source);assert.equal(await loadContentPage('documents'),null);
});
