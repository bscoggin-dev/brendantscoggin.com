#!/usr/bin/env bash
# Set how often the contact-form digest email can go out, in hours (1-8760).
# usage: scripts/set-digest.sh 24
# Uses your existing `npx wrangler login` session. DRY_RUN=1 prints the command instead of running it.
set -euo pipefail

hours="${1:-}"
if ! [[ "$hours" =~ ^[1-9][0-9]*$ ]] || [ "$hours" -gt 8760 ]; then
  echo "usage: set-digest <hours>   (a whole number from 1 to 8760)" >&2
  exit 1
fi

sql="INSERT INTO settings(key,value) VALUES('digest_interval_hours','$hours') ON CONFLICT(key) DO UPDATE SET value=excluded.value"
cd "$(dirname "$0")/.."
if [ "${DRY_RUN:-}" = "1" ]; then
  echo "npx --yes wrangler@4.152.0 d1 execute contact-form --remote --command \"$sql\""
  exit 0
fi
npx --yes wrangler@4.152.0 d1 execute contact-form --remote --command "$sql" >/dev/null
echo "Digest interval set to $hours hours."
