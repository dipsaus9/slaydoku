---
id: SLAY-8.3
title: 'Hints: stop leaking omniscient-solver reasoning into player-facing hints'
status: Done
assignee: []
created_date: '2026-09-28 22:13'
updated_date: '2026-09-29 16:11'
labels:
  - needs-refinement
dependencies:
  - SLAY-9.5
  - SLAY-11.1
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
- [x] #1 Every hint's explanation is expressed only in terms of steps the player has already been shown or could derive from their own placements/notes — no bare conclusion from a technique's private candidate bookkeeping
- [x] #2 The fix's effect on docs/solvability/README.md's tier guarantees (which techniques each tier may need) is explicitly reasoned through and documented, not assumed
- [x] #3 src/game/hints.test.ts's existing invariants are each explicitly kept or deliberately changed (never silently); any changed invariant is called out for review
- [x] #4 A hint is never issued for a person/cell the player has already correctly placed on the board
- [x] #5 A hint's target is only chosen when it is actually derivable from the player's current progress — never jumping ahead to a person that requires solving someone else first
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Root cause confirmed by reading src/game/hints.ts, knowledge.ts, hintText.ts and every technique
under src/engine/solver/human/techniques and advanced/techniques:

- Only single-candidate PLACEMENTS get a derivation chain (knowledge.ts's chainTo, gated on
  `technique === 'single-candidate'`). Every elimination-only hint from scan/overload/intersect/
  victim-room and every advanced (hard/expert) technique hands the player the technique's own
  self-contained explanation with zero grounding in prior steps: exactly "a bare conclusion from a
  technique's private candidate bookkeeping" (AC1). scan can also PLACE someone (not just single-
  candidate), and that path currently gets zero chain too, same bug class.
