---
id: SLAY-1
title: 'Epic: Slaydoku, a daily murder-grid puzzle (English, public)'
status: To Do
assignee: []
created_date: '2026-09-26 19:32'
labels:
  - epic
dependencies: []
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: Slaydoku is a public, Wordle-style daily puzzle: every UTC day everybody gets the same Murdoku-like murder-grid puzzle (same board, same clues, same names), solves it with notes, hints and zoom on phone or tablet, and shares time and hints on a card.

Chosen approach and why: a new project cloned from an earlier private prototype (with all personal content removed before the first commit) versus adding a daily mode to that prototype versus a shared package for both. The prototype is personal and Dutch, so a mode would leak into a public product; a shared package adds coordination for one owner. Chosen: a clean copy, reusing the whole engine (ladder generator, human-solvable tiers, hint audit, noun audit, sweep, rendered-screen checks), the play UI (zoom, phone and iPad layout, legend, how-it-works), PWA/offline and clean URLs. Puzzles come from a pre-generated, gated schedule file, not live generation, so everyone gets an identical, verified puzzle.

Owner decisions: grid max 12x12, preference 6x6 and 9x9 (7x7 and 12x12 occasional, never 16x16); expert exactly once per UTC week on a seeded random day, hard and expert only on 9x9 and 12x12; other days very-easy 15%, easy 30%, easy-medium 25%, medium 20%, hard 10%; neutral English cast with genders, first letters unique within a puzzle, variety per puzzle; no clock check (UTC only); the app shows puzzle number, UTC date and until when the puzzle runs (countdown plus local equivalent); no archive, accounts or leaderboard at launch; stats and streaks local; share as PNG card plus emoji text; name Slaydoku (never Murdoku; credit the original on an about page); repo private until the personal-data audit is green.

Done already (initial commits): clean bootstrap with the audit (bun run audit:personal, 0 hits), neutral placeholder cast, one demo level, MIT license, CLAUDE.md, workflow config.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 English throughout: clue text, hints, solver explanations, all UI strings, help and legend
- [ ] #2 A pre-generated schedule of daily puzzles passes every gate and is identical for everybody
- [ ] #3 The daily flow, stats, streaks and share card work on phone and iPad, offline included
- [ ] #4 The public site is deployed on its own Vercel project, and the personal-data audit is green before the repo is made public
<!-- AC:END -->
