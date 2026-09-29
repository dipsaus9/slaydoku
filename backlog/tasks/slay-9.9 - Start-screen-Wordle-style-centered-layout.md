---
id: SLAY-9.9
title: 'Start screen: Wordle-style centered layout'
status: Done
assignee: []
created_date: '2026-09-29 10:05'
updated_date: '2026-09-29 15:15'
labels:
  - story
dependencies:
  - SLAY-9.1
  - SLAY-9.4
  - SLAY-10.2
references:
  - src/ui/daily/StartScreen.tsx
  - src/ui/daily/daily.css
  - src/ui/daily/LocaleToggle.tsx
  - src/brand/icon.svg
parent_task_id: SLAY-9
type: feature
ordinal: 65000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the start screen becomes a centered card matching Wordle's landing-screen pattern — a small icon mark, the wordmark/title, a one-line tagline, a single primary action button, and a small byline line beneath (puzzle date, site name) — while every existing behavior (countdown, rollover banner, solved-result card, stats/share slots, About link, Help, locale toggle) still works, just restyled.
Type: deliverable
Branch: SLAY-9.9/wordle-style-start-screen

Reference is Wordle's layout/vibe only, not feature parity: no Login button, no subscription/paywall button (75% off) — Slaydoku has no accounts or leaderboard at launch (CLAUDE.md decision), so there is exactly one action button (Play/Continue).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Start screen shows, top to bottom and centered: an icon mark (reusing src/brand/icon.svg), the title, a one-line tagline, a single primary action button (Play or Continue, existing PuzzleCard behavior), and a small byline line with the puzzle's date-based label (from SLAY-10.2) and the site name
- [x] #2 No Login or paywall-style button is added — confirmed consistent with CLAUDE.md's no-accounts-at-launch decision
- [x] #3 Every existing state (loading, error, before-launch, after-schedule, solved result, ended) still renders correctly within the new layout
- [x] #4 Countdown, rollover banner, Help link, locale toggle, About link, stats and share slots are all still present and reachable, repositioned to fit the new centered composition
- [x] #5 Layout holds at phone, iPad and desktop widths, checked against the rendered screen (docs/verification/screens.ts / bun run verify:phone), not just the component data
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Restructure StartScreen.tsx into a Wordle-style centered hero: icon mark (src/brand/icon.svg imported as a module) + title (h1) + one-line tagline, a small centered controls row (locale toggle, Help link) below the hero, then the existing rollover banner / state cards unchanged in behavior. Inside PuzzleCard, move the puzzle date-based label + full date + site name out of the old big heading into a small muted byline row placed after the button/result and the Countdown (keeping data-puzzle-number, data-date, and the id daily-number the section's aria-labelledby points to, so every existing test/driver selector keeps working). daily.css: .daily becomes a centered flex column (max-width 460px), .daily-card centers its content via justify-items/text-align, new .daily__hero/.daily__mark/.daily__controls/.daily-card__byline* rules added, .daily__header renamed to .daily__hero (media queries updated). LocaleToggle.tsx left untouched (only repositioned via a wrapping container).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
If src/brand/icon.svg does not read well at small standalone-mark size, a dedicated small brand mark may be needed — flag to the owner rather than guessing. Dependencies on SLAY-9.4 and SLAY-10.2 are both file-collision sequencing (LocaleToggle.tsx, StartScreen.tsx) as well as genuinely wanting the date label finalized before laying out the byline row.

Verification: bun run lint / typecheck / test --maxWorkers=1 all green (141 files, 3017 tests). bun run build OK. bun run verify:phone (SKIP_BUILD=1): drive suite (the most start-screen-heavy driver, covers loading/error/before-launch/after-schedule/day/solved/ended/rollover/Continue/About/Help) passed 111/111 checks at all 6 viewports (360x640, 390x844, 430x932, 844x390, 1024x768, 768x1024); screens suite passed 110/110 at all 6 viewports; stats, share, offline all green. docs/verification/locale.ts run directly against the build: the locale toggle on the restyled start screen (baseline, switch to Dutch incl. the new byline's puzzle label, persistence, reload) all passed; its one failure (a Dutch 'tv' noun rendering as 'undefined' on a school-theme clue) is unrelated to this story (engine/clues, not the start screen) and pre-existing. legend.ts and zoom.ts crashed with 'missing tool Zoom' at every viewport -- verified directly this is pre-existing (SLAY-9.8 removed the Zoom toolbar button and these two drivers still reference it), not caused by this change; SLAY-9.11 (concurrent) is titled exactly 'fix-zoom-legend-verification-for-removed-button'.

Independent review (dipsaus-ai:story-reviewer): verdict PASS. All 5 acceptance criteria met, no scope violations, no findings. Confirmed only src/ui/daily/StartScreen.tsx and src/ui/daily/daily.css changed; load-bearing selectors (data-action, data-puzzle-number, data-date, data-banner, data-slot, .daily__about, .daily-card, id=daily-number) preserved exactly; role=timer/.daily__locale-option untouched by construction (Countdown.tsx/LocaleToggle.tsx not modified). Independently corroborated the legend.ts/zoom.ts 'missing tool Zoom' crash is pre-existing and unrelated to this story.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restyled the start screen (/) into a centered, Wordle-style landing card: a small icon mark (src/brand/icon.svg), the Slaydoku wordmark, a one-line tagline, exactly one primary action button (Play/Continue, no Login or paywall button per CLAUDE.md's no-accounts-at-launch decision), and a small muted byline underneath the button/countdown carrying the puzzle's date-based label and the site name. The language toggle and Help link moved into a small centered controls row under the hero; the rollover banner, About link, stats/share slots and every existing start-screen state (loading, error, before-launch, after-schedule, new/in-progress/solved/ended day) kept their exact behavior and DOM hooks (data-action, data-puzzle-number, data-date, data-banner, data-slot, role=timer, id=daily-number, .daily__locale-option, .daily__about) — only StartScreen.tsx and daily.css changed. Verified with lint/typecheck/test (green, 3017 tests) and bun run verify:phone against a production build: the drive and screens suites (which exercise every start-screen state) passed 100% at all 6 phone/iPad/desktop viewports, plus stats/share/offline green and locale.ts's start-screen checks green. Independently confirmed the review is not affected by legend.ts/zoom.ts's pre-existing 'missing tool Zoom' crash (SLAY-9.8 removed that toolbar button; SLAY-9.11 covers fixing those two unrelated drivers). Independent story review: PASS, all 5 acceptance criteria met, no scope violations.
<!-- SECTION:FINAL_SUMMARY:END -->
