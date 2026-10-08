---
id: SLAY-18.11
title: 'Theme registry in per-theme modules, so seasonal themes build in parallel'
status: To Do
assignee: []
created_date: '2026-10-08 14:14'
updated_date: '2026-10-08 14:17'
labels:
  - story
dependencies:
  - SLAY-17.4
references:
  - src/content/themes/index.ts
  - src/content/themes/fall.ts
  - src/content/themes/carnaval.ts
  - src/content/themes/christmas.ts
  - src/content/themes/halloween.ts
  - src/render/icons/themes/registry.ts
  - src/render/icons/themes/types.ts
  - src/render/icons/themes/index.ts
  - src/render/icons/themes/fallArt.tsx
  - src/render/icons/themes/fallIcons.ts
  - src/render/icons/themes/carnavalArt.tsx
  - src/render/icons/themes/carnavalIcons.ts
  - src/render/icons/themes/christmasArt.tsx
  - src/render/icons/themes/christmasIcons.ts
  - src/render/icons/themes/halloweenArt.tsx
  - src/render/icons/themes/halloweenIcons.ts
  - docs/authoring/add-theme.md
parent_task_id: SLAY-18
type: chore
ordinal: 139000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Outcome: adding a seasonal theme no longer edits shared files. src/content/themes/index.ts already lists the four remaining seasonal theme modules (fall, carnaval, christmas, halloween), each a stub module that exports no theme yet; each theme's icons register from its own files (src/render/icons/themes/<id>Art.tsx and <id>Icons.ts) that a shared registry merges, with the icon id type open for new ids. Fall, carnaval, christmas and halloween can then be built by four workers at the same time. Behaviour must not change: no stub registers a theme, so themeOf and every scheduled day stay as they are.
Type: deliverable
Branch: SLAY-18.11/theme-registry-modules
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/content/themes/index.ts lists stub modules fall.ts, carnaval.ts, christmas.ts and halloween.ts; a stub registers nothing; adding a theme later means editing only its own module files
- [ ] #2 src/render/icons/themes/ merges per-theme icon maps from <id>Art.tsx and <id>Icons.ts (stubs for the four themes); ThemeIconId no longer needs editing per theme
- [ ] #3 With the stubs present themeOf gives the same theme for every committed schedule day and the schedule files are untouched (test)
- [ ] #4 The look-completeness test from SLAY-17.4 still passes and also covers a theme module once it registers
- [ ] #5 docs/authoring has a short 'add a theme' recipe naming exactly which files a theme story touches
- [ ] #6 bun run lint, typecheck and test --maxWorkers=1 pass
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Keep the change small and mechanical. Bun and Vite both import these modules (tools/schedule.ts runs under bun), so do not use import.meta.glob.
<!-- SECTION:NOTES:END -->
