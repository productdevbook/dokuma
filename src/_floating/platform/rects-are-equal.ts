// 1:1 port of @floating-ui/dom/src/utils/rectsAreEqual.

import type { ClientRectObject } from "../utils.ts"

export function rectsAreEqual(a: ClientRectObject, b: ClientRectObject): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height
}
