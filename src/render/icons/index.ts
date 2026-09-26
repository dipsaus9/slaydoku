export { EdgeFeatureIcon, type EdgeFeatureIconProps } from './EdgeFeatureIcon.tsx'
export { ObjectIcon, ObjectIconGlyph, type ObjectIconProps, type ObjectIconSvgProps } from './ObjectIcon.tsx'
export {
  ORIENTATIONS,
  ROTATIONS,
  orientCells,
  type Orientation,
  type Rotation,
} from './orientation.ts'
export { ICON_DEFINITIONS, type IconDefinition, type IconVariant } from './registry.tsx'
export {
  hasIcon,
  iconFootprints,
  resolveIcon,
  resolveVariant,
  type OrientationPreference,
  type ResolvedIcon,
} from './resolve.ts'
export {
  iconLegendGroups,
  isOccupiableIconType,
  type IconObjectType,
} from './types.ts'
export { SceneObjectIcons, type SceneObjectIconsProps } from './SceneObjectIcons.tsx'
export * from './themes/index.ts'
