---
id: SLAY-1.2
title: English interface text
status: To Do
assignee: []
created_date: '2026-09-26 19:32'
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
- [ ] #1 Every strings file under src/ui, src/pwa and src/content/help is English; html lang is en, og:locale en_US; a test scans the UI sources for a small Dutch word list and fails on a hit
- [ ] #2 Headless Chrome pass at 390x844 and 1024x768 (docs/verification/drive.ts style) with screenshots outside the repo: the first-visit card, play screen, options, help, legend and solved screen read naturally in English
- [ ] #3 bun run lint/typecheck/test (--maxWorkers=1) and audit:personal pass
<!-- AC:END -->
