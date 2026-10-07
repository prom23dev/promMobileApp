import { SiteUnavailableError } from './site';

export type ArticleCommentTarget = { targetId: string; entityType: 'articles'; sourceUrl: string };
export type ArticleComment = {
  id: string; author: string; text: string; publishedLabel: string;
  parentId: string | null; replies: ArticleComment[];
};
export type ArticleCommentsPage = {
  available: boolean; items: ArticleComment[]; hasMore: boolean;
  sourceFeatureEnabled: false;
  target: ArticleCommentTarget | null; requiresAuthentication: boolean;
  sort: 'popular' | 'new'; moderation: 'premoderation';
};
export type ArticleCommentConsent = { name: string; accepted: boolean; documentIds: readonly string[] };
export type ArticleCommentRequest = {
  sourceUrl: string; commentText: string; parentId: string | null;
  consents: readonly ArticleCommentConsent[];
};
export type ArticleCommentResult = { status: 'pending-moderation'; id: string };

// Numeric source IDs verified by public GET on 2026-09-11. Inline article likes use
// the same news.detail ID / ElementID as the archived comments TARGET_ID include.
// Unknown URLs deliberately have no target: no slug/index is converted into a Bitrix ID.
const targets: Readonly<Record<string, ArticleCommentTarget>> = Object.freeze({
  "https://prom.myfast.space/blog/khomutovye-stroitelnye-lesa-promyshlennik-poshagovaya-sborka-vidy-khomutov-i-sovety-po-montazhu/": {
    "targetId": "54871",
    "entityType": "articles",
    "sourceUrl": "https://prom.myfast.space/blog/khomutovye-stroitelnye-lesa-promyshlennik-poshagovaya-sborka-vidy-khomutov-i-sovety-po-montazhu/"
  },
  "https://prom.myfast.space/blog/setka-zatenyayushchaya-promyshlennik-kak-vybrat-dlya-stroyki-dachi-maskirovki-i-dekora/": {
    "targetId": "54870",
    "entityType": "articles",
    "sourceUrl": "https://prom.myfast.space/blog/setka-zatenyayushchaya-promyshlennik-kak-vybrat-dlya-stroyki-dachi-maskirovki-i-dekora/"
  },
  "https://prom.myfast.space/blog/vyshka-tura-ili-stroitelnye-lesa-5-shagov-k-pravilnomu-vyboru-dlya-fasada-i-remonta/": {
    "targetId": "2944",
    "entityType": "articles",
    "sourceUrl": "https://prom.myfast.space/blog/vyshka-tura-ili-stroitelnye-lesa-5-shagov-k-pravilnomu-vyboru-dlya-fasada-i-remonta/"
  },
  "https://prom.myfast.space/blog/konus-abramsa-dlya-betona-kak-proverit-kachestvo-i-podvizhnost-betonnoy-smesi-na-stroyploshchadke/": {
    "targetId": "24095",
    "entityType": "articles",
    "sourceUrl": "https://prom.myfast.space/blog/konus-abramsa-dlya-betona-kak-proverit-kachestvo-i-podvizhnost-betonnoy-smesi-na-stroyploshchadke/"
  },
  "https://prom.myfast.space/blog/kak-sobrat-vyshku-turu-svoimi-rukami-poshagovaya-instruktsiya-dlya-nachinayushchikh/": {
    "targetId": "3236",
    "entityType": "articles",
    "sourceUrl": "https://prom.myfast.space/blog/kak-sobrat-vyshku-turu-svoimi-rukami-poshagovaya-instruktsiya-dlya-nachinayushchikh/"
  }
});

export function getArticleCommentTarget(sourceUrl: string): ArticleCommentTarget | null {
  const target = Object.hasOwn(targets, sourceUrl) ? targets[sourceUrl] : undefined;
  return target ? { ...target } : null;
}
export async function loadArticleComments(sourceUrl: string, sort: ArticleCommentsPage['sort'] = 'popular'): Promise<ArticleCommentsPage> {
  // No HTTP, cookies, tokens, user data or manufactured public comments.
  return { available: false, sourceFeatureEnabled: false, items: [], hasMore: false, target: getArticleCommentTarget(sourceUrl),
    requiresAuthentication: false, sort, moderation: 'premoderation' };
}
export class ArticleCommentValidationError extends Error {}
export function validateArticleComment(request: ArticleCommentRequest): ArticleCommentTarget {
  const target = getArticleCommentTarget(request.sourceUrl);
  if (!target) throw new ArticleCommentValidationError('Отправка комментария к этой статье пока недоступна.');
  if (typeof request.commentText !== 'string' || !request.commentText.trim() || request.commentText.length > 5000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(request.commentText)) {
    throw new ArticleCommentValidationError('Напишите комментарий: до 5 000 символов.');
  }
  if (request.parentId !== null && !/^[1-9][0-9]{0,14}$/.test(request.parentId)) throw new ArticleCommentValidationError('Выберите комментарий, на который хотите ответить.');
  for (const [name, document] of [['agree_consent', 'consent']]) {
    if (!request.consents.some(item => item.name === name && item.accepted === true && item.documentIds.includes(document))) {
      throw new ArticleCommentValidationError('Подтвердите ознакомление с политикой и согласие на обработку данных.');
    }
  }
  return target;
}
export async function submitArticleComment(request: ArticleCommentRequest): Promise<ArticleCommentResult> {
  validateArticleComment(request);
  // Connect only to a verified BFF: validate target/parent scope, consent document versions,
  // CSRF/auth/guest policy, rate limits and premoderation before the existing HL→CRM path.
  // Archived article templates currently do not enable the comment form.
  throw new SiteUnavailableError();
}
