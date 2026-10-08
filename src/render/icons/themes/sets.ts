import { CARNAVAL_ICONS } from './carnavalIcons.ts'
import { CHRISTMAS_ICONS } from './christmasIcons.ts'
import { FALL_ICONS } from './fallIcons.ts'
import { HALLOWEEN_ICONS } from './halloweenIcons.ts'
import type { ThemeIconSet } from './define.ts'

/**
 * The icon sets of the seasonal themes (SLAY-18.11). A seasonal theme story fills its own `<id>Icons.ts` and `<id>Art.tsx`; this list
 * never changes when it does.
 */
export const SEASONAL_ICON_SETS: readonly ThemeIconSet[] = [FALL_ICONS, CARNAVAL_ICONS, CHRISTMAS_ICONS, HALLOWEEN_ICONS]
