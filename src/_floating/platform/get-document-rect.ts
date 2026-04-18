// 1:1 port of @floating-ui/dom/src/utils/getDocumentRect.

import { getComputedStyle, getDocumentElement, getNodeScroll } from "../dom.ts"
import type { Rect } from "../utils.ts"
import { max } from "../utils.ts"
import { getWindowScrollBarX } from "./get-window-scroll-bar-x.ts"

export function getDocumentRect(element: HTMLElement): Rect {
  const html = getDocumentElement(element)
  const scroll = getNodeScroll(element)
  const body = element.ownerDocument.body

  const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth)
  const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight)

  let x = -scroll.scrollLeft + getWindowScrollBarX(element)
  const y = -scroll.scrollTop

  if (getComputedStyle(body).direction === "rtl") {
    x += max(html.clientWidth, body.clientWidth) - width
  }

  return { width, height, x, y }
}
