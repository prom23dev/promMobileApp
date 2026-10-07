# UX45 — согласия в формах и оформлении заказа

## Scope and resulting behavior

- Every registered data form has separate processing consent and policy acknowledgement; personal checkout additionally has offer acceptance. Specialized procurement and inline franchise use the same component.
- All choices start unchecked and can be removed. Optional marketing and publication are separate; consumer offer never replaces a business customer's individual contract.
- One responsive panel: original project colors, 20×20 square, 14px/20px copy, 13px/18px links, independent 44px touch targets, keyboard focus, aligned errors. Entire checkbox label toggles its choice, document link opens independently.
- Checkout confirmation stays disabled until required choices and authoritative quote/legal context exist. Seller, legal edition and buyer changes invalidate acceptance. Reading a document and returning preserves the form draft.
- Registry, BFF contracts and prepared PHP validation agree. Checkout records actual seller offer edition in the prepared runtime consent ledger. External integration remains skipped by the owner; fixture transactions never reach live handlers.

## Requirement precedence

The latest owner request explicitly replaces the Legal42/43 UI decision to omit checkout processing consent and show policy only as information. Approved full legal documents and hashes are unchanged. This is a requested UI/validation update, not a new legal-compliance certification. Historical audit reports describe their respective releases.

## Validation

- TypeScript and web/iOS/Android export pass.
- 107 mobile tests, 186 BFF tests pass, including missing/false/duplicate/mismatched checkout choices and B2B exclusion of consumer offer.
- Prepared runtime PHP syntax and 44 pure policy assertions and the notification receipt regression pass. Three SQLite store assertions remain skipped (remote PHP lacks pdo_sqlite); live Bitrix operation remains unverified and intentionally disconnected.
- Browser fixtures cover actual rendered controls, default state, independent toggles, document links, draft retention, no overflow, font/box measurements and specialized checkout/business flows. No customer submissions are made.
- Initial harness failures were an empty-cart checkout redirect and waiting for a hidden duplicate label; tests were corrected to use a populated-cart fixture and canonical legal route. A simultaneous rapid sweep hit the existing preview request throttle; final sweeps run sequentially with pacing. No application rate limit was weakened.

## Release

Published `v0.10-20260918-45`: http://159.253.19.172:18087/checkout-preview?v=45.
Mobile commit `ac5bde2`;566 payload files verified. Archive SHA256 `2ab7ba84c39258dea4f689755ae908793488fa61ce07f474aab1f9ab74ca8939`.
Public bundle `entry-850c9a8e65ebf461432a43ed4c531da8.js` matches local export byte-for-byte. Protected production files/processes/HTTP unchanged. Release retention kept44+45 and DB backups; removed42.1+43 release/archive pairs, freeing1,074,948,855 bytes. Temporary PHP policy-test files were removed from the isolated incoming directory after validation.

Local all-form sweep:136 visits,1258 assertions; specialized checkout/procurement/B2B:133 assertions at four widths. Public specialized suite:133 assertions, zero JS errors/live transactions; screenshots reviewed. Public full-form sweep also passed:136 visits/1258 assertions, no failures or JS errors. Static assets were fetched from the public release and cached during the test (Playwright interception otherwise disables ordinary browser caching).

Owner visual acceptance is not recorded.

Notification preferences now combine processing/policy and independent email/SMS advertising choices into one receipt, preventing duplicate-idempotency-key loss. A pure database-spy regression covers all four entries; no actual subscriber data was used.
