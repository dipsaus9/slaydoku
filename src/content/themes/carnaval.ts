import type { SceneTheme } from './types.ts'

/**
 * The Carnaval theme: a stub until its story builds it (docs/themes/seasonal/carnaval.theme.ts is the draft, docs/authoring/add-theme.md the recipe).
 * It registers nothing yet, so `SCENE_THEMES`, `getTheme` and every scheduled day stay as they are. The story replaces `undefined` with
 * the theme built by `themeObject`/`rect` (see simpshouse.ts) and edits no other shared file.
 */
export const CARNAVAL_THEME: SceneTheme | undefined = undefined
