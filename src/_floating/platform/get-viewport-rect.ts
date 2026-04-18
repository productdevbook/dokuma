// 1:1 port of @floating-ui/dom/src/utils/getViewportRect.

import { getComputedStyle, getDocumentElement, getWindow, isWebKit } from "../dom.ts"
import type { Rect, Strategy } from "../utils.ts"
import { getWindowScrollBarX } from "./get-window-scroll-bar-x.ts"

const SCROLLBAR_MAX = 25

export function getViewportRect(element: Element, strategy: Strategy): Rect {
  const win = getWindow(element)
  const html = getDocumentElement(element)
  const visualViewport = win.visualViewport

  let width = html.clientWidth
  let height = html.clientHeight
  let x = 0
  let y = 0

  if (visualViewport) {
    width = visualViewport.width
    height = visualViewport.height

    const visualViewportBased = isWebKit()

    if (!visualViewportBased || (visualViewportBased && strategy === "fixed")) {
      x = visualViewport.offsetLeft
      y = visualViewport.offsetTop
    }
  }

  const windowScrollbarX = getWindowScrollBarX(html)
  if (windowScrollbarX <= 0) {
    const doc = html.ownerDocument
    const body = doc.body
    const bodyStyles = getComputedStyle(body)
    const bodyMarginInline =
      doc.compatMode === "CSS1Compat"
        ? Number.parseFloat(bodyStyles.marginLeft) + Number.parseFloat(bodyStyles.marginRight) || 0
        : 0
    const clippingStableScrollbarWidth = Math.abs(
      html.clientWidth - body.clientWidth - bodyMarginInline,
    )

    if (clippingStableScrollbarWidth <= SCROLLBAR_MAX) {
      width -= clippingStableScrollbarWidth
    }
  } else if (windowScrollbarX <= SCROLLBAR_MAX) {
    width += windowScrollbarX
  }

  return { width, height, x, y }
}
