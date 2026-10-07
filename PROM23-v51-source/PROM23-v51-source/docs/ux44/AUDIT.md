# UX44 — checkout, media, company details and business requests

Owner scope: delete obsolete preview releases and repeat every other release; automatic final checkout totals including delivery; inline video playback; RUTUBE social link; clickable requisites and downloadable Word; universal business enquiry.

## Implementation

- Checkout preserves delivery/payment methods, location, structured address lookup, pickup selection, coupon, recipient, legal seller snapshot and order/payment idempotency. Delivery options and authoritative quote refresh automatically with 350ms debounce. Inputs/context/coupon/expiry invalidate stale totals; old responses cannot overwrite a newer choice. Coupon application and pending totals lock confirmation. No calculate button. No invented delivery price when integration is unavailable.
- Shared click-to-load InlineVideo: HTML video for trusted company files, official Rutube/YouTube embeds, expo-video / WebView on native. Closing or leaving stops playback. Provider allowlist and CSP are narrowly scoped. Five article references plus company production and customer-review video surfaces use the same player. Video rubric also includes four real articles with recordings; original eight source publications without recording URLs remain accessible with an explicit notice, no invented substitutes.
- Official RUTUBE channel 35767003 added to More social links. Verified against company description and prom23.ru contacts.
- Requisites use existing approved page paragraphs, actionable telephone/email, and a DOCX generated from data/site-pages.json. The download carries the existing notice that bank details are supplied in the seller's invoice/on request; no invented banking fields.
- Business enquiry covers purchase, selection, manufacture by specification, cooperation and other questions. Text or attachment suffices; INN, address and deadline optional. Existing required company/contact/email/location and file upload contract retained. New task metadata is serialized into existing comment after validating the actual need. Purpose-specific consent updated in client and both server/runtime contracts; no prechecked assent or false CRM delivery.
- Scoped retention pruner deletes recognized older releases and archives only. Current and immediate previous release protected; unknown/symlink/future entries, DB and backups untouched. Initial cleanup applied; then every two distinct successful activations. Cleanup failure is visible and retryable without rolling back a healthy application.

## Verification and boundaries

- 107 mobile tests; 185 server tests; TypeScript; all-platform Expo export passed.
- Retention temp-directory test passed dry-run, preserved current/rollback/future/symlink/unknown/state, every-other cadence and duplicate activation handling.
- Four-width browser test (320/390/768/1280), 97 initial checks: automatic totals, address race, delivery, coupon, failure/retry, exact quote submission, business validation/payload/no-INN/no-file, pending CRM status, Word download and overflow. All transaction responses are intercepted UI fixtures; zero real orders/messages.
- Word paragraphs match the public data source; all four downloaded files are byte-identical to the generated DOCX.
- Direct film playback confirmed in Chrome (125.84 seconds; playback time advancing, readyState4, no media error). All five provider references (four Rutube and one YouTube) played inline on the public v44 release: currentTime > 1s, readyState4, paused=false, no errors. Closing removes the player. Earlier test attempts chose a hidden Rutube control; selecting its visible play control confirmed playback without any application change. Native bundles compile but physical iOS/Android playback has not been certified.
- Initial cleanup removed 32 release directories and 32 archives, 16,288,741,529 bytes. Retained v42.1 and v43 at cleanup. Databases untouched.

External commerce/Bitrix/payment integration remains explicitly skipped by owner. Automatic checkout is implemented against the real quote contract, tested with isolated fixtures; the preview cannot claim an actual final delivery amount without an authoritative tariff. No ACCEPTED/production legal clearance claim.

## Publication

Isolated release v0.10-20260918-44, mobile commit4e2e601. Archive SHA256 562832ddf0f4171b5ee38108a3d8eb3a5d3d2e287659920a86cb7d7331d1d549; 566 payload files plus manifest verified. Web bundle entry-c968f749faf512e9f6dc20306d35b325.js byte-matches export. Word200/MIME/attachment/source hash verified publicly. Protected production files, service PIDs/state/timestamps and HTTP status exactly match before/after. Previousv43 retained, own DB snapshot saved; retention counter1 means next successful distinct activation runs cleanup.

Public final verification: 101 checks passed at320/390/768/1280. Includes actual download bytes and contact actions (`mailto:info@prom23.ru`, `tel:+78612250090`, navigation observed without sending messages/calls). Phone-navigation testing runs after the download because a tel navigation cancels Chromium's pending download gesture; the actual download works with the normal click. No application JS errors. Screenshots reviewed for mobile and desktop; all transaction routes intercepted, zero live orders/requests. Public browser/video evidence is authoritative over preliminary test-selector attempts. No remaining implementation/deployment work in this scope; user visual acceptance and skipped integration remain separate.
