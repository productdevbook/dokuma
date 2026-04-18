// 1:1 port of @floating-ui/core/src/middleware/hide.

import type { DetectOverflowOptions } from "../detect-overflow.ts"
import type { Derivable, Middleware } from "../types.ts"
import type { Rect, SideObject } from "../utils.ts"
import { evaluate, sides } from "../utils.ts"

function getSideOffsets(overflow: SideObject, rect: Rect): SideObject {
  return {
    top: overflow.top - rect.height,
    right: overflow.right - rect.width,
    bottom: overflow.bottom - rect.height,
    left: overflow.left - rect.width,
  }
}

function isAnySideFullyClipped(overflow: SideObject): boolean {
  return sides.some((side) => overflow[side] >= 0)
}

export interface HideOptions extends DetectOverflowOptions {
  strategy?: "referenceHidden" | "escaped"
}

export const hide = (options: HideOptions | Derivable<HideOptions> = {}): Middleware => ({
  name: "hide",
  options,
  async fn(state) {
    const { rects, platform } = state

    const { strategy = "referenceHidden", ...detectOverflowOptions } = evaluate(options, state)

    switch (strategy) {
      case "referenceHidden": {
        const overflow = await platform.detectOverflow(state, {
          ...detectOverflowOptions,
          elementContext: "reference",
        })
        const offsets = getSideOffsets(overflow, rects.reference)
        return {
          data: {
            referenceHiddenOffsets: offsets,
            referenceHidden: isAnySideFullyClipped(offsets),
          },
        }
      }
      case "escaped": {
        const overflow = await platform.detectOverflow(state, {
          ...detectOverflowOptions,
          altBoundary: true,
        })
        const offsets = getSideOffsets(overflow, rects.floating)
        return {
          data: {
            escapedOffsets: offsets,
            escaped: isAnySideFullyClipped(offsets),
          },
        }
      }
      default:
        return {}
    }
  },
})
