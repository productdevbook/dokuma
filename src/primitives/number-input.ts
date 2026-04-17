import { isBrowser } from "../_dom.ts"
import { createSignal, type Signal } from "../_signal.ts"

export interface NumberInputOptions {
  defaultValue?: number | null
  /** Controlled value getter. */
  value?: () => number | null
  onValueChange?: (value: number | null) => void
  /** Fires on blur and on step button release — i.e. when the user "commits" a value. */
  onValueCommit?: (value: number | null) => void
  min?: number
  max?: number
  /** Default `1`. */
  step?: number
  /** Decimal places. Inferred from `step` when omitted. */
  precision?: number
  /** Custom formatter for display. Default `String(n)`. */
  format?: (n: number) => string
  /** Custom parser. Default `Number(s)` with NaN → null. */
  parse?: (s: string) => number | null
  /** Default `false`. When true, mouse wheel over input increments/decrements. */
  allowMouseWheel?: boolean
  /** Default `true`. Out-of-range values are clamped to [min, max] on blur. */
  clampValueOnBlur?: boolean
  /** Optional name for hidden form input. */
  name?: string
  disabled?: () => boolean
  readOnly?: () => boolean
}

export interface NumberInputRootProps {
  role: "group"
  "data-disabled"?: ""
}

export interface NumberInputInputProps {
  type: "text"
  inputmode: "decimal"
  autocomplete: "off"
  role: "spinbutton"
  value: string
  "aria-valuenow"?: number
  "aria-valuemin"?: number
  "aria-valuemax"?: number
  "aria-valuetext"?: string
  "aria-disabled"?: boolean
  readOnly?: boolean
  onInput: (event: { currentTarget: { value: string } }) => void
  onKeyDown: (event: { key: string; preventDefault?: () => void }) => void
  onBlur: () => void
  onWheel?: (event: { deltaY: number; preventDefault?: () => void }) => void
}

export interface NumberInputStepProps {
  type: "button"
  "aria-label": string
  tabIndex: -1
  disabled: boolean
  onPointerDown: (event: { preventDefault?: () => void }) => void
  onPointerUp: () => void
  onPointerLeave: () => void
  onClick: (event?: { preventDefault?: () => void }) => void
}

export interface NumberInputHiddenInputProps {
  type: "hidden"
  name: string
  value: string
}

export interface NumberInput {
  value: Signal<number | null>
  inputValue: Signal<string>
  isDisabled: Signal<boolean>
  isReadOnly: Signal<boolean>
  increment: () => void
  decrement: () => void
  setValue: (n: number | null) => void
  getRootProps: () => NumberInputRootProps
  getInputProps: () => NumberInputInputProps
  getIncrementProps: () => NumberInputStepProps
  getDecrementProps: () => NumberInputStepProps
  getHiddenInputProps: () => NumberInputHiddenInputProps | null
}

const inferPrecision = (step: number): number => {
  const s = String(step)
  const i = s.indexOf(".")
  return i < 0 ? 0 : s.length - i - 1
}

const HOLD_INITIAL_DELAY = 500
const HOLD_INTERVAL = 50

