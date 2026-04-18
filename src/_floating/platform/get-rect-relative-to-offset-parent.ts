// 1:1 port of @floating-ui/dom/src/utils/getRectRelativeToOffsetParent.

import {
  getDocumentElement,
  getNodeName,
  getNodeScroll,
  isHTMLElement,
  isOverflowElement,
} from "../dom.ts"
import type { DomVirtualElement } from "../types.ts"
import type { Rect, Strategy } from "../utils.ts"
import { createCoords } from "../utils.ts"
import { getBoundingClientRect } from "./get-bounding-client-rect.ts"
import { getHTMLOffset } from "./get-html-offset.ts"
import { getWindowScrollBarX } from "./get-window-scroll-bar-x.ts"

export function getRectRelativeToOffsetParent(
  element: Element | DomVirtualElement,
  offsetParent: Element | Window,
  strategy: Strategy,
): Rect {
  const isOffsetParentAnElement = isHTMLElement(offsetParent)
  const documentElement = getDocumentElement(offsetParent)
  const isFixed = strategy === "fixed"
  const rect = getBoundingClientRect(element, true, isFixed, offsetParent)

  let scroll = { scrollLeft: 0, scrollTop: 0 }
  const offsets = createCoords(0)

  function setLeftRTLScrollbarOffset(): void {
    offsets.x = getWindowScrollBarX(documentElement)
  }

  if (isOffsetParentAnElement || (!isOffsetParentAnElement && !isFixed)) {
    if (getNodeName(offsetParent) !== "body" || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent)
    }

    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent)
      offsets.x = offsetRect.x + offsetParent.clientLeft
      offsets.y = offsetRect.y + offsetParent.clientTop
    } else if (documentElement) {
      setLeftRTLScrollbarOffset()
    }
  }

  if (isFixed && !isOffsetParentAnElement && documentElement) {
    setLeftRTLScrollbarOffset()
  }

  const htmlOffset =
    documentElement && !isOffsetParentAnElement && !isFixed
      ? getHTMLOffset(documentElement, scroll)
      : createCoords(0)

  const x = rect.left + scroll.scrollLeft - offsets.x - htmlOffset.x
  const y = rect.top + scroll.scrollTop - offsets.y - htmlOffset.y

  return { x, y, width: rect.width, height: rect.height }
}
