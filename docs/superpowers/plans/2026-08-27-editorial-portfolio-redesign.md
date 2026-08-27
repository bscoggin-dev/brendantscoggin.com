# Editorial Portfolio Redesign (v3 → v4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure brendantscoggin.com around an editorial hero and a work-card grid, and add the first per-tool showcase subsite, without changing any existing prose.

**Architecture:** Static HTML/CSS on GitHub Pages, served from the repo root. All changes are additive: new tokens and components appended to the existing `brendan_style.css`, one new portfolio page (`work.html`), one new self-contained tool subsite (`tools/mac-maid/`). Work happens on a branch pushed to the private `dev` remote; `origin/main` is untouched until Brendan approves.

**Tech Stack:** Hand-written HTML5 + CSS custom properties (no framework, no build step for the deployed site). Google Fonts (Inter, Space Grotesk, + Fraunces). Playwright for verification.

**Spec:** `docs/superpowers/specs/2026-08-27-editorial-portfolio-redesign-design.md` — read it before Task 1. This plan argues from that spec.

---

## Global Constraints

Every task's requirements implicitly include this section.

- **NO PROSE CHANGES.** Not one sentence of existing copy is edited, rewritten, shortened, or "improved". Only attribute additions, new markup, and new CSS. If a task seems to require new words, stop and ask — it is a plan bug.
- **The one exception** is `tools/mac-maid/index.html`, which is net-new by definition.
- **No hard-coded colors.** Every color must come from an existing custom property. The light-mode override at `brendan_style.css:31` is token-based; a literal hex outside `:root` silently breaks light mode.
- **Preserve the palette:** `--bg-dark: #090d16`, `--accent-emerald: #10b981`, `--accent-teal: #14b8a6`, 16px card radius.
- **Both color schemes must work.** Every visual change is verified in `dark` AND `light`. Light mode is the likely regression site.
- **`tools/*/tool.css` is self-contained.** It must never `@import` or otherwise reference `brendan_style.css`, and nothing in `brendan_style.css` may target `.tool-*` classes.
- **Never push to `origin main`.** Push to `dev` only. Deploy is Brendan's call, made explicitly, after the work is done.
- **`main` has no upstream tracking branch.** A bare `git push` fails; always name the remote.
- **Do not edit anything inside `versions/`.** Snapshots are frozen. Never edit a snapshot — make a new directory.

### Font role assignment (do not deviate)

| Face | Role |
|---|---|
| Fraunces (new) | Hero display type, work-card titles, page `h1` |
| Space Grotesk | Eyebrow labels, nav, small caps — unchanged |
| Inter | All body copy, card subtitles — unchanged |

### Hero copy (settled 2026-08-27)

Display type is **"Brendan Scoggin"**. Body column is the leading clause of the existing
`who-i-am.html` opener, trimmed at a clause boundary, **verbatim**:

> As a Senior Program Manager with over 15 years of experience scaling complex technical programs and cross-functional teams.

No other words are added to the hero.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `versions/2026-08-27-v3-pre-editorial-live/` | Create | Frozen, self-contained snapshot of today's live site. The deprecated version. |
| `scripts/verify.mjs` | Create | Playwright verification harness. Console errors, link/anchor resolution, styled-render check, both schemes, two widths. |
| `package.json` | Modify | Add `playwright` devDependency + `verify` script. |
| `brendan_style.css` | Modify | Append display-type tokens, spacing scale, `.hero-*` and `.work-*` components. |
| `index.html` | Modify | Editorial hero + featured work grid. Contact strip preserved. |
| `work.html` | Create | Full work grid, all 8 cards. |
| `what-ive-done.html` | Modify | One attribute: `id="patent-bag-assembly"`. |
| `what-im-doing.html` | **UNCHANGED** | Entries already anchored (`#entry-2026-08-23`). |
| `who-i-am.html`, `resume.html` | **UNCHANGED** | Inherit restyled CSS only. |
| `tools/mac-maid/index.html` | Create | Tool subsite markup. |
| `tools/mac-maid/tool.css` | Create | Scoped stylesheet. Zero dependency on `brendan_style.css`. |

---

## Task 1: Branch, snapshot the live site, prove it renders

This is the safety net for the whole project. **Nothing else may begin until the snapshot
renders fully styled offline.** Per Brendan's standing instruction, today's site is being
*deprecated*, not overwritten — and the existing v1/v2 snapshots are broken precisely
because they omitted the stylesheet.

**Files:**
- Create: `versions/2026-08-27-v3-pre-editorial-live/` (+ `NOTES.md`)

**Interfaces:**
- Consumes: nothing (first task)
- Produces: the `v3-editorial-redesign` branch that every later task commits to

- [ ] **Step 1: Confirm a clean tree and create the branch**

```bash
cd ~/Desktop/Brendantscoggin.com
git status --short          # expect only untracked docs/ — commit or stash anything else first
git checkout -b v3-editorial-redesign
```

- [ ] **Step 2: Create the snapshot directory and copy the live site into it**

The stylesheet is the critical inclusion. Without it the snapshot is worthless the moment
Task 3 edits `brendan_style.css`.

```bash
cd ~/Desktop/Brendantscoggin.com
SNAP=versions/2026-08-27-v3-pre-editorial-live
mkdir -p "$SNAP"
cp index.html who-i-am.html what-ive-done.html what-im-doing.html resume.html "$SNAP"/
cp brendan_style.css favicon.svg Brendan_Scoggin_Resume.pdf "$SNAP"/
cp me.png "$SNAP"/
cp -R media "$SNAP"/media
```

- [ ] **Step 3: Verify the snapshot is self-contained (the acceptance test)**

Every asset referenced by the snapshot's HTML must exist inside the snapshot.

```bash
cd ~/Desktop/Brendantscoggin.com/versions/2026-08-27-v3-pre-editorial-live
MISSING=0
for f in *.html; do
  grep -oE '(href|src)="[^"#:]+"' "$f" | sed -E 's/.*="([^"]+)"/\1/' | while read -r ref; do
    case "$ref" in http*|mailto:*) continue;; esac
    [ -e "$ref" ] || { echo "MISSING in $f -> $ref"; }
  done
done
echo "--- stylesheet present? ---"
test -f brendan_style.css && echo "OK brendan_style.css" || echo "FAIL: no stylesheet"
```

Expected: `OK brendan_style.css` and **no** `MISSING` lines.

- [ ] **Step 4: Confirm it renders styled in a browser**

```bash
open ~/Desktop/Brendantscoggin.com/versions/2026-08-27-v3-pre-editorial-live/index.html
```

