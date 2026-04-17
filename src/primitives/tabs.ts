import { applyAttrs, type AriaProps } from "../_aria.ts"
import { createId } from "../_id.ts"
import { rovingKeyDown, type KeyboardLikeEvent, type Orientation } from "../_keyboard.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export type TabsActivationMode = "automatic" | "manual"

export interface TabsOptions {
  defaultValue?: string
  /** Controlled value getter. */
  value?: () => string
  onValueChange?: (value: string) => void
  /** Default `"horizontal"`. */
  orientation?: Orientation
  /** `"automatic"` (default): arrow keys move focus AND select. `"manual"`: arrows move focus only; Space/Enter selects. */
  activationMode?: TabsActivationMode
  /** Default `true`. Arrow navigation wraps at the ends. */
  loop?: boolean
  /** Root-level disable. */
  disabled?: () => boolean
}

export interface RegisterTabOptions {
  disabled?: () => boolean
}

export interface TabHandle {
  value: string
  tabId: string
  panelId: string
  unregister: () => void
}

export interface TabsRootProps {
  "data-orientation": Orientation
}

export interface TabsListProps {
  role: "tablist"
  "aria-orientation": Orientation
  "data-orientation": Orientation
}

export interface TabProps {
  type: "button"
  role: "tab"
  id: string
  "aria-selected": boolean
  "aria-controls": string
  "aria-disabled"?: boolean
  "data-state": "active" | "inactive"
  "data-disabled"?: boolean
  "data-orientation": Orientation
  tabIndex: 0 | -1
  onClick: (event?: { preventDefault?: () => void }) => void
  onKeyDown: (event: KeyboardLikeEvent) => void
}

export interface TabPanelProps {
  role: "tabpanel"
  id: string
  "aria-labelledby": string
  hidden: boolean
  tabIndex: 0
  "data-state": "active" | "inactive"
  "data-orientation": Orientation
}

export interface Tabs {
  value: Signal<string>
  orientation: Orientation
  activationMode: TabsActivationMode
  isDisabled: () => boolean
  registerTab: (value: string, opts?: RegisterTabOptions) => TabHandle
  hasTab: (value: string) => boolean
  isTabDisabled: (value: string) => boolean
  isSelected: (value: string) => boolean
  select: (value: string) => void
  getRootProps: () => TabsRootProps
  getListProps: () => TabsListProps
  getTabProps: (value: string) => TabProps
  getPanelProps: (value: string) => TabPanelProps
  /**
   * Imperative DOM wiring. Auto-discovers `[data-dokuma-tabs-tab="<value>"]` and
   * `[data-dokuma-tabs-panel="<value>"]` descendants of the root. Returns cleanup.
   */
  mount: (root: HTMLElement) => Unsubscribe
  /** Notify subscribers without changing state — used by adapters when `value` prop changes externally. */
  notify: () => void
}

interface InternalTab {
  value: string
  tabId: string
  panelId: string
  disabled?: () => boolean
}

