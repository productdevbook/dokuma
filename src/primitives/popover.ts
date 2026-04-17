import { isBrowser, on } from "../_dom.ts"
import { trapFocus } from "../_focus.ts"
import { createId } from "../_id.ts"
import { autoPosition, type Align, type PositionOptions, type Side } from "../_position.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface PopoverOptions extends PositionOptions {
  defaultOpen?: boolean
  open?: () => boolean
  onOpenChange?: (open: boolean) => void
  /** Default `true`. Pressing Escape calls `hide()`. */
  closeOnEscape?: boolean
  /** Default `true`. Mousedown outside content closes. */
  closeOnOutsideClick?: boolean
  /** Default `true`. Tab is contained inside content while open. */
  trapFocus?: boolean
  /** Default `true`. */
  restoreFocus?: boolean
  initialFocus?: () => HTMLElement | null
}

export interface PopoverTriggerProps {
  type: "button"
  "aria-haspopup": "dialog"
  "aria-expanded": "true" | "false"
  "aria-controls": string
  "data-state": "open" | "closed"
  onClick: (event?: { preventDefault?: () => void }) => void
}

export interface PopoverContentProps {
  role: "dialog"
  id: string
  "data-state": "open" | "closed"
  "data-side": Side
  "data-align": Align
  tabIndex: -1
}

export interface PopoverCloseProps {
  type: "button"
  "aria-label": string
  onClick: (event?: { preventDefault?: () => void }) => void
}

export interface Popover {
  open: Signal<boolean>
  contentId: string
  show: () => void
  hide: () => void
  toggle: () => void
  getTriggerProps: () => PopoverTriggerProps
  getContentProps: () => PopoverContentProps
  getCloseProps: (label?: string) => PopoverCloseProps
  mount: (els: { trigger: HTMLElement; content: HTMLElement }) => Unsubscribe
}

export function createPopover(options: PopoverOptions = {}): Popover {
  const contentId = createId("dokuma-popover")
  const closeOnEscape = options.closeOnEscape ?? true
  const closeOnOutsideClick = options.closeOnOutsideClick ?? true
  const shouldTrap = options.trapFocus ?? true
  const restoreFocus = options.restoreFocus ?? true
  const isControlled = typeof options.open === "function"

  const internal = createSignal(options.defaultOpen ?? false)
  const subscribers = new Set<(v: boolean) => void>()

  const readOpen = (): boolean =>
    isControlled ? (options.open as () => boolean)() : internal.get()

  let resolvedSide: Side = options.side ?? "bottom"
  let resolvedAlign: Align = options.align ?? "center"
  let lastFocused: HTMLElement | null = null

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
    if (readOpen()) return
    if (isBrowser() && restoreFocus) {
      lastFocused = document.activeElement as HTMLElement | null
    }
    open.set(true)
  }
  const hide = (): void => {
    if (!readOpen()) return
    open.set(false)
  }
  const toggle = (): void => (readOpen() ? hide() : show())

  const handleTriggerClick = (event?: { preventDefault?: () => void }): void => {
    event?.preventDefault?.()
    toggle()
  }
  const handleCloseClick = (event?: { preventDefault?: () => void }): void => {
    event?.preventDefault?.()
    hide()
  }

  const getTriggerProps = (): PopoverTriggerProps => {
    const isOpen = readOpen()
    return {
      type: "button",
      "aria-haspopup": "dialog",
      "aria-expanded": isOpen ? "true" : "false",
      "aria-controls": contentId,
      "data-state": isOpen ? "open" : "closed",
      onClick: handleTriggerClick,
    }
  }

  const getContentProps = (): PopoverContentProps => ({
    role: "dialog",
    id: contentId,
    "data-state": readOpen() ? "open" : "closed",
    "data-side": resolvedSide,
    "data-align": resolvedAlign,
    tabIndex: -1,
  })

  const getCloseProps = (label = "Close"): PopoverCloseProps => ({
    type: "button",
    "aria-label": label,
    onClick: handleCloseClick,
  })

  const mount = (els: { trigger: HTMLElement; content: HTMLElement }): Unsubscribe => {
    const { trigger, content } = els
    let releasePosition: (() => void) | null = null
    let releaseTrap: (() => void) | null = null
    let releaseEscape: (() => void) | null = null
    let releaseOutside: (() => void) | null = null

    const apply = (): void => {
      const isOpen = readOpen()
      trigger.setAttribute("type", "button")
      trigger.setAttribute("aria-haspopup", "dialog")
      trigger.setAttribute("aria-expanded", isOpen ? "true" : "false")
      trigger.setAttribute("aria-controls", contentId)
      trigger.setAttribute("data-state", isOpen ? "open" : "closed")
      content.id = contentId
      content.setAttribute("role", "dialog")
      content.setAttribute("data-state", isOpen ? "open" : "closed")
      content.setAttribute("data-side", resolvedSide)
      content.setAttribute("data-align", resolvedAlign)
      content.tabIndex = -1
    }

    const teardownOpenSideEffects = (): void => {
      releasePosition?.()
      releaseTrap?.()
      releaseEscape?.()
      releaseOutside?.()
      releasePosition = null
      releaseTrap = null
      releaseEscape = null
      releaseOutside = null
    }

    const setupOpenSideEffects = (): void => {
      teardownOpenSideEffects()

      content.style.position = "fixed"
      content.style.top = "0"
      content.style.left = "0"
      // Visibility must be visible before trapFocus can find focusables.
      content.style.visibility = "visible"

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

      if (shouldTrap) {
        releaseTrap = trapFocus(content, {
          initialFocus: options.initialFocus?.() ?? null,
        })
      }

      if (closeOnEscape) {
        releaseEscape = on(
          document,
          "keydown",
          (e) => {
            if ((e as KeyboardEvent).key === "Escape") {
              ;(e as KeyboardEvent).preventDefault()
              hide()
            }
          },
          true,
        )
      }

      if (closeOnOutsideClick) {
        releaseOutside = on(document, "mousedown", (e) => {
          const target = e.target as Node
          if (content.contains(target)) return
          if (trigger.contains(target)) return
          hide()
        })
      }
    }

    apply()
    trigger.addEventListener("click", handleTriggerClick as EventListener)

    const onOpenChange = (isOpen: boolean): void => {
      apply()
      if (isOpen) {
        setupOpenSideEffects()
      } else {
        teardownOpenSideEffects()
        if (restoreFocus && lastFocused) {
          const el = lastFocused
          lastFocused = null
          queueMicrotask(() => el.focus())
        }
      }
    }

    if (readOpen()) setupOpenSideEffects()
    const unsub = open.subscribe(onOpenChange)

    return () => {
      unsub()
      teardownOpenSideEffects()
      trigger.removeEventListener("click", handleTriggerClick as EventListener)
    }
  }

  return {
    open,
    contentId,
    show,
    hide,
    toggle,
    getTriggerProps,
    getContentProps,
    getCloseProps,
    mount,
  }
}
