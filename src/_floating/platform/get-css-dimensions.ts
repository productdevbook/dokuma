// 1:1 port of @floating-ui/dom/src/utils/getCssDimensions.

import { getComputedStyle, isHTMLElement } from "../dom.ts"
import type { Dimensions } from "../utils.ts"
import { round } from "../utils.ts"

export function getCssDimensions(element: Element): Dimensions & { $: boolean } {
  const css = getComputedStyle(element)
  let width = Number.parseFloat(css.width) || 0
  let height = Number.parseFloat(css.height) || 0
  const hasOffset = isHTMLElement(element)
  const offsetWidth = hasOffset ? element.offsetWidth : width
  const offsetHeight = hasOffset ? element.offsetHeight : height
  const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight

  if (shouldFallback) {
    width = offsetWidth
    height = offsetHeight
  }

  return { width, height, $: shouldFallback }
}
