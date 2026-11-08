# Contact form with animal thank-you: design

Written by Claude Code (Sonnet 5.5), 2026-10-24, with Brendan. Status: approved by Brendan 2026-10-24. Nothing built.

## Intent and why

A contact page for brendantscoggin.com that doubles as a small showcase of his build skills: a form, a Cloudflare Worker with a database, scheduled email, and locally generated images. Visitors leave a message, then see a "Thankyou!" screen with a photo of a cute animal chosen by which of three buttons they pressed. It should be fun, and it must never lose a message.

## Goals

- A visitor can send name, email, subject and message from `contact.html`.
- Three submit buttons labelled **Submit for Cats**, **Submit for Dogs**, **Submit for All!** (changed 2026-10-24 from "I luv animals"). Each button saves the message to the database and then shows that animal's image, and its label says so. The button pressed is the submit and the animal choice.
- After submit, show "Thankyou!" and one random photo from the matching set (Cats, Dogs; "Submit for All!" draws from the whole pool, including a third group of other animals).
- Every message is saved to D1 before anything else happens.
- Brendan gets a digest email on a cadence he sets, and changes with a terminal command `set-digest <hours>` (example: `set-digest 24`).
- 50 photo-realistic animal images per category (50 cats, 50 dogs; an optional `other` group), generated locally from a Hugging Face model **in a separate session Brendan is running** (changed 2026-10-24 from about 50 total), culled by eye with him, committed as static files on the site.

## Non-goals and anti-goals

- No Jev/TypeSafe classifier, no API key. Decided 2026-10-24. The button already says what the visitor wants.
- No live image generation, no model running in Cloudflare.
- No CAPTCHA. No admin web page. No login.
- No inferring anything from the visitor's name.
- Anti-goal: a message lost because the image step, email step or anything after the database write failed.
- Anti-goal: empty digest emails.
- Anti-goal: ML packages or generation scripts ending up in the deployed site. `scripts/deploy.sh` uploads only committed files, so the generation environment lives outside the repo and only the final images are committed.

## Constraints (checked this session unless marked)

