import { applyAttrs, type AriaProps } from "../_aria.ts"
import { createId } from "../_id.ts"
import { rovingKeyDown, type KeyboardLikeEvent, type Orientation } from "../_keyboard.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface RadioGroupOptions {
  defaultValue?: string
  value?: () => string
  onValueChange?: (value: string) => void
  orientation?: Orientation
  /** Default `true`. Arrow keys also select (per WAI-ARIA radiogroup). */
  loop?: boolean
  disabled?: () => boolean
  required?: boolean
  /** Form input name. */
  name?: string
  "aria-label"?: string
  "aria-labelledby"?: string
}

export interface RegisterRadioOptions {
  disabled?: () => boolean
}

export interface RadioHandle {
  value: string
  itemId: string
  unregister: () => void
}

export interface RadioGroupRootProps {
  role: "radiogroup"
  "aria-orientation": Orientation
  "aria-required"?: boolean
  "aria-label"?: string
  "aria-labelledby"?: string
  "data-orientation": Orientation
}

export interface RadioItemProps {
  type: "button"
  role: "radio"
  id: string
  "aria-checked": "true" | "false"
  "aria-disabled"?: boolean
  "data-state": "checked" | "unchecked"
  "data-disabled"?: boolean
  "data-orientation": Orientation
  tabIndex: 0 | -1
  onClick: (event?: { preventDefault?: () => void }) => void
  onKeyDown: (event: KeyboardLikeEvent) => void
}

export interface RadioHiddenInputProps {
  type: "radio"
  name: string
  value: string
  checked: boolean
  required?: boolean
  disabled?: boolean
  "aria-hidden": true
  tabIndex: -1
  style: Record<string, string | number>
}

export interface RadioGroup {
  value: Signal<string>
  orientation: Orientation
  isDisabled: () => boolean
  registerItem: (value: string, opts?: RegisterRadioOptions) => RadioHandle
  hasItem: (value: string) => boolean
  isItemDisabled: (value: string) => boolean
  isChecked: (value: string) => boolean
  select: (value: string) => void
  getRootProps: () => RadioGroupRootProps
  getItemProps: (value: string) => RadioItemProps
  /** When `name` is set, returns a hidden radio input for form submission. */
  getHiddenInputProps: (value: string) => RadioHiddenInputProps | null
  mount: (root: HTMLElement) => Unsubscribe
  notify: () => void
}

interface InternalItem {
  value: string
  itemId: string
  disabled?: () => boolean
}

const VISUALLY_HIDDEN: Record<string, string | number> = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  borderWidth: 0,
  pointerEvents: "none",
}

export function createRadioGroup(options: RadioGroupOptions = {}): RadioGroup {
  const orientation: Orientation = options.orientation ?? "vertical"
  const loop = options.loop ?? true
  const isControlled = typeof options.value === "function"

  const internal = createSignal<string>(options.defaultValue ?? "")
  const items = new Map<string, InternalItem>()
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
  const isItemDisabled = (v: string): boolean => {
    if (isDisabled()) return true
    return items.get(v)?.disabled?.() ?? false
  }
  const hasItem = (v: string): boolean => items.has(v)
  const isChecked = (v: string): boolean => readValue() === v
  const select = (v: string): void => {
    if (isItemDisabled(v)) return
    value.set(v)
  }
  const notify = (): void => {
    const v = readValue()
    for (const fn of subscribers) fn(v)
  }

  const registerItem = (v: string, opts: RegisterRadioOptions = {}): RadioHandle => {
    const existing = items.get(v)
    if (existing) {
      existing.disabled = opts.disabled
      return { value: v, itemId: existing.itemId, unregister: () => unregisterItem(v) }
    }
    const item: InternalItem = {
      value: v,
      itemId: createId("dokuma-radio"),
      disabled: opts.disabled,
    }
    items.set(v, item)
    return { value: v, itemId: item.itemId, unregister: () => unregisterItem(v) }
  }
  const unregisterItem = (v: string): void => {
    items.delete(v)
  }

  const requireItem = (v: string): InternalItem => {
    const item = items.get(v)
    if (!item) throw new Error(`dokuma: radio "${v}" was not registered. Call registerItem first.`)
    return item
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

  // Roving tabindex: only the checked radio is in the tab order.
  // If nothing is checked, the first non-disabled item is the tab stop.
  const computedTabStop = (): string => {
    const v = readValue()
    if (v && items.has(v) && !isItemDisabled(v)) return v
    for (const item of items.values()) {
      if (!isItemDisabled(item.value)) return item.value
    }
    return ""
  }

  const handleKeyDown = (currentValue: string, event: KeyboardLikeEvent): void => {
    if (event.key === " ") {
      event.preventDefault?.()
      select(currentValue)
      return
    }
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
    // Per WAI-ARIA radiogroup: arrow navigation also selects.
    const targetValue = [...items.values()].find((it) => it.itemId === target.id)?.value
    if (targetValue) select(targetValue)
  }

  const getRootProps = (): RadioGroupRootProps => {
    const props: RadioGroupRootProps = {
      role: "radiogroup",
      "aria-orientation": orientation,
      "data-orientation": orientation,
    }
    if (options.required) props["aria-required"] = true
    if (options["aria-label"]) props["aria-label"] = options["aria-label"]
    if (options["aria-labelledby"]) props["aria-labelledby"] = options["aria-labelledby"]
    return props
  }

  const getItemProps = (v: string): RadioItemProps => {
    const item = requireItem(v)
    const checked = isChecked(v)
    const disabled = isItemDisabled(v)
    const tabStop = computedTabStop()
    const props: RadioItemProps = {
      type: "button",
      role: "radio",
      id: item.itemId,
      "aria-checked": checked ? "true" : "false",
      "data-state": checked ? "checked" : "unchecked",
      "data-orientation": orientation,
      tabIndex: tabStop === v ? 0 : -1,
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

  const getHiddenInputProps = (v: string): RadioHiddenInputProps | null => {
    if (!options.name) return null
    const checked = isChecked(v)
    const props: RadioHiddenInputProps = {
      type: "radio",
      name: options.name,
      value: v,
      checked,
      "aria-hidden": true,
      tabIndex: -1,
      style: VISUALLY_HIDDEN,
    }
    if (options.required) props.required = true
    if (isItemDisabled(v)) props.disabled = true
    return props
  }

  const mount = (root: HTMLElement): Unsubscribe => {
    const cleanups: Array<() => void> = []
    const itemEls = root.querySelectorAll<HTMLElement>("[data-dokuma-radio]")
    const elByValue = new Map<string, HTMLElement>()

    for (const el of Array.from(itemEls)) {
      const v = el.dataset.dokumaRadio
      if (!v) continue
      const handle = registerItem(v)
      el.id = handle.itemId
      elByValue.set(v, el)
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

    const apply = (): void => {
      applyAttrs(root, getRootProps() as unknown as AriaProps)
      for (const [v, el] of elByValue) {
        if (!items.has(v)) continue
        const { onClick: _o, onKeyDown: _k, ...rest } = getItemProps(v)
        applyAttrs(el, rest as unknown as AriaProps)
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
    isDisabled,
    registerItem,
    hasItem,
    isItemDisabled,
    isChecked,
    select,
    getRootProps,
    getItemProps,
    getHiddenInputProps,
    mount,
    notify,
  }
}