- Separately, elimination steps' `people` field (used for the level-1/2 "look at X" personIds) can
  include an already-known suspect (already placed correctly) purely as narrative context (e.g. a
  clue's card owner, or a room's other occupant in victim-room's reasoning) -- that is the
  "hint about someone already solved" bug (AC4): the CELLS crossed off are already correctly
  filtered to unknown people, but the DISPLAYED personIds are not.
- deduction() always returns the FIRST useful step (placement or elimination) found in the fresh
  solve trace, in order -- so it structurally cannot skip an actionable placement to reach a later
  step that depends on it (a placement for an unplaced, non-victim person is always caught before
  any later step that would need it). AC5 is therefore a grounding/display problem, not a step-
  selection bug: once every elimination hint also carries its true backward derivation chain
  (transitively, via the same "about" set expansion chainTo already does), the hint is visibly
  derivable from steps already shown, never from an unseen dependency.

Design (grounding + filtering only, no change to which technique fires or when):
1. Generalize knowledge.ts's chainTo(step, before, personId, realClues) to take
   `subjects: readonly string[]` and drop the `technique !== 'single-candidate'` restriction (it
   was a no-op for the single-candidate-only placement path anyway, and it wrongly zeroed out
   scan's own placement path). Two call sites become `chainTo(step, seen, [personId], ...)`.
2. hints.ts's deduction(): for the elimination ("news") branch, compute (a) `subjects` = the
   step's own people minus victim minus already-known suspects (display filter, AC4) and (b)
   `chain` = chainTo(step, result.steps.slice(0, i), step.people, real.length) seeded with the
   FULL (unfiltered) people list, so the chain can legitimately reference prior steps about
   already-known/victim people as background derivation, while the DISPLAY stays filtered. Add
   both as new optional NextStep fields.
3. hintText.ts's stepHint(): personIds = placement ? [placement.personId] : (next.subjects ?? ...);
   guard `named` against an empty list; wrap the elimination explanation with the same
   chain-then-final + MAX_REASONING truncation logic focusHint's reasoning() already uses (factor
   it out as a small shared helper). Placement-branch text is untouched (crossedWho is always []
   for a placement, so the new wrapper is a no-op there).
4. hints.test.ts: keep AC3's "does not depend on what the player crossed out or noted" invariant
   exactly as is (chain is built from the deterministic solve trace, never from state.board marks
   or notes) -- verified, not touched. Add new tests for: an elimination hint's personIds never
   includes an already-known suspect (AC4 regression for the owner's report), and that a hint
   naming multiple people is never issued while any of the named people still needs another
   person solved first that the game hasn't already shown a step for (AC5), plus a chain-grounding
   assertion for at least one elimination hint on the existing hardPuzzle() fixture (AC1). Any
   existing pinned hint-text assertion that changes wording because of this (longer elimination
   explanations gaining a lean-on-earlier-steps prefix) gets called out explicitly in the diff/PR,
   never silently adjusted.
5. docs/solvability/README.md: add a short note that this is a presentation/grounding-only change
   -- deduction() still runs the exact same technique registries in the exact same order at the
   exact same point (advancedRegistry, HARD_LEVEL leaning gate unchanged); the ladder and tier
   table (which techniques a tier may need) are unaffected. Reasoned through, not assumed (AC2).
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Launch blocker (owner decision, 2026-09-29): this story must ship before the repository goes public — see docs/handoff.md and the go-live epic (SLAY-12), which does not itself depend on this story but the actual visibility flip should wait for it. Depends on SLAY-9.5 (victim filtered out of hints.ts's people iteration) so this rework lands on an already victim-filtered hint pool, not a moving target.

Owner report folded in (2026-09-29): 'sometimes you get hints about people that are already solved, or hints about people that can not be solved yet as you have to solve other people first' — same root cause already diagnosed (deduction()'s reach for the omniscient advanced solver regardless of difficulty tier); the two new acceptance criteria above make the already-solved and not-yet-derivable cases explicit rather than only implied by AC #1.

Implemented (src/game/knowledge.ts, src/game/hints.ts, src/game/hintText.ts). AC-by-AC:

AC1 (grounded, not bare): chainTo() generalized to take a subjects list and to work for
elimination steps, not just single-candidate placements (it also fixes scan's own placement path,
which previously got zero chain too since the old guard only allowed 'single-candidate'). An
elimination hint's level-3 explanation is now the chain's earlier explanations followed by the
step's own, through the same chain-then-final + MAX_REASONING(340) truncation reasoning() already
used for placements, factored into a shared chainedText() helper. Verified on generated puzzles:
27/39 sampled elimination hints picked up a non-empty chain; new regression test in hints.test.ts.

AC2 (tier guarantees documented): docs/solvability/README.md gained a "Hint explanations vs. this
ladder" section. Conclusion: no effect on the tier table. deduction() still runs the exact same
technique registries in the exact same order at the exact same point (advancedRegistry, HARD_LEVEL
leaning gate all unchanged) -- this story only changed the explanation TEXT and the displayed
subject of an elimination hint, never which step fires or when.

AC3 (invariants): hints.test.ts's "does not depend on what the player crossed out or noted"
invariant verified still holds and is UNCHANGED (the chain is built from the deterministic solve
trace via chainTo, never from state.board marks/notes) -- explicitly checked, not silently kept.
No other existing test needed a wording change; the full suite (141 files / 3017 tests) is green
on the branch, plus 3 new tests for AC1/AC4/AC5.

AC4 (never an already-solved person): deduction()'s elimination branch now computes a display-safe
`subjects` list (step.people minus the victim minus anybody already correctly placed) and threads
it through NextStep -> stepHint()'s personIds/who, instead of the raw, unfiltered step.people (a
clue's card owner or a room's other sure occupant could already be correctly placed and still
leak into the "look at X" text -- exactly the owner's "hints about people that are already solved"
report). The chain, by contrast, is deliberately seeded from the FULL unfiltered people list, so it
can still legitimately cite an already-placed suspect's earlier step as background derivation.
New regression test in hints.test.ts across 15 generated-puzzle seeds.

AC5 (never ahead of dependency order): structurally, deduction() already returns the very first
useful step (placement or elimination) it finds in solve-trace order, so it can never skip past an
actionable placement to reach a later step that depends on it -- any such earlier placement would
itself have been returned first. The AC1 chain fix reinforces this by making the true (already
in-trace) dependency visible rather than implicit. New regression test: a full expert-tier walk
(deduction()'s heaviest-use path, and the story's own flagged worst case) follows only the hints to
a solved level with every placement matching the true solution.

Extra verification beyond the standard baseline, given the story's own medium-to-high risk framing:
`bun run validate:generation --seeds 6 --sizes 6,9 --tiers very-easy,easy,easy-medium,medium,hard,expert --themes home`
-- all 12 cells (72 seeds) passed every gate including the hint audit. Hard/expert puzzles remain
fully hintable; no jargon/length regressions across any tier.

Independent review (dipsaus-ai:story-reviewer): verdict PASS. All 5 acceptance criteria met, no
scope violations. Two advisory (non-blocking) findings, both in src/game/hintText.ts: (1) if an
elimination step's filtered `subjects` ever ends up empty, level 1 falls back gracefully to a
nameless "Pay attention to <rooms>"/"Take a good look at the board" -- a possible UX degradation,
not a correctness bug, already guarded against a crash by the personIds.length>0 check; optional
follow-up would be a dedicated regression test. (2) level 1's personIds (from the new `subjects`)
and level 3's crossedWho (from the actual crossed eliminations) are two independently-filtered
sets that could in principle diverge in which people they name -- this pattern pre-dates this
story (step.people vs step.eliminated were already separate) and isn't introduced or worsened by
it. Neither blocks this story; noted here for a future hint-wording-consistency pass if it ever
becomes its own story.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Grounded every hint explanation beyond a single-candidate placement (scan, overload, intersect,
victim-room, and every hard/expert technique) in the earlier steps it actually leans on, instead
of handing the player a technique's own bare, self-contained conclusion. knowledge.ts's chainTo
now takes a list of subjects and works for elimination steps too (previously gated to
single-candidate placements only, which also silently starved a scan-driven placement of its own
chain). hints.ts's deduction() also filters an elimination hint's displayed subject (never the
victim or a suspect already correctly placed) while still letting the chain cite them as
legitimate background derivation. hintText.ts's stepHint() surfaces the chain the same way
focusHint()'s reasoning() already did for placements, via a shared chainedText() helper with the
same length-capped truncation.

No change to which technique fires, when, or in what order: deduction() runs the exact same
registries at the exact same point as before. docs/solvability/README.md gained a section
reasoning through why the tier table is unaffected. hints.test.ts's pre-existing "does not depend
on what the player crossed out or noted" invariant was verified to still hold and is untouched;
three new tests cover the owner's two reported bugs directly (never names an already-solved
suspect/the victim; a full expert-tier walk following only the hints never jumps ahead, every
placement matches the true solution) plus a chain-grounding assertion. Extra verification beyond
the standard baseline given the story's own risk framing: a validate:generation sweep across
very-easy through expert on 6x6/9x9 passed every gate including the hint audit -- hard/expert
puzzles remain fully hintable. Independent review: pass, no scope violations, two non-blocking
advisory findings recorded in the task notes.
<!-- SECTION:FINAL_SUMMARY:END -->
