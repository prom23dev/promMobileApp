import test from 'node:test';import assert from 'node:assert/strict';
import {createPublicContentService,normalizeContentPage} from '../integrations/public-content.mjs';
const page={slug:'about',title:'Компания',sourceUrl:'https://prom.myfast.space/about/',sections:[{id:'history',title:'История',paragraphs:['Сведения компании']}],links:[]};
test('public content has stable ETag, conditional304 and detached copies',()=>{
 const s=createPublicContentService({pages:[page]});const a=s.getResponse('about');assert.equal(a.status,200);assert.equal(a.body.data.mode,'source-snapshot');assert.equal(s.getResponse('about',a.headers.ETag).status,304);
 a.body.data.page.sections[0].paragraphs[0]='mutated';assert.equal(s.getPage('about').page.sections[0].paragraphs[0],'Сведения компании');
 const changed=createPublicContentService({pages:[{...page,title:'Новая компания'}]});assert.notEqual(changed.getResponse('about').headers.ETag,a.headers.ETag);
});
test('invalid source/duplicate IDs/HTML fail closed and unknown slugs cannot select filesystem paths',()=>{
 for(const p of [{...page,title:'<script>run()</script>'},{...page,sourceUrl:'https://untrusted.example/'},{...page,sections:[...page.sections,...page.sections]}])assert.equal(createPublicContentService({pages:[p]}).readiness().available,false);
 const s=createPublicContentService({pages:[page]});assert.equal(s.getPage('../../private'),null);assert.equal(s.getResponse('unknown').status,404);
 assert.equal(createPublicContentService({snapshotPath:'/nonexistent-public-content-snapshot'}).readiness().available,false);
});
test('forms/private targets/remote instructions excluded, unsafe links omitted',()=>{
 const p=normalizeContentPage({...page,forms:[{formId:'account-delete'}],target:{organizationId:'private'},links:[{label:'Bad',url:'javascript:alert(1)'},{label:'Handler',url:'https://prom.myfast.space/local/ajax/handler.php'},{label:'Token',url:'https://prom.myfast.space/file?token=private'},{label:'О сайте',url:'https://prom.myfast.space/about/'}]});
 assert.equal(p.forms,undefined);assert.equal(p.target,undefined);assert.equal(p.links.length,1);
});
test('actual curated snapshot is available but never claims live CMS',()=>{
 const s=createPublicContentService();assert.equal(s.readiness().pageCount,17);assert.equal(s.readiness().liveCmsConnected,false);assert.ok(s.getPage('about'));assert.ok(s.getPage('franchise'));
});
