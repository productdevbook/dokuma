import { createId } from "../_id.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface SwitchOptions {
  defaultChecked?: boolean
  /** Controlled checked getter. */
  checked?: () => boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: () => boolean
  required?: boolean
  /** When provided, `getHiddenInputProps()` returns props for a form-submittable input. */
  name?: string
  /** Submit value when checked. Default `"on"`. */
  value?: string
}

export interface SwitchRootProps {
  type: "button"
  role: "switch"
  id: string
  "aria-checked": "true" | "false"
  "aria-disabled"?: boolean
  "aria-required"?: boolean
  "data-state": "checked" | "unchecked"
  "data-disabled"?: boolean
  tabIndex: 0
  onClick: (event?: { preventDefault?: () => void }) => void
}

export interface SwitchThumbProps {
  "aria-hidden": true
  "data-state": "checked" | "unchecked"
  "data-disabled"?: boolean
}

export interface SwitchHiddenInputProps {
  type: "checkbox"
  name: string
  value: string
  checked: boolean
  required?: boolean
  disabled?: boolean
  "aria-hidden": true
  tabIndex: -1
  style: Record<string, string | number>
}

export interface Switch {
  checked: Signal<boolean>
  rootId: string
  isDisabled: () => boolean
  toggle: () => void
  check: () => void
  uncheck: () => void
  getRootProps: () => SwitchRootProps
  getThumbProps: () => SwitchThumbProps
  /** Returns null when `name` was not provided at construction. */
  getHiddenInputProps: () => SwitchHiddenInputProps | null
  /** Imperative DOM wiring. Returns cleanup. */
  mount: (els: { root: HTMLElement; hiddenInput?: HTMLInputElement }) => Unsubscribe
  /** Notify subscribers without changing state — used by adapters when controlled `checked` changes. */
  notify: () => void
}

// Hoisted so framework adapters get a stable reference (no per-render re-application).
const VISUALLY_HIDDEN_STYLE: Record<string, string | number> = {
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

export function createSwitch(options: SwitchOptions = {}): Switch {
  const rootId = createId("dokuma-switch")
  const internal = createSignal(options.defaultChecked ?? false)
  const isControlled = typeof options.checked === "function"
  const subscribers = new Set<(v: boolean) => void>()

  const readChecked = (): boolean =>
    isControlled ? (options.checked as () => boolean)() : internal.get()

  const isDisabled = (): boolean => options.disabled?.() ?? false

  const checked: Signal<boolean> = {
    get: readChecked,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: boolean) => boolean)(readChecked()) : next
      if (resolved === readChecked()) return
      if (!isControlled) internal.set(resolved)
      options.onCheckedChange?.(resolved)
      for (const fn of subscribers) fn(resolved)
    },
    subscribe: (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
  }

  const toggle = (): void => {
    if (isDisabled()) return
    checked.set(!readChecked())
  }
  const check = (): void => {
    if (isDisabled()) return
    checked.set(true)
  }
  const uncheck = (): void => {
    if (isDisabled()) return
    checked.set(false)
  }

  const notify = (): void => {
    const v = readChecked()
    for (const fn of subscribers) fn(v)
  }

  const handleClick = (event?: { preventDefault?: () => void }): void => {
    event?.preventDefault?.()
    toggle()
  }

  const getRootProps = (): SwitchRootProps => {
    const isOn = readChecked()
    const disabled = isDisabled()
    const props: SwitchRootProps = {
      type: "button",
      role: "switch",
      id: rootId,
      "aria-checked": isOn ? "true" : "false",
      "data-state": isOn ? "checked" : "unchecked",
      tabIndex: 0,
      onClick: handleClick,
    }
    if (disabled) {
      props["aria-disabled"] = true
      props["data-disabled"] = true
    }
    if (options.required) props["aria-required"] = true
    return props
  }

  const getThumbProps = (): SwitchThumbProps => {
    const isOn = readChecked()
    const disabled = isDisabled()
    const props: SwitchThumbProps = {
      "aria-hidden": true,
      "data-state": isOn ? "checked" : "unchecked",
    }
    if (disabled) props["data-disabled"] = true
    return props
  }

  const getHiddenInputProps = (): SwitchHiddenInputProps | null => {
    if (!options.name) return null
    const isOn = readChecked()
    const props: SwitchHiddenInputProps = {
      type: "checkbox",
      name: options.name,
      value: options.value ?? "on",
      checked: isOn,
      "aria-hidden": true,
      tabIndex: -1,
      style: VISUALLY_HIDDEN_STYLE,
    }
    if (options.required) props.required = true
    if (isDisabled()) props.disabled = true
    return props
  }

  const mount = (els: { root: HTMLElement; hiddenInput?: HTMLInputElement }): Unsubscribe => {
    const { root, hiddenInput } = els

    const apply = (): void => {
      const isOn = readChecked()
      const disabled = isDisabled()
      root.setAttribute("type", "button")
      root.setAttribute("role", "switch")
      root.id = rootId
      root.setAttribute("aria-checked", isOn ? "true" : "false")
      root.setAttribute("data-state", isOn ? "checked" : "unchecked")
      root.tabIndex = 0
      if (disabled) {
        root.setAttribute("aria-disabled", "true")
        root.setAttribute("data-disabled", "")
      } else {
        root.removeAttribute("aria-disabled")
        root.removeAttribute("data-disabled")
      }
      if (options.required) root.setAttribute("aria-required", "true")
      if (hiddenInput) {
        hiddenInput.checked = isOn
        if (disabled) hiddenInput.disabled = true
        else hiddenInput.disabled = false
      }
    }

    apply()
    root.addEventListener("click", handleClick as EventListener)
    const unsub = checked.subscribe(apply)

    return () => {
      root.removeEventListener("click", handleClick as EventListener)
      unsub()
    }
  }

  return {
    checked,
    rootId,
    isDisabled,
    toggle,
    check,
    uncheck,
    getRootProps,
    getThumbProps,
    getHiddenInputProps,
    mount,
    notify,
  }
}
