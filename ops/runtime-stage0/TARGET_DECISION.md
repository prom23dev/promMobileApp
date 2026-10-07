# OPEN QUESTION — which Bitrix instance backs the runtime integration?

**This is not decided by this document. It needs an explicit owner decision
before `siteRoot` in the private config is filled in for real, and before
`generate-hmac-key.sh` is run against a real host.**

Per the runtime-integration plan (Stage 0), the mobile app's
`integrations/runtime/*` drivers need to talk to *some* Bitrix instance. Two
candidates exist today, and both carry real risk:

## Option A — `prom23.ru` (production)

The real, live storefront. Source at
`D:\PHPSTORM\projects\prom23marketplace`.

Risks:
- Any bug in the still-PARTIAL drivers (`CommerceDriver`, `DeliveryDriver`,
  `PaymentDriver`, etc. — see plan Stages 3/7a/7b) would act on **real
  customer orders, real payments, real CRM leads** the moment
  `enabledOperations`/`enabledForms` includes anything. `sourceSecretsReplaced`
  existing as a gate is precisely because embedded credentials in the
  archived code are real provider credentials (CDEK, Yandex Delivery,
  Yandex Geocoder) — pointing at prod without replacing them risks silent
  reuse of production secrets from mobile-side config.
- No isolation between "we're still testing the mobile integration" and
  "this is live for real buyers." A half-finished form (e.g. `quote`/
  `production-request`/`franchise`, which per the plan have **no** confirmed
  Bitrix-side equivalent) could write into structures nobody is watching.
- Rollback is not simple — Bitrix CRM/Sale writes are not easily undone the
  way a code deploy is.

Upside: zero risk of "worked on staging, broke on prod" drift; real region/
delivery/payment mappings are exactly correct because it's the real system.

## Option B — `prom.myfast.space` (staging alias)

Per [[prom-stage-ssh-server]] in project memory: **this is the same physical
host as `prom-stage`** (159.253.19.172), reachable via its IPv6 address
(`2a03:f480:2:7::70`). `prom-stage` currently only runs the mobile app's
Node preview/snapshot BFF (`prom23-preview.service`), not a Bitrix PHP
stack.

Risks:
- Unclear whether `prom.myfast.space` is actually running a *separate*
  Bitrix install with its own database, or whether it's a proxy/alias in
  front of the same prod Bitrix (in which case Option B collapses into
  Option A with extra confusion). **This must be verified on the box itself
  before relying on it** — do not assume "staging" means "isolated data."
  A quick check (Stage 0 prerequisite): confirm the site's DB connection
  target and whether writes there are visible on `prom23.ru`.
- If it does turn out to be a true separate instance, sharing a physical
  host with `prom-stage`'s Node preview service means resource contention
  (`prom23-preview.service` already has `MemoryMax=256M`/`CPUQuota=25%`
  cgroup limits — a Bitrix PHP-FPM stack alongside it needs its own budget)
  and a shared blast radius if the host itself has problems.
- `ProtectSystem=strict` / `InaccessiblePaths=/var/www/fastuser/data/www` in
  `prom23-preview.service` deliberately fences the Node preview process away
  from the web-served tree — adding a Bitrix instance on the same host needs
  its own equally careful path/permission separation, not an assumption that
  "it's already staging so it's fine."

Upside: if genuinely isolated, this is exactly the "isolated Bitrix
instance, not prod" that Stage 0 asks for, and it's already SSH-reachable
infrastructure ([[prom-stage-ssh-server]]) rather than something new to
provision.

## What Stage 0 needs from the owner

1. Confirm whether `prom.myfast.space` has its own Bitrix database/data
   separate from `prom23.ru`, or is the same backend under a different
   hostname.
2. If it's the same backend: decide whether to provision a genuinely new
   isolated instance (e.g. a DB dump restored elsewhere) rather than using
   either `prom23.ru` or `prom.myfast.space` directly.
3. Only after that: fill `siteRoot` in `config.private.php.template` and
   proceed with `generate-hmac-key.sh` against the chosen host.

No isolated-instance decision has been made in this session. Nothing in
`ops/runtime-stage0/` assumes an answer.
