import { on } from "../_dom.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export type ScrollAxis = "x" | "y"
export type ScrollAreaType = "auto" | "always" | "scroll" | "hover"

export interface ScrollAreaOptions {
  /**
   * Default `"hover"`.
   * - `auto`: native overflow-auto behavior
   * - `always`: scrollbars always visible
   * - `scroll`: visible while scrolling, hide after idle
   * - `hover`: visible while hovering the root, hide when pointer leaves
   */
  type?: ScrollAreaType
  /** Ms to wait after last scroll before hiding scrollbars. Default `600`. */
  scrollHideDelay?: number
}

export interface ScrollAreaRootProps {
  "data-scroll-area": ""
  "data-type": ScrollAreaType
}

export interface ScrollAreaViewportProps {
  "data-scroll-area-viewport": ""
  style: {
    overflow: "auto"
    /** Hide native scrollbars (consumer still sees them unless styled out). */
    scrollbarWidth: "none"
  }
}

export interface ScrollAreaScrollbarProps {
  "aria-orientation": "horizontal" | "vertical"
  "data-orientation": "horizontal" | "vertical"
  "data-state": "visible" | "hidden"
  "data-scrollable": "true" | "false"
}

export interface ScrollAreaThumbProps {
  "data-state": "visible" | "hidden"
  style: { transform: string; "--dokuma-sa-thumb-size": string }
}

export interface ScrollAreaState {
  /** Thumb size as 0..1 of track. */
  ratio: number
  /** Scroll position as 0..1. */
  position: number
  /** Content requires scrolling (has overflow) on this axis. */
  scrollable: boolean
  /** Scrollbar visible right now. */
  visible: boolean
}

export interface ScrollArea {
  x: Signal<ScrollAreaState>
  y: Signal<ScrollAreaState>
  getRootProps: () => ScrollAreaRootProps
  getViewportProps: () => ScrollAreaViewportProps
  getScrollbarProps: (axis: ScrollAxis) => ScrollAreaScrollbarProps
  getThumbProps: (axis: ScrollAxis) => ScrollAreaThumbProps
  /** Attach viewport + optional scrollbar/thumb refs. Returns cleanup. */
  mount: (els: {
    root: HTMLElement
    viewport: HTMLElement
    xScrollbar?: HTMLElement
    xThumb?: HTMLElement
    yScrollbar?: HTMLElement
    yThumb?: HTMLElement
  }) => Unsubscribe
}

const initialState: ScrollAreaState = {
  ratio: 0,
  position: 0,
  scrollable: false,
  visible: false,
}

