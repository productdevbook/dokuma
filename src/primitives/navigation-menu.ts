import { on } from "../_dom.ts"
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  type Placement,
  shift,
} from "../_floating/index.ts"
import { createId } from "../_id.ts"
import { rovingKeyDown, type Orientation } from "../_keyboard.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface NavigationMenuOptions {
  defaultValue?: string | null
  value?: () => string | null
  onValueChange?: (value: string | null) => void
  /** Default `"horizontal"`. */
  orientation?: Orientation
  /** Delay before hover-opening an item's content. Default `200`ms. */
  delayDuration?: number
  /** Delay before closing after pointer leaves. Default `300`ms. */
  skipDelayDuration?: number
  /** Default `true`. Arrow nav wraps. */
  loopFocus?: boolean
  /** Default `"bottom"` — placement for each item's content. */
  placement?: Placement
  /** Gap between trigger and content. Default `4`. */
  sideOffset?: number
  /** Default `8`. */
  collisionPadding?: number
}

export interface NavigationMenuItemHandle {
  id: string
  value: string
  triggerId: string
  contentId: string
  open: () => void
  close: () => void
  isOpen: () => boolean
  unregister: () => void
}

export interface NavigationMenuItemOptions {
  /** Stable value — used by `value` signal to track which item is active. */
  value: string
  disabled?: () => boolean
  onOpenChange?: (open: boolean) => void
}

export interface NavigationMenuRootProps {
  role: "navigation"
  "data-orientation": Orientation
}

export interface NavigationMenuListProps {
  role: "menubar"
  "aria-orientation": Orientation
  "data-orientation": Orientation
}

export interface NavigationMenuItemRootProps {
  id: string
  "data-state": "open" | "closed"
}

export interface NavigationMenuTriggerProps {
  type: "button"
  id: string
  "aria-expanded": "true" | "false"
  "aria-controls": string
  "data-state": "open" | "closed"
}

export interface NavigationMenuContentProps {
  id: string
  role: "menu"
  "aria-labelledby": string
  "data-state": "open" | "closed"
}

export interface NavigationMenu {
  orientation: Orientation
  value: Signal<string | null>
  /** Currently-open item value, or null. Same as value for single-active model. */
  openValue: Signal<string | null>

  getRootProps: () => NavigationMenuRootProps
  getListProps: () => NavigationMenuListProps

  registerItem: (options: NavigationMenuItemOptions) => NavigationMenuItemHandle
  registerTrigger: (item: NavigationMenuItemHandle, el: HTMLElement) => Unsubscribe
  registerContent: (item: NavigationMenuItemHandle, el: HTMLElement) => Unsubscribe
  /** Attach the menubar root (`<ul>`) for arrow navigation. */
  mount: (listEl: HTMLElement) => Unsubscribe
}

interface InternalItem {
  handle: NavigationMenuItemHandle
  triggerEl: HTMLElement | null
  contentEl: HTMLElement | null
  disabled?: () => boolean
  onOpenChange?: (open: boolean) => void
  cleanupAuto: (() => void) | null
}

