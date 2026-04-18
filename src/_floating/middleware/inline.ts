// 1:1 port of @floating-ui/core/src/middleware/inline.

import type { Derivable, Middleware } from "../types.ts"
import type { ClientRectObject, Padding } from "../utils.ts"
import {
  evaluate,
  getPaddingObject,
  getSide,
  getSideAxis,
  max,
  min,
  rectToClientRect,
} from "../utils.ts"

function getBoundingRect(rects: Array<ClientRectObject>): {
  x: number
  y: number
  width: number
  height: number
} {
  const minX = min(...rects.map((rect) => rect.left))
  const minY = min(...rects.map((rect) => rect.top))
  const maxX = max(...rects.map((rect) => rect.right))
  const maxY = max(...rects.map((rect) => rect.bottom))
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

export function getRectsByLine(rects: Array<ClientRectObject>): Array<ClientRectObject> {
  const sortedRects = rects.slice().sort((a, b) => a.y - b.y)
  const groups: ClientRectObject[][] = []
  let prevRect: ClientRectObject | null = null
  for (let i = 0; i < sortedRects.length; i++) {
    const rect = sortedRects[i]
    if (!prevRect || rect.y - prevRect.y > prevRect.height / 2) {
      groups.push([rect])
    } else {
      groups[groups.length - 1].push(rect)
    }
    prevRect = rect
  }
  return groups.map((rect) => rectToClientRect(getBoundingRect(rect)))
}

export interface InlineOptions {
  x?: number
  y?: number
  padding?: Padding
}

export const inline = (options: InlineOptions | Derivable<InlineOptions> = {}): Middleware => ({
  name: "inline",
  options,
  async fn(state) {
    const { placement, elements, rects, platform, strategy } = state
    const { padding = 2, x, y } = evaluate(options, state)

    const nativeClientRects = Array.from(
      (await platform.getClientRects?.(elements.reference)) || [],
    )

    const clientRects = getRectsByLine(nativeClientRects)
    const fallback = rectToClientRect(getBoundingRect(nativeClientRects))
    const paddingObject = getPaddingObject(padding)

    function getBoundingClientRect(): ClientRectObject {
      if (
        clientRects.length === 2 &&
        clientRects[0].left > clientRects[1].right &&
        x != null &&
        y != null
      ) {
        return (
          clientRects.find(
            (rect) =>
              x > rect.left - paddingObject.left &&
              x < rect.right + paddingObject.right &&
              y > rect.top - paddingObject.top &&
              y < rect.bottom + paddingObject.bottom,
          ) || fallback
        )
      }

      if (clientRects.length >= 2) {
        if (getSideAxis(placement) === "y") {
          const firstRect = clientRects[0]
          const lastRect = clientRects[clientRects.length - 1]
          const isTop = getSide(placement) === "top"

          const top = firstRect.top
          const bottom = lastRect.bottom
          const left = isTop ? firstRect.left : lastRect.left
          const right = isTop ? firstRect.right : lastRect.right
          const width = right - left
          const height = bottom - top

          return { top, bottom, left, right, width, height, x: left, y: top }
        }

        const isLeftSide = getSide(placement) === "left"
        const maxRight = max(...clientRects.map((rect) => rect.right))
        const minLeft = min(...clientRects.map((rect) => rect.left))
        const measureRects = clientRects.filter((rect) =>
          isLeftSide ? rect.left === minLeft : rect.right === maxRight,
        )

        const top = measureRects[0].top
        const bottom = measureRects[measureRects.length - 1].bottom
        const left = minLeft
        const right = maxRight
        const width = right - left
        const height = bottom - top

        return { top, bottom, left, right, width, height, x: left, y: top }
      }

      return fallback
    }

    const resetRects = await platform.getElementRects({
      reference: { getBoundingClientRect },
      floating: elements.floating,
      strategy,
    })

    if (
      rects.reference.x !== resetRects.reference.x ||
      rects.reference.y !== resetRects.reference.y ||
      rects.reference.width !== resetRects.reference.width ||
      rects.reference.height !== resetRects.reference.height
    ) {
      return { reset: { rects: resetRects } }
    }

    return {}
  },
})
