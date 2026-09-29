---
id: SLAY-8
title: 'Epic: content and interaction bug fixes'
status: Done
assignee: []
created_date: '2026-09-28 21:53'
updated_date: '2026-09-29 16:11'
labels:
  - epic
dependencies: []
ordinal: 42000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: fix the owner-reported content bug (a delivery van placed in a bedroom-type room) and the toolbar usability regressions (placing a person is no longer discoverable; labels never return even where there is room).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Delivery van (and any vehicle) never generated into a sleeping-type room
- [x] #2 A Place affordance is reachable again from the toolbar
- [x] #3 Toolbar labels return on larger-than-mobile viewports when they fit
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All four subtasks delivered. SLAY-8.1 hard-excludes vehicles from sleeping-type rooms in scene
generation. SLAY-8.2 restores the toolbar's Place affordance and brings back labels on
larger-than-mobile viewports. SLAY-8.4 replaces the Vercel KV/Redis play-counter design with
PostHog custom events. SLAY-8.3 grounds every hint explanation (not just single-candidate
placements) in the earlier steps the player has actually been shown, stops naming an
already-solved suspect or the victim as a hint's own subject, and documents why the fix has no
effect on docs/solvability/README.md's tier guarantees (a presentation/grounding fix, not a
change to which technique fires or when).
<!-- SECTION:FINAL_SUMMARY:END -->
