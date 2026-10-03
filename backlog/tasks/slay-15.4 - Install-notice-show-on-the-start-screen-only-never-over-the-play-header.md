---
id: SLAY-15.4
title: 'Install notice: show on the start screen only, never over the play header'
status: Done
assignee: []
created_date: '2026-10-03 09:16'
updated_date: '2026-10-03 10:19'
labels:
  - story
dependencies: []
references:
  - src/pwa/InstallNotice.tsx
  - src/pwa/InstallNotice.test.tsx
  - src/pwa/pwa.css
  - src/pwa/pwa.test.tsx
  - src/pwa/installPath.ts
parent_task_id: SLAY-15
type: feature
ordinal: 104000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the PWA install notice no longer overlaps the play-screen header on first load; it appears on the start screen (and About) and not on /play.
Type: deliverable
Branch: SLAY-15.4/install-notice-start-only
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 On /play at 360x640 and 390x844, in en and nl, the install notice is not rendered and the header controls are all reachable (measured in headless Chrome)
- [x] #2 On the start screen the install notice still shows as before for iOS Safari and Chromium install prompts, dismissal still remembered
- [x] #3 Update-notice stacking rule in pwa.css still works; InstallNotice tests updated; lint, typecheck, test --maxWorkers=1 green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured in headless Chrome (standalone script, full verify:phone does not complete in this sandbox) at 360x640 and 390x844, en and nl, iPhone Safari UA, dev date 2026-10-15: start and About show the notice; /play (direct load and in-app navigation) has none and all 4 header controls are reachable (elementFromPoint). pwa.css untouched, so the update-notice stacking rule is unchanged.

Review: pass, no scope violations. Advisory: no render test of InstallNotice on /play (helper tested directly; /play measured in Chrome).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The install notice now renders only on the start screen and About (showsInstallNotice in src/pwa/installPath.ts, gated in InstallNotice via usePath); never on /play. Verified in headless Chrome at 360x640 and 390x844, en and nl; pwa.css untouched.
<!-- SECTION:FINAL_SUMMARY:END -->
