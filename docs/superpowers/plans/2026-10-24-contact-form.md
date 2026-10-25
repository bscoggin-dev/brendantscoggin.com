# Contact Form with Animal Thank-You Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A contact page on brendantscoggin.com that saves every message to D1, shows a random animal photo chosen by the button pressed, and emails Brendan a digest on a cadence he sets with `set-digest <hours>`.

**Architecture:** The existing static-assets Worker `brendantscoggin-site` gains a code entry (`worker/index.js`) that runs first only for `/api/*`. A native HTML form POSTs to `/api/contact`; the Worker validates, writes D1, picks an image from a committed manifest, and 303-redirects back to `contact.html`, where a small script shows the thank-you. An hourly cron trigger runs the digest check. Logic lives in small pure modules tested with Node's built-in test runner; no new dependencies.

**Tech Stack:** Cloudflare Workers (JS modules), D1, Cron Triggers, Cloudflare Email Service `send_email` binding, wrangler 4.152.0 (pinned in `scripts/deploy.sh`), `node:test`, plain HTML/CSS/JS matching the site. Images are generated in a separate Claude session and delivered as files.

**Spec:** `docs/superpowers/specs/2026-10-24-contact-form-design.md`

## Global Constraints

- Fields: name, email, subject (free text, no dropdown), message. Each button submits the form (saves the message to D1) and then shows that button's animal photo, so the label says so. Button labels, exact text: `Submit for Cats`, `Submit for Dogs`, `Submit for All!` (values `cats`, `dogs`, `all`). Thank-you text: `Thankyou!`
- No Jev/TypeSafe, no CAPTCHA, no admin page, no live image generation, no new npm dependencies.
- Message saved to D1 **before** image choice or any other step; once saved, the response always succeeds.
- Limits: name 100, email 254, subject 200, message 5000 characters. Over limit is rejected, never truncated.
- Honeypot field `website`: if non-empty, respond as success and store nothing.
- Cap: 30 stored messages per hour site-wide; extras are dropped and the visitor sees an error. Digest lists at most 50 messages then `and N more`.
- Digest: no email when nothing is unsent. Mark rows only after the send succeeds. Interval is a minimum gap since `last_digest_at`; null means send as soon as any unsent message exists. Default interval 24 hours.
- Sender `contact@brendantscoggin.com`; recipient is Brendan's own verified address. Digest subject is static (no visitor text in headers). Digest body is plain text.
- Page CSP: copy the `<meta>` policy from `index.html`; scripts must be external files (`script-src 'self'`). Thank-you text is set with `textContent`, never `innerHTML`.
- Thank-you shows a small caption `AI-generated photo`. If a group is empty, show plain `Thankyou!`.
- Deploy uploads committed files only (`scripts/deploy.sh`). `worker/`, `migrations/` and `scripts/set-digest.sh` must NOT be uploaded as public assets.
- Work on `main`; commit per task; never push without Brendan's yes. Cloudflare changes (D1 create, Email Routing, DNS, deploy) each need Brendan's go-ahead first. `wrangler login` is his.

## Review Focus

- Emoji / multi-byte text at the limit boundary (5000 characters, not bytes): accepted at 5000, rejected at 5001.
- Newlines in `name`, `email` or `subject` cannot reach an email header (digest subject is static; `email` containing a newline is rejected).
- HTML in a message (`<script>`, `&`) appears as literal text in the digest and is never rendered on the page.
- Double-click or double-submit on a button creates one row, not two (a JS flag ignores the second submit; the button is not disabled before the form data is built; the cap bounds any remainder).
- Manifest group empty or missing: thank-you still renders as plain `Thankyou!`.
- Redirect target `?img=` is only rendered when it matches `^[a-z]+-\d{2}\.jpg$`; anything else renders plain `Thankyou!`.
- Digest send succeeds but marking rows fails: rows resend next run (at-least-once); the test documents this.

---

## File Structure

| Path | Responsibility |
|---|---|
| `worker/validate.js` | Parse and validate a submission |
| `worker/images.js` | Pick an image filename from the manifest |
| `worker/db.js` | All D1 reads and writes |
| `worker/digest.js` | Due check, digest text, run-digest |
| `worker/index.js` | `fetch` (POST `/api/contact`) and `scheduled` entry |
| `worker/tests/*.test.js`, `worker/tests/fake-d1.js` | `node --test` tests; fake D1 over `node:sqlite` |
| `migrations/0001_init.sql` | `messages` and `settings` tables |
| `contact.html`, `contact.js` | Page, form, thank-you display |
| `brendan_style.css` | Append contact styles |
| `index.html` | Add "Contact me" link |
| `media/animals/manifest.json`, `media/animals/*.jpg`, `media/animals/README.md` | Images and provenance |
| `wrangler.jsonc` | `main`, `run_worker_first`, `d1_databases`, `triggers`, `send_email` |
| `scripts/deploy.sh` | Exclude Worker source from the asset export |
| `scripts/set-digest.sh` | Update the interval setting remotely |

