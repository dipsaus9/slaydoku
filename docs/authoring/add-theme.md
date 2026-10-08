# Add a theme (recipe)

Since SLAY-18.11 a seasonal theme lives in its own files. A theme story edits **only** these, so the stories for fall, carnaval,
christmas and halloween never conflict. The four slots already exist as stubs that register nothing.

| File | What you do |
|---|---|
| `src/content/themes/<id>.ts` | Replace `undefined` in `<ID>_THEME` with the `SceneTheme` (set `seasonal: true`; every object needs `nameNl`, `allowedRoomTypes`; a room may set `floor`, `roomTypes`). Model it on `simpshouse.ts`. |
| `src/content/themes/<id>Rooms.test.ts` (or the theme's own tests) | Rooms test for the new rooms and rules, copied from `rooms.test.ts`. |
| `src/render/icons/themes/<id>Icons.ts` | Register each own drawing with `defineThemeIcons({ id: { sizes, model } })`. Export `<ID>_ICONS` and `<Id>IconId`. |
| `src/render/icons/themes/<id>Art.tsx` | The block models, `(cols, rows) => SolidModel` (see `docs/design/looks.md`, "How to draw a new object"). |
| `docs/themes/seasonal/<id>.theme.ts` and a doc note | The draft stays the reference; update docs for the theme. |

The id types are open: `ThemeIconId` and `THEME_ICON_IDS` grow with the sets. The Dutch names, the Dutch legend, the look-completeness test
(`src/render/looks/completeness.test.tsx`) and the contact sheet all read `SCENE_THEMES`, so they cover the theme once it registers.

Never edit: `src/content/themes/index.ts`, `types.ts`, `src/render/icons/themes/{types,registry,sets,define}.ts`,
`src/render/looks/registry.ts`, `src/render/scene/roomStyles.ts`. If you need a room type or a floor that does not exist, use
`ThemeRoom.floor` (a floor per room name, consulted before the name hints) and the room types already in `RoomType`
(`workshop`, `stable`, `market`, `farm`, `chapel`, `haunted`, `grave` were added for the drafts).

Not part of this recipe: calendar windows (`src/schedule/calendar.ts`, SLAY-18.1), the cast pool, and regenerating schedule days.
