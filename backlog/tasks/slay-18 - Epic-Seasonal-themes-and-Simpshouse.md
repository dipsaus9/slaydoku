---
id: SLAY-18
title: 'Epic: Seasonal themes and Simpshouse'
status: Done
assignee: []
created_date: '2026-10-08 09:20'
updated_date: '2026-10-09 08:53'
labels:
  - epic
dependencies: []
ordinal: 124000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add date-driven themes on top of the five regular ones: Simpshouse (a friend-group house with glamour, trading cards and fun things; own cast of 18 names, only on configured dates, 2026-10-14 first and reusable on other dates), Halloween (17-31 October), Carnaval/Oeteldonk (11 November), Christmas (all of December) and Fall (1-16 October, 1-30 November except the 11th). All seasonal rules repeat every year except the Simpshouse date list. Priority when windows overlap: Simpshouse, Carnaval, Christmas, Halloween, Fall, then the normal rotation.

Chosen approach: yearly calendar rules in code plus per-theme cast pools, with a preview gate (rooms, objects, sample levels) the owner approves before each theme is built. It beat hand-picking dates in the schedule file (does not repeat next year, hard-codes Simpshouse) and beat registering the new themes in the normal rotation (that changes the cycle length and so the theme of every already-scheduled day). Guards: seasonal themes stay out of the rotation; a seasonal-cast day stays out of the cast chain, so all other days keep theme and cast byte-for-byte.

Order: Simpshouse is a fast track for 2026-10-14 and does not wait for epic SLAY-17; the other four themes follow SLAY-17.4 (new art look). Halloween 2026 (17-31 October) is expected to be missed this year; the first real Halloween is October 2027.

Owner decisions: Biko is drawn as a monkey (the first named exception to 'avatars are not tied to names'). Real first names of friends go into a public repo: owner to confirm with the friends before go-public (docs/launch.md).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Themes outside their seasonal windows are unchanged for every already-scheduled day, and casts of other days are byte-identical (tests)
- [x] #2 Simpshouse plays on 2026-10-14 with the 18-name cast, never two names with the same first letter
- [x] #3 Fall, Carnaval, Christmas and Halloween each follow the yearly calendar
- [x] #4 The owner approved a preview of every theme before it was built
- [x] #5 Future schedule days in the seasonal windows are regenerated; days up to and including today are byte-identical
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
2026-10-09: SLAY-18.10 (final regeneration) was merged into SLAY-24 and archived; SLAY-24 registers the seasonal themes and regenerates 2026-10-10 through 2027-01-01.

Closed by the orchestrator on the owner explicit instruction (2026-10-09): "Sluit 19 ook na 24. Na 24 mag je dus alles sluiten". Outcome: the seasonal calendar, per-theme cast pool, Simpshouse (monthly on the 1st and 2026-10-14, Romy and Dennis always in, normal sizes) and the four seasonal themes (fall, carnaval, christmas, halloween) are registered and the schedule 2026-10-10 to 2027-01-01 was regenerated once (SLAY-24, which absorbed SLAY-18.10). Criterion 2 changed by owner decision: 2026-10-14 was regenerated in a normal size with the new cast rules; criterion 5: days up to 2026-10-09 are byte-identical, 2026-10-10 on regenerated under the final rules.
<!-- SECTION:NOTES:END -->
