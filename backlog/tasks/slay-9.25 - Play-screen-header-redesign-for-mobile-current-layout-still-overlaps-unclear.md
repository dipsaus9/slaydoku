---
id: SLAY-9.25
title: 'Play-screen header: redesign for mobile, current layout still overlaps/unclear'
status: To Do
assignee: []
created_date: '2026-09-30 11:39'
labels:
  - story
dependencies: []
references:
  - src/ui/play/PlayScreen.tsx
  - src/ui/play/play.css
  - src/ui/play/Modal.tsx
  - src/ui/play/strings.ts
  - src/ui/daily/DailyFlow.tsx
  - src/ui/daily/daily.css
parent_task_id: SLAY-9
type: feature
ordinal: 82000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a genuinely redesigned play-screen header for mobile -- no visual overlap, no broken/wrapped text, and a clear, discoverable More menu and Options/Help entry points. Not another narrow pixel patch: the owner explicitly asked for a new design after SLAY-9.20's fix (a derived-constant CSS budget) still leaves the header feeling broken on mobile.
Type: deliverable
Branch: SLAY-9.25/redesign-mobile-play-header

Owner's report (2026-09-30): visually overlaps, text breaks/wraps, the More menu is unclear, and the Options/Help buttons are not clear either.

Root architecture worth knowing before redesigning (found while scoping this story): today's 'header' on the daily play screen is actually two separate overlaid layers, not one component. src/ui/play/PlayScreen.tsx renders its own internal .play-header (title, timer, Legend, Options/Help behind a More sheet on narrow viewports) but is mounted with an EMPTY title (src/ui/daily/DailyFlow.tsx: <PlayScreen ... title="" .../>). The visible title text and the back button instead come from a second, separately positioned bar, .daily-play__nav in src/ui/daily/daily.css, which floats over the same visual area and reserves a calc()-derived right-hand pixel width (--daily-play-reserve / --daily-play-reserve-with-share) so it does not cover PlayScreen's own icon row. SLAY-9.20 fixed one specific overlap in this two-layer arrangement by correcting that reserve's math; it did not change the two-layer architecture itself, which stays fragile to any future change in icon count, label length or font size -- likely why the owner still sees breakage. This story has real latitude to unify the two layers into one coherent header component if that produces a more robust, clearer result, rather than patching the overlay again.

The More sheet itself (src/ui/play/Modal.tsx, opened via .play-header__more, contains Options and Help as src/ui/play/PlayScreen.tsx's MenuButton items) and the desktop-only .play-header__quick (the same two buttons shown inline instead, CSS-toggled at 641px) are both in scope for the 'unclear Options/Help buttons' and 'unclear More menu' parts of the report.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 No visual overlap between any header elements (back button, title, timer, Legend, Share, More/Options/Help) at real phone widths -- verified with a rendered/headless-browser measurement at true narrow widths (360px, 390px) per CLAUDE.md's rule, not a resized desktop window
- [ ] #2 The title text never breaks awkwardly or gets cut off mid-word; truncation (if still needed for very long titles) is a deliberate, legible fallback, not the mechanism papering over insufficient layout space
- [ ] #3 The More menu's purpose and contents are visually clear on first glance (an unlabelled '...' icon alone is not sufficient if the owner still finds it unclear) -- consider a label, a different icon, or restructuring what lives behind it
- [ ] #4 The Options and Help entry points (whether inline on desktop or inside the More sheet on mobile) are visually clear as distinct, tappable actions -- not easily confused with each other or with decorative icons
- [ ] #5 Real latitude to restructure: unifying PlayScreen's internal .play-header with daily.css's separately-overlaid .daily-play__nav into one coherent header (removing the fragile calc()-reserve two-layer arrangement) is in scope if it produces a materially more robust result than patching the overlay again -- state which approach was taken and why
- [ ] #6 Verified against the actual rendered screen on real phone widths (not just resized desktop windows), per CLAUDE.md's rule, in both the 3-icon (unsolved) and 4-icon (solved+Share visible) states, and in both English and Dutch (longer Dutch labels are a known source of overflow elsewhere in this codebase this session)
- [ ] #7 bun run lint, bun run typecheck, bun run test --maxWorkers=1 stay green
<!-- AC:END -->
