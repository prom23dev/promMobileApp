# Stage 0 — integration host environment checklist

Source of requirements: `integrations/runtime/README.md` ("PHP requires PDO
SQLite, OpenSSL, mbstring, cURL, DOM/libxml, fileinfo; ZIP is required for
office attachments and configured ffprobe for video validation").

Run these on the **integration host** (the isolated Bitrix instance's PHP
environment — not this workstation, not prom-stage's Node preview box, which
doesn't run PHP at all).

## Required PHP extensions

| Requirement | Check command | Needed for |
|---|---|---|
| PHP CLI itself | `php -v` | baseline; also confirms CLI matches the FPM/web SAPI version |
| PDO SQLite | `php -m \| grep -i pdo_sqlite` | nonce store / idempotency records in `stateDirectory` |
| OpenSSL | `php -m \| grep -i openssl` | HMAC verification, TLS |
| mbstring | `php -m \| grep -i mbstring` | UTF-8 string handling in drivers |
| cURL | `php -m \| grep -i curl` | outbound calls to CDEK/Yandex/DaData/PSP providers |
| DOM / libxml | `php -m \| grep -iE 'dom\|libxml'` | XML parsing (delivery provider responses, etc.) |
| fileinfo | `php -m \| grep -i fileinfo` | MIME-type validation on uploads |
| ZIP | `php -m \| grep -i zip` | office-document attachments (procurement/document requests) |

One-shot version (prints all at once):

```bash
php -v
php -m | grep -iE '^(pdo_sqlite|openssl|mbstring|curl|dom|libxml|fileinfo|zip)$'
```

Compare the second command's output against the 8-line list above — anything
missing from the grep output is a missing extension, not just an unusual
build. Install via the host's package manager (e.g.
`apt install php-sqlite3 php-curl php-mbstring php-xml php-zip`) — exact
package names vary by distro/PHP version.

## ffprobe (video validation for media/review uploads)

Not a PHP extension — an external binary, path configured via
`config.php`'s `ffprobePath`.

```bash
which ffprobe && ffprobe -version
```

If missing: install `ffmpeg` (provides `ffprobe`) via the host's package
manager. Record the absolute path from `which ffprobe` into
`config.private.php.template`'s `ffprobePath` placeholder.

## Isolated-instance sanity checks (not modules, but Stage 0 prerequisites)

- [ ] Confirm this PHP environment is **not** the production `prom23.ru`
      environment (see `TARGET_DECISION.md` — this must be settled before
      any of the above is installed for real).
- [ ] Confirm `stateDirectory` (the private dir for `keyFile` + nonce store)
      is outside the PHP web-server's document root and outside `siteRoot`.
- [ ] Confirm the PHP-FPM/web-server user can read `stateDirectory` and
      `keyFile` (mode 0600, owned by that user or a group it belongs to) —
      `readKey()` in `runtime-client.mjs` rejects anything with group/other
      bits set (`stat.mode & 0o077 !== 0`), and `endpoint.php` presumably
      enforces the same on the PHP side; don't loosen permissions to "fix"
      a read failure — fix ownership instead.
- [ ] Confirm PHP's `open_basedir` (if set) includes both `siteRoot` and
      `stateDirectory` — a restrictive `open_basedir` that only covers the
      web root will silently break `keyFile`/nonce-store access.

## Not yet checked (needs the isolated instance to exist first)

This checklist can be run today against any candidate host, but Stage 0's
actual blocker is that no isolated Bitrix instance exists yet — see
`TARGET_DECISION.md`. Nothing above requires touching prod; do not run any
of this against `prom23.ru` directly.
