import { on } from "../_dom.ts"
import { lockScroll } from "../_focus.ts"
import { createId } from "../_id.ts"
import { pushDismissibleLayer, pushFocusScope } from "../_layers.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export type DrawerDirection = "top" | "right" | "bottom" | "left"

export interface DrawerOptions {
  defaultOpen?: boolean
  open?: () => boolean
  onOpenChange?: (open: boolean) => void

  /** Side of the screen the drawer slides in from. Default `"bottom"`. */
  direction?: DrawerDirection
  /**
   * Snap points as fractions of the drawer's size (0..1). The final point is
   * the fully-open state (default `[1]`). Pointer drag snaps to the nearest
   * value; a closing drag past the first point dismisses.
   */
  snapPoints?: number[]
  /** Initial snap index. Default `snapPoints.length - 1` (fully open). */
  defaultSnap?: number
  /** Close threshold — fraction of drawer size. Drag past this to dismiss. Default `0.5`. */
  closeThreshold?: number
  /** Velocity threshold px/ms to trigger dismiss regardless of distance. Default `0.5`. */
  velocityThreshold?: number
  /** Default `true`. Lock body scroll while open. */
  modal?: boolean
  /** Default `true`. Trap Tab focus inside the drawer while open. */
  trapFocus?: boolean
  /** Default `true`. Dismiss on Escape. */
  dismissOnEscape?: boolean
}

export interface DrawerRootProps {
  "data-state": "open" | "closed"
  "data-direction": DrawerDirection
}

export interface DrawerContentProps {
  id: string
  role: "dialog"
  "aria-modal"?: "true"
  "aria-labelledby"?: string
  "data-state": "open" | "closed"
  "data-direction": DrawerDirection
  tabIndex: -1
}

export interface DrawerOverlayProps {
  "data-state": "open" | "closed"
}

export interface DrawerTitleProps {
  id: string
}

export interface DrawerDescriptionProps {
  id: string
}

export interface Drawer {
  open: Signal<boolean>
  /** Current snap point index (0..snapPoints.length-1), or null when closed. */
  snap: Signal<number | null>
  contentId: string
  titleId: string
  descriptionId: string
  show: () => void
  hide: () => void
  toggle: () => void
  setSnap: (index: number) => void

  getRootProps: () => DrawerRootProps
  getContentProps: () => DrawerContentProps
  getOverlayProps: () => DrawerOverlayProps
  getTitleProps: () => DrawerTitleProps
  getDescriptionProps: () => DrawerDescriptionProps

  /** Imperative DOM wiring. Returns cleanup. */
  mount: (els: { content: HTMLElement; overlay?: HTMLElement; handle?: HTMLElement }) => Unsubscribe
}

