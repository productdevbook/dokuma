// 1:1 port of @floating-ui/dom/src/utils/unwrapElement.

import { isElement } from "../dom.ts"
import type { DomVirtualElement } from "../types.ts"

export function unwrapElement(element: Element | DomVirtualElement): Element | undefined {
  return !isElement(element) ? element.contextElement : element
}
