// 1:1 port of @floating-ui/dom/src/platform/isRTL.

import { getComputedStyle } from "../dom.ts"

export function isRTL(element: Element): boolean {
  return getComputedStyle(element).direction === "rtl"
}
