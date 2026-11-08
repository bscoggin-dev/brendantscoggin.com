#!/usr/bin/env bash
# Shell test for scripts/set-digest.sh (dry run only; never touches the database).
set -uo pipefail
cd "$(dirname "$0")/../.."
fail=0

out=$(DRY_RUN=1 bash scripts/set-digest.sh 24) || { echo "FAIL: 24 exited non-zero"; fail=1; }
[[ "$out" == *"'24'"* && "$out" == *"--remote"* ]] || { echo "FAIL: 24 output: $out"; fail=1; }

for bad in 0 -3 abc 1.5 "" 8761 "24; DROP TABLE messages"; do
  if out=$(DRY_RUN=1 bash scripts/set-digest.sh "$bad" 2>/dev/null); then
    echo "FAIL: '$bad' was accepted"; fail=1
  elif [ -n "$out" ]; then
    echo "FAIL: '$bad' printed to stdout: $out"; fail=1
  fi
done

[ "$fail" = 0 ] && echo "set-digest tests: PASS"
exit "$fail"
