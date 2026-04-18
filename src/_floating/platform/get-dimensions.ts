// 1:1 port of @floating-ui/dom/src/platform/getDimensions.

import type { Dimensions } from "../utils.ts"
import { getCssDimensions } from "./get-css-dimensions.ts"

export function getDimensions(element: Element): Dimensions {
  const { width, height } = getCssDimensions(element)
  return { width, height }
}
