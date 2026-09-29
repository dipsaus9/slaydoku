---
id: SLAY-9.18
title: >-
  Start screen: redo the Wordle-style redesign, current pass still reads as a
  form/dashboard
status: To Do
assignee: []
created_date: '2026-09-29 17:10'
updated_date: '2026-09-29 17:10'
labels:
  - story
dependencies:
  - SLAY-9.15
  - SLAY-9.16
  - SLAY-9.17
references:
  - src/ui/daily/StartScreen.tsx
  - src/ui/daily/daily.css
parent_task_id: SLAY-9
type: feature
ordinal: 74000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the start screen actually reads like Wordle's landing screen — one open, borderless hero, not a stack of separate bordered card/box sections.
Type: deliverable
Branch: SLAY-9.18/start-screen-redesign-v2

Owner feedback on SLAY-9.9's merged result: 'Ook heeft de home page nog steeds niet de look en feel zoals Wordle. Maak opnieuw design keuzes' (the home page still doesn't have Wordle's look and feel; make new design choices).

Confirmed live (screenshot at 1280x900, locale nl) what SLAY-9.9 actually shipped vs. the Wordle reference:
- Wordle's reference screen: plain flat background, no visible card/box borders anywhere; exactly one open hero block (icon mark, bold serif title, a LARGE serif one-line tagline — not small/muted, a row of pill-shaped buttons directly under the tagline, then only a small byline/date line at the very bottom). Nothing else is visible without scrolling.
- Slaydoku's current start screen: icon + title + tagline (correctly centered, good so far) — but the tagline renders small and grey/muted, not a prominent serif line. Directly below that sits a row of EN/NL locale pills plus a 'How it works' link, which has no Wordle equivalent at all in that position. Then a visibly bordered, rounded-corner card containing two lines of metadata (difficulty/size) ABOVE the primary Play button, rather than the button sitting directly under the tagline. Below that card is a SECOND separately-bordered box (streak/stats + a Statistieken button). The whole page reads as a stack of 2-3 distinct boxed sections, not Wordle's one open block.

This is a genuine visual redo, not a tweak — SLAY-9.9's structural centering was right, but the card-based chrome and content ordering still don't match the reference.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The primary hero (icon, title, tagline, action button) has no visible card border/box around it — open background, matching Wordle's flat single-block look
- [ ] #2 The tagline reads as a prominent line (larger, less muted) rather than small grey caption text, closer to Wordle's tagline weight
- [ ] #3 The primary action button (Play/Continue) sits directly under the tagline as the clear next step, not buried below two lines of metadata inside a bordered box
- [ ] #4 Locale toggle and Help link are relocated out of the primary hero's direct flow (e.g. a corner or footer position) so they don't compete with the title/tagline/button as a Wordle-style page has no equivalent row there
- [ ] #5 Streak/stats content (and its Statistieken button) no longer sits in its own separately-bordered box competing visually with the hero — de-emphasize it (lighter weight, no visible border, or move it below a clear visual break) so the hero still reads as the one dominant block
- [ ] #6 Difficulty/size metadata, the byline (date/site) and countdown stay present (per the existing decisions in CLAUDE.md — puzzle date and until-when must still be shown) but woven into the open layout rather than boxed
- [ ] #7 Verified against the actual rendered screen at phone, iPad and desktop widths, in both locales, per CLAUDE.md's rule — not just code
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Design direction is the implementer's call, but the constraint is explicit: no card border around the primary hero content, one dominant open block, button immediately after the tagline, chrome (locale/help) and secondary content (stats) visually subordinate or relocated. Re-read this story's description for the concrete before/after comparison rather than re-deriving requirements from the Wordle reference alone — the owner does not have the original reference image available to attach here.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Dependencies are sequencing only (all touch StartScreen.tsx/daily.css/play.css) — no functional relationship. Sequenced last so the redesign lands on top of the text/button fixes rather than the other way around.
<!-- SECTION:NOTES:END -->
