---
id: SLAY-16.9
title: 'Verify the redrawn board and legend on real sizes, update docs'
status: Done
assignee: []
created_date: '2026-10-03 09:59'
updated_date: '2026-10-03 12:47'
labels:
  - story
dependencies:
  - SLAY-16.1
  - SLAY-16.4
  - SLAY-16.5
  - SLAY-16.6
  - SLAY-16.7
  - SLAY-16.8
references:
  - docs/verification/
  - docs/handoff.md
  - docs/design/
parent_task_id: SLAY-16
type: chore
ordinal: 115000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the whole visual change is checked on the rendered screen at phone and iPad sizes, performance is checked, and the docs describe the new look so the cadeauko port can follow it.
Type: deliverable
Branch: SLAY-16.9/verify-visuals
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The board and the legend are rendered at 360x640, 390x844, 768x1024 and 1024x768 in en and nl; every object type appears in all 8 orientations somewhere (contact sheet or sample boards); no clipped shadows at the board edge, no object overlapping a wall label
- [x] #2 On a 12x12 board with at least 40 objects a headless-Chrome trace of a pinch zoom and a pan reports no task over 100 ms attributable to the filter; if it does, the story records the finding and the follow-up
- [x] #3 docs/handoff.md and docs/design/ describe the depth constants, the drawing rules and where the filter lives, with the screenshots' location noted
- [x] #4 bun run verify:phone or the relevant docs/verification drivers pass (or the exact sandbox limitation is recorded); lint, typecheck and test --maxWorkers=1 are green
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Findings: legend swatches clip the shadow (Legend.tsx ObjectSwatch viewBox); nl 12x12 2026-11-30 'Speelgoedafdeling' label overlaps bookshelf C10 and checkout counter C12; board edge shadow fine; no task over 100 ms (max 9 ms), filter ~2.4-2.9x raster time; drive and locale drivers stale on main. See docs/design/depth.md.

Review round 1: pass; advisory only (follow-up stories for the recorded defects and the stale drive/locale drivers are the orchestrator's call).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added docs/verification/depth.ts (true 360/390/768/1024 renders in en and nl, 8-orientation sheets, edge-shadow, About wrap, perf trace), docs/design/depth.md and a handoff section. Findings: legend swatches clip the ground shadow; nl 12x12 room label overlaps two objects; board edge shadow fine; no task over 100 ms; drive and locale drivers stale on main. Epic left open: its AC 2 needs the owner's phone check.
<!-- SECTION:FINAL_SUMMARY:END -->
