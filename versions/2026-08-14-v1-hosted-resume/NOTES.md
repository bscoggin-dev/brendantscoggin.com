# v1 — resume brought on-site

**Snapshot taken** 2026-08-14. **STATUS: NOT SHIPPED.** Blocked on a design decision.

## What changed from v0

1. **New `resume.html`** — a styled, self-contained resume page hosted on the site,
   replacing the offsite Google Doc.
2. **New `Brendan_Scoggin_Resume.pdf`** — 3 pages, generated from `resume.html` via
   headless Chrome print-to-PDF, so page and PDF cannot drift.
3. **`index.html`** — one line: the resume nav href now points at `resume.html`.

## Content corrections in this version

- **GIS / GNSS added.** A new Geospatial and Imagery skills line: GIS, GNSS positioning
  (GPS/GLONASS, NovAtel), aerial and ground imagery collection, LIDAR, ingest and QC
  pipelines. The Geo/Mapping role bullet now names the NovAtel GNSS-to-imagery ingest work.
- **Stanford Advanced Project Management (Dec 2015) restored.** It was absent from every
  resume source — cv.md, the master resume, and the site. Verified missing, not misfiled.
- **Packaging work moved to the correct role.** "Owned development of GSX-branded
  packaging" had been sitting under **Rollout Team Manager** (Nov 2014 – Mar 2015). It
  belongs to **Field Operations Lead** (Nov 2012 – Nov 2013), where the rest of the
  packaging work already lived — the procurement practices bullet, the $1.50→$0.50 bag
  cost reduction, and the grocery-bag design patent. Corrected in all three sources.
- **AI Tooling and Agentic Automation** section added to cv.md.

## Audience

**Still undefined.** This version fixed a correctness and consistency problem; it did not
answer the v0 review's actual question. No project cards were added. No contact mechanism.
The site still does not say what Brendan does.

The positioning work that was in progress when this was cut: a through-line of *making a
live thing happen, with people, against a clock, in the physical world* — eleven years at
Google in physical and virtual operations, in the field and remote, across Stage & Film,
Autonomous Vehicles, Mapping & Aerial Imagery, E-commerce & Procurement, and Wine &
Agriculture. Breadth as evidence, never as the headline.

## Why it was not shipped

**The resume page's design does not match the rest of the site.** It is cleaner, but the
inconsistency is disqualifying on its own. Brendan's call, 2026-08-14: either the rest of
the site adopts this design language, or the resume page adopts the site's. That decision
was not made before this snapshot.

## Also unresolved at snapshot time

- **The PDF is 3 pages** against a 2-page spec. The spec was written for *application*
  resumes; whether it should govern the full record on his own site was never decided.
- **`who-i-am.html` and `what-im-doing.html` still link "resume" to the old Google Doc.**
  Only `index.html` was repointed, because the build instruction scoped it that narrowly.
  Two of four pages therefore still serve the stale document.

## Verification that did run

A `/judge` pass at the `spec` tier cleared: no fabrication (every employer, title, date,
metric, and the patent number trace to the master resume), all eleven forbidden phrases
absent, "specialized-agriculture client" verbatim with no client or industry named, and
completeness against the source. The PDF was independently checked for page count,
content fidelity, and forbidden phrases.
