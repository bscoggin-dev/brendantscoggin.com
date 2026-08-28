# v6 — 2026-08-28 — live site before the Job4you entry

**What this is:** the live `work-im-doing.html` and `brendan_style.css` exactly as deployed
at commit `90d53d1`, cut immediately before the Job4you long-form entry shipped. Kept so
the page can be reverted in one copy if the entry needs to come down.

**What changed after this snapshot:** a full-width "Applying alone was never going to
work" entry at the top of the log (career), with a click-to-expand funnel diagram
(`media/job4you-how-it-works.png`, native `<dialog>` lightbox, inline JS on that page
only), a metrics table (`.stat-table`), and a `wide` grid class so the long entry does not
stretch its neighbour. Paired with a LinkedIn post the same day.

**Audience:** hiring reader, same as v5. Unchanged.

**Unresolved at snapshot time:** the entry's LinkedIn link points at the profile, to be
swapped for the post URL once published. Headshot still pending a new photo (from v5).

**Revert:** copy these two files back over the site root and remove
`media/job4you-how-it-works.png`.
