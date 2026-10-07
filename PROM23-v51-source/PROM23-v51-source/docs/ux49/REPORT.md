# UX49 - remove buyer switch from favorites and editorial pages

Owner explicitly removes the personal/business selector from favorites and menu content pages such as About. The complete PageScroll prefix (tabs, organization chooser, explanation) is removed at the relevant screen boundary. Top navigation, city and search remain. Saved favorites and buyer context are unchanged; content navigation does not reset them.

Affected: CatalogScreen favorites mode; More, SitePage, Information, Legal, Brands, BrandDetail editorial mode, Blog and Article. Catalog-brand mode, regular catalog/home/PDP/cart/checkout/forms/account/service keep their existing selector. Local Warranty/Returns policy tabs are preserved because they select explanatory content, not the global buyer.

TypeScript and web/iOS/Android export passed. Focused local/public navigation testing and isolated49 release completed. Test flows use fresh browser-owned sessions, saved favorite and buyer mode only, no real order/form submissions. Integration remains skipped; visual ACCEPTED requires owner review.


## UX49 - published and verified, 18.09.2026
Release v0.10-20260918-49: http://159.253.19.172:18087/pages/about?v=49. Mobile1f3b075. Favorites and editorial/menu pages no longer render buyer/organization/explanation prefix. Shared header/search/city, saved favorites and buyer context remain. Shopping/form/account controls and local warranty-rule tabs are preserved.
TypeScript/all-platform export PASS.119 local and119 public navigation checks at390/1280,0 JavaScript errors; populated favorites, content routes, editorial-brand redirect, business context restoration and personal content views verified. Screenshots reviewed. No live orders/forms submitted, native physical-device testing not claimed.
566 payload hashes plus manifest verified; public bundle matches export and protected-host snapshot unchanged. Previous48 and own DB backup retained; cadence cleanup not due on49. External integration remains skipped. All authorized work complete; next step owner visual review, ACCEPTED not set.

Bundle:entry-10e2bdfd2c86836c8bf4bc7922d0374f.js; SHA256 aa7111827db6473130b0330b8f1bc7c28db7b9f1295800bae25e404fd2d6790a.
Archive SHA256 ffa09e39d9e15e28dc987b4df05b573c7613877cb5129794323029056b54b76d.
