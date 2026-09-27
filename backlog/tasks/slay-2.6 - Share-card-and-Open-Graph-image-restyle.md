---
id: SLAY-2.6
title: Share card and Open Graph image restyle
status: In Progress
assignee: []
created_date: '2026-09-27 12:21'
updated_date: '2026-09-27 13:37'
labels:
  - story
dependencies:
  - SLAY-2.1
references:
  - src/share/
  - src/ui/share/
  - src/brand/og-image.svg
parent_task_id: SLAY-2
type: feature
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the shareable result PNG (src/share/card.ts), the in-app share sheet (src/ui/share) and the static Open Graph preview (src/brand/og-image.svg) all use the SLAY-2.1 palette and display font, so a shared result card and a link preview both match the rest of the site's new identity.
Type: deliverable
Branch: SLAY-2.6/share-card-restyle
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 src/share/card.ts draws the 1200x630 and square PNG with the warm evidence-board palette; the display font is loaded for the headline text via the FontFace API before drawing, falling back to the existing system stack if it fails to load in time
- [x] #2 src/brand/og-image.svg is redrawn with the same palette (static SVG, no font-loading concern)
- [ ] #3 src/ui/share/share.css consumes the shared tokens for the share sheet UI
- [ ] #4 share.test.ts, share.test.tsx and tools/check-share.ts against a local preview build all pass unchanged
- [ ] #5 No share text, emoji line or spoiler-safety rule changes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. card.ts: repoint PAPER/PANEL(was WHITE)/LINE to the SLAY-2.1 tokens (color-bg/color-paper/color-line); keep ACCENT/AMBER/RED/MUTED pinned to their current hex since they encode the emoji-matching strip + pill state (blue/amber/red = placed/hint/wrong), which AC5 forbids changing. Add loadDisplayFont(): fetches the self-hosted Fraunces woff2, verifies it with the FontFace API, races a timeout, and on success returns a font-family + an @font-face style (base64-embedded, since an SVG used as an <img>/canvas source never fetches its own external resources) to draw the wordmark headline with; on failure/timeout returns the existing system stack unchanged. cardSvg gains an optional 4th param carrying that choice, defaulting to the system stack so every existing call (incl. the tests) draws exactly as before. 2. Redraw og-image.svg by hand: same bg/panel/line hex swap; keep the mystery-tile blue/amber; tagline can move to the case-file red accent (no test pins its color). 3. share.css: alias --ink/--accent/--line/--paper/--good onto var(--color-*) on .share (matching daily.css/play.css's SLAY-2.2/2.3 pattern), drop the hardcoded hex fallbacks, .share__preview/.share__text move to var(--color-bg), .share__title picks up var(--font-display). 4. Wire useShare.ts: call loadDisplayFont() once in an effect, feed the result into the cardSvg memo. 5. Run lint/typecheck/test after each slice; no share text/emoji/format.ts/emoji.ts touched.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Canvas custom-font loading is the one technical risk in this story: guard it with a timeout and a system-font fallback so the PNG never blocks or renders blank. The share text/format (src/share/format.ts, emoji.ts) is untouched.

public/og-image.png left untouched: the sandboxed headless-Chrome render (bun tools/brand.ts) produced a blank capture here, unlike the deterministic macOS-Chrome runs the tool's own doc comment assumes. Regenerate it on a machine with a working Chrome render once this lands (og-image.svg is the only source that changed, so only that one PNG needs a re-run).
<!-- SECTION:NOTES:END -->
