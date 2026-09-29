---
id: SLAY-12.1
title: Flip the site open for search engines (indexing-on commit)
status: Done
assignee: []
created_date: '2026-09-29 10:00'
updated_date: '2026-09-29 12:13'
labels:
  - story
dependencies: []
references:
  - src/brand/site.json
  - vercel.json
  - src/brand/indexing.test.ts
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
- [x] #1 bun tools/indexing.ts on run, src/brand/site.json becomes indexable:true, X-Robots-Tag removed from vercel.json, both committed together
- [x] #2 bun run test --maxWorkers=1 src/brand passes (the flag/vercel.json agreement guard)
- [ ] #3 After deploy, bun tools/check-share.ts <production url> --indexable passes (no noindex anywhere, robots.txt open with sitemap, sitemap.xml lists / and /about)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Independent of repo visibility — the site is already public at slaydoku.vercel.app, indexing controls search-engine crawling only, not repo access.

AC #3 (bun tools/check-share.ts <production url> --indexable against a deployed URL) is a post-merge, post-deploy step: it needs a real Vercel deployment of this commit, which does not exist from an isolated delivery worktree. Left unchecked here — it is the owner's step to run once this PR is merged and the main deployment is Ready (see docs/launch.md step 8). Everything verifiable locally (the indexing.ts flip, the src/brand test suite guarding site.json/vercel.json agreement) is done and green.

Review round 1 blocked on scope only: src/brand/indexing.test.ts was edited (one hardcoded pre-launch assertion updated to match the new flag value) but was not in References. Widened References to include it, per the documented remedy (widen refs, re-pass existing refs, re-review) rather than reverting the correct test fix.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Flipped the indexing switch to public: src/brand/site.json now indexable:true and the X-Robots-Tag noindex header removed from vercel.json, both in one commit per docs/launch.md step 8. Updated the one hardcoded pre-launch assertion in src/brand/indexing.test.ts (it expected indexable:false) to match; the rest of the 2903-test suite reads the flag dynamically and needed no change. bun run test --maxWorkers=1 src/brand (42 tests), lint, typecheck and build are all green. AC #3 (bun tools/check-share.ts against the deployed production URL) is out of scope for an isolated worktree and is documented on the task as the owner's post-merge step.
<!-- SECTION:FINAL_SUMMARY:END -->
