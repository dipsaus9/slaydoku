---
id: SLAY-13.5
title: Raise or document the very-easy variety-gate tolerance for 9x9 and 16x16
status: To Do
assignee: []
created_date: '2026-09-30 16:34'
labels: []
dependencies: []
references:
  - src/content/packs/gates.ts
  - src/engine/generator/ladder/
  - docs/authoring/scaling.md
parent_task_id: SLAY-13
type: chore
ordinal: 87000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: bun run validate:generation's default sweep no longer flags very-easy on 9x9/16x16 as under the minimum success rate, OR docs/authoring/scaling.md's documented floor for those cells is updated to match their real, measured rate -- so the sweep's pass/fail line reflects reality again.

Context (found while delivering SLAY-13.4, the schedule regeneration under SLAY-13.2's size-banded SOLVABLE_TIERS and SLAY-13.3's normalized score v2): a wide-sample A/B (200 seeds for 9-very-easy-school, 100 seeds for 16-very-easy-home) comparing the commit immediately before SLAY-13.2 (3f9046e) against after SLAY-13.2+13.3 found:

- 9-very-easy-school: 33% (66/200) before vs 37% (74/200) after -- healthy, not a regression, well clear of the 25% floor at this sample size.
- 16-very-easy-home: 26% (26/100) before vs 21% (21/100) after -- a real, modest decline (not sampling noise at n=100), crossing from just-above to just-below the 25% floor.

This is not a new problem: docs/authoring/scaling.md already named "very-easy at 9 and 16" as the sweep's weak cells before this epic, and 16x16 very-easy specifically as "the weakest cell" (historical ~25%). SLAY-13.2/13.3's size-banded tier requirements + normalized score v2 squares part appear to have nudged 16x16's already-marginal variety gate a few points further down. This does not affect the live schedule: the schedule never generates size 16 at all (src/schedule/pick.ts's SIZE_WEIGHTS only draw 6, 7, 9, 12 -- CLAUDE.md: "never 16x16"), so no player-facing puzzle is affected; this is purely a generator-health/pack-scaling concern for a future 16x16 pack or a future schedule size change.

Not fixed in SLAY-13.4 because the relevant code (the ladder generator's variety gate, src/content/packs/gates.ts / src/engine/generator/ladder/) is outside that story's References (src/content/schedule/ only).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 bun run validate:generation --sizes 16 --tiers very-easy --themes home --seeds 100 clears the 25% minimum, OR docs/authoring/scaling.md's documented floor/expectation for 16x16 very-easy (and 9x9 very-easy if still borderline) is updated to state the real measured rate, with a note on why
- [ ] #2 If the variety gate is loosened, existing coverage (gates.test.ts and any generator matrix/sweep tests touching variety) is updated and still meaningfully guards against genuinely too-samey very-easy puzzles
- [ ] #3 No committed schedule day or committed pack puzzle is affected (16x16 is not in either today) -- confirm with bun run test --maxWorkers=1 and bun run schedule:check
<!-- AC:END -->
