// 1:1 port of @floating-ui/dom/src/utils/getWindowScrollBarX.

import { getDocumentElement, getNodeScroll } from "../dom.ts"
import { getBoundingClientRect } from "./get-bounding-client-rect.ts"

export function getWindowScrollBarX(element: Element, rect?: DOMRect): number {
  const leftScroll = getNodeScroll(element).scrollLeft

  if (!rect) {
    return getBoundingClientRect(getDocumentElement(element)).left + leftScroll
  }

  return rect.left + leftScroll
}
