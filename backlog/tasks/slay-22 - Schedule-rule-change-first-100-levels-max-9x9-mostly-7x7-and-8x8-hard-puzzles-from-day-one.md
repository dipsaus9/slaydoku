---
id: SLAY-22
title: >-
  Schedule rule change: first 100 levels max 9x9, mostly 7x7 and 8x8, hard
  puzzles from day one
status: In Progress
assignee: []
created_date: '2026-10-08 20:03'
updated_date: '2026-10-09 06:30'
labels:
  - story
  - needs-owner-review
dependencies:
  - SLAY-19.1
references:
  - src/schedule/pick.ts
  - src/schedule/pick.test.ts
  - src/schedule/launch.ts
  - src/schedule/build.ts
  - src/schedule/build.test.ts
  - src/engine/generator/
  - src/engine/scenegen/
  - src/content/packs/
  - src/content/themes/rooms.test.ts
  - src/content/themes/variety.test.ts
  - docs/authoring/
  - docs/solvability/
  - docs/verification/
  - docs/design/looks-shots/
  - docs/launch.md
  - CLAUDE.md
  - docs/handoff.md
  - src/content/themes/decor.test.ts
  - src/engine/solvable/tiers.ts
  - src/engine/solvable/tiers.test.ts
  - src/schedule/cast.simpshouse.test.ts
  - src/schedule/check.ts
  - src/schedule/gates.ts
  - src/schedule/schedule.test.ts
  - src/content/objectClues.test.ts
type: feature
ordinal: 143000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: owner decision 2026-10-08. 12x12 puzzles are hard to play on a phone, so for the first 100 levels (puzzle number 1 to 100, 2026-09-27 to 2027-01-04) the board is at most 9x9: most puzzles are 7x7 or 8x8, now and then 6x6 or 9x9 (recommended weights: 7x7 35%, 8x8 35%, 6x6 15%, 9x9 15%; the worker measures and proposes the final numbers). Difficulty is no longer tied to a big grid: a hard puzzle may be 6x6 and the ramp-up window (RAMP_UP_END_DATE 2026-10-31, no hard and no expert) is removed, so hard and expert can occur from the next regenerated day. Expert stays exactly one per UTC week, on 9x9, on the seeded random weekday. Other days keep the tier mix very-easy 15%, easy 30%, easy-medium 25%, medium 20%, hard 10% (the worker checks the hard share stays about 10% over the 100 levels and that hard on 6x6 to 8x8 is generated and solvable by the ladder tiers of docs/solvability/README.md). From level 101 the earlier size preference applies again (6x6 and 9x9 preferred, 7x7 and 12x12 occasionally), unless the worker finds a reason to keep the cap and says so. Days up to today and the Simpshouse day 2026-10-14 stay byte-identical; this story changes the picker, generator support and rules only: the schedule files are regenerated once by SLAY-18.10. CLAUDE.md decisions (grid sizes, expert rule, ramp-up window) and docs are updated with the new rule, which the owner asked for.
Type: deliverable
Branch: SLAY-22/first-100-levels-smaller-grids
MERGED 2026-10-08 (owner: optimise stories, merge to avoid generating and testing twice): this story also carries the former SLAY-21 (object density cap). Owner feedback: too many objects are placed in a single room, which makes the puzzle harder to read. The scene generator limits the object density per room: a cap on placed objects per room that grows with the room's size (squares), measured first on the baked schedule and on generated scenes (objects per room and per square, per theme and board size, with the new sizes 6 to 9 including 8x8), chosen so rooms look furnished but not crowded; structural kinds count too, rooms keep their signature objects, the allow-list rules, chair caps and variety numbers of SLAY-17.6/19.1 stay. Both changes share one measurement round, one sweep and one owner check of rendered boards; the schedule is regenerated once by SLAY-18.10.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Size picker: for puzzle numbers 1 to 100 only 6x6, 7x7, 8x8 and 9x9 are drawn, with 7x7 and 8x8 together at least 60% and 12x12 never, measured over the 100 planned levels and a long seeded sample; from level 101 the previous size rules apply (tested, constants named and documented)
- [x] #2 8x8 boards work end to end: scene generation and the themes' room layouts, generator budget and soundness on 8x8 for every tier and theme (a sweep over fresh seeds finds no failures; add 8x8 to the supported sizes, tests and docs/authoring if it is not yet supported)
- [x] #3 Hard puzzles on 6x6, 7x7 and 8x8: the picker allows tier hard on all sizes of the first 100 levels, the generator produces them within budget, they stay solvable by a human per docs/solvability/README.md (ladder tiers and caps) and the hint walk works (sweep and a rendered check of one 6x6 hard puzzle)
- [x] #4 The ramp-up window is removed: RAMP_UP_END_DATE, isRampUp and the suppressed-expert handling and their tests are deleted or reworked; expert is exactly one per UTC week on a 9x9 board; the tier mix of other days is unchanged and measured
- [x] #5 Days up to today and 2026-10-14 are byte-identical, no schedule file changes in this story; schedule:check and the full test run pass; lint and typecheck pass
- [x] #6 CLAUDE.md (Grid, Expert, Ramp-up) and docs (docs/handoff.md, docs/authoring/schedule.md, docs/launch.md where it mentions sizes or the ramp-up) state the new rules; the old 'no hard in the first month' rule is gone
- [ ] #7 A table of the planned size and tier distribution for levels 1 to 100 is in the PR (counts per size and per tier) for the owner to approve before merge (only the owner ticks this)
- [ ] #8 Rendered sample boards (home, office, school, park, shop; 7x7, 8x8 and 9x9; phone and desktop) show rooms furnished but not crowded; screenshots in the PR for the owner to approve together with the size and tier table
- [x] #9 Object density and board mix (owner 2026-10-09: no cluttered boards, every board looks like a real place, variety = kinds per board): a per-room cap that grows with the room's squares and no bare room of 3+ squares; per board a density cap in objects per square that falls as the board grows (sizes 6 to 12), a minimum of distinct kinds and of object families that grows with the board, no kind or family dominating, and a target family mix per theme with a tolerance; the generator re-draws boards outside it; baselines (baked schedule, main's generator) and results (distinct kinds per board, objects per square per size, share of boards inside the tolerance before and after the re-draw, at least 95% on a sweep over fresh seeds) recorded in docs/authoring/room-rules.md; unit tests plus a slow sweep; allow-lists, chair caps and per-kind caps still hold
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1) measure density baseline (baked + 200 generated scenes per theme and size 6-9); 2) cap objects per room 1+floor(n/5), even signature pick, REPEAT_FACTOR 0.2, no bare rooms of 3+; 3) picker: current rules from RULES_FROM 2026-10-09 (levels 1-100 7x7 42/8x8 42/6x6 10/9x9 6, expert 9x9, no ramp-up; 101+ earlier size rules), frozen launch rules for played days and KEPT_DATES, PENDING_REGENERATION_THROUGH for committed days until SLAY-18.10; 4) 8x8 in pack sizes and sweeps; 5) sweep 6-9 all tiers/themes, rendered boards and 6x6 hard hint walk; 6) docs
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Generation sweep (validate:generation --seeds 10 --start 52000 --sizes 6,7,8,9 --tiers all --themes all): 1189/1440 seeds pass every gate, 0 wrong puzzles; hard 6x6 57/60, 7x7 55/60, 8x8 48/60; only 9-very-easy-park under the tool's 25% (2/10; 30 seeds: 20% vs 33% on main, variety gate). 9x9 very-easy yield fell for park/school/shop with the cap (main 33/57/60% -> 20/37/33% on 30 seeds), rose for home/office/simpshouse; with 50 seeds per day a day runs dry with p ~ 1e-5. Rendered hint walk of a 6x6 hard park puzzle: 11 hints, on-screen text equals the mirrored nextStep every step, solved. Planned table levels 1-100: 6x6 16, 7x7 34, 8x8 27, 9x9 21, 12x12 2 (played day 12 and kept 2026-10-14); very-easy 11, easy 24, easy-medium 26, medium 18, hard 8, expert 13.

