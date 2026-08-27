# v5 — the tightened hero

**Snapshot taken:** 2026-08-27, after the hero rework, immediately before deploy.
**Supersedes:** v4 (2026-08-27-v4-editorial). Same day — v4 shipped in the morning and
drew peer feedback within hours.

## Why this exists

v4 was reviewed by a friend/coworker of Brendan's on a wide, short laptop window
(~1550x880). Their two screenshots are the source for everything below. The redesign was
sound; its proportions were not, and the failure only showed at a viewport shorter than the
one it was built on.

Three findings, all confirmed by measurement rather than taken on faith:

- The name across two lines consumed 250px of vertical space and left the right half of the
  screen empty, pushing the work cards to y=1221 — a screen and a half down.
- 292px of dead air sat between the contact strip and the work grid. This was never one bad
  value; it was three stacked: 176px of `--space-section`, 64px of eyebrow margin, 32px of
  landing padding, on top of a `min-height: 100vh` that forced a full empty screen whether
  or not the content needed one.
- The asterisk on "Scoggin" pointed at a footnote that partly repeated the body copy
  directly above it — the 15-years claim appeared twice on the same screen.

## What changed

The name is one line. This was never a width constraint: "Brendan Scoggin" fits at up to
185px at desktop widths, and it was set in two spans by hand. The clamp max drops
8.5rem -> 6.5rem so it sits comfortably rather than at the edge, and it holds at one line
down to 390px.

The asterisk is gone. The Google / Google X line is now a sub-line under the body copy,
tightened so it no longer restates the sentence above it.

Vertical rhythm cut at all three sources: `--space-section` 11rem -> 5.5rem, eyebrow margin
4rem -> 2rem, contact strip 4rem -> 2.25rem, and `min-height: 100vh` removed from
`.landing`. `--space-section` is referenced only by `.work-section`, so nothing outside the
home page moved.

The hero grid went from two equal 518px columns to `340px 1fr` with the copy top-aligned,
closing a 218px gap between a 340px photo and its text.

The eyebrow reads **"Work I'm proud of"** — the reviewer's suggested wording, Brendan's call.

`.hero-line` and `.hero-asterisk` were deleted; both went dead with the one-line name.

## Measured result (1550x880, the reviewer's viewport)

| | v4 | v5 |
|---|---|---|
| Page height | 1925px | 1497px |
| Work cards start | y=1221 | y=881 |
| Name block | 250px, 2 lines | 106px, 1 line |
| Contact strip -> cards | 292px | 140px |

The eyebrow now lands on the first screen at that window size.

## Audience

Unchanged from v4: a hiring reader who should meet the work before the contact details.
v5 does not change who the site is for — it removes the scrolling that stood between that
reader and the work.

## Verification

`scripts/verify.mjs` green across all pages, both colour schemes, 375px and 1440px. One line
at 1550 / 1440 / 820 / 390 with no horizontal overflow at any of them.

## What is still unresolved

- **The headshot.** Deliberately untouched at Brendan's instruction — a new photo is coming.
  Two known defects remain: `aspect-ratio: 1/1` with `object-fit: cover` on a 1587x2171
  portrait source discards 27% of the height, cropping the top of the head and the chin;
  and the source is itself an imperfect cutout with a flat grey matte and visible artifacts
  around the hair and the right lens, which reads as a Zoom background. The crop is a
  one-line CSS fix once the photo question is settled. Note the grey field is more
  conspicuous in dark mode than in light.
- mac-maid now HAS a public repo (github.com/bscoggin-dev/mac-maid, published today) and
  its site links to it — this closes the v4 open item. The two mac-maid screenshots the
  original spec called for are still uncaptured.
- The AWS certification conflict (who-i-am says Solutions Architect Professional, cv.md says
  Cloud Practitioner) and the film-degree wording ("finishing" vs complete). Both carried
  from v3, both on pages that are out of the nav.
- versions/ v1 and v2 still render unstyled; they omit a stylesheet. Repair via
  `git show <commit>:brendan_style.css`, never by copying the current CSS.
- No per-project case-study pages; cards still deep-link into existing sections.
