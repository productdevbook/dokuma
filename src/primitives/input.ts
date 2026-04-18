import { on } from "../_dom.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface InputOptions {
  /** Default empty string. Uncontrolled initial value. */
  defaultValue?: string
  /** Controlled value accessor. When provided, `defaultValue` is ignored. */
  value?: () => string
  onValueChange?: (value: string) => void
  disabled?: boolean | (() => boolean)
  readOnly?: boolean | (() => boolean)
  required?: boolean
  /** Native input type. Default `"text"`. */
  type?: string
  /** Placeholder forwarded to DOM. */
  placeholder?: string
  name?: string
  id?: string
}

export interface InputProps {
  type: string
  value: string
  name?: string
  id?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  placeholder?: string
  "data-filled"?: ""
  "data-disabled"?: ""
  "data-readonly"?: ""
}

export interface Input {
  value: Signal<string>
  focused: Signal<boolean>
  filled: Signal<boolean>
  getRootProps: () => InputProps
  /** Imperative DOM wiring. Returns cleanup. */
  mount: (el: HTMLInputElement | HTMLTextAreaElement) => Unsubscribe
}

/**
 * Minimal text-input primitive. Handles controlled/uncontrolled modes and
 * tracks focus + filled state for CSS styling. Compose with Field to pick
 * up labels, descriptions, validation, and aria-describedby automatically.
 */
export function createInput(options: InputOptions = {}): Input {
  const isControlled = typeof options.value === "function"
  const internal = createSignal(options.defaultValue ?? "")

  const read = (): string => (isControlled ? (options.value as () => string)() : internal.get())

  const subscribers = new Set<(v: string) => void>()
  const value: Signal<string> = {
    get: read,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: string) => string)(read()) : next
      if (resolved === read()) return
      if (!isControlled) internal.set(resolved)
      options.onValueChange?.(resolved)
      for (const fn of subscribers) fn(resolved)
    },
    subscribe: (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
  }

  const focused = createSignal(false)
  const filled = createSignal(read() !== "")

  const isDisabled = (): boolean =>
    typeof options.disabled === "function" ? options.disabled() : (options.disabled ?? false)
  const isReadOnly = (): boolean =>
    typeof options.readOnly === "function" ? options.readOnly() : (options.readOnly ?? false)

  const getRootProps = (): InputProps => {
    const v = read()
    const props: InputProps = {
      type: options.type ?? "text",
      value: v,
    }
    if (options.name) props.name = options.name
    if (options.id) props.id = options.id
    if (options.placeholder) props.placeholder = options.placeholder
    if (options.required) props.required = true
    if (isDisabled()) {
      props.disabled = true
      props["data-disabled"] = ""
    }
    if (isReadOnly()) {
      props.readOnly = true
      props["data-readonly"] = ""
    }
    if (v !== "") props["data-filled"] = ""
    return props
  }

  const mount = (el: HTMLInputElement | HTMLTextAreaElement): Unsubscribe => {
    const applyAttrs = (): void => {
      const v = read()
      if (el.value !== v) el.value = v
      el.disabled = isDisabled()
      el.readOnly = isReadOnly()
      if (options.required) el.required = true
      if (options.name) el.name = options.name
      if (options.id) el.id = options.id
      if (options.placeholder) el.placeholder = options.placeholder
      if (isDisabled()) el.setAttribute("data-disabled", "")
      else el.removeAttribute("data-disabled")
      if (isReadOnly()) el.setAttribute("data-readonly", "")
      else el.removeAttribute("data-readonly")
      if (v !== "") el.setAttribute("data-filled", "")
      else el.removeAttribute("data-filled")
      filled.set(v !== "")
    }

    const offFocus = on(el, "focus", () => focused.set(true))
    const offBlur = on(el, "blur", () => focused.set(false))
    const offInput = on(el, "input", () => {
      value.set(el.value)
    })

    applyAttrs()
    const un = value.subscribe(applyAttrs)

    return () => {
      offFocus()
      offBlur()
      offInput()
      un()
    }
  }

  return {
    value,
    focused,
    filled,
    getRootProps,
    mount,
  }
}
