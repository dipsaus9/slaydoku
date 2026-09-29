---
id: SLAY-12.3
title: >-
  Final pre-public doc pass: re-read README, About and CLAUDE.md as a stranger
  would
status: To Do
assignee: []
created_date: '2026-09-29 10:00'
labels:
  - story
dependencies:
  - SLAY-10.1
  - SLAY-10.2
  - SLAY-11.1
references:
  - README.md
  - CLAUDE.md
  - src/ui/about/
  - docs/launch.md
parent_task_id: SLAY-12
type: chore
ordinal: 64000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: README, the About page and CLAUDE.md's decisions section accurately describe the shipped game today. A prior session already checked once (no stale 'work in progress' text, no leftover MIGRATION.md, no code TODOs) — this is the final confirmation pass right before flipping visibility, run after SLAY-9/SLAY-10/SLAY-11 land since those change what's actually true (date-based puzzle label, ramp-up schedule through October, the CI flake note).
Type: deliverable
Branch: SLAY-12.3/final-doc-pass
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 README read top-to-bottom as a stranger would; nothing describes a feature that does not exist or omits one that does (cross-check against docs/launch.md step 2's known-fixed items, confirm they are still fixed)
- [ ] #2 CLAUDE.md's decisions section matches shipped behavior, including the updated puzzle-label decision (from SLAY-10.2) and the extended ramp-up window (from SLAY-10.1)
- [ ] #3 About page contact placeholder resolved (docs/launch.md step 3) or explicitly deferred with the owner's say-so
- [ ] #4 git grep -n -i murdoku reviewed once more per docs/launch.md step 1's credit-check, confirming nothing implies Slaydoku is the original
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependencies are content-accuracy ordering, not file-collision sequencing: this pass must reflect what SLAY-10.1/10.2/11.1 actually changed, so it has to run after them.
<!-- SECTION:NOTES:END -->