export function createTabs(options: TabsOptions = {}): Tabs {
  const orientation: Orientation = options.orientation ?? "horizontal"
  const activationMode: TabsActivationMode = options.activationMode ?? "automatic"
  const loop = options.loop ?? true
  const isControlled = typeof options.value === "function"

  const internal = createSignal<string>(options.defaultValue ?? "")
  const tabs = new Map<string, InternalTab>()
  const subscribers = new Set<(v: string) => void>()

  const readValue = (): string =>
    isControlled ? ((options.value as () => string)() ?? "") : internal.get()

  const value: Signal<string> = {
    get: readValue,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: string) => string)(readValue()) : next
      if (resolved === readValue()) return
      if (!isControlled) internal.set(resolved)
      options.onValueChange?.(resolved)
      for (const fn of subscribers) fn(resolved)
    },
    subscribe: (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
  }

  const isDisabled = (): boolean => options.disabled?.() ?? false

  const isTabDisabled = (v: string): boolean => {
    if (isDisabled()) return true
    return tabs.get(v)?.disabled?.() ?? false
  }

  const hasTab = (v: string): boolean => tabs.has(v)
  const isSelected = (v: string): boolean => readValue() === v

  const select = (v: string): void => {
    if (isTabDisabled(v)) return
    value.set(v)
  }

  const notify = (): void => {
    const v = readValue()
    for (const fn of subscribers) fn(v)
  }

  const registerTab = (v: string, opts: RegisterTabOptions = {}): TabHandle => {
    const existing = tabs.get(v)
    if (existing) {
      existing.disabled = opts.disabled
      return {
        value: v,
        tabId: existing.tabId,
        panelId: existing.panelId,
        unregister: () => unregisterTab(v),
      }
    }
    const tab: InternalTab = {
      value: v,
      tabId: createId("dokuma-tab"),
      panelId: createId("dokuma-tabpanel"),
      disabled: opts.disabled,
    }
    tabs.set(v, tab)

    // Silent auto-select on first registration if no value yet (init, not user input).
    if (!isControlled && !readValue() && !(opts.disabled?.() ?? false)) {
      internal.set(v)
    }

    return {
      value: v,
      tabId: tab.tabId,
      panelId: tab.panelId,
      unregister: () => unregisterTab(v),
    }
  }

  const unregisterTab = (v: string): void => {
    if (!tabs.has(v)) return
    tabs.delete(v)
    if (isSelected(v) && !isControlled) {
      // pick first remaining non-disabled tab, or empty
      let fallback = ""
      for (const t of tabs.values()) {
        if (!(t.disabled?.() ?? false)) {
          fallback = t.value
          break
        }
      }
      internal.set(fallback)
      for (const fn of subscribers) fn(fallback)
    }
  }

  const requireTab = (v: string): InternalTab => {
    const t = tabs.get(v)
    if (!t) throw new Error(`dokuma: tab "${v}" was not registered. Call registerTab first.`)
    return t
  }

  const orderedTabs = (): HTMLElement[] => {
    const els: HTMLElement[] = []
    for (const t of tabs.values()) {
      const el =
        typeof document !== "undefined"
          ? (document.getElementById(t.tabId) as HTMLElement | null)
          : null
      if (el) els.push(el)
    }
    return els
  }

  const handleKeyDown = (currentValue: string, event: KeyboardLikeEvent): void => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault?.()
      select(currentValue)
      return
    }
    const triggers = orderedTabs()
    const current =
      typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null
    const target = rovingKeyDown(triggers, current, orientation, event)
    if (!target) return

    if (!loop) {
      const idx = triggers.indexOf(current as HTMLElement)
      const targetIdx = triggers.indexOf(target)
      const next = orientation === "vertical" ? "ArrowDown" : "ArrowRight"
      const prev = orientation === "vertical" ? "ArrowUp" : "ArrowLeft"
      if (event.key === next && targetIdx < idx) return
      if (event.key === prev && targetIdx > idx) return
    }

    event.preventDefault?.()
    event.stopPropagation?.()
    target.focus()

    if (activationMode === "automatic") {
      const targetValue = [...tabs.values()].find((t) => t.tabId === target.id)?.value
      if (targetValue) select(targetValue)
    }
  }

  const getRootProps = (): TabsRootProps => ({
    "data-orientation": orientation,
  })

  const getListProps = (): TabsListProps => ({
    role: "tablist",
    "aria-orientation": orientation,
    "data-orientation": orientation,
  })

  const getTabProps = (v: string): TabProps => {
    const tab = requireTab(v)
    const selected = isSelected(v)
    const disabled = isTabDisabled(v)
    const props: TabProps = {
      type: "button",
      role: "tab",
      id: tab.tabId,
      "aria-selected": selected,
      "aria-controls": tab.panelId,
      "data-state": selected ? "active" : "inactive",
      "data-orientation": orientation,
      tabIndex: selected ? 0 : -1,
      onClick: (event) => {
        event?.preventDefault?.()
        select(v)
      },
      onKeyDown: (event) => handleKeyDown(v, event),
    }
    if (disabled) {
      props["aria-disabled"] = true
      props["data-disabled"] = true
    }
    return props
  }

  const getPanelProps = (v: string): TabPanelProps => {
    const tab = requireTab(v)
    const selected = isSelected(v)
    return {
      role: "tabpanel",
      id: tab.panelId,
      "aria-labelledby": tab.tabId,
      hidden: !selected,
      tabIndex: 0,
      "data-state": selected ? "active" : "inactive",
      "data-orientation": orientation,
    }
  }

  const mount = (root: HTMLElement): Unsubscribe => {
    const cleanups: Array<() => void> = []
    const tabEls = new Map<string, HTMLElement>()
    const panelEls = new Map<string, HTMLElement>()

    const tabNodes = root.querySelectorAll<HTMLElement>("[data-dokuma-tabs-tab]")
    const panelNodes = root.querySelectorAll<HTMLElement>("[data-dokuma-tabs-panel]")

    for (const el of Array.from(tabNodes)) {
      const v = el.dataset.dokumaTabsTab
      if (!v) continue
      const handle = registerTab(v)
      el.id = handle.tabId
      tabEls.set(v, el)

      const onClick = (e: Event): void => {
        e.preventDefault()
        select(v)
      }
      const onKeyDown = (e: KeyboardEvent): void => handleKeyDown(v, e)
      el.addEventListener("click", onClick)
      el.addEventListener("keydown", onKeyDown)
      cleanups.push(() => {
        el.removeEventListener("click", onClick)
        el.removeEventListener("keydown", onKeyDown)
      })
    }

    for (const el of Array.from(panelNodes)) {
      const v = el.dataset.dokumaTabsPanel
      if (!v) continue
      // ensure tab existed (panel without tab is ignored)
      const tab = tabs.get(v)
      if (!tab) continue
      el.id = tab.panelId
      panelEls.set(v, el)
    }

    const apply = (): void => {
      applyAttrs(root, getRootProps() as unknown as AriaProps)
      const list = root.querySelector<HTMLElement>("[data-dokuma-tabs-list]")
      if (list) applyAttrs(list, getListProps() as unknown as AriaProps)

      for (const [v, el] of tabEls) {
        if (!tabs.has(v)) continue
        const { onClick: _o, onKeyDown: _k, ...rest } = getTabProps(v)
        applyAttrs(el, rest as unknown as AriaProps)
      }
      for (const [v, el] of panelEls) {
        if (!tabs.has(v)) continue
        applyAttrs(el, getPanelProps(v) as unknown as AriaProps)
      }
    }

    apply()
    const unsub = value.subscribe(apply)
    cleanups.push(unsub)

    return () => {
      for (const fn of cleanups) fn()
    }
  }

  return {
    value,
    orientation,
    activationMode,
    isDisabled,
    registerTab,
    hasTab,
    isTabDisabled,
    isSelected,
    select,
    getRootProps,
    getListProps,
    getTabProps,
    getPanelProps,
    mount,
    notify,
  }
}
