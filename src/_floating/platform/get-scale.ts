// 1:1 port of @floating-ui/dom/src/platform/getScale.

import { isHTMLElement } from "../dom.ts"
import type { DomVirtualElement } from "../types.ts"
import type { Coords } from "../utils.ts"
import { createCoords, round } from "../utils.ts"
import { getCssDimensions } from "./get-css-dimensions.ts"
import { unwrapElement } from "./unwrap-element.ts"

export function getScale(element: Element | DomVirtualElement): Coords {
  const domElement = unwrapElement(element)

  if (!isHTMLElement(domElement)) return createCoords(1)

  const rect = domElement.getBoundingClientRect()
  const { width, height, $ } = getCssDimensions(domElement)
  let x = ($ ? round(rect.width) : rect.width) / width
  let y = ($ ? round(rect.height) : rect.height) / height

  if (!x || !Number.isFinite(x)) x = 1
  if (!y || !Number.isFinite(y)) y = 1

  return { x, y }
}
