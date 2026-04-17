import { applyAttrs, type AriaProps } from "../_aria.ts"
import { createId } from "../_id.ts"
import { rovingKeyDown, type KeyboardLikeEvent, type Orientation } from "../_keyboard.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export type ToggleGroupType = "single" | "multiple"

export interface ToggleGroupOptions {
  /** Default `"single"`. Locked at construction. */
  type?: ToggleGroupType
  defaultValue?: string | string[]
  value?: () => string | string[]
  onValueChange?: (value: string | string[]) => void
  /** `single` mode only — allow unpressing the pressed item. Default `false`. */
  collapsible?: boolean
  /** Default `true`. When true, only the focused item is in tab order. */
  rovingFocus?: boolean
  /** Default `true`. Arrow navigation wraps. */
  loop?: boolean
  /** Default `"horizontal"`. */
  orientation?: Orientation
  disabled?: () => boolean
  /** Optional aria-label for the group root. */
  "aria-label"?: string
  /** Optional aria-labelledby for the group root. */
  "aria-labelledby"?: string
}

export interface RegisterItemOptions {
  disabled?: () => boolean
}

export interface ToggleGroupItemHandle {
  value: string
  itemId: string
  unregister: () => void
}

export interface ToggleGroupRootProps {
  role: "group"
  "aria-orientation": Orientation
  "data-orientation": Orientation
  "aria-label"?: string
  "aria-labelledby"?: string
}

export interface ToggleGroupItemProps {
  type: "button"
  id: string
  "aria-pressed": "true" | "false"
  "aria-disabled"?: boolean
  "data-state": "on" | "off"
  "data-disabled"?: boolean
  "data-orientation": Orientation
  tabIndex: 0 | -1
  onClick: (event?: { preventDefault?: () => void }) => void
  onKeyDown: (event: KeyboardLikeEvent) => void
}

export interface ToggleGroup {
  values: Signal<string[]>
  type: ToggleGroupType
  orientation: Orientation
  isDisabled: () => boolean
  registerItem: (value: string, opts?: RegisterItemOptions) => ToggleGroupItemHandle
  hasItem: (value: string) => boolean
  isItemDisabled: (value: string) => boolean
  isPressed: (value: string) => boolean
  toggle: (value: string) => void
  press: (value: string) => void
  unpress: (value: string) => void
  /** Set the focused value (used by adapters when an item receives focus). */
  setFocused: (value: string) => void
  getRootProps: () => ToggleGroupRootProps
  getItemProps: (value: string) => ToggleGroupItemProps
  /** Imperative DOM wiring. Auto-discovers `[data-dokuma-toggle-group-item="<value>"]` descendants. Returns cleanup. */
  mount: (root: HTMLElement) => Unsubscribe
}

interface InternalItem {
  value: string
  itemId: string
  disabled?: () => boolean
}

function toArray(v: string | string[] | undefined): string[] {
  if (v === undefined) return []
  return Array.isArray(v) ? [...v] : [v]
}

function fromArray(type: ToggleGroupType, arr: string[]): string | string[] {
  if (type === "single") return arr[0] ?? ""
  return [...arr]
}

