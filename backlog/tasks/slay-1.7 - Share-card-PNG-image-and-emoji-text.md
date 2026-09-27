---
id: SLAY-1.7
title: 'Share card: PNG image and emoji text'
status: Done
assignee: []
created_date: '2026-09-26 19:32'
updated_date: '2026-09-27 00:50'
labels:
  - story
dependencies:
  - SLAY-1.5
  - SLAY-1.6
references:
  - src/share/
  - src/ui/share/
  - src/ui/play/ResultOverlay.tsx
  - src/ui/daily/
  - src/ui/play/PlayScreen.tsx
  - vite.config.ts
  - docs/verification/
  - docs/daily-flow.md
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
- [x] #1 src/share/ builds the emoji text and the card SVG/PNG from a result with unit tests (format, difficulty labels, time formatting, no solution leakage)
- [x] #2 The solved screen has Share (Web Share with files when available) and Copy text / Download image fallbacks; verified in headless Chrome (canvas to PNG dimensions 1200x630 and 1080x1080) and the PNG contains the puzzle number, difficulty, time and hints
- [x] #3 bun run lint/typecheck/test (--maxWorkers=1) and audit:personal pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Pure builders in src/share (labels, time, hints, spoiler-free emoji strip, text, card SVG 1200x630 and 1080x1080, SITE_URL from build env); src/ui/share (canvas PNG, share/copy/download logic with injectable navigator, SharePanel); fill the start-screen share slot in DailyFlow and the ResultOverlay slot; unit tests incl. spoiler scan; share.ts driver wired into verify:phone.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified: lint, typecheck, test --maxWorkers=1 (2598 passed), build, audit:personal 0 hits, verify:phone 390x844 and 1024x768 0 failures (share suite 27 checks each). Emoji strip design: one square per suspect, blue placed, yellow per hint, red per wrong check (order of placement is not stored). In the daily flow the result overlay is left at once for the start screen, so the card is seen in the start screen slot; the overlay slot is unit tested.

Review gate: round 1 blocked only on scope (PlayScreen.tsx, vite.config.ts, docs/); References widened via --ref; round 2 verdict pass, 3 criteria met, 0 scope violations. Advisory: pill/legend widths estimated from character counts (system fonts vary); real download path not exercised in headless (anchor click stubbed); SSR not supported.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Share card shipped: pure builders in src/share (labels, mm:ss and h:mm:ss time, hints wording, spoiler-free emoji strip of one square per suspect, share text, 1200x630 and 1080x1080 card SVGs in the brand colours, SITE_URL from the build env), src/ui/share (canvas PNG, Web Share with files or text, Copy text with textarea fallback, Download image, SharePanel with preview, shape toggle and status line), filled into the start-screen share slot and the result overlay. Unit tests include a spoiler scan; a share driver runs in verify:phone (27 checks per viewport, PNG sizes checked on a canvas).
<!-- SECTION:FINAL_SUMMARY:END -->
