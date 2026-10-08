---
id: SLAY-19.1
title: Add 19 object types and 38 decor objects to the five regular themes
status: In Progress
assignee: []
created_date: '2026-10-08 14:58'
updated_date: '2026-10-08 19:28'
labels:
  - needs-owner-review
dependencies:
  - SLAY-17.4
  - SLAY-17.6
references:
  - src/engine/model/
  - src/engine/clues/
  - src/ui/help/legend.ts
  - src/ui/play/glossary.ts
  - src/render/icons/registry.tsx
  - src/render/icons/art/decor.tsx
  - src/render/looks/decorModels.ts
  - src/render/looks/registry.ts
  - src/render/looks/looks.test.tsx
  - src/render/icons/contactSheetData.ts
  - src/content/themes/home.ts
  - src/content/themes/office.ts
  - src/content/themes/school.ts
  - src/content/themes/park.ts
  - src/content/themes/shop.ts
  - src/content/themes/decor.test.ts
  - src/content/themes/themes.test.ts
  - src/content/objectClues.test.ts
  - docs/design/looks.md
  - docs/authoring/room-rules.md
  - docs/handoff.md
  - docs/design/looks-shots/slay-19.1/
parent_task_id: SLAY-19
type: feature
ordinal: 141000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: levels get real variety. Nineteen new engine object types, each with its own clue word (EN and NL), legend text and A2 art in every footprint and orientation, and 38 decor objects placed in the five regular themes with room allow-lists. All new types are blocking (not occupiable). Deliver with the strongest available model (owner request).

New types (EN / NL): lamp / lamp, mirror / spiegel, coatRack / kapstok, fridge / koelkast, bathtub / bad, fireplace / open haard, piano / piano, aquarium / aquarium, exerciseBike / hometrainer, bin / prullenbak, waterCooler / waterkoeler, serverRack / serverrek, globe / wereldbol, gymBox / gymtoestel, playEquipment / speeltoestel, barbecue / barbecue, tent / tent, shoppingCart / winkelwagen, kiosk / zelfscankiosk.

Objects per theme (size, rooms; E = existing engine type, N = new):
HOME: floor lamp 1x1 living/bedroom/study/hall (N lamp); table lamp 1x1 bedroom/nursery/study (lamp); mirror 1x1 hall/bedroom/bathroom (N); coat rack 1x1 hall/corridor (N); fridge 1x1 kitchen only (N); bathtub 2x1 bathroom/wet rooms only (N, water must read clearly as water); fireplace 2x1 living (N); piano 2x1 living/music (N); aquarium 2x1 living/study (N); nightstand 1x1 bedroom/nursery (E cabinet); shoe rack 1x1 hall (E cabinet); laundry basket 1x1 bathroom/utility/bedroom (E chest); large plant/palm 1x1 living/conservatory/hall (E plant); exercise bike 1x2 home gym (N); bin 1x1 kitchen/bathroom/study (N).
OFFICE: water cooler 1x1 coffee corner/corridor/lobby (N); server rack 1x2 server room only (N); desk lamp 1x1 open office/executive office (lamp); bin 1x1 office rooms (bin); coat rack 1x1 lobby/reception (coatRack); large plant 1x1 reception/lobby/waiting (E plant). No fire extinguisher (owner said no).
SCHOOL: globe 1x1 classroom/library (N); drinking fountain 1x1 corridor/gym (waterCooler); gym box 1x1 gym (N); swing or slide 2x1 school playground (N playEquipment); lab table with microscope 2x1 science room (E table); trophy cabinet 2x1 corridor/assembly hall (E cabinet).
PARK: street lamp 1x1 all outdoor rooms (lamp); barbecue 1x1 back garden/terrace (N); bin 1x1 park rooms (bin); swing or slide 2x1 playground (playEquipment); bird bath 1x1 rose garden/back garden (E statue); tent 2x2 picnic meadow/grove (N); flower pot 1x1 terrace/front garden (E plant).
SHOP: shopping cart 1x1 entrance/checkout (N); fitting-room mirror 1x1 fitting rooms (mirror); self-checkout kiosk 1x1 checkout/collection point (N); large plant 1x1 entrance/window display (E plant). No cooled display case (owner said no).

