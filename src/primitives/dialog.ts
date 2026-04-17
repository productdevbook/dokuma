import { isBrowser, on } from "../_dom.ts"
import { lockScroll } from "../_focus.ts"
import { createId } from "../_id.ts"
import { pushDismissibleLayer, pushFocusScope } from "../_layers.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface DialogOptions {
  defaultOpen?: boolean
  open?: () => boolean
  onOpenChange?: (open: boolean) => void
  /** Default `true`. Modal traps focus and locks body scroll. */
  modal?: boolean
  /** Default `true`. Pressing Escape calls `hide()`. */
  closeOnEscape?: boolean
  /** Default `true`. Mousedown outside the content calls `hide()`. */
  closeOnOutsideClick?: boolean
  /** Element to focus when the dialog opens. Default = first focusable inside content. */
  initialFocus?: () => HTMLElement | null
  /** Default `true`. Returns focus to the previously focused element on close. */
  restoreFocus?: boolean
  /** Default `"dialog"`. Set to `"alertdialog"` for AlertDialog semantics. */
  role?: "dialog" | "alertdialog"
}

export interface DialogTriggerProps {
  type: "button"
  "aria-haspopup": "dialog"
  "aria-expanded": "true" | "false"
  "aria-controls": string
  "data-state": "open" | "closed"
  onClick: (event?: { preventDefault?: () => void }) => void
}

export interface DialogContentProps {
  role: "dialog" | "alertdialog"
  id: string
  "aria-modal"?: "true"
  "aria-labelledby"?: string
  "aria-describedby"?: string
  "data-state": "open" | "closed"
  tabIndex: -1
}

export interface DialogOverlayProps {
  "data-state": "open" | "closed"
  "aria-hidden": true
}

export interface DialogTitleProps {
  id: string
}

export interface DialogDescriptionProps {
  id: string
}

export interface DialogCloseProps {
  type: "button"
  "aria-label": string
  onClick: (event?: { preventDefault?: () => void }) => void
}

export interface Dialog {
  open: Signal<boolean>
  modal: boolean
  contentId: string
  titleId: string
  descriptionId: string
  show: () => void
  hide: () => void
  toggle: () => void
  getTriggerProps: () => DialogTriggerProps
  getOverlayProps: () => DialogOverlayProps
  getContentProps: () => DialogContentProps
  getTitleProps: () => DialogTitleProps
  getDescriptionProps: () => DialogDescriptionProps
  getCloseProps: (label?: string) => DialogCloseProps
  /**
   * Imperatively wire DOM elements. Installs escape, outside-click, focus trap,
   * and scroll lock as appropriate. Returns cleanup.
   */
  mount: (els: {
    trigger?: HTMLElement
    content: HTMLElement
    overlay?: HTMLElement
  }) => Unsubscribe
}

export function createDialog(options: DialogOptions = {}): Dialog {
  const contentId = createId("dokuma-dialog-content")
  const titleId = createId("dokuma-dialog-title")
  const descriptionId = createId("dokuma-dialog-desc")

  const modal = options.modal ?? true
  const closeOnEscape = options.closeOnEscape ?? true
  const closeOnOutsideClick = options.closeOnOutsideClick ?? true
  const restoreFocus = options.restoreFocus ?? true
  const role: "dialog" | "alertdialog" = options.role ?? "dialog"
  const isControlled = typeof options.open === "function"

  const internal = createSignal(options.defaultOpen ?? false)
  const subscribers = new Set<(v: boolean) => void>()

  const readOpen = (): boolean =>
    isControlled ? (options.open as () => boolean)() : internal.get()

  // Track the element to restore focus to. Captured at show(); cleared after restore.
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
    show()
  }

  const handleCloseClick = (event?: { preventDefault?: () => void }): void => {
    event?.preventDefault?.()
    hide()
  }

  const getTriggerProps = (): DialogTriggerProps => {
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

  const getOverlayProps = (): DialogOverlayProps => ({
    "data-state": readOpen() ? "open" : "closed",
    "aria-hidden": true,
  })

  const getContentProps = (): DialogContentProps => {
    const isOpen = readOpen()
    const props: DialogContentProps = {
      role,
      id: contentId,
      "data-state": isOpen ? "open" : "closed",
      tabIndex: -1,
    }
    if (modal) props["aria-modal"] = "true"
    return props
  }

  const getTitleProps = (): DialogTitleProps => ({ id: titleId })
  const getDescriptionProps = (): DialogDescriptionProps => ({ id: descriptionId })

  const getCloseProps = (label = "Close"): DialogCloseProps => ({
    type: "button",
    "aria-label": label,
    onClick: handleCloseClick,
  })

  // ---------------------------------------------------------------- mount ---

  const mount = (els: {
    trigger?: HTMLElement
    content: HTMLElement
    overlay?: HTMLElement
  }): Unsubscribe => {
    const { trigger, content, overlay } = els
    let releaseTrap: (() => void) | null = null
    let releaseScroll: (() => void) | null = null
    let releaseEscape: (() => void) | null = null
    let releaseOutside: (() => void) | null = null

    const apply = (): void => {
      const isOpen = readOpen()
      if (trigger) {
        trigger.setAttribute("type", "button")
        trigger.setAttribute("aria-haspopup", "dialog")
        trigger.setAttribute("aria-expanded", isOpen ? "true" : "false")
        trigger.setAttribute("aria-controls", contentId)
        trigger.setAttribute("data-state", isOpen ? "open" : "closed")
      }
      content.setAttribute("role", role)
      content.id = contentId
      content.setAttribute("data-state", isOpen ? "open" : "closed")
      content.tabIndex = -1
      if (modal) content.setAttribute("aria-modal", "true")
      if (overlay) {
        overlay.setAttribute("data-state", isOpen ? "open" : "closed")
        overlay.setAttribute("aria-hidden", "true")
      }
    }

    const teardownOpenSideEffects = (): void => {
      releaseTrap?.()
      releaseScroll?.()
      releaseEscape?.()
      releaseOutside?.()
      releaseTrap = null
      releaseScroll = null
      releaseEscape = null
      releaseOutside = null
    }

    const setupOpenSideEffects = (): void => {
      teardownOpenSideEffects()

      if (modal) {
        releaseTrap = pushFocusScope(content, {
          initialFocus: options.initialFocus?.() ?? null,
        })
        releaseScroll = lockScroll()
      } else if (options.initialFocus) {
        const el = options.initialFocus()
        el?.focus()
      }

      if (closeOnEscape) {
        releaseEscape = pushDismissibleLayer(() => hide())
      }

      if (closeOnOutsideClick) {
        releaseOutside = on(document, "mousedown", (e) => {
          const target = e.target as Node
          if (content.contains(target)) return
          if (overlay && !overlay.contains(target) && target !== document.body) {
            // clicked outside overlay too — still close
          }
          hide()
        })
      }
    }

    apply()

    if (trigger) trigger.addEventListener("click", handleTriggerClick as EventListener)

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

    // If we're starting open, set up side effects immediately.
    if (readOpen()) setupOpenSideEffects()

    const unsub = open.subscribe(onOpenChange)

    let destroyed = false
    return () => {
      if (destroyed) return
      destroyed = true
      unsub()
      teardownOpenSideEffects()
      if (trigger) trigger.removeEventListener("click", handleTriggerClick as EventListener)
    }
  }

  return {
    open,
    modal,
    contentId,
    titleId,
    descriptionId,
    show,
    hide,
    toggle,
    getTriggerProps,
    getOverlayProps,
    getContentProps,
    getTitleProps,
    getDescriptionProps,
    getCloseProps,
    mount,
  }
}
