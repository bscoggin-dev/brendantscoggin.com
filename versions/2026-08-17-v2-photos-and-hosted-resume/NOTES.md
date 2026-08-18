# v2 — the resume ships, and the physical-world record gets its page

> Amended 2026-08-17 before ship, per Brendan's review: the Shopping Express photo set
> was cut from six to three (kept sortation floor, freight pallets, packing stations),
> and the Chauffeur and Geo sections gained one image each, hotlinked from Internet
> Archive captures of Google's own blog posts (the self driving Lexus, Aug 2012 post;
> the Street View camera car at Whistler, Feb 2010 post), credited in the captions.
> The snapshot copies were refreshed to match since v2 had not shipped yet.

**Snapshot taken** 2026-08-17. **Status: resume half SHIPPED (commit b4ea0d7); the
what-ive-done page STAGED, awaiting Brendan's review before push.**

## What changed from v1

1. **The v1 design conflict is resolved the way Brendan chose:** `resume.html` adopted
   the site's design language (brendan_style.css, dark glass cards, Space Grotesk,
   emerald accents) instead of the site adopting the resume's. A self-contained
   `@media print` block renders the old light document, so the print-to-PDF path
   that keeps page and PDF from drifting still works.
2. **All four pages' nav now points at `resume.html`** — v1 had repointed only
   index.html, leaving two pages serving the stale Google Doc.
3. **`Brendan_Scoggin_Resume.pdf` committed** — the live page's download link had
   404ed because the PDF was never pushed.
4. **NEW `what-ive-done.html`** — a fifth page telling the physical-operations story
   chronologically: Project Chauffeur, Geo/Mapping, Google Shopping Express (pilot to
   $500M wind-down), film production, wine and agriculture.
5. **First photography on the site.** Six Google Express-era operational photos
   (2014–2016: van fleet, sortation floor, receiving dock, branded freight pallets,
   secure staging cage, packing stations) plus one film-set frame, in `media/`,
   EXIF-stripped and resized to ≤1600px via Pillow. Selection rule: no identifiable
   faces (the film-set frame is the exception pending Brendan's call — crew faces
   visible).
6. **The patent card** — "Sealable Bag Assembly, US 2014/0294322 A1" as a designed
   glass card with a stroke-drawn bag emblem linking to Google Patents, replacing the
   idea of posting a raw screenshot of the patents page.
7. **Nav gains "what i've done"** between "who i am" and "what i'm doing" on all pages
   (staged with the new page).

## Audience

Closer to an answer than v0/v1 but still not decided out loud. This version bets on
one through-line: *making a live thing happen, with people, against a clock, in the
physical world.* The photos are the evidence layer for that claim — the site now shows
the work instead of only describing it. Who it is aimed at (recruiter, hiring manager,
collaborator) is still the open question.

## Unresolved at snapshot time

- The film-set photo shows identifiable crew members. Brendan decides whether it ships.
- `who-i-am.html` still carries the pre-overhaul voice and at least one claim that
  conflicts with the corrected resume (its AWS certification line does not match the
  resume's Cloud Practitioner credential). Not touched in this version.
- The legacy `live_files_21426/` snapshot still serves its own stale pages at direct
  URLs, including an old what-ive-done.html. Left in place.
- The resume PDF remains 3 pages against the 2-page application spec; the site's
  full-record copy was shipped at 3 pages deliberately.
