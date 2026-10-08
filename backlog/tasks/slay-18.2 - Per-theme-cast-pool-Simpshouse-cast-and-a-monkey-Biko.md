---
id: SLAY-18.2
title: 'Per-theme cast pool, Simpshouse cast and a monkey Biko'
status: Done
assignee: []
created_date: '2026-10-08 09:21'
updated_date: '2026-10-08 12:46'
labels:
  - needs-owner-review
dependencies:
  - SLAY-18.1
  - SLAY-17.7
references:
  - src/content/cast/
  - src/schedule/cast.ts
  - src/schedule/cast.test.ts
  - src/schedule/cast.simpshouse.test.ts
  - src/render/cards/
  - CLAUDE.md
  - docs/launch.md
  - docs/design/monkey-biko/
parent_task_id: SLAY-18
type: feature
ordinal: 126000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: castFor can draw from a theme's own pool. Simpshouse has 18 names with genders: Dennis(m), Duncan(m), Elodie(f), Romy(f), Emma(f), Iris(f), Jolie(f), Sander(m), Anne(f), Biko(m), Eveline(f), Junior(m), Marnica(f), Ralph(m), Ruben(m), Sven(m), Tijn(m), Cait(f) (owner to correct any gender). First letters are unique in a puzzle (11 letters: A B C D E I J M R S T, so up to 11 suspects, a 12x12), the combination is random per seed, and letters and genders are chosen together (most letters have one gender) while the counts stay within 1. Biko gets a monkey portrait: a name-bound portrait override, used only by the Simpshouse pool, every other name keeps slot-based portraits. A Simpshouse-cast day stays out of the nominal cast chain, so casts of all other days are unchanged.
Type: deliverable
Branch: SLAY-18.2/simpshouse-cast
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Cast pools are per theme; the regular pool and every regular puzzle's cast are byte-identical to before (test over the committed schedule)
- [x] #2 Simpshouse pool in one data file with the 18 names; castProblems for a Simpshouse cast reports no shared first letter and balanced genders over many seeds and sizes 5-12
- [x] #3 A Simpshouse day draws a random but seeded combination; Dennis and Duncan never share a puzzle
- [x] #4 Biko always renders as a monkey portrait on cards, board and share card; other names still get slot portraits; override is documented in CLAUDE.md as the one exception to 'avatars are not tied to names'
- [x] #5 The cast chain skips seasonal-cast days: casts of all other days are byte-identical (test)
- [x] #6 bun run lint, typecheck and test --maxWorkers=1 pass
- [x] #7 Owner has seen the monkey Biko and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. Privacy: the names are real first names of friends and the repo goes public later: keep them in one file (src/content/cast/simpshouse.ts) and add a line to docs/launch.md to confirm with the friends before go-public.

Delivered on branch; AC 7 (owner approval of the monkey) left unchecked, story stays In Progress. Screenshots: docs/design/monkey-biko/. Share card draws no people, so the monkey appears on cards and board only.

Review gate: pass in round 1 (no findings, no scope violations; AC 7 is the owner's).

Owner approved the monkey Biko in chat on 2026-10-08 ("Goed"). Owner decision on the Iris clash: 2026-10-14 is a 12x12 that needs all 11 letters, so Iris repeats from 2026-10-13; the consecutive-day shared-name gate (src/schedule/gates.ts) gets an exception for days with their own cast pool (Simpshouse): one shared name with a neighbouring day is allowed there. SLAY-18.4 builds the exception and removes the theme mock from cast.simpshouse.test.ts. Closed by the orchestrator.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Per-theme cast pools, the 18-name Simpshouse pool, a monkey Biko (owner approved), and a cast chain that keeps themed days out so all other casts stay byte-identical.
<!-- SECTION:FINAL_SUMMARY:END -->
