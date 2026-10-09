---
id: SLAY-18.6
title: Fall theme
status: Done
assignee: []
created_date: '2026-10-08 09:22'
updated_date: '2026-10-09 06:18'
labels:
  - needs-owner-review
dependencies:
  - SLAY-18.4
  - SLAY-18.5
  - SLAY-17.4
  - SLAY-18.11
references:
  - src/content/themes/fall.ts
  - src/content/themes/fall.rooms.test.ts
  - src/render/icons/themes/fallArt.ts
  - src/render/icons/themes/fallArt.tsx
  - src/render/icons/themes/fallIcons.ts
  - docs/design/looks-shots/slay-18.6/
  - docs/themes/seasonal/fall.theme.ts
parent_task_id: SLAY-18
type: feature
ordinal: 130000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the Fall theme (1-16 October and 1-30 November except the 11th), built to the approved preview of SLAY-18.5: rooms with EN and NL names, objects with allow-lists, one chair look, art in the approved 3D look, registered as seasonal.
Type: deliverable
Branch: SLAY-18.6/fall-theme
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The theme matches the owner-approved fall preview of SLAY-18.5
- [x] #2 Every kind has an allow-list and an allowed room; a sweep over many seeds finds no out-of-room placement (src/content/themes/fall.rooms.test.ts)
- [x] #3 New art follows the look chosen in SLAY-17.3/17.4 and the plain chair is the only chair
- [x] #4 Registered as seasonal; the calendar picks it for fall days and the themes of all other days are unchanged (test)
- [x] #5 bun run lint, typecheck and test --maxWorkers=1 pass
- [x] #6 New drawings follow the approved look (docs/design/looks.md 'How to draw a new object' from SLAY-17.4) and pass the look-completeness test
- [x] #7 Owner has seen rendered levels of the theme and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it.

Plan change 2026-10-08: the four seasonal themes no longer run as a chain. After SLAY-18.11 each theme only touches its own module and icon files, so 18.6 to 18.9 can be built in parallel.

Built from the SLAY-18.5 draft (deviations listed in src/content/themes/fall.ts and docs/themes/seasonal/fall.theme.ts). Art file is fallArt.ts, not .tsx: the generator worker may import no .tsx module (src/ui/lab/worker.test.ts) and the icon sets reach it through themes/types.ts; the other three seasonal stubs (<id>Art.tsx) will hit the same test. BLOCKER for AC 4/5: registering a seasonal theme makes themeOf() pick it for committed schedule days in its window (2026-10-01..16 and November are baked with rotation themes), so src/schedule/schedule.test.ts ('follows the picker', 'cheap schedule checks', 44 problems) and src/schedule/calendar.test.ts ('themeOf gives the committed theme') fail. Past days must stay byte-identical (SLAY-18.10), so these shared tests/gates need a rule for seasonal-window days baked before the theme registered; not done here because the files are shared by all four seasonal stories.

Plan change (orchestrator, 2026-10-08): the theme is NOT registered in this story. fall.ts exports the complete theme as fallTheme; FALL_THEME (what index.ts registered(...) reads) stays undefined with a comment, and SLAY-18.10 flips it to fallTheme together with the regenerated days. fall.rooms.test.ts tests fallTheme directly (data, Dutch nouns, one chair, allow-list sweep over 200 scenes, caps, block art in 8 orientations) and checks the calendar as it will be once registered; it also asserts FALL_THEME is undefined, which SLAY-18.10 must flip. The schedule is untouched and src/content, src/render, src/ui/lab and src/schedule tests are green (1233). The blocker in the earlier note is resolved by this change. AC 4 (registration) moves to SLAY-18.10.

Verification 2026-10-09 (after owner approval): bun run test --maxWorkers=1 3748 passed / 8 skipped / 0 failed; verify:phone 3114 checks 0 failures; docs/verification/looks.ts 146 PASS, all checks passed; lint and typecheck clean. Review gate (story-reviewer): pass, no scope violations; one advisory (undocumented room-type changes against the draft) fixed in the fall.ts and draft headers. AC 4 judged per the plan change: seasonal and tested as registered, FALL_THEME stays undefined until SLAY-18.10; schedule files untouched.

Owner approval in chat (2026-10-09): "Herfsthema is akkoord". Ticked by the orchestrator. Verified on head dabda89 by the worker: full suite 3748 passed/8 skipped, verify:phone 3114/0, looks driver 146 pass, review pass. Registration of fall moves to SLAY-18.10.
<!-- SECTION:NOTES:END -->
