import { on } from "../_dom.ts"
import { createId } from "../_id.ts"
import { pushDismissibleLayer } from "../_layers.ts"
import { autoPosition, type Align, type PositionOptions, type Side } from "../_position.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface TooltipOptions extends PositionOptions {
  defaultOpen?: boolean
  open?: () => boolean
  onOpenChange?: (open: boolean) => void
  /** Hover-show delay in ms. Default 700. Focus has no delay. */
  delayShow?: number
  /** Hover-hide delay in ms. Default 300. */
  delayHide?: number
  disabled?: () => boolean
}

export interface TooltipTriggerProps {
  type?: "button"
  "aria-describedby"?: string
  "data-state": "open" | "closed"
}

export interface TooltipContentProps {
  role: "tooltip"
  id: string
  "data-state": "open" | "closed"
  "data-side": Side
  "data-align": Align
}

export interface Tooltip {
  open: Signal<boolean>
  contentId: string
  show: () => void
  hide: () => void
  getTriggerProps: () => TooltipTriggerProps
  getContentProps: () => TooltipContentProps
  /**
   * Wires hover/focus on trigger, escape, touch, and positioning.
   * Caller must place `content` in the DOM (visibility: hidden initially is fine).
   */
  mount: (els: { trigger: HTMLElement; content: HTMLElement }) => Unsubscribe
}

export function createTooltip(options: TooltipOptions = {}): Tooltip {
  const contentId = createId("dokuma-tooltip")
  const delayShow = options.delayShow ?? 700
  const delayHide = options.delayHide ?? 300
  const isControlled = typeof options.open === "function"

  const internal = createSignal(options.defaultOpen ?? false)
  const subscribers = new Set<(v: boolean) => void>()

  const readOpen = (): boolean =>
    isControlled ? (options.open as () => boolean)() : internal.get()

  const isDisabled = (): boolean => options.disabled?.() ?? false

  let resolvedSide: Side = options.side ?? "bottom"
  let resolvedAlign: Align = options.align ?? "center"

  const open: Signal<boolean> = {
    get: readOpen,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: boolean) => boolean)(readOpen()) : next
      if (resolved === readOpen()) return
      if (!isControlled) internal.set(resolved)
      options.onOpenChange?.(resolved)
      for (const fn of subscribers) fn(resolved)
    },
    subscribe: (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
  }

  const show = (): void => {
    if (isDisabled()) return
    open.set(true)
  }
  const hide = (): void => open.set(false)

  const getTriggerProps = (): TooltipTriggerProps => {
    const isOpen = readOpen()
    const props: TooltipTriggerProps = {
      "data-state": isOpen ? "open" : "closed",
    }
    if (isOpen) props["aria-describedby"] = contentId
    return props
  }

  const getContentProps = (): TooltipContentProps => ({
    role: "tooltip",
    id: contentId,
    "data-state": readOpen() ? "open" : "closed",
    "data-side": resolvedSide,
    "data-align": resolvedAlign,
  })

  const mount = (els: { trigger: HTMLElement; content: HTMLElement }): Unsubscribe => {
    const { trigger, content } = els
    let showTimer: ReturnType<typeof setTimeout> | null = null
    let hideTimer: ReturnType<typeof setTimeout> | null = null
    let releasePosition: (() => void) | null = null
    let releaseEscape: (() => void) | null = null
    let releaseTouch: (() => void) | null = null

    const clearTimers = (): void => {
      if (showTimer) clearTimeout(showTimer)
      if (hideTimer) clearTimeout(hideTimer)
      showTimer = null
      hideTimer = null
    }

    const apply = (): void => {
      const isOpen = readOpen()
      content.id = contentId
      content.setAttribute("role", "tooltip")
      content.setAttribute("data-state", isOpen ? "open" : "closed")
      content.setAttribute("data-side", resolvedSide)
      content.setAttribute("data-align", resolvedAlign)
      trigger.setAttribute("data-state", isOpen ? "open" : "closed")
      if (isOpen) trigger.setAttribute("aria-describedby", contentId)
      else trigger.removeAttribute("aria-describedby")
    }

    const teardownOpenSideEffects = (): void => {
      releasePosition?.()
      releaseEscape?.()
      releaseTouch?.()
      releasePosition = null
      releaseEscape = null
      releaseTouch = null
    }

    const setupOpenSideEffects = (): void => {
      teardownOpenSideEffects()

      // Make content measurable before computing.
      content.style.position = "fixed"
      content.style.top = "0"
      content.style.left = "0"

      releasePosition = autoPosition(
        trigger,
        content,
        (result) => {
          resolvedSide = result.side
          resolvedAlign = result.align
          content.style.transform = `translate3d(${result.x}px, ${result.y}px, 0)`
          content.setAttribute("data-side", result.side)
          content.setAttribute("data-align", result.align)
        },
        options,
      )

      releaseEscape = pushDismissibleLayer(() => {
        clearTimers()
        hide()
      })

      // On touch devices, dismiss the tooltip on the next touchstart.
      releaseTouch = on(
        document,
        "touchstart",
        () => {
          clearTimers()
          hide()
        },
        { passive: true },
      )
    }

    apply()

    const onMouseEnter = (): void => {
      if (hideTimer) clearTimeout(hideTimer)
      hideTimer = null
      if (readOpen() || isDisabled()) return
      if (showTimer) return
      showTimer = setTimeout(() => {
        showTimer = null
        show()
      }, delayShow)
    }
    const onMouseLeave = (): void => {
      if (showTimer) clearTimeout(showTimer)
      showTimer = null
      if (!readOpen()) return
      if (hideTimer) return
      hideTimer = setTimeout(() => {
        hideTimer = null
        hide()
      }, delayHide)
    }
    const onFocusIn = (): void => {
      clearTimers()
      show()
    }
    const onFocusOut = (): void => {
      clearTimers()
      hide()
    }
    const onPointerDown = (): void => {
      clearTimers()
      hide()
    }

    const offMouseEnter = on(trigger, "mouseenter", onMouseEnter)
    const offMouseLeave = on(trigger, "mouseleave", onMouseLeave)
    const offFocusIn = on(trigger, "focusin", onFocusIn)
    const offFocusOut = on(trigger, "focusout", onFocusOut)
    const offPointerDown = on(trigger, "pointerdown", onPointerDown)

    const onOpenChange = (isOpen: boolean): void => {
      apply()
      if (isOpen) setupOpenSideEffects()
      else teardownOpenSideEffects()
    }

    if (readOpen()) setupOpenSideEffects()
    const unsub = open.subscribe(onOpenChange)

    return () => {
      clearTimers()
      teardownOpenSideEffects()
      offMouseEnter()
      offMouseLeave()
      offFocusIn()
      offFocusOut()
      offPointerDown()
      unsub()
    }
  }

  return {
    open,
    contentId,
    show,
    hide,
    getTriggerProps,
    getContentProps,
    mount,
  }
}
