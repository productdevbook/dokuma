// 1:1 port of @floating-ui/dom/src/platform/getClientRects.

export function getClientRects(element: Element): Array<DOMRect> {
  return Array.from(element.getClientRects())
}
