# v8 — 2026-09-30 — live site before the skeptic committee entry

**What this is:** the live `work-im-doing.html` and `gtag-init.js` exactly as deployed at
commit `47b8d07`, cut immediately before the skeptic committee entry shipped. Kept so the
page can be reverted in one copy if the entry needs to come down.

**What changed after this snapshot:** a full-width "The skeptic committee, and why I kept it"
entry at the top of the log (career), the long version of the 09-30 LinkedIn post, with the
committee image (`media/2026-09-30-skeptic-committee.png`), credit and links to Mo Bitar's two
Less Bitter videos, and a link to the public repo github.com/bscoggin-dev/skeptic-committee.
`gtag-init.js` gained a `github_repo_click` event for any link to github.com/bscoggin-dev/.

**Audience:** hiring reader, same as v7. Unchanged.

**Unresolved at snapshot time:** the entry's LinkedIn link points at the profile, to be
swapped for the post URL once published.

**Revert:** copy these two files back over the site root and remove
`media/2026-09-30-skeptic-committee.png`.
