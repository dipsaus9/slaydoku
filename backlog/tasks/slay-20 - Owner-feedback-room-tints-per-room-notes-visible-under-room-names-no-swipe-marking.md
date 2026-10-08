---
id: SLAY-20
title: >-
  Owner feedback: room tints per room, notes visible under room names, no swipe
  marking
status: In Progress
assignee: []
created_date: '2026-10-08 19:19'
updated_date: '2026-10-08 20:04'
labels:
  - story
  - needs-owner-review
dependencies: []
references:
  - src/render/scene/roomStyles.ts
  - src/render/scene/roomStyles.test.ts
  - src/render/scene/geometry.test.ts
  - src/render/scene/layers/
  - src/render/scene/labels.ts
  - src/render/scene/labels.test.ts
  - src/render/scene/SceneView.tsx
  - src/render/scene/SceneView.test.tsx
  - src/ui/play/gesture.ts
  - src/ui/play/gesture.test.ts
  - src/ui/play/intent.ts
  - src/ui/play/intent.test.ts
  - src/ui/play/useGesture.ts
  - src/ui/play/Board.tsx
  - src/ui/play/BoardLayers.tsx
  - src/ui/play/index.ts
  - src/ui/play/play.css
  - src/ui/play/strings.ts
  - src/ui/play/PlayScreen.test.tsx
  - src/ui/help/
  - src/content/help/help.ts
  - docs/verification/
  - docs/design/
type: feature
ordinal: 142000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: three owner fixes on the play board. (1) Each room gets its own floor tint, so two rooms next to each other never look alike and a room is recognisable as a different room at a glance. (2) A note (candidate mark) stays visible when a room name is drawn over its square. (3) On a phone, an accidental scroll or swipe over the puzzle no longer sets many notes: the multi-square swipe action is removed; one tap or press sets one square.
Type: deliverable
Branch: SLAY-20/ui-feedback-tints-notes-swipe
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Two rooms that touch each other never share the same floor tint, in all themes and sizes; the tints stay readable behind marks, people and notes and keep the contrast of the labels (test over the baked schedule and a visual check)
- [x] #2 A note on a square under a room name is clearly visible (the label gets out of the way or the note is drawn over the halo, decided from rendered screenshots); checked on a crowded 9x9 and 12x12 board at 360 and 390 wide
- [ ] #3 The multi-square swipe/drag marking gesture is removed on touch (and mouse); a scroll or swipe over the board scrolls the page or pans and never sets a note or cross; single tap and long press behave as before (gesture tests updated, verify:phone drive suite passes)
- [x] #4 Settings text, help text and docs no longer mention swiping over squares
- [ ] #5 bun run lint, typecheck and test --maxWorkers=1 pass; verify:phone passes
- [ ] #6 Owner has seen rendered boards on a phone and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Gesture: drop the painting phase from gesture.ts (a press past the slop does nothing on release), remove paintIntent/paintModeFor, unzoomed board touch-action pan-y. Tints: 4-5 tones per floor kind, greedy colouring over room adjacency (wall+corner) in resolveRoomStyles, schedule-wide test. Notes: own layer above room labels; a label over noted squares fades to 0.5. Driver docs/verification/slay20.ts renders crowded boards + swipe checks; screenshots in docs/design/looks-shots/slay-20/.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Quick-fix-first pass (2026-10-08): tints by room-map colouring, notes in their own layer above room names with a name over noted squares fading to 0.5, multi-square swipe removed (unzoomed board touch-action pan-y). Lint, typecheck and the tests of src/render, src/ui, src/share, src/content/help green (1309). docs/verification/slay20.ts: 54 checks green on 6 days (9x9 shop/home/park, 12x12 simpshouse/school/park) at 360, 390, 1280. Full suite, verify:phone (AC 3, 5) and the review gate wait for the owner's approval.

Owner round 2 on PR #171 (tints too alike): shared 13-tint Lab lattice (>= 18 delta E apart, hue shifts), greedy most-constrained colouring with FAR_ENOUGH 26; schedule test requires every touching pair >= 18 (closest 26.5). slay20.ts 54/54 again; screenshots re-rendered with a before/after pair.
<!-- SECTION:NOTES:END -->
