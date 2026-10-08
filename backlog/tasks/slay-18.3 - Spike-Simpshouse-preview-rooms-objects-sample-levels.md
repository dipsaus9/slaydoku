---
id: SLAY-18.3
title: 'Spike: Simpshouse preview (rooms, objects, sample levels)'
status: In Progress
assignee: []
created_date: '2026-10-08 09:21'
updated_date: '2026-10-08 11:24'
labels:
  - needs-owner-review
dependencies:
  - SLAY-17.1
references:
  - docs/themes/simpshouse/
parent_task_id: SLAY-18
type: spike
ordinal: 127000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: an HTML preview the owner can approve before the Simpshouse theme is built: the room list (EN and NL), every object with its art and allowed rooms, and at least 3 sample levels (a small and a large grid) rendered by the real generator on draft theme data. Theme: a friend-group house with a lot of glamour, trading cards (generic trading-card binders, never Pokemon names or logos) and other fun elements.
Type: spike
Spike justification: how a theme and its levels look has to be seen and judged by the owner; planning cannot settle it from the desk.
Branch: SLAY-18.3/simpshouse-preview
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docs/themes/simpshouse/preview.html shows rooms (EN and NL), objects with art and allowed rooms, and at least 3 rendered sample levels from the real generator
- [x] #2 Draft theme data lives in docs/themes/simpshouse/ and is written so the theme story can promote it unchanged
- [x] #3 The page opens without a build step; screenshots are in the PR
- [ ] #4 Owner has seen the preview and approved or listed changes (only the owner ticks this)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Owner visual check (label needs-owner-review): open the PR with screenshots, leave the last acceptance criterion unchecked and stop. The story stays In Progress until the owner approves; only the owner ticks it. The next story (SLAY-18.4) builds to the approved preview. Time matters: Simpshouse must ship before 2026-10-14.

Preview built: docs/themes/simpshouse/preview.html (static, open the file directly; ?lang=nl starts in Dutch). 19 rooms, 31 objects (7 new drawings: card binder shelf, card trading table, glam vanity, disco ball, karaoke stage, arcade cabinet, bubble bath), 4 sample levels (6x6, 9x9, two 12x12) from generateScene on the draft theme. Draft data: theme.ts (final SceneTheme shape, room rules of SLAY-17.1; only the draft themeIcon ids and OBJECT_NAMES_NL are draft-only), art.tsx. Regenerate with: bun docs/themes/simpshouse/build-preview.tsx. Finding for the owner: clues name an object by engine type (arcade cabinet reads as television, disco ball and mannequin as statue, card table and bubble bath as table). AC 4 is the owner's and stays unchecked; story stays In Progress.

Review gate: pass (no scope violations; AC 4 intentionally unchecked, owner only).

Round 2 (owner: much more party): draft theme now 25 rooms, 44 objects, 22 new drawings. Added rabbit hutch (Balcony), red carpet, champagne tower, gold mirror, glitter shoe wall, photo wall, DJ booth, dance floor, confetti cannon, balloons, snack table, cocktail bar, photo booth, lava lamp, salmiak candy table (generic dark liquorice, no brand); rooms Balcony, Dance Floor, Cocktail Lounge, Candy Corner, Photo Studio, Glam Room. Beanbag and bookcase dropped (plain chair is the only chair look). New RoomTypes needed in src by the theme story: party, outdoor (draft casts them). Floor styles for the new room names also need NAME_HINTS entries in roomStyles.ts. Fixed duplicate SVG ids in the preview. AC 4 stays unchecked.

Round 2 review gate: pass (advisory: re-check borrowed engineTypes in SLAY-18.4 clue pass).
<!-- SECTION:NOTES:END -->
