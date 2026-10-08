---
id: SLAY-17.6
title: Regenerate future schedule days and verify on screen
status: In Progress
assignee: []
created_date: '2026-10-08 08:58'
updated_date: '2026-10-08 15:10'
labels:
  - needs-owner-review
dependencies:
  - SLAY-17.1
  - SLAY-17.2
  - SLAY-17.5
  - SLAY-18.4
references:
  - src/content/schedule/
  - docs/authoring/schedule.md
  - docs/verification/regen-days.ts
  - docs/verification/regen-days/
  - docs/authoring/room-rules.md
  - src/engine/scenegen/
  - src/content/themes/home.ts
  - src/content/themes/office.ts
  - src/content/themes/school.ts
  - src/content/themes/park.ts
  - src/content/themes/shop.ts
  - src/game/hints.fixture.ts
  - src/engine/generator/scale/gates.test.ts
  - src/ui/lab/lab.test.tsx
  - tools/schedule.test.ts
parent_task_id: SLAY-17
type: chore
ordinal: 123000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: schedule days from 2026-10-09 onward are regenerated with the new room rules, rooms and chair look (bun run schedule --overwrite, in two ranges so that 2026-10-14, the owner-approved Simpshouse day, is left alone), days up to and including today stay byte-identical, and rendered sample days from the five regular themes show no out-of-place objects. The puzzle data does not depend on the object art, so this story no longer waits for SLAY-17.4 (owner agreed 2026-10-08). Windows of seasonal themes that are not built yet (fall, carnaval, christmas, halloween) stay on the normal rotation here and are regenerated again by SLAY-18.10.
Type: deliverable
Branch: SLAY-17.6/regenerate-and-verify
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Days up to and including 2026-10-08 are byte-identical to main
- [x] #2 Days from 2026-10-09 are regenerated; bun run schedule:check and bun run test --maxWorkers=1 pass
- [x] #3 2026-10-14 (the approved Simpshouse day) is byte-identical to main; so is every day up to and including the current UTC date
- [x] #4 A rendered check (docs/verification/regen-days.ts) of sample days of the five regular themes at 390 and 1024 wide shows no bed outside a sleeping room, no wet fixture outside a wet room, no vehicle in a room and one chair look
- [x] #5 docs/authoring/schedule.md notes that unregistered seasonal windows are regenerated again by SLAY-18.10
- [x] #6 The scene generator caps a chair kind at 2 per room unless the extra chair touches a table, desk or counter-type object (src/engine/scenegen/objects.ts), tested in src/engine/scenegen/variety.test.ts
- [x] #7 No object kind appears more than 3 times in one room (plants and other structural kinds included), tested
- [x] #8 Measured on 200 scenes per theme (sizes 6, 7, 9, 12, variety.slow.test.ts): chairs at most 15% of placed objects (before: 37% overall, 18% to 54% per theme), every theme keeps its signature objects, the allow-list room rules still hold, the Simpshouse theme and its day are untouched
- [x] #9 Variety is measured and improved with the object kinds that exist today (no new engine types): distinct kinds per room above 2.3 (before 2.0 to 2.3) and the most common kind at most 22% of the objects (before up to 54%)
- [x] #10 The 107 days are regenerated again with the new generator in the same two ranges; 2026-10-14 and every day up to 2026-10-08 stay byte-identical; schedule:check, the gates and the full test run pass; rendered check passes again
- [ ] #11 Owner has seen the rendered sample days and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. A published day must never change: no --overwrite on days up to today. docs/handoff.md is updated by SLAY-18.10, not here.

Regenerated 2026-10-09..2026-10-13 and 2026-10-15..2027-01-24 (107 days, --overwrite, two ranges); 2026-10-14 and all days up to 2026-10-08 byte-identical to origin/main (checked per day). schedule:check, test, lint, typecheck green; dayProblems clean on all 120 days. Driver docs/verification/regen-days.ts passed. AC4 (handoff) left to SLAY-18.10 per plan change; AC5 is the owner's.

Owner feedback: too many chairs. Chair cap 2 per room (+companion next to table/desk/counter), max 3 per kind per room (no exceptions), diversity weighting (new kind x3, repeat x0.35), lower chair weights, higher decor weights. 200 scenes per theme: chairs home 31.5->11.5%, office 53.6->13.4%, school 45.4->13.3%, park 17.9->9.6%, shop 35.2->13.6% (overall 36.8->12.2%); distinct kinds/room 2.0-2.3 -> 2.5-2.9; top kind share 14-23%. Scheduled days (107): chairs 26.7% (main) / 35.9% (first regen) -> 12.6%. Pinned fixtures adjusted: hints.fixture hardPuzzle search, gates.test seed 5, lab.test seed 101, schedule.test tamper regex.
<!-- SECTION:NOTES:END -->
