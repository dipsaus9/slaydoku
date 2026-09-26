import type { ComponentType } from 'react'
import { ProceduralAvatar } from '../procedural/ProceduralAvatar.tsx'
import type { ProceduralTraits } from '../procedural/traits.ts'
import type { AvatarProps } from './parts.tsx'

/** A portrait component for one fixed cast member: the procedural bust with hand-picked traits. */
export function neutralAvatar(name: string, traits: ProceduralTraits): ComponentType<AvatarProps> {
  function NeutralAvatar(props: AvatarProps) {
    return <ProceduralAvatar traits={traits} title={name} {...props} />
  }
  NeutralAvatar.displayName = `${name}Avatar`
  return NeutralAvatar
}