export function createNumberInput(options: NumberInputOptions = {}): NumberInput {
  const step = options.step ?? 1
  const precision = options.precision ?? inferPrecision(step)
  const allowMouseWheel = options.allowMouseWheel ?? false
  const clampValueOnBlur = options.clampValueOnBlur ?? true
  const isControlled = typeof options.value === "function"

  const initialValue = options.defaultValue ?? null
  const internalValue = createSignal<number | null>(initialValue)
  const inputInternal = createSignal<string>(initialValue == null ? "" : formatValue(initialValue))

  const valueSubs = new Set<(v: number | null) => void>()
  const inputSubs = new Set<(v: string) => void>()
  const disabledSubs = new Set<(v: boolean) => void>()
  const readOnlySubs = new Set<(v: boolean) => void>()

  function formatValue(n: number): string {
    return options.format ? options.format(n) : n.toFixed(precision).replace(/\.?0+$/, "")
  }

  function parseValue(s: string): number | null {
    if (options.parse) return options.parse(s)
    const trimmed = s.trim()
    if (trimmed === "" || trimmed === "-") return null
    const n = Number(trimmed)
    return Number.isNaN(n) ? null : n
  }

  const round = (n: number): number => {
    const factor = 10 ** precision
    return Math.round(n * factor) / factor
  }

  const clamp = (n: number): number => {
    if (typeof options.min === "number" && n < options.min) return options.min
    if (typeof options.max === "number" && n > options.max) return options.max
    return n
  }

  const readValue = (): number | null =>
    isControlled ? (options.value as () => number | null)() : internalValue.get()

  const value: Signal<number | null> = {
    get: readValue,
    set: (next) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: number | null) => number | null)(readValue())
          : next
      const normalized = resolved == null ? null : round(clamp(resolved))
      if (normalized === readValue()) {
        // Still keep input string in sync if it diverged.
        const expected = normalized == null ? "" : formatValue(normalized)
        if (expected !== inputInternal.get()) {
          inputInternal.set(expected)
          for (const fn of inputSubs) fn(expected)
        }
        return
      }
      if (!isControlled) internalValue.set(normalized)
      const expected = normalized == null ? "" : formatValue(normalized)
      inputInternal.set(expected)
      options.onValueChange?.(normalized)
      for (const fn of valueSubs) fn(normalized)
      for (const fn of inputSubs) fn(expected)
    },
    subscribe: (fn) => {
      valueSubs.add(fn)
      return () => valueSubs.delete(fn)
    },
  }

  const inputValue: Signal<string> = {
    get: inputInternal.get,
    set: (next) => {
      const resolved =
        typeof next === "function" ? (next as (prev: string) => string)(inputInternal.get()) : next
      if (resolved === inputInternal.get()) return
      inputInternal.set(resolved)
      for (const fn of inputSubs) fn(resolved)
    },
    subscribe: (fn) => {
      inputSubs.add(fn)
      return () => inputSubs.delete(fn)
    },
  }

  const isDisabled: Signal<boolean> = {
    get: () => options.disabled?.() ?? false,
    set: () => {
      throw new Error("dokuma: number-input.isDisabled is read-only.")
    },
    subscribe: (fn) => {
      disabledSubs.add(fn)
      return () => disabledSubs.delete(fn)
    },
  }

  const isReadOnly: Signal<boolean> = {
    get: () => options.readOnly?.() ?? false,
    set: () => {
      throw new Error("dokuma: number-input.isReadOnly is read-only.")
    },
    subscribe: (fn) => {
      readOnlySubs.add(fn)
      return () => readOnlySubs.delete(fn)
    },
  }

  const setValue = (n: number | null): void => value.set(n)

  const increment = (): void => {
    if (isDisabled.get() || isReadOnly.get()) return
    const current = readValue() ?? options.min ?? 0
    value.set(current + step)
  }

  const decrement = (): void => {
    if (isDisabled.get() || isReadOnly.get()) return
    const current = readValue() ?? options.min ?? 0
    value.set(current - step)
  }

  const handleInput = (event: { currentTarget: { value: string } }): void => {
    if (isReadOnly.get()) return
    const raw = event.currentTarget.value
    inputValue.set(raw)
    const parsed = parseValue(raw)
    // Update value silently without re-formatting input — let user keep typing.
    if (parsed !== readValue()) {
      const normalized = parsed == null ? null : round(parsed)
      if (!isControlled) internalValue.set(normalized)
      options.onValueChange?.(normalized)
      for (const fn of valueSubs) fn(normalized)
    }
  }

  const handleKeyDown = (event: { key: string; preventDefault?: () => void }): void => {
    if (isDisabled.get() || isReadOnly.get()) return
    if (event.key === "ArrowUp") {
      event.preventDefault?.()
      increment()
    } else if (event.key === "ArrowDown") {
      event.preventDefault?.()
      decrement()
    } else if (event.key === "Home" && typeof options.min === "number") {
      event.preventDefault?.()
      value.set(options.min)
    } else if (event.key === "End" && typeof options.max === "number") {
      event.preventDefault?.()
      value.set(options.max)
    } else if (event.key === "Enter") {
      const v = readValue()
      options.onValueCommit?.(v)
    }
  }

  const handleBlur = (): void => {
    if (isReadOnly.get()) return
    const current = readValue()
    if (current != null && clampValueOnBlur) {
      const clamped = round(clamp(current))
      if (clamped !== current) value.set(clamped)
    }
    // Re-format input to canonical representation.
    const expected = current == null ? "" : formatValue(current)
    if (expected !== inputInternal.get()) {
      inputInternal.set(expected)
      for (const fn of inputSubs) fn(expected)
    }
    options.onValueCommit?.(readValue())
  }

  const handleWheel = (event: { deltaY: number; preventDefault?: () => void }): void => {
    if (!allowMouseWheel || isDisabled.get() || isReadOnly.get()) return
    event.preventDefault?.()
    if (event.deltaY < 0) increment()
    else decrement()
  }

  // --- step buttons with hold-to-repeat -----------------------------------

  let holdTimer: ReturnType<typeof setTimeout> | null = null
  let holdInterval: ReturnType<typeof setInterval> | null = null

  const startHold = (action: () => void): void => {
    if (!isBrowser()) return
    action()
    holdTimer = setTimeout(() => {
      holdInterval = setInterval(action, HOLD_INTERVAL)
    }, HOLD_INITIAL_DELAY)
  }

  const stopHold = (): void => {
    if (holdTimer) {
      clearTimeout(holdTimer)
      holdTimer = null
    }
    if (holdInterval) {
      clearInterval(holdInterval)
      holdInterval = null
    }
    options.onValueCommit?.(readValue())
  }

  const getRootProps = (): NumberInputRootProps => {
    const props: NumberInputRootProps = { role: "group" }
    if (isDisabled.get()) props["data-disabled"] = ""
    return props
  }

  const getInputProps = (): NumberInputInputProps => {
    const v = readValue()
    const text = inputInternal.get()
    const props: NumberInputInputProps = {
      type: "text",
      inputmode: "decimal",
      autocomplete: "off",
      role: "spinbutton",
      value: text,
      onInput: handleInput,
      onKeyDown: handleKeyDown,
      onBlur: handleBlur,
    }
    if (v != null) {
      props["aria-valuenow"] = v
      props["aria-valuetext"] = text
    }
    if (typeof options.min === "number") props["aria-valuemin"] = options.min
    if (typeof options.max === "number") props["aria-valuemax"] = options.max
    if (isDisabled.get()) props["aria-disabled"] = true
    if (isReadOnly.get()) props.readOnly = true
    if (allowMouseWheel) props.onWheel = handleWheel
    return props
  }

  const stepDisabledUp = (): boolean => {
    if (isDisabled.get() || isReadOnly.get()) return true
    const v = readValue()
    return v != null && typeof options.max === "number" && v >= options.max
  }
  const stepDisabledDown = (): boolean => {
    if (isDisabled.get() || isReadOnly.get()) return true
    const v = readValue()
    return v != null && typeof options.min === "number" && v <= options.min
  }

  const getIncrementProps = (): NumberInputStepProps => ({
    type: "button",
    "aria-label": "Increment",
    tabIndex: -1,
    disabled: stepDisabledUp(),
    onPointerDown: (event) => {
      event.preventDefault?.()
      startHold(increment)
    },
    onPointerUp: stopHold,
    onPointerLeave: stopHold,
    onClick: (event) => {
      event?.preventDefault?.()
    },
  })

  const getDecrementProps = (): NumberInputStepProps => ({
    type: "button",
    "aria-label": "Decrement",
    tabIndex: -1,
    disabled: stepDisabledDown(),
    onPointerDown: (event) => {
      event.preventDefault?.()
      startHold(decrement)
    },
    onPointerUp: stopHold,
    onPointerLeave: stopHold,
    onClick: (event) => {
      event?.preventDefault?.()
    },
  })

  const getHiddenInputProps = (): NumberInputHiddenInputProps | null => {
    if (!options.name) return null
    const v = readValue()
    return {
      type: "hidden",
      name: options.name,
      value: v == null ? "" : String(v),
    }
  }

  return {
    value,
    inputValue,
    isDisabled,
    isReadOnly,
    increment,
    decrement,
    setValue,
    getRootProps,
    getInputProps,
    getIncrementProps,
    getDecrementProps,
    getHiddenInputProps,
  }
}
