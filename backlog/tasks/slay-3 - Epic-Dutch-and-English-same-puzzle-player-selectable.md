---
id: SLAY-3
title: 'Epic: Dutch and English, same puzzle, player-selectable'
status: Done
assignee: []
created_date: '2026-09-28 10:19'
updated_date: '2026-09-28 16:57'
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
- [x] #1 A player can switch language from a visible control; the choice persists across reload (localStorage), and defaults from the browser's own language
- [x] #2 Clue sentences, hints, solver explanations and every interface screen read in the chosen language, with no mix of English and Dutch on screen
- [x] #3 The puzzle content (schedule, solutions, cast) is unchanged by the language choice; only wording differs
- [x] #4 The existing English verification suite stays green; a new Dutch pass confirms the language switch works end to end with no missing or leftover-English text
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Slaydoku now supports English and Dutch, player-selectable, same puzzle content in both: SLAY-3.1 built the locale plumbing and a start-screen toggle (localStorage-remembered, defaulting from the browser's language); SLAY-3.2 gave clue sentences a Dutch rendering path (engine/clues); SLAY-3.3 gave solver explanations and hint wording Dutch text; SLAY-3.4 and SLAY-3.5 translated every interface screen (start, play, about, stats, share, the update notice). SLAY-3.6 closed the epic out: a new Dutch smoke driver (docs/verification/locale.ts) confirmed the whole thing works end to end with no leftover English, and in doing so caught and fixed the one real gap left - hints were built with Dutch text (SLAY-3.3) but the player's chosen locale was never actually threaded through to them, so hints always rendered in English regardless of the toggle; that wiring is now fixed (game/hints.ts/store.ts/PlayScreen.tsx). The existing English verification suite stays fully green (471 checks, 0 failures on 390x844); three of its drivers (stats.ts, share.ts, offline.ts) had never pinned locale to 'en' and were fixed alongside the others (drive/zoom/legend/screens) that already had. Puzzle content (schedule, solutions, cast) is unchanged by language choice by construction - only wording differs, per SLAY-3.1's structured-data architecture.
<!-- SECTION:FINAL_SUMMARY:END -->