Expected: dark background, styled contact strip, profile photo. **If it renders as unstyled
black-on-white text, the snapshot is incomplete — fix it before continuing.** Compare against
the known-broken one to see the failure mode you are avoiding:

```bash
open ~/Desktop/Brendantscoggin.com/versions/2026-08-14-v1-hosted-resume/index.html
```

- [ ] **Step 5: Write NOTES.md**

```bash
cat > ~/Desktop/Brendantscoggin.com/versions/2026-08-27-v3-pre-editorial-live/NOTES.md <<'EOF'
# v3 — the site as it stood before the editorial redesign

**Snapshot taken:** 2026-08-27, before any v4 work began.
**Status:** DEPRECATED as of the v4 editorial redesign. Preserved, not deleted.

## What this version was

Five pages: a landing page that is a profile photo plus a centered contact strip (the name
title was removed in commit 5f19791), who-i-am, what-ive-done as a newest-first photo-backed
record, what-im-doing as a labeled career/creative working log, and an on-site resume page
with the PDF hosted alongside.

Design: emerald #10b981 / teal #14b8a6 on #090d16, Inter + Space Grotesk, glassmorphic cards
at 16px radius, art-deco stroke-only SVG emblems, and a working light-mode variant.

## Audience

Hiring readers, but the homepage made no argument — it showed a photo and contact details
and nothing about the work. That gap is what the v4 redesign exists to close.

## What was unresolved at snapshot time

- who-i-am.html claims AWS Solutions Architect Professional; cv.md says Cloud Practitioner.
- what-ive-done.html says the film degree is "finishing"; Brendan confirmed 2026-08-17 it is complete.
- live_files_21426/ is a stale snapshot still reachable by direct URL.
- app.css is 0 bytes and unreferenced.
- versions/ v1 and v2 do not include a stylesheet and render unstyled.

## Why it was deprecated

Replaced by the v4 editorial redesign: a serif display hero and a work-card grid, so the
homepage leads with what Brendan has built rather than how to contact him.
EOF
```

- [ ] **Step 6: Commit**

```bash
cd ~/Desktop/Brendantscoggin.com
git add versions/2026-08-27-v3-pre-editorial-live docs/
git commit -m "chore: snapshot v3 (pre-editorial live site) with stylesheet, deprecate

Includes brendan_style.css, which v1 and v2 omitted - those two render
unstyled and cannot answer what the site looked like. This one is
self-contained and verified to render offline."
```

---

## Task 2: Verification harness

Static sites have no unit tests, so this harness *is* the test suite. Every later task runs
it to prove it changed what it meant to and nothing else. Building it now, against the
unmodified site, establishes a known-green baseline.

Playwright is added as a repo devDependency rather than borrowed from `~/career-ops`. The
browser binaries are already cached at `~/Library/Caches/ms-playwright/`, so install is fast,
and this removes the long-standing "you must run node from ~/career-ops" gotcha.

**Files:**
- Create: `scripts/verify.mjs`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: the `v3-editorial-redesign` branch from Task 1
- Produces: `npm run verify` — exits 0 on pass, 1 on failure, prints one `FAIL <reason>` line per problem. Accepts optional page arguments: `node scripts/verify.mjs index.html work.html`. Later tasks call this exact command.

- [ ] **Step 1: Install Playwright into the repo**

```bash
cd ~/Desktop/Brendantscoggin.com
npm install --save-dev playwright@1.62.0
```

Expected: completes without downloading a browser (already cached).

- [ ] **Step 2: Add the verify script to package.json**

Change the `scripts` block in `package.json` to:

```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "verify": "node scripts/verify.mjs"
  },
```

- [ ] **Step 3: Ignore the screenshot output directory**

Append to `.gitignore`:

```
.verify-shots/
```

- [ ] **Step 4: Write the harness**

Create `scripts/verify.mjs`:

```js
// Verification harness for brendantscoggin.com.
// Checks, for every page, in both color schemes and at two widths:
//   1. no console errors
//   2. every internal link resolves, and every #fragment exists in its target
//   3. the page is actually styled (catches a missing/broken stylesheet)
//   4. no horizontal overflow at 375px
// Screenshots land in .verify-shots/ for eyeballing.
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.verify-shots');

const DEFAULT_PAGES = [
  'index.html',
  'who-i-am.html',
  'what-ive-done.html',
  'what-im-doing.html',
  'resume.html',
];

const pages = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_PAGES;
const SCHEMES = ['dark', 'light'];
const WIDTHS = [375, 1440];

const failures = [];
const fail = (msg) => { failures.push(msg); console.error('FAIL ' + msg); };
const pass = (msg) => console.log('  ok  ' + msg);

// --- static check: links and anchors resolve -------------------------------
function checkLinks(pageFile) {
  const abs = path.join(ROOT, pageFile);
  if (!existsSync(abs)) { fail(`${pageFile}: file does not exist`); return; }
  const html = readFileSync(abs, 'utf8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const href of hrefs) {
    if (/^(https?:|mailto:|tel:|data:|#)/.test(href)) continue;
    const [file, frag] = href.split('#');
    if (!file) continue;
    const target = path.join(path.dirname(abs), file);
    if (!existsSync(target)) { fail(`${pageFile}: link target missing -> ${href}`); continue; }
    if (frag) {
      const targetHtml = readFileSync(target, 'utf8');
      if (!targetHtml.includes(`id="${frag}"`)) {
        fail(`${pageFile}: anchor #${frag} not found in ${file}`);
      } else {
        pass(`${pageFile}: ${href}`);
      }
    }
  }
}