- The site is a static-assets Worker `brendantscoggin-site` (wrangler.jsonc, free plan, `html_handling: "none"`, `workers_dev: false`). It has no Worker code today. Adding code means a `main` entry, a D1 binding and `assets.run_worker_first: ["/api/*"]` (from the 10-23 plan; the exact key spelling is the builder's to confirm in the docs).
- `scripts/deploy.sh` exports committed HEAD through `git archive` and counts files. New files must be committed before they deploy, and its excludes and file-count check may need updating for the new Worker file. `contact.html` is picked up by its rewrite-rule loop automatically.
- The page CSP is a `<meta>` tag with `form-action 'self'`, `connect-src 'self'`, `img-src 'self' data: ...`. A same-origin POST and same-origin images are allowed. `contact.html` should copy that policy.
- Sending email to Brendan's own verified address is free on the Workers Free plan (Cloudflare docs, read this session). It requires Email Routing enabled on `brendantscoggin.com` and his address verified as a destination. The sender must be on that domain, for example `contact@brendantscoggin.com` (inferred from the docs, builder to confirm). Enabling Email Routing adds MX records to the zone; checked 2026-10-24 through the Cloudflare API: the zone has 3 records (A www, CAA, AAAA apex) and 0 MX. Re-check just before enabling.
- Brendan's rules apply: ask before creating new directories outside the repo; Cloudflare deploys and DNS changes are confirmed with him first; the Cloudflare login for deploys is his (`npx wrangler login`); no push without asking.

## Decisions made by Brendan

- Fields: name, email, subject (free text, no dropdown), message.
- Buttons: Submit for Cats, Submit for Dogs, Submit for All! (each submits the message, then shows that animal). Images are photo-realistic.
- Jev dropped.
- **2026-11-07, supersedes the "Submit for All!" button:** the third button is **Submit for Alien!** (value `alien`) and shows one of 75 AI-generated alien creatures. There is no "All" pool. The 55 "other animals" images were generated but are not used. Final sets: 58 dogs, 57 cats, 75 aliens (`media/animals/`). Digest recipient: brendantscoggin@gmail.com.
- Email: scheduled digest, not per message. Cadence set by `set-digest 24`-style command. Messages also saved in the database.

## Design

**Page.** `contact.html`, styled with the existing `app.css` / `brendan_style.css`, linked by a "Contact me" link in `index.html` between `.hero-badges` and `.contact-strip`. The form posts to `/api/contact`. Plain HTML form with JS enhancement is fine; the thank-you can be shown in place or on a result page (builder's call).

**Worker.** Handles `POST /api/contact` and a `scheduled` handler. Validation: required fields, email shape, length limits, a hidden honeypot field (silently accepted and dropped, not stored). On valid input: insert into D1 first, then choose the image, then respond. If image selection fails, return a random image or the plain thank-you. The response always succeeds once the row is saved.

**Database (D1).** Table for messages: id, created_at, name, email, subject, message, animal choice, `digested_at` (null until included in a digest). Table for settings: `digest_interval_hours` (default 24, builder's call) and `last_digest_at`.

**Image choice.** A manifest of image filenames per group (cats, dogs, other). Cats button picks from cats, Dogs from dogs, "Submit for All!" from all three. Random pick at request time.

**Digest.** Cron trigger hourly. On each run: read the interval and `last_digest_at`; if the interval has elapsed and at least one message has `digested_at` null, send one email listing them and set `digested_at` and `last_digest_at` only after the send succeeds. Otherwise do nothing. If the send fails, leave rows unmarked so the next run retries.

**`set-digest <hours>`.** A small local command in `scripts/` that updates the setting row with `wrangler d1 execute` on the remote database. Validates a positive whole number. Prints the new value.

**Image generation.** Done by Brendan's other session, not this one (decided 2026-10-24). This work only receives the finished photos from a folder he names, culls with him, compresses them to about 512 px and about 80 KB, and commits them under `media/animals/` with a README recording the model, licence, prompts and seeds that session used.

## Calls made by Claude (after the builder check; Brendan to confirm or change)

- **Mail safety (checked 2026-10-24):** `dig` on this Mac returns no MX and no TXT records for brendantscoggin.com, and the site's public address is the Gmail one. Enabling Email Routing is expected to be safe. The plan still starts with a DNS review and Brendan's go-ahead before the MX change, and his address must be verified as a destination (his action in the Cloudflare dashboard). If that fails, the fallback is an outbound email API with a secret.
- **Interval meaning:** a minimum gap since `last_digest_at`, not a fixed clock time. First run, with `last_digest_at` null: send as soon as any unsent message exists.
- **Deploy and migrations:** `scripts/deploy.sh` already runs `wrangler deploy --assets <export>`. It gains a Worker `main` entry in wrangler.jsonc and no other pipeline rewrite. D1 schema migrations are applied by a separate `wrangler d1 migrations apply --remote` command run by Brendan, not by deploy.sh.
- **`set-digest` credentials:** uses the `wrangler login` session he already uses for deploys. No API token is created.
- **Abuse limits:** honeypot plus length limits, plus a cap of 30 stored messages per hour site-wide, with extras dropped and counted. The digest lists at most 50 messages and says "and N more". No per-IP limit, no CAPTCHA.
- **Image sequencing:** the form, Worker and digest ship first. If no images are committed yet, or a group is empty, the thank-you shows plain "Thankyou!". Images follow and do not block launch.
- **Image licence and disclosure:** only models whose licence permits use on a personal site are candidates, and the licence is recorded in the images README. The thank-you screen carries a small "AI-generated photo" caption.
- **Model and caption (decided by Brendan 2026-11-07):** images come from `stabilityai/sd-turbo` (already cached on The Neo). Licence read 2026-11-07: Stability AI Community License, last updated July 5, 2024 (https://huggingface.co/stabilityai/sd-turbo/blob/main/LICENSE.md). Outputs belong to the user and are excluded from "Derivative Works", so the licence's attribution duty does not reach the images (Claude's reading, not legal advice). Section IV(c)(i) grants no trademark licence, so the page does not use the "Stability AI" name or logo. The caption under each thank-you image reads exactly: `AI-generated photo · made with SD-Turbo`, with "SD-Turbo" linking to https://huggingface.co/stabilityai/sd-turbo. The full licence line goes in the images README only. Grey area noted: if the site counts as commercial use, the licence is still free under US $1M revenue but asks for registration at https://stability.ai/community-license.

## Left to the builder

- Exact Worker config keys, file layout and test approach.
- D1 database name and region, schema details, default digest interval.
- Thank-you presentation (in place versus separate page) and visual styling, matching the site.
- Digest email format, subject line, plain text versus HTML.
- Image file naming and compression.

## Open items (Brendan's call, not blocking the plan)

- The folder where the other session leaves the images, and the model's licence details.
- Whether to enable Email Routing and add the sender domain now or at deploy time. Either needs his go-ahead, as it changes DNS.
