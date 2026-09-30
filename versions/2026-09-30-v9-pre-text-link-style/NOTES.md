# v9 — 2026-09-30 — stylesheet before the site-wide text-link style

**What this is:** `brendan_style.css` exactly as it stood at commit `94573bd` (unchanged since
it was last deployed), cut immediately before a base style for inline text links was added.

**What changed after this snapshot:** plain text links inside paragraphs, list items,
figcaptions and table cells (links with no class of their own) now use the emerald accent
with an underline, teal on hover, in both color schemes. Before, they rendered in the
browser's default dark blue, which was nearly invisible on the dark background (seen on the
08-28 and 09-30 entries of work-im-doing). The rule uses `:where()` so any existing
class-based link style still wins; nav, CTA, skip-link and work-card links are unaffected.

**Audience:** hiring reader, same as v8. Unchanged.

**Revert:** copy this file back over the site root.