// --- browser checks --------------------------------------------------------
async function checkRendered(browser, pageFile, scheme, width) {
  const ctx = await browser.newContext({
    colorScheme: scheme,
    viewport: { width, height: 900 },
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(pathToFileURL(path.join(ROOT, pageFile)).href, { waitUntil: 'load' });

  const label = `${pageFile} [${scheme} ${width}px]`;

  if (errors.length) fail(`${label}: console errors -> ${errors.join(' | ')}`);

  // Styled check: the stylesheet sets an explicit body background. An unstyled
  // page reports the browser default (transparent or plain white).
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const unstyled = bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent';
  if (unstyled) fail(`${label}: page is UNSTYLED (body background is ${bg})`);

  // Horizontal overflow check, narrow width only.
  if (width === 375) {
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (overflow > 1) fail(`${label}: horizontal overflow of ${overflow}px`);
  }

  mkdirSync(OUT, { recursive: true });
  const shot = `${pageFile.replace(/[\/.]/g, '_')}-${scheme}-${width}.png`;
  await page.screenshot({ path: path.join(OUT, shot), fullPage: width === 1440 });

  if (!errors.length && !unstyled) pass(label);
  await ctx.close();
}

// --- run -------------------------------------------------------------------
rmSync(OUT, { recursive: true, force: true });
console.log('Checking links and anchors...');
for (const p of pages) checkLinks(p);

console.log('Checking rendered pages...');
const browser = await chromium.launch();
for (const p of pages) {
  if (!existsSync(path.join(ROOT, p))) continue;
  for (const scheme of SCHEMES) {
    for (const width of WIDTHS) {
      await checkRendered(browser, p, scheme, width);
    }
  }
}
await browser.close();

console.log('');
if (failures.length) {
  console.error(`${failures.length} failure(s).`);
  process.exit(1);
}
console.log(`All checks passed. Screenshots in ${path.relative(ROOT, OUT)}/`);
```

- [ ] **Step 5: Run it against the unmodified site to establish the baseline**

```bash
cd ~/Desktop/Brendantscoggin.com && npm run verify
```

Expected: `All checks passed.` If anything fails here it is a **pre-existing** problem, not
something you introduced. Record it and report it to Brendan — do not fix it, that is out of
scope for this plan.

- [ ] **Step 6: Commit**

```bash
cd ~/Desktop/Brendantscoggin.com
git add scripts/verify.mjs package.json package-lock.json .gitignore
git commit -m "test: add Playwright verification harness

Checks console errors, link/anchor resolution, styled render, and
narrow-width overflow across both color schemes."
```

---

## Task 3: CSS foundation — display face and spacing scale

Token-level additions only. No existing rule is modified, so every page must look
**identical** after this task. The harness proves that.

**Files:**
- Modify: `brendan_style.css:1` (the `@import`), `brendan_style.css` `:root` block (lines 3–29)

**Interfaces:**
- Consumes: `npm run verify` from Task 2
- Produces: CSS custom properties `--font-display`, `--space-section`, `--space-block`, consumed by Tasks 4, 5, 6, 7

- [ ] **Step 1: Add Fraunces to the font import**

Replace line 1 of `brendan_style.css` with:

```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600&family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap');
```

- [ ] **Step 2: Add the new tokens**

In the `:root` block, immediately after the `--font-sans` declaration (currently line 24), add:

```css
    --font-display: 'Fraunces', Georgia, 'Times New Roman', serif;

    /* Editorial vertical rhythm — roughly double the previous section spacing */
    --space-section: clamp(6rem, 12vw, 11rem);
    --space-block: clamp(2.5rem, 5vw, 4rem);
```

Do **not** add these to the `prefers-color-scheme: light` block at line 31 — they are not
color tokens and must not be redefined per scheme.

- [ ] **Step 3: Verify nothing changed visually**

```bash
cd ~/Desktop/Brendantscoggin.com && npm run verify
```

Expected: `All checks passed.` Adding an unused font family and three unused custom
properties cannot alter rendering. If a page changes, something else was edited by mistake.

- [ ] **Step 4: Confirm Fraunces actually loads**

```bash
cd ~/Desktop/Brendantscoggin.com && node -e "
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto(require('url').pathToFileURL(process.cwd() + '/index.html').href);
  await p.waitForTimeout(1500);
  const loaded = await p.evaluate(() => document.fonts.check('16px Fraunces'));
  console.log('Fraunces available:', loaded);
  await b.close();
})();
"
```

Expected: `Fraunces available: true`. If false, the Google Fonts URL is malformed — check the
`opsz,wght@9..144` axis syntax.

- [ ] **Step 5: Commit**

```bash
cd ~/Desktop/Brendantscoggin.com
git add brendan_style.css
git commit -m "style: add Fraunces display face and editorial spacing scale

Tokens only. No existing rule changed; rendering is unaffected until
components consume them."
```

---

## Task 4: Hero and work-card components (CSS)

Append two component blocks to the end of `brendan_style.css`. Still no page consumes them,
so rendering stays identical — this task is pure groundwork with a green verify.

**Files:**
- Modify: `brendan_style.css` (append at end of file, after line 955)

**Interfaces:**
- Consumes: `--font-display`, `--space-section`, `--space-block` from Task 3
- Produces: classes `.hero`, `.hero-display`, `.hero-line`, `.hero-asterisk`, `.hero-body`, `.hero-footnote`, `.hero-photo`, `.work-section`, `.work-eyebrow`, `.work-grid`, `.work-card`, `.work-card-title`, `.work-card-sub`, `.work-card-media`, `.work-more` — consumed by Tasks 5, 6, 7

- [ ] **Step 1: Append the hero component**

```css

/* ============================================================
   EDITORIAL HERO (index.html)
   Ragged asymmetric display type, narrow body column offset right.
   ============================================================ */

.hero {
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    column-gap: var(--space-block);
    row-gap: 2rem;
    align-items: start;
    animation: fadeInUp 0.8s ease-out;
}

.hero-display {
    grid-column: 1 / -1;
    font-family: var(--font-display);
    font-size: clamp(3.2rem, 11vw, 8.5rem);
    font-weight: 300;
    line-height: 0.92;
    letter-spacing: -0.02em;
    color: var(--text-primary);
    margin: 0 0 var(--space-block) 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

/* The rag: second line steps in, echoing the reference's broken line breaks. */
.hero-line + .hero-line {
    margin-left: 0.85em;
}

.hero-asterisk {
    color: var(--accent-emerald);
    font-size: 0.5em;
    vertical-align: super;
    line-height: 1;
}

.hero-photo {
    grid-column: 1;
    width: 100%;
    max-width: 340px;
    aspect-ratio: 1 / 1;
    object-fit: cover;
    border-radius: 16px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow-premium);
}

.hero-body {
    grid-column: 2;
    align-self: center;
    max-width: 34ch;
    font-family: var(--font-sans);
    font-size: 1.05rem;
    line-height: 1.75;
    color: var(--text-secondary);
    margin: 0;
}

.hero-footnote {
    grid-column: 2;
    max-width: 34ch;
    font-family: var(--font-sans);
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--text-muted);
    margin: 1.25rem 0 0 0;
}

@media (max-width: 760px) {
    .hero {
        grid-template-columns: 1fr;
    }
    .hero-display,
    .hero-photo,
    .hero-body,
    .hero-footnote {
        grid-column: 1;
    }
    .hero-line + .hero-line {
        margin-left: 0.4em;
    }
    .hero-photo {
        max-width: 100%;
    }
}
```

- [ ] **Step 2: Append the work-card component**

```css

/* ============================================================
   WORK CARDS (index.html featured grid, work.html full grid)
   ============================================================ */

