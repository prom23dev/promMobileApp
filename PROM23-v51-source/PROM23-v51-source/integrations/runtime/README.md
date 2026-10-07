# Runtime integration — recovery

`server/integrations/runtime-client.mjs` is a callable server-to-server HTTPS transport.
It does not claim that the shop runtime is connected. Construction and `readiness()`
perform no HTTP requests. Readiness verifies configuration/key-file access only and
always returns `verified:false` until an operation-specific acceptance test exists.

## BFF configuration

- `PROM23_RUNTIME_URL`: exact HTTPS endpoint, no credentials/query/fragment.
- `PROM23_RUNTIME_ALLOWED_ORIGINS`: JSON array of exact HTTPS origins. No wildcard.
- `PROM23_RUNTIME_KEY_FILE`: absolute path outside served files, mode 0600, regular
  file, no symlink; content is a newly generated 64-character hex secret. Both ends
  use the literal trimmed ASCII secret as HMAC key. Never reuse archive credentials.
- Defaults: 8 s timeout, 128 KiB request, 1 MiB response. No automatic retries,
  redirects, cookies, logging of request bodies or provider errors.

Only the BFF can call this adapter. Mobile sends its opaque BFF bearer session;
the BFF passes its SHA-256 `sessionKey`. This is a correlation key, **not proof of
Bitrix authentication**. The remote runtime must maintain its own verified identity
binding, check account revocation and organization membership on every operation.
The transport rejects top-level `actor`, `userId`, `permissions`, `authenticated`.
An organization ID is a requested target, never a permission grant.

```js
const runtime = createRuntimeClient();
const result = await runtime.call('buyer.organizations', { sessionKey });
// { organizations: [{id, name, inn?}] }; the caller validates this DTO.
await runtime.call('order.submit', payload, { idempotencyKey, signal });
```

## Wire protocol

POST JSON:

```json
{
  "protocol": "prom23-runtime-v1",
  "requestId": "48 hex characters; equal to X-Prom23-Nonce",
  "operation": "buyer.organizations",
  "payload": { "sessionKey": "64 hex characters" }
}
```

Optional `idempotencyKey` is included both in the signed JSON and the
`Idempotency-Key` header. The receiver must reject disagreement. A fresh nonce is
transport replay protection; it is **not** the business idempotency key.

Headers: `X-Prom23-Timestamp` (Unix seconds), `X-Prom23-Nonce` (24 random bytes as
hex), `X-Prom23-Signature` (HMAC-SHA256 hex). Canonical signed string:

```text
POST\n<exact path>\n<timestamp>\n<nonce>\n<SHA256(exact UTF-8 body)>
```

The receiver must compare HMAC in constant time, allow <=60 s clock skew, atomically
consume nonce before dispatch, limit request size and rate, and bind writes to a
durable `(sessionKey,operation,idempotencyKey,requestHash)` record. Unknown outcome
must be reconciled against that record before attempting a new mutation.

Response: `{protocol,requestId,operation,data:{...}}`, or the same three correlation
fields with `error:{code}` and a non-2xx status. Raw PHP/provider messages never pass
to the application. The client checks protocol, exact operation/requestId, content
type and streamed body size. Operation-specific BFF code validates the `data` shape.
Safe errors include AUTH_REQUIRED, AUTH_EXPIRED, FORBIDDEN, NOT_FOUND,
VALIDATION_ERROR, INVALID_CODE, CODE_EXPIRED, STALE_CONTEXT, STALE_QUOTE,
IDEMPOTENCY_CONFLICT, RATE_LIMITED, INTEGRATION_UNAVAILABLE. Other errors become a
generic RUNTIME_REJECTED. Timeout has uncertain mutation outcome, never fake success.

## Implemented versus outstanding

Implemented: actual configurable HTTP client, signing, strict URL/key handling,
timeouts/cancellation, correlation, byte limits, no retries, safe errors; isolated
transport tests. Parent-owned BFF buyer/commerce routes consume `runtime.call`.

Recovery implementation now includes `endpoint.php`, `Actor`, `AuthDriver`,
`FormsDriver`, `UploadDriver`, `ProfileDriver`, `OrganizationDriver`, `ServiceDriver`,
`PublicationDriver`, `WorkspaceDriver`, `AccountActionDriver`, `OrderActionDriver`,
`DocumentRequestDriver`, `ProcurementDriver`, `ConsentLedger`, `SubmissionReceipt`
and `CommerceDriver`. Exact form coverage and remaining limitations are recorded in
`docs/parity/runtime-dispatch-coverage.json` and `docs/parity/runtime-forms.md`.

The endpoint restores a private PHP session for the BFF session hash, verifies fresh
account revocation and organization membership, then dispatches an allowlisted
operation. Source wrappers retain actual handlers and their existing events. Direct
model adaptations check result objects where original handlers ignored errors.
Confirmed source acknowledgements are durably recorded; they are not CRM or email
delivery proof. The original archive is never executed by the isolated policy tests.

`config.example.php` is disabled by default. Configure a separate private state
directory and a new key. PHP requires PDO SQLite, OpenSSL, mbstring, cURL, DOM/libxml,
fileinfo; ZIP is required for office attachments and configured ffprobe for video
validation. The actual Bitrix deployment must load its existing modules and replace
embedded provider credentials before setting `sourceSecretsReplaced=true`.
Set `enabledOperations`, `enabledForms`, trusted source origin, canonical consent
versions and provider-specific commerce settings only after isolated integration
acceptance. Neither a configured URL nor a fixture result enables an operation.

Outstanding implementation: delivery provider point/address callbacks, PSP offers,
Split/HTML-only payment handoff, authenticated document download/open, publication
pagination and selective deletion of retained review photos. Full catalog ingestion
and connected Bitrix/provider acceptance are also incomplete. These gaps remain
PARTIAL/MISSING; absent credentials are not their only blocker.

Recorded checks:18/18 Node transport/forms tests; isolated PHP04 lint passed for
all candidate files; IntegrationDrivers26, Procurement44, Profile53, Account13,
Location9 and Commerce45 policy assertions passed. Three SQLite commerce assertions
were explicitly skipped because that isolated PHP process lacks PDO SQLite. This is
not a successful connected Bitrix/Sale/CRM test.

No production calls, forms, emails, SMS, CRM leads/deals, orders or payments were
sent during implementation/tests. No endpoint is enabled by this document.