## Task 1: Submission validation

**Files:** Create `worker/validate.js`; Test `worker/tests/validate.test.js`

**Interfaces:**
- Produces: `validateSubmission(fields: Record<string,string>): { ok: true, value: { name, email, subject, message, animal } } | { ok: false, honeypot: true } | { ok: false, error: string }` where `animal` is `"cats" | "dogs" | "all"`.

- [ ] **Step 1: Write failing tests** in `validate.test.js`: `accepts a complete submission`; `trims whitespace`; `rejects missing name / email / subject / message` (each, `error` mentions the field); `rejects email without @ or domain dot`; `rejects email containing a newline`; `accepts message of 5000 emoji characters and rejects 5001` (count by `[...str].length`); `rejects over-limit name (101), subject (201), email (255)`; `rejects unknown animal`; `honeypot filled returns { ok:false, honeypot:true }`.
- [ ] **Step 2:** Run `node --test worker/tests/validate.test.js`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement `validateSubmission` in `worker/validate.js` (ES module, no dependencies). Honeypot check runs first.
- [ ] **Step 4:** Run the same command. Expected: all PASS.
- [ ] **Step 5:** `git add worker/validate.js worker/tests/validate.test.js && git commit -m "feat(contact): submission validation"`

## Task 2: Image picker

**Files:** Create `worker/images.js`; Test `worker/tests/images.test.js`

**Interfaces:**
- Produces: `pickImage(animal: "cats"|"dogs"|"all", manifest: { cats?: string[], dogs?: string[], other?: string[] }, rand?: () => number): string | null`. Cats → `manifest.cats`; dogs → `manifest.dogs`; all → cats + dogs + other combined. Missing groups are skipped when combining for `all`. Returns `null` only when the resulting pool is empty.

