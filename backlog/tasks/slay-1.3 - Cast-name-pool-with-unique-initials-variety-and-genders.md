---
id: SLAY-1.3
title: 'Cast: name pool with unique initials, variety and genders'
status: Done
assignee: []
created_date: '2026-09-26 19:32'
updated_date: '2026-09-26 22:27'
labels:
  - story
dependencies:
  - SLAY-1.1
references:
  - src/render/cards/
  - src/engine/generator/ladder/
  - src/content/packs/
  - src/content/cast/
  - src/content/demo/
  - src/content/levels.ts
  - src/content/levels.test.ts
  - src/ui/play/people.ts
  - src/ui/play/people.test.ts
  - src/ui/play/PlayScreen.test.tsx
  - src/ui/levels/levels.test.ts
  - tools/ladder.ts
  - tools/screen-level.ts
  - tools/portrait-sheet.ts
  - docs/authoring/
  - MIGRATION.md
parent_task_id: SLAY-1
type: feature
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a pool of simple neutral English names with genders, several per initial letter and both genders per letter (no Q, U, X, Z). For a puzzle of N people the schedule tool picks N-1 distinct letters and one name per letter with genders balanced (counts differ by at most 1), seeded, so everything is fixed in the schedule file; consecutive days do not repeat the same set. Avatars are decoupled from names: generic drawn or procedural portraits by gender slot and colour. Gates: unique initials, balanced genders, names from the pool.
Type: deliverable
Branch: SLAY-1.3/cast-pool
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 src/render/cards/procedural/names.ts (or a new src/content/cast/) exposes castFor(size, seed, previousCast?) returning names, genders and portrait looks; deterministic per seed; unit tests cover 6..12 boards, uniqueness of initials, gender balance and pool membership
- [x] #2 The pack/sweep gates (src/content/packs/gates.ts) reject a puzzle with duplicate initials, unbalanced genders or names outside the pool; generateLadder and the pack cast builder use the new function
- [x] #3 Portraits do not depend on the name: at least 4 female-coded and 4 male-coded generic portrait designs plus colour variants, no likeness to real people; verified by looking at a contact sheet (tools/icon-sheet style) stored outside the repo
- [x] #4 bun run lint/typecheck/test (--maxWorkers=1) and audit:personal pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Pool + castFor in src/content/cast; portraits by gender slot (16 designs x colours); gates via castProblems; ladder labels and pack builder use castFor; docs/authoring/cast.md; contact sheet reviewed outside repo.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Delivered: pool 22 letters (A-Y minus Q,U,X), castFor, castProblems gate, 16 portrait designs, contact sheet checked visually (outside repo). Touched src/ui/play/people.ts (castFor(puzzle) now builds looks from the puzzle's baked names) and UI tests that hardcoded Alice/Ben/Chloe; overlaps SLAY-1.2 (src/ui).

Review (story-reviewer): pass, all 4 criteria met, no scope violations. Advisory: contact sheet PNG re-rendered at HEAD and re-checked (16 designs, 6 colour variants, sample casts of 6/9/12/16); src/ui/lab/generate.ts still uses the buildCastForBoard wrapper (works, outside References).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Cast system: pool of plain English names with genders (22 initial letters A-Y without Q,U,X; 2+ names per gender per letter) in src/content/cast, castFor(size, seed, previousCast) picking size-1 names on distinct initials with genders balanced within one, seeded, avoiding the previous cast; castProblems gate (pool membership, unique initials, pool genders, balance) in entryProblems; generateLadder labels/genders and the pack builder use castFor; 16 generic portrait designs (8 female-coded, 8 male-coded) x colour variants mapped by gender slot and seed, never by name; contact sheet tool tools/portrait-sheet.ts; docs/authoring/cast.md; demo level regenerated with pool names.
<!-- SECTION:FINAL_SUMMARY:END -->
