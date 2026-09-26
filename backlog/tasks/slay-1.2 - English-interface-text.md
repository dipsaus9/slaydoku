---
id: SLAY-1.2
title: English interface text
status: Done
assignee: []
created_date: '2026-09-26 19:32'
updated_date: '2026-09-26 22:32'
labels:
  - story
dependencies:
  - SLAY-1.1
references:
  - src/ui/
  - src/pwa/
  - src/content/help/
  - index.html
  - public/manifest.webmanifest
  - src/validation/dutch.ts
  - src/validation/dutch.test.ts
  - src/validation/README.md
  - src/brand/site.test.ts
  - src/render/icons/ContactSheetView.tsx
  - src/render/icons/themes/ThemeIconSheet.tsx
  - tools/check-share.ts
  - tools/check-share.test.ts
  - tools/ladder.ts
  - tools/screen-level.ts
  - docs/verification/
  - README.md
  - MIGRATION.md
parent_task_id: SLAY-1
type: feature
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: all visible UI text is English: play screen, toolbar labels, options, hint bar, result and solved overlays, "How it works" card, keywords (behind a button), legend, update notice, errors, titles, the html lang and og:locale, manifest, level list replacement placeholders. Wording is kept in editable files (src/content/help/help.ts, per-module strings files).
Type: deliverable
Branch: SLAY-1.2/english-ui
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every strings file under src/ui, src/pwa and src/content/help is English; html lang is en, og:locale en_US; a test scans the UI sources for a small Dutch word list and fails on a hit
- [x] #2 Headless Chrome pass at 390x844 and 1024x768 (docs/verification/drive.ts style) with screenshots outside the repo: the first-visit card, play screen, options, help, legend and solved screen read naturally in English
- [x] #3 bun run lint/typecheck/test (--maxWorkers=1) and audit:personal pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Replace every interface string with English (strings files, help.ts, glossary examples rendered from engine/clues/en.ts, inline aria labels, update notice, html lang/og:locale/manifest, lab), extend dutch.test.ts to ui/pwa/brand/JSX/index.html, update tests and verification drivers, verify in headless Chrome at 390x844 and 1024x768.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Review gate (dipsaus-ai:story-reviewer): verdict pass, all criteria met, no scope violations, no findings. AC 2 evidence: headless Chrome drive, zoom, legend, screens and offline drivers at 390x844 and 1024x768, 0 failures, screenshots outside the repo. Pre-existing driver breakage from the demo-only cut fixed on the way (drive.ts murderer lookup, legend.ts second-level scenario, zoom.ts blocked square in drag expectation).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
All visible interface text is English: strings files under src/ui and src/pwa, src/content/help/help.ts (version bumped to 2 so everybody sees the card again), the keyword glossary (examples are rendered by the engine from src/engine/clues/en.ts), legend, result and solved texts, update notice, lab, html lang and og:locale, manifest lang. The Dutch scan (src/validation/dutch.test.ts) now covers src/ui, src/pwa, src/content/help, src/brand, JSX text, index.html and the manifest, with a slightly longer word list; tools/check-share checks html lang and og:locale. Verification drivers use the English labels and were repaired where the demo-only cut had broken them. Lint, typecheck, 2313 tests, build, audit:personal (0 hits) and the Chrome drivers at 390x844 and 1024x768 all pass.
<!-- SECTION:FINAL_SUMMARY:END -->