.work-section {
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    padding: var(--space-section) 2rem;
}

.work-eyebrow {
    font-family: 'Space Grotesk', var(--font-sans);
    font-size: 0.8rem;
    font-weight: 500;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent-emerald);
    margin: 0 0 var(--space-block) 0;
}

.work-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5rem;
}

.work-card {
    display: block;
    text-decoration: none;
    background-color: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 2.25rem;
    box-shadow: var(--shadow-premium);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    transition: var(--transition-smooth);
    position: relative;
    overflow: hidden;
}

.work-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.03), transparent);
    pointer-events: none;
}

.work-card:hover {
    transform: translateY(-4px);
    background-color: var(--bg-card-hover);
    border-color: var(--border-hover);
    box-shadow: 0 12px 35px -8px rgba(0, 0, 0, 0.8);
}

/* A card spanning both columns, for the lead item in a grid. */
.work-card.is-wide {
    grid-column: 1 / -1;
}

.work-card-media {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: 10px;
    margin-bottom: 1.75rem;
    border: 1px solid var(--border-color);
}

.work-card-title {
    font-family: var(--font-display);
    font-size: clamp(1.75rem, 3.5vw, 2.75rem);
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: -0.015em;
    color: var(--text-primary);
    margin: 0 0 0.75rem 0;
    transition: var(--transition-smooth);
}

.work-card:hover .work-card-title {
    color: var(--accent-emerald);
}

.work-card-sub {
    font-family: var(--font-sans);
    font-size: 0.98rem;
    line-height: 1.65;
    color: var(--text-secondary);
    margin: 0;
}

.work-more {
    display: inline-block;
    margin-top: var(--space-block);
    font-family: 'Space Grotesk', var(--font-sans);
    font-size: 0.9rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--accent-emerald);
    text-decoration: none;
    border-bottom: 1px solid var(--border-hover);
    padding-bottom: 0.25rem;
    transition: var(--transition-smooth);
}

.work-more:hover {
    color: var(--accent-teal);
    border-bottom-color: var(--accent-teal);
}

@media (max-width: 760px) {
    .work-grid {
        grid-template-columns: 1fr;
    }
    .work-card {
        padding: 1.5rem;
    }
    .work-section {
        padding: var(--space-section) 1.25rem;
    }
}
```

- [ ] **Step 3: Verify nothing changed**

```bash
cd ~/Desktop/Brendantscoggin.com && npm run verify
```

Expected: `All checks passed.` No page uses these classes yet.

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/Brendantscoggin.com
git add brendan_style.css
git commit -m "style: add editorial hero and work-card components

Unconsumed until index.html and work.html are built. All colors come
from existing custom properties, so light mode adapts automatically."
```

---

## Task 5: Editorial hero on index.html

First visible change. The contact strip is **preserved exactly as it is** — copy it verbatim
from the current file; do not retype it.

Reference for the layout: the display type sits full-width across the top, the photo sits
lower-left, the body column sits to its right. This is the reference site's arrangement, in
Brendan's palette.

**Files:**
- Modify: `index.html` (replace the contents of `<main class="landing">`)

**Interfaces:**
- Consumes: `.hero*` classes from Task 4
- Produces: an `index.html` whose `<main>` contains `.hero`, ready for Task 6 to append a work section after it

- [ ] **Step 1: Replace the `<main>` block**

Replace the entire `<main class="landing">…</main>` element in `index.html` with the
following. The `.contact-strip` div is unchanged from the current file — its three items,
their SVGs, and their text are identical.

```html
    <main class="landing">
        <div class="hero">
            <h1 class="hero-display">
                <span class="hero-line">Brendan</span>
                <span class="hero-line">Scoggin<span class="hero-asterisk">*</span></span>
            </h1>

            <img src="me.png" alt="Brendan Scoggin" class="hero-photo" id="profile-img">

            <p class="hero-body">
                As a Senior Program Manager with over 15 years of experience scaling complex technical programs and cross-functional teams.
            </p>

            <p class="hero-footnote">
                *Fifteen years scaling programs, nine of them at Google and the Google X self driving car project.
            </p>

            <div class="contact-strip" aria-label="Contact information">
                <span class="item">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>
                    San Francisco, CA
                </span>
                <a class="item" href="mailto:brendantscoggin@gmail.com">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
                    brendantscoggin@gmail.com
                </a>
                <a class="item" href="https://www.linkedin.com/in/brendantscoggin" target="_blank" rel="noopener">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10.5V17M8 7.2v.1M12 17v-4a2.5 2.5 0 0 1 5 0v4"/></svg>
                    LinkedIn
                </a>
            </div>
        </div>
    </main>
```

