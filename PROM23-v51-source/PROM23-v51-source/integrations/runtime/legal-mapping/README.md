# legal-mapping

Reproducible tooling for Stage 5 (Consents) of the runtime integration plan.
See `docs/parity/runtime-consent.md` for the full findings and
`../CONFIG_REQUEST_CHECKLIST_FILLED.md` section 5 for the config-value
summary.

## `compute-legal-versions.php`

Computes sha256 + a version string for the two documents that
`ConsentLedger` stamps into checkout consent receipts (`privacy-policy`,
`user-agreement`), in the same shape as `../legal-versions.json`. It never
writes to `legal-versions.json` or to Bitrix — it only reads and prints a
JSON report, including a diff against what is currently committed, so drift
is visible instead of silently overwritten.

Not run in this repo: there is no `php` CLI and no Bitrix DB access from
this checkout (same constraint noted throughout the runtime integration
plan). Run it on the real or an isolated Bitrix instance.

```sh
# privacy-policy text is static in the PHP template — no DB needed
php compute-legal-versions.php --privacy-policy-file=/path/to/prom23marketplace/privacy-policy/index.php

# user-agreement text is DB-only (UF_USER_AGREEMENT_TEXT) — needs a real
# Bitrix bootstrap
php compute-legal-versions.php --user-agreement --site-root=/path/to/bitrix/root

# offline fallback if only an admin-panel copy/paste export is available
php compute-legal-versions.php --user-agreement-text-file=/path/to/pasted.txt
```

## Why this matters

`legal-versions.json` currently ships hashes of the mobile app's own
"legal42" texts (`mobile/src/content/legalDocuments.ts`, edition
2026-10-01) — not the text actually published on prom23marketplace's
`/privacy-policy/` (edition 06.07.2026, verified in this session) or
`/user-agreement/` (DB-only, unverified — no DB access this session). Until
someone with site/DB access runs this script and reconciles the result, a
`ConsentLedger` receipt records acceptance of a document version that may
not match what the user actually saw at `/privacy-policy/` or
`/user-agreement/` on the live site.
