import { createId } from "../_id.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface CheckboxGroupOptions {
  defaultValue?: string[]
  value?: () => string[]
  onValueChange?: (value: string[]) => void
  disabled?: boolean
  /** Optional aria-label for the group. */
  "aria-label"?: string
  /** Optional aria-labelledby. */
  "aria-labelledby"?: string
}

export interface CheckboxGroupRootProps {
  role: "group"
  "aria-label"?: string
  "aria-labelledby"?: string
  "data-disabled"?: ""
}

export interface CheckboxGroupItem {
  value: string
  isChecked: () => boolean
  toggle: () => void
  setChecked: (checked: boolean) => void
  /** Props to spread on the item (id + aria + data-state + checked). */
  getItemProps: () => {
    "data-state": "checked" | "unchecked"
    "data-disabled"?: ""
    disabled?: boolean
    "aria-checked": "true" | "false"
  }
  /** Auto-manages a native `<input type="checkbox">`. */
  mount: (el: HTMLInputElement) => Unsubscribe
}

export interface CheckboxGroup {
  value: Signal<string[]>
  disabled: Signal<boolean>
  getRootProps: () => CheckboxGroupRootProps
  /** Register a child value. */
  getItem: (value: string) => CheckboxGroupItem
}

/**
 * Multi-select checkbox group. Each child uses `getItem(value)` to obtain
 * a handle that reads/writes the group's selection. Works with native
 * `<input type="checkbox">` via `.mount()` or with custom toggles via
 * `toggle()` / `setChecked()`.
 */
export function createCheckboxGroup(options: CheckboxGroupOptions = {}): CheckboxGroup {
  const isControlled = typeof options.value === "function"
  const internal = createSignal<string[]>(options.defaultValue ?? [])

  const subscribers = new Set<(v: string[]) => void>()
  const read = (): string[] => (isControlled ? (options.value as () => string[])() : internal.get())

  const value: Signal<string[]> = {
    get: read,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: string[]) => string[])(read()) : next
      if (sameArray(resolved, read())) return
      if (!isControlled) internal.set(resolved)
      options.onValueChange?.(resolved)
      for (const fn of subscribers) fn(resolved)
    },
    subscribe: (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
  }

  const disabled = createSignal(options.disabled ?? false)

  const getRootProps = (): CheckboxGroupRootProps => {
    const props: CheckboxGroupRootProps = { role: "group" }
    if (options["aria-label"]) props["aria-label"] = options["aria-label"]
    if (options["aria-labelledby"]) props["aria-labelledby"] = options["aria-labelledby"]
    if (disabled.get()) props["data-disabled"] = ""
    return props
  }

  const getItem = (itemValue: string): CheckboxGroupItem => {
    const isChecked = (): boolean => read().includes(itemValue)
    const setChecked = (checked: boolean): void => {
      const current = read()
      if (checked) {
        if (!current.includes(itemValue)) value.set([...current, itemValue])
      } else {
        if (current.includes(itemValue)) value.set(current.filter((v) => v !== itemValue))
      }
    }
    const toggle = (): void => setChecked(!isChecked())

    const getItemProps: CheckboxGroupItem["getItemProps"] = () => {
      const checked = isChecked()
      const props: ReturnType<CheckboxGroupItem["getItemProps"]> = {
        "data-state": checked ? "checked" : "unchecked",
        "aria-checked": checked ? "true" : "false",
      }
      if (disabled.get()) {
        props.disabled = true
        props["data-disabled"] = ""
      }
      return props
    }

    const mount: CheckboxGroupItem["mount"] = (el) => {
      el.type = "checkbox"
      el.value = itemValue
      const apply = (): void => {
        el.checked = isChecked()
        el.disabled = disabled.get()
        if (el.checked) el.setAttribute("data-state", "checked")
        else el.setAttribute("data-state", "unchecked")
      }
      const onChange = (): void => setChecked(el.checked)

      el.addEventListener("change", onChange)
      apply()
      const un = value.subscribe(apply)
      const un2 = disabled.subscribe(apply)

      return () => {
        el.removeEventListener("change", onChange)
        un()
        un2()
      }
    }

    return { value: itemValue, isChecked, toggle, setChecked, getItemProps, mount }
  }

  return { value, disabled, getRootProps, getItem }
}

function sameArray(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

// `createId` re-exported here to keep the bundle friendly even if unused.
export { createId as _createCheckboxGroupId }
