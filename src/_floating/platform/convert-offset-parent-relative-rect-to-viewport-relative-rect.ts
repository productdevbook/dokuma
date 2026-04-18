// 1:1 port of @floating-ui/dom/src/platform/convertOffsetParentRelativeRectToViewportRelativeRect.

import {
  getDocumentElement,
  getNodeName,
  getNodeScroll,
  isHTMLElement,
  isOverflowElement,
  isTopLayer,
} from "../dom.ts"
import type { Elements } from "../types.ts"
import type { Rect, Strategy } from "../utils.ts"
import { createCoords } from "../utils.ts"
import { getBoundingClientRect } from "./get-bounding-client-rect.ts"
import { getHTMLOffset } from "./get-html-offset.ts"
import { getScale } from "./get-scale.ts"

export function convertOffsetParentRelativeRectToViewportRelativeRect({
  elements,
  rect,
  offsetParent,
  strategy,
}: {
  elements?: Elements
  rect: Rect
  offsetParent: Element | Window
  strategy: Strategy
}): Rect {
  const isFixed = strategy === "fixed"
  const documentElement = getDocumentElement(offsetParent)
  const topLayer = elements ? isTopLayer(elements.floating) : false

  if (offsetParent === documentElement || (topLayer && isFixed)) return rect

  let scroll = { scrollLeft: 0, scrollTop: 0 }
  let scale = createCoords(1)
  const offsets = createCoords(0)
  const isOffsetParentAnElement = isHTMLElement(offsetParent)

  if (isOffsetParentAnElement || (!isOffsetParentAnElement && !isFixed)) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent)
    }

    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent)
      scale = getScale(offsetParent)
      offsets.x = offsetRect.x + offsetParent.clientLeft
      offsets.y = offsetRect.y + offsetParent.clientTop
    }
  }

  const htmlOffset =
    documentElement && !isOffsetParentAnElement && !isFixed
      ? getHTMLOffset(documentElement, scroll)
      : createCoords(0)

  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x + htmlOffset.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y + htmlOffset.y,
  }
}
