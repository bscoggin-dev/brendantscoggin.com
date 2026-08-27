# brendantscoggin.com — Editorial Portfolio Redesign (v3)

**Date:** 2026-08-27
**Status:** Approved design, ready for implementation planning
**Repo:** `~/Desktop/Brendantscoggin.com` → github.com/bscoggin-dev/brendantscoggin.com (GitHub Pages, served from repo root)

> ⚠ This file sits inside the deployed tree and is therefore reachable by direct URL, the
> same as `versions/`. It contains no secrets and no private-repo contents. Keep it that way.

---

## 1. Purpose

Restructure the site around a **work-card grid** and an **editorial hero**, emulating the
layout DNA of ryantibbitts.com, while keeping the site's existing emerald identity. Add a
pattern for **per-tool showcase subsites** modeled on opentowork.tools.

**Explicit constraint from Brendan (2026-08-27):** *no content changes in this pass.* Every
work card is sourced from prose that already exists on the site. The one exception is the
mac-maid tool subsite, which is net-new by definition.

### Success criteria

1. `index.html` leads with an editorial hero and a featured work grid.
2. A visitor can reach every existing page from a card without new prose being written.
3. Site keeps `#090d16` + emerald `#10b981` and its working `prefers-color-scheme: light` variant.
4. `tools/mac-maid/` exists as a self-contained showcase with its own visual identity.
5. Nothing regresses: all five existing pages render correctly in both color schemes.

### Audience

Hiring readers evaluating Brendan for senior program / technical program management roles,
plus a secondary read from people who arrive at a tool subsite first. The card grid exists
to answer "what has this person actually built" above the fold, which the current site does
not do — `index.html` is currently a photo and a contact strip with no hero title.

---

## 2. Reference analysis (verified by screenshot 2026-08-27)

### ryantibbitts.com — what we take

| Element | Observation | Adopt? |
|---|---|---|
| Large serif display face | Headlines set in a high-contrast serif, sans reserved for body | **Yes** |
| Ragged asymmetric hero | "I am / not / a designer*" broken across lines at varying indents | **Yes** |
| Footnote asterisk device | `*` on the headline, resolved in small centered text below | **Yes** |
| Narrow sans body column | Bio set in a ~530px column offset right of the display type | **Yes** |
| Work as full-bleed cards | Rounded panels, giant serif title, one-line sans subtitle | **Yes** |
| Generous vertical rhythm | Roughly double typical section spacing | **Yes** |
| Dark navy monochrome palette | Off-white on `#161c2b` | **No** — keep emerald |
| Numbered process section (01–05) | "define → Iterate" methodology block | **No** — out of scope, no content |
| Contact form | Email form + social row | **No** — existing contact strip stays |

### opentowork.tools — the tool-subsite pattern

Deliberately **not** portfolio-styled. Near-black ground, monospace eyebrow labels, heavy
condensed grotesque headline, amber CTA, small green status dot, numbered content sections,
footer crediting the author with a link back to their personal site.

**The separation is the point.** A tool site reads as a product, not a portfolio page. It
links back to the portfolio; it does not inherit from it.

---

## 3. Architecture

Additive. No file is deleted, no existing page's prose is edited.

```
index.html            MODIFIED  editorial hero + featured work grid (3 cards)
work.html             NEW       full work grid (all cards)
who-i-am.html         UNCHANGED content; inherits restyled shared CSS
what-ive-done.html    MODIFIED  markup only — anchor targets already exist
what-im-doing.html    MODIFIED  markup only — add one id (see §5)
resume.html           UNCHANGED
brendan_style.css     MODIFIED  new display-type + work-card tokens/components
tools/
  mac-maid/
    index.html        NEW       tool subsite
    tool.css          NEW       scoped stylesheet, does NOT import brendan_style.css
versions/
  2026-08-27-v3-pre-editorial-live/  NEW  snapshot of TODAY'S live site (cut FIRST — §7)
  <date>-v4-editorial/               NEW  snapshot of the redesign (cut AFTER it ships)
docs/superpowers/specs/   NEW    this file
```

### Delivery: nothing reaches the live site until Brendan says so

**Requirement from Brendan (2026-08-27):** *"The new files can go into the live repo when I
say so so we don't have to redo DNS."*

All work happens on a feature branch, pushed to the **`dev`** remote
(github.com/bscoggin-dev/brendantscoggin.com_dev, private staging). `origin/main` is not
touched until Brendan gives the word.

```
git checkout -b v3-editorial-redesign
git push dev v3-editorial-redesign        # staging, private
# ...on Brendan's go-ahead only:
git checkout main && git merge v3-editorial-redesign
git push origin main                      # deploys
```

**DNS is never at risk.** The custom domain is bound by the `CNAME` file, which lives on
`origin/main`. Working on a branch and pushing to `dev` leaves `origin/main` — and therefore
`CNAME` and the DNS binding — completely untouched. There is nothing to redo.

