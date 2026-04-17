import { isBrowser, on } from "./_dom.ts"

export type Side = "top" | "right" | "bottom" | "left"
export type Align = "start" | "center" | "end"

export interface PositionOptions {
  side?: Side
  align?: Align
  /** Gap between trigger and content. Default 8. */
  sideOffset?: number
  /** Shift along the align axis (positive moves toward `end`). Default 0. */
  alignOffset?: number
  /** Flip side when the requested one would overflow the viewport. Default true. */
  flip?: boolean
  /** Viewport edge padding for flip + clamp detection. Default 8. */
  collisionPadding?: number
}

export interface PositionResult {
  /** Viewport-relative top (use with `position: fixed`). */
  x: number
  y: number
  /** Resolved side after potential flip. */
  side: Side
  align: Align
}

/**
 * Anything that can produce a `DOMRect`. `HTMLElement` already satisfies this,
 * so callers can pass either a real element or a virtual anchor (e.g. a cursor
 * position for context menus).
 */
export interface VirtualElement {
  getBoundingClientRect: () => DOMRect
}

const FLIP: Record<Side, Side> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
}

function alignAlong(
  anchorStart: number,
  anchorSize: number,
  contentSize: number,
  align: Align,
  alignOffset: number,
): number {
  if (align === "start") return anchorStart + alignOffset
  if (align === "end") return anchorStart + anchorSize - contentSize - alignOffset
  return anchorStart + (anchorSize - contentSize) / 2 + alignOffset
}

function placeOnSide(
  anchor: DOMRect,
  cw: number,
  ch: number,
  side: Side,
  align: Align,
  sideOffset: number,
  alignOffset: number,
): { x: number; y: number } {
  switch (side) {
    case "top":
      return {
        x: alignAlong(anchor.left, anchor.width, cw, align, alignOffset),
        y: anchor.top - ch - sideOffset,
      }
    case "bottom":
      return {
        x: alignAlong(anchor.left, anchor.width, cw, align, alignOffset),
        y: anchor.bottom + sideOffset,
      }
    case "left":
      return {
        x: anchor.left - cw - sideOffset,
        y: alignAlong(anchor.top, anchor.height, ch, align, alignOffset),
      }
    case "right":
      return {
        x: anchor.right + sideOffset,
        y: alignAlong(anchor.top, anchor.height, ch, align, alignOffset),
      }
  }
}

function overflows(
  x: number,
  y: number,
  cw: number,
  ch: number,
  vw: number,
  vh: number,
  pad: number,
): boolean {
  return x < pad || y < pad || x + cw > vw - pad || y + ch > vh - pad
}

/**
 * Compute viewport-relative coords for `content` next to `anchor`. Pure function;
 * caller applies via `style.top`/`style.left`. Content must be visible (or at
 * least laid out — visibility:hidden is fine; display:none returns 0×0).
 */
export function computePosition(
  anchor: HTMLElement | VirtualElement,
  content: HTMLElement,
  options: PositionOptions = {},
): PositionResult {
  if (!isBrowser())
    return { x: 0, y: 0, side: options.side ?? "bottom", align: options.align ?? "center" }

  const side: Side = options.side ?? "bottom"
  const align: Align = options.align ?? "center"
  const sideOffset = options.sideOffset ?? 8
  const alignOffset = options.alignOffset ?? 0
  const flip = options.flip ?? true
  const pad = options.collisionPadding ?? 8

  const anchorRect = anchor.getBoundingClientRect()
  const contentRect = content.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  let resolvedSide = side
  let placed = placeOnSide(
    anchorRect,
    contentRect.width,
    contentRect.height,
    side,
    align,
    sideOffset,
    alignOffset,
  )

  if (flip && overflows(placed.x, placed.y, contentRect.width, contentRect.height, vw, vh, pad)) {
    const opposite = FLIP[side]
    const alt = placeOnSide(
      anchorRect,
      contentRect.width,
      contentRect.height,
      opposite,
      align,
      sideOffset,
      alignOffset,
    )
    if (!overflows(alt.x, alt.y, contentRect.width, contentRect.height, vw, vh, pad)) {
      resolvedSide = opposite
      placed = alt
    }
  }

  // Clamp align axis independently so we don't run off the viewport on edge anchors.
  if (resolvedSide === "top" || resolvedSide === "bottom") {
    if (placed.x < pad) placed.x = pad
    if (placed.x + contentRect.width > vw - pad) placed.x = vw - pad - contentRect.width
  } else {
    if (placed.y < pad) placed.y = pad
    if (placed.y + contentRect.height > vh - pad) placed.y = vh - pad - contentRect.height
  }

  return {
    x: Math.round(placed.x),
    y: Math.round(placed.y),
    side: resolvedSide,
    align,
  }
}

/**
 * Re-compute position on scroll (capture, all scrollable ancestors), resize,
 * and content/anchor mutations. RAF-throttled. Returns release.
 */
export function autoPosition(
  anchor: HTMLElement | VirtualElement,
  content: HTMLElement,
  apply: (result: PositionResult) => void,
  options: PositionOptions = {},
): () => void {
  if (!isBrowser()) return () => {}

  let rafId = 0
  let released = false

  const update = (): void => {
    if (released) return
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      rafId = 0
      if (released) return
      apply(computePosition(anchor, content, options))
    })
  }

  update()
  const offScroll = on(window, "scroll", update, {
    passive: true,
    capture: true,
  } as AddEventListenerOptions)
  const offResize = on(window, "resize", update)

  let resizeObs: ResizeObserver | null = null
  if (typeof ResizeObserver !== "undefined") {
    resizeObs = new ResizeObserver(update)
    if (anchor instanceof HTMLElement) resizeObs.observe(anchor)
    resizeObs.observe(content)
  }

  return () => {
    released = true
    if (rafId) cancelAnimationFrame(rafId)
    offScroll()
    offResize()
    resizeObs?.disconnect()
  }
}
