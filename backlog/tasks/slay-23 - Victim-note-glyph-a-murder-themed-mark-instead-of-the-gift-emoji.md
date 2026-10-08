---
id: SLAY-23
title: 'Victim note glyph: a murder-themed mark instead of the gift emoji'
status: To Do
assignee: []
created_date: '2026-10-08 20:18'
labels:
  - story
  - needs-owner-review
dependencies: []
references:
  - src/ui/play/people.ts
  - src/ui/play/BoardLayers.tsx
  - src/ui/play/BoardLayers.test.tsx
  - src/ui/help/Legend.tsx
  - src/content/help/
  - src/render/cards/
  - src/share/
  - docs/verification/
  - docs/design/looks-shots/slay-23/
type: feature
ordinal: 143000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: owner bug report 2026-10-08: a note on the victim shows a gift box emoji, a leftover of the old gift prototype (GIFT_TAG in src/ui/play/people.ts). The victim note uses a drawn, platform-independent glyph that fits the murder theme (recommended: a small skull drawn as SVG in the note colour, with the same white halo as other notes; no emoji, so it looks the same on every device), everywhere a note or mark of the victim is shown: board, legend, help, cards. Leftover internal names 'gift' for the victim in UI code are renamed where cheap.
Type: deliverable
Branch: SLAY-23/victim-note-glyph
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The victim note on the board is a drawn skull-style glyph in the victim colour with the note halo, readable at the smallest cell size at 360 wide, and no gift emoji appears anywhere in the UI, help, legend, cards or share output (test greps the rendered markup and the source)
- [ ] #2 Legend and help describe the victim note with the new glyph in English and Dutch
- [ ] #3 bun run lint, typecheck and test --maxWorkers=1 pass; the verify:phone legend and drive suites pass
- [ ] #4 Owner has seen the glyph on a phone-size board and approved (only the owner ticks this)
<!-- AC:END -->
