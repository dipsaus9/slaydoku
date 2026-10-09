---
id: SLAY-18.10
title: Regenerate seasonal windows and verify on screen
status: To Do
assignee: []
created_date: '2026-10-08 09:23'
updated_date: '2026-10-09 07:20'
labels:
  - needs-owner-review
dependencies:
  - SLAY-18.6
  - SLAY-18.7
  - SLAY-18.8
  - SLAY-18.9
  - SLAY-17.6
  - SLAY-17.10
  - SLAY-19.1
  - SLAY-20
  - SLAY-22
  - SLAY-24
references:
  - src/content/schedule/
  - docs/authoring/schedule.md
  - docs/handoff.md
  - docs/verification/
parent_task_id: SLAY-18
type: chore
ordinal: 134000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: schedule days that fall in a seasonal window and are still in the future are regenerated with their seasonal theme (bun run schedule --start <first future day> --overwrite, per window), days up to and including today stay byte-identical, rendered sample days of each seasonal theme are checked on screen, and docs/handoff.md and docs/authoring/schedule.md describe the calendar, the seasonal flag and how to add a Simpshouse date.
Type: deliverable
Branch: SLAY-18.10/regenerate-seasonal
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Days up to and including the current UTC date are byte-identical to main
- [ ] #2 Rendered screens of a sample day per seasonal theme at 390 and 1024 wide show a sensible house, one chair look and no out-of-place objects
- [ ] #3 docs/handoff.md and docs/authoring/schedule.md updated (calendar, seasonal flag, Simpshouse date list, Halloween 2026 missed)
- [ ] #4 bun run schedule:check, the per-day gates and bun run test --maxWorkers=1 pass
- [ ] #5 Owner has seen the rendered sample days and approved (only the owner ticks this)
- [ ] #6 This is the FINAL regeneration, covering 2026-10-09 (or the first day after the current UTC date when it runs) through 2027-01-01 only (owner decision: deliver puzzles through 2027-01-01; later days are removed from the schedule): every day after the current UTC date is regenerated with everything on main (room rules, chair cap, density and board mix rules, new decor objects, registered seasonal themes, Simpshouse on the 1st of each month and on 2026-10-14 in normal sizes with Romy and Dennis always in the cast); days up to the current UTC date are byte-identical, and so is 2026-10-10 (the SLAY-24 Simpshouse test day, played by then); casts of days next to a regenerated Simpshouse day stay unique
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. A published day must never change: no --overwrite on days up to today.

Scope widened 2026-10-08: besides the seasonal windows this story regenerates ALL future days once more, after SLAY-19.1 (decor objects) and the four seasonal themes, so players see the final content. SLAY-17.6 only does the first pass.

Plan change 2026-10-08: waits for SLAY-20 (UI feedback) and SLAY-21 (object density cap) so the final regeneration uses the capped generator.

Findings from the theme workers (2026-10-08), all for this story: (1) Registration moved here: flip the four exports in src/content/themes/index.ts consumers (FALL_THEME, CARNAVAL_THEME, CHRISTMAS_THEME, HALLOWEEN_THEME from undefined to fallTheme, carnavalTheme, christmasTheme, halloweenTheme), un-skip *.registered.test.ts / it.skip(SLAY-18.10 enables) tests, flip the fall test that asserts FALL_THEME === undefined. (2) The pair gate in src/schedule/gates.ts rejects two consecutive days with the same size, tier and theme, but inside a seasonal window the picker plans exactly that (e.g. 2026-12-12/13 6x6 easy-medium christmas, 2027-10-19 9x9 hard halloween twice); another seed cannot fix it: make the rule "a different set of rooms" for consecutive days of one seasonal window (or re-roll size/tier in the picker for window days). (3) pick.test.ts "never repeats a theme two days in a row" must exempt seasonal windows. (4) objectClues.test.ts expects a lower-case noun after "than a": "a Christmas tree" (christmas) will fail once registered; fix the test or the noun casing. (5) Shared look-completeness test covers the seasonal themes only once registered. (6) calendar.test.ts themeOf-for-every-scheduled-day and schedule.test.ts follow the picker after regeneration. (7) Days up to 2026-10-08 and 2026-10-14 stay byte-identical; regenerate the rest once, after SLAY-20 (tints/notes/no swipe) and SLAY-21 (object density cap).

Plan change 2026-10-08: also waits for SLAY-22 (first 100 levels max 9x9, hard from day one) so the final regeneration uses the new size and tier rules.

SLAY-21 (object density cap) was merged into SLAY-22 on 2026-10-08 so the generator rules are measured, swept and approved once.

From the Christmas review: the December test only checks the first seed of each day; after regenerating, check that no two consecutive December days share a set of rooms in the committed schedule.

From the SLAY-20 review: the minimum difference of 8.0 between touching rooms (roomStyles.test.ts, TINT_CHROMA_SCALE 0.4) sits just under the closest pair of the current schedule (8.02); after the regeneration this test can fail on a new closest pair: re-check it and choose the palette or the threshold from the regenerated days, not the other way round.

2026-10-09 owner decisions: Simpshouse is no longer frozen on 2026-10-14 (regenerate it in a normal size), comes back on the 1st of every month and had a one-off test day on 2026-10-10 (SLAY-24); everything in the same size format.

2026-10-09: merged into SLAY-24 (owner's suggestion: one regeneration, one PR, one owner check). Its criteria and References now live in SLAY-24; archived.
<!-- SECTION:NOTES:END -->
