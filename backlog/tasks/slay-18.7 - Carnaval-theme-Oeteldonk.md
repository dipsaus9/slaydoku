---
id: SLAY-18.7
title: Carnaval theme (Oeteldonk)
status: In Progress
assignee: []
created_date: '2026-10-08 09:22'
updated_date: '2026-10-08 19:28'
labels:
  - needs-owner-review
dependencies:
  - SLAY-18.4
  - SLAY-18.5
  - SLAY-17.4
  - SLAY-18.11
references:
  - src/content/themes/carnaval.ts
  - src/content/themes/carnaval.rooms.test.ts
  - src/render/icons/themes/carnavalArt.tsx
  - src/render/icons/themes/carnavalIcons.ts
parent_task_id: SLAY-18
type: feature
ordinal: 131000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the Carnaval theme for 11 November in Oeteldonk style (Den Bosch: red, white and yellow, the frog, kroeg, confetti, optocht), built to the approved preview of SLAY-18.5, with allow-lists, EN and NL names, art in the approved look, registered as seasonal.
Type: deliverable
Branch: SLAY-18.7/carnaval-theme
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The theme matches the owner-approved carnaval preview of SLAY-18.5
- [x] #2 Every kind has an allow-list and an allowed room; a sweep finds no out-of-room placement (src/content/themes/carnaval.rooms.test.ts)
- [x] #3 Dutch room and object names are real Dutch carnival words; no trademarks or real brand logos
- [ ] #4 Registered as seasonal; the calendar picks it for 11 November and nothing else changes (test)
- [ ] #5 bun run lint, typecheck and test --maxWorkers=1 pass
- [x] #6 New drawings follow the approved look (docs/design/looks.md 'How to draw a new object' from SLAY-17.4) and pass the look-completeness test
- [ ] #7 Owner has seen rendered levels of the theme and approved (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. Deadline for this year: 2026-11-11.

Plan change 2026-10-08: the four seasonal themes no longer run as a chain. After SLAY-18.11 each theme only touches its own module and icon files, so 18.6 to 18.9 can be built in parallel.

Built on PR #169 (needs-owner-review). Seven new block models (frog, beerBarrel, drum, confettiPile, floatCart, beerCrate, barCounter); bar stool became the plain chair; stairs and houseplant dropped; the art module is carnavalArt.ts (the generator worker may import no .tsx). Open: registering carnaval moves 2026-11-11 from shop to carnaval in the picker, so 3 schedule tests fail on that date until SLAY-18.10 regenerates it; merge together with or after that regeneration. Screenshots: docs/design/looks-shots/slay-18.7/.
<!-- SECTION:NOTES:END -->
