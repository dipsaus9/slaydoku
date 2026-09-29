---
id: SLAY-12.3
title: >-
  Final pre-public doc pass: re-read README, About and CLAUDE.md as a stranger
  would
status: Done
assignee: []
created_date: '2026-09-29 10:00'
updated_date: '2026-09-29 15:03'
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
- [x] #1 README read top-to-bottom as a stranger would; nothing describes a feature that does not exist or omits one that does (cross-check against docs/launch.md step 2's known-fixed items, confirm they are still fixed)
- [x] #2 CLAUDE.md's decisions section matches shipped behavior, including the updated puzzle-label decision (from SLAY-10.2) and the extended ramp-up window (from SLAY-10.1)
- [x] #3 About page contact placeholder resolved (docs/launch.md step 3) or explicitly deferred with the owner's say-so
- [x] #4 git grep -n -i murdoku reviewed once more per docs/launch.md step 1's credit-check, confirming nothing implies Slaydoku is the original
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependencies are content-accuracy ordering, not file-collision sequencing: this pass must reflect what SLAY-10.1/10.2/11.1 actually changed, so it has to run after them.

Doc-accuracy pass done: README.md and src/ui/about/ re-read top to bottom against current code, both accurate (no stale WIP text, no MIGRATION.md link, no contact placeholder - dropped per owner instruction in #47, disclosed murdoku tutorial.fixture.ts transcription). CLAUDE.md's Grid decision line was missing the SLAY-10.1 ramp-up window (hard/expert suppressed entirely through 2026-10-31); added. docs/launch.md steps 1-3 had stale text describing already-resolved states (murdoku tutorial.fixture.ts decision, README WIP/MIGRATION.md fix, About contact placeholder); updated text and ticked the confirmed checkboxes. git grep -n -i murdoku -- . ':!docs' ':!backlog' lists only expected credit lines and rule-set naming, nothing implies Slaydoku is the original.

Review round 1: verdict block. AC2 not met — CLAUDE.md's puzzle-label example 'Puzzle of Sep 29' didn't match the shipped format (formatDayMonth: day + full month name, e.g. 'Puzzle of 29 September'); this mismatch predated this story and the pass had missed it. Fixed. Advisory: docs/launch.md's post-launch routine still told the owner to read a 'contact address' that no longer exists (About contact section was dropped, not filled in); pointed at the issue tracker instead. Other 3 ACs and scope: no issues found.

Review round 2: verdict pass, no findings. All 4 ACs met, no scope violations.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Re-read README.md and src/ui/about/ top to bottom against the current shipped code and found them accurate (no stale WIP text, no MIGRATION.md link, no contact placeholder). Updated CLAUDE.md's decisions section: added the SLAY-10.1 ramp-up window (hard/expert suppressed entirely through 2026-10-31) and, after review round 1 caught it, corrected the puzzle-label example from the wrong 'Puzzle of Sep 29' to the actually-shipped 'Puzzle of 29 September' (formatDayMonth: day + full month name). Updated docs/launch.md steps 1-3 to reflect states already resolved this session (tutorial.fixture.ts kept & disclosed, README WIP/MIGRATION.md fix, About contact section dropped per owner instruction in #47) and fixed a stale 'read the contact address' line in the post-launch routine to point at the issue tracker instead. git grep -n -i murdoku re-confirmed clean. Independent review passed on round 2 after one blocking fix.
<!-- SECTION:FINAL_SUMMARY:END -->
