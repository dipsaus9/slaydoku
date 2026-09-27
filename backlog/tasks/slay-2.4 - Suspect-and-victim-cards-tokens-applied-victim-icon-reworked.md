---
id: SLAY-2.4
title: 'Suspect and victim cards: tokens applied, victim icon reworked'
status: To Do
assignee: []
created_date: '2026-09-27 12:20'
labels:
  - story
dependencies:
  - SLAY-2.1
references:
  - src/render/cards/
parent_task_id: SLAY-2
type: feature
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: card chrome (border/shadow/paper tones) in src/render/cards consumes the SLAY-2.1 tokens, while the existing per-suspect pastel backgrounds and cursive names stay exactly as they are. The victim card stops using a wrapped-gift icon and gift naming (a leftover of the private prototype this repo started from): GiftIcon becomes a victim-themed icon (e.g. a chalk outline or evidence tag), and the internal 'gift' variant/wording is renamed to 'victim' wording, matching what the card actually represents in this game.
Type: deliverable
Branch: SLAY-2.4/victim-card-rework
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/render/cards/cards.css's local --accent and hardcoded tones are replaced by the SLAY-2.1 tokens for card border/shadow/paper; every per-suspect pastel background and the cursive name font stack are untouched
- [ ] #2 GiftIcon.tsx is replaced by a victim-themed icon component (no wrapped present); Polaroid's variant type ('suspect' | 'gift') and every internal 'gift' reference in VictimCard.tsx/CardGrid.tsx are renamed to victim wording; the visible player-facing text (VICTIM_TEXT strings) is unchanged
- [ ] #3 cards.test.tsx, cardGridText.test.tsx and cardText.test.ts are updated for the rename and pass
- [ ] #4 The verify:phone screens suite (every card's text visible, legend rows match) passes unchanged
- [ ] #5 avatars/, procedural/ and every other suspect-portrait code path are untouched
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Design one small victim-themed icon (SVG, same viewBox/size contract as GiftIcon) and add it as e.g. VictimIcon.tsx. 2. Rename Polaroid's 'gift' variant and every internal 'gift' identifier/comment to 'victim' wording (VictimCard.tsx, CardGrid.tsx, cards.css class names if any). 3. Replace GiftIcon usage with the new icon; delete GiftIcon.tsx once nothing imports it. 4. Update the three test files for the rename. 5. Apply the shared tokens to card chrome only (not the per-suspect palette). 6. Run cards tests and verify:phone screens.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
VICTIM_TEXT and every other player-visible string are out of scope (already say 'the victim', never 'gift') — this story is the internal naming and the icon only. src/render/cards/cast.ts (the name pool) and every avatar/portrait file are untouched.
<!-- SECTION:NOTES:END -->
