import { on } from "../_dom.ts"
import { createId } from "../_id.ts"
import { createSignal, type Signal, type Unsubscribe } from "../_signal.ts"

export interface RadioOptions {
  /** The value this radio represents. */
  value: string
  /** Whether this radio is checked. Function for controlled mode. */
  checked?: boolean | (() => boolean)
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean | (() => boolean)
  required?: boolean
  /** Form field name (for the hidden input). */
  name?: string
  /** Optional id override. */
  id?: string
}

export interface RadioRootProps {
  type: "button"
  role: "radio"
  id: string
  "aria-checked": "true" | "false"
  "aria-disabled"?: boolean
  "aria-required"?: boolean
  "data-state": "checked" | "unchecked"
  "data-disabled"?: ""
  "data-value": string
  tabIndex: 0 | -1
  disabled?: boolean
}

export interface RadioIndicatorProps {
  "data-state": "checked" | "unchecked"
}

export interface RadioHiddenInputProps {
  type: "radio"
  name: string
  value: string
  checked: boolean
  required?: boolean
  disabled?: boolean
  tabIndex: -1
  "aria-hidden": true
  style: { position: "absolute"; opacity: 0; pointerEvents: "none"; margin: 0 }
}

export interface Radio {
  id: string
  value: string
  checked: Signal<boolean>
  disabled: Signal<boolean>
  setChecked: (next: boolean) => void
  toggle: () => void
  getRootProps: () => RadioRootProps
  getIndicatorProps: () => RadioIndicatorProps
  getHiddenInputProps: () => RadioHiddenInputProps | null
  /** Imperative DOM wiring. Returns cleanup. */
  mount: (el: HTMLElement) => Unsubscribe
}

/**
 * Standalone radio button behavior. Use when RadioGroup's single-value
 * registry is the wrong shape — e.g. radios spread across sections where the
 * parent component owns selection externally.
 *
 * For the common case of a single-value group, prefer `createRadioGroup`.
 */
export function createRadio(options: RadioOptions): Radio {
  const id = options.id ?? createId("radio")

  const isControlled = typeof options.checked === "function"
  const internal = createSignal(typeof options.checked === "boolean" ? options.checked : false)

  const read = (): boolean => (isControlled ? (options.checked as () => boolean)() : internal.get())

  const subs = new Set<(v: boolean) => void>()
  const checked: Signal<boolean> = {
    get: read,
    set: (next) => {
      const resolved = typeof next === "function" ? (next as (p: boolean) => boolean)(read()) : next
      if (resolved === read()) return
      if (!isControlled) internal.set(resolved)
      options.onCheckedChange?.(resolved)
      for (const fn of subs) fn(resolved)
    },
    subscribe: (fn) => {
      subs.add(fn)
      return () => subs.delete(fn)
    },
  }

  const isDisabledFn = typeof options.disabled === "function"
  const disabledSignal = createSignal(
    typeof options.disabled === "boolean" ? options.disabled : false,
  )
  const readDisabled = (): boolean =>
    isDisabledFn ? (options.disabled as () => boolean)() : disabledSignal.get()

  const setChecked = (next: boolean): void => {
    if (readDisabled()) return
    checked.set(next)
  }
  const toggle = (): void => setChecked(!read())

  const getRootProps = (): RadioRootProps => {
    const c = read()
    const d = readDisabled()
    const props: RadioRootProps = {
      type: "button",
      role: "radio",
      id,
      "aria-checked": c ? "true" : "false",
      "data-state": c ? "checked" : "unchecked",
      "data-value": options.value,
      tabIndex: d ? -1 : c ? 0 : -1,
    }
    if (options.required) props["aria-required"] = true
    if (d) {
      props["aria-disabled"] = true
      props["data-disabled"] = ""
      props.disabled = true
    }
    return props
  }

  const getIndicatorProps = (): RadioIndicatorProps => ({
    "data-state": read() ? "checked" : "unchecked",
  })

  const getHiddenInputProps = (): RadioHiddenInputProps | null => {
    if (!options.name) return null
    const props: RadioHiddenInputProps = {
      type: "radio",
      name: options.name,
      value: options.value,
      checked: read(),
      tabIndex: -1,
      "aria-hidden": true,
      style: { position: "absolute", opacity: 0, pointerEvents: "none", margin: 0 },
    }
    if (options.required) props.required = true
    if (readDisabled()) props.disabled = true
    return props
  }

  const mount = (el: HTMLElement): Unsubscribe => {
    el.id ||= id

    const applyAttrs = (): void => {
      const c = read()
      const d = readDisabled()
      el.setAttribute("role", "radio")
      el.setAttribute("aria-checked", c ? "true" : "false")
      el.setAttribute("data-state", c ? "checked" : "unchecked")
      el.setAttribute("data-value", options.value)
      el.tabIndex = d ? -1 : c ? 0 : -1
      if (d) {
        el.setAttribute("aria-disabled", "true")
        el.setAttribute("data-disabled", "")
        ;(el as HTMLButtonElement).disabled = true
      } else {
        el.removeAttribute("aria-disabled")
        el.removeAttribute("data-disabled")
        ;(el as HTMLButtonElement).disabled = false
      }
    }

    const offClick = on(el, "click", (event) => {
      if (readDisabled()) {
        event.preventDefault()
        return
      }
      setChecked(true)
    })

    const offKeyDown = on(el, "keydown", (event) => {
      if (readDisabled()) return
      const ke = event as KeyboardEvent
      if (ke.key === " " || ke.key === "Enter") {
        ke.preventDefault()
        setChecked(true)
      }
    })

    applyAttrs()
    const un = checked.subscribe(applyAttrs)
    const un2 = isDisabledFn ? () => {} : disabledSignal.subscribe(applyAttrs)

    return () => {
      offClick()
      offKeyDown()
      un()
      un2()
    }
  }

  return {
    id,
    value: options.value,
    checked,
    disabled: disabledSignal,
    setChecked,
    toggle,
    getRootProps,
    getIndicatorProps,
    getHiddenInputProps,
    mount,
  }
}
