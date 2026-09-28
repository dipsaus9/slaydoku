---
id: SLAY-3
title: 'Epic: Dutch and English, same puzzle, player-selectable'
status: To Do
assignee: []
created_date: '2026-09-28 10:19'
labels:
  - epic
dependencies: []
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a player can switch between English and Dutch (a toggle, remembered per device, defaulting to the browser's language) and every piece of player-facing text — clue sentences, hints, solver explanations, and every interface screen (start, play, about, stats, share, update notice) — reads in the chosen language. The puzzle content itself (who stood where, the schedule, the cast) stays identical in both languages: only how it is put into words changes. Chosen approach (over staying English-only, and over a separate Dutch name pool): this reverses the earlier decision to keep Slaydoku English-only, made explicit again with the owner before planning (2026-09-28) — the puzzle content is stored as structured data (person/room/object ids, not baked English sentences), so localisation is a render-layer concern the architecture already supports cleanly, not a schedule-regeneration problem. Cast names stay the same in both languages (they are labels, not translatable words) — a second name pool was rejected as pure duplicated effort for no player value. Language choice is a toggle with a remembered preference, not separate /nl and /en routes — simpler, no doubled routes or sitemap entries.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A player can switch language from a visible control; the choice persists across reload (localStorage), and defaults from the browser's own language
- [ ] #2 Clue sentences, hints, solver explanations and every interface screen read in the chosen language, with no mix of English and Dutch on screen
- [ ] #3 The puzzle content (schedule, solutions, cast) is unchanged by the language choice; only wording differs
- [ ] #4 The existing English verification suite stays green; a new Dutch pass confirms the language switch works end to end with no missing or leftover-English text
<!-- AC:END -->
