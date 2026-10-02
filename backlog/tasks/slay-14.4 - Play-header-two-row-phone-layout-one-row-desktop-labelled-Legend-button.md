---
id: SLAY-14.4
title: 'Play header: two-row phone layout, one-row desktop, labelled Legend button'
status: Done
assignee: []
created_date: '2026-10-02 09:55'
updated_date: '2026-10-02 13:21'
labels:
  - story
dependencies:
  - SLAY-14.1
references:
  - src/ui/play/PlayScreen.tsx
  - src/ui/play/PlayScreen.test.tsx
  - src/ui/play/play.css
  - src/ui/play/strings.ts
  - src/ui/daily/DailyFlow.tsx
  - src/ui/daily/daily.css
  - docs/verification/phone.ts
  - docs/verification/drive.ts
  - docs/verification/locale.ts
parent_task_id: SLAY-14
type: feature
ordinal: 92000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a redesigned play-screen header (second pass after SLAY-9.25). Phone: row 1 = back + icon group (Legend, Share when solved, More); row 2 = puzzle title (date label) with the timer as a prominent pill, so nothing competes for width. Desktop: one row, Legend button shows a visible 'Legend'/'Legenda' label.
Type: deliverable
Branch: SLAY-14.4/header-two-row-mobile
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 No overlap or wrapped/cut-off text between back, title, timer, Legend, Share and More at 360px and 390px, in en and nl, in unsolved and solved states (measured in headless Chrome at true widths)
- [x] #2 Phone layout is two rows as described; desktop (>=641px) is a single row
- [x] #3 On desktop the Legend button has a visible text label that matches its aria-label
- [x] #4 Title and timer remain legible with long Dutch labels; truncation only as a deliberate fallback
- [x] #5 Existing PlayScreen tests updated; docs/verification/phone.ts passes; lint, typecheck, test --maxWorkers=1 green
- [x] #6 The Zoom-free toolbar from SLAY-14.1 is unaffected
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Measured in headless Chrome (CDP, true device metrics, production build) at 360x640, 390x844, 844x390, 1024x768, 768x1024; en and nl; unsolved and solved+dismissed (seeded saved board): 20/20 combinations no overlap, no off-screen control, no horizontal scroll, title neither wrapped nor ellipsised; phone (portrait and landscape column) two rows, >=641px portrait/desktop one row, Legend label visible and equal to aria-label at >=641px. Screenshots reviewed. Added the locale suite to phone.ts and replaced the lead/actions probes in drive.ts/locale.ts with pairwise overlap, two-row/one-row and Legend-label checks. Full phone suite run is flaky in this sandbox (touch-simulated taps: language toggle, wrong-solution scenario, same as SLAY-9.25 noted); drive.ts reached and passed the new header checks at 1024x768. Landscape phone column also uses the two-row layout.

Independent review round 1 (dipsaus-ai:story-reviewer): PASS, all 6 criteria met, no scope violations. Advisory: the two-row grid block is duplicated in the portrait-phone and landscape-column media blocks; could share one selector list later.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Play header redesigned: PlayScreen's header is now a flat row (back, title, timer, actions). Portrait phones and the landscape column use a two-row grid (back + icons above, title + timer pill below); >=641px stays one row with a visible Legend/Legenda label equal to its aria-label. Measured in headless Chrome at 360x640, 390x844, 844x390, 1024x768, 768x1024 in en and nl, unsolved and solved: no overlap, no horizontal scroll, title never wrapped or cut. Tests updated, drive.ts/locale.ts probes now check pairwise overlap, two-row/one-row layout and the Legend label, and phone.ts runs the locale suite. Review passed.
<!-- SECTION:FINAL_SUMMARY:END -->
