---
id: SLAY-1.7
title: 'Share card: PNG image and emoji text'
status: To Do
assignee: []
created_date: '2026-09-26 19:32'
updated_date: '2026-09-26 19:33'
labels:
  - story
dependencies:
  - SLAY-1.5
  - SLAY-1.6
references:
  - src/share/
  - src/ui/share/
  - src/ui/play/ResultOverlay.tsx
  - src/ui/levels/SolvedScreen.tsx
parent_task_id: SLAY-1
type: feature
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: after solving, the player can share a result card: a PNG (1200x630 and a square 1080x1080) and an emoji text with puzzle number, difficulty, time and hints used ("Slaydoku #43 easy 04:12, 2 hints" plus a small grid of emoji), no spoilers (never the solution or names). Share uses the Web Share API with files where supported and falls back to copy text and download image. The card looks good in light theme, drawn on a canvas or SVG in the app.
Type: deliverable
Branch: SLAY-1.7/share-card
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/share/ builds the emoji text and the card SVG/PNG from a result with unit tests (format, difficulty labels, time formatting, no solution leakage)
- [ ] #2 The solved screen has Share (Web Share with files when available) and Copy text / Download image fallbacks; verified in headless Chrome (canvas to PNG dimensions 1200x630 and 1080x1080) and the PNG contains the puzzle number, difficulty, time and hints
- [ ] #3 bun run lint/typecheck/test (--maxWorkers=1) and audit:personal pass
<!-- AC:END -->
