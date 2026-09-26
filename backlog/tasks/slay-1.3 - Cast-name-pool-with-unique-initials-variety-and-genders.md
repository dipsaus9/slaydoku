---
id: SLAY-1.3
title: 'Cast: name pool with unique initials, variety and genders'
status: To Do
assignee: []
created_date: '2026-09-26 19:32'
labels:
  - story
dependencies:
  - SLAY-1.1
references:
  - src/render/cards/
  - src/engine/generator/ladder/
  - src/content/packs/
  - src/content/cast/
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
- [ ] #1 src/render/cards/procedural/names.ts (or a new src/content/cast/) exposes castFor(size, seed, previousCast?) returning names, genders and portrait looks; deterministic per seed; unit tests cover 6..12 boards, uniqueness of initials, gender balance and pool membership
- [ ] #2 The pack/sweep gates (src/content/packs/gates.ts) reject a puzzle with duplicate initials, unbalanced genders or names outside the pool; generateLadder and the pack cast builder use the new function
- [ ] #3 Portraits do not depend on the name: at least 4 female-coded and 4 male-coded generic portrait designs plus colour variants, no likeness to real people; verified by looking at a contact sheet (tools/icon-sheet style) stored outside the repo
- [ ] #4 bun run lint/typecheck/test (--maxWorkers=1) and audit:personal pass
<!-- AC:END -->