### Why subpath, not subdomain

Brendan chose subpath (`/tools/<name>/`). No new domain, no DNS, no second repo, ships in
the same `git push origin main`. The tool still gets a distinct identity through `tool.css`;
only the address is shared. This trades the strongest signal (a dedicated domain like
opentowork.tools) for zero infrastructure cost — the right trade for the first one.

### Style isolation rule

`tools/*/tool.css` must be fully self-contained. It must not `@import` or otherwise depend
on `brendan_style.css`. A future change to the portfolio's palette must not alter a tool
site, and vice versa. This is the mechanism that makes the visual separation durable.

---

## 4. Design language

All changes are token-level additions to the existing `:root` block in `brendan_style.css`.
The light-mode override at line 31 is already token-based, so light mode adapts for free
provided **no new hard-coded colors are introduced**.

### 4.1 Type

Extend the existing Google Fonts `@import` on line 1 to add **Fraunces**:

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap');
```

New token:

```css
--font-display: 'Fraunces', Georgia, 'Times New Roman', serif;
```

**Why Fraunces:** high optical contrast at display sizes gives the editorial weight the
reference gets from its serif, and its variable optical-size axis holds up from 18px labels
to 96px hero type. It also reads closer to Brendan's stated art-deco/classical art direction
than a neutral transitional serif would.

Role assignment — the existing faces keep their jobs:

| Face | Role |
|---|---|
| Fraunces (new) | Hero display type, work-card titles, page `h1` |
| Space Grotesk | Eyebrow labels, nav, small caps — unchanged |
| Inter | All body copy, card subtitles — unchanged |

A single font family is added, not swapped. No existing rule that names Inter or Space
Grotesk changes.

### 4.2 Spacing

Add a vertical rhythm scale and roughly double current section spacing:

```css
--space-section: clamp(6rem, 12vw, 11rem);
--space-block:   clamp(2.5rem, 5vw, 4rem);
```

This is the single change that most produces the reference's premium read. The palette is
not doing that work; the whitespace is.

### 4.3 Emerald placement

Emerald takes the positions where the reference uses off-white accents, so the site reads as
the same family without importing the reference's palette:

- The hero footnote asterisk.
- Work-card hover border — reuses the existing `--border-hover` (already emerald at 0.3).
- Eyebrow labels above section headings.

### 4.4 Preserved

`--bg-dark: #090d16`, `--accent-emerald: #10b981`, `--accent-teal: #14b8a6`, 16px card
radius, glassmorphic card treatment, and the full light-mode variant. The art-deco inline
SVG emblems in `what-im-doing.html` are stroke-only using `var(--accent-emerald)` and
continue to adapt to both schemes with no change.

---

## 5. Work-card system

### Component

One `.work-card` component used by both `index.html` and `work.html`:

- Full-bleed rounded panel, 16px radius, existing glass card background.
- Title in `--font-display`, large.
- One-line subtitle in Inter.
- Optional media (existing files in `media/` only — no new photography).
- Entire card is a link. Hover raises `--border-hover`.

`.work-grid` is the container; single column on mobile, two on desktop.

### Card inventory

Every card points at prose that **already exists**. No new writing.

| # | Title | Links to | Media (existing) |
|---|---|---|---|
| 1 | Slumped Over Man | `what-im-doing.html#entry-2026-08-23` | `slumped-over-man-poster.png`, `slumped-premiere-group-2026.jpg` |
| 2 | Google Shopping Express | `what-ive-done.html#era-express` | `gsx-pallets-freight-2015.jpg`, `packing-stations-2016.jpg`, `fulfillment-floor-2015.jpg` |
| 3 | Judge Moody | `https://github.com/bscoggin-dev/judge-moody` | — |
| 4 | Self driving cars, before they had a name | `what-ive-done.html#era-chauffeur` | Archive.org captures already embedded |
| 5 | Keeping imagery flowing into Earth and Maps | `what-ive-done.html#era-geo` | Archive.org captures already embedded |
| 6 | Sealable Bag Assembly, US 2014/0294322 A1 | `what-ive-done.html#patent-bag-assembly` | — |
| 7 | Wine and agriculture | `what-ive-done.html#era-agriculture` | — |
| 8 | Film and media production | `what-ive-done.html#era-film` | `film-set-2026.jpg`, `film-set-interview-2026.jpg` |

**Featured on `index.html`:** cards 1, 2, 3 — one creative, one operations-at-scale, one
AI build. That mix is the argument the homepage needs to make. `work.html` carries all eight
and is the "see all works" target.

### Required markup change

`what-ive-done.html` already carries the needed anchors: `#era-film`, `#era-express`,
`#era-geo`, `#era-chauffeur`, `#era-agriculture`.

