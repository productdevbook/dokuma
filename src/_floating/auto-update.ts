// 1:1 port of @floating-ui/dom/src/autoUpdate.

import { getDocumentElement, getOverflowAncestors } from "./dom.ts"
import { getBoundingClientRect } from "./platform/get-bounding-client-rect.ts"
import { rectsAreEqual } from "./platform/rects-are-equal.ts"
import { unwrapElement } from "./platform/unwrap-element.ts"
import type { DomFloatingElement, DomReferenceElement } from "./types.ts"
import { floor, max, min } from "./utils.ts"

export interface AutoUpdateOptions {
  ancestorScroll?: boolean
  ancestorResize?: boolean
  elementResize?: boolean
  layoutShift?: boolean
  animationFrame?: boolean
}

// https://samthor.au/2021/observing-dom/
function observeMove(element: Element, onMove: () => void): () => void {
  let io: IntersectionObserver | null = null
  let timeoutId: ReturnType<typeof setTimeout>

  const root = getDocumentElement(element)

  function cleanup(): void {
    clearTimeout(timeoutId)
    io?.disconnect()
    io = null
  }

  function refresh(skip = false, threshold = 1): void {
    cleanup()

    const elementRectForRootMargin = element.getBoundingClientRect()
    const { left, top, width, height } = elementRectForRootMargin

    if (!skip) onMove()

    if (!width || !height) return

    const insetTop = floor(top)
    const insetRight = floor(root.clientWidth - (left + width))
    const insetBottom = floor(root.clientHeight - (top + height))
    const insetLeft = floor(left)
    const rootMargin = `${-insetTop}px ${-insetRight}px ${-insetBottom}px ${-insetLeft}px`

    const options = {
      rootMargin,
      threshold: max(0, min(1, threshold)) || 1,
    }

    let isFirstUpdate = true

    function handleObserve(entries: IntersectionObserverEntry[]): void {
      const ratio = entries[0].intersectionRatio

      if (ratio !== threshold) {
        if (!isFirstUpdate) return refresh()

        if (!ratio) {
          timeoutId = setTimeout(() => {
            refresh(false, 1e-7)
          }, 1000)
        } else {
          refresh(false, ratio)
        }
      }

      if (
        ratio === 1 &&
        !rectsAreEqual(elementRectForRootMargin, element.getBoundingClientRect())
      ) {
        refresh()
      }

      isFirstUpdate = false
    }

    try {
      io = new IntersectionObserver(handleObserve, {
        ...options,
        root: root.ownerDocument,
      })
    } catch {
      io = new IntersectionObserver(handleObserve, options)
    }

    io.observe(element)
  }

  refresh(true)

  return cleanup
}

export function autoUpdate(
  reference: DomReferenceElement,
  floating: DomFloatingElement | null,
  update: () => void,
  options: AutoUpdateOptions = {},
): () => void {
  const {
    ancestorScroll = true,
    ancestorResize = true,
    elementResize = typeof ResizeObserver === "function",
    layoutShift = typeof IntersectionObserver === "function",
    animationFrame = false,
  } = options

  const referenceEl = unwrapElement(reference)

  const ancestors =
    ancestorScroll || ancestorResize
      ? [
          ...(referenceEl ? getOverflowAncestors(referenceEl) : []),
          ...(floating ? getOverflowAncestors(floating) : []),
        ]
      : []

  for (const ancestor of ancestors) {
    if (ancestorScroll) ancestor.addEventListener("scroll", update, { passive: true })
    if (ancestorResize) ancestor.addEventListener("resize", update)
  }

  const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update) : null

  let reobserveFrame = -1
  let resizeObserver: ResizeObserver | null = null

  if (elementResize) {
    resizeObserver = new ResizeObserver(([firstEntry]) => {
      if (firstEntry && firstEntry.target === referenceEl && resizeObserver && floating) {
        resizeObserver.unobserve(floating)
        cancelAnimationFrame(reobserveFrame)
        reobserveFrame = requestAnimationFrame(() => {
          resizeObserver?.observe(floating)
        })
      }
      update()
    })

    if (referenceEl && !animationFrame) resizeObserver.observe(referenceEl)
    if (floating) resizeObserver.observe(floating)
  }

  let frameId: number
  let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null

  if (animationFrame) frameLoop()

  function frameLoop(): void {
    const nextRefRect = getBoundingClientRect(reference)
    if (prevRefRect && !rectsAreEqual(prevRefRect, nextRefRect)) update()
    prevRefRect = nextRefRect
    frameId = requestAnimationFrame(frameLoop)
  }

  update()

  return () => {
    for (const ancestor of ancestors) {
      if (ancestorScroll) ancestor.removeEventListener("scroll", update)
      if (ancestorResize) ancestor.removeEventListener("resize", update)
    }

    cleanupIo?.()
    resizeObserver?.disconnect()
    resizeObserver = null

    if (animationFrame) cancelAnimationFrame(frameId)
  }
}
