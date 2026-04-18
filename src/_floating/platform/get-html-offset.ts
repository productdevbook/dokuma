// 1:1 port of @floating-ui/dom/src/utils/getHTMLOffset.

import type { NodeScroll } from "../types.ts"
import { getWindowScrollBarX } from "./get-window-scroll-bar-x.ts"

export function getHTMLOffset(
  documentElement: HTMLElement,
  scroll: NodeScroll,
): {
  x: number
  y: number
} {
  const htmlRect = documentElement.getBoundingClientRect()
  const x = htmlRect.left + scroll.scrollLeft - getWindowScrollBarX(documentElement, htmlRect)
  const y = htmlRect.top + scroll.scrollTop
  return { x, y }
}