- [ ] **Step 1: Write failing tests:** `cats picks only from cats`; `dogs picks only from dogs`; `all can return an other image` (rand stubbed to hit the last index); `empty cats group returns null for cats`; `missing dogs group returns null for dogs`; `all with no other group draws from cats and dogs only`; `all with every group empty returns null`; `rand 0.999999 stays in range`.
- [ ] **Step 2:** `node --test worker/tests/images.test.js` → FAIL.
- [ ] **Step 3:** Implement `pickImage` in `worker/images.js`.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(contact): image picker`.

## Task 3: Database layer and migration

**Files:** Create `migrations/0001_init.sql`, `worker/db.js`, `worker/tests/fake-d1.js`; Test `worker/tests/db.test.js`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces (all take `db` first, a D1Database; times are ISO strings):
  - `insertMessage(db, m: {name,email,subject,message,animal}, nowIso): Promise<number>` (new row id)
  - `countSince(db, sinceIso): Promise<number>`
  - `pendingMessages(db, limit): Promise<Row[]>` (oldest first, `digested_at IS NULL`)
  - `pendingCount(db): Promise<number>`
  - `markDigested(db, ids: number[], nowIso): Promise<void>`
  - `getSetting(db, key): Promise<string|null>`, `setSetting(db, key, value): Promise<void>`
- Schema: `messages(id INTEGER PRIMARY KEY AUTOINCREMENT, created_at TEXT NOT NULL, name, email, subject, message, animal TEXT NOT NULL, digested_at TEXT)`; `settings(key TEXT PRIMARY KEY, value TEXT NOT NULL)`; seed `digest_interval_hours = '24'`.

- [ ] **Step 1:** Write `fake-d1.js` exposing `createFakeD1()`: an in-memory `node:sqlite` `DatabaseSync` loaded from `migrations/0001_init.sql`, wrapped to mimic `prepare(sql).bind(...args).run() / .all() / .first()`. Confirm `node -v` is ≥ 22.5 first; if not, STOP and ask Brendan (alternative: `wrangler d1 execute --local` based tests).
- [ ] **Step 2: Write failing tests:** `insertMessage returns increasing ids`; `pendingMessages returns oldest first and respects limit`; `markDigested removes rows from pending`; `countSince counts only rows at or after the cutoff`; `getSetting returns seeded 24`; `setSetting overwrites`; `getSetting unknown key returns null`.
- [ ] **Step 3:** Run `node --test worker/tests/db.test.js` → FAIL.
- [ ] **Step 4:** Write `migrations/0001_init.sql` and implement `worker/db.js` using parameter binding for every value.
- [ ] **Step 5:** Run → PASS. Commit `feat(contact): D1 schema and data access`.

## Task 4: POST handler

**Files:** Create `worker/index.js` (fetch part only); Test `worker/tests/handler.test.js`

**Interfaces:**
- Consumes: `validateSubmission`, `pickImage`, `insertMessage`, `countSince` (Tasks 1–3); the manifest is imported from `../media/animals/manifest.json`.
- Produces: `export async function handleContact(request: Request, env: { DB }, now: Date, rand?: () => number, manifest?: Manifest): Promise<Response>` (`manifest` defaults to the imported one; tests pass their own) `` and `export default { fetch, scheduled }` (`scheduled` added in Task 5).
- Behavior: only `POST /api/contact` is handled, other paths/methods 404/405. Body is form-encoded. Success → `303` with `Location: /contact.html?sent=1&img=<filename>` (omit `img` when `pickImage` returns null). Honeypot → same 303, no insert. Validation error → `303 /contact.html?error=<code>` where code is `invalid` (include the field name in `&field=`). Cap exceeded (30 in the last hour) → `303 /contact.html?error=busy` with no insert. D1 failure → `303 /contact.html?error=server`.

- [ ] **Step 1: Write failing tests** (fake D1): `valid post inserts one row and redirects with img`; `cats button redirect img starts with cats-`; `row is inserted before image choice` (pass a `manifest` whose `cats` getter throws; row still exists, redirect is `sent=1` with no img); `honeypot redirects as success and inserts nothing`; `invalid email redirects error=invalid and inserts nothing`; `31st message within an hour redirects error=busy`; `non-POST returns 405`; `D1 throwing redirects error=server`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `handleContact` and the `fetch` export in `worker/index.js`.
- [ ] **Step 4:** Run `node --test worker/tests/` → PASS (all prior tests too).
- [ ] **Step 5:** Commit `feat(contact): POST /api/contact handler`.

## Task 5: Digest logic

**Files:** Create `worker/digest.js`; Test `worker/tests/digest.test.js`

**Interfaces:**
- Consumes: `pendingMessages`, `pendingCount`, `markDigested`, `getSetting`, `setSetting` (Task 3).
- Produces:
  - `isDue(intervalHours: number, lastDigestAt: string|null, pending: number, now: Date): boolean`
  - `buildDigest(messages: Row[], totalPending: number): { subject: string, text: string }`; subject is exactly `New contact messages`; text lists each message (time, name, email, subject, message) and ends with `and N more` when `totalPending > messages.length`.
  - `runDigest(env: { DB, EMAIL }, now: Date): Promise<{ sent: number }>`; calls `env.EMAIL.send({ from: "contact@brendantscoggin.com", to: <recipient>, subject, text })`. Recipient comes from the binding's `destination_address` (omit `to`).

- [ ] **Step 1: Write failing tests:** `not due when nothing pending`; `due immediately when last digest is null and one pending`; `not due before interval elapsed`; `due exactly at interval`; `buildDigest keeps HTML as literal text`; `buildDigest subject is static even if a subject contains newlines`; `buildDigest adds "and 12 more" when 62 pending and 50 listed`; `runDigest sends once, marks rows, sets last_digest_at`; `runDigest with failing send leaves rows unmarked and last_digest_at unchanged`; `runDigest when marking fails after send throws and rows stay pending (resend next run)`; `runDigest with nothing pending does not call send`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement in `worker/digest.js`. Read the interval with `Number(getSetting(...))`, falling back to 24 if not a positive number.
- [ ] **Step 4:** Add `scheduled(event, env, ctx)` to the default export in `worker/index.js` calling `ctx.waitUntil(runDigest(env, new Date()))`. Run `node --test worker/tests/` → PASS.
- [ ] **Step 5:** Commit `feat(contact): scheduled digest`.

## Task 6: Config, deploy script, set-digest

**Files:** Modify `wrangler.jsonc`, `scripts/deploy.sh`; Create `scripts/set-digest.sh`; Test `worker/tests/set-digest.test.sh` (shell test)

**Interfaces:**
- Produces: `scripts/set-digest.sh <hours>`: exits non-zero with a message unless `<hours>` is a positive whole number (1–8760); otherwise runs `npx --yes wrangler@4.152.0 d1 execute contact-form --remote --command "INSERT INTO settings(key,value) VALUES('digest_interval_hours','<hours>') ON CONFLICT(key) DO UPDATE SET value=excluded.value"` and prints `Digest interval set to <hours> hours.`. A `DRY_RUN=1` env var prints the command instead of running it (used by the test).

- [ ] **Step 1: Write the failing shell test:** `set-digest.sh 24` with `DRY_RUN=1` prints a command containing `'24'`; `0`, `-3`, `abc`, `1.5`, empty, `8761` exit non-zero and print nothing to stdout.
- [ ] **Step 2:** Run `bash worker/tests/set-digest.test.sh` → FAIL.
- [ ] **Step 3:** Implement `scripts/set-digest.sh` (`set -euo pipefail`, executable bit).
- [ ] **Step 4:** Modify `wrangler.jsonc`: add `"main": "worker/index.js"`, `"assets.run_worker_first": ["/api/*"]`, `"triggers": { "crons": ["0 * * * *"] }`, `"send_email": [{ "name": "EMAIL", "destination_address": "<Brendan's verified address>" }]`, and `"d1_databases": [{ "binding": "DB", "database_name": "contact-form", "database_id": "<filled in Task 8>", "migrations_dir": "migrations" }]`. Confirm key spellings against the Cloudflare docs (`mcp__cloudflare__docs`). Ask Brendan for the destination address; do not guess it.
- [ ] **Step 5:** Modify `scripts/deploy.sh`: add `':(exclude)worker'`, `':(exclude)migrations'`, `':(exclude)scripts/set-digest.sh'` to `git archive`, add the same paths to the `expected` regex filter, and keep the file-count check passing. Verify with `scripts/deploy.sh --dry-run`: expect the export count line and no `worker/` files listed in the upload.
- [ ] **Step 6:** Run `bash worker/tests/set-digest.test.sh` → PASS. Commit `feat(contact): wrangler config, deploy excludes, set-digest`.

## Task 7: Contact page and home link

**Files:** Create `contact.html`, `contact.js`; Modify `brendan_style.css` (append), `index.html` (insert link between `.hero-badges` and `.contact-strip`)

**Interfaces:**
- Consumes: redirect contract from Task 4 (`?sent=1&img=…`, `?error=invalid|busy|server`, optional `&field=`).
- Produces: `contact.html` with the site's nav and CSP `<meta>` copied from `who-i-am.html` / `index.html`; a `<form method="post" action="/api/contact">` with inputs `name`, `email`, `subject`, `message`, hidden-from-view honeypot input `website` (`tabindex="-1" autocomplete="off"`, visually hidden, labelled for screen readers as skip), and three `<button type="submit" name="animal" value="cats|dogs|all">` with visible text exactly `Submit for Cats`, `Submit for Dogs`, `Submit for All!`. `contact.js` exports nothing; it reads `location.search`, shows `Thankyou!` plus `<img src="media/animals/<img>" alt="">` and caption `AI-generated photo` only when `img` matches `^[a-z]+-\d{2}\.jpg$`, shows an error line for `error=`, and, on a second submit, ignores it with a JS flag. It must NOT set `disabled` on the pressed button: a disabled submitter is left out of the form data and the animal choice would be lost. Disabling is allowed only on a later tick, after the browser has built the form data.

- [ ] **Step 1:** Write `contact.html` and `contact.js`; link `contact.js` as an external script; no inline script.
- [ ] **Step 2:** Add styles to `brendan_style.css` in the existing visual language (check dark mode and a 375 px width).
- [ ] **Step 3:** Add the "Contact me" link in `index.html` with the same class conventions as nearby links.
- [ ] **Step 4:** Serve locally with `npx wrangler dev --local --persist-to .wrangler/state` after applying the migration locally (`npx wrangler d1 migrations apply contact-form --local`). With `curl -i -d 'name=A&email=a@b.co&subject=S&message=M&animal=cats&website=' http://localhost:8787/api/contact` expect `303` and a `Location` header starting `/contact.html?sent=1`; with `website=x` expect `303` and no new row in `wrangler d1 execute contact-form --local --command "SELECT count(*) FROM messages"`.
- [ ] **Step 5:** In a browser (Playwright is already a devDependency, or Chrome), open `http://localhost:8787/contact.html?sent=1&img=../../evil.jpg` and confirm plain `Thankyou!` with no image, and `?sent=1&img=cats-01.jpg` shows the image once it exists. Run `npm run verify` against the local URL if `scripts/verify.mjs` accepts `BASE_URL`; expected: no new failures.
- [ ] **Step 6:** With Playwright against the local server, click each of the three buttons with a valid form and check the stored `animal` column reads `cats`, `dogs`, `all` respectively; click one button twice quickly and check exactly one new row.
- [ ] **Step 7:** Commit `feat(contact): contact page and home link`.

