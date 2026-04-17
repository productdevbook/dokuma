import { isBrowser, on } from "../_dom.ts"
import { createId } from "../_id.ts"
import { pushDismissibleLayer } from "../_layers.ts"
import { autoPosition, type Align, type PositionOptions, type Side } from "../_position.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface MenuOptions extends PositionOptions {
  defaultOpen?: boolean
  open?: () => boolean
  onOpenChange?: (open: boolean) => void
  /** Default `true`. Pressing Escape calls `hide()`. */
  closeOnEscape?: boolean
  /** Default `true`. Mousedown outside menu closes. */
  closeOnOutsideClick?: boolean
  /** Default `true`. After `select()`, the menu closes. */
  closeOnSelect?: boolean
  /** Default `true`. */
  loop?: boolean
  /** Default `true`. Returns focus to the trigger on close. */
  restoreFocus?: boolean
}

export interface RegisterMenuItemOptions {
  disabled?: () => boolean
  /** Optional callback fired when this item is selected (click, Enter, Space). */
  onSelect?: () => void
  /** Optional label for typeahead. Falls back to `value`. */
  label?: string
}

export interface MenuItemHandle {
  value: string
  itemId: string
  unregister: () => void
}

export interface MenuTriggerProps {
  type: "button"
  id: string
  "aria-haspopup": "menu"
  "aria-expanded": "true" | "false"
  "aria-controls": string
  "data-state": "open" | "closed"
  onClick: (event?: { preventDefault?: () => void }) => void
  onKeyDown: (event: { key: string; preventDefault?: () => void }) => void
}

export interface MenuContentProps {
  role: "menu"
  id: string
  "aria-labelledby": string
  "data-state": "open" | "closed"
  "data-side": Side
  "data-align": Align
  tabIndex: -1
  onKeyDown: (event: { key: string; preventDefault?: () => void }) => void
}

export interface MenuItemProps {
  type: "button"
  role: "menuitem"
  id: string
  "aria-disabled"?: boolean
  "data-disabled"?: boolean
  "data-highlighted"?: boolean
  tabIndex: -1
  onClick: (event?: { preventDefault?: () => void }) => void
  onMouseEnter: () => void
}

export interface Menu {
  open: Signal<boolean>
  contentId: string
  triggerId: string
  highlighted: Signal<string>
  show: () => void
  hide: () => void
  toggle: () => void
  registerItem: (value: string, opts?: RegisterMenuItemOptions) => MenuItemHandle
  hasItem: (value: string) => boolean
  isItemDisabled: (value: string) => boolean
  setHighlighted: (value: string) => void
  /** Programmatically select an item (calls onSelect, closes if `closeOnSelect`). */
  select: (value: string) => void
  getTriggerProps: () => MenuTriggerProps
  getContentProps: () => MenuContentProps
  getItemProps: (value: string) => MenuItemProps
  /**
   * Imperatively wire trigger + content. Returns cleanup.
   *
   * @remarks Submenus are not yet supported — track in a follow-up.
   */
  mount: (els: { trigger: HTMLElement; content: HTMLElement }) => Unsubscribe
}

interface InternalItem {
  value: string
  itemId: string
  disabled?: () => boolean
  onSelect?: () => void
  label?: string
}

