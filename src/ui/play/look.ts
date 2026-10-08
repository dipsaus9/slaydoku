import { useCallback, useState } from 'react'
import { defaultStorage, readLook, writeLook, type StorageLike } from '../../locale/index.ts'
import { DEFAULT_LOOK, lookSwitchAvailable, type Look } from '../../render/looks/look.ts'

/**
 * The chosen object look (SLAY-17.8 preview), kept on the device like the language. The look only counts where the switch is allowed
 * (dev, localhost, preview hosts): anywhere else the look is 'now' whatever is stored, so production players can never end up in a
 * look they cannot switch out of. `storage` follows PlayScreen: undefined is localStorage, null keeps it in memory only.
 */
export function useLook(
  storage: StorageLike | null | undefined,
  available: boolean = lookSwitchAvailable(),
): { look: Look; setLook: (look: Look) => void; available: boolean } {
  const resolved = storage === undefined ? defaultStorage() : storage
  const [chosen, setChosen] = useState<Look>(() => readLook(resolved) ?? DEFAULT_LOOK)
  const setLook = useCallback(
    (next: Look) => {
      setChosen(next)
      writeLook(resolved, next)
    },
    [resolved],
  )
  return { look: available ? chosen : DEFAULT_LOOK, setLook, available }
}
