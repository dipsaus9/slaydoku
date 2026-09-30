---
id: SLAY-9.22
title: Add a GitHub Sponsors support link (About page + start screen footer)
status: Done
assignee: []
created_date: '2026-09-30 06:39'
updated_date: '2026-09-30 07:17'
labels:
  - story
dependencies: []
references:
  - src/ui/daily/StartScreen.tsx
  - src/ui/daily/strings.ts
  - src/ui/about/AboutScreen.tsx
  - src/ui/about/strings.ts
  - src/ui/about/about.css
  - src/ui/about/about.test.tsx
  - src/ui/daily/daily.css
  - docs/verification/drive.ts
  - docs/verification/locale.ts
parent_task_id: SLAY-9
type: feature
ordinal: 79000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: a quiet 'Support Slaydoku' link to https://github.com/sponsors/dipsaus9 is reachable from both the About page and the start screen, without competing with the primary hero.
Type: deliverable
Branch: SLAY-9.22/github-sponsors-link

Owner decision (2026-09-29): GitHub Sponsors, not Ko-fi/Buy Me a Coffee (doesn't need a separate registered-business Stripe account the way a standalone platform might). URL is predictable and stable: GitHub Sponsors always uses the existing username, so https://github.com/sponsors/dipsaus9 is correct regardless of whether the owner's application has finished GitHub's review yet.

Placement, matching the app's existing quiet-chrome pattern (SLAY-9.18's redesign deliberately de-emphasizes secondary links): the start screen already has a <footer className="daily__footer"> containing only the 'Over Slaydoku'/About link (StartScreen.tsx ~line 252) — add the support link there, not in the primary hero. The About page (AboutScreen.tsx) has existing <section className="about__section"> blocks (how it works, credit, privacy, open-source) — add a new section near 'open-source' (GitHub Sponsors is itself a GitHub/open-source-adjacent feature).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The start screen's footer shows a 'Support Slaydoku' (or similarly worded) link to https://github.com/sponsors/dipsaus9 next to the existing About link, not inside the primary hero block
- [x] #2 The About page has a short new section linking to the same URL, in both English and Dutch
- [x] #3 The link opens in a new tab (rel=noopener, since it leaves the app) and is not styled to look like a primary call-to-action — quiet/secondary, consistent with the About link's own current weight
- [x] #4 Verified against the actual rendered screen in both locales, per CLAUDE.md's rule
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
If the owner's GitHub Sponsors application hasn't finished review yet when this is delivered, the link still works (GitHub shows the profile/waitlist state appropriately) — no need to wait for approval before shipping this.

Implemented: start screen footer link (StartScreen.tsx) + About page section (AboutScreen.tsx), en/nl strings, both new external anchors reuse the .daily__about / new .about__link quiet style (color:inherit). Verified against the actual rendered dev screen (localhost:5173, ?date=2026-10-15) in both locales via Claude in Chrome: footer shows 'About Slaydoku · Support Slaydoku' / 'Over Slaydoku · Steun Slaydoku' at matching weight; About page shows the new Support/Steun section at the same weight as How it works/Credit/Privacy/Open source; clicking the sponsors link opens https://github.com/sponsors/dipsaus9 in a new tab, original tab unaffected (confirms target=_blank + rel=noopener). Updated about.test.tsx (section count 4->5, new link assertions) since AboutScreen.tsx gained a section. Full verify green: lint, typecheck, test --maxWorkers=1 (3054 passed), build.

Round 2 review blocked on AC4 (rendered-screen check not evidenced durably in the diff, only claimed in these notes). Fixed by adding real assertions to the project's own headless-Chrome verification drivers (docs/verification/drive.ts English suite, docs/verification/locale.ts Dutch suite) that check the footer's Support link and the About page's Support section against the live rendered DOM: text, href, target=_blank, rel=noopener, and that both reuse the About link's own class (daily__about / about__link) rather than a button class. drive.ts's pre-existing hardcoded about__section count (4) is bumped to 5. Ran both drivers against a real production build + vite preview + headless Chrome: locale.ts 33/33 checks pass (includes English baseline footer + Dutch-switched footer + Dutch About Support section), drive.ts 230/230 checks pass (English footer + About Support section, iPad viewports). Widened References twice: first for the co-located about.css/about.test.tsx/daily.css (round-1 scope block), then for docs/verification/drive.ts and docs/verification/locale.ts (this round's fix).

Independent review (round 3/3): verdict PASS. All 4 acceptance criteria met, no scope violations, no findings. Reviewer additionally ran typecheck and the about.test.tsx suite independently and confirmed green.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a quiet 'Support Slaydoku' link to https://github.com/sponsors/dipsaus9 in the start screen's existing footer (next to the About link, same class/weight, opens in a new tab with rel=noopener noreferrer) and as a short new About-page section near Open source, in both English and Dutch. Verified against the real rendered app (production build + headless Chrome) via the project's docs/verification/drive.ts and docs/verification/locale.ts drivers, both extended with assertions for the new link/section and both passing in full (230/230 and 33/33 checks). Independent review passed on round 3 after two rounds of scope widening (co-located about.css/about.test.tsx/daily.css, then the two verification drivers).
<!-- SECTION:FINAL_SUMMARY:END -->
