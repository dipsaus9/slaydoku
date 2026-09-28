---
id: SLAY-8.3
title: 'Hints: stop leaking omniscient-solver reasoning into player-facing hints'
status: To Do
assignee: []
created_date: '2026-09-28 22:13'
labels:
  - needs-refinement
dependencies: []
references:
  - src/game/hints.ts
  - src/game/knowledge.ts
  - src/game/hintText.ts
  - src/engine/solver/human/
  - src/engine/solver/advanced/
  - docs/solvability/
parent_task_id: SLAY-8
type: feature
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a hint never rests on reasoning the player couldn't have reached from what they've actually placed/noted so far — it should feel like the next honest step, not a conclusion pulled from the advanced solver's unlimited working memory.
Type: deliverable
Branch: SLAY-8.3/hint-derivation-trail

Owner report: "De hints die nu gegeven worden zijn niet logisch opgebouwd. Vaak heb je meer informatie nodig dan dat je weet. Laat de hints baseren op waar je bent / wat je geplaatst hebt. De hints moeten je verder helpen en constructief zijn op basis van wat je hebt."

Investigated (not implemented — needs a deliberate design decision, not a quick patch):
- Hints ARE computed live off the current board state (not a static replay) — that part of the complaint is not literally true.
- The real gap: src/game/hints.ts's deduction() fallback (lines ~123-170) reaches for src/engine/solver/advanced (unlimited working memory, explicitly NOT what a person can do per docs/solvability/README.md) whenever the cheap paths fail, regardless of the puzzle's actual difficulty tier. Its explanation is self-contained per technique; only single-candidate hints get a chainTo back-justification (src/game/knowledge.ts) tying the hint to steps the player has actually seen. Every other technique (hidden pairs, overload, fish, chains) hands the player a conclusion with no visible derivation.
- A second, milder gap: even the 'basic' knowledge() path's defaultRegistry (scan, victimRoom, overload, intersect) already reasons beyond the human-solvability ladder (src/engine/solvable/) that src/docs/solvability/README.md says the ladder alone guarantees.

Risk: medium-to-high. This is the core solvability guarantee — src/game/hints.test.ts's 'does not depend on what the player crossed out or noted' (line ~92) documents a DELIBERATE existing invariant that a fix would need to consciously reconsider, not silently break. A wrong fix could make hard/expert puzzles unhintable, or silently change extensively-tested hint text/ordering.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every hint's explanation is expressed only in terms of steps the player has already been shown or could derive from their own placements/notes — no bare conclusion from a technique's private candidate bookkeeping
- [ ] #2 The fix's effect on docs/solvability/README.md's tier guarantees (which techniques each tier may need) is explicitly reasoned through and documented, not assumed
- [ ] #3 src/game/hints.test.ts's existing invariants are each explicitly kept or deliberately changed (never silently); any changed invariant is called out for review
<!-- AC:END -->