## Task 8: Go live (every step needs Brendan's yes)

**Files:** `wrangler.jsonc` (database id)

- [ ] **Step 1:** Brendan runs `! npx wrangler login` if his session is stale.
- [ ] **Step 2:** With his go-ahead, `npx wrangler d1 create contact-form`; put the returned id in `wrangler.jsonc`; `npx wrangler d1 migrations apply contact-form --remote`; commit `chore(contact): D1 database id`.
- [ ] **Step 3:** Re-list the zone's DNS records (read-only, via the Cloudflare MCP) and confirm still 0 MX. With his go-ahead, enable Email Routing on `brendantscoggin.com` (adds MX + SPF). Brendan verifies his destination address from the email Cloudflare sends him. Confirm `contact@brendantscoggin.com` works as a sender; if the sender domain needs onboarding, do that in the dashboard flow Cloudflare presents.
- [ ] **Step 4:** With his go-ahead, run `scripts/deploy.sh`, then `scripts/parity.sh` (expect no differences on existing pages).
- [ ] **Step 5:** Submit a real test message on the live site. Expected: redirect to `?sent=1`, a row in `npx wrangler d1 execute contact-form --remote --command "SELECT id,subject FROM messages"`, and, after `set-digest 1` and the next hourly run, one digest email in Brendan's inbox and none the hour after. Then `set-digest 24`. Delete the test row only with his yes.
- [ ] **Step 6:** Offer a symlink `~/.local/bin/set-digest -> scripts/set-digest.sh` so `set-digest 24` works from anywhere; create it only if Brendan says yes.

