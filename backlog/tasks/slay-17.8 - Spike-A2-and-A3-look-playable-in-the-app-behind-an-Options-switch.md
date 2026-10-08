---
id: SLAY-17.8
title: 'Spike: A2 and A3 look playable in the app behind an Options switch'
status: In Progress
assignee: []
created_date: '2026-10-08 09:45'
updated_date: '2026-10-08 13:06'
labels:
  - needs-owner-review
dependencies:
  - SLAY-17.3
  - SLAY-17.5
  - SLAY-17.7
references:
  - src/render/scene/
  - src/render/icons/ObjectIcon.tsx
  - src/render/icons/registry.tsx
  - src/render/icons/poc/
  - src/ui/play/
  - src/locale/storage.ts
  - docs/design/looks.md
  - src/render/icons/SceneObjectIcons.tsx
  - src/render/looks/
  - src/locale/index.ts
  - docs/verification/looks.ts
  - docs/handoff.md
parent_task_id: SLAY-17
type: spike
ordinal: 136000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the real board can draw objects in three looks, chosen in an Options entry 'Look' (Now / A2 / A3, EN and NL strings, stored on the device like the language, default Now): A2 = oblique 3D blocks from front and above on the unchanged square grid; A3 = isometric blocks on a diamond grid. Built from the 3D block models of the SLAY-17.3 prototype for a representative set of objects (chair, sofa, bed, bookshelf, table, rug, plant, lamp), every other object falls back to the Now look. Delivered on the preview branch so the owner tests on a phone and picks A2 or A3.
Type: spike
Spike justification: how selecting, labels and overlap feel on a real phone can only be learned by running code; planning and the HTML prototype cannot settle it.
Branch: SLAY-17.8/preview-look-poc
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Options has a 'Look' entry (Now / A2 / A3) in EN and NL; the choice is stored on the device; the entry is shown only on localhost and preview hosts, so production players never see it; default is Now
- [x] #2 A2: the listed object kinds draw as oblique 3D blocks on the same square cells; tap targets, notes and hit areas are unchanged
- [x] #3 A3: board, floors, walls, hit layer, axis labels and room labels follow the isometric projection; tapping selects the right cell, including in the corners
- [x] #4 Place, notes, hints, checking and the win flow work in all three looks at 360, 390, 768 and 1024 wide (rendered check); lint, typecheck and test --maxWorkers=1 pass
- [ ] #5 The PR body has the Vercel preview URL of this branch and what to try; docs/design/looks.md records tap target sizes and findings per look
- [ ] #6 Owner has tested A2 and A3 on a phone and picked one (only the owner ticks this)
- [x] #7 If the PoC draws the bathtub, its water clearly reads as water (visible surface, colour and highlight distinct from the tub)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. The preview branch name SLAY-17.8/preview-look-poc matches the Vercel rule from SLAY-17.7. Merge to main only after the owner decides; the setting must stay invisible to production players until then.

PoC delivered. Look entry (Now/A2/A3, EN+NL) shown only on dev/localhost/preview hosts, stored in slaydoku:look. Models for chair, sofa, bed, bookshelf, table, rug, plant (no lamp or bathtub object kind exists in the app; the bathtub model with a hollow tub and saturated blue water is in src/render/looks/models.ts for SLAY-17.4, AC 7 therefore holds vacuously for the board and is checked on a contact render). Driver docs/verification/looks.ts: 276 checks pass at 360/390/768/1024 in all three looks, incl. every-cell hit probes at centre, corners and edges. A3 verdict: prettiest, but cells are about 0.29 the area of a square cell on a phone (27x15 px for 12x12 at 360 wide), fine zoomed 2x. Details in docs/design/looks.md. AC 5 still needs the preview URL in the PR body (added right after push); AC 6 is the owner's.
<!-- SECTION:NOTES:END -->
