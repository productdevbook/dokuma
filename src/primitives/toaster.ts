import { isBrowser, on } from "../_dom.ts"
import { createId } from "../_id.ts"
import { createPresence, type Presence } from "../_presence.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export type ToastType = "default" | "success" | "error" | "warning" | "info"

export type ToastPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  /** Stable id; if omitted, generated. Re-using an id upserts the toast. */
  id?: string
  /** ARIA + visual category. `error` uses `role="alert"` (assertive). Default `"default"`. */
  type?: ToastType
  /** ms before auto-dismiss. `Infinity` makes the toast sticky. Default 5000. */
  duration?: number
  /** Optional action button (label + click). */
  action?: ToastAction
  /** Fired when the toast is dismissed for any reason. */
  onDismiss?: () => void
  /** Fired only when the toast auto-closes (timer expires). */
  onAutoClose?: () => void
}

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  duration: number
  action: ToastAction | null
  createdAt: number
}

export interface ToasterOptions {
  /** Default duration for toasts that don't specify one. Default 5000. */
  duration?: number
  /** Maximum visible toasts; oldest is dismissed when exceeded. Default `Infinity`. */
  maxToasts?: number
  /** Where the viewport sits — drives `data-position`. CSS positions it. Default `"bottom-right"`. */
  position?: ToastPosition
  /** Viewport `aria-label`. Default `"Notifications"`. */
  label?: string
}

export interface ViewportProps {
  role: "region"
  "aria-label": string
  "data-position": ToastPosition
  tabIndex: -1
}

export interface ToastProps {
  role: "status" | "alert"
  id: string
  "data-type": ToastType
  "data-state": "open" | "closed"
  tabIndex: 0
  onMouseEnter: () => void
  onMouseLeave: () => void
  onFocus: () => void
  onBlur: () => void
}

export interface ToastCloseProps {
  type: "button"
  "aria-label": string
  onClick: (event?: { preventDefault?: () => void }) => void
}

export interface ToastActionProps {
  type: "button"
  onClick: (event?: { preventDefault?: () => void }) => void
}

export interface Toaster {
  /** Reactive list of currently rendered toasts (includes those animating out). */
  toasts: Signal<ToastItem[]>
  /** Add a toast. Returns the id (generated if not provided). */
  add: (message: string, opts?: ToastOptions) => string
  /** Dismiss a single toast (triggers exit animation, then removes). */
  dismiss: (id: string) => void
  /** Dismiss all currently visible toasts. */
  dismissAll: () => void
  /** Update message and/or options on an existing toast in place. */
  update: (id: string, patch: Partial<Omit<ToastOptions, "id">> & { message?: string }) => void
  getViewportProps: () => ViewportProps
  getToastProps: (id: string) => ToastProps
  getCloseProps: (id: string, label?: string) => ToastCloseProps
  /** Returns null when the toast has no `action`. */
  getActionProps: (id: string) => ToastActionProps | null
  /**
   * Imperatively wire the viewport element. Sets ARIA attributes and
   * installs `visibilitychange` to pause/resume timers when the tab
   * loses focus. Returns cleanup.
   */
  mount: (viewport: HTMLElement) => Unsubscribe
}

interface InternalToast {
  id: string
  message: string
  type: ToastType
  duration: number
  action: ToastAction | null
  createdAt: number
  onDismiss?: () => void
  onAutoClose?: () => void
  open: Signal<boolean>
  presence: Presence
  /** Returns the live DOM element — adapters set this via getToastProps render. */
  getElement: () => HTMLElement | null
  /** Timer state. */
  timer: {
    handle: ReturnType<typeof setTimeout> | null
    remaining: number
    startedAt: number
    paused: boolean
  }
}

const positionDefault: ToastPosition = "bottom-right"

