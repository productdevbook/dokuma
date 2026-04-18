import { on } from "../_dom.ts"
import { createId } from "../_id.ts"
import { rovingKeyDown, type Orientation } from "../_keyboard.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface MenubarOptions {
  /** Default `"horizontal"`. */
  orientation?: Orientation
  /** Default `true`. Wrap focus at each end. */
  loopFocus?: boolean
  /** Default `false`. */
  disabled?: boolean
  /** Optional aria-label. */
  "aria-label"?: string
  /** Optional aria-labelledby. */
  "aria-labelledby"?: string
}

export interface MenubarMenuHandle {
  id: string
  /** Trigger element registered via `registerTrigger`. */
  triggerEl: HTMLElement | null
  /** Programmatically activate (open) this menu. */
  open: () => void
  /** Programmatically close this menu. */
  close: () => void
  isOpen: () => boolean
  unregister: () => void
}

export interface MenubarRegisterMenuOptions {
  onOpenChange?: (open: boolean) => void
  disabled?: () => boolean
}

export interface MenubarRootProps {
  role: "menubar"
  "aria-orientation": Orientation
  "data-orientation": Orientation
  "aria-label"?: string
  "aria-labelledby"?: string
  "data-disabled"?: ""
}

export interface Menubar {
  orientation: Orientation
  disabled: Signal<boolean>
  /** Index of the currently focused menu, or -1. */
  activeIndex: Signal<number>
  /** Currently-open menu, if any. */
  openMenuId: Signal<string | null>
  getRootProps: () => MenubarRootProps
  /** Register a child menu — call once per `<Menu>` inside the menubar. */
  registerMenu: (options?: MenubarRegisterMenuOptions) => MenubarMenuHandle
  /**
   * Link a trigger DOM element to a menu handle so roving navigation +
   * open-on-hover-while-active works. Returns cleanup.
   */
  registerTrigger: (menu: MenubarMenuHandle, el: HTMLElement) => Unsubscribe
  /** Attach the menubar root for keyboard navigation. Returns cleanup. */
  mount: (root: HTMLElement) => Unsubscribe
}

interface InternalMenu {
  handle: MenubarMenuHandle
  triggerEl: HTMLElement | null
  disabled?: () => boolean
  onOpenChange?: (open: boolean) => void
  open: boolean
}

