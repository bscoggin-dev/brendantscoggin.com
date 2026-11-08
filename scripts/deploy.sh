#!/usr/bin/env bash
# Deploy the static site to the "brendantscoggin-site" Worker (Cloudflare static assets).
#
# The upload is an export of the COMMITTED files (git archive HEAD), minus the two files GitHub
# Pages never served (.gitignore, CNAME) and this deploy tooling. That keeps the upload equal to
# what Pages served: no node_modules, .git history, scratch folders or uncommitted edits.
#
# URL shape: wrangler.jsonc sets html_handling "none" (exact paths only), so /resume.html answers
# 200 with no redirect, as on GitHub Pages. The extension-less and directory forms Pages also
# answered (/resume, /tools/mac-maid/, /) are added here as rewrite rules in a generated
# _redirects file inside the export, built from the committed .html files.
#
# Needs a Cloudflare login first:  npx wrangler login
# usage: scripts/deploy.sh [extra wrangler deploy flags, e.g. --dry-run]
set -euo pipefail
cd "$(dirname "$0")/.."

# The contact form's Turnstile sitekey must be the real one before anything ships.
if git show HEAD:contact.html 2>/dev/null | grep -q 'data-sitekey="SET-AT-GO-LIVE"'; then
  echo "contact.html still has the placeholder Turnstile sitekey; not deploying." >&2
  exit 1
fi

export_dir=$(mktemp -d "${TMPDIR:-/tmp}/cf-site.XXXXXX")
# Worker source, D1 migrations and set-digest are server-side only: wrangler bundles worker/ from
# "main" in wrangler.jsonc, so none of them are uploaded as public files.
git archive HEAD -- . ':(exclude).gitignore' ':(exclude)CNAME' ':(exclude)wrangler.jsonc' \
  ':(exclude)scripts/deploy.sh' ':(exclude)scripts/parity.sh' \
  ':(exclude)worker' ':(exclude)migrations' ':(exclude)scripts/set-digest.sh' | tar -x -C "$export_dir"

expected=$(git ls-files | grep -cvE '^(\.gitignore|CNAME|wrangler\.jsonc|scripts/deploy\.sh|scripts/parity\.sh|scripts/set-digest\.sh)$|^(worker|migrations)/')
actual=$(find "$export_dir" -type f | wc -l | tr -d ' ')
if [ "$expected" != "$actual" ]; then
  echo "Export has $actual files but $expected were expected; not deploying." >&2
  exit 1
fi

{
  echo "/ /index.html 200"
  git ls-files '*.html' | while IFS= read -r f; do
    case "$f" in
      *" "*) echo "Skipping rewrite for path with a space: $f" >&2 ;;
      index.html) echo "/index /index.html 200" ;;
      */index.html) d="/${f%/index.html}"; echo "$d/ /$f 200"; echo "$d/index /$f 200"; echo "$d $d/ 301" ;;
      *) echo "/${f%.html} /$f 200" ;;
    esac
  done
} > "$export_dir/_redirects"
echo "Deploying $actual committed files plus $(wc -l < "$export_dir/_redirects" | tr -d ' ') rewrite rules from $export_dir"

npx --yes wrangler@4.152.0 deploy --assets "$export_dir" "$@"
