---
id: SLAY-17.7
title: Branch preview deployments for branches named <id>/preview-*
status: To Do
assignee: []
created_date: '2026-10-08 09:44'
labels:
  - story
dependencies: []
references:
  - vercel.json
  - docs/launch.md
  - CLAUDE.md
  - docs/handoff.md
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
- [ ] #1 vercel.json ignoreCommand builds main and branches matching */preview-*, skips every other branch (exit 0 = skip, exit 1 = build); the rule is covered by a unit test over sample refs: main, SLAY-17.8/preview-look-poc build; SLAY-17.1/room-rules-home, plan/SLAY-18 skip
- [ ] #2 A throwaway branch SLAY-17.7/preview-check gets a Vercel deployment and a throwaway branch without preview- in its name shows Canceled by Ignored Build Step (both deleted afterwards)
- [ ] #3 The preview URL is noindex: bun run check:share (or the launch.md check) passes against the preview, headers and meta tag included
- [ ] #4 docs/launch.md (the ignoreCommand check and the Vercel settings lines), CLAUDE.md (Vercel rule) and the README/handoff mention are updated to the new rule
- [ ] #5 bun run lint, typecheck and test --maxWorkers=1 pass
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Note for the deploy limit: previews use one deploy per push to a preview-* branch; delete preview branches after the owner decides. Do not use --admin or bypass branch protection.
<!-- SECTION:NOTES:END -->
