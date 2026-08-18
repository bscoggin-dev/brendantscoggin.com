# Version archive

A dated snapshot of the site each time it changes materially, so the evolution of
**design, content, and intended audience** is legible without reading git diffs.

Git already records every commit. This directory answers a different question:
*what did the site look like, and who was it for?*

## Rules

- One directory per version: `YYYY-MM-DD-vN-short-label/`
- The date is when the snapshot was taken, not when work started.
- Every directory carries a `NOTES.md` stating: what changed, why, who the
  audience was, and what was still unresolved at snapshot time.
- Snapshots are frozen. Never edit files inside a version directory — make a new one.
- A version is cut when design, audience, or the resume artifact changes. Not for
  typo fixes.

## Versions

| Version | Date | Audience | One line |
|---|---|---|---|
| v0 | 2026-08-13 | undefined | The live baseline. Four nav links, resume offsite to a Google Doc, zero projects. |
| v1 | 2026-08-14 | undefined | Resume brought on-site as a hosted page + PDF. **Not shipped** — design conflicts with the rest of the site. |
| v2 | 2026-08-17 | physical-world operator thesis (still unratified) | Resume restyled to the site's language and shipped; new what-ive-done page with the first photos (GSX era) and the patent card — staged pending review. |

## Note on public reachability

These files sit inside the deployed tree, so a URL like
`/versions/2026-08-13-v0-live-baseline/index.html` would resolve on the live site if
someone guessed it. There is no directory listing and nothing here is private — it is
all material that was or is public anyway. Move this directory out of the repo if that
ever stops being true.
