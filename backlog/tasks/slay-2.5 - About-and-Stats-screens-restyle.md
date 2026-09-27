---
id: SLAY-2.5
title: About and Stats screens restyle
status: Done
assignee: []
created_date: '2026-09-27 12:20'
updated_date: '2026-09-27 13:39'
labels:
  - story
dependencies:
  - SLAY-2.1
references:
  - src/ui/about/
  - src/ui/stats/
parent_task_id: SLAY-2
type: feature
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the About page and the Stats panel consume the SLAY-2.1 tokens (color, display font on headings, spacing); every piece of content stays exactly as written.
Type: deliverable
Branch: SLAY-2.5/about-stats-restyle
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 src/ui/about/about.css and src/ui/stats/stats.css have no hardcoded hex colors left outside the SLAY-2.1 tokens
- [x] #2 Section headings (About) and the streak headline (Stats) use --font-display; body text stays on --font-body
- [x] #3 about.test.tsx and stats.test.tsx pass unchanged; the verify:phone drive/offline suites' About-page checks pass unchanged
- [x] #4 No text, heading, link or route in either screen changes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. about.css: turn .about's local --ink/--accent/--line into aliases onto --color-ink/--color-accent/--color-line; add font-family: var(--font-display) to .about__title and .about__section h2. 2. stats.css: add a local --ink/--accent/--line/--paper/--danger alias block on .stats-entry, .stats-panel (mirrors the .daily pattern from SLAY-2.2); drop every hex fallback (var(--x, #hex) -> var(--x)); map the remaining bare hex (danger button, progress track/fill, success/failed message banners) onto the same tokens, same collapse-onto-warm-palette approach SLAY-2.2 used for daily.css's banners; add font-family: var(--font-display) to .stats-entry__summary (the streak headline). 3. Run lint/typecheck/test plus about.test.tsx/stats.test.tsx directly; verify:phone needs a physical phone/iPad and cannot run in this sandbox, flagged as a follow-up manual check for the owner.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Content strings (src/ui/about/strings.ts, src/ui/stats/strings.ts) are untouched; this is a pure CSS pass.

Verified: about.css/stats.css hardcoded hex fully removed (grep clean); headings (.about__title, .about__section h2) and the streak headline (.stats-entry__summary) use --font-display, body text untouched. bun run lint/typecheck/test all green (136 files, 2553 tests, incl. about.test.tsx 8/8 and stats.test.tsx 7/7 unchanged). verify:phone SUITES=drive,offline ran full default 6 viewports: 765 checks total; one drive@390x844 run reported 0 checks/no log under POOL=5 concurrency (Chrome resource contention, not a regression) — re-ran isolated (POOL=1) and it passed 111/111. No text/heading/link/route changed anywhere (pure CSS pass), matching the story notes.

Independent review (dipsaus-ai:story-reviewer): verdict PASS. All 4 acceptance criteria met, no scope violations. 2 advisory findings (non-blocking): (1) backlog task file bookkeeping outside declared References — expected delivery bookkeeping, not story content; (2) .stats-message success/failed states now share --paper background, distinguished only by border color (--line vs --accent) since no separate success/failed tokens exist in SLAY-2.1 — accepted as in scope for a pure tokens-consumption pass (this story does not introduce new tokens).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
About page and Stats panel now consume the SLAY-2.1 shared tokens: about.css's and stats.css's local --ink/--accent/--line aliases (stats.css also gained --paper/--danger) point at --color-ink/--color-accent/--color-line/--color-paper/--color-accent-dark from src/brand/tokens.css instead of hardcoded hex, and every remaining bare hex (danger button, progress track/fill, success/failed message banners) was remapped onto the same palette, mirroring the collapse-onto-warm-palette approach SLAY-2.2 used for daily.css. Section headings (.about__title, .about__section h2) and the Stats streak headline (.stats-entry__summary) use --font-display; body text is untouched. No text, heading, link or route changed anywhere. Verified: lint/typecheck/test all green (136 files, 2553 tests incl. about.test.tsx and stats.test.tsx unchanged), plus a live verify:phone drive+offline run across all 6 viewports (765 checks, 0 real failures). Independent review verdict: pass, no scope violations.
<!-- SECTION:FINAL_SUMMARY:END -->