export function createToaster(options: ToasterOptions = {}): Toaster {
  const defaultDuration = options.duration ?? 5000
  const maxToasts = options.maxToasts ?? Infinity
  const position = options.position ?? positionDefault
  const label = options.label ?? "Notifications"

  // Insertion-ordered map of all live toasts (including those unmounting).
  const items = new Map<string, InternalToast>()
  const toasts = createSignal<ToastItem[]>([])

  const sync = (): void => {
    const arr: ToastItem[] = []
    for (const t of items.values()) {
      arr.push({
        id: t.id,
        message: t.message,
        type: t.type,
        duration: t.duration,
        action: t.action,
        createdAt: t.createdAt,
      })
    }
    toasts.set(arr)
  }

  const removeFully = (id: string): void => {
    const t = items.get(id)
    if (!t) return
    cancelTimer(t)
    t.presence.destroy()
    items.delete(id)
    sync()
  }

  const cancelTimer = (t: InternalToast): void => {
    if (t.timer.handle !== null) {
      clearTimeout(t.timer.handle)
      t.timer.handle = null
    }
  }

  const startTimer = (t: InternalToast, ms: number): void => {
    cancelTimer(t)
    if (!Number.isFinite(ms) || ms <= 0) return
    t.timer.startedAt = Date.now()
    t.timer.remaining = ms
    t.timer.paused = false
    t.timer.handle = setTimeout(() => {
      t.timer.handle = null
      t.onAutoClose?.()
      dismissInternal(t.id)
    }, ms)
  }

  const pauseTimer = (t: InternalToast): void => {
    if (t.timer.paused) return
    if (t.timer.handle === null) return
    clearTimeout(t.timer.handle)
    t.timer.handle = null
    const elapsed = Date.now() - t.timer.startedAt
    t.timer.remaining = Math.max(0, t.timer.remaining - elapsed)
    t.timer.paused = true
  }

  const resumeTimer = (t: InternalToast): void => {
    if (!t.timer.paused) return
    t.timer.paused = false
    if (t.timer.remaining <= 0) return
    startTimer(t, t.timer.remaining)
  }

  const dismissInternal = (id: string): void => {
    const t = items.get(id)
    if (!t) return
    if (!t.open.get()) return
    cancelTimer(t)
    t.onDismiss?.()
    t.open.set(false)
  }

  const evictOldest = (): void => {
    if (!Number.isFinite(maxToasts)) return
    // Count only toasts that are still open; once an item's open signal flips
    // false it's already on its way out (Presence handles removal).
    const openItems = [...items.values()].filter((t) => t.open.get())
    let excess = openItems.length - maxToasts
    let i = 0
    while (excess > 0 && i < openItems.length) {
      dismissInternal(openItems[i]!.id)
      excess--
      i++
    }
  }

  const add = (message: string, opts: ToastOptions = {}): string => {
    const id = opts.id ?? createId("dokuma-toast")
    const existing = items.get(id)
    if (existing) {
      // Upsert: replace content + reset timer to the new (or default) duration.
      existing.message = message
      existing.type = opts.type ?? existing.type
      existing.action = opts.action ?? existing.action
      existing.onDismiss = opts.onDismiss ?? existing.onDismiss
      existing.onAutoClose = opts.onAutoClose ?? existing.onAutoClose
      existing.duration = opts.duration ?? existing.duration
      sync()
      startTimer(existing, existing.duration)
      return id
    }

    const open = createSignal(true)
    const elementRef: { current: HTMLElement | null } = { current: null }
    const getElement = (): HTMLElement | null => {
      if (elementRef.current) return elementRef.current
      if (!isBrowser()) return null
      elementRef.current = document.getElementById(id)
      return elementRef.current
    }
    const presence = createPresence(open, getElement)
    presence.isMounted.subscribe((mounted) => {
      if (!mounted) {
        // Element fully unmounted (animation complete) — drop from list.
        removeFully(id)
      }
    })

    const t: InternalToast = {
      id,
      message,
      type: opts.type ?? "default",
      duration: opts.duration ?? defaultDuration,
      action: opts.action ?? null,
      createdAt: Date.now(),
      onDismiss: opts.onDismiss,
      onAutoClose: opts.onAutoClose,
      open,
      presence,
      getElement,
      timer: { handle: null, remaining: 0, startedAt: 0, paused: false },
    }
    items.set(id, t)
    sync()
    evictOldest()
    startTimer(t, t.duration)
    return id
  }

  const dismiss = (id: string): void => dismissInternal(id)

  const dismissAll = (): void => {
    const ids = Array.from(items.keys())
    for (const id of ids) dismissInternal(id)
  }

  const update = (
    id: string,
    patch: Partial<Omit<ToastOptions, "id">> & { message?: string },
  ): void => {
    const t = items.get(id)
    if (!t) return
    if (patch.message !== undefined) t.message = patch.message
    if (patch.type !== undefined) t.type = patch.type
    if (patch.action !== undefined) t.action = patch.action ?? null
    if (patch.onDismiss !== undefined) t.onDismiss = patch.onDismiss
    if (patch.onAutoClose !== undefined) t.onAutoClose = patch.onAutoClose
    if (patch.duration !== undefined) {
      t.duration = patch.duration
      startTimer(t, patch.duration)
    }
    sync()
  }

  const getViewportProps = (): ViewportProps => ({
    role: "region",
    "aria-label": label,
    "data-position": position,
    tabIndex: -1,
  })

  const getToastProps = (id: string): ToastProps => {
    const t = items.get(id)
    const type: ToastType = t?.type ?? "default"
    const isOpen = t ? t.open.get() : false
    return {
      role: type === "error" ? "alert" : "status",
      id,
      "data-type": type,
      "data-state": isOpen ? "open" : "closed",
      tabIndex: 0,
      onMouseEnter: () => {
        const cur = items.get(id)
        if (cur) pauseTimer(cur)
      },
      onMouseLeave: () => {
        const cur = items.get(id)
        if (cur) resumeTimer(cur)
      },
      onFocus: () => {
        const cur = items.get(id)
        if (cur) pauseTimer(cur)
      },
      onBlur: () => {
        const cur = items.get(id)
        if (cur) resumeTimer(cur)
      },
    }
  }

  const getCloseProps = (id: string, closeLabel = "Dismiss"): ToastCloseProps => ({
    type: "button",
    "aria-label": closeLabel,
    onClick: (event) => {
      event?.preventDefault?.()
      dismissInternal(id)
    },
  })

  const getActionProps = (id: string): ToastActionProps | null => {
    const t = items.get(id)
    if (!t || !t.action) return null
    const action = t.action
    return {
      type: "button",
      onClick: (event) => {
        event?.preventDefault?.()
        action.onClick()
        dismissInternal(id)
      },
    }
  }

  const mount = (viewport: HTMLElement): Unsubscribe => {
    viewport.setAttribute("role", "region")
    viewport.setAttribute("aria-label", label)
    viewport.setAttribute("data-position", position)
    viewport.tabIndex = -1

    let releaseVis: (() => void) | null = null
    if (isBrowser()) {
      releaseVis = on(document, "visibilitychange", () => {
        if (document.hidden) {
          for (const t of items.values()) pauseTimer(t)
        } else {
          for (const t of items.values()) resumeTimer(t)
        }
      })
    }

    return () => {
      releaseVis?.()
      // Cancel pending timers but preserve toast state for unmount lifecycle.
      for (const t of items.values()) cancelTimer(t)
    }
  }

  return {
    toasts,
    add,
    dismiss,
    dismissAll,
    update,
    getViewportProps,
    getToastProps,
    getCloseProps,
    getActionProps,
    mount,
  }
}