export function createScrollArea(options: ScrollAreaOptions = {}): ScrollArea {
  const type: ScrollAreaType = options.type ?? "hover"
  const scrollHideDelay = options.scrollHideDelay ?? 600

  const x = createSignal<ScrollAreaState>({ ...initialState })
  const y = createSignal<ScrollAreaState>({ ...initialState })

  const getRootProps = (): ScrollAreaRootProps => ({
    "data-scroll-area": "",
    "data-type": type,
  })

  const getViewportProps = (): ScrollAreaViewportProps => ({
    "data-scroll-area-viewport": "",
    style: { overflow: "auto", scrollbarWidth: "none" },
  })

  const getScrollbarProps = (axis: ScrollAxis): ScrollAreaScrollbarProps => {
    const st = axis === "x" ? x.get() : y.get()
    const orientation = axis === "x" ? "horizontal" : "vertical"
    return {
      "aria-orientation": orientation,
      "data-orientation": orientation,
      "data-state": st.visible ? "visible" : "hidden",
      "data-scrollable": st.scrollable ? "true" : "false",
    }
  }

  const getThumbProps = (axis: ScrollAxis): ScrollAreaThumbProps => {
    const st = axis === "x" ? x.get() : y.get()
    const size = Math.max(0, Math.min(1, st.ratio)) * 100
    const translate =
      axis === "x"
        ? `translate3d(${Math.round(st.position * 10000) / 100}%, 0, 0)`
        : `translate3d(0, ${Math.round(st.position * 10000) / 100}%, 0)`
    return {
      "data-state": st.visible ? "visible" : "hidden",
      style: { transform: translate, "--dokuma-sa-thumb-size": `${size}%` },
    }
  }

  const mount: ScrollArea["mount"] = (els) => {
    const { root, viewport } = els
    viewport.style.overflow = "auto"
    // Hide native scrollbars — let custom thumbs show instead.
    ;(viewport.style as CSSStyleDeclaration & { scrollbarWidth: string }).scrollbarWidth = "none"

    let hideTimer: ReturnType<typeof setTimeout> | null = null

    const visibilityFor = (scrollable: boolean): boolean => {
      if (!scrollable) return false
      if (type === "always") return true
      // For auto/scroll/hover we toggle visibility via events; default to visible when measuring.
      return true
    }

    const measure = (): void => {
      const { scrollWidth, clientWidth, scrollLeft, scrollHeight, clientHeight, scrollTop } =
        viewport

      const xScrollable = scrollWidth > clientWidth + 1
      const yScrollable = scrollHeight > clientHeight + 1

      const xRatio = xScrollable ? clientWidth / scrollWidth : 0
      const yRatio = yScrollable ? clientHeight / scrollHeight : 0

      const xPosition = xScrollable ? scrollLeft / (scrollWidth - clientWidth) : 0
      const yPosition = yScrollable ? scrollTop / (scrollHeight - clientHeight) : 0

      x.set({
        ratio: xRatio,
        position: xPosition,
        scrollable: xScrollable,
        visible: visibilityFor(xScrollable) && (type !== "hover" || x.get().visible),
      })
      y.set({
        ratio: yRatio,
        position: yPosition,
        scrollable: yScrollable,
        visible: visibilityFor(yScrollable) && (type !== "hover" || y.get().visible),
      })
    }

    const showTransient = (): void => {
      if (type === "always" || type === "auto") return
      x.set({ ...x.get(), visible: x.get().scrollable })
      y.set({ ...y.get(), visible: y.get().scrollable })
      if (type === "scroll") {
        if (hideTimer) clearTimeout(hideTimer)
        hideTimer = setTimeout(() => {
          hideTimer = null
          x.set({ ...x.get(), visible: false })
          y.set({ ...y.get(), visible: false })
        }, scrollHideDelay)
      }
    }

    const offScroll = on(viewport, "scroll", () => {
      measure()
      showTransient()
    })

    let resizeObs: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      resizeObs = new ResizeObserver(measure)
      resizeObs.observe(viewport)
      for (const child of Array.from(viewport.children)) resizeObs.observe(child)
    }

    // hover behavior
    let offRootEnter: (() => void) | null = null
    let offRootLeave: (() => void) | null = null
    if (type === "hover") {
      offRootEnter = on(root, "pointerenter", () => {
        x.set({ ...x.get(), visible: x.get().scrollable })
        y.set({ ...y.get(), visible: y.get().scrollable })
      })
      offRootLeave = on(root, "pointerleave", () => {
        x.set({ ...x.get(), visible: false })
        y.set({ ...y.get(), visible: false })
      })
    }

    // thumb drag-to-scroll ---
    const bindThumbDrag = (
      axis: ScrollAxis,
      thumb: HTMLElement | undefined,
      scrollbar: HTMLElement | undefined,
    ): (() => void) => {
      if (!thumb || !scrollbar) return () => {}
      let dragging = false
      let startClient = 0
      let startScroll = 0
      const onPointerDown = (event: PointerEvent): void => {
        dragging = true
        thumb.setPointerCapture(event.pointerId)
        startClient = axis === "x" ? event.clientX : event.clientY
        startScroll = axis === "x" ? viewport.scrollLeft : viewport.scrollTop
        event.preventDefault()
      }
      const onPointerMove = (event: PointerEvent): void => {
        if (!dragging) return
        const trackSize = axis === "x" ? scrollbar.clientWidth : scrollbar.clientHeight
        const contentExtra =
          axis === "x"
            ? viewport.scrollWidth - viewport.clientWidth
            : viewport.scrollHeight - viewport.clientHeight
        if (contentExtra <= 0 || trackSize <= 0) return
        const delta = (axis === "x" ? event.clientX : event.clientY) - startClient
        const viewportSize = axis === "x" ? viewport.clientWidth : viewport.clientHeight
        const thumbSize = axis === "x" ? thumb.clientWidth : thumb.clientHeight
        const maxThumbTravel = Math.max(0, trackSize - thumbSize)
        if (maxThumbTravel <= 0) return
        const scrollDelta = (delta / maxThumbTravel) * contentExtra
        const nextScroll = startScroll + scrollDelta
        if (axis === "x") viewport.scrollLeft = nextScroll
        else viewport.scrollTop = nextScroll
      }
      const onPointerUp = (event: PointerEvent): void => {
        dragging = false
        try {
          thumb.releasePointerCapture(event.pointerId)
        } catch {}
      }
      thumb.addEventListener("pointerdown", onPointerDown)
      thumb.addEventListener("pointermove", onPointerMove)
      thumb.addEventListener("pointerup", onPointerUp)
      thumb.addEventListener("pointercancel", onPointerUp)
      return () => {
        thumb.removeEventListener("pointerdown", onPointerDown)
        thumb.removeEventListener("pointermove", onPointerMove)
        thumb.removeEventListener("pointerup", onPointerUp)
        thumb.removeEventListener("pointercancel", onPointerUp)
      }
    }

    const offXDrag = bindThumbDrag("x", els.xThumb, els.xScrollbar)
    const offYDrag = bindThumbDrag("y", els.yThumb, els.yScrollbar)

    // Initial measurement + thumb application.
    const applyThumbs = (): void => {
      if (els.xThumb) {
        const st = x.get()
        const size = Math.max(0, Math.min(1, st.ratio)) * 100
        els.xThumb.style.width = `${size}%`
        els.xThumb.style.transform = `translate3d(${st.position * (100 - size)}%, 0, 0)`
        els.xThumb.setAttribute("data-state", st.visible ? "visible" : "hidden")
      }
      if (els.yThumb) {
        const st = y.get()
        const size = Math.max(0, Math.min(1, st.ratio)) * 100
        els.yThumb.style.height = `${size}%`
        els.yThumb.style.transform = `translate3d(0, ${st.position * (100 - size)}%, 0)`
        els.yThumb.setAttribute("data-state", st.visible ? "visible" : "hidden")
      }
      if (els.xScrollbar) {
        els.xScrollbar.setAttribute("data-state", x.get().visible ? "visible" : "hidden")
      }
      if (els.yScrollbar) {
        els.yScrollbar.setAttribute("data-state", y.get().visible ? "visible" : "hidden")
      }
    }

    measure()
    applyThumbs()
    const unX = x.subscribe(applyThumbs)
    const unY = y.subscribe(applyThumbs)

    return () => {
      if (hideTimer) clearTimeout(hideTimer)
      offScroll()
      resizeObs?.disconnect()
      offRootEnter?.()
      offRootLeave?.()
      offXDrag()
      offYDrag()
      unX()
      unY()
    }
  }

  return {
    x,
    y,
    getRootProps,
    getViewportProps,
    getScrollbarProps,
    getThumbProps,
    mount,
  }
}
