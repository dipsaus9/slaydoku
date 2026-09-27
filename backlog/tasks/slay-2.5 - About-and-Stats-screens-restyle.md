---
id: SLAY-2.5
title: About and Stats screens restyle
status: To Do
assignee: []
created_date: '2026-09-27 12:20'
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
- [ ] #1 src/ui/about/about.css and src/ui/stats/stats.css have no hardcoded hex colors left outside the SLAY-2.1 tokens
- [ ] #2 Section headings (About) and the streak headline (Stats) use --font-display; body text stays on --font-body
- [ ] #3 about.test.tsx and stats.test.tsx pass unchanged; the verify:phone drive/offline suites' About-page checks pass unchanged
- [ ] #4 No text, heading, link or route in either screen changes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace hardcoded colors in about.css/stats.css with the shared tokens. 2. Apply --font-display to headings only. 3. Run about/stats unit tests and the relevant verify:phone suites.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Content strings (src/ui/about/strings.ts, src/ui/stats/strings.ts) are untouched; this is a pure CSS pass.
<!-- SECTION:NOTES:END -->
