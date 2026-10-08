---
id: SLAY-17.8
title: 'Spike: A2 and A3 look playable in the app behind an Options switch'
status: To Do
assignee: []
created_date: '2026-10-08 09:45'
updated_date: '2026-10-08 09:59'
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
- [ ] #1 Options has a 'Look' entry (Now / A2 / A3) in EN and NL; the choice is stored on the device; the entry is shown only on localhost and preview hosts, so production players never see it; default is Now
- [ ] #2 A2: the listed object kinds draw as oblique 3D blocks on the same square cells; tap targets, notes and hit areas are unchanged
- [ ] #3 A3: board, floors, walls, hit layer, axis labels and room labels follow the isometric projection; tapping selects the right cell, including in the corners
- [ ] #4 Place, notes, hints, checking and the win flow work in all three looks at 360, 390, 768 and 1024 wide (rendered check); lint, typecheck and test --maxWorkers=1 pass
- [ ] #5 The PR body has the Vercel preview URL of this branch and what to try; docs/design/looks.md records tap target sizes and findings per look
- [ ] #6 Owner has tested A2 and A3 on a phone and picked one (only the owner ticks this)
- [ ] #7 If the PoC draws the bathtub, its water clearly reads as water (visible surface, colour and highlight distinct from the tub)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. The preview branch name SLAY-17.8/preview-look-poc matches the Vercel rule from SLAY-17.7. Merge to main only after the owner decides; the setting must stay invisible to production players until then.
<!-- SECTION:NOTES:END -->
