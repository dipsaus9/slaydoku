---
id: SLAY-17
title: 'Epic: Room logic and recognisable objects'
status: To Do
assignee: []
created_date: '2026-10-08 08:57'
labels:
  - epic
dependencies: []
ordinal: 117000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fix floors that break house logic (a bed in a bathroom, a bath in a kitchen, a car in a room) and objects that are hard to recognise (several chair types, rugs that look like tables, unclear bookshelves). Also make room names readable when a room is full, and add more room kinds to the existing themes.

Chosen approach: hard per-kind room rules in the generator (allow-lists by room type, for all five themes), a single art pass in a more 3D look validated by the owner on a prototype first, and regeneration of future schedule days only. Why it beat the alternatives: a visual-only fix would leave beds in bathrooms; tuning favour weights can never say never; regenerating played days would risk streaks and stats.

Out of scope: layout/arrangement changes (room shapes, doors, partition). Follow-up epic (plan separately after this one): new themes such as hospital, hotel, museum.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No object kind is ever placed in a room type outside its allow-list in any of the five themes
- [ ] #2 Exactly one chair drawing exists on the board
- [ ] #3 No two object kinds on the contact sheet are confusable at board size, owner approved
- [ ] #4 Room names are readable in full rooms, owner approved
- [ ] #5 Schedule days from 2026-10-09 are regenerated; earlier days are byte-identical
<!-- AC:END -->