Review (story-reviewer, round 1): BLOCK on AC8 only: distinct kinds per room fell below the SLAY-19.1 baseline in park (2.69 vs 2.89) and shop (2.60 vs 2.73) because the cap leaves fewer objects per room (park 2.75 objects/room cannot hold 2.89 distinct kinds). Needs an owner decision: accept the distinct-share metric (rose in every theme) or loosen the cap. ACs 1-7 and 9 met, no scope violations after widening References (check.ts, gates.ts, schedule/cast tests, tiers.ts/test, decor.test.ts, handoff). Advisories fixed in ba7c13a (constant assertion removed, slow sweep bare==0, handoff notes on 9x9 very-easy yield and closets). Verification: lint, typecheck, test (3703 passed), schedule:check (108 days) green; verify:phone 3074 checks + zoom 844x390 rerun 40/40 (first run crashed, transient); test:slow 66/67, the failure (16x16 benchmark fixture byte-for-byte regeneration) fails on main 0650617 too.

Owner decision 2026-10-09 (via coordinator): the goal is boards that are not cluttered and look like a real situation; variety means how many different kinds a board shows, not per room. Old criterion 8 (per-room cap, SLAY-17.6/19.1 variety numbers incl. distinct kinds per room) replaced by new criterion 9 (board-level density, kinds, families, target family mix per theme, re-draw); the old rendered-boards criterion is now #8 (renumbered by --remove-ac). The per-room distinct-kinds comparison with SLAY-19.1 that review round 1 blocked on is dropped.
<!-- SECTION:NOTES:END -->
