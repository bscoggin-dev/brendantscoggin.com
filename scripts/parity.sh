#!/usr/bin/env bash
# Compare HTTP status and redirect target for every git-tracked path on two hosts.
# usage: scripts/parity.sh https://brendantscoggin.com https://stage.brendantscoggin.com
# Paths checked: each tracked file, its extension-less form for .html files, and the directory
# forms (dir/ and dir) for index.html files. Prints each difference; exits 1 if there are any.
set -uo pipefail
cd "$(dirname "$0")/.."
old=${1:?old base url}; new=${2:?new base url}
old=${old%/}; new=${new%/}

paths() {
  git ls-files | while IFS= read -r f; do
    echo "$f"
    case "$f" in
      */index.html) d=${f%/index.html}; echo "$d/"; echo "$d"; echo "$d/index" ;;
      index.html) echo ""; echo "index" ;;
      *.html) echo "${f%.html}" ;;
    esac
  done | sort -u
}

probe() { # base path -> "status redirect(normalized to a path)"
  local base=$1 p=${2// /%20} out
  out=$(curl -s -o /dev/null --path-as-is -w '%{http_code} %{redirect_url}' "$base/$p")
  echo "${out//$base/BASE}"
}

fail=0; total=0
while IFS= read -r p; do
  total=$((total+1))
  a=$(probe "$old" "$p"); b=$(probe "$new" "$p")
  if [ "$a" != "$b" ]; then echo "DIFF /$p : old=[$a] new=[$b]"; fail=$((fail+1)); fi
done < <(paths)
echo "$total paths checked, $fail difference(s)."
[ "$fail" -eq 0 ]
