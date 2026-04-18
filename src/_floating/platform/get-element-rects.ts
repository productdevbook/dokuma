// 1:1 port of @floating-ui/dom/src/platform/getElementRects.

import type { Platform } from "../types.ts"
import { getOffsetParent } from "./get-offset-parent.ts"
import { getRectRelativeToOffsetParent } from "./get-rect-relative-to-offset-parent.ts"

export const getElementRects: Platform["getElementRects"] = async function (this: Platform, data) {
  const getOffsetParentFn = this.getOffsetParent || getOffsetParent
  const getDimensionsFn = this.getDimensions
  const floatingDimensions = await getDimensionsFn(data.floating)

  return {
    reference: getRectRelativeToOffsetParent(
      data.reference,
      await getOffsetParentFn(data.floating),
      data.strategy,
    ),
    floating: {
      x: 0,
      y: 0,
      width: floatingDimensions.width,
      height: floatingDimensions.height,
    },
  }
}
