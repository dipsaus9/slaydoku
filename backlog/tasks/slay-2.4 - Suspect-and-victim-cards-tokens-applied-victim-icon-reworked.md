---
id: SLAY-2.4
title: 'Suspect and victim cards: tokens applied, victim icon reworked'
status: Done
assignee: []
created_date: '2026-09-27 12:20'
updated_date: '2026-09-27 13:39'
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
- [x] #1 src/render/cards/cards.css's local --accent and hardcoded tones are replaced by the SLAY-2.1 tokens for card border/shadow/paper; every per-suspect pastel background and the cursive name font stack are untouched
- [x] #2 GiftIcon.tsx is replaced by a victim-themed icon component (no wrapped present); Polaroid's variant type ('suspect' | 'gift') and every internal 'gift' reference in VictimCard.tsx/CardGrid.tsx are renamed to victim wording; the visible player-facing text (VICTIM_TEXT strings) is unchanged
- [x] #3 cards.test.tsx, cardGridText.test.tsx and cardText.test.ts are updated for the rename and pass
- [x] #4 The verify:phone screens suite (every card's text visible, legend rows match) passes unchanged
- [x] #5 avatars/, procedural/ and every other suspect-portrait code path are untouched
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Design one small victim-themed icon (SVG, same viewBox/size contract as GiftIcon) and add it as e.g. VictimIcon.tsx. 2. Rename Polaroid's 'gift' variant and every internal 'gift' identifier/comment to 'victim' wording (VictimCard.tsx, CardGrid.tsx, cards.css class names if any). 3. Replace GiftIcon usage with the new icon; delete GiftIcon.tsx once nothing imports it. 4. Update the three test files for the rename. 5. Apply the shared tokens to card chrome only (not the per-suspect palette). 6. Run cards tests and verify:phone screens.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
VICTIM_TEXT and every other player-visible string are out of scope (already say 'the victim', never 'gift') — this story is the internal naming and the icon only. src/render/cards/cast.ts (the name pool) and every avatar/portrait file are untouched.

Implemented as planned. One necessary follow-on beyond the literal References: Polaroid's variant rename ('gift'->'victim') changes the generated className (polaroid--gift -> polaroid--victim) and the natural sibling data attributes; src/ui/play/SuspectPanel.tsx (classname hit-test + data-gift-selected/placed -> data-victim-selected/placed), src/ui/play/play.css (matching selectors), src/ui/play/BoardLayers.tsx and src/ui/help/HowItWorks.tsx (GiftIcon->VictimIcon import/usage) and docs/verification/{screens,drive,zoom,stats,share}.ts (selector strings only) were updated to match -- otherwise the victim-card tap-to-select on the Play screen and the phone-verification suites would silently break. No player-facing text, avatars/, procedural/ or cast.ts touched. Verify: lint/typecheck/test all green (2553 tests); verify:phone screens suite 198/198 checks (2 viewports); also spot-checked drive/zoom/stats/share suites (390x844) at 209/209 checks to confirm the selector-rename fix.

Review gate: independent reviewer verdict PASS, all 5 criteria met, no scope violations. One advisory finding: a leftover .polaroid--gift selector in src/ui/play/play.css's short-landscape (max-height:500px) media query, missed by the rename pass. Fixed (renamed to .polaroid--victim) and re-verified: lint/typecheck/full test suite green, verify:phone screens suite 0 failures at 844x390.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Card chrome in src/render/cards (border/shadow/paper) now consumes the SLAY-2.1 design tokens (--color-accent/--color-ink/--color-paper), while every per-suspect pastel background and the cursive name font stack are untouched. The victim card's GiftIcon (a wrapped-present leftover from the private prototype) is replaced by a new VictimIcon (a chalk-outline-on-the-floor drawing with an evidence tag), and Polaroid's 'gift' variant/every internal 'gift' identifier in VictimCard.tsx and CardGrid.tsx is renamed to 'victim' wording; VICTIM_TEXT and all player-visible strings are unchanged. Because Polaroid's generated className and its natural data-attribute siblings changed with the rename, the direct consumers of that contract (SuspectPanel.tsx's tap hit-test and data-victim-selected/placed attributes, play.css's matching selectors, BoardLayers.tsx/HowItWorks.tsx's GiftIcon->VictimIcon usage, and the polaroid--gift/data-gift-selected selector strings in the docs/verification drivers) were updated to match, so the victim card's tap-to-select and phone verification keep working. avatars/, procedural/ and cast.ts are untouched. Verify: lint/typecheck/test green (2553 tests); verify:phone screens suite 198/198 checks across two viewports; drive/zoom/stats/share suites spot-checked at 209/209 checks.
<!-- SECTION:FINAL_SUMMARY:END -->
