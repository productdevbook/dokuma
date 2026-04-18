// 1:1 port of @floating-ui/dom/src/utils/isStaticPositioned.

import { getComputedStyle } from "../dom.ts"

export function isStaticPositioned(element: Element): boolean {
  return getComputedStyle(element).position === "static"
}