export function createDrawer(options: DrawerOptions = {}): Drawer {
  const contentId = createId("drawer-content")
  const titleId = createId("drawer-title")
  const descriptionId = createId("drawer-description")

  const direction: DrawerDirection = options.direction ?? "bottom"
  const snapPoints = options.snapPoints ?? [1]
  const defaultSnap = options.defaultSnap ?? snapPoints.length - 1
  const closeThreshold = options.closeThreshold ?? 0.5
  const velocityThreshold = options.velocityThreshold ?? 0.5
  const modal = options.modal ?? true
  const trapFocus = options.trapFocus ?? true
  const dismissOnEscape = options.dismissOnEscape ?? true

  const isControlled = typeof options.open === "function"
  const internal = createSignal(options.defaultOpen ?? false)
  const read = (): boolean => (isControlled ? (options.open as () => boolean)() : internal.get())
  const subs = new Set<(v: boolean) => void>()
  const open: Signal<boolean> = {
    get: read,
    set: (next) => {
      const resolved = typeof next === "function" ? (next as (p: boolean) => boolean)(read()) : next
      if (resolved === read()) return
      if (!isControlled) internal.set(resolved)
      options.onOpenChange?.(resolved)
      for (const fn of subs) fn(resolved)
    },
    subscribe: (fn) => {
      subs.add(fn)
      return () => subs.delete(fn)
    },
  }

  const snap = createSignal<number | null>(read() ? defaultSnap : null)

  const show = (): void => {
    snap.set(defaultSnap)
    open.set(true)
  }
  const hide = (): void => {
    snap.set(null)
    open.set(false)
  }
  const toggle = (): void => (read() ? hide() : show())
  const setSnap = (index: number): void => {
    const clamped = Math.max(0, Math.min(snapPoints.length - 1, index))
    snap.set(clamped)
  }

  const getRootProps = (): DrawerRootProps => ({
    "data-state": read() ? "open" : "closed",
    "data-direction": direction,
  })

  const getContentProps = (): DrawerContentProps => {
    const props: DrawerContentProps = {
      id: contentId,
      role: "dialog",
      "data-state": read() ? "open" : "closed",
      "data-direction": direction,
      tabIndex: -1,
    }
    if (modal) props["aria-modal"] = "true"
    props["aria-labelledby"] = titleId
    return props
  }

  const getOverlayProps = (): DrawerOverlayProps => ({
    "data-state": read() ? "open" : "closed",
  })

  const getTitleProps = (): DrawerTitleProps => ({ id: titleId })
  const getDescriptionProps = (): DrawerDescriptionProps => ({ id: descriptionId })

  const axisFor = (d: DrawerDirection): "x" | "y" => (d === "top" || d === "bottom" ? "y" : "x")
  const signFor = (d: DrawerDirection): 1 | -1 => (d === "bottom" || d === "right" ? 1 : -1)

  const mount: Drawer["mount"] = (els) => {
    const { content, overlay, handle } = els
    content.id ||= contentId

    const axis = axisFor(direction)
    const sign = signFor(direction)

    let releaseScroll: (() => void) | null = null
    let releaseFocus: (() => void) | null = null
    let releaseLayer: (() => void) | null = null

    const applyTransform = (offset: number): void => {
      // offset: distance dragged past the open position (in px, positive = toward close side)
      const val = `${offset * sign}px`
      content.style.transform =
        axis === "y" ? `translate3d(0, ${val}, 0)` : `translate3d(${val}, 0, 0)`
    }

    const applySnapTransform = (index: number | null): void => {
      if (index === null) {
        // Fully off-screen.
        const off = `${100 * sign}%`
        content.style.transform =
          axis === "y" ? `translate3d(0, ${off}, 0)` : `translate3d(${off}, 0, 0)`
        return
      }
      const fraction = snapPoints[index]
      // fraction=1 → fully open (0% translate). fraction=0.5 → half-open.
      const pct = (1 - fraction) * 100
      const off = `${pct * sign}%`
      content.style.transform =
        axis === "y" ? `translate3d(0, ${off}, 0)` : `translate3d(${off}, 0, 0)`
    }

    const applyState = (): void => {
      const o = read()
      content.setAttribute("data-state", o ? "open" : "closed")
      content.setAttribute("data-direction", direction)
      if (overlay) overlay.setAttribute("data-state", o ? "open" : "closed")
      if (o) applySnapTransform(snap.get() ?? defaultSnap)
      else applySnapTransform(null)
    }

    const handleOpenChange = (o: boolean): void => {
      applyState()
      if (o) {
        if (modal) releaseScroll = lockScroll()
        if (trapFocus) releaseFocus = pushFocusScope(content)
        if (dismissOnEscape) releaseLayer = pushDismissibleLayer(() => hide())
        content.focus({ preventScroll: true })
      } else {
        releaseScroll?.()
        releaseScroll = null
        releaseFocus?.()
        releaseFocus = null
        releaseLayer?.()
        releaseLayer = null
      }
    }

    // --- drag gesture ---
    const dragTarget = handle ?? content
    let dragging = false
    let startCoord = 0
    let startTime = 0
    let lastCoord = 0
    let lastTime = 0
    let contentSize = 0

    const coordOf = (e: PointerEvent): number => (axis === "y" ? e.clientY : e.clientX)

    const onPointerDown = (e: PointerEvent): void => {
      if (!read()) return
      dragging = true
      dragTarget.setPointerCapture(e.pointerId)
      startCoord = coordOf(e)
      lastCoord = startCoord
      startTime = performance.now()
      lastTime = startTime
      contentSize = axis === "y" ? content.offsetHeight : content.offsetWidth
      content.style.transition = "none"
    }

    const onPointerMove = (e: PointerEvent): void => {
      if (!dragging) return
      const c = coordOf(e)
      const delta = (c - startCoord) * sign
      // Only allow pulling toward the close edge (positive delta).
      const offset = Math.max(0, delta)
      applyTransform(offset)
      lastCoord = c
      lastTime = performance.now()
    }

    const onPointerUp = (e: PointerEvent): void => {
      if (!dragging) return
      dragging = false
      try {
        dragTarget.releasePointerCapture(e.pointerId)
      } catch {}
      content.style.transition = ""

      const totalDelta = (lastCoord - startCoord) * sign
      const duration = Math.max(1, performance.now() - startTime)
      const velocity = totalDelta / duration // px/ms
      const relativeDistance = contentSize > 0 ? totalDelta / contentSize : 0

      if (relativeDistance >= closeThreshold || velocity >= velocityThreshold) {
        hide()
      } else if (snapPoints.length > 1) {
        // Snap to nearest point.
        const currentFraction = 1 - relativeDistance
        let bestIdx = 0
        let bestDist = Number.POSITIVE_INFINITY
        for (let i = 0; i < snapPoints.length; i++) {
          const d = Math.abs(snapPoints[i] - currentFraction)
          if (d < bestDist) {
            bestDist = d
            bestIdx = i
          }
        }
        setSnap(bestIdx)
        applySnapTransform(bestIdx)
      } else {
        applySnapTransform(snap.get() ?? defaultSnap)
      }
    }

    dragTarget.addEventListener("pointerdown", onPointerDown)
    dragTarget.addEventListener("pointermove", onPointerMove)
    dragTarget.addEventListener("pointerup", onPointerUp)
    dragTarget.addEventListener("pointercancel", onPointerUp)

    // overlay click → dismiss
    const offOverlayClick = overlay ? on(overlay, "click", () => hide()) : () => {}

    // initial state
    applyState()
    if (read()) handleOpenChange(true)

    const unOpen = open.subscribe(handleOpenChange)
    const unSnap = snap.subscribe((s) => {
      if (read()) applySnapTransform(s ?? defaultSnap)
    })

    return () => {
      dragTarget.removeEventListener("pointerdown", onPointerDown)
      dragTarget.removeEventListener("pointermove", onPointerMove)
      dragTarget.removeEventListener("pointerup", onPointerUp)
      dragTarget.removeEventListener("pointercancel", onPointerUp)
      offOverlayClick()
      releaseScroll?.()
      releaseFocus?.()
      releaseLayer?.()
      unOpen()
      unSnap()
    }
  }

  return {
    open,
    snap,
    contentId,
    titleId,
    descriptionId,
    show,
    hide,
    toggle,
    setSnap,
    getRootProps,
    getContentProps,
    getOverlayProps,
    getTitleProps,
    getDescriptionProps,
    mount,
  }
}
