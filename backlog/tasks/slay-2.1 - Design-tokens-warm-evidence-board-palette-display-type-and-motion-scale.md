---
id: SLAY-2.1
title: 'Design tokens: warm evidence-board palette, display type and motion scale'
status: Done
assignee: []
created_date: '2026-09-27 12:19'
updated_date: '2026-09-27 12:54'
labels:
  - story
dependencies: []
references:
  - src/brand/tokens.css
  - public/fonts/
  - src/index.css
  - index.html
  - public/manifest.webmanifest
  - tools/check-share.test.ts
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
- [x] #1 src/brand/tokens.css defines --color-bg (#f7f2e6), --color-ink (#2a2a36, unchanged), --color-accent (#b3413e, case-file red) and --color-accent-dark, --color-line (warm tan), --color-paper, plus --font-display, --font-body, --font-hand (existing cursive stack, unchanged), a spacing scale and --ease-*/--duration-* motion tokens; prefers-reduced-motion collapses every duration
- [x] #2 The Fraunces variable font is self-hosted as a Latin-only woff2 subset under public/fonts/, loaded with font-display: swap, and stays within the PRECACHE_BUDGET_BYTES headroom (vite.config.ts)
- [x] #3 bun run lint, typecheck, test --maxWorkers=1 and build stay green
- [x] #4 src/index.css imports the tokens once and switches body's background/ink to var(--color-bg)/var(--color-ink) (the warm manila shift); every other visual choice (typography, spacing, component chrome) is left untouched for the following stories
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Pick and download a Fraunces variable subset (Latin, woff2) into public/fonts/, note its license (SIL OFL) in a short comment. 2. Write src/brand/tokens.css with the palette/type/spacing/motion custom properties and an @font-face for Fraunces with font-display: swap. 3. Import it once from src/index.css, at the top, and switch body's background/color to the two new color tokens. 4. Confirm nothing else in the tree references the tokens yet (per-screen restyling is later stories). 5. Confirm the new font file is swept into the sw.js precache list and check the total against PRECACHE_BUDGET_BYTES.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Keep --font-hand and --font-body exactly as the current stacks in src/index.css/cards.css (zero network cost, already good). Only --font-display is a new network font. The only visible change in this story is the global background/ink shifting to the warm tokens (body in src/index.css); every component-level restyle is a later story.

Widened References: switching body's background to var(--color-bg) (a real value change f5f3ef -> f7f2e6, not just a token indirection) desynced public/manifest.webmanifest's theme_color/background_color and index.html's light theme-color meta from the page, and broke tools/check-share.test.ts's literal-hex regex check of that invariant. Fixed all three in place: synced both to #f7f2e6, and taught the test to resolve var(--color-bg) against src/brand/tokens.css instead of only literal hex.

Review gate: PASS (round 1). Reviewer verified all 4 acceptance criteria met, no scope violations; the References widening (index.html, public/manifest.webmanifest, tools/check-share.test.ts) was judged legitimate — minimum footprint to keep the existing manifest/theme-color-sync invariant true after the deliberate body background value change. One advisory note: :root's font shorthand was also switched to var(--font-body) (same literal value, no visual delta) — not named in AC4 but harmless; left as-is.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shipped a single shared token source (src/brand/tokens.css): the warm evidence-board palette (--color-bg/ink/accent/accent-dark/line/paper), the display/body/hand font stacks (--font-display new self-hosted Fraunces, --font-body and --font-hand kept at their existing values), a --space-1..7 spacing scale, and --duration-*/--ease-* motion tokens that collapse to near-zero under prefers-reduced-motion. Fraunces ships as a self-hosted Latin-only woff2 variable subset under public/fonts/ with font-display: swap, well within the precache budget. src/index.css imports the tokens once and switches body's background/ink to var(--color-bg)/var(--color-ink) — the one visible change in this story (#f5f3ef -> #f7f2e6 manila shift). That value change also required resyncing index.html's light theme-color meta and public/manifest.webmanifest's theme/background colors, and teaching tools/check-share.test.ts to resolve the token instead of expecting a literal hex — all in scope as a direct, minimum-footprint consequence of the mandated change (reviewed and passed). lint/typecheck/test (2553 tests)/build all green. No component consumes the new tokens yet; that is the following SLAY-2.2..2.7 stories' job.
<!-- SECTION:FINAL_SUMMARY:END -->
