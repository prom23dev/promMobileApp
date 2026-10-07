# Stage 0 — Environment/key (runtime integration)

Preparation only. Nothing here connects to real Bitrix, and no real secret
was generated in this session. Files in this directory are templates/scripts
with explicit placeholders — safe to keep in `ops/`, but the **filled**
config (with real paths/secrets) must never be committed anywhere and must
live only on the integration host, mode 0600.

See project memory `project-runtime-integration-plan` for the full 12-stage
plan; this covers Stage 0 only. Stages 2 and 3 (region mapping, inventory)
already have code landed under
`integrations/runtime/region-mapping/` and `CommerceDriver::readInventory()`
— see `docs/parity/runtime-commerce.md` in the source tree. This session did
not touch that code.

## Files

- **`TARGET_DECISION.md`** — open question for the owner: which Bitrix
  instance (`prom23.ru` prod vs `prom.myfast.space` staging-alias, which is
  physically `prom-stage`) backs the isolated integration. **Not decided
  here** — read this first, nothing downstream should proceed past it
  without an answer.
- **`config.private.php.template`** — copy of
  `integrations/runtime/config.example.php` from the app source, with every
  value that needs a real answer marked `PLACEHOLDER`. Fill it out on the
  integration host after `TARGET_DECISION.md` is resolved, save it outside
  any web-served directory, `chmod 0600`. Diff against the real
  `config.example.php` before use in case the schema moved.
- **`generate-hmac-key.sh`** — generates a new 64-hex-char key via
  `openssl rand -hex 32`, writes it with `umask 077` + `chmod 0600`, refuses
  to overwrite an existing key (rotation is a deliberate two-sided update,
  not a re-run of this script). Run on the integration host, not here.
- **`ENV_CHECKLIST.md`** — exact shell commands to verify the integration
  host has PDO SQLite, OpenSSL, mbstring, cURL, DOM/libxml, fileinfo, ZIP,
  and `ffprobe`, per `integrations/runtime/README.md`'s stated requirements.
- **`systemd-override.conf.example`** — drop-in override for
  `prom23-preview.service` adding `PROM23_RUNTIME_URL`,
  `PROM23_RUNTIME_KEY_FILE`, `PROM23_RUNTIME_ALLOWED_ORIGINS`, following the
  existing `Environment=` pattern in `deploy/prom23-preview.service`, with
  the exact validation rules from `configFor()` in
  `server/integrations/runtime-client.mjs` annotated inline.

## `configFor()` validation, confirmed by reading the code

`server/integrations/runtime-client.mjs:77-99`:

- All three env vars unset → `readiness()` returns
  `{ configured: false, code: 'RUNTIME_NOT_CONFIGURED' }` (the original bug
  report). Any one set without the others → throws `RUNTIME_CONFIG_INVALID`
  on first use (the `!address && !keyFile && !allowed` short-circuit only
  covers "all three absent").
- `PROM23_RUNTIME_URL`: must parse as a URL with `protocol === 'https:'`,
  no `username`/`password`/`search`/`hash`, hostname not matching
  `/(^|\.)zavod-antibpla\.ru$/i` (hardcoded unrelated-domain rejection,
  not something to work around).
- `PROM23_RUNTIME_ALLOWED_ORIGINS`: JSON array, 1-10 entries, each an exact
  HTTPS origin (`new URL(origin).origin === origin`), and the array **must
  include** the URL's own origin.
- `PROM23_RUNTIME_KEY_FILE`: must be a string starting with `/` (absolute).
  The actual file is checked later by `readKey()` at call time: regular
  file opened `O_NOFOLLOW` (rejects symlinks), mode bits `& 0o077 === 0`
  (no group/other access), size ≤ 256 bytes, content matching
  `/^[a-f0-9]{64}$/i` after trim.
- `endpoint.php` (PHP side, `integrations/runtime/endpoint.php:21-24`)
  independently enforces the mirror constraints: `keyFile`/`stateDirectory`
  must resolve outside `siteRoot`, state dir mode `& 0077 === 0`, no
  symlinks, key file ≤ 256 bytes. Both sides must agree — this is why
  `config.private.php.template` and the systemd override must be filled in
  together, from the same `keyFile` path and the same generated key content.
- Passing config validation only reaches
  `{ configured: true, verified: false, code: 'RUNTIME_NOT_VERIFIED' }` —
  "verified" is a separate, not-yet-implemented acceptance test per
  `README.md`. Stage 0 fixes `RUNTIME_NOT_CONFIGURED`; it does not, by
  itself, make any operation live (that's Stage 10's per-operation gate).

## Order of operations

1. Resolve `TARGET_DECISION.md` with the owner.
2. Provision/confirm the isolated Bitrix instance's PHP environment; run
   `ENV_CHECKLIST.md` against it.
3. Create the private state directory outside web-root; run
   `generate-hmac-key.sh <state-dir>/hmac-key` on that host.
4. Fill `config.private.php.template` with real paths (still
   `enabledOperations: []`, `enabledForms: []`, `sourceSecretsReplaced:
   false` — those flip later, per-stage) and deploy it to the private path
   outside `siteRoot`.
5. Fill and install `systemd-override.conf.example` on the BFF host,
   pointing `PROM23_RUNTIME_KEY_FILE` at the exact same key file from step 3
   and `PROM23_RUNTIME_URL`/`sourceOrigin` at matching values.
6. Confirm `readiness()` now reports `configured: true` (still
   `verified: false` — that's expected and correct at this stage).