export function createNavigationMenu(options: NavigationMenuOptions = {}): NavigationMenu {
  const orientation: Orientation = options.orientation ?? "horizontal"
  const loopFocus = options.loopFocus ?? true
  const delayDuration = options.delayDuration ?? 200
  const skipDelayDuration = options.skipDelayDuration ?? 300
  const placement = options.placement ?? "bottom"
  const sideOffset = options.sideOffset ?? 4
  const collisionPadding = options.collisionPadding ?? 8

  const isControlled = typeof options.value === "function"
  const internal = createSignal<string | null>(options.defaultValue ?? null)
  const read = (): string | null =>
    isControlled ? (options.value as () => string | null)() : internal.get()
  const subs = new Set<(v: string | null) => void>()
  const value: Signal<string | null> = {
    get: read,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (p: string | null) => string | null)(read()) : next
      if (resolved === read()) return
      if (!isControlled) internal.set(resolved)
      options.onValueChange?.(resolved)
      for (const fn of subs) fn(resolved)
    },
    subscribe: (fn) => {
      subs.add(fn)
      return () => subs.delete(fn)
    },
  }

  const openValue = value

  const items: InternalItem[] = []

  const setOpen = (internal: InternalItem | null): void => {
    value.set(internal?.handle.value ?? null)
    for (const it of items) {
      const nowOpen = it === internal
      it.onOpenChange?.(nowOpen)
      it.triggerEl?.setAttribute("aria-expanded", nowOpen ? "true" : "false")
      it.triggerEl?.setAttribute("data-state", nowOpen ? "open" : "closed")
      if (it.contentEl) {
        it.contentEl.setAttribute("data-state", nowOpen ? "open" : "closed")
        it.contentEl.style.display = nowOpen ? "" : "none"
      }
    }
  }

  const closeAll = (): void => setOpen(null)

  const registerItem: NavigationMenu["registerItem"] = (opts) => {
    const id = createId("navmenu-item")
    const triggerId = `${id}-trigger`
    const contentId = `${id}-content`
    const handle: NavigationMenuItemHandle = {
      id,
      value: opts.value,
      triggerId,
      contentId,
      open: () => setOpen(internal),
      close: () => {
        if (read() === opts.value) setOpen(null)
      },
      isOpen: () => read() === opts.value,
      unregister: () => {
        const idx = items.indexOf(internal)
        if (idx >= 0) items.splice(idx, 1)
        if (read() === opts.value) setOpen(null)
      },
    }
    const internal: InternalItem = {
      handle,
      triggerEl: null,
      contentEl: null,
      disabled: opts.disabled,
      onOpenChange: opts.onOpenChange,
      cleanupAuto: null,
    }
    items.push(internal)
    return handle
  }

  // --- hover intent timers ---
  let openTimer: ReturnType<typeof setTimeout> | null = null
  let closeTimer: ReturnType<typeof setTimeout> | null = null

  const scheduleOpen = (internal: InternalItem): void => {
    if (closeTimer) {
      clearTimeout(closeTimer)
      closeTimer = null
    }
    // Fast switch: if something is already open, swap immediately.
    if (read() !== null) {
      setOpen(internal)
      return
    }
    if (openTimer) clearTimeout(openTimer)
    openTimer = setTimeout(() => {
      openTimer = null
      setOpen(internal)
    }, delayDuration)
  }

  const scheduleClose = (): void => {
    if (openTimer) {
      clearTimeout(openTimer)
      openTimer = null
    }
    if (closeTimer) clearTimeout(closeTimer)
    closeTimer = setTimeout(() => {
      closeTimer = null
      closeAll()
    }, skipDelayDuration)
  }

  const registerTrigger: NavigationMenu["registerTrigger"] = (itemHandle, el) => {
    const internal = items.find((it) => it.handle === itemHandle)
    if (!internal) return () => {}
    internal.triggerEl = el
    el.id ||= itemHandle.triggerId
    el.setAttribute("aria-controls", itemHandle.contentId)
    el.setAttribute("aria-expanded", "false")
    el.setAttribute("data-state", "closed")

    const offClick = on(el, "click", () => {
      if (internal.disabled?.()) return
      if (read() === itemHandle.value) setOpen(null)
      else setOpen(internal)
    })
    const offEnter = on(el, "pointerenter", () => {
      if (internal.disabled?.()) return
      scheduleOpen(internal)
    })
    const offLeave = on(el, "pointerleave", scheduleClose)
    const offFocus = on(el, "focus", () => {
      if (internal.disabled?.()) return
      // Focus moves don't auto-open; only hover/click.
    })

    return () => {
      offClick()
      offEnter()
      offLeave()
      offFocus()
      internal.cleanupAuto?.()
      internal.cleanupAuto = null
      internal.triggerEl = null
    }
  }

  const updateContentPosition = async (internal: InternalItem): Promise<void> => {
    if (!internal.triggerEl || !internal.contentEl) return
    const result = await computePosition(internal.triggerEl, internal.contentEl, {
      placement,
      middleware: [
        offset(sideOffset),
        flip({ padding: collisionPadding }),
        shift({ padding: collisionPadding }),
      ],
    })
    const c = internal.contentEl
    c.style.position = "absolute"
    c.style.left = `${result.x}px`
    c.style.top = `${result.y}px`
    c.setAttribute("data-placement", result.placement)
  }

  const registerContent: NavigationMenu["registerContent"] = (itemHandle, el) => {
    const internal = items.find((it) => it.handle === itemHandle)
    if (!internal) return () => {}
    internal.contentEl = el
    el.id ||= itemHandle.contentId
    el.setAttribute("role", "menu")
    el.setAttribute("aria-labelledby", itemHandle.triggerId)
    el.setAttribute("data-state", "closed")
    el.style.display = "none"

    const offEnter = on(el, "pointerenter", () => {
      if (closeTimer) {
        clearTimeout(closeTimer)
        closeTimer = null
      }
    })
    const offLeave = on(el, "pointerleave", scheduleClose)

    const applyState = (v: string | null): void => {
      const isOpen = v === itemHandle.value
      if (isOpen) {
        internal.cleanupAuto?.()
        internal.cleanupAuto = autoUpdate(internal.triggerEl!, el, () => {
          void updateContentPosition(internal)
        })
      } else {
        internal.cleanupAuto?.()
        internal.cleanupAuto = null
      }
    }

    applyState(read())
    const unValue = value.subscribe(applyState)

    return () => {
      offEnter()
      offLeave()
      unValue()
      internal.cleanupAuto?.()
      internal.cleanupAuto = null
      internal.contentEl = null
    }
  }

  const getRootProps = (): NavigationMenuRootProps => ({
    role: "navigation",
    "data-orientation": orientation,
  })

  const getListProps = (): NavigationMenuListProps => ({
    role: "menubar",
    "aria-orientation": orientation,
    "data-orientation": orientation,
  })

  const mount: NavigationMenu["mount"] = (listEl) => {
    listEl.setAttribute("role", "menubar")
    listEl.setAttribute("aria-orientation", orientation)
    listEl.setAttribute("data-orientation", orientation)

    const enabledTriggers = (): HTMLElement[] =>
      items
        .filter((it) => it.triggerEl && !(it.disabled?.() ?? false))
        .map((it) => it.triggerEl!) as HTMLElement[]

    const offKeyDown = on(listEl, "keydown", (event) => {
      const ke = event as KeyboardEvent
      const triggers = enabledTriggers()
      if (!triggers.length) return

      if (ke.key === "Escape") {
        if (read()) closeAll()
        return
      }

      const current = triggers.find((t) => t === document.activeElement) ?? null
      const target = rovingKeyDown(triggers, current, orientation, {
        key: ke.key,
        preventDefault: () => ke.preventDefault(),
      })
      if (!target) return

      if (!loopFocus) {
        const idx = triggers.indexOf(current ?? triggers[0])
        const tIdx = triggers.indexOf(target)
        if (idx === triggers.length - 1 && tIdx === 0) return
        if (idx === 0 && tIdx === triggers.length - 1) return
      }

      ke.preventDefault()
      target.focus()
    })

    return () => {
      offKeyDown()
      if (openTimer) clearTimeout(openTimer)
      if (closeTimer) clearTimeout(closeTimer)
    }
  }

  return {
    orientation,
    value,
    openValue,
    getRootProps,
    getListProps,
    registerItem,
    registerTrigger,
    registerContent,
    mount,
  }
}
