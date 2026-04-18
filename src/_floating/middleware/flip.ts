// 1:1 port of @floating-ui/core/src/middleware/flip.

import type { DetectOverflowOptions } from "../detect-overflow.ts"
import type { Derivable, Middleware } from "../types.ts"
import type { Placement } from "../utils.ts"
import {
  evaluate,
  getAlignmentSides,
  getExpandedPlacements,
  getOppositeAxisPlacements,
  getOppositePlacement,
  getSide,
  getSideAxis,
} from "../utils.ts"

export interface FlipOptions extends DetectOverflowOptions {
  mainAxis?: boolean
  crossAxis?: boolean | "alignment"
  fallbackPlacements?: Array<Placement>
  fallbackStrategy?: "bestFit" | "initialPlacement"
  fallbackAxisSideDirection?: "none" | "start" | "end"
  flipAlignment?: boolean
}

export const flip = (options: FlipOptions | Derivable<FlipOptions> = {}): Middleware => ({
  name: "flip",
  options,
  async fn(state) {
    const { placement, middlewareData, rects, initialPlacement, platform, elements } = state

    const {
      mainAxis: checkMainAxis = true,
      crossAxis: checkCrossAxis = true,
      fallbackPlacements: specifiedFallbackPlacements,
      fallbackStrategy = "bestFit",
      fallbackAxisSideDirection = "none",
      flipAlignment = true,
      ...detectOverflowOptions
    } = evaluate(options, state)

    if (middlewareData.arrow?.alignmentOffset) return {}

    const side = getSide(placement)
    const initialSideAxis = getSideAxis(initialPlacement)
    const isBasePlacement = getSide(initialPlacement) === initialPlacement
    const rtl = await platform.isRTL?.(elements.floating)

    const fallbackPlacements =
      specifiedFallbackPlacements ||
      (isBasePlacement || !flipAlignment
        ? [getOppositePlacement(initialPlacement)]
        : getExpandedPlacements(initialPlacement))

    const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== "none"

    if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) {
      fallbackPlacements.push(
        ...getOppositeAxisPlacements(
          initialPlacement,
          flipAlignment,
          fallbackAxisSideDirection,
          rtl,
        ),
      )
    }

    const placements = [initialPlacement, ...fallbackPlacements]

    const overflow = await platform.detectOverflow(state, detectOverflowOptions)

    const overflows: number[] = []
    let overflowsData = middlewareData.flip?.overflows || []

    if (checkMainAxis) overflows.push(overflow[side])

    if (checkCrossAxis) {
      const sides = getAlignmentSides(placement, rects, rtl)
      overflows.push(overflow[sides[0]], overflow[sides[1]])
    }

    overflowsData = [...overflowsData, { placement, overflows }]

    if (!overflows.every((o) => o <= 0)) {
      const nextIndex = (middlewareData.flip?.index || 0) + 1
      const nextPlacement = placements[nextIndex]

      if (nextPlacement) {
        const ignoreCrossAxisOverflow =
          checkCrossAxis === "alignment" ? initialSideAxis !== getSideAxis(nextPlacement) : false

        if (
          !ignoreCrossAxisOverflow ||
          overflowsData.every((d) =>
            getSideAxis(d.placement) === initialSideAxis ? d.overflows[0] > 0 : true,
          )
        ) {
          return {
            data: { index: nextIndex, overflows: overflowsData },
            reset: { placement: nextPlacement },
          }
        }
      }

      let resetPlacement = overflowsData
        .filter((d) => d.overflows[0] <= 0)
        .sort((a, b) => a.overflows[1] - b.overflows[1])[0]?.placement

      if (!resetPlacement) {
        switch (fallbackStrategy) {
          case "bestFit": {
            const p = overflowsData
              .filter((d) => {
                if (hasFallbackAxisSideDirection) {
                  const currentSideAxis = getSideAxis(d.placement)
                  return currentSideAxis === initialSideAxis || currentSideAxis === "y"
                }
                return true
              })
              .map(
                (d) =>
                  [
                    d.placement,
                    d.overflows.filter((o) => o > 0).reduce((acc, o) => acc + o, 0),
                  ] as const,
              )
              .sort((a, b) => a[1] - b[1])[0]?.[0]
            if (p) resetPlacement = p
            break
          }
          case "initialPlacement":
            resetPlacement = initialPlacement
            break
          default:
        }
      }

      if (placement !== resetPlacement) {
        return { reset: { placement: resetPlacement } }
      }
    }

    return {}
  },
})