**CORRECTED 2026-08-27.** An earlier draft of this spec claimed `what-im-doing.html` needed a
new anchor for Slumped Over Man. That was wrong. Verified: **every** working-log entry
already carries a date-based id — 17 of them, `id="entry-2026-08-23"` through
`id="entry-2026-05-26"`. The Slumped Over Man entry is `#entry-2026-08-23` (line 35).

Card 1 therefore links to the **existing** `#entry-2026-08-23`. No edit to
`what-im-doing.html` is required, and that file is now UNCHANGED by this work.

Exactly **one** anchor is missing. **It is an attribute-only addition. No text is altered.**

1. **`what-ive-done.html`** — the patent has no anchor of its own. Verified structure: the
   `<h3>Sealable Bag Assembly…</h3>` at line 133 lives inside `div.patent-card` (line 129),
   which is nested **within the `#era-express` section**, not `#era-film`. Add
   `id="patent-bag-assembly"` to that `div.patent-card`.

   Note the nesting is correct as authored — the patent was co-filed while building the
   Google Express packaging program, so it belongs inside that era. Card 6 gets its own
   anchor rather than being moved.

### Card subtitles

Subtitles are one line each and must be drawn from the first sentence of the linked section
rather than newly composed, to honor the no-new-content constraint. Where a first sentence
does not compress to one line, truncate at a clause boundary — do not rewrite.

---

## 6. Tool subsite: mac-maid

### Structure (following opentowork.tools)

1. Fixed header — status dot + `MAC MAID` wordmark, right-side anchor nav.
2. Hero — monospace eyebrow, heavy display headline, plain-language pitch, secondary
   monospace line, primary CTA.
3. `The audit` — what the two domains detect (repo/agent hygiene; filesystem clutter).
4. `The tiers` — Critical >30d / Warning 15–30d / Notice 7–15d / <7d ignored.
5. `The review` — the interactive `/mac-maid` approval flow, and that it never auto-deletes.
6. `How it runs` — monthly launchd schedule, notification paths, read-only detector.
7. Footer — "Built by Brendan Scoggin" linking to `/`.

### Visual identity

Distinct from the portfolio and scoped to `tools/mac-maid/tool.css`:

- Near-black ground, warmer and darker than the portfolio's `#090d16`.
- Monospace for eyebrows, labels, and technical strings.
- Heavy condensed grotesque for the headline.
- A single warm accent for CTAs — deliberately **not** emerald, so the two identities do not
  blur together.
- Small green status dot in the header, matching the reference's device.

### The source-link constraint

**Verified 2026-08-27 via `gh repo list bscoggin-dev`:** the only public repos are
`brendantscoggin.com`, `bscoggin-dev` (profile README), and `judge-moody`. `mac-maid` lives
inside the private `agentic` monorepo.

The opentowork.tools model is GitHub-first — its header and footer both carry a repo link
and open-source transparency is a large part of its pitch. mac-maid cannot offer that today.

**Decision for v1:** ship the site **describe-only**. Carry screenshots of the audit output
and the `/mac-maid` review flow in place of a repo link, and a "source available on request"
line where the reference puts its GitHub CTA. Do not add an install CTA that cannot be
completed.

Extracting mac-maid into its own public repo would require a secrets review of the extracted
history and is **out of scope for this work**. It is the obvious follow-on if Brendan wants
the site to carry a real install path, but it does not block the redesign.

### Screenshots needed

The site needs two images that do not yet exist: a terminal capture of `maid_audit.py`
output, and a capture of the `/mac-maid` review prompt. Both must be reviewed for real
paths and filenames before publishing, since they render Brendan's actual filesystem.

---

## 7. Sequencing

Each step leaves the site shippable. Nothing is half-migrated between steps.

| # | Step | Verification |
|---|---|---|
| 0 | Cut `versions/2026-08-27-v3-pre-editorial-live/` **before any edit** | Snapshot opens and renders **fully styled** offline; `NOTES.md` records design/audience state |
| 1 | CSS: `--font-display`, spacing scale, `.work-card`/`.work-grid` | Existing pages render unchanged in both schemes |
| 2 | `index.html` editorial hero | Hero renders; contact strip intact |
| 3 | Featured work grid on `index.html` (cards 1–3) | Three cards, all links resolve |
| 4 | Add `id="patent-bag-assembly"` to `div.patent-card` in what-ive-done | Anchor scrolls to the patent card |
| 5 | `work.html` with all 8 cards | Every link returns 200 / scrolls correctly |
| 6 | `tools/mac-maid/` | Renders standalone; no style bleed either direction |
| 7 | Full verification pass; cut `<date>-v4-editorial/`; push branch to `dev` | See §8. **Deploy to `origin/main` only on Brendan's explicit go-ahead.** |

### Snapshot rule — corrected