## Task 9: Animal images (generated in another session; does not block launch)

**Files:** Create `media/animals/manifest.json`, `media/animals/README.md`, `media/animals/{cats,dogs,other}-NN.jpg`

**Interfaces:**
- Consumes: a folder of generated photos from Brendan's other session (he gives the path). Target per his 2026-10-24 message: 50 images per category. I read that as 50 cats and 50 dogs; an `other` group is optional and only used if he supplies one.
- Produces: `manifest.json` shaped `{ "cats": ["cats-01.jpg", …], "dogs": [...], "other": [...] }` (omit `other` if none); filenames match `^[a-z]+-\d{2}\.jpg$` (two digits is enough for 50).

- [ ] **Step 1:** Ask Brendan for the folder path and the model name, licence, prompts and seeds the other session used (for the README). This session does not pick or run a model.
- [ ] **Step 2:** Look at every image (contact sheets) and confirm with Brendan which to drop. Check each group has 50 after culling, or report the count.
- [ ] **Step 3:** Compress to JPEG (about 80 KB each or less, about 512 px), rename into the pattern, write `manifest.json` and `README.md` (model, licence, prompts, seeds, date, "AI-generated").
- [ ] **Step 4:** Verify: every manifest entry exists on disk and every file on disk is in the manifest; `node --test worker/tests/` passes; `scripts/deploy.sh --dry-run` still reports matching file counts.
- [ ] **Step 5:** Commit `feat(contact): animal images`. With his go-ahead, redeploy and confirm a live `?sent=1&img=cats-01.jpg` shows the photo.

---

## Self-Review

- **Spec coverage:** form fields and buttons (Task 7), D1 save-first (Task 4), honeypot, caps and limits (Tasks 1, 4, 5), digest cadence and `set-digest` (Tasks 5, 6, 8), no empty emails (Task 5), mail-safety gate (Task 8 step 3), deploy exclusions (Task 6), images, licence and caption (Tasks 7, 9), plain fallback (Tasks 4, 7), Jev dropped (Global Constraints).
- **Types:** `validateSubmission`, `pickImage`, `insertMessage`, `runDigest` and the redirect contract are named the same everywhere they appear.
- **Review Focus:** each line is exercised by a named test in Tasks 1, 2, 5 or 7.
- **Open items for Brendan during execution:** destination email address (Task 6), folder of generated images and the model's licence details (Task 9), and a yes before each Cloudflare change (Task 8).
