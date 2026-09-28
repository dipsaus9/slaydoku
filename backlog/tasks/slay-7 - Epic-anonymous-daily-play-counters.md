---
id: SLAY-7
title: 'Epic: anonymous daily play counters'
status: To Do
assignee: []
created_date: '2026-09-28 19:00'
labels:
  - epic
dependencies: []
ordinal: 38000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: the owner can see, per scheduled day, how many people started the puzzle, how many solved it, and the average solve time — anonymous aggregate totals only, no per-player identifier, no cookie, nothing that lets one player be told apart from another. Read via a small CLI script, not a page in the site (keeps 'no accounts' intact — no new player-facing surface). Chosen approach (over a third-party analytics service, and over per-player tracking): a tiny Vercel KV-backed counter behind one serverless endpoint, staying inside the hosting the site already uses, and pure aggregate counts because anything more (returning-player detection, per-session timelines) would need a persistent identifier and directly contradict the About page's existing privacy promise. That promise's wording is updated to stay honest about what is now counted.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A serverless endpoint records a 'start' and a 'solve' event per scheduled day in Vercel KV, incrementing counters and a solve-time sum/count; no request stores anything that identifies who sent it
- [ ] #2 The client fires one 'start' call the first time a player opens today's puzzle and one 'solve' call the first time they solve it, de-duplicated per device per day so a reload never double-counts; a failed or offline request never affects gameplay
- [ ] #3 bun tools/stats.ts <day> prints that day's starts, solves and average solve time, reading the same counters
- [ ] #4 The About page and docs/launch.md's 'Reading the numbers' section are updated to accurately describe the anonymous aggregate counting (no longer 'collects nothing')
<!-- AC:END -->