Per Brendan's standing instruction (`site-version-snapshots`), a snapshot is cut **before**
design/audience changes. Step 0 is not optional and not reorderable.

**Two snapshots, named for what each actually contains:**

- **`2026-08-27-v3-pre-editorial-live/`** — cut at step 0, *before* any edit. This is the
  site as it stands today. It is the version being **deprecated**, not replaced-in-place.
- **`<ship-date>-v4-editorial/`** — cut at step 7, *after* the redesign ships.

A snapshot cut before a change must never carry the new design's name. The directory holds
the old site; labelling it `v3-editorial` would put the previous site under the incoming
design's name and corrupt the archive.

### ⚠ Snapshot completeness defect — must be fixed at step 0

**Verified 2026-08-27.** The existing archive does not do what `versions/README.md` claims.

| Snapshot | Has CSS? | Renders? |
|---|---|---|
| `2026-08-13-v0-live-baseline` | yes — own `style.css` | ✅ |
| `2026-08-14-v1-hosted-resume` | **no** | ❌ unstyled |
| `2026-08-17-v2-photos-and-hosted-resume` | **no** | ❌ unstyled |

v1 and v2 contain HTML with `<link rel="stylesheet" href="brendan_style.css">` — a relative
path to a file that is not in the directory. Opened directly, they render as unstyled text.
The archive exists to answer *"what did the site look like"* and for those two versions it
**cannot**.

**Therefore the v3 snapshot must be self-contained.** Copy in, alongside the HTML and
`media/`:

- `brendan_style.css` (**the critical omission** — without it the snapshot is worthless
  the moment the stylesheet changes, which is precisely what this redesign does)
- `favicon.svg`
- `Brendan_Scoggin_Resume.pdf` (`resume.html` links to it)

**Acceptance test for step 0:** open
`versions/2026-08-27-v3-pre-editorial-live/index.html` directly in a browser, with the rest
of the repo ignored, and confirm it renders fully styled in both color schemes. If it
renders unstyled, the snapshot is incomplete and step 1 must not begin.

`NOTES.md` records what changed, why, who the audience was, what was unresolved, and
explicitly that this version is **deprecated as of the v4 editorial redesign**.

---

## 8. Verification

Playwright, run with `node` from `~/career-ops` (playwright is in its `node_modules`, not
global — this is a known gotcha), forcing `colorScheme` explicitly since the default is light.

1. Screenshot all six portfolio pages in **both** `dark` and `light`. Light mode is the
   likely regression site because it depends entirely on the token override at line 31.
2. Confirm zero console errors on every page.
3. Confirm every work-card href resolves — internal anchors scroll to the correct section,
   the judge-moody link reaches GitHub.
4. Confirm `tools/mac-maid/` inherits nothing from `brendan_style.css` and leaks nothing
   back into it.
5. Responsive check at 375px and 1440px; the ragged hero is the element most likely to
   break at narrow widths.

**Deploy — gated.** Verification finishing does **not** authorize a deploy. On completion the
branch sits on the `dev` remote and Brendan is told it is ready. Only on his explicit
go-ahead:

```
git checkout main && git merge v3-editorial-redesign
git push origin main
```

`main` has **no upstream tracking branch**, so a bare `git push` fails — the remote must be
named. Live in roughly one minute. `CNAME` is unmodified, so DNS is untouched.

---

## 9. Out of scope

Recorded so these are not silently absorbed. None of them block the redesign.

- **All prose edits.** Brendan's constraint for this pass.
- Two known content conflicts, untouched and carried forward: `who-i-am.html` claims AWS
  Solutions Architect Professional while `cv.md` says Cloud Practitioner; `what-ive-done.html`
  says the film degree is "finishing" while Brendan confirmed 2026-08-17 it is complete.
  Flagged 08-17, still open, deliberately not addressed here.
- Extracting mac-maid to a public repo (§6).
- The reference's numbered process section and contact form (§2).
- Additional tool subsites beyond mac-maid. The `tools/` pattern is built to be reused, but
  only one instance ships in this work.
- Cleanup of `live_files_21426/` and the 0-byte unreferenced `app.css`.
- **Retroactively repairing the v1 and v2 snapshots.** Both render unstyled for the reason
  in §7. Repair is possible — recover the stylesheet as it existed at those commits with
  `git show <commit>:brendan_style.css` — but it is separate work and does not block this
  redesign. Note the fix is *not* to copy the current stylesheet in; that would render those
  versions in a design they never had, which is worse than leaving them unstyled.
- Per-project case-study pages at `work/<slug>.html`. Cards deep-link into existing pages
  instead. This is the natural next step once there is prose to fill them.

---

## 10. Open questions

None blocking. The four design forks were settled by Brendan on 2026-08-27: reframe existing
content as cards, keep emerald with editorial typography, tool sites as subpaths, mac-maid
first.
