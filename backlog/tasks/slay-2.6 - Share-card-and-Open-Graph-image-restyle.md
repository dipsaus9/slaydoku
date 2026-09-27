---
id: SLAY-2.6
title: Share card and Open Graph image restyle
status: To Do
assignee: []
created_date: '2026-09-27 12:21'
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
- [ ] #1 src/share/card.ts draws the 1200x630 and square PNG with the warm evidence-board palette; the display font is loaded for the headline text via the FontFace API before drawing, falling back to the existing system stack if it fails to load in time
- [ ] #2 src/brand/og-image.svg is redrawn with the same palette (static SVG, no font-loading concern)
- [ ] #3 src/ui/share/share.css consumes the shared tokens for the share sheet UI
- [ ] #4 share.test.ts, share.test.tsx and tools/check-share.ts against a local preview build all pass unchanged
- [ ] #5 No share text, emoji line or spoiler-safety rule changes
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Update card.ts's draw calls to the new colors and load the display font via FontFace before drawing (system fallback on failure/timeout). 2. Redraw og-image.svg by hand with the same palette. 3. Apply tokens to share.css. 4. Run the share test files and tools/check-share.ts against a local build.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Canvas custom-font loading is the one technical risk in this story: guard it with a timeout and a system-font fallback so the PNG never blocks or renders blank. The share text/format (src/share/format.ts, emoji.ts) is untouched.
<!-- SECTION:NOTES:END -->
