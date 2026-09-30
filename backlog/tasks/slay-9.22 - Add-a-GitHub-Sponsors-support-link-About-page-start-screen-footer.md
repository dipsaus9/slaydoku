---
id: SLAY-9.22
title: Add a GitHub Sponsors support link (About page + start screen footer)
status: To Do
assignee: []
created_date: '2026-09-30 06:39'
labels:
  - story
dependencies: []
references:
  - src/ui/daily/StartScreen.tsx
  - src/ui/daily/strings.ts
  - src/ui/about/AboutScreen.tsx
  - src/ui/about/strings.ts
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
- [ ] #1 The start screen's footer shows a 'Support Slaydoku' (or similarly worded) link to https://github.com/sponsors/dipsaus9 next to the existing About link, not inside the primary hero block
- [ ] #2 The About page has a short new section linking to the same URL, in both English and Dutch
- [ ] #3 The link opens in a new tab (rel=noopener, since it leaves the app) and is not styled to look like a primary call-to-action — quiet/secondary, consistent with the About link's own current weight
- [ ] #4 Verified against the actual rendered screen in both locales, per CLAUDE.md's rule
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
If the owner's GitHub Sponsors application hasn't finished review yet when this is delivered, the link still works (GitHub shows the profile/waitlist state appropriately) — no need to wait for approval before shipping this.
<!-- SECTION:NOTES:END -->
