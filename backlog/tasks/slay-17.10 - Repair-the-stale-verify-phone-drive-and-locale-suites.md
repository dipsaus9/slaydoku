---
id: SLAY-17.10
title: 'Repair the stale verify:phone drive and locale suites'
status: To Do
assignee: []
created_date: '2026-10-08 14:13'
labels:
  - story
dependencies: []
references:
  - docs/verification/drive.ts
  - docs/verification/locale.ts
  - docs/verification/phone.ts
  - docs/verification/report.md
  - docs/handoff.md
parent_task_id: SLAY-17
type: chore
ordinal: 138000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the two browser-driver suites that went stale (drive fails at the result screen since SLAY-9.13/9.15, locale cannot find the Dutch 'Meer' tool; both noted in docs/handoff.md) pass again against the current UI, so bun run verify:phone is green end to end and can be trusted by later stories. Independent of the look and theme work.
Type: deliverable
Branch: SLAY-17.10/repair-stale-drivers
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/verification/drive.ts plays a full day through to the result screen with the current flow (victim placed by the player, hints, check, share) and passes at the verify:phone sizes
- [ ] #2 docs/verification/locale.ts finds the Dutch menu entry and passes in both locales
- [ ] #3 bun run verify:phone exits 0 (all suites: drive, legend, screens, zoom, locale and the rest)
- [ ] #4 The 'stale driver' lines in docs/handoff.md are updated; servers use an unusual port and no headless Chrome or shell is left behind
- [ ] #5 bun run lint, typecheck and test --maxWorkers=1 pass
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Use the dev date override (?date=2026-10-15, docs/daily-flow.md). Run the suites in the foreground with a generous timeout (verify:phone takes about 8 minutes). Do not change app behaviour to make a driver pass; fix the driver.
<!-- SECTION:NOTES:END -->
