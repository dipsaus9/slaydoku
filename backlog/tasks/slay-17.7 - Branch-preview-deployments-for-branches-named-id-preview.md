---
id: SLAY-17.7
title: Branch preview deployments for branches named <id>/preview-*
status: Done
assignee: []
created_date: '2026-10-08 09:44'
updated_date: '2026-10-08 10:10'
labels:
  - story
dependencies: []
references:
  - vercel.json
  - docs/launch.md
  - CLAUDE.md
  - docs/handoff.md
  - README.md
  - tools/vercel-ignore.test.ts
  - tools/check-share.test.ts
parent_task_id: SLAY-17
type: chore
ordinal: 135000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: Vercel builds main plus every branch whose name matches */preview-* (for example SLAY-17.8/preview-look-poc), so the owner can test a feature on a phone before it rolls out. All other branches stay skipped because of the hobby plan's daily deploy limit. Owner approved this change to the CLAUDE.md decision 'only main is built' on 2026-10-08.
Type: deliverable
Branch: SLAY-17.7/preview-branch-deploys
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 vercel.json ignoreCommand builds main and branches matching */preview-*, skips every other branch (exit 0 = skip, exit 1 = build); the rule is covered by a unit test over sample refs: main, SLAY-17.8/preview-look-poc build; SLAY-17.1/room-rules-home, plan/SLAY-18 skip
- [x] #2 A throwaway branch SLAY-17.7/preview-check gets a Vercel deployment and a throwaway branch without preview- in its name shows Canceled by Ignored Build Step (both deleted afterwards)
- [x] #3 The preview URL is noindex: bun run check:share (or the launch.md check) passes against the preview, headers and meta tag included
- [x] #4 docs/launch.md (the ignoreCommand check and the Vercel settings lines), CLAUDE.md (Vercel rule) and the README/handoff mention are updated to the new rule
- [x] #5 bun run lint, typecheck and test --maxWorkers=1 pass
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Note for the deploy limit: previews use one deploy per push to a preview-* branch; delete preview branches after the owner decides. Do not use --admin or bypass branch protection.

Live check: SLAY-17.7/preview-check got a Vercel Preview deployment (success); SLAY-17.7/skip-check got 'Canceled by Ignored Build Step'; both branches deleted. AC3 caveat: the preview URL sits behind Vercel deployment protection (SSO redirect), so check:share cannot run against it unauthenticated; check:share passed 66/66 against a local build, and the noindex headers come from vercel.json which applies to all deployments.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Vercel now builds main and */preview-* branches via a case-based ignoreCommand in vercel.json, covered by tools/vercel-ignore.test.ts (runs the real command over sample refs); CLAUDE.md, README, docs/launch.md and docs/handoff.md updated; live-checked with two throwaway branches (deployed vs Canceled).
<!-- SECTION:FINAL_SUMMARY:END -->