Type: deliverable
Branch: SLAY-19.1/decor-objects
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The 19 new ObjectTypes exist in the engine catalog (blocking, with footprint hints) with clue nouns in English and Dutch and legend text; object-clue and legend tests pass
- [ ] #2 Every new type has A2 art for all its footprints and 8 orientations on the board and in the legend (no flat leftovers, never painting outside its room), the bathtub water clearly reads as water, and the look-completeness test from SLAY-17.4 passes
- [ ] #3 The 38 objects are in the five themes as listed, each with a room allow-list (fridge only in kitchens, bathtub only in wet rooms, server rack only in the server room, and so on); every kind has an allowed room; the room-rule sweep finds no out-of-list placement
- [ ] #4 Over 200 generated scenes per theme (sizes 6, 7, 9 and 12) the average number of distinct kinds per room rises against the baseline measured before the change, chairs stay at most 15% of placed objects, and signature objects are still placed (numbers reported in the PR)
- [ ] #5 Every new kind can appear in clue text without errors in EN and NL (generated puzzles of every theme pass the clue and solvability gates)
- [ ] #6 The committed schedule files are untouched; bun run lint, typecheck and test --maxWorkers=1 pass, with slow sweeps in *.slow.test.ts
- [ ] #7 Owner has seen screenshots of the contact sheet and generated boards of each theme and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Engine: 19 ObjectTypes (blocking, footprint hints) in types.ts/catalog.ts; EN words (en.ts) and NL nouns (nl.ts); icon footprints (icons/registry.tsx); catalog and clue tests updated. 2. Block models in src/render/looks/decorModels.ts (A2 look, all 8 orientations, painter's order), wired in ENGINE_MODELS; bathtub moves from MODEL_ONLY to the engine type; contact sheet checked per batch; new confusable groups. 3. Theme wiring: new kinds with nameNl, allowedRoomTypes, favours, maxPerRoom in home/office/school/park/shop; one lamp kind per theme because every lamp kind draws the engine lamp (table lamp folded into floor lamp, desk lamp is a floor lamp, school drinking fountain is a water cooler). No new facing rule: a 1x1 front stays toward the viewer. 4. decor.test.ts (variety baseline vs after, room rules, clue text EN/NL), docs (looks.md, room-rules.md, handoff), screenshots under docs/design/looks-shots/slay-19.1/, PR with the Dutch name table, label needs-owner-review, stop.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. Follow docs/design/looks.md 'How to draw a new object' from SLAY-17.4. Keep new art in new files (src/render/icons/art/decor.tsx, src/render/looks/decorModels.ts) so SLAY-18.x theme stories under src/render/icons/themes/ do not collide. The final regeneration of all future days is SLAY-18.10; do not regenerate the schedule here. If something in the list cannot be drawn clearly at one cell, say so in the PR and propose a replacement rather than shipping a confusable icon.

Delivered on PR #165 (branch SLAY-19.1/decor-objects), label needs-owner-review; waiting for the owner's visual approval before the full suite, verify:phone and the review gate. 31 new kinds (3 of the listed 38 are the existing houseplant, 4 dropped for honest naming: table lamp, laundry basket, lab table, bird bath). Variety 200 scenes: distinct kinds per room home 2.45→2.78, office 2.64→2.85, school 2.53→2.70, park 2.92→3.00, shop 2.67→2.72; chairs ≤13.3%. No new facing rule. Dev server for the owner: http://localhost:5519/ (/lab generates boards with the new kinds).

Owner approved the look (Akkoord). Full suite green with --maxWorkers=1 (162 files, 3672 tests) at a4bffc6 after four test fixes: decor.test.ts (no Dutch article literal, 120 s budget), hints.fixture.ts (hard fixture skips a seed whose level-3 hint exceeds 400 chars), lab.test.tsx seed 101→102 (101 now scores 8, outside very-easy), explanations.test.ts intersect regex accepts several shared squares. verify:phone and the review gate still to run.
<!-- SECTION:NOTES:END -->
