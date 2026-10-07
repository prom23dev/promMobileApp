# UX48 - search fills space beside the city

Fixed42% city width becomes intrinsic width capped42%. Search fills the remaining space. Icons do not shrink; city text wraps up to two lines. Extremely long text truncates on narrow screens, with complete accessible label and picker entry. Only shared ShopHeader presentation changed; buyer context, location, search and scroll behavior preserved.

UI-only fixtures: Sochi, Saint Petersburg, Kremenchug-Konstantinovskoye, longest local GAR name (66 characters; see exact Cyrillic names in browser.json). The last is a record in the bundled dataset, not a claim about every administrative name in Russia. Longest no-space name reference: https://www.rbc.ru/rbcfreenews/6113ccc89a794784a7784930

Tests at320/390/1280: intrinsic width, city/search bounds, no overflow, fixed icon sizes, full accessible label/picker, global search navigation and query preservation in catalog. TypeScript and web/iOS/Android export. No business logic changed, no live orders/submissions or external integrations.

Release48/public verification complete. Owner visual ACCEPTED not claimed.


## UX48 - published and verified, 18.09.2026
Release v0.10-20260918-48: http://159.253.19.172:18087/?v=48. Mobile commits5f93102+cb82c30. Intrinsic city width capped42%, search fills remainder, icons keep size. Saint Petersburg city slot156px instead of240px on desktop, freeing84px for search. No logic or data changes.
TypeScript/all-platform export PASS. Local and public each12 city/viewport cases plus3 search flows at320/390/1280, zero JS errors. Tested short, long hyphenated and66-character GAR labels using UI-only fixtures, reviewed screenshots. Complete name remains in picker and accessibility; extreme labels truncate to two lines on small screens. No live submissions/native-device acceptance claimed.
566 payload files plus manifest verified; public bundle matches local and protected host snapshot unchanged. Retention cadence removed46/46-1 release/archive pairs (1075559024bytes), keeping47/48 and DB backups. Integration remains skipped. All authorized work completed; next step owner visual review, ACCEPTED not set.

Bundle: entry-747cb76be362777ca8ef33c3aa55ac00.js; SHA256 3d259a3762e1fb1cdd5eaf0472fb65f38ef02970880a6bfa76416e130560be65.
Archive SHA256 e2a3f327ac72e2c5f996fa4dab1236148e42269890eabfbc9863b8f369446988.
