# v4 — the editorial redesign

**Snapshot taken:** 2026-08-27, after the redesign, immediately before deploy.
**Supersedes:** v3 (2026-08-27-v3-pre-editorial-live), now deprecated.

## What changed

The home page leads with the work instead of the contact details. The name is set as
Fraunces display type with a ragged second line, the who-i-am opening clause sits beside it
as a narrow body column, and four uniform cards run newest-first below it.

New `work.html` carries all nine cards in the same language. Cards without a photograph get
stroke-only art-deco emblems so every card is the same shape rather than sized by its
content. Card order is chronological, newest first, using the date ranges on the resume.

The working log (`what-im-doing.html`) now renders its 17 entries as cards, two per row,
reading left to right and then down.

Two project sites arrived at `tools/mac-maid/` and `tools/judge-moody/`. They share
`tools/tool.css` and are structurally identical, differentiated by mark and accent — a broom
in amber, scales in slate blue. They deliberately do not look like the portfolio; a tool site
should read as a product, and it links back rather than inheriting.

## Navigation

`who-i-am.html` and `what-ive-done.html` were retired from every nav. Both files stay on
disk: six work cards deep-link into what-ive-done's sections, so it is now the detail layer
behind the grid rather than a browsable page. who-i-am is fully orphaned and reachable only
by direct URL.

Nav is now: home / work i've done / work i'm doing / resume / linkedin.

## What did NOT change

No prose, anywhere. who-i-am and resume are byte-identical to v3 apart from their nav block.
what-ive-done gained exactly one id attribute. The working log's 17 entries are untouched —
that page's content diff is two lines, the grid wrapper opening and closing. Every card
subtitle is existing copy lifted from the page it links to; the year tags are read off the
resume.

## Audience

Hiring readers. This is the first version whose landing page makes an argument rather than
offering contact details: one creative project, two AI builds, and one operations-at-scale
program, above the fold.

## Design

Kept the v3 palette — emerald #10b981 / teal #14b8a6 on #090d16 — and added Fraunces for
display type plus a doubled vertical rhythm. Light mode preserved throughout and verified.

## Verification

A Playwright harness (`scripts/verify.mjs`, `npm run verify`) checks console errors, link and
anchor resolution, styled render, and narrow-width overflow across both colour schemes at
375px and 1440px. All eight pages green at snapshot time.

## What is still unresolved

- mac-maid has no public repo, so its site is describe-only with no install path. Publishing
  it needs a repo extraction with a secrets review of the history.
- The two mac-maid screenshots the spec called for are not captured; they show a real
  filesystem and need review before publishing.
- The AWS certification conflict (who-i-am says Solutions Architect Professional, cv.md says
  Cloud Practitioner) and the film-degree wording ("finishing" vs complete), both carried
  over from v3 and now on pages that are out of the nav.
- versions/ v1 and v2 still render unstyled; they omit a stylesheet.
- Case-study pages do not exist; cards deep-link into existing sections instead.