export function createMenu(options: MenuOptions = {}): Menu {
  const triggerId = createId("dokuma-menu-trigger")
  const contentId = createId("dokuma-menu")
  const closeOnEscape = options.closeOnEscape ?? true
  const closeOnOutsideClick = options.closeOnOutsideClick ?? true
  const closeOnSelect = options.closeOnSelect ?? true
  const loop = options.loop ?? true
  const restoreFocus = options.restoreFocus ?? true
  const isControlled = typeof options.open === "function"

  const internalOpen = createSignal(options.defaultOpen ?? false)
  const items = new Map<string, InternalItem>()
  const subscribers = new Set<(v: boolean) => void>()
  const highlightedInternal = createSignal<string>("")
  const highlightedSubs = new Set<(v: string) => void>()

  let resolvedSide: Side = options.side ?? "bottom"
  let resolvedAlign: Align = options.align ?? "start"
  let lastFocused: HTMLElement | null = null
  // "first" | "last" — set by trigger keydown before show(); read after open.
  let focusIntent: "first" | "last" = "first"

  const readOpen = (): boolean =>
    isControlled ? (options.open as () => boolean)() : internalOpen.get()

  const open: Signal<boolean> = {
    get: readOpen,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: boolean) => boolean)(readOpen()) : next
      if (resolved === readOpen()) return
      if (!isControlled) internalOpen.set(resolved)
      options.onOpenChange?.(resolved)
      for (const fn of subscribers) fn(resolved)
    },
    subscribe: (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
  }

  const highlighted: Signal<string> = {
    get: highlightedInternal.get,
    set: (next) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: string) => string)(highlightedInternal.get())
          : next
      if (resolved === highlightedInternal.get()) return
      highlightedInternal.set(resolved)
      for (const fn of highlightedSubs) fn(resolved)
    },
    subscribe: (fn) => {
      highlightedSubs.add(fn)
      return () => highlightedSubs.delete(fn)
    },
  }

  const setHighlighted = (value: string): void => highlighted.set(value)

  const show = (): void => {
    if (readOpen()) return
    if (isBrowser() && restoreFocus) {
      lastFocused = document.activeElement as HTMLElement | null
    }
    open.set(true)
  }
  const hide = (): void => {
    if (!readOpen()) return
    highlighted.set("")
    open.set(false)
  }
  const toggle = (): void => (readOpen() ? hide() : show())

  const isItemDisabled = (v: string): boolean => items.get(v)?.disabled?.() ?? false
  const hasItem = (v: string): boolean => items.has(v)

  const registerItem = (value: string, opts: RegisterMenuItemOptions = {}): MenuItemHandle => {
    const existing = items.get(value)
    if (existing) {
      existing.disabled = opts.disabled
      existing.onSelect = opts.onSelect
      existing.label = opts.label
      return {
        value,
        itemId: existing.itemId,
        unregister: () => unregisterItem(value),
      }
    }
    const item: InternalItem = {
      value,
      itemId: createId("dokuma-menu-item"),
      disabled: opts.disabled,
      onSelect: opts.onSelect,
      label: opts.label,
    }
    items.set(value, item)
    return {
      value,
      itemId: item.itemId,
      unregister: () => unregisterItem(value),
    }
  }
  const unregisterItem = (value: string): void => {
    items.delete(value)
    if (highlighted.get() === value) highlighted.set("")
  }

  const requireItem = (v: string): InternalItem => {
    const item = items.get(v)
    if (!item)
      throw new Error(`dokuma: menu item "${v}" was not registered. Call registerItem first.`)
    return item
  }

  const select = (value: string): void => {
    if (isItemDisabled(value)) return
    const item = items.get(value)
    item?.onSelect?.()
    if (closeOnSelect) hide()
  }

  // --- keyboard helpers ----------------------------------------------------

  const orderedItems = (): InternalItem[] => [...items.values()]
  const enabledItems = (): InternalItem[] =>
    orderedItems().filter((it) => !(it.disabled?.() ?? false))

  const focusValue = (value: string): void => {
    setHighlighted(value)
    if (typeof document === "undefined") return
    const item = items.get(value)
    if (!item) return
    const el = document.getElementById(item.itemId) as HTMLElement | null
    el?.focus()
  }

  const focusFirst = (): void => {
    const list = enabledItems()
    if (list.length) focusValue(list[0]!.value)
  }
  const focusLast = (): void => {
    const list = enabledItems()
    if (list.length) focusValue(list[list.length - 1]!.value)
  }
  const focusNext = (): void => {
    const list = enabledItems()
    if (!list.length) return
    const cur = highlighted.get()
    const idx = list.findIndex((it) => it.value === cur)
    if (idx < 0) {
      focusValue(list[0]!.value)
      return
    }
    if (idx === list.length - 1) {
      if (loop) focusValue(list[0]!.value)
      return
    }
    focusValue(list[idx + 1]!.value)
  }
  const focusPrev = (): void => {
    const list = enabledItems()
    if (!list.length) return
    const cur = highlighted.get()
    const idx = list.findIndex((it) => it.value === cur)
    if (idx < 0) {
      focusValue(list[list.length - 1]!.value)
      return
    }
    if (idx === 0) {
      if (loop) focusValue(list[list.length - 1]!.value)
      return
    }
    focusValue(list[idx - 1]!.value)
  }

  // typeahead
  let typeaheadBuffer = ""
  let typeaheadTimer: ReturnType<typeof setTimeout> | null = null
  const typeahead = (key: string): boolean => {
    if (key.length !== 1) return false
    if (typeaheadTimer) clearTimeout(typeaheadTimer)
    typeaheadBuffer += key.toLowerCase()
    typeaheadTimer = setTimeout(() => {
      typeaheadBuffer = ""
    }, 500)
    const list = enabledItems()
    const match = list.find((it) =>
      (it.label ?? it.value).toLowerCase().startsWith(typeaheadBuffer),
    )
    if (match) {
      focusValue(match.value)
      return true
    }
    return false
  }

  // --- prop getters --------------------------------------------------------

  const handleTriggerClick = (event?: { preventDefault?: () => void }): void => {
    event?.preventDefault?.()
    toggle()
  }

  const handleTriggerKeyDown = (event: { key: string; preventDefault?: () => void }): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault?.()
      focusIntent = "first"
      show()
    } else if (event.key === "ArrowUp") {
      event.preventDefault?.()
      focusIntent = "last"
      show()
    }
  }

  const handleContentKeyDown = (event: { key: string; preventDefault?: () => void }): void => {
    const key = event.key
    if (key === "Tab") {
      // Per WAI-ARIA, Tab from a menu closes it and lets focus move on naturally.
      hide()
      return
    }
    if (key === "ArrowDown") {
      event.preventDefault?.()
      focusNext()
      return
    }
    if (key === "ArrowUp") {
      event.preventDefault?.()
      focusPrev()
      return
    }
    if (key === "Home") {
      event.preventDefault?.()
      focusFirst()
      return
    }
    if (key === "End") {
      event.preventDefault?.()
      focusLast()
      return
    }
    if (key === "Enter" || key === " ") {
      const v = highlighted.get()
      if (v) {
        event.preventDefault?.()
        select(v)
      }
      return
    }
    typeahead(key)
  }

  const getTriggerProps = (): MenuTriggerProps => {
    const isOpen = readOpen()
    return {
      type: "button",
      id: triggerId,
      "aria-haspopup": "menu",
      "aria-expanded": isOpen ? "true" : "false",
      "aria-controls": contentId,
      "data-state": isOpen ? "open" : "closed",
      onClick: handleTriggerClick,
      onKeyDown: handleTriggerKeyDown,
    }
  }

  const getContentProps = (): MenuContentProps => ({
    role: "menu",
    id: contentId,
    "aria-labelledby": triggerId,
    "data-state": readOpen() ? "open" : "closed",
    "data-side": resolvedSide,
    "data-align": resolvedAlign,
    tabIndex: -1,
    onKeyDown: handleContentKeyDown,
  })

  const getItemProps = (value: string): MenuItemProps => {
    const item = requireItem(value)
    const disabled = isItemDisabled(value)
    const isHighlighted = highlighted.get() === value
    const props: MenuItemProps = {
      type: "button",
      role: "menuitem",
      id: item.itemId,
      tabIndex: -1,
      onClick: (event) => {
        event?.preventDefault?.()
        if (disabled) return
        select(value)
      },
      onMouseEnter: () => {
        if (disabled) return
        focusValue(value)
      },
    }
    if (disabled) {
      props["aria-disabled"] = true
      props["data-disabled"] = true
    }
    if (isHighlighted) props["data-highlighted"] = true
    return props
  }

  // --- mount ---------------------------------------------------------------

  const mount = (els: { trigger: HTMLElement; content: HTMLElement }): Unsubscribe => {
    const { trigger, content } = els
    let releasePosition: (() => void) | null = null
    let releaseEscape: (() => void) | null = null
    let releaseOutside: (() => void) | null = null

    const apply = (): void => {
      const isOpen = readOpen()
      trigger.setAttribute("type", "button")
      trigger.id = triggerId
      trigger.setAttribute("aria-haspopup", "menu")
      trigger.setAttribute("aria-expanded", isOpen ? "true" : "false")
      trigger.setAttribute("aria-controls", contentId)
      trigger.setAttribute("data-state", isOpen ? "open" : "closed")

      content.id = contentId
      content.setAttribute("role", "menu")
      content.setAttribute("aria-labelledby", triggerId)
      content.setAttribute("data-state", isOpen ? "open" : "closed")
      content.setAttribute("data-side", resolvedSide)
      content.setAttribute("data-align", resolvedAlign)
      content.tabIndex = -1
    }

    const teardownOpenSideEffects = (): void => {
      releasePosition?.()
      releaseEscape?.()
      releaseOutside?.()
      releasePosition = null
      releaseEscape = null
      releaseOutside = null
    }

    const setupOpenSideEffects = (): void => {
      teardownOpenSideEffects()
      content.style.position = "fixed"
      content.style.top = "0"
      content.style.left = "0"
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

      if (closeOnEscape) {
        releaseEscape = pushDismissibleLayer(() => {
          hide()
          queueMicrotask(() => trigger.focus())
        })
      }

      if (closeOnOutsideClick) {
        releaseOutside = on(document, "mousedown", (e) => {
          const target = e.target as Node
          if (content.contains(target)) return
          if (trigger.contains(target)) return
          hide()
        })
      }

      // After mount + position, focus the first/last item.
      queueMicrotask(() => {
        if (focusIntent === "last") focusLast()
        else focusFirst()
        focusIntent = "first"
      })
    }

    apply()
    trigger.addEventListener("click", handleTriggerClick as EventListener)
    const triggerKeyDown = (e: KeyboardEvent): void => handleTriggerKeyDown(e)
    trigger.addEventListener("keydown", triggerKeyDown)
    const contentKeyDown = (e: KeyboardEvent): void => handleContentKeyDown(e)
    content.addEventListener("keydown", contentKeyDown)

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

    // Keep DOM data-highlighted attribute in sync without touching getItemProps.
    const unsubHi = highlighted.subscribe(() => {
      for (const item of items.values()) {
        const el = document.getElementById(item.itemId)
        if (!el) continue
        if (highlighted.get() === item.value) el.setAttribute("data-highlighted", "")
        else el.removeAttribute("data-highlighted")
      }
    })

    return () => {
      unsub()
      unsubHi()
      teardownOpenSideEffects()
      trigger.removeEventListener("click", handleTriggerClick as EventListener)
      trigger.removeEventListener("keydown", triggerKeyDown)
      content.removeEventListener("keydown", contentKeyDown)
      if (typeaheadTimer) clearTimeout(typeaheadTimer)
    }
  }

  return {
    open,
    contentId,
    triggerId,
    highlighted,
    show,
    hide,
    toggle,
    registerItem,
    hasItem,
    isItemDisabled,
    setHighlighted,
    select,
    getTriggerProps,
    getContentProps,
    getItemProps,
    mount,
  }
}
