---
id: SLAY-9.18
title: >-
  Start screen: redo the Wordle-style redesign, current pass still reads as a
  form/dashboard
status: Done
assignee: []
created_date: '2026-09-29 17:10'
updated_date: '2026-09-29 19:46'
labels:
  - story
dependencies:
  - SLAY-9.15
  - SLAY-9.16
  - SLAY-9.17
references:
  - src/ui/daily/StartScreen.tsx
  - src/ui/daily/daily.css
  - src/ui/daily/strings.ts
  - src/ui/daily/daily.test.tsx
  - src/ui/daily/intro/
  - docs/verification/intro.ts
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
- [x] #1 The primary hero (icon, title, tagline, action button) has no visible card border/box around it — open background, matching Wordle's flat single-block look
- [x] #2 The tagline reads as a prominent line (larger, less muted) rather than small grey caption text, closer to Wordle's tagline weight
- [x] #3 The primary action button (Play/Continue) sits directly under the tagline as the clear next step, not buried below two lines of metadata inside a bordered box
- [x] #4 Locale toggle and Help link are relocated out of the primary hero's direct flow (e.g. a corner or footer position) so they don't compete with the title/tagline/button as a Wordle-style page has no equivalent row there
- [x] #5 Streak/stats content (and its Statistieken button) no longer sits in its own separately-bordered box competing visually with the hero — de-emphasize it (lighter weight, no visible border, or move it below a clear visual break) so the hero still reads as the one dominant block
- [x] #6 Difficulty/size metadata, the byline (date/site) and countdown stay present (per the existing decisions in CLAUDE.md — puzzle date and until-when must still be shown) but woven into the open layout rather than boxed
- [x] #7 Verified against the actual rendered screen at phone, iPad and desktop widths, in both locales, per CLAUDE.md's rule — not just code
- [x] #8 The start screen includes a brief intro of what the game actually is (beyond the one-line tagline) paired with a small visual example of gameplay — e.g. a short looping GIF/animation showing a clue being read and a suspect placed, similar to how other daily-puzzle sites give new visitors a glance at the mechanic before they commit to playing
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Record the gameplay example from the real app: docs/verification/intro.ts drives headless Chrome on day #1 (2026-09-27, over, no spoiler) at 800x560 -- read a clue, two notes, two placements, a hint -- and writes an animated WebP per locale plus a still frame for prefers-reduced-motion (src/ui/daily/intro/).
2. StartScreen.tsx: top bar (Help left, locale toggle right) before the hero; hero = mark, title, tagline, then the day: action row (Play/Continue, or result + View board + Share pills), then byline, difficulty/size and countdown as small lines; after the hero a short hairline break, the streak line, the intro (title, text, picture with the loop, caption) and About.
3. daily.css: no border/fill on hero, day, result, countdown; large serif tagline in full ink; pill buttons; stats entry unboxed on this screen (.daily .stats-entry override); hero fills the first screen (capped) with content centered.
4. strings.ts: intro title/text/caption/alt in EN and NL.
5. Tests: DOM order (tagline -> button -> details; controls before hero; stats/intro after), solved action row, intro media + reduced-motion source, CSS rules (no border/background, tagline size/no opacity, stats unboxed).
6. Verify rendered screens at 320/360/390 phone, 844x390 landscape, 768x1024/820x1180/1024x768 iPad, 1280x900 desktop, both locales; new, solved, before-launch states.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
This depends on SLAY-9.15/9.16/9.17 only by file overlap (StartScreen.tsx/daily.css), not by design -- sequence after those land to avoid rework on markup they touch. Owner also asked (2026-09-29) for a short game-about intro + example-gameplay visual/GIF to be added to this same redesign pass, not a separate story.

Rendered-screen verification (dev server, ?date override, headless Chrome over CDP): new day at 320x640, 360x740, 390x844, 844x390 (landscape phone), 768x1024, 820x1180, 1024x768 (iPad), 1280x900 (desktop), EN and NL; solved day at 320/360/844x390/1280; before-launch at 390. Probe on 390/820/1280 x EN/NL: no element in the hero (or the streak line) draws a border, Play sits 24-28px under the tagline and is on the first screen, no horizontal scroll. Loop animates in Chrome (3 distinct frames over 4 samples); prefers-reduced-motion serves the still. Help and Stats still open from the start screen. Existing drivers drive.ts/stats.ts/locale.ts show the same 16/4/2 failures on main as on this branch (stale expectations from SLAY-9.13/9.15: solving no longer returns to '/', the long UTC date line was removed) -- not caused by this story, worth a follow-up to refresh the drivers.

Review gate (dipsaus-ai:story-reviewer), round 1: verdict pass, all 8 criteria met, no scope violations. Advisories: (1) error/after-schedule states not screenshotted -- after-schedule checked afterwards at 390x844 NL, reads fine unboxed inside the hero; (2) leftover headless Chrome from the crashed stats.ts driver run -- killed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Redid the start screen as Wordle's landing composition. One open hero with no box around it: the icon mark, the title, a large serif tagline in full ink and the Play/Continue pill straight under it (once solved: the result, then View board and Share pills side by side). The byline, difficulty/size and countdown follow as small unboxed lines. Help and the EN/NL switch moved to a quiet top bar. The streak line lost its bordered panel and sits after a hairline break, followed by a new 'What is Slaydoku?' intro (EN/NL) with a looping animated WebP recorded from the real play screen by docs/verification/intro.ts on day #1, which is over. It is ~65 KB, lazy-loaded, and shows a still frame under prefers-reduced-motion. Verified on the rendered screen at 320-1280 widths (phone, landscape phone, iPad, desktop) in both locales; tests cover DOM order, the intro media and the no-border/tagline CSS rules.
<!-- SECTION:FINAL_SUMMARY:END -->
