#!/usr/bin/env bash
# Stage 0 deliverable: generate a NEW (non-archival) 64-hex-char HMAC key for
# the runtime-client.mjs <-> endpoint.php channel, with correct file mode.
#
# Run this ON THE INTEGRATION HOST (not this workstation), as the user that
# owns the private state directory (e.g. the PHP-FPM/BFF service user).
#
# Usage:
#   ./generate-hmac-key.sh /absolute/private/prom23-runtime/hmac-key
#
# Refuses to overwrite an existing key file (rotation is a separate,
# deliberate act — both sides must be updated atomically, see README below).

set -euo pipefail

target="${1:?usage: generate-hmac-key.sh /absolute/private/prom23-runtime/hmac-key}"

case "$target" in
  /*) ;;
  *) echo "error: target path must be absolute" >&2; exit 1 ;;
esac

if [ -e "$target" ]; then
  echo "error: $target already exists — refusing to overwrite." >&2
  echo "       to rotate, write a new file, update the BFF's" >&2
  echo "       PROM23_RUNTIME_KEY_FILE and endpoint.php's keyFile" >&2
  echo "       together, then remove the old file." >&2
  exit 1
fi

dir="$(dirname "$target")"
if [ ! -d "$dir" ]; then
  echo "error: directory $dir does not exist. Create the private state" >&2
  echo "       directory (outside web-root, outside siteRoot) first." >&2
  exit 1
fi

# 32 random bytes -> 64 hex chars, matches runtime-client.mjs's
# /^[a-f0-9]{64}$/i check and endpoint.php's expected key format.
umask 077
openssl rand -hex 32 > "$target"
chmod 0600 "$target"

# Belt-and-suspenders: verify the format and permissions we just wrote.
key="$(cat "$target")"
if ! printf '%s' "$key" | grep -Eq '^[a-f0-9]{64}$'; then
  echo "error: generated key failed format self-check" >&2
  exit 1
fi
mode="$(stat -c '%a' "$target" 2>/dev/null || stat -f '%Lp' "$target")"
if [ "$mode" != "600" ]; then
  echo "error: $target ended up with mode $mode, expected 600" >&2
  exit 1
fi

echo "OK: wrote 64-hex-char key to $target (mode 600)."
echo "Next steps:"
echo "  1. Set this same absolute path as 'keyFile' in the private PHP config"
echo "     AND as PROM23_RUNTIME_KEY_FILE in the BFF's systemd unit override."
echo "  2. Never copy this file into a web-served directory or a repo."
echo "  3. Never reuse an archived/legacy key found in old Bitrix code."
