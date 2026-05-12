#!/usr/bin/env bash
# =============================================================================
# scripts/check-bundle-secrets.sh
#
# CI guard: verifies that no server-only env value (anything in `.env.local`
# whose key is NOT prefixed `NEXT_PUBLIC_`) leaked into the built client bundle
# under `.next/static/`. Fails the build on any match.
#
# Run after `next build`. Requires `grep` and `bash`.
# =============================================================================
set -euo pipefail

BUNDLE_DIR=".next/static"
ENV_FILE=".env.local"
EXAMPLE_FILE=".env.local.example"

if [[ ! -d "$BUNDLE_DIR" ]]; then
  echo "  $BUNDLE_DIR not found. Run 'npm run build' first."
  exit 1
fi

declare -a SECRET_VALUES=()
declare -a SECRET_NAMES=()

extract_secrets() {
  local file="$1"
  [[ -f "$file" ]] || return 0
  while IFS= read -r line; do
    # Skip blanks and comments.
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    # Match KEY=VALUE.
    [[ "$line" =~ ^([A-Z_][A-Z0-9_]*)=(.*)$ ]] || continue
    local key="${BASH_REMATCH[1]}"
    local value="${BASH_REMATCH[2]}"
    # Strip optional surrounding quotes.
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    # Server-only keys: NOT prefixed NEXT_PUBLIC_.
    [[ "$key" == NEXT_PUBLIC_* ]] && continue
    # Skip empty values / examples / placeholders.
    [[ -z "$value" ]] && continue
    [[ "$value" =~ ^your- ]] && continue
    [[ "$value" =~ ^YOUR_ ]] && continue
    SECRET_VALUES+=("$value")
    SECRET_NAMES+=("$key")
  done < "$file"
}

# Prefer real .env.local; fall back to the example so CI without env still runs
# a sanity check on the example's placeholder names (which should never appear
# as values in a bundle either).
if [[ -f "$ENV_FILE" ]]; then
  extract_secrets "$ENV_FILE"
else
  extract_secrets "$EXAMPLE_FILE"
fi

if [[ ${#SECRET_VALUES[@]} -eq 0 ]]; then
  echo "Nothing to scan: no server-only env values detected."
  exit 0
fi

echo "Scanning $BUNDLE_DIR for ${#SECRET_VALUES[@]} server-only secret(s)..."
EXIT=0
for i in "${!SECRET_VALUES[@]}"; do
  v="${SECRET_VALUES[$i]}"
  n="${SECRET_NAMES[$i]}"
  if grep -r --include='*.js' --include='*.json' --include='*.map' -- "$v" "$BUNDLE_DIR" > /dev/null 2>&1; then
    echo "LEAK: '$n' value found in $BUNDLE_DIR"
    EXIT=1
  fi
done

if [[ $EXIT -eq 0 ]]; then
  echo "No secrets detected in client bundle."
else
  echo ""
  echo "One or more server-only values leaked into the client bundle."
  echo "Check that .env.local server-only vars are NOT referenced in client code."
fi

exit $EXIT