export function createMenubar(options: MenubarOptions = {}): Menubar {
  const orientation: Orientation = options.orientation ?? "horizontal"
  const loopFocus = options.loopFocus ?? true
  const disabled = createSignal(options.disabled ?? false)
  const activeIndex = createSignal(-1)
  const openMenuId = createSignal<string | null>(null)

  const menus: InternalMenu[] = []

  const enabledTriggers = (): HTMLElement[] =>
    menus
      .filter((m) => m.triggerEl && !(m.disabled?.() ?? false) && !disabled.get())
      .map((m) => m.triggerEl!) as HTMLElement[]

  const applyTabIndexes = (): void => {
    const active = activeIndex.get()
    const activeEl = active >= 0 ? menus[active]?.triggerEl : (enabledTriggers()[0] ?? null)
    for (const m of menus) {
      if (!m.triggerEl) continue
      const hardDisabled = (m.disabled?.() ?? false) || disabled.get()
      m.triggerEl.tabIndex = hardDisabled ? -1 : m.triggerEl === activeEl ? 0 : -1
    }
  }

  const setOpenMenu = (menu: InternalMenu | null): void => {
    for (const m of menus) {
      const shouldOpen = m === menu
      if (m.open !== shouldOpen) {
        m.open = shouldOpen
        m.onOpenChange?.(shouldOpen)
      }
    }
    openMenuId.set(menu?.handle.id ?? null)
  }

  const registerMenu: Menubar["registerMenu"] = (menuOptions = {}) => {
    const id = createId("menubar-menu")
    const internal: InternalMenu = {
      handle: null as unknown as MenubarMenuHandle,
      triggerEl: null,
      disabled: menuOptions.disabled,
      onOpenChange: menuOptions.onOpenChange,
      open: false,
    }
    const handle: MenubarMenuHandle = {
      id,
      get triggerEl() {
        return internal.triggerEl
      },
      open: () => setOpenMenu(internal),
      close: () => {
        if (internal.open) setOpenMenu(null)
      },
      isOpen: () => internal.open,
      unregister: () => {
        const idx = menus.indexOf(internal)
        if (idx >= 0) menus.splice(idx, 1)
        if (openMenuId.get() === id) openMenuId.set(null)
        applyTabIndexes()
      },
    }
    internal.handle = handle
    menus.push(internal)
    applyTabIndexes()
    return handle
  }

  const registerTrigger: Menubar["registerTrigger"] = (menuHandle, el) => {
    const internal = menus.find((m) => m.handle === menuHandle)
    if (!internal) return () => {}
    internal.triggerEl = el
    el.setAttribute("role", "menuitem")
    el.setAttribute("aria-haspopup", "menu")

    const applyExpanded = (): void => {
      el.setAttribute("aria-expanded", internal.open ? "true" : "false")
    }

    const offFocus = on(el, "focus", () => {
      const idx = menus.indexOf(internal)
      if (idx >= 0) activeIndex.set(idx)
      applyTabIndexes()
    })
    const offClick = on(el, "click", () => {
      if (disabled.get() || internal.disabled?.()) return
      if (internal.open) setOpenMenu(null)
      else setOpenMenu(internal)
    })
    const offPointerEnter = on(el, "pointerenter", () => {
      if (!openMenuId.get()) return
      // Any open menu → switch on hover (APG menubar pattern).
      setOpenMenu(internal)
      el.focus()
    })

    applyExpanded()
    applyTabIndexes()
    const unOpenId = openMenuId.subscribe(applyExpanded)

    return () => {
      offFocus()
      offClick()
      offPointerEnter()
      unOpenId()
      internal.triggerEl = null
    }
  }

  const getRootProps = (): MenubarRootProps => {
    const props: MenubarRootProps = {
      role: "menubar",
      "aria-orientation": orientation,
      "data-orientation": orientation,
    }
    if (options["aria-label"]) props["aria-label"] = options["aria-label"]
    if (options["aria-labelledby"]) props["aria-labelledby"] = options["aria-labelledby"]
    if (disabled.get()) props["data-disabled"] = ""
    return props
  }

  const mount: Menubar["mount"] = (root) => {
    const apply = (): void => {
      root.setAttribute("role", "menubar")
      root.setAttribute("aria-orientation", orientation)
      root.setAttribute("data-orientation", orientation)
      if (options["aria-label"]) root.setAttribute("aria-label", options["aria-label"])
      if (options["aria-labelledby"]) {
        root.setAttribute("aria-labelledby", options["aria-labelledby"])
      }
      if (disabled.get()) root.setAttribute("data-disabled", "")
      else root.removeAttribute("data-disabled")
      applyTabIndexes()
    }

    const offKeyDown = on(root, "keydown", (event) => {
      const ke = event as KeyboardEvent
      const triggers = enabledTriggers()
      if (!triggers.length) return

      if (ke.key === "Escape") {
        if (openMenuId.get()) setOpenMenu(null)
        return
      }

      const current = triggers.find((t) => t === document.activeElement) ?? null
      const target = rovingKeyDown(triggers, current, orientation, {
        key: ke.key,
        preventDefault: () => ke.preventDefault(),
      })
      if (!target) {
        // Arrow on the cross axis (Down on horizontal menubar) opens the menu.
        const openKey = orientation === "horizontal" ? "ArrowDown" : "ArrowRight"
        if (ke.key === openKey && current) {
          const internal = menus.find((m) => m.triggerEl === current)
          if (internal) {
            ke.preventDefault()
            setOpenMenu(internal)
          }
        }
        return
      }

      if (!loopFocus) {
        const idx = triggers.indexOf(current ?? triggers[0])
        const tIdx = triggers.indexOf(target)
        if (idx === triggers.length - 1 && tIdx === 0) return
        if (idx === 0 && tIdx === triggers.length - 1) return
      }

      ke.preventDefault()
      target.focus()
      // If a menu is already open, opening follows focus (APG pattern).
      if (openMenuId.get()) {
        const internal = menus.find((m) => m.triggerEl === target)
        if (internal) setOpenMenu(internal)
      }
    })

    apply()
    const un = disabled.subscribe(apply)

    return () => {
      offKeyDown()
      un()
    }
  }

  return {
    orientation,
    disabled,
    activeIndex,
    openMenuId,
    getRootProps,
    registerMenu,
    registerTrigger,
    mount,
  }
}