export function createToggleGroup(options: ToggleGroupOptions = {}): ToggleGroup {
  const type: ToggleGroupType = options.type ?? "single"
  const orientation: Orientation = options.orientation ?? "horizontal"
  const collapsible = options.collapsible ?? false
  const rovingFocus = options.rovingFocus ?? true
  const loop = options.loop ?? true
  const isControlled = typeof options.value === "function"

  const internal = createSignal<string[]>(toArray(options.defaultValue))
  const items = new Map<string, InternalItem>()
  const subscribers = new Set<(v: string[]) => void>()

  // Track the focused item separately from the pressed set (esp. for multiple mode).
  let focusedValue = ""

  const readValues = (): string[] =>
    isControlled ? toArray((options.value as () => string | string[])()) : internal.get()

  const values: Signal<string[]> = {
    get: readValues,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: string[]) => string[])(readValues()) : next
      const prev = readValues()
      if (resolved.length === prev.length && resolved.every((v, i) => v === prev[i])) return
      if (!isControlled) internal.set(resolved)
      options.onValueChange?.(fromArray(type, resolved))
      for (const fn of subscribers) fn(resolved)
    },
    subscribe: (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
  }

  const isDisabled = (): boolean => options.disabled?.() ?? false
  const isItemDisabled = (v: string): boolean => {
    if (isDisabled()) return true
    return items.get(v)?.disabled?.() ?? false
  }

  const hasItem = (v: string): boolean => items.has(v)
  const isPressed = (v: string): boolean => readValues().includes(v)

  const setPressed = (value: string, on: boolean): void => {
    if (isItemDisabled(value)) return
    const current = readValues()
    const has = current.includes(value)

    if (on && !has) {
      const next = type === "single" ? [value] : [...current, value]
      values.set(next)
      return
    }
    if (!on && has) {
      if (type === "single" && !collapsible && current.length === 1) return
      values.set(current.filter((v) => v !== value))
    }
  }

  const toggle = (value: string): void => setPressed(value, !isPressed(value))
  const press = (value: string): void => setPressed(value, true)
  const unpress = (value: string): void => setPressed(value, false)

  const setFocused = (value: string): void => {
    if (!items.has(value)) return
    focusedValue = value
    // tabindex changes — notify subscribers so adapters re-render
    for (const fn of subscribers) fn(readValues())
  }

  const registerItem = (value: string, opts: RegisterItemOptions = {}): ToggleGroupItemHandle => {
    const existing = items.get(value)
    if (existing) {
      existing.disabled = opts.disabled
      return {
        value,
        itemId: existing.itemId,
        unregister: () => unregisterItem(value),
      }
    }
    const item: InternalItem = {
      value,
      itemId: createId("dokuma-toggle-group-item"),
      disabled: opts.disabled,
    }
    items.set(value, item)
    return {
      value,
      itemId: item.itemId,
      unregister: () => unregisterItem(value),
    }
  }

  const unregisterItem = (value: string): void => {
    if (!items.has(value)) return
    items.delete(value)
    if (isPressed(value)) {
      values.set(readValues().filter((v) => v !== value))
    }
    if (focusedValue === value) focusedValue = ""
  }

  const requireItem = (v: string): InternalItem => {
    const item = items.get(v)
    if (!item) {
      throw new Error(
        `dokuma: toggle-group item "${v}" was not registered. Call registerItem first.`,
      )
    }
    return item
  }

  // First non-disabled item is the default tab stop when nothing has been focused yet.
  const computedFocusedValue = (): string => {
    if (focusedValue && items.has(focusedValue) && !isItemDisabled(focusedValue))
      return focusedValue
    for (const item of items.values()) {
      if (!isItemDisabled(item.value)) return item.value
    }
    return ""
  }

  const orderedItemEls = (): HTMLElement[] => {
    if (typeof document === "undefined") return []
    const els: HTMLElement[] = []
    for (const item of items.values()) {
      const el = document.getElementById(item.itemId) as HTMLElement | null
      if (el) els.push(el)
    }
    return els
  }

  const handleKeyDown = (currentValue: string, event: KeyboardLikeEvent): void => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault?.()
      toggle(currentValue)
      return
    }
    if (!rovingFocus) return

    const triggers = orderedItemEls()
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
    const targetValue = [...items.values()].find((it) => it.itemId === target.id)?.value
    if (targetValue) setFocused(targetValue)
  }

  const getRootProps = (): ToggleGroupRootProps => {
    const props: ToggleGroupRootProps = {
      role: "group",
      "aria-orientation": orientation,
      "data-orientation": orientation,
    }
    if (options["aria-label"]) props["aria-label"] = options["aria-label"]
    if (options["aria-labelledby"]) props["aria-labelledby"] = options["aria-labelledby"]
    return props
  }

  const getItemProps = (value: string): ToggleGroupItemProps => {
    const item = requireItem(value)
    const on = isPressed(value)
    const disabled = isItemDisabled(value)
    const focused = computedFocusedValue()
    const tabIndex: 0 | -1 = !rovingFocus || focused === value ? 0 : -1
    const props: ToggleGroupItemProps = {
      type: "button",
      id: item.itemId,
      "aria-pressed": on ? "true" : "false",
      "data-state": on ? "on" : "off",
      "data-orientation": orientation,
      tabIndex,
      onClick: (event) => {
        event?.preventDefault?.()
        setFocused(value)
        toggle(value)
      },
      onKeyDown: (event) => handleKeyDown(value, event),
    }
    if (disabled) {
      props["aria-disabled"] = true
      props["data-disabled"] = true
    }
    return props
  }

  const mount = (root: HTMLElement): Unsubscribe => {
    const cleanups: Array<() => void> = []
    const itemNodes = root.querySelectorAll<HTMLElement>("[data-dokuma-toggle-group-item]")
    const elByValue = new Map<string, HTMLElement>()

    for (const el of Array.from(itemNodes)) {
      const v = el.dataset.dokumaToggleGroupItem
      if (!v) continue
      const handle = registerItem(v)
      el.id = handle.itemId
      elByValue.set(v, el)

      const onClick = (e: Event): void => {
        e.preventDefault()
        setFocused(v)
        toggle(v)
      }
      const onKeyDown = (e: KeyboardEvent): void => handleKeyDown(v, e)
      const onFocus = (): void => setFocused(v)
      el.addEventListener("click", onClick)
      el.addEventListener("keydown", onKeyDown)
      el.addEventListener("focus", onFocus)
      cleanups.push(() => {
        el.removeEventListener("click", onClick)
        el.removeEventListener("keydown", onKeyDown)
        el.removeEventListener("focus", onFocus)
      })
    }

    const apply = (): void => {
      applyAttrs(root, getRootProps() as unknown as AriaProps)
      for (const [v, el] of elByValue) {
        if (!items.has(v)) continue
        const { onClick: _o, onKeyDown: _k, ...rest } = getItemProps(v)
        applyAttrs(el, rest as unknown as AriaProps)
      }
    }

    apply()
    const unsub = values.subscribe(apply)
    cleanups.push(unsub)

    return () => {
      for (const fn of cleanups) fn()
    }
  }

  return {
    values,
    type,
    orientation,
    isDisabled,
    registerItem,
    hasItem,
    isItemDisabled,
    isPressed,
    toggle,
    press,
    unpress,
    setFocused,
    getRootProps,
    getItemProps,
    mount,
  }
}
