---
id: SLAY-9.7
title: Translate the How it works guide and keyword glossary into Dutch
status: To Do
assignee: []
created_date: '2026-09-29 09:58'
labels:
  - story
dependencies: []
references:
  - src/content/help/help.ts
  - src/ui/help/HowItWorks.tsx
  - src/ui/help/Glossary.tsx
  - src/ui/play/HelpPanel.tsx
  - src/ui/play/glossary.ts
  - src/content/help/help.test.ts
parent_task_id: SLAY-9
type: feature
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the Help modal's guide (goal, steps, the collapsed more list) and keyword glossary (GLOSSARY, EXTRA_TERMS) have real Dutch content, selected by the player's locale, at the same quality bar as the Dutch clue and hint wording already shipped in SLAY-3.2/3.3.
Type: deliverable
Branch: SLAY-9.7/help-glossary-dutch

Root cause: unlike every strings.ts file in the app (which already has en/nl objects picked via useLocale()), src/content/help/help.ts is a single English-only object imported directly by HowItWorks.tsx/HelpPanel.tsx, and src/ui/play/glossary.ts's GLOSSARY/EXTRA_TERMS are English-only prose imported directly by Glossary.tsx. Neither has ever had a Dutch variant — this is real translation-writing, not a wiring gap (unlike the related Legend-nouns bug, SLAY-9.6, where the Dutch data already existed and just wasn't read).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 help.ts has a complete Dutch content object (goal, steps, more, keywords, legend button/copy, close, link) alongside the English one, selected by locale
- [ ] #2 glossary.ts's GLOSSARY and EXTRA_TERMS have Dutch keyword/meaning/example text alongside English, selected by locale
- [ ] #3 HowItWorks.tsx, Glossary.tsx and HelpPanel.tsx read content via useLocale() instead of importing the English help/GLOSSARY directly
- [ ] #4 help.test.ts's existing invariants (version positivity, label-length caps, goal sentence-count/length caps, required rule-coverage regexes) run over both locales, not only English
- [ ] #5 Dutch glossary terms stay consistent with the Dutch clue-sentence vocabulary already shipped in SLAY-3.2/3.3 — no new or conflicting Dutch term for a concept that already has one
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add an NL content object in help.ts (and Dutch entries in glossary.ts) mirroring the English shape exactly; select by useLocale() at the three consumer sites instead of the bare import. Cross-check terminology against src/engine/clues/nl.ts and the hint wording from SLAY-3.3 before finalizing wording.
<!-- SECTION:PLAN:END -->
