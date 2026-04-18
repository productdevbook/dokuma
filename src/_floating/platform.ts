// 1:1 port of @floating-ui/dom/src/platform.

import { convertOffsetParentRelativeRectToViewportRelativeRect } from "./platform/convert-offset-parent-relative-rect-to-viewport-relative-rect.ts"
import { getClientRects } from "./platform/get-client-rects.ts"
import { getClippingRect } from "./platform/get-clipping-rect.ts"
import { getDimensions } from "./platform/get-dimensions.ts"
import { getDocumentElement } from "./platform/get-document-element.ts"
import { getElementRects } from "./platform/get-element-rects.ts"
import { getOffsetParent } from "./platform/get-offset-parent.ts"
import { getScale } from "./platform/get-scale.ts"
import { isElement } from "./platform/is-element.ts"
import { isRTL } from "./platform/is-rtl.ts"
import type { Platform } from "./types.ts"

export const platform: Platform = {
  convertOffsetParentRelativeRectToViewportRelativeRect,
  getDocumentElement,
  getClippingRect,
  getOffsetParent,
  getElementRects,
  getClientRects,
  getDimensions,
  getScale,
  isElement,
  isRTL,
}
