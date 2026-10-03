---
id: SLAY-15.4
title: 'Install notice: show on the start screen only, never over the play header'
status: To Do
assignee: []
created_date: '2026-10-03 09:16'
labels:
  - story
dependencies: []
references:
  - src/pwa/InstallNotice.tsx
  - src/pwa/InstallNotice.test.tsx
  - src/pwa/pwa.css
  - src/pwa/pwa.test.tsx
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
- [ ] #1 On /play at 360x640 and 390x844, in en and nl, the install notice is not rendered and the header controls are all reachable (measured in headless Chrome)
- [ ] #2 On the start screen the install notice still shows as before for iOS Safari and Chromium install prompts, dismissal still remembered
- [ ] #3 Update-notice stacking rule in pwa.css still works; InstallNotice tests updated; lint, typecheck, test --maxWorkers=1 green
<!-- AC:END -->
