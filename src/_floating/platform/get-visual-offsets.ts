// 1:1 port of @floating-ui/dom/src/utils/getVisualOffsets.

import { getWindow, isWebKit } from "../dom.ts"
import type { Coords } from "../utils.ts"
import { createCoords } from "../utils.ts"

const noOffsets = createCoords(0)

export function getVisualOffsets(element: Element | undefined): Coords {
  const win = getWindow(element)

  if (!isWebKit() || !win.visualViewport) return noOffsets

  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop,
  }
}

export function shouldAddVisualOffsets(
  element: Element | undefined,
  isFixed = false,
  floatingOffsetParent?: Element | Window | undefined,
): boolean {
  if (!floatingOffsetParent || (isFixed && floatingOffsetParent !== getWindow(element))) {
    return false
  }
  return isFixed
}
