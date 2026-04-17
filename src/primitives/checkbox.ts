import { createId } from "../_id.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export type CheckedState = boolean | "indeterminate"

export interface CheckboxOptions {
  defaultChecked?: CheckedState
  checked?: () => CheckedState
  onCheckedChange?: (checked: CheckedState) => void
  disabled?: () => boolean
  required?: boolean
  name?: string
  /** Submit value when checked. Default `"on"`. */
  value?: string
}

export interface CheckboxRootProps {
  type: "button"
  role: "checkbox"
  id: string
  "aria-checked": "true" | "false" | "mixed"
  "aria-disabled"?: boolean
  "aria-required"?: boolean
  "data-state": "checked" | "unchecked" | "indeterminate"
  "data-disabled"?: boolean
  tabIndex: 0
  onClick: (event?: { preventDefault?: () => void }) => void
}

export interface CheckboxIndicatorProps {
  "aria-hidden": true
  "data-state": "checked" | "unchecked" | "indeterminate"
  "data-disabled"?: boolean
  /** Whether the indicator should be rendered (false when unchecked). */
  hidden: boolean
}

export interface CheckboxHiddenInputProps {
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

export interface Checkbox {
  checked: Signal<CheckedState>
  rootId: string
  isDisabled: () => boolean
  toggle: () => void
  check: () => void
  uncheck: () => void
  setIndeterminate: () => void
  getRootProps: () => CheckboxRootProps
  getIndicatorProps: () => CheckboxIndicatorProps
  getHiddenInputProps: () => CheckboxHiddenInputProps | null
  mount: (els: { root: HTMLElement; hiddenInput?: HTMLInputElement }) => Unsubscribe
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

const stateString = (c: CheckedState): "checked" | "unchecked" | "indeterminate" => {
  if (c === "indeterminate") return "indeterminate"
  return c ? "checked" : "unchecked"
}
const ariaChecked = (c: CheckedState): "true" | "false" | "mixed" => {
  if (c === "indeterminate") return "mixed"
  return c ? "true" : "false"
}

export function createCheckbox(options: CheckboxOptions = {}): Checkbox {
  const rootId = createId("dokuma-checkbox")
  const internal = createSignal<CheckedState>(options.defaultChecked ?? false)
  const isControlled = typeof options.checked === "function"
  const subscribers = new Set<(c: CheckedState) => void>()

  const readChecked = (): CheckedState =>
    isControlled ? (options.checked as () => CheckedState)() : internal.get()

  const isDisabled = (): boolean => options.disabled?.() ?? false

  const checked: Signal<CheckedState> = {
    get: readChecked,
    set: (next) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: CheckedState) => CheckedState)(readChecked())
          : next
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

  // Per WAI-ARIA checkbox: clicking an indeterminate checkbox sets it to true.
  const toggle = (): void => {
    if (isDisabled()) return
    const c = readChecked()
    if (c === "indeterminate") checked.set(true)
    else checked.set(!c)
  }
  const check = (): void => {
    if (isDisabled()) return
    checked.set(true)
  }
  const uncheck = (): void => {
    if (isDisabled()) return
    checked.set(false)
  }
  const setIndeterminate = (): void => {
    if (isDisabled()) return
    checked.set("indeterminate")
  }

  const handleClick = (event?: { preventDefault?: () => void }): void => {
    event?.preventDefault?.()
    toggle()
  }

  const getRootProps = (): CheckboxRootProps => {
    const c = readChecked()
    const disabled = isDisabled()
    const props: CheckboxRootProps = {
      type: "button",
      role: "checkbox",
      id: rootId,
      "aria-checked": ariaChecked(c),
      "data-state": stateString(c),
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

  const getIndicatorProps = (): CheckboxIndicatorProps => {
    const c = readChecked()
    const props: CheckboxIndicatorProps = {
      "aria-hidden": true,
      "data-state": stateString(c),
      hidden: c === false,
    }
    if (isDisabled()) props["data-disabled"] = true
    return props
  }

  const getHiddenInputProps = (): CheckboxHiddenInputProps | null => {
    if (!options.name) return null
    const c = readChecked()
    const props: CheckboxHiddenInputProps = {
      type: "checkbox",
      name: options.name,
      value: options.value ?? "on",
      // Indeterminate is a UI state; for form submission it is not checked.
      checked: c === true,
      "aria-hidden": true,
      tabIndex: -1,
      style: VISUALLY_HIDDEN,
    }
    if (options.required) props.required = true
    if (isDisabled()) props.disabled = true
    return props
  }

  const mount = (els: { root: HTMLElement; hiddenInput?: HTMLInputElement }): Unsubscribe => {
    const { root, hiddenInput } = els
    const apply = (): void => {
      const c = readChecked()
      const disabled = isDisabled()
      root.setAttribute("type", "button")
      root.setAttribute("role", "checkbox")
      root.id = rootId
      root.setAttribute("aria-checked", ariaChecked(c))
      root.setAttribute("data-state", stateString(c))
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
        hiddenInput.checked = c === true
        if (c === "indeterminate") hiddenInput.indeterminate = true
        else hiddenInput.indeterminate = false
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
    setIndeterminate,
    getRootProps,
    getIndicatorProps,
    getHiddenInputProps,
    mount,
  }
}
