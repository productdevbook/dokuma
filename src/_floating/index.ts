// Dokuma floating: 1:1 port of floating-ui (core + dom) with zero dependencies.
// Public entry — what consumers import from "./_floating/index.ts".

import { computePosition as computePositionCore } from "./compute-position.ts"
import { platform as defaultPlatform } from "./platform.ts"
import type { ComputePositionConfig, DomFloatingElement, DomReferenceElement } from "./types.ts"

export { autoUpdate } from "./auto-update.ts"
export type { AutoUpdateOptions } from "./auto-update.ts"
export { createFloating } from "./create-floating.ts"
export type { CreateFloatingOptions, Floating } from "./create-floating.ts"
export { computeCoordsFromPlacement } from "./compute-coords-from-placement.ts"
export { detectOverflow } from "./detect-overflow.ts"
export type { DetectOverflowOptions } from "./detect-overflow.ts"
export { arrow } from "./middleware/arrow.ts"
export type { ArrowOptions } from "./middleware/arrow.ts"
export { autoPlacement } from "./middleware/auto-placement.ts"
export type { AutoPlacementOptions } from "./middleware/auto-placement.ts"
export { flip } from "./middleware/flip.ts"
export type { FlipOptions } from "./middleware/flip.ts"
export { hide } from "./middleware/hide.ts"
export type { HideOptions } from "./middleware/hide.ts"
export { inline } from "./middleware/inline.ts"
export type { InlineOptions } from "./middleware/inline.ts"
export { offset } from "./middleware/offset.ts"
export type { OffsetOptions } from "./middleware/offset.ts"
export { limitShift, shift } from "./middleware/shift.ts"
export type { LimitShiftOptions, ShiftOptions } from "./middleware/shift.ts"
export { size } from "./middleware/size.ts"
export type { SizeOptions } from "./middleware/size.ts"
export { platform } from "./platform.ts"
export type {
  Boundary,
  ComputePosition,
  ComputePositionConfig,
  ComputePositionReturn,
  Derivable,
  DomBoundary,
  DomFloatingElement,
  DomReferenceElement,
  DomVirtualElement,
  ElementContext,
  Elements,
  FloatingElement,
  Middleware,
  MiddlewareArguments,
  MiddlewareData,
  MiddlewareReturn,
  MiddlewareState,
  NodeScroll,
  Platform,
  ReferenceElement,
  RootBoundary,
  VirtualElement,
} from "./types.ts"
export type {
  AlignedPlacement,
  Alignment,
  Axis,
  ClientRectObject,
  Coords,
  Dimensions,
  ElementRects,
  Length,
  Padding,
  Placement,
  Rect,
  Side,
  SideObject,
  Strategy,
} from "./utils.ts"
export { rectToClientRect } from "./utils.ts"
export { getOverflowAncestors } from "./dom.ts"

/**
 * Computes the `x` and `y` coordinates that will place the floating element
 * next to a given reference element (DOM-bound; pre-wires default platform).
 */
export function computePosition(
  reference: DomReferenceElement,
  floating: DomFloatingElement,
  options?: Partial<ComputePositionConfig>,
): ReturnType<typeof computePositionCore> {
  const cache = new Map<Element, Array<Element>>()
  const mergedOptions = { platform: defaultPlatform, ...options }
  const platformWithCache = { ...mergedOptions.platform, _c: cache }
  return computePositionCore(reference, floating, {
    ...mergedOptions,
    platform: platformWithCache,
  })
}
