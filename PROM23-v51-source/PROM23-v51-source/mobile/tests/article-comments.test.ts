import test from 'node:test';
import assert from 'node:assert/strict';
import { getArticleCommentTarget, loadArticleComments, submitArticleComment } from '../src/api/article-comments';

const sourceUrl='https://prom.myfast.space/blog/khomutovye-stroitelnye-lesa-promyshlennik-poshagovaya-sborka-vidy-khomutov-i-sovety-po-montazhu/';
test('disabled article comment contract uses the verified source entity ID and does not expose fabricated posts',async()=>{
  assert.equal(getArticleCommentTarget(sourceUrl)?.targetId,'54871');
  assert.equal(getArticleCommentTarget(sourceUrl)?.entityType,'articles');
  assert.equal(getArticleCommentTarget('https://other.invalid/blog/example/'),null);
  assert.equal(getArticleCommentTarget('https://prom.myfast.space/blog/not-a-source-article/'),null);
  const page=await loadArticleComments(sourceUrl);
  assert.equal(page.sourceFeatureEnabled,false);assert.equal(page.available,false);
  assert.equal(page.requiresAuthentication,false);assert.deepEqual(page.items,[]);
});

test('article comment adapter makes no network requests and never reports accepted/moderated success',async()=>{
  const previous=globalThis.fetch;let requests=0;
  globalThis.fetch=async()=>{requests++;throw new Error('Network forbidden in disabled adapter');};
  try{
    await loadArticleComments(sourceUrl,'new');
    await assert.rejects(()=>submitArticleComment({sourceUrl,commentText:'Локальный текст проверки',parentId:null,
      consents:[{name:'agree_policy',accepted:true,documentIds:['privacy']},{name:'agree_consent',accepted:true,documentIds:['consent']}]}),/Данные не отправлены/);
    assert.equal(requests,0);
  }finally{globalThis.fetch=previous;}
});
