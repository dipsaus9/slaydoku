---
id: SLAY-5.2
title: 'Dutch: room/theme names and the victim''s label actually translate'
status: To Do
assignee: []
created_date: '2026-09-28 17:17'
labels:
  - story
dependencies: []
references:
  - src/content/themes/
  - src/engine/clues/nl.ts
  - src/render/scene/
  - src/render/cards/cards.css
  - docs/verification/
parent_task_id: SLAY-5
type: feature
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: room and theme names (drawn as labels on the board and named inside clue sentences) have real Dutch text instead of the English name with a Dutch article glued on ('de Office' -> a real Dutch room name). Every clue that names the victim by reference (not only the one dedicated victim-card sentence SLAY-3.2 translated) says 'het slachtoffer' instead of leaking the stored English label. The victim card's Dutch name no longer wraps awkwardly.
Type: deliverable
Branch: SLAY-5.2/dutch-room-victim-text
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every theme's name and every room's name (src/content/themes/*.ts) carries a Dutch counterpart; src/engine/clues/nl.ts's roomNameNl uses it instead of gluing 'de' onto the stored English name; the board's own room-label rendering (src/render/scene/) uses the same Dutch text, not a second translation
- [ ] #2 Any clue that names the victim by reference (a relational/diagonal/etc. clue naming another person who is the victim) renders 'het slachtoffer' in Dutch, not the raw stored English label; the existing dedicated victim-card sentence is unaffected
- [ ] #3 The victim card's name fits in Dutch without wrapping awkwardly (src/render/cards/cards.css), consistent with SLAY-4.3's shared card height
- [ ] #4 No English text, room id, theme id, or clue logic changes; existing en.ts output and every puzzle's structural data are byte-identical
- [ ] #5 docs/verification's screens/legend suites and the SLAY-3.6 Dutch locale driver pass on a sample of scheduled days across several themes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a Dutch name field per theme and per room in src/content/themes/*.ts (keep the existing 'name' as the English/stable value used everywhere already; add e.g. 'nameNl'). 2. Rewrite roomNameNl in src/engine/clues/nl.ts to look up the room's Dutch name instead of prefixing 'de' onto the English one; keep the existing 'de'/definite-article logic only as the grammatical wrapper around the real Dutch noun. 3. Make src/render/scene/'s room-label rendering locale-aware, reading the same field. 4. Find where a relational clue resolves another person's display name (the ctx.people.find(...).label lookup in nl.ts) and special-case the victim: return VICTIM_TEXT_NL's noun instead of the stored (English) label. 5. Adjust cards.css so a longer Dutch name (or any longer locale's name) degrades gracefully — a fluid font-size or accepting a clean two-line wrap, owner's call at review if unsure. 6. Run the rendered-screen check and the Dutch locale driver over several themes (office/shop/home/park/school), not just one.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Root cause confirmed in code before this story was written: roomNameNl currently does 'de' + the stored English scene.rooms[].name literally (see its own doc comment); VICTIM_LABEL (src/content/packs/ids.ts) is VICTIM_TEXT.noun, always English, and the generic person-label lookup in nl.ts returns it unchanged for the victim. Both are real bugs, not edge cases — every puzzle has room names and most puzzles have at least one relational clue naming the victim.
<!-- SECTION:NOTES:END -->