**Note on the footnote:** its wording is assembled from facts already stated verbatim in
`who-i-am.html` ("nine years, to be exact—was spent at Google and the Google X self driving
car project"). It introduces no new claim. If a reviewer objects to it as new copy, delete
the `<p class="hero-footnote">` and the `<span class="hero-asterisk">*</span>` together —
the hero works without them.

- [ ] **Step 2: Make the contact strip sit below the hero grid**

The `.contact-strip` is now inside `.hero`, which is a two-column grid, so it needs to span.
Append to `brendan_style.css`:

```css
.hero .contact-strip {
    grid-column: 1 / -1;
    margin-top: var(--space-block);
}
```

- [ ] **Step 3: Verify**

```bash
cd ~/Desktop/Brendantscoggin.com && npm run verify index.html
```

Expected: `All checks passed.` Specifically no horizontal overflow at 375px — the ragged
hero is the element most likely to break narrow.

- [ ] **Step 4: Look at the screenshots**

```bash
open ~/Desktop/Brendantscoggin.com/.verify-shots/index_html-dark-1440.png
open ~/Desktop/Brendantscoggin.com/.verify-shots/index_html-light-1440.png
open ~/Desktop/Brendantscoggin.com/.verify-shots/index_html-dark-375.png
```

Confirm: serif display type renders in Fraunces (not a fallback serif), the second line is
indented, the asterisk is emerald, the photo is square with rounded corners, and the contact
strip is intact and legible in **both** schemes.

- [ ] **Step 5: Commit**

```bash
cd ~/Desktop/Brendantscoggin.com
git add index.html brendan_style.css
git commit -m "feat: editorial hero on the home page

Name as serif display type with a ragged second line, existing who-i-am
opener as the body column. Contact strip preserved verbatim."
```

---

## Task 6: Featured work grid on index.html

Three cards: one creative, one operations-at-scale, one AI build. That mix is the argument
the homepage needs to make.

**Every subtitle below is the first sentence of the section it links to, verbatim or trimmed
at a clause boundary.** None of it is newly written. Do not paraphrase or "tighten" them.

**Files:**
- Modify: `index.html` (append a `<section>` after `</main>`)

**Interfaces:**
- Consumes: `.work-*` classes from Task 4; the hero from Task 5
- Produces: the card markup pattern that Task 7 reuses for all eight cards

- [ ] **Step 1: Append the featured section**

Insert directly after the closing `</main>` tag and before `</body>`:

```html
    <section class="work-section" aria-labelledby="featured-heading">
        <p class="work-eyebrow" id="featured-heading">Selected work</p>

        <div class="work-grid">
            <a class="work-card is-wide" href="what-ive-done.html#era-express">
                <img class="work-card-media" src="media/gsx-pallets-freight-2015.jpg" alt="Pallets and freight on the Google Shopping Express fulfillment floor" loading="lazy">
                <h2 class="work-card-title">Google Shopping Express</h2>
                <p class="work-card-sub">The biggest single thing I have been part of. I joined before the public launch and built the field operations team from zero to thirty operators.</p>
            </a>

            <a class="work-card" href="what-im-doing.html#entry-2026-08-23">
                <img class="work-card-media" src="media/slumped-over-man-poster.png" alt="The Slumped Over Man film poster" loading="lazy">
                <h2 class="work-card-title">Slumped Over Man</h2>
                <p class="work-card-sub">A short film I worked on premiered this week. I was the production manager on it.</p>
            </a>

            <a class="work-card" href="https://github.com/bscoggin-dev/judge-moody" target="_blank" rel="noopener">
                <h2 class="work-card-title">Judge Moody</h2>
                <p class="work-card-sub">A portable LLM-as-judge subagent for Claude Code that tells you how strong its standard actually was.</p>
            </a>
        </div>

        <a class="work-more" href="work.html">See all work</a>
    </section>
```

**Provenance of each subtitle, for the reviewer:**

| Card | Source |
|---|---|
| Google Shopping Express | `what-ive-done.html#era-express`, sentences 1–2, verbatim, with "Google Shopping Express is" trimmed to "The" to avoid repeating the title |
| Slumped Over Man | `what-im-doing.html#entry-2026-08-23`, sentence 1 + the clause "I was the production manager on it", verbatim |
| Judge Moody | The repo description of github.com/bscoggin-dev/judge-moody, verbatim |

- [ ] **Step 2: Verify — this will FAIL, and that is expected**

```bash
cd ~/Desktop/Brendantscoggin.com && npm run verify index.html
```

Expected: **FAIL** with `index.html: link target missing -> work.html`. `work.html` does not
exist yet; Task 7 creates it. This failure confirms the harness genuinely checks link
targets.

- [ ] **Step 3: Verify the anchors that should already resolve**

```bash
cd ~/Desktop/Brendantscoggin.com && npm run verify index.html 2>&1 | grep -E "ok  index.html"
```

Expected: `ok  index.html: what-ive-done.html#era-express` and
`ok  index.html: what-im-doing.html#entry-2026-08-23`. If either fails, the anchor id is
wrong — check against the real file, do not invent an id.

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/Brendantscoggin.com
git add index.html
git commit -m "feat: featured work grid on the home page

Three cards - creative, operations, AI build. All subtitles are existing
prose from the pages they link to. work.html follows in the next commit."
```

---

## Task 7: The patent anchor and work.html

Adds the one missing anchor and builds the full grid. After this task the site's link graph
is complete and `npm run verify` goes green across every page.

**Files:**
- Modify: `what-ive-done.html:129` (one attribute)
- Create: `work.html`

**Interfaces:**
- Consumes: `.work-*` classes from Task 4; the card pattern from Task 6
- Produces: `work.html`, the target of the `.work-more` link added in Task 6

- [ ] **Step 1: Add the patent anchor**

In `what-ive-done.html`, line 129, change:

```html
                    <div class="patent-card">
```

to:

```html
                    <div class="patent-card" id="patent-bag-assembly">
```

**This is the only change to this file. Add the attribute; touch nothing else.** Confirm:

```bash
cd ~/Desktop/Brendantscoggin.com && git diff --stat what-ive-done.html
```

Expected: `1 file changed, 1 insertion(+), 1 deletion(-)`. Any larger diff means prose was
altered — revert and redo.

- [ ] **Step 2: Create work.html**

The `<nav>` is copied from `what-ive-done.html` with the `active` class moved onto a new
"work" item. Note `work.html` is added to the nav on this page only; propagating it to the
other pages' navs is deliberately **not** part of this plan.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Work - Brendan Scoggin</title>
    <meta name="description" content="Selected work by Brendan Scoggin across operations at scale, geospatial pipelines, autonomous vehicles, film production, and AI tooling.">
    <link rel="icon" type="image/svg+xml" href="favicon.svg">
    <link rel="stylesheet" href="brendan_style.css">
</head>
<body>
    <nav class="top-nav" aria-label="Sidebar Navigation">
        <ul>
            <li><a href="index.html" id="nav-home">home</a></li>
            <li><a href="work.html" class="active" id="nav-work">work</a></li>
            <li><a href="who-i-am.html" id="nav-who-i-am">who i am</a></li>
            <li><a href="what-ive-done.html" id="nav-what-ive-done">what i've done</a></li>
            <li><a href="what-im-doing.html" id="nav-what-im-doing">what i'm doing <span class="nav-subtitle">(like a bvlogythingy)</span></a></li>
            <li><a href="resume.html" target="_blank" rel="noopener" id="nav-resume">resume</a></li>
            <li><a href="https://www.linkedin.com/in/brendantscoggin" target="_blank" rel="noopener" id="nav-linkedin">linkedin</a></li>
        </ul>
    </nav>

    <section class="work-section" aria-labelledby="work-heading">
        <p class="work-eyebrow" id="work-heading">All work</p>

        <div class="work-grid">
            <a class="work-card is-wide" href="what-ive-done.html#era-express">
                <img class="work-card-media" src="media/gsx-pallets-freight-2015.jpg" alt="Pallets and freight on the Google Shopping Express fulfillment floor" loading="lazy">
                <h2 class="work-card-title">Google Shopping Express</h2>
                <p class="work-card-sub">The biggest single thing I have been part of. I joined before the public launch and built the field operations team from zero to thirty operators.</p>
            </a>

            <a class="work-card" href="what-im-doing.html#entry-2026-08-23">
                <img class="work-card-media" src="media/slumped-over-man-poster.png" alt="The Slumped Over Man film poster" loading="lazy">
                <h2 class="work-card-title">Slumped Over Man</h2>
                <p class="work-card-sub">A short film I worked on premiered this week. I was the production manager on it.</p>
            </a>

            <a class="work-card" href="https://github.com/bscoggin-dev/judge-moody" target="_blank" rel="noopener">
                <h2 class="work-card-title">Judge Moody</h2>
                <p class="work-card-sub">A portable LLM-as-judge subagent for Claude Code that tells you how strong its standard actually was.</p>
            </a>

            <a class="work-card" href="what-ive-done.html#era-chauffeur">
                <h2 class="work-card-title">Project Chauffeur</h2>
                <p class="work-card-sub">I joined Google's self driving car effort when it was still called Project Chauffeur. I ran safety testing protocols and watched the sensors.</p>
            </a>

            <a class="work-card" href="what-ive-done.html#era-geo">
                <h2 class="work-card-title">Earth and Maps imagery</h2>
                <p class="work-card-sub">After the car project I moved to Geo, where the job was keeping imagery moving into Google Earth and Google Maps.</p>
            </a>

            <a class="work-card" href="what-ive-done.html#patent-bag-assembly">
                <h2 class="work-card-title">Sealable Bag Assembly</h2>
                <p class="work-card-sub">The Google Shopping Express grocery bag, co-filed with Sam Truslow while building the packaging program. US 2014/0294322 A1.</p>
            </a>

            <a class="work-card" href="what-ive-done.html#era-film">
                <img class="work-card-media" src="media/film-set-2026.jpg" alt="On a film set" loading="lazy">
                <h2 class="work-card-title">Film and media production</h2>
                <p class="work-card-sub">Since 2022 I have been working in film and media production while finishing a film production degree at City College of San Francisco.</p>
            </a>

            <a class="work-card" href="what-ive-done.html#era-agriculture">
                <h2 class="work-card-title">Wine and agriculture</h2>
                <p class="work-card-sub">Before Google I worked at Long Meadow Ranch in St. Helena, building out their website, online store, and email marketing.</p>
            </a>
        </div>
    </section>
</body>
</html>
```

**Subtitle provenance:** every one is the opening sentence of its linked section, verbatim
except where a leading clause was trimmed to avoid repeating the card title. The patent
subtitle is the patent card's own sentence from `what-ive-done.html:134`.

- [ ] **Step 3: Verify the whole site**

```bash
cd ~/Desktop/Brendantscoggin.com && npm run verify index.html work.html who-i-am.html what-ive-done.html what-im-doing.html resume.html
```

Expected: `All checks passed.` The `work.html` link target now exists and every anchor —
including `#patent-bag-assembly` — resolves.

- [ ] **Step 4: Commit**

```bash
cd ~/Desktop/Brendantscoggin.com
git add what-ive-done.html work.html
git commit -m "feat: work.html with all eight cards; anchor the patent card

Subtitles are existing prose from the linked sections. The only change to
what-ive-done.html is one id attribute."
```

---

## Task 8: The mac-maid tool subsite

A deliberately separate identity. It must not look like the portfolio — that separation is
the whole point of the pattern, and it is why `tool.css` is self-contained.

**Every fact on this page comes from the mac-maid implementation** (`~/agentic/mac-maid/`,
commit `83f09db`): the two audit domains, the staleness tiers, the allowlist, the read-only
detector, the monthly launchd schedule, and the notification paths. Do not embellish. If you
cannot source a claim, cut it.

**Files:**
- Create: `tools/mac-maid/index.html`
- Create: `tools/mac-maid/tool.css`

**Interfaces:**
- Consumes: nothing from earlier tasks — this subtree is independent by design
- Produces: `tools/mac-maid/` as the reusable template for future tool subsites

- [ ] **Step 1: Create the scoped stylesheet**

Create `tools/mac-maid/tool.css`. Note it defines its **own** tokens under a `.tool` scope
and shares nothing with `brendan_style.css`.

```css
/* mac-maid tool site — self-contained. Must NOT import or reference brendan_style.css. */
@import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500&display=swap');

:root {
    --tool-bg: #0d0d0c;
    --tool-surface: #161614;
    --tool-border: rgba(255, 255, 255, 0.09);
    --tool-text: #ece8e1;
    --tool-muted: #8f8a80;
    --tool-accent: #f0a53a;
    --tool-live: #3ddc84;
    --tool-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    --tool-sans: 'Inter', system-ui, -apple-system, sans-serif;
    --tool-display: 'Archivo Black', 'Helvetica Neue', Arial, sans-serif;
}

* { box-sizing: border-box; }

body {
    margin: 0;
    background: var(--tool-bg);
    color: var(--tool-text);
    font-family: var(--tool-sans);
    line-height: 1.65;
    -webkit-font-smoothing: antialiased;
}

.tool-wrap { max-width: 940px; margin: 0 auto; padding: 0 1.5rem; }

/* header */
.tool-header {
    position: sticky; top: 0; z-index: 10;
    background: rgba(13, 13, 12, 0.88);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--tool-border);
}
.tool-header .tool-wrap {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 1rem; padding-bottom: 1rem;
}
.tool-wordmark {
    font-family: var(--tool-mono);
    font-size: 0.82rem; letter-spacing: 0.22em; text-transform: uppercase;
    display: flex; align-items: center; gap: 0.6rem; color: var(--tool-text);
    text-decoration: none;
}
.tool-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--tool-live); flex: none;
}
.tool-nav { display: flex; gap: 1.5rem; }
.tool-nav a {
    font-family: var(--tool-mono); font-size: 0.8rem;
    color: var(--tool-muted); text-decoration: none;
}
.tool-nav a:hover { color: var(--tool-accent); }

/* hero */
.tool-hero { padding: 6rem 0 5rem; }
.tool-eyebrow {
    font-family: var(--tool-mono);
    font-size: 0.78rem; letter-spacing: 0.24em; text-transform: uppercase;
    color: var(--tool-muted); margin: 0 0 1.75rem;
}
.tool-title {
    font-family: var(--tool-display);
    font-size: clamp(3rem, 11vw, 7rem);
    line-height: 0.92; letter-spacing: -0.02em; text-transform: uppercase;
    margin: 0 0 2rem; color: var(--tool-text);
}
.tool-lede { font-size: 1.2rem; max-width: 46ch; margin: 0 0 1.5rem; }
.tool-sub {
    font-family: var(--tool-mono); font-size: 0.9rem;
    color: var(--tool-muted); max-width: 52ch; margin: 0 0 2.5rem;
}

/* sections */
.tool-section { padding: 4rem 0; border-top: 1px solid var(--tool-border); }
.tool-section h2 {
    font-family: var(--tool-mono);
    font-size: 0.85rem; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--tool-accent); margin: 0 0 2rem; font-weight: 500;
}
.tool-section h3 { font-size: 1.1rem; margin: 0 0 0.5rem; }
.tool-section p { color: var(--tool-text); margin: 0 0 1rem; max-width: 62ch; }

.tool-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.tool-card {
    background: var(--tool-surface);
    border: 1px solid var(--tool-border);
    border-radius: 8px; padding: 1.5rem;
}
.tool-card p { color: var(--tool-muted); font-size: 0.95rem; margin: 0; }

.tool-tiers { list-style: none; padding: 0; margin: 0; }
.tool-tiers li {
    display: flex; gap: 1rem; align-items: baseline;
    padding: 0.85rem 0; border-bottom: 1px solid var(--tool-border);
    font-family: var(--tool-mono); font-size: 0.9rem;
}
.tool-tiers strong { color: var(--tool-accent); min-width: 8ch; }

.tool-note {
    font-family: var(--tool-mono); font-size: 0.85rem;
    color: var(--tool-muted); border-left: 2px solid var(--tool-accent);
    padding-left: 1rem; margin-top: 2rem;
}

/* footer */
.tool-footer {
    border-top: 1px solid var(--tool-border);
    padding: 3rem 0; font-family: var(--tool-mono); font-size: 0.82rem;
    color: var(--tool-muted);
}
.tool-footer a { color: var(--tool-accent); }

@media (max-width: 700px) {
    .tool-grid { grid-template-columns: 1fr; }
    .tool-nav { display: none; }
    .tool-hero { padding: 3.5rem 0 3rem; }
}
```

- [ ] **Step 2: Create the page**

Create `tools/mac-maid/index.html`. Per the spec there is **no install CTA and no repo
link** — mac-maid lives in a private monorepo, and an install path that cannot be completed
would be worse than none.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>mac-maid — system hygiene that asks before it acts</title>
    <meta name="description" content="A read-only audit for repo hygiene and filesystem clutter on macOS. It finds things; you decide what happens to them.">
    <link rel="stylesheet" href="tool.css">
</head>
<body>
    <header class="tool-header">
        <div class="tool-wrap">
            <a class="tool-wordmark" href="#top"><span class="tool-dot"></span>MAC MAID</a>
            <nav class="tool-nav">
                <a href="#audit">Audit</a>
                <a href="#tiers">Tiers</a>
                <a href="#review">Review</a>
                <a href="#runs">How it runs</a>
            </nav>
        </div>
    </header>

    <main id="top">
        <section class="tool-hero">
            <div class="tool-wrap">
                <p class="tool-eyebrow">A read-only audit for macOS</p>
                <h1 class="tool-title">mac<br>maid</h1>
                <p class="tool-lede">It finds stale repos, retired agents, and the clutter piling up in Downloads and on the Desktop. Then it stops and waits for you.</p>
                <p class="tool-sub">The detector never deletes anything. Every action goes through a review you approve item by item.</p>
            </div>
        </section>

        <section class="tool-section" id="audit">
            <div class="tool-wrap">
                <h2>The audit</h2>
                <div class="tool-grid">
                    <div class="tool-card">
                        <h3>Domain A — repo and agent hygiene</h3>
                        <p>Agents that were retired but left installed, repos that have gone quiet, scheduled jobs loaded on the wrong machine, and config that drifted between Macs.</p>
                    </div>
                    <div class="tool-card">
                        <h3>Domain B — filesystem clutter</h3>
                        <p>A tiered staleness pass over Downloads, the Desktop, and screenshots. Files only, never directories, with an allowlist for the ones that are meant to sit there.</p>
                    </div>
                </div>
                <p class="tool-note">Secrets are flagged and never acted on. If the audit finds something that looks like a credential, it tells you and stops — it will not move, archive, or delete it.</p>
            </div>
        </section>

        <section class="tool-section" id="tiers">
            <div class="tool-wrap">
                <h2>The tiers</h2>
                <ul class="tool-tiers">
                    <li><strong>Critical</strong><span>Older than 30 days</span></li>
                    <li><strong>Warning</strong><span>15 to 30 days</span></li>
                    <li><strong>Notice</strong><span>7 to 15 days</span></li>
                    <li><strong>Ignored</strong><span>Newer than 7 days — you are probably still using it</span></li>
                </ul>
            </div>
        </section>

        <section class="tool-section" id="review">
            <div class="tool-wrap">
                <h2>The review</h2>
                <p>The audit writes a proposal manifest. Nothing in it happens on its own.</p>
                <p>Running the review walks you through the manifest one item at a time. Non-destructive backups are applied automatically because they cannot lose anything. Everything else — archiving, deleting, uninstalling a retired agent — waits for an explicit yes.</p>
                <p>The detector and the actor are separate on purpose. A tool that both decides and acts is a tool you have to trust completely. This one only ever hands you a list.</p>
            </div>
        </section>

        <section class="tool-section" id="runs">
            <div class="tool-wrap">
                <h2>How it runs</h2>
                <p>A launchd job runs the audit monthly, on the first at 10:00, wrapped in caffeinate so a sleeping laptop does not skip it. It runs on one machine only — the scheduler host — so two Macs never double-run the same audit.</p>
                <p>When the audit finds something actionable it sends a nudge: an email, a macOS banner, and a push topic. When it finds nothing, it stays quiet. A hygiene tool that pings you every month whether or not there is anything to do is a hygiene tool you learn to ignore.</p>
                <p class="tool-note">Everything it touches lives on local disk. Nothing runs from or writes through iCloud — background jobs are denied there, and the failure is silent.</p>
            </div>
        </section>
    </main>

    <footer class="tool-footer">
        <div class="tool-wrap">
            <p>Built by <a href="/">Brendan Scoggin</a>. Source available on request.</p>
        </div>
    </footer>
</body>
</html>
```

- [ ] **Step 3: Verify the subsite**

```bash
cd ~/Desktop/Brendantscoggin.com && npm run verify tools/mac-maid/index.html
```

Expected: `All checks passed.` The footer's `href="/"` is skipped by the link checker (it is
a site-absolute path, correct in production, not resolvable from the filesystem).

- [ ] **Step 4: Prove the style isolation**

```bash
cd ~/Desktop/Brendantscoggin.com
echo "--- tool.css must not reference the portfolio stylesheet ---"
grep -c "brendan_style" tools/mac-maid/tool.css tools/mac-maid/index.html || echo "0 references (correct)"
echo "--- portfolio CSS must not target tool classes ---"
grep -c "tool-" brendan_style.css || echo "0 references (correct)"
```

Expected: zero matches in both directions.

- [ ] **Step 5: Look at it**

```bash
open ~/Desktop/Brendantscoggin.com/.verify-shots/tools_mac-maid_index_html-dark-1440.png
```

Confirm it reads as a **product page, not a portfolio page** — near-black ground, monospace
labels, heavy condensed uppercase headline, amber section headings, green status dot. If it
looks like the rest of the site, the separation has failed.

- [ ] **Step 6: Record the screenshot gap — do NOT fabricate them**

The spec (§6, "Screenshots needed") calls for two images this page does not yet have: a
terminal capture of the `maid_audit.py` output, and a capture of the `/mac-maid` review
prompt.

**Do not generate, mock up, or stage these.** They would render Brendan's actual filesystem,
so they must be captured from a real run and reviewed by him for real paths and filenames
before anything is published. An invented screenshot of a security-adjacent tool is worse
than no screenshot.

Ship the page without them and report the gap in Task 9. The layout already accommodates
them — they drop into the `#audit` and `#review` sections when they exist.

- [ ] **Step 7: Commit**

```bash
cd ~/Desktop/Brendantscoggin.com
git add tools/
git commit -m "feat: mac-maid tool subsite

Self-contained identity, no dependency on brendan_style.css either way.
Describe-only - no install CTA, since the source is in a private repo.
Screenshots deferred pending a real capture Brendan reviews."
```

---

## Task 9: Full verification, v4 snapshot, stage for review

Closes the loop: prove the whole site is green, cut the snapshot that records what the
redesign looks like, and hand it to Brendan on the staging remote. **This task does not
deploy.**

**Files:**
- Create: `versions/2026-08-27-v4-editorial/` (+ `NOTES.md`)

**Interfaces:**
- Consumes: every prior task
- Produces: a branch on the `dev` remote, awaiting Brendan's go-ahead

- [ ] **Step 1: Full verification across every page**

```bash
cd ~/Desktop/Brendantscoggin.com
npm run verify index.html work.html who-i-am.html what-ive-done.html what-im-doing.html resume.html tools/mac-maid/index.html
```

Expected: `All checks passed.` Both schemes, both widths, every page.

- [ ] **Step 2: Confirm no prose was changed**

The single most important check in this plan.

```bash
cd ~/Desktop/Brendantscoggin.com
git diff main...HEAD --stat -- who-i-am.html what-im-doing.html resume.html
```

Expected: **no output.** Those three files must be byte-identical to `main`.

```bash
git diff main...HEAD -- what-ive-done.html
```

Expected: exactly one changed line, adding `id="patent-bag-assembly"`. Nothing else.

- [ ] **Step 3: Cut the v4 snapshot**

```bash
cd ~/Desktop/Brendantscoggin.com
SNAP=versions/2026-08-27-v4-editorial
mkdir -p "$SNAP"
cp index.html work.html who-i-am.html what-ive-done.html what-im-doing.html resume.html "$SNAP"/
cp brendan_style.css favicon.svg Brendan_Scoggin_Resume.pdf me.png "$SNAP"/
cp -R media "$SNAP"/media
cp -R tools "$SNAP"/tools
open "$SNAP/index.html"
```

Expected: renders fully styled, exactly like the live branch. Same acceptance test as Task 1
— if it renders unstyled, the snapshot is incomplete.

- [ ] **Step 4: Write the v4 NOTES.md**

```bash
cat > ~/Desktop/Brendantscoggin.com/versions/2026-08-27-v4-editorial/NOTES.md <<'EOF'
# v4 — the editorial redesign

**Snapshot taken:** 2026-08-27, after the redesign, before deploy.
**Supersedes:** v3 (2026-08-27-v3-pre-editorial-live), now deprecated.

## What changed

The home page leads with the work instead of the contact details. Name set as Fraunces
display type with a ragged second line; the who-i-am opening clause as a narrow body column;
a three-card featured grid below it. New work.html carries all eight cards. First tool
subsite at tools/mac-maid/, with its own visual identity and no shared CSS.

## What did NOT change

No prose. who-i-am.html, what-im-doing.html, and resume.html are byte-identical to v3.
what-ive-done.html gained exactly one id attribute. Every card subtitle is existing copy
lifted from the page it links to.

## Audience

Hiring readers. This is the first version where the landing page makes an argument: one
creative project, one operations-at-scale program, one AI build, above the fold.

## Design

Kept the v3 palette - emerald #10b981 / teal #14b8a6 on #090d16 - and added Fraunces for
display type plus a doubled vertical rhythm. Light mode preserved throughout.

## What is still unresolved

- The AWS certification conflict and the film-degree wording, both carried over from v3.
- mac-maid has no public repo, so its site is describe-only with no install path.
- The two mac-maid screenshots the spec calls for (audit output, review prompt) are not
  captured yet. They show a real filesystem and need Brendan's review before publishing.
- work.html is linked from the home page but is not yet in the other pages' navs.
- Case-study pages do not exist; cards deep-link into existing sections instead.
EOF
```

- [ ] **Step 5: Commit and push to staging**

```bash
cd ~/Desktop/Brendantscoggin.com
git add versions/2026-08-27-v4-editorial
git commit -m "chore: snapshot v4 (editorial redesign)"
git push dev v3-editorial-redesign
```

**Push to `dev` only.** `origin/main` is untouched, so `CNAME` is untouched and DNS is not in
play.

- [ ] **Step 6: Report to Brendan — do not deploy**

Report: every page green in both schemes, the no-prose-change diff check passed, both
snapshots render standalone, and the branch is on `dev` awaiting his call.

Also report the one known gap: the two mac-maid screenshots are not captured, because they
show a real filesystem and need his review before publishing.

The deploy command, **for Brendan to authorize explicitly**:

```bash
cd ~/Desktop/Brendantscoggin.com
git checkout main && git merge v3-editorial-redesign
git push origin main
```

---

## Appendix: what this plan deliberately does not do

Carried from the spec's out-of-scope section. If you find yourself doing any of these, stop.

- Editing any existing prose, including the two known content conflicts (the AWS
  certification claim in `who-i-am.html`, the "finishing" film-degree wording in
  `what-ive-done.html`).
- Repairing the broken v1/v2 snapshots.
- Extracting mac-maid into a public repo.
- Adding `work.html` to the navs of pages other than `work.html` itself.
- Building per-project case-study pages at `work/<slug>.html`.
- Cleaning up `live_files_21426/` or the 0-byte `app.css`.
- Additional tool subsites beyond mac-maid.
- Deploying to `origin/main`.
