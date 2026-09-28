---
id: SLAY-7.3
title: CLI stats viewer and honest privacy copy
status: To Do
assignee: []
created_date: '2026-09-28 19:02'
labels:
  - story
dependencies:
  - SLAY-7.1
references:
  - tools/
  - src/ui/about/strings.ts
  - docs/launch.md
parent_task_id: SLAY-7
type: feature
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: bun tools/stats.ts <day> prints that day's starts, solves and average solve time by reading SLAY-7.1's endpoint. The About page and docs/launch.md's 'Reading the numbers' section are updated to accurately describe the new anonymous aggregate counting instead of claiming nothing is collected.
Type: deliverable
Branch: SLAY-7.3/stats-cli-and-privacy-copy
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 bun tools/stats.ts <day> prints starts, solves and average solve time (or a clear 'no data yet' message) for that day, reading SLAY-7.1's endpoint
- [ ] #2 The About page's privacy line no longer says 'no tracking'; it accurately says what is counted (anonymous daily totals: how many played, how many solved) and what is not (no accounts, no per-player identifier, no cookie)
- [ ] #3 docs/launch.md's 'Reading the numbers' section is updated to match (it currently says 'Slaydoku collects nothing')
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Write tools/stats.ts: a small CLI reading one date argument, calling SLAY-7.1's read path, printing the three numbers. 2. Update src/ui/about/strings.ts's privacy copy (both locales, matching SLAY-3.5's en/nl structure) and its test if one pins the exact wording. 3. Update docs/launch.md.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Depends on SLAY-7.1 for the read-path contract. Keep the About wording short and plain, matching the existing About page's tone.
<!-- SECTION:NOTES:END -->
