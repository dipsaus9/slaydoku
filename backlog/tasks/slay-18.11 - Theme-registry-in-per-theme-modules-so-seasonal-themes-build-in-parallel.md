---
id: SLAY-18.11
title: 'Theme registry in per-theme modules, so seasonal themes build in parallel'
status: Done
assignee: []
created_date: '2026-10-08 14:14'
updated_date: '2026-10-08 18:09'
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
- [x] #1 src/content/themes/index.ts lists stub modules fall.ts, carnaval.ts, christmas.ts and halloween.ts; a stub registers nothing; adding a theme later means editing only its own module files
- [x] #2 src/render/icons/themes/ merges per-theme icon maps from <id>Art.tsx and <id>Icons.ts (stubs for the four themes); ThemeIconId no longer needs editing per theme
- [x] #3 With the stubs present themeOf gives the same theme for every committed schedule day and the schedule files are untouched (test)
- [x] #4 The look-completeness test from SLAY-17.4 still passes and also covers a theme module once it registers
- [x] #5 docs/authoring has a short 'add a theme' recipe naming exactly which files a theme story touches
- [x] #6 bun run lint, typecheck and test --maxWorkers=1 pass
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Content: stub modules fall/carnaval/christmas/halloween.ts each export <ID>_THEME: SceneTheme | undefined (undefined now); index.ts lists them through registered(...) so a stub adds nothing; RoomType gains the seven draft room types (workshop, stable, market, farm, chapel, haunted, grave) and ThemeRoom an optional floor so a theme never edits roomStyles NAME_HINTS; roomFloorOf(name) is consulted by resolveRoomStyles before the name hints. 2. Icons: define.ts with defineThemeIcons({ id: { sizes, model } }) building one ThemeIconSet (ids, footprint definitions, model builders); <id>Icons.ts stubs export <ID>_ICONS and <Id>IconId; <id>Art.tsx stubs hold the block models; types.ts derives ThemeIconId = core ids | per-theme ids and THEME_ICON_IDS from the sets; icons/themes/registry.ts and looks/registry.ts spread the sets' definitions and models over the core tables. 3. Tests: themes.test.ts no longer pins the exact theme list (five rotation + simpshouse required, everything else seasonal); icon tests check unique ids across sets and that each set lands in both registries; calendar.test.ts asserts themeOf equals the committed theme for every day; room floor test. 4. Docs: docs/authoring/add-theme.md recipe; pointers from theme-and-icons.md, README.md, looks.md, room-rules.md, handoff.md. Behaviour unchanged: schedule files byte-identical.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Keep the change small and mechanical. Bun and Vite both import these modules (tools/schedule.ts runs under bun), so do not use import.meta.glob.

Review: pass (2 advisory: extra RoomType/ThemeRoom.floor, rooms test file in recipe).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Seasonal themes now live in per-theme modules: stub fall/carnaval/christmas/halloween theme files merged by registered(), per-theme <id>Icons.ts/<id>Art.tsx icon sets merged by sets.ts into the icon and block-model registries with an open ThemeIconId, ThemeRoom.floor and seven new room types, tests, and docs/authoring/add-theme.md. Schedule untouched.
<!-- SECTION:FINAL_SUMMARY:END -->
