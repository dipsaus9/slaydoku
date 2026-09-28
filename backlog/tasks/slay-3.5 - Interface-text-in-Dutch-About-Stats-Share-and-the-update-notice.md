---
id: SLAY-3.5
title: 'Interface text in Dutch: About, Stats, Share and the update notice'
status: Done
assignee: []
created_date: '2026-09-28 10:21'
updated_date: '2026-09-28 12:34'
labels:
  - story
dependencies:
  - SLAY-3.1
references:
  - src/ui/about/
  - src/ui/stats/
  - src/ui/share/
  - src/pwa/
  - src/share/
parent_task_id: SLAY-3
type: feature
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the About page, the Stats panel, the share sheet/card text and the PWA update notice all have Dutch wording and switch with the locale toggle.
Type: deliverable
Branch: SLAY-3.5/about-stats-share-pwa-text-dutch
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 src/ui/about/strings.ts, src/ui/stats/strings.ts, src/ui/share/strings.ts and src/pwa/strings.ts each carry an 'en' and 'nl' entry; every consuming component reads through useLocale()
- [x] #2 The shareable text (the emoji summary) has Dutch wording with the same no-spoilers rule as the English one
- [x] #3 Existing about/stats/share/pwa tests are parametrized over locale and pass for both
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Read each strings.ts fully. 2. Restructure into en/nl entries and write the Dutch copy, including src/share/emoji.ts's shareable text if it holds English wording. 3. Update consuming components to use useLocale(). 4. Parametrize existing tests over both locales.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
src/share/format.ts (tierLabel/sizeLabel/hintsLabel/dateLabel), src/share/emoji.ts (the shared emoji-text builder) and src/share/card.ts's own STRIP_WORDS confirmed to hold real player-facing English wording (used by both the share sheet and the drawn PNG card) — included in References for that reason. 'Slaydoku' itself is a brand name and stays unchanged in both languages.

About slice done: ABOUT_STRINGS en/nl, AboutScreen reads useLocale(), dutch.test.ts guard exempts the 4 strings.ts files this epic localizes.

All four strings.ts files (about/stats/share/pwa) carry en/nl entries, read through useLocale(). share/format.ts, emoji.ts and card.ts (the shareable text and PNG card) also localized: locale param, default 'en'. Dutch guard test (src/validation/dutch.test.ts) updated to exempt the 4 localized strings.ts files. Full verify green: lint, typecheck, 137 test files / 2606 tests.

Review verdict: pass. AC1-3 met. dutch.test.ts touch (outside declared References) judged a reasonable, minimal, disclosed exception by the reviewer.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
About, Stats, share panel/card and PWA update-notice text now carry en/nl entries (ABOUT_STRINGS, STATS_STRINGS, SHARE_STRINGS, UPDATE_STRINGS), read through useLocale() in every consuming component. share/format.ts, emoji.ts and card.ts (the shareable emoji text and drawn PNG card) also take an optional locale, defaulting to English, keeping the same no-spoilers rule in both languages. The pre-existing Dutch-text guard (src/validation/dutch.test.ts) now exempts these 4 localized strings.ts files. All touched tests parametrized over locale (describe.each). Verify: lint, typecheck and the full test suite (137 files / 2606 tests) green. Independent review: pass.
<!-- SECTION:FINAL_SUMMARY:END -->
