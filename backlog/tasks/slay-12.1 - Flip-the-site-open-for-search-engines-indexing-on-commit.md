---
id: SLAY-12.1
title: Flip the site open for search engines (indexing-on commit)
status: To Do
assignee: []
created_date: '2026-09-29 10:00'
labels:
  - story
dependencies: []
references:
  - src/brand/site.json
  - vercel.json
parent_task_id: SLAY-12
type: chore
ordinal: 62000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the indexing switch flips from noindex to indexable in one commit, per docs/launch.md step 8.
Type: deliverable
Branch: SLAY-12.1/indexing-on
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 bun tools/indexing.ts on run, src/brand/site.json becomes indexable:true, X-Robots-Tag removed from vercel.json, both committed together
- [ ] #2 bun run test --maxWorkers=1 src/brand passes (the flag/vercel.json agreement guard)
- [ ] #3 After deploy, bun tools/check-share.ts <production url> --indexable passes (no noindex anywhere, robots.txt open with sitemap, sitemap.xml lists / and /about)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Independent of repo visibility — the site is already public at slaydoku.vercel.app, indexing controls search-engine crawling only, not repo access.
<!-- SECTION:NOTES:END -->
