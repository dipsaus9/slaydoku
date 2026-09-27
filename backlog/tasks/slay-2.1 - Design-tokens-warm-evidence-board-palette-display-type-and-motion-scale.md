---
id: SLAY-2.1
title: 'Design tokens: warm evidence-board palette, display type and motion scale'
status: To Do
assignee: []
created_date: '2026-09-27 12:19'
updated_date: '2026-09-27 12:20'
labels:
  - story
dependencies: []
references:
  - src/brand/tokens.css
  - public/fonts/
  - src/index.css
parent_task_id: SLAY-2
type: feature
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a single shared token source defines the warm evidence-board palette, the self-hosted display font, the existing body/cursive font stacks, a spacing scale and a motion scale (durations/easings, prefers-reduced-motion respected), consumed once from src/index.css. No component references the new tokens yet, so no screen changes visually in this story — it is pure infrastructure the following stories build on.
Type: deliverable
Branch: SLAY-2.1/design-tokens
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/brand/tokens.css defines --color-bg (#f7f2e6), --color-ink (#2a2a36, unchanged), --color-accent (#b3413e, case-file red) and --color-accent-dark, --color-line (warm tan), --color-paper, plus --font-display, --font-body, --font-hand (existing cursive stack, unchanged), a spacing scale and --ease-*/--duration-* motion tokens; prefers-reduced-motion collapses every duration
- [ ] #2 The Fraunces variable font is self-hosted as a Latin-only woff2 subset under public/fonts/, loaded with font-display: swap, and stays within the PRECACHE_BUDGET_BYTES headroom (vite.config.ts)
- [ ] #3 bun run lint, typecheck, test --maxWorkers=1 and build stay green
- [ ] #4 src/index.css imports the tokens once and switches body's background/ink to var(--color-bg)/var(--color-ink) (the warm manila shift); every other visual choice (typography, spacing, component chrome) is left untouched for the following stories
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Pick and download a Fraunces variable subset (Latin, woff2) into public/fonts/, note its license (SIL OFL) in a short comment. 2. Write src/brand/tokens.css with the palette/type/spacing/motion custom properties and an @font-face for Fraunces with font-display: swap. 3. Import it once from src/index.css, at the top, and switch body's background/color to the two new color tokens. 4. Confirm nothing else in the tree references the tokens yet (per-screen restyling is later stories). 5. Confirm the new font file is swept into the sw.js precache list and check the total against PRECACHE_BUDGET_BYTES.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Keep --font-hand and --font-body exactly as the current stacks in src/index.css/cards.css (zero network cost, already good). Only --font-display is a new network font. The only visible change in this story is the global background/ink shifting to the warm tokens (body in src/index.css); every component-level restyle is a later story.
<!-- SECTION:NOTES:END -->
