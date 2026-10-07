# Source consent runtime adapter — Этап 5, 23.09.2026

`integrations/runtime/src/ConsentLedger.php` is the durable receipt store
behind every consent checkbox the mobile app records through the signed BFF
transport (`endpoint.php`). It is not installed in production Bitrix. No
real consent receipts were written against prod during this session — only
`test/ConsentLedger.test.php` (sqlite, isolated).

## What was already correct before this session

Reading `src/ConsentLedger.php`, `src/CommerceDriver.php:334-420`, and
`form-contracts.json`'s `"checkout"` entry, the independence/no-preselection
requirement from `README.md` §5 ("Транзакционные и маркетинговые каналы
независимы; отсутствие настройки не означает согласие") is already
implemented, not just planned:

- `CommerceDriver::consents()` requires **exactly** the three consents
  defined for `checkout` (`agree_consent_order`→`consent`,
  `agree_privacy`→`privacy`, `agree_offer`→`offer`, or two for B2B, where
  `offer` doesn't apply), each explicitly `accepted===true` with matching
  `documentIds` — no consent is inferred from the others, none is
  preselected (`initial:false` everywhere in `form-contracts.json`).
- `ConsentLedger::record()` treats each `consents[]` entry independently;
  marketing (`documentId==='advertising'`) additionally requires a non-empty
  `recipient` only when `accepted===true`, and is otherwise recorded as a
  refusal (`accepted:false`) — never inferred as consent from silence.
- Every receipt is versioned: `record()` throws `CONSENT_VERSION_REQUIRED`
  if `legalVersions[documentId]` is missing a `sha256`/`version`, so an
  unconfigured document can never be silently accepted.

No code changes were needed to `ConsentLedger.php` or `CommerceDriver.php`
for this. What was missing is **data**, documented below.

## The actual gap: document identity, not code

`legal-versions.json` (loaded by `endpoint.php:44` into every request) ships
sha256 hashes of `mobile/src/content/legalDocuments.ts`'s own "legal42"
texts, edition **2026-10-01**. Those are a separately-approved canonical
copy that also backs the app's own document reader and the cookie-consent
banner (`mobile/src/privacy-model.ts`). They are **not** verified against
what `prom23marketplace` actually publishes:

| Document | Real site source | Real site edition | `legal-versions.json` edition |
|---|---|---|---|
| `/privacy-policy/` | Hardcoded HTML in `privacy-policy/index.php` (no DB) | **06.07.2026** (`index.php:19`) | 2026-10-01 (different text) |
| `/user-agreement/` | `UF_USER_AGREEMENT_TEXT`, a user field on the `IBLOCK_ID_PAGES` element `CODE=user-agreement` (`local/class/Prom/Page.php`, `user-agreement/index.php:35`) — DB-only, not in any file | **unknown — no explicit revision line in the text**, and no DB access this session to read the live value | 2026-10-01 (different, unverified text) |

This means: today, if a mobile user taps "Я согласен с «Политикой
конфиденциальности»" during checkout, `ConsentLedger` stamps the receipt
with the hash of the app's own bundled legal42 copy — not the text actually
live at `prom23.ru/privacy-policy/`. If a regulator or court later compares
the receipt's hash against what was published at that URL on that date,
they will not match unless someone reconciles the two before go-live.

## Reproducible tooling delivered this session

`integrations/runtime/legal-mapping/compute-legal-versions.php` (see its
README) computes sha256 + a version string for both documents, in the same
shape as `legal-versions.json`, and diffs the result against the committed
file instead of silently overwriting it:

- **privacy-policy**: hashable right now from source, no DB needed — the
  text is static in the PHP template. Not actually run this session because
  there is no `php` CLI available in this environment (same constraint noted
  throughout the runtime integration plan's other stages).
- **user-agreement**: requires either a live Bitrix bootstrap
  (`--user-agreement --site-root=...`) or a manually pasted admin-panel
  export (`--user-agreement-text-file=...`) — genuinely blocked on DB/site
  access this session, not something to guess at.

No production document was read, edited, or republished — the script only
hashes the text that is already checked into `prom23marketplace`'s source
tree (privacy-policy) or that an operator explicitly exports (user-agreement).

## Versioning `user-agreement` when it has no embedded date

Unlike `privacy-policy`, which self-describes its edition
("Редакция от 06 июля 2026 года"), `UF_USER_AGREEMENT_TEXT` has no such
line. Two options, both wired into `compute-legal-versions.php`:

1. **Preferred**: ask an editor to add a `Редакция от DD <месяц> YYYY года`
   line to the start of `UF_USER_AGREEMENT_TEXT`, matching the
   `privacy-policy` convention. The script's `parseRevisionDate()` then
   reads it the same way for both documents — one canonicalization rule,
   no special-casing.
2. **Fallback**: use the iblock element's `TIMESTAMP_X` as the version
   (`uf-text-<ISO8601>`). Fragile — `TIMESTAMP_X` also changes on
   unrelated re-saves that don't touch the text — so this should only be
   used until option 1 is adopted, and treated as a lower-confidence
   version signal in any audit.

## Checkout consent: confirmed field mapping (and a real Bitrix gap)

`local/templates/main/components/bitrix/sale.order.ajax/main/template.php:1005,1013`:

```html
<input type="checkbox" name="agree_policy_order" required>   <!-- → /privacy-policy/ -->
<input type="checkbox" name="agree_consent_order" required>  <!-- → /user-agreement/ -->
```

Searched the whole `prom23marketplace` tree for any server-side handling of
these two field names: **none exists**. Unlike every other form on the site
(`local/ajax/form/*-action.php`, `local/ajax/catalog/action-*.php`), which
call `validateConsentFields()` from `local/ajax/consent-validate.php` to
enforce and (implicitly, via the resulting order error) surface the two
checkboxes server-side, `sale.order.ajax`'s own checkout flow never calls
that function. The two checkboxes are validated only in the browser
(`script.js:267-336,2420-2421`, `required` attribute) and are never
persisted as a Sale order property (`PROPERTY[...]`) or anywhere else.

**In other words: the real Bitrix checkout keeps no server-side evidence
that a user accepted the policy/consent at all.** This is not a mapping the
mobile runtime needs to reproduce — it's a gap the mobile app's
`ConsentLedger` genuinely fills, by being the first system of record for
checkout consent, rather than a second, divergent implementation of an
existing Bitrix mechanism.

## Cross-check against the mobile app's own consent model

`mobile/src/privacy-model.ts` + `mobile/src/content/legalDocuments.ts`
define a **separate** purpose — the cookie-consent banner
(`functional`/`analytics`/`advertising`/`personalization`, all off until an
explicit, current, non-expired choice; see `optionalOff`/`parsePrivacy`) —
tracked entirely client-side via `AsyncStorage`, never sent through
`ConsentLedger`. That's correct: it's a different purpose (cookies/tracking)
from transactional checkout consent (processing personal data to fulfil an
order), and the two should not share one record. `form-contracts.json`'s
`"checkout"` entry already reuses the **same** document ids
(`consent`/`privacy`/`offer`) that `legalDocuments.ts` defines — no second,
conflicting document-id taxonomy was invented for the server side. The one
open item is the hash/version data described above, not the category model.

## Update 06.10.2026 — a real live capture already exists; two site-side bugs found

The Stage 9 (CMS) work independently ran `cms-sync.php` against `prom-stage`
on **2026-09-29** and committed the result:
`integrations/runtime/cms-sync-output/site-pages.live.json` (+ manifest,
14/14 slugs, 0 errors). That capture includes `privacy`, `personal-data`
(user-agreement), and `offer` — the exact three documents this file is
about — so the "no DB access" blocker below is **partially lifted**: real
text is already sitting in the repo, just not reconciled with
`legal-versions.json` until now.

Added `integrations/runtime/legal-mapping/hash-live-cms-snapshot.php` to
hash that committed snapshot reproducibly (no Bitrix CLI needed — the
content is already captured). Computed via an equivalent one-off run this
session (no `php` CLI available, ran the same canonicalization in Python
to get real numbers):

| Slug | `legal-versions.json` id | Real edition (self-declared in text) | `TIMESTAMP_X` (provenance) | Computed sha256 (live, 29.09.2026 capture) | Committed sha256 (mobile legal42, 2026-10-01) |
|---|---|---|---|---|---|
| `privacy` | `privacy` | Редакция от **06.07.2026** | 04.03.2026 17:58:29 | `3c6fdfc2d44b17fa83f22f68c8820ffe26511b3eddc4f47955a4ce2e1947a8be` | `c5e29d383a8afa3e7ff01791b43a66380f6b3511db5d328bce69c64183296db3` — **no match** |
| `personal-data` | `consent` | "Настоящая редакция опубликована: **26.05.2025**" | 07.07.2026 14:08:29 | `a4f1993745a30f2e74a5dda91b369270326d4296e2dfcf72c559de3b013c0e72` | `79f0db38e06382dd44273b7a6b51aa43ac7a71c91bf3d6d2b842b86e418c3355` — **no match** |
| `offer` | `offer` | Редакция от **02.02.2026** | 18.09.2026 17:55:47 | `159f112bb3e178dfbda8d76c0f2ad549e56523d7b9dd1a30f58b58cf507be7d4` | `76b4a75f3972799e4edb8aa76e7b48d7b726a21c4285e0fac85efff0df3947f7` — **no match** |

None of the three match the committed mobile-bundled hash, confirming the
mismatch this file already described — but now with real text and real
dates instead of an assumption. Two new findings, both corrections to
what this file said earlier:

1. **`UF_USER_AGREEMENT_TEXT` does have a self-declared edition** — "7.5.
   Настоящая редакция опубликована: 26 мая 2025 года." This file previously
   said no such line exists; it does, just phrased as "редакция
   опубликована" rather than "Редакция от", so `parseRevisionDate()` in
   `compute-legal-versions.php` wouldn't match it (its regex only matches
   "Редакция от ..."). That regex should be widened before it's relied on
   against the live element — do not re-trust "no date found" from that
   script against this document without checking by eye first.
2. **A real content bug on the live site, independent of the mobile-vs-site
   gap**: the user-agreement text (saved 07.07.2026, one day after the
   privacy policy's current edition) *itself* opens by citing "Политикой
   конфиденциальности ООО «Промышленник» от **26 мая 2025 г.**" — an edition
   of the privacy policy that is no longer the one live at
   `/privacy-policy/` (06.07.2026). The user-agreement's internal reference
   to the privacy policy is stale. This is worth flagging to the content
   owner on its own, separate from the mobile/site hash mismatch.

Also relevant to the Stage 9 `privacy` mapping dispute: the real
`cms-sync.config.php` used for this capture wires `privacy` as a
`page-element` (`CODE=/privacy/`, `textProperty=UF_CONTENT`, iblock element
**23563**... — see `runtime-cms.md`'s own correction) with a comment that
`/privacy/` 301-redirects to `/privacy-policy/`. The captured text's edition
(06.07.2026) matches the static `privacy-policy/index.php` template
byte-for-byte on the date line, so this element is a real, matching copy —
not a stale unrelated one — but *why* a duplicate copy exists in an iblock
alongside the hardcoded template is still unexplained and worth asking the
owner about (candidate CMS migration in progress? Editorial convenience
copy? Something else reads it?).

## Still open (owner access required)

1. **Legal sign-off decision** (unchanged): republish the live pages with
   the `legal42` 2026-10-01 text so the committed hashes become correct, or
   recompute `legal-versions.json`/`legalDocuments.ts` from the real text
   now captured above. This session did not touch `legal-versions.json` —
   only measured and reported the mismatch, per the instruction not to
   publish new document versions.
2. **Re-run `cms-sync.php` closer to "now"** before treating the hashes
   above as current — the 29.09.2026 capture is a week-plus old relative to
   today (06.10.2026) and content could have changed again.
3. Ask the owner about the two bugs above (stale internal date reference in
   the user-agreement text; the unexplained duplicate `privacy` iblock
   element) — neither is something to silently "fix" by guessing which
   value is authoritative.
4. Widen `parseRevisionDate()` in `compute-legal-versions.php` to also match
   "редакция опубликована: DD месяц YYYY" before relying on it against the
   live `UF_USER_AGREEMENT_TEXT` element directly (as opposed to the
   already-captured snapshot used here).
